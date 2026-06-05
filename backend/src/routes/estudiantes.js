const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /estudiantes?grado=&activo=&search=&limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const { grado, activo, search, limit, offset } = req.query;
    const where = {};
    if (grado) where.id_grado = parseInt(grado);
    if (activo !== undefined) where.activo = activo === 'true';
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { apellido: { contains: search } },
        { documento: { contains: search } }
      ];
    }

    const estudiantes = await prisma.estudiante.findMany({
      where,
      take: limit ? parseInt(limit) : 100,
      skip: offset ? parseInt(offset) : 0,
      orderBy: { nombre: 'asc' }
    });
    res.json(estudiantes);
  } catch (err) {
    next(err);
  }
});

// GET /estudiantes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const estudiante = await prisma.estudiante.findUnique({ where: { id_estudiante: id } });
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(estudiante);
  } catch (err) {
    next(err);
  }
});

// POST /estudiantes  (admin|docente)
router.post('/', async (req, res, next) => {
  try {
    const { id_grado, nombre, apellido, documento, puntos_disponibles } = req.body;
    if (!id_grado || !nombre || !apellido || !documento) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const estudiante = await prisma.estudiante.create({ data: {
      id_grado: id_grado,
      nombre,
      apellido,
      documento,
      puntos_disponibles: puntos_disponibles || 0,
      puntos_acumulados: puntos_disponibles || 0,
      activo: true
    }});
    res.status(201).json(estudiante);
  } catch (err) {
    next(err);
  }
});

// PUT /estudiantes/:id  (admin|docente)
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const payload = req.body;
    // Prevent direct puntos_disponibles update here; business logic should use TRANSACCION
    delete payload.puntos_disponibles;
    delete payload.puntos_acumulados;

    const updated = await prisma.estudiante.update({ where: { id_estudiante: id }, data: payload });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /estudiantes/:id  (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.estudiante.update({ where: { id_estudiante: id }, data: { activo: false } });
    res.json({ ok: true, estudiante: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /estudiantes/:id/permanente (hard delete, solo si ya está inactivo)
router.delete('/:id/permanente', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const estudiante = await prisma.estudiante.findUnique({ where: { id_estudiante: id } });
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });
    if (estudiante.activo) return res.status(400).json({ error: 'Solo se pueden eliminar permanentemente estudiantes inactivos' });
    await prisma.estudiante.delete({ where: { id_estudiante: id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /estudiantes/:id/movimientos
router.get('/:id/movimientos', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const movimientos = await prisma.bitacoraPuntos.findMany({ where: { id_estudiante: id }, orderBy: { fecha: 'desc' } });
    res.json(movimientos);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
