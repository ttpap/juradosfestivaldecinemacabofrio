'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'success', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div
      className={cn(
        'fixed bottom-6 right-4 left-4 md:left-auto md:w-96 z-50',
        'flex items-start gap-3 rounded-xl border p-4 shadow-2xl',
        'animate-slide-up',
        type === 'success'
          ? 'bg-green-900/90 border-green-500/50 text-green-100'
          : 'bg-red-900/90 border-red-500/50 text-red-100'
      )}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      )}
      <p className="flex-1 text-sm">{message}</p>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
