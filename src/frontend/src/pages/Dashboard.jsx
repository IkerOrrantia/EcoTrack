// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getLatestReadings } from '../api/api';
import L from 'leaflet';
// Importa el icono por defecto para que Leaflet lo encuentre (aunque usaremos iconos personalizados)
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Importante: Eliminar la configuración de iconos por defecto si se van a usar iconos DIV personalizados

// --- FUNCIÓN DE UTILIDAD: LÓGICA DE COLOR (Simulación de ICA) ---

/**
 * Calcula un color basado en el valor de PM2.5 (en µg/m³).
 * Esto simula un Índice de Calidad del Aire (ICA) simplificado.
 * (Umbrales basados en valores típicos de la EPA/OMS)
 */
const getAirQualityColor = (pm25Value) => {
  if (pm25Value === null || pm25Value === undefined) return '#9e9e9e'; // Gris para dato no disponible
  
  // NIVELES DE UMBRAL (Ejemplo: OMS/EPA simplificado)
  if (pm25Value <= 12) return '#00E400';   // Verde (Bueno)
  if (pm25Value <= 35.4) return '#FFFF00'; // Amarillo (Moderado)
  if (pm25Value <= 55.4) return '#FF7E00'; // Naranja (Poco Saludable)
  if (pm25Value <= 150.4) return '#FF0000'; // Rojo (Muy Poco Saludable)
  return '#7E0023'; // Granate (Peligroso)
};

// --- FUNCIÓN PARA CREAR ÍCONO DE MARCADOR DINÁMICO (React-Leaflet Custom Icon) ---

const createCustomIcon = (color) => {
  // Crear un SVG para usar como icono, permitiendo cambiar el color
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="${color}" stroke="#000000" stroke-width="3" opacity="0.8"/>
    <text x="50" y="55" text-anchor="middle" font-size="20" fill="white" font-weight="bold">!</text>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '', // No queremos la clase por defecto de Leaflet
    iconSize: [30, 30], // Tamaño del ícono SVG
    iconAnchor: [15, 15], // Centro del ícono
    popupAnchor: [0, -15],
  });
};

// --- COMPONENTE PRINCIPAL ---

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Carga de datos al montar el componente
    const fetchReadings = async () => {
      try {
        // La llamada está protegida con el token JWT
        const response = await getLatestReadings();
        
        // Transformación de los datos: Agrupar por estación
        const groupedReadings = response.data.reduce((acc, reading) => {
            const key = reading.Estación_ID;
            
            if (!acc[key]) {
                acc[key] = {
                    id: key,
                    name: reading.Nombre_Estacion || 'Estación sin nombre',
                    lat: reading.Geolocalizacion.Latitud,
                    lon: reading.Geolocalizacion.Longitud,
                    latest: {}, 
                };
            }
            
            // Almacena la última lectura por tipo de contaminante
            acc[key].latest[reading.Tipo_Contaminante] = {
                value: reading.Valor,
                unit: reading.Unidad,
                timestamp: reading.Timestamp
            };
            return acc;
        }, {});

        // Convertir el objeto de estaciones a un array para mapear en React
        const stationsArray = Object.values(groupedReadings);
        setReadings(stationsArray);

      } catch (error) {
        console.error("Error al obtener las lecturas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
    
    // Configurar una actualización periódica (cada 5 minutos)
    const intervalId = setInterval(fetchReadings, 300000); 
    
    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);

  }, []);

  if (loading) {
    return <div>Cargando datos del mapa...</div>;
  }

  // Coordenadas iniciales del mapa (Puedes centrarlo donde haya datos reales)
  const centerLat = 40.4168; 
  const centerLon = -3.7038; 

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <h1>Dashboard Principal - Calidad del Aire ({readings.length} Estaciones Activas)</h1>
      <MapContainer 
        center={[centerLat, centerLon]} 
        zoom={6} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        
        {/* Capa base del mapa (OpenStreetMap) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Mapeo de los Marcadores de Estaciones */}
        {readings.map((station) => {
          // Obtener el valor de PM2.5 para colorear el marcador
          const pm25Reading = station.latest['PM2.5']?.value;
          const markerColor = getAirQualityColor(pm25Reading);
          const customIcon = createCustomIcon(markerColor); // 

          return (
            <Marker 
              key={station.id} 
              position={[station.lat, station.lon]}
              icon={customIcon} // Usar el ícono dinámico
            >
              <Popup>
                <strong>{station.name}</strong><br/>
                <p>Última actualización: {station.latest['PM2.5']?.timestamp ? new Date(station.latest['PM2.5'].timestamp).toLocaleTimeString() : 'N/A'}</p>
                {/* Muestra todos los contaminantes */}
                {Object.entries(station.latest).map(([type, data]) => (
                    <div key={type}>
                        <strong>{type}: </strong> 
                        {data.value} {data.unit || 'µg/m³'}
                    </div>
                ))}
                <hr/>
                {/* Enlace para ver los detalles históricos (Próximo paso) */}
                <button 
                  onClick={() => alert(`Navegar a detalles de la estación ${station.id}`)}
                  style={{ cursor: 'pointer', padding: '5px 10px' }}
                >
                    Ver Histórico
                </button>
              </Popup>
              <Tooltip>{station.name} | PM2.5: {pm25Reading || 'N/A'}</Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Dashboard;