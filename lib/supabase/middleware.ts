import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Create Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // This refreshes the session cookie if strictly necessary
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes logic
    // If no user and navigating to protected routs, redirect to login
    // We'll treat (dashboard) routes as protected
    if (
        !user &&
        (request.nextUrl.pathname.startsWith('/student') ||
            request.nextUrl.pathname.startsWith('/chairman') ||
            request.nextUrl.pathname.startsWith('/execom') ||
            request.nextUrl.pathname.startsWith('/groups') ||
            request.nextUrl.pathname.startsWith('/analytics'))
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/landing/index.html'
        return NextResponse.redirect(url)
    }

    // If user is logged in and visiting landing/login, redirect to dashboard?
    // app/page.tsx handles root, but if they go to /landing/index.html explicitly we might want to let them?
    // For now let's just stick to protecting routes.

    return supabaseResponse
}
