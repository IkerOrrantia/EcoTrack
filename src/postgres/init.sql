-- postgres/init.sql

-- Crear la tabla de Ubicaciones Favoritas (dependencia de Usuarios)
CREATE TABLE Ubicaciones_Favoritas (
    ID_Ubicacion SERIAL PRIMARY KEY,
    Latitud DOUBLE PRECISION NOT NULL,
    Longitud DOUBLE PRECISION NOT NULL,
    Umbral_PM25 INT, -- Umbral de notificación (μg/m³) [cite: 64]
    Umbral_NO2 INT,  -- Umbral de notificación (μg/m³) [cite: 64]
    Nombre_Ubicacion VARCHAR(255) NOT NULL
);

-- Crear la tabla de Usuarios [cite: 63]
CREATE TABLE Usuarios (
    ID_Usuario SERIAL PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL -- Almacenar el hash de la contraseña (nunca la contraseña plana)
);

-- Tabla de unión muchos a muchos 
-- Crearemos una tabla de unión simple para manejar la relación 1:N (Usuario tiene muchas Ubicaciones Favoritas)
CREATE TABLE Usuario_Ubicacion (
    ID_Usuario_Ubicacion SERIAL PRIMARY KEY,
    ID_Usuario INT REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE,
    ID_Ubicacion INT REFERENCES Ubicaciones_Favoritas(ID_Ubicacion) ON DELETE CASCADE,
    -- Restricción para que una ubicación solo pueda estar una vez por usuario
    UNIQUE (ID_Usuario, ID_Ubicacion)
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_usuario_email ON Usuarios (Email);
CREATE INDEX idx_ubicacion_usuario ON Usuario_Ubicacion (ID_Usuario);