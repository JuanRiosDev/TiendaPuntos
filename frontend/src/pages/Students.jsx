import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import AppLayout from '../components/AppLayout'
import StatCard from '../components/StatCard'

const EMPTY_EDIT = { id_estudiante: null, id_grado: '', nombre: '', apellido: '', documento: '' }

export default function Students() {
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ search: '', grado: '', activo: 'all' })
  const [form, setForm] = useState({ id_grado: '', nombre: '', apellido: '', documento: '' })
  const [editModal, setEditModal] = useState(null)
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.grado) params.grado = filters.grado
      if (filters.activo !== 'all') params.activo = filters.activo
      const res = await API.get('/estudiantes', { params })
      setStudents(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function loadGrades() {
    try {
      const res = await API.get('/reportes/grados')
      setGrades(res.data)
      if (!form.id_grado && res.data.length > 0) {
        setForm(prev => ({ ...prev, id_grado: res.data[0].id_grado }))
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    load()
    loadGrades()
  }, [])

  async function create(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await API.post('/estudiantes', { ...form, id_grado: parseInt(form.id_grado) })
      setForm(prev => ({ ...prev, nombre: '', apellido: '', documento: '' }))
      load()
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  function openEdit(s) {
    setEditModal({ id_estudiante: s.id_estudiante, id_grado: s.id_grado, nombre: s.nombre, apellido: s.apellido, documento: s.documento })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    try {
      await API.put(`/estudiantes/${editModal.id_estudiante}`, {
        id_grado: parseInt(editModal.id_grado),
        nombre: editModal.nombre,
        apellido: editModal.apellido,
        documento: editModal.documento
      })
      setEditModal(null)
      load()
    } catch (err) { console.error(err) }
    setEditSaving(false)
  }

  async function softDelete(id) {
    if (!confirm('¿Desactivar este estudiante?')) return
    try {
      await API.delete(`/estudiantes/${id}`)
      load()
    } catch (err) { console.error(err) }
  }

  async function reactivate(id) {
    try {
      await API.put(`/estudiantes/${id}`, { activo: true })
      load()
    } catch (err) { console.error(err) }
  }

  const total = students.length
  const activos = useMemo(() => students.filter(s => s.activo).length, [students])
  const inactivos = total - activos

  return (
    <AppLayout
      title="Gestión de estudiantes"
      subtitle="Registra, edita y administra el estado de los estudiantes."
      actions={<button onClick={load} className="btn-soft">Recargar</button>}
    >
      {/* Modal de edición */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg mb-4">Editar estudiante #{editModal.id_estudiante}</h2>
            <form onSubmit={saveEdit} className="grid gap-3">
              <div>
                <label className="label">Grado</label>
                <select className="input" value={editModal.id_grado} onChange={e => setEditModal({ ...editModal, id_grado: e.target.value })}>
                  {grades.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={editModal.nombre} onChange={e => setEditModal({ ...editModal, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input className="input" value={editModal.apellido} onChange={e => setEditModal({ ...editModal, apellido: e.target.value })} required />
              </div>
              <div>
                <label className="label">Documento</label>
                <input className="input" value={editModal.documento} onChange={e => setEditModal({ ...editModal, documento: e.target.value })} required />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1" disabled={editSaving}>{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
                <button type="button" className="btn-soft" onClick={() => setEditModal(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                {grades.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>)}
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
              {grades.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>)}
            </select>
            <input className="input" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input className="input" placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
            <div className="flex gap-2">
              <input className="input" placeholder="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} />
              <button className="btn-accent" disabled={saving}>{saving ? '...' : 'Crear'}</button>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id_estudiante}>
                  <td>{s.id_estudiante}</td>
                  <td>{s.nombre} {s.apellido}</td>
                  <td>{s.documento}</td>
                  <td>{grades.find(g => g.id_grado === s.id_grado)?.nombre || s.id_grado}</td>
                  <td>{s.puntos_disponibles}</td>
                  <td>
                    <span className={s.activo ? 'badge-positive' : 'badge-negative'}>{s.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="btn-soft text-xs py-1 px-2">Editar</button>
                      {s.activo
                        ? <button onClick={() => softDelete(s.id_estudiante)} className="text-xs py-1 px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Desactivar</button>
                        : <button onClick={() => reactivate(s.id_estudiante)} className="text-xs py-1 px-2 rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50">Reactivar</button>
                      }
                    </div>
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
