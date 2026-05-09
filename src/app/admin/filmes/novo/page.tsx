'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function NovoFilmePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, order_index: 0 },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Pega festival ativo
      const { data: fest } = await supabase
        .from('festivals').select('id').order('created_at', { ascending: false }).limit(1).single()

      const { error } = await supabase.from('films').insert({
        ...data,
        festival_id: fest?.id || null,
        poster_url: data.poster_url || null,
        synopsis: data.synopsis || null,
        session_date: data.session_date || null,
        session_location: data.session_location || null,
        country: data.country || null,
        city: data.city || null,
        duration_minutes: data.duration_minutes || null,
      })

      if (error) {
        setToast({ message: `Erro: ${error.message}`, type: 'error' })
      } else {
        router.push('/admin/filmes')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/filmes" className="text-[#64748b] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">Novo Filme</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl flex flex-col gap-5">
        {/* Dados principais */}
        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Informações principais</h2>
          <Input label="Título *" placeholder="Nome do filme" error={errors.title?.message} {...register('title')} />
          <Input label="Diretor *" placeholder="Nome do(a) diretor(a)" error={errors.director?.message} {...register('director')} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria *"
              options={CATEGORIES}
              placeholder="Selecione..."
              error={errors.category?.message}
              {...register('category')}
            />
            <Input label="Duração (min)" type="number" placeholder="90" {...register('duration_minutes')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="País" placeholder="Brasil" {...register('country')} />
            <Input label="Cidade" placeholder="Rio de Janeiro" {...register('city')} />
          </div>
          <Textarea label="Sinopse" placeholder="Breve descrição do filme..." rows={3} {...register('synopsis')} />
          <Input label="URL do cartaz" type="url" placeholder="https://..." hint="Link direto para imagem do poster" error={errors.poster_url?.message} {...register('poster_url')} />
        </div>

        {/* Sessão */}
        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Sessão (opcional)</h2>
          <Input label="Data e horário" type="datetime-local" {...register('session_date')} />
          <Input label="Local" placeholder="Cinema Municipal, Sala 1" {...register('session_location')} />
        </div>

        {/* Configurações */}
        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Configurações</h2>
          <Input label="Ordem de exibição" type="number" placeholder="0" {...register('order_index')} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-ocean-500 bg-ocean-800 text-primary-500 focus:ring-primary-500"
              defaultChecked
              {...register('is_active')}
            />
            <span className="text-sm text-[#94a3b8]">Filme ativo para votação</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4" /> Salvar filme
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
