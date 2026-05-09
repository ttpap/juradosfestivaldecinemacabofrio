'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Plus, Trash2, UserCheck, UserX, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/LoadingSpinner'
import type { Judge } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  bio: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function JuradosPage() {
  const supabase = createClient()
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loadJudges = async () => {
    const { data } = await supabase.from('judges').select('*').order('name')
    setJudges(data || [])
    setLoading(false)
  }

  useEffect(() => { loadJudges() }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setToast({ message: json.error || 'Erro ao cadastrar jurado.', type: 'error' })
      } else {
        setToast({ message: 'Jurado cadastrado com sucesso!', type: 'success' })
        reset()
        setShowForm(false)
        await loadJudges()
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteJudge = async (id: string) => {
    if (!confirm('Remover este jurado? Suas avaliações serão mantidas.')) return
    const { error } = await supabase.from('judges').delete().eq('id', id)
    if (error) {
      setToast({ message: 'Erro ao remover jurado.', type: 'error' })
    } else {
      setJudges((prev) => prev.filter((j) => j.id !== id))
      setToast({ message: 'Jurado removido.', type: 'success' })
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Jurados Técnicos</h1>
          <p className="text-sm text-[#64748b]">{judges.length} jurado(s) cadastrado(s)</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Novo jurado
        </Button>
      </div>

      {/* Formulário de cadastro */}
      {showForm && (
        <div className="rounded-2xl border border-primary-500/30 bg-ocean-800 p-5 mb-6 animate-slide-up">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Cadastrar novo jurado</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome completo *" placeholder="Ana Lima" error={errors.name?.message} {...register('name')} />
              <Input label="E-mail *" type="email" placeholder="ana@email.com" error={errors.email?.message} {...register('email')} />
            </div>
            <Input
              label="Senha temporária *"
              type="password"
              placeholder="Senha de acesso ao sistema"
              hint="O jurado usa essa senha para acessar o sistema"
              error={errors.password?.message}
              {...register('password')}
            />
            <Textarea label="Biografia (opcional)" placeholder="Breve bio do jurado..." rows={2} {...register('bio')} />
            <div className="flex gap-3">
              <Button type="submit" size="sm" loading={saving}>Cadastrar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); reset() }}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de jurados */}
      <div className="flex flex-col gap-3">
        {judges.length === 0 && (
          <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-10 text-center">
            <UserX className="w-10 h-10 text-[#4a6080] mx-auto mb-3" />
            <p className="text-[#64748b]">Nenhum jurado cadastrado.</p>
          </div>
        )}

        {judges.map((judge) => (
          <div key={judge.id} className="rounded-2xl border border-ocean-500 bg-ocean-800 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold shrink-0">
              {judge.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white truncate">{judge.name}</p>
                <Badge variant={judge.user_id ? 'success' : 'warning'}>
                  {judge.user_id ? (
                    <><UserCheck className="w-3 h-3" /> Ativo</>
                  ) : (
                    <><UserX className="w-3 h-3" /> Pendente</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 text-[#4a6080]" />
                <p className="text-sm text-[#64748b]">{judge.email}</p>
              </div>
              {judge.bio && <p className="text-xs text-[#4a6080] mt-1 line-clamp-1">{judge.bio}</p>}
            </div>
            <button
              onClick={() => deleteJudge(judge.id)}
              className="p-2 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
