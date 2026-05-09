/**
 * Application footer — copyright + placeholder institutional links.
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-500">
            &copy; {year} Food Store. Todos los derechos reservados.
          </p>
          <nav aria-label="Links institucionales">
            <ul className="flex gap-4 text-sm text-gray-500">
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
