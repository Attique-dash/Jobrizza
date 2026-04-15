'use client'

import { useTheme } from '@/contexts/Themecontext'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`
        relative inline-flex items-center justify-center rounded-full border transition-all duration-300
        ${compact ? 'h-8 w-8' : 'h-9 w-9'}
        ${isDark
          ? 'border-slate-600 bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:border-slate-500'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
        }
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <SunIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <MoonIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}