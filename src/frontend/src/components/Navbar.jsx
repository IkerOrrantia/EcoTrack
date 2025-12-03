// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  // Nota: Aquí se implementará la lógica para mostrar "Perfil" o "Login"
  // dependiendo de si el usuario está autenticado (JWT). Por ahora, mostramos todo.

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>EcoTrack</Link>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Mapa en Tiempo Real</Link>
        <Link to="/profile" style={styles.link}>Perfil y Alertas</Link>
        <Link to="/login" style={styles.link}>Login</Link>
        <Link to="/register" style={styles.link}>Registro</Link>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#333',
    color: 'white',
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    gap: '20px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '5px 10px',
  }
};

export default Navbar;