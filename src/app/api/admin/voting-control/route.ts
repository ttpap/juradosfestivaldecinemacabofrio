import { createClient } from '@/lib/supabase/server'
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

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.redirect(`${origin}/admin/login`)
  }

  await supabase
    .from('festivals')
    .update({ voting_open: votingOpen })
    .eq('id', festivalId)

  return NextResponse.redirect(`${origin}/admin`)
}
