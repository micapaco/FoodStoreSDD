import { Link } from 'react-router-dom'

/** 403 — Acceso denegado */
export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-extrabold text-surface-higher">403</h1>
        <h2 className="text-2xl font-bold font-display text-ink">Acceso denegado</h2>
        <p className="text-ink-muted max-w-md">
          No tenés permisos para esta sección.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-brand-on shadow-card-sm hover:bg-brand-dark transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
