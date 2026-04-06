import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

const LOGIN_PATH = '/login'
const PUBLIC_PATHS = [LOGIN_PATH, '/api/auth/verify']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    const { supabaseResponse } = createClient(request)
    return supabaseResponse
  }

  // Check for PIN auth cookie
  const pinAuth = request.cookies.get('pin_auth')

  if (!pinAuth) {
    // Redirect to login with original URL as redirect param
    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // PIN is valid, process Supabase session
  const { supabaseResponse } = createClient(request)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
