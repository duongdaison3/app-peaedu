import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = request.headers.get('origin') || 'http://localhost:3000'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        try {
          await prisma.user.upsert({
            where: { id: user.id },
            update: {
              fullName: user.user_metadata?.full_name,
              avatarUrl: user.user_metadata?.avatar_url,
            },
            create: {
              id: user.id,
              email: user.email!,
              fullName: user.user_metadata?.full_name,
              avatarUrl: user.user_metadata?.avatar_url,
              username: user.email?.split('@')[0],
              provider: 'google',
            },
          })
        } catch (err) {
          console.error('Error syncing user:', err)
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
