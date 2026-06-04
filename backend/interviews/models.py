from django.db import models
from django.conf import settings
from jobs.models import Job

class InterviewSession(models.Model):
    STATUS_CHOICES = (
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    )
    seeker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interview_sessions')
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='interview_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        job_title = self.job.title if self.job else "General Practice"
        return f"Interview with {self.seeker.username} ({job_title})"


class InterviewQuestion(models.Model):
    TYPES = (
        ('TECHNICAL', 'Technical'),
        ('CONCEPTUAL', 'Conceptual'),
        ('BEHAVIORAL', 'Behavioral'),
    )
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    order = models.IntegerField(default=1)
    question_type = models.CharField(max_length=20, choices=TYPES, default='TECHNICAL')
    suggested_keywords = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:30]}..."


class InterviewAnswer(models.Model):
    question = models.OneToOneField(InterviewQuestion, on_delete=models.CASCADE, related_name='answer')
    answer_text = models.TextField(blank=True, null=True)
    spoken_text = models.TextField(blank=True, null=True)  # Voice response text
    submitted_code = models.TextField(blank=True, null=True)  # Code submission response
    score = models.IntegerField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    evaluated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Answer for Q{self.question.order} (Session ID: {self.question.session.id})"
