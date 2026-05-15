'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Film, CheckCircle2, Vote, RefreshCw, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { Film as FilmType, Festival } from '@/types'

export default function VotarPage() {
  const router = useRouter()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [films, setFilms] = useState<FilmType[]>([])
  const [selectedFilm, setSelectedFilm] = useState<string | null>(null)
  const [previousFilm, setPreviousFilm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [voterName, setVoterName] = useState('')
  const [voterEmail, setVoterEmail] = useState('')
  const [commentFilm, setCommentFilm] = useState('')
  const [commentFestival, setCommentFestival] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('voter_name') ?? ''
    const email = localStorage.getItem('voter_email') ?? ''
    if (!name || !email) { router.replace('/cadastro'); return }
    setVoterName(name)
    setVoterEmail(email)

    async function load() {
      const festRes = await fetch('/api/festival', { cache: 'no-store' })
      const { festival: fest, films: f } = await festRes.json()
      if (!fest) { setLoading(false); return }
      setFestival(fest)
      setFilms(f ?? [])

      // Verifica voto anterior
      const res = await fetch(`/api/votes/popular?email=${encodeURIComponent(email)}`, { cache: 'no-store' })
      const { vote } = await res.json()
      if (vote?.film_id) {
        setSelectedFilm(vote.film_id)
        setPreviousFilm(vote.film_id)
        if (vote.comment_film) setCommentFilm(vote.comment_film)
        if (vote.comment_festival) setCommentFestival(vote.comment_festival)
      }

      setLoading(false)
    }
    load()

    // Detect bfcache restore (browser back/forward) and force full reload
    // so voting_open / vote state is always fresh after admin toggle.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const isChanging = previousFilm !== null
  const previousFilmTitle = films.find(f => f.id === previousFilm)?.title

  const handleSubmit = async () => {
    if (!selectedFilm) {
      setToast({ message: 'Selecione um filme para votar.', type: 'error' })
      return
    }
    if (commentFilm.trim().length < 10) {
      setToast({ message: 'Escreva pelo menos uma frase sobre o filme (mínimo 10 caracteres).', type: 'error' })
      return
    }
    if (commentFestival.trim().length < 10) {
      setToast({ message: 'Escreva pelo menos uma frase sobre o festival (mínimo 10 caracteres).', type: 'error' })
      return
    }
    if (isChanging && selectedFilm === previousFilm) {
      setToast({ message: 'Você já votou neste filme. Escolha outro para trocar.', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/votes/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          film_id: selectedFilm,
          voter_name: voterName,
          voter_email: voterEmail,
          comment_film: commentFilm.trim(),
          comment_festival: commentFestival.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setToast({ message: json.error ?? 'Erro ao registrar voto.', type: 'error' })
        return
      }
      localStorage.removeItem('voter_name')
      localStorage.removeItem('voter_email')
      router.push('/votar/confirmacao')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!festival?.voting_open) {
    return (
      <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-4 text-center">
        <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain mb-8" />
        <h1 className="text-2xl font-bold text-white mb-3">Votação encerrada</h1>
        <p className="text-ocean-400 mb-8">A votação do júri popular não está aberta no momento.</p>
        <Link href="/" className="text-gold-400 hover:text-gold-300 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ocean-950 pb-24">
      <header className="border-b border-ocean-800 bg-ocean-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-ocean-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={90} height={49} className="object-contain" />
          <span className="text-ocean-400 text-sm ml-auto">Júri Popular</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

        {/* Votante */}
        <div className="mb-6 rounded-2xl border border-ocean-700 bg-ocean-800/40 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-gold-400 text-sm font-bold">{voterName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{voterName}</p>
            <p className="text-ocean-400 text-xs truncate">{voterEmail}</p>
          </div>
          <Link href="/cadastro" className="text-xs text-ocean-500 hover:text-ocean-300 transition-colors">
            Alterar
          </Link>
        </div>

        {/* Banner troca de voto */}
        {isChanging && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">Você já votou neste festival</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                Seu voto atual: <span className="font-semibold text-amber-300">{previousFilmTitle}</span>
              </p>
              <p className="text-amber-400/70 text-xs mt-1">Selecione outro filme abaixo para trocar.</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          {isChanging ? 'Trocar voto' : 'Vote no melhor filme'}
        </h1>
        <p className="text-ocean-400 text-sm mb-6 sm:mb-8">Escolha 1 filme. Um voto por pessoa.</p>

        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-ocean-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-gold-400" />
              Selecione o filme
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {films.map(film => {
                const selected = selectedFilm === film.id
                const isPrevious = previousFilm === film.id
                return (
                  <button key={film.id} type="button" onClick={() => setSelectedFilm(film.id)}
                    className={`text-left rounded-2xl border p-4 sm:p-4 transition-all min-h-[80px] ${
                      selected && !isPrevious
                        ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/10'
                        : isPrevious && selected
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : isPrevious
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-ocean-700 bg-ocean-800/60 hover:border-ocean-500'
                    }`}>
                    <div className="flex items-start gap-3">
                      {film.thumbnail_url ? (
                        <img src={film.thumbnail_url} alt={film.title}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-ocean-700 flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-ocean-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {film.category && (
                          <span className="text-xs text-gold-400 font-medium">{film.category}</span>
                        )}
                        <p className="font-semibold text-white leading-snug truncate">{film.title}</p>
                        {isPrevious && (
                          <span className="text-xs text-amber-400">← seu voto atual</span>
                        )}
                      </div>
                      {selected && <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPrevious ? 'text-amber-400' : 'text-gold-400'}`} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comentários obrigatórios */}
          <div>
            <h2 className="text-sm font-semibold text-ocean-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold-400" />
              Seus comentários
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-ocean-300 mb-1.5">
                  O que achou do filme? <span className="text-ocean-500">(obrigatório)</span>
                </label>
                <textarea
                  value={commentFilm}
                  onChange={e => setCommentFilm(e.target.value)}
                  placeholder="Escreva brevemente sua opinião sobre o filme..."
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-xl border border-ocean-700 bg-ocean-800/60 px-4 py-3 text-sm text-white placeholder:text-ocean-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 resize-none"
                />
                <p className={`text-xs mt-1 ${commentFilm.trim().length >= 10 ? 'text-ocean-600' : 'text-ocean-500'}`}>
                  {commentFilm.trim().length}/10 caracteres mínimos
                </p>
              </div>
              <div>
                <label className="block text-sm text-ocean-300 mb-1.5">
                  O que está achando do festival? <span className="text-ocean-500">(obrigatório)</span>
                </label>
                <textarea
                  value={commentFestival}
                  onChange={e => setCommentFestival(e.target.value)}
                  placeholder="Escreva brevemente sua opinião sobre a mostra/festival..."
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-xl border border-ocean-700 bg-ocean-800/60 px-4 py-3 text-sm text-white placeholder:text-ocean-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 resize-none"
                />
                <p className={`text-xs mt-1 ${commentFestival.trim().length >= 10 ? 'text-ocean-600' : 'text-ocean-500'}`}>
                  {commentFestival.trim().length}/10 caracteres mínimos
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            variant="gold"
            size="lg"
            loading={submitting}
            className="w-full"
            disabled={(isChanging && selectedFilm === previousFilm) || commentFilm.trim().length < 10 || commentFestival.trim().length < 10 || !selectedFilm}
          >
            {isChanging ? (
              <><RefreshCw className="w-4 h-4" /> Confirmar troca de voto</>
            ) : (
              <><Vote className="w-4 h-4" /> Registrar voto</>
            )}
          </Button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
