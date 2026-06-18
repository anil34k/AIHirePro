import json
import os
import logging
import traceback
import re
from datetime import datetime

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.db import transaction

from users.models import (
    User, JobSeekerProfile, Education, Experience, Skill, Certification, Project, Interest, Hobby,
    RecruiterProfile, InterviewSettings, RecruiterNotificationSettings, CompanyProfile
)
from resumes.models import Resume
from jobs.models import Job, Application
from core.models import AIRecommendation, Notification
from portfolio.models import PublicPortfolio
from code_arena.models import CodingChallenge, CodeSubmission
from groq import Groq

# =====================================================
# LOGGING CONFIGURATION
# =====================================================
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Ensure console handler exists
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    fmt = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # Also log to file
    try:
        log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        fh = logging.FileHandler(os.path.join(log_dir, 'portal_debug.log'))
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except Exception:
        pass  # file logging is optional


def log_error(context, exc=None):
    logger.error("=== RESUME PROCESSING ERROR ===")
    logger.error(f"Context: {context}")
    if exc:
        logger.error(f"Exception Type: {type(exc).__name__}")
        logger.error(f"Exception Msg: {str(exc)}")
        logger.error(f"Traceback: {traceback.format_exc()}")


def log_info(msg):
    logger.info(f"[PORTAL] {msg}")


def log_debug(msg):
    logger.debug(f"[PORTAL] {msg}")


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)


# =====================================================
# PROFILE HELPER
# =====================================================
def get_or_create_profile(user):
    profile, created = JobSeekerProfile.objects.get_or_create(
        user=user,
        defaults={
            'headline': '',
            'location': '',
            'profile_completed': 0,
        }
    )
    if created:
        log_info(f"Created new JobSeekerProfile for user {user.id}")
    return profile


# =====================================================
# AUTH VIEWS
# =====================================================
def portal_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user and hasattr(user, 'role') and user.role == 'SEEKER':
            login(request, user)
            log_info(f"User {user.username} logged in via portal")
            return redirect('portal_dashboard')
        else:
            return render(request, 'portal/login.html', {'error': 'Invalid credentials or not a job seeker'})
    return render(request, 'portal/login.html')


def portal_logout(request):
    logout(request)
    return redirect('portal_login')


# =====================================================
# DASHBOARD
# =====================================================
@login_required(login_url='/login/')
def dashboard(request):
    user = request.user
    profile = JobSeekerProfile.objects.filter(user=user).first()
    resume = Resume.objects.filter(user=user, is_active=True).first()
    applications = Application.objects.filter(seeker=user).order_by('-applied_at')[:5]
    recommendations = AIRecommendation.objects.filter(seeker=user).order_by('-generated_at')[:6]
    notifications = Notification.objects.filter(recipient=user).order_by('-created_at')[:5]

    education_qs = Education.objects.filter(profile=profile).order_by('-start_year') if profile else []
    experience_qs = Experience.objects.filter(profile=profile).order_by('-start_date') if profile else []
    skills_qs = Skill.objects.filter(profile=profile) if profile else []
    projects_qs = Project.objects.filter(profile=profile) if profile else []
    certifications_qs = Certification.objects.filter(profile=profile) if profile else []
    interests_qs = Interest.objects.filter(profile=profile) if profile else []
    hobbies_qs = Hobby.objects.filter(profile=profile) if profile else []

    profile_completion = _calculate_completion(profile)
    debug_mode = settings.DEBUG

    context = {
        'user': user,
        'profile': profile,
        'resume': resume,
        'applications': applications,
        'recommendations': recommendations,
        'notifications': notifications,
        'education_list': education_qs,
        'experience_list': experience_qs,
        'skills_list': skills_qs,
        'projects_list': projects_qs,
        'certifications_list': certifications_qs,
        'interests_list': interests_qs,
        'hobbies_list': hobbies_qs,
        'profile_completion': profile_completion,
        'missing_skills': ['CSS3', 'Data Analytics', 'WordPress', 'Tableau', 'Cybersecurity'],
        'debug_mode': debug_mode,
    }
    return render(request, 'portal/dashboard.html', context)


def _calculate_completion(profile):
    if not profile:
        return 0
    score = 0
    total = 12
    if profile.headline: score += 1
    if profile.summary: score += 1
    if profile.about_me: score += 1
    if profile.location: score += 1
    if profile.profile_picture: score += 1
    if profile.linkedin: score += 1
    if profile.github: score += 1
    if profile.portfolio: score += 1
    if Education.objects.filter(profile=profile).exists(): score += 1
    if Experience.objects.filter(profile=profile).exists(): score += 1
    if Skill.objects.filter(profile=profile).exists(): score += 1
    if Project.objects.filter(profile=profile).exists(): score += 1
    return int((score / total) * 100)


# =====================================================
# JOB MATCHES
# =====================================================
@login_required
def api_job_matches(request):
    user = request.user
    jobs = Job.objects.filter(status='ACTIVE')[:20]
    data = []
    for job in jobs:
        skills = job.skills_required or []
        data.append({
            'id': job.id,
            'title': job.title,
            'company': job.company.name if job.company else 'Unknown',
            'location': job.location,
            'salary_min': str(job.salary_min) if job.salary_min else None,
            'salary_max': str(job.salary_max) if job.salary_max else None,
            'skills': skills if isinstance(skills, list) else [],
            'employment_type': job.employment_type,
            'match_score': _calculate_match(user, job),
        })
    return JsonResponse({'jobs': data})


def _calculate_match(user, job):
    skills = Skill.objects.filter(profile__user=user).values_list('name', flat=True)
    user_skills = set(s.lower() for s in skills)
    job_skills = set(s.lower() for s in (job.skills_required or []))
    if not job_skills:
        return 0
    matched = user_skills & job_skills
    return int((len(matched) / len(job_skills)) * 100)


