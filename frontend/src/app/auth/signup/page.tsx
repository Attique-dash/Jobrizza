'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTheme } from '@/contexts/Themecontext'
import { useAuth } from '@/contexts/Authcontext'
import { motion } from 'framer-motion'

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isDark } = useTheme()
    const { register: registerUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const userType = 'candidate'

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    })

    const onSubmit = async (formData: SignupFormData) => {
        setIsLoading(true)
        setError('')
        try {
            await registerUser(formData.name, formData.email, formData.password, userType)
            const redirect = searchParams.get('redirect') || `/${userType}/dashboard`
            router.push(redirect)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed')
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
                                Start Your
                                <br />
                                <span className="text-sky-300">Career Journey.</span>
                            </h1>
                            <p className="mt-6 text-lg text-sky-100/80 max-w-md leading-relaxed">
                                Join thousands of professionals using AI to optimize their CVs and land their dream jobs.
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
                                { icon: '🚀', title: 'Quick Setup', desc: 'Create your account in 30 seconds' },
                                { icon: '🎯', title: 'AI-Powered', desc: 'Smart job matching & CV analysis' },
                                { icon: '💼', title: 'Career Growth', desc: 'Personalized career roadmaps' },
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

            {/* Right Side - Signup Form */}
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
                            Create your account
                        </h2>
                        <p className={`mt-2 text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Already have an account?{' '}
                            <Link href="/auth/login" className={`font-semibold transition-colors ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}>
                                Sign in
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
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Full name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        {...register('name')}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                            isDark 
                                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                        } ${errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-rose-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                                        </svg>
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

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
                                        placeholder="Create a password"
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

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        {...register('confirmPassword')}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                            isDark 
                                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                        } ${errors.confirmPassword ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                                        placeholder="Confirm your password"
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1.5 text-sm text-rose-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                                        </svg>
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>
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
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create account</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <p className={`mt-8 text-center text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        By signing up, you agree to our{' '}
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

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
            </div>
        }>
            <SignupForm />
        </Suspense>
    )
}
