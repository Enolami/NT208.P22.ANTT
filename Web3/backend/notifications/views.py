from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Notification
from .forms import NotificationForm
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .serializers import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

# Template-based views
@login_required
def notification_list_view(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'notifications/notification_list.html', {'notifications': notifications})

@login_required
def notification_create(request):
    if request.method == 'POST':
        form = NotificationForm(user=request.user, data=request.POST)
        if form.is_valid():
            notification = form.save(commit=False)
            notification.user = request.user
            notification.save()
            messages.success(request, 'Notification created successfully!')
            return redirect('notifications:notification_list')
    else:
        form = NotificationForm(user=request.user)
    return render(request, 'notifications/notification_form.html', {'form': form, 'action': 'Create'})

@login_required
def notification_update(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    if request.method == 'POST':
        form = NotificationForm(user=request.user, data=request.POST, instance=notification)
        if form.is_valid():
            form.save()
            messages.success(request, 'Notification updated successfully!')
            return redirect('notifications:notification_list')
    else:
        form = NotificationForm(user=request.user, instance=notification)
    return render(request, 'notifications/notification_form.html', {'form': form, 'action': 'Update'})

@login_required
def notification_delete(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    if request.method == 'POST':
        notification.delete()
        messages.success(request, 'Notification deleted successfully!')
        return redirect('notifications:notification_list')
    return render(request, 'notifications/notification_confirm_delete.html', {'notification': notification})

@login_required
def mark_as_sent(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.is_sent = True
    notification.save()
    messages.success(request, 'Notification marked as sent!')
    return redirect('notifications:notification_list')

# API views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """Get all active notifications for the current user"""
    try:
        logger.info(f"Notification list API called by user {request.user.id}")
        logger.info(f"Request headers: {request.headers}")
        
        notifications = Notification.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-created_at')
        
        logger.info(f"Found {notifications.count()} notifications")
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in notification_list: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.mark_as_read()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_notification(request, pk):
    """Dismiss a notification"""
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.dismiss()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    try:
        Notification.objects.filter(
            user=request.user,
            status='unread'
        ).update(status='read')
        return Response({'status': 'success'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
