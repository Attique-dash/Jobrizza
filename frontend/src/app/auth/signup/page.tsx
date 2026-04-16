'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Cookies from 'js-cookie'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTheme } from '@/contexts/Themecontext'
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
    const { isDark } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
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
        try {
            console.log('Signup data:', formData)
            await new Promise(resolve => setTimeout(resolve, 1000))
            Cookies.set('userType', userType, { expires: 7 })
            router.push(`/${userType}/dashboard`)
        } catch (error) {
            console.error('Signup failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
            isDark 
                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
                : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
        }`}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`max-w-md w-full space-y-6 p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                    isDark 
                        ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' 
                        : 'bg-white/80 border-white/50 backdrop-blur-xl'
                }`}
            >
                {/* Logo */}
                <div className="flex justify-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative h-12 w-24 overflow-hidden">
                            <Image
                                src={isDark ? "/images/logo2.png" : "/images/logo1.png"}
                                alt="Jobrizza"
                                width={96}
                                height={48}
                                className="h-full w-full object-contain"
                                priority
                            />
                        </div>
                    </Link>
                </div>

                <div className="text-center">
                    <h2 className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Create your account
                    </h2>
                    <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Already have an account?{' '}
                        <Link href="/auth/login" className={`font-semibold transition-colors ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}>
                            Sign in as Candidate
                        </Link>
                    </p>
                </div>

                {/* Social Signup */}
                <div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className={`w-full border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className={`px-2 transition-colors ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-500'}`}>Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className={`w-full inline-flex justify-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isDark 
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
                            }`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="ml-2">Google</span>
                        </button>

                        <button
                            type="button"
                            className={`w-full inline-flex justify-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isDark 
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className="ml-2">LinkedIn</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Full name
                            </label>
                            <input
                                id="name"
                                type="text"
                                {...register('name')}
                                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                    isDark 
                                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                }`}
                                placeholder="Enter your full name"
                            />
                            {errors.name && (
                                <p className="mt-1.5 text-sm text-rose-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                    isDark 
                                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                }`}
                                placeholder="Enter your email"
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-rose-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                {...register('password')}
                                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                    isDark 
                                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                }`}
                                placeholder="Create a password"
                            />
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-rose-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Confirm password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword')}
                                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 ${
                                    isDark 
                                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20' 
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
                                }`}
                                placeholder="Confirm your password"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1.5 text-sm text-rose-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg ${
                            isDark 
                                ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/25' 
                                : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-500/25'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                        ) : null}
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    )
} 