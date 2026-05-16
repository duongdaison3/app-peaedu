import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const form = await request.json().catch(() => ({}))
    const attemptId = form?.attemptId || null
    const studentId = form?.studentId || null
    const reason = String(form?.reason || 'unknown')
    const count = Number(form?.count || 1)
    const meta = form?.meta || null

    const log = await prisma.antiCheatLog.create({
      data: {
        attemptId,
        studentId,
        reason,
        count,
        meta
      }
    })

    return NextResponse.json({ ok: true, id: log.id })
  } catch (error) {
    console.error('Anti-cheat log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
