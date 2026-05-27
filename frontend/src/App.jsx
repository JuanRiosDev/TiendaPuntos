import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Store from './pages/Store'
import History from './pages/History'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/estudiantes" element={<Students />} />
        <Route path="/tienda" element={<Store />} />
        <Route path="/historial" element={<History />} />
        <Route path="/reportes" element={<Reports />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
