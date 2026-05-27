const express = require('express');
const router = express.Router();
const prisma = require('../db');

// POST /canjes - estudiante canjeando artículos
// Body: { id_estudiante, items: [{ id_articulo, cantidad }] }
router.post('/', async (req, res, next) => {
  const payload = req.body;
  try {
    const { id_estudiante, id_responsable, items } = payload;
    if (!id_estudiante || !id_responsable || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Faltan datos' });

    // Fetch current precios and availability
    const artikIds = items.map(i => i.id_articulo);
    const articulos = await prisma.articulo.findMany({ where: { id_articulo: { in: artikIds } } });
    const artMap = {};
    articulos.forEach(a => artMap[a.id_articulo] = a);

    // compute total puntos and validate stock
    let totalPuntos = 0;
    for (const it of items) {
      const a = artMap[it.id_articulo];
      if (!a) return res.status(400).json({ error: `Artículo ${it.id_articulo} no existe` });
      if (a.stock_disponible < it.cantidad) return res.status(400).json({ error: `Stock insuficiente para ${a.nombre}` });
      totalPuntos += a.precio_puntos * it.cantidad;
    }

    // comprobar saldo del estudiante
    const estudiante = await prisma.estudiante.findUnique({ where: { id_estudiante: parseInt(id_estudiante) } });
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });
    if (estudiante.puntos_disponibles < totalPuntos) return res.status(400).json({ error: 'Saldo insuficiente' });

    // Ejecutar transacción atómica: crear TRANSACCION(descuento) + CANJE + DETALLE_CANJE
    const result = await prisma.$transaction(async (tx) => {
      const trans = await tx.transaccion.create({ data: { id_estudiante: parseInt(id_estudiante), id_responsable: parseInt(id_responsable), tipo: 'descuento', puntos: totalPuntos, descripcion: 'Canje en tienda' } });
      const canje = await tx.canje.create({ data: { id_transaccion: trans.id_transaccion, estado: 'completado' } });

      for (const it of items) {
        const art = artMap[it.id_articulo];
        await tx.detalleCanje.create({ data: { id_canje: canje.id_canje, id_articulo: it.id_articulo, cantidad: parseInt(it.cantidad), puntos_unitarios: art.precio_puntos } });
      }

      return { transaccionId: trans.id_transaccion, canjeId: canje.id_canje };
    });

    res.status(201).json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
