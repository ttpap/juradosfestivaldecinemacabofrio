'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-ocean-300 border border-ocean-700 hover:bg-ocean-700 hover:text-white transition-all print:hidden"
    >
      <Printer className="w-4 h-4" />
      Imprimir / PDF
    </button>
  )
}
