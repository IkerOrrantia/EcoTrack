// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, setAuthToken } from '../api/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  // 1. Cargar token del almacenamiento local al inicio
  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
  }, []);
  
  // 2. Función de Login
  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password); // Llamada al API Gateway
      const newToken = response.data.token;
      
      setToken(newToken);
      localStorage.setItem('jwt_token', newToken); // Guardar el token en el navegador
      setAuthToken(newToken);

      // Opcional: Redirigir al usuario al dashboard
      navigate('/dashboard'); 
      return true;
    } catch (error) {
      console.error("Login fallido:", error);
      // Puedes manejar mensajes de error específicos aquí
      return false;
    }
  };

  // 3. Función de Logout
  const logout = () => {
    setToken(null);
    localStorage.removeItem('jwt_token');
    setAuthToken(null);
    navigate('/login');
  };
  
  // 4. Determinar si el usuario está autenticado
  const isAuthenticated = !!token; // Convierte el token a booleano
  
  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);