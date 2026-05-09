export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Circle, Clapperboard, LogOut, Clock } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { formatDateOnly } from '@/lib/utils'
import type { Film, Judge, TechnicalEvaluation } from '@/types'

export default async function JuradoDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/jurado/login')

  // Carrega judge vinculado ao usuário
  const { data: judge } = await supabase
    .from('judges')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Judge | null }

  if (!judge) redirect('/jurado/login?error=acesso_negado')

  // Carrega filmes ativos e avaliações deste jurado
  const [{ data: films }, { data: evaluations }, { data: festival }] = await Promise.all([
    supabase.from('films').select('*').eq('is_active', true).order('order_index'),
    supabase.from('technical_evaluations').select('*').eq('judge_id', judge.id),
    supabase.from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single(),
  ])

  const evalMap = new Map<string, TechnicalEvaluation>()
  ;(evaluations || []).forEach((e: TechnicalEvaluation) => evalMap.set(e.film_id, e))

  const filmList = (films || []) as Film[]
  const done = filmList.filter((f) => evalMap.get(f.id)?.is_submitted).length

  return (
    <main className="min-h-screen bg-ocean-950 px-4 py-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain" />
          <Link
            href="/api/auth/signout"
            prefetch={false}
            className="flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Link>
        </div>

        {/* Boas-vindas */}
        <div className="rounded-2xl border border-gold-500/30 bg-ocean-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-bold text-lg">
              {judge.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{judge.name}</p>
              <p className="text-xs text-[#64748b]">Jurado Técnico — {festival?.name || 'FINCCA'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 rounded-xl bg-ocean-900 border border-ocean-600 p-3 text-center">
              <p className="text-2xl font-bold text-white">{done}</p>
              <p className="text-xs text-[#64748b]">Avaliados</p>
            </div>
            <div className="flex-1 rounded-xl bg-ocean-900 border border-ocean-600 p-3 text-center">
              <p className="text-2xl font-bold text-[#94a3b8]">{filmList.length - done}</p>
              <p className="text-xs text-[#64748b]">Pendentes</p>
            </div>
            <div className="flex-1 rounded-xl bg-ocean-900 border border-ocean-600 p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">{filmList.length}</p>
              <p className="text-xs text-[#64748b]">Total</p>
            </div>
          </div>
        </div>

        {/* Lista de filmes */}
        <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wider mb-3">
          Filmes para avaliar
        </h2>

        <div className="flex flex-col gap-3">
          {filmList.length === 0 && (
            <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-8 text-center">
              <Clapperboard className="w-10 h-10 text-[#4a6080] mx-auto mb-3" />
              <p className="text-[#64748b]">Nenhum filme cadastrado ainda.</p>
            </div>
          )}

          {filmList.map((film) => {
            const eval_ = evalMap.get(film.id)
            const submitted = eval_?.is_submitted ?? false
            const inProgress = eval_ && !submitted
            const canEdit = !submitted || (festival?.allow_jury_edit ?? false)

            return (
              <Link
                key={film.id}
                href={canEdit ? `/jurado/avaliar/${film.id}` : '#'}
                className={`block rounded-2xl border bg-ocean-800 p-5 transition-all duration-200 ${
                  canEdit
                    ? 'border-ocean-500 hover:border-primary-500/70 hover:bg-ocean-700 card-glow cursor-pointer'
                    : 'border-ocean-600 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {submitted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : inProgress ? (
                      <Clock className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#4a6080]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-white leading-tight">{film.title}</p>
                      <Badge
                        variant={submitted ? 'success' : inProgress ? 'warning' : 'default'}
                        className="shrink-0"
                      >
                        {submitted ? 'Enviado' : inProgress ? 'Em andamento' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#64748b]">
                      {film.director} · {film.category}
                    </p>
                    {film.session_date && (
                      <p className="text-xs text-[#4a6080] mt-1">{formatDateOnly(film.session_date)}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {done === filmList.length && filmList.length > 0 && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="font-semibold text-green-300">Todas as avaliações foram enviadas!</p>
            <p className="text-sm text-green-400/70 mt-1">
              Obrigado pela sua participação no Júri Técnico do FINCCA.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
