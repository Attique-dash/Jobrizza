'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface CVAnalysis {
  score: number
  max_score: number
  percentage: number
  status: string
  status_message: string
  categories: {
    contact_info: { score: number; max: number; issues: string[] }
    structure: { score: number; max: number; issues: string[] }
    content: { score: number; max: number; issues: string[] }
    skills: { score: number; max: number; issues: string[] }
    grammar_style: { score: number; max: number; issues: string[] }
  }
  mistakes: string[]
  suggestions: string[]
  word_count: number
  skills_count: number
}

interface CVData {
  filename: string
  name: string | null
  email: string | null
  phone: string | null
  skills: string[]
  education: string[]
  experience: string[]
  raw_text: string
  analysis?: CVAnalysis
}

interface ImprovedCV {
  name: string
  email: string
  phone: string
  professional_summary: string
  skills: string[]
  education: string[]
  experience: string[]
  improvements_made: string[]
}

export default function CVResultPage() {
  const router = useRouter()
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'analysis' | 'improved'>('analysis')
  const [improvedCV, setImprovedCV] = useState<ImprovedCV | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('cvData')
    if (stored) {
      setCvData(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const handleImproveCV = async () => {
    if (!cvData) return
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:5000/api/improve-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_data: cvData })
      })

      if (!response.ok) {
        throw new Error('Failed to generate improved CV')
      }

      const result = await response.json()
      if (result.success) {
        setImprovedCV(result.improved_cv)
        setActiveTab('improved')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve CV')
    } finally {
      setGenerating(false)
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 85) return 'from-emerald-500 to-green-500'
    if (percentage >= 70) return 'from-sky-500 to-blue-500'
    if (percentage >= 50) return 'from-amber-500 to-yellow-500'
    return 'from-rose-500 to-red-500'
  }

  const getScoreTextColor = (percentage: number) => {
    if (percentage >= 85) return 'text-emerald-600'
    if (percentage >= 70) return 'text-sky-600'
    if (percentage >= 50) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Excellent': return '🌟'
      case 'Good': return '✅'
      case 'Average': return '⚠️'
      default: return '🔧'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!cvData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">No CV Data Found</h1>
          <p className="text-slate-600 mb-6">Please upload a CV first to see the extracted data.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-sky-500 hover:to-blue-500 transition-all"
          >
            ← Go Back to Upload
          </Link>
        </div>
      </div>
    )
  }

  const analysis = cvData.analysis
  const percentage = analysis?.percentage || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">CV Analysis Result</h1>
            <p className="text-slate-600 mt-1">Extracted data from <span className="font-medium text-sky-700">{cvData.filename}</span></p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            ← Upload Another CV
          </Link>
        </div>

        {/* CV Score Card */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
          >
            <div className={`bg-gradient-to-r ${getScoreColor(percentage)} px-6 py-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                    <span className="text-4xl">{getStatusIcon(analysis.status)}</span>
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">{analysis.status}</h2>
                    <p className="text-white/90">{analysis.status_message}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">{percentage}%</div>
                  <p className="text-sm text-white/80 mt-1">CV Quality Score</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Category Scores */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                {Object.entries(analysis.categories).map(([key, cat]) => (
                  <div key={key} className="text-center">
                    <div className="relative h-24 w-full bg-slate-100 rounded-xl overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(cat.score / cat.max) * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getScoreColor((cat.score / cat.max) * 100)}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-700">{cat.score}/{cat.max}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 capitalize">{key.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {percentage < 85 && (
                  <button
                    onClick={handleImproveCV}
                    disabled={generating}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Improving...
                      </>
                    ) : (
                      <>
                        ✨ Generate Professional CV
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'analysis'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📊 View Analysis
                </button>
                {improvedCV && (
                  <button
                    onClick={() => setActiveTab('improved')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'improved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                    }`}
                  >
                    🌟 View Improved CV
                  </button>
                )}
              </div>

              {error && (
                <p className="mt-4 text-rose-600 text-sm">{error}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' && analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Mistakes & Suggestions */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Mistakes Found */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-rose-500">⚠️</span> Areas to Improve
                  </h3>
                  {analysis.mistakes.length > 0 && analysis.mistakes[0] !== 'No major issues found' ? (
                    <ul className="space-y-3">
                      {analysis.mistakes.map((mistake, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg"
                        >
                          <span className="text-rose-500 mt-0.5">•</span>
                          <span className="text-slate-700 text-sm">{mistake}</span>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 bg-emerald-50 rounded-xl">
                      <span className="text-4xl mb-2">🎉</span>
                      <p className="text-emerald-700 font-medium">No major issues found!</p>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-sky-500">💡</span> Improvement Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {analysis.suggestions.map((suggestion, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-sky-50 rounded-lg"
                      >
                        <span className="text-sky-500 mt-0.5">→</span>
                        <span className="text-slate-700 text-sm">{suggestion}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Original CV Data */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">📄 Original CV Data</h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
                      <p className="text-lg font-semibold text-slate-800 mt-1">{cvData.name || 'Not detected'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</label>
                      <p className="text-lg font-semibold text-slate-800 mt-1">{cvData.email || 'Not detected'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</label>
                      <p className="text-lg font-semibold text-slate-800 mt-1">{cvData.phone || 'Not detected'}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">🎯 Detected Skills ({analysis.skills_count})</h4>
                    {cvData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cvData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No skills detected</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">🎓 Education</h4>
                    {cvData.education.length > 0 ? (
                      <ul className="space-y-2">
                        {cvData.education.map((edu, idx) => (
                          <li key={idx} className="bg-slate-50 rounded-lg p-3 text-slate-700 text-sm">
                            {edu}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm">No education detected</p>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">💼 Experience</h4>
                    {cvData.experience.length > 0 ? (
                      <ul className="space-y-2">
                        {cvData.experience.map((exp, idx) => (
                          <li key={idx} className="bg-slate-50 rounded-lg p-3 text-slate-700 text-sm">
                            {exp}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm">No experience detected</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'improved' && improvedCV && (
            <motion.div
              key="improved"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">🌟 Professional CV</h2>
                  <span className="text-white/90 text-sm">AI-Enhanced Version</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Improvements Made */}
                <div className="bg-emerald-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-3">✅ Improvements Made</h3>
                  <ul className="space-y-2">
                    {improvedCV.improvements_made.map((improvement, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-emerald-700 text-sm">
                        <span>✓</span> {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
                    <p className="text-lg font-semibold text-slate-800 mt-1">{improvedCV.name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</label>
                    <p className="text-lg font-semibold text-slate-800 mt-1">{improvedCV.email}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</label>
                    <p className="text-lg font-semibold text-slate-800 mt-1">{improvedCV.phone}</p>
                  </div>
                </div>

                {/* Professional Summary */}
                {improvedCV.professional_summary && improvedCV.professional_summary !== 'Professional summary preserved from original CV' && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">📝 Professional Summary</h4>
                    <p className="bg-sky-50 rounded-lg p-4 text-slate-700 text-sm leading-relaxed">
                      {improvedCV.professional_summary}
                    </p>
                  </div>
                )}

                {/* Enhanced Skills */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">🎯 Enhanced Skills ({improvedCV.skills.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {improvedCV.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          cvData.skills.includes(skill)
                            ? 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700'
                            : 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700'
                        }`}
                        title={cvData.skills.includes(skill) ? 'Original skill' : 'Added skill'}
                      >
                        {skill} {!cvData.skills.includes(skill) && '✨'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">🎓 Education</h4>
                  <ul className="space-y-2">
                    {improvedCV.education.map((edu, idx) => (
                      <li key={idx} className="bg-slate-50 rounded-lg p-3 text-slate-700 text-sm">
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Experience */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">💼 Experience</h4>
                  <ul className="space-y-2">
                    {improvedCV.experience.map((exp, idx) => (
                      <li key={idx} className="bg-slate-50 rounded-lg p-3 text-slate-700 text-sm">
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-sky-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            ← Upload Another CV
          </Link>
        </div>
      </div>
    </div>
  )
}
