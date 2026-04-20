# Jobrizza Flask Backend

AI-powered CV analysis and career coaching backend API built with Flask.

## Features

- **CV Upload & Parsing** - Extract text from PDF/DOCX files
- **AI-Powered Analysis** - Claude-powered CV quality assessment
- **Skill Gap Analysis** - Identify missing skills for target roles
- **Job Matching** - AI-generated job recommendations
- **Learning Path** - Curated course recommendations
- **Mock Interviews** - AI-generated interview questions
- **Salary Estimation** - Location-based salary benchmarks
- **Career Roadmap** - 5-year career progression planning
- **Cover Letter Generator** - AI-tailored cover letters

## Security Features

- **bcrypt Password Hashing** - Secure password storage (not SHA-256)
- **MongoDB Persistence** - User data stored in database (not in-memory)
- **Token-based Authentication** - JWT-style tokens for API access
- **Protected AI Endpoints** - All AI routes require authentication
- **CORS Configuration** - Configurable allowed origins

## Quick Start

### Prerequisites

- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- OpenRouter API key

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp ../.env.example .env
# Edit .env with your actual values
```

### Environment Variables

```bash
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobrizza
OPENROUTER_API_KEY=your-openrouter-api-key
JWT_SECRET=your-secret-key-min-32-chars

# Optional
FLASK_ENV=development
FLASK_PORT=5000
CORS_ORIGINS=http://localhost:3000
```

### Run the Server

```bash
# Development
python app.py

# Production (with gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get token |

### CV Processing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload-cv` | Yes | Upload and analyze CV |

### AI Features (All require authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/skill-gap` | Analyze skill gaps |
| POST | `/api/job-matches` | Get job recommendations |
| POST | `/api/learning-recommendations` | Get learning resources |
| POST | `/api/mock-interview` | Generate interview questions |
| POST | `/api/salary-estimate` | Get salary estimates |
| POST | `/api/career-path` | Get career roadmap |
| POST | `/api/cover-letter` | Generate cover letter |
| POST | `/api/improve-cv` | Get CV improvements |

## Authentication

All AI endpoints require an Authorization header:

```bash
curl -X POST http://localhost:5000/api/skill-gap \
  -H "Authorization: Bearer token_<user_id>" \
  -H "Content-Type: application/json" \
  -d '{"cv_data": {...}, "target_role": "Software Engineer"}'
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│ Flask API    │────▶│  MongoDB    │
│  Frontend   │     │              │     │  (Users)    │
└─────────────┘     │  ┌────────┐  │     └─────────────┘
                    │  │Claude  │  │
                    │  │  AI    │  │
                    │  └────────┘  │
                    └──────────────┘
```

## Database Schema

### Users Collection
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "password_hash": "bcrypt_hash",
  "userType": "candidate|company",
  "createdAt": "ISO_date",
  "updatedAt": "ISO_date"
}
```

## Deployment

### Docker

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Environment Setup for Production

1. Set strong `JWT_SECRET` (32+ characters)
2. Use MongoDB Atlas (not localhost)
3. Configure `CORS_ORIGINS` for your domain
4. Use HTTPS only
5. Set up OpenRouter API key with usage limits

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- Tokens verified on every AI endpoint request
- No hardcoded credentials in source
- MongoDB connection requires authenticated URI
- API keys stored in environment variables only

## License

MIT
