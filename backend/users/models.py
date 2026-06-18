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
    
    # Profile Header Details
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    cover_banner = models.ImageField(upload_to='cover_banners/', blank=True, null=True)
    headline = models.CharField(max_length=250, blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    
    # About Section
    summary = models.TextField(blank=True, null=True)
    objective = models.TextField(blank=True, null=True)
    about_me = models.TextField(blank=True, null=True)
    
    # Settings & Progress
    profile_completed = models.IntegerField(default=0)
    is_setup_completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    # Helpers for backwards-compatibility link properties
    def _get_link(self, name):
        link = self.links_list.filter(name=name).first()
        return link.url if link else None

    def _set_link(self, name, value):
        if value:
            link, _ = self.links_list.get_or_create(name=name)
            link.url = value
            link.save()
        else:
            self.links_list.filter(name=name).delete()

    @property
    def linkedin(self): return self._get_link('linkedin')
    @linkedin.setter
    def linkedin(self, val): self._set_link('linkedin', val)

    @property
    def github(self): return self._get_link('github')
    @github.setter
    def github(self, val): self._set_link('github', val)

    @property
    def portfolio(self): return self._get_link('portfolio')
    @portfolio.setter
    def portfolio(self, val): self._set_link('portfolio', val)

    @property
    def personal_website(self): return self._get_link('personal_website')
    @personal_website.setter
    def personal_website(self, val): self._set_link('personal_website', val)

    @property
    def resume_website(self): return self._get_link('resume_website')
    @resume_website.setter
    def resume_website(self, val): self._set_link('resume_website', val)

    @property
    def leetcode(self): return self._get_link('leetcode')
    @leetcode.setter
    def leetcode(self, val): self._set_link('leetcode', val)

    @property
    def hackerrank(self): return self._get_link('hackerrank')
    @hackerrank.setter
    def hackerrank(self, val): self._set_link('hackerrank', val)

    @property
    def codechef(self): return self._get_link('codechef')
    @codechef.setter
    def codechef(self, val): self._set_link('codechef', val)

    @property
    def codeforces(self): return self._get_link('codeforces')
    @codeforces.setter
    def codeforces(self, val): self._set_link('codeforces', val)

    @property
    def kaggle(self): return self._get_link('kaggle')
    @kaggle.setter
    def kaggle(self, val): self._set_link('kaggle', val)

    @property
    def behance(self): return self._get_link('behance')
    @behance.setter
    def behance(self, val): self._set_link('behance', val)

    @property
    def dribbble(self): return self._get_link('dribbble')
    @dribbble.setter
    def dribbble(self, val): self._set_link('dribbble', val)

    # Backwards compatibility list properties
    @property
    def skills(self):
        return list(self.skills_list.values_list('name', flat=True))

    @skills.setter
    def skills(self, value):
        self.skills_list.all().delete()
        if value:
            for item in value:
                if isinstance(item, dict):
                    self.skills_list.create(name=item.get('name', ''), level=item.get('level', 'Intermediate'))
                else:
                    self.skills_list.create(name=item, level='Intermediate')

    @property
    def education(self):
        return [
            {
                "degree": edu.degree,
                "school": edu.college,
                "field": edu.branch,
                "grade": edu.cgpa,
                "start_year": edu.start_year,
                "end_year": edu.end_year,
                "description": edu.description or ""
            }
            for edu in self.educations.all()
        ]

    @education.setter
    def education(self, value):
        self.educations.all().delete()
        if value:
            import re
            def parse_year(val, default):
                if not val:
                    return default
                try:
                    return int(float(val))
                except (ValueError, TypeError):
                    pass
                try:
                    digits = re.findall(r'\b\d{4}\b', str(val))
                    if digits:
                        return int(digits[0])
                except Exception:
                    pass
                return default

            for item in value:
                start_year = parse_year(item.get('start_year'), 2020)
                end_year = parse_year(item.get('end_year'), 2026)
                self.educations.create(
                    degree=item.get('degree', ''),
                    college=item.get('school', '') or item.get('college', ''),
                    branch=item.get('field', '') or item.get('branch', ''),
                    cgpa=item.get('grade', '') or item.get('cgpa', ''),
                    start_year=start_year,
                    end_year=end_year,
                    description=item.get('description', '')
                )

    @property
    def experience(self):
        return [
            {
                "role": exp.job_title,
                "company": exp.company_name,
                "employment_type": exp.employment_type,
                "location": exp.location or "",
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "currently_working": exp.currently_working,
                "description": exp.description or ""
            }
            for exp in self.experiences.all()
        ]

    @experience.setter
    def experience(self, value):
        self.experiences.all().delete()
        if value:
            from datetime import datetime
            import re
            
            def parse_date(date_str, default=None):
                if not date_str:
                    return default
                date_str = str(date_str).strip()
                for fmt in ["%Y-%m-%d", "%Y-%m", "%Y"]:
                    try:
                        return datetime.strptime(date_str, fmt).date()
                    except Exception:
                        continue
                try:
                    digits = re.findall(r'\b\d{4}\b', date_str)
                    if digits:
                        return datetime(year=int(digits[0]), month=1, day=1).date()
                except Exception:
                    pass
                return default

            for item in value:
                start_str = item.get('start_date') or item.get('start_year')
                end_str = item.get('end_date') or item.get('end_year')
                
                start_date = parse_date(start_str, datetime.now().date())
                end_date = parse_date(end_str, None)
                
                is_present = False
                if end_str and "present" in str(end_str).lower():
                    is_present = True
                    
                currently_working = item.get('currently_working', False) or is_present
                
                self.experiences.create(
                    job_title=item.get('role', '') or item.get('job_title', ''),
                    company_name=item.get('company', '') or item.get('company_name', ''),
                    employment_type=item.get('employment_type', 'Full-time'),
                    location=item.get('location', ''),
                    start_date=start_date,
                    end_date=end_date,
                    currently_working=currently_working,
                    description=item.get('description', '')
                )

    @property
    def certifications(self):
        return list(self.certifications_list.values_list('name', flat=True))

    @certifications.setter
    def certifications(self, value):
        self.certifications_list.all().delete()
        if value:
            for item in value:
                if isinstance(item, dict):
                    self.certifications_list.create(
                        name=item.get('name', ''),
                        issuing_organization=item.get('issuing_organization', '') or item.get('organization', ''),
                    )
                else:
                    self.certifications_list.create(
                        name=item,
                        issuing_organization='Unknown'
                    )

    @property
    def projects(self):
        return [
            {
                "title": proj.name,
                "description": proj.description or "",
                "technologies": proj.technologies_used,
                "github": proj.github_link or "",
                "link": proj.live_demo_link or "",
                "images": proj.images
            }
            for proj in self.projects_list.all()
        ]

    @projects.setter
    def projects(self, value):
        self.projects_list.all().delete()
        if value:
            for item in value:
                self.projects_list.create(
                    name=item.get('title', '') or item.get('name', ''),
                    description=item.get('description', ''),
                    technologies_used=item.get('technologies', []) or item.get('technologies_used', []),
                    github_link=item.get('github', '') or item.get('github_link', ''),
                    live_demo_link=item.get('link', '') or item.get('live_demo_link', ''),
                    images=item.get('images', [])
                )


class Education(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='educations')
    degree = models.CharField(max_length=150)
    college = models.CharField(max_length=200)
    branch = models.CharField(max_length=150)
    cgpa = models.CharField(max_length=50, blank=True, null=True)
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.degree} at {self.college}"


