from django.db import models
from django.contrib.auth.models import User
from calendarsync.models import CalendarEvent

class Task(models.Model):
    id = models.AutoField(primary_key=True)
    task_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    LINKED_CHOICES = [
        ('none', 'None'),
        ('google', 'Google Calendar'),
        ('outlook', 'Outlook Calendar'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=10, default='pending')
    is_conflict = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    linked_to = models.CharField(max_length=10, choices=LINKED_CHOICES, default='none')
    external_id = models.CharField(max_length=255, blank=True, null=True)
    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return self.task_name
