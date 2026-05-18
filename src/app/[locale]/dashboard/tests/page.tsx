'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Play, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getTests, createTest, deleteTest, startTestAttempt } from '@/modules/test/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TestsPage() {
  const router = useRouter()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [startingAttempt, setStartingAttempt] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'normal' as any,
    allowAnonymous: false
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      setLoading(true)
      const data = await getTests()
      setTests(data)
    } catch (error) {
      console.error('Error loading tests:', error)
      toast.error('Lỗi tải danh sách bài thi')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      const newTest = await createTest({
        title: formData.title || 'Bài thi chưa đặt tên',
        description: formData.description,
        type: formData.type,
        allowAnonymous: formData.allowAnonymous,
        sections: []
      })
      setShowForm(false)
      setFormData({ title: '', description: '', type: 'normal' })
      router.push(`/dashboard/tests/builder/${newTest.id}`)
    } catch (error: any) {
      console.error('Error creating test:', error)
      toast.error('Lỗi tạo bài thi')
    } finally {
      setCreating(false)
    }
  }

  const handleStartTest = async (testId: string) => {
    setStartingAttempt(testId)
    try {
      const attempt = await startTestAttempt(testId)
      router.push(`/dashboard/test-attempt/${attempt.id}`)
    } catch (error: any) {
      toast.error(error?.message || 'Không thể bắt đầu bài thi')
    } finally {
      setStartingAttempt(null)
    }
  }

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Xóa bài thi này?')) return

    try {
      await deleteTest(testId)
      setTests(tests.filter((t) => t.id !== testId))
      toast.success('Bài thi đã được xóa')
    } catch (error: any) {
      console.error('Error deleting test:', error)
      toast.error('Lỗi xóa bài thi')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Bài thi</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Danh sách các bài thi có sẵn</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-2" />
          Tạo bài thi mới
        </Button>
      </div>

      {/* Create Test Form */}
      {showForm && (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Tạo bài thi mới</h2>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tên bài thi
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tên bài thi..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả bài thi..."
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Loại bài thi
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="normal">Thường</option>
                <option value="placement">Đánh giá trình độ</option>
              </select>
            </div>

              {formData.type === 'placement' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowAnonymous}
                    onChange={(e) => setFormData({ ...formData, allowAnonymous: e.target.checked })}
                    id="allowAnonymous"
                  />
                  <label htmlFor="allowAnonymous" className="text-sm text-zinc-700 dark:text-zinc-300">Cho phép làm bài công khai (không cần đăng nhập)</label>
                </div>
              )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={creating}
              >
                {creating ? 'Đang tạo...' : 'Tạo bài thi'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tests Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">Đang tải bài thi...</p>
          </div>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <BarChart3 size={48} className="mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">Không có bài thi nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map(test => (
            <div
              key={test.id}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-lg transition-shadow p-6 space-y-4 border border-zinc-200 dark:border-zinc-800"
            >
              {/* Test Info */}
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-2">
                  {test.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                  {test.description || 'Không có mô tả'}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="flex-1">
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs">Phần</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {test.sections?.length || 0}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs">Lần làm</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {test.attempts?.length || 0}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs">Loại</p>
                  <p className="font-semibold text-zinc-900 dark:text-white capitalize">
                    {test.type === 'placement' ? 'Đánh giá' : 'Thường'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStartTest(test.id)}
                  disabled={startingAttempt === test.id}
                >
                  <Play size={14} className="mr-1" />
                  {startingAttempt === test.id ? 'Bắt đầu...' : 'Làm bài'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/tests/builder/${test.id}`)}
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTest(test.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
