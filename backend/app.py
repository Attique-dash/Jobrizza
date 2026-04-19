from flask import Flask, request, jsonify, g
from flask_cors import CORS
import os
import re
import json
import uuid
import bcrypt
import requests
from functools import wraps
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from datetime import datetime, timedelta

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import docx
except ImportError:
    docx = None

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000')
origins_list = [o.strip() for o in CORS_ORIGINS.split(',') if o.strip()]
CORS(app, origins=origins_list, supports_credentials=True)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGODB_URI = os.environ.get('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError('MONGODB_URI environment variable is required')

mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = mongo_client.get_default_database()

users_collection               = db['users']
cv_data_collection             = db['cv_data']
cv_versions_collection         = db['cv_versions']
applications_collection        = db['applications']
linkedin_optimizations_collection = db['linkedin_optimizations']
job_alerts_collection          = db['job_alerts']
gamification_collection        = db['gamification']
portfolios_collection          = db['portfolios']
interview_gradings_collection  = db['interview_gradings']
network_contacts_collection    = db['network_contacts']

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production-32-chars!!')

# ── OpenRouter AI ─────────────────────────────────────────────────────────────
OPENROUTER_API_KEY  = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL    = "openai/gpt-oss-120b:free"


def call_ai(system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str | None:
    """Call OpenRouter gpt-oss-120b:free. Drop-in for old call_claude()."""
    if not OPENROUTER_API_KEY:
        print("OPENROUTER_API_KEY not set – AI features disabled")
        return None

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Jobrizza",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    }
    try:
        resp = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except requests.exceptions.Timeout:
        print("OpenRouter timeout")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"OpenRouter HTTP {e.response.status_code}: {e.response.text[:300]}")
        return None
    except Exception as e:
        print(f"OpenRouter error: {e}")
        return None


# Backward-compat alias
call_claude = call_ai
cv_data_store: list = []


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_password(password: str) -> str:
    """Hash password using bcrypt (secure)"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def verify_token(token: str) -> str | None:
    """Accept 'token_<uuid>' format (what Flask returns on login)."""
    if not token:
        return None
    # Strip "Bearer " prefix if present
    if token.startswith('Bearer '):
        token = token[7:]
    if token.startswith('token_'):
        user_id = token[6:]  # strip "token_"
        user = users_collection.find_one({'id': user_id})
        return user_id if user else None
    return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        user_id = verify_token(auth_header)
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        user = users_collection.find_one({'id': user_id}, {'password_hash': 0})
        if not user:
            return jsonify({'error': 'User not found'}), 401
        g.current_user = user
        g.user_id = user_id
        return f(*args, **kwargs)
    return decorated


# ── File extraction ───────────────────────────────────────────────────────────
def extract_text_from_pdf(filepath):
    if PyPDF2 is None:
        return "PDF extraction not available – install PyPDF2"
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
    except Exception as e:
        return f"Error reading PDF: {e}"
    return text


def extract_text_from_docx(filepath):
    if docx is None:
        return "DOCX extraction not available – install python-docx"
    try:
        doc = docx.Document(filepath)
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        return f"Error reading DOCX: {e}"


# ── CV parsing ────────────────────────────────────────────────────────────────
def parse_cv_data(text: str, filename: str) -> dict:
    data = {
        'filename': filename,
        'raw_text': text[:3000],
        'email': None, 'phone': None, 'skills': [],
        'name': None, 'education': [], 'experience': [],
        'word_count': len(text.split()),
    }

    m = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if m:
        data['email'] = m.group(0)

    for pattern in [r'\+?[\d\s\-\(\)]{10,20}', r'\(\d{3}\)\s*\d{3}[\s-]?\d{4}']:
        m = re.search(pattern, text)
        if m:
            data['phone'] = m.group(0).strip()
            break

    common_skills = [
        'python','javascript','typescript','java','c++','c#','go','rust',
        'react','angular','vue','next.js','node.js','django','flask','fastapi',
        'spring','express','sql','mysql','postgresql','mongodb','redis',
        'aws','azure','gcp','docker','kubernetes','git','ci/cd','agile','scrum',
        'machine learning','deep learning','tensorflow','pytorch','data analysis',
        'tableau','power bi','excel','pandas','numpy','scikit-learn','rest api',
        'graphql','microservices','project management','leadership','communication',
        'problem solving','teamwork','devops','linux','figma','photoshop',
    ]
    text_lower = text.lower()
    data['skills'] = [s for s in common_skills if s in text_lower]

    lines = text.split('\n')[:10]
    for line in lines:
        line = line.strip()
        if line and 2 < len(line) < 50 and not re.match(r'^[\d\W]', line) and 'email' not in line.lower():
            if 'name' in line.lower() and ':' in line:
                data['name'] = line.split(':')[1].strip()
            elif not data['name'] and line[0].isupper():
                data['name'] = line
            break

    edu_kw = ['bachelor','master','phd','b.s.','m.s.','degree','university','college','school','b.tech','m.tech']
    for kw in edu_kw:
        if kw in text_lower:
            for sentence in re.split(r'[.\n]', text):
                if kw in sentence.lower() and len(sentence.strip()) > 10:
                    data['education'].append(sentence.strip()[:150])
                    break

    for kw in ['experience','worked at','employed','position','role','company']:
        if kw in text_lower:
            for sentence in re.split(r'[.\n]', text)[:20]:
                if kw in sentence.lower() and len(sentence.strip()) > 20:
                    data['experience'].append(sentence.strip()[:150])
                    break
    return data


# ── Legacy CV quality analysis (rule-based, no AI) ───────────────────────────

def analyze_cv_quality(cv_data: dict, text: str) -> dict:
    score = 0
    mistakes, suggestions = [], []
    categories = {
        'contact_info':  {'score': 0, 'max': 15, 'issues': []},
        'structure':     {'score': 0, 'max': 20, 'issues': []},
        'content':       {'score': 0, 'max': 25, 'issues': []},
        'skills':        {'score': 0, 'max': 20, 'issues': []},
        'grammar_style': {'score': 0, 'max': 20, 'issues': []},
    }

    if cv_data.get('email'):
        categories['contact_info']['score'] += 5
    else:
        mistakes.append('No email address detected')
        suggestions.append('Add a professional email address at the top of your CV')

    if cv_data.get('phone'):
        categories['contact_info']['score'] += 5
    else:
        mistakes.append('No phone number detected')

    if cv_data.get('name'):
        categories['contact_info']['score'] += 5
    else:
        mistakes.append('Name not clearly detected')

    text_lower = text.lower()
    if any(w in text_lower for w in ['summary','objective','profile','about']):
        categories['structure']['score'] += 5
    else:
        mistakes.append('No professional summary found')
        suggestions.append('Add a 2-3 line professional summary')

    if cv_data.get('education'):
        categories['structure']['score'] += 5
    else:
        mistakes.append('Education section unclear')

    if cv_data.get('experience'):
        categories['structure']['score'] += 5
    else:
        mistakes.append('Work experience section missing or unclear')

    if cv_data.get('skills'):
        categories['structure']['score'] += 5

    wc = cv_data.get('word_count', len(text.split()))
    if 200 <= wc <= 800:
        categories['content']['score'] += 10
    elif wc < 200:
        mistakes.append('CV content is too brief')
    else:
        mistakes.append('CV is too lengthy')

    action_verbs = ['managed','led','developed','created','implemented','designed',
                    'achieved','improved','increased','reduced','launched','built']
    if sum(1 for v in action_verbs if v in text_lower) >= 3:
        categories['content']['score'] += 10
    else:
        suggestions.append('Use strong action verbs')

    if re.search(r'\d+%|\$\d+|\d+\s*(years?|months?|people)', text_lower):
        categories['content']['score'] += 5
    else:
        suggestions.append('Add numbers to achievements (e.g., "Increased sales by 25%")')

    sc = len(cv_data.get('skills', []))
    if sc >= 8:   categories['skills']['score'] += 15
    elif sc >= 5: categories['skills']['score'] += 10
    elif sc >= 3: categories['skills']['score'] += 5
    else:         suggestions.append('Add more relevant skills')

    if sum(1 for s in ['communication','leadership','teamwork','problem solving'] if s in text_lower) >= 2:
        categories['skills']['score'] += 5

    grammar_issues = sum(1 for p in [r'\b(\w+) \1\b', r'  +', r'[A-Z]{5,}'] if re.search(p, text))
    if grammar_issues == 0:
        categories['grammar_style']['score'] += 10
    else:
        mistakes.append('Potential grammar or formatting issues detected')

    if text.count('•') + text.count('-') + text.count('*') >= 5:
        categories['grammar_style']['score'] += 10
    else:
        suggestions.append('Use bullet points for better readability')

    total = sum(c['score'] for c in categories.values())
    pct = round((total / 100) * 100)

    if pct >= 85:   status, msg = 'Excellent', 'Your CV is professional and well-structured!'
    elif pct >= 70: status, msg = 'Good',      'Good CV with minor improvements needed'
    elif pct >= 50: status, msg = 'Average',   'Your CV needs some improvements'
    else:           status, msg = 'Needs Work', 'Significant improvements recommended'

    return {
        'score': total, 'max_score': 100, 'percentage': pct,
        'status': status, 'status_message': msg, 'categories': categories,
        'mistakes': mistakes or ['No major issues found'],
        'suggestions': suggestions or ['Great job! Your CV looks professional'],
        'word_count': wc, 'skills_count': sc,
    }


# ─── AI-powered analysis ──────────────────────────────────────────────────────

def ai_full_analysis(text: str, cv_data: dict) -> dict:
    prompt = f"""You are an expert CV/resume analyst. Analyze this CV and return ONLY valid JSON.

CV TEXT:
{text[:2500]}

Return this exact JSON structure:
{{
  "ats_score": {{
    "score": 0-100,
    "grade": "A/B/C/D/F",
    "keyword_density": "low/medium/high",
    "format_issues": ["list of formatting problems"],
    "missing_keywords": ["list of ATS keywords missing"],
    "passed_checks": ["list of things that passed ATS"]
  }},
  "mistake_detector": {{
    "grammar_errors": ["specific grammar mistakes found"],
    "employment_gaps": ["any employment gaps detected"],
    "weak_action_verbs": ["weak phrases and better alternatives"],
    "missing_metrics": ["places where numbers/metrics are missing"],
    "overall_writing_score": 0-100
  }},
  "template_suggestion": {{
    "current_format": "description of current format",
    "recommended_template": "Chronological/Functional/Hybrid/Modern/Executive",
    "reasons": ["why this template suits better"],
    "before_after_tips": ["specific layout improvements"]
  }}
}}"""

    result = call_claude(
        "You are an expert CV analyst. Return ONLY valid JSON with no markdown or commentary.",
        prompt,
        2000
    )

    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "ats_score": {
            "score": 62,
            "grade": "C",
            "keyword_density": "medium",
            "format_issues": ["Use standard section headings", "Ensure consistent date formatting"],
            "missing_keywords": ["quantified achievements", "industry-specific certifications"],
            "passed_checks": ["Contact info present", "Skills section included"]
        },
        "mistake_detector": {
            "grammar_errors": ["Check for passive voice usage", "Inconsistent tense in descriptions"],
            "employment_gaps": ["No significant gaps detected"],
            "weak_action_verbs": ["'Responsible for' → 'Managed'", "'Helped with' → 'Contributed to'"],
            "missing_metrics": ["Add % improvements", "Add team size you managed", "Add project budgets"],
            "overall_writing_score": 58
        },
        "template_suggestion": {
            "current_format": "Basic chronological",
            "recommended_template": "Hybrid",
            "reasons": ["Hybrid format showcases both skills and experience", "Better for mid-career professionals"],
            "before_after_tips": ["Move skills to a sidebar", "Add a metrics-driven summary section", "Use two-column layout"]
        }
    }


def ai_skill_gap(cv_data: dict, target_role: str = "") -> dict:
    skills_str = ", ".join(cv_data.get('skills', []))
    role = target_role or "Software Engineer"

    prompt = f"""You are a career advisor. Analyze skill gaps for this candidate.

Current skills: {skills_str}
Target role: {role}
Experience snippets: {" | ".join(cv_data.get('experience', [])[:3])}

Return ONLY this JSON:
{{
  "target_role": "{role}",
  "match_percentage": 0-100,
  "strong_skills": ["skills they have that are highly relevant"],
  "missing_critical": ["critical skills missing - list 4-6"],
  "missing_nice_to_have": ["nice-to-have skills missing - list 3-5"],
  "market_demand": {{
    "trending_up": ["skills gaining demand"],
    "trending_down": ["skills losing relevance"],
    "salary_impact": "Adding X skill could increase salary by Y%"
  }},
  "quick_wins": ["skills that could be learned in under 2 weeks"]
}}"""

    result = call_claude("You are a career advisor. Return ONLY valid JSON.", prompt, 1200)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "target_role": role,
        "match_percentage": 65,
        "strong_skills": cv_data.get('skills', [])[:4],
        "missing_critical": ["System Design", "Cloud Architecture", "CI/CD Pipelines", "Performance Optimization"],
        "missing_nice_to_have": ["GraphQL", "Kubernetes", "Terraform"],
        "market_demand": {
            "trending_up": ["AI/ML integration", "TypeScript", "Cloud Native"],
            "trending_down": ["jQuery", "Monolithic architectures"],
            "salary_impact": "Adding cloud skills could increase salary by 15-25%"
        },
        "quick_wins": ["Git advanced workflows", "REST API best practices", "Basic Docker"]
    }


def ai_job_matches(cv_data: dict) -> list:
    skills_str = ", ".join(cv_data.get('skills', [])[:8])

    prompt = f"""You are a job matching engine. Generate 6 realistic job matches.

Candidate skills: {skills_str}
Education: {" | ".join(cv_data.get('education', []))[:200]}

Return ONLY this JSON array:
[
  {{
    "id": "j1",
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, Country",
    "type": "Full-time/Remote/Hybrid",
    "salary_min": 60000,
    "salary_max": 90000,
    "currency": "USD",
    "match_score": 0-100,
    "match_reasons": ["reason 1", "reason 2"],
    "skills_matched": ["skill1", "skill2"],
    "skills_missing": ["skill1"],
    "posted_days_ago": 1-14,
    "company_size": "50-200/200-1000/1000+"
  }}
]

Generate 6 jobs with realistic companies and varying match scores (55-96%)."""

    result = call_claude("You are a job matching AI. Return ONLY a valid JSON array.", prompt, 1500)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return [
        {"id": "j1", "title": "Senior Software Engineer", "company": "TechFlow Inc.", "location": "Remote",
         "type": "Full-time", "salary_min": 95000, "salary_max": 130000, "currency": "USD",
         "match_score": 92, "match_reasons": ["Strong Python skills", "Backend experience"],
         "skills_matched": ["python", "sql", "docker"], "skills_missing": ["kubernetes"],
         "posted_days_ago": 2, "company_size": "200-1000"},
        {"id": "j2", "title": "Full Stack Developer", "company": "Innovate Labs", "location": "New York, NY",
         "type": "Hybrid", "salary_min": 85000, "salary_max": 115000, "currency": "USD",
         "match_score": 87, "match_reasons": ["React + Node.js match", "Agile experience"],
         "skills_matched": ["react", "node.js", "mongodb"], "skills_missing": ["graphql"],
         "posted_days_ago": 4, "company_size": "50-200"},
        {"id": "j3", "title": "Backend Engineer", "company": "DataBridge Corp", "location": "San Francisco, CA",
         "type": "Full-time", "salary_min": 110000, "salary_max": 145000, "currency": "USD",
         "match_score": 79, "match_reasons": ["Database expertise", "API development"],
         "skills_matched": ["postgresql", "python", "rest api"], "skills_missing": ["aws", "terraform"],
         "posted_days_ago": 1, "company_size": "1000+"},
        {"id": "j4", "title": "Frontend Developer", "company": "PixelCraft", "location": "London, UK",
         "type": "Remote", "salary_min": 65000, "salary_max": 90000, "currency": "GBP",
         "match_score": 74, "match_reasons": ["JavaScript proficiency", "UI skills"],
         "skills_matched": ["javascript", "react"], "skills_missing": ["typescript", "figma"],
         "posted_days_ago": 7, "company_size": "50-200"},
        {"id": "j5", "title": "DevOps Engineer", "company": "CloudScale", "location": "Dubai, UAE",
         "type": "Full-time", "salary_min": 80000, "salary_max": 110000, "currency": "USD",
         "match_score": 65, "match_reasons": ["Docker knowledge", "Git experience"],
         "skills_matched": ["docker", "git", "linux"], "skills_missing": ["kubernetes", "aws", "terraform"],
         "posted_days_ago": 10, "company_size": "50-200"},
        {"id": "j6", "title": "Data Analyst", "company": "Metrics Pro", "location": "Lahore, PK",
         "type": "Hybrid", "salary_min": 35000, "salary_max": 55000, "currency": "USD",
         "match_score": 71, "match_reasons": ["SQL expertise", "Data analysis skills"],
         "skills_matched": ["sql", "python", "excel"], "skills_missing": ["tableau", "power bi"],
         "posted_days_ago": 3, "company_size": "50-200"},
    ]


def ai_learning_recommendations(missing_skills: list) -> dict:
    skills_str = ", ".join(missing_skills[:6])

    prompt = f"""You are a learning advisor. Generate learning resources for these skills: {skills_str}

Return ONLY this JSON:
{{
  "recommendations": [
    {{
      "skill": "skill name",
      "priority": "Critical/Important/Nice-to-have",
      "estimated_hours": 20,
      "resources": [
        {{
          "title": "Resource title",
          "platform": "YouTube/Coursera/Udemy/FreeCodeCamp/Official Docs",
          "url": "https://...",
          "duration": "X hours",
          "free": true/false,
          "rating": 4.5
        }}
      ],
      "milestone": "What you can build after learning this"
    }}
  ],
  "learning_path_weeks": 12,
  "total_free_hours": 40
}}

Generate 4-5 skill recommendations with 2 resources each."""

    result = call_claude("You are a learning advisor. Return ONLY valid JSON.", prompt, 1500)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    recs = []
    for i, skill in enumerate(missing_skills[:5]):
        recs.append({
            "skill": skill,
            "priority": "Critical" if i < 2 else "Important",
            "estimated_hours": 15 + (i * 5),
            "resources": [
                {"title": f"Learn {skill.title()} - Full Course", "platform": "YouTube", "url": "https://youtube.com", "duration": "4 hours", "free": True, "rating": 4.5},
                {"title": f"{skill.title()} for Professionals", "platform": "Coursera", "url": "https://coursera.org", "duration": "20 hours", "free": False, "rating": 4.6}
            ],
            "milestone": f"Build a project using {skill} to demonstrate proficiency"
        })
    return {"recommendations": recs, "learning_path_weeks": 12, "total_free_hours": 35}


def ai_mock_interview(cv_data: dict, target_role: str = "") -> dict:
    skills = ", ".join(cv_data.get('skills', [])[:6])
    role = target_role or "Software Engineer"

    prompt = f"""Generate a mock interview for this candidate.
Role: {role}
Skills: {skills}

Return ONLY this JSON:
{{
  "role": "{role}",
  "questions": [
    {{
      "id": "q1",
      "type": "Behavioral/Technical/Situational",
      "question": "The interview question",
      "hint": "What interviewers want to hear",
      "sample_answer_structure": "STAR method guide or technical approach",
      "difficulty": "Easy/Medium/Hard"
    }}
  ],
  "tips": ["interview tip 1", "interview tip 2", "interview tip 3"]
}}

Generate 6 questions: 2 behavioral, 3 technical, 1 situational."""

    result = call_claude("You are an interview coach. Return ONLY valid JSON.", prompt, 1500)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "role": role,
        "questions": [
            {"id": "q1", "type": "Behavioral", "question": "Tell me about a time you faced a major technical challenge. How did you overcome it?", "hint": "Focus on problem-solving process and teamwork", "sample_answer_structure": "Situation → Task → Action → Result (STAR)", "difficulty": "Medium"},
            {"id": "q2", "type": "Technical", "question": "Explain how you would design a scalable REST API for a high-traffic application.", "hint": "Mention caching, load balancing, database optimization", "sample_answer_structure": "Architecture overview → specific technologies → trade-offs", "difficulty": "Hard"},
            {"id": "q3", "type": "Behavioral", "question": "Describe a situation where you had to meet a tight deadline. What was your approach?", "hint": "Show time management and prioritization skills", "sample_answer_structure": "Context → Your specific role → Steps taken → Outcome", "difficulty": "Easy"},
            {"id": "q4", "type": "Technical", "question": "What is the difference between SQL and NoSQL databases? When would you use each?", "hint": "Cover ACID properties, scalability, use cases", "sample_answer_structure": "Define both → compare → give real-world examples", "difficulty": "Medium"},
            {"id": "q5", "type": "Situational", "question": "If you discovered a critical bug in production 30 minutes before a major release, what would you do?", "hint": "Show decision-making under pressure and communication skills", "sample_answer_structure": "Immediate action → stakeholder communication → fix vs delay decision", "difficulty": "Hard"},
            {"id": "q6", "type": "Technical", "question": "Walk me through how Git branching strategies work in a team environment.", "hint": "Mention feature branches, PRs, main/develop branches", "sample_answer_structure": "Strategy explanation → workflow → merge strategies", "difficulty": "Easy"},
        ],
        "tips": ["Research the company thoroughly before the interview", "Practice STAR method for behavioral questions", "Ask thoughtful questions about the team and tech stack", "Prepare 2-3 examples of your best projects"]
    }


def ai_salary_estimate(cv_data: dict, location: str = "") -> dict:
    skills = ", ".join(cv_data.get('skills', [])[:8])
    loc = location or "Global/Remote"

    prompt = f"""Estimate salary ranges for this candidate.
Skills: {skills}
Location: {loc}
Experience indicators: {" | ".join(cv_data.get('experience', []))[:300]}

Return ONLY this JSON:
{{
  "current_estimate": {{
    "min": 50000,
    "max": 80000,
    "median": 65000,
    "currency": "USD",
    "location": "{loc}"
  }},
  "potential_with_upskilling": {{
    "min": 70000,
    "max": 110000,
    "median": 90000,
    "skills_to_add": ["skill1", "skill2"]
  }},
  "by_location": [
    {{"city": "San Francisco", "min": 120000, "max": 180000, "currency": "USD"}},
    {{"city": "New York", "min": 100000, "max": 155000, "currency": "USD"}},
    {{"city": "London", "min": 65000, "max": 95000, "currency": "GBP"}},
    {{"city": "Dubai", "min": 80000, "max": 120000, "currency": "USD"}},
    {{"city": "Lahore", "min": 15000, "max": 35000, "currency": "USD"}},
    {{"city": "Remote", "min": 60000, "max": 100000, "currency": "USD"}}
  ],
  "industry_comparison": {{
    "tech_startups": "+10-20%",
    "enterprise": "+5-10%",
    "finance": "+15-25%",
    "government": "-10-15%"
  }},
  "negotiation_tips": ["tip 1", "tip 2", "tip 3"]
}}"""

    result = call_claude("You are a compensation analyst. Return ONLY valid JSON.", prompt, 1200)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "current_estimate": {"min": 55000, "max": 85000, "median": 68000, "currency": "USD", "location": loc},
        "potential_with_upskilling": {"min": 80000, "max": 120000, "median": 98000, "skills_to_add": ["AWS", "Kubernetes", "System Design"]},
        "by_location": [
            {"city": "San Francisco", "min": 120000, "max": 175000, "currency": "USD"},
            {"city": "New York", "min": 100000, "max": 150000, "currency": "USD"},
            {"city": "London", "min": 60000, "max": 90000, "currency": "GBP"},
            {"city": "Dubai", "min": 80000, "max": 115000, "currency": "USD"},
            {"city": "Lahore", "min": 12000, "max": 30000, "currency": "USD"},
            {"city": "Remote", "min": 65000, "max": 100000, "currency": "USD"},
        ],
        "industry_comparison": {"tech_startups": "+10-20%", "enterprise": "+5-10%", "finance": "+15-25%", "government": "-10-15%"},
        "negotiation_tips": ["Research market rates before negotiating", "Lead with your total value, not just years of experience", "Consider total compensation (equity, benefits, remote) not just base salary"]
    }


def ai_career_path(cv_data: dict, target_role: str = "") -> dict:
    skills = ", ".join(cv_data.get('skills', [])[:8])
    role = target_role or "Senior Software Engineer"

    prompt = f"""Generate a 5-year career path roadmap.
Current skills: {skills}
Target role: {role}
Education: {" | ".join(cv_data.get('education', []))[:200]}

Return ONLY this JSON:
{{
  "target_role": "{role}",
  "timeline_years": 5,
  "current_level": "Junior/Mid/Senior",
  "milestones": [
    {{
      "year": 1,
      "title": "Goal title",
      "description": "What to achieve",
      "skills_to_acquire": ["skill1", "skill2"],
      "expected_title": "Job title at this stage",
      "expected_salary_usd": 70000
    }}
  ],
  "alternative_paths": [
    {{"path": "Management track", "description": "brief description", "pros": ["pro1"], "cons": ["con1"]}}
  ],
  "companies_to_target": ["Company 1", "Company 2", "Company 3"]
}}

Generate 5 milestones (one per year)."""

    result = call_claude("You are a career coach. Return ONLY valid JSON.", prompt, 1500)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "target_role": role,
        "timeline_years": 5,
        "current_level": "Mid",
        "milestones": [
            {"year": 1, "title": "Solidify Core Skills", "description": "Master fundamentals, contribute to team projects, build portfolio", "skills_to_acquire": ["System Design Basics", "CI/CD"], "expected_title": "Mid-Level Developer", "expected_salary_usd": 72000},
            {"year": 2, "title": "Specialize & Lead", "description": "Pick a specialization, start mentoring juniors, lead small features", "skills_to_acquire": ["Cloud Architecture", "Team Leadership"], "expected_title": "Senior Developer", "expected_salary_usd": 95000},
            {"year": 3, "title": "Technical Leadership", "description": "Lead full projects, contribute to architecture decisions", "skills_to_acquire": ["Solution Architecture", "Cross-functional collaboration"], "expected_title": "Lead Engineer", "expected_salary_usd": 115000},
            {"year": 4, "title": "Senior Specialization", "description": "Deep expertise, company-wide impact, open source contributions", "skills_to_acquire": ["Staff-level skills", "Technical Strategy"], "expected_title": "Staff Engineer", "expected_salary_usd": 135000},
            {"year": 5, "title": "Principal / Director", "description": "Org-level impact, define technical direction, hire and grow teams", "skills_to_acquire": ["Executive communication", "Org design"], "expected_title": "Principal Engineer / Engineering Manager", "expected_salary_usd": 160000},
        ],
        "alternative_paths": [
            {"path": "Management Track", "description": "Transition to Engineering Manager by year 3", "pros": ["Higher earning potential", "Broader impact"], "cons": ["Less coding time", "People challenges"]},
            {"path": "Entrepreneur Track", "description": "Build and launch your own SaaS product", "pros": ["Unlimited upside", "Full ownership"], "cons": ["High risk", "Irregular income"]}
        ],
        "companies_to_target": ["Google", "Microsoft", "Stripe", "Shopify", "Local tech startups"]
    }


def ai_cover_letter(cv_data: dict, job_title: str, company_name: str, job_description: str = "") -> dict:
    skills = ", ".join(cv_data.get('skills', [])[:8])
    name = cv_data.get('name', 'The Candidate')

    prompt = f"""Write a compelling, tailored cover letter.

Candidate name: {name}
Candidate skills: {skills}
Job title: {job_title}
Company: {company_name}
Job description snippet: {job_description[:500] if job_description else 'Not provided'}

Return ONLY this JSON:
{{
  "subject": "Application for [Job Title] at [Company]",
  "cover_letter": "Full cover letter text (3 paragraphs, professional, specific, no filler phrases)",
  "key_points_highlighted": ["point 1", "point 2", "point 3"],
  "tone": "Professional/Enthusiastic/Technical",
  "word_count": 250
}}

Write a genuine, specific letter. Avoid clichés like 'I am writing to express my interest'."""

    result = call_claude("You are a professional cover letter writer. Return ONLY valid JSON.", prompt, 1000)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "subject": f"Application for {job_title} at {company_name}",
        "cover_letter": f"""Dear Hiring Manager,

My background in {', '.join(cv_data.get('skills', ['software development'])[:3])} directly aligns with what you're building at {company_name}. With experience shipping production-grade systems and a track record of solving complex technical problems, I believe I can contribute meaningfully to your team from day one.

What draws me to the {job_title} role specifically is the opportunity to work on challenging problems at scale. In my previous work, I've consistently delivered results by combining technical depth with clear communication across teams — skills that I know are essential for this position.

I'd love to bring this same energy to {company_name}. I'm available to start immediately and happy to discuss how my background matches your needs in a call.

Best regards,
{name}""",
        "key_points_highlighted": ["Technical skills alignment", "Results-driven approach", "Team collaboration"],
        "tone": "Professional",
        "word_count": 148
    }


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    # Always default to candidate - company feature removed
    user_type = 'candidate'

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Check if email already exists in MongoDB
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 409

    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    user_doc = {
        'id': user_id,
        'name': name,
        'email': email,
        'password_hash': hash_password(password),
        'userType': user_type,
        'createdAt': now.isoformat(),
        'updatedAt': now.isoformat(),
    }
    
    users_collection.insert_one(user_doc)

    user_obj = {k: v for k, v in user_doc.items() if k != 'password_hash'}
    token = f"token_{user_id}"

    return jsonify({'success': True, 'token': token, 'user': user_obj}), 201


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    # Fetch user from MongoDB
    user = users_collection.find_one({'email': email})
    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401

    user_obj = {k: v for k, v in user.items() if k != 'password_hash'}
    token = f"token_{user['id']}"

    return jsonify({'success': True, 'token': token, 'user': user_obj})


# ─── CV Routes ────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"status": "Jobrizza CV Analyzer API running", "version": "2.0"})


@app.route('/api/upload-cv', methods=['POST'])
def upload_cv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    ext = filename.rsplit('.', 1)[1].lower()
    if ext == 'pdf':
        text = extract_text_from_pdf(filepath)
    elif ext == 'docx':
        text = extract_text_from_docx(filepath)
    else:
        text = "DOC format: please convert to DOCX or PDF for best results."

    cv_data = parse_cv_data(text, filename)
    analysis = analyze_cv_quality(cv_data, text)
    ai_analysis = ai_full_analysis(text, cv_data)

    cv_data_with_analysis = {
        **cv_data,
        'analysis': analysis,
        'ai_analysis': ai_analysis,
    }
    cv_data_store.append(cv_data_with_analysis)

    return jsonify({'success': True, 'message': 'CV processed', 'data': cv_data_with_analysis})


@app.route('/api/skill-gap', methods=['POST'])
@require_auth
def skill_gap():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400
    result = ai_skill_gap(data['cv_data'], data.get('target_role', ''))
    return jsonify({'success': True, 'skill_gap': result})


@app.route('/api/job-matches', methods=['POST'])
@require_auth
def job_matches():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400
    matches = ai_job_matches(data['cv_data'])
    return jsonify({'success': True, 'jobs': matches})


@app.route('/api/learning-recommendations', methods=['POST'])
@require_auth
def learning_recommendations():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = ai_learning_recommendations(data.get('missing_skills', []))
    return jsonify({'success': True, 'learning': result})


@app.route('/api/mock-interview', methods=['POST'])
@require_auth
def mock_interview():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400
    result = ai_mock_interview(data['cv_data'], data.get('target_role', ''))
    return jsonify({'success': True, 'interview': result})


@app.route('/api/salary-estimate', methods=['POST'])
@require_auth
def salary_estimate():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400
    result = ai_salary_estimate(data['cv_data'], data.get('location', ''))
    return jsonify({'success': True, 'salary': result})


@app.route('/api/career-path', methods=['POST'])
@require_auth
def career_path():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400
    result = ai_career_path(data['cv_data'], data.get('target_role', ''))
    return jsonify({'success': True, 'career_path': result})


@app.route('/api/cover-letter', methods=['POST'])
@require_auth
def cover_letter():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No data provided'}), 400
    result = ai_cover_letter(
        data['cv_data'],
        data.get('job_title', 'Software Engineer'),
        data.get('company_name', 'the company'),
        data.get('job_description', '')
    )
    return jsonify({'success': True, 'cover_letter': result})


@app.route('/api/improve-cv', methods=['POST'])
@require_auth
def improve_cv():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400
    cv_data = data['cv_data']

    skills_base = cv_data.get('skills', [])
    soft_skills = ['Problem Solving', 'Communication', 'Leadership', 'Time Management', 'Team Collaboration']
    enhanced_skills = list(set(skills_base + soft_skills))[:12]

    prompt = f"""Rewrite this CV professional summary to be compelling and results-driven.
Skills: {', '.join(skills_base[:6])}
Be specific, avoid buzzwords, max 60 words."""

    summary = call_claude(
        "You are a CV writer. Write only the summary text, no labels or JSON.",
        prompt, 200
    )

    if not summary:
        summary = (f"Results-driven professional with expertise in {', '.join(skills_base[:3])}. "
                   f"Proven track record of delivering high-quality solutions and driving continuous improvement.")

    return jsonify({
        'success': True,
        'improved_cv': {
            'name': cv_data.get('name', 'Your Name'),
            'email': cv_data.get('email', ''),
            'phone': cv_data.get('phone', ''),
            'professional_summary': summary.strip(),
            'skills': enhanced_skills,
            'education': cv_data.get('education', []),
            'experience': cv_data.get('experience', []),
            'improvements_made': [
                'Enhanced professional summary',
                'Expanded skills section with key competencies',
                'Standardized section formatting',
                'Added soft skills for ATS compatibility',
            ]
        }
    })


@app.route('/api/cv-data', methods=['GET'])
def get_cv_data():
    return jsonify({'cv_data': cv_data_store})


# ─── CV Version History Routes ─────────────────────────────────────────────────

@app.route('/api/cv-versions', methods=['GET'])
@require_auth
def get_cv_versions():
    """Get all CV versions for the authenticated user"""
    user_id = g.user_id
    versions = list(cv_versions_collection.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('created_at', -1))
    return jsonify({'success': True, 'versions': versions})


@app.route('/api/cv-versions', methods=['POST'])
@require_auth
def save_cv_version():
    """Save a new CV version"""
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400

    user_id = g.user_id
    version_id = str(uuid.uuid4())

    version_doc = {
        'id': version_id,
        'user_id': user_id,
        'name': data.get('name', f'Version {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}'),
        'cv_data': data['cv_data'],
        'score': data.get('score', 0),
        'category_scores': data.get('category_scores', {}),
        'created_at': datetime.utcnow().isoformat(),
    }

    cv_versions_collection.insert_one(version_doc)

    return jsonify({
        'success': True,
        'version': {k: v for k, v in version_doc.items() if k != '_id'}
    }), 201


@app.route('/api/cv-versions/<version_id>', methods=['GET'])
@require_auth
def get_cv_version(version_id):
    """Get a specific CV version"""
    user_id = g.user_id
    version = cv_versions_collection.find_one(
        {'id': version_id, 'user_id': user_id},
        {'_id': 0}
    )
    if not version:
        return jsonify({'error': 'Version not found'}), 404
    return jsonify({'success': True, 'version': version})


@app.route('/api/cv-versions/<version_id>', methods=['DELETE'])
@require_auth
def delete_cv_version(version_id):
    """Delete a CV version"""
    user_id = g.user_id
    result = cv_versions_collection.delete_one({'id': version_id, 'user_id': user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Version not found'}), 404
    return jsonify({'success': True, 'message': 'Version deleted'})


@app.route('/api/cv-versions/compare', methods=['POST'])
@require_auth
def compare_cv_versions():
    """Compare two CV versions"""
    data = request.get_json()
    if not data or 'version_id_1' not in data or 'version_id_2' not in data:
        return jsonify({'error': 'Two version IDs required'}), 400

    user_id = g.user_id
    v1 = cv_versions_collection.find_one(
        {'id': data['version_id_1'], 'user_id': user_id},
        {'_id': 0}
    )
    v2 = cv_versions_collection.find_one(
        {'id': data['version_id_2'], 'user_id': user_id},
        {'_id': 0}
    )

    if not v1 or not v2:
        return jsonify({'error': 'One or both versions not found'}), 404

    comparison = {
        'version_1': v1,
        'version_2': v2,
        'score_diff': (v2.get('score', 0) - v1.get('score', 0)),
        'category_diff': {}
    }

    categories = set(v1.get('category_scores', {}).keys()) | set(v2.get('category_scores', {}).keys())
    for cat in categories:
        s1 = v1.get('category_scores', {}).get(cat, 0)
        s2 = v2.get('category_scores', {}).get(cat, 0)
        comparison['category_diff'][cat] = s2 - s1

    return jsonify({'success': True, 'comparison': comparison})


# ─── Application Tracker Routes ────────────────────────────────────────────────

@app.route('/api/applications', methods=['GET'])
@require_auth
def get_applications():
    """Get all job applications for the authenticated user"""
    user_id = g.user_id
    status_filter = request.args.get('status')

    query = {'user_id': user_id}
    if status_filter:
        query['status'] = status_filter

    applications = list(applications_collection.find(query, {'_id': 0}).sort('applied_at', -1))
    return jsonify({'success': True, 'applications': applications})


@app.route('/api/applications', methods=['POST'])
@require_auth
def create_application():
    """Create a new job application"""
    data = request.get_json()
    if not data or 'company' not in data or 'position' not in data:
        return jsonify({'error': 'Company and position are required'}), 400

    user_id = g.user_id
    application_id = str(uuid.uuid4())

    application_doc = {
        'id': application_id,
        'user_id': user_id,
        'company': data['company'],
        'position': data['position'],
        'location': data.get('location', ''),
        'salary': data.get('salary', ''),
        'url': data.get('url', ''),
        'status': data.get('status', 'Applied'),
        'notes': data.get('notes', ''),
        'applied_at': data.get('applied_at', datetime.utcnow().isoformat()),
        'updated_at': datetime.utcnow().isoformat(),
    }

    applications_collection.insert_one(application_doc)

    return jsonify({
        'success': True,
        'application': {k: v for k, v in application_doc.items() if k != '_id'}
    }), 201


@app.route('/api/applications/<application_id>', methods=['GET'])
@require_auth
def get_application(application_id):
    """Get a specific application"""
    user_id = g.user_id
    application = applications_collection.find_one(
        {'id': application_id, 'user_id': user_id},
        {'_id': 0}
    )
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'success': True, 'application': application})


@app.route('/api/applications/<application_id>', methods=['PUT'])
@require_auth
def update_application(application_id):
    """Update a job application"""
    data = request.get_json()
    user_id = g.user_id

    existing = applications_collection.find_one({'id': application_id, 'user_id': user_id})
    if not existing:
        return jsonify({'error': 'Application not found'}), 404

    update_fields = {}
    allowed_fields = ['company', 'position', 'location', 'salary', 'url', 'status', 'notes']
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    update_fields['updated_at'] = datetime.utcnow().isoformat()

    applications_collection.update_one(
        {'id': application_id, 'user_id': user_id},
        {'$set': update_fields}
    )

    updated = applications_collection.find_one({'id': application_id}, {'_id': 0})
    return jsonify({'success': True, 'application': updated})


@app.route('/api/applications/<application_id>', methods=['DELETE'])
@require_auth
def delete_application(application_id):
    """Delete a job application"""
    user_id = g.user_id
    result = applications_collection.delete_one({'id': application_id, 'user_id': user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'success': True, 'message': 'Application deleted'})


@app.route('/api/applications/<application_id>/notes', methods=['POST'])
@require_auth
def add_application_note(application_id):
    """Add a note to an application"""
    data = request.get_json()
    if not data or 'note' not in data:
        return jsonify({'error': 'Note content required'}), 400

    user_id = g.user_id
    note = {
        'id': str(uuid.uuid4()),
        'content': data['note'],
        'created_at': datetime.utcnow().isoformat()
    }

    result = applications_collection.update_one(
        {'id': application_id, 'user_id': user_id},
        {'$push': {'notes_list': note}, '$set': {'updated_at': datetime.utcnow().isoformat()}}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Application not found'}), 404

    return jsonify({'success': True, 'note': note})


@app.route('/api/applications/stats', methods=['GET'])
@require_auth
def get_application_stats():
    """Get application statistics for the user"""
    user_id = g.user_id
    pipeline = [
        {'$match': {'user_id': user_id}},
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
    ]
    stats = list(applications_collection.aggregate(pipeline))
    return jsonify({'success': True, 'stats': {s['_id']: s['count'] for s in stats}})


# ─────────────────────────────────────────────────────────────────────────────
# LINKEDIN PROFILE OPTIMIZER
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/linkedin/analyze', methods=['POST'])
@require_auth
def analyze_linkedin_profile():
    """Analyze LinkedIn profile and provide AI optimization suggestions"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400

    profile_text = data.get('profile_text', '').strip()
    linkedin_url = data.get('linkedin_url', '').strip()

    if not profile_text and not linkedin_url:
        return jsonify({'error': 'LinkedIn URL or profile text required'}), 400

    user_id = g.user_id

    # Use Claude AI to analyze and provide suggestions
    system_prompt = """You are an expert LinkedIn profile optimizer and career coach. Analyze the provided LinkedIn profile and provide specific, actionable suggestions to improve:

1. Headline - Make it more compelling and keyword-rich
2. Summary/About - Improve storytelling and highlight achievements
3. Experience - Optimize bullet points with metrics and action verbs
4. Skills - Recommend relevant skills to add
5. Overall profile strength - General tips for better visibility

Respond in JSON format with this structure:
{
    "headline": {"current": "...", "suggested": "...", "tips": "..."},
    "summary": {"current": "...", "suggested": "...", "tips": "..."},
    "experience": {"tips": "...", "improvements": ["..."]},
    "skills": {"current": [...], "suggested_additions": [...]},
    "overall_score": 0-100,
    "priority_actions": ["..."]
}"""

    input_text = f"LinkedIn URL: {linkedin_url}\n\nProfile Content:\n{profile_text}" if linkedin_url else profile_text

    ai_response = call_claude(system_prompt, input_text, max_tokens=2000)

    # Parse AI response or provide fallback
    suggestions = {}
    if ai_response:
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                suggestions = json.loads(json_match.group())
        except:
            suggestions = {
                'headline': {'current': 'N/A', 'suggested': 'N/A', 'tips': ai_response[:500] if ai_response else 'Analysis unavailable'},
                'overall_score': 50
            }
    else:
        # Fallback suggestions when AI is unavailable
        suggestions = {
            'headline': {
                'current': 'Not analyzed',
                'suggested': 'Add your key expertise and value proposition',
                'tips': 'Use keywords relevant to your target roles. Include your specialty and what makes you unique.'
            },
            'summary': {
                'current': 'Not analyzed',
                'suggested': 'Write a compelling narrative about your professional journey',
                'tips': 'Start with a hook. Include metrics, achievements, and a clear call-to-action.'
            },
            'experience': {
                'tips': 'Use action verbs and quantify results where possible',
                'improvements': ['Add metrics to bullet points', 'Use STAR method', 'Highlight leadership moments']
            },
            'skills': {
                'current': [],
                'suggested_additions': ['Industry-relevant technical skills', 'Soft skills with examples', 'Certifications']
            },
            'overall_score': 50,
            'priority_actions': ['Complete all profile sections', 'Add a professional photo', 'Get recommendations']
        }

    # Save optimization record
    optimization_doc = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'linkedin_url': linkedin_url,
        'profile_text': profile_text[:2000] if profile_text else '',
        'suggestions': suggestions,
        'overall_score': suggestions.get('overall_score', 0),
        'created_at': datetime.utcnow().isoformat()
    }
    linkedin_optimizations_collection.insert_one(optimization_doc)

    return jsonify({
        'success': True,
        'suggestions': suggestions,
        'optimization_id': optimization_doc['id']
    })


