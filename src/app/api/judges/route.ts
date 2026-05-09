import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  bio: z.string().optional(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verifica se quem faz a requisição é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    // Pega festival ativo
    const { data: festival } = await supabase
      .from('festivals')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Cria o usuário no Supabase Auth usando Admin API via service role
    // Na Vercel, use SUPABASE_SERVICE_ROLE_KEY para operações admin
    // Por ora, usa signUp para criar o usuário (jurado faz login posteriormente)
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.name },
    })

    if (authError) {
      // Se usuário já existe, busca pelo email
      if (authError.message.includes('already registered')) {
        // Tenta inserir apenas o registro de jurado sem criar novo usuário
        const { data: existingUsers } = await adminClient.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find((u) => u.email === parsed.data.email)

        if (existingUser) {
          // Atualiza role para judge
          await adminClient
            .from('profiles')
            .update({ role: 'judge' })
            .eq('id', existingUser.id)

          const { data: judgeData, error: judgeError } = await adminClient
            .from('judges')
            .insert({
              user_id: existingUser.id,
              festival_id: festival?.id || null,
              name: parsed.data.name,
              email: parsed.data.email.toLowerCase(),
              bio: parsed.data.bio || null,
            })
            .select()
            .single()

          if (judgeError) {
            return NextResponse.json({ error: judgeError.message }, { status: 500 })
          }
          return NextResponse.json({ success: true, data: judgeData })
        }
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const newUserId = authData.user?.id
    if (!newUserId) return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })

    // Atualiza role para judge
    await adminClient.from('profiles').upsert({
      id: newUserId,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: 'judge',
    })

    // Cria registro de jurado
    const { data: judgeData, error: judgeError } = await adminClient
      .from('judges')
      .insert({
        user_id: newUserId,
        festival_id: festival?.id || null,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        bio: parsed.data.bio || null,
      })
      .select()
      .single()

    if (judgeError) {
      return NextResponse.json({ error: judgeError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: judgeData })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
