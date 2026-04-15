from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import re
import random
from werkzeug.utils import secure_filename

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import docx
except ImportError:
    docx = None

app = Flask(__name__)
CORS(app, origins='*', supports_credentials=True)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Store extracted CV data (in production, use a database)
cv_data_store = []


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(filepath):
    if PyPDF2 is None:
        return "PDF extraction not available (PyPDF2 not installed)"
    text = ""
    try:
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
    except Exception as e:
        return f"Error reading PDF: {str(e)}"
    return text


def extract_text_from_docx(filepath):
    if docx is None:
        return "DOCX extraction not available (python-docx not installed)"
    try:
        doc = docx.Document(filepath)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        return f"Error reading DOCX: {str(e)}"


def extract_text_from_doc(filepath):
    # For .doc files, we'd need additional libraries like antiword or textract
    return "DOC format requires additional setup. Please convert to DOCX or PDF."


def parse_cv_data(text, filename):
    """Extract structured data from CV text"""
    data = {
        'filename': filename,
        'raw_text': text[:2000],  # Limit text length
        'email': None,
        'phone': None,
        'skills': [],
        'name': None,
        'education': [],
        'experience': []
    }

    # Extract email
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    email_match = re.search(email_pattern, text)
    if email_match:
        data['email'] = email_match.group(0)

    # Extract phone
    phone_patterns = [
        r'\+?[\d\s\-\(\)]{10,20}',
        r'\(\d{3}\)\s*\d{3}[\s-]?\d{4}',
        r'\d{3}[\s-]\d{3}[\s-]\d{4}'
    ]
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            data['phone'] = phone_match.group(0)
            break

    # Extract skills (common tech and professional skills)
    common_skills = [
        'python', 'javascript', 'java', 'c++', 'c#', 'react', 'angular', 'vue',
        'node.js', 'django', 'flask', 'sql', 'mysql', 'postgresql', 'mongodb',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
        'project management', 'data analysis', 'machine learning', 'ai',
        'excel', 'powerpoint', 'word', 'tableau', 'power bi', 'salesforce',
        'communication', 'leadership', 'teamwork', 'problem solving'
    ]
    text_lower = text.lower()
    for skill in common_skills:
        if skill in text_lower:
            data['skills'].append(skill)

    # Try to extract name (usually at the beginning or after "Name:")
    lines = text.split('\n')[:10]  # Check first 10 lines
    for line in lines:
        line = line.strip()
        if line and len(line) > 2 and len(line) < 50:
            # Skip if it looks like email, phone, or common headers
            if not re.match(r'^[\d\W]', line) and 'email' not in line.lower() and 'phone' not in line.lower():
                if 'name' in line.lower() and ':' in line:
                    data['name'] = line.split(':')[1].strip()
                elif not data['name'] and line[0].isupper():
                    data['name'] = line
                break

    # Extract education keywords
    edu_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'school']
    for keyword in edu_keywords:
        if keyword in text_lower:
            # Find the sentence containing the keyword
            sentences = re.split(r'[.\n]', text)
            for sentence in sentences:
                if keyword in sentence.lower():
                    data['education'].append(sentence.strip()[:100])
                    break

    # Extract experience keywords
    exp_keywords = ['experience', 'work', 'job', 'position', 'role', 'company', 'employed']
    for keyword in exp_keywords:
        if keyword in text_lower:
            sentences = re.split(r'[.\n]', text)
            for sentence in sentences[:5]:  # Limit to first 5 mentions
                if keyword in sentence.lower() and len(sentence) > 20:
                    data['experience'].append(sentence.strip()[:100])
                    break

    return data


