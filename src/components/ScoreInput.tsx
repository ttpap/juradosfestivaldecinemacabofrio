'use client'

import { cn } from '@/lib/utils'

interface ScoreInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
  disabled?: boolean
}

export function ScoreInput({ label, value, onChange, max = 10, disabled = false }: ScoreInputProps) {
  const pct = (value / max) * 100

  const color =
    value === 0
      ? 'bg-ocean-600'
      : value <= max * 0.4
      ? 'bg-red-500'
      : value <= max * 0.6
      ? 'bg-amber-500'
      : value <= max * 0.8
      ? 'bg-primary-500'
      : 'bg-green-500'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#94a3b8]">{label}</span>
        <span
          className={cn(
            'text-lg font-bold w-10 text-center rounded-lg py-0.5',
            value === 0 ? 'text-[#4a6080]' : 'text-white'
          )}
        >
          {value === 0 ? '—' : value}
        </span>
      </div>

      {/* Botões 1–10 */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              'w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-100',
              'border focus:outline-none focus:ring-2 focus:ring-primary-500',
              !disabled && 'hover:scale-105 cursor-pointer',
              disabled && 'cursor-default',
              value === n
                ? `${color} border-transparent text-white shadow-lg`
                : 'bg-ocean-700 border-ocean-500 text-[#64748b] hover:border-primary-500/50 hover:text-white'
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 rounded-full bg-ocean-700 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
