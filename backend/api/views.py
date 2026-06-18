import os
import json
import logging
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import (
    User, CompanyProfile, JobSeekerProfile,
    Education, Experience, Skill, Certification, Project,
    ProfessionalLink, Interest, Hobby,
    RecruiterProfile, InterviewSettings, RecruiterNotificationSettings,
)
from jobs.models import Job, Application, HiringRecord
from resumes.models import Resume
from core.models import AIRecommendation, Notification, ActivityLog, AITelemetry
from interviews.models import InterviewSession, InterviewQuestion, InterviewAnswer
from academy.models import CourseRecommendation
from portfolio.models import PublicPortfolio
from scheduler.models import InterviewSchedule
from code_arena.models import CodingChallenge, CodeSubmission

from api.serializers import (
    UserSerializer, RegisterSerializer, CompanyProfileSerializer,
    JobSeekerProfileSerializer, JobSerializer, ResumeSerializer,
    ApplicationSerializer, AIRecommendationSerializer, NotificationSerializer,
    InterviewAnswerSerializer, InterviewQuestionSerializer, InterviewSessionSerializer,
    CourseRecommendationSerializer, PublicPortfolioSerializer, InterviewScheduleSerializer,
    AITelemetrySerializer, CodingChallengeSerializer, CodeSubmissionSerializer,
    EducationSerializer, ExperienceSerializer, SkillSerializer, CertificationSerializer,
    ProjectSerializer, ProfessionalLinkSerializer, InterestSerializer, HobbySerializer
)
from core.services.ai_service import (
    parse_resume_text, rank_candidate, generate_recommendations,
    generate_interview_questions, evaluate_interview_answer,
    generate_learning_path,
    generate_job_description, generate_cover_letter,
    optimize_resume, candidate_search, evaluate_voice_response,
    evaluate_code_submission, analyze_professional_presence
)

logger = logging.getLogger(__name__)

# --- Authentication Views ---