# =====================================================
# RESUME UPLOAD
# =====================================================
@login_required
@csrf_exempt
def api_upload_resume(request):
    if request.method == 'POST' and request.FILES.get('file'):
        f = request.FILES['file']
        log_info(f"Resume upload started: user={request.user.id}, file={f.name}, size={f.size}")
        try:
            path = default_storage.save(f'resumes/{request.user.id}_{f.name}', f)
            # Deactivate old resumes
            Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
            resume = Resume.objects.create(user=request.user, file=path, is_active=True)
            # Try to extract raw_text from the file
            try:
                if f.name.endswith('.txt'):
                    f.seek(0)
                    resume.raw_text = f.read().decode('utf-8', errors='ignore')
                elif f.name.endswith('.pdf'):
                    try:
                        import pdfplumber
                        f.seek(0)
                        with pdfplumber.open(f) as pdf:
                            resume.raw_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
                    except ImportError:
                        log_info("pdfplumber not installed, skipping text extraction")
                elif f.name.endswith('.docx'):
                    try:
                        import docx2txt
                        f.seek(0)
                        resume.raw_text = docx2txt.process(f)
                    except ImportError:
                        log_info("docx2txt not installed, skipping text extraction")
            except Exception as e:
                log_error("Text extraction failed", e)
            resume.save()
            log_info(f"Resume saved: id={resume.id}, path={path}")
            return JsonResponse({
                'status': 'ok',
                'id': resume.id,
                'file': resume.file.url,
                'message': 'Resume uploaded successfully'
            })
        except Exception as e:
            log_error("Resume upload failed", e)
            return JsonResponse({'status': 'error', 'error': 'File upload failed. Please try again.'}, status=500)
    return JsonResponse({'status': 'error', 'error': 'No file provided'}, status=400)


@login_required
def api_delete_resume(request, resume_id):
    resume = Resume.objects.filter(id=resume_id, user=request.user).first()
    if resume:
        resume.delete()
        log_info(f"Resume deleted: id={resume_id}")
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error', 'error': 'Resume not found'}, status=404)


