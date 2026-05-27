import React, { useEffect, useState } from 'react'
import API from '../api'

export default function Students(){
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id_grado: 1, nombre: '', apellido: '', documento: '' })

  async function load(){
    setLoading(true)
    try{
      const res = await API.get('/estudiantes')
      setStudents(res.data)
    }catch(err){ console.error(err) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  async function create(e){
    e.preventDefault()
    try{
      await API.post('/estudiantes', form)
      setForm({ id_grado: 1, nombre: '', apellido: '', documento: '' })
      load()
    }catch(err){ console.error(err) }
  }

  return (
    <div className="p-8 page-enter">
      <h1 className="text-3xl mb-4">Gestion de Estudiantes</h1>
      <div className="mb-6">
        <form onSubmit={create} className="grid grid-cols-4 gap-2 max-w-xl">
          <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} className="p-2 border" />
          <input placeholder="Apellido" value={form.apellido} onChange={e=>setForm({...form, apellido: e.target.value})} className="p-2 border" />
          <input placeholder="Documento" value={form.documento} onChange={e=>setForm({...form, documento: e.target.value})} className="p-2 border" />
          <button className="bg-green-600 text-white p-2 rounded">Crear</button>
        </form>
      </div>

      {loading ? <div>Cargando...</div> : (
        <table className="min-w-full bg-white">
          <thead><tr><th className="p-2">ID</th><th className="p-2">Nombre</th><th className="p-2">Documento</th><th className="p-2">Puntos</th></tr></thead>
          <tbody>
            {students.map(s=> (
              <tr key={s.id_estudiante} className="border-t">
                <td className="p-2">{s.id_estudiante}</td>
                <td className="p-2">{s.nombre} {s.apellido}</td>
                <td className="p-2">{s.documento}</td>
                <td className="p-2">{s.puntos_disponibles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
