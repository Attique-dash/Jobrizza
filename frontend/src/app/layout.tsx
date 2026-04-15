import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-Powered Recruitment Platform',
  description: 'Transform your hiring process with AI. Upload CVs, filter candidates, and conduct interviews automatically.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning >
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
