import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Root error boundary — catches synchronous render errors in descendant tree.
 * Renders a fallback UI with a "Recargar" button that calls window.location.reload().
 * Logs the error and component stack to console.error.
 *
 * NOTE: Does not catch async errors (useEffect, promises, mutations).
 * Those are handled by the HTTP error handler and TanStack Query.
 */
export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RootErrorBoundary] Render error caught:', error, info.componentStack)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-ink">
              Algo salió mal
            </h2>
            <p className="text-ink-muted max-w-md">
              Ocurrió un error inesperado en la aplicación. Podés intentar recargar la página.
            </p>
            {this.state.error && (
              <p className="text-xs text-ink-muted/60 font-mono mt-1">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-brand-on shadow hover:bg-brand-dim transition-colors"
          >
            Recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
