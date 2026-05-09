'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { X, Download, QrCode } from 'lucide-react'

interface Props {
  url: string
  onClose: () => void
}

export function QRModal({ url, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDownload = () => {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'fincca-votacao-qr.svg'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-ocean-900 border border-ocean-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gold-400" />
            <h2 className="font-bold text-white">QR Code — Votação</h2>
          </div>
          <button onClick={onClose} className="text-ocean-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={ref} className="bg-white rounded-2xl p-5 flex items-center justify-center mb-5">
          <QRCode value={url} size={220} />
        </div>

        <p className="text-center text-xs text-ocean-400 mb-5 break-all">{url}</p>

        <div className="flex gap-3">
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-ocean-600 px-4 py-3 text-sm text-ocean-300 hover:border-ocean-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
            Baixar SVG
          </button>
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-ocean-950 hover:bg-gold-400 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
