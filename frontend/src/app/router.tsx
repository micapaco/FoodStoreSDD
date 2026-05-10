import { createBrowserRouter } from 'react-router-dom'

// Layouts
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { PrivateLayout } from '@/app/layouts/PrivateLayout'

// Guards
import { ProtectedRoute } from '@/app/guards/ProtectedRoute'
import { RoleRoute } from '@/app/guards/RoleRoute'
import { GuestOnlyRoute } from '@/app/guards/GuestOnlyRoute'

// Pages — public
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { CatalogoPage } from '@/pages/productos/CatalogoPage'
import { ProductoDetallePage } from '@/pages/productos/ProductoDetallePage'

// Pages — client
import { ProfilePage } from '@/pages/ProfilePage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrdersListPage } from '@/pages/OrdersListPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'

// Pages — admin
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { CategoriesAdminPage } from '@/pages/admin/CategoriesAdminPage'
import { OrdersAdminPage } from '@/pages/admin/OrdersAdminPage'
import { UsersAdminPage } from '@/pages/admin/UsersAdminPage'

// Pages — productos (admin)
import { ProductosPage } from '@/pages/productos/ProductosPage'
import { ProductosCreatePage } from '@/pages/productos/ProductosCreatePage'
import { ProductosEditPage } from '@/pages/productos/ProductosEditPage'
import { ProductosDetailPage } from '@/pages/productos/ProductosDetailPage'

/**
 * Route map — shell routing spec.
 *
 * Guard composition pattern:
 *  - Public routes: no guard
 *  - Guest-only: GuestOnlyRoute wrapper
 *  - Private routes: ProtectedRoute (auth check) → RoleRoute (role check) → page
 *
 * All imports from "react-router-dom" (v7, already installed).
 */
export const router = createBrowserRouter([
  // ── Public layout ────────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      // Fully public
      { path: '/', element: <HomePage /> },
      { path: '/productos', element: <CatalogoPage /> },
      { path: '/productos/:id', element: <ProductoDetallePage /> },
      { path: '/403', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },

      // Guest-only (redirect authenticated users to role home)
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // ── Private layout ───────────────────────────────────────────────────────
  {
    element: <PrivateLayout />,
    children: [
      // CLIENT area — requires auth + CLIENT role
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['CLIENT']} />,
            children: [
              { path: '/perfil', element: <ProfilePage /> },
              { path: '/carrito', element: <CartPage /> },
              { path: '/checkout', element: <CheckoutPage /> },
              { path: '/pedidos', element: <OrdersListPage /> },
              { path: '/pedidos/:id', element: <OrderDetailPage /> },
            ],
          },
        ],
      },

      // ADMIN area — requires auth + ADMIN role
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['ADMIN']} />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/categorias', element: <CategoriesAdminPage /> },
              { path: '/admin/usuarios', element: <UsersAdminPage /> },
            ],
          },
        ],
      },

      // /admin/productos — requires auth + (ADMIN or STOCK)
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['ADMIN', 'STOCK']} />,
            children: [
              { path: '/admin/productos', element: <ProductosPage /> },
              { path: '/admin/productos/nuevo', element: <ProductosCreatePage /> },
              { path: '/admin/productos/:id', element: <ProductosDetailPage /> },
              { path: '/admin/productos/:id/editar', element: <ProductosEditPage /> },
            ],
          },
        ],
      },

      // /admin/pedidos — requires auth + (ADMIN or PEDIDOS)
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['ADMIN', 'PEDIDOS']} />,
            children: [
              { path: '/admin/pedidos', element: <OrdersAdminPage /> },
            ],
          },
        ],
      },
    ],
  },
])
