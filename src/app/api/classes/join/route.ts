import { NextRequest, NextResponse } from 'next/server'
import { joinClassByCode } from '@/modules/course/actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

    const enrollment = await joinClassByCode(code)
    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error('Join class error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: error?.message === 'Unauthorized' ? 403 : 500 })
  }
}
