import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const festivalId = searchParams.get('festival_id')
  const votingOpen = searchParams.get('voting_open') === 'true'

  if (!festivalId) {
    return NextResponse.redirect(`${origin}/admin`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/admin/login`)

  if (user.email !== 'antonpap@gmail.com') {
    return NextResponse.redirect(`${origin}/admin/login`)
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

  return NextResponse.redirect(`${origin}/admin`)
}
