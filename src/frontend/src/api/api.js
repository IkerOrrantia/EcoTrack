// frontend/src/api/api.js
import axios from 'axios';

// La URL base es el puerto del API Gateway
const API_BASE_URL = 'http://localhost:8080/api/v1'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener las lecturas de datos
export const getLatestReadings = () => {
  // Llama a http://localhost:8080/api/v1/data/latest
  return api.get('/data/latest');
};

// Función para el login (necesaria para obtener el token)
export const loginUser = (email, password) => {
  // Llama a http://localhost:8080/api/v1/users/login
  return api.post('/users/login', { email, password });
};

// Aquí puedes añadir más funciones (registro, favoritos, etc.)

export default api;
export const registerUser = (nombre, email, password) => {
  // Llama a http://localhost:8080/api/v1/users/register
  return api.post('/users/register', { nombre, email, password });
};