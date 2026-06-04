# AIHire Pro — AI-Powered Job Recommendation & Recruitment Platform

AIHire Pro is a decoupled, enterprise-grade recruitment ecosystem consisting of a headless Django REST Framework API backend and a premium skeuomorphic React frontend client. The platform integrates with the Groq API (using Llama 3.3 models) for parsing resumes, candidate matching, and automated career guidance.

## Project Structure

```text
├── backend/                  # Django REST API Backend
│   ├── aihire_pro/          # Core Django configuration settings
│   ├── api/                 # DRF Serializers, Views, and REST URL routing
│   ├── core/                # Groq API service layers & logs models
│   ├── jobs/                # Job posts, applications & hires schemas
│   ├── resumes/             # File uploads and parsed models
│   └── users/               # Custom User models & seeker/company profiles
│
└── frontend/                 # Vite React Frontend
    ├── public/              # Global static assets
    └── src/
        ├── components/      # Skeuomorphic components (ScoreGauge, toast alerts)
        ├── pages/           # Landing, Auth, Seeker, Recruiter, Admin pages
        ├── api.js           # Native fetch wrapper with JWT headers & automatic 401 token refresh
        └── index.css        # Tailwind directives + custom 3D skeuomorphic styles
```

---

## 1. Backend Quickstart Setup

### Prerequisites
- Python 3.10+
- virtualenv

### Installation Steps

1. Navigate to the backend directory:
   ```cmd
   cd backend
   ```

2. Initialize a Python virtual environment:
   ```cmd
   python -m venv venv
   ```

3. Activate the environment:
   - On Windows (PowerShell):
     ```cmd
     .\venv\Scripts\Activate.ps1
     ```
   - On Mac/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install Python dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

5. Configure your environmental settings in `backend/.env`. Key configurations:
   ```text
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   DEBUG=True
   ```
   *Note: If no Groq API Key is specified, the system automatically falls back to clean, local heuristic rules to compute matching percentages and list missing skills, preventing system downtime.*

6. Generate and execute database migrations:
   ```cmd
   python manage.py makemigrations users jobs resumes core
   python manage.py migrate
   ```

7. Create an admin user programmatically (creates superuser with username `admin` and password `admin123`):
   ```cmd
   python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aihire_pro.settings'); django.setup(); from users.models import User; User.objects.create_superuser('admin', 'admin@aihirepro.com', 'admin123', first_name='Admin', last_name='User', role='ADMIN') if not User.objects.filter(username='admin').exists() else print('Admin exists')"
   ```

8. Run the Django API Server (launches at `http://localhost:8000`):
   ```cmd
   python manage.py runserver
   ```

---

## 2. Frontend Quickstart Setup

### Prerequisites
- Node.js (v18+)
- npm

### Installation Steps

1. Navigate to the frontend directory:
   ```cmd
   cd frontend
   ```

2. Install default React dependencies:
   ```cmd
   npm install
   ```

3. Start the Vite React development server (launches at `http://localhost:5173`):
   ```cmd
   npm run dev
   ```

---

## 3. Verify Applications Features

- **Automated Tests:**
  To run Django API test suites, run the following command in the `backend/` folder:
  ```cmd
  .\venv\Scripts\python manage.py test
  ```

- **Recruitment workflows:**
  1. Open `http://localhost:5173` in a web browser.
  2. Click **Create Account** and register as a **Job Seeker**.
  3. Upload a resume file (PDF or DOCX) in the Drag & Drop area. The Groq API parses credentials into a structured table.
  4. Log out and register a new **Company** Recruiter profile.
  5. Go to **Job Openings** and click **Post New Job**. Specify required skills and details.
  6. Log back in as a Seeker. Click **AI Job Matches** to view matching jobs with compatibility percentages, and review skill gap analyses.
  7. Click **Apply**.
  8. Log back in as the Recruiter, click **Applicants & AI Rank** to view the candidate sorted automatically by matching percentage. Click **Assess** to inspect strengths, missing skills, and hire the candidate. A selection email is automatically generated.
