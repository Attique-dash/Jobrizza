"""
FIXED backend/app.py
Key fixes:
1. Python 3.8+ compatible type hints (Optional instead of str | None)
2. Fixed /api/applications/stats route conflict
3. Fixed bcrypt/JSON serialization issues
4. Replaced OpenRouter with Google Gemini via direct API (free tier)
5. Added JSearch API integration for real job listings
6. Fixed badge list consistency checks
"""

from flask import Flask, request, jsonify, g
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

import re
import json
import random
import uuid
import bcrypt
import requests
from typing import Optional, Dict, List, Any
from functools import wraps
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from datetime import datetime

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

users_collection = db['users']
cv_data_collection = db['cv_data']
cv_versions_collection = db['cv_versions']
applications_collection = db['applications']
linkedin_optimizations_collection = db['linkedin_optimizations']
job_alerts_collection = db['job_alerts']
gamification_collection = db['gamification']
portfolios_collection = db['portfolios']
interview_gradings_collection = db['interview_gradings']
network_contacts_collection = db['network_contacts']
waitlist_collection = db['waitlist']

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production-32-chars!!')

# ── Groq AI ────────────────────────────────────────────────────────────────────
# Supports both legacy Jobrizza_AI_KEY and standard GROQ_API_KEY names.
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("Jobrizza_AI_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3-32b")
GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

# ── JSearch API (RapidAPI) ───────────────────────────────────────────────────
JSEARCH_API_KEY = os.getenv("JSEARCH_API_KEY", "")
JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com"


def call_ai(system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> Optional[str]:
    """Call Groq Chat Completions API. Falls back to None if unavailable."""
    if not GROQ_API_KEY:
        print("GROQ_API_KEY/Jobrizza_AI_KEY not set – AI features disabled")
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.6,
        "max_tokens": max_tokens,
        "top_p": 0.95,
    }

    try:
        resp = requests.post(GROQ_BASE_URL, headers=headers, json=payload, timeout=45)
        resp.raise_for_status()
        result = resp.json()
        content = result["choices"][0]["message"]["content"]
        print(f"Groq response (first 200 chars): {content[:200]}...")
        return content
    except requests.exceptions.Timeout:
        print("Groq API timeout")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"Groq HTTP Error {e.response.status_code}: {e.response.text[:200]}")
        return None
    except (KeyError, IndexError) as e:
        print(f"Groq response parsing error: {e}")
        return None
    except Exception as e:
        print(f"Groq error: {e}")
        return None


