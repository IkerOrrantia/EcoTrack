import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/api';
import '../App.css';

const Register = () => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await registerUser(nombre, email, password);
            setMessage('Registro exitoso. Serás redirigido...');
            setTimeout(() => navigate('/login'), 2000); 
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error en el registro.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2>Crear Cuenta</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="submit">Registrarse</button>
                </form>
                {message && <p style={{ color: message.includes('exitoso') ? 'green' : 'red' }}>{message}</p>}
                <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
            </div>
        </div>
    );
};

export default Register;