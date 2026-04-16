'use client'

import { useAuth } from '@/contexts/Authcontext'
import { useTheme } from '@/contexts/Themecontext'
import { Header } from '@/components/layout/navbar'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CheckIcon } from '@heroicons/react/20/solid'
import { AcademicCapIcon, ChartBarIcon, DocumentArrowUpIcon, EnvelopeIcon, UserGroupIcon } from '@heroicons/react/24/outline'

/* ─── Data ─── */
const STATS = [
  { value: '10x', label: 'faster job matches' },
  { value: '95%', label: 'match accuracy' },
  { value: '24h', label: 'average response' },
  { value: '60s', label: 'to get started' },
]

const FEATURES = [
  { title: 'AI CV Analysis', description: 'Upload your CV and get instant AI-powered feedback and improvements', icon: DocumentArrowUpIcon },
  { title: 'Smart Job Matching', description: 'Get matched with jobs that fit your skills and experience perfectly', icon: ChartBarIcon },
  { title: 'Multi-language Support', description: 'Platform available in multiple languages for global job seekers', icon: AcademicCapIcon },
  { title: 'Career Insights Dashboard', description: 'Track your applications, interviews, and career progress', icon: ChartBarIcon },
  { title: 'Skill Development Roadmaps', description: 'Personalized learning paths to help you land your dream job', icon: UserGroupIcon },
  { title: 'Interview Preparation', description: 'AI-powered mock interviews and feedback to help you succeed', icon: EnvelopeIcon },
]

const PRICING_TIERS = [
  {
    name: 'Free',
    id: 'tier-free',
    price: { monthly: '$0' },
    description: 'Perfect for starting your job search',
    features: [
      'Basic CV analysis',
      'Limited job matches',
      'Basic profile setup',
      'Standard support',
      'Up to 5 applications',
    ],
    cta: 'Get started',
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    price: { monthly: '$29' },
    description: 'Everything you need to land your dream job',
    features: [
      'Advanced CV analysis',
      'Priority job matching',
      'Interview preparation AI',
      'Priority support',
      'Unlimited applications',
      'Career roadmap access',
      'Skills assessment',
    ],
    cta: 'Start free trial',
    mostPopular: true,
  },
  {
    name: 'Premium',
    id: 'tier-premium',
    price: { monthly: '$79' },
    description: 'Advanced features for career acceleration',
    features: [
      'Everything in Pro',
      '1-on-1 career coaching',
      'Resume writing service',
      'LinkedIn optimization',
      'Salary negotiation guide',
      'Dedicated support',
      'Job search strategy',
    ],
    cta: 'Contact sales',
    mostPopular: false,
  },
]

const FAQS = [
  {
    question: 'How does Jobrizza help me find a job?',
    answer: 'Jobrizza uses AI to analyze your CV, match you with relevant jobs, and provide personalized career guidance to help you land your dream role.'
  },
  {
    question: 'Can I create or improve my CV on the platform?',
    answer: 'Yes! Upload your CV for instant AI analysis and improvement suggestions. Get an optimized CV that stands out to employers.'
  },
  {
    question: 'Is my data secure on Jobrizza?',
    answer: 'Absolutely. We use industry-standard security practices to keep your personal information and CV data safe and private.'
  },
  {
    question: 'How do I join the early access list?',
    answer: 'You can join the early access list directly from our landing page. First 50 users get 6 months of Pro features free!'
  },
  {
    question: 'What regions does Jobrizza support?',
    answer: 'We are starting in Pakistan, India, the Middle East, and African markets, with plans to expand globally.'
  },
]

const TESTIMONIALS = [
  { name: 'Areeba Khan', role: 'Software Engineer', quote: 'Jobrizza helped me land my dream job in just 2 weeks. The AI matching is incredibly accurate!', avatar: 'A' },
  { name: 'Marcus Chen', role: 'Product Manager', quote: 'The career roadmap feature guided me to develop the right skills. I got promoted within 6 months!', avatar: 'M' },
]