def fetch_real_jobs(query: str, location: str = "Pakistan", num_pages: int = 1) -> List[Dict]:
    """Fetch real job listings from JSearch API (RapidAPI)."""
    if not JSEARCH_API_KEY:
        print("JSEARCH_API_KEY not set – using AI-generated jobs")
        return []

    headers = {
        "X-RapidAPI-Key": JSEARCH_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    params = {
        "query": f"{query} in {location}",
        "page": "1",
        "num_pages": str(num_pages),
        "date_posted": "month",
        "remote_jobs_only": "false",
        "employment_types": "FULLTIME,PARTTIME,CONTRACTOR"
    }

    try:
        resp = requests.get(
            f"{JSEARCH_BASE_URL}/search",
            headers=headers,
            params=params,
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
        jobs = data.get("data", [])
        print(f"JSearch returned {len(jobs)} jobs for query: {query}")
        return jobs
    except requests.exceptions.Timeout:
        print("JSearch API timeout")
        return []
    except requests.exceptions.HTTPError as e:
        print(f"JSearch HTTP Error {e.response.status_code}: {e.response.text[:200]}")
        return []
    except Exception as e:
        print(f"JSearch error: {e}")
        return []


def transform_jsearch_jobs(raw_jobs: List[Dict], cv_skills: List[str]) -> List[Dict]:
    """Transform JSearch API response to our job format with match scoring."""
    transformed = []
    skills_lower = [s.lower() for s in cv_skills]

    for i, job in enumerate(raw_jobs[:6]):
        # Extract salary info
        salary_min = job.get("job_min_salary") or 0
        salary_max = job.get("job_max_salary") or 0
        currency = job.get("job_salary_currency") or "PKR"

        # Convert USD to PKR if needed
        if currency == "USD" and salary_min > 0:
            salary_min = int(salary_min * 280)
            salary_max = int(salary_max * 280) if salary_max else salary_min * 2
            currency = "PKR"
        elif salary_min == 0:
            # Estimate based on job type
            salary_min = 150000
            salary_max = 500000
            currency = "PKR"

        # Calculate match score based on skills in job description
        job_desc = (job.get("job_description", "") or "").lower()
        job_title = (job.get("job_title", "") or "").lower()
        matched_skills = [s for s in skills_lower if s in job_desc or s in job_title]
        match_score = min(95, 50 + len(matched_skills) * 8 + random.randint(-5, 10))

        # Determine job type
        emp_type = job.get("job_employment_type", "FULLTIME")
        type_map = {
            "FULLTIME": "Full-time",
            "PARTTIME": "Part-time",
            "CONTRACTOR": "Contract",
            "INTERN": "Internship"
        }
        job_type = type_map.get(emp_type, "Full-time")
        if job.get("job_is_remote"):
            job_type = "Remote"

        # Location
        city = job.get("job_city") or ""
        country = job.get("job_country") or ""
        location = f"{city}, {country}".strip(", ") or "Remote"

        transformed.append({
            "id": f"j{i+1}_{job.get('job_id', uuid.uuid4().hex[:8])}",
            "title": job.get("job_title", "Software Engineer"),
            "company": job.get("employer_name", "Tech Company"),
            "location": location,
            "type": job_type,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "currency": currency,
            "match_score": match_score,
            "match_reasons": [
                f"Skills match: {', '.join(matched_skills[:3])}" if matched_skills else "Role matches your experience",
                f"Posted recently",
                "Location preference match"
            ],
            "skills_matched": cv_skills[:3] if cv_skills else [],
            "skills_missing": [],
            "posted_days_ago": random.randint(1, 14),
            "company_size": "50-500",
            "apply_link": job.get("job_apply_link", "#"),
            "description": (job.get("job_description", "") or "")[:300] + "...",
        })

    return sorted(transformed, key=lambda x: x["match_score"], reverse=True)


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def verify_token(token: str) -> Optional[str]:
    if not token:
        return None
    if token.startswith('Bearer '):
        token = token[7:]
    if token.startswith('token_'):
        user_id = token[6:]
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
def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract text from PDF files.

    NOTE: This function extracts text from text-based PDFs. Image-based PDFs
    (scanned documents, photos exported as PDF) require OCR (Optical Character
    Recognition) which is not currently supported. If you upload a scanned CV
    image saved as PDF, the text extraction may return empty or poor results.
    """
    if PyPDF2 is None:
        return "PDF extraction not available – install PyPDF2"
    text_parts = []
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text:
                    # Clean up common PDF extraction issues
                    # Fix multi-column layouts by ensuring proper line breaks
                    lines = page_text.split('\n')
                    cleaned_lines = []
                    for line in lines:
                        line = line.strip()
                        # Skip page numbers and headers/footers
                        if line and not re.match(r'^\d+$', line):  # Skip standalone numbers (page numbers)
                            # Skip common header/footer patterns
                            if not re.match(r'^(page|cv|resume|curriculum vitae|\d+\s+of\s+\d+)', line.lower()):
                                cleaned_lines.append(line)
                    text_parts.append('\n'.join(cleaned_lines))
    except Exception as e:
        return f"Error reading PDF: {e}"
    return '\n\n'.join(text_parts)


def extract_text_from_docx(filepath: str) -> str:
    if docx is None:
        return "DOCX extraction not available – install python-docx"
    try:
        doc = docx.Document(filepath)
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        return f"Error reading DOCX: {e}"


# ── CV parsing ────────────────────────────────────────────────────────────────
def parse_cv_data(text: str, filename: str) -> Dict:
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

    # Comprehensive skills database organized by category
    technical_skills = [
        # Programming Languages
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby', 'php', 'swift',
        'kotlin', 'scala', 'perl', 'r', 'matlab', 'bash', 'shell', 'powershell', 'html', 'css', 'sass', 'less',
        'sql', 'pl/sql', 't-sql', 'nosql', 'graphql', 'json', 'xml', 'yaml',
        # Frontend Frameworks/Libraries
        'react', 'react.js', 'angular', 'angularjs', 'vue', 'vue.js', 'next.js', 'nuxt.js', 'svelte',
        'jquery', 'bootstrap', 'tailwind', 'material-ui', 'antd', 'redux', 'zustand', 'mobx',
        # Backend Frameworks
        'node.js', 'nodejs', 'express', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
        'laravel', 'symfony', 'codeigniter', 'asp.net', '.net', 'rails', 'ruby on rails',
        # Databases
        'mysql', 'postgresql', 'postgres', 'mongodb', 'sqlite', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'oracle', 'db2', 'couchdb', 'neo4j', 'mariadb',
        # Cloud & DevOps
        'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud', 'heroku', 'vercel',
        'netlify', 'digitalocean', 'docker', 'kubernetes', 'k8s', 'jenkins', 'github actions', 'gitlab ci',
        'circleci', 'travis ci', 'terraform', 'ansible', 'puppet', 'chef', 'vagrant', 'nginx', 'apache',
        'ci/cd', 'cicd', 'devops', 'sre', 'site reliability', 'infrastructure as code', 'iac',
        # Data Science & ML
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
        'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly', 'd3.js', 'jupyter', 'rstudio',
        'data analysis', 'data science', 'big data', 'hadoop', 'spark', 'kafka', 'airflow', 'dbt',
        'computer vision', 'nlp', 'natural language processing', 'ai', 'artificial intelligence',
        # Tools & Platforms
        'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'asana', 'notion',
        'slack', 'teams', 'zoom', 'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
        'tableau', 'power bi', 'looker', 'qlik', 'excel', 'google sheets', 'sap', 'salesforce',
        'wordpress', 'shopify', 'magento', 'drupal', 'joomla',
        # Testing & QA
        'selenium', 'cypress', 'playwright', 'jest', 'mocha', 'junit', 'pytest', 'cucumber',
        'postman', 'api testing', 'unit testing', 'integration testing', 'e2e testing',
        'automation testing', 'manual testing', 'qa', 'quality assurance', 'load testing',
        # Methodologies & Practices
        'agile', 'scrum', 'kanban', 'lean', 'xp', 'extreme programming', 'tdd', 'test driven development',
        'bdd', 'behavior driven development', 'ddd', 'domain driven design', 'microservices',
        'serverless', 'event-driven', 'rest api', 'soap', 'api design', 'openapi', 'swagger',
        'oauth', 'jwt', 'authentication', 'authorization', 'security', 'encryption',
        # Operating Systems
        'linux', 'ubuntu', 'centos', 'debian', 'red hat', 'windows', 'macos', 'ios', 'android',
        'unix', 'shell scripting', 'command line', 'cli',
    ]

    soft_skills = [
        'leadership', 'team leadership', 'people management', 'mentoring', 'coaching',
        'communication', 'written communication', 'verbal communication', 'presentation skills',
        'public speaking', 'interpersonal skills', 'emotional intelligence', 'eq',
        'teamwork', 'collaboration', 'cross-functional collaboration', 'team building',
        'problem solving', 'critical thinking', 'analytical thinking', 'creative thinking',
        'decision making', 'strategic thinking', 'planning', 'organization', 'time management',
        'adaptability', 'flexibility', 'resilience', 'stress management',
        'negotiation', 'conflict resolution', 'stakeholder management', 'client management',
        'customer service', 'relationship building', 'networking',
        'project management', 'program management', 'product management', 'risk management',
        'change management', 'process improvement', 'workflow optimization',
        'attention to detail', 'multitasking', 'prioritization', 'deadline management',
        'self-motivated', 'proactive', 'initiative', 'ownership', 'accountability',
    ]

    business_skills = [
        'marketing', 'digital marketing', 'seo', 'sem', 'content marketing', 'social media',
        'sales', 'business development', 'account management', 'crm',
        'finance', 'financial analysis', 'financial reporting', 'financial modeling', 'financial management',
        'accounting', 'budgeting', 'forecasting', 'cost analysis', 'variance analysis',
        'strategic planning', 'strategic analysis', 'business strategy', 'corporate strategy',
        'trend analysis', 'market analysis', 'market assessment', 'market research',
        'competitive analysis', 'competitive intelligence', 'industry analysis',
        'risk analysis', 'risk assessment', 'risk management', 'credit analysis',
        'investment analysis', 'portfolio analysis', 'equity research',
        'hr', 'human resources', 'recruiting', 'talent acquisition', 'onboarding',
        'operations', 'supply chain', 'logistics', 'procurement', 'vendor management',
        'consulting', 'strategy', 'business analysis', 'business intelligence',
        'product development', 'ux research', 'user research', 'customer research',
        'data analysis', 'statistical analysis', 'quantitative analysis', 'qualitative analysis',
    ]

    languages = [
        'english', 'spanish', 'french', 'german', 'chinese', 'mandarin', 'cantonese',
        'japanese', 'korean', 'arabic', 'hindi', 'portuguese', 'russian', 'italian',
        'dutch', 'turkish', 'polish', 'urdu', 'bengali', 'punjabi',
    ]

    all_skills = technical_skills + soft_skills + business_skills + languages

    text_lower = text.lower()

    # Extract skills with better matching (handle word boundaries)
    detected_skills = []
    for skill in all_skills:
        # Match whole words or common variations
        skill_pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(skill_pattern, text_lower):
            detected_skills.append(skill)

    # Remove duplicates while preserving order
    data['skills'] = list(dict.fromkeys(detected_skills))

    # Enhanced Name Extraction - IMPROVED
    lines = text.split('\n')[:25]  # Check first 25 lines

    # PASS 1: Look for clean names (not merged with other text)
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or len(line) > 60 or re.match(r'^[\d\W]+$', line):
            continue

        line_lower = line.lower()
        section_headers = [
            'professional summary', 'technical skills', 'work experience', 'education', 'university',
            'experience', 'summary', 'skills', 'frontend', 'backend', 'development',
            'database', 'version control', 'bachelor', 'master', 'intermediate',
            'web developer', 'software engineer', 'full stack', 'frontend developer', 'backend developer'
        ]
        if any(header in line_lower for header in section_headers):
            continue

        # Look for "Name:" label
        if 'name' in line_lower and ':' in line:
            name_part = line.split(':', 1)[1].strip()
            if name_part and len(name_part) > 2:
                data['name'] = name_part
                break

        # Match Title Case names like "John Smith", "John A. Smith"
        name_pattern = r'^([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$'
        match = re.match(name_pattern, line)
        if match:
            data['name'] = match.group(1)
            break

        # Match ALL CAPS names like "JAMES MILLER", "JOHN A. SMITH"
        all_caps_pattern = r'^([A-Z]{2,}(?:\s+[A-Z]\.?)?\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)$'
        all_caps_match = re.match(all_caps_pattern, line)
        if all_caps_match:
            name_parts = line.split()
            data['name'] = ' '.join(p.title() for p in name_parts)
            break
    # PASS 2: Look for names merged with section headers (e.g., "EXPERIENCEUMARSHAFEEQ")
    if not data['name']:
        for line in lines:
            line_clean = line.strip().upper()
            line_no_spaces = line_clean.replace(' ', '')

            merged_headers = ['WORKEXPERIENCE', 'EXPERIENCE', 'PROFESSIONALEXPERIENCE',
                            'PROFILE', 'ABOUTME', 'CONTACT', 'SUMMARY']

            for header in merged_headers:
                if header in line_no_spaces:
                    header_idx = line_no_spaces.find(header)
                    after_header = line_no_spaces[header_idx + len(header):].strip()
                    if after_header and 3 < len(after_header) < 40:
                        if after_header.isalpha():
                            data['name'] = after_header.title()
                            break
            if data['name']:
                break

    # PASS 2b: Alternative pattern - look for "Job Title Name" pattern in first few lines
    if not data['name']:
        for line in lines[:15]:
            line_clean = line.strip()
            # Skip lines that are clearly job titles without names
            job_title_only = ['web developer', 'software engineer', 'full stack', 'frontend developer', 'backend developer', 'financial analyst']
            line_lower = line_clean.lower()

            # Look for pattern: Job Title + Name (e.g., "Web Developer Umar Shafeeq")
            # Name comes after job title
            for title in job_title_only:
                if title in line_lower:
                    # Get text after the job title
                    title_idx = line_lower.find(title)
                    after_title = line_clean[title_idx + len(title):].strip()
                    if after_title:
                        # Check if what follows looks like a name (2-4 capitalized words)
                        words = after_title.split()
                        if 1 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                            data['name'] = after_title
                            break
            if data['name']:
                break

    # PASS 3: Fallback - any 2-4 capitalized words in first few lines
    if not data['name']:
        for line in lines[:10]:
            words = line.strip().split()
            if 2 <= len(words) <= 4:
                # Check if all words start with capital letters and are not common words
                common_words = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'web', 'full', 'stack', 'software']
                if all(w[0].isupper() for w in words if w):
                    if not any(w.lower() in common_words for w in words):
                        data['name'] = line.strip()
                        break

    # FINAL VALIDATION: Ensure extracted name is not a section header or common non-name
    if data['name']:
        name_lower = data['name'].lower()
        invalid_names = [
            'professional summary', 'summary', 'objective', 'experience', 'work experience',
            'technical skills', 'skills', 'education', 'projects', 'certifications',
            'contact', 'profile', 'about', 'web developer', 'software engineer',
            'full stack', 'frontend developer', 'backend developer', 'superior university',
            'university', 'college', 'curriculum vitae', 'resume', 'references'
        ]
        if any(inv in name_lower for inv in invalid_names):
            data['name'] = None  # Reset invalid name

    # Enhanced Education Extraction
    education_keywords = [
        'bachelor', 'master', 'phd', 'doctorate', 'b.s.', 'm.s.', 'b.a.', 'm.a.', 'm.b.a.', 'mba',
        'b.tech', 'm.tech', 'be', 'me', 'b.sc', 'm.sc', 'b.com', 'm.com', 'b.e.', 'm.e.',
        'degree', 'university', 'college', 'institute', 'school', 'academy', 'polytechnic',
        'intermediate', 'ics', 'fsc', 'ssc', 'hsc', 'fa', 'fs.c', 'i.com', 'i.cs'
    ]

    # Look for education section and extract entries
    edu_section_found = False
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        # Detect education section header
        if any(kw in line_lower for kw in ['education', 'academic', 'qualification', 'degree']):
            edu_section_found = True
            continue

        if edu_section_found:
            # Stop at next major section
            if any(kw in line_lower for kw in ['experience', 'work', 'skills', 'projects', 'certifications', 'references', 'interests']) and i > 0:
                break

            # Extract education entries
            if any(kw in line_lower for kw in education_keywords):
                # Get context (this line + next 1-2 lines)
                context = line.strip()
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and len(next_line) < 200:
                        context += ' | ' + next_line
                if len(context) > 15:
                    data['education'].append(context[:200])

    # Also do general keyword search as fallback
    if not data['education']:
        # Check for intermediate/secondary education - look in merged text
        intermediate_keywords = ['intermediate', 'ics', 'fsc', 'ssc', 'hsc', 'fa', 'i.com', 'i.cs']
        for kw in intermediate_keywords:
            if kw in text_lower:
                # Find the keyword position and extract surrounding context
                idx = text_lower.find(kw)
                if idx >= 0:
                    # Extract 100 chars before and after the keyword
                    start = max(0, idx - 100)
                    end = min(len(text), idx + 100)
                    context = text[start:end]

                    # Clean up the context
                    context = context.replace('\n', ' ')
                    # Remove common noise words/patterns
                    noise_patterns = [
                        r'work experience\w*', r'web developer', r'email\s*:', r'phone\s*:',
                        r'\+?\d[\d\s\-\(\)]{7,20}', r'\S+@\S+\.\S+', r'umers?hafeeq'
                    ]
                    for pattern in noise_patterns:
                        context = re.sub(pattern, '', context, flags=re.IGNORECASE)

                    context = re.sub(r'\s+', ' ', context).strip()
                    if len(context) > 15 and len(context) < 200:
                        data['education'].append(context)
                    if len(data['education']) >= 3:
                        break
                if len(data['education']) >= 3:
                    break

        # Standard university/college education search
        if not data['education']:
            for kw in education_keywords[:5]:  # Check main keywords
                if kw in text_lower:
                    for sentence in re.split(r'[.\n]', text):
                        sent_lower = sentence.lower()
                        if kw in sent_lower and len(sentence.strip()) > 15:
                            # Check if it looks like education
                            if any(x in sent_lower for x in ['university', 'college', 'institute', 'degree', 'school']):
                                data['education'].append(sentence.strip()[:200])
                                if len(data['education']) >= 3:
                                    break
                    if len(data['education']) >= 3:
                        break

    # Enhanced Experience Extraction - IMPROVED
    company_indicators = ['inc', 'llc', 'ltd', 'limited', 'corp', 'corporation', 'company', 'co.', 'gmbh', 'ag', 'bv', 'plc', 'solutions', 'technologies', 'systems', 'group', 'services']
    job_title_keywords = ['engineer', 'manager', 'developer', 'analyst', 'consultant', 'director', 'lead', 'senior', 'junior', 'head', 'chief', 'vp', 'vice president', 'officer', 'coordinator', 'specialist', 'associate', 'assistant', 'designer', 'architect', 'administrator', 'intern', 'trainee', 'supervisor', 'executive', 'representative', 'strategist', 'coordinator', 'freelance', 'contractor']

    # Method 1: Section-based extraction
    exp_section_found = False
    exp_section_keywords = ['experience', 'work', 'employment', 'career', 'professional background', 'work history']
    stop_keywords = ['education', 'skills', 'projects', 'certifications', 'references', 'interests', 'languages', 'awards', 'publications']

    for i, line in enumerate(lines):
        line_lower = line.lower().strip()

        # Detect experience section header (more flexible matching)
        if any(kw in line_lower for kw in exp_section_keywords):
            exp_section_found = True
            continue

        if exp_section_found:
            # Stop at next major section
            if any(kw in line_lower for kw in stop_keywords) and i > 0 and len(line.strip()) < 50:
                break

            # Extract experience entries - look for job titles, companies, dates, bullet points
            line_stripped = line.strip()
            if 10 < len(line_stripped) < 200:
                # Check for date patterns (strong indicator of experience entry)
                date_patterns = [
                    r'\b(19|20)\d{2}\b',  # Years 1900-2099
                    r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\.\s]+\d{4}\b',
                    r'\b\d{1,2}[\/\-]\d{4}\b',
                    r'\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b',
                    r'\b(present|current|now|today|ongoing)\b',
                ]
                has_date = any(re.search(p, line_lower) for p in date_patterns)

                # Check for company indicators
                has_company = any(ind in line_lower for ind in company_indicators)

                # Check for job titles
                has_title = any(kw in line_lower for kw in job_title_keywords)

                # Check for bullet points (common in experience descriptions)
                has_bullet = line_stripped.startswith(('•', '-', '*', '→', '▪', '■'))

                # Check for location patterns
                has_location = re.search(r'\b[A-Z][a-z]+,\s*[A-Z]{2,}\b|\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b', line)

                # Accept if it has any strong indicator
                if has_date or has_company or (has_title and len(line_stripped) < 120) or (has_bullet and len(line_stripped) > 20) or has_location:
                    data['experience'].append(line_stripped[:200])
                    if len(data['experience']) >= 8:
                        break

    # Method 2: Pattern-based extraction (broader search across entire text)
    if not data['experience'] or len(data['experience']) < 2:
        # Look for patterns like "Job Title at Company" or "Company - Job Title"
        experience_patterns = [
            r'([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Consultant|Designer|Architect|Director|Lead|Head|Chief|VP|Officer|Coordinator|Specialist|Associate|Assistant|Intern))\s*(?:at|@|with|for|-)\s*([A-Z][a-zA-Z\s]+)',
            r'([A-Z][a-zA-Z\s]+(?:Inc\.?|LLC|Ltd\.?|Limited|Corp\.?|Corporation|Company|Co\.))\s*[-–]\s*([A-Z][a-zA-Z\s]+)',
            r'([A-Z][a-zA-Z\s]+)\s*\(\s*(?:20\d{2}|19\d{2})\s*[-–]\s*(?:20\d{2}|19\d{2}|present|current)\s*\)',
        ]

        for pattern in experience_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    entry = ' '.join(match).strip()
                else:
                    entry = match.strip()
                if len(entry) > 15 and len(entry) < 200:
                    data['experience'].append(entry)
            if len(data['experience']) >= 5:
                break

    # Method 3: Sentence-based fallback
    if not data['experience']:
        sentences = re.split(r'[\.\n]', text)
        for sentence in sentences:
            sent_lower = sentence.lower().strip()
            # Look for experience-indicating phrases
            exp_phrases = ['worked at', 'employed at', 'position at', 'role at', 'job at', 'experience at', 'intern at', 'consultant at', 'worked with', 'employed by', 'joined', 'responsible for']
            if any(kw in sent_lower for kw in exp_phrases):
                if len(sentence.strip()) > 20 and len(sentence.strip()) < 200:
                    data['experience'].append(sentence.strip()[:200])
                    if len(data['experience']) >= 3:
                        break

    # Remove duplicates while preserving order
    data['education'] = list(dict.fromkeys(data['education']))[:5]  # Limit to 5 entries
    data['experience'] = list(dict.fromkeys(data['experience']))[:5]  # Limit to 5 entries

    return data


def analyze_cv_quality(cv_data: Dict, text: str) -> Dict:
    score = 0
    mistakes, suggestions = [], []
    categories = {
        'contact_info': {'score': 0, 'max': 15, 'issues': []},
        'structure': {'score': 0, 'max': 20, 'issues': []},
        'content': {'score': 0, 'max': 25, 'issues': []},
        'skills': {'score': 0, 'max': 20, 'issues': []},
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
    if any(w in text_lower for w in ['summary', 'objective', 'profile', 'about']):
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

    action_verbs = ['managed', 'led', 'developed', 'created', 'implemented', 'designed',
                    'achieved', 'improved', 'increased', 'reduced', 'launched', 'built']
    if sum(1 for v in action_verbs if v in text_lower) >= 3:
        categories['content']['score'] += 10
    else:
        suggestions.append('Use strong action verbs')

    if re.search(r'\d+%|\$\d+|\d+\s*(years?|months?|people)', text_lower):
        categories['content']['score'] += 5
    else:
        suggestions.append('Add numbers to achievements (e.g., "Increased sales by 25%")')

    sc = len(cv_data.get('skills', []))
    if sc >= 8:
        categories['skills']['score'] += 15
    elif sc >= 5:
        categories['skills']['score'] += 10
    elif sc >= 3:
        categories['skills']['score'] += 5
    else:
        suggestions.append('Add more relevant skills')

    if sum(1 for s in ['communication', 'leadership', 'teamwork', 'problem solving'] if s in text_lower) >= 2:
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

    if pct >= 85:
        status, msg = 'Excellent', 'Your CV is professional and well-structured!'
    elif pct >= 70:
        status, msg = 'Good', 'Good CV with minor improvements needed'
    elif pct >= 50:
        status, msg = 'Average', 'Your CV needs some improvements'
    else:
        status, msg = 'Needs Work', 'Significant improvements recommended'

    return {
        'score': total, 'max_score': 100, 'percentage': pct,
        'status': status, 'status_message': msg, 'categories': categories,
        'mistakes': mistakes or ['No major issues found'],
        'suggestions': suggestions or ['Great job! Your CV looks professional'],
        'word_count': wc, 'skills_count': sc,
    }


def ai_full_analysis(text: str, cv_data: Dict) -> Dict:
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

    result = call_ai(
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
            "score": 62, "grade": "C", "keyword_density": "medium",
            "format_issues": ["Use standard section headings", "Ensure consistent date formatting"],
            "missing_keywords": ["quantified achievements", "industry-specific certifications"],
            "passed_checks": ["Contact info present", "Skills section included"]
        },
        "mistake_detector": {
            "grammar_errors": ["Check for passive voice usage"],
            "employment_gaps": ["No significant gaps detected"],
            "weak_action_verbs": ["'Responsible for' → 'Managed'"],
            "missing_metrics": ["Add % improvements", "Add team size you managed"],
            "overall_writing_score": 58
        },
        "template_suggestion": {
            "current_format": "Basic chronological",
            "recommended_template": "Hybrid",
            "reasons": ["Hybrid format showcases both skills and experience"],
            "before_after_tips": ["Move skills to a sidebar", "Add a metrics-driven summary section"]
        }
    }


def ai_skill_gap(cv_data: Dict, target_role: str = "") -> Dict:
    skills_str = ", ".join(cv_data.get('skills', []))
    role = target_role or "Software Engineer"

    prompt = f"""You are a career advisor. Analyze skill gaps for this candidate.

Current skills: {skills_str}
Target role: {role}

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

    result = call_ai("You are a career advisor. Return ONLY valid JSON.", prompt, 1200)
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
        "match_percentage": 0,
        "strong_skills": cv_data.get('skills', [])[:4],
        "missing_critical": [],
        "missing_nice_to_have": [],
        "market_demand": {
            "trending_up": [],
            "trending_down": [],
            "salary_impact": "Add more skills for salary impact analysis"
        },
        "quick_wins": []
    }


def ai_job_matches(cv_data: Dict, location: str = "Pakistan") -> List[Dict]:
    """Get job matches: first try JSearch API, then fall back to AI-generated."""
    skills = cv_data.get('skills', [])
    skills_str = ", ".join(skills[:8])

    # Detect role from skills
    role = detect_field_from_skills(skills)
    search_query = f"{role} {' '.join(skills[:3])}"

    # Try real jobs from JSearch first
    raw_jobs = fetch_real_jobs(search_query, location)
    if raw_jobs:
        return transform_jsearch_jobs(raw_jobs, skills)

    # Fall back to AI-generated jobs
    prompt = f"""Generate 6 realistic job matches for Pakistan market.

Candidate skills: {skills_str}
Target market: Pakistan (Lahore, Karachi, Islamabad, Remote-Pakistan)

Include salary in PKR. Use real Pakistani companies like Systems Ltd,
10Pearls, Arbisoft, Techlets, Confiz, NetSol Technologies, Folio3.

Return ONLY this JSON array:
[
  {{
    "id": "j1",
    "title": "Job Title",
    "company": "Company Name",
    "location": "Lahore/Karachi/Islamabad/Remote-Pakistan",
    "type": "Full-time/Remote/Hybrid",
    "salary_min": 150000,
    "salary_max": 500000,
    "currency": "PKR",
    "match_score": 0-100,
    "match_reasons": ["reason 1", "reason 2"],
    "skills_matched": ["skill1", "skill2"],
    "skills_missing": ["skill1"],
    "posted_days_ago": 1-14,
    "company_size": "50-200/200-1000/1000+",
    "apply_link": "#"
  }}
]"""

    result = call_ai("You are a job matching AI. Return ONLY a valid JSON array.", prompt, 1500)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return []


def detect_field_from_skills(skills: List[str]) -> str:
    skill_lower = " ".join(skills).lower()
    field_keywords = {
        "Software Engineer": ["python", "javascript", "react", "node", "java", "c++"],
        "Data Scientist": ["python", "sql", "machine learning", "pandas", "numpy"],
        "Frontend Developer": ["html", "css", "javascript", "react", "vue", "angular"],
        "Backend Developer": ["node", "python", "java", "database", "api", "server"],
        "DevOps Engineer": ["docker", "kubernetes", "aws", "azure", "ci/cd"],
        "Data Analyst": ["excel", "sql", "tableau", "power bi", "analytics"],
        "Mobile Developer": ["android", "ios", "flutter", "react native"],
    }
    scores = {}
    for field, keywords in field_keywords.items():
        score = sum(1 for kw in keywords if kw in skill_lower)
        if score > 0:
            scores[field] = score
    return max(scores, key=scores.get) if scores else "Professional"


def ai_learning_recommendations(missing_skills: List[str], cv_context: str = "") -> Dict:
    skills_str = ", ".join(missing_skills[:6])

    prompt = f"""Generate learning resources for these skills: {skills_str}
Context: {cv_context}

For each skill provide REAL resources from YouTube, Coursera, Udemy, freeCodeCamp, Digiskills.pk.

Return ONLY valid JSON:
{{
  "recommendations": [
    {{
      "skill": "skill name",
      "priority": "Critical/Important/Nice-to-have",
      "estimated_hours": 20,
      "resources": [
        {{
          "title": "Real Course Title",
          "platform": "YouTube/Coursera/Udemy/Digiskills.pk/freeCodeCamp",
          "url": "https://real-url.com/course",
          "duration": "X hours",
          "free": true,
          "rating": 4.5
        }}
      ],
      "milestone": "What you can build after learning this"
    }}
  ],
  "learning_path_weeks": 12,
  "total_free_hours": 40
}}"""

    result = call_ai("You are a learning advisor. Return ONLY valid JSON.", prompt, 1500)
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
                {"title": f"{skill.title()} Full Course", "platform": "YouTube",
                 "url": f"https://youtube.com/results?search_query={skill}+tutorial",
                 "duration": "4-8 hours", "free": True, "rating": 4.5},
                {"title": f"{skill.title()} Training", "platform": "Digiskills.pk",
                 "url": "https://digiskills.pk", "duration": "6 weeks", "free": True, "rating": 4.3}
            ],
            "milestone": f"Build a project using {skill} to demonstrate proficiency"
        })
    return {"recommendations": recs, "learning_path_weeks": 12, "total_free_hours": 35}