# =====================================================
# RESUME PARSING — COMPLETE REWRITE WITH ATOMIC SAVES
# =====================================================
@login_required
@csrf_exempt
def api_ai_parse(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    client = get_groq_client()
    if not client:
        log_error("Groq API key not configured")
        return JsonResponse({'error': 'Groq API key not configured. Set GROQ_API_KEY in .env'}, status=500)

    resume = Resume.objects.filter(user=request.user, is_active=True).first()
    if not resume:
        log_error(f"No active resume for user {request.user.id}")
        return JsonResponse({'error': 'No active resume found. Please upload a resume first.'}, status=404)

    text = resume.raw_text or ''
    if not text:
        log_error(f"Resume {resume.id} has no extracted text")
        return JsonResponse({'error': 'Could not extract text from resume. Try uploading a PDF or DOCX file.'}, status=400)

    log_info(f"Starting parse for resume {resume.id}, text length={len(text)}")

    # ---- STEP 1: Call Groq API ----
    prompt = f"""Extract structured JSON data from this resume. Return ONLY valid JSON. No markdown, no code fences.

    {{
        "full_name": "...",
        "email": "...",
        "phone": "...",
        "skills": ["Skill1", "Skill2"],
        "education": [
            {{
                "degree": "Bachelor of Engineering",
                "university": "University Name",
                "college": "College Name",
                "branch": "Computer Science",
                "duration": "2020 - 2024",
                "start_year": 2020,
                "end_year": 2024,
                "cgpa": "8.5"
            }}
        ],
        "experience": [
            {{
                "role": "Software Engineer",
                "company": "Company Name",
                "duration": "Jan 2023 - Present",
                "start_date": "2023-01",
                "end_date": null,
                "description": "Worked on..."
            }}
        ],
        "projects": [
            {{
                "name": "Project Name",
                "technologies": ["Tech1", "Tech2"],
                "description": "Project description"
            }}
        ],
        "certifications": [
            {{
                "name": "Certification Name",
                "issuing_organization": "Org Name"
            }}
        ]
    }}

    Resume text:
    {text[:4000]}"""

    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
        )
        content = resp.choices[0].message.content.strip()
        log_info(f"Groq API response received, length={len(content)}")
        log_debug(f"Raw Groq response: {content[:500]}...")
    except Exception as e:
        log_error("Groq API call failed", e)
        return JsonResponse({'error': 'AI parsing service temporarily unavailable. Please try again.'}, status=502)

    # ---- STEP 2: Parse JSON ----
    try:
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        data = json.loads(content.strip())
        log_info(f"Parsed JSON successfully. Keys: {list(data.keys())}")
    except json.JSONDecodeError as e:
        log_error("JSON decode failed", e)
        log_debug(f"Failed content: {content[:1000]}")
        return JsonResponse({'error': 'AI returned invalid data format. Please try again.'}, status=500)

    # ---- STEP 3: Save to Database with Atomic Transaction ----
    save_results = {
        'skills_added': 0,
        'education_added': 0,
        'experience_added': 0,
        'projects_added': 0,
        'certifications_added': 0,
    }
    db_errors = []

    try:
        with transaction.atomic():
            # 3a. Ensure profile exists
            profile = get_or_create_profile(request.user)
            log_info(f"Using profile {profile.id} for user {request.user.id}")

            # 3b. Update profile basic info
            if data.get('full_name'):
                parts = data['full_name'].strip().split(None, 1)
                if len(parts) == 2:
                    request.user.first_name = parts[0]
                    request.user.last_name = parts[1]
                else:
                    request.user.first_name = parts[0]
                request.user.save()

            profile.headline = data.get('headline', '') or profile.headline or ''
            profile.location = data.get('location', '') or profile.location or ''

            if data.get('email'):
                request.user.email = data['email']
                request.user.save()

            profile.save()
            log_info("Profile basic info updated")

            # 3c. Save Skills (use get_or_create)
            skills_data = data.get('skills', [])
            if skills_data and isinstance(skills_data, list):
                existing_skills_lower = set(s.lower() for s in Skill.objects.filter(profile=profile).values_list('name', flat=True))
                count = 0
                for skill_name in skills_data:
                    if isinstance(skill_name, str) and skill_name.strip():
                        name = skill_name.strip()
                        if name.lower() not in existing_skills_lower:
                            Skill.objects.create(profile=profile, name=name, level='Intermediate')
                            count += 1
                            existing_skills_lower.add(name.lower())
                save_results['skills_added'] = count
                log_info(f"Skills saved: {count} new, {len(skills_data)} total in resume")

            # 3d. Save Education (use get_or_create)
            edu_data = data.get('education', [])
            if edu_data and isinstance(edu_data, list):
                count = 0
                for item in edu_data:
                    degree = (item.get('degree') or '').strip()
                    college = (item.get('college') or item.get('university') or '').strip()
                    if not degree or not college:
                        continue
                    # Try to find existing
                    existing = Education.objects.filter(
                        profile=profile,
                        degree__iexact=degree,
                        college__iexact=college
                    ).first()
                    if existing:
                        continue
                    # Parse years
                    start_year = _parse_year(item.get('start_year'), 2020)
                    end_year = _parse_year(item.get('end_year'), 2024)
                    # Also try from duration string
                    duration = item.get('duration', '')
                    if not start_year and duration:
                        years_found = re.findall(r'\b(19|20)\d{2}\b', duration)
                        if len(years_found) >= 2:
                            start_year = int(years_found[0])
                            end_year = int(years_found[1])
                        elif len(years_found) == 1:
                            start_year = int(years_found[0])
                            end_year = start_year + 3

                    Education.objects.create(
                        profile=profile,
                        degree=degree,
                        college=college,
                        branch=item.get('branch', '') or '',
                        cgpa=str(item.get('cgpa', '') or ''),
                        start_year=start_year,
                        end_year=end_year or start_year + 3,
                        description=item.get('description', '') or '',
                    )
                    count += 1
                save_results['education_added'] = count
                log_info(f"Education saved: {count} new entries")

            # 3e. Save Experience (use get_or_create)
            exp_data = data.get('experience', [])
            if exp_data and isinstance(exp_data, list):
                count = 0
                for item in exp_data:
                    role = (item.get('role') or item.get('job_title') or '').strip()
                    company = (item.get('company') or item.get('company_name') or '').strip()
                    if not role or not company:
                        continue
                    existing = Experience.objects.filter(
                        profile=profile,
                        job_title__iexact=role,
                        company_name__iexact=company
                    ).first()
                    if existing:
                        continue

                    start_date = _parse_date(item.get('start_date') or item.get('start_year'))
                    end_date = _parse_date(item.get('end_date') or item.get('end_year'))
                    duration = item.get('duration', '')
                    if not start_date and duration:
                        years_found = re.findall(r'\b(19|20)\d{2}\b', duration)
                        if years_found:
                            start_date = datetime(int(years_found[0]), 1, 1).date()

                    is_present = False
                    if duration and 'present' in duration.lower():
                        is_present = True

                    currently_working = item.get('currently_working', False) or is_present

                    Experience.objects.create(
                        profile=profile,
                        job_title=role,
                        company_name=company,
                        employment_type=item.get('employment_type', 'Full-time') or 'Full-time',
                        location=item.get('location', '') or '',
                        start_date=start_date or datetime.now().date(),
                        end_date=end_date,
                        currently_working=currently_working,
                        description=item.get('description', '') or '',
                    )
                    count += 1
                save_results['experience_added'] = count
                log_info(f"Experience saved: {count} new entries")

            # 3f. Save Projects (use get_or_create)
            proj_data = data.get('projects', [])
            if proj_data and isinstance(proj_data, list):
                count = 0
                for item in proj_data:
                    name = (item.get('name') or item.get('title') or '').strip()
                    if not name:
                        continue
                    existing = Project.objects.filter(profile=profile, name__iexact=name).first()
                    if existing:
                        continue
                    Project.objects.create(
                        profile=profile,
                        name=name,
                        description=item.get('description', '') or '',
                        technologies_used=item.get('technologies', []) or item.get('technologies_used', []),
                        github_link=item.get('github', '') or item.get('github_link', '') or '',
                        live_demo_link=item.get('link', '') or item.get('live_demo_link', '') or '',
                    )
                    count += 1
                save_results['projects_added'] = count
                log_info(f"Projects saved: {count} new entries")

            # 3g. Save Certifications (use get_or_create)
            cert_data = data.get('certifications', [])
            if cert_data and isinstance(cert_data, list):
                count = 0
                for item in cert_data:
                    if isinstance(item, str):
                        name = item.strip()
                        org = 'Unknown'
                    elif isinstance(item, dict):
                        name = (item.get('name') or '').strip()
                        org = item.get('issuing_organization', '') or item.get('organization', '') or 'Unknown'
                    else:
                        continue
                    if not name:
                        continue
                    existing = Certification.objects.filter(profile=profile, name__iexact=name).first()
                    if existing:
                        continue
                    Certification.objects.create(
                        profile=profile,
                        name=name,
                        issuing_organization=org,
                    )
                    count += 1
                save_results['certifications_added'] = count
                log_info(f"Certifications saved: {count} new entries")

            # 3h. Update profile completion
            profile.profile_completed = _calculate_completion(profile)
            profile.is_setup_completed = profile.profile_completed >= 70
            profile.save()

            # 3i. Save parsed JSON to resume
            resume.parsed_json = data
            resume.save()

            log_info(f"All data saved successfully for resume {resume.id}")

    except Exception as e:
        log_error("Database save failed — transaction rolled back", e)
        db_errors.append({
            'section': 'database',
            'error': str(e),
            'type': type(e).__name__,
        })
        return JsonResponse({
            'status': 'error',
            'error': str(e),
            'errors': db_errors,
            'hint': 'Database save failed. Check terminal for full traceback.'
        }, status=500)

    # ---- STEP 4: Auto-create portfolio if missing ----
    try:
        PublicPortfolio.objects.get_or_create(
            seeker=request.user,
            defaults={'slug': request.user.username, 'is_visible': True}
        )
    except Exception as e:
        log_error("Failed to auto-create portfolio", e)

    # ---- STEP 5: Return success with details ----
    total_saved = sum(save_results.values())
    log_info(f"Resume processing complete. {total_saved} items saved.")

    return JsonResponse({
        'status': 'ok',
        'message': 'Resume processed successfully',
        'data': data,
        'saved': save_results,
        'profile_completion': profile.profile_completed,
        'details': [
            f"{save_results['skills_added']} skills added",
            f"{save_results['education_added']} education entries added",
            f"{save_results['experience_added']} experience entries added",
            f"{save_results['projects_added']} projects added",
            f"{save_results['certifications_added']} certifications added",
        ]
    })


