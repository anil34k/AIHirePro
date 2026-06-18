from rest_framework import serializers
from users.models import (
    User, CompanyProfile, JobSeekerProfile,
    Education, Experience, Skill, Certification, Project,
    ProfessionalLink, Interest, Hobby
)
from jobs.models import Job, Application, HiringRecord
from resumes.models import Resume
from core.models import AIRecommendation, Notification, AITelemetry
from interviews.models import InterviewSession, InterviewQuestion, InterviewAnswer
from academy.models import CourseRecommendation
from portfolio.models import PublicPortfolio
from scheduler.models import InterviewSchedule
from code_arena.models import CodingChallenge, CodeSubmission

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'address', 'first_name', 'last_name', 'is_suspended')
        read_only_fields = ('id', 'role', 'is_suspended')


class CompanyProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CompanyProfile
        fields = '__all__'


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'
        read_only_fields = ('profile',)


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'
        read_only_fields = ('profile',)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'
        read_only_fields = ('profile',)


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = '__all__'
        read_only_fields = ('profile',)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('profile',)


class ProfessionalLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalLink
        fields = '__all__'
        read_only_fields = ('profile',)


class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = '__all__'
        read_only_fields = ('profile',)


class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = '__all__'
        read_only_fields = ('profile',)


class JobSeekerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    active_resume = serializers.SerializerMethodField()
    
    # Nested lists
    educations = EducationSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    skills_list = SkillSerializer(many=True, read_only=True)
    certifications_list = CertificationSerializer(many=True, read_only=True)
    projects_list = ProjectSerializer(many=True, read_only=True)
    links_list = ProfessionalLinkSerializer(many=True, read_only=True)
    interests_list = InterestSerializer(many=True, read_only=True)
    hobbies_list = HobbySerializer(many=True, read_only=True)
    
    # Backward compatibility properties
    skills = serializers.ReadOnlyField()
    education = serializers.ReadOnlyField()
    experience = serializers.ReadOnlyField()
    projects = serializers.ReadOnlyField()
    certifications = serializers.ReadOnlyField()
    
    linkedin = serializers.ReadOnlyField()
    github = serializers.ReadOnlyField()
    portfolio = serializers.ReadOnlyField()
    personal_website = serializers.ReadOnlyField()
    resume_website = serializers.ReadOnlyField()
    leetcode = serializers.ReadOnlyField()
    hackerrank = serializers.ReadOnlyField()
    codechef = serializers.ReadOnlyField()
    codeforces = serializers.ReadOnlyField()
    kaggle = serializers.ReadOnlyField()
    behance = serializers.ReadOnlyField()
    dribbble = serializers.ReadOnlyField()
    
    class Meta:
        model = JobSeekerProfile
        fields = '__all__'

    def get_active_resume(self, obj):
        resume = Resume.objects.filter(user=obj.user, is_active=True).first()
        if resume:
            import os
            request = self.context.get('request')
            
            if resume.file:
                file_url = resume.file.url
                if request:
                    file_url = request.build_absolute_uri(file_url)
                else:
                    file_url = f"http://localhost:8000{file_url}"
                
                try:
                    file_size = resume.file.size
                except Exception:
                    file_size = None
                file_name = os.path.basename(resume.file.name)
            else:
                file_url = None
                file_size = 0
                file_name = "demo_resume.pdf"
                
            return {
                'id': resume.id,
                'file_name': file_name,
                'file_url': file_url,
                'uploaded_at': resume.uploaded_at.isoformat(),
                'file_size': file_size,
                'parsed_json': resume.parsed_json,
                'is_active': resume.is_active
            }
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)
    
    # Profile fields (optional at registration)
    company_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    industry = serializers.CharField(required=False, write_only=True, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'phone', 'address', 'first_name', 'last_name', 'company_name', 'industry')
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role')
        company_name = validated_data.pop('company_name', '')
        industry = validated_data.pop('industry', '')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=role,
            phone=validated_data.get('phone', ''),
            address=validated_data.get('address', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(password)
        user.save()
        
        # Auto-create related profiles
        if role == User.COMPANY:
            CompanyProfile.objects.create(
                user=user,
                name=company_name or f"{user.username}'s Company",
                industry=industry,
                contact_email=user.email,
                contact_phone=user.phone
            )
        elif role == User.SEEKER:
            JobSeekerProfile.objects.create(
                user=user
            )
            
        return user


class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo_url = serializers.CharField(source='company.logo_url', read_only=True)
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('company',)


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ('id', 'file', 'parsed_json', 'uploaded_at', 'is_active')
        read_only_fields = ('parsed_json', 'uploaded_at', 'is_active')


class ApplicationSerializer(serializers.ModelSerializer):
    seeker_name = serializers.SerializerMethodField()
    seeker_email = serializers.CharField(source='seeker.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    resume_file = serializers.SerializerMethodField()
    resume_parsed = serializers.JSONField(source='resume.parsed_json', read_only=True)
    candidate_links = serializers.SerializerMethodField()
    presence_analysis = serializers.SerializerMethodField()
    seeker_profile = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('seeker', 'match_score', 'strengths', 'missing_skills')

    def get_seeker_profile(self, obj):
        profile = getattr(obj.seeker, 'seeker_profile', None)
        if profile:
            return JobSeekerProfileSerializer(profile, context=self.context).data
        return None

    def get_seeker_name(self, obj):
        return f"{obj.seeker.first_name} {obj.seeker.last_name}" or obj.seeker.username

    def get_resume_file(self, obj):
        if obj.resume and obj.resume.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.file.url)
            return f"http://localhost:8000{obj.resume.file.url}"
        return None

    def get_candidate_links(self, obj):
        profile = getattr(obj.seeker, 'seeker_profile', None)
        if profile:
            return {
                "linkedin": profile.linkedin,
                "github": profile.github,
                "portfolio": profile.portfolio,
                "personal_website": profile.personal_website,
                "resume_website": profile.resume_website,
                "leetcode": profile.leetcode,
                "hackerrank": profile.hackerrank,
                "codechef": profile.codechef,
                "codeforces": profile.codeforces,
                "kaggle": profile.kaggle,
                "behance": profile.behance,
                "dribbble": profile.dribbble,
            }
        return None

    def get_presence_analysis(self, obj):
        profile = getattr(obj.seeker, 'seeker_profile', None)
        if profile:
            from core.services.ai_service import analyze_professional_presence
            return analyze_professional_presence(
                github_url=profile.github,
                portfolio_url=profile.portfolio,
                skills=profile.skills
            )
        return None


class AIRecommendationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)

    class Meta:
        model = AIRecommendation
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_suspended:
            raise serializers.ValidationError({"detail": "This account has been suspended by the administrator."})
        return data