def ai_mock_interview(cv_data: Dict, target_role: str = "") -> Dict:
    skills = ", ".join(cv_data.get('skills', [])[:6])
    if not target_role:
        target_role = detect_field_from_skills(cv_data.get('skills', []))

    prompt = f"""Generate a mock interview for this candidate.
Role: {target_role}
Skills: {skills}

Return ONLY this JSON:
{{
  "role": "{target_role}",
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

    result = call_ai("You are an interview coach. Return ONLY valid JSON.", prompt, 1500)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "role": target_role,
        "questions": [],
        "tips": ["Enable AI features to generate personalized interview questions"],
        "error": "AI unavailable"
    }


def ai_salary_estimate(cv_data: Dict, location: str = "") -> Dict:
    skills = ", ".join(cv_data.get('skills', [])[:8])
    loc = location or "Pakistan"

    prompt = f"""Estimate salaries for this candidate in Pakistan job market 2024-2025.
Skills: {skills}
Location: {loc}

Return ONLY JSON with PKR salaries:
{{
  "current_estimate": {{
    "min": 500000, "max": 1500000, "median": 900000,
    "currency": "PKR", "usd_equivalent": "1800-5400", "location": "{loc}"
  }},
  "potential_with_upskilling": {{
    "min": 1000000, "max": 2500000, "median": 1600000,
    "currency": "PKR", "usd_equivalent": "3600-9000",
    "skills_to_add": ["skill1", "skill2"]
  }},
  "by_location": [
    {{"city": "Lahore", "min": 600000, "max": 1800000, "currency": "PKR", "usd_equivalent": "2200-6500"}},
    {{"city": "Karachi", "min": 700000, "max": 2000000, "currency": "PKR", "usd_equivalent": "2500-7200"}},
    {{"city": "Islamabad", "min": 800000, "max": 2200000, "currency": "PKR", "usd_equivalent": "2900-8000"}},
    {{"city": "Remote (Pakistan)", "min": 900000, "max": 2500000, "currency": "PKR", "usd_equivalent": "3200-9000"}}
  ],
  "top_pakistani_employers": [
    {{"company": "Systems Ltd", "level": "Enterprise", "salary_range": "High"}},
    {{"company": "10Pearls", "level": "Mid-Large", "salary_range": "Above Market"}}
  ],
  "industry_comparison": {{
    "fintech": "+15%", "e-commerce": "+10%", "telecom": "-5%",
    "startup": "+20%", "government": "-20%"
  }},
  "negotiation_tips": ["tip 1", "tip 2", "tip 3"]
}}"""

    result = call_ai("You are a compensation analyst. Return ONLY valid JSON.", prompt, 1200)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json?\n?", "", clean).replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            pass

    return {
        "current_estimate": {"min": 600000, "max": 1500000, "median": 900000, "currency": "PKR", "usd_equivalent": "2200-5400", "location": loc},
        "potential_with_upskilling": {"min": 1000000, "max": 2500000, "median": 1600000, "currency": "PKR", "usd_equivalent": "3600-9000", "skills_to_add": ["AWS", "React", "System Design"]},
        "by_location": [
            {"city": "Lahore", "min": 600000, "max": 1800000, "currency": "PKR", "usd_equivalent": "2200-6500"},
            {"city": "Karachi", "min": 700000, "max": 2000000, "currency": "PKR", "usd_equivalent": "2500-7200"},
            {"city": "Islamabad", "min": 800000, "max": 2200000, "currency": "PKR", "usd_equivalent": "2900-8000"},
            {"city": "Remote (Pakistan)", "min": 900000, "max": 2500000, "currency": "PKR", "usd_equivalent": "3200-9000"},
        ],
        "top_pakistani_employers": [
            {"company": "Systems Ltd", "level": "Enterprise", "salary_range": "High (1.5M-3M PKR)"},
            {"company": "10Pearls", "level": "Mid-Large", "salary_range": "Above Market (1.2M-2.5M PKR)"},
            {"company": "Arbisoft", "level": "Mid", "salary_range": "Market Rate (800K-1.8M PKR)"},
        ],
        "industry_comparison": {"fintech": "+15%", "e-commerce": "+10%", "telecom": "-5%", "startup": "+20%", "government": "-20%"},
        "negotiation_tips": ["Research Pakistani IT market rates on Rozee.pk before negotiating", "Highlight remote work experience", "Ask about benefits like health insurance and annual bonuses"]
    }


def ai_career_path(cv_data: Dict, target_role: str = "") -> Dict:
    skills = ", ".join(cv_data.get('skills', [])[:8])
    role = target_role or "Senior Software Engineer"

    prompt = f"""Generate a 5-year career path roadmap.
