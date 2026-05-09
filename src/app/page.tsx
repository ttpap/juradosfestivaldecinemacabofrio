import Image from 'next/image'
import Link from 'next/link'
import { Film, Vote, Trophy, Users } from 'lucide-react'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { QRButton } from '@/components/QRButton'

export const dynamic = 'force-dynamic'

const MEDAL = ['🥇', '🥈', '🥉']

export default async function HomePage() {
  const supabase = await createServerClient()

  const { data: festival } = await supabase
    .from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single()

  // Service role para ler votos (RLS bloqueia anon)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: films }, { data: votes }] = await Promise.all([
    festival
      ? admin.from('films').select('id, title, category, thumbnail_url, director, synopsis').eq('festival_id', festival.id).eq('active', true).order('title')
      : Promise.resolve({ data: [] }),
    festival
      ? admin.from('public_votes').select('film_id').eq('festival_id', festival.id)
      : Promise.resolve({ data: [] }),
  ])

  const voteCounts: Record<string, number> = {}
  for (const v of votes ?? []) {
    voteCounts[v.film_id] = (voteCounts[v.film_id] ?? 0) + 1
  }

  const ranked = (films ?? [])
    .map(f => ({ ...f, votes: voteCounts[f.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes)

  const totalVotes = votes?.length ?? 0
  const totalVoters = new Set(votes?.map((v: any) => v.film_id)).size // unique films voted = proxy; actually total rows = total voters
  const hasVotes = totalVotes > 0
  const maxVotes = ranked[0]?.votes ?? 1

  return (
    <main className="min-h-screen bg-ocean-950 text-white">
      {/* Header */}
      <header className="border-b border-ocean-800 bg-ocean-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Image src="/logo.png" alt="FINCCA" width={100} height={54} className="object-contain" />
          <div className="ml-auto flex items-center gap-2">
            <QRButton path="/cadastro" label="QR Code" />
            <Link href="/admin/login" className="text-xs text-ocean-400 hover:text-white border border-ocean-700 rounded-lg px-3 py-1.5 transition-colors sm:flex hidden">
              Área Admin
            </Link>
            {festival?.voting_open && (
              <Link href="/cadastro"
                className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-bold text-ocean-950 hover:bg-gold-400 transition-colors">
                <Vote className="w-4 h-4" />
                Votar agora
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-gold-400 text-sm font-semibold tracking-widest uppercase mb-3">
            {festival?.year ?? '2025'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Festival Internacional de<br />Cinema de Cabo Frio
          </h1>
          <p className="text-ocean-300 text-lg max-w-xl mx-auto">
            Vote no seu filme favorito e ajude a escolher o grande vencedor do júri popular.
          </p>
          {festival?.voting_open ? (
            <Link href="/cadastro"
              className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-gold-500 px-8 py-4 text-base font-bold text-ocean-950 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20">
              <Vote className="w-5 h-5" />
              Quero votar
            </Link>
          ) : (
            <div className="mt-8 inline-block rounded-2xl border border-ocean-700 bg-ocean-800/50 px-8 py-4 text-sm text-ocean-400">
              Votação encerrada
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalVotes}</p>
              <p className="text-xs text-ocean-400">votos registrados</p>
            </div>
          </div>
          <div className="rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-ocean-700 flex items-center justify-center">
              <Film className="w-5 h-5 text-ocean-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{films?.length ?? 0}</p>
              <p className="text-xs text-ocean-400">filmes em competição</p>
            </div>
          </div>
        </div>

        {/* Placar ao vivo */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-gold-400" />
            <h2 className="text-lg font-semibold text-white">Placar ao vivo</h2>
            <span className="ml-auto text-xs text-ocean-500">atualiza a cada visita</span>
          </div>

          {hasVotes ? (
            <div className="space-y-2">
              {ranked.map((film, i) => {
                const pct = maxVotes > 0 ? (film.votes / maxVotes) * 100 : 0
                const isLeader = i === 0
                return (
                  <div key={film.id}
                    className={`rounded-2xl border px-4 py-3 ${isLeader ? 'border-gold-500/40 bg-gold-500/5' : 'border-ocean-700 bg-ocean-800/40'}`}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="w-6 text-center text-sm flex-shrink-0">
                        {i < 3 ? MEDAL[i] : <span className="text-ocean-500 text-xs">{i + 1}</span>}
                      </span>
                      <p className={`flex-1 text-sm font-semibold truncate ${isLeader ? 'text-gold-300' : 'text-white'}`}>
                        {film.title}
                      </p>
                      <span className={`text-sm font-bold flex-shrink-0 ${isLeader ? 'text-gold-400' : 'text-ocean-300'}`}>
                        {film.votes} {film.votes === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>
                    <div className="ml-9 h-1 bg-ocean-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLeader ? 'bg-gold-400' : 'bg-ocean-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-ocean-700 bg-ocean-800/40 py-12 text-center">
              <Trophy className="w-8 h-8 text-ocean-600 mx-auto mb-3" />
              <p className="text-ocean-400 text-sm">Nenhum voto ainda. Seja o primeiro!</p>
            </div>
          )}
        </section>

        {/* Filmes */}
        {films && films.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ocean-200 mb-6">
              <Film className="w-5 h-5 text-gold-400" />
              Filmes em competição
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {films.map(film => (
                <div key={film.id}
                  className="rounded-2xl border border-ocean-700 bg-ocean-800/60 overflow-hidden hover:border-gold-500/40 transition-colors">
                  {film.thumbnail_url ? (
                    <img src={film.thumbnail_url} alt={film.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-ocean-700 flex items-center justify-center">
                      <Film className="w-10 h-10 text-ocean-500" />
                    </div>
                  )}
                  <div className="p-4">
                    {film.category && (
                      <span className="text-xs font-medium text-gold-400 uppercase tracking-wide">{film.category}</span>
                    )}
                    <h3 className="font-bold text-white mt-1 leading-snug">{film.title}</h3>
                    {film.director && <p className="text-sm text-ocean-400 mt-0.5">Dir. {film.director}</p>}
                    {film.synopsis && <p className="text-xs text-ocean-500 mt-2 line-clamp-2">{film.synopsis}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
