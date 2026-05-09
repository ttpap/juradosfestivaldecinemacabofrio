'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#94a3b8]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-ocean-800 px-4 py-2.5 text-sm text-[#f0f4f8]',
            'placeholder:text-[#4a6080] resize-none',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-ocean-500 hover:border-primary-500/50',
            className
          )}
          rows={props.rows || 3}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export { Textarea }