@app.route('/api/linkedin/optimizations', methods=['GET'])
@require_auth
def get_linkedin_optimizations():
    """Get user's LinkedIn optimization history"""
    user_id = g.user_id
    optimizations = list(linkedin_optimizations_collection.find(
        {'user_id': user_id},
        {'_id': 0, 'profile_text': 0}
    ).sort('created_at', -1).limit(10))
    return jsonify({'success': True, 'optimizations': optimizations})


@app.route('/api/linkedin/optimizations/<optimization_id>', methods=['GET'])
@require_auth
def get_linkedin_optimization(optimization_id):
    """Get a specific LinkedIn optimization"""
    user_id = g.user_id
    optimization = linkedin_optimizations_collection.find_one(
        {'id': optimization_id, 'user_id': user_id},
        {'_id': 0}
    )
    if not optimization:
        return jsonify({'error': 'Optimization not found'}), 404
    return jsonify({'success': True, 'optimization': optimization})


@app.route('/api/linkedin/optimizations/<optimization_id>', methods=['DELETE'])
@require_auth
def delete_linkedin_optimization(optimization_id):
    """Delete a LinkedIn optimization record"""
    user_id = g.user_id
    result = linkedin_optimizations_collection.delete_one(
        {'id': optimization_id, 'user_id': user_id}
    )
    if result.deleted_count == 0:
        return jsonify({'error': 'Optimization not found'}), 404
    return jsonify({'success': True, 'message': 'Optimization deleted'})