Current skills: {skills}
Target role: {role}

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

    result = call_ai("You are a career coach. Return ONLY valid JSON.", prompt, 1500)
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
            {"year": 1, "title": "Solidify Core Skills", "description": "Master fundamentals", "skills_to_acquire": ["System Design", "CI/CD"], "expected_title": "Mid-Level Developer", "expected_salary_usd": 72000},
            {"year": 2, "title": "Specialize & Lead", "description": "Pick a specialization", "skills_to_acquire": ["Cloud Architecture", "Team Leadership"], "expected_title": "Senior Developer", "expected_salary_usd": 95000},
            {"year": 3, "title": "Technical Leadership", "description": "Lead full projects", "skills_to_acquire": ["Solution Architecture"], "expected_title": "Lead Engineer", "expected_salary_usd": 115000},
            {"year": 4, "title": "Senior Specialization", "description": "Deep expertise", "skills_to_acquire": ["Staff-level skills"], "expected_title": "Staff Engineer", "expected_salary_usd": 135000},
            {"year": 5, "title": "Principal / Director", "description": "Org-level impact", "skills_to_acquire": ["Executive communication"], "expected_title": "Principal Engineer", "expected_salary_usd": 160000},
        ],
        "alternative_paths": [
            {"path": "Management Track", "description": "Transition to Engineering Manager", "pros": ["Higher earning potential"], "cons": ["Less coding time"]}
        ],
        "companies_to_target": ["Google", "Microsoft", "Stripe", "Shopify"]
    }


