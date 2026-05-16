import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        test: { include: { sections: { include: { questions: { include: { question: true } } } } } }
      }
    })

    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

    const rows = ['question_id,question_title,skill,student_answer,score,max_score']

    for (const ans of attempt.answers) {
      const q = ans.question
      const title = (q?.title || '').replace(/"/g, '""')
      const studentAnswer = (ans.answerText || JSON.stringify(ans.answerJson || '') || '').replace(/"/g, '""')
      const maxScore = q?.score ?? ''
      rows.push(`${ans.questionId},"${title}",${q?.skill || ''},"${studentAnswer}",${ans.score ?? ''},${maxScore}`)
    }

    const csv = rows.join('\n')
    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="placement-${attemptId}.csv"` } })
  } catch (error) {
    console.error('Export error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
