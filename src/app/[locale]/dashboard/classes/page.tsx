'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getClasses, createClass, joinClassByCode } from '@/modules/course/actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function ClassesPage() {
  const params = useSearchParams()
  const courseId = params.get('course')
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '' })
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await getClasses()
      setClasses(data as any)
    } catch (err: any) {
      toast.error('Lỗi tải lớp học')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return toast.error('Course ID missing')

    try {
      setCreating(true)
      await createClass({ courseId, title: form.title, startDate: new Date(form.startDate), endDate: new Date(form.endDate) })
      toast.success('Đã tạo lớp')
      setForm({ title: '', startDate: '', endDate: '' })
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tạo lớp')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    try {
      await joinClassByCode(joinCode.trim())
      toast.success('Đã tham gia lớp')
      setJoinCode('')
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tham gia lớp')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lớp học</h1>
          <p className="text-sm text-zinc-600">Quản lý lớp và đăng ký</p>
        </div>
        <Button onClick={() => window.scrollTo({ top: 9999, behavior: 'smooth' })}>
          <Plus size={14} className="mr-2" />
          Tạo lớp
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-2">Tạo lớp mới</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input placeholder="Tiêu đề lớp" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded" />
            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded" />
            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded" />
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo lớp'}</Button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-2">Tham gia lớp bằng mã</h3>
          <div className="flex gap-2">
            <input placeholder="Nhập mã lớp" value={joinCode} onChange={e => setJoinCode(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
            <Button onClick={handleJoin}>Tham gia</Button>
          </div>
        </div>
      </div>

      <div>
        {loading ? (
          <p>Đang tải...</p>
        ) : classes.length === 0 ? (
          <p>Chưa có lớp nào</p>
        ) : (
          <div className="grid gap-3">
            {classes.map(cl => (
              <div key={cl.id} className="p-4 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{cl.title}</h4>
                  <p className="text-sm text-zinc-600">Mã: {cl.code}</p>
                </div>
                <div className="text-sm text-zinc-600">{cl.course?.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
