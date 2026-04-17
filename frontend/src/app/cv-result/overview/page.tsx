'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useCV } from '@/contexts/CVContext'
import { motion } from 'framer-motion'

function ScoreRing({ pct, size = 160, stroke = 12 }: { pct: number; size?: number; stroke?: number }) {
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

export default function OverviewTab() {
  const { isDark } = useTheme()
  const { cvData, loading } = useCV()

  if (loading) return (
    <div className={`min-h-[40vh] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!cvData) return <p className="text-slate-500 text-center py-20">No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a></p>

  const analysis = cvData.analysis
  const pct = analysis?.percentage ?? 0

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score card */}
        <div className={`rounded-2xl border p-6 flex flex-col items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className={`text-lg font-bold self-start ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Overall CV Score</h2>
          <div className="relative">
            <ScoreRing pct={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{pct}</span>
              <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ 100</span>
            </div>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{analysis?.status}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{analysis?.status_message}</p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Category Breakdown</h2>
          <div className="space-y-4">
            {analysis && Object.entries(analysis.categories).map(([key, cat]: [string, any]) => {
              const p = Math.round((cat.score / cat.max) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={`capitalize ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{key.replace(/_/g, ' ')}</span>
                    <span className={`font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{cat.score}/{cat.max}</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                      initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1, delay: 0.1 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Extracted info */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Extracted Information</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          {[{ label: 'Name', val: cvData.name }, { label: 'Email', val: cvData.email }, { label: 'Phone', val: cvData.phone }].map(f => (
            <div key={f.label} className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{f.label}</p>
              <p className={`font-semibold truncate mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{f.val || 'Not detected'}</p>
            </div>
          ))}
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Detected Skills ({cvData.skills.length})</p>
          <div className="flex flex-wrap gap-2">
            {cvData.skills.map((s: string) => (
              <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}