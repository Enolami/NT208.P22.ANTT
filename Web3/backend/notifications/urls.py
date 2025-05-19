from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.notification_list_view, name='notification_list'),
    path('create/', views.notification_create, name='notification_create'),
    path('<int:pk>/update/', views.notification_update, name='notification_update'),
    path('<int:pk>/delete/', views.notification_delete, name='notification_delete'),
    path('<int:pk>/mark-sent/', views.mark_as_sent, name='mark_as_sent'),
] 