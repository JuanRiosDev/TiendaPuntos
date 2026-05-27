import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import AppLayout from '../components/AppLayout'

export default function Store(){
  const [articulos, setArticulos] = useState([])
  const [cart, setCart] = useState([])
  const [idEstudiante, setIdEstudiante] = useState('')
  const [idResponsable, setIdResponsable] = useState('')
  const [query, setQuery] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [studentInfo, setStudentInfo] = useState(null)
  const [studentLoading, setStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState(null)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    API.get('/articulos')
      .then(res => setArticulos(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    setStudentInfo(null)
    setStudentError(null)
  }, [idEstudiante])

  const totalPuntos = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.precio_puntos * it.cantidad, 0)
  }, [cart])

  const filtered = useMemo(() => {
    return articulos.filter(a => {
      const matches = `${a.nombre} ${a.descripcion || ''}`.toLowerCase().includes(query.toLowerCase())
      const available = !onlyAvailable || a.stock_disponible > 0
      return matches && available
    })
  }, [articulos, query, onlyAvailable])

  const balanceOk = studentInfo ? studentInfo.puntos_disponibles >= totalPuntos : null

  function addToCart(a){
    setError(null)
    setMessage(null)
    setCart(prev => {
      const found = prev.find(p => p.id_articulo === a.id_articulo)
      if (found) {
        const nextQty = Math.min(found.cantidad + 1, a.stock_disponible)
        return prev.map(p => p.id_articulo === a.id_articulo ? { ...p, cantidad: nextQty } : p)
      }
      return [...prev, { id_articulo: a.id_articulo, nombre: a.nombre, precio_puntos: a.precio_puntos, cantidad: 1, stock_disponible: a.stock_disponible }]
    })
  }

  function updateQty(id, cantidad){
    setCart(prev => prev.map(p => {
      if (p.id_articulo !== id) return p
      const safe = Math.max(1, Math.min(cantidad, p.stock_disponible))
      return { ...p, cantidad: safe }
    }))
  }

  function removeItem(id){
    setCart(prev => prev.filter(p => p.id_articulo !== id))
  }

  async function loadStudent(){
    setStudentError(null)
    setStudentInfo(null)
    if (!idEstudiante) return setStudentError('Ingresa el ID del estudiante.')
    setStudentLoading(true)
    try{
      const res = await API.get(`/estudiantes/${idEstudiante}`)
      setStudentInfo(res.data)
    }catch(err){
      setStudentError(err.response?.data?.error || 'No se pudo consultar estudiante')
    }
    setStudentLoading(false)
  }

  async function checkout(){
    setError(null)
    setMessage(null)
    if (!idEstudiante) return setError('Ingresa el ID del estudiante.')
    if (!idResponsable) return setError('Ingresa el ID del responsable.')
    if (cart.length === 0) return setError('El carrito esta vacio.')
    if (!studentInfo) return setError('Consulta el estudiante antes de canjear.')
    if (balanceOk === false) return setError('Saldo insuficiente para este canje.')

    try{
      const payload = {
        id_estudiante: parseInt(idEstudiante),
        id_responsable: parseInt(idResponsable),
        items: cart.map(c => ({ id_articulo: c.id_articulo, cantidad: c.cantidad }))
      }
      const res = await API.post('/canjes', payload)
      setMessage(`Canje creado. Transaccion ${res.data.transaccionId}, Canje ${res.data.canjeId}.`)
      setCart([])
    }catch(err){
      setError(err.response?.data?.error || 'Error al canjear')
    }
  }

  return (
    <AppLayout
      title="Tienda de puntos"
      subtitle="Catalogo publico con stock y precio en puntos."
      actions={<button onClick={() => setCart([])} className="btn-soft">Vaciar carrito</button>}
    >
      <div className="card p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="label">Buscar articulo</label>
            <input className="input" placeholder="Cuaderno, pelota..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} />
              Solo disponibles
            </label>
            <span className="badge-neutral">{filtered.length} items</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-4 stagger">
            {filtered.map(a => (
              <div key={a.id_articulo} className="card p-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl">{a.nombre}</h3>
                  <span className="badge-neutral">{a.precio_puntos} pts</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{a.descripcion || 'Sin descripcion'}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-500">Stock: {a.stock_disponible}</span>
                  <button
                    disabled={a.stock_disponible <= 0}
                    onClick={() => addToCart(a)}
                    className={a.stock_disponible <= 0 ? 'btn-soft opacity-60' : 'btn-warm'}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="card p-5 h-fit">
          <h2 className="text-lg mb-3">Carrito</h2>
          {cart.length === 0 && <div className="text-sm text-slate-500">Sin items.</div>}
          <div className="grid gap-3">
            {cart.map(c => (
              <div key={c.id_articulo} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-sm">{c.nombre}</div>
                  <div className="text-xs text-slate-500">{c.precio_puntos} pts c/u</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={c.stock_disponible}
                    value={c.cantidad}
                    onChange={(e) => updateQty(c.id_articulo, parseInt(e.target.value || '1'))}
                    className="w-16 input"
                  />
                  <button onClick={() => removeItem(c.id_articulo)} className="text-xs text-rose-600">Quitar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="label">ID estudiante</label>
              <div className="flex gap-2">
                <input value={idEstudiante} onChange={e => setIdEstudiante(e.target.value)} className="input" placeholder="Ej: 1" />
                <button onClick={loadStudent} className="btn-soft">Consultar</button>
              </div>
              {studentLoading && <div className="text-xs text-slate-400 mt-1">Consultando...</div>}
              {studentError && <div className="text-xs text-rose-600 mt-1">{studentError}</div>}
              {studentInfo && (
                <div className="text-xs text-slate-500 mt-1">
                  {studentInfo.nombre} {studentInfo.apellido} - {studentInfo.puntos_disponibles} pts disponibles
                </div>
              )}
            </div>
            <div>
              <label className="label">ID responsable</label>
              <input value={idResponsable} onChange={e => setIdResponsable(e.target.value)} className="input" placeholder="Ej: 1" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-lg">{totalPuntos} pts</span>
          </div>

          {balanceOk === true && <div className="badge-positive mt-3">Saldo suficiente</div>}
          {balanceOk === false && <div className="badge-negative mt-3">Saldo insuficiente</div>}

          {error && <div className="text-rose-600 text-sm mt-3">{error}</div>}
          {message && <div className="text-emerald-700 text-sm mt-3">{message}</div>}

          <button
            onClick={checkout}
            className="btn-primary w-full mt-4"
            disabled={cart.length === 0 || !idEstudiante || !idResponsable || balanceOk === false}
          >
            Canjear
          </button>
        </aside>
      </div>
    </AppLayout>
  )
}
