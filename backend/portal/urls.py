from django.urls import path
from . import views

urlpatterns = [
    # Page routes
    path('', views.dashboard, name='portal_dashboard'),
    path('login/', views.portal_login, name='portal_login'),
    path('logout/', views.portal_logout, name='portal_logout'),

    # Portfolio page
    path('portfolio/<slug:username>/', views.public_portfolio, name='public_portfolio'),

    # Recruiter page routes
    path('recruiter/login/', views.recruiter_login, name='recruiter_login'),
    path('recruiter/', views.recruiter_dashboard, name='recruiter_dashboard'),

    # Portal API routes (seeker)
    path('portal-api/job-matches/', views.api_job_matches, name='api_job_matches'),
    path('portal-api/upload-resume/', views.api_upload_resume, name='api_upload_resume'),
    path('portal-api/delete-resume/<int:resume_id>/', views.api_delete_resume, name='api_delete_resume'),
    path('portal-api/ai-parse/', views.api_ai_parse, name='api_ai_parse'),
    path('portal-api/ats-analysis/', views.api_ats_analysis, name='api_ats_analysis'),
    path('portal-api/debug/', views.api_debug_status, name='api_debug_status'),

    # Recruiter API routes
    path('portal-api/recruiter/config/', views.api_recruiter_config, name='api_recruiter_config'),
    path('portal-api/recruiter/seekers/', views.api_recruiter_seekers, name='api_recruiter_seekers'),
    path('portal-api/recruiter/schedules/', views.api_recruiter_schedules, name='api_recruiter_schedules'),
    path('portal-api/recruiter/jobs/', views.api_recruiter_jobs, name='api_recruiter_jobs'),

    # Admin dashboard + challenge management routes
    path('admin/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/challenges/', views.admin_challenges, name='admin_challenges'),
    path('admin/challenges/add/', views.admin_challenge_add, name='admin_challenge_add'),
    path('admin/challenges/edit/<int:challenge_id>/', views.admin_challenge_edit, name='admin_challenge_edit'),
    path('admin/challenges/delete/<int:challenge_id>/', views.admin_challenge_delete, name='admin_challenge_delete'),

    # Admin challenge API routes
    path('portal-api/admin/import-leetcode/', views.api_admin_import_leetcode, name='api_admin_import_leetcode'),
    path('portal-api/admin/toggle-challenge/<int:challenge_id>/', views.api_admin_toggle_challenge, name='api_admin_toggle_challenge'),
]
