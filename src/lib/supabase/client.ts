import { createBrowserClient } from '@supabase/ssr'

// Fallback placeholder permite o build sem .env.local —
// erros reais só aparecem em runtime se as vars não forem configuradas.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}
