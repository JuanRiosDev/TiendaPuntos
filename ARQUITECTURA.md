# Arquitectura y Despliegue — Tienda de Puntos

## Estructura general

```
TiendaPuntos/
├── backend/      ← Node.js + Express + Prisma ORM (API REST)
├── frontend/     ← React + Vite + Tailwind CSS (SPA)
└── sql/          ← Scripts MySQL (esquema, vistas, triggers, procedimientos)
```

El frontend y el backend son dos aplicaciones completamente independientes. Se comunican exclusivamente a través de HTTP usando una API REST.

---

## Cómo funciona la conexión frontend ↔ backend

### 1. Variable de entorno

El frontend necesita saber la URL del backend. Esto se configura con una variable de entorno de Vite:

```
# frontend/.env
VITE_API_URL=http://localhost:4000        ← desarrollo local
VITE_API_URL=https://xxx.railway.app      ← producción
```

Vite expone solo las variables con prefijo `VITE_` al código del navegador. Las demás quedan ocultas por seguridad.

### 2. Cliente Axios centralizado

`frontend/src/api.js` crea una instancia de Axios con la URL base tomada de la variable de entorno:

```js
// frontend/src/api.js
import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000'
})

export default API
```

Todos los componentes y páginas importan este objeto `API` y hacen sus peticiones contra él:

```js
// Ejemplo de uso en un componente
import API from '../api'

const res = await API.get('/estudiantes')          // GET http://backend/estudiantes
await API.post('/estudiantes', { nombre: '...' })  // POST http://backend/estudiantes
await API.put('/estudiantes/5', { nombre: '...' }) // PUT  http://backend/estudiantes/5
await API.delete('/estudiantes/5')                 // DELETE http://backend/estudiantes/5
```

### 3. CORS en el backend

Cuando el frontend (p.ej. `https://tienda.vercel.app`) llama al backend (p.ej. `https://xxx.railway.app`), el navegador bloquea la petición por política de mismo origen (CORS).

El backend habilita CORS con el paquete `cors` de Express:

```js
// backend/src/index.js
const cors = require('cors')
app.use(cors())   // permite peticiones desde cualquier origen
```

En producción se puede restringir a la URL exacta del frontend:

```js
app.use(cors({ origin: 'https://tu-frontend.vercel.app' }))
```

### 4. Flujo de una petición completa

```
Usuario en el navegador
    │
    ▼
React (frontend)
  → import API from '../api'
  → API.get('/estudiantes')
    │
    ▼  HTTP GET https://backend.railway.app/estudiantes
    │  (con header Origin: https://frontend.vercel.app)
    │
    ▼
Express (backend)
  → cors() middleware: añade header Access-Control-Allow-Origin
  → router GET /estudiantes
  → prisma.estudiante.findMany(...)
    │
    ▼
MySQL (Railway)
    │
    ▼  JSON array de estudiantes
    │
    ▼
React actualiza estado → re-render → tabla visible
```

---

## Estructura del backend (API REST)

El backend expone los siguientes recursos:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /estudiantes | Listar estudiantes (filtros: search, grado, activo) |
| POST | /estudiantes | Crear estudiante |
| PUT | /estudiantes/:id | Editar nombre, apellido, grado, documento |
| DELETE | /estudiantes/:id | Desactivar (soft delete: activo=false) |
| GET | /estudiantes/:id/movimientos | Historial de puntos del estudiante |
| GET | /responsables | Listar profesores/responsables |
| POST | /responsables | Crear responsable |
| PUT | /responsables/:id | Editar datos del responsable |
| DELETE | /responsables/:id | Desactivar responsable |
| GET | /articulos | Listar artículos de la tienda |
| POST | /articulos | Crear artículo |
| PUT | /articulos/:id | Editar artículo |
| POST | /transacciones | Asignar/descontar puntos a un estudiante |
| POST | /canjes | Realizar canje (carrito completo, atómico) |
| GET | /reportes/resumen | Estadísticas del dashboard |
| GET | /reportes/ranking | Ranking de estudiantes por puntos |
| GET | /reportes/grados | Totales por grado |

### Cómo Prisma conecta al MySQL

