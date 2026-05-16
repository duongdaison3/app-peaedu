import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/analytics/student/[studentId] - Get student performance
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') || user.id

    // Check access
    if (studentId !== user.id && user.role === 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get student attempts
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId },
      include: {
        test: { select: { title: true } },
        answers: { select: { score: true } }
      }
    })

    const skillScores = await prisma.studentSkillScore.findMany({
      where: { studentId }
    })

    const totalAttempts = attempts.length
    const completedAttempts = attempts.filter(
      a => a.status === 'graded' || a.status === 'submitted'
    ).length
    const averageScore =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / completedAttempts
        : 0

    return NextResponse.json({
      totalAttempts,
      completedAttempts,
      averageScore,
      skillScores,
      attempts: attempts.map(a => ({
        id: a.id,
        testTitle: a.test.title,
        score: a.totalScore,
        status: a.status,
        submittedAt: a.submittedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
