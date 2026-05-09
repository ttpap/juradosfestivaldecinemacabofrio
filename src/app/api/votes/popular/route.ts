import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  film_id:     z.string().uuid(),
  voter_name:  z.string().min(2),
  voter_email: z.string().email(),
})

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { film_id, voter_name, voter_email } = parsed.data
  const email = voter_email.toLowerCase().trim()

  const { data: festival } = await admin
    .from('festivals').select('id, voting_open').order('created_at', { ascending: false }).limit(1).single()

  if (!festival)
    return NextResponse.json({ error: 'Nenhum festival encontrado.' }, { status: 404 })
  if (!festival.voting_open)
    return NextResponse.json({ error: 'Votação encerrada.' }, { status: 403 })

  const { data: film } = await admin
    .from('films').select('id').eq('id', film_id).eq('festival_id', festival.id).eq('active', true).single()

  if (!film)
    return NextResponse.json({ error: 'Filme não encontrado.' }, { status: 404 })

  // Remove voto anterior se existir (permite troca)
  await admin.from('public_votes')
    .delete()
    .eq('festival_id', festival.id)
    .eq('voter_email', email)

  const { error } = await admin.from('public_votes').insert({
    festival_id: festival.id,
    film_id,
    voter_name: voter_name.trim(),
    voter_email: email,
  })

  if (error)
    return NextResponse.json({ error: 'Erro ao registrar voto.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// Retorna o voto atual do email (se existir)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.toLowerCase().trim()
  if (!email) return NextResponse.json({ vote: null })

  const { data: festival } = await admin
    .from('festivals').select('id').order('created_at', { ascending: false }).limit(1).single()

  if (!festival) return NextResponse.json({ vote: null })

  const { data: vote } = await admin
    .from('public_votes')
    .select('film_id')
    .eq('festival_id', festival.id)
    .eq('voter_email', email)
    .single()

  return NextResponse.json({ vote: vote ?? null })
}
