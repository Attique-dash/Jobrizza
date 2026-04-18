'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import {
  UsersIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  LightBulbIcon,
  XMarkIcon,
  HandThumbUpIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

interface Contact {
  id: string
  name: string
  email: string
  company: string
  job_title: string
  linkedin_url: string
  relationship_strength: 'close_friend' | 'friend' | 'acquaintance' | 'professional'
  at_target_company: boolean
  target_company: string
  can_refer: boolean
  notes: string
  last_contact: string
  tags: string[]
  created_at: string
}

interface NetworkStats {
  total_contacts: number
  at_target_companies: number
  can_refer: number
}

interface CompanyGroup {
  name: string
  count: number
}

interface NetworkInsights {
  summary: string
  network_health: 'strong' | 'growing' | 'small'
  top_companies: { name: string; count: number }[]
  referral_opportunities: number
  target_company_coverage: number
  recommendations: string[]
}

const RELATIONSHIP_STRENGTHS = [
  { value: 'close_friend', label: 'Close Friend', color: 'emerald' },
  { value: 'friend', label: 'Friend', color: 'sky' },
  { value: 'acquaintance', label: 'Acquaintance', color: 'amber' },
  { value: 'professional', label: 'Professional', color: 'slate' },
]

export default function NetworkPage() {
  const { isDark } = useTheme()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [companies, setCompanies] = useState<CompanyGroup[]>([])
  const [insights, setInsights] = useState<NetworkInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'all' | 'referrals' | 'targets'>('all')
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    company: '',
    job_title: '',
    linkedin_url: '',
    relationship_strength: 'acquaintance',
    at_target_company: false,
    target_company: '',
    can_refer: false,
    notes: '',
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    fetchNetwork()
    fetchInsights()
  }, [])

  const fetchNetwork = async () => {
    try {
      const res = await fetch('/api/network/contacts')
      const data = await res.json()
      if (data.success) {
        setContacts(data.contacts)
        setStats(data.stats)
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error('Failed to fetch network:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/network/insights')
      const data = await res.json()
      if (data.success) {
        setInsights(data.insights)
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    }
  }

  const addContact = async () => {
    if (!newContact.name || !newContact.email) return

    try {
      const res = await fetch('/api/network/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      })
      const data = await res.json()
      if (data.success) {
        setContacts([data.contact, ...contacts])
        setShowAddModal(false)
        setNewContact({
          name: '',
          email: '',
          company: '',
          job_title: '',
          linkedin_url: '',
          relationship_strength: 'acquaintance',
          at_target_company: false,
          target_company: '',
          can_refer: false,
          notes: '',
          tags: [],
        })
        fetchInsights()
      }
    } catch (error) {
      console.error('Failed to add contact:', error)
    }
  }

  const deleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/network/contacts/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setContacts(contacts.filter(c => c.id !== id))
        fetchInsights()
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !newContact.tags.includes(newTag.trim())) {
      setNewContact({ ...newContact, tags: [...newContact.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setNewContact({ ...newContact, tags: newContact.tags.filter(t => t !== tag) })
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    if (selectedTab === 'referrals') return matchesSearch && contact.can_refer
    if (selectedTab === 'targets') return matchesSearch && contact.at_target_company
    return matchesSearch
  })

  const getRelationshipColor = (strength: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      close_friend: { bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100', text: 'text-emerald-500' },
      friend: { bg: isDark ? 'bg-sky-500/20' : 'bg-sky-100', text: 'text-sky-500' },
      acquaintance: { bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100', text: 'text-amber-500' },
      professional: { bg: isDark ? 'bg-slate-500/20' : 'bg-slate-100', text: 'text-slate-500' },
    }
    return colors[strength] || colors.professional
  }

  const getHealthColor = (health: string) => {
    if (health === 'strong') return 'text-emerald-500'
    if (health === 'growing') return 'text-sky-500'
    return 'text-amber-500'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Your Network
            </h1>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Manage contacts and find referral opportunities at target companies
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
              ${isDark
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/25'
              }`}
          >
            <PlusIcon className="h-5 w-5" />
            Add Contact
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                <UsersIcon className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.total_contacts || 0}
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Contacts</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <BuildingOfficeIcon className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.at_target_companies || 0}
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>At Target Companies</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <HandThumbUpIcon className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.can_refer || 0}
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Can Refer</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Insights Card */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-sky-500/20' : 'bg-sky-100'}`}>
                <LightBulbIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Network Insights
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getHealthColor(insights.network_health)}`}>
                    {insights.network_health}
                  </span>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {insights.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {insights.recommendations.map((rec, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-3 py-1 rounded-full
                        ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Company Distribution */}
        {companies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <ChartBarIcon className="h-5 w-5" />
              Companies in Your Network
            </h3>
            <div className="flex flex-wrap gap-2">
              {companies.slice(0, 10).map((company) => (
                <div
                  key={company.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                    ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
                >
                  <BuildingOfficeIcon className="h-4 w-4" />
                  {company.name}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs
                    ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                    {company.count}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border
            ${isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-lg'
            }`}
          >
            <MagnifyingGlassIcon className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className={`flex-1 bg-transparent outline-none
                ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}
              `}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'referrals', 'targets'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors
                  ${selectedTab === tab
                    ? isDark ? 'bg-sky-500 text-white' : 'bg-sky-500 text-white'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {tab === 'all' && 'All Contacts'}
                {tab === 'referrals' && 'Can Refer'}
                {tab === 'targets' && 'Target Companies'}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl p-5 border transition-all hover:shadow-lg
                  ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium
                      ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {contact.name}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {contact.job_title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className={`p-1.5 rounded-lg transition-colors
                      ${isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <BuildingOfficeIcon className="h-4 w-4" />
                    {contact.company || 'No company'}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <EnvelopeIcon className="h-4 w-4" />
                    {contact.email}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getRelationshipColor(contact.relationship_strength).bg} ${getRelationshipColor(contact.relationship_strength).text}`}>
                    {RELATIONSHIP_STRENGTHS.find(r => r.value === contact.relationship_strength)?.label}
                  </span>
                  {contact.can_refer && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium
                      ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      Can Refer
                    </span>
                  )}
                  {contact.at_target_company && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium
                      ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                      Target: {contact.target_company}
                    </span>
                  )}
                </div>

                {contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-0.5 rounded
                          ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredContacts.length === 0 && (
          <div className={`text-center py-12 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <UsersIcon className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {searchQuery ? 'No contacts match your search' : 'No contacts yet. Add your first contact!'}
            </p>
          </div>
        )}

        {/* Add Contact Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-lg rounded-2xl p-6 border max-h-[90vh] overflow-y-auto
                  ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}
                `}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Add Contact
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border outline-none
                        ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border outline-none
                        ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                        }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Company
                      </label>
                      <input
                        type="text"
                        value={newContact.company}
                        onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border outline-none
                          ${isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                          }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={newContact.job_title}
                        onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border outline-none
                          ${isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Relationship Strength
                    </label>
                    <select
                      value={newContact.relationship_strength}
                      onChange={(e) => setNewContact({ ...newContact, relationship_strength: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border outline-none
                        ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                        }`}
                    >
                      {RELATIONSHIP_STRENGTHS.map((rs) => (
                        <option key={rs.value} value={rs.value}>{rs.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newContact.can_refer}
                        onChange={(e) => setNewContact({ ...newContact, can_refer: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Can refer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newContact.at_target_company}
                        onChange={(e) => setNewContact({ ...newContact, at_target_company: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>At target company</span>
                    </label>
                  </div>

                  {newContact.at_target_company && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Target Company Name
                      </label>
                      <input
                        type="text"
                        value={newContact.target_company}
                        onChange={(e) => setNewContact({ ...newContact, target_company: e.target.value })}
                        placeholder="e.g., Google, Microsoft"
                        className={`w-full px-4 py-3 rounded-xl border outline-none
                          ${isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                          }`}
                      />
                    </div>
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add tag and press Enter"
                        className={`flex-1 px-4 py-2 rounded-xl border outline-none text-sm
                          ${isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                          }`}
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newContact.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm
                            ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-rose-500">
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Notes
                    </label>
                    <textarea
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border outline-none resize-none
                        ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                        }`}
                    />
                  </div>

                  <button
                    onClick={addContact}
                    disabled={!newContact.name || !newContact.email}
                    className={`w-full py-4 rounded-xl font-medium transition-all
                      ${!newContact.name || !newContact.email
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-[1.02] active:scale-[0.98]'
                      }
                      ${isDark
                        ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white'
                        : 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/25'
                      }`}
                  >
                    Add Contact
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
