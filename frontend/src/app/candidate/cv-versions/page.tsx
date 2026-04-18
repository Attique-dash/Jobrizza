'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/Themecontext'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  TrashIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface CVVersion {
  id: string
  name: string
  score: number
  category_scores: Record<string, number>
  created_at: string
  cv_data: {
    name?: string
    professional_summary?: string
    skills?: string[]
  }
}

interface ComparisonResult {
  version_1: CVVersion
  version_2: CVVersion
  score_diff: number
  category_diff: Record<string, number>
}

export default function CVVersionsPage() {
  const { isDark } = useTheme()
  const [versions, setVersions] = useState<CVVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    try {
      const res = await fetch('/api/cv-versions')
      const data = await res.json()
      if (data.success) {
        setVersions(data.versions)
      } else {
        setError(data.error || 'Failed to load versions')
      }
    } catch (err) {
      setError('Failed to load CV versions')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cv-versions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setVersions(versions.filter(v => v.id !== id))
        setDeleteConfirm(null)
      } else {
        setError(data.error || 'Failed to delete version')
      }
    } catch (err) {
      setError('Failed to delete version')
    }
  }

  const toggleVersionSelection = (id: string) => {
    if (selectedVersions.includes(id)) {
      setSelectedVersions(selectedVersions.filter(v => v !== id))
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, id])
    }
  }

  const compareVersions = async () => {
    if (selectedVersions.length !== 2) return
    try {
      const res = await fetch('/api/cv-versions/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id_1: selectedVersions[0], version_id_2: selectedVersions[1] }),
      })
      const data = await res.json()
      if (data.success) {
        setComparison(data.comparison)
      } else {
        setError(data.error || 'Failed to compare versions')
      }
    } catch (err) {
      setError('Failed to compare versions')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
    if (score >= 60) return isDark ? 'bg-amber-500/20' : 'bg-amber-100'
    return isDark ? 'bg-rose-500/20' : 'bg-rose-100'
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/candidate/dashboard"
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              CV Version History
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Track your CV improvements over time
            </p>
          </div>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
            {error}
          </div>
        )}

        {/* Compare Controls */}
        <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCompareMode(!compareMode)
                  setSelectedVersions([])
                  setComparison(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  compareMode
                    ? 'bg-sky-500 text-white'
                    : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {compareMode ? 'Cancel Compare' : 'Compare Versions'}
              </button>
              {compareMode && selectedVersions.length === 2 && (
                <button
                  onClick={compareVersions}
                  className="px-4 py-2 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  Compare Selected
                </button>
              )}
            </div>
            {compareMode && (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Select 2 versions to compare ({selectedVersions.length}/2)
              </p>
            )}
          </div>
        </div>

        {/* Comparison Result */}
        {comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Comparison Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Score Difference</p>
                <p className={`text-2xl font-bold ${comparison.score_diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {comparison.score_diff >= 0 ? '+' : ''}{comparison.score_diff}
                </p>
              </div>
              {Object.entries(comparison.category_diff).map(([cat, diff]) => (
                <div key={cat} className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat}</p>
                  <p className={`text-2xl font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {diff >= 0 ? '+' : ''}{diff}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setComparison(null); setSelectedVersions([]); setCompareMode(false); }}
              className={`mt-4 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Clear comparison
            </button>
          </motion.div>
        )}

        {/* Versions Grid */}
        {versions.length === 0 ? (
          <div className={`text-center py-16 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
            <DocumentTextIcon className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No CV Versions Yet</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Upload and analyze your CV to start tracking versions
            </p>
            <Link
              href="/candidate/dashboard"
              className="px-4 py-2 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {versions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative rounded-xl p-6 transition-all ${
                  isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
                } ${compareMode && selectedVersions.includes(version.id) ? 'ring-2 ring-sky-500' : ''}`}
              >
                {compareMode && (
                  <button
                    onClick={() => toggleVersionSelection(version.id)}
                    className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedVersions.includes(version.id)
                        ? 'bg-sky-500 border-sky-500'
                        : isDark ? 'border-slate-600' : 'border-slate-300'
                    }`}
                  >
                    {selectedVersions.includes(version.id) && (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    )}
                  </button>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <DocumentDuplicateIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {version.name}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {new Date(version.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg mb-4 ${getScoreBg(version.score)}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(version.score)}`}>
                      {version.score}/100
                    </span>
                  </div>
                </div>

                {version.category_scores && Object.keys(version.category_scores).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {Object.entries(version.category_scores).slice(0, 3).map(([cat, score]) => (
                      <div key={cat} className="flex items-center justify-between text-sm">
                        <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat}</span>
                        <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!compareMode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDeleteConfirm(version.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        isDark ? 'bg-slate-800 text-rose-400 hover:bg-slate-700' : 'bg-slate-100 text-rose-600 hover:bg-slate-200'
                      }`}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirm === version.id && (
                  <div className={`absolute inset-0 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-900/95' : 'bg-white/95'}`}>
                    <div className="text-center p-4">
                      <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Delete this version?</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(version.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
