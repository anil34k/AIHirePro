import os
from unittest.mock import patch
from django.urls import reverse
from django.conf import settings
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import User, CompanyProfile, JobSeekerProfile
from jobs.models import Job, Application, HiringRecord
from resumes.models import Resume
from core.models import AIRecommendation, Notification, ActivityLog

class AIHireProQATestSuite(APITestCase):
    def setUp(self):
        # Base valid Seeker credentials
        self.seeker_register_data = {
            "username": "seeker_qa_test",
            "password": "qaPassword123!",
            "email": "seeker_qa@test.com",
            "first_name": "QA",
            "last_name": "Seeker",
            "role": "SEEKER"
        }
        
        # Base valid Recruiter credentials
        self.recruiter_register_data = {
            "username": "recruiter_qa_test",
            "password": "qaPassword123!",
            "email": "recruiter_qa@test.com",
            "first_name": "QA",
            "last_name": "Recruiter",
            "role": "COMPANY",
            "company_name": "QACorp Solutions",
            "industry": "Quality Assurance"
        }

        # Admin user
        self.admin_user = User.objects.create_superuser(
            username="admin_qa",
            email="admin_qa@test.com",
            password="adminpassword123",
            first_name="QA",
            last_name="Admin",
            role="ADMIN"
        )

    def test_phase_2_registration_validation_and_security(self):
        reg_url = reverse('api_register')
        
        # 1. Valid Seeker registration
        res = self.client.post(reg_url, self.seeker_register_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        user = User.objects.get(username="seeker_qa_test")
        self.assertTrue(JobSeekerProfile.objects.filter(user=user).exists())
        
        # 2. Duplicate Username
        res = self.client.post(reg_url, self.seeker_register_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 3. Empty fields check
        bad_data = self.seeker_register_data.copy()
        bad_data['username'] = ""
        res = self.client.post(reg_url, bad_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 4. Invalid Email Format
        bad_data = self.seeker_register_data.copy()
        bad_data['username'] = "unique_username_1"
        bad_data['email'] = "not-an-email"
        res = self.client.post(reg_url, bad_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 5. Security payloads - SQL Injection & XSS in fields
        sec_data = self.seeker_register_data.copy()
        sec_data['username'] = "seeker_sqli"
        sec_data['first_name'] = "' OR 1=1 --"
        sec_data['last_name'] = "<script>alert('XSS')</script>"
        res = self.client.post(reg_url, sec_data, format='json')
        # System should handle inputs as plain data without crashing
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(username="seeker_sqli")
        self.assertEqual(created_user.first_name, "' OR 1=1 --")
        self.assertEqual(created_user.last_name, "<script>alert('XSS')</script>")

    def test_phase_3_login_and_jwt_behavior(self):
        # Register seeker first
        reg_url = reverse('api_register')
        self.client.post(reg_url, self.seeker_register_data, format='json')
        
        login_url = reverse('api_login')
        
        # 1. Invalid Login (wrong password)
        res = self.client.post(login_url, {"username": "seeker_qa_test", "password": "wrongpassword"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 2. Invalid Login (nonexistent user)
        res = self.client.post(login_url, {"username": "nonexistent", "password": "qaPassword123!"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 3. Valid Login
        res = self.client.post(login_url, {"username": "seeker_qa_test", "password": "qaPassword123!"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        
        # 4. Token Refresh
        refresh_url = reverse('api_token_refresh')
        ref_res = self.client.post(refresh_url, {"refresh": res.data['refresh']}, format='json')
        self.assertEqual(ref_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', ref_res.data)

    def test_phase_4_role_based_access_control(self):
        # Register seeker and company recruiter
        reg_url = reverse('api_register')
        self.client.post(reg_url, self.seeker_register_data, format='json')
        
        company_res = self.client.post(reg_url, self.recruiter_register_data, format='json')
        recruiter_token = company_res.data['access']
        
        # Authenticate client as seeker
        seeker_res = self.client.post(reverse('api_login'), {
            "username": "seeker_qa_test",
            "password": "qaPassword123!"
        }, format='json')
        seeker_token = seeker_res.data['access']
        
        # 1. Seeker tries to access Admin Analytics
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        admin_res = self.client.get(reverse('api_admin_analytics'))
        self.assertEqual(admin_res.status_code, status.HTTP_403_FORBIDDEN)
        
        # 2. Seeker tries to manage users
        user_res = self.client.get(reverse('api_admin_users'))
        self.assertEqual(user_res.status_code, status.HTTP_403_FORBIDDEN)
        
        # 3. Recruiter tries to access Admin Analytics
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {recruiter_token}')
        admin_res_r = self.client.get(reverse('api_admin_analytics'))
        self.assertEqual(admin_res_r.status_code, status.HTTP_403_FORBIDDEN)
        
        # 4. Admin tries to access Admin Analytics
        admin_login_res = self.client.post(reverse('api_login'), {
            "username": "admin_qa",
            "password": "adminpassword123"
        }, format='json')
        admin_token = admin_login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        admin_analytics_res = self.client.get(reverse('api_admin_analytics'))
        self.assertEqual(admin_analytics_res.status_code, status.HTTP_200_OK)

    @patch('api.views.logger')
    def test_phase_5_resume_upload_rules(self, mock_logger):
        # Register and login seeker
        reg_url = reverse('api_register')
        seeker_reg = self.client.post(reg_url, self.seeker_register_data, format='json')
        seeker_token = seeker_reg.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        
        upload_url = reverse('api_resume_upload')
        
        # 1. Upload invalid file type (.exe)
        invalid_file = SimpleUploadedFile("malware.exe", b"binary content here", content_type="application/octet-stream")
        res = self.client.post(upload_url, {"file": invalid_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)
        
        # 2. Upload valid PDF with mock text
        corrupted_file = SimpleUploadedFile("resume.pdf", b"corrupted content", content_type="application/pdf")
        res_corrupted = self.client.post(upload_url, {"file": corrupted_file}, format='multipart')
        self.assertEqual(res_corrupted.status_code, status.HTTP_400_BAD_REQUEST)

    def test_phase_8_9_10_11_12_13_recruitment_lifecycle(self):
        # Register Recruiter and Seeker
        reg_url = reverse('api_register')
        rec_reg = self.client.post(reg_url, self.recruiter_register_data, format='json')
        rec_token = rec_reg.data['access']
        
        seeker_reg = self.client.post(reg_url, self.seeker_register_data, format='json')
        seeker_token = seeker_reg.data['access']
        
        # A. Recruiter posts Job A and Job B
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {rec_token}')
        job_url = reverse('job-list')
        
        job_a_data = {
            "title": "Python Django React Developer",
            "description": "Senior position requiring Python, Django and React experience.",
            "skills_required": ["Python", "Django", "React"],
            "experience_required": 3,
            "salary_min": 100000,
            "salary_max": 140000,
            "location": "Remote",
            "employment_type": "FULL_TIME",
            "openings": 1
        }
        res_job_a = self.client.post(job_url, job_a_data, format='json')
        self.assertEqual(res_job_a.status_code, status.HTTP_201_CREATED)
        job_a_id = res_job_a.data['id']
        
        job_b_data = {
            "title": "Java Spring Boot Architect",
            "description": "Enterprise Java systems architect.",
            "skills_required": ["Java", "Spring Boot", "Microservices"],
            "experience_required": 5,
            "salary_min": 120000,
            "salary_max": 160000,
            "location": "New York, NY",
            "employment_type": "FULL_TIME",
            "openings": 1
        }
        res_job_b = self.client.post(job_url, job_b_data, format='json')
        self.assertEqual(res_job_b.status_code, status.HTTP_201_CREATED)
        job_b_id = res_job_b.data['id']
        
        # B. Job Search Verification
        # Unauthenticated search should work
        self.client.credentials()
        search_res = self.client.get(f"{job_url}?search=Django")
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_res.data), 1)
        
        # Filter remote
        remote_res = self.client.get(f"{job_url}?employment_type=FULL_TIME")
        self.assertEqual(remote_res.status_code, status.HTTP_200_OK)
        
        # C. Seeker upload resume and apply to jobs
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        
        # Create user profile and active resume manually in db to avoid PDF parser crash
        user_seeker = User.objects.get(username="seeker_qa_test")
        profile_seeker = JobSeekerProfile.objects.get(user=user_seeker)
        profile_seeker.skills = ["Python", "Django", "React"]
        profile_seeker.save()
        
        resume = Resume.objects.create(
            user=user_seeker,
            file=SimpleUploadedFile("dummy.pdf", b"pdf content"),
            parsed_json={"skills": ["Python", "Django", "React"], "name": "QA Seeker", "email": "seeker_qa@test.com"},
            is_active=True
        )
        
        # Apply for Job A (Match Score should be high because skills match Python/Django/React)
        app_url = reverse('application-list')
        app_res = self.client.post(app_url, {"job": job_a_id}, format='json')
        self.assertEqual(app_res.status_code, status.HTTP_201_CREATED)
        self.assertGreaterEqual(app_res.data['match_score'], 50)
        app_id = app_res.data['id']
        
        # Negative Case: Double Application
        app_res_dup = self.client.post(app_url, {"job": job_a_id}, format='json')
        self.assertEqual(app_res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        
        # D. Recruiter Workflow Actions (View Applicants, Shortlist, Hire)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {rec_token}')
        
        # View applicants
        apps_res = self.client.get(app_url)
        self.assertEqual(apps_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(apps_res.data), 1)
        self.assertEqual(apps_res.data[0]['id'], app_id)
        
        # Shortlist
        shortlist_url = reverse('application-shortlist', kwargs={'pk': app_id})
        shortlist_res = self.client.post(shortlist_url)
        self.assertEqual(shortlist_res.status_code, status.HTTP_200_OK)
        
        # Hire candidate
        hire_url = reverse('application-hire', kwargs={'pk': app_id})
        hire_res = self.client.post(hire_url)
        self.assertEqual(hire_res.status_code, status.HTTP_200_OK)
        
        # Verify db status changed
        application = Application.objects.get(id=app_id)
        self.assertEqual(application.status, 'HIRED')
        self.assertTrue(HiringRecord.objects.filter(job=application.job, seeker=user_seeker).exists())

    def test_phase_15_admin_telemetry_actions(self):
        # Authenticate admin
        admin_login = self.client.post(reverse('api_login'), {
            "username": "admin_qa",
            "password": "adminpassword123"
        }, format='json')
        admin_token = admin_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        
        # 1. Fetch Analytics dashboard
        res = self.client.get(reverse('api_admin_analytics'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('metrics', res.data)
        self.assertIn('recent_activities', res.data)
        
        # 2. View user accounts list
        users_res = self.client.get(reverse('api_admin_users'))
        self.assertEqual(users_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(users_res.data), 1)
        
        # 3. Create dummy seeker to suspend
        dummy_user = User.objects.create_user(
            username="dummy_user",
            password="dummypassword123",
            email="dummy@test.com",
            role="SEEKER"
        )
        
        # 4. Suspend user via Admin Endpoint
        sus_res = self.client.post(reverse('api_admin_users'), {
            "user_id": dummy_user.id,
            "action": "suspend"
        }, format='json')
        self.assertEqual(sus_res.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get(id=dummy_user.id).is_suspended)
        
        # 5. Delete user via Admin Endpoint and verify cascade
        del_res = self.client.post(reverse('api_admin_users'), {
            "user_id": dummy_user.id,
            "action": "delete"
        }, format='json')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=dummy_user.id).exists())

    def test_v2_recruitment_features(self):
        # Test Demo Quick Login
        demo_res = self.client.post(reverse('api_demo_login'), {"role": "SEEKER"}, format='json')
        self.assertEqual(demo_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', demo_res.data)
        self.assertIn('refresh', demo_res.data)
        self.assertEqual(demo_res.data['user']['role'], 'SEEKER')

        # Register Seeker & Recruiter
        reg_url = reverse('api_register')
        seeker_reg = self.client.post(reg_url, {
            "username": "v2_seeker",
            "password": "qaPassword123!",
            "email": "v2_seeker@test.com",
            "role": "SEEKER"
        }, format='json')
        self.assertEqual(seeker_reg.status_code, status.HTTP_201_CREATED)
        seeker_token = seeker_reg.data['access']

        recruiter_reg = self.client.post(reg_url, {
            "username": "v2_recruiter",
            "password": "qaPassword123!",
            "email": "v2_recruiter@test.com",
            "role": "COMPANY",
            "company_name": "V2Corp"
        }, format='json')
        self.assertEqual(recruiter_reg.status_code, status.HTTP_201_CREATED)
        recruiter_token = recruiter_reg.data['access']

        # 1. Start Interview Session (as Seeker)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        start_res = self.client.post(reverse('api_interviews_start'), {}, format='json')
        self.assertEqual(start_res.status_code, status.HTTP_201_CREATED)
        session_id = start_res.data['id']
        question_id = start_res.data['questions'][0]['id']

        # 2. Submit Answer (as Seeker)
        answer_res = self.client.post(reverse('api_interviews_answer'), {
            "question_id": question_id,
            "answer_text": "I am a skilled developer with experience in django and python development."
        }, format='json')
        self.assertEqual(answer_res.status_code, status.HTTP_200_OK)

        # 3. Fetch Interview Result (as Seeker)
        result_res = self.client.get(reverse('api_interviews_result'), {"session_id": session_id})
        self.assertEqual(result_res.status_code, status.HTTP_200_OK)

        # 4. Academy Recommendations
        academy_res = self.client.get(reverse('api_academy_recs'))
        self.assertEqual(academy_res.status_code, status.HTTP_200_OK)

        # 5. Public Portfolio (AllowAny / Settings authenticated)
        settings_res = self.client.get(reverse('api_portfolio_settings'))
        self.assertEqual(settings_res.status_code, status.HTTP_200_OK)

        settings_post_res = self.client.post(reverse('api_portfolio_settings'), {
            "is_visible": True,
            "theme_style": "SKEUOMORPHIC"
        }, format='json')
        self.assertEqual(settings_post_res.status_code, status.HTTP_200_OK)

        self.client.credentials()  # Unauthenticated
        public_res = self.client.get(reverse('api_portfolio_public', kwargs={"username": "v2_seeker"}))
        self.assertEqual(public_res.status_code, status.HTTP_200_OK)

        # 6. Corporate Analytics (as Recruiter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {recruiter_token}')
        analytics_res = self.client.get(reverse('api_corporate_analytics'))
        self.assertEqual(analytics_res.status_code, status.HTTP_200_OK)

        # 7. Interview Scheduler (schedule as Recruiter)
        seeker_id = seeker_reg.data['user']['id']
        # Create a job to schedule for
        job_res = self.client.post(reverse('job-list'), {
            "title": "V2 DevOps",
            "description": "DevOps role",
            "skills_required": ["Docker"],
            "experience_required": 2,
            "salary_min": 80000,
            "salary_max": 100000,
            "location": "Remote",
            "employment_type": "FULL_TIME",
            "openings": 1
        }, format='json')
        job_id = job_res.data['id']

        schedule_res = self.client.post(reverse('api_interview_scheduler'), {
            "candidate_id": seeker_id,
            "job_id": job_id,
            "scheduled_time": "2026-06-15T10:00:00Z",
            "notes": "Testing schedule scheduler"
        }, format='json')
        self.assertEqual(schedule_res.status_code, status.HTTP_201_CREATED)
        schedule_id = schedule_res.data['id']

        # Accept schedule as Seeker
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        accept_res = self.client.put(reverse('api_interview_scheduler'), {
            "schedule_id": schedule_id,
            "status": "ACCEPTED"
        }, format='json')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)

        # Get schedules list
        schedules_list = self.client.get(reverse('api_interview_scheduler'))
        self.assertEqual(schedules_list.status_code, status.HTTP_200_OK)

        # 8. Admin Telemetry
        admin_login = self.client.post(reverse('api_login'), {
            "username": "admin_qa",
            "password": "adminpassword123"
        }, format='json')
        admin_token = admin_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        telemetry_res = self.client.get(reverse('api_admin_telemetry'))
        self.assertEqual(telemetry_res.status_code, status.HTTP_200_OK)


        # 10. Talent Scout (as Recruiter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {recruiter_token}')
        scout_res = self.client.post(reverse('api_talent_scout_search'), {"query": "django developer"}, format='json')
        self.assertEqual(scout_res.status_code, status.HTTP_200_OK)

        # 11. Resume Optimizer (as Seeker)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        # Setup dummy active resume first
        user_seeker = User.objects.get(username="v2_seeker")
        Resume.objects.create(
            user=user_seeker,
            file=SimpleUploadedFile("v2_dummy.pdf", b"pdf content"),
            parsed_json={"skills": ["Python", "Django", "React"], "name": "V2 Seeker", "email": "v2_seeker@test.com"},
            is_active=True
        )
        opt_res = self.client.post(reverse('api_resume_optimizer'), {"job_description": "DevOps Docker AWS"}, format='json')
        self.assertEqual(opt_res.status_code, status.HTTP_200_OK)

        # 12. Job Description Generator (as Recruiter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {recruiter_token}')
        jd_res = self.client.post(reverse('api_job_desc_generate'), {"title": "Kubernetes Engineer"}, format='json')
        self.assertEqual(jd_res.status_code, status.HTTP_200_OK)

        # 13. Voice evaluation upload (as Seeker)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {seeker_token}')
        voice_file = SimpleUploadedFile("audio.wav", b"fake audio content", content_type="audio/wav")
        voice_res = self.client.post(reverse('api_voice_upload'), {
            "question_id": question_id,
            "file": voice_file
        }, format='multipart')
        self.assertEqual(voice_res.status_code, status.HTTP_200_OK)

        # 14. Code Run (as Seeker)
        code_res = self.client.get(reverse('api_code_run'))
        self.assertEqual(code_res.status_code, status.HTTP_200_OK)
        challenge_id = code_res.data[0]['id']

        code_run_res = self.client.post(reverse('api_code_run'), {
            "challenge_id": challenge_id,
            "code": "def reverse_string(s: list) -> None:\n    s.reverse()",
            "language": "python"
        }, format='json')
        self.assertEqual(code_run_res.status_code, status.HTTP_200_OK)

    def test_resume_parser_date_year_robustness(self):
        seeker = User.objects.create(username="robustness_seeker", role="SEEKER")
        profile = JobSeekerProfile.objects.create(user=seeker)
        
        # Test education setter robustness with various non-integer years
        profile.education = [
            {
                "degree": "B.Tech",
                "school": "IIT",
                "field": "CS",
                "grade": "9.5",
                "start_year": "2020",
                "end_year": "Present",
                "description": "Graduated"
            },
            {
                "degree": "M.Tech",
                "school": "IISc",
                "field": "AI",
                "grade": "9.8",
                "start_year": "2024",
                "end_year": "",
                "description": ""
            }
        ]
        
        educations = profile.educations.all()
        self.assertEqual(educations.count(), 2)
        self.assertEqual(educations[0].start_year, 2020)
        self.assertEqual(educations[0].end_year, 2026) # Fallback default
        self.assertEqual(educations[1].start_year, 2024)
        self.assertEqual(educations[1].end_year, 2026) # Fallback default
        
        # Test experience date parsing robustness
        profile.experience = [
            {
                "role": "Software Engineer",
                "company": "Google",
                "employment_type": "Full-time",
                "location": "Remote",
                "start_date": "2021-05", # %Y-%m format
                "end_date": "Present", # non-standard format
                "currently_working": False,
                "description": ""
            },
            {
                "role": "Intern",
                "company": "Meta",
                "employment_type": "Internship",
                "location": "Remote",
                "start_date": "2020", # %Y format
                "end_date": "2021", # %Y format
                "currently_working": False,
                "description": ""
            }
        ]
        
        experiences = profile.experiences.all().order_by('id')
        self.assertEqual(experiences.count(), 2)
        # 2021-05 should be parsed to 2021-05-01
        self.assertEqual(experiences[0].start_date.year, 2021)
        self.assertEqual(experiences[0].start_date.month, 5)
        self.assertEqual(experiences[0].end_date, None)
        self.assertTrue(experiences[0].currently_working) # end_date is Present
        
        # Intern
        self.assertEqual(experiences[1].start_date.year, 2020)
        self.assertEqual(experiences[1].end_date.year, 2021)

