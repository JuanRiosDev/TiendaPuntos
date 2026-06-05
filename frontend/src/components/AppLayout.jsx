import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/estudiantes', label: 'Estudiantes' },
  { to: '/profesores', label: 'Profesores' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/historial', label: 'Historial' },
  { to: '/reportes', label: 'Reportes' }
]

export default function AppLayout({ title, subtitle, actions, children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="container-app flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300 text-slate-900 font-bold">TP</span>
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Colegio Aire Libre</div>
              <div className="text-lg font-semibold text-slate-900">Tienda de Puntos</div>
            </div>
          </Link>
          <div className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to)
              return (
                <Link key={item.to} to={item.to} className="nav-link" data-active={active}>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="container-app py-8 page-enter">
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="label">Panel</div>
              <h1 className="text-4xl mt-1">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
