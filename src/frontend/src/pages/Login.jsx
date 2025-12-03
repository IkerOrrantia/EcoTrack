import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth(); // Obtenemos la función de login del contexto

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Llamada a la API a través de la función del contexto
        const success = await login(email, password);
        
        if (!success) {
            setError('Fallo el inicio de sesión. Credenciales incorrectas.');
        }
    };

    return (
        <div>
            <h1>Login de Usuario</h1>
            <form onSubmit={handleSubmit}>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Iniciar Sesión</button>
            </form>
            {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
    );
};

export default Login;