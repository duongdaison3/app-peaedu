import { NextRequest, NextResponse } from 'next/server'
import { createClass } from '@/modules/course/actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, title, startDate, endDate } = body

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const parsedStart = startDate ? new Date(startDate) : new Date()
    const parsedEnd = endDate ? new Date(endDate) : new Date()

    const classItem = await createClass({ courseId, title, startDate: parsedStart, endDate: parsedEnd })

    return NextResponse.json(classItem, { status: 201 })
  } catch (error: any) {
    console.error('API create class error:', error)
    const message = error?.message || 'Internal server error'
    const status = message === 'Unauthorized' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
