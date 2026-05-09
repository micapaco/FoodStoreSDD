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

// Pages — client
import { ProfilePage } from '@/pages/ProfilePage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrdersListPage } from '@/pages/OrdersListPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'

// Pages — admin
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { ProductsAdminPage } from '@/pages/admin/ProductsAdminPage'
import { CategoriesAdminPage } from '@/pages/admin/CategoriesAdminPage'
import { OrdersAdminPage } from '@/pages/admin/OrdersAdminPage'
import { UsersAdminPage } from '@/pages/admin/UsersAdminPage'

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
              { path: '/admin/productos', element: <ProductsAdminPage /> },
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
