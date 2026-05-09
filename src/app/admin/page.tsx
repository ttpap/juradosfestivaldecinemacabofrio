export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Film, BarChart2, Power, PowerOff, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: festival } = await supabase
    .from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single()

  const { data: films } = festival
    ? await supabase.from('films').select('*').eq('festival_id', festival.id).order('title')
    : { data: [] }

  // Contagem de votos por filme
  const { data: votes } = festival
    ? await supabase.from('public_votes').select('film_id').eq('festival_id', festival.id)
    : { data: [] }

  const voteCounts: Record<string, number> = {}
  votes?.forEach(v => { voteCounts[v.film_id] = (voteCounts[v.film_id] ?? 0) + 1 })
  const totalVotes = votes?.length ?? 0

  const rankedFilms = (films ?? [])
    .map(f => ({ ...f, votes: voteCounts[f.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes)

  return (
    <div className="min-h-screen bg-ocean-950 text-white">
      <header className="border-b border-ocean-800 bg-ocean-900/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-white">FINCCA Admin</h1>
          <Link href="/api/auth/signout" prefetch={false}
            className="text-xs text-ocean-400 hover:text-white transition-colors">Sair</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <p className="text-xs text-ocean-400 mb-1">Total de votos</p>
            <p className="text-3xl font-bold text-white">{totalVotes}</p>
          </div>
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <p className="text-xs text-ocean-400 mb-1">Filmes</p>
            <p className="text-3xl font-bold text-white">{films?.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <p className="text-xs text-ocean-400 mb-1">Votação</p>
            <p className={`text-lg font-bold ${festival?.voting_open ? 'text-green-400' : 'text-red-400'}`}>
              {festival?.voting_open ? 'Aberta' : 'Fechada'}
            </p>
          </div>
        </div>

        {/* Voting toggle */}
        {festival && (
          <div className="flex items-center justify-between rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
            <div>
              <p className="font-semibold text-white">Votação pública</p>
              <p className="text-sm text-ocean-400">{festival.voting_open ? 'Votação aberta ao público' : 'Votação encerrada'}</p>
            </div>
            <Link
              href={`/api/admin/voting-control?festival_id=${festival.id}&voting_open=${!festival.voting_open}`}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                festival.voting_open
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
              }`}>
              {festival.voting_open ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              {festival.voting_open ? 'Fechar votação' : 'Abrir votação'}
            </Link>
          </div>
        )}

        {/* Results */}
        {rankedFilms.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-semibold text-ocean-200">
                <BarChart2 className="w-4 h-4 text-gold-400" /> Resultado parcial
              </h2>
              <Link href="/admin/filmes" className="text-xs text-ocean-400 hover:text-white flex items-center gap-1">
                <Film className="w-3.5 h-3.5" /> Gerenciar filmes
              </Link>
            </div>
            <div className="space-y-2">
              {rankedFilms.map((film, i) => {
                const pct = totalVotes > 0 ? Math.round((film.votes / totalVotes) * 100) : 0
                return (
                  <div key={film.id} className="rounded-xl border border-ocean-700 bg-ocean-800/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-gold-400' : 'text-ocean-500'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{film.title}</p>
                        <p className="text-xs text-ocean-400">Dir. {film.director}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{film.votes}</p>
                        <p className="text-xs text-ocean-500">{pct}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-ocean-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${i === 0 ? 'bg-gold-500' : 'bg-ocean-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Quick link to add film */}
        <Link href="/admin/filmes/novo"
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ocean-600 p-5 text-ocean-400 hover:border-gold-500/40 hover:text-gold-400 transition-colors">
          <Plus className="w-4 h-4" /> Adicionar filme
        </Link>
      </div>
    </div>
  )
}
