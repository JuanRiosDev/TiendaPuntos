import React from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard(){
  return (
    <div className="p-8 page-enter">
      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl">Dashboard Docente</h1>
          <p className="text-sm text-slate-500">Gestion de estudiantes, puntos y canjes.</p>
        </div>
      </header>

      <main className="grid gap-6">
        <section>
          <h2 className="text-lg mb-2">Gestion</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/estudiantes" className="px-4 py-2 bg-sky-600 text-white rounded">Estudiantes</Link>
            <Link to="/historial" className="px-4 py-2 bg-emerald-600 text-white rounded">Historial</Link>
            <Link to="/reportes" className="px-4 py-2 bg-slate-800 text-white rounded">Reportes</Link>
          </div>
        </section>
        <section>
          <h2 className="text-lg mb-2">Tienda</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/tienda" className="px-4 py-2 bg-amber-500 text-white rounded">Ir a tienda</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
