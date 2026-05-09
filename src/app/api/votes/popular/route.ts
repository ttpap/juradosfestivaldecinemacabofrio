import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  film_id:     z.string().uuid(),
  voter_name:  z.string().min(2),
  voter_email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { film_id, voter_name, voter_email } = parsed.data
  const supabase = await createClient()

  // Festival ativo
  const { data: festival } = await supabase
    .from('festivals').select('id, voting_open').order('created_at', { ascending: false }).limit(1).single()

  if (!festival)
    return NextResponse.json({ error: 'Nenhum festival encontrado.' }, { status: 404 })
  if (!festival.voting_open)
    return NextResponse.json({ error: 'Votação encerrada.' }, { status: 403 })

  // Filme pertence ao festival e está ativo
  const { data: film } = await supabase
    .from('films').select('id').eq('id', film_id).eq('festival_id', festival.id).eq('active', true).single()

  if (!film)
    return NextResponse.json({ error: 'Filme não encontrado.' }, { status: 404 })

  const { error } = await supabase.from('public_votes').insert({
    festival_id: festival.id,
    film_id,
    voter_name: voter_name.trim(),
    voter_email: voter_email.toLowerCase().trim(),
  })

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'Este e-mail já votou neste festival.' }, { status: 409 })
    return NextResponse.json({ error: 'Erro ao registrar voto.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
