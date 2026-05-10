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

async function fetchLogoBase64(): Promise<string> {
  const res = await fetch('/logo.png')
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

// Festival palette
const C = {
  ocean950: [4, 13, 24] as [number, number, number],
  ocean800: [12, 28, 46] as [number, number, number],
  ocean700: [18, 37, 64] as [number, number, number],
  gold400:  [240, 192, 96] as [number, number, number],
  gold500:  [212, 168, 80] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  gray100:  [244, 247, 251] as [number, number, number],
  gray300:  [200, 210, 225] as [number, number, number],
  text:     [20, 30, 45] as [number, number, number],
}

export function ExportPDFButton({ rows, festivalName, total, totalVoted }: Props) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const [{ default: jsPDF }, { default: autoTable }, logoData] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        fetchLogoBase64(),
      ])

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })

      // ── Header background ────────────────────────────────────────
      doc.setFillColor(...C.ocean950)
      doc.rect(0, 0, pageW, 36, 'F')

      // Gold accent line at bottom of header
      doc.setFillColor(...C.gold400)
      doc.rect(0, 34, pageW, 2, 'F')

      // Logo (ratio 1920:1080 = 16:9 → 36mm × 20.25mm)
      doc.addImage(logoData, 'PNG', 8, 4, 50, 28)

      // Festival name right-aligned
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...C.gold400)
      doc.text('FESTIVAL INTERNACIONAL DE CINEMA', pageW - 12, 13, { align: 'right' })
      doc.text('DE CABO FRIO — FINCCA', pageW - 12, 19, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...C.gray300)
      doc.text(`Júri Popular — ${festivalName}`, pageW - 12, 26, { align: 'right' })
      doc.text(`Gerado em ${now}`, pageW - 12, 31, { align: 'right' })

      // ── Stats row ────────────────────────────────────────────────
      const statsY = 44
      const boxW = 55
      const boxes = [
        { label: 'Cadastrados', value: String(total), color: C.white },
        { label: 'Votaram', value: String(totalVoted), color: C.gold400 },
        { label: 'Não votaram', value: String(total - totalVoted), color: C.gray300 },
      ]
      boxes.forEach((b, idx) => {
        const x = 14 + idx * (boxW + 4)
        doc.setFillColor(...C.ocean800)
        doc.roundedRect(x, statsY - 6, boxW, 14, 2, 2, 'F')
        doc.setDrawColor(...C.ocean700)
        doc.roundedRect(x, statsY - 6, boxW, 14, 2, 2, 'S')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...C.gray300)
        doc.text(b.label.toUpperCase(), x + boxW / 2, statsY - 1, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(...b.color)
        doc.text(b.value, x + boxW / 2, statsY + 6, { align: 'center' })
      })

      // ── Table ────────────────────────────────────────────────────
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
        startY: statsY + 12,
        head: [['#', 'Nome completo', 'E-mail', 'Dt. Nasc.', 'Filme votado']],
        body: tableRows,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 3.5, right: 5, bottom: 3.5, left: 5 },
          textColor: C.text,
          lineColor: [220, 228, 240],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: C.ocean700,
          textColor: C.white,
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'left',
        },
        alternateRowStyles: {
          fillColor: C.gray100,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center', textColor: [140, 155, 175] },
          1: { cellWidth: 44 },
          2: { cellWidth: 52 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 'auto' },
        },
        didDrawPage: () => {
          const pageCount = (doc as any).internal.getNumberOfPages()
          const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber
          const pageH = doc.internal.pageSize.getHeight()
          doc.setDrawColor(...C.ocean700)
          doc.setLineWidth(0.3)
          doc.line(14, pageH - 10, pageW - 14, pageH - 10)
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...C.gray300)
          doc.text('FINCCA — Júri Popular', 14, pageH - 5.5)
          doc.text(`Página ${pageNum} de ${pageCount}`, pageW - 14, pageH - 5.5, { align: 'right' })
        },
      })

      const filename = `fincca-cadastrados-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } finally {
      setLoading(false)
    }
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
