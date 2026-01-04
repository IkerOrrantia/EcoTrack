const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors'); // ⚠️ Importante

const app = express();
const PORT = 8080;

// 1. Habilitar CORS GLOBALMENTE antes de los Proxies
// Esto añade automáticamente las cabeceras correctas a todas las rutas
app.use(cors({
    origin: '*', // En producción usarías 'http://localhost:5173'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Rutas de Proxy
// El Gateway redirige el tráfico interno de Docker

// Proxy para Usuarios y Favoritos
app.use('/api/v1/users', createProxyMiddleware({ 
    target: 'http://users-microservice:5001', 
    changeOrigin: true 
}));

app.use('/api/v1/favorites', createProxyMiddleware({ 
    target: 'http://users-microservice:5001', 
    changeOrigin: true 
}));

// Proxy para Datos (Flask)
app.use('/api/v1/data', createProxyMiddleware({ 
    target: 'http://data-microservice:5000', 
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
        // Forzamos la cabecera CORS en la respuesta del proxy por si Flask la omite
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
}));

app.listen(PORT, () => {
  console.log(`API Gateway operativo en puerto ${PORT}`);
});