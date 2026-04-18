'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import {
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  LinkIcon,
  PencilIcon,
  PhotoIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  ShareIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Portfolio {
  username: string
  is_public: boolean
  display_name: string
  title: string
  bio: string
  theme: string
  show_email: boolean
  show_phone: boolean
  sections: {
    cv: boolean
    skills: boolean
    experience: boolean
    education: boolean
    projects: boolean
    certifications: boolean
    social_links: boolean
  }
  social_links: {
    linkedin: string
    github: string
    twitter: string
    website: string
  }
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    link?: string
  }>
  views_count: number
}

const THEMES = [
  { id: 'default', name: 'Ocean Blue', gradient: 'from-slate-900 to-slate-800', accent: 'bg-sky-500' },
  { id: 'emerald', name: 'Emerald Forest', gradient: 'from-emerald-900 to-slate-900', accent: 'bg-emerald-500' },
  { id: 'violet', name: 'Violet Dream', gradient: 'from-violet-900 to-slate-900', accent: 'bg-violet-500' },
  { id: 'rose', name: 'Rose Sunset', gradient: 'from-rose-900 to-slate-900', accent: 'bg-rose-500' },
  { id: 'amber', name: 'Amber Gold', gradient: 'from-amber-900 to-slate-900', accent: 'bg-amber-500' },
]

