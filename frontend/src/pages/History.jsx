import React, { useState } from 'react'
import API from '../api'
import { Link } from 'react-router-dom'

export default function History(){
  const [idEstudiante, setIdEstudiante] = useState('')
  const [movs, setMovs] = useState([])
  const [error, setError] = useState(null)

  async function load(){
    setError(null)
    if (!idEstudiante) return setError('Ingresa el ID del estudiante.')
    try{
      const res = await API.get(`/estudiantes/${idEstudiante}/movimientos`)
      setMovs(res.data)
    }catch(err){
      setError(err.response?.data?.error || 'No se pudo cargar historial')
    }
  }

  return (
    <div className="p-8 page-enter">
      <header className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl">Historial de Puntos</h1>
          <p className="text-sm text-slate-500">Consulta la bitacora por estudiante.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="px-3 py-2 bg-slate-800 text-white rounded">Dashboard</Link>
          <Link to="/tienda" className="px-3 py-2 bg-amber-500 text-white rounded">Tienda</Link>
        </div>
      </header>

      <div className="bg-white border rounded-xl p-4 shadow-sm max-w-2xl">
        <label className="text-sm">ID estudiante</label>
        <div className="flex gap-2 mt-1">
          <input value={idEstudiante} onChange={e => setIdEstudiante(e.target.value)} className="border p-2 flex-1" placeholder="Ej: 1" />
          <button onClick={load} className="bg-emerald-600 text-white px-4 rounded">Buscar</button>
        </div>
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
      </div>

      <div className="mt-6">
        {movs.length === 0 ? (
          <div className="text-sm text-slate-500">Sin movimientos.</div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Motivo</th>
                <th className="p-2 text-left">Antes</th>
                <th className="p-2 text-left">Despues</th>
              </tr>
            </thead>
            <tbody>
              {movs.map(m => (
                <tr key={m.id_registro} className="border-t">
                  <td className="p-2 text-sm">{new Date(m.fecha).toLocaleString()}</td>
                  <td className="p-2 text-sm">{m.motivo}</td>
                  <td className="p-2 text-sm">{m.puntos_antes}</td>
                  <td className="p-2 text-sm">{m.puntos_despues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
