'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse, getCourses } from '@/modules/course/actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', level: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await getCourses()
      setCourses(data as any)
    } catch (err: any) {
      toast.error('Lỗi tải khóa học')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      await createCourse(form)
      toast.success('Đã tạo khóa học')
      setShowForm(false)
      setForm({ title: '', description: '', level: '' })
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tạo khóa học')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khóa học</h1>
          <p className="text-sm text-zinc-600">Quản lý khóa học của bạn</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-2" />
          Tạo khóa học
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div>
            <label className="text-sm">Tên khóa học</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded mt-1" />
          </div>
          <div>
            <label className="text-sm">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded mt-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo'}</Button>
          </div>
        </form>
      )}

      <div>
        {loading ? (
          <p>Đang tải...</p>
        ) : courses.length === 0 ? (
          <p>Chưa có khóa học nào</p>
        ) : (
          <div className="grid gap-4">
            {courses.map(c => (
              <div key={c.id} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-zinc-600">{c.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/classes?course=${c.id}`)}>
                    Quản lý lớp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
