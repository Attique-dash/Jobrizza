import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/Themecontext'
import { AuthProvider } from '@/contexts/Authcontext'
import { Chatbot } from '@/components/Chatbot'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jobrizza — AI-Powered Recruitment Platform',
  description: 'Stop wasting time on irrelevant CVs. Jobrizza uses AI to screen, rank and match candidates in seconds.',
  keywords: ['recruitment', 'AI', 'CV screening', 'job matching', 'hiring', 'ATS'],
  openGraph: {
    title: 'Jobrizza — AI-Powered Recruitment',
    description: 'AI that filters hundreds of CVs in under 60 seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Chatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}