const PAIN_POINTS = [
  { icon: '🕐', title: 'Endless Applications', desc: 'Job seekers apply to hundreds of jobs with little to no response.', color: 'from-rose-500/10 to-orange-500/5 border-rose-500/20' },
  { icon: '😫', title: 'Wrong Job Matches', desc: 'Most job platforms show irrelevant positions that waste your time.', color: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20' },
  { icon: '💸', title: 'No Career Guidance', desc: 'Unclear path to skill development and career advancement.', color: 'from-emerald-500/10 to-green-500/5 border-emerald-500/20' },
]

/* ─── FAQ Section Component ─── */
function FAQSection({ isDark }: { isDark: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className={`py-24 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>FAQ</span>
          <h2 className={`mt-3 text-4xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Frequently Asked Questions</h2>
          <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Got questions? We've got answers.
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl border overflow-hidden transition-all duration-300
                ${openIndex === idx 
                  ? (isDark ? 'bg-slate-800 border-sky-500/30 ring-1 ring-sky-500/20' : 'bg-white border-sky-300 ring-1 ring-sky-100 shadow-md')
                  : (isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm')
                }`}
            >
              <button
                className="w-full text-left flex justify-between items-center px-6 py-5 font-semibold text-base focus:outline-none group"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className={`pr-4 transition-colors ${openIndex === idx ? (isDark ? 'text-sky-400' : 'text-sky-600') : (isDark ? 'text-slate-100' : 'text-slate-900')}`}>
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${openIndex === idx 
                    ? (isDark ? 'bg-sky-500/20 rotate-180' : 'bg-sky-100 rotate-180') 
                    : (isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200')
                  }`}>
                  <svg 
                    className={`w-4 h-4 transition-colors ${openIndex === idx ? (isDark ? 'text-sky-400' : 'text-sky-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden"
                  >
                    <div className={`px-6 pb-5 pt-2 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <div className={`h-px w-full mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
        {/* CTA */}
        <div className={`mt-12 text-center p-6 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-sky-50'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Still have questions?{' '}
            <Link href="/contact" className={`font-semibold hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
              Contact our team
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─── Waitlist Form ─── */
function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isDark } = useTheme()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setLoading(false) }
  }

  if (submitted) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4">
      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">✓</div>
      <p className="text-emerald-400 font-medium text-sm">You're on the list! We'll reach out with next steps and founder perks.</p>
    </motion.div>
  )

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className={`flex ${compact ? 'gap-2' : 'flex-col sm:flex-row gap-3'}`}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={`flex-1 rounded-xl px-4 py-3 text-sm border outline-none focus:ring-2 focus:ring-sky-500 transition-all
            ${isDark
              ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          disabled={loading}
        />
        <button type="submit" disabled={loading}
          className={`${compact ? 'px-4 py-3' : 'px-6 py-3'} rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 whitespace-nowrap`}>
          {loading ? 'Joining…' : 'Get Early Access →'}
        </button>
      </form>
      {error && <p className="text-rose-400 text-xs">{error}</p>}
      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No spam. First 50 users get 6 months free.</p>
    </div>
  )
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const { isDark } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/&upload=true')
      return
    }
    if (!acceptedFiles.length) return

    setIsUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', acceptedFiles[0])

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API}/api/upload-cv`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const result = await res.json()
      if (result.success) {
        sessionStorage.setItem('cvData', JSON.stringify(result.data))
        router.push('/cv-result')
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Is the backend running?')
    } finally { setIsUploading(false) }
  }, [isAuthenticated, router])

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
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <Header />

      {/* ── Hero ── */}
      <section className={`relative overflow-hidden py-24 sm:py-12 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-sky-50 via-white to-white'}`}>
        {/* Background shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full blur-3xl ${isDark ? 'bg-sky-500/5' : 'bg-sky-200/40'}`} />
          <div className={`absolute -left-40 bottom-0 h-[500px] w-[500px] rounded-full blur-3xl ${isDark ? 'bg-blue-500/5' : 'bg-blue-100/40'}`} />
          <div className={`absolute inset-0 ${isDark ? '' : 'bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.05),transparent_60%)]'}`} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold mb-6 border
                ${isDark ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                </span>
                Early Access Now Open
              </div>

              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Stop Drowning in{' '}
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                  Irrelevant CVs
                </span>
              </h1>

              <p className={`text-xl leading-relaxed mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                AI that screens hundreds of CVs in under 60 seconds — so you only talk to candidates who actually fit.
              </p>

              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/${user?.userType}/dashboard`}
                    className="px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/20 text-center transition-all hover:-translate-y-0.5">
                    Go to Dashboard →
                  </Link>
                  <div {...getRootProps()} className={`flex-1 cursor-pointer rounded-xl border-2 border-dashed px-4 py-3.5 text-center text-sm font-medium transition-colors
                    ${isDragActive ? 'border-sky-500 bg-sky-500/10' : isDark ? 'border-slate-600 text-slate-400 hover:border-sky-500' : 'border-slate-200 text-slate-500 hover:border-sky-400'}`}>
                    <input {...getInputProps()} />
                    {isUploading ? '⏳ Processing...' : isDragActive ? '📄 Drop here!' : '📄 Drop a CV to analyze'}
                  </div>
                </div>
              ) : (
                <WaitlistForm />
              )}

              {uploadError && <p className="mt-3 text-sm text-rose-400">{uploadError}</p>}

              {/* Stats */}
              <div className="mt-10 grid grid-cols-4 gap-4">
                {STATS.map(s => (
                  <div key={s.label}>
                    <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Upload card */}
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="relative">
              <div className={`absolute -inset-4 rounded-3xl blur-2xl opacity-40 ${isDark ? 'bg-sky-500/10' : 'bg-sky-200/60'}`} />
              <div {...getRootProps()} className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all
                ${isDragActive
                  ? 'border-sky-500 bg-sky-500/10'
                  : isDark
                    ? 'border-slate-700 bg-slate-900 hover:border-sky-500/50'
                    : 'border-sky-200 bg-white shadow-xl hover:border-sky-400'
                }`}>
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                    <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Analyzing CV…</p>
                  </div>
                ) : (
                  <>
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} className="text-6xl mb-4">📄</motion.div>
                    <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAuthenticated ? 'Drop a CV here' : 'Try it instantly'}
                    </p>
                    <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAuthenticated ? 'PDF, DOC or DOCX' : 'Sign in to analyze your CV'}
                    </p>
                    {!isAuthenticated && (
                      <Link href="/auth/login" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-md shadow-sky-500/20 transition-all">
                        Sign in to upload →
                      </Link>
                    )}
                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div className="flex justify-around">
                        {['ATS Score', 'Skill Gap', 'Job Match', 'Salary Est.'].map(f => (
                          <div key={f} className="text-center">
                            <div className={`w-2 h-2 rounded-full mx-auto mb-1 bg-sky-500`} />
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{f}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {uploadError && <p className="mt-3 text-sm text-rose-400">{uploadError}</p>}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section id="problem" className={`py-24 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>The Problem</span>
            <h2 className={`mt-3 text-4xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Job Hunting is Broken</h2>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Job seekers spend hours applying with little success. AI can do it better.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-8 bg-gradient-to-br ${p.color}`}>
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{p.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={`py-24 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>Our Solution</span>
            <h2 className={`mt-3 text-4xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Platform Features</h2>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to streamline your hiring process and find the perfect candidates faster.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`group relative rounded-2xl border p-8 flex flex-col transition-all duration-300 overflow-hidden
                  ${isDark 
                    ? 'bg-slate-900/50 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/50' 
                    : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10'}`}>
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  ${isDark ? 'bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5' : 'bg-gradient-to-br from-sky-50 via-transparent to-blue-50'}`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300
                    ${isDark ? 'bg-gradient-to-br from-sky-500/20 to-blue-500/20' : 'bg-gradient-to-br from-sky-100 to-blue-100'}`}>
                    <f.icon className={`h-7 w-7 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{f.description}</p>
                </div>
                
                {/* Decorative corner accent */}
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500
                  ${isDark ? 'bg-sky-500/20' : 'bg-sky-400/20'}`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={`py-24 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>What Early Users Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p className={`text-base italic mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{t.name}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className={`py-24 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>Pricing</span>
            <h2 className={`mt-3 text-4xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Choose the right plan for you</h2>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Start free and scale as you grow. All plans include core AI screening features.
            </p>
          </div>
          <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={tier.mostPopular ? { y: -8 } : { y: -4 }}
                className={`relative flex flex-col justify-between rounded-3xl p-8 xl:p-10 transition-all duration-300
                  ${tier.mostPopular
                    ? isDark 
                      ? 'bg-slate-800 ring-2 ring-sky-500 shadow-xl shadow-sky-500/10' 
                      : 'bg-white ring-2 ring-sky-600 shadow-xl shadow-sky-500/10'
                    : isDark 
                      ? 'bg-slate-800/50 ring-1 ring-slate-700 hover:ring-slate-600' 
                      : 'bg-white ring-1 ring-slate-200 hover:ring-slate-300 shadow-sm hover:shadow-lg'
                  }`}
              >
                {/* Popular badge */}
                {tier.mostPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg
                      ${isDark ? 'bg-sky-500 text-white shadow-sky-500/25' : 'bg-sky-600 text-white shadow-sky-500/25'}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div>
                  <h3 className={`text-xl font-bold leading-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {tier.name}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{tier.description}</p>
                  <div className="mt-6 flex items-baseline gap-x-1">
                    <span className={`text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {tier.price.monthly}
                    </span>
                    <span className={`text-sm font-semibold leading-6 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>/month</span>
                  </div>
                  
                  {/* Savings badge for popular plan */}
                  {tier.mostPopular && (
                    <p className={`mt-2 text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Save 20% with annual billing
                    </p>
                  )}
                  
                  <ul role="list" className="mt-8 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3 items-start">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                          ${tier.mostPopular 
                            ? (isDark ? 'bg-sky-500/20' : 'bg-sky-100')
                            : (isDark ? 'bg-slate-700' : 'bg-slate-100')
                          }`}>
                          <CheckIcon className={`h-3.5 w-3.5 ${tier.mostPopular ? (isDark ? 'text-sky-400' : 'text-sky-600') : (isDark ? 'text-slate-400' : 'text-slate-600')}`} aria-hidden="true" />
                        </div>
                        <span className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#"
                  className={`mt-10 block rounded-xl px-4 py-3.5 text-center text-sm font-semibold leading-6 transition-all duration-200 hover:scale-[1.02]
                    ${tier.mostPopular
                      ? isDark 
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25' 
                        : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/25'
                      : isDark 
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 ring-1 ring-slate-600' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200'
                    }`}
                >
                  {tier.cta}
                </a>
              </motion.div>
            ))}
          </div>
          
          {/* Trust badges */}
          <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              Secure SSL encryption
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              30-day money back guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection isDark={isDark} />

      {/* ── CTA / Waitlist ── */}
      <section id="join" className={`py-24 ${isDark ? 'bg-gradient-to-b from-slate-950 to-slate-900' : 'bg-gradient-to-b from-white to-sky-50'}`}>
        <div className="mx-auto max-w-2xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className={`text-4xl sm:text-5xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Join the Waitlist
            </h2>
            <p className={`text-lg mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              First 50 teams get 6 months free. No credit card required.
            </p>
            {isAuthenticated ? (
              <Link href={`/${user?.userType}/dashboard`}
                className="inline-block px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-sky-500/20 transition-all hover:-translate-y-1">
                Go to Dashboard →
              </Link>
            ) : (
              <div className="max-w-md mx-auto">
                <WaitlistForm />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t py-10 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            © 2026 Jobrizza. AI co-pilot for modern recruiting.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className={`text-sm transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}