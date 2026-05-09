import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: festival } = await supabase
    .from('festivals')
    .select('id, name, year, voting_open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!festival) return NextResponse.json({ films: [], festival: null })

  const { data: films } = await supabase
    .from('films')
    .select('id, title, category')
    .eq('festival_id', festival.id)
    .eq('active', true)

  const { data: votes } = await supabase
    .from('public_votes')
    .select('film_id')
    .eq('festival_id', festival.id)

  const voteCounts: Record<string, number> = {}
  for (const v of votes ?? []) {
    voteCounts[v.film_id] = (voteCounts[v.film_id] ?? 0) + 1
  }

  const ranked = (films ?? [])
    .map(f => ({ ...f, votes: voteCounts[f.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes)

  return NextResponse.json({ festival, films: ranked, total: votes?.length ?? 0 })
}
