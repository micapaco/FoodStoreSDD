import { useState } from 'react'
import { NavLink } from 'react-router-dom'

/**
 * Header for public routes.
 * Shows brand + links to /, /login, /register.
 * Collapses into a hamburger menu on mobile (below md breakpoint).
 */
export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-orange-600 font-semibold'
      : 'text-gray-700 hover:text-orange-500 transition-colors'

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-orange-500 tracking-tight">
              Food Store
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
            <NavLink to="/" className={linkClass} end>
              Inicio
            </NavLink>
            <NavLink to="/productos" className={linkClass}>
              Catálogo
            </NavLink>
            <NavLink to="/login" className={linkClass}>
              Iniciar sesión
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Registrarse
            </NavLink>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

          {/* Mobile nav */}
          {menuOpen && (
            <nav
              className="md:hidden pb-4 flex flex-col gap-3"
              aria-label="Navegación mobile"
            >
              <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
                Inicio
              </NavLink>
              <NavLink to="/productos" className={linkClass} onClick={() => setMenuOpen(false)}>
                Catálogo
              </NavLink>
              <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setMenuOpen(false)}>
                Registrarse
              </NavLink>
            </nav>
          )}
      </div>
    </header>
  )
}
