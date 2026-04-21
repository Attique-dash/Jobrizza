'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  BriefcaseIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChevronRightIcon,
  TagIcon,
  BookOpenIcon,
  TrophyIcon,
  SparklesIcon,
  PencilIcon,
  GlobeAltIcon,
  LinkIcon,
  PhoneIcon,
  BanknotesIcon,
  ClockIcon as AvailabilityIcon,
  LanguageIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { Header } from '@/components/layout/navbar'
import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ── CV Upload ──────────────────────────────────────────────────────────────
function CVUploadSection({ isDark, onCVUploaded }: { isDark: boolean; onCVUploaded: (data: any) => void }) {
  const [uploaded, setUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', acceptedFiles[0])
    setFileName(acceptedFiles[0].name)

    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        headers: token ? { 'x-flask-token': token } : {},
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const result = await res.json()
      if (result.success) {
        sessionStorage.setItem('cvData', JSON.stringify(result.data))
        onCVUploaded(result.data)
        setUploaded(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Is the backend running?')
    } finally {
      setUploading(false)
    }
  }, [onCVUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Your CV</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upload or update your resume</p>
        </div>
        {uploaded && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" />
            Analyzed
          </span>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-sky-500 bg-sky-500/10'
            : isDark
              ? 'border-slate-700 hover:border-slate-600'
              : 'border-slate-300 hover:border-slate-400'
          }`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>Analyzing your CV with AI…</p>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <DocumentTextIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{fileName}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analysis complete</p>
            </div>
            <p className={`text-sm ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Drop new file to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <CloudArrowUpIcon className={`h-6 w-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Drop your CV here</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>or click to browse files</p>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PDF, DOC, DOCX up to 10MB</p>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {uploaded && (
        <div className="mt-4 flex gap-3">
          <a href="/cv-result" className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-center transition-colors
            ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
            View Full Analysis →
          </a>
        </div>
      )}
    </motion.div>
  )
}

// ── ATS Score (uses real CV data from backend) ───────────────────────────────
function ATSScoreSection({ isDark, cvData }: { isDark: boolean; cvData: any | null }) {
  const atsScore = cvData?.ai_analysis?.ats_score?.score ?? null
  const overallScore = cvData?.analysis?.percentage ?? null
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const categories = cvData?.analysis?.categories
    ? Object.entries(cvData.analysis.categories).map(([key, cat]: [string, any]) => ({
        category: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        score: Math.round((cat.score / cat.max) * 100),
        color: 'sky',
      }))
    : []

  const handleSaveVersion = async () => {
    if (!cvData) return
    setSaving(true)
    setSaveMessage('')
    try {
      const categoryScores: Record<string, number> = {}
      if (cvData?.analysis?.categories) {
        Object.entries(cvData.analysis.categories).forEach(([key, cat]: [string, any]) => {
          categoryScores[key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())] = Math.round((cat.score / cat.max) * 100)
        })
      }

      const res = await fetch('/api/cv-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `CV Version ${new Date().toLocaleDateString()}`,
          cv_data: cvData,
          score: overallScore || 0,
          category_scores: categoryScores,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSaveMessage('Version saved!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Failed to save')
      }
    } catch (err) {
      setSaveMessage('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>CV Score</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {cvData ? 'Based on your uploaded CV' : 'Upload a CV to see your score'}
          </p>
        </div>
        {overallScore !== null ? (
          <div className="relative h-16 w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path className={isDark ? 'text-slate-800' : 'text-slate-200'} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-sky-500" strokeDasharray={`${overallScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{overallScore}</span>
            </div>
          </div>
        ) : (
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
          </div>
        )}
      </div>

      {categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{item.category}</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.score}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full rounded-full bg-sky-500"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Upload your CV to see the score breakdown
        </p>
      )}

      {cvData && (
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSaveVersion}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2
              ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}
              ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save as Version'}
          </button>
          {saveMessage && (
            <p className={`text-center text-sm ${saveMessage.includes('saved') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {saveMessage}
            </p>
          )}
          <a href="/cv-result/analysis" className={`w-full py-3 rounded-xl font-medium transition-colors block text-center
            ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
            View Detailed Analysis →
          </a>
        </div>
      )}
    </motion.div>
  )
}

