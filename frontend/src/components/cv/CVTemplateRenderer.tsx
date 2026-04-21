'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PencilIcon, CheckIcon, ArrowDownTrayIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface CVRendererData {
  personal_info?: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary?: string
  skills?: string[]
  experience?: Array<{
    title?: string
    company?: string
    location?: string
    start_date?: string
    end_date?: string
    description?: string[]
  }>
  education?: Array<{
    degree?: string
    institution?: string
    location?: string
    graduation_date?: string
  }>
  projects?: Array<{
    name?: string
    description?: string
    technologies?: string[]
  }>
  ai_analysis?: any
}

interface CVTemplateRendererProps {
  cvData: CVRendererData
  template: 'chronological' | 'functional' | 'hybrid' | 'minimal'
  isDark: boolean
  isEditable?: boolean
  onUpdate?: (data: CVRendererData) => void
}

export function CVTemplateRenderer({ 
  cvData, 
  template, 
  isDark, 
  isEditable = false,
  onUpdate 
}: CVTemplateRendererProps) {
  const [editMode, setEditMode] = useState(false)
  const [localData, setLocalData] = useState<CVRendererData>(cvData)

  const handleSave = () => {
    onUpdate?.(localData)
    setEditMode(false)
  }

  const updateField = (path: string, value: any) => {
    setLocalData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: any = newData
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  const templateStyles = {
    chronological: 'font-serif',
    functional: 'font-sans',
    hybrid: 'font-sans',
    minimal: 'font-light tracking-wide'
  }

  const renderEditable = (value: string, path: string, className: string) => {
    if (!editMode || !isEditable) {
      return <span className={className}>{value || '—'}</span>
    }
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => updateField(path, e.target.value)}
        className={`${className} bg-transparent border-b border-sky-500 focus:outline-none px-1`}
      />
    )
  }

  const renderTextArea = (value: string, path: string, className: string) => {
    if (!editMode || !isEditable) {
      return <p className={className}>{value || '—'}</p>
    }
    return (
      <textarea
        value={value || ''}
        onChange={(e) => updateField(path, e.target.value)}
        className={`${className} bg-transparent border border-sky-500 rounded px-2 py-1 w-full focus:outline-none`}
        rows={3}
      />
    )
  }

  return (
    <div className={`relative ${templateStyles[template]} ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Edit Toggle */}
      {isEditable && (
        <div className="absolute top-0 right-0 flex gap-2">
          {editMode ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm"
            >
              <CheckIcon className="h-4 w-4" /> Save
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1 px-3 py-1 bg-sky-500 text-white rounded-lg text-sm"
            >
              <PencilIcon className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className={`text-center pb-4 mb-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
        <h1 className="text-2xl font-bold mb-2">
          {renderEditable(localData.personal_info?.name || '', 'personal_info.name', 'text-2xl font-bold')}
        </h1>
        <div className={`text-sm flex flex-wrap justify-center gap-x-4 gap-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {localData.personal_info?.email && (
            <span>{renderEditable(localData.personal_info.email, 'personal_info.email', '')}</span>
          )}
          {localData.personal_info?.phone && (
            <span>{renderEditable(localData.personal_info.phone, 'personal_info.phone', '')}</span>
          )}
          {localData.personal_info?.location && (
            <span>{renderEditable(localData.personal_info.location, 'personal_info.location', '')}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {localData.summary && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
            Professional Summary
          </h2>
          {renderTextArea(localData.summary, 'summary', 'text-sm leading-relaxed')}
        </div>
      )}

      {/* Skills */}
      {localData.skills && localData.skills.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {localData.skills.map((skill, i) => (
              <span
                key={i}
                className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {localData.experience && localData.experience.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
            Experience
          </h2>
          <div className="space-y-3">
            {localData.experience.map((exp, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{exp.title}</h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {exp.company} • {exp.location}
                    </p>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {exp.start_date} - {exp.end_date || 'Present'}
                  </span>
                </div>
                {exp.description && (
                  <ul className="mt-2 space-y-1">
                    {exp.description.map((desc, j) => (
                      <li key={j} className={`text-sm pl-4 relative ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="absolute left-0">•</span>
                        {desc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {localData.education && localData.education.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
            Education
          </h2>
          <div className="space-y-2">
            {localData.education.map((edu, i) => (
              <div key={i} className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{edu.degree}</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {edu.institution} • {edu.location}
                  </p>
                </div>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {edu.graduation_date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function DownloadButton({ content, filename, isDark }: { content: string; filename: string; isDark: boolean }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${isDark 
          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      Download
    </button>
  )
}

export function CopyButton({ content, isDark }: { content: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${isDark 
          ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' 
          : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
    >
      <DocumentDuplicateIcon className="h-4 w-4" />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
