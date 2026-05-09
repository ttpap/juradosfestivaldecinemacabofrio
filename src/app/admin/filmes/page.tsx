'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff, Film, Search } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/LoadingSpinner'
import type { Film as FilmType } from '@/types'

export default function FilmesPage() {
  const supabase = createClient()
  const [films, setFilms] = useState<FilmType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('films').select('*').order('order_index')
      .then(({ data }) => { setFilms(data || []); setLoading(false) })
  }, [supabase])

  const toggleActive = async (film: FilmType) => {
    const { error } = await supabase
      .from('films').update({ is_active: !film.is_active }).eq('id', film.id)
    if (error) {
      setToast({ message: 'Erro ao atualizar filme.', type: 'error' })
    } else {
      setFilms((prev) => prev.map((f) => f.id === film.id ? { ...f, is_active: !f.is_active } : f))
    }
  }

  const deleteFilm = async (id: string) => {
    if (!confirm('Excluir este filme? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    const { error } = await supabase.from('films').delete().eq('id', id)
    if (error) {
      setToast({ message: 'Erro ao excluir filme.', type: 'error' })
    } else {
      setFilms((prev) => prev.filter((f) => f.id !== id))
      setToast({ message: 'Filme excluído.', type: 'success' })
    }
    setDeleting(null)
  }

  const filtered = films.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.director.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Filmes</h1>
          <p className="text-sm text-[#64748b]">{films.length} filmes cadastrados</p>
        </div>
        <Link href="/admin/filmes/novo">
          <Button size="sm">
            <Plus className="w-4 h-4" /> Novo filme
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            placeholder="Buscar por título ou diretor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-ocean-500 bg-ocean-800 pl-10 pr-4 py-2.5 text-sm text-[#f0f4f8] placeholder:text-[#4a6080] focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-10 text-center">
            <Film className="w-10 h-10 text-[#4a6080] mx-auto mb-3" />
            <p className="text-[#64748b]">
              {search ? 'Nenhum filme encontrado.' : 'Nenhum filme cadastrado ainda.'}
            </p>
            {!search && (
              <Link href="/admin/filmes/novo" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">Cadastrar primeiro filme</Button>
              </Link>
            )}
          </div>
        )}

        {filtered.map((film) => (
          <div
            key={film.id}
            className="rounded-2xl border border-ocean-500 bg-ocean-800 p-4 flex items-center gap-4"
          >
            {/* Poster placeholder */}
            <div className="w-12 h-16 rounded-lg bg-ocean-700 border border-ocean-600 flex items-center justify-center shrink-0 overflow-hidden">
              {film.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={film.poster_url} alt={film.title} className="w-full h-full object-cover" />
              ) : (
                <Film className="w-5 h-5 text-[#4a6080]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-white truncate">{film.title}</p>
                <Badge variant={film.is_active ? 'success' : 'default'}>
                  {film.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-[#64748b] truncate">{film.director}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary">{film.category}</Badge>
                {film.country && <span className="text-xs text-[#4a6080]">{film.country}</span>}
                {film.duration_minutes && (
                  <span className="text-xs text-[#4a6080]">{film.duration_minutes} min</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleActive(film)}
                title={film.is_active ? 'Desativar' : 'Ativar'}
                className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-ocean-700 transition-all"
              >
                {film.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <Link
                href={`/admin/filmes/${film.id}`}
                className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-ocean-700 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <button
                onClick={() => deleteFilm(film.id)}
                disabled={deleting === film.id}
                className="p-2 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
