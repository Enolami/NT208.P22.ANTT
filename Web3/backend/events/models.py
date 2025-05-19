from django.db import models
from django.contrib.auth.models import User


class Event(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_conflict = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    external_id = models.CharField(max_length=255, blank=True, null=True)
    external_provider = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'events'

    def __str__(self):
        return f"Event for {self.title} from {self.start_time} to {self.end_time}"