def analyze_cv_quality(cv_data, text):
    """Analyze CV quality and return score, mistakes, and suggestions"""
    score = 0
    max_score = 100
    mistakes = []
    suggestions = []
    categories = {
        'contact_info': {'score': 0, 'max': 15, 'issues': []},
        'structure': {'score': 0, 'max': 20, 'issues': []},
        'content': {'score': 0, 'max': 25, 'issues': []},
        'skills': {'score': 0, 'max': 20, 'issues': []},
        'grammar_style': {'score': 0, 'max': 20, 'issues': []}
    }

    # 1. Contact Info Check (15 points)
    if cv_data.get('email'):
        categories['contact_info']['score'] += 5
    else:
        categories['contact_info']['issues'].append('Missing email address')
        mistakes.append('No email address detected')
        suggestions.append('Add a professional email address at the top of your CV')

    if cv_data.get('phone'):
        categories['contact_info']['score'] += 5
    else:
        categories['contact_info']['issues'].append('Missing phone number')
        mistakes.append('No phone number detected')
        suggestions.append('Include your phone number for easy contact')

    if cv_data.get('name'):
        categories['contact_info']['score'] += 5
    else:
        categories['contact_info']['issues'].append('Missing full name')
        mistakes.append('Name not clearly detected')
        suggestions.append('Make sure your full name is prominently displayed at the top')

    # 2. Structure Check (20 points)
    text_lower = text.lower()

    # Check for summary/objective
    if any(word in text_lower for word in ['summary', 'objective', 'profile', 'about me']):
        categories['structure']['score'] += 5
    else:
        categories['structure']['issues'].append('Missing professional summary')
        mistakes.append('No professional summary or objective found')
        suggestions.append('Add a brief professional summary (2-3 lines) at the beginning')

    # Check for education section
    if cv_data.get('education') and len(cv_data['education']) > 0:
        categories['structure']['score'] += 5
    else:
        categories['structure']['issues'].append('Education section unclear')
        mistakes.append('Education details not found or unclear')
        suggestions.append('Clearly list your education with degrees, institutions, and dates')

    # Check for experience section
    if cv_data.get('experience') and len(cv_data['experience']) > 0:
        categories['structure']['score'] += 5
    else:
        categories['structure']['issues'].append('Work experience not clear')
        mistakes.append('Work experience section missing or unclear')
        suggestions.append('Add detailed work experience with company names, roles, and dates')

    # Check for skills section
    if cv_data.get('skills') and len(cv_data['skills']) > 0:
        categories['structure']['score'] += 5
    else:
        categories['structure']['issues'].append('No clear skills section')
        suggestions.append('Create a dedicated skills section with relevant keywords')

    # 3. Content Quality (25 points)
    word_count = len(text.split())
    if 200 <= word_count <= 800:
        categories['content']['score'] += 10
    elif word_count < 200:
        categories['content']['issues'].append('CV too short')
        mistakes.append('CV content is too brief')
        suggestions.append('Expand your CV to at least 300-400 words for better impact')
    elif word_count > 1000:
        categories['content']['issues'].append('CV too long')
        mistakes.append('CV is too lengthy')
        suggestions.append('Keep your CV concise (1-2 pages recommended)')

    # Check for action verbs
    action_verbs = ['managed', 'led', 'developed', 'created', 'implemented', 'designed',
                    'achieved', 'improved', 'increased', 'reduced', 'launched', 'built',
                    'coordinated', 'supervised', 'trained', 'optimized', 'delivered']
    action_verb_count = sum(1 for verb in action_verbs if verb in text_lower)
    if action_verb_count >= 3:
        categories['content']['score'] += 10
    else:
        categories['content']['issues'].append('Limited action verbs')
        mistakes.append('Not enough strong action verbs in descriptions')
        suggestions.append('Use strong action verbs like "managed", "developed", "achieved" to describe accomplishments')

    # Check for quantifiable achievements
    if re.search(r'\d+%|\$\d+|\d+\s*(years?|months?|people|team|projects?)', text_lower):
        categories['content']['score'] += 5
    else:
        categories['content']['issues'].append('No quantifiable achievements')
        mistakes.append('Missing quantifiable achievements (numbers, percentages)')
        suggestions.append('Add numbers to your achievements (e.g., "Increased sales by 25%")')

    # 4. Skills Assessment (20 points)
    skills_count = len(cv_data.get('skills', []))
    if skills_count >= 8:
        categories['skills']['score'] += 15
    elif skills_count >= 5:
        categories['skills']['score'] += 10
    elif skills_count >= 3:
        categories['skills']['score'] += 5
    else:
        categories['skills']['issues'].append('Too few skills listed')
        mistakes.append('Limited skills showcased')
        suggestions.append('Add more relevant skills (technical and soft skills)')

    # Check for soft skills
    soft_skills = ['communication', 'leadership', 'teamwork', 'problem solving',
                   'time management', 'collaboration', 'adaptability']
    soft_skill_count = sum(1 for skill in soft_skills if skill in text_lower)
    if soft_skill_count >= 2:
        categories['skills']['score'] += 5
    else:
        categories['skills']['issues'].append('Missing soft skills')
        suggestions.append('Include relevant soft skills like communication, leadership, teamwork')

    # 5. Grammar & Style (20 points)
    # Check for common mistakes
    common_errors = {
        r'\bi am\b': 'Consider using "I am" in a more professional form',
        r'\bive\b|\bi\'ve\b': "Avoid contractions like \"I've\" - use \"I have\"",
        r'\bimo\b|\bimho\b': 'Avoid informal abbreviations',
        r'\b(\w+) \1\b': 'Remove duplicate words',
        r'  +': 'Fix multiple spaces',
        r'[A-Z]{4,}': 'Avoid excessive capitalization',
    }

    grammar_issues = 0
    for pattern, message in common_errors.items():
        if re.search(pattern, text_lower):
            grammar_issues += 1

    if grammar_issues == 0:
        categories['grammar_style']['score'] += 10
    else:
        categories['grammar_style']['issues'].append(f'{grammar_issues} potential grammar/style issues')
        mistakes.append('Potential grammar or style issues detected')
        suggestions.append('Review for proper grammar and professional tone')

    # Check formatting consistency
    lines = text.split('\n')
    inconsistent_spacing = sum(1 for i in range(len(lines)-1)
                                  if lines[i].strip() and not lines[i+1].strip()
                                  or not lines[i].strip() and lines[i+1].strip())
    if inconsistent_spacing < 5:
        categories['grammar_style']['score'] += 5
    else:
        categories['grammar_style']['issues'].append('Inconsistent formatting')
        mistakes.append('Inconsistent spacing and formatting')
        suggestions.append('Use consistent spacing and formatting throughout')

    # Check for bullet points (professional formatting)
    bullet_count = text.count('•') + text.count('-') + text.count('*')
    if bullet_count >= 5:
        categories['grammar_style']['score'] += 5
    else:
        categories['grammar_style']['issues'].append('Limited bullet points')
        suggestions.append('Use bullet points for better readability')

    # Calculate total score
    total_score = sum(cat['score'] for cat in categories.values())

    # Determine status
    if total_score >= 85:
        status = 'Excellent'
        status_message = 'Your CV is professional and well-structured!'
    elif total_score >= 70:
        status = 'Good'
        status_message = 'Good CV with minor improvements needed'
    elif total_score >= 50:
        status = 'Average'
        status_message = 'Your CV needs some improvements to stand out'
    else:
        status = 'Needs Work'
        status_message = 'Significant improvements recommended'

    return {
        'score': total_score,
        'max_score': max_score,
        'percentage': round((total_score / max_score) * 100),
        'status': status,
        'status_message': status_message,
        'categories': categories,
        'mistakes': mistakes if mistakes else ['No major issues found'],
        'suggestions': suggestions if suggestions else ['Great job! Your CV looks professional'],
        'word_count': word_count,
        'skills_count': skills_count
    }


