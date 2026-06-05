require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routers
const estudiantesRouter = require('./routes/estudiantes');
const articulosRouter = require('./routes/articulos');
const transaccionesRouter = require('./routes/transacciones');
const canjesRouter = require('./routes/canjes');
const reportesRouter = require('./routes/reportes');
const responsablesRouter = require('./routes/responsables');

app.use('/articulos', articulosRouter);
app.use('/estudiantes', estudiantesRouter);
app.use('/transacciones', transaccionesRouter);
app.use('/canjes', canjesRouter);
app.use('/reportes', reportesRouter);
app.use('/responsables', responsablesRouter);

app.get('/', (req, res) => res.json({ ok: true, version: 'sesion-2-backend' }));

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  const code = err.code; // Prisma error codes

  if (code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  if (code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'campo';
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
  }
  if (code === 'P2003') {
    return res.status(409).json({ error: 'No se puede eliminar porque tiene registros relacionados' });
  }
  if (code === 'P2000') {
    return res.status(400).json({ error: 'El valor ingresado es demasiado largo' });
  }
  if (code === 'P2014') {
    return res.status(409).json({ error: 'La relación requerida no existe' });
  }

  console.error(err);
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Error interno del servidor';
  res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`TiendaPuntos backend listening on port ${port}`);
});
