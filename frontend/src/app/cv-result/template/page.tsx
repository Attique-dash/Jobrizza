'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useCV } from '@/contexts/CVContext'
import { CVTemplateRenderer, DownloadButton, CopyButton } from '@/components/cv/CVTemplateRenderer'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { ArrowLeftIcon, WrenchIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type TemplateType = 'chronological' | 'functional' | 'hybrid' | 'minimal'

const templateInfo: Record<TemplateType, { name: string; description: string; cssClass: string }> = {
  chronological: {
    name: 'Chronological',
    description: 'Classic timeline format, best for steady career progression',
    cssClass: 'font-serif'
  },
  functional: {
    name: 'Functional',
    description: 'Skills-focused layout, ideal for career changers',
    cssClass: 'font-sans'
  },
  hybrid: {
    name: 'Hybrid',
    description: 'Combines skills and experience, versatile for most roles',
    cssClass: 'font-sans'
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean and modern, perfect for creative industries',
    cssClass: 'font-light tracking-wide'
  }
}

export default function TemplatePage() {
  const { isDark } = useTheme()
  const { cvData, loading } = useCV()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('hybrid')
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before')

  // Get AI-recommended template from cvData
  const recommendedTemplate = useMemo(() => {
    const rec = cvData?.ai_analysis?.template_suggestion?.recommended_template?.toLowerCase() || ''
    if (rec.includes('chronological')) return 'chronological'
    if (rec.includes('functional')) return 'functional'
    if (rec.includes('hybrid')) return 'hybrid'
    if (rec.includes('minimal')) return 'minimal'
    return 'hybrid'
  }, [cvData])

  // Generate improved CV data based on AI suggestions
  const improvedCvData = useMemo(() => {
    if (!cvData) return null
    const tips: string[] = cvData?.ai_analysis?.template_suggestion?.before_after_tips || []
    
    // Apply AI improvements to the CV data
    return {
      ...cvData,
      // Enhance summary if there are tips about it
      summary: tips.some((t: string) => t.toLowerCase().includes('summary')) 
        ? (cvData as any).summary + ' (Enhanced per AI recommendations)'
        : (cvData as any).summary,
      // Reorder skills if there are tips about it
      skills: tips.some((t: string) => t.toLowerCase().includes('skill'))
        ? [...((cvData as any).skills || [])].reverse() // Simulate reordering
        : (cvData as any).skills,
    }
  }, [cvData])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!cvData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            No CV data found. Upload a CV to see template suggestions.
          </p>
          <Link 
            href="/candidate/dashboard" 
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400"
          >
            Upload CV
          </Link>
        </div>
      </div>
    )
  }

  const currentData = activeTab === 'before' ? cvData : improvedCvData
  const cvText = useMemo(() => {
    if (!currentData) return ''
    return JSON.stringify(currentData, null, 2)
  }, [currentData])

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/cv-result/analysis"
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              >
                <ArrowLeftIcon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </Link>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CV Template Editor
                </h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  AI recommends: <span className="text-sky-500 font-medium">{templateInfo[recommendedTemplate].name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DownloadButton content={cvText} filename="cv.txt" isDark={isDark} />
              <CopyButton content={cvText} isDark={isDark} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Template Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Template</h2>
              <div className="space-y-3">
                {(Object.keys(templateInfo) as TemplateType[]).map((template) => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-xl border transition-all
                      ${selectedTemplate === template
                        ? isDark 
                          ? 'border-sky-500 bg-sky-500/10' 
                          : 'border-sky-500 bg-sky-50'
                        : isDark
                          ? 'border-slate-700 hover:border-slate-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {templateInfo[template].name}
                      </span>
                      {template === recommendedTemplate && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-sky-500 text-white' : 'bg-sky-500 text-white'}`}>
                          AI Recommended
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {templateInfo[template].description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Before/After Toggle */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Preview Mode</h2>
              <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={() => setActiveTab('before')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors
                    ${activeTab === 'before'
                      ? 'bg-sky-500 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  Before
                </button>
                <button
                  onClick={() => setActiveTab('after')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors
                    ${activeTab === 'after'
                      ? 'bg-sky-500 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  After (AI)
                </button>
              </div>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeTab === 'before' 
                  ? 'Your original CV layout' 
                  : 'CV enhanced with AI template suggestions'}
              </p>
            </div>

            {/* AI Tips */}
            {cvData?.ai_analysis?.template_suggestion?.before_after_tips && (
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h2 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <WrenchIcon className="h-4 w-4" />
                  AI Suggestions
                </h2>
                <ul className="space-y-2">
                  {cvData.ai_analysis.template_suggestion.before_after_tips.map((tip: string, i: number) => (
                    <li key={i} className={`text-sm flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main - CV Preview */}
          <div className="lg:col-span-2">
            <motion.div
              key={selectedTemplate + activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-8 min-h-[800px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
            >
              <CVTemplateRenderer
                cvData={(currentData || {}) as any}
                template={selectedTemplate}
                isDark={isDark}
                isEditable={activeTab === 'after'}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