# ---- Parsing Helpers ----

def _parse_year(val, default=None):
    if val is None or val == '':
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


def _parse_date(val):
    if not val:
        return None
    val = str(val).strip()
    for fmt in ["%Y-%m-%d", "%Y-%m", "%Y"]:
        try:
            return datetime.strptime(val, fmt).date()
        except Exception:
            continue
    try:
        digits = re.findall(r'\b\d{4}\b', val)
        if digits:
            return datetime(int(digits[0]), 1, 1).date()
    except Exception:
        pass
    return None


# =====================================================
# ATS ANALYSIS (with error handling)
# =====================================================
@login_required
@csrf_exempt
def api_ats_analysis(request):
    resume = Resume.objects.filter(user=request.user, is_active=True).first()
    if not resume:
        return JsonResponse({'error': 'No resume found'}, status=404)

    client = get_groq_client()
    if not client:
        return JsonResponse({'ats_score': 72, 'resume_strength': 80, 'skill_match': 12})

    profile = JobSeekerProfile.objects.filter(user=request.user).first()
    total_skills = Skill.objects.filter(profile=profile).count() if profile else 0
    skill_match = min(total_skills * 8, 100)

    prompt = f"""Analyze this resume and return ONLY valid JSON:
    {{"ats_score": 0-100, "resume_strength": 0-100, "skill_match_rate": 0-100, "missing_skills": ["..."], "recommendations": ["..."]}}
    Resume: {(resume.raw_text or '')[:3000]}"""
    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        content = resp.choices[0].message.content.strip()
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        data = json.loads(content.strip())
        data['skill_match'] = data.get('skill_match_rate', skill_match)
        return JsonResponse(data)
    except Exception as e:
        log_error("ATS analysis failed", e)
        return JsonResponse({
            'ats_score': 72,
            'resume_strength': 80,
            'skill_match': skill_match,
        })


# =====================================================
# DEBUG ENDPOINT (dev only)
# =====================================================
@login_required
def api_debug_status(request):
    if not settings.DEBUG:
        return JsonResponse({'error': 'Debug mode only'}, status=403)

    user = request.user
    profile = JobSeekerProfile.objects.filter(user=user).first()
    resume = Resume.objects.filter(user=user, is_active=True).first()

    return JsonResponse({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'profile_exists': profile is not None,
        'profile': {
            'id': profile.id if profile else None,
            'headline': profile.headline if profile else None,
            'location': profile.location if profile else None,
            'profile_completed': profile.profile_completed if profile else 0,
        } if profile else None,
        'resume': {
            'id': resume.id if resume else None,
            'has_file': bool(resume and resume.file),
            'has_raw_text': bool(resume and resume.raw_text),
            'has_parsed_json': bool(resume and resume.parsed_json),
            'uploaded_at': str(resume.uploaded_at) if resume else None,
        } if resume else None,
        'skills_count': Skill.objects.filter(profile=profile).count() if profile else 0,
        'education_count': Education.objects.filter(profile=profile).count() if profile else 0,
        'experience_count': Experience.objects.filter(profile=profile).count() if profile else 0,
        'projects_count': Project.objects.filter(profile=profile).count() if profile else 0,
        'certifications_count': Certification.objects.filter(profile=profile).count() if profile else 0,
    })


# =====================================================
# RECRUITER CONFIGURATION — Auto-create + Logging
# =====================================================

def ensure_recruiter_config(user):
    """Auto-create RecruiterProfile, CompanyProfile, InterviewSettings,
    and RecruiterNotificationSettings if any are missing."""
    created = []

    # 1. CompanyProfile
    try:
        cp, is_new = CompanyProfile.objects.get_or_create(
            user=user,
            defaults={'name': user.get_full_name() or user.username, 'industry': '', 'size': '11-50'}
        )
        if is_new:
            log_info(f"Auto-created CompanyProfile for recruiter {user.id}")
            created.append('company_profile')
    except Exception as e:
        log_error("Failed to ensure CompanyProfile", e)

    # 2. RecruiterProfile
    try:
        rp, is_new = RecruiterProfile.objects.get_or_create(user=user)
        if is_new:
            log_info(f"Auto-created RecruiterProfile for recruiter {user.id}")
            created.append('recruiter_profile')
    except Exception as e:
        log_error("Failed to ensure RecruiterProfile", e)

    # 3. InterviewSettings (with defaults)
    try:
        iv, is_new = InterviewSettings.objects.get_or_create(
            user=user,
            defaults={
                'duration_minutes': 30,
                'meeting_platform': 'Google Meet',
                'timezone': 'Asia/Kolkata',
            }
        )
        if is_new:
            log_info(f"Auto-created InterviewSettings for recruiter {user.id}")
            created.append('interview_settings')
    except Exception as e:
        log_error("Failed to ensure InterviewSettings", e)

    # 4. RecruiterNotificationSettings (with defaults)
    try:
        ns, is_new = RecruiterNotificationSettings.objects.get_or_create(
            user=user,
            defaults={
                'email_notifications': True,
                'interview_reminders': True,
                'new_applications': True,
            }
        )
        if is_new:
            log_info(f"Auto-created RecruiterNotificationSettings for recruiter {user.id}")
            created.append('notification_settings')
    except Exception as e:
        log_error("Failed to ensure RecruiterNotificationSettings", e)

    return created