# ─────────────────────────────────────────────────────────────────────────────
# DAILY JOB ALERTS
# ─────────────────────────────────────────────────────────────────────────────

def get_resend_client():
    """Get Resend email client if available"""
    try:
        import resend
        api_key = os.environ.get('RESEND_API_KEY')
        if api_key:
            resend.api_key = api_key
            return resend
    except ImportError:
        pass
    return None


@app.route('/api/job-alerts', methods=['GET'])
@require_auth
def get_job_alerts():
    """Get user's job alert preferences and history"""
    user_id = g.user_id
    alert = job_alerts_collection.find_one({'user_id': user_id}, {'_id': 0})

    if not alert:
        # Return default settings
        return jsonify({
            'success': True,
            'alert': {
                'enabled': False,
                'frequency': 'daily',
                'job_types': ['Full-time'],
                'work_mode': 'Remote',
                'keywords': [],
                'min_salary': None,
                'location': '',
                'last_sent': None
            }
        })

    return jsonify({'success': True, 'alert': alert})


@app.route('/api/job-alerts', methods=['POST'])
@require_auth
def create_or_update_job_alert():
    """Create or update job alert preferences"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400

    user_id = g.user_id
    user = users_collection.find_one({'id': user_id})

    alert_doc = {
        'user_id': user_id,
        'enabled': data.get('enabled', False),
        'frequency': data.get('frequency', 'daily'),
        'job_types': data.get('job_types', ['Full-time']),
        'work_mode': data.get('work_mode', 'Remote'),
        'keywords': data.get('keywords', []),
        'min_salary': data.get('min_salary'),
        'location': data.get('location', ''),
        'email': user.get('email') if user else None,
        'updated_at': datetime.utcnow().isoformat()
    }

    # Insert or update
    existing = job_alerts_collection.find_one({'user_id': user_id})
    if existing:
        job_alerts_collection.update_one(
            {'user_id': user_id},
            {'$set': alert_doc}
        )
    else:
        alert_doc['created_at'] = datetime.utcnow().isoformat()
        alert_doc['last_sent'] = None
        job_alerts_collection.insert_one(alert_doc)

    return jsonify({'success': True, 'alert': alert_doc})


@app.route('/api/job-alerts/test', methods=['POST'])
@require_auth
def send_test_job_alert():
    """Send a test job alert email"""
    user_id = g.user_id
    user = users_collection.find_one({'id': user_id})

    if not user or not user.get('email'):
        return jsonify({'error': 'User email not found'}), 400

    resend_client = get_resend_client()
    if not resend_client:
        return jsonify({'error': 'Email service not configured'}), 500

    # Generate sample job matches based on user CV
    cv_data = cv_data_collection.find_one({'user_id': user_id}, {'_id': 0})
    skills = cv_data.get('skills', []) if cv_data else ['JavaScript', 'React', 'Python']

    # Sample jobs for the test email
    sample_jobs = [
        {
            'title': 'Senior Frontend Developer',
            'company': 'TechCorp Inc.',
            'location': 'Remote',
            'salary': '$120,000 - $160,000',
            'match_score': 95,
            'skills_match': ['React', 'TypeScript', 'Next.js'],
            'url': '#'
        },
        {
            'title': 'Full Stack Engineer',
            'company': 'StartupXYZ',
            'location': 'New York, NY (Hybrid)',
            'salary': '$110,000 - $150,000',
            'match_score': 88,
            'skills_match': ['Python', 'React', 'PostgreSQL'],
            'url': '#'
        },
        {
            'title': 'Software Engineer II',
            'company': 'BigTech Co.',
            'location': 'San Francisco, CA',
            'salary': '$130,000 - $180,000',
            'match_score': 82,
            'skills_match': ['JavaScript', 'AWS', 'Docker'],
            'url': '#'
        }
    ]

    # Build email HTML
    jobs_html = ''
    for job in sample_jobs:
        jobs_html += f"""
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin: 0 0 4px 0; color: #1f2937;">{job['title']}</h3>
                    <p style="margin: 0; color: #6b7280;">{job['company']} • {job['location']}</p>
                </div>
                <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px;">
                    {job['match_score']}% Match
                </span>
            </div>
            <p style="margin: 8px 0 0 0; color: #059669; font-size: 14px;">{job['salary']}</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">
                Skills: {', '.join(job['skills_match'])}
            </p>
        </div>
        """

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6;">
            <h1 style="color: #1f2937; margin: 0;">Your Daily Job Alerts</h1>
            <p style="color: #6b7280; margin: 8px 0 0 0;">Based on your CV skills: {', '.join(skills[:5])}</p>
        </div>

        <div style="padding: 20px 0;">
            <p style="color: #374151;">Hi {user.get('name', 'there')},</p>
            <p style="color: #374151;">We found <strong>{len(sample_jobs)} new jobs</strong> matching your profile!</p>

            <div style="margin: 24px 0;">
                {jobs_html}
            </div>

            <div style="text-align: center; margin: 32px 0;">
                <a href="http://localhost:3000/candidate/matches"
                   style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                    View All Job Matches
                </a>
            </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This is a test email from your Job Alert settings.</p>
            <p>You're receiving this because you enabled job alerts on our platform.</p>
        </div>
    </div>
    """

    try:
        params = {
            "from": "Job Alerts <alerts@yourdomain.com>",
            "to": [user['email']],
            "subject": f"Test: Your Daily Job Matches - {datetime.now().strftime('%b %d, %Y')}",
            "html": html_content
        }

        result = resend_client.Emails.send(params)

        # Update last_sent timestamp
        job_alerts_collection.update_one(
            {'user_id': user_id},
            {'$set': {'last_sent': datetime.utcnow().isoformat()}},
            upsert=True
        )

        return jsonify({
            'success': True,
            'message': 'Test email sent successfully',
            'email_id': result.get('id') if isinstance(result, dict) else str(result)
        })

    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500