# --- V2 Expansion Serializers ---

class InterviewAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAnswer
        fields = '__all__'


class InterviewQuestionSerializer(serializers.ModelSerializer):
    answer = InterviewAnswerSerializer(read_only=True)

    class Meta:
        model = InterviewQuestion
        fields = '__all__'


class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)

    class Meta:
        model = InterviewSession
        fields = '__all__'


class CourseRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseRecommendation
        fields = '__all__'


class PublicPortfolioSerializer(serializers.ModelSerializer):
    seeker_name = serializers.SerializerMethodField()
    seeker_email = serializers.CharField(source='seeker.email', read_only=True)
    skills = serializers.JSONField(source='seeker.seeker_profile.skills', read_only=True)
    education = serializers.JSONField(source='seeker.seeker_profile.education', read_only=True)
    experience = serializers.JSONField(source='seeker.seeker_profile.experience', read_only=True)
    certifications = serializers.JSONField(source='seeker.seeker_profile.certifications', read_only=True)
    projects = serializers.JSONField(source='seeker.seeker_profile.projects', read_only=True)

    class Meta:
        model = PublicPortfolio
        fields = '__all__'

    def get_seeker_name(self, obj):
        return f"{obj.seeker.first_name} {obj.seeker.last_name}" or obj.seeker.username


class InterviewScheduleSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    recruiter_name = serializers.SerializerMethodField()
    job_title_display = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSchedule
        fields = '__all__'

    def get_candidate_name(self, obj):
        return f"{obj.candidate.first_name} {obj.candidate.last_name}" or obj.candidate.username

    def get_recruiter_name(self, obj):
        return obj.recruiter.company_profile.name if hasattr(obj.recruiter, 'company_profile') else obj.recruiter.username

    def get_job_title_display(self, obj):
        return obj.job_title or (obj.job.title if obj.job else 'Unknown Position')


class AITelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AITelemetry
        fields = '__all__'


class CodingChallengeSerializer(serializers.ModelSerializer):
    visible_test_cases = serializers.JSONField(read_only=True)
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = CodingChallenge
        fields = '__all__'

    def get_submission_count(self, obj):
        return CodeSubmission.objects.filter(challenge=obj).count()


class CodeSubmissionSerializer(serializers.ModelSerializer):
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)

    class Meta:
        model = CodeSubmission
        fields = '__all__'