export default function PortfolioBuilderPage() {
  const { isDark } = useTheme()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', technologies: '', link: '' })
  const [showAddProject, setShowAddProject] = useState(false)

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio')
      const data = await res.json()
      if (data.success) {
        setPortfolio(data.portfolio)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) return
    setCheckingUsername(true)
    try {
      const res = await fetch(`/api/portfolio/username-check/${username}`)
      const data = await res.json()
      setUsernameAvailable(data.available)
    } catch (error) {
      console.error('Failed to check username:', error)
    } finally {
      setCheckingUsername(false)
    }
  }

  const savePortfolio = async () => {
    if (!portfolio) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio),
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Portfolio saved successfully!')
        setPortfolio(data.portfolio)
      } else {
        setMessage(data.error || 'Failed to save portfolio')
      }
    } catch (error) {
      setMessage('Failed to save portfolio')
    } finally {
      setSaving(false)
    }
  }

  const addProject = () => {
    if (!portfolio || !newProject.name.trim()) return

    const technologies = newProject.technologies.split(',').map(t => t.trim()).filter(t => t)
    const project = {
      name: newProject.name,
      description: newProject.description,
      technologies,
      link: newProject.link || undefined,
    }

    setPortfolio({
      ...portfolio,
      projects: [...portfolio.projects, project],
    })

    setNewProject({ name: '', description: '', technologies: '', link: '' })
    setShowAddProject(false)
  }

  const removeProject = (index: number) => {
    if (!portfolio) return
    setPortfolio({
      ...portfolio,
      projects: portfolio.projects.filter((_, i) => i !== index),
    })
  }

  const toggleSection = (section: keyof Portfolio['sections']) => {
    if (!portfolio) return
    setPortfolio({
      ...portfolio,
      sections: {
        ...portfolio.sections,
        [section]: !portfolio.sections[section],
      },
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!portfolio) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Failed to load portfolio settings</p>
        </div>
      </DashboardLayout>
    )
  }

  const publicUrl = `jobrizza.com/p/${portfolio.username}`

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Portfolio Builder
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Create your public portfolio to share with recruiters
          </p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${portfolio.is_public ? 'bg-emerald-500/20' : isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {portfolio.is_public ? (
                  <EyeIcon className="h-6 w-6 text-emerald-500" />
                ) : (
                  <EyeSlashIcon className={`h-6 w-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                )}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Portfolio {portfolio.is_public ? 'Public' : 'Private'}
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {portfolio.is_public
                    ? `Visible at ${publicUrl} • ${portfolio.views_count} views`
                    : 'Only you can see this portfolio'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPortfolio({ ...portfolio, is_public: !portfolio.is_public })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                ${portfolio.is_public ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${portfolio.is_public ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {portfolio.is_public && (
            <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <LinkIcon className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {publicUrl}
              </span>
              <a
                href={`/p/${portfolio.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm px-3 py-1.5 rounded-lg font-medium
                  ${isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
              >
                View
              </a>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Username */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <LinkIcon className="h-5 w-5" />
                Username
              </h3>
              <div className="flex gap-2">
                <div className={`px-3 py-3 rounded-l-xl border-y border-l text-sm font-medium
                  ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                  jobrizza.com/p/
                </div>
                <input
                  type="text"
                  value={portfolio.username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    setPortfolio({ ...portfolio, username: value })
                    setUsernameAvailable(null)
                  }}
                  onBlur={() => checkUsername(portfolio.username)}
                  placeholder="yourname"
                  className={`flex-1 px-3 py-3 rounded-r-xl border outline-none transition-colors
                    ${isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                    }`}
                />
              </div>
              {checkingUsername ? (
                <p className="text-sm text-slate-500 mt-2">Checking availability...</p>
              ) : usernameAvailable === true ? (
                <p className="text-sm text-emerald-500 mt-2 flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" />
                  Username available
                </p>
              ) : usernameAvailable === false ? (
                <p className="text-sm text-rose-500 mt-2">Username already taken</p>
              ) : null}
            </motion.div>

            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <PencilIcon className="h-5 w-5" />
                Profile Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={portfolio.display_name}
                    onChange={(e) => setPortfolio({ ...portfolio, display_name: e.target.value })}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                      ${isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                      }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={portfolio.title}
                    onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
                    placeholder="Senior Software Engineer"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                      ${isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                      }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Bio
                  </label>
                  <textarea
                    value={portfolio.bio}
                    onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
                    placeholder="Tell recruiters about yourself..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors resize-none
                      ${isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                      }`}
                  />
                </div>
              </div>
            </motion.div>

            {/* Theme Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <PhotoIcon className="h-5 w-5" />
                Theme
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setPortfolio({ ...portfolio, theme: theme.id })}
                    className={`p-3 rounded-xl border-2 transition-all text-left
                      ${portfolio.theme === theme.id
                        ? isDark ? 'border-sky-500 bg-sky-500/10' : 'border-sky-500 bg-sky-50'
                        : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className={`h-8 rounded-lg bg-gradient-to-br ${theme.gradient} mb-2`} />
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {theme.name}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sections Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BriefcaseIcon className="h-5 w-5" />
                Visible Sections
              </h3>

              <div className="space-y-3">
                {[
                  { key: 'cv', label: 'CV Score', icon: CheckCircleIcon },
                  { key: 'skills', label: 'Skills', icon: CheckCircleIcon },
                  { key: 'experience', label: 'Experience', icon: BriefcaseIcon },
                  { key: 'education', label: 'Education', icon: AcademicCapIcon },
                  { key: 'projects', label: 'Projects', icon: CodeBracketIcon },
                  { key: 'social_links', label: 'Social Links', icon: ShareIcon },
                ].map((section) => (
                  <button
                    key={section.key}
                    onClick={() => toggleSection(section.key as keyof Portfolio['sections'])}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors
                      ${portfolio.sections[section.key as keyof Portfolio['sections']]
                        ? isDark ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-sky-50 border border-sky-200'
                        : isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className={`h-5 w-5
                        ${portfolio.sections[section.key as keyof Portfolio['sections']] ? 'text-sky-500' : isDark ? 'text-slate-500' : 'text-slate-400'}
                      `} />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {section.label}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center
                      ${portfolio.sections[section.key as keyof Portfolio['sections']]
                        ? 'bg-sky-500 text-white'
                        : isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    >
                      {portfolio.sections[section.key as keyof Portfolio['sections']] && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ShareIcon className="h-5 w-5" />
                Social Links
              </h3>

              <div className="space-y-4">
                {[
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
                  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username' },
                  { key: 'website', label: 'Personal Website', placeholder: 'https://yourwebsite.com' },
                ].map((link) => (
                  <div key={link.key}>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {link.label}
                    </label>
                    <input
                      type="url"
                      value={portfolio.social_links[link.key as keyof Portfolio['social_links']]}
                      onChange={(e) => setPortfolio({
                        ...portfolio,
                        social_links: { ...portfolio.social_links, [link.key]: e.target.value }
                      })}
                      placeholder={link.placeholder}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                        ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                        }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={portfolio.show_email}
                    onChange={(e) => setPortfolio({ ...portfolio, show_email: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Show email</span>
                </label>
              </div>
            </motion.div>

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <CodeBracketIcon className="h-5 w-5" />
                  Projects
                </h3>
                <button
                  onClick={() => setShowAddProject(!showAddProject)}
                  className={`p-2 rounded-lg transition-colors
                    ${isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              {showAddProject && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Project name"
                    className={`w-full px-3 py-2 rounded-lg border outline-none mb-2 text-sm
                      ${isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description"
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border outline-none mb-2 text-sm resize-none
                      ${isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                  <input
                    type="text"
                    value={newProject.technologies}
                    onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                    placeholder="Technologies (comma separated)"
                    className={`w-full px-3 py-2 rounded-lg border outline-none mb-2 text-sm
                      ${isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                  <input
                    type="url"
                    value={newProject.link}
                    onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                    placeholder="Project URL (optional)"
                    className={`w-full px-3 py-2 rounded-lg border outline-none mb-3 text-sm
                      ${isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addProject}
                      className="flex-1 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600"
                    >
                      Add Project
                    </button>
                    <button
                      onClick={() => setShowAddProject(false)}
                      className={`px-3 py-2 rounded-lg text-sm
                        ${isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {portfolio.projects.length === 0 ? (
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No projects added yet. Click + to add your first project.
                  </p>
                ) : (
                  portfolio.projects.map((project, idx) => (
                    <div key={idx} className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.name}</h4>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{project.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.map((tech, tidx) => (
                              <span key={tidx} className={`text-xs px-2 py-0.5 rounded
                                ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => removeProject(idx)}
                          className={`p-1 rounded transition-colors
                            ${isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex gap-4">
          {message && (
            <div className={`flex-1 p-4 rounded-xl ${message.includes('success')
              ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              : isDark ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-600'
            }`}>
              {message}
            </div>
          )}
          <button
            onClick={savePortfolio}
            disabled={saving || usernameAvailable === false}
            className={`px-8 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2
              ${saving || usernameAvailable === false ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
              ${isDark
                ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white'
                : 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/25'
              }`}
          >
            {saving ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircleIcon className="h-5 w-5" />
            )}
            {saving ? 'Saving...' : 'Save Portfolio'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
