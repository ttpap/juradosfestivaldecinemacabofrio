import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ALLOWED_EMAIL = 'antonpap@gmail.com'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  if (user.email !== ALLOWED_EMAIL)
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: festival } = await admin
    .from('festivals')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!festival) return NextResponse.json({ error: 'Festival não encontrado.' }, { status: 404 })

  const { count, error } = await admin
    .from('public_votes')
    .delete({ count: 'exact' })
    .eq('festival_id', festival.id)

  if (error) return NextResponse.json({ error: 'Erro ao apagar votos.' }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: count ?? 0 })
}
