const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /transacciones?estudiante=&limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const { estudiante, limit, offset } = req.query;
    const where = {};
    if (estudiante) where.id_estudiante = parseInt(estudiante);
    const trans = await prisma.transaccion.findMany({ where, take: limit?parseInt(limit):100, skip: offset?parseInt(offset):0, orderBy: { fecha: 'desc' } });
    res.json(trans);
  } catch (err) { next(err); }
});

// POST /transacciones (admin|docente) - crear transaccion (asignacion/ajuste/descuento)
router.post('/', async (req, res, next) => {
  try {
    const { id_estudiante, id_responsable, tipo, puntos, descripcion } = req.body;
    if (!id_estudiante || !id_responsable || !tipo || puntos == null) return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (!['asignacion','descuento','ajuste'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });

    // Crear transaccion; triggers en DB actualizarán puntos y bitacora
    const tx = await prisma.transaccion.create({ data: { id_estudiante: parseInt(id_estudiante), id_responsable: parseInt(id_responsable), tipo, puntos: parseInt(puntos), descripcion } });
    res.status(201).json(tx);
  } catch (err) {
    // puede fallar por señal desde trigger
    next(err);
  }
});

module.exports = router;