@app.route('/api/job-alerts/unsubscribe', methods=['POST'])
@require_auth
def unsubscribe_job_alerts():
    """Unsubscribe from job alerts"""
    user_id = g.user_id
    job_alerts_collection.update_one(
        {'user_id': user_id},
        {'$set': {'enabled': False, 'updated_at': datetime.utcnow().isoformat()}}
    )
    return jsonify({'success': True, 'message': 'Unsubscribed from job alerts'})


# ─────────────────────────────────────────────────────────────────────────────
# CV SCORE GAMIFICATION
# ─────────────────────────────────────────────────────────────────────────────

# Badge definitions
BADGES = {
    'first_upload': {'name': 'First Steps', 'description': 'Uploaded your first CV', 'icon': '📄', 'color': '#3b82f6'},
    'score_50': {'name': 'Getting Started', 'description': 'Achieved 50+ CV score', 'icon': '🌟', 'color': '#10b981'},
    'score_70': {'name': 'Rising Star', 'description': 'Achieved 70+ CV score', 'icon': '⭐', 'color': '#f59e0b'},
    'score_90': {'name': 'CV Master', 'description': 'Achieved 90+ CV score', 'icon': '🏆', 'color': '#8b5cf6'},
    'improve_10': {'name': 'Quick Learner', 'description': 'Improved CV score by 10+ points', 'icon': '📈', 'color': '#ec4899'},
    'improve_20': {'name': 'Rapid Growth', 'description': 'Improved CV score by 20+ points', 'icon': '🚀', 'color': '#ef4444'},
    'streak_3': {'name': 'Consistent', 'description': '3-day upload streak', 'icon': '🔥', 'color': '#f97316'},
    'streak_7': {'name': 'On Fire', 'description': '7-day upload streak', 'icon': '🔥🔥', 'color': '#dc2626'},
    'streak_30': {'name': 'Dedicated', 'description': '30-day upload streak', 'icon': '💎', 'color': '#6366f1'},
    'versions_5': {'name': 'Version Control', 'description': 'Saved 5 CV versions', 'icon': '🔄', 'color': '#14b8a6'},
    'versions_10': {'name': 'Iterative Pro', 'description': 'Saved 10 CV versions', 'icon': '🔄🔄', 'color': '#06b6d4'},
    'analyzer': {'name': 'Analyzer', 'description': 'Viewed detailed analysis 5 times', 'icon': '🔍', 'color': '#84cc16'},
    'job_seeker': {'name': 'Job Seeker', 'description': 'Applied to 5 jobs', 'icon': '💼', 'color': '#a855f7'},
}


