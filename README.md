Tienda de Puntos

Estructura
- backend/ (Node.js + Express + Prisma)
- frontend/ (React + Vite + Tailwind)
- sql/ (script MySQL)

Requisitos
- Node.js 18+
- MySQL 8.0+

Local - Backend
1. Ejecuta el script SQL en MySQL: sql/session1_init.sql
2. Configura variables:
   - Copia backend/.env.example a backend/.env
   - Define DATABASE_URL
3. Instala y ejecuta:

```bash
cd backend
npm install
npx prisma generate
npm run start
```

Local - Frontend
1. Configura variables:
   - Copia frontend/.env.example a frontend/.env
   - Define VITE_API_URL con la URL del backend
2. Ejecuta:

```bash
cd frontend
npm install
npm run dev
```

Deploy - Railway (Backend + MySQL)
1. Crea un proyecto y agrega un servicio MySQL.
2. Conecta el repo al servicio Node.
3. Variables de entorno:
   - DATABASE_URL (URL del MySQL de Railway)
   - PORT=4000
4. Comandos sugeridos:
   - Build: npm install; npx prisma generate
   - Start: npm run start

Deploy - Vercel (Frontend)
1. Importa el repo y selecciona la carpeta frontend.
2. Variables de entorno:
   - VITE_API_URL=https://<tu-backend>.railway.app
3. Build Command: npm run build
4. Output Directory: dist
