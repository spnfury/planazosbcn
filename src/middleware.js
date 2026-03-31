import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // If Supabase env vars are not available, skip auth check and pass through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Middleware: Supabase env vars not available, passing through');
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect /admin routes (except login)
    if (
      !user &&
      request.nextUrl.pathname.startsWith('/admin') &&
      request.nextUrl.pathname !== '/admin/login' &&
      request.nextUrl.pathname !== '/admin'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // Protect /restaurant routes (except login)
    if (
      !user &&
      request.nextUrl.pathname.startsWith('/restaurant') &&
      request.nextUrl.pathname !== '/restaurant/login'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/restaurant/login'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('Middleware auth error:', err.message);
    // Don't crash — allow the request through, let the route handle auth if needed
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/admin/restaurants/instagram (public scraping endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|comercios|api/admin/restaurants/instagram|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
