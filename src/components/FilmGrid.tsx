'use client'

import { useEffect, useState } from 'react'
import { Film as FilmIcon, X } from 'lucide-react'

type Film = {
  id: string
  title: string
  category: string | null
  thumbnail_url: string | null
  director: string | null
  synopsis: string | null
}

export function FilmGrid({ films }: { films: Film[] }) {
  const [active, setActive] = useState<Film | null>(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    document.body.dataset.modalOpen = 'true'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      delete document.body.dataset.modalOpen
    }
  }, [active])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {films.map(film => (
          <button
            key={film.id}
            type="button"
            onClick={() => setActive(film)}
            className="text-left rounded-2xl border border-ocean-700 bg-ocean-800/60 overflow-hidden hover:border-gold-500/40 hover:scale-[1.02] transition-all"
          >
            {film.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={film.thumbnail_url} alt={film.title} className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 bg-ocean-700 flex items-center justify-center">
                <FilmIcon className="w-10 h-10 text-ocean-500" />
              </div>
            )}
            <div className="p-4">
              {film.category && (
                <span className="text-xs font-medium text-gold-400 uppercase tracking-wide">{film.category}</span>
              )}
              <h3 className="font-bold text-white mt-1 leading-snug">{film.title}</h3>
              {film.director && <p className="text-sm text-ocean-400 mt-0.5">Dir. {film.director}</p>}
              {film.synopsis && <p className="text-xs text-ocean-500 mt-2 line-clamp-2">{film.synopsis}</p>}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-ocean-700 bg-ocean-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            {active.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.thumbnail_url}
                alt={active.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            )}
            <div className="p-6">
              {active.category && (
                <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">{active.category}</span>
              )}
              <h2 className="text-2xl font-bold text-white mt-2 leading-tight">{active.title}</h2>
              {active.director && <p className="text-sm text-ocean-300 mt-1">Direção: {active.director}</p>}
              {active.synopsis && (
                <div className="mt-5 pt-5 border-t border-ocean-700">
                  <h3 className="text-xs font-semibold text-ocean-400 uppercase tracking-wide mb-3">Sinopse</h3>
                  <p className="text-[15px] text-ocean-100 leading-7 text-justify hyphens-auto">
                    {active.synopsis}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
