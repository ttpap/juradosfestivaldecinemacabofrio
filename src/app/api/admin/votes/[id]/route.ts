import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ALLOWED_EMAIL = 'antonpap@gmail.com'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  if (user.email !== ALLOWED_EMAIL)
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('public_votes').delete().eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro ao apagar voto.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