class Experience(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='experiences')
    job_title = models.CharField(max_length=150)
    company_name = models.CharField(max_length=150)
    employment_type = models.CharField(max_length=100)
    location = models.CharField(max_length=150, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    currently_working = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"


class Skill(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='skills_list')
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=50, default='Intermediate')  # Beginner, Intermediate, Expert

    def __str__(self):
        return f"{self.name} ({self.level})"


class Certification(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='certifications_list')
    name = models.CharField(max_length=150)
    issuing_organization = models.CharField(max_length=150)
    issue_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    credential_id = models.CharField(max_length=150, blank=True, null=True)
    credential_url = models.URLField(blank=True, null=True)
    certificate_file = models.FileField(upload_to='certificates/', blank=True, null=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='projects_list')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    technologies_used = models.JSONField(default=list, blank=True)
    github_link = models.URLField(blank=True, null=True)
    live_demo_link = models.URLField(blank=True, null=True)
    images = models.JSONField(default=list, blank=True)  # List of URLs

    def __str__(self):
        return self.name


class ProfessionalLink(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='links_list')
    name = models.CharField(max_length=100)  # linkedin, github, portfolio, etc.
    url = models.URLField(max_length=500)

    def __str__(self):
        return f"{self.name}: {self.url}"


class Interest(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='interests_list')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Hobby(models.Model):
    profile = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='hobbies_list')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# =====================================================
# RECRUITER CONFIGURATION MODELS
# =====================================================

class RecruiterProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    department = models.CharField(max_length=150, blank=True, null=True)
    position = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - Recruiter"


class InterviewSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='interview_settings')
    duration_minutes = models.IntegerField(default=30)
    meeting_platform = models.CharField(max_length=100, default='Google Meet')
    timezone = models.CharField(max_length=100, default='Asia/Kolkata')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Interview Settings: {self.user.username}"


class RecruiterNotificationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    email_notifications = models.BooleanField(default=True)
    interview_reminders = models.BooleanField(default=True)
    new_applications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification Settings: {self.user.username}"
