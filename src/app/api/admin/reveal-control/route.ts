import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/auth/admins'
import { setResultsRevealed } from '@/lib/festival-settings'

// POST-only. Same reason as voting-control: GET would be prefetched
// by Next.js Link / browser preconnect and toggle results randomly.
export async function POST(request: Request) {
  const formData = await request.formData()
  const festivalId = String(formData.get('festival_id') ?? '')
  const revealed = String(formData.get('revealed')) === 'true'
  const origin = new URL(request.url).origin

  if (!festivalId) {
    return NextResponse.redirect(`${origin}/admin`, 303)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/admin/login`, 303)
  if (!isAdminEmail(user.email)) {
    return NextResponse.redirect(`${origin}/admin/login`, 303)
  }

  const { error } = await setResultsRevealed(festivalId, revealed)
  if (error) {
    console.error('[reveal-control] update failed:', error.message, { festivalId, revealed })
  } else {
    console.log('[reveal-control] results_revealed set to', revealed, 'for festival', festivalId)
  }

  return NextResponse.redirect(`${origin}/admin`, 303)
}
