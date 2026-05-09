'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Save, Clock, Film as FilmIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { ScoreInput } from '@/components/ScoreInput'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/LoadingSpinner'
import { computeEvaluationAverage } from '@/lib/utils'
import type { Film, Judge, EvaluationCriteria, TechnicalEvaluation, Festival } from '@/types'

const CRITERIA_KEYS = [
  'direction', 'screenplay', 'photography', 'editing',
  'sound', 'acting', 'originality', 'artistic_impact', 'overall',
]

export default function AvaliarFilmePage() {
  const { filmId } = useParams<{ filmId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [film, setFilm] = useState<Film | null>(null)
  const [judge, setJudge] = useState<Judge | null>(null)
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([])
  const [festival, setFestival] = useState<Festival | null>(null)
  const [existing, setExisting] = useState<TechnicalEvaluation | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/jurado/login'); return }

    const [
      { data: filmData },
      { data: judgeData },
      { data: criteriaData },
      { data: festData },
    ] = await Promise.all([
      supabase.from('films').select('*').eq('id', filmId).single(),
      supabase.from('judges').select('*').eq('user_id', user.id).single(),
      supabase.from('evaluation_criteria').select('*').eq('is_active', true).order('order_index'),
      supabase.from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single(),
    ])

    if (!filmData || !judgeData) { router.push('/jurado'); return }

    setFilm(filmData)
    setJudge(judgeData)
    setFestival(festData)

    const crit = criteriaData || []
    // Fallback to default keys if no criteria in DB
    const finalCrit = crit.length > 0 ? crit : CRITERIA_KEYS.map((k, i) => ({
      id: k, festival_id: null, key: k, name: k, max_score: 10, order_index: i, is_active: true, created_at: '',
    }))
    setCriteria(finalCrit as EvaluationCriteria[])

    const { data: evalData } = await supabase
      .from('technical_evaluations')
      .select('*')
      .eq('film_id', filmId)
      .eq('judge_id', judgeData.id)
      .single()

    if (evalData) {
      setExisting(evalData)
      setScores(evalData.scores || {})
      setComment(evalData.comment || '')
    }

    setLoading(false)
  }, [filmId, router, supabase])

  useEffect(() => { loadData() }, [loadData])

  const isSubmitted = existing?.is_submitted ?? false
  const canEdit = !isSubmitted || (festival?.allow_jury_edit ?? false)
  const avg = computeEvaluationAverage(scores)

  const saveOrSubmit = async (submit: boolean) => {
    if (!judge || !film) return
    if (submit) setSubmitting(true)
    else setSaving(true)

    try {
      const res = await fetch('/api/votes/technical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          film_id: filmId,
          judge_id: judge.id,
          scores,
          comment,
          is_submitted: submit,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setToast({ message: json.error || 'Erro ao salvar.', type: 'error' })
      } else {
        if (submit) {
          router.push('/jurado')
        } else {
          setToast({ message: 'Rascunho salvo!', type: 'success' })
          setExisting(json.data)
        }
      }
    } catch {
      setToast({ message: 'Erro de conexão.', type: 'error' })
    } finally {
      setSaving(false)
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />
  if (!film || !judge) return null

  return (
    <main className="min-h-screen bg-ocean-950 px-4 py-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/jurado" className="text-[#64748b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Image src="/logo.png" alt="FINCCA" width={100} height={54} className="object-contain" />
        </div>

        {/* Info do filme */}
        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
              <FilmIcon className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-bold text-white leading-tight">{film.title}</h1>
                {isSubmitted && !festival?.allow_jury_edit && (
                  <Badge variant="success">Enviado</Badge>
                )}
              </div>
              <p className="text-sm text-[#64748b]">
                {film.director} · {film.category}
                {film.duration_minutes && ` · ${film.duration_minutes} min`}
              </p>
              {film.synopsis && (
                <p className="text-xs text-[#4a6080] mt-2 line-clamp-2">{film.synopsis}</p>
              )}
            </div>
          </div>
        </div>

        {/* Aviso bloqueio */}
        {isSubmitted && !festival?.allow_jury_edit && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">
              Avaliação enviada. A organização não permitiu edição após envio.
            </p>
          </div>
        )}

        {/* Média atual */}
        {avg > 0 && (
          <div className="mb-5 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-primary-300">Média atual dos critérios</span>
            <span className="text-2xl font-bold text-primary-300">{avg.toFixed(1)}</span>
          </div>
        )}

        {/* Critérios */}
        <div className="flex flex-col gap-5 mb-6">
          {criteria.map((c) => (
            <div key={c.key} className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5">
              <ScoreInput
                label={c.name}
                value={scores[c.key] ?? 0}
                onChange={(v) => setScores((prev) => ({ ...prev, [c.key]: v }))}
                max={c.max_score}
                disabled={!canEdit}
              />
            </div>
          ))}
        </div>

        {/* Comentário */}
        <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 mb-6">
          <Textarea
            label="Comentário técnico (opcional)"
            placeholder="Observações sobre o filme, destaque de aspectos técnicos..."
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        {/* Ações */}
        {canEdit && (
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              loading={submitting}
              disabled={saving}
              onClick={() => saveOrSubmit(true)}
              className="w-full"
            >
              <Send className="w-4 h-4" />
              Enviar avaliação final
            </Button>
            <Button
              variant="ghost"
              size="md"
              loading={saving}
              disabled={submitting}
              onClick={() => saveOrSubmit(false)}
              className="w-full"
            >
              <Save className="w-4 h-4" />
              Salvar rascunho
            </Button>
            <p className="text-xs text-[#4a6080] text-center">
              Salve o rascunho para continuar depois. Só clique em &quot;Enviar&quot; quando terminar.
            </p>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
