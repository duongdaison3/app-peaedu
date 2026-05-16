import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tests - Get all tests for user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tests = await prisma.test.findMany({
      where: { createdBy: user.id },
      include: {
        sections: { select: { _count: true } },
        attempts: { select: { _count: true } },
        class: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/tests - Create new test
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      classId,
      sections,
      showAnswersMode
    } = body

    const test = await prisma.test.create({
      data: {
        title,
        description,
        type,
        classId: classId || null,
        showAnswersMode: showAnswersMode || 'after_deadline',
        createdBy: user.id,
        sections: {
          create: sections.map((section: any, idx: number) => ({
            title: section.title,
            skill: section.skill,
            durationMinutes: section.durationMinutes,
            orderIndex: idx,
            questions: {
              create: section.questionIds.map((qId: string, qIdx: number) => ({
                questionId: qId,
                orderIndex: qIdx
              }))
            }
          }))
        }
      },
      include: {
        sections: { include: { questions: true } }
      }
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Error creating test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
