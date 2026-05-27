import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import { Link } from 'react-router-dom'

export default function Store(){
  const [articulos, setArticulos] = useState([])
  const [cart, setCart] = useState([])
  const [idEstudiante, setIdEstudiante] = useState('')
  const [idResponsable, setIdResponsable] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    API.get('/articulos')
      .then(res => setArticulos(res.data))
      .catch(err => console.error(err))
  }, [])

  const totalPuntos = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.precio_puntos * it.cantidad, 0)
  }, [cart])

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

  async function checkout(){
    setError(null)
    setMessage(null)
    if (!idEstudiante) return setError('Ingresa el ID del estudiante.')
    if (!idResponsable) return setError('Ingresa el ID del responsable.')
    if (cart.length === 0) return setError('El carrito esta vacio.')

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
    <div className="p-8 page-enter">
      <header className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl">Tienda de Puntos</h1>
          <p className="text-sm text-slate-500">Catalogo publico con stock y precio en puntos.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="px-3 py-2 bg-slate-800 text-white rounded">Dashboard</Link>
          <Link to="/historial" className="px-3 py-2 bg-emerald-600 text-white rounded">Historial</Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-4 stagger">
            {articulos.map(a => (
              <div key={a.id_articulo} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl">{a.nombre}</h3>
                  <span className="text-sm px-2 py-1 rounded bg-slate-100">{a.precio_puntos} pts</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{a.descripcion || 'Sin descripcion'}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-500">Stock: {a.stock_disponible}</span>
                  <button
                    disabled={a.stock_disponible <= 0}
                    onClick={() => addToCart(a)}
                    className={`px-3 py-2 rounded ${a.stock_disponible <= 0 ? 'bg-slate-200 text-slate-400' : 'bg-amber-500 text-white'}`}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border bg-white p-4 shadow-sm h-fit">
          <h2 className="text-lg mb-3">Carrito</h2>
          {cart.length === 0 && <div className="text-sm text-slate-500">Sin items.</div>}
          <div className="grid gap-3">
            {cart.map(c => (
              <div key={c.id_articulo} className="flex items-center justify-between border-b pb-2">
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
                    className="w-16 border p-1"
                  />
                  <button onClick={() => removeItem(c.id_articulo)} className="text-xs text-red-600">Quitar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-sm">ID estudiante</label>
              <input value={idEstudiante} onChange={e => setIdEstudiante(e.target.value)} className="w-full border p-2 mt-1" placeholder="Ej: 1" />
            </div>
            <div>
              <label className="text-sm">ID responsable</label>
              <input value={idResponsable} onChange={e => setIdResponsable(e.target.value)} className="w-full border p-2 mt-1" placeholder="Ej: 1" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-lg">{totalPuntos} pts</span>
          </div>

          {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
          {message && <div className="text-emerald-700 text-sm mt-3">{message}</div>}

          <button onClick={checkout} className="w-full mt-4 bg-slate-900 text-white p-2 rounded">Canjear</button>
        </aside>
      </div>
    </div>
  )
}
