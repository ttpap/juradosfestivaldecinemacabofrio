export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { Users } from 'lucide-react'

export default async function CadastradosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: festival } = await admin
    .from('festivals').select('id').order('created_at', { ascending: false }).limit(1).single()

  const [{ data: voters }, { data: votes }] = await Promise.all([
    festival
      ? admin.from('voters').select('id, name, email, created_at').eq('festival_id', festival.id).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    festival
      ? admin.from('public_votes').select('voter_email, film_id, films(title)').eq('festival_id', festival.id)
      : Promise.resolve({ data: [] }),
  ])

  const voteMap: Record<string, string> = {}
  for (const v of votes ?? []) {
    voteMap[v.voter_email] = (v.films as any)?.title ?? '—'
  }

  const total = voters?.length ?? 0
  const totalVoted = Object.keys(voteMap).length

  return (
    <div className="min-h-screen bg-ocean-950 text-white">
      <header className="border-b border-ocean-800 bg-ocean-900/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-gold-400" />
          <h1 className="font-bold text-white">Cadastrados</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <p className="text-xs text-ocean-400 mb-1">Cadastrados</p>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <p className="text-xs text-ocean-400 mb-1">Votaram</p>
            <p className="text-3xl font-bold text-green-400">{totalVoted}</p>
          </div>
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <p className="text-xs text-ocean-400 mb-1">Não votaram</p>
            <p className="text-3xl font-bold text-ocean-400">{total - totalVoted}</p>
          </div>
        </div>

        {/* Tabela */}
        {total === 0 ? (
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/40 py-16 text-center">
            <Users className="w-8 h-8 text-ocean-600 mx-auto mb-3" />
            <p className="text-ocean-400 text-sm">Nenhum cadastro ainda.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-ocean-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ocean-700 bg-ocean-800/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">E-mail</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide hidden sm:table-cell">Cadastro</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Voto</th>
                  </tr>
                </thead>
                <tbody>
                  {voters?.map((v, i) => {
                    const filmVoted = voteMap[v.email]
                    return (
                      <tr key={v.id} className={`border-b border-ocean-800 ${i % 2 === 0 ? '' : 'bg-ocean-800/20'}`}>
                        <td className="px-4 py-3 font-medium text-white">{v.name}</td>
                        <td className="px-4 py-3 text-ocean-300">{v.email}</td>
                        <td className="px-4 py-3 text-ocean-500 hidden sm:table-cell">
                          {new Date(v.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          {filmVoted ? (
                            <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-2 py-1 truncate max-w-[160px] inline-block">
                              {filmVoted}
                            </span>
                          ) : (
                            <span className="text-xs text-ocean-600">Não votou</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