def check_and_award_badges(user_id: str, cv_score: int = None, score_improvement: int = None):
    """Check conditions and award badges to user"""
    gamification = gamification_collection.find_one({'user_id': user_id})

    if not gamification:
        gamification = {
            'user_id': user_id,
            'badges': [],
            'stats': {
                'total_uploads': 0,
                'highest_score': 0,
                'current_streak': 0,
                'longest_streak': 0,
                'last_upload_date': None,
                'total_versions': 0,
                'analysis_views': 0,
                'applications_count': 0
            },
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

    new_badges = []
    stats = gamification.get('stats', {})

    # Check score-based badges
    if cv_score:
        if cv_score >= 50 and 'score_50' not in gamification.get('badges', []):
            new_badges.append('score_50')
        if cv_score >= 70 and 'score_70' not in gamification.get('badges', []):
            new_badges.append('score_70')
        if cv_score >= 90 and 'score_90' not in gamification.get('badges', []):
            new_badges.append('score_90')

        # Update highest score
        if cv_score > stats.get('highest_score', 0):
            stats['highest_score'] = cv_score

    # Check improvement badges
    if score_improvement:
        if score_improvement >= 10 and 'improve_10' not in gamification.get('badges', []):
            new_badges.append('improve_10')
        if score_improvement >= 20 and 'improve_20' not in gamification.get('badges', []):
            new_badges.append('improve_20')

    # Add badges with timestamps
    for badge_id in new_badges:
        if badge_id in BADGES:
            gamification['badges'].append({
                'id': badge_id,
                'awarded_at': datetime.utcnow().isoformat(),
                **BADGES[badge_id]
            })

    # Update streak
    today = datetime.utcnow().date()
    last_upload = stats.get('last_upload_date')

    if last_upload:
        last_date = datetime.fromisoformat(last_upload).date()
        diff = (today - last_date).days

        if diff == 0:
            # Same day, don't update streak
            pass
        elif diff == 1:
            # Next day, increment streak
            stats['current_streak'] = stats.get('current_streak', 0) + 1
        else:
            # Streak broken
            if stats.get('current_streak', 0) > stats.get('longest_streak', 0):
                stats['longest_streak'] = stats['current_streak']
            stats['current_streak'] = 1
    else:
        stats['current_streak'] = 1

    stats['last_upload_date'] = today.isoformat()
    stats['total_uploads'] = stats.get('total_uploads', 0) + 1

    # Check streak badges
    current_streak = stats.get('current_streak', 0)
    if current_streak >= 3 and 'streak_3' not in [b['id'] for b in gamification.get('badges', [])]:
        gamification['badges'].append({
            'id': 'streak_3',
            'awarded_at': datetime.utcnow().isoformat(),
            **BADGES['streak_3']
        })
    if current_streak >= 7 and 'streak_7' not in [b['id'] for b in gamification.get('badges', [])]:
        gamification['badges'].append({
            'id': 'streak_7',
            'awarded_at': datetime.utcnow().isoformat(),
            **BADGES['streak_7']
        })
    if current_streak >= 30 and 'streak_30' not in [b['id'] for b in gamification.get('badges', [])]:
        gamification['badges'].append({
            'id': 'streak_30',
            'awarded_at': datetime.utcnow().isoformat(),
            **BADGES['streak_30']
        })

    # Check first upload badge
    if stats['total_uploads'] == 1 and 'first_upload' not in [b['id'] for b in gamification.get('badges', [])]:
        gamification['badges'].append({
            'id': 'first_upload',
            'awarded_at': datetime.utcnow().isoformat(),
            **BADGES['first_upload']
        })

    gamification['stats'] = stats
    gamification['updated_at'] = datetime.utcnow().isoformat()

    # Save to database
    gamification_collection.update_one(
        {'user_id': user_id},
        {'$set': gamification},
        upsert=True
    )

    return new_badges, gamification


@app.route('/api/gamification/profile', methods=['GET'])
@require_auth
def get_gamification_profile():
    """Get user's gamification profile with badges and stats"""
    user_id = g.user_id
    gamification = gamification_collection.find_one({'user_id': user_id}, {'_id': 0})

    if not gamification:
        # Return default profile
        return jsonify({
            'success': True,
            'profile': {
                'badges': [],
                'stats': {
                    'total_uploads': 0,
                    'highest_score': 0,
                    'current_streak': 0,
                    'longest_streak': 0,
                    'total_versions': 0,
                    'analysis_views': 0,
                    'applications_count': 0
                },
                'level': 1,
                'xp': 0,
                'next_level_xp': 100
            }
        })

    # Calculate level based on badges and activity
    badges_count = len(gamification.get('badges', []))
    stats = gamification.get('stats', {})
    xp = badges_count * 50 + stats.get('total_uploads', 0) * 10 + stats.get('highest_score', 0)
    level = min(10, 1 + xp // 100)
    next_level_xp = ((level) * 100) - xp

    return jsonify({
        'success': True,
        'profile': {
            'badges': gamification.get('badges', []),
            'stats': stats,
            'level': level,
            'xp': xp,
            'next_level_xp': next_level_xp
        }
    })


@app.route('/api/gamification/track', methods=['POST'])
@require_auth
def track_gamification_event():
    """Track gamification events (upload, version saved, etc.)"""
    data = request.get_json() or {}
    user_id = g.user_id

    event_type = data.get('event_type')
    cv_score = data.get('cv_score')
    score_improvement = data.get('score_improvement')

    new_badges, gamification = check_and_award_badges(user_id, cv_score, score_improvement)

    # Handle specific events
    stats = gamification.get('stats', {})

    if event_type == 'version_saved':
        stats['total_versions'] = stats.get('total_versions', 0) + 1

        # Check version badges
        if stats['total_versions'] >= 5:
            if 'versions_5' not in [b['id'] for b in gamification.get('badges', [])]:
                gamification['badges'].append({
                    'id': 'versions_5',
                    'awarded_at': datetime.utcnow().isoformat(),
                    **BADGES['versions_5']
                })
                new_badges.append('versions_5')

        if stats['total_versions'] >= 10:
            if 'versions_10' not in [b['id'] for b in gamification.get('badges', [])]:
                gamification['badges'].append({
                    'id': 'versions_10',
                    'awarded_at': datetime.utcnow().isoformat(),
                    **BADGES['versions_10']
                })
                new_badges.append('versions_10')

    elif event_type == 'analysis_viewed':
        stats['analysis_views'] = stats.get('analysis_views', 0) + 1

        if stats['analysis_views'] >= 5:
            if 'analyzer' not in [b['id'] for b in gamification.get('badges', [])]:
                gamification['badges'].append({
                    'id': 'analyzer',
                    'awarded_at': datetime.utcnow().isoformat(),
                    **BADGES['analyzer']
                })
                new_badges.append('analyzer')

    elif event_type == 'application_added':
        stats['applications_count'] = stats.get('applications_count', 0) + 1

        if stats['applications_count'] >= 5:
            if 'job_seeker' not in [b['id'] for b in gamification.get('badges', [])]:
                gamification['badges'].append({
                    'id': 'job_seeker',
                    'awarded_at': datetime.utcnow().isoformat(),
                    **BADGES['job_seeker']
                })
                new_badges.append('job_seeker')

    gamification['stats'] = stats
    gamification['updated_at'] = datetime.utcnow().isoformat()

    gamification_collection.update_one(
        {'user_id': user_id},
        {'$set': gamification},
        upsert=True
    )

    return jsonify({
        'success': True,
        'new_badges': [BADGES[b] for b in new_badges if b in BADGES],
        'stats': stats
    })


@app.route('/api/gamification/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top users by XP (public endpoint)"""
    pipeline = [
        {'$project': {'_id': 0, 'user_id': 1, 'badges': 1, 'stats': 1}},
        {'$lookup': {
            'from': 'users',
            'localField': 'user_id',
            'foreignField': 'id',
            'as': 'user'
        }},
        {'$unwind': {'path': '$user', 'preserveNullAndEmptyArrays': True}},
        {'$project': {
            'name': {'$ifNull': ['$user.name', 'Anonymous']},
            'badge_count': {'$size': {'$ifNull': ['$badges', []]}},
            'highest_score': {'$ifNull': ['$stats.highest_score', 0]},
            'current_streak': {'$ifNull': ['$stats.current_streak', 0]}
        }},
        {'$sort': {'badge_count': -1, 'highest_score': -1}},
        {'$limit': 10}
    ]

    leaderboard = list(gamification_collection.aggregate(pipeline))
    return jsonify({'success': True, 'leaderboard': leaderboard})


# ─────────────────────────────────────────────────────────────────────────────
# PORTFOLIO BUILDER
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/portfolio', methods=['GET'])
@require_auth
def get_my_portfolio():
    """Get user's portfolio settings"""
    user_id = g.user_id
    user = users_collection.find_one({'id': user_id})

    portfolio = portfolios_collection.find_one({'user_id': user_id}, {'_id': 0})

    if not portfolio:
        # Generate default username from name or email
        username = ''
        if user:
            if user.get('name'):
                username = user['name'].lower().replace(' ', '')
            elif user.get('email'):
                username = user['email'].split('@')[0]

        portfolio = {
            'user_id': user_id,
            'username': username,
            'is_public': False,
            'display_name': user.get('name', '') if user else '',
            'title': '',
            'bio': '',
            'theme': 'default',
            'show_email': False,
            'show_phone': False,
            'custom_domain': None,
            'sections': {
                'cv': True,
                'skills': True,
                'experience': True,
                'education': True,
                'projects': True,
                'certifications': False,
                'social_links': True
            },
            'social_links': {
                'linkedin': '',
                'github': '',
                'twitter': '',
                'website': ''
            },
            'projects': [],
            'custom_css': '',
            'views_count': 0,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

    return jsonify({'success': True, 'portfolio': portfolio})


@app.route('/api/portfolio', methods=['POST', 'PUT'])
@require_auth
def update_portfolio():
    """Update portfolio settings"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400

    user_id = g.user_id
    user = users_collection.find_one({'id': user_id})

    # Check username uniqueness if changing
    if 'username' in data:
        new_username = data['username'].lower().strip()
        # Remove non-alphanumeric characters except hyphens and underscores
        new_username = re.sub(r'[^a-z0-9_-]', '', new_username)

        existing = portfolios_collection.find_one({
            'username': new_username,
            'user_id': {'$ne': user_id}
        })
        if existing:
            return jsonify({'error': 'Username already taken'}), 400

        data['username'] = new_username

    # Build update document
    allowed_fields = [
        'username', 'is_public', 'display_name', 'title', 'bio', 'theme',
        'show_email', 'show_phone', 'custom_domain', 'sections', 'social_links',
        'projects', 'custom_css'
    ]

    update_fields = {}
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    update_fields['updated_at'] = datetime.utcnow().isoformat()

    # Insert or update
    existing = portfolios_collection.find_one({'user_id': user_id})
    if existing:
        portfolios_collection.update_one(
            {'user_id': user_id},
            {'$set': update_fields}
        )
    else:
        update_fields['user_id'] = user_id
        update_fields['views_count'] = 0
        update_fields['created_at'] = datetime.utcnow().isoformat()
        portfolios_collection.insert_one(update_fields)

    updated = portfolios_collection.find_one({'user_id': user_id}, {'_id': 0})
    return jsonify({'success': True, 'portfolio': updated})


@app.route('/api/portfolio/username-check/<username>', methods=['GET'])
def check_username_availability(username):
    """Check if a portfolio username is available"""
    username = username.lower().strip()
    username = re.sub(r'[^a-z0-9_-]', '', username)

    if len(username) < 3:
        return jsonify({'available': False, 'error': 'Username must be at least 3 characters'})

    existing = portfolios_collection.find_one({'username': username})
    return jsonify({'available': not existing, 'username': username})


@app.route('/p/<username>', methods=['GET'])
def view_public_portfolio(username):
    """View public portfolio by username (no auth required)"""
    username = username.lower().strip()

    portfolio = portfolios_collection.find_one({'username': username})
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    if not portfolio.get('is_public', False):
        return jsonify({'error': 'Portfolio is private'}), 403

    # Increment view count
    portfolios_collection.update_one(
        {'username': username},
        {'$inc': {'views_count': 1}}
    )

    # Get user info
    user = users_collection.find_one({'id': portfolio['user_id']})

    # Get CV data if available and section enabled
    cv_data = None
    if portfolio.get('sections', {}).get('cv', True):
        cv_data = cv_data_collection.find_one({'user_id': portfolio['user_id']}, {'_id': 0})

    # Build response
    public_portfolio = {
        'username': portfolio['username'],
        'display_name': portfolio.get('display_name', user.get('name', 'Anonymous') if user else 'Anonymous'),
        'title': portfolio.get('title', ''),
        'bio': portfolio.get('bio', ''),
        'theme': portfolio.get('theme', 'default'),
        'sections': portfolio.get('sections', {}),
        'social_links': portfolio.get('social_links', {}),
        'projects': portfolio.get('projects', []),
        'cv_data': cv_data,
        'email': user.get('email') if portfolio.get('show_email') and user else None,
        'views_count': portfolio.get('views_count', 0) + 1,
        'custom_css': portfolio.get('custom_css', '')
    }

    return jsonify({'success': True, 'portfolio': public_portfolio})


@app.route('/api/portfolio/stats', methods=['GET'])
@require_auth
def get_portfolio_stats():
    """Get portfolio view statistics"""
    user_id = g.user_id
    portfolio = portfolios_collection.find_one({'user_id': user_id}, {'_id': 0, 'views_count': 1, 'updated_at': 1})

    if not portfolio:
        return jsonify({'success': True, 'stats': {'views_count': 0, 'updated_at': None}})

    return jsonify({
        'success': True,
        'stats': {
            'views_count': portfolio.get('views_count', 0),
            'updated_at': portfolio.get('updated_at')
        }
    })


# ─────────────────────────────────────────────────────────────────────────────
# INTERVIEW ANSWER GRADER
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/interview/grade', methods=['POST'])
@require_auth
def grade_interview_answer():
    """Grade an interview answer using AI with STAR methodology"""
    user_id = g.user_id
    data = request.get_json()

    question = data.get('question', '').strip()
    answer = data.get('answer', '').strip()
    question_type = data.get('question_type', 'behavioral')  # behavioral, technical, situational

    if not question or not answer:
        return jsonify({'error': 'Question and answer are required'}), 400

    # Build the grading prompt
    system_prompt = """You are an expert interview coach with deep knowledge of the STAR method (Situation, Task, Action, Result).
Grade interview answers and provide detailed feedback in a structured format.

Scoring criteria (each out of 100):
1. STAR Structure - How well the answer follows Situation, Task, Action, Result format
2. Clarity - How clear and concise the answer is
3. Relevance - How well it answers the specific question
4. Impact - How effectively results/outcomes are communicated
5. Overall - Overall impression of the answer

Provide feedback in this exact JSON format:
{
    "scores": {
        "star_structure": 85,
        "clarity": 90,
        "relevance": 95,
        "impact": 80,
        "overall": 87
    },
    "star_breakdown": {
        "situation": "Brief assessment of how situation was described",
        "task": "Assessment of task clarity",
        "action": "Assessment of actions taken",
        "result": "Assessment of results shared"
    },
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement 1", "Improvement 2"],
    "better_answer_example": "A rewritten version showing best practices",
    "summary": "One-sentence overall assessment"
}"""

    user_prompt = f"""Question Type: {question_type}
Question: {question}

Candidate's Answer:
{answer}

Please grade this interview answer using the STAR methodology."""

    try:
        ai_response = call_claude(system_prompt, user_prompt, max_tokens=2000)

        # Parse AI response
        try:
            # Extract JSON from response
            import json
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx]
                grading_result = json.loads(json_str)
            else:
                grading_result = json.loads(ai_response)
        except:
            # Fallback if JSON parsing fails
            grading_result = {
                "scores": {
                    "star_structure": 70,
                    "clarity": 75,
                    "relevance": 80,
                    "impact": 70,
                    "overall": 74
                },
                "star_breakdown": {
                    "situation": "Unable to analyze",
                    "task": "Unable to analyze",
                    "action": "Unable to analyze",
                    "result": "Unable to analyze"
                },
                "strengths": ["Answer provided"],
                "improvements": ["Consider using STAR format more explicitly"],
                "better_answer_example": answer,
                "summary": "Answer received but detailed analysis unavailable"
            }

        # Save grading to history
        grading_record = {
            'user_id': user_id,
            'question': question,
            'answer': answer,
            'question_type': question_type,
            'scores': grading_result.get('scores', {}),
            'feedback': grading_result,
            'created_at': datetime.utcnow().isoformat()
        }
        interview_gradings_collection.insert_one(grading_record)

        # Update gamification stats
        gamification_collection.update_one(
            {'user_id': user_id},
            {'$inc': {'stats.interview_practice_count': 1}},
            upsert=True
        )

        return jsonify({
            'success': True,
            'grading': grading_result,
            'scores': grading_result.get('scores', {})
        })

    except Exception as e:
        return jsonify({'error': f'Failed to grade answer: {str(e)}'}), 500


@app.route('/api/interview/history', methods=['GET'])
@require_auth
def get_interview_grading_history():
    """Get user's interview grading history"""
    user_id = g.user_id
    limit = int(request.args.get('limit', 20))

    gradings = list(interview_gradings_collection.find(
        {'user_id': user_id},
        {'_id': 0, 'answer': 0}  # Exclude the full answer text for brevity
    ).sort('created_at', -1).limit(limit))

    # Calculate averages
    if gradings:
        avg_overall = sum(g.get('scores', {}).get('overall', 0) for g in gradings) / len(gradings)
    else:
        avg_overall = 0

    return jsonify({
        'success': True,
        'gradings': gradings,
        'average_score': round(avg_overall, 1),
        'total_count': interview_gradings_collection.count_documents({'user_id': user_id})
    })


@app.route('/api/interview/questions', methods=['GET'])
def get_interview_questions():
    """Get sample interview questions by category"""
    category = request.args.get('category', 'behavioral')

    questions = {
        'behavioral': [
            "Tell me about yourself.",
            "What is your greatest strength?",
            "What is your greatest weakness?",
            "Tell me about a time you faced a conflict at work.",
            "Describe a time you failed and what you learned.",
            "Give me an example of when you showed leadership.",
            "Tell me about a time you worked under pressure.",
            "Describe a time you had to persuade someone.",
            "Tell me about a time you went above and beyond.",
            "Give an example of when you had to multitask."
        ],
        'technical': [
            "Explain a complex technical concept to a non-technical person.",
            "Tell me about a challenging technical problem you solved.",
            "How do you keep your technical skills current?",
            "Describe your approach to debugging.",
            "Tell me about a time you optimized code or a process."
        ],
        'situational': [
            "What would you do if you disagreed with your manager's decision?",
            "How would you handle a difficult client?",
            "What would you do if you missed a deadline?",
            "How would you handle a team member not pulling their weight?",
            "What would you do if you found an error in your work after submission?"
        ],
        'leadership': [
            "Tell me about a time you motivated a team.",
            "How do you handle giving difficult feedback?",
            "Describe a time you had to make an unpopular decision.",
            "Tell me about a time you delegated effectively.",
            "How do you build trust within a team?"
        ]
    }

    category_questions = questions.get(category, questions['behavioral'])
    import random
    sample = random.sample(category_questions, min(5, len(category_questions)))

    return jsonify({
        'success': True,
        'category': category,
        'questions': sample
    })


# ─────────────────────────────────────────────────────────────────────────────
# REFERRAL & NETWORK GRAPH
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/network/contacts', methods=['GET'])
@require_auth
def get_network_contacts():
    """Get user's network contacts"""
    user_id = g.user_id

    contacts = list(network_contacts_collection.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('created_at', -1))

    # Calculate network stats
    total_contacts = len(contacts)
    at_target_companies = sum(1 for c in contacts if c.get('at_target_company'))
    can_refer = sum(1 for c in contacts if c.get('can_refer'))

    # Group by company
    company_groups = {}
    for contact in contacts:
        company = contact.get('company', 'Unknown')
        if company not in company_groups:
            company_groups[company] = []
        company_groups[company].append(contact)

    return jsonify({
        'success': True,
        'contacts': contacts,
        'stats': {
            'total_contacts': total_contacts,
            'at_target_companies': at_target_companies,
            'can_refer': can_refer
        },
        'companies': [
            {'name': company, 'count': len(contacts)}
            for company, contacts in company_groups.items()
        ]
    })


@app.route('/api/network/contacts', methods=['POST'])
@require_auth
def add_network_contact():
    """Add a new network contact"""
    user_id = g.user_id
    data = request.get_json()

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    company = data.get('company', '').strip()
    job_title = data.get('job_title', '').strip()

    if not name or not email:
        return jsonify({'error': 'Name and email are required'}), 400

    # Check if contact already exists
    existing = network_contacts_collection.find_one({
        'user_id': user_id,
        'email': email.lower()
    })

    if existing:
        return jsonify({'error': 'Contact with this email already exists'}), 409

    contact = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'name': name,
        'email': email.lower(),
        'company': company,
        'job_title': job_title,
        'linkedin_url': data.get('linkedin_url', ''),
        'relationship_strength': data.get('relationship_strength', 'acquaintance'),  # close_friend, friend, acquaintance, professional
        'at_target_company': data.get('at_target_company', False),
        'target_company': data.get('target_company', ''),
        'can_refer': data.get('can_refer', False),
        'notes': data.get('notes', ''),
        'last_contact': data.get('last_contact', ''),
        'tags': data.get('tags', []),
        'created_at': datetime.utcnow().isoformat()
    }

    network_contacts_collection.insert_one(contact)

    # Update gamification
    gamification_collection.update_one(
        {'user_id': user_id},
        {'$inc': {'stats.network_size': 1}},
        upsert=True
    )

    return jsonify({'success': True, 'contact': contact})


@app.route('/api/network/contacts/import', methods=['POST'])
@require_auth
def import_contacts():
    """Import multiple contacts (e.g., from CSV or LinkedIn)"""
    user_id = g.user_id
    data = request.get_json()
    contacts = data.get('contacts', [])

    if not contacts or not isinstance(contacts, list):
        return jsonify({'error': 'Contacts array is required'}), 400

    imported = 0
    skipped = 0

    for contact_data in contacts:
        email = contact_data.get('email', '').strip().lower()
        if not email:
            continue

        # Skip if already exists
        existing = network_contacts_collection.find_one({
            'user_id': user_id,
            'email': email
        })

        if existing:
            skipped += 1
            continue

        contact = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'name': contact_data.get('name', '').strip(),
            'email': email,
            'company': contact_data.get('company', '').strip(),
            'job_title': contact_data.get('job_title', '').strip(),
            'linkedin_url': contact_data.get('linkedin_url', ''),
            'relationship_strength': 'acquaintance',
            'at_target_company': False,
            'can_refer': False,
            'notes': '',
            'tags': [],
            'created_at': datetime.utcnow().isoformat()
        }

        network_contacts_collection.insert_one(contact)
        imported += 1

    return jsonify({
        'success': True,
        'imported': imported,
        'skipped': skipped,
        'total': imported + skipped
    })


@app.route('/api/network/contacts/<contact_id>', methods=['PUT'])
@require_auth
def update_network_contact(contact_id):
    """Update a network contact"""
    user_id = g.user_id
    data = request.get_json()

    contact = network_contacts_collection.find_one({
        'id': contact_id,
        'user_id': user_id
    })

    if not contact:
        return jsonify({'error': 'Contact not found'}), 404

    allowed_fields = [
        'name', 'email', 'company', 'job_title', 'linkedin_url',
        'relationship_strength', 'at_target_company', 'target_company',
        'can_refer', 'notes', 'last_contact', 'tags'
    ]

    update_fields = {'updated_at': datetime.utcnow().isoformat()}
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    network_contacts_collection.update_one(
        {'id': contact_id},
        {'$set': update_fields}
    )

    updated = network_contacts_collection.find_one({'id': contact_id}, {'_id': 0})
    return jsonify({'success': True, 'contact': updated})


@app.route('/api/network/contacts/<contact_id>', methods=['DELETE'])
@require_auth
def delete_network_contact(contact_id):
    """Delete a network contact"""
    user_id = g.user_id

    result = network_contacts_collection.delete_one({
        'id': contact_id,
        'user_id': user_id
    })

    if result.deleted_count == 0:
        return jsonify({'error': 'Contact not found'}), 404

    return jsonify({'success': True, 'message': 'Contact deleted'})


@app.route('/api/network/target-companies', methods=['GET'])
@require_auth
def get_target_company_connections():
    """Get contacts at user's target companies"""
    user_id = g.user_id
    target_company = request.args.get('company')

    query = {
        'user_id': user_id,
        'at_target_company': True
    }

    if target_company:
        query['target_company'] = target_company

    contacts = list(network_contacts_collection.find(query, {'_id': 0}))

    # Group by target company
    connections = {}
    for contact in contacts:
        company = contact.get('target_company', 'Unknown')
        if company not in connections:
            connections[company] = {
                'company': company,
                'contacts': [],
                'referral_potential': 0
            }
        connections[company]['contacts'].append(contact)
        if contact.get('can_refer'):
            connections[company]['referral_potential'] += 1

    return jsonify({
        'success': True,
        'connections': list(connections.values()),
        'total_target_contacts': len(contacts)
    })


@app.route('/api/network/insights', methods=['GET'])
@require_auth
def get_network_insights():
    """Get AI-powered insights about network"""
    user_id = g.user_id

    contacts = list(network_contacts_collection.find({'user_id': user_id}))

    if len(contacts) < 3:
        return jsonify({
            'success': True,
            'insights': {
                'summary': 'Add more contacts to get personalized insights about your network.',
                'recommendations': [
                    'Import your LinkedIn connections',
                    'Add contacts at companies you want to work for',
                    'Keep track of who can provide referrals'
                ],
                'network_health': 'growing'
            }
        })

    # Calculate network health metrics
    companies = set(c.get('company') for c in contacts if c.get('company'))
    target_companies = set(c.get('target_company') for c in contacts if c.get('at_target_company'))
    referral_sources = sum(1 for c in contacts if c.get('can_refer'))

    # Build insight summary
    insights = {
        'summary': f'You have {len(contacts)} contacts across {len(companies)} companies. ',
        'network_health': 'strong' if len(contacts) > 20 else 'growing' if len(contacts) > 5 else 'small',
        'top_companies': [
            {'name': company, 'count': sum(1 for c in contacts if c.get('company') == company)}
            for company in sorted(companies, key=lambda c: sum(1 for x in contacts if x.get('company') == c), reverse=True)[:5]
        ],
        'referral_opportunities': referral_sources,
        'target_company_coverage': len(target_companies),
        'recommendations': [
            'Reach out to contacts you haven\'t spoken to in 3+ months' if len(contacts) > 10 else 'Continue building your network',
            f'You have {referral_sources} potential referral sources' if referral_sources > 0 else 'Identify who in your network can refer you',
            'Update your target companies list' if len(target_companies) == 0 else f'You have connections at {len(target_companies)} target companies'
        ]
    }

    return jsonify({'success': True, 'insights': insights})


if __name__ == "__main__":
    app.run(debug=True, port=5000)