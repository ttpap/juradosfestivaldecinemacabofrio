import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST-only: state mutation must never happen via GET because Next.js
// Link prefetch and browser preconnect can fire GET requests without
// the user clicking — causing voting_open to flip unpredictably.
export async function POST(request: Request) {
  const formData = await request.formData()
  const festivalId = String(formData.get('festival_id') ?? '')
  const votingOpen = String(formData.get('voting_open')) === 'true'
  const origin = new URL(request.url).origin

  if (!festivalId) {
    return NextResponse.redirect(`${origin}/admin`, 303)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/admin/login`, 303)

  if (user.email !== 'antonpap@gmail.com') {
    return NextResponse.redirect(`${origin}/admin/login`, 303)
  }

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('festivals')
    .update({ voting_open: votingOpen })
    .eq('id', festivalId)

  if (error) {
    console.error('[voting-control] UPDATE failed:', error.message, { festivalId, votingOpen })
  } else {
    console.log('[voting-control] voting_open set to', votingOpen, 'for festival', festivalId)
  }

  // 303 See Other forces browser to GET /admin (not re-POST)
  return NextResponse.redirect(`${origin}/admin`, 303)
}
