'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'
import { fetchWithAuth } from '@/lib/api'
import { motion } from 'framer-motion'
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  LanguageIcon,
  GlobeAltIcon,
  LinkIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

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

export default function ProfilePage() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [profile, setProfile] = useState<ProfileData>(() => {
    const nameParts = user?.name?.split(' ') || ['', '']
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
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
    }
  })

  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
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

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      const res = await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      })

      if (!res.ok) throw new Error('Failed to save profile')
      setSaveMessage('Profile saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save profile:', error)
      setSaveMessage('Failed to save profile. Please try again.')
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
    ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`

  const selectClass = `w-full px-3 py-2 rounded-lg border outline-none text-sm
    ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500' : 'bg-white border-slate-300 focus:border-sky-500'}`

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <UserCircleIcon className="h-8 w-8 text-sky-600" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            My Profile
          </h1>
        </div>

        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-xl ${saveMessage.includes('success') 
              ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              : isDark ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
        >
          {/* Header with Avatar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold
                ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{profile.jobTitle || 'No job title set'}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPinIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {profile.location || 'No location set'}
                  </span>
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
            {/* Personal Information */}
            <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UserCircleIcon className="h-5 w-5 text-sky-500" /> Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {(['firstName', 'lastName'] as const).map(key => (
                    <div key={key}>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {key === 'firstName' ? 'First Name' : 'Last Name'}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile[key]}
                          onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                          className={inputClass}
                        />
                      ) : (
                        <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {profile[key] || '—'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {[
                  { key: 'email', label: 'Email', icon: EnvelopeIcon, type: 'email' },
                  { key: 'phone', label: 'Phone', icon: PhoneIcon, type: 'tel' },
                  { key: 'location', label: 'Location', icon: MapPinIcon, type: 'text' },
                ].map(({ key, label, icon: Icon, type }) => (
                  <div key={key}>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      {isEditing ? (
                        <input
                          type={type}
                          value={profile[key as keyof typeof profile] as string}
                          onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                          className={`flex-1 ${inputClass}`}
                        />
                      ) : (
                        <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {(profile[key as keyof typeof profile] as string) || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Preferences */}
            <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BriefcaseIcon className="h-5 w-5 text-sky-500" /> Job Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Job Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.jobTitle}
                      onChange={e => setProfile({ ...profile, jobTitle: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Software Engineer"
                    />
                  ) : (
                    <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {profile.jobTitle || '—'}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Experience
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.experience}
                        onChange={e => setProfile({ ...profile, experience: e.target.value })}
                        className={selectClass}
                      >
                        {['0-2 years', '3-5 years', '5-8 years', '8+ years'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {profile.experience}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Job Type
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.jobType}
                        onChange={e => setProfile({ ...profile, jobType: e.target.value })}
                        className={selectClass}
                      >
                        {['Full-time', 'Part-time', 'Contract', 'Freelance'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {profile.jobType}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Work Mode
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.workMode}
                        onChange={e => setProfile({ ...profile, workMode: e.target.value })}
                        className={selectClass}
                      >
                        {['Remote', 'On-site', 'Hybrid'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {profile.workMode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Availability
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.availability}
                        onChange={e => setProfile({ ...profile, availability: e.target.value })}
                        className={selectClass}
                      >
                        {['Immediately', '1-2 weeks', '2-4 weeks', '1+ month'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {profile.availability}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Expected Salary
                  </label>
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.expectedSalary}
                        onChange={e => setProfile({ ...profile, expectedSalary: e.target.value })}
                        className={`flex-1 ${inputClass}`}
                        placeholder="e.g. 100,000 - 150,000"
                      />
                    ) : (
                      <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {profile.expectedSalary || '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio / About Me */}
            <div className={`lg:col-span-2 p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <DocumentTextIcon className="h-5 w-5 text-sky-500" /> Bio / About Me
              </h3>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border outline-none resize-none text-sm ${inputClass}`}
                  placeholder="Tell us about yourself, your experience, and what you're looking for..."
                />
              ) : (
                <p className={`leading-relaxed text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {profile.bio || 'No bio added yet.'}
                </p>
              )}
            </div>

            {/* Skills */}
            <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <AcademicCapIcon className="h-5 w-5 text-sky-500" /> Skills
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.skills.map(skill => (
                  <span key={skill} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                    ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
                    {skill}
                    {isEditing && (
                      <button onClick={() => removeSkill(skill)} className="hover:text-rose-400 transition-colors">
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
                    onChange={e => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                  />
                  <button
                    onClick={addSkill}
                    className={`px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Languages */}
            <div className={`p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <LanguageIcon className="h-5 w-5 text-sky-500" /> Languages
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.languages.map(lang => (
                  <span key={lang} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                    ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    {lang}
                    {isEditing && (
                      <button onClick={() => removeLanguage(lang)} className="hover:text-rose-400 transition-colors">
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
                    onChange={e => setNewLanguage(e.target.value)}
                    placeholder="Add a language"
                    onKeyDown={e => e.key === 'Enter' && addLanguage()}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                  />
                  <button
                    onClick={addLanguage}
                    className={`px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className={`lg:col-span-2 p-5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <GlobeAltIcon className="h-5 w-5 text-sky-500" /> Social Links
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { key: 'website', label: 'Website', icon: LinkIcon },
                  { key: 'linkedin', label: 'LinkedIn', icon: LinkIcon },
                  { key: 'github', label: 'GitHub', icon: LinkIcon },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key}>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      {isEditing ? (
                        <input
                          type="url"
                          value={profile[key as keyof typeof profile] as string}
                          onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                          className={`flex-1 ${inputClass}`}
                          placeholder={`https://${key}.com/...`}
                        />
                      ) : (profile[key as keyof typeof profile] as string) ? (
                        <a
                          href={profile[key as keyof typeof profile] as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-medium text-sm hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}
                        >
                          {label} Profile
                        </a>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
