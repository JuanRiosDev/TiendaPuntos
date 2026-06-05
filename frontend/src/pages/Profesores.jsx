import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import AppLayout from '../components/AppLayout'
import StatCard from '../components/StatCard'

const ROLES = ['admin', 'docente', 'monitor']

const EMPTY_FORM = { nombre: '', apellido: '', usuario: '', contrasena: '', rol: 'docente' }

export default function Profesores() {
  const [profesores, setProfesores] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ search: '', activo: 'all' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [editModal, setEditModal] = useState(null)
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.activo !== 'all') params.activo = filters.activo
      const res = await API.get('/responsables', { params })
      setProfesores(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await API.post('/responsables', form)
      setForm(EMPTY_FORM)
      load()
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  function openEdit(p) {
    setEditModal({ id_responsable: p.id_responsable, nombre: p.nombre, apellido: p.apellido, usuario: p.usuario, rol: p.rol })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    try {
      await API.put(`/responsables/${editModal.id_responsable}`, {
        nombre: editModal.nombre,
        apellido: editModal.apellido,
        usuario: editModal.usuario,
        rol: editModal.rol
      })
      setEditModal(null)
      load()
    } catch (err) { console.error(err) }
    setEditSaving(false)
  }

  async function softDelete(id) {
    if (!confirm('¿Desactivar este responsable?')) return
    try {
      await API.delete(`/responsables/${id}`)
      load()
    } catch (err) { console.error(err) }
  }

  async function reactivate(id) {
    try {
      await API.put(`/responsables/${id}`, { activo: true })
      load()
    } catch (err) { console.error(err) }
  }

  const total = profesores.length
  const activos = useMemo(() => profesores.filter(p => p.activo).length, [profesores])
  const inactivos = total - activos

  const rolBadge = (rol) => {
    const map = { admin: 'badge-positive', docente: 'badge-neutral', monitor: 'badge-amber' }
    return map[rol] || 'badge-neutral'
  }

  return (
    <AppLayout
      title="Gestión de profesores"
      subtitle="Registra, edita y administra los responsables del sistema."
      actions={<button onClick={load} className="btn-soft">Recargar</button>}
    >
      {/* Modal de edición */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg mb-4">Editar responsable #{editModal.id_responsable}</h2>
            <form onSubmit={saveEdit} className="grid gap-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={editModal.nombre} onChange={e => setEditModal({ ...editModal, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input className="input" value={editModal.apellido} onChange={e => setEditModal({ ...editModal, apellido: e.target.value })} required />
              </div>
              <div>
                <label className="label">Usuario</label>
                <input className="input" value={editModal.usuario} onChange={e => setEditModal({ ...editModal, usuario: e.target.value })} required />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={editModal.rol} onChange={e => setEditModal({ ...editModal, rol: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
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
                placeholder="Nombre, apellido o usuario"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
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
          <h2 className="text-lg">Crear responsable</h2>
          <form onSubmit={create} className="grid md:grid-cols-2 gap-3 mt-4">
            <input className="input" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            <input className="input" placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
            <input className="input" placeholder="Usuario (único)" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} required />
            <input className="input" placeholder="Contraseña" type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} required />
            <select className="input" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn-accent" disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</button>
          </form>
        </div>
      </section>

      <section className="card p-5 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Listado</h2>
          <div className="text-sm text-slate-500">{loading ? 'Cargando...' : `${profesores.length} registros`}</div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profesores.map(p => (
                <tr key={p.id_responsable}>
                  <td>{p.id_responsable}</td>
                  <td>{p.nombre} {p.apellido}</td>
                  <td>{p.usuario}</td>
                  <td><span className={rolBadge(p.rol)}>{p.rol}</span></td>
                  <td>
                    <span className={p.activo ? 'badge-positive' : 'badge-negative'}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="btn-soft text-xs py-1 px-2">Editar</button>
                      {p.activo
                        ? <button onClick={() => softDelete(p.id_responsable)} className="text-xs py-1 px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Desactivar</button>
                        : <button onClick={() => reactivate(p.id_responsable)} className="text-xs py-1 px-2 rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50">Reactivar</button>
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
