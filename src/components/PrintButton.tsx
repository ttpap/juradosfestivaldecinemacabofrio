'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-bold text-ocean-950 hover:bg-gold-400 transition-colors"
    >
      <Printer className="w-4 h-4" />
      Imprimir / Salvar PDF
    </button>
  )
}
