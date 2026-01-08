// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getFavorites, addFavorite, deleteFavorite, getLatestReadings } from '../api/api';

const initialNewFavoriteState = {
    nombre_ubicacion: '',
    latitud: '',
    longitud: '',
    umbral_pm25: 50,
    umbral_no2: 100,
};

const Profile = () => {
    const { isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [globalReadings, setGlobalReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para la funcionalidad de Añadir
    const [isAdding, setIsAdding] = useState(false);
    const [newFavorite, setNewFavorite] = useState(initialNewFavoriteState);

    if (!isAuthenticated) {
        return (
            <div className="auth-wrapper">
                <div className="auth-card">
                    <div style={{ fontSize: '50px' }}>🔒</div>
                    <h2>Acceso Restringido</h2>
                    <Link to="/login"><button>Ir al Login</button></Link>
                </div>
            </div>
        );
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const [favRes, readingsRes] = await Promise.all([
                getFavorites(),
                getLatestReadings()
            ]);
            setFavorites(favRes.data || []);
            setGlobalReadings(readingsRes.data || []);
        } catch (err) {
            console.error("Error cargando datos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await addFavorite(
                newFavorite.nombre_ubicacion,
                parseFloat(newFavorite.latitud),
                parseFloat(newFavorite.longitud),
                newFavorite.umbral_pm25,
                newFavorite.umbral_no2
            );
            setIsAdding(false);
            setNewFavorite(initialNewFavoriteState);
            fetchData(); 
        } catch (err) {
            alert("Error al añadir la ubicación.");
        }
    };

    const handleDelete = async (id) => {
        // Validación de seguridad para evitar enviar 'undefined' a la API
        if (!id) {
            console.error("ID no válido para eliminar");
            return;
        }

        try {
            await deleteFavorite(id);
            // Actualización optimista del estado local
            setFavorites(prev => prev.filter(f => (f.id_ubicacion || f.id) !== id));
        } catch (err) {
            console.error("Error al eliminar:", err);
            alert("No se pudo eliminar la ubicación del servidor.");
        }
    };

    const getRealTimeData = (favLat, favLon) => {
        if (!globalReadings.length) return { value: 'N/A', station: 'Buscando...' };
        try {
            let closest = globalReadings.reduce((prev, curr) => {
                let prevDist = Math.sqrt(Math.pow(prev.Geolocalizacion.lat - favLat, 2) + Math.pow(prev.Geolocalizacion.lon - favLon, 2));
                let currDist = Math.sqrt(Math.pow(curr.Geolocalizacion.lat - favLat, 2) + Math.pow(curr.Geolocalizacion.lon - favLon, 2));
                return (currDist < prevDist) ? curr : prev;
            });
            return {
                value: closest.Valor,
                unit: closest.Unidad,
                station: closest.Estación_Nombre
            };
        } catch (e) {
            return { value: '---', station: 'Sin datos' };
        }
    };

    if (loading) return <div className="main-container"><h2 style={{color: 'white'}}>Sincronizando datos...</h2></div>;

    return (
        <div className="main-container">
            <h1 style={{ color: 'white' }}>Mi Perfil</h1>
            
            {/* Cabecera con botón añadir */}
            <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', margin: 0 }}>Mis Ubicaciones</h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ backgroundColor: isAdding ? '#666' : '#4caf50', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {isAdding ? 'Cancelar' : '+ Añadir Ubicación'}
                </button>
            </div>

            {/* Formulario de Añadir */}
            {isAdding && (
                <div className="auth-card" style={{ maxWidth: '600px', marginBottom: '40px', textAlign: 'left', margin: '0 auto 40px auto' }}>
                    <h3 style={{ color: '#355758' }}>Nueva Ubicación</h3>
                    <form onSubmit={handleAddSubmit}>
                        <input type="text" placeholder="Nombre (Ej: Casa)" value={newFavorite.nombre_ubicacion} onChange={(e) => setNewFavorite({...newFavorite, nombre_ubicacion: e.target.value})} required />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="number" step="any" placeholder="Latitud" value={newFavorite.latitud} onChange={(e) => setNewFavorite({...newFavorite, latitud: e.target.value})} required />
                            <input type="number" step="any" placeholder="Longitud" value={newFavorite.longitud} onChange={(e) => setNewFavorite({...newFavorite, longitud: e.target.value})} required />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="number" placeholder="Umbral PM2.5" value={newFavorite.umbral_pm25} onChange={(e) => setNewFavorite({...newFavorite, umbral_pm25: e.target.value})} />
                            <input type="number" placeholder="Umbral NO2" value={newFavorite.umbral_no2} onChange={(e) => setNewFavorite({...newFavorite, umbral_no2: e.target.value})} />
                        </div>
                        <button type="submit">Guardar</button>
                    </form>
                </div>
            )}

            {/* Grid de tarjetas */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '40px', 
                width: '100%',
                maxWidth: '1100px'
            }}>
                {favorites.map((fav) => {
                    // Identificador único robusto
                    const currentId = fav.id_ubicacion || fav.id;
                    const realData = getRealTimeData(fav.latitud, fav.longitud);
                    const estaEnAlerta = realData.value > fav.umbral_pm25;

                    return (
                        <div key={currentId} className="favorite-card" style={{ 
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '15px',
                            textAlign: 'left',
                            border: estaEnAlerta ? '3px solid #ff4d4d' : '1px solid #ddd',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: '0', fontSize: '1.4rem', color: '#355758', textTransform: 'capitalize' }}>
                                    {fav.nombre_ubicacion || "Ubicación"}
                                </h3>
                                {estaEnAlerta && <span style={{fontSize: '22px'}}>⚠️</span>}
                            </div>
                            
                            <p style={{ fontSize: '12px', color: '#777', margin: '5px 0 15px 0' }}>Cerca de: {realData.station}</p>

                            <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                                <p style={{margin: 0, fontSize: '12px', color: '#666'}}>Calidad del aire actual:</p>
                                <strong style={{fontSize: '20px', color: estaEnAlerta ? '#d32f2f' : '#333'}}>
                                    {realData.value} {realData.unit === 'N/A' ? 'µg/m³' : realData.unit}
                                </strong>
                            </div>
                            
                            <hr style={{ border: '0.5px solid #eee', margin: '15px 0' }} />
                            
                            <h4 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>Tus Umbrales:</h4>
                            <p style={{ margin: '5px 0', color: estaEnAlerta ? '#d32f2f' : 'black' }}>
                                🔴 PM2.5: <strong>{fav.umbral_pm25} µg/m³</strong>
                            </p>
                            <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.7 }}>
                                🟠 NO₂: {fav.umbral_no2} µg/m³
                            </p>

                            <div style={{ marginTop: '20px' }}>
                                <button 
                                    onClick={() => handleDelete(currentId)} 
                                    style={{ 
                                        backgroundColor: '#dc3545', 
                                        color: 'white', 
                                        padding: '10px', 
                                        width: '100%',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {favorites.length === 0 && !isAdding && (
                <p style={{color: 'white', marginTop: '40px'}}>No tienes ubicaciones favoritas guardadas.</p>
            )}
        </div>
    );
};

export default Profile;