def generate_professional_cv(cv_data, analysis):
    """Generate an improved professional version of the CV"""
    improved = {
        'name': cv_data.get('name', 'Your Name'),
        'email': cv_data.get('email', 'your.email@example.com'),
        'phone': cv_data.get('phone', 'Your Phone Number'),
        'professional_summary': '',
        'skills': cv_data.get('skills', []),
        'education': cv_data.get('education', []),
        'experience': cv_data.get('experience', []),
        'improvements_made': []
    }

    improvements = []

    # Generate professional summary if missing
    if not any(word in cv_data.get('raw_text', '').lower()
               for word in ['summary', 'objective', 'profile']):
        skills_text = ', '.join(cv_data.get('skills', [])[:5])
        improved['professional_summary'] = (
            f"Results-driven professional with expertise in {skills_text}. "
            f"Proven track record of delivering high-quality results and driving continuous improvement. "
            f"Seeking to leverage skills and experience to contribute to organizational success."
        )
        improvements.append('Added professional summary highlighting key strengths')
    else:
        improved['professional_summary'] = 'Professional summary preserved from original CV'

    # Enhance skills list
    if len(cv_data.get('skills', [])) < 8:
        additional_skills = [
            'Problem Solving', 'Communication', 'Leadership',
            'Time Management', 'Team Collaboration', 'Critical Thinking'
        ]
        improved['skills'] = list(set(cv_data.get('skills', []) + additional_skills))[:12]
        improvements.append('Enhanced skills section with relevant soft skills')

    # Format education
    if cv_data.get('education'):
        improved['education'] = [edu.strip() for edu in cv_data['education'] if edu.strip()]
        improvements.append('Standardized education section formatting')

    # Format experience with action verbs
    if cv_data.get('experience'):
        formatted_exp = []
        for exp in cv_data['experience']:
            # Add action verb if not present
            exp_clean = exp.strip()
            if exp_clean and len(exp_clean) > 10:
                formatted_exp.append(exp_clean)
        improved['experience'] = formatted_exp
        improvements.append('Formatted experience section with consistent structure')

    improved['improvements_made'] = improvements
    return improved


@app.route("/")
def home():
    return "Hello, this is my backend page!"


