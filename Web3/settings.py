from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import AiAssistant
from .forms import AiAssistantForm
from tasks.models import Task
from events.models import Event
import google.generativeai as genai
import json
import logging
from datetime import datetime, timedelta

# Set up logging
logger = logging.getLogger(__name__)

# Configure Gemini API
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    # List available models
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            logger.info(f"Available model: {m.name}")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {str(e)}")

# Configure the model
generation_config = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 500,
}

safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
]

def get_user_data(user_id):
    """Get relevant user data from the database"""
    now = timezone.now()
    today = now.date()
    user_id = user_id -1
    
    # Calculate date range (3 days before and 3 days after today)
    start_date = today - timedelta(days=3)
    end_date = today + timedelta(days=3)
        
    # Get all tasks within the date range
    tasks = Task.objects.filter(
        user_id=user_id,
        start_time__gte=timezone.make_aware(datetime.combine(start_date, datetime.min.time())),
        start_time__lte=timezone.make_aware(datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    ).order_by('start_time')
    
    # Get all events within the date range
    events = Event.objects.filter(
        user_id=user_id,
        start_time__gte=timezone.make_aware(datetime.combine(start_date, datetime.min.time())),
        start_time__lte=timezone.make_aware(datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    ).order_by('start_time')
    
    return tasks, events

@login_required
def index(request):
    user_id = request.user.id
    
    # Get cached data
    cached_data = cache.get(f'user_data_{user_id}')
    
    if cached_data:
        tasks, events = cached_data
    else:
        # Get user data
        tasks, events = get_user_data(user_id)
        
        # Cache the data for 10 minutes
        cache.set(f'user_data_{user_id}', (tasks, events), timeout=600)
    
    return render(request, 'index.html', {'tasks': tasks, 'events': events})

@login_required
def ai_assistant(request):
    user_id = request.user.id
    logger.info(f"AI Assistant accessed by user_id: {user_id}")
    
    if request.method == 'POST':
        form = AiAssistantForm(request.POST)
        if form.is_valid():
            prompt = form.cleaned_data['prompt']
            logger.info(f"Prompt received: {prompt}")
            
            # Call Gemini API
            try:
                response = genai.generate(
                    model="gemini-1.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=generation_config["temperature"],
                    max_output_tokens=generation_config["max_output_tokens"],
                    top_p=generation_config["top_p"],
                    top_k=generation_config["top_k"],
                    safety_settings=safety_settings
                )
                
                logger.info(f"Response received: {response}")
                
                # Process and return the response
                answer = response.generations[0].text.strip()
                return render(request, 'ai_assistant.html', {'form': form, 'answer': answer})
            
            except Exception as e:
                logger.error(f"Error calling Gemini API: {str(e)}")
                messages.error(request, "Error processing your request. Please try again later.")
                return render(request, 'ai_assistant.html', {'form': form})
    
    else:
        form = AiAssistantForm()
    
    return render(request, 'ai_assistant.html', {'form': form})

def login_view(request):
    return render(request, 'registration/login.html')

def logout_view(request):
    return render(request, 'registration/logged_out.html')

# Add this line
LOGIN_URL = '/login/'