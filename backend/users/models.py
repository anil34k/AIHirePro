from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ADMIN = 'ADMIN'
    COMPANY = 'COMPANY'
    SEEKER = 'SEEKER'
    
    ROLE_CHOICES = (
        (ADMIN, 'Admin'),
        (COMPANY, 'Company Recruiter'),
        (SEEKER, 'Job Seeker'),
    )
    
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default=SEEKER)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_suspended = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class CompanyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    logo_url = models.TextField(blank=True, null=True)  # Fallback URL or placeholder logo
    name = models.CharField(max_length=100)
    industry = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    headquarters = models.CharField(max_length=100, blank=True, null=True)
    size = models.CharField(max_length=50, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Social links
    linkedin = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.name


class JobSeekerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seeker_profile')
    skills = models.JSONField(default=list, blank=True)  # List of skills: ["Python", "Django", "SQL"]
    education = models.JSONField(default=list, blank=True)  # List of dicts
    experience = models.JSONField(default=list, blank=True)  # List of dicts
    certifications = models.JSONField(default=list, blank=True)  # List of dicts/strings
    projects = models.JSONField(default=list, blank=True)  # List of dicts
    
    # Social links
    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    portfolio = models.URLField(blank=True, null=True)
    
    profile_completed = models.IntegerField(default=0)  # Completion %
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"
