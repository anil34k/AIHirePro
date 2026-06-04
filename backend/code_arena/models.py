from django.db import models
from django.conf import settings

class CodingChallenge(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField()
    initial_code = models.TextField(blank=True, null=True)  # Placeholder template
    test_cases = models.JSONField(default=list, blank=True)  # List of test assertions or input-outputs
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CodeSubmission(models.Model):
    seeker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='code_submissions')
    challenge = models.ForeignKey(CodingChallenge, on_delete=models.CASCADE, related_name='submissions')
    submitted_code = models.TextField()
    evaluation = models.JSONField(default=dict, blank=True)  # Feedback details scored by AI
    score = models.IntegerField(default=0)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.seeker.username} for {self.challenge.title} (Score: {self.score}%)"