// ── Job Matches (fetched from backend using real CV data) ───────────────────
function JobMatchesSection({ isDark, cvData }: { isDark: boolean; cvData: any | null }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [fetched, setFetched] = useState(false)

  const fetchJobs = async () => {
    if (!cvData) return
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/job-matches', {
        method: 'POST',
        body: JSON.stringify({ cv_data: cvData }),
      })
      const data = await res.json()
      if (data.success) setJobs(data.jobs.slice(0, 4))
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }

  const toggleSave = (id: string) => {
    setSavedJobs(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Job Matches</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {cvData ? 'Based on your CV skills' : 'Upload a CV to see matches'}
          </p>
        </div>
        {cvData && (
          <button
            onClick={fetchJobs}
            disabled={loading}
            className={`text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors
              ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
          >
            {loading ? 'Loading…' : fetched ? 'Refresh' : 'Find Jobs'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`p-4 rounded-xl border transition-all group cursor-pointer
                ${isDark
                  ? 'bg-slate-800 border-slate-700 hover:border-sky-500/50'
                  : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:shadow-md'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700 shadow-sm'}`}>
                  {job.company?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-semibold truncate text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{job.title}</h4>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{job.company} · {job.location}</p>
                    </div>
                    <button
                      onClick={() => toggleSave(job.id)}
                      className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${savedJobs.includes(job.id) ? 'text-yellow-500' : isDark ? 'text-slate-600 hover:text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                    >
                      <StarIcon className={`h-4 w-4 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {job.currency} {Math.round(job.salary_min / 1000)}k–{Math.round(job.salary_max / 1000)}k
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                      ${job.match_score >= 85 ? 'bg-emerald-100 text-emerald-700' :
                        job.match_score >= 70 ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                      {job.match_score}% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <a href="/cv-result/jobs" className={`flex items-center justify-center gap-1 text-sm font-medium pt-2 transition-colors
            ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'}`}>
            View All Matches <ChevronRightIcon className="h-4 w-4" />
          </a>
        </div>
      )}

      {!loading && !fetched && cvData && (
        <div className="text-center py-6">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Click "Find Jobs" to discover AI-matched opportunities
          </p>
        </div>
      )}

      {!cvData && (
        <div className="text-center py-6">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Upload your CV first to see personalized job matches
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ── Candidate Profile ──────────────────────────────────────────────────────
interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  bio: string
  website: string
  linkedin: string
  github: string
  jobTitle: string
  experience: string
  jobType: string
  workMode: string
  expectedSalary: string
  availability: string
  languages: string[]
  skills: string[]
}

function CandidateProfileSection({ isDark }: { isDark: boolean }) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
    jobTitle: '',
    experience: '0-2 years',
    jobType: 'Full-time',
    workMode: 'Remote',
    expectedSalary: '',
    availability: 'Immediately',
    languages: [],
    skills: [],
  })
  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        const res = await fetchWithAuth('/api/user/profile')
        
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setProfile({
              firstName: data.user.firstName || data.user.name?.split(' ')[0] || '',
              lastName: data.user.lastName || data.user.name?.split(' ').slice(1).join(' ') || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              location: data.user.location || '',
              bio: data.user.bio || '',
              website: data.user.website || '',
              linkedin: data.user.linkedin || '',
              github: data.user.github || '',
              jobTitle: data.user.jobTitle || '',
              experience: data.user.experience || '0-2 years',
              jobType: data.user.jobType || 'Full-time',
              workMode: data.user.workMode || 'Remote',
              expectedSalary: data.user.expectedSalary || '',
              availability: data.user.availability || 'Immediately',
              languages: data.user.languages || [],
              skills: data.user.skills || [],
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Save profile data
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = sessionStorage.getItem('token')
      if (!token) return

      const res = await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      })

      if (!res.ok) throw new Error('Failed to save profile')
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const addSkill = () => {
    if (newSkill && !profile.skills.includes(newSkill)) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill] })
      setNewSkill('')
    }
  }
  const removeSkill = (s: string) => setProfile({ ...profile, skills: profile.skills.filter(sk => sk !== s) })
  const addLanguage = () => {
    if (newLanguage && !profile.languages.includes(newLanguage)) {
      setProfile({ ...profile, languages: [...profile.languages, newLanguage] })
      setNewLanguage('')
    }
  }
  const removeLanguage = (l: string) => setProfile({ ...profile, languages: profile.languages.filter(la => la !== l) })

  const inputClass = `w-full px-3 py-2 rounded-lg border outline-none text-sm
    ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold
            ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {profile.firstName} {profile.lastName}
            </h3>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{profile.jobTitle}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPinIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{profile.location}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${isEditing
              ? isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isEditing ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <PencilIcon className="h-4 w-4" />
          )}
          {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <UserCircleIcon className="h-5 w-5 text-sky-500" /> Personal Information
          </h4>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {(['firstName', 'lastName'] as const).map(key => (
                <div key={key}>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {key === 'firstName' ? 'First Name' : 'Last Name'}
                  </label>
                  {isEditing
                    ? <input type="text" value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} className={inputClass} />
                    : <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile[key]}</p>}
                </div>
              ))}
            </div>
            {[
              { key: 'email', label: 'Email', icon: EnvelopeIcon, type: 'email' },
              { key: 'phone', label: 'Phone', icon: PhoneIcon, type: 'tel' },
              { key: 'location', label: 'Location', icon: MapPinIcon, type: 'text' },
            ].map(({ key, label, icon: Icon, type }) => (
              <div key={key}>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</label>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  {isEditing
                    ? <input type={type} value={profile[key as keyof typeof profile] as string} onChange={e => setProfile({ ...profile, [key]: e.target.value })} className={`flex-1 ${inputClass}`} />
                    : <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile[key as keyof typeof profile] as string}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Preferences */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <BriefcaseIcon className="h-5 w-5 text-sky-500" /> Job Preferences
          </h4>
          <div className="space-y-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Desired Job Title</label>
              {isEditing
                ? <input type="text" value={profile.jobTitle} onChange={e => setProfile({ ...profile, jobTitle: e.target.value })} className={inputClass} />
                : <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.jobTitle}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'experience', label: 'Experience', options: ['0-2 years', '3-5 years', '5-8 years', '8+ years'] },
                { key: 'jobType', label: 'Job Type', options: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'] },
                { key: 'workMode', label: 'Work Mode', options: ['Remote', 'On-site', 'Hybrid'] },
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</label>
                  {isEditing
                    ? <select value={profile[key as keyof typeof profile] as string} onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                        className={inputClass}>
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile[key as keyof typeof profile] as string}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Expected Salary</label>
              <div className="flex items-center gap-2">
                <BanknotesIcon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing
                  ? <input type="text" value={profile.expectedSalary} onChange={e => setProfile({ ...profile, expectedSalary: e.target.value })} className={`flex-1 ${inputClass}`} />
                  : <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.expectedSalary}</p>}
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Availability</label>
              <div className="flex items-center gap-2">
                <AvailabilityIcon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing
                  ? <select value={profile.availability} onChange={e => setProfile({ ...profile, availability: e.target.value })} className={`flex-1 ${inputClass}`}>
                      {['Immediately', '1 week notice', '2 weeks notice', '1 month notice', '2+ months notice'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.availability}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className={`lg:col-span-2 p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <DocumentTextIcon className="h-5 w-5 text-sky-500" /> Bio / About Me
          </h4>
          {isEditing
            ? <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3}
                className={`w-full px-3 py-2 rounded-lg border outline-none resize-none text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`} />
            : <p className={`leading-relaxed text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{profile.bio}</p>}
        </div>

        {/* Skills */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <AcademicCapIcon className="h-5 w-5 text-sky-500" /> Skills
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.skills.map(skill => (
              <span key={skill} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                placeholder="Add a skill" onKeyDown={e => e.key === 'Enter' && addSkill()}
                className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`} />
              <button onClick={addSkill} className={`px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Languages */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <LanguageIcon className="h-5 w-5 text-sky-500" /> Languages
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.languages.map(lang => (
              <span key={lang} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                {lang}
                {isEditing && (
                  <button onClick={() => removeLanguage(lang)} className="hover:text-red-400 transition-colors">
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input type="text" value={newLanguage} onChange={e => setNewLanguage(e.target.value)}
                placeholder="Add a language" onKeyDown={e => e.key === 'Enter' && addLanguage()}
                className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`} />
              <button onClick={addLanguage} className={`px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className={`lg:col-span-2 p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <GlobeAltIcon className="h-5 w-5 text-sky-500" /> Social Links
          </h4>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { key: 'website', label: 'Website', display: profile.website },
              { key: 'linkedin', label: 'LinkedIn', display: 'LinkedIn Profile' },
              { key: 'github', label: 'GitHub', display: 'GitHub Profile' },
            ].map(({ key, label, display }) => (
              <div key={key}>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</label>
                <div className="flex items-center gap-2">
                  <LinkIcon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  {isEditing
                    ? <input type="url" value={profile[key as keyof typeof profile] as string} onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                        className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`} />
                    : <a href={profile[key as keyof typeof profile] as string} target="_blank" rel="noopener noreferrer"
                        className={`font-medium text-sm hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{display}</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Career Roadmap ──────────────────────────────────────────────────────────
function CareerRoadmapSection({ isDark, cvData }: { isDark: boolean; cvData: any | null }) {
  const [careerPath, setCareerPath] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Fetch AI career path on mount when cvData is available
  useEffect(() => {
    if (!cvData) return
    
    // Use cached career path if available in cvData
    if (cvData?.ai_analysis?.career_path?.milestones?.length > 0) {
      setCareerPath(cvData.ai_analysis.career_path)
      return
    }
    
    const fetchCareerPath = async () => {
      setLoading(true)
      try {
        const res = await fetchWithAuth('/api/career-path', {
          method: 'POST',
          body: JSON.stringify({ 
            cv_data: cvData,
            target_role: cvData?.target_role || ''
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.career_path) {
            setCareerPath(data.career_path)
          }
        }
      } catch (error) {
        console.error('Failed to fetch career path:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCareerPath()
  }, [cvData])

  const targetRole = careerPath?.target_role || 
                     cvData?.ai_analysis?.career_path?.target_role || 
                     cvData?.target_role || 
                     'Your Target Role'
  
  const milestones = careerPath?.milestones?.slice(0, 3) || 
                     cvData?.ai_analysis?.career_path?.milestones?.slice(0, 3) || [
    { title: 'Skill Development', description: 'Build core competencies' },
    { title: 'Experience Growth', description: 'Gain practical experience' },
    { title: 'Career Advancement', description: 'Reach your target role' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Career Roadmap</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Path to: {targetRole}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
          ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
          <ArrowTrendingUpIcon className="h-4 w-4" />
          AI Powered
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {milestones.map((milestone: any, idx: number) => (
          <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
              ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
              {idx + 1}
            </div>
            <div>
              <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{milestone.title}</h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{milestone.description}</p>
            </div>
          </div>
        ))}
      </div>

      <a href="/cv-result/career" className={`w-full py-3 rounded-xl font-medium transition-colors block text-center
        ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
        View Full AI Career Path →
      </a>
    </motion.div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function CandidateDashboard() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [cvData, setCvData] = useState<any | null>(() => {
    // Try to restore from sessionStorage on mount
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('cvData')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  // Fetch latest CV from backend on mount (in case sessionStorage is empty after refresh)
  useEffect(() => {
    const fetchLatestCV = async () => {
      // First try sessionStorage
      const stored = sessionStorage.getItem('cvData')
      if (stored) {
        setCvData(JSON.parse(stored))
        return
      }
      
      // Then fetch from DB
      try {
        const res = await fetchWithAuth('/api/cv-data/latest')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.cv_data) {
            setCvData(data.cv_data)
            sessionStorage.setItem('cvData', JSON.stringify(data.cv_data))
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest CV:', error)
      }
    }
    fetchLatestCV()
  }, [])

  const handleCVUploaded = (data: any) => {
    setCvData(data)
  }

  // Derive stats from real CV data, no hardcoded numbers
  const stats = [
    {
      name: 'CV Score',
      value: cvData?.analysis?.percentage != null ? `${cvData.analysis.percentage}%` : '—',
      icon: ChartBarIcon,
      color: 'text-sky-400',
    },
    {
      name: 'ATS Score',
      value: cvData?.ai_analysis?.ats_score?.score != null ? `${cvData.ai_analysis.ats_score.score}%` : '—',
      icon: DocumentTextIcon,
      color: 'text-violet-400',
    },
    {
      name: 'Skills Found',
      value: cvData?.skills?.length ?? '—',
      icon: AcademicCapIcon,
      color: 'text-emerald-400',
    },
    {
      name: 'Status',
      value: cvData?.analysis?.status ?? 'Upload CV',
      icon: UserCircleIcon,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-sky-50'}`}>
      <Header />

      {/* Hero */}
      <section className={`pt-24 pb-8 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Welcome back, <span className="text-sky-500">{user?.name?.split(' ')[0] || 'there'}</span>! 👋
              </h1>
              <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {cvData
                  ? `CV analyzed · ${cvData.skills?.length ?? 0} skills detected · Score: ${cvData.analysis?.percentage ?? '?'}%`
                  : 'Upload your CV below to get AI-powered insights and job matches.'}
              </p>
            </div>
            <a href="/cv-result" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25 transition-all w-fit ${!cvData ? 'opacity-50 pointer-events-none' : ''}`}>
              <ChartBarIcon className="h-5 w-5" />
              Full Analysis
            </a>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {['overview', 'profile', 'applications', 'saved', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tab
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent ' + (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {activeTab === 'profile' && <CandidateProfileSection isDark={isDark} />}

          {activeTab === 'overview' && (
            <>
              {/* Stats (derived from real CV data) - only show after CV upload */}
              {cvData && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-5 rounded-2xl border transition-all hover:shadow-lg
                        ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                    >
                      <div className={`p-3 rounded-xl w-fit mb-3 ${isDark ? 'bg-slate-800' : 'bg-sky-50'}`}>
                        <stat.icon className={`h-6 w-6 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} ${stat.color}`}>{stat.value}</p>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.name}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Dashboard Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                  <CVUploadSection isDark={isDark} onCVUploaded={handleCVUploaded} />
                  <ATSScoreSection isDark={isDark} cvData={cvData} />
                </div>
                <div className="lg:col-span-1">
                  <JobMatchesSection isDark={isDark} cvData={cvData} />
                </div>
                <div className="lg:col-span-1">
                  <CareerRoadmapSection isDark={isDark} cvData={cvData} />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: DocumentTextIcon, label: 'Improve CV', href: '/cv-result/analysis', disabled: !cvData },
                    { icon: BriefcaseIcon, label: 'Find Jobs', href: '/cv-result/jobs', disabled: !cvData },
                    { icon: AcademicCapIcon, label: 'Skill Gap', href: '/cv-result/skills', disabled: !cvData },
                    { icon: EnvelopeIcon, label: 'Cover Letter', href: '/cv-result/cover', disabled: !cvData },
                  ].map((action) => (
                    <a
                      key={action.label}
                      href={action.disabled ? '#' : action.href}
                      className={`p-4 rounded-xl border transition-all group text-left
                        ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${isDark
                          ? 'bg-slate-900 border-slate-800 hover:border-sky-500/50 hover:bg-slate-800'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'}`}
                    >
                      <div className={`p-2 rounded-lg w-fit mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <action.icon className={`h-5 w-5 ${isDark ? 'text-slate-400 group-hover:text-sky-400' : 'text-slate-500 group-hover:text-sky-600'}`} />
                      </div>
                      <span className={`font-medium text-sm ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {action.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {(activeTab === 'applications' || activeTab === 'saved' || activeTab === 'analytics') && (
            <div className={`p-12 rounded-2xl border text-center
              ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4
                ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <BriefcaseIcon className={`h-10 w-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Coming Soon</h3>
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>This section is under development. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}