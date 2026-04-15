'use client'

import { useTheme } from '@/contexts/Themecontext'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function InterviewTab() {
  const { isDark } = useTheme()
  const [cvData, setCvData] = useState<any>(null)
  const [targetRole, setTargetRole] = useState('')
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    const d = sessionStorage.getItem('cvData')
    if (d) setCvData(JSON.parse(d))
  }, [])

  const generate = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/mock-interview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData, target_role: targetRole }) })
      const data = await res.json()
      if (data.success) setInterview(data.interview)
    } finally { setLoading(false) }
  }

  if (!cvData) return <p className="text-slate-500 text-center py-20">No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a></p>

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🎤 AI Mock Interview</h2>
          <div className="flex gap-2">
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Target role"
              className={`rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all w-48
                ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`} />
            <button onClick={generate} disabled={loading}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Generating…' : interview ? 'Regenerate' : 'Start'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Generating interview questions…</p>
          </div>
        )}

        {interview && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Role: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{interview.role}</span></p>

            {/* Question selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {interview.questions.map((q: any, i: number) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`flex-shrink-0 h-9 w-9 rounded-xl text-sm font-bold transition-all
                    ${i === current ? 'bg-sky-500 text-white' : answers[q.id] ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200' : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Current question */}
            {(() => {
              const q = interview.questions[current]
              return q ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {[q.type, q.difficulty].map((tag: string) => (
                      <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-semibold
                        ${tag === 'Technical' ? isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700'
                        : tag === 'Hard' ? isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
                        : isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>{tag}</span>
                    ))}
                  </div>
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{q.question}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${isDark ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-200'}`}>
                    <p className="text-xs font-bold text-sky-400 mb-1">💡 Hint</p>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{q.hint}</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{q.sample_answer_structure}</p>
                  </div>
                  <textarea value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Type your answer here…" rows={5}
                    className={`w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none focus:ring-2 focus:ring-sky-500 transition-all
                      ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-sm'}`} />
                  <div className="flex justify-between">
                    <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-30 ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>← Prev</button>
                    <button onClick={() => setCurrent(p => Math.min(interview.questions.length - 1, p + 1))} disabled={current === interview.questions.length - 1}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-30 text-white transition-colors">Next →</button>
                  </div>
                </div>
              ) : null
            })()}

            {/* Tips */}
            <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pro Tips</p>
              {interview.tips.map((t: string, i: number) => (
                <p key={i} className={`text-sm py-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>• {t}</p>
              ))}
            </div>
          </motion.div>
        )}

        {!interview && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎤</div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Click Start to generate AI-powered interview questions based on your CV</p>
          </div>
        )}
      </div>
    </div>
  )
}