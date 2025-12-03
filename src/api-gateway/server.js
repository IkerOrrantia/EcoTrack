const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080; // Puerto único de acceso público

// --- Rutas de Orquestación ---

// 1. Proxy para el Microservicio de Usuarios (Puerto 5001)
// Prefijo: /api/v1/users/ o /api/v1/favorites/
app.use('/api/v1/users', createProxyMiddleware({ 
    target: 'http://users-microservice:5001', // Nombre del servicio en Docker Compose
    changeOrigin: true 
}));
app.use('/api/v1/favorites', createProxyMiddleware({ 
    target: 'http://users-microservice:5001', 
    changeOrigin: true 
}));

// 2. Proxy para el Microservicio de Datos (Puerto 5000)
// Prefijo: /api/v1/data/
app.use('/api/v1/data', createProxyMiddleware({ 
    target: 'http://data-microservice:5000', // Nombre del servicio en Docker Compose
    changeOrigin: true 
}));


// Middleware para manejo de CORS (Crucial para el Frontend React)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Permitir cualquier origen (solo para desarrollo)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.listen(PORT, () => {
  console.log(`API Gateway escuchando en el puerto ${PORT}`);
});