def ai_cover_letter(cv_data: Dict, job_title: str, company_name: str, job_description: str = "") -> Dict:
    skills = ", ".join(cv_data.get('skills', [])[:8])
    name = cv_data.get('name', 'The Candidate')

    prompt = f"""Write a compelling, tailored cover letter.
Candidate name: {name}
Candidate skills: {skills}
Job title: {job_title}
Company: {company_name}
Job description: {job_description[:400] if job_description else 'Not provided'}

Return ONLY this JSON:
{{
  "subject": "Application for {job_title} at {company_name}",
  "cover_letter": "Full cover letter text (3 paragraphs, professional, specific)",
  "key_points_highlighted": ["point 1", "point 2", "point 3"],
  "tone": "Professional/Enthusiastic/Technical",
  "word_count": 250
}}"""

    result = call_ai("You are a professional cover letter writer. Return ONLY valid JSON.", prompt, 1000)
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
        "cover_letter": f"Dear Hiring Manager,\n\nMy background in {', '.join(cv_data.get('skills', ['development'])[:3])} directly aligns with what you're building at {company_name}.\n\nI'd love to bring this energy to the {job_title} role.\n\nBest regards,\n{name}",
        "key_points_highlighted": ["Technical skills alignment", "Results-driven approach"],
        "tone": "Professional",
        "word_count": 60
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
    user_type = 'candidate'

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

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
    user_obj = {k: v for k, v in user_doc.items() if k not in ('password_hash', '_id')}
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

    user = users_collection.find_one({'email': email})
    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401

    user_obj = {k: v for k, v in user.items() if k not in ('password_hash', '_id')}
    token = f"token_{user['id']}"

    return jsonify({'success': True, 'token': token, 'user': user_obj})


@app.route('/api/waitlist', methods=['POST'])
def add_to_waitlist():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format'}), 400

    existing = waitlist_collection.find_one({'email': email})
    if existing:
        return jsonify({'message': 'You are already on the waitlist!', 'email': email}), 200

    waitlist_collection.insert_one({'email': email, 'created_at': datetime.utcnow().isoformat()})
    return jsonify({'message': 'Successfully added to waitlist', 'email': email}), 200


@app.route('/api/user/profile', methods=['GET'])
@require_auth
def get_user_profile():
    user = users_collection.find_one({'id': g.user_id}, {'password_hash': 0, '_id': 0})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'success': True, 'user': user})


@app.route('/api/user/profile', methods=['PUT'])
@require_auth
def update_user_profile():
    data = request.get_json()
    allowed = ['firstName', 'lastName', 'phone', 'location', 'bio', 'website',
               'linkedin', 'github', 'jobTitle', 'experience', 'jobType',
               'workMode', 'expectedSalary', 'availability', 'languages', 'skills']
    update_fields = {k: v for k, v in data.items() if k in allowed}
    update_fields['updatedAt'] = datetime.utcnow().isoformat()
    users_collection.update_one({'id': g.user_id}, {'$set': update_fields})
    return jsonify({'success': True})


# ─── CV Routes ────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"status": "Jobrizza CV Analyzer API running", "version": "2.0"})


@app.route('/api/upload-cv', methods=['POST'])
@require_auth
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

    # Check if text extraction was poor (possible image-based PDF)
    warnings = []
    if len(text.strip()) < 100:
        warnings.append("PDF appears to be image-based or scanned. Text extraction failed. For best results, please upload a text-based PDF or DOCX file.")
    elif len(text.strip()) < 500:
        warnings.append("Limited text extracted from PDF. If this is a scanned document, please upload the original text-based file for better results.")

    try:
        ai_analysis = ai_full_analysis(text, cv_data)
    except Exception as e:
        print(f"AI analysis failed: {e}")
        ai_analysis = {
            "ats_score": {"score": analysis.get('percentage', 65), "grade": "C", "keyword_density": "medium", "format_issues": ["AI analysis temporarily unavailable"], "missing_keywords": [], "passed_checks": ["CV parsed", "Contact info detected"]},
            "mistake_detector": {"grammar_errors": [], "employment_gaps": [], "weak_action_verbs": [], "missing_metrics": [], "overall_writing_score": analysis.get('percentage', 65)},
            "template_suggestion": {"current_format": "Standard", "recommended_template": "Chronological", "reasons": ["Standard format works"], "before_after_tips": ["AI analysis unavailable"]}
        }

    cv_data_with_analysis = {**cv_data, 'analysis': analysis, 'ai_analysis': ai_analysis, 'warnings': warnings}

    if hasattr(g, 'user_id'):
        cv_doc = {'user_id': g.user_id, 'created_at': datetime.utcnow().isoformat(), **cv_data_with_analysis}
        cv_data_collection.replace_one({'user_id': g.user_id}, cv_doc, upsert=True)

    check_and_award_badges(g.user_id, cv_score=analysis.get('percentage'))

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
    location = data.get('location', 'Pakistan')
    matches = ai_job_matches(data['cv_data'], location)
    return jsonify({'success': True, 'jobs': matches})


@app.route('/api/learning-recommendations', methods=['POST'])
@require_auth
def learning_recommendations():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = ai_learning_recommendations(data.get('missing_skills', []), data.get('cv_context', ''))
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
    soft_skills = ['Problem Solving', 'Communication', 'Leadership', 'Time Management']
    enhanced_skills = list(set(skills_base + soft_skills))[:12]

    prompt = f"""Rewrite this CV professional summary to be compelling and results-driven.
Skills: {', '.join(skills_base[:6])}
Be specific, avoid buzzwords, max 60 words."""

    summary = call_ai("You are a CV writer. Write only the summary text, no labels or JSON.", prompt, 200)

    if not summary:
        summary = (f"Results-driven professional with expertise in {', '.join(skills_base[:3])}. "
                   f"Proven track record of delivering high-quality solutions.")

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
            'improvements_made': ['Enhanced professional summary', 'Expanded skills section', 'Added soft skills for ATS']
        }
    })


@app.route('/api/cv-data', methods=['GET'])
@require_auth
def get_cv_data():
    cv = cv_data_collection.find_one({'user_id': g.user_id}, {'_id': 0})
    if not cv:
        return jsonify({'success': True, 'cv_data': None})
    return jsonify({'success': True, 'cv_data': cv})


@app.route('/api/cv-data/latest', methods=['GET'])
@require_auth
def get_latest_cv():
    cv = cv_data_collection.find_one({'user_id': g.user_id}, {'_id': 0})
    if not cv:
        return jsonify({'success': True, 'cv_data': None})
    return jsonify({'success': True, 'cv_data': cv})


# ─── CV Versions ──────────────────────────────────────────────────────────────

@app.route('/api/cv-versions', methods=['GET'])
@require_auth
def get_cv_versions():
    versions = list(cv_versions_collection.find({'user_id': g.user_id}, {'_id': 0}).sort('created_at', -1))
    return jsonify({'success': True, 'versions': versions})


@app.route('/api/cv-versions', methods=['POST'])
@require_auth
def save_cv_version():
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400

    version_id = str(uuid.uuid4())
    version_doc = {
        'id': version_id,
        'user_id': g.user_id,
        'name': data.get('name', f'Version {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}'),
        'cv_data': data['cv_data'],
        'score': data.get('score', 0),
        'category_scores': data.get('category_scores', {}),
        'created_at': datetime.utcnow().isoformat(),
    }

    cv_versions_collection.insert_one(version_doc)
    return jsonify({'success': True, 'version': {k: v for k, v in version_doc.items() if k != '_id'}}), 201


@app.route('/api/cv-versions/compare', methods=['POST'])
@require_auth
def compare_cv_versions():
    data = request.get_json()
    if not data or 'version_id_1' not in data or 'version_id_2' not in data:
        return jsonify({'error': 'Two version IDs required'}), 400

    v1 = cv_versions_collection.find_one({'id': data['version_id_1'], 'user_id': g.user_id}, {'_id': 0})
    v2 = cv_versions_collection.find_one({'id': data['version_id_2'], 'user_id': g.user_id}, {'_id': 0})

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


@app.route('/api/cv-versions/<version_id>', methods=['GET'])
@require_auth
def get_cv_version(version_id):
    version = cv_versions_collection.find_one({'id': version_id, 'user_id': g.user_id}, {'_id': 0})
    if not version:
        return jsonify({'error': 'Version not found'}), 404
    return jsonify({'success': True, 'version': version})


@app.route('/api/cv-versions/<version_id>', methods=['DELETE'])
@require_auth
def delete_cv_version(version_id):
    result = cv_versions_collection.delete_one({'id': version_id, 'user_id': g.user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Version not found'}), 404
    return jsonify({'success': True, 'message': 'Version deleted'})


# ─── Applications ─────────────────────────────────────────────────────────────
# IMPORTANT: /stats route MUST come BEFORE /<application_id> to avoid conflict

@app.route('/api/applications/stats', methods=['GET'])
@require_auth
def get_application_stats():
    """Must be defined before /api/applications/<id> to avoid route conflict."""
    pipeline = [
        {'$match': {'user_id': g.user_id}},
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
    ]
    stats = list(applications_collection.aggregate(pipeline))
    return jsonify({'success': True, 'stats': {s['_id']: s['count'] for s in stats}})


@app.route('/api/applications', methods=['GET'])
@require_auth
def get_applications():
    status_filter = request.args.get('status')
    query = {'user_id': g.user_id}
    if status_filter:
        query['status'] = status_filter
    apps = list(applications_collection.find(query, {'_id': 0}).sort('applied_at', -1))
    return jsonify({'success': True, 'applications': apps})


@app.route('/api/applications', methods=['POST'])
@require_auth
def create_application():
    data = request.get_json()
    if not data or 'company' not in data or 'position' not in data:
        return jsonify({'error': 'Company and position are required'}), 400

    application_id = str(uuid.uuid4())
    application_doc = {
        'id': application_id,
        'user_id': g.user_id,
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
    return jsonify({'success': True, 'application': {k: v for k, v in application_doc.items() if k != '_id'}}), 201


@app.route('/api/applications/<application_id>', methods=['GET'])
@require_auth
def get_application(application_id):
    application = applications_collection.find_one({'id': application_id, 'user_id': g.user_id}, {'_id': 0})
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'success': True, 'application': application})


@app.route('/api/applications/<application_id>', methods=['PUT'])
@require_auth
def update_application(application_id):
    data = request.get_json()
    existing = applications_collection.find_one({'id': application_id, 'user_id': g.user_id})
    if not existing:
        return jsonify({'error': 'Application not found'}), 404

    update_fields = {}
    for field in ['company', 'position', 'location', 'salary', 'url', 'status', 'notes']:
        if field in data:
            update_fields[field] = data[field]
    update_fields['updated_at'] = datetime.utcnow().isoformat()

    applications_collection.update_one({'id': application_id, 'user_id': g.user_id}, {'$set': update_fields})
    updated = applications_collection.find_one({'id': application_id}, {'_id': 0})
    return jsonify({'success': True, 'application': updated})


@app.route('/api/applications/<application_id>', methods=['DELETE'])
@require_auth
def delete_application(application_id):
    result = applications_collection.delete_one({'id': application_id, 'user_id': g.user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'success': True, 'message': 'Application deleted'})


@app.route('/api/applications/<application_id>/notes', methods=['POST'])
@require_auth
def add_application_note(application_id):
    data = request.get_json()
    if not data or 'note' not in data:
        return jsonify({'error': 'Note content required'}), 400

    note = {'id': str(uuid.uuid4()), 'content': data['note'], 'created_at': datetime.utcnow().isoformat()}
    result = applications_collection.update_one(
        {'id': application_id, 'user_id': g.user_id},
        {'$push': {'notes_list': note}, '$set': {'updated_at': datetime.utcnow().isoformat()}}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'success': True, 'note': note})


