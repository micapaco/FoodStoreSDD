import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

const button = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-brand-on hover:bg-brand-dim rounded-lg',
        secondary:
          'bg-surface-high text-ink hover:bg-surface-higher border border-line-subtle rounded-lg',
        danger:
          'bg-danger-container text-danger hover:opacity-90 rounded-lg',
        ghost:
          'bg-transparent text-brand border border-brand hover:bg-brand/10 rounded-lg',
        link:
          'bg-transparent text-brand hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...props} />
}
