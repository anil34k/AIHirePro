from rest_framework import serializers
from users.models import User, CompanyProfile, JobSeekerProfile
from jobs.models import Job, Application, HiringRecord
from resumes.models import Resume
from core.models import AIRecommendation, Notification, AITelemetry
from interviews.models import InterviewSession, InterviewQuestion, InterviewAnswer
from academy.models import CourseRecommendation
from portfolio.models import PublicPortfolio
from scheduler.models import InterviewSchedule
from chatbot.models import ChatHistory
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


class JobSeekerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = JobSeekerProfile
        fields = '__all__'


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

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('seeker', 'match_score', 'strengths', 'missing_skills')

    def get_seeker_name(self, obj):
        return f"{obj.seeker.first_name} {obj.seeker.last_name}" or obj.seeker.username

    def get_resume_file(self, obj):
        if obj.resume and obj.resume.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.file.url)
            return f"http://localhost:8000{obj.resume.file.url}"
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
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = InterviewSchedule
        fields = '__all__'

    def get_candidate_name(self, obj):
        return f"{obj.candidate.first_name} {obj.candidate.last_name}" or obj.candidate.username

    def get_recruiter_name(self, obj):
        return obj.recruiter.company_profile.name if hasattr(obj.recruiter, 'company_profile') else obj.recruiter.username


class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = '__all__'


class AITelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AITelemetry
        fields = '__all__'


class CodingChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingChallenge
        fields = '__all__'


class CodeSubmissionSerializer(serializers.ModelSerializer):
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)

    class Meta:
        model = CodeSubmission
        fields = '__all__'
