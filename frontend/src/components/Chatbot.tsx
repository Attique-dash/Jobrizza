'use client'

import { useAuth } from '@/contexts/Authcontext'
import { useTheme } from '@/contexts/Themecontext'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTIONS = [
  'How do I improve my CV?',
  'What is ATS and why does it matter?',
  'How do I prepare for interviews?',
  'What skills are in demand right now?',
]

export function Chatbot() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi${user ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm **Jobby**, your career AI assistant. I can help with CV tips, interview prep, and career advice. What can I help you with today?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      // Use the proxy API route — never call Anthropic directly from the browser
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter(m => m.id !== '0')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()
      const reply = data.reply ?? "Sorry, I couldn't process that. Please try again."

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)/gm, '<li class="ml-3">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul class="space-y-1 list-disc list-inside my-1">$1</ul>')
      .replace(/\n/g, '<br />')
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30 text-white transition-shadow hover:shadow-xl hover:shadow-sky-500/40"
            aria-label="Open Jobby AI chat"
          >
            <span className="text-2xl">🤖</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex-col rounded-2xl shadow-2xl border overflow-hidden
              ${isDark
                ? 'bg-slate-900 border-slate-700 shadow-black/40'
                : 'bg-white border-slate-200 shadow-slate-200/80'
              }`}
          >
            {/* Header */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-gradient-to-r from-sky-500 to-blue-600'}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xl">🤖</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Jobby AI</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-xs text-white/80">Always online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors text-xl leading-none">×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex-shrink-0 text-lg">🤖</div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-tr-sm'
                        : isDark
                          ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="mr-2 text-lg">🤖</div>
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100'}`}>
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions (shown when only 1 message) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors
                      ${isDark
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className={`p-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask Jobby anything..."
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-3.5 w-3.5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
              <p className={`text-center text-xs mt-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Powered by Jobrizza AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}