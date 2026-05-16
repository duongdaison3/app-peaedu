import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!type || !['audio', 'image'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 50MB limit` },
          { status: 400 }
        )
      }

      // Validate file mime type
      const allowedTypes = type === 'audio' ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid ${type} file type: ${file.type}` },
          { status: 400 }
        )
      }

      try {
        // Upload to Supabase Storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const bucket = type === 'audio' ? 'question-audio' : 'question-images'

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            contentType: file.type,
          })

        if (error) {
          console.error('Supabase upload error:', error)
          return NextResponse.json(
            { error: `Upload failed: ${error.message}` },
            { status: 500 }
          )
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName)

        uploadedFiles.push({
          name: file.name,
          type: type,
          url: publicUrl,
          size: file.size,
        })
      } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
          { error: 'Upload failed' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: true, files: uploadedFiles },
      { status: 200 }
    )
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
