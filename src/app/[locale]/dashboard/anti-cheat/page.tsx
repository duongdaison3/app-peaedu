'use client'

import { useEffect, useState } from 'react'
import { getAntiCheatLogs } from '@/modules/antiCheat/actions'

export default function AntiCheatAdminPage() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const data = await getAntiCheatLogs()
        setLogs(data)
      } catch (e) {
        console.error('Failed to load anti-cheat logs', e)
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Anti-cheat Logs</h1>
      <div className="rounded-lg border bg-white p-4">
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th>Time</th>
              <th>Attempt</th>
              <th>Student</th>
              <th>Reason</th>
              <th>Count</th>
              <th>Meta</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="py-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="py-2">{l.attemptId ?? '-'}</td>
                <td className="py-2">{l.studentId ?? '-'}</td>
                <td className="py-2">{l.reason}</td>
                <td className="py-2">{l.count}</td>
                <td className="py-2 wrap-break-word max-w-xs">{JSON.stringify(l.meta || {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
