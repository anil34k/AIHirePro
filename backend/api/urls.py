from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from api.views import (
    CustomTokenObtainPairView, RegisterView, CurrentUserView, JobViewSet, ApplicationViewSet,
    ResumeUploadView, ResumeInsightsView, JobRecommendationsView, AdminAnalyticsView,
    ManageUsersView, UserNotificationsView,
    
    # V2 recruitment views
    StartInterviewView, SubmitAnswerView, InterviewResultView,
    AcademyRecommendationsView, PublicPortfolioView, PortfolioSettingsView,
    CorporateAnalyticsView, InterviewSchedulerView, AdminTelemetryView,
    TalentScoutSearchView, ResumeOptimizerView,
    JobDescriptionGeneratorView, VoiceEvaluationView, CodeChallengeView,
    AdminChallengesView,
    
    # Demo Quick login
    DemoLoginView,
    
    # LinkedIn profile ViewSets
    EducationViewSet, ExperienceViewSet, SkillViewSet, CertificationViewSet,
    ProjectViewSet, ProfessionalLinkViewSet, InterestViewSet, HobbyViewSet
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'profile/education', EducationViewSet, basename='profile-education')
router.register(r'profile/experience', ExperienceViewSet, basename='profile-experience')
router.register(r'profile/skills', SkillViewSet, basename='profile-skills')
router.register(r'profile/certifications', CertificationViewSet, basename='profile-certifications')
router.register(r'profile/projects', ProjectViewSet, basename='profile-projects')
router.register(r'profile/links', ProfessionalLinkViewSet, basename='profile-links')
router.register(r'profile/interests', InterestViewSet, basename='profile-interests')
router.register(r'profile/hobbies', HobbyViewSet, basename='profile-hobbies')

urlpatterns = [
    # Auth routing
    path('auth/register/', RegisterView.as_view(), name='api_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='api_login'),
    path('auth/demo/', DemoLoginView.as_view(), name='api_demo_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('users/me/', CurrentUserView.as_view(), name='api_user_me'),
    
    # Router endpoints (Jobs, Applications)
    path('', include(router.urls)),
    
    # Resume parser
    path('resumes/upload/', ResumeUploadView.as_view(), name='api_resume_upload'),
    path('resumes/insights/', ResumeInsightsView.as_view(), name='api_resume_insights'),
    
    # Recommendations
    path('seeker/recommendations/', JobRecommendationsView.as_view(), name='api_seeker_recs'),
    
    # Admin metrics
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='api_admin_analytics'),
    path('admin/users/', ManageUsersView.as_view(), name='api_admin_users'),
    
    # Alerts
    path('notifications/', UserNotificationsView.as_view(), name='api_notifications'),

    # V2 Endpoints
    path('interviews/start/', StartInterviewView.as_view(), name='api_interviews_start'),
    path('interviews/answer/', SubmitAnswerView.as_view(), name='api_interviews_answer'),
    path('interviews/result/', InterviewResultView.as_view(), name='api_interviews_result'),
    path('academy/recommendations/', AcademyRecommendationsView.as_view(), name='api_academy_recs'),
    path('portfolio/settings/', PortfolioSettingsView.as_view(), name='api_portfolio_settings'),
    path('portfolio/<str:username>/', PublicPortfolioView.as_view(), name='api_portfolio_public'),
    path('analytics/dashboard/', CorporateAnalyticsView.as_view(), name='api_corporate_analytics'),
    path('scheduler/', InterviewSchedulerView.as_view(), name='api_interview_scheduler'),
    path('admin/telemetry/', AdminTelemetryView.as_view(), name='api_admin_telemetry'),

    path('talent-scout/search/', TalentScoutSearchView.as_view(), name='api_talent_scout_search'),
    path('resume-optimizer/', ResumeOptimizerView.as_view(), name='api_resume_optimizer'),
    path('job-description/generate/', JobDescriptionGeneratorView.as_view(), name='api_job_desc_generate'),
    path('voice/upload/', VoiceEvaluationView.as_view(), name='api_voice_upload'),
    path('code/run/', CodeChallengeView.as_view(), name='api_code_run'),
    path('admin/challenges/', AdminChallengesView.as_view(), name='api_admin_challenges'),
]
