'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'

const schema = z.object({
  title:         z.string().min(1, 'Obrigatório'),
  director:      z.string().min(1, 'Obrigatório'),
  category:      z.string().optional(),
  synopsis:      z.string().optional(),
  thumbnail_url: z.string().url('URL inválida').optional().or(z.literal('')),
  active:        z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function EditarFilmePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    supabase.from('films').select('*').eq('id', id).single().then(({ data }) => {
      if (data) reset({
        title: data.title, director: data.director,
        category: data.category ?? '', synopsis: data.synopsis ?? '',
        thumbnail_url: data.thumbnail_url ?? '', active: data.active,
      })
    })
  }, [id])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('films').update({
        title: data.title, director: data.director,
        category: data.category || null, synopsis: data.synopsis || null,
        thumbnail_url: data.thumbnail_url || null, active: data.active,
      }).eq('id', id)
      if (error) { setToast({ message: 'Erro ao salvar.', type: 'error' }); return }
      router.push('/admin/filmes')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-ocean-950 text-white">
      <header className="border-b border-ocean-800 bg-ocean-900/80 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin/filmes" className="text-ocean-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-white">Editar filme</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Título" error={errors.title?.message} {...register('title')} />
          <Input label="Diretor" error={errors.director?.message} {...register('director')} />
          <Input label="Categoria" placeholder="Ex: Curta, Longa..." {...register('category')} />
          <Textarea label="Sinopse" rows={3} {...register('synopsis')} />
          <Input label="URL da capa" type="url" error={errors.thumbnail_url?.message} {...register('thumbnail_url')} />

          <label className="flex items-center gap-3 rounded-xl border border-ocean-700 bg-ocean-800/60 px-4 py-3 cursor-pointer">
            <input type="checkbox" {...register('active')} className="rounded" />
            <span className="text-sm text-ocean-200">Filme ativo (visível para votação)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Link href="/admin/filmes"
              className="flex-1 rounded-xl border border-ocean-600 px-4 py-3 text-center text-sm text-ocean-300 hover:border-ocean-400 transition-colors">
              Cancelar
            </Link>
            <Button type="submit" variant="gold" loading={loading} className="flex-1">
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
