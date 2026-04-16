'use client'

import { useState, useCallback } from 'react'
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
  BuildingOfficeIcon,
  GlobeAltIcon,
  LinkIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon as JobIcon,
  BanknotesIcon,
  ClockIcon as AvailabilityIcon,
  LanguageIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Header } from '@/components/layout/navbar'
import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'

// Stats Data
const STATS = [
  { name: 'Job Matches', value: '24', icon: BriefcaseIcon, change: '+12%', trend: 'up' },
  { name: 'ATS Score', value: '87', icon: ChartBarIcon, change: '+5%', trend: 'up' },
  { name: 'Interviews', value: '3', icon: ClockIcon, change: '+2', trend: 'up' },
  { name: 'Profile Views', value: '156', icon: UserCircleIcon, change: '+23%', trend: 'up' },
]

// Job Matches Data
const JOB_MATCHES = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $150k',
    match: 95,
    skills: ['React', 'TypeScript', 'Node.js'],
    posted: '2 days ago',
    logo: 'T',
  },
  {
    id: 2,
    title: 'Full Stack Developer',
    company: 'StartupX',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100k - $130k',
    match: 92,
    skills: ['Python', 'React', 'AWS'],
    posted: '3 days ago',
    logo: 'S',
  },
  {
    id: 3,
    title: 'React Developer',
    company: 'Digital Solutions',
    location: 'New York, NY',
    type: 'Contract',
    salary: '$90k - $110k',
    match: 88,
    skills: ['React', 'Next.js', 'Tailwind'],
    posted: '5 days ago',
    logo: 'D',
  },
  {
    id: 4,
    title: 'Frontend Engineer',
    company: 'InnovateLabs',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$110k - $140k',
    match: 85,
    skills: ['Vue.js', 'JavaScript', 'CSS'],
    posted: '1 week ago',
    logo: 'I',
  },
]

// ATS Score Breakdown
const ATS_BREAKDOWN = [
  { category: 'Keywords Match', score: 92, color: 'emerald' },
  { category: 'Skills Alignment', score: 88, color: 'sky' },
  { category: 'Experience Relevance', score: 85, color: 'blue' },
  { category: 'Formatting', score: 95, color: 'violet' },
  { category: 'Education Match', score: 82, color: 'amber' },
]

// Career Roadmap Data
const CAREER_ROADMAP = [
  {
    quarter: 'Q1 2024',
    title: 'Skill Enhancement',
    description: 'Master advanced React patterns and TypeScript',
    completed: true,
    icon: BookOpenIcon,
    milestones: ['Learn React Hooks', 'TypeScript Advanced', 'State Management'],
  },
  {
    quarter: 'Q2 2024',
    title: 'Portfolio Growth',
    description: 'Build 3 full-stack projects with modern tech stack',
    completed: false,
    current: true,
    icon: SparklesIcon,
    milestones: ['E-commerce Platform', 'SaaS Dashboard', 'Mobile App'],
  },
  {
    quarter: 'Q3 2024',
    title: 'Leadership Skills',
    description: 'Develop team management and mentoring capabilities',
    completed: false,
    icon: TagIcon,
    milestones: ['Lead a Project', 'Mentor Junior Devs', 'Code Reviews'],
  },
  {
    quarter: 'Q4 2024',
    title: 'Senior Position',
    description: 'Secure Senior Developer role at top tech company',
    completed: false,
    icon: TrophyIcon,
    milestones: ['Target Companies', 'Interview Prep', 'Negotiation'],
  },
]

