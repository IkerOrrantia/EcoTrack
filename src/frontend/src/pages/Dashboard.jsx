// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getLatestReadings } from '../api/api';
import L from 'leaflet';

const getAirQualityColor = (pm25Value) => {
  if (pm25Value === null || pm25Value === undefined) return '#9e9e9e';
  if (pm25Value <= 12) return '#00E400';
  if (pm25Value <= 35.4) return '#FFFF00';
  if (pm25Value <= 55.4) return '#FF7E00';
  if (pm25Value <= 150.4) return '#FF0000';
  return '#7E0023';
};

const createCustomIcon = (color) => {
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="${color}" stroke="#000000" stroke-width="3" opacity="0.8"/>
    <text x="50" y="55" text-anchor="middle" font-size="20" fill="white" font-weight="bold">!</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true);
        const response = await getLatestReadings();

        // DEBUG: Mira la consola del navegador (F12) para ver si llega esto
        console.log("DATOS RECIBIDOS DE API:", response.data);

        const groupedReadings = response.data.reduce((acc, reading) => {
          // Usamos Estación_ID (con tilde) porque así viene en tu JSON
          const key = reading.Estación_ID;

          if (!acc[key]) {
            acc[key] = {
              id: key,
              name: reading.Estación_Nombre || 'Sin nombre',
              // Acceso exacto al objeto Geolocalizacion (sin tilde en la 'o')
              lat: reading.Geolocalizacion?.lat,
              lon: reading.Geolocalizacion?.lon,
              latest: {},
            };
          }

          acc[key].latest[reading.Tipo_Contaminante] = {
            value: reading.Valor,
            unit: reading.Unidad,
            timestamp: reading.Timestamp
          };
          return acc;
        }, {});

        const stationsArray = Object.values(groupedReadings).filter(s => s.lat != null && s.lon != null);

        // DEBUG: Comprueba si este array tiene elementos
        console.log("ESTACIONES PROCESADAS PARA MARCADORES:", stationsArray);

        setReadings(stationsArray);

      } catch (error) {
        console.error("Error al obtener las lecturas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
    const intervalId = setInterval(fetchReadings, 300000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) return <div>Cargando datos del mapa...</div>;

  const centerLat = 40.4168;
  const centerLon = -3.7038;

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <h1>Dashboard Principal ({readings.length} Estaciones Activas)</h1>
      <MapContainer
        center={[20, 0]} // Centro global
        zoom={2}        // Zoom alejado
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {readings.map((station) => {
          const pm25Reading = station.latest['PM2.5']?.value;
          const markerColor = getAirQualityColor(pm25Reading);
          const customIcon = createCustomIcon(markerColor);

          return (
            <Marker
              key={station.id}
              position={[station.lat, station.lon]}
              icon={customIcon}
            >
              <Popup>
                <strong>{station.name}</strong><br />
                <p>ID: {station.id}</p>
                {Object.entries(station.latest).map(([type, data]) => (
                  <div key={type}>
                    <strong>{type}: </strong> {data.value} {data.unit || 'µg/m³'}
                  </div>
                ))}
                <hr />
                <button onClick={() => window.location.href = `/dashboard/station/${station.id}`}>
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