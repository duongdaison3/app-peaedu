'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function PlacementPage() {
  const t = useTranslations('Placement')
  const [step, setStep] = useState<'intro' | 'form' | 'loading'>('intro')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('loading')
    // Call placement start API to create anonymous attempt
    void (async () => {
      try {
        const resp = await fetch('/api/placement/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, goal: formData.goal })
        })
        const payload = await resp.json()
        if (!resp.ok || !payload?.attemptId) {
          throw new Error(payload?.error || 'Không thể bắt đầu bài thi')
        }
        window.location.href = `/placement/attempt/${payload.attemptId}`
      } catch (err: any) {
        console.error('Placement start failed', err)
        setStep('form')
        alert(err?.message || 'Lỗi khi tạo bài thi')
      }
    })()
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PEA Placement Test
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Discover your English proficiency level
          </p>
          
          <div className="space-y-4 my-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                ✓
              </div>
              <div className="ml-4 text-left">
                <p className="font-semibold text-gray-900">Quick Assessment</p>
                <p className="text-gray-600">Complete in 30-45 minutes</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                ✓
              </div>
              <div className="ml-4 text-left">
                <p className="font-semibold text-gray-900">Instant Results</p>
                <p className="text-gray-600">Get your level and recommendations</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                ✓
              </div>
              <div className="ml-4 text-left">
                <p className="font-semibold text-gray-900">No Account Needed</p>
                <p className="text-gray-600">Complete anonymously</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setStep('form')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
          >
            Start Assessment
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About You
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+84 9XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Goal
              </label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select your goal</option>
                <option value="general">General English</option>
                <option value="ielts">IELTS Preparation</option>
                <option value="toefl">TOEFL Preparation</option>
                <option value="business">Business English</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
            >
              Begin Test
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Preparing your assessment...</p>
      </div>
    </div>
  )
}
