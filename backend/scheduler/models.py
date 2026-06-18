from django.db import models
from django.conf import settings
from jobs.models import Job

class InterviewSchedule(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Confirmation'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    )
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scheduled_interviews')
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='candidate_interviews')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='interview_schedules', blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        title = self.job_title or (self.job.title if self.job else 'Unknown Position')
        return f"Interview on {self.scheduled_time.strftime('%Y-%m-%d %H:%M')} for {self.candidate.username} - {title}"
