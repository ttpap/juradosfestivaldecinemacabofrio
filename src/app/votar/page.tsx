'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Film, CheckCircle2, Vote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { Film as FilmType, Festival } from '@/types'

export default function VotarPage() {
  const router = useRouter()
  const supabase = createClient()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [films, setFilms] = useState<FilmType[]>([])
  const [selectedFilm, setSelectedFilm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [voterName, setVoterName] = useState('')
  const [voterEmail, setVoterEmail] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('voter_name') ?? ''
    const email = localStorage.getItem('voter_email') ?? ''
    if (!name || !email) { router.replace('/cadastro'); return }
    setVoterName(name)
    setVoterEmail(email)

    async function load() {
      const { data: fest } = await supabase
        .from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single()
      if (!fest) { setLoading(false); return }
      setFestival(fest)

      const { data: f } = await supabase
        .from('films').select('*').eq('festival_id', fest.id).eq('active', true).order('title')
      setFilms(f ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async () => {
    if (!selectedFilm) {
      setToast({ message: 'Selecione um filme para votar.', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/votes/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ film_id: selectedFilm, voter_name: voterName, voter_email: voterEmail }),
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
    <main className="min-h-screen bg-ocean-950 pb-20">
      {/* Header */}
      <header className="border-b border-ocean-800 bg-ocean-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-ocean-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={90} height={49} className="object-contain" />
          <span className="text-ocean-400 text-sm ml-auto">Júri Popular</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">Vote no melhor filme</h1>
        <p className="text-ocean-400 text-sm mb-8">Escolha 1 filme e preencha seus dados. Um voto por pessoa.</p>

        <div className="mb-6 rounded-2xl border border-ocean-700 bg-ocean-800/40 px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
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

        <div className="space-y-8">
          {/* Film selection */}
          <div>
            <h2 className="text-sm font-semibold text-ocean-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-gold-400" />
              Selecione o filme
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {films.map(film => {
                const selected = selectedFilm === film.id
                return (
                  <button key={film.id} type="button" onClick={() => setSelectedFilm(film.id)}
                    className={`text-left rounded-2xl border p-4 transition-all ${
                      selected
                        ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/10'
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
                        <p className="text-xs text-ocean-400 mt-0.5">Dir. {film.director}</p>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Button type="button" onClick={handleSubmit} variant="gold" size="lg" loading={submitting} className="w-full">
            <Vote className="w-4 h-4" />
            Registrar voto
          </Button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
