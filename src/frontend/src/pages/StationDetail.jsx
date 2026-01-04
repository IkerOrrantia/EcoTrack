// frontend/src/pages/StationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistoricalData } from '../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatDataForChart = (rawData) => {
    const groupedData = {};

    rawData.forEach(item => {
        // ⚠️ Sincronizado con 'Timestamp' de MongoDB
        const dateObj = new Date(item.Timestamp);
        const timeKey = dateObj.toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });

        if (!groupedData[timeKey]) {
            groupedData[timeKey] = { time: timeKey, fullDate: dateObj };
        }

        // ⚠️ Sincronizado con 'Tipo_Contaminante' y 'Valor'
        groupedData[timeKey][item.Tipo_Contaminante] = item.Valor;
    });

    return Object.values(groupedData).sort((a, b) => a.fullDate - b.fullDate);
};

const StationDetail = () => {
    const { stationId } = useParams();
    const navigate = useNavigate();

    const [stationName, setStationName] = useState(`Cargando...`);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistorical = async () => {
            try {
                setLoading(true);
                const response = await getHistoricalData(stationId);
                const rawReadings = response.data;

                if (rawReadings && rawReadings.length > 0) {
                    setHistoricalData(formatDataForChart(rawReadings));
                    // ⚠️ Usar Estación_Nombre con tilde
                    setStationName(rawReadings[0].Estación_Nombre || `Estación ${stationId}`);
                }
            } catch (err) {
                console.error("Error histórico:", err);
                setError("No se pudieron cargar los datos.");
            } finally {
                setLoading(false);
            }
        };

        if (stationId) fetchHistorical();
    }, [stationId]);

    if (loading) return <div>Cargando...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={() => navigate('/dashboard')}>&larr; Volver al Mapa</button>
            <h1>Detalle: {stationName}</h1>

            <div style={{ width: '100%', height: '400px', marginTop: '30px' }}>
                <ResponsiveContainer>
                    <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="PM2.5" stroke="#FF0000" name="PM 2.5" strokeWidth={2} />
                        <Line type="monotone" dataKey="NO2" stroke="#FF7E00" name="NO₂" strokeWidth={2} />
                        <Line type="monotone" dataKey="CO" stroke="#0000FF" name="CO" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StationDetail;