def serialize_recruiter_config(user):
    """Return dict of recruiter config or None for missing items."""
    config = {'user_id': user.id, 'username': user.username}
    try:
        rp = getattr(user, 'recruiter_profile', None)
        config['recruiter_profile'] = {
            'id': rp.id, 'department': rp.department, 'position': rp.position, 'phone': rp.phone,
        } if rp else None
    except Exception as e:
        log_error("Failed to serialize RecruiterProfile", e)
        config['recruiter_profile'] = None

    try:
        cp = getattr(user, 'company_profile', None)
        config['company_profile'] = {
            'id': cp.id, 'name': cp.name, 'industry': cp.industry, 'website': cp.website,
            'headquarters': cp.headquarters, 'size': cp.size, 'contact_email': cp.contact_email,
            'description': cp.description, 'logo_url': cp.logo_url,
        } if cp else None
    except Exception as e:
        log_error("Failed to serialize CompanyProfile", e)
        config['company_profile'] = None

    try:
        iv = getattr(user, 'interview_settings', None)
        config['interview_settings'] = {
            'id': iv.id, 'duration_minutes': iv.duration_minutes,
            'meeting_platform': iv.meeting_platform, 'timezone': iv.timezone,
        } if iv else None
    except Exception as e:
        log_error("Failed to serialize InterviewSettings", e)
        config['interview_settings'] = None

    try:
        ns = getattr(user, 'notification_settings', None)
        config['notification_settings'] = {
            'id': ns.id, 'email_notifications': ns.email_notifications,
            'interview_reminders': ns.interview_reminders,
            'new_applications': ns.new_applications,
        } if ns else None
    except Exception as e:
        log_error("Failed to serialize NotificationSettings", e)
        config['notification_settings'] = None

    return config


# =====================================================
# RECRUITER LOGIN & DASHBOARD
# =====================================================

def recruiter_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user and hasattr(user, 'role') and user.role == 'COMPANY':
            login(request, user)
            log_info(f"Recruiter {user.username} logged in")
            # Auto-create configs on first login
            created = ensure_recruiter_config(user)
            if created:
                log_info(f"Created missing configs for recruiter {user.id}: {created}")
            return redirect('recruiter_dashboard')
        else:
            return render(request, 'portal/recruiter_login.html', {
                'error': 'Invalid credentials or not a recruiter account'
            })
    return render(request, 'portal/recruiter_login.html')


@login_required(login_url='/recruiter/login/')
def recruiter_dashboard(request):
    if request.user.role != 'COMPANY':
        return redirect('portal_login')

    # Ensure all configs exist before rendering
    created = ensure_recruiter_config(request.user)
    if created:
        log_info(f"Ensured configs for recruiter {request.user.id}: {created}")

    config = serialize_recruiter_config(request.user)

    context = {
        'user': request.user,
        'config': config,
        'debug_mode': settings.DEBUG,
    }
    return render(request, 'portal/recruiter_dashboard.html', context)


# =====================================================
# RECRUITER CONFIG API (returns JSON)
# =====================================================

@login_required
@csrf_exempt
def api_recruiter_config(request):
    if request.user.role != 'COMPANY':
        return JsonResponse({'success': False, 'message': 'Only recruiters can access this endpoint.'}, status=403)

    if request.method == 'GET':
        try:
            log_info(f"Loading recruiter config for user {request.user.id}")
            # Auto-create missing configs
            created = ensure_recruiter_config(request.user)
            if created:
                log_info(f"Recruiter config auto-created: {created}")

            config = serialize_recruiter_config(request.user)
            has_all = all([
                config.get('recruiter_profile'),
                config.get('company_profile'),
                config.get('interview_settings'),
                config.get('notification_settings'),
            ])

            return JsonResponse({
                'success': True,
                'config': config,
                'created': created,
                'is_complete': has_all,
            })
        except Exception as e:
            log_error("Failed to load recruiter config", e)
            return JsonResponse({
                'success': False,
                'message': 'Configuration not found',
            })

    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Update RecruiterProfile
            rp_data = data.get('recruiter_profile', {})
            rp, _ = RecruiterProfile.objects.get_or_create(user=request.user)
            for field in ['department', 'position', 'phone']:
                if field in rp_data:
                    setattr(rp, field, rp_data[field])
            rp.save()

            # Update InterviewSettings
            iv_data = data.get('interview_settings', {})
            iv, _ = InterviewSettings.objects.get_or_create(user=request.user)
            if 'duration_minutes' in iv_data:
                iv.duration_minutes = int(iv_data['duration_minutes'])
            if 'meeting_platform' in iv_data:
                iv.meeting_platform = iv_data['meeting_platform']
            if 'timezone' in iv_data:
                iv.timezone = iv_data['timezone']
            iv.save()

            # Update NotificationSettings
            ns_data = data.get('notification_settings', {})
            ns, _ = RecruiterNotificationSettings.objects.get_or_create(user=request.user)
            for field in ['email_notifications', 'interview_reminders', 'new_applications']:
                if field in ns_data:
                    setattr(ns, field, bool(ns_data[field]))
            ns.save()

            log_info(f"Recruiter config updated for user {request.user.id}")
            return JsonResponse({'success': True, 'message': 'Configuration updated successfully.'})
        except Exception as e:
            log_error("Failed to update recruiter config", e)
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)


# =====================================================
# RECRUITER — List Seekers (replaces admin-only endpoint)
# =====================================================

@login_required
@csrf_exempt
def api_recruiter_seekers(request):
    if request.user.role != 'COMPANY':
        return JsonResponse({'success': False, 'message': 'Only recruiters can access this endpoint.'}, status=403)

    try:
        log_info(f"Loading seekers for recruiter {request.user.id}")
        seekers = User.objects.filter(role='SEEKER', is_suspended=False).values(
            'id', 'username', 'first_name', 'last_name', 'email'
        ).order_by('username')

        seeker_list = []
        for s in seekers:
            # Get profile headline if available
            try:
                profile = JobSeekerProfile.objects.filter(user_id=s['id']).first()
                headline = profile.headline if profile else ''
            except Exception:
                headline = ''
            seeker_list.append({
                'id': s['id'],
                'username': s['username'],
                'first_name': s['first_name'],
                'last_name': s['last_name'],
                'email': s['email'],
                'headline': headline,
            })

        return JsonResponse({
            'success': True,
            'seekers': seeker_list,
            'count': len(seeker_list),
        })
    except Exception as e:
        log_error("Failed to load seekers list", e)
        return JsonResponse({
            'success': False,
            'message': 'Could not fetch candidate list.',
            'seekers': [],
        })


