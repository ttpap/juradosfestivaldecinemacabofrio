export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FilmesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: festival } = await supabase
    .from('festivals').select('id').order('created_at', { ascending: false }).limit(1).single()

  const { data: films } = festival
    ? await supabase.from('films').select('*').eq('festival_id', festival.id).order('title')
    : { data: [] }

  return (
    <div className="min-h-screen bg-ocean-950 text-white">
      <header className="border-b border-ocean-800 bg-ocean-900/80 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-ocean-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-white">Filmes</h1>
          <Link href="/admin/filmes/novo"
            className="ml-auto flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2 text-xs font-bold text-ocean-950 hover:bg-gold-400 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo filme
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {films && films.length > 0 ? films.map(film => (
          <div key={film.id}
            className="flex items-center gap-4 rounded-xl border border-ocean-700 bg-ocean-800/60 p-4">
            {film.thumbnail_url ? (
              <img src={film.thumbnail_url} alt={film.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-ocean-700 flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5 text-ocean-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{film.title}</p>
              <p className="text-xs text-ocean-400">Dir. {film.director}{film.category ? ` · ${film.category}` : ''}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${film.active ? 'bg-green-500/20 text-green-400' : 'bg-ocean-700 text-ocean-500'}`}>
              {film.active ? 'Ativo' : 'Inativo'}
            </span>
            <Link href={`/admin/filmes/${film.id}`}
              className="text-ocean-400 hover:text-white transition-colors">
              <Pencil className="w-4 h-4" />
            </Link>
          </div>
        )) : (
          <div className="text-center py-16 text-ocean-500">
            <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum filme cadastrado.</p>
            <Link href="/admin/filmes/novo" className="mt-4 inline-block text-gold-400 hover:text-gold-300 text-sm">
              + Adicionar primeiro filme
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