// CV Upload Component
function CVUploadSection({ isDark }: { isDark: boolean }) {
  const [uploaded, setUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploading(true)
      // Simulate upload
      setTimeout(() => {
        setUploading(false)
        setUploaded(true)
      }, 2000)
    }
  }, [])

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
            Active
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
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>Uploading your CV...</p>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <DocumentTextIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>john_doe_resume.pdf</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Uploaded 2 days ago • 2.4 MB</p>
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

      {uploaded && (
        <div className="mt-4 flex gap-3">
          <button className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
            ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            Preview CV
          </button>
          <button className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
            ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
            Download
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ATS Score Component
function ATSScoreSection({ isDark }: { isDark: boolean }) {
  const overallScore = 87

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ATS Score</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>How well your CV performs</p>
        </div>
        <div className="relative h-16 w-16">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className={isDark ? 'text-slate-800' : 'text-slate-200'}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-sky-500"
              strokeDasharray={`${overallScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{overallScore}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {ATS_BREAKDOWN.map((item) => (
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
                className={`h-full rounded-full bg-${item.color}-500`}
              />
            </div>
          </div>
        ))}
      </div>

      <button className={`mt-6 w-full py-3 rounded-xl font-medium transition-colors
        ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
        Improve Your Score
      </button>
    </motion.div>
  )
}

// Job Matches Component
function JobMatchesSection({ isDark }: { isDark: boolean }) {
  const [savedJobs, setSavedJobs] = useState<number[]>([])

  const toggleSave = (id: number) => {
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
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Based on your skills and experience</p>
        </div>
        <button className={`text-sm font-medium flex items-center gap-1 ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'}`}>
          View All <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {JOB_MATCHES.map((job) => (
          <div
            key={job.id}
            className={`p-4 rounded-xl border transition-all group cursor-pointer
              ${isDark 
                ? 'bg-slate-800 border-slate-700 hover:border-sky-500/50' 
                : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:shadow-md'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold
                ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700 shadow-sm'}`}>
                {job.logo}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {job.title}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{job.company}</p>
                  </div>
                  <button
                    onClick={() => toggleSave(job.id)}
                    className={`p-2 rounded-lg transition-colors ${savedJobs.includes(job.id) ? 'text-yellow-500' : isDark ? 'text-slate-600 hover:text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                  >
                    <StarIcon className={`h-5 w-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPinIcon className="h-4 w-4" />
                    {job.location}
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <CurrencyDollarIcon className="h-4 w-4" />
                    {job.salary}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(skill => (
                      <span key={skill} className={`px-2 py-1 rounded-md text-xs font-medium
                        ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600'}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                      ${job.match >= 90 ? 'bg-emerald-100 text-emerald-700' : 
                        job.match >= 85 ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                      {job.match}% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                ${isDark ? 'bg-sky-500 hover:bg-sky-400 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}>
                Apply Now
              </button>
              <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Candidate Profile Component
function CandidateProfileSection({ isDark }: { isDark: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate software developer with 5+ years of experience in building scalable web applications. Specialized in React, TypeScript, and Node.js. Looking for challenging opportunities to grow and contribute.',
    website: 'https://johndoe.dev',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    jobTitle: 'Senior Frontend Developer',
    experience: '5-8 years',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    expectedSalary: '$120,000 - $150,000',
    availability: '2 weeks notice',
    languages: ['English', 'Spanish'],
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'PostgreSQL'],
  })

  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save to backend
  }

  const addSkill = () => {
    if (newSkill && !profile.skills.includes(newSkill)) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill] })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) })
  }

  const addLanguage = () => {
    if (newLanguage && !profile.languages.includes(newLanguage)) {
      setProfile({ ...profile, languages: [...profile.languages, newLanguage] })
      setNewLanguage('')
    }
  }

  const removeLanguage = (langToRemove: string) => {
    setProfile({ ...profile, languages: profile.languages.filter(l => l !== langToRemove) })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
    >
      {/* Header */}
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
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{profile.jobTitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <MapPinIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{profile.location}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${isEditing
              ? (isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')
              : (isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100')
            }`}
        >
          {isEditing ? <CheckIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <UserCircleIcon className="h-5 w-5 text-sky-500" />
            Personal Information
          </h4>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.firstName}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email</label>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Phone</label>
              <div className="flex items-center gap-2">
                <PhoneIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Location</label>
              <div className="flex items-center gap-2">
                <MapPinIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.location}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Preferences */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <JobIcon className="h-5 w-5 text-sky-500" />
            Job Preferences
          </h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Desired Job Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none
                    ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                />
              ) : (
                <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.jobTitle}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Experience Level</label>
                {isEditing ? (
                  <select
                    value={profile.experience}
                    onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  >
                    <option>0-2 years</option>
                    <option>3-5 years</option>
                    <option>5-8 years</option>
                    <option>8+ years</option>
                  </select>
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.experience}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Job Type</label>
                {isEditing ? (
                  <select
                    value={profile.jobType}
                    onChange={(e) => setProfile({ ...profile, jobType: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                    <option>Internship</option>
                  </select>
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.jobType}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Work Mode</label>
                {isEditing ? (
                  <select
                    value={profile.workMode}
                    onChange={(e) => setProfile({ ...profile, workMode: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  >
                    <option>Remote</option>
                    <option>On-site</option>
                    <option>Hybrid</option>
                  </select>
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.workMode}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Expected Salary</label>
                <div className="flex items-center gap-2">
                  <BanknotesIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.expectedSalary}
                      onChange={(e) => setProfile({ ...profile, expectedSalary: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border outline-none
                        ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                    />
                  ) : (
                    <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.expectedSalary}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Availability</label>
              <div className="flex items-center gap-2">
                <AvailabilityIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <select
                    value={profile.availability}
                    onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  >
                    <option>Immediately</option>
                    <option>1 week notice</option>
                    <option>2 weeks notice</option>
                    <option>1 month notice</option>
                    <option>2+ months notice</option>
                  </select>
                ) : (
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.availability}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className={`lg:col-span-2 p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <DocumentTextIcon className="h-5 w-5 text-sky-500" />
            Bio / About Me
          </h4>
          {isEditing ? (
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border outline-none resize-none
                ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
            />
          ) : (
            <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{profile.bio}</p>
          )}
        </div>

        {/* Skills */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <AcademicCapIcon className="h-5 w-5 text-sky-500" />
            Skills
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                  ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}
              >
                {skill}
                {isEditing && (
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm
                  ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <button
                onClick={addSkill}
                className={`px-3 py-2 rounded-lg transition-colors
                  ${isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Languages */}
        <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <LanguageIcon className="h-5 w-5 text-sky-500" />
            Languages
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.languages.map((lang) => (
              <span
                key={lang}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                  ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}
              >
                {lang}
                {isEditing && (
                  <button
                    onClick={() => removeLanguage(lang)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language"
                className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm
                  ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
              />
              <button
                onClick={addLanguage}
                className={`px-3 py-2 rounded-lg transition-colors
                  ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className={`lg:col-span-2 p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <GlobeAltIcon className="h-5 w-5 text-sky-500" />
            Social Links
          </h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Website</label>
              <div className="flex items-center gap-2">
                <LinkIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                     className={`font-medium text-sm hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>LinkedIn</label>
              <div className="flex items-center gap-2">
                <LinkIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <input
                    type="url"
                    value={profile.linkedin}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                     className={`font-medium text-sm hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    LinkedIn Profile
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>GitHub</label>
              <div className="flex items-center gap-2">
                <LinkIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                {isEditing ? (
                  <input
                    type="url"
                    value={profile.github}
                    onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm
                      ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`}
                  />
                ) : (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                     className={`font-medium text-sm hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    GitHub Profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Career Roadmap Component
function CareerRoadmapSection({ isDark }: { isDark: boolean }) {
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
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your personalized growth plan</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
          ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
          <ArrowTrendingUpIcon className="h-4 w-4" />
          75% Complete
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />

        <div className="space-y-6">
          {CAREER_ROADMAP.map((step, index) => (
            <div key={step.quarter} className="relative flex gap-4">
              {/* Timeline Dot */}
              <div className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center
                ${step.completed 
                  ? 'bg-emerald-500' 
                  : step.current 
                    ? 'bg-sky-500 ring-4 ' + (isDark ? 'ring-sky-500/20' : 'ring-sky-200')
                    : isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                <step.icon className={`h-5 w-5 ${step.completed || step.current ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </div>

              {/* Content */}
              <div className={`flex-1 p-4 rounded-xl border transition-all
                ${step.current 
                  ? isDark ? 'bg-slate-800 border-sky-500/50' : 'bg-sky-50 border-sky-200'
                  : step.completed
                    ? isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    : isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider
                    ${step.completed ? 'text-emerald-500' : step.current ? 'text-sky-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {step.quarter}
                  </span>
                  {step.completed && <CheckCircleIcon className="h-4 w-4 text-emerald-500" />}
                  {step.current && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>Current</span>}
                </div>
                <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {step.milestones.map((milestone) => (
                    <span key={milestone} className={`px-2 py-1 rounded-md text-xs
                      ${step.completed 
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : step.current
                          ? isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700'
                          : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                      {milestone}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className={`mt-6 w-full py-3 rounded-xl font-medium transition-colors
        ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
        Edit Roadmap
      </button>
    </motion.div>
  )
}

// Main Dashboard
export default function CandidateDashboard() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-sky-50'}`}>
      <Header />
      
      {/* Hero Section */}
      <section className={`pt-24 pb-8 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Welcome back, <span className="text-sky-500">{user?.name?.split(' ')[0] || 'John'}</span>! 👋
              </h1>
              <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Here's your personalized dashboard with AI-powered job matches and career insights.
              </p>
            </div>
            <button className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25 transition-all`}>
              <BriefcaseIcon className="h-5 w-5" />
              Browse Jobs
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-slate-200">
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
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <CandidateProfileSection isDark={isDark} />
          )}

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 rounded-2xl border transition-all hover:shadow-lg
                      ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-sky-50'}`}>
                        <stat.icon className={`h-6 w-6 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium
                        ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <ArrowTrendingUpIcon className="h-3 w-3" />
                        {stat.change}
                      </span>
                    </div>
                    <p className={`mt-3 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.name}</p>
                  </motion.div>
                ))}
              </div>

              {/* Dashboard Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - CV & ATS */}
                <div className="space-y-6">
                  <CVUploadSection isDark={isDark} />
                  <ATSScoreSection isDark={isDark} />
                </div>

                {/* Middle Column - Job Matches */}
                <div className="lg:col-span-1">
                  <JobMatchesSection isDark={isDark} />
                </div>

                {/* Right Column - Career Roadmap */}
                <div className="lg:col-span-1">
                  <CareerRoadmapSection isDark={isDark} />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: DocumentTextIcon, label: 'Update Resume', color: 'blue' },
                    { icon: BriefcaseIcon, label: 'Find Jobs', color: 'sky' },
                    { icon: EnvelopeIcon, label: 'Messages', color: 'violet' },
                    { icon: AcademicCapIcon, label: 'Skills Test', color: 'amber' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className={`p-4 rounded-xl border transition-all group text-left
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
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Other Tabs Placeholder */}
          {(activeTab === 'applications' || activeTab === 'saved' || activeTab === 'analytics') && (
            <div className={`p-12 rounded-2xl border text-center
              ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4
                ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <BriefcaseIcon className={`h-10 w-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Coming Soon
              </h3>
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                This section is under development. Check back soon!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 