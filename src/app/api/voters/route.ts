export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name:       z.string().min(2),
  email:      z.string().email(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

export async function POST(request: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { name, email, birth_date } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const { data: festival } = await admin
    .from('festivals')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!festival)
    return NextResponse.json({ error: 'Nenhum festival.' }, { status: 404 })

  const { error } = await admin.from('voters').upsert(
    { festival_id: festival.id, name: name.trim(), email: normalizedEmail, birth_date },
    { onConflict: 'festival_id,email' }
  )

  if (error) {
    console.error('voters upsert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
