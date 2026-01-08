// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>EcoTrack</Link>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Mapa en Tiempo Real</Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/profile" style={styles.link}>Perfil y Alertas</Link>
            <button 
              onClick={logout} 
              style={styles.logoutBtn}
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/profile" style={styles.link}>Perfil y Alertas</Link>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Registro</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',    // 📌 FIJA EL HEADER ARRIBA
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 50px',    // Espaciado lateral
    backgroundColor: '#ffffff', // Fondo claro como pediste
    color: '#333',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 2000,         // Asegura que esté por encima del mapa
  },
  logo: {
    color: '#4caf50',     // Verde Eco
    textDecoration: 'none',
    fontSize: '22px',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  link: {
    color: '#333',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background 0.3s',
  },
  logoutBtn: {
    color: '#d32f2f',     // Rojo para cerrar sesión
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 12px',
    border: '1px solid #d32f2f',
    borderRadius: '4px',
    background: 'none',
    cursor: 'pointer',
    marginLeft: '10px'
  }
};

export default Navbar;