# =====================================================
# RECRUITER — Interview Schedule (portal version)
# =====================================================

@login_required
@csrf_exempt
def api_recruiter_schedules(request):
    if request.user.role != 'COMPANY':
        return JsonResponse({'success': False, 'message': 'Only recruiters.'}, status=403)

    if request.method == 'POST':
        try:
            from scheduler.models import InterviewSchedule
            data = json.loads(request.body)
            candidate_id = data.get('candidate_id')
            job_title = data.get('job_title', '').strip()
            scheduled_time = data.get('scheduled_time')
            notes = data.get('notes', '')

            if not candidate_id or not scheduled_time:
                return JsonResponse({'success': False, 'message': 'Missing required fields: candidate_id, scheduled_time'})

            if not job_title or len(job_title) < 3:
                return JsonResponse({'success': False, 'message': 'Please enter a valid job position (min 3 characters).'})

            candidate = User.objects.get(id=candidate_id)

            schedule = InterviewSchedule.objects.create(
                recruiter=request.user,
                candidate=candidate,
                job=None,
                job_title=job_title[:100],
                scheduled_time=scheduled_time,
                notes=notes,
                status='PENDING'
            )

            log_info(f"Interview scheduled: recruiter={request.user.id}, candidate={candidate_id}, job_title={job_title}")

            return JsonResponse({
                'success': True,
                'message': 'Interview scheduled successfully.',
                'schedule': {
                    'id': schedule.id,
                    'candidate_name': candidate.get_full_name() or candidate.username,
                    'job_title': job_title,
                    'scheduled_time': schedule.scheduled_time.isoformat(),
                    'status': schedule.status,
                }
            })
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Candidate not found.'})
        except Exception as e:
            log_error("Failed to create schedule", e)
            return JsonResponse({'success': False, 'message': str(e)})

    try:
        log_info(f"Loading schedules for recruiter {request.user.id}")
        from scheduler.models import InterviewSchedule
        schedules = InterviewSchedule.objects.filter(recruiter=request.user).order_by('-scheduled_time')

        data = []
        for s in schedules:
            display_title = s.job_title or (s.job.title if s.job else 'Unknown Position')
            data.append({
                'id': s.id,
                'candidate_name': s.candidate.get_full_name() or s.candidate.username,
                'candidate_email': s.candidate.email,
                'job_title': display_title,
                'scheduled_time': s.scheduled_time.isoformat() if s.scheduled_time else None,
                'status': s.status,
                'notes': s.notes or '',
                'created_at': s.created_at.isoformat() if s.created_at else None,
            })

        return JsonResponse({'success': True, 'schedules': data, 'count': len(data)})
    except Exception as e:
        log_error("Failed to load schedules", e)
        return JsonResponse({'success': False, 'message': 'Could not load schedules.', 'schedules': []})


# =====================================================
# RECRUITER — Job Listings (portal version)
# =====================================================

@login_required
@csrf_exempt
def api_recruiter_jobs(request):
    if request.user.role != 'COMPANY':
        return JsonResponse({'success': False, 'message': 'Only recruiters.'}, status=403)

    try:
        log_info(f"Loading jobs for recruiter {request.user.id}")
        jobs = Job.objects.filter(company__user=request.user).order_by('-created_at')

        data = []
        for j in jobs:
            data.append({
                'id': j.id,
                'title': j.title,
                'location': j.location or '',
                'employment_type': j.employment_type or 'FULL_TIME',
                'salary_min': str(j.salary_min) if j.salary_min else None,
                'salary_max': str(j.salary_max) if j.salary_max else None,
                'skills_required': j.skills_required or [],
                'status': j.status,
                'openings': j.openings or 1,
                'created_at': j.created_at.isoformat() if j.created_at else None,
            })

        return JsonResponse({'success': True, 'jobs': data, 'count': len(data)})
    except Exception as e:
        log_error("Failed to load jobs", e)
        return JsonResponse({'success': False, 'message': 'Could not load jobs.', 'jobs': []})


# =====================================================
# PUBLIC PORTFOLIO PAGE (Django Template)
# =====================================================

