'use client'

import { useTheme } from '@/contexts/Themecontext'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LearningTab() {
  const { isDark } = useTheme()
  const [cvData, setCvData] = useState<any>(null)
  const [learning, setLearning] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [customSkills, setCustomSkills] = useState('')

  useEffect(() => {
    const d = sessionStorage.getItem('cvData')
    if (d) setCvData(JSON.parse(d))
  }, [])

  const fetchLearning = async () => {
    if (!cvData) return
    setLoading(true)
    // Use custom skills if provided, otherwise derive from CV gap (use detected skills as placeholder)
    const skillsToLearn = customSkills.trim()
      ? customSkills.split(',').map(s => s.trim()).filter(Boolean)
      : ['Docker', 'AWS', 'System Design', 'CI/CD', 'Kubernetes']
    try {
      const res = await fetch(`${API}/api/learning-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missing_skills: skillsToLearn }),
      })
      const data = await res.json()
      if (data.success) setLearning(data.learning)
    } finally {
      setLoading(false)
    }
  }

  if (!cvData) return (
    <p className="text-slate-500 text-center py-20">
      No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a>
    </p>
  )

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>📚 Learning Recommendations</h2>
          <button
            onClick={fetchLearning}
            disabled={loading}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? 'Loading…' : learning ? 'Refresh' : 'Get Resources'}
          </button>
        </div>
        <div className="mb-2">
          <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Skills to learn <span className="normal-case font-normal">(comma-separated, or leave blank for defaults)</span>
          </label>
          <input
            value={customSkills}
            onChange={e => setCustomSkills(e.target.value)}
            placeholder="e.g. AWS, Kubernetes, TypeScript, System Design"
            className={`w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all
              ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
          />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Finding the best learning resources…</p>
        </div>
      )}

      {learning && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary */}
          <div className={`flex items-center gap-6 rounded-2xl border p-5 ${isDark ? 'bg-gradient-to-br from-sky-500/10 to-violet-500/10 border-sky-500/20' : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'}`}>
            <div className="text-center">
              <p className="text-3xl font-black text-sky-400">{learning.learning_path_weeks}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>weeks total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{learning.total_free_hours}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>free hours</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-violet-400">{learning.recommendations?.length ?? 0}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>skills</p>
            </div>
          </div>

          {/* Recommendations */}
          {learning.recommendations?.map((rec: any, i: number) => (
            <div key={rec.skill} className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{rec.skill}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                      ${rec.priority === 'Critical' ? isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
                        : rec.priority === 'Important' ? isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                        : isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    ~{rec.estimated_hours} hours to complete
                  </p>
                </div>
                <div className={`text-xs text-center px-3 py-1.5 rounded-xl ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  Milestone:<br />
                  <span className={`font-medium text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {rec.milestone}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {rec.resources?.map((resource: any) => (
                  <a
                    key={resource.title}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all group
                      ${isDark
                        ? 'bg-slate-800 border-slate-700 hover:border-sky-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isDark ? 'text-slate-200 group-hover:text-sky-400' : 'text-slate-800 group-hover:text-sky-600'}`}>
                        {resource.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{resource.platform}</span>
                        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{resource.duration}</span>
                        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                        <span className="text-xs">⭐ {resource.rating}</span>
                      </div>
                    </div>
                    <span className={`ml-3 flex-shrink-0 text-xs px-2 py-1 rounded-full font-semibold
                      ${resource.free
                        ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      }`}>
                      {resource.free ? 'Free' : 'Paid'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {!learning && !loading && (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-5xl mb-4">📚</div>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Click "Get Resources" to find curated learning materials
          </p>
        </div>
      )}
    </div>
  )
}