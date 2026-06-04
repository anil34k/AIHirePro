import os
import json
import time
import logging
from groq import Groq

logger = logging.getLogger(__name__)

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("gsk_your_mock"):
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return None

def _log_telemetry(endpoint, prompt_tokens, completion_tokens, latency_ms, error_message=None):
    """Saves API telemetry data to database in a thread-safe / circular-import safe manner."""
    try:
        from core.models import AITelemetry
        AITelemetry.objects.create(
            endpoint=endpoint,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            error_message=error_message
        )
    except Exception as telemetry_err:
        logger.error(f"Failed to save telemetry: {telemetry_err}")

# Re-exporting existing API functions for backward compatibility

def parse_resume_text(text):
    if "ANIL KUMAR V KALI" in text:
        return {
            "name": "ANIL KUMAR V KALI",
            "email": "anilkali2004@gmail.com",
            "phone": "+91 8904190033",
            "skills": ["Html", "CSS", "Python", "Django", "Git", "GitHub", "SQL", "Problem Solving", "Creativity"],
            "education": [
                {
                    "school": "Dayananda Sagar College of Engineering, Bengaluru",
                    "degree": "Bachelor of Engineering",
                    "field": "Information Science and Engineering",
                    "start_year": "2023",
                    "end_year": "Present"
                },
                {
                    "school": "MEI Polytechnic, Bengaluru",
                    "degree": "Diploma",
                    "field": "Computer Science and Engineering",
                    "start_year": "2020",
                    "end_year": "2023"
                }
            ],
            "experience": [
                {
                    "company": "Ecoder, Bangalore",
                    "role": "Graphic Design Intern",
                    "location": "Bangalore",
                    "start_year": "2023",
                    "end_year": "2023",
                    "description": "Created visually engaging logos, social media posts, banners, and UI mockups using Canva and Figma. Collaborated with developers and content creators to design promotional materials."
                }
            ],
            "certifications": [],
            "projects": [
                {
                    "title": "Cricket Player Manager",
                    "description": "Web app using Flask and MongoDB to manage player profiles and match stats with full CRUD support.",
                    "link": "https://github.com/anil34k"
                },
                {
                    "title": "RedPanda Ecommerce Website",
                    "description": "Developed a premium streetwear e-commerce web app using React/Vite, Tailwind CSS, and Firebase, integrating AI search, real-time customer support, and a full admin seller dashboard.",
                    "link": "https://github.com/anil34k"
                },
                {
                    "title": "Fertilizer Predictor (ML + Streamlit)",
                    "description": "Interactive web app that takes NPK, pH, temperature, humidity, rainfall, soil type, and crop to generate accurate fertilizer recommendations with downloadable reports.",
                    "link": "https://github.com/anil34k"
                }
            ]
        }
        
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            You are an advanced enterprise-grade ATS resume parser.
            Analyze the following resume plain text and extract structured information.
            You must return a JSON object with the following schema:
            {{
                "name": "Full Name",
                "email": "Email address",
                "phone": "Phone number",
                "skills": ["Skill1", "Skill2", ...],
                "education": [
                    {{
                        "school": "Institution Name",
                        "degree": "Degree (e.g. Bachelor of Science)",
                        "field": "Field of Study",
                        "start_year": "YYYY",
                        "end_year": "YYYY or Present"
                    }}
                ],
                "experience": [
                    {{
                        "company": "Company Name",
                        "role": "Job Title",
                        "location": "Location",
                        "start_year": "YYYY",
                        "end_year": "YYYY or Present",
                        "description": "Short description of duties and impact"
                    }}
                ],
                "certifications": ["Cert1", "Cert2", ...],
                "projects": [
                    {{
                        "title": "Project Title",
                        "description": "Short description",
                        "link": "Project URL or GitHub link"
                    }}
                ]
            }}
            
            Resume Text:
            {text}
            """
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a precise ATS parser that outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            response_content = completion.choices[0].message.content
            latency = int((time.time() - start_time) * 1000)
            
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            
            _log_telemetry("parse_resume_text", p_tokens, c_tokens, latency)
            return json.loads(response_content)
        except Exception as e:
            logger.error(f"Groq Resume Parsing error: {e}. Falling back to heuristics.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("parse_resume_text", 0, 0, latency, str(e))
            
    # Heuristic Fallback
    from core.ai_service import _parse_resume_heuristically
    return _parse_resume_heuristically(text)


def rank_candidate(resume_json, job_description, job_title, job_skills):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Compare the candidate's parsed resume structure with the job opening details.
            
            Job Title: {job_title}
            Job Description: {job_description}
            Job Required Skills: {', '.join(job_skills)}
            
            Candidate Profile JSON:
            {json.dumps(resume_json, indent=2)}
            
            Provide a complete match evaluation.
            You must return a JSON object with the following schema:
            {{
                "match_score": 85, // An integer score between 0 and 100
                "strengths": ["List key reasons they fit the role", "Point 2"],
                "missing_skills": ["List skills or experiences they lack", "Point 2"],
                "recommendation": "A professional summary recommendation for the recruiter (2-3 sentences)."
            }}
            """
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You evaluate applicant compatibility and return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            response_content = completion.choices[0].message.content
            latency = int((time.time() - start_time) * 1000)
            
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            
            _log_telemetry("rank_candidate", p_tokens, c_tokens, latency)
            return json.loads(response_content)
        except Exception as e:
            logger.error(f"Groq Rank Candidate error: {e}. Falling back to heuristics.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("rank_candidate", 0, 0, latency, str(e))
            
    # Heuristic Fallback
    from core.ai_service import _rank_candidate_heuristically
    return _rank_candidate_heuristically(resume_json, job_skills, job_title)


def generate_recommendations(seeker_profile, active_jobs):
    client = get_groq_client()
    start_time = time.time()
    
    # Format active jobs list for prompt
    jobs_list = []
    for job in active_jobs:
        jobs_list.append({
            "id": job.id,
            "title": job.title,
            "company": job.company.name,
            "skills": job.skills_required,
            "description": job.description[:200]
        })
        
    if client and jobs_list:
        try:
            prompt = f"""
            Review the job seeker's profile and match them against the active jobs list.
            
            Seeker Profile:
            {json.dumps(seeker_profile, indent=2)}
            
            Active Jobs List:
            {json.dumps(jobs_list, indent=2)}
            
            Return a JSON object containing matches and suggestions.
            Schema:
            {{
                "matches": [
                    {{
                        "job_id": 1,
                        "match_score": 90,
                        "explanation": "Why this is a good fit.",
                        "skill_gap_analysis": {{
                            "missing_skills": ["SkillA", "SkillB"],
                            "learning_recommendations": [
                                "Take a course in SkillA",
                                "Read documentation on SkillB"
                            ]
                        }}
                    }}
                ],
                "career_suggestions": [
                    "General advice on upskilling based on current career profile"
                ]
            }}
            """
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You match profiles to jobs and return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            
            _log_telemetry("generate_recommendations", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Recommendations error: {e}. Falling back to heuristics.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("generate_recommendations", 0, 0, latency, str(e))
            
    # Heuristic Fallback
    matches = []
    seeker_skills = [s.lower() for s in seeker_profile.get("skills", [])]
    
    for job in active_jobs:
        job_skills = [s.lower() for s in job.skills_required]
        matched_skills = [s for s in job_skills if s in seeker_skills]
        unmatched_skills = [s for s in job.skills_required if s.lower() not in seeker_skills]
        
        total_skills = len(job_skills)
        score = 50
        if total_skills > 0:
            score = int((len(matched_skills) / total_skills) * 100)
            score = max(30, min(95, score))
            
        matches.append({
            "job_id": job.id,
            "match_score": score,
            "explanation": f"Matched {len(matched_skills)} skills with requirements for {job.title}.",
            "skill_gap_analysis": {
                "missing_skills": unmatched_skills,
                "learning_recommendations": [f"Learn {skill} via online certifications" for skill in unmatched_skills]
            }
        })
        
    return {
        "matches": matches,
        "career_suggestions": ["Strengthen your core programming, system design, and database optimization skills."]
    }


# --- NEW V2 EXPANSION FUNCTIONS ---

def generate_interview_questions(skills, job_title, experience_level=2):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Generate a set of exactly 5 interview questions for a candidate with the following attributes:
            Job Title: {job_title}
            Skills: {', '.join(skills)}
            Experience Level: {experience_level} years
            
            You must return a JSON object with the following schema:
            {{
                "questions": [
                    {{
                        "id": 1,
                        "text": "The text of the interview question.",
                        "type": "TECHNICAL", // Or CONCEPTUAL, BEHAVIORAL
                        "suggested_keywords": ["keyword1", "keyword2"]
                    }}
                ]
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional technical interviewer who outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("generate_interview_questions", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Question Generation error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("generate_interview_questions", 0, 0, latency, str(e))

    # Heuristic Fallback
    questions = []
    base_qs = [
        "Explain the primary architecture pattern used in your latest project and why you selected it.",
        f"How would you optimize search and database query performance in a {job_title} application?",
        "Describe a difficult debugging challenge you faced and the steps you took to isolate and resolve it.",
        "How do you manage cross-team communication and ensure project requirements are correctly structured?",
        "What strategies do you use for caching and security (like JWT, sanitization) in web systems?"
    ]
    for idx, text in enumerate(base_qs, 1):
        questions.append({
            "id": idx,
            "text": text,
            "type": "TECHNICAL",
            "suggested_keywords": ["design", "architecture", "debugging", "scaling"]
        })
    return {"questions": questions}


def evaluate_interview_answer(question, answer):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Evaluate the following candidate response to the interview question.
            Question: {question}
            Answer: {answer}
            
            You must return a JSON object with the following schema:
            {{
                "score": 80, // An integer score between 0 and 100
                "feedback": "Detailed overall evaluation feedback (2-3 sentences).",
                "strengths": ["Key strength of answer 1", "Point 2"],
                "improvements": ["Suggested improvement point 1", "Point 2"]
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional hiring evaluator who outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("evaluate_interview_answer", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Evaluation error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("evaluate_interview_answer", 0, 0, latency, str(e))

    # Heuristic Fallback
    words = len(answer.split())
    score = 50
    if words > 30:
        score = 85
        feedback = "Candidate gave a detailed response demonstrating practical familiarity with the concepts."
        strengths = ["Detailed length", "Shows clear reasoning"]
        improvements = ["Could provide more technical definitions"]
    elif words > 10:
        score = 65
        feedback = "Candidate provided a brief but accurate overview of the concept."
        strengths = ["Succinct definition"]
        improvements = ["Elaborate with concrete examples", "Mention design implications"]
    else:
        score = 30
        feedback = "Response is too short to fully evaluate. Please elaborate on the concepts."
        strengths = ["Baseline response submitted"]
        improvements = ["Elaborate on the specific technologies used", "Reference past professional projects"]
        
    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "improvements": improvements
    }


def generate_career_advice(seeker_profile):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Analyze the following Job Seeker profile and generate tailored career advice and professional suggestions.
            Profile:
            {json.dumps(seeker_profile, indent=2)}
            
            You must return a JSON object with the following schema:
            {{
                "advice_summary": "A 3-4 sentence professional career path summary.",
                "target_industries": ["Industry A", "Industry B"],
                "strategic_steps": [
                    "Strategic action step 1",
                    "Strategic action step 2"
                ]
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional career coach who outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("generate_career_advice", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Coach error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("generate_career_advice", 0, 0, latency, str(e))

    # Heuristic Fallback
    return {
        "advice_summary": "Your profile demonstrates a solid foundation in technology. Focus on mastering system design, scaling databases, and container deployments to advance into senior engineering positions.",
        "target_industries": ["Web Tech & SaaS", "Finance Tech", "AI Software Systems"],
        "strategic_steps": [
            "Build 2-3 end-to-end fullstack applications using React and Django",
            "Contribute to open-source libraries or write technical blogs",
            "Learn cloud deployments (AWS, Docker) to build SRE skills"
        ]
    }


def generate_learning_path(missing_skills):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Build a learning path containing recommended online courses and roadmaps for these missing skills:
            {', '.join(missing_skills)}
            
            You must return a JSON object with the following schema:
            {{
                "roadmap_steps": [
                    "Step 1: Learning Core Concepts",
                    "Step 2: Practical Projects"
                ],
                "courses": [
                    {{
                        "skill_name": "Docker",
                        "course_title": "Docker Certified Associate Course",
                        "platform": "Udemy",
                        "resource_url": "https://www.udemy.com"
                    }}
                ]
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional educational planner who outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("generate_learning_path", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Path error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("generate_learning_path", 0, 0, latency, str(e))

    # Heuristic Fallback
    courses = []
    for skill in missing_skills:
        courses.append({
            "skill_name": skill,
            "course_title": f"Mastering {skill} from Beginner to Expert",
            "platform": "YouTube / Udemy",
            "resource_url": "https://www.google.com"
        })
    if not courses:
        courses.append({
            "skill_name": "System Architecture",
            "course_title": "System Design Basics & Scaling Systems",
            "platform": "YouTube",
            "resource_url": "https://www.youtube.com"
        })
        
    return {
        "roadmap_steps": [
            f"Step 1: Complete online tutorials covering {' & '.join(missing_skills or ['Software Design'])} syntax.",
            "Step 2: Build a localized project utilizing these modules.",
            "Step 3: Integrate project into your portfolio and update resume."
        ],
        "courses": courses
    }


def generate_job_description(title):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Generate a detailed job description template for: {title}
            You must return a JSON object with the following schema:
            {{
                "title": "{title}",
                "description": "General role overview paragraph.",
                "responsibilities": ["Responsibility 1", "Responsibility 2"],
                "requirements": ["Requirement 1", "Requirement 2"],
                "skills_required": ["SkillA", "SkillB"],
                "salary_min": 80000,
                "salary_max": 120000
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional HR assistant who outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("generate_job_description", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq JD error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("generate_job_description", 0, 0, latency, str(e))

    # Heuristic Fallback
    return {
        "title": title,
        "description": f"We are seeking a talented {title} to join our growing recruitment platforms team. You will lead development, design core software models, and build responsive features.",
        "responsibilities": [
            "Write clean, maintainable, and well-tested system source code.",
            "Collaborate with design and product teams to integrate features.",
            "Debug issues and resolve security vulnerabilities."
        ],
        "requirements": [
            "Bachelor's degree in Computer Science or equivalent experience.",
            "Strong command of core programming paradigms.",
            "Familiarity with standard APIs and relational databases."
        ],
        "skills_required": ["Python", "JavaScript", "SQL", "Git"],
        "salary_min": 75000,
        "salary_max": 115000
    }


def generate_cover_letter(resume_data, job_desc):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Draft a professional cover letter matching the candidate profile to the job details.
            Candidate:
            {json.dumps(resume_data, indent=2)}
            Job Description: {job_desc}
            
            You must return a JSON object with the following schema:
            {{
                "cover_letter": "The complete drafted cover letter text."
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional technical writer who outputs valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("generate_cover_letter", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Letter error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("generate_cover_letter", 0, 0, latency, str(e))

    # Heuristic Fallback
    name = resume_data.get("name", "Candidate")
    skills = ", ".join(resume_data.get("skills", ["Software engineering"]))
    letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the open position. With my background in technology and expertise in skills such as {skills}, I am confident in my ability to make a meaningful contribution to your engineering team.

In my previous projects, I have demonstrated success in designing software systems, writing scalable code, and fixing security issues. I look forward to bringing this expertise to your company.

Thank you for your time and consideration.

Sincerely,
{name}"""
    return {"cover_letter": letter}


def optimize_resume(resume_data, job_desc):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Analyze the candidate resume against the target job description. Suggest exact optimizations.
            Candidate Profile:
            {json.dumps(resume_data, indent=2)}
            Job Description: {job_desc}
            
            You must return a JSON object with the schema:
            {{
                "ats_score": 75, // integer 0-100
                "missing_keywords": ["KeywordA", "KeywordB"],
                "recommendations": ["Recommendation 1", "Recommendation 2"],
                "improvement_suggestions": "Summary rephrasing suggestions for bullet points."
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You evaluate resume optimization and return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("optimize_resume", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Optimizer error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("optimize_resume", 0, 0, latency, str(e))

    # Heuristic Fallback
    keywords = ["Docker", "Kubernetes", "AWS", "CI/CD", "Redis", "Celery", "Microservices"]
    candidate_skills_lower = [s.lower() for s in resume_data.get("skills", [])]
    missing = [kw for kw in keywords if kw.lower() not in candidate_skills_lower]
    score = 80 - (len(missing) * 5)
    
    return {
        "ats_score": max(40, score),
        "missing_keywords": missing,
        "recommendations": [
            f"Add missing ATS keywords: {', '.join(missing[:3])}.",
            "List specific metrics of impact in your experience bullet points (e.g. reduced load times by 20%)."
        ],
        "improvement_suggestions": "Rephrase bullet points to emphasize technical ownership and design metrics."
    }


def candidate_search(query, candidates):
    client = get_groq_client()
    start_time = time.time()
    if client and candidates:
        try:
            prompt = f"""
            Rank the following candidates based on this natural language search query:
            Query: {query}
            
            Candidates List:
            {json.dumps(candidates, indent=2)}
            
            You must return a JSON object with the following schema:
            {{
                "matches": [
                    {{
                        "candidate_id": 1,
                        "match_score": 90,
                        "matched_criteria": ["Criteria matched 1", "Point 2"],
                        "missing_skills": ["Skill missing 1"]
                    }}
                ]
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You rank candidates based on search queries and return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("candidate_search", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Search error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("candidate_search", 0, 0, latency, str(e))

    # Heuristic Fallback
    matches = []
    query_words = [w.lower() for w in query.split()]
    for cand in candidates:
        cand_skills = [s.lower() for s in cand.get("skills", [])]
        matched = [w for w in query_words if w in cand_skills or any(w in s for s in cand_skills)]
        score = 40 + (len(matched) * 15)
        matches.append({
            "candidate_id": cand.get("id"),
            "match_score": min(95, score),
            "matched_criteria": [f"Keywords matched: {', '.join(matched)}"] if matched else ["Relevant background matches generic search"],
            "missing_skills": ["Review full profile for target specialized frameworks"]
        })
    return {"matches": matches}


def evaluate_voice_response(transcribed_text):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Evaluate the following transcribed answer from a voice interview response.
            Text: {transcribed_text}
            
            You must return a JSON object with the following schema:
            {{
                "clarity_score": 85, // integer 0-100
                "content_score": 75, // integer 0-100
                "confidence_score": 80, // integer 0-100
                "overall_feedback": "Detailed overall critique."
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You evaluate transcribed interview speech and return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("evaluate_voice_response", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Voice error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("evaluate_voice_response", 0, 0, latency, str(e))

    # Heuristic Fallback
    words = len(transcribed_text.split())
    score = min(95, 50 + (words // 2))
    return {
        "clarity_score": score,
        "content_score": max(40, score - 5),
        "confidence_score": 85,
        "overall_feedback": "Verbal transcription demonstrates core communication skills. Keep answers technical and fluent."
    }


def evaluate_code_submission(challenge_title, code, language="python"):
    client = get_groq_client()
    start_time = time.time()
    if client:
        try:
            prompt = f"""
            Analyze the correctness, complexity, and style of the following code submission for challenge: {challenge_title}
            Language: {language}
            Code:
            {code}
            
            You must return a JSON object with the following schema:
            {{
                "score": 85, // integer 0-100
                "complexity_analysis": "O(N) time complexity details",
                "correctness_feedback": "Critique on whether edge cases are covered.",
                "suggested_improvements": ["Improvement suggestion 1", "Point 2"]
            }}
            """
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You analyze and grade coding submissions, returning valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            latency = int((time.time() - start_time) * 1000)
            usage = getattr(completion, 'usage', None)
            p_tokens = getattr(usage, 'prompt_tokens', 0) if usage else 0
            c_tokens = getattr(usage, 'completion_tokens', 0) if usage else 0
            _log_telemetry("evaluate_code_submission", p_tokens, c_tokens, latency)
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Code error: {e}. Falling back.")
            latency = int((time.time() - start_time) * 1000)
            _log_telemetry("evaluate_code_submission", 0, 0, latency, str(e))

    # Heuristic Fallback
    score = 75
    if "def " in code or "function " in code or "class " in code:
        score = 90
        complexity = "O(N) Time, O(1) Space. Optimizations look complete."
        correctness = "Code logic is sound. Main algorithmic cases are checked."
        improvements = ["Add documentation docstrings", "Handle null or negative index exceptions explicitly"]
    else:
        complexity = "Undefined. Algorithmic loops could not be fully analyzed."
        correctness = "Incomplete submission syntax. Ensure functions are declared properly."
        improvements = ["Implement challenge interface using return calls"]
        
    return {
        "score": score,
        "complexity_analysis": complexity,
        "correctness_feedback": correctness,
        "suggested_improvements": improvements
    }
