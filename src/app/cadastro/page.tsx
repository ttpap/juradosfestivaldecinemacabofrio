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

const schema = z.object({
  voter_name:  z.string().min(2, 'Nome muito curto'),
  voter_email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    localStorage.setItem('voter_name', data.voter_name)
    localStorage.setItem('voter_email', data.voter_email)
    // Salva no banco independente de votar
    await fetch('/api/voters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.voter_name, email: data.voter_email }),
    }).catch(() => {})
    router.push('/votar')
  }

  return (
    <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-5 py-12 animate-fade-in">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-[#64748b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain" />
        </div>

        <div className="rounded-2xl border border-ocean-700 bg-ocean-800 p-6 sm:p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ocean-700 border border-ocean-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Júri Popular</h1>
              <p className="text-xs text-[#64748b]">Identifique-se para votar</p>
            </div>
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
