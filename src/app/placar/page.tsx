'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, RefreshCw, ArrowLeft } from 'lucide-react'

type FilmResult = { id: string; title: string; category: string; votes: number }
type Data = { festival: { name: string; year: number; voting_open: boolean; results_revealed: boolean } | null; films: FilmResult[]; total: number }

const MEDAL = ['🥇', '🥈', '🥉']
const CATEGORY_COLOR: Record<string, string> = {
  'Documentário': 'text-blue-400',
  'Ficção': 'text-purple-400',
  'Animação': 'text-emerald-400',
}

export default function PlacarPage() {
  const [data, setData] = useState<Data | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetch_ = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await fetch('/api/placar', { cache: 'no-store' })
      const json = await res.json()
      setData(json)
      setLastUpdate(new Date())
    } finally {
      if (showSpinner) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(() => fetch_(), 5_000)
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetch_()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => {
      clearInterval(interval)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [fetch_])

  const maxVotes = data?.films[0]?.votes ?? 1

  return (
    <main className="min-h-screen bg-ocean-950 text-white">
      <header className="border-b border-ocean-800 bg-ocean-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 -ml-2 rounded-xl text-ocean-400 hover:text-white hover:bg-ocean-800 transition-colors"
            aria-label="Voltar ao dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={90} height={49} className="object-contain" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white text-sm">Placar ao Vivo</h1>
            <p className="text-xs text-ocean-500 truncate">
              {data?.festival?.voting_open ? '🟢 Votação aberta' : '🔴 Votação encerrada'}
              {lastUpdate && ` · ${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </p>
          </div>
          <button
            onClick={() => fetch_(true)}
            className="p-2 rounded-xl text-ocean-400 hover:text-white hover:bg-ocean-800 transition-colors"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Total */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-5 h-5 text-gold-400" />
          <span className="text-ocean-300 text-sm">
            <span className="text-white font-bold text-lg">{data?.total ?? 0}</span> votos registrados
          </span>
        </div>

        {/* Reveal banner */}
        {data?.festival && !data.festival.results_revealed && data.films.some(f => f.votes > 0) && (
          <div className="mb-4 rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3 flex items-center gap-3 text-sm text-gold-300">
            <span className="text-xl">🎬</span>
            <div>
              <p className="font-semibold">Resultado em suspense</p>
              <p className="text-xs text-ocean-300">Os nomes serão revelados quando a apuração oficial começar.</p>
            </div>
          </div>
        )}

        {/* Ranking */}
        <div className="space-y-3">
          {data?.films.map((film, i) => {
            const pct = maxVotes > 0 ? (film.votes / maxVotes) * 100 : 0
            const isLeader = i === 0 && film.votes > 0
            const revealed = data?.festival?.results_revealed ?? false
            return (
              <div key={film.id}
                className={`rounded-2xl border p-4 transition-all ${isLeader ? 'border-gold-500/50 bg-gold-500/5' : 'border-ocean-700 bg-ocean-800/40'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {i < 3 ? MEDAL[i] : <span className="text-ocean-500 text-sm font-mono">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${isLeader ? 'text-gold-300' : 'text-white'} ${!revealed ? 'select-none blur-md' : ''}`}
                      aria-hidden={!revealed}
                    >
                      {revealed ? film.title : '████████████████'}
                    </p>
                    {film.category && (
                      <span className={`text-xs font-medium ${CATEGORY_COLOR[film.category] ?? 'text-ocean-400'}`}>
                        {film.category}
                      </span>
                    )}
                  </div>
                  <span className={`text-lg font-bold flex-shrink-0 ${isLeader ? 'text-gold-400' : 'text-white'}`}>
                    {film.votes}
                  </span>
                </div>
                <div className="ml-11 h-1.5 bg-ocean-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isLeader ? 'bg-gold-400' : 'bg-ocean-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {!data && (
          <div className="text-center py-20 text-ocean-500">Carregando...</div>
        )}
      </div>
    </main>
  )
}
