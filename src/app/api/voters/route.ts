export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
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

  const { name, email } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const { data: festival } = await admin
    .from('festivals')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!festival)
    return NextResponse.json({ error: 'Nenhum festival.' }, { status: 404 })

  // Upsert — atualiza nome se email já existe
  await admin.from('voters').upsert(
    { festival_id: festival.id, name: name.trim(), email: normalizedEmail },
    { onConflict: 'festival_id,email' }
  )

  return NextResponse.json({ ok: true })
}
