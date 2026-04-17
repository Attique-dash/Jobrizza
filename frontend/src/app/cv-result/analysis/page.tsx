'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useCV } from '@/contexts/CVContext'
import { motion } from 'framer-motion'

export default function AnalysisTab() {
  const { isDark } = useTheme()
  const { cvData, loading } = useCV()

  if (loading) return (
    <div className={`min-h-[40vh] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!cvData) return <p className="text-slate-500 text-center py-20">No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a></p>

  const ai = cvData.ai_analysis
  const analysis = cvData.analysis

  return (
    <div className="space-y-6">
      {/* ATS Score */}
      {ai?.ats_score && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>ATS Score Analysis</h2>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-violet-400">{ai.ats_score.score}</span>
              <span className={`text-5xl font-black ${isDark ? 'text-slate-600' : 'text-slate-200'}`}>{ai.ats_score.grade}</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">✓ Passed Checks</p>
              {ai.ats_score.passed_checks.map((c: string, i: number) => (
                <p key={i} className={`text-sm py-1.5 border-b ${isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'}`}>{c}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wide mb-3">Format Issues</p>
              {ai.ats_score.format_issues.map((c: string, i: number) => (
                <p key={i} className={`text-sm py-1.5 border-b ${isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'}`}>{c}</p>
              ))}
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mt-4 mb-3">Missing Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {ai.ats_score.missing_keywords.map((k: string, i: number) => (
                  <span key={i} className={`px-2 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mistake Detector */}
      {ai?.mistake_detector && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🔍 Mistake Detector</h2>
            <div className="text-center">
              <p className="text-2xl font-black text-sky-400">{ai.mistake_detector.overall_writing_score}</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Writing Score</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { label: 'Grammar Issues', items: ai.mistake_detector.grammar_errors, color: 'text-rose-400', bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50' },
              { label: 'Weak Action Verbs', items: ai.mistake_detector.weak_action_verbs, color: 'text-amber-400', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
              { label: 'Missing Metrics', items: ai.mistake_detector.missing_metrics, color: 'text-violet-400', bg: isDark ? 'bg-violet-500/10' : 'bg-violet-50' },
              { label: 'Employment Gaps', items: ai.mistake_detector.employment_gaps, color: 'text-sky-400', bg: isDark ? 'bg-sky-500/10' : 'bg-sky-50' },
            ].map(section => (
              <div key={section.label}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${section.color}`}>{section.label}</p>
                {section.items.length > 0
                  ? section.items.map((item: string, i: number) => <p key={i} className={`text-sm ${section.bg} rounded-lg px-3 py-2 mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item}</p>)
                  : <p className={`text-sm italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>None detected ✓</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Suggestion */}
      {ai?.template_suggestion && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>📐 Template Recommendation</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Current Format</p>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{ai.template_suggestion.current_format}</p>
            </div>
            <div className={`rounded-xl p-4 bg-gradient-to-br ${isDark ? 'from-sky-500/20 to-violet-500/20 border border-sky-500/20' : 'from-sky-50 to-blue-50 border border-sky-200'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Recommended</p>
              <p className={`font-bold text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{ai.template_suggestion.recommended_template}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Why this template</p>
              {ai.template_suggestion.reasons.map((r: string, i: number) => (
                <p key={i} className={`text-sm flex items-start gap-2 mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><span className="text-sky-400 mt-0.5">→</span>{r}</p>
              ))}
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Before → After Tips</p>
              {ai.template_suggestion.before_after_tips.map((t: string, i: number) => (
                <p key={i} className={`text-sm flex items-start gap-2 mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><span className="text-emerald-400 mt-0.5">✓</span>{t}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Basic issues/suggestions */}
      {analysis && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`font-bold mb-3 text-rose-400`}>⚠ Issues Found</h3>
            {analysis.mistakes.map((m: string, i: number) => <p key={i} className={`text-sm rounded-lg px-3 py-2 mb-2 ${isDark ? 'bg-rose-500/10 text-slate-300' : 'bg-rose-50 text-rose-700'}`}>{m}</p>)}
          </div>
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`font-bold mb-3 text-sky-400`}>💡 Suggestions</h3>
            {analysis.suggestions.map((s: string, i: number) => <p key={i} className={`text-sm rounded-lg px-3 py-2 mb-2 ${isDark ? 'bg-sky-500/10 text-slate-300' : 'bg-sky-50 text-sky-700'}`}>→ {s}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}