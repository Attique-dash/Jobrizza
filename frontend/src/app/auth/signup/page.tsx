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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                            {error}
                        </div>
                    )}
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