'use client'

import { useTheme } from '@/contexts/Themecontext'
import { Header } from '@/components/layout/navbar'
import { CVProvider } from '@/contexts/CVContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'analysis', label: 'Analysis', icon: '🔍' },
  { id: 'skills', label: 'Skill Gap', icon: '⚡' },
  { id: 'jobs', label: 'Jobs', icon: '💼' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'interview', label: 'Interview', icon: '🎤' },
  { id: 'salary', label: 'Salary', icon: '💰' },
  { id: 'career', label: 'Career Path', icon: '🗺️' },
  { id: 'cover', label: 'Cover Letter', icon: '✉️' },
]

export default function CVTabLayout({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  const pathname = usePathname()

  // Determine active tab: /cv-result or /cv-result/overview → overview, /cv-result/analysis → analysis, etc.
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const active = lastSegment === 'cv-result' || lastSegment === 'overview' ? 'overview' : lastSegment

  return (
    <CVProvider>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Header />

      {/* Sub-nav */}
      <div className={`sticky top-16 z-40 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            <Link
              href="/cv-result"
              className={`flex-shrink-0 text-xs px-3 py-2 rounded-lg font-medium mr-2 transition-colors
                ${isDark ? 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'}`}
            >
              ← Dashboard
            </Link>
            <div className={`w-px h-5 mr-2 flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            {TABS.map(tab => (
              <Link
                key={tab.id}
                href={`/cv-result/${tab.id}`}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                  ${active === tab.id
                    ? isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-700'
                    : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
    </CVProvider>
  )
}