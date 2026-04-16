'use client'

import { useTheme } from '@/contexts/Themecontext'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function CoverLetterTab() {
  const { isDark } = useTheme()
  const [cvData, setCvData] = useState<any>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [coverLetter, setCoverLetter] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const d = sessionStorage.getItem('cvData')
    if (d) setCvData(JSON.parse(d))
  }, [])

  const generate = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_data: cvData, job_title: jobTitle, company_name: companyName, job_description: jobDescription }),
      })
      const data = await res.json()
      if (data.success) setCoverLetter(data.cover_letter)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (coverLetter?.cover_letter) {
      navigator.clipboard.writeText(coverLetter.cover_letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!cvData) return (
    <p className="text-slate-500 text-center py-20">
      No CV data. <a href="/" className="text-sky-400 underline">Upload a CV</a>
    </p>
  )

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className={`text-xl font-bold mb-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>✉️ AI Cover Letter Generator</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Job Title</label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className={`w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all
                ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Company Name</label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Google"
              className={`w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all
                ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Job Description <span className={`normal-case font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(optional — paste key requirements)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the job description or key requirements here…"
            rows={4}
            className={`w-full rounded-xl px-3 py-2.5 text-sm border outline-none resize-none focus:ring-2 focus:ring-sky-500 transition-all
              ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
          />
        </div>
        <button
          onClick={generate}
          disabled={loading || (!jobTitle && !companyName)}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? 'Generating…' : coverLetter ? 'Regenerate' : 'Generate Cover Letter'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Writing your cover letter with AI…</p>
        </div>
      )}

      {coverLetter && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Meta info */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{coverLetter.subject}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
                    {coverLetter.tone}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ~{coverLetter.word_count} words
                  </span>
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors
                  ${copied
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {copied ? '✓ Copied!' : 'Copy Text'}
              </button>
            </div>

            {/* Key points */}
            <div className="mb-4">
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Key Points Highlighted</p>
              <div className="flex flex-wrap gap-2">
                {coverLetter.key_points_highlighted.map((p: string) => (
                  <span key={p} className={`text-xs px-2.5 py-1 rounded-full border
                    ${isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Letter */}
            <div className={`rounded-xl p-5 whitespace-pre-wrap text-sm leading-relaxed font-mono
              ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
              {coverLetter.cover_letter}
            </div>
          </div>
        </motion.div>
      )}

      {!coverLetter && !loading && (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-5xl mb-4">✉️</div>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Fill in the job details above and generate a tailored cover letter
          </p>
        </div>
      )}
    </div>
  )
}