# Jobrizza - AI-Powered Recruitment Platform

A modern, full-stack recruitment platform with AI-powered CV analysis, job matching, and career coaching. Built with Next.js, React, TypeScript, Flask, and MongoDB.

## 🚀 Features

- **AI CV Analysis** - Upload PDF/DOCX and get instant ATS scores, improvement suggestions
- **Skill Gap Analysis** - Identify missing skills for your target role
- **Job Matching** - AI-powered job recommendations based on your CV
- **Learning Path** - Curated courses and resources to upskill
- **Mock Interviews** - AI-generated interview questions with sample answers
- **Salary Insights** - Location-based salary benchmarks
- **Career Roadmap** - 5-year career progression planning
- **Cover Letter Generator** - AI-tailored cover letters for specific jobs
- **Chatbot Assistant** - AI career assistant (Claude-powered)

## 📁 Project Structure

```
Jobrizza/
├── frontend/                    # Next.js 14 frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── api/            # Next.js API routes (auth, chat)
│   │   │   ├── auth/           # Login, signup pages
│   │   │   ├── cv-result/      # CV analysis dashboard
│   │   │   └── ...
│   │   ├── components/         # React components
│   │   │   ├── layout/         # Header, navbar
│   │   │   ├── Chatbot.tsx     # AI chat widget
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   ├── Authcontext.tsx # Auth state
│   │   │   ├── CVContext.tsx   # CV data state
│   │   │   └── Themecontext.tsx # Theme state
│   │   ├── lib/               # Utilities
│   │   │   ├── api.ts         # API helper with auth
│   │   │   └── mongodb.ts     # MongoDB connection
│   │   └── models/            # Mongoose models
│   ├── package.json
│   └── .env.local             # Frontend env vars
│
├── backend/                     # Flask Python backend
│   ├── app.py                  # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   ├── uploads/                # CV upload folder
│   └── README.md               # Backend docs
│
├── .env.example                # Environment template
└── README.md                   # This file
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **NextAuth.js** for authentication
- **Framer Motion** for animations

### Backend
- **Flask** (Python)
- **MongoDB** (via PyMongo)
- **Claude API** for AI features
- **bcrypt** for password hashing
- **PyPDF2** + **python-docx** for CV parsing

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- Anthropic API key

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# MongoDB (required for both frontend and backend)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobrizza

# NextAuth (frontend)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key

# Flask Backend
NEXT_PUBLIC_API_URL=http://localhost:5000
JWT_SECRET=your-flask-secret-min-32-chars

# AI APIs
ANTHROPIC_API_KEY=your-anthropic-key

# Optional
RESEND_API_KEY=your-resend-key
```

### Quick Start

1. **Clone and setup**
```bash
git clone https://github.com/Attique-dash/Jobrizza.git
cd Jobrizza
```

2. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

3. **Start Backend**
```bash
cd ../backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

4. **Open** http://localhost:3000

## � Documentation

- [Backend README](./backend/README.md) - Flask API docs
- [Environment Setup](./.env.example) - All environment variables

## 🔐 Security

- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT-based authentication
- ✅ Protected AI endpoints
- ✅ MongoDB persistence (not in-memory)
- ✅ CORS configured
- ✅ No hardcoded secrets

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```
Set environment variables in Vercel dashboard.

### Backend (Railway/Render)
```bash
cd backend
# Deploy via Railway CLI or GitHub integration
```
Required env vars: `MONGODB_URI`, `ANTHROPIC_API_KEY`, `JWT_SECRET`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file 