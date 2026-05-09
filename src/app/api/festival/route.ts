export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: festival } = await admin
    .from('festivals')
    .select('id, name, year, voting_open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!festival) return NextResponse.json({ festival: null, films: [] })

  const { data: films } = await admin
    .from('films')
    .select('id, title, category, thumbnail_url, director')
    .eq('festival_id', festival.id)
    .eq('active', true)
    .order('title')

  return NextResponse.json({ festival, films: films ?? [] })
}
