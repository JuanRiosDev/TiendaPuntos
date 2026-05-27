const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /articulos - público
router.get('/', async (req, res, next) => {
  try {
    const articulos = await prisma.articulo.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
    res.json(articulos);
  } catch (err) { next(err); }
});

// GET /articulos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const articulo = await prisma.articulo.findUnique({ where: { id_articulo: id } });
    if (!articulo) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(articulo);
  } catch (err) { next(err); }
});

// POST /articulos (admin)
router.post('/', async (req, res, next) => {
  try {
    const { nombre, descripcion, precio_puntos, stock_total } = req.body;
    if (!nombre || precio_puntos == null) return res.status(400).json({ error: 'Faltan campos requeridos' });
    const articulo = await prisma.articulo.create({ data: {
      nombre, descripcion, precio_puntos, stock_total: stock_total || 0, stock_disponible: stock_total || 0, activo: true
    }});
    res.status(201).json(articulo);
  } catch (err) { next(err); }
});

// PUT /articulos/:id (admin)
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, precio_puntos, stock_total, activo } = req.body;
    const existing = await prisma.articulo.findUnique({ where: { id_articulo: id } });
    if (!existing) return res.status(404).json({ error: 'Artículo no encontrado' });

    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (precio_puntos !== undefined) data.precio_puntos = precio_puntos;
    if (activo !== undefined) data.activo = activo;

    if (stock_total !== undefined) {
      // ajustar stock_disponible en la misma magnitud del cambio de stock_total
      const delta = stock_total - existing.stock_total;
      data.stock_total = stock_total;
      data.stock_disponible = existing.stock_disponible + delta;
      if (data.stock_disponible < 0) return res.status(400).json({ error: 'Resultado de stock_disponible negativo' });
    }

    const updated = await prisma.articulo.update({ where: { id_articulo: id }, data });
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /articulos/:id/stock (admin) - ajustar stock_total increment
router.patch('/:id/stock', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { delta } = req.body; // positivo o negativo
    if (delta == null) return res.status(400).json({ error: 'delta requerido' });
    const existing = await prisma.articulo.findUnique({ where: { id_articulo: id } });
    if (!existing) return res.status(404).json({ error: 'Artículo no encontrado' });
    const new_total = existing.stock_total + parseInt(delta);
    const new_disp = existing.stock_disponible + parseInt(delta);
    if (new_total < 0 || new_disp < 0) return res.status(400).json({ error: 'Stock no puede quedar negativo' });
    const updated = await prisma.articulo.update({ where: { id_articulo: id }, data: { stock_total: new_total, stock_disponible: new_disp } });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
