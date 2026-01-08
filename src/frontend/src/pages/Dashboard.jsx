import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getLatestReadings } from '../api/api';
import L from 'leaflet';
import '../App.css';

const getAirQualityColor = (pm25Value) => {
  if (pm25Value === null || pm25Value === undefined || pm25Value < 0) return '#9e9e9e';
  if (pm25Value <= 12) return '#00E400';
  if (pm25Value <= 35.4) return '#FFFF00';
  if (pm25Value <= 55.4) return '#FF7E00';
  if (pm25Value <= 150.4) return '#FF0000';
  return '#7E0023';
};

const createCustomIcon = (color) => {
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="${color}" stroke="#333" stroke-width="8" opacity="1"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReadings = async () => {
    try {
      const response = await getLatestReadings();
      const grouped = response.data.reduce((acc, reading) => {
        const key = reading.Estación_ID;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            name: reading.Estación_Nombre,
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
      setReadings(Object.values(grouped).filter(s => s.lat && s.lon));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  if (loading) return <div className="main-container"><h2>Cargando estaciones...</h2></div>;

 return (
  <div className="main-container">
    <h1 style={{ marginTop: '0px', marginBottom: '5px' }}>
      Dashboard Principal
    </h1>
    <p style={{ color: '#000000ff', marginBottom: '20px', fontWeight: '700', fontSize: '18px' }}>
      {readings.length} Estaciones Activas detectadas globalmente
    </p>

    {/* Contenedor horizontal que separa Leyenda de Mapa */}
    <div className="dashboard-content">
      
      {/* LEYENDA LATERAL IZQUIERDA */}
      <aside className="sidebar-legend">
        <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #000000ff', paddingBottom: '5px', color: '#000000ff'        }}>
          Calidad del Aire
        </h4>
        <div className="legend-item">
          <div className="legend-circle" style={{ backgroundColor: '#00E400' }}></div>
          <span>Bueno</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ backgroundColor: '#FFFF00' }}></div>
          <span>Moderado</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ backgroundColor: '#FF7E00' }}></div>
          <span>Nocivo</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ backgroundColor: '#FF0000' }}></div>
          <span>Dañino</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ backgroundColor: '#7E0023' }}></div>
          <span>Peligroso</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ backgroundColor: '#9e9e9e' }}></div>
          <span>Sin Datos</span>
        </div>
      </aside>

      {/* TU MAPA ORIGINAL (Intacto) */}
      <div className="map-wrapper">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {readings.map((station) => (
            <Marker 
              key={station.id} 
              position={[station.lat, station.lon]}
              icon={createCustomIcon(getAirQualityColor(station.latest['PM2.5']?.value))}
            >
              <Popup>
                <strong>{station.name}</strong><br/>
                {Object.entries(station.latest).map(([type, data]) => (
                  <div key={type}>{type}: {data.value}</div>
                ))}
                <button 
                  onClick={() => window.location.href=`/dashboard/station/${station.id}`}
                  style={{ marginTop: '10px', width: '100%', cursor: 'pointer' }}
                >
                  Ver Histórico
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  </div>
);
};

export default Dashboard;