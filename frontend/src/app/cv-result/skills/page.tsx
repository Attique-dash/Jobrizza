'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useCV } from '@/contexts/CVContext'
import { fetchWithAuth } from '@/lib/api'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function SkillGapTab() {
  const { isDark } = useTheme()
  const { cvData } = useCV()
  const [targetRole, setTargetRole] = useState('')
  const [skillGap, setSkillGap] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/skill-gap', { method: 'POST', body: JSON.stringify({ cv_data: cvData, target_role: targetRole }) })
      const data = await res.json()
      if (data.success) setSkillGap(data.skill_gap)
    } finally { setLoading(false) }
  }

  const Pill = ({ text, color }: { text: string; color: string }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>{text}</span>
  )

  if (!cvData) return <p className="text-slate-500 text-center py-20">No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a></p>

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>⚡ Skill Gap Analysis</h2>
        <div className="flex gap-3">
          <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
            placeholder="Target role (e.g. Senior Backend Engineer)"
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all
              ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`} />
          <button onClick={analyze} disabled={loading}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analyzing skill gaps with AI…</p>
        </div>
      )}

      {skillGap && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{skillGap.target_role}</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Skill gap analysis results</p>
              </div>
              <div className="text-center">
                <p className={`text-5xl font-black ${skillGap.match_percentage >= 70 ? 'text-emerald-400' : skillGap.match_percentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {skillGap.match_percentage}%
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Match</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">✓ Strong Skills</p>
                <div className="flex flex-wrap gap-1.5">{skillGap.strong_skills.map((s: string) => <Pill key={s} text={s} color={isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} />)}</div>
              </div>
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wide mb-3">✗ Critical Gaps</p>
                <div className="flex flex-wrap gap-1.5">{skillGap.missing_critical.map((s: string) => <Pill key={s} text={s} color={isDark ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'} />)}</div>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-3">⊕ Nice to Have</p>
                <div className="flex flex-wrap gap-1.5">{skillGap.missing_nice_to_have.map((s: string) => <Pill key={s} text={s} color={isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'} />)}</div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>📈 Market Trends</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-emerald-400 mb-2">Trending Up ↑</p>
                  <div className="flex flex-wrap gap-1.5">{skillGap.market_demand.trending_up.map((s: string) => <Pill key={s} text={s} color={isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} />)}</div>
                </div>
                <div>
                  <p className="text-xs text-rose-400 mb-2">Trending Down ↓</p>
                  <div className="flex flex-wrap gap-1.5">{skillGap.market_demand.trending_down.map((s: string) => <Pill key={s} text={s} color={isDark ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'} />)}</div>
                </div>
                <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>💰 {skillGap.market_demand.salary_impact}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>⚡ Quick Wins (under 2 weeks)</h3>
              {skillGap.quick_wins.map((s: string, i: number) => (
                <div key={i} className={`flex items-center gap-3 py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <span className="h-5 w-5 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{i + 1}</span>
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {!skillGap && !loading && (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-5xl mb-4">⚡</div>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter your target role above and click Analyze</p>
        </div>
      )}
    </div>
  )
}