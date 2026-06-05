const express = require('express');
const router = express.Router();
const prisma = require('../db');

const safeSelect = {
  id_responsable: true,
  nombre: true,
  apellido: true,
  usuario: true,
  rol: true,
  activo: true
};

// GET /responsables?activo=&search=
router.get('/', async (req, res, next) => {
  try {
    const { activo, search } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { apellido: { contains: search } },
        { usuario: { contains: search } }
      ];
    }
    const responsables = await prisma.responsable.findMany({
      where,
      select: safeSelect,
      orderBy: { nombre: 'asc' }
    });
    res.json(responsables);
  } catch (err) {
    next(err);
  }
});

// GET /responsables/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const responsable = await prisma.responsable.findUnique({
      where: { id_responsable: id },
      select: safeSelect
    });
    if (!responsable) return res.status(404).json({ error: 'Responsable no encontrado' });
    res.json(responsable);
  } catch (err) {
    next(err);
  }
});

// POST /responsables
router.post('/', async (req, res, next) => {
  try {
    const { nombre, apellido, usuario, contrasena, rol } = req.body;
    if (!nombre || !apellido || !usuario || !contrasena || !rol)
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre, apellido, usuario, contrasena, rol' });

    const responsable = await prisma.responsable.create({
      data: { nombre, apellido, usuario, contrasena_hash: contrasena, rol, activo: true },
      select: safeSelect
    });
    res.status(201).json(responsable);
  } catch (err) {
    next(err);
  }
});

// PUT /responsables/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, apellido, usuario, rol, activo } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (apellido !== undefined) data.apellido = apellido;
    if (usuario !== undefined) data.usuario = usuario;
    if (rol !== undefined) data.rol = rol;
    if (activo !== undefined) data.activo = activo;

    const updated = await prisma.responsable.update({
      where: { id_responsable: id },
      data,
      select: safeSelect
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /responsables/:id  (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.responsable.update({
      where: { id_responsable: id },
      data: { activo: false },
      select: safeSelect
    });
    res.json({ ok: true, responsable: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
