import { cva, type VariantProps } from 'class-variance-authority'

const badge = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-sans tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-surface-high text-ink-muted',
        brand: 'bg-brand/20 text-brand',
        success: 'bg-success/20 text-success',
        warning: 'bg-brand/20 text-brand-dim',
        danger: 'bg-danger-container text-danger',
        info: 'bg-surface-higher text-ink-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends VariantProps<typeof badge> {
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, className, children }: BadgeProps) {
  return <span className={badge({ variant, className })}>{children}</span>
}
