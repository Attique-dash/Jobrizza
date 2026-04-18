'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useTheme } from '@/contexts/Themecontext'
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  LightBulbIcon as TipIcon,
} from '@heroicons/react/24/outline'

interface STARScores {
  star_structure: number
  clarity: number
  relevance: number
  impact: number
  overall: number
}

interface STARBreadkdown {
  situation: string
  task: string
  action: string
  result: string
}

interface GradingResult {
  scores: STARScores
  star_breakdown: STARBreadkdown
  strengths: string[]
  improvements: string[]
  better_answer_example: string
  summary: string
}

interface GradingHistory {
  question: string
  question_type: string
  scores: STARScores
  created_at: string
}

const QUESTION_CATEGORIES = [
  { id: 'behavioral', name: 'Behavioral', description: 'Past experience questions' },
  { id: 'technical', name: 'Technical', description: 'Technical knowledge & problem-solving' },
  { id: 'situational', name: 'Situational', description: 'Hypothetical scenarios' },
  { id: 'leadership', name: 'Leadership', description: 'Leadership & management questions' },
]

const SAMPLE_QUESTIONS: Record<string, string[]> = {
  behavioral: [
    "Tell me about yourself.",
    "What is your greatest strength?",
    "What is your greatest weakness?",
    "Tell me about a time you faced a conflict at work.",
    "Describe a time you failed and what you learned.",
  ],
  technical: [
    "Explain a complex technical concept to a non-technical person.",
    "Tell me about a challenging technical problem you solved.",
    "How do you keep your technical skills current?",
  ],
  situational: [
    "What would you do if you disagreed with your manager's decision?",
    "How would you handle a difficult client?",
    "What would you do if you missed a deadline?",
  ],
  leadership: [
    "Tell me about a time you motivated a team.",
    "How do you handle giving difficult feedback?",
    "Describe a time you had to make an unpopular decision.",
  ],
}

