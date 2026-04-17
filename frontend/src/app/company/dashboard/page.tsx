'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'

// Mock data for company dashboard - replace with real API calls
const MOCK_STATS = {
  totalCandidates: 1248,
  newCandidates: 56,
  reviewedCVs: 342,
  pendingReviews: 89,
  emailSent: 128,
  responseRate: 68,
}

const RECENT_CANDIDATES = [
  { id: 1, name: 'Sarah Johnson', role: 'Senior Frontend Developer', match: 94, status: 'New', date: '2 hours ago', skills: ['React', 'TypeScript', 'Node.js'] },
  { id: 2, name: 'Michael Chen', role: 'Full Stack Engineer', match: 91, status: 'Reviewed', date: '4 hours ago', skills: ['Python', 'Django', 'React'] },
  { id: 3, name: 'Emily Rodriguez', role: 'UX Designer', match: 88, status: 'Contacted', date: '6 hours ago', skills: ['Figma', 'Adobe XD', 'Prototyping'] },
  { id: 4, name: 'David Kim', role: 'DevOps Engineer', match: 87, status: 'New', date: '8 hours ago', skills: ['AWS', 'Docker', 'Kubernetes'] },
  { id: 5, name: 'Lisa Thompson', role: 'Product Manager', match: 85, status: 'Reviewed', date: '1 day ago', skills: ['Agile', 'Scrum', 'Analytics'] },
]

const ACTIVITY_FEED = [
  { id: 1, type: 'cv_upload', message: 'New CV uploaded by Sarah Johnson', time: '15 minutes ago', icon: DocumentTextIcon },
  { id: 2, type: 'email', message: 'Email sent to 5 candidates', time: '1 hour ago', icon: EnvelopeIcon },
  { id: 3, type: 'review', message: 'Michael Chen marked as shortlisted', time: '2 hours ago', icon: CheckCircleIcon },
  { id: 4, type: 'search', message: 'New filter applied: Senior developers', time: '3 hours ago', icon: FunnelIcon },
]

function StatCard({ title, value, change, changeType, icon: Icon, isDark }: { 
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: any
  isDark: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
          <Icon className={`h-6 w-6 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
        </div>
        {change && (
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-emerald-500' : 
            changeType === 'negative' ? 'text-rose-500' : 
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {change}
          </span>
        )}
      </div>
      <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </h3>
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {title}
      </p>
    </motion.div>
  )
}

export default function CompanyDashboard() {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('all')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Company Dashboard
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage your recruitment pipeline and candidates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
              <MagnifyingGlassIcon className="h-4 w-4" />
              Search Candidates
            </button>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' 
                : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
            }`}>
              <PlusIcon className="h-4 w-4" />
              Post Job
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Candidates"
            value={MOCK_STATS.totalCandidates.toLocaleString()}
            change="+12%"
            changeType="positive"
            icon={UsersIcon}
            isDark={isDark}
          />
          <StatCard
            title="New This Week"
            value={MOCK_STATS.newCandidates}
            change="+5"
            changeType="positive"
            icon={ArrowTrendingUpIcon}
            isDark={isDark}
          />
          <StatCard
            title="Pending Review"
            value={MOCK_STATS.pendingReviews}
            change="Urgent"
            changeType="negative"
            icon={ClockIcon}
            isDark={isDark}
          />
          <StatCard
            title="CVs Analyzed"
            value={MOCK_STATS.reviewedCVs.toLocaleString()}
            change="AI Powered"
            changeType="neutral"
            icon={DocumentTextIcon}
            isDark={isDark}
          />
          <StatCard
            title="Emails Sent"
            value={MOCK_STATS.emailSent}
            change="+8%"
            changeType="positive"
            icon={EnvelopeIcon}
            isDark={isDark}
          />
          <StatCard
            title="Response Rate"
            value={`${MOCK_STATS.responseRate}%`}
            change="+3%"
            changeType="positive"
            icon={ChartBarIcon}
            isDark={isDark}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Candidates */}
          <div className={`lg:col-span-2 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Recent Candidates
                </h2>
                <div className="flex items-center gap-2">
                  {['all', 'new', 'reviewed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600'
                          : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {RECENT_CANDIDATES.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {candidate.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {candidate.name}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {candidate.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.match >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            candidate.match >= 80 ? 'bg-sky-100 text-sky-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {candidate.match}% Match
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.status === 'New' ? 'bg-purple-100 text-purple-700' :
                            candidate.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {candidate.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {candidate.skills.map((skill) => (
                          <span key={skill} className={`text-xs px-2 py-0.5 rounded ${
                            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {skill}
                          </span>
                        ))}
                        <span className={`text-xs ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {candidate.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <a href="/company/candidates" className={`text-sm font-medium flex items-center justify-center gap-1 ${
                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
              }`}>
                View All Candidates
                <ArrowTrendingUpIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Activity Feed */}
          <div className={`rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Activity
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {ACTIVITY_FEED.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <activity.icon className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {activity.message}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <a href="/company/emails" className={`text-sm font-medium flex items-center justify-center gap-1 ${
                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
              }`}>
                View All Activity
                <ArrowTrendingUpIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`rounded-2xl border p-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DocumentTextIcon, label: 'Upload CVs', href: '/company/upload', color: 'sky' },
              { icon: FunnelIcon, label: 'Create Filter', href: '/company/filter', color: 'purple' },
              { icon: EnvelopeIcon, label: 'Send Emails', href: '/company/emails', color: 'emerald' },
              { icon: ChartBarIcon, label: 'View Analytics', href: '/company/analytics', color: 'amber' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 hover:border-sky-500/50' 
                    : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  action.color === 'sky' ? (isDark ? 'bg-sky-500/20' : 'bg-sky-100') :
                  action.color === 'purple' ? (isDark ? 'bg-purple-500/20' : 'bg-purple-100') :
                  action.color === 'emerald' ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100') :
                  (isDark ? 'bg-amber-500/20' : 'bg-amber-100')
                }`}>
                  <action.icon className={`h-5 w-5 ${
                    action.color === 'sky' ? (isDark ? 'text-sky-400' : 'text-sky-600') :
                    action.color === 'purple' ? (isDark ? 'text-purple-400' : 'text-purple-600') :
                    action.color === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                    (isDark ? 'text-amber-400' : 'text-amber-600')
                  }`} />
                </div>
                <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
