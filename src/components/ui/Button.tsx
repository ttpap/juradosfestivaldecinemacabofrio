'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06111e] disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-primary-500 hover:bg-primary-400 text-white focus:ring-primary-500 shadow-lg shadow-primary-500/20',
      secondary:
        'bg-ocean-700 hover:bg-ocean-600 text-white border border-ocean-500 focus:ring-ocean-500',
      gold: 'bg-gold-500 hover:bg-gold-400 text-ocean-900 focus:ring-gold-500 shadow-lg shadow-gold-500/20',
      ghost:
        'bg-transparent hover:bg-ocean-700 text-[#94a3b8] hover:text-white border border-ocean-500 focus:ring-ocean-500',
      danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
