'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { computeEvaluationAverage, round2, formatDate } from '@/lib/utils'
import type { Film, PublicVote, TechnicalEvaluation, Judge, Festival, AwardCategory } from '@/types'

export default function RelatoriosPage() {
  const supabase = createClient()
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)
  const [generatingXlsx, setGeneratingXlsx] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadAllData = async () => {
    const [
      { data: films },
      { data: votes },
      { data: evals },
      { data: judges },
      { data: festival },
      { data: categories },
    ] = await Promise.all([
      supabase.from('films').select('*').eq('is_active', true).order('order_index'),
      supabase.from('public_votes').select('*').order('created_at'),
      supabase.from('technical_evaluations').select('*').eq('is_submitted', true),
      supabase.from('judges').select('*').order('name'),
      supabase.from('festivals').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('award_categories').select('*').eq('is_active', true).order('order_index'),
    ])
    return { films: films || [], votes: votes || [], evals: evals || [], judges: judges || [], festival, categories: categories || [] }
  }

  const generatePopularPdf = async () => {
    setGeneratingPdf('popular')
    try {
      const { films, votes, festival } = await loadAllData()
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()

      // Título
      doc.setFontSize(18)
      doc.setTextColor(27, 138, 138)
      doc.text('FINCCA — Júri Popular', pageW / 2, 20, { align: 'center' })
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(festival?.name || '', pageW / 2, 28, { align: 'center' })
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, 34, { align: 'center' })

      // Resumo
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text('Resumo', 14, 46)

      const votesByFilm = new Map<string, PublicVote[]>()
      votes.forEach((v: PublicVote) => {
        const arr = votesByFilm.get(v.film_id) || []
        arr.push(v)
        votesByFilm.set(v.film_id, arr)
      })

      const rows = films.map((film: Film, idx: number) => {
        const filmVotes = votesByFilm.get(film.id) || []
        const avg = filmVotes.length > 0
          ? round2(filmVotes.reduce((a, v) => a + v.rating, 0) / filmVotes.length)
          : 0
        return [idx + 1, film.title, film.director, filmVotes.length, avg > 0 ? avg.toFixed(1) : '—']
      }).sort((a, b) => Number(b[4]) - Number(a[4]))

      autoTable(doc, {
        startY: 52,
        head: [['#', 'Filme', 'Diretor', 'Votos', 'Média']],
        body: rows,
        headStyles: { fillColor: [27, 138, 138] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })

      // Comentários
      const comments = votes.filter((v: PublicVote) => v.comment)
      if (comments.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 10
        doc.setFontSize(13)
        doc.setTextColor(40)
        doc.text('Comentários do Público', 14, finalY)

        autoTable(doc, {
          startY: finalY + 6,
          head: [['Votante', 'Filme', 'Nota', 'Comentário']],
          body: comments.map((v: PublicVote) => [
            v.voter_name,
            films.find((f: Film) => f.id === v.film_id)?.title || '—',
            v.rating,
            v.comment,
          ]),
          headStyles: { fillColor: [27, 138, 138] },
          columnStyles: { 3: { cellWidth: 80 } },
        })
      }

      doc.save(`fincca-juri-popular-${new Date().toISOString().slice(0, 10)}.pdf`)
      setToast({ message: 'PDF gerado com sucesso!', type: 'success' })
    } catch (e) {
      setToast({ message: 'Erro ao gerar PDF.', type: 'error' })
    } finally {
      setGeneratingPdf(null)
    }
  }

  const generateTechnicalPdf = async () => {
    setGeneratingPdf('tecnico')
    try {
      const { films, evals, judges, festival, categories } = await loadAllData()
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      doc.setTextColor(27, 138, 138)
      doc.text('FINCCA — Júri Técnico', pageW / 2, 20, { align: 'center' })
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(festival?.name || '', pageW / 2, 28, { align: 'center' })
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, 34, { align: 'center' })

      // Ranking geral
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text('Ranking Geral — Júri Técnico', 14, 46)

      const evalsByFilm = new Map<string, TechnicalEvaluation[]>()
      evals.forEach((e: TechnicalEvaluation) => {
        const arr = evalsByFilm.get(e.film_id) || []
        arr.push(e)
        evalsByFilm.set(e.film_id, arr)
      })

      const rows = films.map((film: Film, idx: number) => {
        const filmEvals = evalsByFilm.get(film.id) || []
        const avg = filmEvals.length > 0
          ? round2(filmEvals.reduce((a, e) => a + computeEvaluationAverage(e.scores), 0) / filmEvals.length)
          : 0
        return [idx + 1, film.title, film.director, filmEvals.length, avg > 0 ? avg.toFixed(1) : '—']
      }).sort((a, b) => Number(b[4]) - Number(a[4]))

      autoTable(doc, {
        startY: 52,
        head: [['#', 'Filme', 'Diretor', 'Jurados', 'Média']],
        body: rows,
        headStyles: { fillColor: [27, 138, 138] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })

      // Composição do júri
      let lastY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text('Composição do Júri Técnico', 14, lastY)

      autoTable(doc, {
        startY: lastY + 6,
        head: [['Nome', 'E-mail']],
        body: judges.map((j: Judge) => [j.name, j.email]),
        headStyles: { fillColor: [27, 138, 138] },
      })

      doc.save(`fincca-juri-tecnico-${new Date().toISOString().slice(0, 10)}.pdf`)
      setToast({ message: 'PDF gerado com sucesso!', type: 'success' })
    } catch (e) {
      setToast({ message: 'Erro ao gerar PDF.', type: 'error' })
    } finally {
      setGeneratingPdf(null)
    }
  }

  const generateAta = async () => {
    setGeneratingPdf('ata')
    try {
      const { films, votes, evals, judges, festival, categories } = await loadAllData()
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()

      // Cabeçalho da ata
      doc.setFontSize(16)
      doc.setTextColor(27, 138, 138)
      doc.text('ATA FINAL DE PREMIAÇÃO', pageW / 2, 20, { align: 'center' })
      doc.setFontSize(12)
      doc.setTextColor(40)
      doc.text(festival?.name || 'FINCCA', pageW / 2, 30, { align: 'center' })
      doc.setFontSize(10)
      doc.setTextColor(80)
      doc.text(`Ano: ${festival?.year || new Date().getFullYear()}`, pageW / 2, 38, { align: 'center' })
      doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageW / 2, 44, { align: 'center' })

      // Filmes avaliados
      doc.setFontSize(12)
      doc.setTextColor(40)
      doc.text('Filmes Avaliados', 14, 56)
      autoTable(doc, {
        startY: 62,
        head: [['Título', 'Diretor', 'Categoria']],
        body: films.map((f: Film) => [f.title, f.director, f.category]),
        headStyles: { fillColor: [27, 138, 138] },
      })

      let lastY = (doc as any).lastAutoTable.finalY + 10

      // Composição do júri
      doc.setFontSize(12)
      doc.setTextColor(40)
      doc.text('Composição do Júri Técnico', 14, lastY)
      autoTable(doc, {
        startY: lastY + 6,
        head: [['Nome', 'E-mail']],
        body: judges.map((j: Judge) => [j.name, j.email]),
        headStyles: { fillColor: [27, 138, 138] },
      })

      lastY = (doc as any).lastAutoTable.finalY + 10

      // Resultado popular
      const votesByFilm = new Map<string, PublicVote[]>()
      votes.forEach((v: PublicVote) => { const a = votesByFilm.get(v.film_id) || []; a.push(v); votesByFilm.set(v.film_id, a) })
      const popRanking = films.map((f: Film) => {
        const fv = votesByFilm.get(f.id) || []
        const avg = fv.length > 0 ? round2(fv.reduce((a, v) => a + v.rating, 0) / fv.length) : 0
        return { film: f, votes: fv.length, avg }
      }).sort((a, b) => b.avg - a.avg)

      doc.setFontSize(12)
      doc.setTextColor(40)
      doc.text('Resultado — Júri Popular', 14, lastY)
      autoTable(doc, {
        startY: lastY + 6,
        head: [['#', 'Filme', 'Votos', 'Média']],
        body: popRanking.map((r, i) => [i + 1, r.film.title, r.votes, r.avg > 0 ? r.avg.toFixed(1) : '—']),
        headStyles: { fillColor: [27, 138, 138] },
      })

      lastY = (doc as any).lastAutoTable.finalY + 10

      // Resultado técnico
      const evalsByFilm = new Map<string, TechnicalEvaluation[]>()
      evals.forEach((e: TechnicalEvaluation) => { const a = evalsByFilm.get(e.film_id) || []; a.push(e); evalsByFilm.set(e.film_id, a) })
      const techRanking = films.map((f: Film) => {
        const fe = evalsByFilm.get(f.id) || []
        const avg = fe.length > 0 ? round2(fe.reduce((a, e) => a + computeEvaluationAverage(e.scores), 0) / fe.length) : 0
        return { film: f, evals: fe.length, avg }
      }).sort((a, b) => b.avg - a.avg)

      doc.setFontSize(12)
      doc.setTextColor(40)
      doc.text('Resultado — Júri Técnico', 14, lastY)
      autoTable(doc, {
        startY: lastY + 6,
        head: [['#', 'Filme', 'Jurados', 'Média']],
        body: techRanking.map((r, i) => [i + 1, r.film.title, r.evals, r.avg > 0 ? r.avg.toFixed(1) : '—']),
        headStyles: { fillColor: [27, 138, 138] },
      })

      lastY = (doc as any).lastAutoTable.finalY + 20

      // Assinaturas
      if (lastY > 250) { doc.addPage(); lastY = 20 }
      doc.setFontSize(11)
      doc.setTextColor(40)
      doc.text('Assinaturas da coordenação do festival:', 14, lastY)
      lastY += 15
      const sigWidth = (pageW - 40) / 2
      doc.line(14, lastY, 14 + sigWidth, lastY)
      doc.line(14 + sigWidth + 10, lastY, pageW - 14, lastY)
      lastY += 6
      doc.setFontSize(9)
      doc.setTextColor(80)
      doc.text('Coordenação — FINCCA', 14 + sigWidth / 2, lastY, { align: 'center' })
      doc.text('Direção Artística', 14 + sigWidth + 10 + sigWidth / 2, lastY, { align: 'center' })

      doc.save(`fincca-ata-final-${festival?.year || new Date().getFullYear()}.pdf`)
      setToast({ message: 'Ata gerada com sucesso!', type: 'success' })
    } catch {
      setToast({ message: 'Erro ao gerar ata.', type: 'error' })
    } finally {
      setGeneratingPdf(null)
    }
  }

  const generateExcel = async () => {
    setGeneratingXlsx('all')
    try {
      const { films, votes, evals, judges, festival } = await loadAllData()
      const XLSX = await import('xlsx')

      const wb = XLSX.utils.book_new()

      // Aba Júri Popular
      const votesByFilm = new Map<string, PublicVote[]>()
      votes.forEach((v: PublicVote) => { const a = votesByFilm.get(v.film_id) || []; a.push(v); votesByFilm.set(v.film_id, a) })
      const popRows = films.map((f: Film) => {
        const fv = votesByFilm.get(f.id) || []
        return {
          Filme: f.title, Diretor: f.director, 'Total Votos': fv.length,
          'Média': fv.length > 0 ? round2(fv.reduce((a, v) => a + v.rating, 0) / fv.length) : 0,
        }
      }).sort((a, b) => b['Média'] - a['Média'])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(popRows), 'Júri Popular')

      // Aba votos individuais
      const voteRows = votes.map((v: PublicVote) => ({
        Votante: v.voter_name, 'E-mail': v.voter_email,
        Filme: films.find((f: Film) => f.id === v.film_id)?.title || '',
        Nota: v.rating, Comentário: v.comment || '', Data: formatDate(v.created_at),
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(voteRows), 'Votos Populares')

      // Aba Júri Técnico
      const evalsByFilm = new Map<string, TechnicalEvaluation[]>()
      evals.forEach((e: TechnicalEvaluation) => { const a = evalsByFilm.get(e.film_id) || []; a.push(e); evalsByFilm.set(e.film_id, a) })
      const techRows = films.map((f: Film) => {
        const fe = evalsByFilm.get(f.id) || []
        const avg = fe.length > 0 ? round2(fe.reduce((a, e) => a + computeEvaluationAverage(e.scores), 0) / fe.length) : 0
        return { Filme: f.title, Diretor: f.director, Jurados: fe.length, 'Média Geral': avg }
      }).sort((a, b) => b['Média Geral'] - a['Média Geral'])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(techRows), 'Júri Técnico')

      // Aba avaliações detalhadas
      const detailRows = evals.map((e: TechnicalEvaluation) => ({
        Filme: films.find((f: Film) => f.id === e.film_id)?.title || '',
        Jurado: judges.find((j: Judge) => j.id === e.judge_id)?.name || '',
        ...e.scores,
        Média: computeEvaluationAverage(e.scores),
        Comentário: e.comment || '',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'Avaliações Detalhadas')

      XLSX.writeFile(wb, `fincca-resultados-${new Date().toISOString().slice(0, 10)}.xlsx`)
      setToast({ message: 'Planilha gerada com sucesso!', type: 'success' })
    } catch {
      setToast({ message: 'Erro ao gerar planilha.', type: 'error' })
    } finally {
      setGeneratingXlsx(null)
    }
  }

  const reports = [
    {
      id: 'popular',
      title: 'Relatório — Júri Popular',
      desc: 'Ranking de filmes, total de votos, médias e comentários do público',
      icon: '⭐',
      onPdf: generatePopularPdf,
    },
    {
      id: 'tecnico',
      title: 'Relatório — Júri Técnico',
      desc: 'Ranking técnico, notas por critério, médias por filme e jurados',
      icon: '🎬',
      onPdf: generateTechnicalPdf,
    },
    {
      id: 'ata',
      title: 'Ata Final de Premiação',
      desc: 'Documento oficial com todos os resultados e espaço para assinatura',
      icon: '📋',
      onPdf: generateAta,
    },
  ]

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Relatórios</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Exporte os dados em PDF ou Excel</p>
      </div>

      {/* Excel completo */}
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold text-white">Exportar Planilha Completa</p>
              <p className="text-sm text-[#64748b]">Todos os dados em Excel com múltiplas abas</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={generatingXlsx === 'all'}
            onClick={generateExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* PDFs */}
      <div className="flex flex-col gap-4">
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="font-semibold text-white">{r.title}</p>
                  <p className="text-sm text-[#64748b]">{r.desc}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                loading={generatingPdf === r.id}
                onClick={r.onPdf}
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
