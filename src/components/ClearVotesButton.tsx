'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ClearVotesButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleClear = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/clear-votes', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setResult(`Erro: ${json.error}`)
      } else {
        setResult(`${json.deleted} voto(s) apagado(s).`)
        router.refresh()
      }
    } catch {
      setResult('Erro de rede.')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-red-400">Zerar todos os votos</p>
          <p className="text-xs text-red-400/60 mt-0.5">Apaga todos os votos do festival atual. Irreversível.</p>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Zerar votos
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-300">Confirmar?</span>
            <button
              onClick={handleClear}
              disabled={loading}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Apagando...' : 'Sim, apagar'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-xl border border-ocean-600 px-4 py-2 text-sm text-ocean-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
      {result && (
        <p className={`mt-3 text-xs ${result.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
