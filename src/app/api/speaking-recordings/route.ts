import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildR2PublicUrl, createR2Client, getR2Config } from '@/lib/r2'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg']

function safeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'recording.webm'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Recording is empty' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Recording exceeds 50MB limit' }, { status: 400 })
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported audio type: ${file.type}` }, { status: 400 })
    }

    const config = getR2Config()
    const client = createR2Client(config)
    const attemptId = (formData.get('attemptId') as string | null)?.trim()
    const timestamp = Date.now()
    const key = [
      'speaking-recordings',
      user.id,
      attemptId || 'standalone',
      `${timestamp}-${safeFileName(file.name)}`,
    ].join('/')

    const body = Buffer.from(await file.arrayBuffer())

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: file.type,
      })
    )

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        key,
        url: buildR2PublicUrl(config, key),
      },
    })
  } catch (error) {
    console.error('Speaking upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}