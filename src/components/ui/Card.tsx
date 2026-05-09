import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  glow?: boolean
}

export function Card({ className, children, glow }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ocean-500 bg-ocean-800 p-6 transition-all duration-200',
        glow && 'card-glow',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn('text-lg font-bold text-[#f0f4f8]', className)}>{children}</h2>
  )
}
