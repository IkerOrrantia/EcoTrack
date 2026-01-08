# 🌿 EcoTrack: Plataforma de Monitoreo Ambiental (Docker Edition)

EcoTrack es una solución **Full-Stack basada en microservicios**, diseñada para la visualización en tiempo real y el análisis histórico de contaminantes ambientales.

El proyecto utiliza **Docker Compose** para orquestar automáticamente los microservicios y las bases de datos, facilitando un despliegue rápido y reproducible.

---

## 0️⃣ Requisitos Previos

Para ejecutar el proyecto necesitas tener instalado:

- **Docker** (se recomienda **Docker Desktop**)
- **Docker Compose** (incluido en Docker Desktop)
- **Git** (para clonar el repositorio)
- **Node.js y NPM** (solo si ejecutas el frontend en modo desarrollo local)

---

## 1️⃣ Arquitectura y Servicios

El proyecto se compone de los siguientes contenedores definidos en `docker-compose.yml`:

| Servicio        | Tecnología     | Puerto Externo | Descripción |
|-----------------|---------------|---------------:|-------------|
| `api-gateway`  | Node.js       | 8080           | Punto de entrada único para el frontend |
| `frontend`     | React (Vite)  | 5173           | Interfaz de usuario y dashboard |
| `ms-usuarios`  | Python Flask  | 5001           | Gestión de autenticación y favoritos (PostgreSQL) |
| `ms-datos`     | Python Flask  | 5002           | Consulta de datos históricos (MongoDB) |
| `postgres-db`  | PostgreSQL    | 5432           | Persistencia de usuarios y alertas |
| `mongo-db`     | MongoDB       | 27017          | Almacenamiento masivo de lecturas ambientales |

---

## 2️⃣ Dependencias Locales

### Backend
No es necesario instalar dependencias manualmente. Docker instala automáticamente `Flask`, `pymongo`, etc., dentro de los contenedores.

### Frontend
Las dependencias de Node.js son necesarias **solo si se ejecuta el frontend en local**.

---

## 3️⃣ Arranque del Servidor (Backend)

Desde la raíz del proyecto, ejecuta: `docker compose up --build -d`

Este comando:
- Descarga las imágenes necesarias
- Instala dependencias
- Inicia microservicios y bases de datos

---

## 4️⃣ Ejecución del Frontend (Cliente)

Desde la carpeta del frontend, ejecuta: `npm install` y luego `npm run dev`

---

## 5️⃣ Acceso Web y Navegación

### 5.1 Interfaz Web

- **Frontend:** http://localhost:5173  
- **API Gateway:** http://localhost:8080  

### 5.2 Navegación por Estaciones

Al seleccionar una estación del mapa, la URL será: `http://localhost:5173/dashboard/station/:stationId`

**Funcionalidades:**
- Últimos datos registrados
- Viñetas informativas
- Gráfico de tendencia temporal con Recharts

---

## 6️⃣ Comandos Útiles de Docker

- `docker compose stop` → Detiene los servicios sin borrar datos  
- `docker compose down -v` → Elimina contenedores y volúmenes  
- `docker compose logs -f [servicio]` → Ver logs en tiempo real  
- `docker exec -it [id_contenedor] bash` → Acceder a un contenedor
