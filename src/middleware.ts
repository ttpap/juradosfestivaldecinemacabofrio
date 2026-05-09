import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/auth/admins'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Only run auth check on protected /admin routes (not login itself)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // Network error talking to Supabase — treat as unauthenticated
    }

    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (!isAdminEmail(user.email))
      return NextResponse.redirect(new URL('/admin/login?error=acesso_negado', request.url))
  }

  // Force no-store on dynamic pages so browser bfcache cannot restore
  // stale HTML (e.g. old voting toggle Link, old voting_open value).
  // Static assets are excluded by the matcher below.
  const isDynamicPage =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/votar') ||
    pathname.startsWith('/placar') ||
    pathname.startsWith('/cadastro')

  if (isDynamicPage) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
