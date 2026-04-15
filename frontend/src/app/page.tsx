'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const painPoints = [
  {
    icon: '🕐',
    title: 'Hours Wasted on Irrelevant CVs',
    description: 'You spend hours screening hundreds of CVs, 80% are irrelevant.',
    accent: 'from-rose-50 to-orange-50 border-rose-200 text-rose-600'
  },
  {
    icon: '😫',
    title: 'Biased and Inconsistent Screening',
    description: 'Manual screening is biased and inconsistent - you miss great talent.',
    accent: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-600'
  },
  {
    icon: '💸',
    title: 'Wasted Team Time',
    description: 'Your expensive team time is wasted on administrative work.',
    accent: 'from-emerald-50 to-green-50 border-emerald-200 text-emerald-600'
  }
]

const redditQuotes = [
  {
    quote: '"I spend 15+ hours a week just filtering through resumes. Most are completely irrelevant. There has to be a better way."',
    source: 'r/recruiting'
  },
  {
    quote: '"The worst part is knowing I\'m probably missing great candidates because I\'m so burned out by the time I get to resume #50."',
    source: 'r/humanresources'
  }
]

const solutionFeatures = [
  {
    icon: '📄',
    title: 'Upload hundreds of CVs at once',
    description: 'PDF, DOC formats supported'
  },
  {
    icon: '🎯',
    title: 'Set simple filters',
    description: 'Skills, experience, certifications'
  },
  {
    icon: '⚡',
    title: 'Get a ranked shortlist in under 60 seconds',
    description: 'Fast results you can trust'
  },
  {
    icon: '🔍',
    title: 'See WHY candidates were selected',
    description: 'Transparent AI explanations'
  }
]

const founderBenefits = [
  {
    icon: '🎁',
    title: '6 months FREE access',
    description: 'When we launch, you get 6 months free.'
  },
  {
    icon: '💬',
    title: 'Help shape the product',
    description: 'Your feedback directly influences what we build.'
  },
  {
    icon: '⭐',
    title: 'Priority support forever',
    description: 'You\'ll always be a priority.'
  },
  {
    icon: '🚫',
    title: 'No credit card required',
    description: 'Just your email to join the waitlist.'
  }
]

interface CVData {
  filename: string
  name: string | null
  email: string | null
  phone: string | null
  skills: string[]
  education: string[]
  experience: string[]
  raw_text: string
}

type WaitlistFormProps = {
  submitted: boolean
  onSubmit: (email: string) => Promise<void>
  placeholder?: string
  ctaLabel?: string
  helperText?: string
  align?: 'left' | 'center'
  layout?: 'inline' | 'stack'
  compact?: boolean
  className?: string
}

