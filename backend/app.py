from flask import Flask, request, jsonify, g
from flask_cors import CORS
import os
import re
import json
import uuid
import bcrypt
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

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

app = Flask(__name__)
CORS(app, origins='*', supports_credentials=True)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

cv_data_store = []

# MongoDB connection
MONGODB_URI = os.environ.get('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError('MONGODB_URI environment variable is required')

mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = mongo_client.get_default_database()
users_collection = db['users']
cv_data_collection = db['cv_data']

# JWT Secret for auth tokens
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_claude_client():
    if not ANTHROPIC_AVAILABLE:
        return None
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return anthropic.Anthropic(api_key=api_key)


def call_claude(system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str | None:
    client = get_claude_client()
    if not client:
        return None
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": user_prompt}],
            system=system_prompt,
        )
        return message.content[0].text
    except Exception as e:
        print(f"Claude API error: {e}")
        return None


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_password(password: str) -> str:
    """Hash password using bcrypt (secure)"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_token(user_id: str) -> str:
    """Generate a simple auth token"""
    import hmac
    timestamp = str(int(datetime.utcnow().timestamp()))
    token_data = f"{user_id}:{timestamp}"
    signature = hmac.new(JWT_SECRET.encode(), token_data.encode(), 'sha256').hexdigest()[:32]
    return f"{token_data}:{signature}"


def verify_token(token: str) -> str | None:
    """Verify auth token and return user_id if valid"""
    if not token or not token.startswith('token_'):
        return None
    # For backward compatibility with old tokens
    if token.startswith('token_'):
        user_id = token.replace('token_', '')
        # Verify user exists in DB
        user = users_collection.find_one({'id': user_id})
        return user_id if user else None
    return None


def require_auth(f):
    """Decorator to require authentication for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Extract token from "Bearer <token>" or just "<token>"
        token = auth_header.replace('Bearer ', '').replace('token_', '')
        user_id = verify_token(auth_header)
        
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Load user from DB
        user = users_collection.find_one({'id': user_id}, {'password_hash': 0})
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Set current user in flask g
        g.current_user = user
        g.user_id = user_id
        return f(*args, **kwargs)
    return decorated_function


def extract_text_from_pdf(filepath):
    if PyPDF2 is None:
        return "PDF extraction not available"
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
        return "DOCX extraction not available"
    try:
        doc = docx.Document(filepath)
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        return f"Error reading DOCX: {e}"


# ─── CV Parsing ───────────────────────────────────────────────────────────────

def parse_cv_data(text: str, filename: str) -> dict:
    data = {
        'filename': filename,
        'raw_text': text[:3000],
        'email': None,
        'phone': None,
        'skills': [],
        'name': None,
        'education': [],
        'experience': [],
        'word_count': len(text.split()),
    }

    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        data['email'] = email_match.group(0)

    for pattern in [r'\+?[\d\s\-\(\)]{10,20}', r'\(\d{3}\)\s*\d{3}[\s-]?\d{4}', r'\d{3}[\s-]\d{3}[\s-]\d{4}']:
        m = re.search(pattern, text)
        if m:
            data['phone'] = m.group(0).strip()
            break

    common_skills = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust',
        'react', 'angular', 'vue', 'next.js', 'node.js', 'django', 'flask',
        'fastapi', 'spring', 'express', 'sql', 'mysql', 'postgresql', 'mongodb',
        'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'ci/cd',
        'agile', 'scrum', 'machine learning', 'deep learning', 'tensorflow',
        'pytorch', 'data analysis', 'tableau', 'power bi', 'excel', 'pandas',
        'numpy', 'scikit-learn', 'rest api', 'graphql', 'microservices',
        'project management', 'leadership', 'communication', 'problem solving',
        'teamwork', 'devops', 'linux', 'figma', 'photoshop',
    ]
    text_lower = text.lower()
    data['skills'] = [s for s in common_skills if s in text_lower]

    lines = text.split('\n')[:10]
    for line in lines:
        line = line.strip()
        if line and 2 < len(line) < 50:
            if not re.match(r'^[\d\W]', line) and 'email' not in line.lower():
                if 'name' in line.lower() and ':' in line:
                    data['name'] = line.split(':')[1].strip()
                elif not data['name'] and line[0].isupper():
                    data['name'] = line
                break

    edu_keywords = ['bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'degree', 'university', 'college', 'school', 'b.e.', 'b.tech', 'm.tech']
    for kw in edu_keywords:
        if kw in text_lower:
            for sentence in re.split(r'[.\n]', text):
                if kw in sentence.lower() and len(sentence.strip()) > 10:
                    data['education'].append(sentence.strip()[:150])
                    break

    exp_keywords = ['experience', 'worked at', 'employed', 'position', 'role', 'company']
    for kw in exp_keywords:
        if kw in text_lower:
            for sentence in re.split(r'[.\n]', text)[:20]:
                if kw in sentence.lower() and len(sentence.strip()) > 20:
                    data['experience'].append(sentence.strip()[:150])
                    break

    return data


# ─── Legacy analysis (fast, no AI) ───────────────────────────────────────────

def analyze_cv_quality(cv_data: dict, text: str) -> dict:
    score = 0
    mistakes = []
    suggestions = []
    categories = {
        'contact_info': {'score': 0, 'max': 15, 'issues': []},
        'structure':    {'score': 0, 'max': 20, 'issues': []},
        'content':      {'score': 0, 'max': 25, 'issues': []},
        'skills':       {'score': 0, 'max': 20, 'issues': []},
        'grammar_style':{'score': 0, 'max': 20, 'issues': []},
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
        suggestions.append('Include your phone number for easy contact')

    if cv_data.get('name'):
        categories['contact_info']['score'] += 5
    else:
        mistakes.append('Name not clearly detected')
        suggestions.append('Make sure your full name is prominently displayed at the top')

    text_lower = text.lower()

    if any(w in text_lower for w in ['summary', 'objective', 'profile', 'about']):
        categories['structure']['score'] += 5
    else:
        mistakes.append('No professional summary found')
        suggestions.append('Add a 2-3 line professional summary at the beginning')

    if cv_data.get('education'):
        categories['structure']['score'] += 5
    else:
        mistakes.append('Education section unclear')
        suggestions.append('Clearly list your education with degrees, institutions, and dates')

    if cv_data.get('experience'):
        categories['structure']['score'] += 5
    else:
        mistakes.append('Work experience section missing or unclear')
        suggestions.append('Add detailed work experience with company names, roles, and dates')

    if cv_data.get('skills'):
        categories['structure']['score'] += 5

    wc = cv_data.get('word_count', len(text.split()))
    if 200 <= wc <= 800:
        categories['content']['score'] += 10
    elif wc < 200:
        mistakes.append('CV content is too brief')
        suggestions.append('Expand to at least 300-400 words for better impact')
    else:
        mistakes.append('CV is too lengthy')
        suggestions.append('Keep CV concise (1-2 pages recommended)')

    action_verbs = ['managed', 'led', 'developed', 'created', 'implemented', 'designed',
                    'achieved', 'improved', 'increased', 'reduced', 'launched', 'built',
                    'coordinated', 'supervised', 'trained', 'optimized', 'delivered']
    if sum(1 for v in action_verbs if v in text_lower) >= 3:
        categories['content']['score'] += 10
    else:
        mistakes.append('Not enough strong action verbs')
        suggestions.append('Use strong action verbs: managed, developed, achieved, etc.')

    if re.search(r'\d+%|\$\d+|\d+\s*(years?|months?|people|team)', text_lower):
        categories['content']['score'] += 5
    else:
        mistakes.append('Missing quantifiable achievements')
        suggestions.append('Add numbers to achievements (e.g., "Increased sales by 25%")')

    sc = len(cv_data.get('skills', []))
    if sc >= 8:
        categories['skills']['score'] += 15
    elif sc >= 5:
        categories['skills']['score'] += 10
    elif sc >= 3:
        categories['skills']['score'] += 5
    else:
        mistakes.append('Limited skills showcased')
        suggestions.append('Add more relevant skills (technical and soft skills)')

    soft = ['communication', 'leadership', 'teamwork', 'problem solving']
    if sum(1 for s in soft if s in text_lower) >= 2:
        categories['skills']['score'] += 5
    else:
        suggestions.append('Include relevant soft skills like communication and leadership')

    grammar_issues = 0
    for pattern in [r'\b(\w+) \1\b', r'  +', r'[A-Z]{5,}']:
        if re.search(pattern, text):
            grammar_issues += 1

    if grammar_issues == 0:
        categories['grammar_style']['score'] += 10
    else:
        mistakes.append('Potential grammar or formatting issues detected')
        suggestions.append('Review for proper grammar and professional tone')

    if text.count('•') + text.count('-') + text.count('*') >= 5:
        categories['grammar_style']['score'] += 10
    else:
        suggestions.append('Use bullet points for better readability')

    total = sum(c['score'] for c in categories.values())
    pct = round((total / 100) * 100)

    if pct >= 85:
        status, msg = 'Excellent', 'Your CV is professional and well-structured!'
    elif pct >= 70:
        status, msg = 'Good', 'Good CV with minor improvements needed'
    elif pct >= 50:
        status, msg = 'Average', 'Your CV needs some improvements to stand out'
    else:
        status, msg = 'Needs Work', 'Significant improvements recommended'

    return {
        'score': total,
        'max_score': 100,
        'percentage': pct,
        'status': status,
        'status_message': msg,
        'categories': categories,
        'mistakes': mistakes or ['No major issues found'],
        'suggestions': suggestions or ['Great job! Your CV looks professional'],
        'word_count': wc,
        'skills_count': sc,
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
    user_type = data.get('userType', 'candidate')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if user_type not in ('candidate', 'company'):
        return jsonify({'error': 'userType must be candidate or company'}), 400

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
    user_type = data.get('userType', 'candidate')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    # Fetch user from MongoDB
    user = users_collection.find_one({'email': email})
    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if user['userType'] != user_type:
        return jsonify({'error': f'This account is registered as {user["userType"]}, not {user_type}'}), 403

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


if __name__ == "__main__":
    app.run(debug=True, port=5000)