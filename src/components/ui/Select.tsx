'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#94a3b8]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full appearance-none rounded-xl border bg-ocean-800 px-4 py-2.5 pr-10 text-sm text-[#f0f4f8]',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              !props.value && 'text-[#4a6080]',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-ocean-500 hover:border-primary-500/50',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-ocean-800 text-[#f0f4f8]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }
