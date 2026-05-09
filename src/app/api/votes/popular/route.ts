import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  film_id: z.string().uuid(),
  voter_name: z.string().min(2),
  voter_email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verifica se a votação está aberta
    const { data: festival } = await supabase
      .from('festivals')
      .select('voting_open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!festival?.voting_open) {
      return NextResponse.json({ error: 'A votação não está aberta.' }, { status: 403 })
    }

    // Verifica se o filme existe e está ativo
    const { data: film } = await supabase
      .from('films')
      .select('id, is_active')
      .eq('id', parsed.data.film_id)
      .single()

    if (!film?.is_active) {
      return NextResponse.json({ error: 'Filme não encontrado ou inativo.' }, { status: 404 })
    }

    // Insere o voto (UNIQUE constraint impede duplicata)
    const { error } = await supabase.from('public_votes').insert({
      film_id: parsed.data.film_id,
      voter_name: parsed.data.voter_name.trim(),
      voter_email: parsed.data.voter_email.toLowerCase().trim(),
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Você já votou neste filme com este e-mail.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
