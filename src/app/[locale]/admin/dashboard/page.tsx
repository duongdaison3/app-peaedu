import { Suspense } from 'react'
import { AdminDashboardClient } from './client'

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardClient />
    </Suspense>
  )
}