def public_portfolio(request, username):
    log_info(f"[PORTFOLIO] Request for identifier: {username}")

    # Step 0: Resolve identifier — support /portfolio/<username> and /portfolio/user-<id>
    user = None
    if username.startswith('user-'):
        try:
            uid = int(username.replace('user-', ''))
            user = User.objects.filter(id=uid).first()
            log_info(f"[PORTFOLIO] ID-based lookup: user-{uid}, found={user is not None}")
        except (ValueError, TypeError):
            log_info(f"[PORTFOLIO] Invalid user-id format: {username}")

    if not user:
        user = User.objects.filter(username=username).first()
        log_info(f"[PORTFOLIO] Username lookup: {username}, found={user is not None}")

    # Try slug lookup (portfolio slug may differ from username)
    if not user:
        portfolio_by_slug = PublicPortfolio.objects.filter(slug=username).first()
        if portfolio_by_slug:
            user = portfolio_by_slug.seeker
            log_info(f"[PORTFOLIO] Slug lookup: {username}, found user id={user.id}")

    if not user:
        log_info(f"[PORTFOLIO] User not found: {username}")
        return render(request, 'portal/portfolio.html', {
            'error_type': 'user_not_found',
            'message': 'User not found.',
            'username': username,
        })

    log_info(f"[PORTFOLIO] User resolved: id={user.id}, username={user.username}, role={user.role}")

    # Auto-create portfolio for seeker if missing
    if user.role == 'SEEKER':
        try:
            portfolio, created = PublicPortfolio.objects.get_or_create(
                seeker=user,
                defaults={'slug': user.username, 'is_visible': True}
            )
            if created:
                log_info(f"[PORTFOLIO] Auto-created missing portfolio for user {user.id}")
        except Exception as e:
            log_error(f"[PORTFOLIO] Failed to auto-create portfolio for user {user.id}", e)
            portfolio = None
    else:
        portfolio = PublicPortfolio.objects.filter(seeker=user).first()

    log_info(f"[PORTFOLIO] Portfolio lookup: exists={portfolio is not None}")

    if not portfolio:
        log_info(f"[PORTFOLIO] No portfolio for user {user.id}")
        return render(request, 'portal/portfolio.html', {
            'error_type': 'no_portfolio',
            'message': 'This user has not created a public portfolio yet.',
            'username': username,
        })

    log_info(f"[PORTFOLIO] Portfolio: id={portfolio.id}, slug={portfolio.slug}, visible={portfolio.is_visible}")

    if not portfolio.is_visible:
        log_info(f"[PORTFOLIO] Portfolio is private for user {user.id}")
        return render(request, 'portal/portfolio.html', {
            'error_type': 'private',
            'message': 'This portfolio is private.',
            'username': username,
        })

    # Step 4: Portfolio exists and is public — build context
    profile = JobSeekerProfile.objects.filter(user=user).first()
    skills = Skill.objects.filter(profile=profile) if profile else []
    education = Education.objects.filter(profile=profile).order_by('-end_year') if profile else []
    experience = Experience.objects.filter(profile=profile).order_by('-start_date') if profile else []
    projects = Project.objects.filter(profile=profile) if profile else []
    certifications = Certification.objects.filter(profile=profile) if profile else []

    log_info(f"[PORTFOLIO] Displaying portfolio for {username} (user_id={user.id})")

    return render(request, 'portal/portfolio.html', {
        'error_type': None,
        'portfolio': portfolio,
        'profile': profile,
        'portfolio_user': user,
        'skills': skills,
        'education': education,
        'experience': experience,
        'projects': projects,
        'certifications': certifications,
        'github': profile.github if profile else None,
        'linkedin': profile.linkedin if profile else None,
        'portfolio_url': profile.portfolio if profile else None,
    })


# =====================================================
# ADMIN: CODING CHALLENGE MANAGEMENT (portal templates)
# =====================================================

@login_required
def admin_dashboard(request):
    if request.user.role not in ('ADMIN', 'COMPANY'):
        return redirect('portal_login')

    challenges = CodingChallenge.objects.all().order_by('-created_at')
    total_challenges = challenges.count()
    total_users = User.objects.count()
    total_jobs = Job.objects.filter(status='ACTIVE').count()
    total_applications = Application.objects.count()

    recent_activities = []
    try:
        from core.models import ActivityLog
        logs = ActivityLog.objects.all().order_by('-timestamp')[:15]
        for log in logs:
            recent_activities.append({
                'username': log.user.username if log.user else 'System',
                'action': log.action,
                'details': log.details or '',
                'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M'),
            })
    except Exception:
        pass

    users_list = User.objects.all().order_by('-date_joined')[:20]

    context = {
        'total_users': total_users,
        'total_jobs': total_jobs,
        'total_applications': total_applications,
        'total_challenges': total_challenges,
        'challenges': challenges,
        'users_list': users_list,
        'recent_activities': recent_activities,
    }
    return render(request, 'portal/admin_dashboard.html', context)


def admin_challenges(request):
    if request.user.role != 'COMPANY' and request.user.role != 'ADMIN':
        return redirect('portal_login')

    difficulty = request.GET.get('difficulty', '')
    category = request.GET.get('category', '')
    active_filter = request.GET.get('active', '')

    challenges = CodingChallenge.objects.all().order_by('-created_at')

    if difficulty:
        challenges = challenges.filter(difficulty=difficulty)
    if category:
        challenges = challenges.filter(category=category)
    if active_filter == '1':
        challenges = challenges.filter(is_active=True)
    elif active_filter == '0':
        challenges = challenges.filter(is_active=False)

    context = {
        'challenges': challenges,
        'difficulties': ['EASY', 'MEDIUM', 'HARD'],
        'categories': [
            'ARRAYS', 'STRINGS', 'LINKED_LISTS', 'TREES', 'GRAPHS',
            'DYNAMIC_PROGRAMMING', 'RECURSION', 'SORTING', 'SEARCHING',
            'SQL', 'PYTHON', 'DJANGO', 'OTHER',
        ],
        'selected_difficulty': difficulty,
        'selected_category': category,
        'selected_active': active_filter,
    }
    return render(request, 'portal/admin_challenges.html', context)


