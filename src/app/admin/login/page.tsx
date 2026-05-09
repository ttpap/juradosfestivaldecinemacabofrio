'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})
type FormData = z.infer<typeof schema>

const FILM_PARTICLES = [
  { size: 38, left: '4%',  duration: '14s', delay: '0s'   },
  { size: 22, left: '13%', duration: '18s', delay: '3.5s' },
  { size: 52, left: '24%', duration: '12s', delay: '1s'   },
  { size: 30, left: '38%', duration: '20s', delay: '5s'   },
  { size: 44, left: '54%', duration: '15s', delay: '2s'   },
  { size: 18, left: '67%', duration: '17s', delay: '7s'   },
  { size: 58, left: '78%', duration: '11s', delay: '0.5s' },
  { size: 26, left: '89%', duration: '16s', delay: '4s'   },
  { size: 34, left: '95%', duration: '19s', delay: '8s'   },
]

const STARS = [
  { left: '8%',  top: '12%', size: 3, delay: '0s',    dur: '3.2s' },
  { left: '22%', top: '78%', size: 2, delay: '1.1s',  dur: '2.8s' },
  { left: '35%', top: '35%', size: 2, delay: '0.6s',  dur: '4s'   },
  { left: '48%', top: '65%', size: 3, delay: '2s',    dur: '3s'   },
  { left: '60%', top: '20%', size: 2, delay: '1.5s',  dur: '2.5s' },
  { left: '73%', top: '50%', size: 3, delay: '0.3s',  dur: '3.8s' },
  { left: '82%', top: '85%', size: 2, delay: '2.4s',  dur: '2.9s' },
  { left: '91%', top: '40%', size: 2, delay: '0.9s',  dur: '3.5s' },
  { left: '16%', top: '55%', size: 3, delay: '3s',    dur: '2.7s' },
  { left: '55%', top: '88%', size: 2, delay: '1.8s',  dur: '4.2s' },
]

function FilmFrame({ size }: { size: number }) {
  const holeSize = Math.max(4, Math.round(size * 0.12))
  const holePad = Math.round(size * 0.08)
  return (
    <svg
      width={size}
      height={Math.round(size * 1.42)}
      viewBox="0 0 100 142"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer border */}
      <rect x="1" y="1" width="98" height="140" rx="4" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
      {/* Top strip */}
      <rect x="0" y="0" width="100" height="18" rx="4" fill="white" fillOpacity="0.06" />
      {/* Bottom strip */}
      <rect x="0" y="124" width="100" height="18" rx="4" fill="white" fillOpacity="0.06" />
      {/* Top sprocket holes */}
      {[16, 36, 56, 76].map(cx => (
        <rect key={cx} x={cx - 7} y="4" width="14" height="10" rx="2" fill="black" fillOpacity="0.5" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
      ))}
      {/* Bottom sprocket holes */}
      {[16, 36, 56, 76].map(cx => (
        <rect key={cx} x={cx - 7} y="128" width="14" height="10" rx="2" fill="black" fillOpacity="0.5" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
      ))}
      {/* Image area */}
      <rect x="8" y="22" width="84" height="98" rx="2" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
    </svg>
  )
}

function CinemaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Radial spotlight from center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(18,37,64,0.5) 0%, transparent 70%)',
        }}
      />

      {/* Floating film frames */}
      {FILM_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-[-10%]"
          style={{
            left: p.left,
            animation: `floatUp ${p.duration} ${p.delay} infinite linear`,
          }}
        >
          <FilmFrame size={p.size} />
        </div>
      ))}

      {/* Star particles */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gold-400"
          style={{
            width: s.size,
            height: s.size,
            left: s.left,
            top: s.top,
            animation: `twinkle ${s.dur} ${s.delay} infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  )
}

function AdminLoginContent() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setToast({ message: 'E-mail ou senha incorretos.', type: 'error' }); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setToast({ message: 'Erro de autenticação.', type: 'error' }); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        setToast({ message: 'Acesso negado. Esta conta não tem permissão de administrador.', type: 'error' })
        return
      }
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[100dvh] bg-ocean-950 flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      <CinemaBackground />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ocean-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao início
        </Link>

        {/* Logo — centralizado e maior */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="FINCCA"
            width={200}
            height={108}
            className="object-contain drop-shadow-[0_0_32px_rgba(240,192,96,0.15)]"
            priority
          />
          <p className="mt-3 text-ocean-400 text-sm text-center tracking-wide">
            1º Festival Internacional de Cinema de Cabo Frio
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ocean-700 bg-ocean-900/80 backdrop-blur-md p-6 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-ocean-800 border border-ocean-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-ocean-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Painel Administrativo</h1>
              <p className="text-xs text-ocean-400 mt-0.5">Acesso restrito à organização</p>
            </div>
          </div>

          {params.get('error') === 'acesso_negado' && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Acesso negado. Conta sem permissão de administrador.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="admin@fincca.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              loading={loading}
              className="w-full mt-2 min-h-[52px] text-base"
            >
              Entrar no painel
            </Button>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-ocean-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
