from django.db import models
from users.models import User

class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')
    raw_text = models.TextField(blank=True, null=True)
    parsed_json = models.JSONField(default=dict, blank=True)  # Structured format extracted by Groq
    is_active = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume of {self.user.username} (Uploaded: {self.uploaded_at.strftime('%Y-%m-%d')})"
