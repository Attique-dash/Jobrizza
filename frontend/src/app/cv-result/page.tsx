'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CVData {
  filename: string; name: string | null; email: string | null; phone: string | null
  skills: string[]; education: string[]; experience: string[]; raw_text: string; word_count?: number
  analysis?: CVAnalysis; ai_analysis?: AIAnalysis
}
interface CVAnalysis {
  score: number; max_score: number; percentage: number; status: string; status_message: string
  categories: { contact_info: Cat; structure: Cat; content: Cat; skills: Cat; grammar_style: Cat }
  mistakes: string[]; suggestions: string[]; word_count: number; skills_count: number
}
interface Cat { score: number; max: number; issues: string[] }
interface AIAnalysis {
  ats_score: { score: number; grade: string; keyword_density: string; format_issues: string[]; missing_keywords: string[]; passed_checks: string[] }
  mistake_detector: { grammar_errors: string[]; employment_gaps: string[]; weak_action_verbs: string[]; missing_metrics: string[]; overall_writing_score: number }
  template_suggestion: { current_format: string; recommended_template: string; reasons: string[]; before_after_tips: string[] }
}
interface SkillGap {
  target_role: string; match_percentage: number; strong_skills: string[]; missing_critical: string[]
  missing_nice_to_have: string[]; market_demand: { trending_up: string[]; trending_down: string[]; salary_impact: string }; quick_wins: string[]
}
interface Job {
  id: string; title: string; company: string; location: string; type: string
  salary_min: number; salary_max: number; currency: string; match_score: number
  match_reasons: string[]; skills_matched: string[]; skills_missing: string[]
  posted_days_ago: number; company_size: string
}
interface LearningRec { skill: string; priority: string; estimated_hours: number; resources: Resource[]; milestone: string }
interface Resource { title: string; platform: string; url: string; duration: string; free: boolean; rating: number }
interface InterviewQuestion { id: string; type: string; question: string; hint: string; sample_answer_structure: string; difficulty: string }
interface CareerMilestone { year: number; title: string; description: string; skills_to_acquire: string[]; expected_title: string; expected_salary_usd: number }

const API = 'http://localhost:5000'

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 1.5, ease: 'easeOut' }}
        strokeLinecap="round" />
    </svg>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{children}</span>
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Analyzing with AI…</p>
    </div>
  )
}

