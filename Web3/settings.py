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
    
    # Get all events within