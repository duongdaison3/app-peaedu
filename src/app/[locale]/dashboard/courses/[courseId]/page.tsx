'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCourse, updateCourse, deleteCourse } from '@/modules/course/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter()
  const { courseId } = params
  const [course, setCourse] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [courseId])

  const load = async () => {
    try {
      setLoading(true)
      const c = await getCourse(courseId)
      setCourse(c)
      setForm({ title: c.title || '', description: c.description || '' })
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải course')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await updateCourse(courseId, { title: form.title, description: form.description })
      toast.success('Đã lưu')
      setEditing(false)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi lưu')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Xóa khóa học này?')) return
    try {
      await deleteCourse(courseId)
      toast.success('Đã xóa')
      router.push('/dashboard/courses')
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa')
    }
  }

  if (loading) return <p className="p-6">Đang tải...</p>

  if (!course) return <p className="p-6">Không tìm thấy khóa học</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-zinc-600">{course.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>{editing ? 'Hủy' : 'Chỉnh sửa'}</Button>
          <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
        </div>
      </div>

      {editing && (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded border border-zinc-200 dark:border-zinc-800">
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded" />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded" />
            <div className="flex justify-end">
              <Button onClick={handleSave}>Lưu</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <h3 className="font-semibold">Lớp trong khóa học</h3>
        {course.classes?.length === 0 ? <p>Chưa có lớp</p> : (
          <div className="grid gap-2">
            {course.classes.map((cl: any) => (
              <div key={cl.id} className="p-3 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{cl.title}</div>
                  <div className="text-sm text-zinc-600">Mã: {cl.code}</div>
                </div>
                <div>
                  <Button variant="outline" onClick={() => router.push(`/dashboard/classes/${cl.id}`)}>Quản lý</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
