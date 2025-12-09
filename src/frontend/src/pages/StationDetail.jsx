// frontend/src/pages/StationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistoricalData } from '../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- FUNCIÓN DE UTILIDAD: FORMATEAR DATOS PARA GRÁFICO ---

/**
 * Transforma los datos de MongoDB (lista plana) en un formato de series de tiempo
 * apto para Recharts, agrupado por punto temporal.
 * El formato ideal es: [{ timestamp: 'hh:mm', PM2.5: 15, NO2: 30, CO: 0.5 }, ...]
 */
const formatDataForChart = (rawData) => {
  // Objeto temporal para agrupar lecturas por hora
  const groupedData = {};

  rawData.forEach(item => {
    // Usamos la hora y minuto como clave de agrupamiento
    const timeKey = new Date(item.Timestamp).toLocaleString('es-ES', {
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit',
        month: '2-digit'
    });
    
    if (!groupedData[timeKey]) {
      groupedData[timeKey] = { time: timeKey };
    }
    
    // Asignamos el valor al tipo de contaminante
    groupedData[timeKey][item.Tipo_Contaminante] = item.Valor;
  });

  // Convertir el objeto a un array y ordenar por tiempo
  return Object.values(groupedData).sort((a, b) => new Date(a.time) - new Date(b.time));
};

// --- COMPONENTE PRINCIPAL ---

const StationDetail = () => {
    // Asumimos que usas React Router con una ruta /dashboard/station/:stationId
    const { stationId } = useParams(); 
    const navigate = useNavigate();
    
    const [stationName, setStationName] = useState(`Estación ${stationId}`);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistorical = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // 1. Obtener datos de la API
                const response = await getHistoricalData(stationId);
                const rawReadings = response.data;
                
                // 2. Formatear datos para el gráfico
                const chartData = formatDataForChart(rawReadings);
                setHistoricalData(chartData);
                
                // Intentar obtener el nombre de la estación si existe algún dato
                if (rawReadings.length > 0) {
                    setStationName(rawReadings[0].Nombre_Estacion || `Estación ${stationId}`);
                }

            } catch (err) {
                console.error("Error al obtener datos históricos:", err);
                setError("No fue posible cargar los datos históricos. Intenta de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        if (stationId) {
            fetchHistorical();
        }
    }, [stationId]);

    if (loading) {
        return <div>Cargando datos históricos de la estación...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }
    
    if (historicalData.length === 0) {
        return (
            <div>
                <h1>{stationName}</h1>
                <p>No hay datos históricos disponibles para esta estación en el periodo seleccionado.</p>
                <button onClick={() => navigate('/dashboard')}>Volver al Mapa</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>
                &larr; Volver al Mapa
            </button>
            <h1>Detalle de Estación: {stationName}</h1>
            <p>Evolución de contaminantes en las últimas 48 horas (mostrado por el microservicio).</p>

            <div style={{ width: '100%', height: '400px', marginTop: '30px' }}>
                <h2>Concentración de Contaminantes (µg/m³)</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        
                        {/* Gráfico para PM2.5 (Partículas) - Clave crítica */}
                        <Line 
                            type="monotone" 
                            dataKey="PM2.5" 
                            stroke="#FF0000" 
                            strokeWidth={2}
                            name="PM2.5"
                            dot={false}
                        />
                        
                        {/* Gráfico para NO2 (Dióxido de Nitrógeno) */}
                        <Line 
                            type="monotone" 
                            dataKey="NO2" 
                            stroke="#FF7E00" 
                            strokeWidth={2}
                            name="NO₂"
                            dot={false}
                        />

                        {/* Gráfico para CO2 (Monóxido de Carbono) - Asegúrate de que tu worker lo recoge */}
                        <Line 
                            type="monotone" 
                            dataKey="CO" 
                            stroke="#0000FF" 
                            strokeWidth={2}
                            name="CO"
                            dot={false}
                        />
                        
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {/* Puedes añadir más información aquí, como la latitud/longitud y el resumen de los umbrales de alerta del usuario */}
        </div>
    );
};

export default StationDetail;