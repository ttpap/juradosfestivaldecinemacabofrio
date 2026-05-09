export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Film, Users, Star, CheckCircle2, Power, PowerOff } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/admin/login')

  const [
    { count: filmCount },
    { count: judgeCount },
    { count: popularVoteCount },
    { count: technicalCount },
    { data: festival },
  ] = await Promise.all([
    supabase.from('films').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('judges').select('*', { count: 'exact', head: true }),
    supabase.from('public_votes').select('*', { count: 'exact', head: true }),
    supabase.from('technical_evaluations').select('*', { count: 'exact', head: true }).eq('is_submitted', true),
    supabase.from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single(),
  ])

  const stats = [
    { label: 'Filmes ativos', value: filmCount ?? 0, icon: Film, color: 'text-primary-400' },
    { label: 'Jurados', value: judgeCount ?? 0, icon: Users, color: 'text-gold-400' },
    { label: 'Votos populares', value: popularVoteCount ?? 0, icon: Star, color: 'text-purple-400' },
    { label: 'Avaliações técnicas', value: technicalCount ?? 0, icon: CheckCircle2, color: 'text-green-400' },
  ]

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-[#64748b] text-sm mt-0.5">{festival?.name || 'FINCCA'} · {festival?.year}</p>
          </div>
          <Badge variant={festival?.voting_open ? 'success' : 'danger'}>
            {festival?.voting_open ? '● Votação aberta' : '● Votação fechada'}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-2">
            <s.icon className={`w-6 h-6 ${s.color}`} />
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-[#64748b]">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Controle de votação */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Controle da Votação</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#94a3b8]">
              Status atual:{' '}
              <span className={festival?.voting_open ? 'text-green-400' : 'text-red-400'}>
                {festival?.voting_open ? 'Aberta' : 'Fechada'}
              </span>
            </p>
            <p className="text-xs text-[#64748b] mt-0.5">
              Mínimo de votos para vencedor: {festival?.min_votes_for_winner}
            </p>
          </div>
          <form action="/api/admin/voting-control" method="POST">
            <input type="hidden" name="festival_id" value={festival?.id} />
            <input type="hidden" name="voting_open" value={festival?.voting_open ? 'false' : 'true'} />
            <Link href={`/api/admin/voting-control?festival_id=${festival?.id}&voting_open=${!festival?.voting_open}`}>
              <Button variant={festival?.voting_open ? 'danger' : 'primary'} size="md">
                {festival?.voting_open ? (
                  <><PowerOff className="w-4 h-4" /> Fechar votação</>
                ) : (
                  <><Power className="w-4 h-4" /> Abrir votação</>
                )}
              </Button>
            </Link>
          </form>
        </div>
      </Card>

      {/* Ações rápidas */}
      <h2 className="text-sm font-medium text-[#64748b] uppercase tracking-wider mb-3">Ações rápidas</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/admin/filmes/novo', label: 'Cadastrar filme', icon: '🎬' },
          { href: '/admin/jurados', label: 'Gerenciar jurados', icon: '🎭' },
          { href: '/admin/resultados', label: 'Ver resultados', icon: '📊' },
          { href: '/admin/relatorios', label: 'Exportar relatório', icon: '📄' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="group block">
            <div className="rounded-xl border border-ocean-500 bg-ocean-800 p-4 hover:border-primary-500/60 hover:bg-ocean-700 transition-all">
              <p className="text-2xl mb-2">{a.icon}</p>
              <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">
                {a.label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
