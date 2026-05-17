import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-line-subtle bg-surface-base',
        elevated ? 'shadow-card-md' : 'shadow-card-sm',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
