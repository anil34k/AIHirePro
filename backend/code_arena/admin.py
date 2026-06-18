from django.contrib import admin
from .models import CodingChallenge, CodeSubmission


@admin.register(CodingChallenge)
class CodingChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'category', 'is_active', 'created_at')
    list_filter = ('difficulty', 'category', 'is_active')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = ('seeker', 'challenge', 'language', 'score', 'status', 'evaluated_at')
    list_filter = ('status', 'language')
    search_fields = ('seeker__username', 'challenge__title')
    ordering = ('-evaluated_at',)
