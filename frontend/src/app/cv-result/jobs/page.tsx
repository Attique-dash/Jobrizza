'use client'

import { useTheme } from '@/contexts/Themecontext'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function JobsTab() {
  const { isDark } = useTheme()
  const [cvData, setCvData] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const d = sessionStorage.getItem('cvData')
    if (d) setCvData(JSON.parse(d))
  }, [])

  const fetchJobs = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/job-matches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_data: cvData }) })
      const data = await res.json()
      if (data.success) setJobs(data.jobs)
    } finally { setLoading(false) }
  }

  if (!cvData) return <p className="text-slate-500 text-center py-20">No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a></p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>💼 Job Matches</h2>
        <button onClick={fetchJobs} disabled={loading}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? 'Finding…' : jobs.length ? 'Refresh' : 'Find Jobs'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Finding matching jobs…</p>
        </div>
      )}

      {!loading && jobs.length > 0 && jobs.sort((a, b) => b.match_score - a.match_score).map((job, i) => (
        <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <div
            onClick={() => setSelected(selected === job.id ? null : job.id)}
            className={`rounded-2xl border cursor-pointer transition-all p-5
              ${isDark
                ? 'bg-slate-900 border-slate-800 hover:border-slate-600'
                : 'bg-white border-slate-200 hover:border-sky-200 shadow-sm hover:shadow-md'
              }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{job.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${job.type === 'Remote' ? isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{job.type}</span>
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{job.company} · {job.location}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{job.company_size} employees · {job.posted_days_ago}d ago</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-2xl font-black ${job.match_score >= 85 ? 'text-emerald-400' : job.match_score >= 70 ? 'text-sky-400' : 'text-amber-400'}`}>
                  {job.match_score}%
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{job.currency} {(job.salary_min/1000).toFixed(0)}k–{(job.salary_max/1000).toFixed(0)}k</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills_matched.map((s: string) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>{s}</span>
              ))}
              {job.skills_missing.map((s: string) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium line-through opacity-50 ${isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'}`}>{s}</span>
              ))}
            </div>

            <AnimatePresence>
              {selected === job.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className={`border-t mt-4 pt-4 space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Why you match:</p>
                    {job.match_reasons.map((r: string, i: number) => (
                      <p key={i} className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>✓ {r}</p>
                    ))}
                    <div className="flex gap-3 mt-4">
                      <button className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                        ${isDark ? 'border-violet-500/30 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20' : 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100'}`}>
                        ✉ Cover Letter
                      </button>
                      <button className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
                        ${isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30' : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'}`}>
                        Apply Now →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      {!loading && jobs.length === 0 && (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-5xl mb-4">💼</div>
          <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Click "Find Jobs" to discover matching opportunities</p>
        </div>
      )}
    </div>
  )
}