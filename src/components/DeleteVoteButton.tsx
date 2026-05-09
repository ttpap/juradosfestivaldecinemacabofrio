'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DeleteVoteButton({ voteId }: { voteId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/votes/${voteId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Sim'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-ocean-600 px-2 py-1 text-xs text-ocean-400 hover:text-white transition-colors"
        >
          Não
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-red-500/30 p-1.5 text-red-400/60 hover:border-red-500/60 hover:text-red-400 transition-colors"
      title="Apagar voto"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
