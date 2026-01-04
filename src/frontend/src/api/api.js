import axios from 'axios';

// La URL base es el puerto del API Gateway (http://localhost:5000)
const API_BASE_URL = 'http://localhost:8080/api/v1'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Configuración de Token (Para AuthContext.jsx) ---

export const setAuthToken = (token) => {
  if (token) {
    // Si hay token, lo establece en el header de autorización
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Si no hay token (logout), elimina el header
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Funciones de Usuarios y Autenticación ---

export const loginUser = (email, password) => {
  return api.post('/users/login', { email, password });
};

export const registerUser = (nombre, email, password) => {
  return api.post('/users/register', { nombre, email, password });
};

// --- Funciones de Datos Ambientales ---

export const getLatestReadings = () => {
  // Debe coincidir con @app.route('/api/v1/data/latest')
  return api.get('/data/latest');
};

export const getHistoricalData = (stationId) => {
  // Debe coincidir con @app.route('/api/v1/data/history/<station_id>')
  return api.get(`/data/history/${stationId}`);
};

  // Obtiene todas las ubicaciones favoritas y sus umbrales del usuario actual. Endpoint: GET /api/v1/favorites 
export const getFavorites = () => {
  return api.get('/favorites');
};


 // Añade una nueva ubicación favorita. Endpoint: POST /api/v1/favorites
export const addFavorite = (nombre_ubicacion, latitud, longitud, umbral_pm25, umbral_no2) => {
  return api.post('/favorites', {
    nombre_ubicacion,
    latitud,
    longitud,
    umbral_pm25: parseInt(umbral_pm25, 10), // Asegurar que es entero
    umbral_no2: parseInt(umbral_no2, 10),
  });
};


  // Actualiza los umbrales o el nombre de una ubicación existente.  Endpoint: PUT /api/v1/favorites/{locationId}
 
export const updateFavorite = (locationId, nombre_ubicacion, umbral_pm25, umbral_no2) => {
  return api.put(`/favorites/${locationId}`, {
    nombre_ubicacion,
    umbral_pm25: parseInt(umbral_pm25, 10),
    umbral_no2: parseInt(umbral_no2, 10),
  });
};


 // Elimina una ubicación favorita. Endpoint: DELETE /api/v1/favorites/{locationId}

export const deleteFavorite = (locationId) => {
  return api.delete(`/favorites/${locationId}`);
};

// --- Exportación Final ---
export default api;