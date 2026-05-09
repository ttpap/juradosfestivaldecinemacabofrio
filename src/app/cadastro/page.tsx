'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  voter_name:  z.string().min(2, 'Nome muito curto'),
  voter_email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/votar/google`,
      },
    })
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    setLoading(true)
    localStorage.setItem('voter_name', data.voter_name)
    localStorage.setItem('voter_email', data.voter_email)
    router.push('/votar')
  }

  return (
    <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-[#64748b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain" />
        </div>

        <div className="rounded-2xl border border-ocean-700 bg-ocean-800 p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ocean-700 border border-ocean-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Júri Popular</h1>
              <p className="text-xs text-[#64748b]">Identifique-se para votar</p>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-ocean-600 bg-ocean-700/50 px-4 py-3 text-sm font-medium text-white hover:bg-ocean-700 transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar com Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-ocean-700" />
            <span className="text-xs text-ocean-500">ou</span>
            <div className="flex-1 h-px bg-ocean-700" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              error={errors.voter_name?.message}
              {...register('voter_name')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.voter_email?.message}
              {...register('voter_email')}
            />
            <p className="text-xs text-ocean-500">
              Seu e-mail garante 1 voto por pessoa. Não será divulgado.
            </p>
            <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-2">
              Continuar para votação
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