def admin_challenge_add(request):
    if request.user.role != 'COMPANY' and request.user.role != 'ADMIN':
        return redirect('portal_login')

    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        description = request.POST.get('description', '').strip()
        difficulty = request.POST.get('difficulty', 'MEDIUM')
        category = request.POST.get('category', 'OTHER')
        function_signature = request.POST.get('function_signature', '').strip()

        visible_input = request.POST.get('visible_test_cases', '[]').strip()
        hidden_input = request.POST.get('hidden_test_cases', '[]').strip()
        sample_input = request.POST.get('sample_input', '').strip()
        sample_output = request.POST.get('sample_output', '').strip()
        source_url = request.POST.get('source_url', '').strip()
        is_active = request.POST.get('is_active') == 'on'

        try:
            visible_tc = json.loads(visible_input) if visible_input else []
        except json.JSONDecodeError:
            visible_tc = []
        try:
            hidden_tc = json.loads(hidden_input) if hidden_input else []
        except json.JSONDecodeError:
            hidden_tc = []

        if not title:
            return render(request, 'portal/admin_challenge_form.html', {
                'error': 'Title is required.',
                'challenge': None,
                'edit_mode': False,
                'difficulties': ['EASY', 'MEDIUM', 'HARD'],
                'categories': [
                    'ARRAYS', 'STRINGS', 'LINKED_LISTS', 'TREES', 'GRAPHS',
                    'DYNAMIC_PROGRAMMING', 'RECURSION', 'SORTING', 'SEARCHING',
                    'SQL', 'PYTHON', 'DJANGO', 'OTHER',
                ],
            })

        starter_python = request.POST.get('starter_code_python', f'# Write your solution here\n')
        starter_js = request.POST.get('starter_code_javascript', f'// Write your solution here\n')
        starter_java = request.POST.get('starter_code_java', f'// Write your solution here\n')
        starter_cpp = request.POST.get('starter_code_cpp', f'// Write your solution here\n')
        starter_csharp = request.POST.get('starter_code_csharp', f'// Write your solution here\n')

        challenge = CodingChallenge.objects.create(
            title=title,
            description=description,
            difficulty=difficulty,
            category=category,
            function_signature=function_signature or None,
            starter_code_python=starter_python,
            starter_code_javascript=starter_js,
            starter_code_java=starter_java,
            starter_code_cpp=starter_cpp,
            starter_code_csharp=starter_csharp,
            visible_test_cases=visible_tc,
            hidden_test_cases=hidden_tc,
            sample_input=sample_input or None,
            sample_output=sample_output or None,
            source_url=source_url or None,
            is_active=is_active,
        )

        log_info(f"Admin created challenge: {challenge.title} (id={challenge.id})")
        return redirect('admin_challenges')

    return render(request, 'portal/admin_challenge_form.html', {
        'error': None,
        'challenge': None,
        'edit_mode': False,
        'difficulties': ['EASY', 'MEDIUM', 'HARD'],
        'categories': [
            'ARRAYS', 'STRINGS', 'LINKED_LISTS', 'TREES', 'GRAPHS',
            'DYNAMIC_PROGRAMMING', 'RECURSION', 'SORTING', 'SEARCHING',
            'SQL', 'PYTHON', 'DJANGO', 'OTHER',
        ],
    })


def admin_challenge_edit(request, challenge_id):
    if request.user.role != 'COMPANY' and request.user.role != 'ADMIN':
        return redirect('portal_login')

    challenge = get_object_or_404(CodingChallenge, id=challenge_id)

    if request.method == 'POST':
        challenge.title = request.POST.get('title', challenge.title).strip()
        challenge.description = request.POST.get('description', challenge.description).strip()
        challenge.difficulty = request.POST.get('difficulty', challenge.difficulty)
        challenge.category = request.POST.get('category', challenge.category)
        challenge.function_signature = request.POST.get('function_signature', challenge.function_signature or '').strip() or None
        challenge.is_active = request.POST.get('is_active') == 'on'
        challenge.source_url = request.POST.get('source_url', challenge.source_url or '').strip() or None

        visible_input = request.POST.get('visible_test_cases', '[]').strip()
        hidden_input = request.POST.get('hidden_test_cases', '[]').strip()
        try:
            challenge.visible_test_cases = json.loads(visible_input) if visible_input else []
        except json.JSONDecodeError:
            pass
        try:
            challenge.hidden_test_cases = json.loads(hidden_input) if hidden_input else []
        except json.JSONDecodeError:
            pass

        challenge.sample_input = request.POST.get('sample_input', challenge.sample_input or '').strip() or None
        challenge.sample_output = request.POST.get('sample_output', challenge.sample_output or '').strip() or None

        challenge.starter_code_python = request.POST.get('starter_code_python', challenge.starter_code_python)
        challenge.starter_code_javascript = request.POST.get('starter_code_javascript', challenge.starter_code_javascript)
        challenge.starter_code_java = request.POST.get('starter_code_java', challenge.starter_code_java)
        challenge.starter_code_cpp = request.POST.get('starter_code_cpp', challenge.starter_code_cpp)
        challenge.starter_code_csharp = request.POST.get('starter_code_csharp', challenge.starter_code_csharp)

        challenge.save()
        log_info(f"Admin updated challenge: {challenge.title} (id={challenge.id})")
        return redirect('admin_challenges')

    return render(request, 'portal/admin_challenge_form.html', {
        'error': None,
        'challenge': challenge,
        'edit_mode': True,
        'difficulties': ['EASY', 'MEDIUM', 'HARD'],
        'categories': [
            'ARRAYS', 'STRINGS', 'LINKED_LISTS', 'TREES', 'GRAPHS',
            'DYNAMIC_PROGRAMMING', 'RECURSION', 'SORTING', 'SEARCHING',
            'SQL', 'PYTHON', 'DJANGO', 'OTHER',
        ],
    })


def admin_challenge_delete(request, challenge_id):
    if request.user.role != 'COMPANY' and request.user.role != 'ADMIN':
        return redirect('portal_login')

    challenge = get_object_or_404(CodingChallenge, id=challenge_id)
    title = challenge.title
    challenge.delete()
    log_info(f"Admin deleted challenge: {title} (id={challenge_id})")
    return redirect('admin_challenges')


@csrf_exempt
@login_required
def api_admin_import_leetcode(request):
    if request.user.role != 'COMPANY' and request.user.role != 'ADMIN':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body)
        url = data.get('url', '').strip()
        if not url:
            return JsonResponse({'success': False, 'error': 'URL is required'})

        from portal.services import parse_leetcode_url
        result = parse_leetcode_url(url)

        if 'error' in result:
            return JsonResponse({'success': False, 'error': result['error']})

        return JsonResponse({'success': True, 'data': result})
    except Exception as e:
        log_error("LeetCode import failed", e)
        return JsonResponse({'success': False, 'error': str(e)})


@csrf_exempt
@login_required
def api_admin_toggle_challenge(request, challenge_id):
    if request.user.role != 'COMPANY' and request.user.role != 'ADMIN':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)

    challenge = get_object_or_404(CodingChallenge, id=challenge_id)
    challenge.is_active = not challenge.is_active
    challenge.save()
    log_info(f"Toggled challenge {challenge.id} to active={challenge.is_active}")
    return JsonResponse({'success': True, 'is_active': challenge.is_active})
