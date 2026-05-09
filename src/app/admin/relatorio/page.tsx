export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { PrintButton } from '@/components/PrintButton'
import { FileText } from 'lucide-react'

export default async function RelatorioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: festival } = await admin
    .from('festivals')
    .select('id, name, year')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const votes = festival ? await admin
    .from('public_votes')
    .select('voter_name, voter_email, created_at, film:films(title, category)')
    .eq('festival_id', festival.id)
    .order('voter_name') : { data: [] }

  const rows = (votes.data ?? []) as Array<{
    voter_name: string
    voter_email: string
    created_at: string
    film: { title: string; category: string | null } | null
  }>

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { padding: 24px !important; }
          table { font-size: 11px !important; }
          th, td { border-color: #ccc !important; color: black !important; }
          .print-header { color: black !important; }
        }
      `}</style>

      <div className="min-h-screen bg-ocean-950 text-white print-page">
        {/* Cabeçalho de tela */}
        <div className="no-print border-b border-ocean-800 bg-ocean-900/80 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-400" />
              <h1 className="font-bold text-white">Relatório de Votação</h1>
            </div>
            <PrintButton />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Cabeçalho do relatório (visível na impressão também) */}
          <div className="mb-8 print-header">
            <div className="flex items-center gap-4 mb-2">
              <Image src="/logo.png" alt="FINCCA" width={100} height={54} className="object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Relatório de Votos — Júri Popular
            </h2>
            {festival && (
              <p className="text-ocean-400 text-sm mt-1">
                {festival.name ?? 'FINCCA'} · {festival.year}
              </p>
            )}
            <div className="flex gap-6 mt-4">
              <div className="rounded-xl border border-ocean-700 bg-ocean-800/60 px-5 py-3">
                <p className="text-xs text-ocean-400">Total de votos</p>
                <p className="text-2xl font-bold text-white">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-ocean-700 bg-ocean-800/60 px-5 py-3">
                <p className="text-xs text-ocean-400">Gerado em</p>
                <p className="text-sm font-semibold text-white mt-0.5">{now}</p>
              </div>
            </div>
          </div>

          {/* Tabela */}
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-ocean-700 bg-ocean-800/40 py-16 text-center">
              <p className="text-ocean-400">Nenhum voto registrado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ocean-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ocean-700 bg-ocean-800/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">E-mail</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Filme votado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide hidden md:table-cell">Data/hora</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={`${row.voter_email}-${i}`}
                      className={`border-b border-ocean-800 ${i % 2 === 0 ? 'bg-ocean-900/40' : 'bg-ocean-800/20'} hover:bg-ocean-700/30 transition-colors`}>
                      <td className="px-4 py-3 text-ocean-500 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{row.voter_name}</td>
                      <td className="px-4 py-3 text-ocean-300 text-xs">{row.voter_email}</td>
                      <td className="px-4 py-3 font-semibold text-gold-400">{row.film?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-ocean-400 text-xs hidden sm:table-cell">{row.film?.category ?? '—'}</td>
                      <td className="px-4 py-3 text-ocean-500 text-xs hidden md:table-cell">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé de impressão */}
          <p className="no-print mt-6 text-xs text-ocean-600 text-center">
            Clique em &quot;Imprimir / Salvar PDF&quot; para exportar este relatório.
          </p>
        </div>
      </div>
    </>
  )
}
