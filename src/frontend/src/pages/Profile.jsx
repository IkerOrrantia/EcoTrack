// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Para el botón de Logout
import { 
    getFavorites, 
    addFavorite, 
    updateFavorite, 
    deleteFavorite 
} from '../api/api';

// Estado inicial para el formulario de adición
const initialNewFavoriteState = {
    nombre_ubicacion: '',
    latitud: '',
    longitud: '',
    umbral_pm25: 50, // Valores por defecto sugeridos
    umbral_no2: 100,
};

const Profile = () => {
    // Hooks de Estado
    const { logout } = useAuth(); // Usamos la función de logout
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false); // Controla la visibilidad del formulario de adición
    const [newFavorite, setNewFavorite] = useState(initialNewFavoriteState);
    const [editingId, setEditingId] = useState(null); // ID de la ubicación que se está editando

    // --- Lógica de Carga de Datos ---

    const fetchFavorites = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getFavorites();
            setFavorites(response.data);
        } catch (err) {
            console.error("Error al cargar favoritos:", err);
            setError("No se pudieron cargar sus ubicaciones favoritas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    // --- Handlers de Formulario ---

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewFavorite(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        
        // Convertir Lat/Lon y Umbrales a número y validar
        const data = {
            ...newFavorite,
            latitud: parseFloat(newFavorite.latitud),
            longitud: parseFloat(newFavorite.longitud),
            umbral_pm25: parseInt(newFavorite.umbral_pm25, 10),
            umbral_no2: parseInt(newFavorite.umbral_no2, 10),
        };
        
        // Validación básica
        if (isNaN(data.latitud) || isNaN(data.longitud) || !data.nombre_ubicacion) {
            alert("Por favor, introduce valores válidos para Latitud, Longitud y Nombre.");
            return;
        }

        try {
            await addFavorite(
                data.nombre_ubicacion, 
                data.latitud, 
                data.longitud, 
                data.umbral_pm25, 
                data.umbral_no2
            );
            alert("Ubicación favorita añadida con éxito.");
            setNewFavorite(initialNewFavoriteState); // Resetear formulario
            setIsAdding(false); // Ocultar formulario
            fetchFavorites(); // Recargar la lista
        } catch (err) {
            console.error("Error al añadir favorito:", err);
            setError("Error al añadir la ubicación. Inténtalo de nuevo.");
        }
    };

    const handleUpdate = async (locationId, newName, newPm25, newNo2) => {
        try {
            await updateFavorite(locationId, newName, newPm25, newNo2);
            alert("Umbrales actualizados con éxito.");
            setEditingId(null); // Finalizar edición
            fetchFavorites(); // Recargar la lista
        } catch (err) {
            console.error("Error al actualizar favorito:", err);
            setError("Error al actualizar la ubicación. Inténtalo de nuevo.");
        }
    };

    const handleDelete = async (locationId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta ubicación favorita?")) {
            return;
        }
        try {
            await deleteFavorite(locationId);
            alert("Ubicación eliminada con éxito.");
            fetchFavorites(); // Recargar la lista
        } catch (err) {
            console.error("Error al eliminar favorito:", err);
            setError("Error al eliminar la ubicación. Inténtalo de nuevo.");
        }
    };
    
    // --- Renderizado ---

    if (loading) return <div>Cargando perfil y alertas...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Pantalla C: Perfil y Alertas</h1>
                <button onClick={logout} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>
                    Cerrar Sesión
                </button>
            </div>
            
            {/* --- Formulario de Adición --- */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ marginBottom: '15px', backgroundColor: isAdding ? '#ffc107' : '#007bff', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    {isAdding ? 'Cancelar' : '➕ Añadir Nueva Ubicación Favorita'}
                </button>
                
                {isAdding && (
                    <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <input 
                            type="text" 
                            name="nombre_ubicacion" 
                            placeholder="Nombre de la Ubicación (ej: Mi Casa)" 
                            value={newFavorite.nombre_ubicacion} 
                            onChange={handleInputChange} 
                            required 
                            style={{ gridColumn: '1 / span 3' }}
                        />
                        <input 
                            type="number" 
                            name="latitud" 
                            placeholder="Latitud (ej: 40.41)" 
                            value={newFavorite.latitud} 
                            onChange={handleInputChange} 
                            required 
                            step="0.0001"
                        />
                        <input 
                            type="number" 
                            name="longitud" 
                            placeholder="Longitud (ej: -3.70)" 
                            value={newFavorite.longitud} 
                            onChange={handleInputChange} 
                            required 
                            step="0.0001"
                        />
                        <div style={{ gridColumn: '1 / span 1' }}>
                            <label>Umbral PM2.5 (µg/m³): </label>
                            <input 
                                type="number" 
                                name="umbral_pm25" 
                                value={newFavorite.umbral_pm25} 
                                onChange={handleInputChange} 
                                min="0"
                                required 
                            />
                        </div>
                        <div style={{ gridColumn: '2 / span 1' }}>
                            <label>Umbral NO₂ (µg/m³): </label>
                            <input 
                                type="number" 
                                name="umbral_no2" 
                                value={newFavorite.umbral_no2} 
                                onChange={handleInputChange} 
                                min="0"
                                required 
                            />
                        </div>
                        <button type="submit" style={{ gridColumn: '3 / span 1', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Guardar Ubicación
                        </button>
                    </form>
                )}
            </div>

            {/* --- Lista de Ubicaciones Favoritas --- */}
            <h2>Mis Ubicaciones y Umbrales de Alerta ({favorites.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {favorites.map((fav) => (
                    <FavoriteCard 
                        key={fav.id_ubicacion} 
                        fav={fav} 
                        isEditing={editingId === fav.id_ubicacion}
                        setEditingId={setEditingId}
                        handleUpdate={handleUpdate}
                        handleDelete={handleDelete}
                    />
                ))}
            </div>
            
            {favorites.length === 0 && !isAdding && (
                <p>Aún no tiene ubicaciones favoritas guardadas. ¡Añada una para recibir alertas!</p>
            )}

        </div>
    );
};

// --- COMPONENTE AUXILIAR PARA CADA TARJETA DE FAVORITO ---

const FavoriteCard = ({ fav, isEditing, setEditingId, handleUpdate, handleDelete }) => {
    // Estado local para los valores que se están editando
    const [editData, setEditData] = useState({
        nombre_ubicacion: fav.nombre_ubicacion,
        umbral_pm25: fav.umbral_pm25,
        umbral_no2: fav.umbral_no2,
    });

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        handleUpdate(
            fav.id_ubicacion, 
            editData.nombre_ubicacion, 
            editData.umbral_pm25, 
            editData.umbral_no2
        );
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
            {isEditing ? (
                // Modo Edición
                <div>
                    <input 
                        type="text" 
                        name="nombre_ubicacion" 
                        value={editData.nombre_ubicacion} 
                        onChange={handleEditChange} 
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <div style={{ marginBottom: '10px' }}>
                        <label>PM2.5 (&gt;): </label>
                        <input 
                            type="number" 
                            name="umbral_pm25" 
                            value={editData.umbral_pm25} 
                            onChange={handleEditChange} 
                            style={{ width: '70px', marginRight: '5px' }}
                        />
                        <small>µg/m³</small>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>NO₂ (&gt;): </label>
                        <input 
                            type="number" 
                            name="umbral_no2" 
                            value={editData.umbral_no2} 
                            onChange={handleEditChange} 
                            style={{ width: '70px', marginRight: '5px' }}
                        />
                        <small>µg/m³</small>
                    </div>
                    <button 
                        onClick={handleSave} 
                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', marginRight: '10px', cursor: 'pointer' }}
                    >
                        Guardar
                    </button>
                    <button 
                        onClick={() => setEditingId(null)} 
                        style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                </div>
            ) : (
                // Modo Vista
                <div>
                    <h3>{fav.nombre_ubicacion}</h3>
                    <p>Lat: {fav.latitud.toFixed(4)}, Lon: {fav.longitud.toFixed(4)}</p>
                    <hr/>
                    <h4>Alertas (Notificar si es mayor a):</h4>
                    <p>🔴 PM2.5: <strong>{fav.umbral_pm25} µg/m³</strong></p>
                    <p>🟠 NO₂: <strong>{fav.umbral_no2} µg/m³</strong></p>
                    
                    <div style={{ marginTop: '15px' }}>
                        <button 
                            onClick={() => setEditingId(fav.id_ubicacion)} 
                            style={{ backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '5px 10px', marginRight: '10px', cursor: 'pointer' }}
                        >
                            Editar Umbrales
                        </button>
                        <button 
                            onClick={() => handleDelete(fav.id_ubicacion)} 
                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;