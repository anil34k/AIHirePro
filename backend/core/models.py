from django.db import models
from users.models import User
from jobs.models import Job

class AIRecommendation(models.Model):
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='recommendations')
    match_score = models.IntegerField(default=0)
    skill_gap_analysis = models.JSONField(default=dict, blank=True)  # {"missing_skills": [], "learning_recommendations": []}
    explanation = models.TextField(blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Recommendation: {self.job.title} for {self.seeker.username} ({self.match_score}%)"


class Notification(models.Model):
    TYPES = (
        ('SYSTEM', 'System Alert'),
        ('EMAIL', 'Email Log'),
        ('HIRE', 'Hiring Alert'),
    )

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=20, choices=TYPES, default='SYSTEM')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"


class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action = models.CharField(max_length=150)  # e.g., "User Registered", "Job Posted"
    details = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        actor = self.user.username if self.user else "Anonymous"
        return f"{actor} - {self.action} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"


class AITelemetry(models.Model):
    endpoint = models.CharField(max_length=100)
    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.endpoint} - Latency: {self.latency_ms}ms"
