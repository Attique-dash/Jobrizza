'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import {
  BellIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  TagIcon,
  PlusIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

interface JobAlert {
  enabled: boolean
  frequency: 'daily' | 'weekly'
  job_types: string[]
  work_mode: string
  keywords: string[]
  min_salary: number | null
  location: string
  last_sent: string | null
  email?: string
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
const WORK_MODES = ['Remote', 'On-site', 'Hybrid']

export default function JobAlertsPage() {
  const { isDark } = useTheme()
  const [alert, setAlert] = useState<JobAlert>({
    enabled: false,
    frequency: 'daily',
    job_types: ['Full-time'],
    work_mode: 'Remote',
    keywords: [],
    min_salary: null,
    location: '',
    last_sent: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [message, setMessage] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    fetchAlert()
  }, [])

  const fetchAlert = async () => {
    try {
      const res = await fetch('/api/job-alerts')
      const data = await res.json()
      if (data.success) {
        setAlert(data.alert)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAlert = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings')
      }
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    setTestSending(true)
    setMessage('')
    try {
      const res = await fetch('/api/job-alerts/test', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Test email sent! Check your inbox.')
        setTimeout(() => setMessage(''), 5000)
      } else {
        setMessage(data.error || 'Failed to send test email')
      }
    } catch (error) {
      setMessage('Failed to send test email')
    } finally {
      setTestSending(false)
    }
  }

  const toggleJobType = (type: string) => {
    setAlert(prev => ({
      ...prev,
      job_types: prev.job_types.includes(type)
        ? prev.job_types.filter(t => t !== type)
        : [...prev.job_types, type]
    }))
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !alert.keywords.includes(newKeyword.trim())) {
      setAlert(prev => ({ ...prev, keywords: [...prev.keywords, newKeyword.trim()] }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setAlert(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keyword) }))
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Daily Job Alerts
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Get personalized job recommendations delivered to your inbox based on your CV skills
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
              <div className={`p-3 rounded-xl ${alert.enabled ? 'bg-emerald-500/20' : isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <BellIcon className={`h-6 w-6 ${alert.enabled ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Job Alerts {alert.enabled ? 'Active' : 'Paused'}
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {alert.enabled
                    ? `Receiving ${alert.frequency} alerts • ${alert.last_sent ? `Last sent: ${new Date(alert.last_sent).toLocaleDateString()}` : 'Not sent yet'}`
                    : 'Enable to receive personalized job matches'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setAlert(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                ${alert.enabled ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${alert.enabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Preferences */}
          <div className="lg:col-span-2 space-y-6">
            {/* Frequency & Job Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/20' : 'bg-sky-100'}`}>
                  <ClockIcon className={`h-5 w-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Alert Frequency</h3>
              </div>

              <div className="flex gap-4 mb-8">
                {(['daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setAlert(prev => ({ ...prev, frequency: freq }))}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all capitalize
                      ${alert.frequency === freq
                        ? isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-50 text-sky-600 border border-sky-200'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                  <BriefcaseIcon className={`h-5 w-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Job Types</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleJobType(type)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${alert.job_types.includes(type)
                        ? isDark ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200'
                        : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {alert.job_types.includes(type) && (
                      <CheckCircleIcon className="inline h-4 w-4 mr-1" />
                    )}
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Work Mode & Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <MapPinIcon className={`h-5 w-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Work Mode</h3>
              </div>

              <div className="flex gap-3 mb-6">
                {WORK_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAlert(prev => ({ ...prev, work_mode: mode }))}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all
                      ${alert.work_mode === mode
                        ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
                  <MapPinIcon className={`h-5 w-5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Location (Optional)</h3>
              </div>

              <input
                type="text"
                placeholder="e.g., New York, Remote US, London"
                value={alert.location}
                onChange={(e) => setAlert(prev => ({ ...prev, location: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                  ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-500'
                  }`}
              />
            </motion.div>

            {/* Keywords */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <TagIcon className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Keywords</h3>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a keyword (e.g., React, Python, Marketing)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  className={`flex-1 px-4 py-2 rounded-xl border outline-none transition-colors
                    ${isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                    }`}
                />
                <button
                  onClick={addKeyword}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors
                    ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {alert.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
                      ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-emerald-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {alert.keywords.length === 0 && (
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No keywords added. We'll use your CV skills by default.</p>
                )}
              </div>
            </motion.div>

            {/* Salary Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <CurrencyDollarIcon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Minimum Salary (Optional)</h3>
              </div>

              <div className="flex items-center gap-4">
                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>$</span>
                <input
                  type="number"
                  placeholder="e.g., 80000"
                  value={alert.min_salary || ''}
                  onChange={(e) => setAlert(prev => ({ ...prev, min_salary: e.target.value ? parseInt(e.target.value) : null }))}
                  className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-colors
                    ${isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                    }`}
                />
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>per year</span>
              </div>
            </motion.div>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${message.includes('success') || message.includes('sent')
                  ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : isDark ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-600'
                }`}
              >
                {message}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={saveAlert}
                disabled={saving}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
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
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={sendTestEmail}
                disabled={testSending || !alert.enabled}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                  ${testSending || !alert.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
                  ${isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                  }`}
              >
                {testSending ? (
                  <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
                {testSending ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>

          {/* Preview / Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border sticky top-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/20' : 'bg-sky-100'}`}>
                  <EnvelopeIcon className={`h-5 w-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Preview</h3>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Subject</div>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Your Daily Job Matches - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Senior Frontend Developer</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>95% Match</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>TechCorp Inc. • Remote</p>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Stack Engineer</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>88% Match</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>StartupXYZ • New York, NY</p>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Software Engineer II</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>82% Match</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>BigTech Co. • San Francisco, CA</p>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-start gap-2">
                  <AdjustmentsHorizontalIcon className={`h-5 w-5 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>How it works</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                      We'll scan for new jobs matching your preferences and send you a personalized digest.
                      Jobs are matched based on your CV skills and the filters you've set above.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