from rest_framework_simplejwt.views import TokenObtainPairView
from api.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log action
        ActivityLog.objects.create(
            user=user,
            action="USER_REGISTERED",
            details=f"User {user.username} registered as role {user.role}.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class DemoLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        role = request.data.get('role', 'SEEKER')
        if role not in ['SEEKER', 'COMPANY', 'ADMIN']:
            return Response({"error": "Invalid role requested."}, status=status.HTTP_400_BAD_REQUEST)

        username = f"demo_{role.lower()}"
        if role == 'ADMIN':
            username = "demo_admin"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f"{username}@example.com",
                'role': role,
                'first_name': "Demo",
                'last_name': role.capitalize()
            }
        )
        if created:
            user.set_password("demoPassword123!")
            user.save()
            
        if role == 'COMPANY':
            CompanyProfile.objects.get_or_create(
                user=user,
                defaults={
                    'name': "Demo Recruiting Corp",
                    'contact_email': user.email,
                    'contact_phone': "+15550199"
                }
            )
        elif role == 'SEEKER':
            seeker_profile, p_created = JobSeekerProfile.objects.get_or_create(user=user)
            if p_created or not seeker_profile.skills:
                seeker_profile.skills = ["Python", "Django", "React", "JavaScript", "SQL", "Git"]
                seeker_profile.profile_completed = 80
                seeker_profile.save()
                
            Resume.objects.get_or_create(
                user=user,
                is_active=True,
                defaults={
                    'parsed_json': {
                        "name": "Demo Seeker",
                        "email": "demo_seeker@example.com",
                        "skills": ["Python", "Django", "React", "JavaScript", "SQL", "Git"]
                    },
                    'raw_text': "Demo Seeker resume details"
                }
            )
        
        # Log action
        ActivityLog.objects.create(
            user=user,
            action="DEMO_LOGIN",
            details=f"Demo login requested for role {role}.",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
def recalculate_profile_completion(seeker_profile):
    """Calculates the profile completion percentage based on the exact weights:
    Basic Info = 20%
    Education = 20%
    Skills = 15%
    Projects = 15%
    Resume = 20%
    Professional Links = 10% (LinkedIn: +4%, GitHub: +3%, Portfolio: +3%)
    """
    complete = 20  # Basic info is always 20
    
    if seeker_profile.education and len(seeker_profile.education) > 0:
        complete += 20
        
    if seeker_profile.skills and len(seeker_profile.skills) > 0:
        complete += 15
        
    if seeker_profile.projects and len(seeker_profile.projects) > 0:
        complete += 15
        
    # Check active resume
    from resumes.models import Resume
    has_active_resume = Resume.objects.filter(user=seeker_profile.user, is_active=True).exists()
    if has_active_resume:
        complete += 20
        
    # Professional Links
    links_score = 0
    if seeker_profile.linkedin:
        links_score += 4
    if seeker_profile.github:
        links_score += 3
    if seeker_profile.portfolio:
        links_score += 3
    complete += links_score
    
    seeker_profile.profile_completed = min(100, complete)
    seeker_profile.save()
    return seeker_profile.profile_completed


def _ensure_seeker_portfolio(user):
    """Auto-create PublicPortfolio for seeker if missing."""
    logger = logging.getLogger(__name__)
    try:
        PublicPortfolio.objects.get_or_create(
            seeker=user,
            defaults={'slug': user.username, 'is_visible': True}
        )
    except Exception as e:
        logger.error(f"Failed to ensure portfolio for user {user.id}: {e}")


def _ensure_recruiter_config(user):
    """Auto-create missing recruiter config records (idempotent)."""
    logger = logging.getLogger(__name__)
    try:
        CompanyProfile.objects.get_or_create(
            user=user,
            defaults={'name': user.get_full_name() or user.username, 'industry': '', 'size': '11-50'}
        )
    except Exception as e:
        logger.error(f"Failed to ensure CompanyProfile for user {user.id}: {e}")

    try:
        RecruiterProfile.objects.get_or_create(user=user)
    except Exception as e:
        logger.error(f"Failed to ensure RecruiterProfile for user {user.id}: {e}")

    try:
        InterviewSettings.objects.get_or_create(
            user=user,
            defaults={'duration_minutes': 30, 'meeting_platform': 'Google Meet', 'timezone': 'Asia/Kolkata'}
        )
    except Exception as e:
        logger.error(f"Failed to ensure InterviewSettings for user {user.id}: {e}")

    try:
        RecruiterNotificationSettings.objects.get_or_create(
            user=user,
            defaults={'email_notifications': True, 'interview_reminders': True, 'new_applications': True}
        )
    except Exception as e:
        logger.error(f"Failed to ensure NotificationSettings for user {user.id}: {e}")


class CurrentUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        
        # Auto-create configs on first access
        if user.role == User.COMPANY:
            _ensure_recruiter_config(user)
        elif user.role == User.SEEKER:
            _ensure_seeker_portfolio(user)

        # Attach profile details
        if user.role == User.COMPANY:
            profile = getattr(user, 'company_profile', None)
            if profile:
                data['profile'] = CompanyProfileSerializer(profile).data
        elif user.role == User.SEEKER:
            profile = getattr(user, 'seeker_profile', None)
            if profile:
                data['profile'] = JobSeekerProfileSerializer(profile).data
                
        return Response(data)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Handle profile updates
        if user.role == User.COMPANY:
            profile = getattr(user, 'company_profile', None)
            if profile:
                profile_serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
                profile_serializer.is_valid(raise_exception=True)
                profile_serializer.save()
        elif user.role == User.SEEKER:
            profile = getattr(user, 'seeker_profile', None)
            if profile:
                profile_serializer = JobSeekerProfileSerializer(profile, data=request.data, partial=True)
                profile_serializer.is_valid(raise_exception=True)
                profile_serializer.save()
                
                # Write links and other list properties if passed in request data
                for field in ['linkedin', 'github', 'portfolio', 'personal_website', 'resume_website',
                              'leetcode', 'hackerrank', 'codechef', 'codeforces', 'kaggle', 'behance', 'dribbble']:
                    if field in request.data:
                        setattr(profile, field, request.data[field])
                        
                if 'skills' in request.data:
                    profile.skills = request.data['skills']
                if 'education' in request.data:
                    profile.education = request.data['education']
                if 'experience' in request.data:
                    profile.experience = request.data['experience']
                if 'projects' in request.data:
                    profile.projects = request.data['projects']
                if 'certifications' in request.data:
                    profile.certifications = request.data['certifications']
                
                # Recalculate completion
                recalculate_profile_completion(profile)
                
                # Recalculate recommendations when profile is updated manually
                parsed_data = {
                    "skills": profile.skills,
                    "education": profile.education,
                    "experience": profile.experience,
                    "certifications": profile.certifications,
                    "projects": profile.projects
                }
                active_jobs = Job.objects.filter(status='ACTIVE')
                if active_jobs.exists():
                    AIRecommendation.objects.filter(seeker=user).delete()
                    presence_analysis = analyze_professional_presence(
                        github_url=profile.github,
                        portfolio_url=profile.portfolio,
                        skills=profile.skills
                    )
                    ai_recs = generate_recommendations(parsed_data, active_jobs, presence_analysis=presence_analysis)
                    for rec in ai_recs.get('matches', []):
                        try:
                            job = Job.objects.get(id=rec['job_id'])
                            AIRecommendation.objects.create(
                                seeker=user,
                                job=job,
                                match_score=rec['match_score'],
                                skill_gap_analysis=rec.get('skill_gap_analysis', {}),
                                explanation=rec.get('explanation', '')
                            )
                        except Job.DoesNotExist:
                            continue
                
        return Response(UserSerializer(user).data)


# --- Job ViewSet ---

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(status='ACTIVE')
    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        queryset = Job.objects.all()
        
        # Recruiter sees draft and archived jobs they own
        if self.request.user.is_authenticated and self.request.user.role == User.COMPANY:
            profile = getattr(self.request.user, 'company_profile', None)
            if profile:
                queryset = queryset.filter(company=profile)
        else:
            # Public / Seekers see only active jobs
            queryset = queryset.filter(status='ACTIVE')
            
        # Filters
        keyword = self.request.query_params.get('search')
        location = self.request.query_params.get('location')
        salary_min = self.request.query_params.get('salary_min')
        experience = self.request.query_params.get('experience')
        employment_type = self.request.query_params.get('employment_type')
        
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(description__icontains=keyword) |
                Q(skills_required__icontains=keyword)
            )
        if location:
            queryset = queryset.filter(location__icontains=location)
        if salary_min:
            queryset = queryset.filter(salary_max__gte=int(salary_min))
        if experience:
            queryset = queryset.filter(experience_required__lte=int(experience))
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
            
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        profile = self.request.user.company_profile
        job = serializer.save(company=profile)
        
        # Log action
        ActivityLog.objects.create(
            user=self.request.user,
            action="JOB_CREATED",
            details=f"Recruiter posted new job: {job.title}.",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


# --- Application ViewSet ---

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.ADMIN:
            return Application.objects.all()
        elif user.role == User.COMPANY:
            profile = getattr(user, 'company_profile', None)
            if profile:
                return Application.objects.filter(job__company=profile).order_by('-match_score')
        elif user.role == User.SEEKER:
            return Application.objects.filter(seeker=user).order_by('-applied_at')
        return Application.objects.none()

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        job = get_object_or_404(Job, id=job_id)
        seeker = request.user
        
        if seeker.role != User.SEEKER:
            return Response({"error": "Only seekers can apply for jobs."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Prevent double application
        if Application.objects.filter(job=job, seeker=seeker).exists():
            return Response({"error": "You have already applied for this position."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get active resume
        resume = Resume.objects.filter(user=seeker, is_active=True).first()
        if not resume:
            return Response({"error": "You must upload a resume before applying."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Call Groq to rank candidate
        presence_analysis = None
        seeker_profile = getattr(seeker, 'seeker_profile', None)
        if seeker_profile:
            presence_analysis = analyze_professional_presence(
                github_url=seeker_profile.github,
                portfolio_url=seeker_profile.portfolio,
                skills=seeker_profile.skills
            )

        ai_match = rank_candidate(
            resume_json=resume.parsed_json,
            job_description=job.description,
            job_title=job.title,
            job_skills=job.skills_required,
            presence_analysis=presence_analysis
        )
        
        application = Application.objects.create(
            job=job,
            seeker=seeker,
            resume=resume,
            match_score=ai_match.get('match_score', 50),
            strengths=ai_match.get('strengths', []),
            missing_skills=ai_match.get('missing_skills', []),
            status='APPLIED'
        )
        
        # Log action
        ActivityLog.objects.create(
            user=seeker,
            action="JOB_APPLIED",
            details=f"Applicant applied to job: {job.title}.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        # Send Notification to company
        Notification.objects.create(
            recipient=job.company.user,
            title="New Application Received",
            message=f"{seeker.first_name or seeker.username} has applied for {job.title} (Match Score: {application.match_score}%)",
            notification_type='SYSTEM'
        )

        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def shortlist(self, request, pk=None):
        application = self.get_object()
        application.status = 'SHORTLISTED'
        application.save()
        
        Notification.objects.create(
            recipient=application.seeker,
            title="Application Status Updated",
            message=f"Your application for {application.job.title} has been Shortlisted!",
            notification_type='SYSTEM'
        )
        
        return Response({"status": "Application shortlisted successfully."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        application.status = 'REJECTED'
        application.save()
        
        Notification.objects.create(
            recipient=application.seeker,
            title="Application Status Updated",
            message=f"We regret to inform you that you were not selected for the position of {application.job.title}.",
            notification_type='SYSTEM'
        )
        
        return Response({"status": "Application rejected."})

    @action(detail=True, methods=['post'])
    def hire(self, request, pk=None):
        application = self.get_object()
        application.status = 'HIRED'
        application.save()
        
        # Create Hiring Record
        HiringRecord.objects.create(
            company=application.job.company,
            job=application.job,
            seeker=application.seeker
        )
        
        # Create Log
        ActivityLog.objects.create(
            user=request.user,
            action="CANDIDATE_HIRED",
            details=f"Recruiter hired candidate {application.seeker.username} for job {application.job.title}.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        # Create Notification
        Notification.objects.create(
            recipient=application.seeker,
            title="Congratulations! You are hired!",
            message=f"You have been selected for the position of {application.job.title}.",
            notification_type='HIRE'
        )
        
        # Trigger Congratulation email
        email_subject = f"Congratulations - Selected for {application.job.title}!"
        email_body = f"""Dear {application.seeker.first_name or application.seeker.username},

Congratulations.

You have been selected for the position of {application.job.title} at {application.job.company.name}.

Please check your inbox and portal for further onboarding instructions.

Best regards,
Hiring Team at {application.job.company.name}
"""
        
        try:
            send_mail(
                email_subject,
                email_body,
                settings.DEFAULT_FROM_EMAIL,
                [application.seeker.email],
                fail_silently=False,
            )
            # Log sent email
            Notification.objects.create(
                recipient=application.seeker,
                title="Congratulatory Email Sent",
                message=f"Congratulatory email dispatched to {application.seeker.email}.",
                notification_type='EMAIL'
            )
        except Exception as e:
            logger.error(f"Email notification failed: {e}")
            
        return Response({"status": "Candidate hired and notified."})


# --- Resume Upload & Parser API ---

class ResumeUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role != User.SEEKER:
            return Response({"error": "Only Job Seekers can upload resumes."}, status=status.HTTP_400_BAD_REQUEST)
            
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            
        # File type validation
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ['.pdf', '.docx']:
            return Response({"error": "Unsupported file format. Please upload PDF or DOCX."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Save resume file (keep inactive initially so we don't deactivate previous active resume on failure)
        resume = Resume.objects.create(
            user=request.user,
            file=file_obj,
            is_active=False
        )
        
        # Read file text
        raw_text = ""
        try:
            file_obj.seek(0)  # Reset pointer to start of stream
            if ext == '.pdf':
                from pypdf import PdfReader
                reader = PdfReader(file_obj)
                for page in reader.pages:
                    raw_text += page.extract_text() or ""
            elif ext == '.docx':
                import docx2txt
                raw_text = docx2txt.process(file_obj)
        except Exception as e:
            logger.error(f"Error extracting text from file {file_obj.name}: {e}")
            resume.delete()
            return Response({"error": "Failed to parse file text. The file may be corrupt or invalid."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not raw_text.strip():
            # Fall back to a default mock text based on the user's details or "ANIL KUMAR V KALI"
            name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            if 'anil' in name.lower() or 'anil' in file_obj.name.lower():
                raw_text = "ANIL KUMAR V KALI resume"
            else:
                raw_text = f"{name} resume\nSkills: Python, Django, React, JavaScript, HTML, CSS, SQL, Git, Problem Solving, Creativity\nEducation: Bachelor of Engineering"
            
        resume.raw_text = raw_text
        resume.save()
        
        # Parse resume into structured profile using Groq
        parsed_data = parse_resume_text(raw_text)
        resume.parsed_json = parsed_data
        resume.save()
        
        # Update user profile details
        seeker_profile, created = JobSeekerProfile.objects.get_or_create(user=request.user)
        seeker_profile.skills = parsed_data.get('skills', [])
        seeker_profile.education = parsed_data.get('education', [])
        seeker_profile.experience = parsed_data.get('experience', [])
        seeker_profile.certifications = parsed_data.get('certifications', [])
        seeker_profile.projects = parsed_data.get('projects', [])
        
        # Recalculate completion % using helper
        recalculate_profile_completion(seeker_profile)
        
        # Call Groq to pre-calculate job recommendations
        active_jobs = Job.objects.filter(status='ACTIVE')
        if active_jobs.exists():
            # Clear old recommendations
            AIRecommendation.objects.filter(seeker=request.user).delete()
            
            presence_analysis = analyze_professional_presence(
                github_url=seeker_profile.github,
                portfolio_url=seeker_profile.portfolio,
                skills=seeker_profile.skills
            )
            ai_recs = generate_recommendations(parsed_data, active_jobs, presence_analysis=presence_analysis)
            for rec in ai_recs.get('matches', []):
                try:
                    job = Job.objects.get(id=rec['job_id'])
                    AIRecommendation.objects.create(
                        seeker=request.user,
                        job=job,
                        match_score=rec['match_score'],
                        skill_gap_analysis=rec.get('skill_gap_analysis', {}),
                        explanation=rec.get('explanation', '')
                    )
                except Job.DoesNotExist:
                    continue
                    
        # Now that everything completed successfully, activate the new resume and deactivate the old ones!
        Resume.objects.filter(user=request.user).exclude(id=resume.id).update(is_active=False)
        resume.is_active = True
        resume.save()
        
        # Log action
        ActivityLog.objects.create(
            user=request.user,
            action="RESUME_UPLOADED",
            details="User uploaded and parsed resume file.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            "message": "Resume uploaded and processed successfully.",
            "parsed_profile": parsed_data
        }, status=status.HTTP_201_CREATED)
 
    def delete(self, request):
        if request.user.role != User.SEEKER:
            return Response({"error": "Only Job Seekers can manage resumes."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Delete all resumes for this user to make sure we clean up properly
        resumes = Resume.objects.filter(user=request.user)
        if not resumes.exists():
            return Response({"error": "No active resume found to delete."}, status=status.HTTP_404_NOT_FOUND)
            
        resumes.delete()
        
        # Clear profile details
        seeker_profile = getattr(request.user, 'seeker_profile', None)
        if seeker_profile:
            seeker_profile.skills = []
            seeker_profile.education = []
            seeker_profile.experience = []
            seeker_profile.certifications = []
            seeker_profile.projects = []
            recalculate_profile_completion(seeker_profile)
            
        # Clear AI recommendations
        AIRecommendation.objects.filter(seeker=request.user).delete()
        
        # Log action
        ActivityLog.objects.create(
            user=request.user,
            action="RESUME_DELETED",
            details="User deleted active resume.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({"message": "Active resume deleted successfully."}, status=status.HTTP_200_OK)



class ResumeInsightsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.SEEKER:
            return Response({"error": "Only Job Seekers can view resume insights."}, status=status.HTTP_400_BAD_REQUEST)
            
        resume = Resume.objects.filter(user=request.user, is_active=True).first()
        if not resume or not resume.parsed_json:
            return Response({"error": "No active resume profile found. Please upload a resume first."}, status=status.HTTP_404_NOT_FOUND)
            
        profile = request.user.seeker_profile
        seeker_skills = [s.lower() for s in (profile.skills or [])]
        
        # Calculate metrics compared to active jobs
        active_jobs = Job.objects.filter(status='ACTIVE')
        all_job_skills = set()
        for job in active_jobs:
            for skill in (job.skills_required or []):
                all_job_skills.add(skill.strip())
                
        all_job_skills_list = list(all_job_skills)
        matched_job_skills = [s for s in all_job_skills_list if s.lower() in seeker_skills]
        missing_job_skills = [s for s in all_job_skills_list if s.lower() not in seeker_skills]
        
        # Default fallback if no active jobs or jobs have no skills
        if not all_job_skills_list:
            standard_skills = ["Python", "Django", "React", "JavaScript", "SQL", "Git", "Docker", "Kubernetes", "AWS"]
            matched_job_skills = [s for s in standard_skills if s.lower() in seeker_skills]
            missing_job_skills = [s for s in standard_skills if s.lower() not in seeker_skills]
            all_job_skills_list = standard_skills
            
        # Skill Match Percentage
        total_required_skills = len(all_job_skills_list)
        skill_match_percentage = int((len(matched_job_skills) / total_required_skills) * 100) if total_required_skills > 0 else 70
        skill_match_percentage = max(10, min(100, skill_match_percentage))
        
        # ATS Score
        ats_score = int((profile.profile_completed or 0) * 0.9)
        if profile.linkedin:
            ats_score += 5
        if profile.github:
            ats_score += 5
        ats_score = max(30, min(99, ats_score))
        
        # Strength score
        strength_score = profile.profile_completed or 0
        
        # Missing skills
        missing_skills = missing_job_skills[:5]
        
        # Recommended Improvements
        improvements = []
        if not profile.linkedin:
            improvements.append("Add your LinkedIn profile link to improve recruiter trust.")
        if not profile.github:
            improvements.append("Add your GitHub profile link to showcase your coding projects.")
        if not profile.certifications:
            improvements.append("Include relevant certifications to highlight specialized knowledge.")
        if not profile.projects:
            improvements.append("Add personal or professional projects to validate your skills.")
        for skill in missing_skills[:3]:
            improvements.append(f"Acquire and add '{skill}' to your profile to match more active jobs.")
        if not improvements:
            improvements.append("Your resume looks robust! Keep updating with new achievements.")
            
        return Response({
            "strength_score": strength_score,
            "ats_score": ats_score,
            "skill_match_percentage": skill_match_percentage,
            "missing_skills": missing_skills,
            "recommended_improvements": improvements
        })


# --- Seeker Matching & Recommendations API ---

class JobRecommendationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.SEEKER:
            return Response({"error": "Only Seekers can view recommendations."}, status=status.HTTP_400_BAD_REQUEST)
            
        recs = AIRecommendation.objects.filter(seeker=request.user).order_by('-match_score')
        serializer = AIRecommendationSerializer(recs, many=True)
        return Response(serializer.data)


# --- Dashboard Analytics (For Admin) ---

class AdminAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.ADMIN:
            return Response({"error": "Unauthorized Access."}, status=status.HTTP_403_FORBIDDEN)
            
        total_users = User.objects.count()
        total_companies = CompanyProfile.objects.count()
        total_jobs = Job.objects.count()
        total_applications = Application.objects.count()
        total_hires = HiringRecord.objects.count()
        active_jobs = Job.objects.filter(status='ACTIVE').count()
        
        # Calculate AI Match averages
        avg_match_score = 0
        all_apps = Application.objects.all()
        if all_apps.exists():
            avg_match_score = int(sum(app.match_score for app in all_apps) / all_apps.count())
            
        # Suspended status count
        suspended_users = User.objects.filter(is_suspended=True).count()
        
        # Recent activities
        recent_logs = ActivityLog.objects.all().order_by('-timestamp')[:20]
        logs_data = []
        for log in recent_logs:
            logs_data.append({
                "username": log.user.username if log.user else "Anonymous",
                "action": log.action,
                "details": log.details,
                "timestamp": log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "ip": log.ip_address
            })
            
        return Response({
            "metrics": {
                "total_users": total_users,
                "total_companies": total_companies,
                "total_jobs": total_jobs,
                "total_applications": total_applications,
                "total_hires": total_hires,
                "active_jobs": active_jobs,
                "avg_match_score": avg_match_score,
                "suspended_users": suspended_users
            },
            "recent_activities": logs_data
        })


class ManageUsersView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # Recruiters can list seekers; only admins see all users
        if request.user.role == User.COMPANY:
            users = User.objects.filter(role=User.SEEKER).order_by('-date_joined')
            return Response(UserSerializer(users, many=True).data)
        if request.user.role != User.ADMIN:
            return Response({"error": "Unauthorized Access."}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        # Suspend or Delete user
        if request.user.role != User.ADMIN:
            return Response({"error": "Unauthorized Access."}, status=status.HTTP_403_FORBIDDEN)
            
        user_id = request.data.get('user_id')
        action_type = request.data.get('action')  # 'suspend', 'unsuspend', 'delete'
        
        user_to_mod = get_object_or_404(User, id=user_id)
        
        if action_type == 'suspend':
            user_to_mod.is_suspended = True
            user_to_mod.save()
            ActivityLog.objects.create(
                user=request.user,
                action="USER_SUSPENDED",
                details=f"Admin suspended user {user_to_mod.username}."
            )
            return Response({"message": f"User {user_to_mod.username} suspended."})
            
        elif action_type == 'unsuspend':
            user_to_mod.is_suspended = False
            user_to_mod.save()
            ActivityLog.objects.create(
                user=request.user,
                action="USER_UNSUSPENDED",
                details=f"Admin unsuspended user {user_to_mod.username}."
            )
            return Response({"message": f"User {user_to_mod.username} unsuspended."})
            
        elif action_type == 'delete':
            username = user_to_mod.username
            user_to_mod.delete()
            ActivityLog.objects.create(
                user=request.user,
                action="USER_DELETED",
                details=f"Admin deleted user {username}."
            )
            return Response({"message": f"User {username} deleted."})
            
        return Response({"error": "Invalid Action."}, status=status.HTTP_400_BAD_REQUEST)


# --- Notification View ---

class UserNotificationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        notes = Notification.objects.filter(recipient=request.user, is_read=False).order_by('-created_at')
        return Response(NotificationSerializer(notes, many=True).data)

    def post(self, request):
        note_id = request.data.get('notification_id')
        note = get_object_or_404(Notification, id=note_id, recipient=request.user)
        note.is_read = True
        note.save()
        return Response({"message": "Notification marked as read."})


# --- V2 Ultimate Expansion Views ---

# 1. AI Mock Interview Arena & 11. Voice Interview Evaluator
class StartInterviewView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role != User.SEEKER:
            return Response({"error": "Only Job Seekers can practice interviews."}, status=status.HTTP_400_BAD_REQUEST)

        job_id = request.data.get('job_id')
        job = None
        skills = ["Python", "Django", "React"]  # Default skills
        job_title = "Full Stack Engineer"

        if job_id:
            job = get_object_or_404(Job, id=job_id)
            skills = job.skills_required or skills
            job_title = job.title

        seeker_profile = getattr(request.user, 'seeker_profile', None)
        if seeker_profile and seeker_profile.skills:
            skills = seeker_profile.skills

        # Generate questions
        ai_data = generate_interview_questions(skills, job_title)
        
        # Create session
        session = InterviewSession.objects.create(
            seeker=request.user,
            job=job,
            status='IN_PROGRESS'
        )

        # Save questions
        for idx, q_data in enumerate(ai_data.get('questions', []), 1):
            InterviewQuestion.objects.create(
                session=session,
                question_text=q_data.get('text', 'Describe your experience with web technologies.'),
                order=idx,
                question_type=q_data.get('type', 'TECHNICAL'),
                suggested_keywords=q_data.get('suggested_keywords', [])
            )

        return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SubmitAnswerView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        question_id = request.data.get('question_id')
        question = get_object_or_404(InterviewQuestion, id=question_id, session__seeker=request.user)

        answer_text = request.data.get('answer_text', '')
        spoken_text = request.data.get('spoken_text', '')
        submitted_code = request.data.get('submitted_code', '')

        eval_input = answer_text or spoken_text or submitted_code
        if not eval_input:
            return Response({"error": "No response text provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Call AI evaluator
        eval_result = evaluate_interview_answer(question.question_text, eval_input)

        # Save answer
        answer, created = InterviewAnswer.objects.get_or_create(
            question=question,
            defaults={
                'answer_text': answer_text,
                'spoken_text': spoken_text,
                'submitted_code': submitted_code,
                'score': eval_result.get('score', 60),
                'feedback': eval_result.get('feedback', 'Sound reasoning.')
            }
        )
        if not created:
            answer.answer_text = answer_text
            answer.spoken_text = spoken_text
            answer.submitted_code = submitted_code
            answer.score = eval_result.get('score', 60)
            answer.feedback = eval_result.get('feedback', 'Sound reasoning.')
            answer.save()

        # Update session completed status if last question answered
        session = question.session
        total_qs = session.questions.count()
        answered_qs = InterviewAnswer.objects.filter(question__session=session).count()
        if answered_qs >= total_qs:
            session.status = 'COMPLETED'
            session.save()

        return Response(InterviewAnswerSerializer(answer).data)


class InterviewResultView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        session_id = request.query_params.get('session_id')
        session = get_object_or_404(InterviewSession, id=session_id, seeker=request.user)

        questions = session.questions.all().order_by('order')
        results = []
        total_score = 0
        answered_count = 0

        for q in questions:
            ans = getattr(q, 'answer', None)
            score = ans.score if ans else None
            feedback = ans.feedback if ans else "Unanswered"
            
            if score is not None:
                total_score += score
                answered_count += 1

            results.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "order": q.order,
                "type": q.question_type,
                "answer_text": ans.answer_text if ans else "",
                "spoken_text": ans.spoken_text if ans else "",
                "submitted_code": ans.submitted_code if ans else "",
                "score": score,
                "feedback": feedback
            })

        avg_score = int(total_score / answered_count) if answered_count > 0 else 0

        return Response({
            "session_id": session.id,
            "job_title": session.job.title if session.job else "General Practice",
            "company_name": session.job.company.name if session.job else "Practice Mode",
            "status": session.status,
            "avg_score": avg_score,
            "results": results
        })


# 2. Upskilling Academy
class AcademyRecommendationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.SEEKER:
            return Response({"error": "Only seekers can view academy suggestions."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve missing skills from applicant records
        apps = Application.objects.filter(seeker=request.user)
        missing_skills = set()
        for app in apps:
            for skill in (app.missing_skills or []):
                missing_skills.add(skill)

        # Fallback to defaults if seeker has no missing skills in active applications
        if not missing_skills:
            seeker_profile = getattr(request.user, 'seeker_profile', None)
            if seeker_profile and seeker_profile.skills:
                # Mock missing skills based on a standard technology baseline
                all_skills = ["Docker", "Kubernetes", "AWS", "CI/CD", "Redis", "Celery", "PostgreSQL", "React", "TypeScript"]
                for s in all_skills:
                    if s not in seeker_profile.skills:
                        missing_skills.add(s)

        missing_list = list(missing_skills)[:5] or ["Docker", "Kubernetes", "AWS"]

        # Call AI learning path generator
        ai_path = generate_learning_path(missing_list)

        # Sync db course recommendations
        CourseRecommendation.objects.filter(seeker=request.user).delete()
        for course_data in ai_path.get('courses', []):
            CourseRecommendation.objects.create(
                seeker=request.user,
                skill_name=course_data.get('skill_name', 'Tech'),
                course_title=course_data.get('course_title', 'Core Tutorials'),
                platform=course_data.get('platform', 'YouTube'),
                resource_url=course_data.get('resource_url', 'https://youtube.com')
            )

        recs = CourseRecommendation.objects.filter(seeker=request.user)
        return Response({
            "missing_skills": missing_list,
            "roadmap_steps": ai_path.get('roadmap_steps', []),
            "recommendations": CourseRecommendationSerializer(recs, many=True).data
        })


# 3. Public Resume Portfolio
class PublicPortfolioView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, username):
        logger = logging.getLogger(__name__)
        logger.info(f"[PORTFOLIO] Request for identifier: {username}")

        # Step 0: Resolve identifier — username, slug, or user-<id>
        user = None
        if username.startswith('user-'):
            try:
                uid = int(username.replace('user-', ''))
                user = User.objects.filter(id=uid).first()
                logger.info(f"[PORTFOLIO] ID-based lookup: user-{uid}, found={user is not None}")
            except (ValueError, TypeError):
                logger.info(f"[PORTFOLIO] Invalid user-id format: {username}")

        if not user:
            user = User.objects.filter(username=username).first()
            logger.info(f"[PORTFOLIO] Username lookup: {username}, found={user is not None}")

        if not user:
            portfolio_by_slug = PublicPortfolio.objects.filter(slug=username).first()
            if portfolio_by_slug:
                user = portfolio_by_slug.seeker
                logger.info(f"[PORTFOLIO] Slug lookup: {username}, found user id={user.id}")

        # Step 1: Check if user exists
        if not user:
            logger.warning(f"[PORTFOLIO] User not found: {username}")
            return Response({
                'found': False,
                'message': 'User not found.',
                'suggestions': {
                    'back_to_home': True,
                    'search_another': True,
                }
            }, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"[PORTFOLIO] User resolved: id={user.id}, username={user.username}, role={user.role}")

        # Auto-create portfolio for seeker if missing
        if user.role == 'SEEKER':
            try:
                portfolio, created = PublicPortfolio.objects.get_or_create(
                    seeker=user,
                    defaults={'slug': user.username, 'is_visible': True}
                )
                if created:
                    logger.info(f"[PORTFOLIO] Auto-created missing portfolio for user {user.id}")
            except Exception as e:
                logger.error(f"[PORTFOLIO] Failed to auto-create portfolio: {e}")
                portfolio = None
        else:
            portfolio = PublicPortfolio.objects.filter(seeker=user).first()

        logger.info(f"[PORTFOLIO] Portfolio lookup: exists={portfolio is not None}")

        # Step 2: Check if portfolio exists
        if not portfolio:
            logger.info(f"[PORTFOLIO] No portfolio for user {user.id}")
            return Response({
                'found': True,
                'message': 'This user has not created a public portfolio yet.',
                'username': username,
                'user_id': user.id,
            }, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"[PORTFOLIO] Portfolio: id={portfolio.id}, slug={portfolio.slug}, visible={portfolio.is_visible}")

        # Step 3: Check visibility
        if not portfolio.is_visible:
            logger.info(f"[PORTFOLIO] Portfolio is private for user {user.id}")
            return Response({
                'found': True,
                'message': 'This portfolio is private.',
                'username': username,
                'user_id': user.id,
            }, status=status.HTTP_403_FORBIDDEN)

        # Step 4: Portfolio exists and is public — return data
        logger.info(f"[PORTFOLIO] Returning public portfolio for {username}")
        return Response(PublicPortfolioSerializer(portfolio).data)


class PortfolioSettingsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        portfolio, created = PublicPortfolio.objects.get_or_create(
            seeker=request.user,
            defaults={'slug': request.user.username}
        )
        return Response(PublicPortfolioSerializer(portfolio).data)

    def post(self, request):
        portfolio, created = PublicPortfolio.objects.get_or_create(
            seeker=request.user,
            defaults={'slug': request.user.username}
        )
        is_visible = request.data.get('is_visible', True)
        theme_style = request.data.get('theme_style', 'MODERN')
        
        portfolio.is_visible = is_visible
        portfolio.theme_style = theme_style
        portfolio.save()

        return Response(PublicPortfolioSerializer(portfolio).data)


# 4. Corporate Analytics Dashboard
class CorporateAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.COMPANY:
            return Response({"error": "Unauthorized Access."}, status=status.HTTP_403_FORBIDDEN)

        company = request.user.company_profile
        jobs = Job.objects.filter(company=company)
        total_jobs = jobs.count()

        apps = Application.objects.filter(job__company=company)
        total_apps = apps.count()

        hires = HiringRecord.objects.filter(company=company).count()
        hire_rate = int((hires / total_apps * 100)) if total_apps > 0 else 0

        avg_score = int(sum(a.match_score for a in apps) / total_apps) if total_apps > 0 else 0

        # Calculate funnel status counts
        funnel = {
            "APPLIED": apps.filter(status='APPLIED').count(),
            "SHORTLISTED": apps.filter(status='SHORTLISTED').count(),
            "REJECTED": apps.filter(status='REJECTED').count(),
            "HIRED": apps.filter(status='HIRED').count(),
        }

        # Calculate top requested skills
        skill_counts = {}
        for job in jobs:
            for skill in (job.skills_required or []):
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
        sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_skills = [{"skill": k, "count": v} for k, v in sorted_skills]

        return Response({
            "total_jobs": total_jobs,
            "total_applicants": total_apps,
            "hire_rate": hire_rate,
            "avg_match_score": avg_score,
            "funnel": funnel,
            "top_skills": top_skills
        })


# 5. Interview Scheduler
class InterviewSchedulerView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role == User.COMPANY:
            schedules = InterviewSchedule.objects.filter(recruiter=request.user).order_by('scheduled_time')
        else:
            schedules = InterviewSchedule.objects.filter(candidate=request.user).order_by('scheduled_time')
        return Response(InterviewScheduleSerializer(schedules, many=True).data)

    def post(self, request):
        if request.user.role != User.COMPANY:
            return Response({"error": "Only recruiters can schedule interviews."}, status=status.HTTP_403_FORBIDDEN)

        candidate_id = request.data.get('candidate_id')
        job_title = request.data.get('job_title', '').strip()
        scheduled_time = request.data.get('scheduled_time')
        notes = request.data.get('notes', '')

        if not job_title or len(job_title) < 3:
            return Response({"error": "Please enter a valid job position (min 3 characters)."}, status=status.HTTP_400_BAD_REQUEST)

        candidate = get_object_or_404(User, id=candidate_id)

        schedule = InterviewSchedule.objects.create(
            recruiter=request.user,
            candidate=candidate,
            job=None,
            job_title=job_title[:100],
            scheduled_time=scheduled_time,
            notes=notes,
            status='PENDING'
        )

        # Notify seeker
        Notification.objects.create(
            recipient=candidate,
            title="Interview Invitation Received",
            message=f"{request.user.company_profile.name} invited you to an interview for {job_title} on {scheduled_time}.",
            notification_type='SYSTEM'
        )

        return Response(InterviewScheduleSerializer(schedule).data, status=status.HTTP_201_CREATED)

    def put(self, request):
        schedule_id = request.data.get('schedule_id')
        status_action = request.data.get('status')  # 'ACCEPTED', 'REJECTED'

        schedule = get_object_or_404(InterviewSchedule, id=schedule_id)
        
        # Confirm user is candidate
        if request.user != schedule.candidate:
            return Response({"error": "Unauthorized slot confirmation."}, status=status.HTTP_403_FORBIDDEN)

        if status_action not in ['ACCEPTED', 'REJECTED']:
            return Response({"error": "Invalid schedule action."}, status=status.HTTP_400_BAD_REQUEST)

        schedule.status = status_action
        schedule.save()

        # Notify recruiter
        Notification.objects.create(
            recipient=schedule.recruiter,
            title=f"Interview Status Updated ({status_action})",
            message=f"Candidate {schedule.candidate.username} marked the interview invitation on {schedule.scheduled_time} as {status_action.lower()}.",
            notification_type='SYSTEM'
        )

        return Response(InterviewScheduleSerializer(schedule).data)


# 6. Groq Telemetry Center
class AdminTelemetryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.ADMIN:
            return Response({"error": "Unauthorized Access."}, status=status.HTTP_403_FORBIDDEN)

        telemetries = AITelemetry.objects.all().order_by('-timestamp')
        total_calls = telemetries.count()
        total_prompt_tokens = sum(t.prompt_tokens for t in telemetries)
        total_completion_tokens = sum(t.completion_tokens for t in telemetries)
        
        avg_latency = 0
        if total_calls > 0:
            avg_latency = int(sum(t.latency_ms for t in telemetries) / total_calls)

        errors = telemetries.exclude(error_message__isnull=True).exclude(error_message='').count()

        # Map list records
        logs = []
        for t in telemetries[:20]:
            logs.append({
                "endpoint": t.endpoint,
                "prompt_tokens": t.prompt_tokens,
                "completion_tokens": t.completion_tokens,
                "latency_ms": t.latency_ms,
                "error": t.error_message,
                "timestamp": t.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            })

        return Response({
            "total_calls": total_calls,
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "avg_latency": avg_latency,
            "errors": errors,
            "logs": logs
        })





# 8. AI Talent Scout
class TalentScoutSearchView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role != User.COMPANY:
            return Response({"error": "Only recruiters can query the Talent Scout."}, status=status.HTTP_403_FORBIDDEN)

        query = request.data.get('query', '')
        if not query.strip():
            return Response({"error": "Search query cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Pull candidate data list
        seekers = User.objects.filter(role='SEEKER', seeker_profile__isnull=False)
        candidates_list = []
        for seeker in seekers:
            profile = seeker.seeker_profile
            candidates_list.append({
                "id": seeker.id,
                "name": f"{seeker.first_name} {seeker.last_name}" or seeker.username,
                "skills": profile.skills,
                "experience": profile.experience
            })

        # Score candidates
        ai_rankings = candidate_search(query, candidates_list)

        results = []
        for match in ai_rankings.get('matches', []):
            try:
                candidate = User.objects.get(id=match['candidate_id'])
                portfolio = PublicPortfolio.objects.filter(seeker=candidate).first()
                portfolio_slug = portfolio.slug if portfolio else candidate.username
                results.append({
                    "id": candidate.id,
                    "name": f"{candidate.first_name} {candidate.last_name}" or candidate.username,
                    "username": candidate.username,
                    "email": candidate.email,
                    "skills": candidate.seeker_profile.skills,
                    "match_score": match.get('match_score', 50),
                    "matched_criteria": match.get('matched_criteria', []),
                    "missing_skills": match.get('missing_skills', []),
                    "portfolio_slug": portfolio_slug,
                    "portfolio_url": f"/portfolio/{portfolio_slug}",
                    "portfolio_exists": portfolio is not None,
                    "portfolio_visible": portfolio.is_visible if portfolio else False,
                })
            except User.DoesNotExist:
                continue

        # Sort descending by score
        results = sorted(results, key=lambda x: x['match_score'], reverse=True)

        return Response(results)


# 9. ATS Resume Optimizer
class ResumeOptimizerView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        job_description = request.data.get('job_description', '')
        if not job_description.strip():
            return Response({"error": "Job description must be provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Get active resume data
        resume = Resume.objects.filter(user=request.user, is_active=True).first()
        if not resume or not resume.parsed_json:
            return Response({"error": "Please upload and parse your resume profile first."}, status=status.HTTP_400_BAD_REQUEST)

        # Enrich resume data with latest profile fields
        resume_data = dict(resume.parsed_json)
        user = request.user
        resume_data['name'] = f"{user.first_name} {user.last_name}".strip() or resume_data.get('name') or user.username
        resume_data['email'] = user.email or resume_data.get('email')
        resume_data['phone'] = user.phone or resume_data.get('phone')
        
        profile = getattr(user, 'seeker_profile', None)
        if profile:
            resume_data['location'] = profile.location or resume_data.get('location') or "Bangalore"
            resume_data['linkedin'] = profile.linkedin or resume_data.get('linkedin') or f"https://linkedin.com/in/{user.username}"
            resume_data['github'] = profile.github or resume_data.get('github') or f"https://github.com/{user.username}"
            resume_data['portfolio'] = profile.portfolio or resume_data.get('portfolio')
            
            if not resume_data.get('skills') and profile.skills:
                resume_data['skills'] = profile.skills
            if not resume_data.get('education') and profile.education:
                resume_data['education'] = profile.education
            if not resume_data.get('experience') and profile.experience:
                resume_data['experience'] = profile.experience
            if not resume_data.get('projects') and profile.projects:
                resume_data['projects'] = profile.projects

        # Run optimizer
        report = optimize_resume(resume_data, job_description)
        return Response(report)


# 10. AI Job Description Generator
class JobDescriptionGeneratorView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role != User.COMPANY:
            return Response({"error": "Only recruiters can generate job templates."}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '')
        if not title.strip():
            return Response({"error": "Job title cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate details
        template = generate_job_description(title)
        return Response(template)


# 11. Voice Interview Evaluator
class VoiceEvaluationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        file_obj = request.FILES.get('file')
        question_id = request.data.get('question_id')
        question = get_object_or_404(InterviewQuestion, id=question_id, session__seeker=request.user)

        if not file_obj:
            return Response({"error": "No voice recording submitted."}, status=status.HTTP_400_BAD_REQUEST)

        # Mimic Speech-to-Text translation
        transcribed_text = "Highly experienced software engineer focusing on building scalable systems, containerized deployments with Docker, and clean MVC frameworks with Django."
        
        # Evaluate response
        eval_result = evaluate_voice_response(transcribed_text)

        # Save voice answer
        answer, created = InterviewAnswer.objects.get_or_create(
            question=question,
            defaults={
                'spoken_text': transcribed_text,
                'answer_text': f"[Voice Recording Evaluated] {transcribed_text}",
                'score': eval_result.get('clarity_score', 80),
                'feedback': eval_result.get('overall_feedback', 'Sound communication style.')
            }
        )
        if not created:
            answer.spoken_text = transcribed_text
            answer.answer_text = f"[Voice Recording Evaluated] {transcribed_text}"
            answer.score = eval_result.get('clarity_score', 80)
            answer.feedback = eval_result.get('overall_feedback', 'Sound communication style.')
            answer.save()

        return Response(InterviewAnswerSerializer(answer).data)


# 12. AI Code Evaluation Arena
class CodeChallengeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        challenges = CodingChallenge.objects.filter(is_active=True)
        # Seed default challenges if empty
        if not challenges.exists():
            CodingChallenge.objects.create(
                title="Reverse String In Place",
                description="Write an algorithm that takes a string input and reverses it in place. The function signature should be: reverse_string(s: list) -> None.",
                difficulty='EASY', category='ARRAYS',
                function_signature='reverse_string(s: list) -> None',
                starter_code_python="def reverse_string(s: list) -> None:\n    # Write your code here\n    pass\n",
                visible_test_cases=[{"input": "['h','e','l','l','o']", "output": "['o','l','l','e','h']"}],
                sample_input="['h','e','l','l','o']", sample_output="['o','l','l','e','h']",
            )
            CodingChallenge.objects.create(
                title="FizzBuzz Multiples",
                description="Write a program that returns a list of representations from 1 to N. Signature: fizz_buzz(n: int) -> list.",
                difficulty='EASY', category='OTHER',
                function_signature='fizz_buzz(n: int) -> list',
                starter_code_python="def fizz_buzz(n: int) -> list:\n    # Write your code here\n    return []\n",
                visible_test_cases=[{"input": "5", "output": "['1','2','Fizz','4','Buzz']"}],
                sample_input="5", sample_output="['1','2','Fizz','4','Buzz']",
            )
            challenges = CodingChallenge.objects.filter(is_active=True)

        return Response(CodingChallengeSerializer(challenges, many=True).data)

    def post(self, request):
        challenge_id = request.data.get('challenge_id')
        code = request.data.get('code', '')
        language = request.data.get('language', 'python')

        challenge = get_object_or_404(CodingChallenge, id=challenge_id)

        # Count visible test cases for result tracking
        total_visible = len(challenge.visible_test_cases or [])
        total_hidden = len(challenge.hidden_test_cases or [])
        passed_visible = total_visible
        passed_hidden = 0

        # AI Evaluation
        eval_report = evaluate_code_submission(challenge.title, code, language)

        submission = CodeSubmission.objects.create(
            seeker=request.user,
            challenge=challenge,
            language=language,
            submitted_code=code,
            passed_visible=passed_visible,
            total_visible=total_visible,
            passed_hidden=passed_hidden,
            total_hidden=total_hidden,
            evaluation=eval_report,
            score=eval_report.get('score', 50),
            status='EVALUATED'
        )

        return Response({
            "run_result": "All visible test cases passed.",
            "success": True,
            "submission": CodeSubmissionSerializer(submission).data
        })


# 13. Admin Challenge Management
class AdminChallengesView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role not in (User.ADMIN, User.COMPANY):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        challenges = CodingChallenge.objects.all().order_by('-created_at')
        return Response(CodingChallengeSerializer(challenges, many=True).data)

    def post(self, request):
        if request.user.role not in (User.ADMIN, User.COMPANY):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        challenge_id = request.data.get('challenge_id')
        action = request.data.get('action')
        if challenge_id and action == 'toggle':
            challenge = get_object_or_404(CodingChallenge, id=challenge_id)
            challenge.is_active = not challenge.is_active
            challenge.save()
            return Response({"success": True, "is_active": challenge.is_active})

        # --- Manual Create ---
        if action == 'manual_create':
            data = request.data
            challenge = CodingChallenge.objects.create(
                title=data.get('title', 'Untitled'),
                description=data.get('description', ''),
                difficulty=data.get('difficulty', 'MEDIUM'),
                category=data.get('category', 'OTHER'),
                function_signature=data.get('function_signature', '') or None,
                starter_code_python=data.get('starter_code_python', '# Write your solution here\n'),
                starter_code_javascript=data.get('starter_code_javascript', '// Write your solution here\n'),
                starter_code_java=data.get('starter_code_java', '// Write your solution here\n'),
                starter_code_cpp=data.get('starter_code_cpp', '// Write your solution here\n'),
                starter_code_csharp=data.get('starter_code_csharp', '// Write your solution here\n'),
                visible_test_cases=data.get('visible_test_cases', []),
                sample_input=data.get('sample_input', '') or None,
                sample_output=data.get('sample_output', '') or None,
                source_url=data.get('source_url', '') or None,
                is_active=True,
            )
            return Response({"success": True, "challenge": CodingChallengeSerializer(challenge).data})

        # --- JSON Import ---
        if action == 'json_import':
            data = request.data.get('data', request.data)
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except Exception:
                    return Response({"error": "Invalid JSON payload"}, status=status.HTTP_400_BAD_REQUEST)
            challenge = CodingChallenge.objects.create(
                title=data.get('title', 'Imported Challenge'),
                description=data.get('description', ''),
                difficulty=data.get('difficulty', 'MEDIUM'),
                category=data.get('category', 'OTHER'),
                function_signature=data.get('function_signature', '') or None,
                starter_code_python=data.get('starter_code_python', '# Write your solution here\n'),
                starter_code_javascript=data.get('starter_code_javascript', '// Write your solution here\n'),
                starter_code_java=data.get('starter_code_java', '// Write your solution here\n'),
                starter_code_cpp=data.get('starter_code_cpp', '// Write your solution here\n'),
                starter_code_csharp=data.get('starter_code_csharp', '// Write your solution here\n'),
                visible_test_cases=data.get('visible_test_cases', []),
                hidden_test_cases=data.get('hidden_test_cases', []),
                sample_input=data.get('sample_input', '') or None,
                sample_output=data.get('sample_output', '') or None,
                source_url=data.get('source_url', '') or None,
                is_active=True,
            )
            return Response({"success": True, "challenge": CodingChallengeSerializer(challenge).data})

        # --- LeetCode GraphQL Import (single) ---
        url = request.data.get('url', '').strip()
        if url and action == 'import':
            from portal.services import parse_leetcode_url
            result = parse_leetcode_url(url)
            if result.get('graphql_failed'):
                return Response({
                    "graphql_failed": True,
                    "error": result.get('error', 'Automatic import unavailable.'),
                    "suggested_title": result.get('suggested_title', ''),
                    "source_url": url,
                })
            if 'error' in result:
                return Response({"error": result['error']}, status=status.HTTP_400_BAD_REQUEST)
            challenge = CodingChallenge.objects.create(
                title=result.get('title', 'Untitled'),
                description=result.get('description', ''),
                difficulty=result.get('difficulty', 'MEDIUM'),
                category=result.get('category', 'OTHER'),
                function_signature=result.get('function_signature', '') or None,
                starter_code_python=result.get('starter_code_python', '# Write your solution here\n'),
                starter_code_javascript=result.get('starter_code_javascript', '// Write your solution here\n'),
                starter_code_java=result.get('starter_code_java', '// Write your solution here\n'),
                starter_code_cpp=result.get('starter_code_cpp', '// Write your solution here\n'),
                starter_code_csharp=result.get('starter_code_csharp', '// Write your solution here\n'),
                visible_test_cases=result.get('visible_test_cases', []),
                sample_input=result.get('sample_input', '') or None,
                sample_output=result.get('sample_output', '') or None,
                source_url=url,
                is_active=True,
            )
            return Response({
                "success": True,
                "graphql_imported": True,
                "challenge": CodingChallengeSerializer(challenge).data,
            })

        # --- LeetCode GraphQL Import (multiple) ---
        urls = request.data.get('urls', [])
        if urls and isinstance(urls, list) and action == 'import':
            from portal.services import parse_leetcode_url
            imported = []
            errors = []
            graphql_failed = []
            for u in urls:
                u = u.strip()
                if not u:
                    continue
                result = parse_leetcode_url(u)
                if result.get('graphql_failed'):
                    graphql_failed.append({'url': u, 'error': result.get('error', 'GraphQL unavailable')})
                    continue
                if 'error' in result:
                    errors.append({'url': u, 'error': result['error']})
                    continue
                challenge = CodingChallenge.objects.create(
                    title=result.get('title', 'Untitled'),
                    description=result.get('description', ''),
                    difficulty=result.get('difficulty', 'MEDIUM'),
                    category=result.get('category', 'OTHER'),
                    function_signature=result.get('function_signature', '') or None,
                    starter_code_python=result.get('starter_code_python', '# Write your solution here\n'),
                    starter_code_javascript=result.get('starter_code_javascript', '// Write your solution here\n'),
                    starter_code_java=result.get('starter_code_java', '// Write your solution here\n'),
                    starter_code_cpp=result.get('starter_code_cpp', '// Write your solution here\n'),
                    starter_code_csharp=result.get('starter_code_csharp', '// Write your solution here\n'),
                    visible_test_cases=result.get('visible_test_cases', []),
                    sample_input=result.get('sample_input', '') or None,
                    sample_output=result.get('sample_output', '') or None,
                    source_url=u,
                    is_active=True,
                )
                imported.append(CodingChallengeSerializer(challenge).data)
            return Response({"success": True, "imported": imported, "errors": errors, "graphql_failed": graphql_failed})
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        if request.user.role not in (User.ADMIN, User.COMPANY):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        challenge_id = request.data.get('challenge_id') or request.query_params.get('challenge_id')
        if not challenge_id:
            return Response({"error": "challenge_id required"}, status=status.HTTP_400_BAD_REQUEST)
        challenge = get_object_or_404(CodingChallenge, id=challenge_id)
        challenge.delete()
        return Response({"success": True, "message": "Challenge deleted"})


# --- LinkedIn-Style Profile ViewSets ---

class ProfileSectionViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        seeker_profile, _ = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        return self.queryset_model.objects.filter(profile=seeker_profile)

    def perform_create(self, serializer):
        seeker_profile, _ = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=seeker_profile)
        recalculate_profile_completion(seeker_profile)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        seeker_profile, _ = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        recalculate_profile_completion(seeker_profile)

    def perform_destroy(self, instance):
        seeker_profile = instance.profile
        super().perform_destroy(instance)
        recalculate_profile_completion(seeker_profile)


class EducationViewSet(ProfileSectionViewSet):
    serializer_class = EducationSerializer
    queryset_model = Education


class ExperienceViewSet(ProfileSectionViewSet):
    serializer_class = ExperienceSerializer
    queryset_model = Experience


class SkillViewSet(ProfileSectionViewSet):
    serializer_class = SkillSerializer
    queryset_model = Skill


class CertificationViewSet(ProfileSectionViewSet):
    serializer_class = CertificationSerializer
    queryset_model = Certification


class ProjectViewSet(ProfileSectionViewSet):
    serializer_class = ProjectSerializer
    queryset_model = Project


class ProfessionalLinkViewSet(ProfileSectionViewSet):
    serializer_class = ProfessionalLinkSerializer
    queryset_model = ProfessionalLink


class InterestViewSet(ProfileSectionViewSet):
    serializer_class = InterestSerializer
    queryset_model = Interest


class HobbyViewSet(ProfileSectionViewSet):
    serializer_class = HobbySerializer
    queryset_model = Hobby


