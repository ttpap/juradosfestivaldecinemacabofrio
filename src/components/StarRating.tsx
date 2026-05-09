'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1" role="group" aria-label="Avaliação em estrelas">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              'transition-all duration-100',
              !readonly && 'cursor-pointer hover:scale-110',
              readonly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizes[size],
                'transition-colors duration-100',
                filled ? 'fill-gold-500 text-gold-500' : 'fill-transparent text-ocean-500'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
