"use server"

import { prisma } from '@/lib/prisma'
import { requireRoles } from '@/modules/auth/actions'

export async function getAntiCheatLogs({ limit = 200, cursor }: { limit?: number; cursor?: string } = {}) {
  await requireRoles(['super_admin', 'academic_manager', 'teacher'])

  const logs = await prisma.antiCheatLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' }
  })

  return logs
}
