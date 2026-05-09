'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Star, Trophy, Users, BarChart3 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/StarRating'
import { PageLoader } from '@/components/LoadingSpinner'
import { computeEvaluationAverage, round2 } from '@/lib/utils'
import type { Film, PublicVote, TechnicalEvaluation, Judge, Festival } from '@/types'

interface PopularResult {
  film: Film
  votes: number
  average: number
  comments: string[]
}

interface TechnicalResult {
  film: Film
  evaluations: TechnicalEvaluation[]
  judges_count: number
  criteria_averages: Record<string, number>
  overall: number
}

export default function ResultadosPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'popular' | 'tecnico'>('popular')
  const [loading, setLoading] = useState(true)
  const [popularResults, setPopularResults] = useState<PopularResult[]>([])
  const [technicalResults, setTechnicalResults] = useState<TechnicalResult[]>([])
  const [festival, setFestival] = useState<Festival | null>(null)

  useEffect(() => {
    const load = async () => {
      const [
        { data: films },
        { data: votes },
        { data: evals },
        { data: fest },
      ] = await Promise.all([
        supabase.from('films').select('*').eq('is_active', true).order('order_index'),
        supabase.from('public_votes').select('*'),
        supabase.from('technical_evaluations').select('*').eq('is_submitted', true),
        supabase.from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single(),
      ])

      setFestival(fest)

      // Popular results
      const popMap = new Map<string, PublicVote[]>()
      ;(votes || []).forEach((v: PublicVote) => {
        const arr = popMap.get(v.film_id) || []
        arr.push(v)
        popMap.set(v.film_id, arr)
      })

      const popResults = (films || []).map((film: Film) => {
        const filmVotes = popMap.get(film.id) || []
        const avg = filmVotes.length > 0
          ? round2(filmVotes.reduce((a, v) => a + v.rating, 0) / filmVotes.length)
          : 0
        return {
          film,
          votes: filmVotes.length,
          average: avg,
          comments: filmVotes.filter((v) => v.comment).map((v) => v.comment!),
        }
      }).sort((a, b) => b.average - a.average || b.votes - a.votes)

      setPopularResults(popResults)

      // Technical results
      const evalMap = new Map<string, TechnicalEvaluation[]>()
      ;(evals || []).forEach((e: TechnicalEvaluation) => {
        const arr = evalMap.get(e.film_id) || []
        arr.push(e)
        evalMap.set(e.film_id, arr)
      })

      const techResults = (films || []).map((film: Film) => {
        const filmEvals = evalMap.get(film.id) || []
        // Compute per-criteria averages across judges
        const criteriaKeys = filmEvals.length > 0
          ? Object.keys(filmEvals[0].scores)
          : []

        const criteriaAverages: Record<string, number> = {}
        criteriaKeys.forEach((key) => {
          const vals = filmEvals.map((e) => (e.scores[key] as number) || 0).filter((v) => v > 0)
          criteriaAverages[key] = vals.length > 0 ? round2(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
        })

        const overallAvg = filmEvals.length > 0
          ? round2(
              filmEvals.reduce((a, e) => a + computeEvaluationAverage(e.scores), 0) / filmEvals.length
            )
          : 0

        return {
          film,
          evaluations: filmEvals,
          judges_count: filmEvals.length,
          criteria_averages: criteriaAverages,
          overall: overallAvg,
        }
      }).sort((a, b) => b.overall - a.overall)

      setTechnicalResults(techResults)
      setLoading(false)
    }

    load()
  }, [supabase])

  const minVotes = festival?.min_votes_for_winner ?? 3

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Resultados</h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          Votação {festival?.voting_open ? 'em andamento' : 'encerrada'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-ocean-800 border border-ocean-600 w-fit">
        {([
          { key: 'popular', label: 'Júri Popular', icon: Star },
          { key: 'tecnico', label: 'Júri Técnico', icon: BarChart3 },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-primary-500 text-white shadow'
                : 'text-[#64748b] hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Júri Popular */}
      {tab === 'popular' && (
        <div className="flex flex-col gap-4">
          {popularResults.map((r, idx) => {
            const isWinner = idx === 0 && r.votes >= minVotes && r.average > 0
            return (
              <div
                key={r.film.id}
                className={`rounded-2xl border p-5 ${
                  isWinner ? 'border-gold-500/50 bg-gold-500/5' : 'border-ocean-500 bg-ocean-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isWinner && <Trophy className="w-5 h-5 text-gold-400" />}
                      <span className="text-xs text-[#4a6080] font-medium">#{idx + 1}</span>
                      <p className="font-semibold text-white">{r.film.title}</p>
                    </div>
                    <p className="text-sm text-[#64748b]">{r.film.director}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-white">{r.average > 0 ? r.average.toFixed(1) : '—'}</p>
                    <p className="text-xs text-[#64748b]">{r.votes} voto(s)</p>
                  </div>
                </div>

                {r.average > 0 && <StarRating value={Math.round(r.average)} readonly size="sm" />}

                {r.votes < minVotes && r.votes > 0 && (
                  <Badge variant="warning" className="mt-2">
                    Mínimo {minVotes} votos não atingido
                  </Badge>
                )}

                {isWinner && (
                  <Badge variant="gold" className="mt-2">
                    <Trophy className="w-3 h-3" /> Vencedor do Júri Popular
                  </Badge>
                )}

                {r.comments.length > 0 && (
                  <div className="mt-3 border-t border-ocean-700 pt-3">
                    <p className="text-xs text-[#64748b] mb-2">Comentários ({r.comments.length})</p>
                    <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto">
                      {r.comments.map((c, i) => (
                        <p key={i} className="text-xs text-[#94a3b8] bg-ocean-900 rounded-lg px-3 py-1.5">
                          &quot;{c}&quot;
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Júri Técnico */}
      {tab === 'tecnico' && (
        <div className="flex flex-col gap-4">
          {technicalResults.map((r, idx) => (
            <div
              key={r.film.id}
              className={`rounded-2xl border p-5 ${
                idx === 0 && r.overall > 0 ? 'border-gold-500/50 bg-gold-500/5' : 'border-ocean-500 bg-ocean-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {idx === 0 && r.overall > 0 && <Trophy className="w-5 h-5 text-gold-400" />}
                    <span className="text-xs text-[#4a6080]">#{idx + 1}</span>
                    <p className="font-semibold text-white">{r.film.title}</p>
                  </div>
                  <p className="text-sm text-[#64748b]">{r.film.director}</p>
                  <Badge variant="default" className="mt-1">
                    <Users className="w-3 h-3" /> {r.judges_count} jurado(s)
                  </Badge>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold text-white">
                    {r.overall > 0 ? r.overall.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-[#64748b]">média geral</p>
                </div>
              </div>

              {/* Critérios */}
              {Object.keys(r.criteria_averages).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(r.criteria_averages).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-ocean-900 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-[#64748b] capitalize">{key.replace('_', ' ')}</span>
                      <span className={`text-sm font-semibold ${val >= 7 ? 'text-green-400' : val >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                        {val > 0 ? val.toFixed(1) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
