import { parseCookies, setCookie } from '@tanstack/react-start/server'
import { createServerClient } from '@supabase/ssr'

export function getSupabaseServerClient() {
  return createServerClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string,
    {
      cookies: {
        // @ts-ignore Wait till Supabase overload works
        getAll() {
          return Object.entries(parseCookies()).map(([name, value]) => ({
            name,
            value,
          }))
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        setAll(cookies: any[]) {
          for (const cookie of cookies) {
            setCookie(cookie.name, cookie.value)
          }
        },
      },
    },
  )
}
