'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// Custom Social Media Icons (Heroicons doesn't include these)
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
import { Header } from '@/components/layout/navbar'
import { useTheme } from '@/contexts/Themecontext'

const CONTACT_INFO = [
  { icon: EnvelopeIcon, label: 'Email', value: 'hello@jobrizza.com', href: 'mailto:hello@jobrizza.com' },
  { icon: PhoneIcon, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: MapPinIcon, label: 'Office', value: 'San Francisco, CA', href: '#' },
  { icon: ClockIcon, label: 'Hours', value: 'Mon-Fri: 9AM - 6PM PST', href: '#' },
]

const SOCIAL_LINKS = [
  { icon: LinkedinIcon, label: 'LinkedIn', href: '#' },
  { icon: TwitterIcon, label: 'Twitter', href: '#' },
]

export default function ContactPage() {
  const { isDark } = useTheme()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLoading(false)
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-sky-50 via-white to-indigo-50'}`}>
      <Header />
      
      {/* Hero Section */}
      <section className={`relative pt-32 pb-16 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-3xl ${isDark ? 'bg-sky-500/10' : 'bg-sky-200/40'}`} />
          <div className={`absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/30'}`} />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold mb-6 border
              ${isDark ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
              <EnvelopeIcon className="h-4 w-4" />
              Get in Touch
            </span>
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Let's Start a <span className="text-sky-500">Conversation</span>
            </h1>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Have questions about our AI recruitment platform? We'd love to hear from you. 
              Our team is ready to help you transform your hiring process.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className={`py-16 ${isDark ? 'bg-slate-950' : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
              >
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Information</h3>
                <div className="space-y-4">
                  {CONTACT_INFO.map((item, i) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all group
                        ${isDark ? 'hover:bg-slate-800' : 'hover:bg-sky-50'}`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors
                        ${isDark ? 'bg-slate-800 group-hover:bg-sky-500/20' : 'bg-sky-100 group-hover:bg-sky-200'}`}>
                        <item.icon className={`h-6 w-6 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* Social Links */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
              >
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Follow Us</h3>
                <div className="flex gap-4">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all
                        ${isDark ? 'bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400' : 'bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-600'}`}
                    >
                      <social.icon className="h-6 w-6" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`lg:col-span-3 rounded-2xl p-8 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6
                      ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Sent!</h3>
                    <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Thank you for reaching out. Our team will review your message and get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setFormData({ name: '', email: '', subject: '', message: '' })
                      }}
                      className={`mt-8 px-6 py-3 rounded-xl font-semibold transition-colors
                        ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Send us a Message</h3>
                      <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Fill out the form below and we'll respond promptly</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Name Field */}
                      <div className="relative">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          onFocus={() => setFocused('name')}
                          onBlur={() => setFocused(null)}
                          required
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all
                            ${isDark 
                              ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                            } ${focused === 'name' ? 'ring-2 ring-sky-500/20' : ''}`}
                          placeholder="John Doe"
                        />
                      </div>

                      {/* Email Field */}
                      <div className="relative">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocused('email')}
                          onBlur={() => setFocused(null)}
                          required
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all
                            ${isDark 
                              ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                            } ${focused === 'email' ? 'ring-2 ring-sky-500/20' : ''}`}
                          placeholder="john@email.com"
                        />
                      </div>
                    </div>

                    {/* Subject Field */}
                    <div className="relative">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        onFocus={() => setFocused('subject')}
                        onBlur={() => setFocused(null)}
                        required
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all appearance-none
                          ${isDark 
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500' 
                            : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                          } ${focused === 'subject' ? 'ring-2 ring-sky-500/20' : ''}`}
                      >
                        <option value="">Select a topic</option>
                        <option value="sales">Sales & Enterprise</option>
                        <option value="support">Technical Support</option>
                        <option value="demo">Request Demo</option>
                        <option value="partners">Partnerships</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Message Field */}
                    <div className="relative">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        onFocus={() => setFocused('message')}
                        onBlur={() => setFocused(null)}
                        required
                        rows={5}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none
                          ${isDark 
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500' 
                            : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                          } ${focused === 'message' ? 'ring-2 ring-sky-500/20' : ''}`}
                        placeholder="Tell us about your project, questions, or how we can help..."
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all
                        ${loading 
                          ? 'bg-slate-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25'
                        }`}
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className={`py-16 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Prefer to browse on your own?
            </h3>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Check out our comprehensive FAQ section for quick answers to common questions.
            </p>
            <a 
              href="/#faq" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 transition-all"
            >
              Visit FAQ
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 