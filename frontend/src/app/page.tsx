'use client'

import { useAuth } from '@/contexts/Authcontext'
import { useTheme } from '@/contexts/Themecontext'
import { Header } from '@/components/layout/navbar'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

/* ─── Data ─── */
const STATS = [
  { value: '10x', label: 'faster screening' },
  { value: '95%', label: 'accuracy rate' },
  { value: '200+', label: 'CVs per minute' },
  { value: '60s', label: 'to ranked list' },
]

const FEATURES = [
  { icon: '⚡', title: 'Instant CV Screening', desc: 'Upload hundreds of CVs. Get a ranked shortlist in under 60 seconds.' },
  { icon: '🎯', title: 'Smart Skill Matching', desc: 'AI matches candidates to your exact role requirements automatically.' },
  { icon: '📊', title: 'ATS Score Analysis', desc: 'See how each CV performs against industry-standard ATS systems.' },
  { icon: '🗺️', title: 'Career Path Mapping', desc: 'Generate personalized 5-year career roadmaps for every candidate.' },
  { icon: '🎤', title: 'Mock Interview Prep', desc: 'AI-generated interview questions tailored to each candidate\'s profile.' },
  { icon: '💰', title: 'Salary Intelligence', desc: 'Real-time salary benchmarking across locations and skill sets.' },
]

const TESTIMONIALS = [
  { name: 'Areeba Khan', role: 'HR Lead, TechPk', quote: 'Jobrizza cut our screening time by 80%. We now only interview candidates that truly fit.', avatar: 'A' },
  { name: 'Marcus Chen', role: 'Talent Manager, FinTech Co', quote: 'The ATS scoring feature alone is worth it. We\'ve seen a 40% improvement in offer acceptance rates.', avatar: 'M' },
]

const PAIN_POINTS = [
  { icon: '🕐', title: 'Hours Wasted', desc: '80% of CVs you screen are completely irrelevant to the role.', color: 'from-rose-500/10 to-orange-500/5 border-rose-500/20' },
  { icon: '😫', title: 'Biased Screening', desc: 'Manual screening introduces unconscious bias and misses great talent.', color: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20' },
  { icon: '💸', title: 'Wasted Resources', desc: 'Your team\'s time is too valuable to spend on administrative filtering.', color: 'from-emerald-500/10 to-green-500/5 border-emerald-500/20' },
]

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
          placeholder="Enter your work email"
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
      <section className={`relative overflow-hidden py-24 sm:py-32 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-sky-50 via-white to-white'}`}>
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
            <h2 className={`mt-3 text-4xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Hiring is Broken</h2>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Recruiters spend 80% of their time on work that AI can do better.
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
      <section id="solution" className={`py-24 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Our Solution</span>
            <h2 className={`mt-3 text-4xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Everything You Need</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl border p-6 transition-all group
                  ${isDark ? 'bg-slate-900 border-slate-800 hover:border-sky-500/30' : 'bg-white border-slate-200 hover:border-sky-200 shadow-sm hover:shadow-md'}`}>
                <div className="text-3xl mb-4 transition-transform group-hover:scale-110">{f.icon}</div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{f.desc}</p>
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
            © 2025 Jobrizza. AI co-pilot for modern recruiting.
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