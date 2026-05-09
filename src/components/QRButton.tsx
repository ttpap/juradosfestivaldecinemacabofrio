'use client'

import { useState, useEffect } from 'react'
import { QrCode } from 'lucide-react'
import { QRModal } from './QRModal'

interface Props {
  path?: string
  label?: string
  className?: string
}

export function QRButton({ path = '/cadastro', label = 'QR Code', className }: Props) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.origin + path)
  }, [path])

  if (!url) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'flex items-center gap-1.5 rounded-xl border border-ocean-700 px-3 py-1.5 text-xs text-ocean-300 hover:border-ocean-500 hover:text-white transition-colors'}
        title="Gerar QR Code"
      >
        <QrCode className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>
      {open && <QRModal url={url} onClose={() => setOpen(false)} />}
    </>
  )
}
