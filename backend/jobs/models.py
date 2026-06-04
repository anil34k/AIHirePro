from django.db import models
from users.models import CompanyProfile, User

class Job(models.Model):
    EMPLOYMENT_TYPES = (
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('CONTRACT', 'Contract'),
        ('INTERNSHIP', 'Internship'),
        ('REMOTE', 'Remote'),
    )
    
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('DRAFT', 'Draft'),
        ('ARCHIVED', 'Archived'),
    )

    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=150)
    description = models.TextField()
    skills_required = models.JSONField(default=list, blank=True)  # ["Python", "Django", "PostgreSQL"]
    experience_required = models.IntegerField(default=0)  # in years
    salary_min = models.IntegerField(blank=True, null=True)
    salary_max = models.IntegerField(blank=True, null=True)
    location = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='FULL_TIME')
    openings = models.IntegerField(default=1)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.company.name}"


class Application(models.Model):
    STATUS_CHOICES = (
        ('APPLIED', 'Applied'),
        ('SHORTLISTED', 'Shortlisted'),
        ('REJECTED', 'Rejected'),
        ('HIRED', 'Hired'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    resume = models.ForeignKey('resumes.Resume', on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    match_score = models.IntegerField(default=0)  # Calculated by AI
    strengths = models.JSONField(default=list, blank=True)  # Strengths found by AI
    missing_skills = models.JSONField(default=list, blank=True)  # Missing skills/gaps found by AI
    recruiter_notes = models.TextField(blank=True, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Application by {self.seeker.username} for {self.job.title}"


class HiringRecord(models.Model):
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='hires')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='hires')
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hires')
    hired_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='HIRED')

    def __str__(self):
        return f"Hiring of {self.seeker.username} for {self.job.title} by {self.company.name}"
