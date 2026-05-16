'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClassDetails, removeStudentFromClass } from '@/modules/course/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ClassDetailPage({ params }: { params: { classId: string } }) {
  const { classId } = params
  const router = useRouter()
  const [classItem, setClassItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)

  useEffect(() => { load() }, [classId])

  const load = async () => {
    try {
      setLoading(true)
      const c = await getClassDetails(classId)
      setClassItem(c)
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải lớp')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (studentId: string) => {
    if (!confirm('Gỡ học viên khỏi lớp?')) return
    try {
      setRemoving(true)
      await removeStudentFromClass(classId, studentId)
      toast.success('Đã gỡ')
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi gỡ học viên')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) return <p className="p-6">Đang tải...</p>
  if (!classItem) return <p className="p-6">Không tìm thấy lớp</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{classItem.title}</h1>
          <p className="text-sm text-zinc-600">Mã: {classItem.code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/classes')}>Quay lại</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold mb-2">Danh sách học viên</h3>
        {classItem.students?.length === 0 ? (
          <p>Chưa có học viên</p>
        ) : (
          <div className="grid gap-2">
            {classItem.students.map((s: any) => (
              <div key={s.student.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{s.student.fullName}</div>
                  <div className="text-sm text-zinc-600">{s.student.email}</div>
                </div>
                <div>
                  <Button variant="destructive" size="sm" onClick={() => handleRemove(s.student.id)} disabled={removing}>Gỡ</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold">Bài kiểm tra trong lớp</h3>
        {classItem.tests?.length === 0 ? <p>Chưa có bài kiểm tra</p> : (
          <div className="grid gap-2">
            {classItem.tests.map((t: any) => (
              <div key={t.id} className="p-3 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-sm text-zinc-600">Sections: {t.sections?._count || 0}</div>
                </div>
                <div>
                  <Button variant="outline" onClick={() => router.push(`/dashboard/tests/${t.id}`)}>Xem</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
