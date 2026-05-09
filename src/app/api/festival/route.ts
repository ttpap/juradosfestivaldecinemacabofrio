export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: festival } = await admin
    .from('festivals')
    .select('id, name, year, voting_open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const noCacheHeaders = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }

  if (!festival) return NextResponse.json({ festival: null, films: [] }, { headers: noCacheHeaders })

  const { data: films } = await admin
    .from('films')
    .select('id, title, category, thumbnail_url, director')
    .eq('festival_id', festival.id)
    .eq('active', true)
    .order('title')

  return NextResponse.json({ festival, films: films ?? [] }, { headers: noCacheHeaders })
}