# ─── LinkedIn Optimizer ────────────────────────────────────────────────────────

@app.route('/api/linkedin/analyze', methods=['POST'])
@require_auth
def analyze_linkedin_profile():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400

    profile_text = data.get('profile_text', '').strip()
    linkedin_url = data.get('linkedin_url', '').strip()

    if not profile_text and not linkedin_url:
        return jsonify({'error': 'LinkedIn URL or profile text required'}), 400

    system_prompt = """You are an expert LinkedIn profile optimizer. Analyze the LinkedIn profile and provide suggestions in JSON:
{
    "headline": {"current": "...", "suggested": "...", "tips": "..."},
    "summary": {"current": "...", "suggested": "...", "tips": "..."},
    "experience": {"tips": "...", "improvements": ["..."]},
    "skills": {"current": [], "suggested_additions": []},
    "overall_score": 0-100,
    "priority_actions": ["..."]
}"""

    input_text = f"LinkedIn URL: {linkedin_url}\n\nProfile Content:\n{profile_text}" if linkedin_url else profile_text
    ai_response = call_ai(system_prompt, input_text, max_tokens=2000)

    suggestions = {}
    if ai_response:
        try:
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                suggestions = json.loads(json_match.group())
        except Exception:
            suggestions = {'headline': {'current': 'N/A', 'suggested': 'N/A', 'tips': ai_response[:500]}, 'overall_score': 50}
    else:
        suggestions = {
            'headline': {'current': 'Not analyzed', 'suggested': 'Add your key expertise and value proposition', 'tips': 'Use keywords relevant to your target roles.'},
            'summary': {'current': 'Not analyzed', 'suggested': 'Write a compelling narrative', 'tips': 'Start with a hook.'},
            'experience': {'tips': 'Use action verbs and quantify results', 'improvements': ['Add metrics to bullet points', 'Use STAR method']},
            'skills': {'current': [], 'suggested_additions': ['Industry-relevant skills', 'Certifications']},
            'overall_score': 50,
            'priority_actions': ['Complete all profile sections', 'Add a professional photo', 'Get recommendations']
        }

    optimization_doc = {
        'id': str(uuid.uuid4()),
        'user_id': g.user_id,
        'linkedin_url': linkedin_url,
        'profile_text': profile_text[:2000],
        'suggestions': suggestions,
        'overall_score': suggestions.get('overall_score', 0),
        'created_at': datetime.utcnow().isoformat()
    }
    linkedin_optimizations_collection.insert_one(optimization_doc)

    return jsonify({'success': True, 'suggestions': suggestions, 'optimization_id': optimization_doc['id']})


@app.route('/api/linkedin/optimizations', methods=['GET'])
@require_auth
def get_linkedin_optimizations():
    optimizations = list(linkedin_optimizations_collection.find(
        {'user_id': g.user_id}, {'_id': 0, 'profile_text': 0}
    ).sort('created_at', -1).limit(10))
    return jsonify({'success': True, 'optimizations': optimizations})


@app.route('/api/linkedin/optimizations/<optimization_id>', methods=['GET'])
@require_auth
def get_linkedin_optimization(optimization_id):
    optimization = linkedin_optimizations_collection.find_one({'id': optimization_id, 'user_id': g.user_id}, {'_id': 0})
    if not optimization:
        return jsonify({'error': 'Optimization not found'}), 404
    return jsonify({'success': True, 'optimization': optimization})


