'use client'

import { useTheme } from '@/contexts/Themecontext'
import { useCV } from '@/contexts/CVContext'

export function useCVOrRedirect() {
  const { cvData, loading } = useCV()
  const { isDark } = useTheme()

  if (loading) {
    return {
      cvData: null,
      content: (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
          <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ),
    }
  }

  if (!cvData) {
    return {
      cvData: null,
      content: (
        <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <div className="text-6xl">📄</div>
          <h1 className="text-2xl font-bold">No CV Data Found</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Upload a CV first to see your analysis.</p>
          <a href="/" className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold transition-colors">
            ← Upload CV
          </a>
        </div>
      ),
    }
  }

  return { cvData, content: null }
}
