'use client'

import { useAuth } from '@/contexts/Authcontext'
import { useTheme } from '@/contexts/Themecontext'
import { ThemeToggle } from '@/components/Themetoggle'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'

function LoginForm() {
  const { isDark } = useTheme()
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [userType, setUserType] = useState<'candidate' | 'company'>('candidate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(formData.email, formData.password, userType)
      router.push(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally { setLoading(false) }
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all
    ${isDark
      ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
    }`

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-sky-50 to-slate-50'}`}>
      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Jobrizza</Link>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome back! Sign in to continue.
          </p>
        </div>

        <div className={`rounded-2xl p-8 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          {/* User type toggle */}
          <div className={`flex rounded-xl p-1 mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['candidate', 'company'] as const).map(t => (
              <button key={t} onClick={() => setUserType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all
                  ${userType === t
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                {t}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
              <input type="email" required value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
              <input type="password" required value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" className={inputClass} />
            </div>

            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className={`text-sm font-medium ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : `Sign in as ${userType}`}
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Don't have an account?{' '}
            <Link href="/auth/signup" className={`font-semibold ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}>
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" /></div>}><LoginForm /></Suspense>
}