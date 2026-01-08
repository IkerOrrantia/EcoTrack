// frontend/src/pages/StationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistoricalData } from '../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatDataForChart = (rawData) => {
    const groupedData = {};
    rawData.forEach(item => {
        const dateObj = new Date(item.Timestamp);
        const timeKey = dateObj.toLocaleString('es-ES', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });
        if (!groupedData[timeKey]) {
            groupedData[timeKey] = { time: timeKey, fullDate: dateObj };
        }
        groupedData[timeKey][item.Tipo_Contaminante] = item.Valor;
    });
    return Object.values(groupedData).sort((a, b) => a.fullDate - b.fullDate);
};

const StationDetail = () => {
    const { stationId } = useParams();
    const navigate = useNavigate();
    const [historicalData, setHistoricalData] = useState([]);
    const [rawHistory, setRawHistory] = useState([]); // Guardamos los datos sin procesar para las viñetas
    const [stationName, setStationName] = useState(`Estación #${stationId}`);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistorical = async () => {
            try {
                const res = await getHistoricalData(stationId);
                if (res.data && res.data.length > 0) {
                    setStationName(res.data[0].Estación_Nombre || `Estación #${stationId}`);
                    setRawHistory(res.data); // Para las viñetas
                    setHistoricalData(formatDataForChart(res.data)); // Para el gráfico
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

    if (loading) return <div className="main-container"><h2 style={{color: 'white'}}>Cargando histórico...</h2></div>;
    if (error) return <div className="main-container"><h2 style={{color: 'red'}}>{error}</h2></div>;

    return (
        <div className="main-container">
            <div style={{ width: '100%', maxWidth: '1100px' }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ marginBottom: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    &larr; Volver al Mapa
                </button>

                <h1 style={{ color: 'white', marginBottom: '5px' }}>Detalle de Estación</h1>
                <h2 style={{ color: '#eee', marginTop: '0', marginBottom: '30px' }}>{stationName}</h2>

                {/* --- SECCIÓN DE VIÑETAS (Últimas lecturas) --- */}
                <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Lecturas Recientes</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '40px' 
                }}>
                    {rawHistory.slice(0, 6).map((item, index) => (
                        <div key={index} className="favorite-card" style={{ 
                            backgroundColor: 'white', 
                            padding: '15px', 
                            borderRadius: '12px',
                            borderLeft: `5px solid ${item.Tipo_Contaminante === 'PM2.5' ? '#FF0000' : '#FF7E00'}`
                        }}>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                {new Date(item.Timestamp).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '5px 0' }}>
                                {item.Tipo_Contaminante}: {item.Valor} <span style={{fontSize: '0.8rem'}}>{item.Unidad}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>Estado: Operativo</div>
                        </div>
                    ))}
                </div>

                {/* --- SECCIÓN DEL GRÁFICO --- */}
                <h3 style={{ color: 'white', marginBottom: '20px' }}>Tendencia Temporal</h3>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="PM2.5" stroke="#FF0000" name="PM 2.5" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="NO2" stroke="#FF7E00" name="NO₂" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StationDetail;