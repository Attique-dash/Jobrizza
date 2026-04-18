'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BriefcaseIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LinkIcon,
  EyeIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'

interface PortfolioData {
  username: string
  display_name: string
  title: string
  bio: string
  theme: string
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
  cv_data: any
  email: string | null
  views_count: number
  custom_css: string
}

export default function PublicPortfolioPage() {
  const params = useParams()
  const username = params.username as string
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPortfolio()
  }, [username])

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/p/${username}`)
      const data = await res.json()
      if (data.success) {
        setPortfolio(data.portfolio)
      } else {
        setError(data.error || 'Portfolio not found')
      }
    } catch (error) {
      setError('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
          <p className="text-slate-400">{error || 'This portfolio does not exist or is private.'}</p>
        </div>
      </div>
    )
  }

  const themeColors: Record<string, { bg: string; accent: string; text: string }> = {
    default: { bg: 'from-slate-900 to-slate-800', accent: 'bg-sky-500', text: 'text-sky-400' },
    emerald: { bg: 'from-emerald-900 to-slate-900', accent: 'bg-emerald-500', text: 'text-emerald-400' },
    violet: { bg: 'from-violet-900 to-slate-900', accent: 'bg-violet-500', text: 'text-violet-400' },
    rose: { bg: 'from-rose-900 to-slate-900', accent: 'bg-rose-500', text: 'text-rose-400' },
    amber: { bg: 'from-amber-900 to-slate-900', accent: 'bg-amber-500', text: 'text-amber-400' },
  }

  const theme = themeColors[portfolio.theme] || themeColors.default

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      {portfolio.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: portfolio.custom_css }} />
      )}

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="h-6 w-6 text-white" />
            <span className="text-white font-semibold">Portfolio</span>
          </div>
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              {portfolio.views_count} views
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className={`w-24 h-24 rounded-full ${theme.accent} mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-white`}>
            {portfolio.display_name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{portfolio.display_name}</h1>
          {portfolio.title && (
            <p className={`text-xl ${theme.text} mb-4`}>{portfolio.title}</p>
          )}
          {portfolio.bio && (
            <p className="text-white/70 max-w-2xl mx-auto leading-relaxed">{portfolio.bio}</p>
          )}

          {/* Social Links */}
          {portfolio.sections.social_links && (
            <div className="flex items-center justify-center gap-4 mt-6">
              {portfolio.social_links.linkedin && (
                <a href={portfolio.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              )}
              {portfolio.social_links.github && (
                <a href={portfolio.social_links.github} target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              )}
              {portfolio.social_links.twitter && (
                <a href={portfolio.social_links.twitter} target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {portfolio.social_links.website && (
                <a href={portfolio.social_links.website} target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <GlobeAltIcon className="h-6 w-6" />
                </a>
              )}
              {portfolio.email && (
                <a href={`mailto:${portfolio.email}`}
                   className="text-white/60 hover:text-white transition-colors">
                  <EnvelopeIcon className="h-6 w-6" />
                </a>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skills Section */}
            {portfolio.sections.skills && portfolio.cv_data?.skills?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircleIcon className={`h-5 w-5 ${theme.text}`} />
                  <h2 className="text-xl font-semibold text-white">Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {portfolio.cv_data.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm bg-white/10 text-white/80`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Experience Section */}
            {portfolio.sections.experience && portfolio.cv_data?.experience?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BriefcaseIcon className={`h-5 w-5 ${theme.text}`} />
                  <h2 className="text-xl font-semibold text-white">Experience</h2>
                </div>
                <div className="space-y-6">
                  {portfolio.cv_data.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-white/20 pl-4">
                      <h3 className="text-white font-medium">{exp.title || exp.position}</h3>
                      <p className="text-white/60">{exp.company}</p>
                      <p className="text-white/40 text-sm">{exp.duration || exp.date}</p>
                      {exp.description && (
                        <p className="text-white/70 text-sm mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Education Section */}
            {portfolio.sections.education && portfolio.cv_data?.education?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AcademicCapIcon className={`h-5 w-5 ${theme.text}`} />
                  <h2 className="text-xl font-semibold text-white">Education</h2>
                </div>
                <div className="space-y-4">
                  {portfolio.cv_data.education.map((edu: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="text-white font-medium">{edu.degree || edu.title}</h3>
                      <p className="text-white/60">{edu.institution || edu.school}</p>
                      <p className="text-white/40 text-sm">{edu.year || edu.date}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Projects Section */}
            {portfolio.sections.projects && portfolio.projects?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CodeBracketIcon className={`h-5 w-5 ${theme.text}`} />
                  <h2 className="text-xl font-semibold text-white">Projects</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {portfolio.projects.map((project, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-medium mb-2">{project.name}</h3>
                      <p className="text-white/60 text-sm mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer"
                           className={`text-sm ${theme.text} hover:underline flex items-center gap-1`}>
                          <LinkIcon className="h-3 w-3" />
                          View Project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 sticky top-24"
            >
              {/* CV Score Card */}
              {portfolio.sections.cv && portfolio.cv_data?.analysis?.percentage && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">CV Score</h3>
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${theme.text}`}>
                      {portfolio.cv_data.analysis.percentage}%
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${theme.accent}`}
                          style={{ width: `${portfolio.cv_data.analysis.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Card */}
              {(portfolio.email || portfolio.social_links.linkedin) && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Get in Touch</h3>
                  <div className="space-y-3">
                    {portfolio.email && (
                      <a href={`mailto:${portfolio.email}`}
                         className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                        <EnvelopeIcon className="h-5 w-5" />
                        <span className="text-sm">{portfolio.email}</span>
                      </a>
                    )}
                    {portfolio.social_links.linkedin && (
                      <a href={portfolio.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        <span className="text-sm">LinkedIn Profile</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Share Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Share Portfolio</h3>
                <p className="text-white/60 text-sm mb-4">Share this portfolio with recruiters</p>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <LinkIcon className="h-4 w-4 text-white/40" />
                  <span className="text-white/80 text-sm flex-1 truncate">
                    {typeof window !== 'undefined' ? window.location.href : `jobrizza.com/p/${username}`}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-white/40 text-sm">
          <p>Powered by Jobrizza - AI-Powered Career Platform</p>
        </div>
      </footer>
    </div>
  )
}
