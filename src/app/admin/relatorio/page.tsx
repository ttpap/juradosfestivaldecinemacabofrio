export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/auth/admins'
import { PrintButton } from '@/components/PrintButton'
import { DeleteVoteButton } from '@/components/DeleteVoteButton'
import { FileText } from 'lucide-react'

export default async function RelatorioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const isAdmin = isAdminEmail(user.email)

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
    .select('id, voter_name, voter_email, created_at, comment_film, comment_festival, film:films(title, category)')
    .eq('festival_id', festival.id)
    .order('voter_name') : { data: [] }

  const rows = (votes.data ?? []) as unknown as Array<{
    id: string
    voter_name: string
    voter_email: string
    created_at: string
    comment_film: string | null
    comment_festival: string | null
    film: { title: string; category: string | null } | null
  }>

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4 portrait; }

          /* Esconde sidebar, nav mobile, botões de tela */
          aside, nav, .no-print { display: none !important; }

          /* Reset layout do admin */
          body { background: white !important; color: #111 !important; font-family: Arial, sans-serif !important; }
          .md\\:ml-56 { margin-left: 0 !important; }
          .pb-20, .md\\:pb-0 { padding-bottom: 0 !important; }
          .min-h-screen { min-height: auto !important; }
          .max-w-5xl { max-width: 100% !important; }
          .sticky { position: static !important; }

          /* Cabeçalho do relatório */
          .print-header h2 { font-size: 18px !important; color: #111 !important; margin: 6px 0 !important; }
          .print-header p  { font-size: 12px !important; color: #444 !important; margin: 2px 0 !important; }

          /* Cards de stats */
          .print-stat {
            display: inline-block !important;
            border: 1px solid #ccc !important;
            border-radius: 6px !important;
            padding: 6px 14px !important;
            margin-right: 12px !important;
            background: white !important;
          }
          .print-stat-label { font-size: 9px !important; color: #666 !important; text-transform: uppercase !important; }
          .print-stat-value { font-size: 20px !important; font-weight: bold !important; color: #111 !important; }

          /* Tabela */
          table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; margin-top: 16px !important; }
          thead tr { background: #f0f0f0 !important; }
          th {
            border: 1px solid #bbb !important;
            padding: 6px 8px !important;
            text-align: left !important;
            font-weight: bold !important;
            color: #222 !important;
            font-size: 9px !important;
            text-transform: uppercase !important;
          }
          td {
            border: 1px solid #ddd !important;
            padding: 5px 8px !important;
            color: #222 !important;
          }
          tr:nth-child(even) td { background: #f9f9f9 !important; }

          /* Força exibição das colunas que eram hidden */
          th, td { display: table-cell !important; }

          /* Overflow */
          .overflow-x-auto { overflow: visible !important; }
          .rounded-2xl, .rounded-xl { border-radius: 4px !important; }

          /* Logo */
          img { max-height: 48px !important; }
        }
      `}</style>

      <div className="min-h-screen bg-ocean-950 text-white">
        {/* Cabeçalho de tela — oculto na impressão */}
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
          {/* Cabeçalho visível também na impressão */}
          <div className="mb-8 print-header">
            <div className="flex items-center gap-4 mb-3">
              <Image src="/logo.png" alt="FINCCA" width={100} height={54} className="object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Relatório de Votos — Júri Popular
            </h2>
            {festival && (
              <p className="text-ocean-400 text-sm mt-1">
                1º Festival Internacional de Cinema de Cabo Frio · {festival.year}
              </p>
            )}
            <div className="flex gap-4 mt-4">
              <div className="print-stat rounded-xl border border-ocean-700 bg-ocean-800/60 px-5 py-3">
                <p className="print-stat-label text-xs text-ocean-400">Total de votos</p>
                <p className="print-stat-value text-2xl font-bold text-white">{rows.length}</p>
              </div>
              <div className="print-stat rounded-xl border border-ocean-700 bg-ocean-800/60 px-5 py-3">
                <p className="print-stat-label text-xs text-ocean-400">Gerado em</p>
                <p className="print-stat-value text-sm font-semibold text-white mt-0.5">{now}</p>
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
                    <th className="hidden sm:table-cell text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Nome</th>
                    <th className="hidden md:table-cell text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">E-mail</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Filme</th>
                    <th className="hidden sm:table-cell text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Categoria</th>
                    <th className="hidden sm:table-cell text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Data/hora</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Opinião filme</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-ocean-400 uppercase tracking-wide">Opinião festival</th>
                    {isAdmin && <th className="px-3 py-3 w-14 no-print" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={`${row.voter_email}-${i}`}
                      className={`border-b border-ocean-800 ${i % 2 === 0 ? 'bg-ocean-900/40' : 'bg-ocean-800/20'} hover:bg-ocean-700/30 transition-colors`}>
                      <td className="hidden sm:table-cell px-3 py-3 text-ocean-500 text-xs">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-white text-sm">{row.voter_name}</td>
                      <td className="hidden md:table-cell px-3 py-3 text-ocean-300 text-xs">{row.voter_email}</td>
                      <td className="px-3 py-3 font-semibold text-gold-400 text-xs">{row.film?.title ?? '—'}</td>
                      <td className="hidden sm:table-cell px-3 py-3 text-ocean-400 text-xs">{row.film?.category ?? '—'}</td>
                      <td className="hidden sm:table-cell px-3 py-3 text-ocean-500 text-xs">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-ocean-300 text-xs max-w-[200px]">
                        {row.comment_film ? <span className="line-clamp-2">{row.comment_film}</span> : <span className="text-ocean-600">—</span>}
                      </td>
                      <td className="px-3 py-3 text-ocean-300 text-xs max-w-[200px]">
                        {row.comment_festival ? <span className="line-clamp-2">{row.comment_festival}</span> : <span className="text-ocean-600">—</span>}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3 no-print">
                          <DeleteVoteButton voteId={row.id} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="no-print mt-6 text-xs text-ocean-600 text-center">
            Clique em &quot;Imprimir / Salvar PDF&quot; para exportar este relatório.
          </p>
        </div>
      </div>
    </>
  )
}