export default function InterviewGraderPage() {
  const { isDark } = useTheme()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [questionType, setQuestionType] = useState('behavioral')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradingResult | null>(null)
  const [history, setHistory] = useState<GradingHistory[]>([])
  const [averageScore, setAverageScore] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/interview/history?limit=10')
      const data = await res.json()
      if (data.success) {
        setHistory(data.gradings)
        setAverageScore(data.average_score)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const handleGrade = async () => {
    if (!question.trim() || !answer.trim()) return

    setGrading(true)
    setResult(null)

    try {
      const res = await fetch('/api/interview/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, question_type: questionType }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.grading)
        fetchHistory()
      }
    } catch (error) {
      console.error('Failed to grade:', error)
    } finally {
      setGrading(false)
    }
  }

  const loadSampleQuestion = (q: string) => {
    setQuestion(q)
    setResult(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500'
    if (score >= 75) return 'text-sky-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
    if (score >= 75) return isDark ? 'bg-sky-500/20' : 'bg-sky-100'
    if (score >= 60) return isDark ? 'bg-amber-500/20' : 'bg-amber-100'
    return isDark ? 'bg-rose-500/20' : 'bg-rose-100'
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Interview Answer Grader
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Practice your interview answers and get AI-powered feedback with STAR methodology scoring
          </p>
        </div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                <ChartBarIcon className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Practice Progress
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {history.length} answers graded • Average score: {averageScore}%
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors
                ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <ClockIcon className="h-4 w-4" />
              History
              {showHistory ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>

        {/* History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-2xl p-6 border mb-6 overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Practice Sessions
              </h3>
              {history.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No practice sessions yet. Start by grading your first answer!
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((h, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {h.question.substring(0, 80)}{h.question.length > 80 ? '...' : ''}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {new Date(h.created_at).toLocaleDateString()} • {h.question_type}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-bold ${getScoreBg(h.scores?.overall || 0)} ${getScoreColor(h.scores?.overall || 0)}`}>
                          {h.scores?.overall || 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Question Type Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                Question Category
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {QUESTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setQuestionType(cat.id)
                      setResult(null)
                    }}
                    className={`p-3 rounded-xl text-left transition-all
                      ${questionType === cat.id
                        ? isDark ? 'bg-sky-500/20 border border-sky-500/30' : 'bg-sky-50 border border-sky-200'
                        : isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    <p className={`font-medium ${questionType === cat.id ? 'text-sky-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                      {cat.name}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {cat.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Sample Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <LightBulbIcon className="h-5 w-5" />
                Sample Questions
              </h3>
              <div className="space-y-2">
                {SAMPLE_QUESTIONS[questionType].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSampleQuestion(q)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors
                      ${isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Question Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Your Question
              </h3>
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value)
                  setResult(null)
                }}
                placeholder="Enter the interview question here..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors resize-none
                  ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                  }`}
              />
            </motion.div>

            {/* Answer Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Your Answer
              </h3>
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value)
                    setResult(null)
                  }}
                  placeholder="Type your interview answer here. Try to use the STAR method: Situation, Task, Action, Result..."
                  rows={10}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors resize-none
                    ${isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                    }`}
                />
                <div className={`absolute bottom-3 right-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {answer.length} characters
                </div>
              </div>

              <button
                onClick={handleGrade}
                disabled={grading || !question.trim() || !answer.trim()}
                className={`w-full mt-4 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                  ${grading || !question.trim() || !answer.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                  }
                  ${isDark
                    ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white'
                    : 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/25'
                  }`}
              >
                {grading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Grade My Answer
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Results Section */}
          <div>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Overall Score */}
                  <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${getScoreBg(result.scores.overall)}`}>
                        <StarIcon className={`h-6 w-6 ${getScoreColor(result.scores.overall)}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Overall Score
                        </h3>
                        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          {result.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-6">
                      <div className={`text-6xl font-bold ${getScoreColor(result.scores.overall)}`}>
                        {result.scores.overall}%
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'STAR Structure', value: result.scores.star_structure },
                        { label: 'Clarity', value: result.scores.clarity },
                        { label: 'Relevance', value: result.scores.relevance },
                        { label: 'Impact', value: result.scores.impact },
                      ].map((score) => (
                        <div key={score.label} className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{score.label}</span>
                            <span className={`font-bold ${getScoreColor(score.value)}`}>{score.value}%</span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div
                              className={`h-full rounded-full ${score.value >= 90 ? 'bg-emerald-500' : score.value >= 75 ? 'bg-sky-500' : score.value >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${score.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STAR Breakdown */}
                  <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <DocumentTextIcon className="h-5 w-5" />
                      STAR Analysis
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'situation', label: 'Situation', desc: result.star_breakdown?.situation },
                        { key: 'task', label: 'Task', desc: result.star_breakdown?.task },
                        { key: 'action', label: 'Action', desc: result.star_breakdown?.action },
                        { key: 'result', label: 'Result', desc: result.star_breakdown?.result },
                      ].map((item) => (
                        <div key={item.key} className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                          <span className={`text-sm font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                            {item.label}
                          </span>
                          <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.strengths?.map((strength, idx) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <TipIcon className="h-5 w-5 text-amber-500" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {result.improvements?.map((improvement, idx) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="text-amber-500 mt-0.5">→</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Better Answer Example */}
                  {result.better_answer_example && (
                    <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                      <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <ArrowTrendingUpIcon className="h-5 w-5 text-violet-500" />
                        Improved Answer Example
                      </h3>
                      <div className={`p-4 rounded-xl text-sm leading-relaxed ${isDark ? 'bg-violet-500/10 text-slate-300' : 'bg-violet-50 text-slate-700'}`}>
                        {result.better_answer_example}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`h-full flex flex-col items-center justify-center p-12 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}
                >
                  <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <ChatBubbleLeftRightIcon className={`h-12 w-12 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Ready to Practice
                  </h3>
                  <p className={`text-center max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Enter a question and your answer, then click "Grade My Answer" to get AI-powered feedback with STAR methodology analysis.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
