import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  film_id: z.string().uuid(),
  judge_id: z.string().uuid(),
  scores: z.record(z.number().min(0).max(10)),
  comment: z.string().optional(),
  is_submitted: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Verifica se o jurado pertence ao usuário
    const { data: judge } = await supabase
      .from('judges')
      .select('id, user_id')
      .eq('id', parsed.data.judge_id)
      .single()

    if (!judge || judge.user_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    // Verifica se já existe e se está bloqueada
    const { data: existing } = await supabase
      .from('technical_evaluations')
      .select('id, is_submitted')
      .eq('film_id', parsed.data.film_id)
      .eq('judge_id', parsed.data.judge_id)
      .single()

    if (existing?.is_submitted) {
      // Verifica se admin permite edição
      const { data: festival } = await supabase
        .from('festivals')
        .select('allow_jury_edit')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!festival?.allow_jury_edit) {
        return NextResponse.json(
          { error: 'Avaliação já enviada e edição não está permitida.' },
          { status: 403 }
        )
      }
    }

    const payload = {
      film_id: parsed.data.film_id,
      judge_id: parsed.data.judge_id,
      scores: parsed.data.scores,
      comment: parsed.data.comment?.trim() || null,
      is_submitted: parsed.data.is_submitted,
      submitted_at: parsed.data.is_submitted ? new Date().toISOString() : null,
    }

    let result
    if (existing) {
      result = await supabase
        .from('technical_evaluations')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('technical_evaluations')
        .insert(payload)
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
