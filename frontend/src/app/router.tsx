import { createBrowserRouter, Outlet } from 'react-router-dom'

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="mt-2 text-gray-500">Página no encontrada</p>
      </div>
    </div>
  )
}

function PublicLayout() {
  return <Outlet />
}

// TODO: change-frontend-shell — add route protection and auth guards here
function PrivateLayout() {
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <div className="p-8 text-2xl font-bold">Food Store 🍔</div> },
      { path: '/login', element: <div className="p-8">Login — pendiente (change: auth)</div> },
      { path: '/register', element: <div className="p-8">Registro — pendiente (change: auth)</div> },
    ],
  },
  {
    path: '/app',
    element: <PrivateLayout />,
    children: [
      { index: true, element: <div className="p-8">App shell — pendiente (change: frontend-shell)</div> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
