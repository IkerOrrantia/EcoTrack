import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/api';

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
            setMessage('Registro exitoso. Serás redirigido al login.');
            
            // Redirigir al login tras un breve retraso
            setTimeout(() => navigate('/login'), 2000); 

        } catch (error) {
            console.error("Error al registrar:", error);
            setMessage(error.response?.data?.message || 'Error en el registro. Inténtalo de nuevo.');
        }
    };

    return (
        <div>
            <h1>Registro de Usuario</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Registrar</button>
            </form>
            {message && <p style={{ color: message.startsWith('Registro exitoso') ? 'green' : 'red' }}>{message}</p>}
        </div>
    );
};

export default Register;