// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Estilos necesarios para Leaflet
import { getLatestReadings } from '../api/api';
import L from 'leaflet';

// Importa el icono por defecto para que Leaflet lo encuentre
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Carga de datos al montar el componente
    const fetchReadings = async () => {
      try {
        const response = await getLatestReadings();
        // Agrupamos las lecturas por estación (ya que tienes múltiples lecturas por estación)
        const groupedReadings = response.data.reduce((acc, reading) => {
            const key = reading.Estación_ID;
            if (!acc[key]) {
                acc[key] = {
                    name: reading.Estación_Nombre,
                    lat: reading.Geolocalización.lat,
                    lon: reading.Geolocalización.lon,
                    contaminants: []
                };
            }
            acc[key].contaminants.push({ 
                type: reading.Tipo_Contaminante, 
                value: reading.Valor, 
                unit: reading.Unidad 
            });
            return acc;
        }, {});
        
        setReadings(Object.values(groupedReadings));
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener las lecturas:", error);
        setLoading(false);
      }
    };

    fetchReadings();
    // Podrías configurar un setInterval aquí para actualizar periódicamente

  }, []);

  if (loading) {
    return <div>Cargando datos del mapa...</div>;
  }

  // Latitud y Longitud Central (Ej. Centro de la península)
  const centerLat = 40.4168; 
  const centerLon = -3.7038; 

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <h1>Dashboard Principal - Calidad del Aire</h1>
      <MapContainer center={[centerLat, centerLon]} zoom={6} style={{ height: '100%', width: '100%' }}>
        
        {/* Capa base del mapa (OpenStreetMap) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marcadores de Estaciones */}
        {readings.map((station, index) => (
          <Marker 
            key={index} 
            position={[station.lat, station.lon]}
          >
            <Popup>
              <strong>{station.name}</strong><br/>
              {station.contaminants.map((c, i) => (
                <div key={i}>
                  {c.type}: **{c.value} {c.unit}**
                </div>
              ))}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Dashboard;