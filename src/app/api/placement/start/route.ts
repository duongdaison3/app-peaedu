import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function shuffleWithSeed<T>(items: T[], seed: number) {
  const copy = [...items]
  let state = seed

  const random = () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }

  return copy
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const anonymousData = {
      name: String(body?.name || '').trim(),
      email: String(body?.email || '').trim(),
      phone: String(body?.phone || '').trim() || null
    }

    if (!anonymousData.name || !anonymousData.email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const now = new Date()
    const test = await prisma.test.findFirst({
      where: {
        type: 'placement',
        allowAnonymous: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
      },
      include: {
        sections: {
          include: { questions: true },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!test) {
      return NextResponse.json(
        { error: 'No public placement test available. Please contact admin.' },
        { status: 404 }
      )
    }

    const randomSeed = Math.floor(Math.random() * 1e9)
    const sectionsOrder = test.sections.map((section, index) => {
      const seed = randomSeed + index
      const orderedQuestions = section.randomizeQuestions
        ? shuffleWithSeed(section.questions.map(question => question.id), seed)
        : section.questions.map(question => question.id)

      return {
        sectionId: section.id,
        questionIds: orderedQuestions
      }
    })

    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        studentId: null,
        anonymousName: anonymousData.name,
        anonymousEmail: anonymousData.email,
        anonymousPhone: anonymousData.phone,
        status: 'in_progress',
        randomSeed,
        sectionsOrder
      }
    })

    return NextResponse.json({ attemptId: attempt.id })
  } catch (error) {
    console.error('Placement start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
