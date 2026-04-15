'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'
import { Header } from '@/components/layout/navbar'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CVData {
  filename: string; name: string | null; email: string | null; phone: string | null
  skills: string[]; education: string[]; experience: string[]; raw_text: string; word_count?: number
  analysis?: CVAnalysis; ai_analysis?: AIAnalysis
}
interface CVAnalysis {
  score: number; max_score: number; percentage: number; status: string; status_message: string
  categories: Record<string, { score: number; max: number; issues: string[] }>
  mistakes: string[]; suggestions: string[]; word_count: number; skills_count: number
}
interface AIAnalysis {
  ats_score: { score: number; grade: string; keyword_density: string; format_issues: string[]; missing_keywords: string[]; passed_checks: string[] }
  mistake_detector: { grammar_errors: string[]; employment_gaps: string[]; weak_action_verbs: string[]; missing_metrics: string[]; overall_writing_score: number }
  template_suggestion: { current_format: string; recommended_template: string; reasons: string[]; before_after_tips: string[] }
}

function ScoreRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 1.5, ease: 'easeOut' }}
        strokeLinecap="round" />
    </svg>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊', desc: 'CV quality score & summary' },
  { id: 'analysis', label: 'Analysis', icon: '🔍', desc: 'ATS score, mistakes & fixes' },
  { id: 'skills', label: 'Skill Gap', icon: '⚡', desc: 'Missing skills & market demand' },
  { id: 'jobs', label: 'Jobs', icon: '💼', desc: 'Matched job opportunities' },
  { id: 'learning', label: 'Learning', icon: '📚', desc: 'Courses & resources' },
  { id: 'interview', label: 'Interview', icon: '🎤', desc: 'Mock interview prep' },
  { id: 'salary', label: 'Salary', icon: '💰', desc: 'Salary benchmarking' },
  { id: 'career', label: 'Career Path', icon: '🗺️', desc: '5-year roadmap' },
  { id: 'cover', label: 'Cover Letter', icon: '✉️', desc: 'AI cover letter generator' },
]

export default function CVResultPage() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login?redirect=/cv-result'); return }
    const stored = sessionStorage.getItem('cvData')
    if (stored) setCvData(JSON.parse(stored))
    setLoading(false)
  }, [isAuthenticated, router])

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!cvData) return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <Header />
      <div className="text-6xl">📄</div>
      <h1 className="text-3xl font-bold">No CV Data Found</h1>
      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Upload a CV first to see your analysis.</p>
      <Link href="/" className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold transition-colors">← Upload CV</Link>
    </div>
  )

  const pct = cvData.analysis?.percentage ?? 0
  const atsScore = cvData.ai_analysis?.ats_score?.score ?? 0

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header />

      {/* ── Summary header ── */}
      <div className={`border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-sky-500/20' : 'bg-sky-50'}`}>
                  <span>📄</span>
                </div>
                <p className={`font-semibold truncate max-w-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cvData.filename}</p>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>CV Analysis Complete</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'CV Score', value: `${pct}%`, color: pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-sky-400' : 'text-amber-400' },
                { label: 'ATS Score', value: `${atsScore}%`, color: 'text-violet-400' },
                { label: 'Skills', value: cvData.skills.length, color: 'text-cyan-400' },
                { label: 'Words', value: cvData.word_count ?? '—', color: 'text-rose-400' },
              ].map(card => (
                <div key={card.label} className={`text-center rounded-xl px-3 py-2 border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Select a section to explore
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {TABS.map((tab, i) => (
            <motion.div key={tab.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}>
              <Link href={`/cv-result/${tab.id}`}
                className={`flex flex-col items-start gap-3 rounded-2xl p-5 border transition-all group hover:-translate-y-1
                  ${isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800'
                    : 'bg-white border-slate-200 hover:border-sky-300 shadow-sm hover:shadow-md'
                  }`}>
                <span className="text-3xl transition-transform group-hover:scale-110">{tab.icon}</span>
                <div>
                  <p className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{tab.label}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{tab.desc}</p>
                </div>
                <div className={`text-xs font-semibold flex items-center gap-1 mt-auto
                  ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                  View details <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick overview inline */}
        {cvData.analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className={`mt-8 rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`font-bold text-lg mb-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Quick Summary</h3>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Score ring */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <ScoreRing pct={pct} size={140} stroke={12} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">{pct}</span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/100</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{cvData.analysis.status}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cvData.analysis.status_message}</p>
                </div>
              </div>
              {/* Issues */}
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wide mb-3">Issues Found</p>
                <div className="space-y-2">
                  {cvData.analysis.mistakes.slice(0, 4).map((m, i) => (
                    <p key={i} className={`text-sm rounded-lg px-3 py-2 ${isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>{m}</p>
                  ))}
                </div>
              </div>
              {/* Suggestions */}
              <div>
                <p className="text-xs font-bold text-sky-400 uppercase tracking-wide mb-3">Top Suggestions</p>
                <div className="space-y-2">
                  {cvData.analysis.suggestions.slice(0, 4).map((s, i) => (
                    <p key={i} className={`text-sm rounded-lg px-3 py-2 ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>→ {s}</p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}