'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, DocumentTextIcon, Squares2X2Icon, SparklesIcon } from '@heroicons/react/24/outline'

interface Template {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  preview: string
  features: string[]
}

const templates: Template[] = [
  {
    id: 'chronological',
    name: 'Chronological',
    description: 'Traditional timeline format, best for steady career progression',
    icon: DocumentTextIcon,
    color: 'bg-blue-500',
    preview: 'linear-timeline',
    features: ['Clear career progression', 'Easy to scan', 'HR preferred']
  },
  {
    id: 'functional',
    name: 'Functional',
    description: 'Skills-focused format, ideal for career changers',
    icon: Squares2X2Icon,
    color: 'bg-emerald-500',
    preview: 'skills-grouped',
    features: ['Highlights skills', 'Hides gaps', 'Project-based']
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    description: 'Combines skills and experience, versatile for most roles',
    icon: SparklesIcon,
    color: 'bg-violet-500',
    preview: 'combined-layout',
    features: ['Best of both', 'Flexible', 'Modern look']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple, perfect for creative industries',
    icon: DocumentTextIcon,
    color: 'bg-slate-500',
    preview: 'clean-simple',
    features: ['Modern aesthetic', 'Whitespace', 'Creative fields']
  }
]

interface TemplateSelectorProps {
  isDark: boolean
  recommendedTemplate?: string
  onSelect?: (templateId: string) => void
}

export function TemplateSelector({ isDark, recommendedTemplate, onSelect }: TemplateSelectorProps) {
  const [selected, setSelected] = useState(recommendedTemplate || 'hybrid')

  const handleSelect = (templateId: string) => {
    setSelected(templateId)
    onSelect?.(templateId)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((template) => {
          const isSelected = selected === template.id
          const isRecommended = recommendedTemplate?.toLowerCase().includes(template.id.toLowerCase())
          
          return (
            <motion.button
              key={template.id}
              onClick={() => handleSelect(template.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-2xl border text-left transition-all
                ${isSelected
                  ? isDark 
                    ? 'bg-slate-800 border-sky-500 ring-1 ring-sky-500' 
                    : 'bg-white border-sky-500 ring-1 ring-sky-500 shadow-lg'
                  : isDark
                    ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
            >
              {isRecommended && (
                <span className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full
                  ${isDark ? 'bg-sky-500 text-white' : 'bg-sky-500 text-white'}`}>
                  AI Recommended
                </span>
              )}
              
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${template.color} bg-opacity-20`}>
                  <template.icon className={`h-5 w-5 ${template.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {template.name}
                  </h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {template.description}
                  </p>
                </div>
                {isSelected && (
                  <CheckIcon className="h-5 w-5 text-sky-500" />
                )}
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {template.features.map((feature) => (
                  <span
                    key={feature}
                    className={`text-xs px-2 py-1 rounded-full
                      ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.button>
          )
        })}
      </div>
      
      <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Click a template to preview how your CV would look
      </p>
    </div>
  )
}
