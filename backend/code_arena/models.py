from django.db import models
from django.conf import settings
from django.utils.text import slugify


class CodingChallenge(models.Model):
    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]
    CATEGORY_CHOICES = [
        ('ARRAYS', 'Arrays'),
        ('STRINGS', 'Strings'),
        ('LINKED_LISTS', 'Linked Lists'),
        ('TREES', 'Trees'),
        ('GRAPHS', 'Graphs'),
        ('DYNAMIC_PROGRAMMING', 'Dynamic Programming'),
        ('RECURSION', 'Recursion'),
        ('SORTING', 'Sorting'),
        ('SEARCHING', 'Searching'),
        ('SQL', 'SQL'),
        ('PYTHON', 'Python'),
        ('DJANGO', 'Django'),
        ('OTHER', 'Other'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='MEDIUM')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='OTHER')

    function_signature = models.CharField(max_length=300, blank=True, null=True)

    starter_code_python = models.TextField(default='# Write your solution here\npass\n')
    starter_code_javascript = models.TextField(default='// Write your solution here\n')
    starter_code_java = models.TextField(default='// Write your solution here\n')
    starter_code_cpp = models.TextField(default='// Write your solution here\n')
    starter_code_csharp = models.TextField(default='// Write your solution here\n')

    visible_test_cases = models.JSONField(default=list, blank=True)
    hidden_test_cases = models.JSONField(default=list, blank=True)
    sample_input = models.TextField(blank=True, null=True)
    sample_output = models.TextField(blank=True, null=True)

    time_limit = models.IntegerField(default=2000)
    memory_limit = models.IntegerField(default=256)

    source_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:200]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"


class CodeSubmission(models.Model):
    seeker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='code_submissions')
    challenge = models.ForeignKey(CodingChallenge, on_delete=models.CASCADE, related_name='submissions')
    language = models.CharField(max_length=20, default='python')
    submitted_code = models.TextField()
    passed_visible = models.IntegerField(default=0)
    total_visible = models.IntegerField(default=0)
    passed_hidden = models.IntegerField(default=0)
    total_hidden = models.IntegerField(default=0)
    execution_time_ms = models.FloatField(default=0)
    memory_used_mb = models.FloatField(default=0)
    status = models.CharField(max_length=30, default='PENDING')
    score = models.IntegerField(default=0)
    evaluation = models.JSONField(default=dict, blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-evaluated_at']

    def __str__(self):
        return f"{self.seeker.username} - {self.challenge.title} ({self.score}%)"
