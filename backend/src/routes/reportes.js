const express = require('express')
const router = express.Router()
const prisma = require('../db')

// GET /reportes/resumen
router.get('/resumen', async (req, res, next) => {
  try {
    const [estudiantes, articulos, transacciones, canjes] = await Promise.all([
      prisma.estudiante.count(),
      prisma.articulo.count(),
      prisma.transaccion.count(),
      prisma.canje.count()
    ])
    res.json({ estudiantes, articulos, transacciones, canjes })
  } catch (err) {
    next(err)
  }
})

// GET /reportes/ranking?grado=&limit=
router.get('/ranking', async (req, res, next) => {
  try {
    const { grado, limit } = req.query
    const where = {}
    if (grado) where.id_grado = parseInt(grado)

    const ranking = await prisma.estudiante.findMany({
      where,
      include: { grado: true },
      orderBy: { puntos_acumulados: 'desc' },
      take: limit ? parseInt(limit) : 10
    })

    res.json(ranking)
  } catch (err) {
    next(err)
  }
})

// GET /reportes/grados
router.get('/grados', async (req, res, next) => {
  try {
    const grouped = await prisma.estudiante.groupBy({
      by: ['id_grado'],
      _count: { _all: true },
      _sum: { puntos_acumulados: true, puntos_disponibles: true }
    })

    if (grouped.length === 0) return res.json([])

    const grados = await prisma.grado.findMany({
      where: { id_grado: { in: grouped.map(g => g.id_grado) } }
    })
    const map = {}
    grados.forEach(g => { map[g.id_grado] = g })

    const result = grouped.map(g => ({
      id_grado: g.id_grado,
      nombre: map[g.id_grado]?.nombre || null,
      nivel: map[g.id_grado]?.nivel || null,
      estudiantes: g._count._all,
      puntos_acumulados: g._sum.puntos_acumulados || 0,
      puntos_disponibles: g._sum.puntos_disponibles || 0
    }))

    res.json(result)
  } catch (err) {
    next(err)
  }
})

module.exports = router
