'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, ArrowLeft } from 'lucide-react'

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

function JuradoLoginContent() {
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
      if (error) {
        setToast({ message: 'E-mail ou senha incorretos.', type: 'error' })
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setToast({ message: 'Erro de autenticação.', type: 'error' }); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (!profile || !['judge', 'admin'].includes(profile.role)) {
        await supabase.auth.signOut()
        setToast({ message: 'Acesso negado. Você não está cadastrado como jurado.', type: 'error' })
        return
      }

      router.push(profile.role === 'admin' ? '/admin' : '/jurado')
    } finally {
      setLoading(false)
    }
  }

  const accessDenied = params.get('error') === 'acesso_negado'

  return (
    <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-[#64748b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain" />
        </div>

        <div className="rounded-2xl border border-gold-500/30 bg-ocean-800 p-7 shadow-2xl shadow-gold-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Júri Técnico</h1>
              <p className="text-xs text-[#64748b]">Área restrita para jurados</p>
            </div>
          </div>

          {accessDenied && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Acesso negado. Entre em contato com a organização.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="E-mail" type="email" placeholder="jurado@email.com"
              error={errors.email?.message} {...register('email')} />
            <Input label="Senha" type="password" placeholder="••••••••"
              error={errors.password?.message} {...register('password')} />
            <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-2">
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4a6080] mt-6">
          Problemas com o acesso? Contate a organização do FINCCA.
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}

export default function JuradoLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ocean-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <JuradoLoginContent />
    </Suspense>
  )
}
