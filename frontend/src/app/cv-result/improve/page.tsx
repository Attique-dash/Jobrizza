'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/lib/api'
import { SparklesIcon, ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

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

export default function ImproveCVPage() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [improvedCV, setImprovedCV] = useState<ImprovedCV | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/cv-result/improve')
      return
    }

    const improveCV = async () => {
      try {
        // First fetch the current CV data
        const cvRes = await fetchWithAuth('/api/cv-data/latest')
        if (!cvRes.ok) {
          setError('No CV data found. Please upload a CV first.')
          setLoading(false)
          return
        }

        const cvData = await cvRes.json()
        if (!cvData.success || !cvData.cv_data) {
          setError('No CV data found. Please upload a CV first.')
          setLoading(false)
          return
        }

        // Call improve-cv API
        const res = await fetchWithAuth('/api/improve-cv', {
          method: 'POST',
          body: JSON.stringify({ cv_data: cvData.cv_data }),
        })

        if (!res.ok) {
          throw new Error('Failed to improve CV')
        }

        const data = await res.json()
        if (data.success) {
          setImprovedCV(data.improved_cv)
        } else {
          throw new Error(data.error || 'Failed to improve CV')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    improveCV()
  }, [isAuthenticated, router])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-sky-500 animate-pulse" />
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            AI is improving your CV...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-sky-500 hover:underline">
            Upload a CV
          </Link>
        </div>
      </div>
    )
  }

  if (!improvedCV) return null

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cv-result"
            className={`inline-flex items-center gap-2 text-sm mb-4 ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to CV Analysis
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            AI-Improved CV
          </h1>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Your CV has been enhanced with AI-powered suggestions
          </p>
        </div>

        {/* Improved CV Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
        >
          {/* Name & Contact */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {improvedCV.name}
            </h2>
            <div className={`flex gap-4 mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {improvedCV.email && <span>{improvedCV.email}</span>}
              {improvedCV.phone && <span>{improvedCV.phone}</span>}
            </div>
          </div>

          {/* Professional Summary */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
              Professional Summary
            </h3>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {improvedCV.professional_summary}
            </p>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {improvedCV.skills.map((skill, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm ${
                    isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          {improvedCV.experience.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                Experience
              </h3>
              <ul className="space-y-2">
                {improvedCV.experience.map((exp, i) => (
                  <li key={i} className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Education */}
          {improvedCV.education.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                Education
              </h3>
              <ul className="space-y-2">
                {improvedCV.education.map((edu, i) => (
                  <li key={i} className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {edu}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements Made */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Improvements Made
            </h3>
            <ul className="space-y-2">
              {improvedCV.improvements_made.map((improvement, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.print()}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              isDark
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}
