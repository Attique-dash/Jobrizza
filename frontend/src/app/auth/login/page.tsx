'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'
import { motion } from 'framer-motion'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isDark } = useTheme()
    const { login, isAuthenticated, user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Redirect already logged-in users to their dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            const redirect = searchParams.get('redirect') || 
                (user.userType === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
            router.push(redirect)
        }
    }, [isAuthenticated, user, router, searchParams])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (formData: LoginFormData) => {
        setIsLoading(true)
        setError('')
        try {
            await login(formData.email, formData.password)
            const redirect = searchParams.get('redirect') || '/candidate/dashboard'
            router.push(redirect)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${
            isDark 
                ? 'bg-slate-950' 
                : 'bg-slate-50'
        }`}>
            {/* Left Side - Branding */}
            <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${
                isDark 
                    ? 'bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-950' 
                    : 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700'
            }`}>
                {/* Animated background shapes */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ y: [-20, 20, -20] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative h-10 w-28 overflow-hidden">
                            <Image
                                src="/images/logo2.png"
                                alt="Jobrizza"
                                width={112}
                                height={40}
                                className="h-full w-full object-contain"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Hero Content */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h1 className="text-5xl font-bold text-white leading-tight">
                                Your Career,
                                <br />
                                <span className="text-sky-300">Supercharged.</span>
                            </h1>
                            <p className="mt-6 text-lg text-sky-100/80 max-w-md leading-relaxed">
                                AI-powered CV analysis, job matching, and career insights to help you land your dream job faster.
                            </p>
                        </motion.div>

                        {/* Feature Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="space-y-4"
                        >
                            {[
                                { icon: '📄', title: 'AI CV Analysis', desc: 'Get instant feedback on your resume' },
                                { icon: '🎯', title: 'Smart Job Matching', desc: 'Find roles that fit your skills' },
                                { icon: '📈', title: 'Career Insights', desc: 'Track your progress and grow' },
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                                    className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                                >
                                    <span className="text-2xl">{feature.icon}</span>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{feature.title}</p>
                                        <p className="text-sky-200/70 text-xs">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <p className="text-sky-200/50 text-sm">
                        © 2026 Jobrizza. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className={`flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
                isDark ? 'bg-slate-950' : 'bg-white'
            }`}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative h-10 w-24 overflow-hidden">
                                <Image
                                    src={isDark ? "/images/logo2.png" : "/images/logo1.png"}
                                    alt="Jobrizza"
                                    width={96}
                                    height={40}
                                    className="h-full w-full object-contain"
                                    priority
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Welcome back
                        </h2>
                        <p className={`mt-2 text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/signup" className={`font-semibold transition-colors ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}>
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                            isDark 
                                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                        } ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                                        placeholder="name@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-rose-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                                        </svg>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        className={`w-full pl-11 pr-12 py-3.5 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                            isDark 
                                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                        } ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute inset-y-0 right-0 pr-3.5 flex items-center ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-rose-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                                        </svg>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className={`w-4 h-4 rounded border transition-colors focus:ring-2 focus:ring-offset-0 ${
                                        isDark 
                                            ? 'bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500' 
                                            : 'bg-white border-slate-300 text-sky-600 focus:ring-sky-500'
                                    }`}
                                />
                                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Remember me</span>
                            </label>
                            <Link href="/auth/forgot-password" className={`text-sm font-medium transition-colors ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg ${
                                isDark 
                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/25' 
                                    : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-500/25'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </motion.button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className={`absolute inset-0 flex items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <div className="w-full border-t"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className={`px-4 ${isDark ? 'bg-slate-950 text-slate-500' : 'bg-white text-slate-400'}`}>or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                    isDark 
                                        ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-600' 
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                            </button>
                            <button
                                type="button"
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                    isDark 
                                        ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-600' 
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                GitHub
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <p className={`mt-8 text-center text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className={`underline hover:no-underline ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className={`underline hover:no-underline ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Privacy Policy
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
