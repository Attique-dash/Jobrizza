'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  StarIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  awarded_at: string
}

interface GamificationProfile {
  badges: Badge[]
  stats: {
    total_uploads: number
    highest_score: number
    current_streak: number
    longest_streak: number
    total_versions: number
    analysis_views: number
    applications_count: number
  }
  level: number
  xp: number
  next_level_xp: number
}

interface LeaderboardEntry {
  name: string
  badge_count: number
  highest_score: number
  current_streak: number
}

export default function GamificationPage() {
  const { isDark } = useTheme()
  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchLeaderboard()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/gamification/profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/gamification/leaderboard')
      const data = await res.json()
      if (data.success) {
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  const getLevelTitle = (level: number) => {
    const titles = [
      'Beginner', 'Novice', 'Apprentice', 'Adept', 'Skilled',
      'Proficient', 'Expert', 'Master', 'Grandmaster', 'Legend'
    ]
    return titles[Math.min(level - 1, 9)] || 'Unknown'
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

  const defaultProfile: GamificationProfile = {
    badges: [],
    stats: {
      total_uploads: 0,
      highest_score: 0,
      current_streak: 0,
      longest_streak: 0,
      total_versions: 0,
      analysis_views: 0,
      applications_count: 0
    },
    level: 1,
    xp: 0,
    next_level_xp: 100
  }

  const userProfile = profile || defaultProfile

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Achievements & Progress
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Track your CV improvements, earn badges, and maintain your streak
          </p>
        </div>

        {/* Level & XP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 border mb-8 ${isDark ? 'bg-gradient-to-br from-sky-900/50 to-violet-900/50 border-sky-500/30' : 'bg-gradient-to-br from-sky-50 to-violet-50 border-sky-200'}`}
        >
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold
              ${isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-100 text-sky-600 border border-sky-200'}`}>
              {userProfile.level}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Level {userProfile.level}: {getLevelTitle(userProfile.level)}
                </h2>
                <StarIcon className={`h-6 w-6 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1">
                  <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                      style={{ width: `${Math.min(100, (userProfile.xp / (userProfile.xp + userProfile.next_level_xp)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {userProfile.xp} XP
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {userProfile.next_level_xp} XP needed for next level
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Grid */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ChartBarIcon className="h-5 w-5" />
                Your Stats
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={DocumentArrowUpIcon}
                  label="CV Uploads"
                  value={userProfile.stats.total_uploads}
                  color="sky"
                  isDark={isDark}
                />
                <StatCard
                  icon={ArrowTrendingUpIcon}
                  label="Highest Score"
                  value={`${userProfile.stats.highest_score}%`}
                  color="emerald"
                  isDark={isDark}
                />
                <StatCard
                  icon={FireIcon}
                  label="Current Streak"
                  value={`${userProfile.stats.current_streak} days`}
                  color="orange"
                  isDark={isDark}
                />
                <StatCard
                  icon={TrophyIcon}
                  label="Longest Streak"
                  value={`${userProfile.stats.longest_streak} days`}
                  color="violet"
                  isDark={isDark}
                />
                <StatCard
                  icon={MagnifyingGlassIcon}
                  label="Analysis Views"
                  value={userProfile.stats.analysis_views}
                  color="amber"
                  isDark={isDark}
                />
                <StatCard
                  icon={BriefcaseIcon}
                  label="Applications"
                  value={userProfile.stats.applications_count}
                  color="rose"
                  isDark={isDark}
                />
              </div>
            </motion.div>

            {/* Badges Collection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <TrophyIcon className="h-5 w-5 text-amber-500" />
                  Badges Earned
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                  {userProfile.badges.length} / 13
                </span>
              </div>

              {userProfile.badges.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <LockClosedIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No badges yet. Start by uploading your CV!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userProfile.badges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-4 rounded-xl text-center transition-all hover:scale-105 cursor-pointer
                        ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
                      title={badge.description}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {badge.name}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {new Date(badge.awarded_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Available Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <LockClosedIcon className="h-5 w-5" />
                Badges to Unlock
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[
                  { id: 'score_90', name: 'CV Master', icon: '🏆', desc: 'Achieve 90+ CV score' },
                  { id: 'streak_7', name: 'On Fire', icon: '🔥🔥', desc: '7-day upload streak' },
                  { id: 'streak_30', name: 'Dedicated', icon: '💎', desc: '30-day upload streak' },
                  { id: 'versions_10', name: 'Iterative Pro', icon: '🔄🔄', desc: 'Save 10 CV versions' },
                  { id: 'improve_20', name: 'Rapid Growth', icon: '🚀', desc: 'Improve by 20+ points' },
                  { id: 'analyzer', name: 'Analyzer', icon: '🔍', desc: 'View analysis 5 times' },
                  { id: 'job_seeker', name: 'Job Seeker', icon: '💼', desc: 'Apply to 5 jobs' },
                ]
                  .filter(b => !userProfile.badges.find(ub => ub.id === b.id))
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl text-center opacity-50 grayscale
                        ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                      title={badge.desc}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {badge.name}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {badge.desc}
                      </p>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border sticky top-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UsersIcon className="h-5 w-5" />
                Leaderboard
              </h3>

              {leaderboard.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No leaderboard data yet. Be the first to earn badges!
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl
                        ${idx === 0 ? isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200' : ''}
                        ${idx === 1 ? isDark ? 'bg-slate-700/50' : 'bg-slate-100' : ''}
                        ${idx === 2 ? isDark ? 'bg-orange-900/20' : 'bg-orange-50' : ''}
                        ${idx > 2 ? isDark ? 'bg-slate-800' : 'bg-slate-50' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                        ${idx === 0 ? 'bg-amber-500 text-white' : ''}
                        ${idx === 1 ? isDark ? 'bg-slate-600 text-white' : 'bg-slate-400 text-white' : ''}
                        ${idx === 2 ? 'bg-orange-500 text-white' : ''}
                        ${idx > 2 ? isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-300 text-slate-600' : ''}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {entry.name}
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                            {entry.badge_count} badges
                          </span>
                          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                            {entry.highest_score}% best
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ icon: Icon, label, value, color, isDark }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  isDark: boolean
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    sky: { bg: isDark ? 'bg-sky-500/20' : 'bg-sky-100', text: isDark ? 'text-sky-400' : 'text-sky-600' },
    emerald: { bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100', text: isDark ? 'text-emerald-400' : 'text-emerald-600' },
    orange: { bg: isDark ? 'bg-orange-500/20' : 'bg-orange-100', text: isDark ? 'text-orange-400' : 'text-orange-600' },
    violet: { bg: isDark ? 'bg-violet-500/20' : 'bg-violet-100', text: isDark ? 'text-violet-400' : 'text-violet-600' },
    amber: { bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100', text: isDark ? 'text-amber-400' : 'text-amber-600' },
    rose: { bg: isDark ? 'bg-rose-500/20' : 'bg-rose-100', text: isDark ? 'text-rose-400' : 'text-rose-600' },
  }

  const classes = colorClasses[color] || colorClasses.sky

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
      <div className={`p-2 rounded-lg w-fit mb-2 ${classes.bg}`}>
        <Icon className={`h-5 w-5 ${classes.text}`} />
      </div>
      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}
