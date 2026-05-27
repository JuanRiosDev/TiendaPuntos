import React, { useState } from 'react'
import API from '../api'
import AppLayout from '../components/AppLayout'

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
    <AppLayout
      title="Historial de puntos"
      subtitle="Consulta la bitacora por estudiante y revisa cambios de saldo."
      actions={<button onClick={load} className="btn-soft">Actualizar</button>}
    >
      <div className="card p-5 max-w-2xl">
        <label className="label">ID estudiante</label>
        <div className="flex gap-2 mt-2">
          <input value={idEstudiante} onChange={e => setIdEstudiante(e.target.value)} className="input" placeholder="Ej: 1" />
          <button onClick={load} className="btn-accent">Buscar</button>
        </div>
        {error && <div className="text-rose-600 text-sm mt-3">{error}</div>}
        {movs.length > 0 && <div className="text-xs text-slate-500 mt-2">{movs.length} movimientos</div>}
      </div>

      <div className="card p-5 mt-6">
        {movs.length === 0 ? (
          <div className="text-sm text-slate-500">Sin movimientos.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Antes</th>
                <th>Despues</th>
                <th>Cambio</th>
              </tr>
            </thead>
            <tbody>
              {movs.map(m => {
                const delta = m.puntos_despues - m.puntos_antes
                const badgeClass = delta >= 0 ? 'badge-positive' : 'badge-negative'
                return (
                  <tr key={m.id_registro}>
                    <td>{new Date(m.fecha).toLocaleString()}</td>
                    <td>{m.motivo}</td>
                    <td>{m.puntos_antes}</td>
                    <td>{m.puntos_despues}</td>
                    <td><span className={badgeClass}>{delta >= 0 ? `+${delta}` : delta}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  )
}