function TabButton({ id, label, icon, active, onClick }: { id: string; label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
      <span>{icon}</span><span className="hidden sm:block">{label}</span>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CVResultPage() {
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [targetRole, setTargetRole] = useState('')
  const [skillGap, setSkillGap] = useState<SkillGap | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [learning, setLearning] = useState<{ recommendations: LearningRec[]; learning_path_weeks: number; total_free_hours: number } | null>(null)
  const [interview, setInterview] = useState<{ role: string; questions: InterviewQuestion[]; tips: string[] } | null>(null)
  const [salary, setSalary] = useState<any>(null)
  const [careerPath, setCareerPath] = useState<any>(null)
  const [coverLetter, setCoverLetter] = useState<any>(null)
  const [coverLetterForm, setCoverLetterForm] = useState({ job_title: '', company_name: '', job_description: '' })
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [salaryLocation, setSalaryLocation] = useState('')
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('cvData')
    if (stored) {
      const data = JSON.parse(stored)
      setCvData(data)
    }
    setLoading(false)
  }, [])

  const setTabLoading = (key: string, val: boolean) => setLoadingStates(p => ({ ...p, [key]: val }))

  const fetchSkillGap = async () => {
    if (!cvData || skillGap) return
    setTabLoading('skills', true)
    const res = await fetch(`${API}/api/skill-gap`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData, target_role: targetRole }) })
    const data = await res.json()
    if (data.success) setSkillGap(data.skill_gap)
    setTabLoading('skills', false)
  }

  const fetchJobs = async () => {
    if (!cvData || jobs.length) return
    setTabLoading('jobs', true)
    const res = await fetch(`${API}/api/job-matches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData }) })
    const data = await res.json()
    if (data.success) setJobs(data.jobs)
    setTabLoading('jobs', false)
  }

  const fetchLearning = async (missingSkills?: string[]) => {
    if (!cvData || learning) return
    setTabLoading('learning', true)
    const skills = missingSkills || cvData.skills.slice(0, 3)
    const res = await fetch(`${API}/api/learning-recommendations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missing_skills: skills }) })
    const data = await res.json()
    if (data.success) setLearning(data.learning)
    setTabLoading('learning', false)
  }

  const fetchInterview = async () => {
    if (!cvData || interview) return
    setTabLoading('interview', true)
    const res = await fetch(`${API}/api/mock-interview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData, target_role: targetRole }) })
    const data = await res.json()
    if (data.success) setInterview(data.interview)
    setTabLoading('interview', false)
  }

  const fetchSalary = async () => {
    if (!cvData) return
    setTabLoading('salary', true)
    const res = await fetch(`${API}/api/salary-estimate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData, location: salaryLocation }) })
    const data = await res.json()
    if (data.success) setSalary(data.salary)
    setTabLoading('salary', false)
  }

  const fetchCareerPath = async () => {
    if (!cvData) return
    setTabLoading('career', true)
    const res = await fetch(`${API}/api/career-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData, target_role: targetRole }) })
    const data = await res.json()
    if (data.success) setCareerPath(data.career_path)
    setTabLoading('career', false)
  }

  const fetchCoverLetter = async () => {
    if (!cvData) return
    setTabLoading('cover', true)
    const res = await fetch(`${API}/api/cover-letter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData, ...coverLetterForm }) })
    const data = await res.json()
    if (data.success) setCoverLetter(data.cover_letter)
    setTabLoading('cover', false)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'skills') fetchSkillGap()
    if (tab === 'jobs') fetchJobs()
    if (tab === 'learning') fetchLearning()
  }

  const copyCoverLetter = () => {
    if (coverLetter?.cover_letter) {
      navigator.clipboard.writeText(coverLetter.cover_letter)
      setCopyMsg('Copied!')
      setTimeout(() => setCopyMsg(''), 2000)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!cvData) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 text-slate-100">
      <div className="text-6xl">📄</div>
      <h1 className="text-3xl font-bold">No CV Data Found</h1>
      <p className="text-slate-400">Upload a CV first to see your analysis.</p>
      <Link href="/" className="px-6 py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-semibold transition-colors">← Upload CV</Link>
    </div>
  )

  const analysis = cvData.analysis
  const aiAnalysis = cvData.ai_analysis
  const pct = analysis?.percentage ?? 0
  const atsScore = aiAnalysis?.ats_score?.score ?? 0

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analysis', label: 'Analysis', icon: '🔍' },
    { id: 'skills', label: 'Skill Gap', icon: '⚡' },
    { id: 'jobs', label: 'Job Matches', icon: '💼' },
    { id: 'learning', label: 'Learning', icon: '📚' },
    { id: 'tools', label: 'AI Tools', icon: '🤖' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📄</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-100 truncate">{cvData.filename}</p>
              <p className="text-xs text-slate-500">CV Analysis Complete</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400">Role target:</span>
              <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Dev" className="bg-transparent text-sm text-slate-200 outline-none w-32 placeholder:text-slate-600" />
            </div>
            <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">← New CV</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Hero Score Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'CV Quality', value: `${pct}%`, sub: analysis?.status ?? '–', color: pct >= 80 ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30' : pct >= 60 ? 'from-sky-500/20 to-sky-500/5 border-sky-500/30' : 'from-amber-500/20 to-amber-500/5 border-amber-500/30' },
            { label: 'ATS Score', value: `${atsScore}%`, sub: aiAnalysis?.ats_score?.grade ?? '–', color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30' },
            { label: 'Skills Found', value: cvData.skills.length, sub: 'detected', color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30' },
            { label: 'Word Count', value: analysis?.word_count ?? cvData.word_count ?? '–', sub: 'words', color: 'from-rose-500/20 to-rose-500/5 border-rose-500/30' },
          ].map(card => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${card.color} border rounded-2xl p-4`}>
              <p className="text-slate-400 text-xs font-medium mb-1">{card.label}</p>
              <p className="text-3xl font-black text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map(t => <TabButton key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => handleTabChange(t.id)} />)}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>

            {/* ═══ OVERVIEW ══════════════════════════════════════════════════ */}
            {activeTab === 'overview' && analysis && (
              <div className="space-y-6">
                {/* Score + breakdown */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                    <h2 className="text-lg font-bold self-start">Overall Score</h2>
                    <div className="relative">
                      <ScoreRing pct={pct} size={160} stroke={12} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black">{pct}</span>
                        <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{analysis.status}</p>
                      <p className="text-sm text-slate-400">{analysis.status_message}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-bold">Category Breakdown</h2>
                    {Object.entries(analysis.categories).map(([key, cat]) => {
                      const p = Math.round((cat.score / cat.max) * 100)
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300 capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-slate-400 font-mono">{cat.score}/{cat.max}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                              initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1, delay: 0.1 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Candidate info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">Extracted Information</h2>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    {[{ label: 'Name', val: cvData.name }, { label: 'Email', val: cvData.email }, { label: 'Phone', val: cvData.phone }].map(f => (
                      <div key={f.label} className="bg-slate-800 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">{f.label}</p>
                        <p className="font-semibold text-slate-200 truncate">{f.val || 'Not detected'}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-400 mb-3">Detected Skills ({cvData.skills.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {cvData.skills.map(s => <Pill key={s} color="bg-sky-500/10 text-sky-300 border border-sky-500/20">{s}</Pill>)}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: '⚡', label: 'Check Skill Gaps', tab: 'skills', color: 'bg-violet-500/10 border-violet-500/30 hover:border-violet-400' },
                    { icon: '💼', label: 'Find Matching Jobs', tab: 'jobs', color: 'bg-sky-500/10 border-sky-500/30 hover:border-sky-400' },
                    { icon: '🤖', label: 'AI Tools (Interview, Salary…)', tab: 'tools', color: 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400' },
                  ].map(a => (
                    <button key={a.tab} onClick={() => handleTabChange(a.tab)}
                      className={`${a.color} border rounded-xl p-4 text-left transition-all group`}>
                      <div className="text-2xl mb-2">{a.icon}</div>
                      <p className="font-semibold text-slate-200 group-hover:text-white">{a.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ ANALYSIS ══════════════════════════════════════════════════ */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* ATS Score */}
                {aiAnalysis?.ats_score && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">ATS Score</h2>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-violet-400">{aiAnalysis.ats_score.score}</span>
                        <span className="text-5xl font-black text-slate-600">{aiAnalysis.ats_score.grade}</span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-2">✓ PASSED</p>
                        {aiAnalysis.ats_score.passed_checks.map((c, i) => <p key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800">{c}</p>)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-400 mb-2">✗ FORMAT ISSUES</p>
                        {aiAnalysis.ats_score.format_issues.map((c, i) => <p key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800">{c}</p>)}
                        <p className="text-xs font-semibold text-amber-400 mt-3 mb-2">⚠ MISSING KEYWORDS</p>
                        {aiAnalysis.ats_score.missing_keywords.map((c, i) => <Pill key={i} color="bg-amber-500/10 text-amber-300">{c}</Pill>)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mistake Detector */}
                {aiAnalysis?.mistake_detector && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">🔍 Mistake Detector</h2>
                      <div className="text-center">
                        <p className="text-2xl font-black text-sky-400">{aiAnalysis.mistake_detector.overall_writing_score}</p>
                        <p className="text-xs text-slate-500">Writing Score</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {[
                        { label: 'Grammar Issues', items: aiAnalysis.mistake_detector.grammar_errors, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                        { label: 'Weak Action Verbs', items: aiAnalysis.mistake_detector.weak_action_verbs, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Missing Metrics', items: aiAnalysis.mistake_detector.missing_metrics, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { label: 'Employment Gaps', items: aiAnalysis.mistake_detector.employment_gaps, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                      ].map(section => (
                        <div key={section.label}>
                          <p className={`text-xs font-semibold mb-2 ${section.color}`}>{section.label}</p>
                          {section.items.length > 0
                            ? section.items.map((item, i) => <p key={i} className={`text-sm text-slate-300 ${section.bg} rounded-lg px-3 py-2 mb-1`}>{item}</p>)
                            : <p className="text-sm text-slate-500 italic">None detected ✓</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Suggestion */}
                {aiAnalysis?.template_suggestion && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">📐 Template Recommendation</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500 mb-1">Current Format</p>
                        <p className="font-semibold text-slate-300">{aiAnalysis.template_suggestion.current_format}</p>
                      </div>
                      <div className="bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 rounded-xl p-4">
                        <p className="text-xs text-sky-400 mb-1">Recommended</p>
                        <p className="font-bold text-xl text-slate-100">{aiAnalysis.template_suggestion.recommended_template}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-400 mb-2">Why this template:</p>
                      {aiAnalysis.template_suggestion.reasons.map((r, i) => <p key={i} className="text-sm text-slate-300 flex items-start gap-2 mb-1"><span className="text-sky-400 mt-0.5">→</span>{r}</p>)}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-400 mb-2">Before → After tips:</p>
                      {aiAnalysis.template_suggestion.before_after_tips.map((t, i) => <p key={i} className="text-sm text-slate-300 flex items-start gap-2 mb-1"><span className="text-emerald-400 mt-0.5">✓</span>{t}</p>)}
                    </div>
                  </div>
                )}

                {/* Basic mistakes & suggestions */}
                {analysis && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="font-bold mb-3 text-rose-400">⚠ Issues Found</h3>
                      {analysis.mistakes.map((m, i) => <p key={i} className="text-sm text-slate-300 bg-rose-500/10 rounded-lg px-3 py-2 mb-2">{m}</p>)}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="font-bold mb-3 text-sky-400">💡 Suggestions</h3>
                      {analysis.suggestions.map((s, i) => <p key={i} className="text-sm text-slate-300 bg-sky-500/10 rounded-lg px-3 py-2 mb-2">→ {s}</p>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SKILL GAP ══════════════════════════════════════════════════ */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Target role (e.g. Senior Backend Engineer)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors" />
                  <button onClick={() => { setSkillGap(null); fetchSkillGap() }}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-semibold transition-colors">Analyze</button>
                </div>
                {loadingStates.skills ? <LoadingSpinner /> : skillGap ? (
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold">{skillGap.target_role}</h2>
                          <p className="text-slate-400 text-sm">Skill gap analysis</p>
                        </div>
                        <div className="text-center">
                          <div className="relative inline-block">
                            <ScoreRing pct={skillGap.match_percentage} size={100} stroke={8} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black">{skillGap.match_percentage}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Match</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-emerald-400 mb-2">✓ STRONG SKILLS</p>
                          <div className="flex flex-wrap gap-1.5">{skillGap.strong_skills.map(s => <Pill key={s} color="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{s}</Pill>)}</div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-rose-400 mb-2">✗ CRITICAL GAPS</p>
                          <div className="flex flex-wrap gap-1.5">{skillGap.missing_critical.map(s => <Pill key={s} color="bg-rose-500/10 text-rose-300 border border-rose-500/20">{s}</Pill>)}</div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-400 mb-2">⊕ NICE TO HAVE</p>
                          <div className="flex flex-wrap gap-1.5">{skillGap.missing_nice_to_have.map(s => <Pill key={s} color="bg-amber-500/10 text-amber-300 border border-amber-500/20">{s}</Pill>)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <h3 className="font-bold mb-3">📈 Market Trends</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-emerald-400 mb-1">Trending Up ↑</p>
                            <div className="flex flex-wrap gap-1.5">{skillGap.market_demand.trending_up.map(s => <Pill key={s} color="bg-emerald-500/10 text-emerald-300">{s}</Pill>)}</div>
                          </div>
                          <div>
                            <p className="text-xs text-rose-400 mb-1">Trending Down ↓</p>
                            <div className="flex flex-wrap gap-1.5">{skillGap.market_demand.trending_down.map(s => <Pill key={s} color="bg-rose-500/10 text-rose-300">{s}</Pill>)}</div>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-xs text-amber-300">💰 {skillGap.market_demand.salary_impact}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <h3 className="font-bold mb-3">⚡ Quick Wins (under 2 weeks)</h3>
                        {skillGap.quick_wins.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-800">
                            <span className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            <span className="text-sm text-slate-300">{s}</span>
                          </div>
                        ))}
                        <button onClick={() => { setLearning(null); fetchLearning(skillGap.missing_critical); handleTabChange('learning') }}
                          className="mt-4 w-full py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-xl text-sm font-semibold text-sky-400 transition-colors">
                          📚 Get Learning Resources →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">⚡</div>
                    <p className="text-slate-400">Enter your target role above and click Analyze</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ JOB MATCHES ════════════════════════════════════════════════ */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {loadingStates.jobs ? <LoadingSpinner /> : jobs.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">{jobs.length} Job Matches</h2>
                      <p className="text-sm text-slate-400">Ranked by match score</p>
                    </div>
                    {jobs.sort((a, b) => b.match_score - a.match_score).map(job => (
                      <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 cursor-pointer transition-all"
                        onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-100 truncate">{job.title}</h3>
                              <Pill color={job.type === 'Remote' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'}>{job.type}</Pill>
                            </div>
                            <p className="text-slate-400 text-sm">{job.company} · {job.location}</p>
                            <p className="text-slate-500 text-xs mt-1">{job.company_size} employees · Posted {job.posted_days_ago}d ago</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-2xl font-black ${job.match_score >= 85 ? 'text-emerald-400' : job.match_score >= 70 ? 'text-sky-400' : 'text-amber-400'}`}>{job.match_score}%</div>
                            <p className="text-xs text-slate-500">match</p>
                            <p className="text-xs text-slate-400 mt-1">{job.currency} {(job.salary_min / 1000).toFixed(0)}k–{(job.salary_max / 1000).toFixed(0)}k</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills_matched.map(s => <Pill key={s} color="bg-sky-500/10 text-sky-300">{s}</Pill>)}
                          {job.skills_missing.map(s => <Pill key={s} color="bg-rose-500/10 text-rose-300 line-through opacity-60">{s}</Pill>)}
                        </div>
                        <AnimatePresence>
                          {selectedJob?.id === job.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="border-t border-slate-700 mt-4 pt-4 space-y-2">
                                <p className="text-xs font-semibold text-slate-400">Why you're a match:</p>
                                {job.match_reasons.map((r, i) => <p key={i} className="text-sm text-slate-300">✓ {r}</p>)}
                                <div className="flex gap-3 mt-4">
                                  <button onClick={() => { setCoverLetterForm({ job_title: job.title, company_name: job.company, job_description: '' }); setActiveTab('tools') }}
                                    className="flex-1 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-xl text-sm font-semibold text-violet-300 transition-colors">
                                    ✉ Generate Cover Letter
                                  </button>
                                  <button className="flex-1 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-xl text-sm font-semibold text-sky-300 transition-colors">
                                    Apply Now →
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">💼</div>
                    <p className="text-slate-400 mb-4">Finding jobs matching your profile…</p>
                    <button onClick={fetchJobs} className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-semibold transition-colors">Find Jobs</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ LEARNING ════════════════════════════════════════════════════ */}
            {activeTab === 'learning' && (
              <div className="space-y-4">
                {loadingStates.learning ? <LoadingSpinner /> : learning ? (
                  <>
                    <div className="flex gap-4 mb-2">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-black text-sky-400">{learning.learning_path_weeks}</p>
                        <p className="text-xs text-slate-500">weeks to job-ready</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-black text-emerald-400">{learning.total_free_hours}h</p>
                        <p className="text-xs text-slate-500">free content</p>
                      </div>
                    </div>
                    {learning.recommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold capitalize">{rec.skill}</h3>
                            <Pill color={rec.priority === 'Critical' ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-300'}>{rec.priority}</Pill>
                          </div>
                          <span className="text-xs text-slate-500">~{rec.estimated_hours}h total</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">🎯 Goal: {rec.milestone}</p>
                        <div className="space-y-2">
                          {rec.resources.map((r, j) => (
                            <a key={j} href={r.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition-colors group">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{r.platform === 'YouTube' ? '▶️' : r.platform === 'Coursera' ? '🎓' : r.platform === 'Udemy' ? '📘' : r.platform === 'Official Docs' ? '📖' : '💻'}</span>
                                <div>
                                  <p className="text-sm font-medium text-slate-200 group-hover:text-white">{r.title}</p>
                                  <p className="text-xs text-slate-500">{r.platform} · {r.duration}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {r.free && <Pill color="bg-emerald-500/10 text-emerald-300">Free</Pill>}
                                <span className="text-xs text-yellow-400">★ {r.rating}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">📚</div>
                    <p className="text-slate-400 mb-4">Get personalized learning recommendations</p>
                    <button onClick={() => fetchLearning()} className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-semibold transition-colors">Generate Learning Path</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ AI TOOLS ════════════════════════════════════════════════════ */}
            {activeTab === 'tools' && (
              <div className="space-y-6">
                {/* Tool selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'interview', icon: '🎤', label: 'Mock Interview' },
                    { id: 'salary', icon: '💰', label: 'Salary Estimator' },
                    { id: 'career', icon: '🗺️', label: 'Career Path' },
                    { id: 'cover', icon: '✉️', label: 'Cover Letter' },
                  ].map(tool => (
                    <button key={tool.id} onClick={() => {
                      const el = document.getElementById(`tool-${tool.id}`)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }} className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 text-center transition-all">
                      <div className="text-3xl mb-2">{tool.icon}</div>
                      <p className="text-sm font-semibold text-slate-300">{tool.label}</p>
                    </button>
                  ))}
                </div>

                {/* ── Mock Interview ── */}
                <div id="tool-interview" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">🎤 AI Mock Interview</h2>
                    {!interview && <button onClick={fetchInterview} disabled={loadingStates.interview}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors">
                      {loadingStates.interview ? 'Generating…' : 'Start Interview'}
                    </button>}
                  </div>
                  {loadingStates.interview ? <LoadingSpinner /> : interview ? (
                    <div>
                      <p className="text-slate-400 text-sm mb-4">Role: <span className="text-slate-200 font-semibold">{interview.role}</span></p>
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                        {interview.questions.map((q, i) => (
                          <button key={i} onClick={() => setCurrentQuestion(i)}
                            className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-bold transition-all ${i === currentQuestion ? 'bg-sky-500 text-white' : userAnswers[q.id] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      {interview.questions[currentQuestion] && (() => {
                        const q = interview.questions[currentQuestion]
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Pill color={q.type === 'Technical' ? 'bg-violet-500/10 text-violet-300' : q.type === 'Behavioral' ? 'bg-sky-500/10 text-sky-300' : 'bg-amber-500/10 text-amber-300'}>{q.type}</Pill>
                              <Pill color={q.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-300' : q.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}>{q.difficulty}</Pill>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4">
                              <p className="text-slate-100 font-medium">{q.question}</p>
                            </div>
                            <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
                              <p className="text-xs text-sky-400 font-semibold mb-1">💡 HINT</p>
                              <p className="text-sm text-slate-300">{q.hint}</p>
                              <p className="text-xs text-slate-500 mt-2">{q.sample_answer_structure}</p>
                            </div>
                            <textarea value={userAnswers[q.id] || ''} onChange={e => setUserAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                              placeholder="Type your answer here…" rows={5}
                              className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none resize-none transition-colors" />
                            <div className="flex justify-between">
                              <button onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))} disabled={currentQuestion === 0}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-sm transition-colors">← Prev</button>
                              <button onClick={() => setCurrentQuestion(p => Math.min(interview.questions.length - 1, p + 1))} disabled={currentQuestion === interview.questions.length - 1}
                                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-30 rounded-xl text-sm font-semibold transition-colors">Next →</button>
                            </div>
                          </div>
                        )
                      })()}
                      <div className="mt-4 bg-slate-800 rounded-xl p-4">
                        <p className="text-xs font-semibold text-slate-400 mb-2">Pro Tips:</p>
                        {interview.tips.map((tip, i) => <p key={i} className="text-sm text-slate-300 py-1">• {tip}</p>)}
                      </div>
                    </div>
                  ) : <p className="text-slate-500 text-sm text-center py-8">Click "Start Interview" to generate AI-powered questions based on your CV</p>}
                </div>

                {/* ── Salary Estimator ── */}
                <div id="tool-salary" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">💰 Salary Estimator</h2>
                  <div className="flex gap-3 mb-4">
                    <input value={salaryLocation} onChange={e => setSalaryLocation(e.target.value)} placeholder="Location (e.g. Dubai, Remote, London)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors" />
                    <button onClick={fetchSalary} disabled={loadingStates.salary}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors">
                      {loadingStates.salary ? '…' : 'Estimate'}
                    </button>
                  </div>
                  {loadingStates.salary ? <LoadingSpinner /> : salary ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/20 rounded-xl p-4">
                          <p className="text-xs text-sky-400 mb-1">Current Market Value</p>
                          <p className="text-3xl font-black text-slate-100">{salary.current_estimate.currency} {(salary.current_estimate.median / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-slate-400">{salary.current_estimate.min / 1000}k – {salary.current_estimate.max / 1000}k · {salary.current_estimate.location}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/20 rounded-xl p-4">
                          <p className="text-xs text-emerald-400 mb-1">Potential with Upskilling</p>
                          <p className="text-3xl font-black text-slate-100">{salary.current_estimate.currency} {(salary.potential_with_upskilling.median / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-slate-400">Add: {salary.potential_with_upskilling.skills_to_add.slice(0, 2).join(', ')}</p>
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs font-semibold text-slate-400 mb-3">By Location</p>
                        <div className="space-y-2">
                          {salary.by_location.map((loc: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-slate-300">{loc.city}</span>
                              <span className="text-sm font-semibold text-slate-200">{loc.currency} {(loc.min / 1000).toFixed(0)}k – {(loc.max / 1000).toFixed(0)}k</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : <p className="text-slate-500 text-sm text-center py-4">Enter your location and click Estimate</p>}
                </div>

                {/* ── Career Path ── */}
                <div id="tool-career" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">🗺️ 5-Year Career Path</h2>
                    <button onClick={fetchCareerPath} disabled={loadingStates.career}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors">
                      {loadingStates.career ? 'Generating…' : careerPath ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                  {loadingStates.career ? <LoadingSpinner /> : careerPath ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Pill color="bg-sky-500/10 text-sky-300">{careerPath.current_level} Level</Pill>
                        <span className="text-slate-400">→</span>
                        <Pill color="bg-violet-500/10 text-violet-300">{careerPath.target_role}</Pill>
                      </div>
                      <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700" />
                        {careerPath.milestones.map((m: CareerMilestone, i: number) => (
                          <div key={i} className="relative flex gap-4 mb-4 pl-12">
                            <div className="absolute left-3 w-4 h-4 bg-sky-500 rounded-full border-2 border-slate-900 top-1" />
                            <div className="flex-1 bg-slate-800 rounded-xl p-4">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <span className="text-xs text-sky-400 font-semibold">Year {m.year}</span>
                                  <h3 className="font-bold text-slate-100">{m.title}</h3>
                                  <p className="text-xs text-slate-400">{m.expected_title}</p>
                                </div>
                                <span className="text-sm font-bold text-emerald-400">${(m.expected_salary_usd / 1000).toFixed(0)}k</span>
                              </div>
                              <p className="text-sm text-slate-300 mb-2">{m.description}</p>
                              <div className="flex flex-wrap gap-1">{m.skills_to_acquire.map(s => <Pill key={s} color="bg-sky-500/10 text-sky-300">{s}</Pill>)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-400 mb-2">🏢 Target Companies</p>
                        <div className="flex flex-wrap gap-2">{careerPath.companies_to_target.map((c: string) => <Pill key={c} color="bg-slate-700 text-slate-300">{c}</Pill>)}</div>
                      </div>
                    </div>
                  ) : <p className="text-slate-500 text-sm text-center py-8">Click Generate to create your personalized 5-year roadmap</p>}
                </div>

                {/* ── Cover Letter ── */}
                <div id="tool-cover" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">✉️ Cover Letter Generator</h2>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <input value={coverLetterForm.job_title} onChange={e => setCoverLetterForm(p => ({ ...p, job_title: e.target.value }))} placeholder="Job Title"
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors" />
                    <input value={coverLetterForm.company_name} onChange={e => setCoverLetterForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Company Name"
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 transition-colors" />
                  </div>
                  <textarea value={coverLetterForm.job_description} onChange={e => setCoverLetterForm(p => ({ ...p, job_description: e.target.value }))} placeholder="Paste job description here (optional but recommended)…" rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none resize-none focus:border-sky-500 transition-colors mb-3" />
                  <button onClick={fetchCoverLetter} disabled={loadingStates.cover}
                    className="w-full py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 rounded-xl text-sm font-bold transition-colors">
                    {loadingStates.cover ? 'Generating…' : '✨ Generate Cover Letter'}
                  </button>
                  {loadingStates.cover ? <LoadingSpinner /> : coverLetter && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400"><strong>Subject:</strong> {coverLetter.subject}</p>
                        <button onClick={copyCoverLetter} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold transition-colors">
                          {copyMsg || '📋 Copy'}
                        </button>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                        <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{coverLetter.cover_letter}</pre>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {coverLetter.key_points_highlighted?.map((p: string, i: number) => <Pill key={i} color="bg-violet-500/10 text-violet-300">✓ {p}</Pill>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}