from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import CalendarSync, GoogleCalendarToken, CalendarTask, CalendarEvent, OutlookCalendarToken
from .forms import CalendarSyncForm
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponseRedirect, HttpResponse
import urllib.parse
from django.utils import timezone
import requests
from django.contrib.auth import get_user_model
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from tasks.models import Task
import json
import msal
from events.models import Event
# Create your views here.

User = get_user_model()

@login_required
def calendar_sync_list(request):
    syncs = CalendarSync.objects.filter(user=request.user)
    return render(request, 'calendarsync/sync_list.html', {'syncs': syncs})

@login_required
def calendar_sync_create(request):
    if request.method == 'POST':
        form = CalendarSyncForm(user=request.user, data=request.POST)
        if form.is_valid():
            sync = form.save(commit=False)
            sync.user = request.user
            sync.save()
            messages.success(request, 'Calendar sync created successfully!')
            return redirect('calendarsync:sync_list')
    else:
        form = CalendarSyncForm(user=request.user)
    return render(request, 'calendarsync/sync_form.html', {'form': form, 'action': 'Create'})

@login_required
def calendar_sync_update(request, pk):
    sync = get_object_or_404(CalendarSync, pk=pk, user=request.user)
    if request.method == 'POST':
        form = CalendarSyncForm(user=request.user, data=request.POST, instance=sync)
        if form.is_valid():
            form.save()
            messages.success(request, 'Calendar sync updated successfully!')
            return redirect('calendarsync:sync_list')
    else:
        form = CalendarSyncForm(user=request.user, instance=sync)
    return render(request, 'calendarsync/sync_form.html', {'form': form, 'action': 'Update'})

@login_required
def calendar_sync_delete(request, pk):
    sync = get_object_or_404(CalendarSync, pk=pk, user=request.user)
    if request.method == 'POST':
        sync.delete()
        messages.success(request, 'Calendar sync deleted successfully!')
        return redirect('calendarsync:sync_list')
    return render(request, 'calendarsync/sync_confirm_delete.html', {'sync': sync})

