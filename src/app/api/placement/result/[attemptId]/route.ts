import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateSkillScores } from '@/modules/test/actions'

export async function GET(_: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: { include: { sections: { include: { questions: { include: { question: true } } } } } },
        answers: { include: { question: true } }
      }
    })

    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

    const skillScores = await calculateSkillScores(attemptId)

    const totalQuestions = attempt.test.sections.reduce((s: number, sec: any) => s + (sec.questions?.length || 0), 0)
    const totalScore = attempt.totalScore ?? 0
    const percentage = totalQuestions > 0 ? Math.round((totalScore / (totalQuestions * 1)) * 100) : 0

    return NextResponse.json({ attempt, skillScores, totalScore, percentage })
  } catch (error) {
    console.error('Placement result fetch error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
