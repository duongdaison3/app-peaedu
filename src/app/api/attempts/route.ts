import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/attempts - Start a test attempt
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const { testId, anonymousData } = body

    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { allowAnonymous: true, maxAttempts: true }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check max attempts
    if (user && test.maxAttempts) {
      const attemptCount = await prisma.testAttempt.count({
        where: { testId, studentId: user?.id }
      })

      if (attemptCount >= test.maxAttempts) {
        return NextResponse.json(
          { error: 'Max attempts reached' },
          { status: 403 }
        )
      }
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        studentId: user?.id || null,
        anonymousName: anonymousData?.name || null,
        anonymousEmail: anonymousData?.email || null,
        anonymousPhone: anonymousData?.phone || null,
        status: 'in_progress'
      }
    })

    return NextResponse.json(attempt, { status: 201 })
  } catch (error) {
    console.error('Error creating attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
