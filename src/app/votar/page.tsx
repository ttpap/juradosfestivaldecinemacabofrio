'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Send, LogIn, User } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StarRating } from '@/components/StarRating'
import { Toast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/LoadingSpinner'
import type { Film, Festival } from '@/types'

const schema = z.object({
  voter_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  voter_email: z.string().email('E-mail inválido'),
  film_id: z.string().min(1, 'Selecione um filme'),
  rating: z.number().min(1, 'Dê pelo menos 1 estrela').max(5),
  comment: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function VotarPage() {
  const router = useRouter()
  const supabase = createClient()

  const [films, setFilms] = useState<Film[]>([])
  const [festival, setFestival] = useState<Festival | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null)
  const [loginMode, setLoginMode] = useState<'guest' | 'google' | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const loadData = useCallback(async () => {
    const [{ data: fest }, { data: filmList }, { data: { user } }] = await Promise.all([
      supabase.from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('films').select('*').eq('is_active', true).order('order_index'),
      supabase.auth.getUser(),
    ])

    setFestival(fest)
    setFilms(filmList || [])

    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      const email = user.email || ''
      setGoogleUser({ name, email })
      setValue('voter_name', name)
      setValue('voter_email', email)
      setLoginMode('google')
    }

    setLoading(false)
  }, [supabase, setValue])

  useEffect(() => { loadData() }, [loadData])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/votar`,
      },
    })
    if (error) setToast({ message: 'Erro ao conectar com Google.', type: 'error' })
  }

  const onSubmit = async (data: FormData) => {
    if (rating === 0) {
      setToast({ message: 'Por favor, dê uma nota em estrelas.', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/votes/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rating }),
      })
      const json = await res.json()
      if (!res.ok) {
        setToast({ message: json.error || 'Erro ao registrar voto.', type: 'error' })
      } else {
        router.push('/votar/confirmacao')
      }
    } catch {
      setToast({ message: 'Erro de conexão. Tente novamente.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />

  if (!festival?.voting_open) {
    return (
      <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-4 py-12">
        <Image src="/logo.png" alt="FINCCA" width={240} height={130} className="object-contain mb-8" />
        <div className="max-w-md w-full text-center rounded-2xl border border-ocean-500 bg-ocean-800 p-8">
          <div className="text-4xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-white mb-2">Votação não está aberta</h2>
          <p className="text-[#94a3b8] mb-6">
            A votação do Júri Popular ainda não foi iniciada. Fique de olho!
          </p>
          <Link href="/">
            <Button variant="ghost">← Voltar ao início</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ocean-950 px-4 py-8">
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-[#64748b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Júri Popular</h1>
        <p className="text-[#94a3b8] text-sm mb-6">
          Avalie o filme que você assistiu. Cada e-mail pode votar uma vez por filme.
        </p>

        {/* Opções de acesso */}
        {loginMode === null && (
          <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-6 mb-6 animate-slide-up">
            <p className="text-sm font-medium text-[#94a3b8] mb-4">Como quer participar?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-3 rounded-xl border border-ocean-500 bg-ocean-700 px-4 py-3 text-sm font-medium text-white hover:border-primary-500/60 hover:bg-ocean-600 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar com Google
                <LogIn className="w-4 h-4 ml-auto text-[#64748b]" />
              </button>
              <button
                onClick={() => setLoginMode('guest')}
                className="flex items-center gap-3 rounded-xl border border-ocean-500 bg-ocean-700 px-4 py-3 text-sm font-medium text-white hover:border-primary-500/60 hover:bg-ocean-600 transition-all"
              >
                <User className="w-5 h-5 text-primary-400" />
                Votar como visitante
                <span className="ml-auto text-xs text-[#64748b]">Preencher nome e e-mail</span>
              </button>
            </div>
          </div>
        )}

        {/* Formulário */}
        {(loginMode !== null) && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 animate-slide-up">
            {/* Dados do votante */}
            {loginMode === 'google' && googleUser ? (
              <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                  {googleUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{googleUser.name}</p>
                  <p className="text-xs text-[#64748b]">{googleUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
                <Input
                  label="Seu nome completo"
                  placeholder="Maria da Silva"
                  error={errors.voter_name?.message}
                  {...register('voter_name')}
                />
                <Input
                  label="Seu e-mail"
                  type="email"
                  placeholder="maria@email.com"
                  hint="Usado para garantir que cada pessoa vote uma vez por filme"
                  error={errors.voter_email?.message}
                  {...register('voter_email')}
                />
              </div>
            )}

            {/* Seleção de filme */}
            <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
              <Select
                label="Filme avaliado"
                placeholder="Selecione o filme..."
                options={films.map((f) => ({
                  value: f.id,
                  label: `${f.title} — ${f.director}`,
                }))}
                error={errors.film_id?.message}
                {...register('film_id')}
              />

              {/* Estrelas */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#94a3b8]">
                  Sua avaliação
                </label>
                <StarRating value={rating} onChange={setRating} size="lg" />
                {errors.rating && (
                  <p className="text-xs text-red-400">{errors.rating.message}</p>
                )}
                {rating > 0 && (
                  <p className="text-xs text-[#64748b]">
                    {['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente!'][rating]}
                  </p>
                )}
              </div>

              <Textarea
                label="Comentário (opcional)"
                placeholder="O que você achou do filme?"
                rows={3}
                {...register('comment')}
              />
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              <Send className="w-4 h-4" />
              Enviar meu voto
            </Button>

            {loginMode === 'guest' && (
              <button
                type="button"
                onClick={() => setLoginMode(null)}
                className="text-sm text-[#64748b] hover:text-white transition-colors text-center"
              >
                ← Voltar às opções de acesso
              </button>
            )}
          </form>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  )
}