function WaitlistForm({
  submitted,
  onSubmit,
  placeholder = 'Enter your work email',
  ctaLabel = 'Get Early Access →',
  helperText,
  align = 'left',
  layout = 'inline',
  compact = false,
  className = ''
}: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-5 text-sm font-medium text-green-700 backdrop-blur shadow-lg ${align === 'center' ? 'text-center' : ''} ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>You&apos;re on the list! We&apos;ll reach out with next steps and your founder perks.</span>
        </div>
      </motion.div>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(trimmedEmail)
      setEmail('')
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formLayoutClass = layout === 'inline' ? 'flex flex-col gap-3 sm:flex-row' : 'flex flex-col gap-3'
  const inputSize = compact ? 'px-3 py-2.5 text-sm rounded-xl' : 'px-4 py-3.5 text-base rounded-2xl'
  const buttonSize = compact ? 'px-4 py-2.5 text-sm rounded-xl' : 'px-6 py-3.5 text-sm sm:text-base rounded-2xl'

  return (
    <div className={`space-y-3 ${className} ${align === 'center' ? 'text-center' : ''}`}>
      <form onSubmit={handleSubmit} className={`${formLayoutClass} ${align === 'center' ? 'mx-auto' : ''}`}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          className={`flex-1 border-0 bg-white/90 text-slate-900 shadow-lg ring-2 ring-inset ring-slate-200/50 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none transition-all duration-300 backdrop-blur-sm ${inputSize}`}
          disabled={isSubmitting}
          aria-label="Work email"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`group relative flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:from-sky-500 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${buttonSize}`}
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Joining...
            </>
          ) : (
            ctaLabel
          )}
        </button>
      </form>
      {helperText && <p className="text-xs sm:text-sm text-gray-500">{helperText}</p>}
      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  }

  const shouldAnimate = mounted && !prefersReducedMotion

  const handleWaitlistSubmit = async (email: string) => {
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      setSubmitted(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      throw new Error(message)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch('http://localhost:5000/api/upload-cv', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        sessionStorage.setItem('cvData', JSON.stringify(result.data))
        router.push('/cv-result')
      } else {
        throw new Error(result.error || 'Processing failed')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setUploadError('Upload timed out. Please check that the backend server is running on port 5000.')
      } else {
        setUploadError(err instanceof Error ? err.message : 'Failed to upload CV. Please try again.')
      }
    } finally {
      setIsUploading(false)
      clearTimeout(timeoutId)
    }
  }, [router])

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
    <div className="bg-white text-slate-900">
      <header className="absolute inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Jobrizza logo"
              width={240}
              height={80}
              className="h-16 w-auto sm:h-20 md:h-24 object-contain"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#problem" className="relative transition-colors duration-200 hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-sky-500 after:to-blue-500 hover:after:w-full after:transition-all after:duration-300">Problem</a>
            <a href="#solution" className="relative transition-colors duration-200 hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-sky-500 after:to-blue-500 hover:after:w-full after:transition-all after:duration-300">Solution</a>
            <a href="#founders" className="relative transition-colors duration-200 hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-sky-500 after:to-blue-500 hover:after:w-full after:transition-all after:duration-300">Waitlist</a>
          </nav>
          <Link
            href="#join"
            className="hidden rounded-full border-2 border-slate-200 bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:from-sky-500 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 md:inline-flex"
          >
            Join Waitlist
          </Link>
        </div>
      </header>

      <section id="join" className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 pb-32 pt-32 sm:pt-40">
        {/* Animated background gradients */}
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-gradient-to-r from-sky-400/30 to-blue-400/30 blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-indigo-400/30 to-purple-400/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-cyan-400/20 to-sky-400/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} aria-hidden="true" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <motion.div className="max-w-2xl" {...(shouldAnimate ? fadeInUp : {})}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200/50 bg-white/60 px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur-sm mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              Early Access Available
            </motion.div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Stop Wasting Time on{' '}
              <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                Irrelevant CVs
              </span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 sm:text-2xl font-medium">
              We&apos;re building an AI tool that filters hundreds of CVs in seconds, so you only interview qualified candidates.
            </p>

            <div className="mt-8">
              <WaitlistForm 
                submitted={submitted} 
                onSubmit={handleWaitlistSubmit} 
                placeholder="Enter your work email"
                ctaLabel="Join waitlist for early access"
                helperText="No spam. We'll email when ready. First 50 users get 6 months free."
              />
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-lg"
            {...(shouldAnimate
              ? {
                  initial: { opacity: 0, y: 24, scale: 0.95 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' }
                }
              : {})}
          >
            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-sky-400/20 via-blue-400/20 to-indigo-400/20 blur-2xl opacity-75 animate-pulse" aria-hidden="true" />
            
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/90 px-8 py-10 shadow-2xl backdrop-blur-xl ring-1 ring-slate-200/50">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview</span>
              </div>

              {/* Upload area with dropzone */}
              <div
                {...getRootProps()}
                className={`relative rounded-2xl border-2 border-dashed px-8 py-12 text-center backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                  isDragActive
                    ? 'border-sky-500 bg-gradient-to-br from-sky-100 to-blue-100'
                    : 'border-sky-300/50 bg-gradient-to-br from-sky-50/50 to-blue-50/50 hover:border-sky-400 hover:bg-gradient-to-br hover:from-sky-50 hover:to-blue-50'
                }`}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent mb-3"></div>
                    <p className="text-base font-semibold text-slate-700">Processing...</p>
                  </div>
                ) : (
                  <>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-4 text-5xl"
                    >
                      📄
                    </motion.div>
                    <p className="text-base font-semibold text-slate-700 mb-2">
                      {isDragActive ? 'Drop CV here...' : 'CV Upload Area'}
                    </p>
                    <p className="text-sm text-slate-500">Drag & drop or click to upload</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <span>PDF, DOC, DOCX</span>
                      <span>•</span>
                      <span>Up to 200 files</span>
                    </div>
                  </>
                )}
                {uploadError && (
                  <p className="mt-3 text-sm text-red-600">{uploadError}</p>
                )}
              </div>

              {/* Filter settings */}
              <div className="mt-6 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 px-6 py-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Filter Settings</p>
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">AI Powered</span>
                </div>
                <div className="space-y-3">
                  {['Skills', 'Experience', 'Certifications'].map((item, idx) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2.5 backdrop-blur-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500"></div>
                      <span className="text-sm font-medium text-slate-600">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Stats preview */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-4 py-3 backdrop-blur-sm">
                <div>
                  <p className="text-xs text-slate-500">Processing time</p>
                  <p className="text-lg font-bold text-slate-900">&lt; 60s</p>
                </div>
                <div className="h-8 w-px bg-slate-300"></div>
                <div>
                  <p className="text-xs text-slate-500">CVs processed</p>
                  <p className="text-lg font-bold text-slate-900">200+</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="problem" className="relative py-32 sm:py-40 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center" {...(shouldAnimate ? fadeInUp : {})}>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg"
            >
              The Recruitment Black Hole
            </motion.span>
            <h2 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              The Problem We&apos;re Solving
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {painPoints.map((point) => (
              <motion.div
                key={point.title}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-8 shadow-xl backdrop-blur transition-all duration-300 hover:shadow-2xl ${point.accent}`}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                <div className="relative">
                  <div className="text-5xl mb-6 transform transition-transform duration-300 group-hover:scale-110">{point.icon}</div>
                  <p className="text-xl font-bold text-slate-900 mb-3">{point.title}</p>
                  <p className="text-base leading-7 text-slate-700">{point.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {redditQuotes.map((quote, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:border-slate-300"
              >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                <div className="mb-4 text-2xl opacity-20">&quot;</div>
                <p className="text-lg italic text-slate-700 leading-relaxed font-medium">{quote.quote}</p>
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center text-white text-xs font-bold">r</div>
                  <p className="text-sm font-semibold text-slate-600">{quote.source}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="solution" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-32 text-white sm:py-40">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)]" aria-hidden="true" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} aria-hidden="true" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center" {...(shouldAnimate ? fadeInUp : {})}>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 shadow-lg"
            >
              Our Focused Solution
            </motion.span>
            <h2 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              AI That Actually Works For Recruiters
            </h2>
            <p className="mt-6 text-lg text-white/80 sm:text-xl font-medium">
              We&apos;re starting with just CV filtering - because that&apos;s where the pain is.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {solutionFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-cyan-500/0 to-sky-500/0 group-hover:from-blue-500/10 group-hover:via-cyan-500/10 group-hover:to-sky-500/10 transition-all duration-300" aria-hidden="true" />
                <div className="relative">
                  <div className="text-5xl mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-base leading-7 text-white/80">{feature.description}</p>
                </div>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            {...(shouldAnimate ? fadeInUp : {})}
            className="mt-16 rounded-3xl border-2 border-white/20 bg-gradient-to-r from-white/10 to-white/5 px-8 py-10 text-center backdrop-blur-xl shadow-2xl sm:px-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-2 mb-4">
              <span className="text-yellow-300">⚠️</span>
              <span className="text-xs font-semibold text-yellow-200 uppercase tracking-wide">Notice</span>
            </div>
            <p className="text-lg font-semibold text-white">
              We&apos;re starting with just CV filtering - because that&apos;s where the pain is.
            </p>
          </motion.div>
        </div>
      </section>


      <section id="founders" className="relative py-32 sm:py-40 bg-gradient-to-b from-white via-sky-50/30 to-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-3xl text-center" {...(shouldAnimate ? fadeInUp : {})}>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 border border-sky-200 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-sky-700 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              Be a Founding Recruiter
            </motion.span>
            <h2 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Join the Waitlist
            </h2>
            <p className="mt-6 text-lg text-slate-600 font-medium">Help us validate demand and shape the product from day one.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {founderBenefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:border-sky-300/50"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/50 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                <div className="relative">
                  <div className="text-5xl mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{benefit.icon}</div>
                  <p className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</p>
                  <p className="text-base leading-7 text-slate-600">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...(shouldAnimate ? fadeInUp : {})} className="mt-12 flex justify-center">
            <WaitlistForm
              submitted={submitted}
              onSubmit={handleWaitlistSubmit}
              layout="inline"
              align="center"
              helperText="No credit card required. We'll email when ready."
              compact
              className="w-full max-w-xl"
            />
          </motion.div>
        </div>
      </section>

      <footer className="relative border-t border-slate-200/50 bg-gradient-to-b from-white to-slate-50/30 py-12 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-white to-slate-50 p-1 shadow-md ring-1 ring-slate-200/50">
              <Image
                src="/images/logo.png"
                alt="Jobrizza logo"
                width={48}
                height={48}
                className="h-full w-full object-contain object-center"
              />
            </div>
            <span className="font-medium text-slate-600">Jobrizza <span className="text-slate-300">•</span> AI co-pilot for recruiters</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center sm:items-end sm:text-right">
            <p className="text-sm text-slate-700 font-semibold">
              No product exists yet - we&apos;re validating demand.
            </p>
            <p className="text-xs text-slate-500">
              If we get 100 serious recruiters on this list, we&apos;ll build it.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="font-medium transition-colors duration-200 hover:text-slate-700 hover:underline">Privacy</Link>
            <Link href="#" className="font-medium transition-colors duration-200 hover:text-slate-700 hover:underline">Terms</Link>
            <Link href="mailto:contact@Jobrizza.com" className="font-medium transition-colors duration-200 hover:text-sky-600 hover:underline">contact@Jobrizza.com</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
