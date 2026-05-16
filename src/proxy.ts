import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];

  // Protect role routes and dashboard area
  const isProtectedRoute = /^\/(en|vi)\/(admin|teacher|student|dashboard)/.test(pathname);

  // Public routes only need locale handling.
  if (!isProtectedRoute) {
    return intlMiddleware(request);
  }

  // Protected routes need auth/session refresh.
  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    // Redirect to login if not authenticated
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // 3. Run next-intl proxy for locale handling
  const response = intlMiddleware(request);

  // 4. Merge cookies from Supabase to final response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    } as any);
  });

  return response;
}

export const config = {
  matcher: [
    // Only run proxy on protected/dashboard/admin/teacher/student routes to
    // avoid running session/DB work and intl on every page during dev.
    '/(vi|en)/admin/:path*',
    '/(vi|en)/teacher/:path*',
    '/(vi|en)/student/:path*',
    '/(vi|en)/dashboard/:path*'
  ]
};