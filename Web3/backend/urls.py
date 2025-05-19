from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints - must come before template-based views
    path('api/tasks/', include('tasks.api_urls')),  # API endpoints for tasks
    path('api/auth/', include('customusers.api_urls')),  # API auth endpoints
    path('api/notifications/', include('notifications.api_urls')),  # API notifications endpoints
    
    # Template-based views
    path('tasks/', include('tasks.urls')),  # Template-based task views
    path('events/', include('events.urls')),
    path('notifications/', include('notifications.urls')),
    path('calendarsync/', include('calendarsync.urls')),
    path('aiassistant/', include('aiassistant.urls')),
    path('auth/', include('customusers.urls')),
    
    # Auth views
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    
    # Root redirect
    path('', RedirectView.as_view(url='/tasks/', permanent=False)),
] 