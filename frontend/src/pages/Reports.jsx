import React, { useEffect, useState } from 'react'
import API from '../api'
import AppLayout from '../components/AppLayout'
import StatCard from '../components/StatCard'

export default function Reports(){
  const [summary, setSummary] = useState(null)
  const [grados, setGrados] = useState([])
  const [ranking, setRanking] = useState([])
  const [grado, setGrado] = useState('')
  const [limit, setLimit] = useState(10)
  const [error, setError] = useState(null)

  useEffect(() => {
    API.get('/reportes/resumen')
      .then(res => setSummary(res.data))
      .catch(() => setError('No se pudo cargar resumen'))

    API.get('/reportes/grados')
      .then(res => setGrados(res.data))
      .catch(() => setError('No se pudo cargar totales por grado'))

    loadRanking()
  }, [])

  async function loadRanking(){
    setError(null)
    try{
      const qs = new URLSearchParams()
      if (grado) qs.append('grado', grado)
      if (limit) qs.append('limit', limit)
      const res = await API.get(`/reportes/ranking?${qs.toString()}`)
      setRanking(res.data)
    }catch(err){
      setError('No se pudo cargar ranking')
    }
  }

  return (
    <AppLayout
      title="Reportes"
      subtitle="Resumen general, ranking de puntos y totales por grado."
      actions={<button onClick={loadRanking} className="btn-soft">Actualizar ranking</button>}
    >
      {error && <div className="text-rose-600 text-sm mb-4">{error}</div>}

      <section className="grid md:grid-cols-4 gap-4">
        <StatCard label="Estudiantes" value={summary?.estudiantes ?? '--'} tone="teal" />
        <StatCard label="Articulos" value={summary?.articulos ?? '--'} tone="amber" />
        <StatCard label="Transacciones" value={summary?.transacciones ?? '--'} tone="sky" />
        <StatCard label="Canjes" value={summary?.canjes ?? '--'} tone="slate" />
      </section>

      <section className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="text-lg mb-3">Totales por grado</h2>
          {grados.length === 0 ? (
            <div className="text-sm text-slate-500">Sin datos.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Grado</th>
                  <th>Estudiantes</th>
                  <th>Puntos acumulados</th>
                </tr>
              </thead>
              <tbody>
                {grados.map(g => (
                  <tr key={g.id_grado}>
                    <td>{g.nombre} (nivel {g.nivel})</td>
                    <td>{g.estudiantes}</td>
                    <td>{g.puntos_acumulados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-lg mb-3">Ranking</h2>
          <div className="grid md:grid-cols-3 gap-2 mb-3">
            <select className="input" value={grado} onChange={e => setGrado(e.target.value)}>
              <option value="">Todos los grados</option>
              {grados.map(g => (
                <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
              ))}
            </select>
            <input className="input" type="number" min="1" value={limit} onChange={e => setLimit(parseInt(e.target.value || '10'))} />
            <button onClick={loadRanking} className="btn-primary">Buscar</button>
          </div>

          {ranking.length === 0 ? (
            <div className="text-sm text-slate-500">Sin ranking cargado.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Grado</th>
                  <th>Acumulados</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, index) => (
                  <tr key={r.id_estudiante}>
                    <td>{index + 1}</td>
                    <td>{r.nombre} {r.apellido}</td>
                    <td>{r.grado?.nombre}</td>
                    <td>{r.puntos_acumulados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </AppLayout>
  )
}
