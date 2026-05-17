import { cva, type VariantProps } from 'class-variance-authority'
import type { InputHTMLAttributes } from 'react'

const input = cva(
  'w-full rounded-lg bg-surface-low border font-sans text-sm text-ink placeholder:text-ink-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-line-subtle focus:border-brand',
        error: 'border-danger focus:border-danger focus:ring-danger/30',
      },
      inputSize: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  },
)

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof input> {
  label?: string
  error?: string
}

export function Input({ variant, inputSize, label, error, className, id, ...props }: InputProps) {
  const resolvedVariant = error ? 'error' : variant

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-ink-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={input({ variant: resolvedVariant, inputSize, className })}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
