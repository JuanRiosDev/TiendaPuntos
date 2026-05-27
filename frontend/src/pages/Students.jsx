import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import AppLayout from '../components/AppLayout'
import StatCard from '../components/StatCard'

export default function Students(){
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ search: '', grado: '', activo: 'all' })
  const [form, setForm] = useState({ id_grado: '', nombre: '', apellido: '', documento: '' })

  async function load(){
    setLoading(true)
    try{
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.grado) params.grado = filters.grado
      if (filters.activo !== 'all') params.activo = filters.activo
      const res = await API.get('/estudiantes', { params })
      setStudents(res.data)
    }catch(err){ console.error(err) }
    setLoading(false)
  }

  async function loadGrades(){
    try{
      const res = await API.get('/reportes/grados')
      setGrades(res.data)
      if (!form.id_grado && res.data.length > 0) {
        setForm(prev => ({ ...prev, id_grado: res.data[0].id_grado }))
      }
    }catch(err){ console.error(err) }
  }

  useEffect(()=>{
    load()
    loadGrades()
  }, [])

  async function create(e){
    e.preventDefault()
    setSaving(true)
    try{
      await API.post('/estudiantes', { ...form, id_grado: parseInt(form.id_grado) })
      setForm(prev => ({ ...prev, nombre: '', apellido: '', documento: '' }))
      load()
    }catch(err){ console.error(err) }
    setSaving(false)
  }

  const total = students.length
  const activos = useMemo(() => students.filter(s => s.activo).length, [students])
  const inactivos = total - activos

  return (
    <AppLayout
      title="Gestion de estudiantes"
      subtitle="Registra nuevos estudiantes, filtra por grado y revisa saldo disponible."
      actions={<button onClick={load} className="btn-soft">Recargar</button>}
    >
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard label="Total" value={total} tone="slate" />
        <StatCard label="Activos" value={activos} tone="teal" />
        <StatCard label="Inactivos" value={inactivos} tone="amber" />
      </section>

      <section className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="text-lg">Filtros</h2>
          <div className="grid gap-3 mt-4">
            <div>
              <label className="label">Buscar</label>
              <input
                className="input"
                placeholder="Nombre, apellido o documento"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Grado</label>
              <select className="input" value={filters.grado} onChange={e => setFilters({ ...filters, grado: e.target.value })}>
                <option value="">Todos</option>
                {grades.map(g => (
                  <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={filters.activo} onChange={e => setFilters({ ...filters, activo: e.target.value })}>
                <option value="all">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <button onClick={load} className="btn-primary">Aplicar filtros</button>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="text-lg">Crear estudiante</h2>
          <form onSubmit={create} className="grid md:grid-cols-4 gap-3 mt-4">
            <select className="input" value={form.id_grado} onChange={e => setForm({ ...form, id_grado: e.target.value })}>
              <option value="">Grado</option>
              {grades.map(g => (
                <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
              ))}
            </select>
            <input className="input" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input className="input" placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
            <div className="flex gap-2">
              <input className="input" placeholder="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} />
              <button className="btn-accent" disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</button>
            </div>
          </form>
        </div>
      </section>

      <section className="card p-5 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Listado</h2>
          <div className="text-sm text-slate-500">{loading ? 'Cargando...' : `${students.length} registros`}</div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Grado</th>
                <th>Puntos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s=> (
                <tr key={s.id_estudiante}>
                  <td>{s.id_estudiante}</td>
                  <td>{s.nombre} {s.apellido}</td>
                  <td>{s.documento}</td>
                  <td>{grades.find(g => g.id_grado === s.id_grado)?.nombre || s.id_grado}</td>
                  <td>{s.puntos_disponibles}</td>
                  <td>
                    <span className={s.activo ? 'badge-positive' : 'badge-negative'}>{s.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  )
}
