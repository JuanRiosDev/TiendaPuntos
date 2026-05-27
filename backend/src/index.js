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

app.use('/articulos', articulosRouter);
app.use('/estudiantes', estudiantesRouter);
app.use('/transacciones', transaccionesRouter);
app.use('/canjes', canjesRouter);
app.use('/reportes', reportesRouter);

app.get('/', (req, res) => res.json({ ok: true, version: 'sesion-2-backend' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`TiendaPuntos backend listening on port ${port}`);
});
