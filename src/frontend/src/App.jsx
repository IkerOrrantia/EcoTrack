// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
// Necesitas crear estos archivos (por ahora serán componentes vacíos)
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Navbar /> {/* La barra de navegación se renderiza en todas las páginas */}
                <main style={{ padding: '20px' }}>
                    <Routes>
                        {/* Dashboard Principal (Pantalla A) */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* Rutas de Autenticacion */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Perfil y Alertas (Pantalla C) - Necesitará proteccion */}
                        <Route path="/profile" element={<Profile />} />

                        <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />

                        {/* Futura ruta para Detalle de Estación (Pantalla B) - Ej: /station/:id */}
                        {/* <Route path="/station/:id" element={<StationDetail />} /> */}
                    </Routes>
                </main>
            </AuthProvider>
        </Router>
    );
}

export default App;