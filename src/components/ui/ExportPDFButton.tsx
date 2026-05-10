'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'

type VoterRow = {
  name: string | null
  email: string
  birth_date: string | null
  film: string | null
}

type Props = {
  rows: VoterRow[]
  festivalName: string
  total: number
  totalVoted: number
}

export function ExportPDFButton({ rows, festivalName, total, totalVoted }: Props) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const now = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    // Header bar
    doc.setFillColor(10, 40, 80)
    doc.rect(0, 0, pageW, 28, 'F')

    doc.setTextColor(212, 175, 55)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('FINCCA', 14, 11)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Festival Internacional de Cinema de Cabo Frio', 14, 18)

    doc.setFontSize(8)
    doc.setTextColor(180, 200, 220)
    doc.text(`Júri Popular – ${festivalName}`, 14, 24)
    doc.text(`Gerado em ${now}`, pageW - 14, 24, { align: 'right' })

    // Stats row
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de cadastrados: ${total}     Votaram: ${totalVoted}     Não votaram: ${total - totalVoted}`, 14, 36)

    // Table
    const tableRows = rows.map((r, i) => [
      String(i + 1),
      r.name ?? '—',
      r.email,
      r.birth_date
        ? new Date(r.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : '—',
      r.film ?? 'Não votou',
    ])

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Nome', 'E-mail', 'Dt. Nascimento', 'Filme Votado']],
      body: tableRows,
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        valign: 'middle',
        textColor: [30, 30, 30],
      },
      headStyles: {
        fillColor: [10, 40, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages()
        const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(
          `Página ${pageNum} de ${pageCount}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        )
        doc.setDrawColor(180)
        doc.line(14, doc.internal.pageSize.getHeight() - 10, pageW - 14, doc.internal.pageSize.getHeight() - 10)
      },
    })

    const filename = `fincca-cadastrados-${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(filename)
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-ocean-300 border border-ocean-700 hover:bg-ocean-700 hover:text-white transition-all disabled:opacity-50"
    >
      <FileDown className="w-4 h-4" />
      {loading ? 'Gerando...' : 'Exportar PDF'}
    </button>
  )
}
