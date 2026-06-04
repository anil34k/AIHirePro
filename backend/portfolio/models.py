from django.db import models
from django.conf import settings

class PublicPortfolio(models.Model):
    THEMES = (
        ('MODERN', 'Modern Glassmorphic'),
        ('SKEUOMORPHIC', 'Tactile Skeuomorphic'),
    )
    seeker = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='public_portfolio')
    slug = models.SlugField(max_length=150, unique=True)
    is_visible = models.BooleanField(default=True)
    theme_style = models.CharField(max_length=20, choices=THEMES, default='MODERN')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Portfolio: {self.slug} (Seeker: {self.seeker.username})"
