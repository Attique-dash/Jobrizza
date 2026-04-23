'use client'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import { ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function MatchesPage() {
  const { isDark } = useTheme()

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ChartBarIcon className="h-8 w-8 text-blue-600" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Job Matches
          </h1>
        </div>
        
        <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="h-12 w-12 text-purple-600" />
          </div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AI-Powered Job Matches Coming Soon
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Get personalized job recommendations based on your CV and preferences.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
