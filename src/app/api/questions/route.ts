import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/questions - Get questions with filters
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId')
    const skill = searchParams.get('skill')
    const difficulty = searchParams.get('difficulty')
    const type = searchParams.get('type')

    const questions = await prisma.question.findMany({
      where: {
        createdBy: user.id,
        folderId: folderId || undefined,
        skill: (skill as any) || undefined,
        difficulty: (difficulty as any) || undefined,
        type: (type as any) || undefined
      },
      include: {
        options: true,
        tags: { include: { tag: true } },
        media: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/questions - Create question
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
      folderId,
      type,
      skill,
      difficulty,
      title,
      content,
      explanation,
      score,
      options,
      tags
    } = body

    const question = await prisma.question.create({
      data: {
        folderId: folderId || null,
        type: type as any,
        skill: skill as any,
        difficulty: difficulty as any,
        title,
        content,
        explanation,
        score: score || 1,
        createdBy: user.id,
        options: {
          create: options || []
        },
        tags: {
          create: tags?.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName }
              }
            }
          })) || []
        }
      },
      include: {
        options: true,
        tags: { include: { tag: true } }
      }
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
