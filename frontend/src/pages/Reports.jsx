import React, { useEffect, useState } from 'react'
import API from '../api'
import { Link } from 'react-router-dom'

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
    <div className="p-8 page-enter">
      <header className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl">Reportes</h1>
          <p className="text-sm text-slate-500">Resumen general y ranking de puntos.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="px-3 py-2 bg-slate-800 text-white rounded">Dashboard</Link>
          <Link to="/tienda" className="px-3 py-2 bg-amber-500 text-white rounded">Tienda</Link>
        </div>
      </header>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <section className="grid md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Estudiantes</div>
          <div className="text-2xl">{summary?.estudiantes ?? '-'}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Articulos</div>
          <div className="text-2xl">{summary?.articulos ?? '-'}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Transacciones</div>
          <div className="text-2xl">{summary?.transacciones ?? '-'}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Canjes</div>
          <div className="text-2xl">{summary?.canjes ?? '-'}</div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h2 className="text-lg mb-3">Totales por grado</h2>
          {grados.length === 0 ? (
            <div className="text-sm text-slate-500">Sin datos.</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="p-2 text-left">Grado</th>
                  <th className="p-2 text-left">Estudiantes</th>
                  <th className="p-2 text-left">Puntos acumulados</th>
                </tr>
              </thead>
              <tbody>
                {grados.map(g => (
                  <tr key={g.id_grado} className="border-t">
                    <td className="p-2 text-sm">{g.nombre} (nivel {g.nivel})</td>
                    <td className="p-2 text-sm">{g.estudiantes}</td>
                    <td className="p-2 text-sm">{g.puntos_acumulados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h2 className="text-lg mb-3">Ranking</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <input className="border p-2" placeholder="ID grado (opcional)" value={grado} onChange={e => setGrado(e.target.value)} />
            <input className="border p-2" type="number" min="1" value={limit} onChange={e => setLimit(parseInt(e.target.value || '10'))} />
            <button onClick={loadRanking} className="bg-slate-900 text-white px-4 rounded">Buscar</button>
          </div>

          {ranking.length === 0 ? (
            <div className="text-sm text-slate-500">Sin ranking cargado.</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="p-2 text-left">Estudiante</th>
                  <th className="p-2 text-left">Grado</th>
                  <th className="p-2 text-left">Acumulados</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(r => (
                  <tr key={r.id_estudiante} className="border-t">
                    <td className="p-2 text-sm">{r.nombre} {r.apellido}</td>
                    <td className="p-2 text-sm">{r.grado?.nombre}</td>
                    <td className="p-2 text-sm">{r.puntos_acumulados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
