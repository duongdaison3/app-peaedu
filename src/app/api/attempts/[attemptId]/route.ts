import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/attempts/[attemptId] - Submit test attempt
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const { answers } = body

    const resolvedParams = await params
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: resolvedParams.attemptId }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Verify ownership
    if (attempt.studentId && user?.id !== attempt.studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create answer records
    await prisma.attemptAnswer.createMany({
      data: answers.map((ans: any) => ({
        attemptId: attempt.id,
        questionId: ans.questionId,
        answerText: ans.answerText || null,
        answerJson: ans.answerJson || null
      }))
    })

    // Update attempt status
    const updated = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'submitted',
        submittedAt: new Date()
      },
      include: {
        answers: { include: { question: true } }
      }
    })

    // Auto-score MCQ questions
    await autoScoreAttempt(attempt.id)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error submitting attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/attempts/[attemptId] - Get attempt results
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const resolvedParams = await params
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: resolvedParams.attemptId },
      include: {
        test: { include: { sections: true } },
        answers: { include: { question: { include: { options: true } } } },
        student: { select: { id: true, fullName: true } }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Check access
    if (attempt.studentId && user?.id !== attempt.studentId && user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('Error fetching attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function autoScoreAttempt(attemptId: string) {
  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId },
    include: { question: { include: { options: true } } }
  })

  let totalScore = 0

  for (const answer of answers) {
    let score = 0

    if (answer.question.type === 'mcq' || answer.question.type === 'true_false') {
      const correctOption = answer.question.options.find(o => o.isCorrect)
      const selectedId = (answer.answerJson as any)?.selectedId
      if (selectedId === correctOption?.id) {
        score = answer.question.score
      }
    }

    if (score > 0) {
      await prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: { score }
      })
    }

    totalScore += score
  }

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { totalScore, status: 'graded' }
  })
}
