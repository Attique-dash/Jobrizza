"use client"
import { useState } from 'react'

const faqs = [
  {
    question: "How does Jobrizza use AI for recruitment?",
    answer: "Jobrizza uses advanced AI algorithms to screen, rank, and match candidates to job requirements, saving time and improving hiring quality."
  },
  {
    question: "Can candidates create a CV on the platform?",
    answer: "Yes! Candidates can generate an AI-optimized CV and receive personalized job recommendations and career roadmaps."
  },
  {
    question: "Is my data secure on Jobrizza?",
    answer: "Absolutely. We use industry-standard security practices to keep your data safe and private."
  },
  {
    question: "How do I book a demo or join the early access list?",
    answer: "You can book a demo or join the early access list directly from our landing page or via the respective pages in the navigation."
  },
  {
    question: "What regions does Jobrizza support?",
    answer: "We are starting in Pakistan, India, the Middle East, and African markets, with plans to expand globally."
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={faq.question} className="bg-white rounded-xl shadow p-4">
              <button
                className="w-full text-left flex justify-between items-center font-semibold text-lg text-gray-900 focus:outline-none"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                {faq.question}
                <span className="ml-2 text-blue-600">{openIndex === idx ? '-' : '+'}</span>
              </button>
              {openIndex === idx && (
                <div className="mt-2 text-gray-700 text-base border-t pt-2">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 