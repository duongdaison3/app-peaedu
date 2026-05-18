import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoScoreAttempt } from '@/modules/test/actions'

function mapAttempt(orderedAttempt: any) {
  const orderMap = new Map<string, string[]>()
  ;(orderedAttempt.sectionsOrder || []).forEach((section: any) => {
    orderMap.set(section.sectionId, section.questionIds || [])
  })

  const sections = orderedAttempt.test.sections.map((section: any) => {
    const orderedIds = orderMap.get(section.id)
    if (!orderedIds) return section

    const byTestQuestionId = new Map(section.questions.map((tq: any) => [tq.id, tq]))
    return {
      ...section,
      // Unwrap the nested `question` record so the client receives plain question objects
      questions: orderedIds
        .map((id) => {
          const tq = byTestQuestionId.get(id)
          if (!tq) return null
          const q = (tq as any).question || tq
          return {
            // keep test-question metadata if needed
            _testQuestionId: tq.id,
            orderIndex: tq.orderIndex,
            ...q
          }
        })
        .filter(Boolean)
    }
  })

  return {
    ...orderedAttempt,
    test: {
      ...orderedAttempt.test,
      sections
    }
  }
}

export async function GET(_: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    question: {
                      include: {
                        options: true,
                        media: true
                      }
                    }
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        answers: true
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const mapped = mapAttempt(attempt)
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Placement attempt fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || 'save')

    const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } })
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    if (attempt.studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    if (action === 'save') {
      const answers = Array.isArray(body?.answers) ? body.answers : []
      // upsert each answer by find -> update or create
      await Promise.all(answers.map(async (a: any) => {
        const existing = await prisma.attemptAnswer.findFirst({ where: { attemptId, questionId: a.questionId } })
        if (existing) {
          await prisma.attemptAnswer.update({
            where: { id: existing.id },
            data: {
              answerText: a.answerText || undefined,
              answerJson: a.answerJson || undefined
            }
          })
        } else {
          await prisma.attemptAnswer.create({
            data: {
              attemptId,
              questionId: a.questionId,
              answerText: a.answerText || null,
              answerJson: a.answerJson || null
            }
          })
        }
      }))
      return NextResponse.json({ ok: true })
    }

    if (action === 'submit') {
      // upsert provided answers if any
      const answers = Array.isArray(body?.answers) ? body.answers : []
      if (answers.length > 0) {
        await Promise.all(answers.map(async (a: any) => {
          const existing = await prisma.attemptAnswer.findFirst({ where: { attemptId, questionId: a.questionId } })
          if (existing) {
            await prisma.attemptAnswer.update({
              where: { id: existing.id },
              data: {
                answerText: a.answerText || undefined,
                answerJson: a.answerJson || undefined
              }
            })
          } else {
            await prisma.attemptAnswer.create({
              data: {
                attemptId,
                questionId: a.questionId,
                answerText: a.answerText || null,
                answerJson: a.answerJson || null
              }
            })
          }
        }))
      }

      // mark submitted
      await prisma.testAttempt.update({ where: { id: attemptId }, data: { status: 'submitted', submittedAt: new Date() } })

      // auto-score immediately for anonymous placement
      try {
        await autoScoreAttempt(attemptId)
      } catch (err) {
        console.error('Auto-scoring failed for placement attempt', attemptId, err)
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Placement attempt POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
