export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/auth/admins'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey)
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada.' }, { status: 500 })

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: festival } = await admin
    .from('festivals').select('id, name').order('created_at', { ascending: false }).limit(1).single()

  if (!festival)
    return NextResponse.json({ error: 'Nenhum festival encontrado.' }, { status: 404 })

  const { data: votes } = await admin
    .from('public_votes')
    .select('voter_name, voter_email, comment_film, comment_festival')
    .eq('festival_id', festival.id)

  const votersWithoutComments = (votes ?? []).filter(
    v => !v.comment_film || !v.comment_festival
  )

  if (votersWithoutComments.length === 0)
    return NextResponse.json({ sent: 0, message: 'Todos os votantes já comentaram.' })

  const resend = new Resend(apiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'FINCCA <onboarding@resend.dev>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  let sent = 0
  let errors = 0

  for (const voter of votersWithoutComments) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: voter.voter_email,
        subject: 'FINCCA — Complete seu voto com um comentário!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #06111e; color: white; padding: 32px; border-radius: 16px;">
            <img src="${appUrl}/logo.png" alt="FINCCA" width="120" style="margin-bottom: 20px;" />
            <h2 style="color: #f0c060; margin-bottom: 8px;">Olá, ${voter.voter_name}!</h2>
            <p style="color: #a0b4cc; font-size: 14px; line-height: 1.6;">
              Seu voto no <strong>1º Festival Internacional de Cinema de Cabo Frio</strong> foi registrado com sucesso!
            </p>
            <p style="color: #a0b4cc; font-size: 14px; line-height: 1.6;">
              Agora pedimos que volte ao app para deixar um <strong>breve comentário</strong> sobre o filme que assistiu e sobre o festival. Sua opinião é muito importante pra gente!
            </p>
            <a href="${appUrl}/cadastro" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #d4a850; color: #06111e; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 14px;">
              Deixar meu comentário
            </a>
            <p style="color: #4a6380; font-size: 12px; margin-top: 24px;">
              FINCCA 2026 — Festival Internacional de Cinema de Cabo Frio
            </p>
          </div>
        `,
      })
      sent++
    } catch (e) {
      errors++
      console.error(`[notify-voters] Failed to send to ${voter.voter_email}:`, e)
    }
  }

  return NextResponse.json({ sent, errors, total: votersWithoutComments.length })
}
