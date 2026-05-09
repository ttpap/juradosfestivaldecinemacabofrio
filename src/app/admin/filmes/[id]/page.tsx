'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/LoadingSpinner'

const CATEGORIES = [
  { value: 'Curta-metragem', label: 'Curta-metragem' },
  { value: 'Longa-metragem', label: 'Longa-metragem' },
  { value: 'Documentário', label: 'Documentário' },
  { value: 'Animação', label: 'Animação' },
  { value: 'Experimental', label: 'Experimental' },
]

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  director: z.string().min(1, 'Diretor obrigatório'),
  category: z.string().min(1, 'Categoria obrigatória'),
  country: z.string().optional(),
  city: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  synopsis: z.string().optional(),
  poster_url: z.string().url('URL inválida').optional().or(z.literal('')),
  session_date: z.string().optional(),
  session_location: z.string().optional(),
  is_active: z.boolean().default(true),
  order_index: z.coerce.number().default(0),
})
type FormData = z.infer<typeof schema>

export default function EditarFilmePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const load = useCallback(async () => {
    const { data } = await supabase.from('films').select('*').eq('id', id).single()
    if (!data) { router.push('/admin/filmes'); return }
    reset({
      ...data,
      session_date: data.session_date ? data.session_date.slice(0, 16) : '',
      poster_url: data.poster_url || '',
      synopsis: data.synopsis || '',
      country: data.country || '',
      city: data.city || '',
      session_location: data.session_location || '',
    })
    setLoading(false)
  }, [id, router, supabase, reset])

  useEffect(() => { load() }, [load])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { error } = await supabase.from('films').update({
        ...data,
        poster_url: data.poster_url || null,
        synopsis: data.synopsis || null,
        session_date: data.session_date || null,
        session_location: data.session_location || null,
        country: data.country || null,
        city: data.city || null,
        duration_minutes: data.duration_minutes || null,
      }).eq('id', id)

      if (error) {
        setToast({ message: `Erro: ${error.message}`, type: 'error' })
      } else {
        router.push('/admin/filmes')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/filmes" className="text-[#64748b] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">Editar Filme</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl flex flex-col gap-5">
        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Informações principais</h2>
          <Input label="Título *" error={errors.title?.message} {...register('title')} />
          <Input label="Diretor *" error={errors.director?.message} {...register('director')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria *" options={CATEGORIES} error={errors.category?.message} {...register('category')} />
            <Input label="Duração (min)" type="number" {...register('duration_minutes')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="País" {...register('country')} />
            <Input label="Cidade" {...register('city')} />
          </div>
          <Textarea label="Sinopse" rows={3} {...register('synopsis')} />
          <Input label="URL do cartaz" type="url" error={errors.poster_url?.message} {...register('poster_url')} />
        </div>

        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Sessão</h2>
          <Input label="Data e horário" type="datetime-local" {...register('session_date')} />
          <Input label="Local" {...register('session_location')} />
        </div>

        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Configurações</h2>
          <Input label="Ordem de exibição" type="number" {...register('order_index')} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-ocean-500 bg-ocean-800 text-primary-500 focus:ring-primary-500" {...register('is_active')} />
            <span className="text-sm text-[#94a3b8]">Filme ativo para votação</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" /> Salvar alterações
          </Button>
          <Link href="/admin/filmes">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
