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
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1f33;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1f33;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#07131f;border-radius:20px;overflow:hidden;border:1px solid #1a3352;">

        <!-- Header com logo -->
        <tr>
          <td style="background:#06111e;padding:32px 40px 28px;border-bottom:2px solid #d4a850;text-align:center;">
            <img src="${appUrl}/logo.png" alt="FINCCA" width="140" style="display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#d4a850;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Júri Popular</p>
            <h1 style="margin:0 0 24px;font-size:22px;color:#ffffff;line-height:1.3;font-weight:normal;">
              Olá, ${voter.voter_name}!
            </h1>
            <p style="margin:0 0 16px;font-size:15px;color:#8fafc8;line-height:1.7;font-family:Arial,sans-serif;">
              Seu voto no <strong style="color:#ffffff;">1º Festival Internacional de Cinema de Cabo Frio</strong> foi registrado — obrigado por participar!
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#8fafc8;line-height:1.7;font-family:Arial,sans-serif;">
              Queremos ouvir você. Volte ao app e deixe um <strong style="color:#ffffff;">breve comentário</strong> sobre o filme que assistiu e sobre o festival. Sua opinião faz parte da memória do FINCCA 2026.
            </p>

            <!-- Botão -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#d4a850;border-radius:12px;">
                  <a href="${appUrl}/cadastro" style="display:inline-block;padding:14px 32px;color:#06111e;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:0.5px;">
                    Deixar meu comentário →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Separador -->
            <hr style="border:none;border-top:1px solid #1a3352;margin:0 0 28px;" />

            <!-- Info festival -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:4px 0;">
                  <p style="margin:0;font-size:12px;color:#4a6a85;font-family:Arial,sans-serif;line-height:1.6;">
                    📅 &nbsp;14 a 17 de maio de 2026 · Cabo Frio, RJ
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 0;">
                  <p style="margin:0;font-size:12px;color:#4a6a85;font-family:Arial,sans-serif;line-height:1.6;">
                    🎬 &nbsp;Casa Museu Carlos Scliar · UVA · UERJ
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="background:#040e18;padding:20px 40px;border-top:1px solid #1a3352;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:#2e4d6a;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">
              FINCCA 2026 — Festival Internacional de Cinema de Cabo Frio
            </p>
            <p style="margin:0;font-size:11px;color:#1e3347;font-family:Arial,sans-serif;">
              Este email foi enviado porque você participou como júri popular.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      })
      sent++
    } catch (e) {
      errors++
      console.error(`[notify-voters] Failed to send to ${voter.voter_email}:`, e)
    }
  }

  return NextResponse.json({ sent, errors, total: votersWithoutComments.length })
}
