'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import {
  LinkIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  CheckCircleIcon,
  LightBulbIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface LinkedInSuggestion {
  current: string
  suggested: string
  tips: string
}

interface LinkedInOptimization {
  headline: LinkedInSuggestion
  summary: LinkedInSuggestion
  experience: {
    tips: string
    improvements: string[]
  }
  skills: {
    current: string[]
    suggested_additions: string[]
  }
  overall_score: number
  priority_actions: string[]
}

interface OptimizationHistory {
  id: string
  linkedin_url: string
  overall_score: number
  created_at: string
  suggestions: LinkedInOptimization
}

export default function LinkedInOptimizerPage() {
  const { isDark } = useTheme()
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [profileText, setProfileText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LinkedInOptimization | null>(null)
  const [history, setHistory] = useState<OptimizationHistory[]>([])
  const [expandedSections, setExpandedSections] = useState<string[]>(['headline'])
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/linkedin/optimizations')
      const data = await res.json()
      if (data.success) {
        setHistory(data.optimizations || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!linkedinUrl.trim() && !profileText.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/linkedin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedin_url: linkedinUrl,
          profile_text: profileText,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setResult(data.suggestions)
        fetchHistory()
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/linkedin/optimizations/${id}`)
      const data = await res.json()
      if (data.success) {
        setResult(data.optimization.suggestions)
        setLinkedinUrl(data.optimization.linkedin_url)
        setSelectedHistory(id)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/linkedin/optimizations/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setHistory(history.filter(h => h.id !== id))
        if (selectedHistory === id) {
          setResult(null)
          setSelectedHistory(null)
          setLinkedinUrl('')
          setProfileText('')
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            LinkedIn Profile Optimizer
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Get AI-powered suggestions to improve your LinkedIn headline, summary, and experience
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* URL Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/20' : 'bg-sky-100'}`}>
                  <LinkIcon className={`h-5 w-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                </div>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  LinkedIn Profile URL
                </h2>
              </div>

              <input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                  ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                  }`}
              />
            </motion.div>

            {/* Profile Text Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                  <DocumentTextIcon className={`h-5 w-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                </div>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Or paste your profile content
                </h2>
              </div>

              <textarea
                placeholder="Paste your LinkedIn headline, summary, and experience here..."
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={8}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors resize-none
                  ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-500'
                  }`}
              />

              <button
                onClick={handleAnalyze}
                disabled={loading || (!linkedinUrl.trim() && !profileText.trim())}
                className={`mt-4 w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                  ${loading || (!linkedinUrl.trim() && !profileText.trim())
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                  }
                  ${isDark
                    ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white'
                    : 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/25'
                  }`}
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Get AI Suggestions
                  </>
                )}
              </button>
            </motion.div>

            {/* Results Section */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
                >
                  {/* Overall Score */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-20 w-20 rounded-full flex items-center justify-center border-4 ${getScoreColor(result.overall_score)}`}>
                        <span className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
                          {result.overall_score}
                        </span>
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Profile Score
                        </h3>
                        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          {result.overall_score >= 80 ? 'Excellent profile!' : result.overall_score >= 60 ? 'Good, but can improve' : 'Needs improvement'}
                        </p>
                      </div>
                    </div>
                    <div className={`h-2 w-32 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full rounded-full ${getScoreBg(result.overall_score)}`}
                        style={{ width: `${result.overall_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Collapsible Sections */}
                  <div className="space-y-4">
                    {/* Headline */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        onClick={() => toggleSection('headline')}
                        className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors
                          ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <StarIcon className={`h-5 w-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Headline</span>
                        </div>
                        {expandedSections.includes('headline') ? (
                          <ChevronUpIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        ) : (
                          <ChevronDownIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.includes('headline') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Current</p>
                              <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{result.headline.current}</p>
                            </div>
                            <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                              <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Suggested</p>
                              <p className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>{result.headline.suggested}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <LightBulbIcon className={`h-4 w-4 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{result.headline.tips}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Summary */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        onClick={() => toggleSection('summary')}
                        className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors
                          ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className={`h-5 w-5 ${isDark ? 'text-sky-400' : 'text-sky-500'}`} />
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>About / Summary</span>
                        </div>
                        {expandedSections.includes('summary') ? (
                          <ChevronUpIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        ) : (
                          <ChevronDownIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.includes('summary') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Current</p>
                              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{result.summary.current}</p>
                            </div>
                            <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                              <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Suggested</p>
                              <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{result.summary.suggested}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <LightBulbIcon className={`h-4 w-4 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{result.summary.tips}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Experience */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        onClick={() => toggleSection('experience')}
                        className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors
                          ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <BriefcaseIcon className={`h-5 w-5 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Experience</span>
                        </div>
                        {expandedSections.includes('experience') ? (
                          <ChevronUpIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        ) : (
                          <ChevronDownIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.includes('experience') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <LightBulbIcon className={`h-4 w-4 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{result.experience.tips}</p>
                            </div>
                            <ul className="space-y-2">
                              {result.experience.improvements.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircleIcon className={`h-4 w-4 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Skills */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        onClick={() => toggleSection('skills')}
                        className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors
                          ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <AcademicCapIcon className={`h-5 w-5 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Skills</span>
                        </div>
                        {expandedSections.includes('skills') ? (
                          <ChevronUpIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        ) : (
                          <ChevronDownIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.includes('skills') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Consider adding these skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {result.skills.suggested_additions.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-sm
                                    ${isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}
                                >
                                  + {skill}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Priority Actions */}
                  <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      <SparklesIcon className="h-5 w-5" />
                      Priority Actions
                    </h4>
                    <ul className="space-y-2">
                      {result.priority_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium
                            ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-700'}`}>
                            {idx + 1}
                          </span>
                          <span className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 border sticky top-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Analyses</h3>
              </div>

              {history.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No analyses yet. Run your first optimization!</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoryItem(item.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all group
                        ${selectedHistory === item.id
                          ? isDark ? 'bg-sky-500/20 border border-sky-500/30' : 'bg-sky-50 border border-sky-200'
                          : isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {item.linkedin_url || 'Text analysis'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${getScoreColor(item.overall_score)}`}>
                              Score: {item.overall_score}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all
                            ${isDark ? 'hover:bg-rose-500/20 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-100 text-slate-400 hover:text-rose-500'}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