```
DATABASE_URL="mysql://user:pass@host:3306/tienda_puntos"
```

Prisma lee esta variable, genera el cliente tipado (`npx prisma generate`), y provee métodos como:

```js
await prisma.estudiante.findMany({ where: { activo: true } })
await prisma.estudiante.update({ where: { id_estudiante: 5 }, data: { nombre: 'Ana' } })
```

---

## Despliegue en Railway

Railway es una plataforma PaaS donde se despliegan tanto la base de datos MySQL como el backend Node.js.

### Paso 1 — Crear el proyecto en Railway

1. Ir a [railway.app](https://railway.app) e iniciar sesión.
2. Crear un nuevo proyecto: **New Project**.

### Paso 2 — Agregar base de datos MySQL

1. En el proyecto, clic en **Add Service → Database → MySQL**.
2. Railway crea automáticamente la base de datos y genera variables de conexión.
3. En la pestaña **Variables** del servicio MySQL, copiar el valor de `DATABASE_URL` (tiene el formato `mysql://...`).
4. Ejecutar el script de inicialización: en la pestaña **Query** del servicio MySQL (o desde un cliente externo usando las credenciales), pegar y ejecutar el contenido de `sql/session1_init.sql`.

### Paso 3 — Agregar el backend Node.js

1. En el proyecto, clic en **Add Service → GitHub Repo**.
2. Seleccionar el repositorio de TiendaPuntos.
3. En la configuración del servicio:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm run start`
4. En la pestaña **Variables**, agregar:
   ```
   DATABASE_URL=mysql://user:pass@host.railway.internal:3306/railway
   PORT=4000
   ```
   El valor de `DATABASE_URL` se puede referenciar directamente desde el servicio MySQL usando la sintaxis de Railway: `${{MySQL.DATABASE_URL}}`.

5. Railway asigna automáticamente un dominio público (p.ej. `backend-production-abc.railway.app`). Copiarlo para configurar el frontend.

### Paso 4 — Desplegar el frontend (Vercel o Railway)

**Opción A — Vercel (recomendado para frontends React):**

1. Ir a [vercel.com](https://vercel.com) e importar el repositorio.
2. En la configuración del proyecto:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. En **Environment Variables**, agregar:
   ```
   VITE_API_URL=https://backend-production-abc.railway.app
   ```
4. Desplegar. Vercel genera un dominio público.

**Opción B — Railway (mismo proyecto):**

1. Agregar otro servicio GitHub Repo en el mismo proyecto.
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Start Command**: `npx serve dist -p $PORT` (instalar `serve` con `npm install serve`)
5. Variables: `VITE_API_URL=https://backend-production-abc.railway.app`

### Resumen de variables de entorno

| Servicio | Variable | Valor |
|----------|----------|-------|
| Backend (Railway) | `DATABASE_URL` | `mysql://...` (del servicio MySQL) |
| Backend (Railway) | `PORT` | `4000` |
| Frontend (Vercel/Railway) | `VITE_API_URL` | `https://<backend>.railway.app` |

---

## Desarrollo local

```bash
# 1. Levantar MySQL local y ejecutar sql/session1_init.sql

# 2. Backend
cd backend
cp .env.example .env        # editar DATABASE_URL
npm install
npx prisma generate
npm run start               # escucha en http://localhost:4000

# 3. Frontend (otra terminal)
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # abre http://localhost:5173
```

---

## Diagrama de capas

```
┌─────────────────────────────────────┐
│  Navegador (React + Tailwind)        │
│  - Axios client → VITE_API_URL       │
└──────────────┬──────────────────────┘
               │ HTTP / JSON
               ▼
┌─────────────────────────────────────┐
│  Express API (Node.js)              │
│  - CORS habilitado                  │
│  - Rutas REST: /estudiantes         │
│               /responsables         │
│               /articulos            │
│               /transacciones        │
│               /canjes               │
│               /reportes             │
└──────────────┬──────────────────────┘
               │ Prisma ORM
               ▼
┌─────────────────────────────────────┐
│  MySQL 8.0                          │
│  - 8 tablas relacionales            │
│  - 3 triggers de sincronización     │
│  - Vistas, funciones y procs        │
└─────────────────────────────────────┘
```
