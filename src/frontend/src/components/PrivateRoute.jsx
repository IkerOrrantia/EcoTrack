import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element: Element }) => {
    const { isAuthenticated } = useAuth(); // Obtenemos el estado de autenticación

    // Si está autenticado, renderiza el componente (ej. Profile)
    // Si no lo está, redirige a la página de Login
    return isAuthenticated ? Element : <Navigate to="/login" replace />;
};

export default PrivateRoute;