from django.db import models
from django.conf import settings

class CourseRecommendation(models.Model):
    seeker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='course_recommendations')
    skill_name = models.CharField(max_length=100)
    course_title = models.CharField(max_length=200)
    platform = models.CharField(max_length=100, default='YouTube')
    resource_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Course: {self.course_title} for {self.seeker.username} ({self.skill_name})"
