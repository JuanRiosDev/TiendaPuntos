import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import StatCard from '../components/StatCard'
import API from '../api'

export default function Dashboard(){
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    API.get('/reportes/resumen')
      .then(res => setSummary(res.data))
      .catch(() => setError('No se pudo cargar el resumen'))
  }, [])

  const actions = (
    <>
      <Link to="/tienda" className="btn-warm">Ir a tienda</Link>
      <Link to="/reportes" className="btn-soft">Ver reportes</Link>
    </>
  )

  return (
    <AppLayout
      title="Dashboard docente"
      subtitle="Gestion general del programa de puntos y canjes."
      actions={actions}
    >
      {error && <div className="text-rose-600 text-sm mb-4">{error}</div>}

      <section className="grid md:grid-cols-4 gap-4">
        <StatCard label="Estudiantes" value={summary?.estudiantes ?? '--'} tone="teal" />
        <StatCard label="Articulos" value={summary?.articulos ?? '--'} tone="amber" />
        <StatCard label="Transacciones" value={summary?.transacciones ?? '--'} tone="sky" />
        <StatCard label="Canjes" value={summary?.canjes ?? '--'} tone="slate" />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="card p-5">
          <div className="label">Gestion</div>
          <h2 className="text-xl mt-2">Control de estudiantes</h2>
          <p className="text-sm text-slate-500 mt-2">Crea, filtra y consulta movimientos.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/estudiantes" className="btn-primary">Ver estudiantes</Link>
            <Link to="/historial" className="btn-ghost">Historial</Link>
          </div>
        </div>
        <div className="card p-5">
          <div className="label">Tienda</div>
          <h2 className="text-xl mt-2">Canjes rapidos</h2>
          <p className="text-sm text-slate-500 mt-2">Arma un carrito y valida saldo al instante.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/tienda" className="btn-accent">Abrir tienda</Link>
          </div>
        </div>
        <div className="card p-5">
          <div className="label">Reportes</div>
          <h2 className="text-xl mt-2">Ranking y totales</h2>
          <p className="text-sm text-slate-500 mt-2">Consulta los mejores puntajes por grado.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/reportes" className="btn-soft">Explorar</Link>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