@app.route('/api/upload-cv', methods=['POST'])
def upload_cv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Extract text based on file type
        file_ext = filename.rsplit('.', 1)[1].lower()
        if file_ext == 'pdf':
            text = extract_text_from_pdf(filepath)
        elif file_ext == 'docx':
            text = extract_text_from_docx(filepath)
        elif file_ext == 'doc':
            text = extract_text_from_doc(filepath)
        else:
            text = "Unsupported file format"

        # Parse CV data
        cv_data = parse_cv_data(text, filename)

        # Analyze CV quality
        analysis = analyze_cv_quality(cv_data, text)

        # Store with analysis
        cv_data_with_analysis = {**cv_data, 'analysis': analysis}
        cv_data_store.append(cv_data_with_analysis)

        return jsonify({
            'success': True,
            'message': 'CV uploaded and processed successfully',
            'data': cv_data_with_analysis
        })

    return jsonify({'error': 'Invalid file type'}), 400


@app.route('/api/cv-data', methods=['GET'])
def get_cv_data():
    return jsonify({'cv_data': cv_data_store})


@app.route('/api/improve-cv', methods=['POST'])
def improve_cv():
    """Generate an improved professional version of the CV"""
    data = request.get_json()
    if not data or 'cv_data' not in data:
        return jsonify({'error': 'No CV data provided'}), 400

    cv_data = data['cv_data']
    analysis = cv_data.get('analysis', {})

    # Generate improved CV
    improved_cv = generate_professional_cv(cv_data, analysis)

    return jsonify({
        'success': True,
        'message': 'Professional CV generated successfully',
        'improved_cv': improved_cv,
        'original_analysis': analysis
    })


@app.route('/backend/cv-data')
def backend_cv_page():
    """Backend page to display all extracted CV data"""
    html_template = '''
<!DOCTYPE html>
<html>
<head>
    <title>CV Data - Backend</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .cv-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .cv-header {
            background: #4CAF50;
            color: white;
            padding: 15px;
            margin: -20px -20px 15px -20px;
            border-radius: 8px 8px 0 0;
        }
        .cv-header h2 {
            margin: 0;
        }
        .field {
            margin: 10px 0;
            padding: 8px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        .field-label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            width: 120px;
        }
        .field-value {
            color: #333;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        .skill-tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.9em;
        }
        .empty-state {
            text-align: center;
            color: #666;
            padding: 40px;
            background: white;
            border-radius: 8px;
        }
        .raw-text {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.85em;
            white-space: pre-wrap;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <h1>Extracted CV Data</h1>
    {% if cv_data %}
        <p style="color: #666;">Total CVs processed: {{ cv_data|length }}</p>
        {% for cv in cv_data %}
        <div class="cv-card">
            <div class="cv-header">
                <h2>CV #{{ loop.index }}: {{ cv.filename }}</h2>
            </div>

            <div class="field">
                <span class="field-label">Name:</span>
                <span class="field-value">{{ cv.name or 'Not detected' }}</span>
            </div>

            <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value">{{ cv.email or 'Not detected' }}</span>
            </div>

            <div class="field">
                <span class="field-label">Phone:</span>
                <span class="field-value">{{ cv.phone or 'Not detected' }}</span>
            </div>

            <div class="field">
                <span class="field-label">Skills:</span>
                {% if cv.skills %}
                <div class="skills-list">
                    {% for skill in cv.skills %}
                    <span class="skill-tag">{{ skill }}</span>
                    {% endfor %}
                </div>
                {% else %}
                <span class="field-value">No skills detected</span>
                {% endif %}
            </div>

            <div class="field">
                <span class="field-label">Education:</span>
                {% if cv.education %}
                <ul style="margin: 5px 0; padding-left: 20px;">
                    {% for edu in cv.education %}
                    <li>{{ edu }}</li>
                    {% endfor %}
                </ul>
                {% else %}
                <span class="field-value">No education detected</span>
                {% endif %}
            </div>

            <div class="field">
                <span class="field-label">Experience:</span>
                {% if cv.experience %}
                <ul style="margin: 5px 0; padding-left: 20px;">
                    {% for exp in cv.experience %}
                    <li>{{ exp }}</li>
                    {% endfor %}
                </ul>
                {% else %}
                <span class="field-value">No experience detected</span>
                {% endif %}
            </div>

            <div class="field">
                <span class="field-label">Raw Text (Preview):</span>
                <div class="raw-text">{{ cv.raw_text }}</div>
            </div>
        </div>
        {% endfor %}
    {% else %}
        <div class="empty-state">
            <h2>No CVs uploaded yet</h2>
            <p>Upload CVs from the frontend to see extracted data here.</p>
        </div>
    {% endif %}
</body>
</html>
    '''
    return render_template_string(html_template, cv_data=cv_data_store)


if __name__ == "__main__":
    app.run(debug=True, port=5000)