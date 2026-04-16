'use client'

import { useAuth } from '@/contexts/Authcontext'
import { useTheme } from '@/contexts/Themecontext'
import { ThemeToggle } from '@/components/Themetoggle'
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/contact' },
]

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith('/#')) {
    e.preventDefault()
    const id = href.replace('/#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function useActiveSection() {
  const [activeSection, setActiveSection] = useState('')
  
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'pricing', 'faq']
      let current = ''
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            current = section
          }
        }
      }
      
      setActiveSection(current)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return activeSection
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isDark } = useTheme()
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const activeSection = useActiveSection()

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    router.push('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 navbar-glass`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="relative h-16 w-32 overflow-hidden">
            <Image
              src={isDark ? "/images/logo2.png" : "/images/logo1.png"}
              alt="Jobrizza"
              width={128}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(link => {
            const hrefId = link.href.startsWith('/#') ? link.href.replace('/#', '') : ''
            // Home is only active when at the top (no active section) and on home page
            const isHome = link.href === '/' && pathname === '/' && !activeSection
            const isContact = link.href === '/contact' && pathname === '/contact'
            const isSectionActive = hrefId && activeSection === hrefId
            const isActive = isHome || isContact || isSectionActive
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? isDark ? 'text-sky-400' : 'text-sky-600'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-900 hover:text-sky-600'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-colors
                  ${isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                  }`}
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 opacity-50" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border overflow-hidden z-50
                      ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  >
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                      <p className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user.name}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.userType === 'company' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                        {user.userType}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        href={`/${user.userType}/dashboard`}
                        onClick={() => setProfileOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors
                          ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors
                          ${isDark ? 'text-rose-400 hover:bg-slate-800' : 'text-rose-600 hover:bg-rose-50'}`}
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/auth/login"
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors
                  ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-sm shadow-sky-500/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden rounded-lg p-2 transition-colors
              ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-hidden border-t md:hidden ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(link => {
                const hrefId = link.href.startsWith('/#') ? link.href.replace('/#', '') : ''
                // Home is only active when at the top (no active section) and on home page
                const isHome = link.href === '/' && pathname === '/' && !activeSection
                const isContact = link.href === '/contact' && pathname === '/contact'
                const isSectionActive = hrefId && activeSection === hrefId
                const isActive = isHome || isContact || isSectionActive
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      scrollToSection(e, link.href)
                      setMobileOpen(false)
                    }}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                      ${isActive
                        ? isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                {isAuthenticated && user ? (
                  <>
                    <Link href={`/${user.userType}/dashboard`} onClick={() => setMobileOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 text-sm font-medium mb-1 transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                      Dashboard
                    </Link>
                    <button onClick={() => { handleLogout(); setMobileOpen(false) }}
                      className="w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 text-sm font-medium mb-1 transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                      Sign in
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-center bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}