'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'

export function NotifyVotersButton({ votersWithoutComments }: { votersWithoutComments: number }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null)

  if (votersWithoutComments === 0) return null

  const handleSend = async () => {
    if (!confirm(`Enviar email para ${votersWithoutComments} votante(s) sem comentário?`)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/notify-voters', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? 'Erro ao enviar.')
        return
      }
      setResult({ sent: json.sent, errors: json.errors })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-ocean-700 bg-ocean-800/60 p-5">
      <div className="flex-1">
        <p className="font-semibold text-white">Notificar votantes</p>
        <p className="text-sm text-ocean-400">
          {votersWithoutComments} votante(s) ainda não deixaram comentário.
        </p>
        {result && (
          <p className="text-sm mt-1 text-green-400">
            {result.sent} email(s) enviado(s){result.errors > 0 ? `, ${result.errors} erro(s)` : ''}.
          </p>
        )}
      </div>
      <button
        onClick={handleSend}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors w-full sm:w-auto bg-gold-500/20 border border-gold-500/40 text-gold-300 hover:bg-gold-500/30 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {loading ? 'Enviando...' : 'Enviar emails'}
      </button>
    </div>
  )
}
