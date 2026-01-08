import time
import os
import requests
import json # Necesario para el debug
from pymongo import MongoClient
from datetime import datetime
# No necesitamos timedelta en esta estrategia de peticiones individuales

# --- CONFIGURACIÓN Y CONEXIÓN ---
MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["ecotrack_data"]
LECTURAS_COLLECTION = db["Lecturas_Contaminantes"]

# --- CONFIGURACIÓN DE OPENAQ ---
BASE_API_URL = "https://api.openaq.org/v3"
API_KEY = os.environ.get("OPENAQ_API_KEY")
COLLECTION_INTERVAL_SECONDS = 3600

# --- FUNCIÓN DE UTILIDAD ---

def fetch_openaq_data(endpoint, params=None, retries=3):
    url = f"{BASE_API_URL}/{endpoint}"
    headers = {
        "X-API-Key": API_KEY
    }

    for attempt in range(1, retries + 1):
        try:
            # ⚠️ Agregamos verify=False para manejar el InsecureRequestWarning sin mezclar con la lógica
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=30,
            )

            if response.status_code == 429:
                wait_time = 30 * attempt
                print(f"Rate limit alcanzado. Esperando {wait_time}s...")
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            # Quitamos el print detallado para no llenar los logs, a menos que sea 404
            if response is not None and response.status_code == 404:
                 pass # Evitamos imprimir 404s recurrentes, ya que significa "No data found"
            return None

    print(f"Abortando {endpoint} tras demasiados 429.")
    return None

# --- FUNCIÓN DE NORMALIZACIÓN ---

def normalize_latest_readings(openaq_data, location_id, station_name, coordinates, sensor_map):
    """
    Normaliza el resultado de /locations/{id}/latest, usando el mapeo de sensores.
    """
    normalized_data = []
    contaminant_map = {"co": "CO", "pm25": "PM2.5", "no2": "NO2"}

    for item in openaq_data.get("results", []):
        
        # 1. Obtener el ID del sensor y buscar su parámetro en el mapa
        sensor_id = item.get("sensorsId")
        if sensor_id is None: continue
        
        parameter_key = sensor_map.get(sensor_id)
        if parameter_key is None or parameter_key.lower() not in contaminant_map: 
            continue

        contaminant_type = contaminant_map[parameter_key.lower()]
        
        # 2. Conversión de Timestamp
        timestamp_str = item.get("datetime", {}).get("utc") 
        if not timestamp_str: continue 

        try:
            timestamp_dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        except ValueError:
            continue

        # 3. Construcción del documento
        normalized_data.append({
            "Estación_ID": location_id,
            # Usamos el nombre de la estación obtenido en el Paso 1
            "Estación_Nombre": station_name, 
            "Tipo_Contaminante": contaminant_type,
            "Valor": item.get("value"),
            # La unidad debe venir del metadato del sensor, pero la dejamos N/A o la buscamos si es necesario.
            # Temporalmente la dejamos como la devuelve el endpoint latest (aunque es limitado)
            "Unidad": "N/A", 
            "Timestamp": timestamp_dt,
            "Geolocalización": {
                # Usamos las coordenadas obtenidas en el Paso 1
                "lat": coordinates.get("latitude"),
                "lon": coordinates.get("longitude")
            }
        })

    return normalized_data

# --- FUNCIÓN DE ETL COMPLETA ---

def run_etl_process():
    print("Iniciando proceso ETL...")

    if not API_KEY:
        print("ERROR: OPENAQ_API_KEY no configurada.")
        return False

    # 1. Obtener Metadatos de Ubicación (Lista de Estaciones)
    print("-> 1. Obteniendo Metadatos de Ubicación")
    locations_data = fetch_openaq_data(
        "locations",
        # Obtenemos todas las ubicaciones y sus metadatos (incluidos sensores)
        params={"country_iso": "Europe/Madrid", "limit": 1000} 
    )

    if not locations_data or "results" not in locations_data:
        print("No se pudieron obtener ubicaciones.")
        return False

    locations = locations_data["results"]
    print(f"-> Ubicaciones encontradas: {len(locations)}")

    # 2. Obtener últimas lecturas por estación
    print("-> 2. Obteniendo lecturas más recientes por estación...")
    all_readings = []
    debug_printed = False

    for idx, loc in enumerate(locations, start=1):
        location_id = loc.get("id")
        station_name = loc.get("name")
        coordinates = loc.get("coordinates", {})
        
        # 2A. Crear Mapa SensorID -> Parámetro (ej: 3920 -> pm25)
        # Esto es crucial para la normalización, usando los metadatos del Paso 1
        sensor_map = {}
        for sensor in loc.get("sensors", []):
            sensor_id = sensor.get("id")
            parameter_name = sensor.get("parameter", {}).get("name")
            if sensor_id and parameter_name:
                sensor_map[sensor_id] = parameter_name.lower()

        # 2B. Obtener los valores recientes (usando /latest)
        endpoint = f"locations/{location_id}/latest"
        
        # No usamos el filtro parameter aquí, ya que el endpoint /latest no siempre lo soporta
        data = fetch_openaq_data(endpoint) 

        # 💥 DEBUG 1: Imprimir el JSON crudo del primer resultado
        if not debug_printed:
            print("-" * 50)
            print(f"DEBUG: JSON CRUDO /latest PARA {location_id} ({station_name}):")
            print(json.dumps(data, indent=2))
            print(f"DEBUG: Sensor Map creado: {json.dumps(sensor_map)}")
            print("-" * 50)
            debug_printed = True
        
        # Si no hay datos (found: 0), continuamos
        if not data or not data.get('results'):
            # print(f"Sin datos recientes (found: 0) para estación {location_id}.")
            pass 
        else:
            # 3. Normalización (T) - Usando el mapa de sensores y metadatos
            normalized = normalize_latest_readings(data, location_id, station_name, coordinates, sensor_map)
            
            if normalized:
                 print(f"DEBUG: ¡ÉXITO! {len(normalized)} lecturas normalizadas para {location_id}")
            
            all_readings.extend(normalized)

        print(f"Estación {location_id} procesada ({idx}/{len(locations)})")

        # Pequeña pausa para no saturar la API
        time.sleep(0.6) 

    if not all_readings:
        print("No se obtuvieron lecturas.")
        return False

    # 4. Carga en MongoDB
    try:
        result = LECTURAS_COLLECTION.insert_many(all_readings)
        print(f"Carga exitosa. Documentos insertados: {len(result.inserted_ids)}")
        return True
    except Exception as e:
        print(f"Error al insertar en MongoDB: {e}")
        return False

# --- LOOP PRINCIPAL DEL WORKER ---

if __name__ == "__main__":
    print("Worker: Esperando 10 segundos para asegurar conexión con BBDD...")
    time.sleep(10)

    print("Iniciando Worker de Recolección de Datos...")
    while True:
        run_etl_process()
        print(f"ETL completada. Esperando {COLLECTION_INTERVAL_SECONDS / 60:.1f} minutos...")
        time.sleep(COLLECTION_INTERVAL_SECONDS)