'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/Themecontext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  PlusIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  LinkIcon,
  TrashIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

interface Application {
  id: string
  company: string
  position: string
  location: string
  salary: string
  url: string
  status: ApplicationStatus
  notes: string
  applied_at: string
  updated_at: string
  notes_list?: { id: string; content: string; created_at: string }[]
}

const statusConfig: Record<ApplicationStatus, { color: string; bg: string; label: string }> = {
  Applied: { color: 'text-sky-600', bg: 'bg-sky-100', label: 'Applied' },
  Interview: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Interview' },
  Offer: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Offer' },
  Rejected: { color: 'text-rose-600', bg: 'bg-rose-100', label: 'Rejected' },
}

const columns: ApplicationStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected']

export default function ApplicationsPage() {
  const { isDark } = useTheme()
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [newNote, setNewNote] = useState('')
  const [filter, setFilter] = useState<ApplicationStatus | 'All'>('All')

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    salary: '',
    url: '',
    status: 'Applied' as ApplicationStatus,
    notes: '',
  })

  useEffect(() => {
    fetchApplications()
    fetchStats()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications')
      const data = await res.json()
      if (data.success) {
        setApplications(data.applications)
      } else {
        setError(data.error || 'Failed to load applications')
      }
    } catch (err) {
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/applications/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      // Silent fail for stats
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingApp ? `/api/applications/${editingApp.id}` : '/api/applications'
      const method = editingApp ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      
      if (data.success) {
        await fetchApplications()
        await fetchStats()
        closeModal()
      } else {
        setError(data.error || 'Failed to save application')
      }
    } catch (err) {
      setError('Failed to save application')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        await fetchApplications()
        await fetchStats()
        if (selectedApp?.id === id) setSelectedApp(null)
      }
    } catch (err) {
      setError('Failed to delete application')
    }
  }

  const handleStatusChange = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchApplications()
        await fetchStats()
      }
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleAddNote = async () => {
    if (!selectedApp || !newNote.trim()) return
    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })
      const data = await res.json()
      if (data.success) {
        setNewNote('')
        await fetchApplications()
        // Refresh selected app
        const updated = await fetch(`/api/applications/${selectedApp.id}`)
        const updatedData = await updated.json()
        if (updatedData.success) {
          setSelectedApp(updatedData.application)
        }
      }
    } catch (err) {
      setError('Failed to add note')
    }
  }

  const openModal = (app?: Application) => {
    if (app) {
      setEditingApp(app)
      setFormData({
        company: app.company,
        position: app.position,
        location: app.location,
        salary: app.salary,
        url: app.url,
        status: app.status,
        notes: app.notes,
      })
    } else {
      setEditingApp(null)
      setFormData({
        company: '',
        position: '',
        location: '',
        salary: '',
        url: '',
        status: 'Applied',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingApp(null)
  }

  const filteredApplications = filter === 'All' 
    ? applications 
    : applications.filter(a => a.status === filter)

  const getColumnApps = (status: ApplicationStatus) => 
    filteredApplications.filter(a => a.status === status)

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/candidate/dashboard"
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Job Application Tracker
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Track your job applications through the hiring pipeline
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Application
          </button>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {columns.map(status => (
            <div
              key={status}
              onClick={() => setFilter(filter === status ? 'All' : status)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
              } ${filter === status ? 'ring-2 ring-sky-500' : ''}`}
            >
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{status}</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats[status] || 0}
              </p>
            </div>
          ))}
        </div>

        {/* Filter indicator */}
        {filter !== 'All' && (
          <div className="mb-4 flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-sky-500" />
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Filtered by: <span className="font-medium text-sky-500">{filter}</span>
            </span>
            <button
              onClick={() => setFilter('All')}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(status => (
            <div
              key={status}
              className={`rounded-xl p-4 ${isDark ? 'bg-slate-900/50 border border-slate-800' : 'bg-white/50 border border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {status}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status].bg} ${statusConfig[status].color}`}>
                  {getColumnApps(status).length}
                </span>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {getColumnApps(status).map(app => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50'
                      } ${selectedApp?.id === app.id ? 'ring-2 ring-sky-500' : ''}`}
                      onClick={() => setSelectedApp(app)}
                    >
                      <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {app.position}
                      </h4>
                      <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {app.company}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        {app.location && (
                          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            <MapPinIcon className="h-3 w-3" />
                            {app.location}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <select
                          value={app.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStatusChange(app, e.target.value as ApplicationStatus)
                          }}
                          className={`text-xs rounded-lg px-2 py-1 border outline-none ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 text-white' 
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {columns.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Application Detail Panel */}
        <AnimatePresence>
          {selectedApp && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`fixed right-0 top-0 h-full w-full max-w-md p-6 overflow-y-auto z-50 ${
                isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Application Details
                </h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedApp.position}
                  </h3>
                  <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedApp.company}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedApp.location && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <MapPinIcon className="h-4 w-4" />
                      <span className="text-sm">{selectedApp.location}</span>
                    </div>
                  )}
                  {selectedApp.salary && (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <span className="text-sm">{selectedApp.salary}</span>
                    </div>
                  )}
                  {selectedApp.url && (
                    <a
                      href={selectedApp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm hover:underline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}
                    >
                      <LinkIcon className="h-4 w-4" />
                      View Job Posting
                    </a>
                  )}
                </div>

                <div className={`p-3 rounded-lg ${statusConfig[selectedApp.status].bg}`}>
                  <span className={`text-sm font-medium ${statusConfig[selectedApp.status].color}`}>
                    Status: {selectedApp.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedApp(null); openModal(selectedApp); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedApp.id)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                    }`}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    Notes
                  </h4>
                  
                  {/* Add Note */}
                  <div className="mb-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className={`w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors"
                    >
                      Add Note
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-2">
                    {selectedApp.notes && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {selectedApp.notes}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          Main note
                        </p>
                      </div>
                    )}
                    {selectedApp.notes_list?.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {note.content}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md rounded-xl p-6 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}
              >
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingApp ? 'Edit Application' : 'Add Application'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white' 
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Salary
                      </label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white' 
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Job URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                      className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      {columns.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                    >
                      {editingApp ? 'Save Changes' : 'Add Application'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
