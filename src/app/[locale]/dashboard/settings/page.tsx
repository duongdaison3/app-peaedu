'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, updateUserProfile } from '@/modules/auth/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const u = await getCurrentUser()
      setUser(u)
      setFullName(u?.fullName || '')
      setAvatarUrl(u?.avatarUrl || '')
    } catch (err) {
      // ignore
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateUserProfile({ fullName, avatarUrl })
      toast.success('Đã lưu')
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const supabase = createClient()
      const u = await getCurrentUser()
      if (!u) throw new Error('Unauthorized')

      const path = `avatars/${u.id}-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
      toast.success('Ảnh đã tải lên')
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải ảnh')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Cài đặt</h1>
      <div className="bg-white dark:bg-zinc-900 p-4 rounded border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div>
          <label className="block text-sm">Họ và tên</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" />
        </div>

        <div>
          <label className="block text-sm">Avatar URL</label>
          <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
        </div>
      </div>
    </div>
  )
}
