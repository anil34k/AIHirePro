# Core AI Service Layer (Redirects to Centralized core/services/ai_service.py)
from core.services.ai_service import (
    get_groq_client,
    parse_resume_text,
    rank_candidate,
    generate_recommendations,
    _parse_resume_heuristically,
    _rank_candidate_heuristically
)