@login_required
def sync_now(request, pk):
    sync = get_object_or_404(CalendarSync, pk=pk, user=request.user)
    try:
        # Update sync status to syncing
        sync.sync_status = 'syncing'
        sync.save()

        # Perform sync operations
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('calendar', 'v3', credentials=creds)
        
        # Update sync status to synced
        sync.sync_status = 'synced'
        sync.sync_error = None
        sync.save()
        
        messages.success(request, 'Calendar sync completed successfully!')
        return JsonResponse({
            'status': 'success',
            'message': 'Calendar sync completed successfully!',
            'sync_status': sync.sync_status
        })
    except Exception as e:
        # Update sync status to error
        sync.sync_status = 'error'
        sync.sync_error = str(e)
        sync.save()
        messages.error(request, f'Calendar sync failed: {str(e)}')
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'sync_status': sync.sync_status
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_sync_status(request):
    """Update the sync status for a calendar"""
    try:
        sync_id = request.data.get('sync_id')
        new_status = request.data.get('status')
        
        if not sync_id or not new_status:
            return Response({'error': 'sync_id and status are required'}, status=400)
            
        sync = get_object_or_404(CalendarSync, pk=sync_id, user=request.user)
        sync.sync_status = new_status
        sync.save()
        
        return Response({
            'status': 'success',
            'message': 'Sync status updated successfully',
            'sync_status': sync.sync_status
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_sync_status(request):
    """Check the sync status for a user's calendars"""
    try:
        syncs = CalendarSync.objects.filter(user=request.user)
        sync_status = [{
            'id': sync.id,
            'calendar_name': sync.calendar_name,
            'provider': sync.provider,
            'status': sync.sync_status,
            'last_synced': sync.last_synced,
            'error': sync.sync_error,
            'is_syncing': sync.sync_status == 'syncing'
        } for sync in syncs]
        
        return Response({
            'sync_status': sync_status,
            'has_active_sync': any(sync['is_syncing'] for sync in sync_status)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# === GOOGLE CALENDAR OAUTH & SYNC API ENDPOINTS ===

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_google_connection(request):
    """Check if user is connected to Google Calendar"""
    try:
        token = GoogleCalendarToken.objects.get(user=request.user)
        # Check if token is expired
        if token.token_expiry <= timezone.now():
            return Response({
                'connected': False,
                'message': 'Token expired'
            })
        return Response({
            'connected': True,
            'message': 'Connected to Google Calendar'
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({
            'connected': False,
            'message': 'Not connected to Google Calendar'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def google_start(request):
    """Start Google OAuth flow"""
    try:
        # Check if user already has a valid token
        token = GoogleCalendarToken.objects.get(user=request.user)
        if token.token_expiry > timezone.now():
            return Response({
                'status': 'already_connected',
                'message': 'Already connected to Google Calendar'
            })
    except GoogleCalendarToken.DoesNotExist:
        pass

    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/tasks'
    state = str(request.user.id)
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': scope,
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state,
    }
    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)
    return Response({
        'status': 'needs_auth',
        'auth_url': url
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    if not code:
        return Response({'error': 'No code provided'}, status=400)

    # Exchange code for tokens
    data = {
        'code': code,
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code',
    }
    token_url = 'https://oauth2.googleapis.com/token'
    r = requests.post(token_url, data=data)
    if r.status_code != 200:
        return Response({'error': 'Failed to get token', 'details': r.json()}, status=400)
    token_data = r.json()

    # Save tokens to DB
    user = User.objects.get(id=state)
    GoogleCalendarToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token', ''),
            'token_expiry': timezone.now() + timezone.timedelta(seconds=token_data['expires_in']),
        }
    )
    
    return redirect('http://localhost:3000/')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def google_sync(request):
    """Return all Google events from the database for the user"""
    try:
        events = CalendarEvent.objects.filter(user=request.user, external_provider='google')
        serialized = [
            {
                'id': event.id,
                'external_id': event.external_id,
                'summary': event.title,
                'description': event.description,
                'start': {'dateTime': event.start_time.isoformat() if event.start_time else None},
                'end': {'dateTime': event.end_time.isoformat() if event.end_time else None},
            }
            for event in events if event.start_time and event.end_time
        ]
        tasks = CalendarTask.objects.filter(user=request.user, external_provider='google_tasks')
            
        serialized_tasks = [
            {
                'id': task.id,
                'external_id': task.external_id,
                'title': task.title,  # Changed from summary to title to match model
                'description': task.description,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'status': task.status,
                'created_at': task.created_at.isoformat() if task.created_at else None,
                'updated_at': task.updated_at.isoformat() if task.updated_at else None
            }
            for task in tasks
        ]
        
        response_data = {'events': serialized, 'tasks': serialized_tasks}
        return Response(response_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_tasks(request):
    """Push local tasks to Google Tasks API"""
    try:
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('tasks', 'v1', credentials=creds)
        
        # Get the first tasklist (usually 'Tasks')
        tasklists = service.tasklists().list().execute().get('items', [])
        if not tasklists:
            return Response({'error': 'No Google Tasklists found'}, status=400)
        tasklist_id = tasklists[0]['id']
        
        # Only push local tasks (not CalendarTask)
        local_tasks = Task.objects.filter(user=request.user).filter(linked_to='none')
        synced_tasks = []
        for task in local_tasks:
            gtask = {
                'title': task.task_name,
                'notes': task.description,
                'due': task.due_date.isoformat() if hasattr(task, 'due_date') and task.due_date else (task.end_time.isoformat() if hasattr(task, 'end_time') and task.end_time else None),
            }
            try:
                if task.external_id:
                    # try:
                        updated_task = service.tasks().update(
                            tasklist=tasklist_id,
                            task=task.external_id,
                            body=gtask
                        ).execute()
                    # except Exception as e:
                    #     if 'Missing task ID' in str(e):
                    #         task.external_id = None
                    #         task.external_provider = None
                    #         task.save()
                    #         print(f"Cleared external_id for task {task.task_name} due to missing Google Task.")
                    #     else:
                    #         print(f"Error creating/updating task {task.task_name}: {str(e)}")
                    #     continue
                else:
                    # Create new task
                    created_task = service.tasks().insert(
                        tasklist=tasklist_id,
                        body=gtask
                    ).execute()
                    task.external_id = created_task['id']
                    task.linked_to = 'google'
                    task.save()
                    print(f"Created task {task.task_name} with external id {task.external_id}")
                task.save()
                synced_tasks.append(task)
            except Exception as e:
                print(f"Error creating/updating task {task.task_name}: {str(e)}")
                continue
                
        return Response({
            'message': f'Successfully pushed {len(synced_tasks)} tasks to Google Tasks',
            'tasks': [{'id': task.id, 'title': task.title} for task in synced_tasks]
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'Google account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pull_tasks(request):
    """Pull tasks from Google Calendar"""
    try:
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('calendar', 'v3', credentials=creds)
        
        # Get events from Google Calendar
        now = datetime.utcnow().isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        synced_tasks = []
        
        for event in events:
            # Check if task already exists
            task, created = CalendarTask.objects.get_or_create(
                user=request.user,
                external_id=event['id'],
                external_provider='google',
                defaults={
                    'title': event['summary'],
                    'description': event.get('description', ''),
                    'due_date': datetime.fromisoformat(event['start'].get('dateTime', event['start'].get('date'))),
                    'status': 'pending'
                }
            )
            
            if not created:
                # Update existing task
                task.title = event['summary']
                task.description = event.get('description', '')
                task.due_date = datetime.fromisoformat(event['start'].get('dateTime', event['start'].get('date')))
                task.save()
            
            synced_tasks.append(task)
            
        return Response({
            'message': f'Successfully pulled {len(synced_tasks)} tasks from Google Calendar',
            'tasks': [{'id': task.id, 'title': task.title} for task in synced_tasks]
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'Google account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_events(request):
    """Push local events to Google Calendar"""
    try:
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('calendar', 'v3', credentials=creds)
        
        # Only push local events (not Task)
        local_events = Event.objects.filter(user=request.user).filter(external_provider__isnull=True)
        synced_events = []
        for event in local_events:
            start_time = event.start_time.strftime('%Y-%m-%dT%H:%M:%S%z')
            end_time = event.end_time.strftime('%Y-%m-%dT%H:%M:%S%z')
            calendar_event = {
                'summary': event.title,
                'description': '',
                'start': {
                    'dateTime': start_time,
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': 'UTC',
                },
                'location': event.location or '',
                'reminders': {
                    'useDefault': True
                }
            }
            try:
                if event.external_id:
                    created_event = service.events().update(
                        calendarId='primary',
                        eventId=event.external_id,
                        body=calendar_event,
                        sendUpdates='all'
                    ).execute()
                else:
                    created_event = service.events().insert(
                        calendarId='primary',
                        body=calendar_event,
                        sendUpdates='all'
                    ).execute()
                    event.external_id = created_event['id']
                    event.external_provider = 'google'
                event.save()
                synced_events.append(event)
            except Exception as e:
                print(f"Error creating/updating event {event.title}: {str(e)}")
                continue
            
        return Response({
            'message': f'Successfully pushed {len(synced_events)} events to Google Calendar',
            'events': [{'id': event.id, 'title': event.title} for event in synced_events]
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'Google account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pull_events(request):
    """Pull events from Google Calendar"""
    try:
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('calendar', 'v3', credentials=creds)
        
        # Get events from Google Calendar - removed timeMin to get all events
        events_result = service.events().list(
            calendarId='primary',
            maxResults=2500,  # Increased max results
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        synced_events = []
        
        for google_event in events:
            start_time = datetime.fromisoformat(google_event['start'].get('dateTime', google_event['start'].get('date')))
            end_time = datetime.fromisoformat(google_event['end'].get('dateTime', google_event['end'].get('date')))
            
            # First check if this is a local event that was pushed to Google
            local_event = Event.objects.filter(
                user=request.user,
                external_id=google_event['id']
            ).first()
            
            if local_event:
                # Update the existing local event
                local_event.title = google_event['summary']
                local_event.start_time = start_time
                local_event.end_time = end_time
                local_event.description = google_event.get('description', '')
                local_event.location = google_event.get('location', '')
                local_event.save()
                synced_events.append(local_event)
            else:
                # Create a new CalendarEvent for external events
                event, created = CalendarEvent.objects.update_or_create(
                    user=request.user,
                    external_id=google_event['id'],
                    defaults={
                        'title': google_event['summary'],
                        'start_time': start_time,
                        'end_time': end_time,
                        'location': google_event.get('location', ''),
                        'external_provider': 'google',
                    }
                )
                synced_events.append(event)
            
        return Response({
            'message': f'Successfully pulled {len(synced_events)} events from Google Calendar',
            'events': [{'id': event.id, 'title': event.title} for event in synced_events]
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'Google account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def google_disconnect(request):
    """Disconnect from Google Calendar by removing the token"""
    try:
        # Delete the Google Calendar token
        GoogleCalendarToken.objects.filter(user=request.user).delete()
        
        # Update any existing calendar syncs to reflect disconnection
        CalendarSync.objects.filter(
            user=request.user,
            provider='google'
        ).update(
            sync_status='not_synced',
            sync_error='Disconnected from Google Calendar'
        )
        
        return Response({
            'status': 'success',
            'message': 'Successfully disconnected from Google Calendar'
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pull_google_tasks(request):
    """Pull tasks from Google Tasks API and store in CalendarTask"""
    try:
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('tasks', 'v1', credentials=creds)
        tasklists = service.tasklists().list().execute().get('items', [])
        all_tasks = []
        for tasklist in tasklists:
            # Get all tasks including completed ones
            tasks = service.tasks().list(
                tasklist=tasklist['id'],
                showCompleted=True,  # Include completed tasks
                showHidden=True      # Include hidden tasks
            ).execute().get('items', [])
            
            for gtask in tasks:
                if gtask.get('status') == 'completed':
                    status = 'completed'
                else:
                    status = 'pending'
                    
                # Convert due date to datetime if it exists
                due_date = None
                if gtask.get('due'):
                    try:
                        due_date = datetime.fromisoformat(gtask['due'].replace('Z', '+00:00'))
                    except ValueError:
                        due_date = datetime.strptime(gtask['due'], '%Y-%m-%dT%H:%M:%S.%fZ')
                
                # First check if this is a local task that was pushed to Google
                local_task = Task.objects.filter(
                    user=request.user,
                    external_id=gtask['id']
                ).first()
                
                if local_task:
                    # Update the existing local task
                    local_task.task_name = gtask.get('title', '')
                    local_task.description = gtask.get('notes', '')
                    local_task.end_time = due_date
                    local_task.status = status
                    local_task.save()
                    all_tasks.append(local_task)
                else:
                    # Create a new CalendarTask for external tasks
                    task, created = CalendarTask.objects.update_or_create(
                        user=request.user,
                        external_id=gtask['id'],
                        external_provider='google_tasks',
                        defaults={
                            'title': gtask.get('title', ''),
                            'description': gtask.get('notes', ''),
                            'due_date': due_date,
                            'status': status,
                            'created_at': datetime.fromisoformat(gtask.get('updated', datetime.now().isoformat()).replace('Z', '+00:00'))
                        }
                    )
                    all_tasks.append(task)
                
        return Response({
            'message': f'Successfully pulled {len(all_tasks)} Google Tasks',
            'tasks': [{'id': t.id, 'title': t.title or t.task_name} for t in all_tasks]
        })
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'Google account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_google_tasks(request):
    """Push local tasks to Google Tasks API"""
    try:
        token_obj = GoogleCalendarToken.objects.get(user=request.user)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        service = build('tasks', 'v1', credentials=creds)
        # Use the first tasklist (usually 'Tasks')
        tasklists = service.tasklists().list().execute().get('items', [])
        if not tasklists:
            return Response({'error': 'No Google Tasklists found'}, status=400)
        tasklist_id = tasklists[0]['id']
        tasks = CalendarTask.objects.filter(user=request.user, external_id__isnull=True)
        pushed = []
        for task in tasks:
            gtask = {
                'title': task.title,
                'notes': task.description,
                'due': task.due_date.isoformat() if task.due_date else None,
            }
            created = service.tasks().insert(tasklist=tasklist_id, body=gtask).execute()
            task.external_id = created['id']
            task.external_provider = 'google_tasks'
            task.save()
            pushed.append(task)
        return Response({'message': f'Successfully pushed {len(pushed)} tasks to Google Tasks', 'tasks': [{'id': t.id, 'title': t.title} for t in pushed]})
    except GoogleCalendarToken.DoesNotExist:
        return Response({'error': 'Google account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# === OUTLOOK CALENDAR OAUTH & SYNC API ENDPOINTS ===

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_outlook_connection(request):
    """Check if user is connected to Outlook Calendar"""
    try:
        token = OutlookCalendarToken.objects.get(user=request.user)
        # Check if token is expired
        if token.token_expiry <= timezone.now():
            return Response({
                'connected': False,
                'message': 'Token expired'
            })
        return Response({
            'connected': True,
            'message': 'Connected to Outlook Calendar'
        })
    except OutlookCalendarToken.DoesNotExist:
        return Response({
            'connected': False,
            'message': 'Not connected to Outlook Calendar'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def outlook_start(request):
    """Start Outlook OAuth flow"""
    try:
        # Check if user already has a valid token
        token = OutlookCalendarToken.objects.get(user=request.user)
        if token.token_expiry > timezone.now():
            return Response({
                'status': 'already_connected',
                'message': 'Already connected to Outlook Calendar'
            })
    except OutlookCalendarToken.DoesNotExist:
        pass

    client_id = settings.OUTLOOK_CLIENT_ID
    redirect_uri = settings.OUTLOOK_REDIRECT_URI
    scopes = ['https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/Tasks.ReadWrite']
    state = str(request.user.id)
    
    # Use ConfidentialClientApplication for web apps (with client secret)
    app = msal.ConfidentialClientApplication(
        client_id,
        authority="https://login.microsoftonline.com/common",
        client_credential=settings.OUTLOOK_CLIENT_SECRET
    )
    
    # Generate auth URL
    auth_url = app.get_authorization_request_url(
        scopes=scopes,
        state=state,
        redirect_uri=redirect_uri,
        prompt="select_account"
    )
    
    return Response({
        'status': 'needs_auth',
        'auth_url': auth_url
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def outlook_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    if not code:
        return Response({'error': 'No code provided'}, status=400)

    # Use ConfidentialClientApplication for web apps (with client secret)
    app = msal.ConfidentialClientApplication(
        settings.OUTLOOK_CLIENT_ID,
        authority="https://login.microsoftonline.com/common",
        client_credential=settings.OUTLOOK_CLIENT_SECRET
    )
    
    token_response = app.acquire_token_by_authorization_code(
        code,
        scopes=['https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/Tasks.ReadWrite'],
        redirect_uri=settings.OUTLOOK_REDIRECT_URI
    )
    
    if 'error' in token_response:
        return Response({'error': 'Failed to get token', 'details': token_response}, status=400)

    # Save tokens to DB
    user = User.objects.get(id=state)
    OutlookCalendarToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': token_response['access_token'],
            'refresh_token': token_response.get('refresh_token', ''),
            'token_expiry': timezone.now() + timezone.timedelta(seconds=token_response['expires_in']),
        }
    )
    
    return redirect('http://localhost:3000/')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def outlook_sync(request):
    """Sync with Outlook Calendar - both pull and push"""
    try:
        # First push local events and tasks to Outlook
        token_obj = OutlookCalendarToken.objects.get(user=request.user)
        headers = {
            'Authorization': f'Bearer {token_obj.access_token}',
            'Content-Type': 'application/json'
        }

        # Push local events to Outlook
        local_events = Event.objects.filter(user=request.user, external_id__isnull=True)
        pushed_events = []
        for event in local_events:
            try:
                # Format dates in RFC3339 format with timezone
                start_time = event.start_time.strftime('%Y-%m-%dT%H:%M:%S%z')
                end_time = event.end_time.strftime('%Y-%m-%dT%H:%M:%S%z')
                
                body = {
                    "subject": event.title,
                    "body": {
                        "contentType": "HTML",
                        "content": event.description or ""
                    },
                    "start": {
                        "dateTime": start_time,
                        "timeZone": "UTC"
                    },
                    "end": {
                        "dateTime": end_time,
                        "timeZone": "UTC"
                    }
                }
                print(f"[Outlook Sync] Pushing event: {event.title}")
                response = requests.post(
                    'https://graph.microsoft.com/v1.0/me/events',
                    headers=headers,
                    json=body
                )
                if response.status_code in (200, 201):
                    data = response.json()
                    event.external_id = data['id']
                    event.external_provider = 'outlook_event'
                    event.save()
                    pushed_events.append(event)
                else:
                    print(f"[Outlook Sync] Failed to push event: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[Outlook Sync] Error pushing event {event.title}: {str(e)}")
                continue

        # Push local tasks to Outlook
        local_tasks = CalendarTask.objects.filter(user=request.user, external_id__isnull=True)
        pushed_tasks = []
        
        try:
            # Get task list ID
            print("[Outlook Sync] Fetching task lists")
            lists_response = requests.get(
                'https://graph.microsoft.com/v1.0/me/todo/lists',
                headers=headers
            )
            if lists_response.status_code == 200:
                task_lists = lists_response.json().get('value', [])
                if task_lists:
                    tasklist_id = task_lists[0]['id']
                    for task in local_tasks:
                        try:
                            body = {
                                "title": task.title,
                                "body": {
                                    "content": task.description or "",
                                    "contentType": "text"
                                }
                            }
                            if task.due_date:
                                due_time = task.due_date.strftime('%Y-%m-%dT%H:%M:%S%z')
                                body["dueDateTime"] = {
                                    "dateTime": due_time,
                                    "timeZone": "UTC"
                                }
                            print(f"[Outlook Sync] Pushing task: {task.title}")
                            response = requests.post(
                                f'https://graph.microsoft.com/v1.0/me/todo/lists/{tasklist_id}/tasks',
                                headers=headers,
                                json=body
                            )
                            if response.status_code in (200, 201):
                                data = response.json()
                                task.external_id = data['id']
                                task.external_provider = 'outlook_tasks'
                                task.save()
                                pushed_tasks.append(task)
                            else:
                                print(f"[Outlook Sync] Failed to push task: {response.status_code} - {response.text}")
                        except Exception as e:
                            print(f"[Outlook Sync] Error pushing task {task.title}: {str(e)}")
                            continue
                else:
                    print("[Outlook Sync] No task lists found")
            else:
                print(f"[Outlook Sync] Failed to fetch task lists: {lists_response.status_code} - {lists_response.text}")
        except Exception as e:
            print(f"[Outlook Sync] Error in task sync: {str(e)}")

        # Now pull events and tasks from Outlook
        try:
            print("[Outlook Sync] Pulling events and tasks")
            events = CalendarEvent.objects.filter(user=request.user, external_provider='outlook')
            serialized_events = [
                {
                    'id': event.id,
                    'external_id': event.external_id,
                    'summary': event.title,
                    'description': event.description,
                    'start': {'dateTime': event.start_time.isoformat() if event.start_time else None},
                    'end': {'dateTime': event.end_time.isoformat() if event.end_time else None},
                }
                for event in events if event.start_time and event.end_time
            ]
            
            tasks = CalendarTask.objects.filter(user=request.user, external_provider='outlook_tasks')
            serialized_tasks = [
                {
                    'id': task.id,
                    'external_id': task.external_id,
                    'title': task.title,
                    'description': task.description,
                    'due_date': task.due_date.isoformat() if task.due_date else None,
                    'status': task.status,
                    'created_at': task.created_at.isoformat() if task.created_at else None,
                    'updated_at': task.updated_at.isoformat() if task.updated_at else None
                }
                for task in tasks
            ]
            
            return Response({
                'message': f'Successfully synced with Outlook. Pushed {len(pushed_events)} events and {len(pushed_tasks)} tasks.',
                'events': serialized_events,
                'tasks': serialized_tasks
            })
        except Exception as e:
            print(f"[Outlook Sync] Error in pull sync: {str(e)}")
            raise
    except OutlookCalendarToken.DoesNotExist:
        print("[Outlook Sync] No Outlook token found")
        return Response({'error': 'Outlook account not connected'}, status=400)
    except Exception as e:
        print(f"[Outlook Sync] Unexpected error: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pull_outlook_events(request):
    """Pull events from Outlook Calendar"""
    try:
        token_obj = OutlookCalendarToken.objects.get(user=request.user)
        
        # Get events from Outlook Calendar
        headers = {
            'Authorization': f'Bearer {token_obj.access_token}',
            'Content-Type': 'application/json'
        }
        
        # Get events from the last year to next year
        start_date = (datetime.now() - timedelta(days=365)).isoformat() + 'Z'
        end_date = (datetime.now() + timedelta(days=365)).isoformat() + 'Z'
        
        response = requests.get(
            f'https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={start_date}&endDateTime={end_date}',
            headers=headers
        )
        
        if response.status_code != 200:
            return Response({'error': 'Failed to fetch Outlook events'}, status=response.status_code)
            
        events = response.json().get('value', [])
        synced_events = []
        
        for event in events:
            calendar_event, created = CalendarEvent.objects.update_or_create(
                user=request.user,
                external_id=event['id'],
                external_provider='outlook',
                defaults={
                    'title': event['subject'],
                    'description': event.get('bodyPreview', ''),
                    'start_time': datetime.fromisoformat(event['start']['dateTime'].replace('Z', '+00:00')),
                    'end_time': datetime.fromisoformat(event['end']['dateTime'].replace('Z', '+00:00')),
                    'location': event.get('location', {}).get('displayName', '')
                }
            )
            synced_events.append(calendar_event)
            
        return Response({
            'message': f'Successfully pulled {len(synced_events)} events from Outlook Calendar',
            'events': [{'id': event.id, 'title': event.title} for event in synced_events]
        })
    except OutlookCalendarToken.DoesNotExist:
        return Response({'error': 'Outlook account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pull_outlook_tasks(request):
    """Pull tasks from Outlook Tasks API"""
    try:
        token_obj = OutlookCalendarToken.objects.get(user=request.user)
        
        headers = {
            'Authorization': f'Bearer {token_obj.access_token}',
            'Content-Type': 'application/json'
        }
        
        # Get all task lists
        lists_response = requests.get(
            'https://graph.microsoft.com/v1.0/me/todo/lists',
            headers=headers
        )
        
        if lists_response.status_code != 200:
            return Response({'error': 'Failed to fetch Outlook task lists'}, status=lists_response.status_code)
            
        task_lists = lists_response.json().get('value', [])
        all_tasks = []
        
        for task_list in task_lists:
            # Get tasks from each list
            tasks_response = requests.get(
                f'https://graph.microsoft.com/v1.0/me/todo/lists/{task_list["id"]}/tasks',
                headers=headers
            )
            
            if tasks_response.status_code != 200:
                continue
                
            tasks = tasks_response.json().get('value', [])
            
            for task in tasks:
                status = 'completed' if task.get('status') == 'completed' else 'pending'
                
                # Convert due date to datetime if it exists
                due_date = None
                if task.get('dueDateTime'):
                    try:
                        due_date = datetime.fromisoformat(task['dueDateTime']['dateTime'].replace('Z', '+00:00'))
                    except ValueError:
                        continue
                
                calendar_task, created = CalendarTask.objects.update_or_create(
                    user=request.user,
                    external_id=task['id'],
                    external_provider='outlook_tasks',
                    defaults={
                        'title': task.get('title', ''),
                        'description': task.get('body', {}).get('content', ''),
                        'due_date': due_date,
                        'status': status,
                        'created_at': datetime.fromisoformat(task.get('createdDateTime', datetime.now().isoformat()).replace('Z', '+00:00'))
                    }
                )
                all_tasks.append(calendar_task)
                
        return Response({
            'message': f'Successfully pulled {len(all_tasks)} Outlook Tasks',
            'tasks': [{'id': t.id, 'title': t.title} for t in all_tasks]
        })
    except OutlookCalendarToken.DoesNotExist:
        return Response({'error': 'Outlook account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def outlook_disconnect(request):
    """Disconnect from Outlook Calendar by removing the token"""
    try:
        # Delete the Outlook Calendar token
        OutlookCalendarToken.objects.filter(user=request.user).delete()
        
        # Update any existing calendar syncs to reflect disconnection
        CalendarSync.objects.filter(
            user=request.user,
            provider='outlook'
        ).update(
            sync_status='not_synced',
            sync_error='Disconnected from Outlook Calendar'
        )
        
        return Response({
            'status': 'success',
            'message': 'Successfully disconnected from Outlook Calendar'
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_outlook_events(request):
    """Push local events to Outlook Calendar"""
    try:
        token_obj = OutlookCalendarToken.objects.get(user=request.user)
        headers = {
            'Authorization': f'Bearer {token_obj.access_token}',
            'Content-Type': 'application/json'
        }
        # Push all events (insert if no external_id, update if external_id exists)
        local_events = Event.objects.filter(user=request.user)
        pushed = []
        for event in local_events:
            start_time = event.start_time.strftime('%Y-%m-%dT%H:%M:%S%z')
            end_time = event.end_time.strftime('%Y-%m-%dT%H:%M:%S%z')
            body = {
                "subject": event.title,
                "body": {
                    "contentType": "HTML",
                    "content": event.description or ""
                },
                "start": {
                    "dateTime": start_time,
                    "timeZone": "UTC"
                },
                "end": {
                    "dateTime": end_time,
                    "timeZone": "UTC"
                }
            }
            try:
                if event.external_id:
                    # Update existing event in Outlook
                    response = requests.patch(
                        f'https://graph.microsoft.com/v1.0/me/events/{event.external_id}',
                        headers=headers,
                        json=body
                    )
                    if response.status_code in (200, 201):
                        data = response.json()
                        event.external_provider = 'outlook_event'
                        event.save()
                        pushed.append(event)
                    else:
                        print(f"[Outlook Push] Failed to update event: {response.status_code} - {response.text}")
                else:
                    # Insert new event in Outlook
                    response = requests.post(
                        'https://graph.microsoft.com/v1.0/me/events',
                        headers=headers,
                        json=body
                    )
                    if response.status_code in (200, 201):
                        data = response.json()
                        event.external_id = data['id']
                        event.external_provider = 'outlook_event'
                        event.save()
                        pushed.append(event)
                    else:
                        print(f"[Outlook Push] Failed to create event: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[Outlook Push] Error creating/updating event {event.title}: {str(e)}")
                continue
        return Response({'message': f'Successfully pushed {len(pushed)} events to Outlook Calendar', 'events': [{'id': e.id, 'title': e.title} for e in pushed]})
    except OutlookCalendarToken.DoesNotExist:
        return Response({'error': 'Outlook account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_outlook_tasks(request):
    """Push local tasks to Outlook Tasks API"""
    try:
        token_obj = OutlookCalendarToken.objects.get(user=request.user)
        headers = {
            'Authorization': f'Bearer {token_obj.access_token}',
            'Content-Type': 'application/json'
        }
        # Get all task lists (use the first one)
        lists_response = requests.get(
            'https://graph.microsoft.com/v1.0/me/todo/lists',
            headers=headers
        )
        if lists_response.status_code != 200:
            return Response({'error': 'Failed to fetch Outlook task lists'}, status=lists_response.status_code)
        task_lists = lists_response.json().get('value', [])
        if not task_lists:
            return Response({'error': 'No Outlook task lists found'}, status=400)
        tasklist_id = task_lists[0]['id']
        # Push all tasks (insert if no external_id, update if external_id exists)
        local_tasks = CalendarTask.objects.filter(user=request.user)
        pushed = []
        for task in local_tasks:
            body = {
                "title": task.title,
                "body": {
                    "content": task.description or "",
                    "contentType": "text"
                }
            }
            if task.due_date:
                due_time = task.due_date.strftime('%Y-%m-%dT%H:%M:%S%z')
                body["dueDateTime"] = {
                    "dateTime": due_time,
                    "timeZone": "UTC"
                }
            try:
                if task.external_id:
                    # Update existing task in Outlook
                    response = requests.patch(
                        f'https://graph.microsoft.com/v1.0/me/todo/lists/{tasklist_id}/tasks/{task.external_id}',
                        headers=headers,
                        json=body
                    )
                    if response.status_code in (200, 201):
                        data = response.json()
                        task.external_provider = 'outlook_tasks'
                        task.save()
                        pushed.append(task)
                    else:
                        print(f"[Outlook Push] Failed to update task: {response.status_code} - {response.text}")
                else:
                    # Insert new task in Outlook
                    response = requests.post(
                        f'https://graph.microsoft.com/v1.0/me/todo/lists/{tasklist_id}/tasks',
                        headers=headers,
                        json=body
                    )
                    if response.status_code in (200, 201):
                        data = response.json()
                        task.external_id = data['id']
                        task.external_provider = 'outlook_tasks'
                        task.save()
                        pushed.append(task)
                    else:
                        print(f"[Outlook Push] Failed to create task: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[Outlook Push] Error creating/updating task {task.title}: {str(e)}")
                continue
        return Response({'message': f'Successfully pushed {len(pushed)} tasks to Outlook Tasks', 'tasks': [{'id': t.id, 'title': t.title} for t in pushed]})
    except OutlookCalendarToken.DoesNotExist:
        return Response({'error': 'Outlook account not connected'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
