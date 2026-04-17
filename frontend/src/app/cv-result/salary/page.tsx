'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useCV } from '@/contexts/CVContext'
import { fetchWithAuth } from '@/lib/api'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function SalaryTab() {
  const { isDark } = useTheme()
  const { cvData } = useCV()
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchSalary = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/salary-estimate', {
        method: 'POST',
        body: JSON.stringify({ cv_data: cvData, location }),
      })
      const data = await res.json()
      if (data.success) setSalary(data.salary)
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
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>💰 Salary Estimator</h2>
          <div className="flex gap-2">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location (e.g. Remote, London)"
              className={`rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all w-56
                ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
            />
            <button
              onClick={fetchSalary}
              disabled={loading}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Estimating…' : salary ? 'Refresh' : 'Estimate'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estimating salary ranges…</p>
          </div>
        )}

        {salary && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Current estimate */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Min', value: salary.current_estimate.min, color: 'text-amber-400' },
                { label: 'Median', value: salary.current_estimate.median, color: 'text-sky-400' },
                { label: 'Max', value: salary.current_estimate.max, color: 'text-emerald-400' },
              ].map(item => (
                <div key={item.label} className={`rounded-2xl p-5 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-3xl font-black ${item.color}`}>
                    {salary.current_estimate.currency} {(item.value / 1000).toFixed(0)}k
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* Upskilling potential */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gradient-to-br from-sky-500/10 to-violet-500/10 border-sky-500/20' : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'}`}>
              <h3 className={`font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🚀 Potential with Upskilling</h3>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-2xl font-black text-emerald-400`}>
                    {salary.current_estimate.currency} {(salary.potential_with_upskilling.median / 1000).toFixed(0)}k
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>median potential</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    +{Math.round(((salary.potential_with_upskilling.median - salary.current_estimate.median) / salary.current_estimate.median) * 100)}% increase
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>by adding key skills</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {salary.potential_with_upskilling.skills_to_add.map((s: string) => (
                  <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-semibold border
                    ${isDark ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                    + {s}
                  </span>
                ))}
              </div>
            </div>

            {/* By location */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🌍 Salary by Location</h3>
              <div className="space-y-3">
                {salary.by_location.map((loc: any) => (
                  <div key={loc.city} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{loc.city}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {loc.currency} {(loc.min / 1000).toFixed(0)}k – {(loc.max / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry comparison */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🏢 Industry Comparison</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(salary.industry_comparison).map(([industry, delta]) => (
                  <div key={industry} className={`flex items-center justify-between rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <span className={`text-sm capitalize font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {industry.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-bold ${String(delta).startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {String(delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Negotiation tips */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>💡 Negotiation Tips</h3>
              {salary.negotiation_tips.map((tip: string, i: number) => (
                <p key={i} className={`text-sm py-2 border-b flex items-start gap-2 ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                  <span className="text-sky-400 flex-shrink-0 mt-0.5">→</span>{tip}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {!salary && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💰</div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Click Estimate to get your salary range based on your CV skills
            </p>
          </div>
        )}
      </div>
    </div>
  )
}