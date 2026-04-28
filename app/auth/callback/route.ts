import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code     = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'
  const role     = searchParams.get('role') || 'buyer'

  if (code) {
    const res = NextResponse.redirect(`${origin}${redirect}`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll:  () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)
    if (user) {
      await supabase.from('profiles').update({ role }).eq('id', user.id)
    }
    return res
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
