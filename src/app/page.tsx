import Image from 'next/image'
import Link from 'next/link'
import { Film, Vote } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: festival } = await supabase
    .from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single()

  const { data: films } = festival
    ? await supabase.from('films').select('*').eq('festival_id', festival.id).eq('active', true).order('title')
    : { data: [] }

  return (
    <main className="min-h-screen bg-ocean-950 text-white">
      {/* Header */}
      <header className="border-b border-ocean-800 bg-ocean-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image src="/logo.png" alt="FINCCA" width={100} height={54} className="object-contain" />
          {festival?.voting_open && (
            <Link href="/votar"
              className="flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-bold text-ocean-950 hover:bg-gold-400 transition-colors">
              <Vote className="w-4 h-4" />
              Votar agora
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
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
            <Link href="/votar"
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

        {/* Films */}
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
                    <img src={film.thumbnail_url} alt={film.title}
                      className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-ocean-700 flex items-center justify-center">
                      <Film className="w-10 h-10 text-ocean-500" />
                    </div>
                  )}
                  <div className="p-4">
                    {film.category && (
                      <span className="text-xs font-medium text-gold-400 uppercase tracking-wide">
                        {film.category}
                      </span>
                    )}
                    <h3 className="font-bold text-white mt-1 leading-snug">{film.title}</h3>
                    <p className="text-sm text-ocean-400 mt-0.5">Dir. {film.director}</p>
                    {film.synopsis && (
                      <p className="text-xs text-ocean-500 mt-2 line-clamp-2">{film.synopsis}</p>
                    )}
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