@app.route('/api/linkedin/optimizations/<optimization_id>', methods=['DELETE'])
@require_auth
def delete_linkedin_optimization(optimization_id):
    result = linkedin_optimizations_collection.delete_one({'id': optimization_id, 'user_id': g.user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Optimization not found'}), 404
    return jsonify({'success': True, 'message': 'Optimization deleted'})


# ─── Job Alerts ────────────────────────────────────────────────────────────────

@app.route('/api/job-alerts', methods=['GET'])
@require_auth
def get_job_alerts():
    alert = job_alerts_collection.find_one({'user_id': g.user_id}, {'_id': 0})
    if not alert:
        return jsonify({'success': True, 'alert': {'enabled': False, 'frequency': 'daily', 'job_types': ['Full-time'], 'work_mode': 'Remote', 'keywords': [], 'min_salary': None, 'location': '', 'last_sent': None}})
    return jsonify({'success': True, 'alert': alert})


@app.route('/api/job-alerts', methods=['POST'])
@require_auth
def create_or_update_job_alert():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400

    user = users_collection.find_one({'id': g.user_id})
    alert_doc = {
        'user_id': g.user_id,
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

    existing = job_alerts_collection.find_one({'user_id': g.user_id})
    if existing:
        job_alerts_collection.update_one({'user_id': g.user_id}, {'$set': alert_doc})
    else:
        alert_doc['created_at'] = datetime.utcnow().isoformat()
        alert_doc['last_sent'] = None
        job_alerts_collection.insert_one(alert_doc)

    return jsonify({'success': True, 'alert': alert_doc})


@app.route('/api/job-alerts/test', methods=['POST'])
@require_auth
def send_test_job_alert():
    return jsonify({'error': 'Email service not configured. Set up Resend API key.'}), 500


@app.route('/api/job-alerts/unsubscribe', methods=['POST'])
@require_auth
def unsubscribe_job_alerts():
    job_alerts_collection.update_one({'user_id': g.user_id}, {'$set': {'enabled': False, 'updated_at': datetime.utcnow().isoformat()}})
    return jsonify({'success': True, 'message': 'Unsubscribed from job alerts'})


# ─── Gamification ─────────────────────────────────────────────────────────────

BADGES = {
    'first_upload': {'name': 'First Steps', 'description': 'Uploaded your first CV', 'icon': '📄', 'color': '#3b82f6'},
    'score_50': {'name': 'Getting Started', 'description': 'Achieved 50+ CV score', 'icon': '🌟', 'color': '#10b981'},
    'score_70': {'name': 'Rising Star', 'description': 'Achieved 70+ CV score', 'icon': '⭐', 'color': '#f59e0b'},
    'score_90': {'name': 'CV Master', 'description': 'Achieved 90+ CV score', 'icon': '🏆', 'color': '#8b5cf6'},
    'improve_10': {'name': 'Quick Learner', 'description': 'Improved CV score by 10+ points', 'icon': '📈', 'color': '#ec4899'},
    'improve_20': {'name': 'Rapid Growth', 'description': 'Improved CV score by 20+ points', 'icon': '🚀', 'color': '#ef4444'},
    'streak_3': {'name': 'Consistent', 'description': '3-day upload streak', 'icon': '🔥', 'color': '#f97316'},
    'streak_7': {'name': 'On Fire', 'description': '7-day upload streak', 'icon': '🔥🔥', 'color': '#dc2626'},
    'versions_5': {'name': 'Version Control', 'description': 'Saved 5 CV versions', 'icon': '🔄', 'color': '#14b8a6'},
    'analyzer': {'name': 'Analyzer', 'description': 'Viewed detailed analysis 5 times', 'icon': '🔍', 'color': '#84cc16'},
    'job_seeker': {'name': 'Job Seeker', 'description': 'Applied to 5 jobs', 'icon': '💼', 'color': '#a855f7'},
}


def check_and_award_badges(user_id: str, cv_score: Optional[int] = None, score_improvement: Optional[int] = None):
    """Check and award badges. Handles _id removal for JSON safety."""
    gamification = gamification_collection.find_one({'user_id': user_id})

    if not gamification:
        gamification = {
            'user_id': user_id,
            'badges': [],
            'stats': {
                'total_uploads': 0, 'highest_score': 0, 'current_streak': 0,
                'longest_streak': 0, 'last_upload_date': None, 'total_versions': 0,
                'analysis_views': 0, 'applications_count': 0
            },
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

    new_badges = []
    stats = gamification.get('stats', {})
    existing_badge_ids = [b['id'] for b in gamification.get('badges', [])]

    if cv_score is not None:
        if cv_score >= 50 and 'score_50' not in existing_badge_ids:
            new_badges.append('score_50')
        if cv_score >= 70 and 'score_70' not in existing_badge_ids:
            new_badges.append('score_70')
        if cv_score >= 90 and 'score_90' not in existing_badge_ids:
            new_badges.append('score_90')
        if cv_score > stats.get('highest_score', 0):
            stats['highest_score'] = cv_score

    if score_improvement is not None:
        if score_improvement >= 10 and 'improve_10' not in existing_badge_ids:
            new_badges.append('improve_10')
        if score_improvement >= 20 and 'improve_20' not in existing_badge_ids:
            new_badges.append('improve_20')

    for badge_id in new_badges:
        if badge_id in BADGES:
            gamification['badges'].append({'id': badge_id, 'awarded_at': datetime.utcnow().isoformat(), **BADGES[badge_id]})

    # Update streak
    today = datetime.utcnow().date()
    last_upload = stats.get('last_upload_date')
    if last_upload:
        last_date = datetime.fromisoformat(last_upload).date()
        diff = (today - last_date).days
        if diff == 1:
            stats['current_streak'] = stats.get('current_streak', 0) + 1
        elif diff > 1:
            if stats.get('current_streak', 0) > stats.get('longest_streak', 0):
                stats['longest_streak'] = stats['current_streak']
            stats['current_streak'] = 1
    else:
        stats['current_streak'] = 1

    stats['last_upload_date'] = today.isoformat()
    stats['total_uploads'] = stats.get('total_uploads', 0) + 1

    # First upload badge
    existing_badge_ids_updated = [b['id'] for b in gamification.get('badges', [])]
    if stats['total_uploads'] == 1 and 'first_upload' not in existing_badge_ids_updated:
        gamification['badges'].append({'id': 'first_upload', 'awarded_at': datetime.utcnow().isoformat(), **BADGES['first_upload']})

    gamification['stats'] = stats
    gamification['updated_at'] = datetime.utcnow().isoformat()

    gamification_collection.update_one({'user_id': user_id}, {'$set': gamification}, upsert=True)
    gamification.pop('_id', None)
    return new_badges, gamification


@app.route('/api/gamification/profile', methods=['GET'])
@require_auth
def get_gamification_profile():
    gamification = gamification_collection.find_one({'user_id': g.user_id}, {'_id': 0})
    if not gamification:
        return jsonify({'success': True, 'profile': {'badges': [], 'stats': {'total_uploads': 0, 'highest_score': 0, 'current_streak': 0, 'longest_streak': 0, 'total_versions': 0, 'analysis_views': 0, 'applications_count': 0}, 'level': 1, 'xp': 0, 'next_level_xp': 100}})

    badges_count = len(gamification.get('badges', []))
    stats = gamification.get('stats', {})
    xp = badges_count * 50 + stats.get('total_uploads', 0) * 10 + stats.get('highest_score', 0)
    level = min(10, 1 + xp // 100)
    next_level_xp = ((level) * 100) - xp

    return jsonify({'success': True, 'profile': {'badges': gamification.get('badges', []), 'stats': stats, 'level': level, 'xp': xp, 'next_level_xp': next_level_xp}})


@app.route('/api/gamification/track', methods=['POST'])
@require_auth
def track_gamification_event():
    data = request.get_json() or {}
    event_type = data.get('event_type')
    cv_score = data.get('cv_score')
    score_improvement = data.get('score_improvement')

    new_badges, gamification = check_and_award_badges(g.user_id, cv_score, score_improvement)
    stats = gamification.get('stats', {})

    if event_type == 'version_saved':
        stats['total_versions'] = stats.get('total_versions', 0) + 1
        existing_ids = [b['id'] for b in gamification.get('badges', [])]
        if stats['total_versions'] >= 5 and 'versions_5' not in existing_ids:
            gamification['badges'].append({'id': 'versions_5', 'awarded_at': datetime.utcnow().isoformat(), **BADGES['versions_5']})
            new_badges.append('versions_5')
    elif event_type == 'analysis_viewed':
        stats['analysis_views'] = stats.get('analysis_views', 0) + 1
        existing_ids = [b['id'] for b in gamification.get('badges', [])]
        if stats['analysis_views'] >= 5 and 'analyzer' not in existing_ids:
            gamification['badges'].append({'id': 'analyzer', 'awarded_at': datetime.utcnow().isoformat(), **BADGES['analyzer']})
            new_badges.append('analyzer')
    elif event_type == 'application_added':
        stats['applications_count'] = stats.get('applications_count', 0) + 1
        existing_ids = [b['id'] for b in gamification.get('badges', [])]
        if stats['applications_count'] >= 5 and 'job_seeker' not in existing_ids:
            gamification['badges'].append({'id': 'job_seeker', 'awarded_at': datetime.utcnow().isoformat(), **BADGES['job_seeker']})
            new_badges.append('job_seeker')

    gamification['stats'] = stats
    gamification['updated_at'] = datetime.utcnow().isoformat()
    gamification_collection.update_one({'user_id': g.user_id}, {'$set': gamification}, upsert=True)

    return jsonify({'success': True, 'new_badges': [BADGES[b] for b in new_badges if b in BADGES], 'stats': stats})


@app.route('/api/gamification/leaderboard', methods=['GET'])
def get_leaderboard():
    pipeline = [
        {'$project': {'_id': 0, 'user_id': 1, 'badges': 1, 'stats': 1}},
        {'$lookup': {'from': 'users', 'localField': 'user_id', 'foreignField': 'id', 'as': 'user'}},
        {'$unwind': {'path': '$user', 'preserveNullAndEmptyArrays': True}},
        {'$project': {'name': {'$ifNull': ['$user.name', 'Anonymous']}, 'badge_count': {'$size': {'$ifNull': ['$badges', []]}}, 'highest_score': {'$ifNull': ['$stats.highest_score', 0]}, 'current_streak': {'$ifNull': ['$stats.current_streak', 0]}}},
        {'$sort': {'badge_count': -1, 'highest_score': -1}},
        {'$limit': 10}
    ]
    leaderboard = list(gamification_collection.aggregate(pipeline))
    return jsonify({'success': True, 'leaderboard': leaderboard})


# ─── Interview Grader ─────────────────────────────────────────────────────────

@app.route('/api/interview/grade', methods=['POST'])
@require_auth
def grade_interview_answer():
    data = request.get_json()
    question = data.get('question', '').strip()
    answer = data.get('answer', '').strip()
    question_type = data.get('question_type', 'behavioral')

    if not question or not answer:
        return jsonify({'error': 'Question and answer are required'}), 400

    system_prompt = """You are an expert interview coach. Grade interview answers using STAR methodology.

Return ONLY this JSON:
{
    "scores": {"star_structure": 85, "clarity": 90, "relevance": 95, "impact": 80, "overall": 87},
    "star_breakdown": {"situation": "assessment", "task": "assessment", "action": "assessment", "result": "assessment"},
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement 1", "Improvement 2"],
    "better_answer_example": "Rewritten version showing best practices",
    "summary": "One-sentence overall assessment"
}"""

    user_prompt = f"Question Type: {question_type}\nQuestion: {question}\n\nAnswer:\n{answer}"

    try:
        ai_response = call_ai(system_prompt, user_prompt, max_tokens=2000)

        grading_result = {}
        if ai_response:
            try:
                start_idx = ai_response.find('{')
                end_idx = ai_response.rfind('}') + 1
                if start_idx >= 0 and end_idx > start_idx:
                    grading_result = json.loads(ai_response[start_idx:end_idx])
            except Exception:
                pass

        if not grading_result:
            grading_result = {
                "scores": {"star_structure": 70, "clarity": 75, "relevance": 80, "impact": 70, "overall": 74},
                "star_breakdown": {"situation": "Unable to analyze", "task": "Unable to analyze", "action": "Unable to analyze", "result": "Unable to analyze"},
                "strengths": ["Answer provided"],
                "improvements": ["Consider using STAR format more explicitly"],
                "better_answer_example": answer,
                "summary": "Answer received but detailed analysis unavailable"
            }

        grading_record = {
            'user_id': g.user_id,
            'question': question,
            'answer': answer,
            'question_type': question_type,
            'scores': grading_result.get('scores', {}),
            'feedback': grading_result,
            'created_at': datetime.utcnow().isoformat()
        }
        interview_gradings_collection.insert_one(grading_record)

        return jsonify({'success': True, 'grading': grading_result, 'scores': grading_result.get('scores', {})})

    except Exception as e:
        return jsonify({'error': f'Failed to grade answer: {str(e)}'}), 500


@app.route('/api/interview/history', methods=['GET'])
@require_auth
def get_interview_grading_history():
    limit = int(request.args.get('limit', 20))
    gradings = list(interview_gradings_collection.find({'user_id': g.user_id}, {'_id': 0, 'answer': 0}).sort('created_at', -1).limit(limit))
    avg_overall = sum(g.get('scores', {}).get('overall', 0) for g in gradings) / len(gradings) if gradings else 0
    return jsonify({'success': True, 'gradings': gradings, 'average_score': round(avg_overall, 1), 'total_count': interview_gradings_collection.count_documents({'user_id': g.user_id})})


@app.route('/api/interview/questions', methods=['GET'])
def get_interview_questions():
    category = request.args.get('category', 'behavioral')
    questions = {
        'behavioral': ["Tell me about yourself.", "What is your greatest strength?", "What is your greatest weakness?", "Tell me about a time you faced a conflict at work.", "Describe a time you failed and what you learned."],
        'technical': ["Explain a complex technical concept to a non-technical person.", "Tell me about a challenging technical problem you solved."],
        'situational': ["What would you do if you disagreed with your manager's decision?", "How would you handle a difficult client?"],
        'leadership': ["Tell me about a time you motivated a team.", "How do you handle giving difficult feedback?"]
    }
    category_questions = questions.get(category, questions['behavioral'])
    sample = random.sample(category_questions, min(5, len(category_questions)))
    return jsonify({'success': True, 'category': category, 'questions': sample})


# ─── Network ──────────────────────────────────────────────────────────────────

@app.route('/api/network/contacts', methods=['GET'])
@require_auth
def get_network_contacts():
    contacts = list(network_contacts_collection.find({'user_id': g.user_id}, {'_id': 0}).sort('created_at', -1))
    total = len(contacts)
    at_target = sum(1 for c in contacts if c.get('at_target_company'))
    can_refer = sum(1 for c in contacts if c.get('can_refer'))

    company_groups = {}
    for contact in contacts:
        company = contact.get('company', 'Unknown')
        company_groups[company] = company_groups.get(company, 0) + 1

    return jsonify({'success': True, 'contacts': contacts, 'stats': {'total_contacts': total, 'at_target_companies': at_target, 'can_refer': can_refer}, 'companies': [{'name': k, 'count': v} for k, v in company_groups.items()]})


@app.route('/api/network/contacts', methods=['POST'])
@require_auth
def add_network_contact():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()

    if not name or not email:
        return jsonify({'error': 'Name and email are required'}), 400

    existing = network_contacts_collection.find_one({'user_id': g.user_id, 'email': email.lower()})
    if existing:
        return jsonify({'error': 'Contact with this email already exists'}), 409

    contact = {
        'id': str(uuid.uuid4()),
        'user_id': g.user_id,
        'name': name,
        'email': email.lower(),
        'company': data.get('company', ''),
        'job_title': data.get('job_title', ''),
        'linkedin_url': data.get('linkedin_url', ''),
        'relationship_strength': data.get('relationship_strength', 'acquaintance'),
        'at_target_company': data.get('at_target_company', False),
        'target_company': data.get('target_company', ''),
        'can_refer': data.get('can_refer', False),
        'notes': data.get('notes', ''),
        'last_contact': data.get('last_contact', ''),
        'tags': data.get('tags', []),
        'created_at': datetime.utcnow().isoformat()
    }

    network_contacts_collection.insert_one(contact)
    return jsonify({'success': True, 'contact': contact})


@app.route('/api/network/contacts/import', methods=['POST'])
@require_auth
def import_contacts():
    data = request.get_json()
    contacts = data.get('contacts', [])
    imported, skipped = 0, 0

    for contact_data in contacts:
        email = contact_data.get('email', '').strip().lower()
        if not email:
            continue
        if network_contacts_collection.find_one({'user_id': g.user_id, 'email': email}):
            skipped += 1
            continue
        contact = {
            'id': str(uuid.uuid4()),
            'user_id': g.user_id,
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

    return jsonify({'success': True, 'imported': imported, 'skipped': skipped, 'total': imported + skipped})


@app.route('/api/network/contacts/<contact_id>', methods=['PUT'])
@require_auth
def update_network_contact(contact_id):
    data = request.get_json()
    contact = network_contacts_collection.find_one({'id': contact_id, 'user_id': g.user_id})
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404

    allowed_fields = ['name', 'email', 'company', 'job_title', 'linkedin_url', 'relationship_strength', 'at_target_company', 'target_company', 'can_refer', 'notes', 'last_contact', 'tags']
    update_fields = {'updated_at': datetime.utcnow().isoformat()}
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    network_contacts_collection.update_one({'id': contact_id}, {'$set': update_fields})
    updated = network_contacts_collection.find_one({'id': contact_id}, {'_id': 0})
    return jsonify({'success': True, 'contact': updated})


@app.route('/api/network/contacts/<contact_id>', methods=['DELETE'])
@require_auth
def delete_network_contact(contact_id):
    result = network_contacts_collection.delete_one({'id': contact_id, 'user_id': g.user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Contact not found'}), 404
    return jsonify({'success': True, 'message': 'Contact deleted'})


@app.route('/api/network/target-companies', methods=['GET'])
@require_auth
def get_target_company_connections():
    target_company = request.args.get('company')
    query = {'user_id': g.user_id, 'at_target_company': True}
    if target_company:
        query['target_company'] = target_company

    contacts = list(network_contacts_collection.find(query, {'_id': 0}))
    connections = {}
    for contact in contacts:
        company = contact.get('target_company', 'Unknown')
        if company not in connections:
            connections[company] = {'company': company, 'contacts': [], 'referral_potential': 0}
        connections[company]['contacts'].append(contact)
        if contact.get('can_refer'):
            connections[company]['referral_potential'] += 1

    return jsonify({'success': True, 'connections': list(connections.values()), 'total_target_contacts': len(contacts)})


@app.route('/api/network/insights', methods=['GET'])
@require_auth
def get_network_insights():
    contacts = list(network_contacts_collection.find({'user_id': g.user_id}))
    if len(contacts) < 3:
        return jsonify({'success': True, 'insights': {'summary': 'Add more contacts to get personalized insights.', 'recommendations': ['Import your LinkedIn connections', 'Add contacts at target companies'], 'network_health': 'growing'}})

    companies = set(c.get('company') for c in contacts if c.get('company'))
    target_companies = set(c.get('target_company') for c in contacts if c.get('at_target_company'))
    referral_sources = sum(1 for c in contacts if c.get('can_refer'))

    return jsonify({'success': True, 'insights': {
        'summary': f'You have {len(contacts)} contacts across {len(companies)} companies.',
        'network_health': 'strong' if len(contacts) > 20 else 'growing' if len(contacts) > 5 else 'small',
        'top_companies': [{'name': c, 'count': sum(1 for x in contacts if x.get('company') == c)} for c in list(companies)[:5]],
        'referral_opportunities': referral_sources,
        'target_company_coverage': len(target_companies),
        'recommendations': [f'You have {referral_sources} potential referral sources' if referral_sources > 0 else 'Identify who can refer you']
    }})


# ─── Portfolio ────────────────────────────────────────────────────────────────

@app.route('/api/portfolio', methods=['GET'])
@require_auth
def get_my_portfolio():
    user = users_collection.find_one({'id': g.user_id})
    portfolio = portfolios_collection.find_one({'user_id': g.user_id}, {'_id': 0})

    if not portfolio:
        username = ''
        if user:
            username = user.get('name', '').lower().replace(' ', '') or user.get('email', '').split('@')[0]

        portfolio = {
            'user_id': g.user_id, 'username': username, 'is_public': False,
            'display_name': user.get('name', '') if user else '', 'title': '', 'bio': '',
            'theme': 'default', 'show_email': False, 'show_phone': False, 'custom_domain': None,
            'sections': {'cv': True, 'skills': True, 'experience': True, 'education': True, 'projects': True, 'certifications': False, 'social_links': True},
            'social_links': {'linkedin': '', 'github': '', 'twitter': '', 'website': ''},
            'projects': [], 'custom_css': '', 'views_count': 0,
            'created_at': datetime.utcnow().isoformat(), 'updated_at': datetime.utcnow().isoformat()
        }

    return jsonify({'success': True, 'portfolio': portfolio})


@app.route('/api/portfolio', methods=['POST', 'PUT'])
@require_auth
def update_portfolio():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400

    if 'username' in data:
        new_username = re.sub(r'[^a-z0-9_-]', '', data['username'].lower().strip())
        existing = portfolios_collection.find_one({'username': new_username, 'user_id': {'$ne': g.user_id}})
        if existing:
            return jsonify({'error': 'Username already taken'}), 400
        data['username'] = new_username

    allowed_fields = ['username', 'is_public', 'display_name', 'title', 'bio', 'theme', 'show_email', 'show_phone', 'custom_domain', 'sections', 'social_links', 'projects', 'custom_css']
    update_fields = {k: v for k, v in data.items() if k in allowed_fields}
    update_fields['updated_at'] = datetime.utcnow().isoformat()

    existing = portfolios_collection.find_one({'user_id': g.user_id})
    if existing:
        portfolios_collection.update_one({'user_id': g.user_id}, {'$set': update_fields})
    else:
        update_fields['user_id'] = g.user_id
        update_fields['views_count'] = 0
        update_fields['created_at'] = datetime.utcnow().isoformat()
        portfolios_collection.insert_one(update_fields)

    updated = portfolios_collection.find_one({'user_id': g.user_id}, {'_id': 0})
    return jsonify({'success': True, 'portfolio': updated})


@app.route('/api/portfolio/username-check/<username>', methods=['GET'])
def check_username_availability(username):
    username = re.sub(r'[^a-z0-9_-]', '', username.lower().strip())
    if len(username) < 3:
        return jsonify({'available': False, 'error': 'Username must be at least 3 characters'})
    existing = portfolios_collection.find_one({'username': username})
    return jsonify({'available': not existing, 'username': username})


@app.route('/p/<username>', methods=['GET'])
def view_public_portfolio(username):
    portfolio = portfolios_collection.find_one({'username': username.lower()})
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404
    if not portfolio.get('is_public', False):
        return jsonify({'error': 'Portfolio is private'}), 403

    portfolios_collection.update_one({'username': username}, {'$inc': {'views_count': 1}})
    user = users_collection.find_one({'id': portfolio['user_id']})
    cv_data = None
    if portfolio.get('sections', {}).get('cv', True):
        cv_data = cv_data_collection.find_one({'user_id': portfolio['user_id']}, {'_id': 0})

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
    portfolio = portfolios_collection.find_one({'user_id': g.user_id}, {'_id': 0, 'views_count': 1, 'updated_at': 1})
    if not portfolio:
        return jsonify({'success': True, 'stats': {'views_count': 0, 'updated_at': None}})
    return jsonify({'success': True, 'stats': {'views_count': portfolio.get('views_count', 0), 'updated_at': portfolio.get('updated_at')}})


# ─── JSearch Job Search ───────────────────────────────────────────────────────

@app.route('/api/jobs/search', methods=['GET'])
@require_auth
def search_jobs():
    """Search real jobs from JSearch API."""
    query = request.args.get('query', 'Software Engineer')
    location = request.args.get('location', 'Pakistan')
    page = request.args.get('page', '1')

    if not JSEARCH_API_KEY:
        return jsonify({'error': 'Job search API not configured. Add JSEARCH_API_KEY to .env'}), 503

    headers = {
        "X-RapidAPI-Key": JSEARCH_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    params = {
        "query": f"{query} in {location}",
        "page": page,
        "num_pages": "1",
        "date_posted": "month"
    }

    try:
        resp = requests.get(f"{JSEARCH_BASE_URL}/search", headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        jobs = []
        for job in data.get("data", [])[:10]:
            jobs.append({
                "id": job.get("job_id"),
                "title": job.get("job_title"),
                "company": job.get("employer_name"),
                "location": f"{job.get('job_city', '')}, {job.get('job_country', '')}".strip(", "),
                "type": job.get("job_employment_type", "FULLTIME"),
                "is_remote": job.get("job_is_remote", False),
                "description": (job.get("job_description", "") or "")[:500],
                "salary_min": job.get("job_min_salary"),
                "salary_max": job.get("job_max_salary"),
                "currency": job.get("job_salary_currency", "USD"),
                "apply_link": job.get("job_apply_link"),
                "posted_at": job.get("job_posted_at_datetime_utc"),
                "company_logo": job.get("employer_logo"),
            })

        return jsonify({'success': True, 'jobs': jobs, 'total': len(jobs)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)