import { cn } from '@/lib/utils'

interface BadgeProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'primary'
}

export function Badge({ className, children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-ocean-700 text-[#94a3b8] border-ocean-500',
    primary: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    gold: 'bg-gold-500/20 text-gold-400 border-gold-500/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
