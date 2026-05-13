import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Granularidad } from '@/entities/metricas/types'
import {
  useMetricasPedidosPorEstado,
  useMetricasProductosTop,
  useMetricasResumen,
  useMetricasVentas,
} from '@/shared/hooks/useMetricas'

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308']

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_PREP: 'En preparación',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoSubtractDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

interface DateRange { desde: string; hasta: string }

const PRESETS = [
  { label: 'Hoy', range: (): DateRange => ({ desde: isoToday(), hasta: isoToday() }) },
  { label: '7d', range: (): DateRange => ({ desde: isoSubtractDays(7), hasta: isoToday() }) },
  { label: '30d', range: (): DateRange => ({ desde: isoSubtractDays(30), hasta: isoToday() }) },
  { label: '90d', range: (): DateRange => ({ desde: isoSubtractDays(90), hasta: isoToday() }) },
]

function KpiCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <div className="mt-2 h-8 w-28 animate-pulse rounded bg-gray-200" />
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-gray-400">{message}</div>
  )
}

export function AdminDashboardPage() {
  const [range, setRange] = useState<DateRange>({ desde: isoSubtractDays(30), hasta: isoToday() })
  const [granularidad, setGranularidad] = useState<Granularidad>('dia')
  const [activePreset, setActivePreset] = useState('30d')

  const params = { desde: range.desde, hasta: range.hasta }

  const resumen = useMetricasResumen(params)
  const ventas = useMetricasVentas({ ...params, granularidad })
  const topProductos = useMetricasProductosTop({ ...params, top: 10 })
  const porEstado = useMetricasPedidosPorEstado(params)

  const handlePreset = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.label)
    setRange(preset.range())
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                activePreset === p.label
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total ventas"
          value={resumen.data ? formatCurrency(resumen.data.total_ventas) : '—'}
          loading={resumen.isLoading}
        />
        <KpiCard
          label="Pedidos"
          value={resumen.data ? String(resumen.data.cantidad_pedidos) : '—'}
          loading={resumen.isLoading}
        />
        <KpiCard
          label="Ticket promedio"
          value={resumen.data ? formatCurrency(resumen.data.ticket_promedio) : '—'}
          loading={resumen.isLoading}
        />
        <KpiCard
          label="Usuarios nuevos"
          value={resumen.data ? String(resumen.data.usuarios_registrados) : '—'}
          loading={resumen.isLoading}
        />
      </div>

      {resumen.isError && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          Error al cargar métricas de resumen.
        </p>
      )}

      {/* Ventas — LineChart */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">Evolución de ventas</h2>
          <div className="flex gap-2">
            {(['dia', 'semana', 'mes'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularidad(g)}
                className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                  granularidad === g
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {g === 'dia' ? 'Día' : g === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          {ventas.isLoading && <div className="h-48 animate-pulse rounded bg-gray-100" />}
          {ventas.isError && <EmptyChart message="Error al cargar datos de ventas." />}
          {ventas.data && ventas.data.puntos.length === 0 && (
            <EmptyChart message="Sin ventas en el período seleccionado." />
          )}
          {ventas.data && ventas.data.puntos.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ventas.data.puntos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'total_ventas' ? [formatCurrency(value), 'Ventas'] : [value, 'Pedidos']
                  }
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="total_ventas" stroke="#f97316" name="Ventas ($)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cantidad_pedidos" stroke="#3b82f6" name="Pedidos" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: BarChart + PieChart */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top productos — BarChart */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Top productos</h2>
          <div className="mt-4">
            {topProductos.isLoading && <div className="h-48 animate-pulse rounded bg-gray-100" />}
            {topProductos.isError && <EmptyChart message="Error al cargar top productos." />}
            {topProductos.data && topProductos.data.productos.length === 0 && (
              <EmptyChart message="Sin productos vendidos en el período." />
            )}
            {topProductos.data && topProductos.data.productos.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  layout="vertical"
                  data={topProductos.data.productos}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value: number) => [value, 'Unidades']} />
                  <Bar dataKey="cantidad_vendida" fill="#f97316" radius={[0, 4, 4, 0]} name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pedidos por estado — PieChart */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Distribución por estado</h2>
          <div className="mt-4">
            {porEstado.isLoading && <div className="h-48 animate-pulse rounded bg-gray-100" />}
            {porEstado.isError && <EmptyChart message="Error al cargar distribución." />}
            {porEstado.data && porEstado.data.estados.length === 0 && (
              <EmptyChart message="Sin pedidos en el período seleccionado." />
            )}
            {porEstado.data && porEstado.data.estados.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={porEstado.data.estados}
                    dataKey="cantidad"
                    nameKey="estado_codigo"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ estado_codigo, percent }) =>
                      `${ESTADO_LABELS[estado_codigo] ?? estado_codigo} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {porEstado.data.estados.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, ESTADO_LABELS[name] ?? name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
