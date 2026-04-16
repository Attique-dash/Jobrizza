'use client'

import { useTheme } from '@/contexts/Themecontext'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function CareerPathTab() {
  const { isDark } = useTheme()
  const [cvData, setCvData] = useState<any>(null)
  const [targetRole, setTargetRole] = useState('')
  const [careerPath, setCareerPath] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const d = sessionStorage.getItem('cvData')
    if (d) setCvData(JSON.parse(d))
  }, [])

  const fetchCareerPath = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/career-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_data: cvData, target_role: targetRole }),
      })
      const data = await res.json()
      if (data.success) setCareerPath(data.career_path)
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
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🗺️ AI Career Roadmap</h2>
          <div className="flex gap-2">
            <input
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="Target role (e.g. CTO)"
              className={`rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all w-52
                ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
            />
            <button
              onClick={fetchCareerPath}
              disabled={loading}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Generating…' : careerPath ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Building your 5-year career roadmap…</p>
          </div>
        )}

        {careerPath && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className={`rounded-2xl p-5 border ${isDark ? 'bg-gradient-to-br from-sky-500/10 to-violet-500/10 border-sky-500/20' : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Target Role</p>
                  <h3 className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{careerPath.target_role}</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Starting as: <span className="font-semibold">{careerPath.current_level}</span> level
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-black text-sky-400`}>{careerPath.timeline_years}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>year roadmap</p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>📅 Year-by-Year Milestones</h3>
              <div className="relative">
                <div className={`absolute left-5 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className="space-y-6">
                  {careerPath.milestones.map((m: any, i: number) => (
                    <div key={m.year} className="relative flex gap-4">
                      <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0
                        ${i === 0 ? 'bg-sky-500 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                        Y{m.year}
                      </div>
                      <div className={`flex-1 rounded-xl p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{m.title}</h4>
                          <span className={`text-xs font-semibold flex-shrink-0 text-emerald-400`}>
                            ${(m.expected_salary_usd / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <p className={`text-xs mb-2 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{m.expected_title}</p>
                        <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.skills_to_acquire.map((s: string) => (
                            <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
                              + {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alternative Paths */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🔀 Alternative Paths</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {careerPath.alternative_paths.map((path: any) => (
                  <div key={path.path} className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`font-semibold mb-1 text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{path.path}</h4>
                    <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{path.description}</p>
                    <div className="space-y-1">
                      {path.pros.map((p: string) => <p key={p} className="text-xs text-emerald-400">✓ {p}</p>)}
                      {path.cons.map((c: string) => <p key={c} className="text-xs text-rose-400">✗ {c}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Companies */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🏢 Companies to Target</h3>
              <div className="flex flex-wrap gap-2">
                {careerPath.companies_to_target.map((company: string) => (
                  <span key={company} className={`px-3 py-1.5 rounded-full text-sm font-medium border
                    ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200 shadow-sm'}`}>
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!careerPath && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🗺️</div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Click Generate to create your personalized 5-year career roadmap
            </p>
          </div>
        )}
      </div>
    </div>
  )
}