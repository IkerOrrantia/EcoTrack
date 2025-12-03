import time
import os
from pymongo import MongoClient
import requests
from datetime import datetime

# --- CONFIGURACIÓN Y CONEXIÓN ---
# Se conecta al contenedor 'mongodb' usando la URI definida en docker-compose
MONGO_URI = os.environ.get('MONGO_URI')
# Se espera que MONGO_URI sea algo como: mongodb://ecouser:ecopassword@mongodb:27017/ecotrack_data?authSource=admin
client = MongoClient(MONGO_URI)
db = client['ecotrack_data']
LECTURAS_COLLECTION = db['Lecturas_Contaminantes']

# Parámetros para la API de OpenAQ
OPENAQ_API_URL = "https://api.openaq.org/v2/latest"
OPENAQ_PARAMETERS = {
    'country_id': 'ES', # Ejemplo: España
    'limit': 1000,
    'parameter': ['pm25', 'no2', 'co']
}

# Tasa de recolección (ej. cada 60 minutos = 3600 segundos)
COLLECTION_INTERVAL_SECONDS = 3600 


# --- FUNCIÓN DE NORMALIZACIÓN (T) ---
def normalize_reading(openaq_result):
    """
    Transforma un resultado de OpenAQ al esquema de Lecturas_Contaminantes.
    Realiza la Normalización de formatos/unidades (T).
    """
    normalized_data = []
    
    # Mapeo de contaminantes según el modelo de datos del proyecto
    contaminant_map = {'co': 'CO', 'pm25': 'PM2.5', 'no2': 'NO2'} 
    
    for location in openaq_result.get('results', []):
        location_id = location.get('location_id')
        station_name = location.get('name')
        
        for reading in location.get('measurements', []):
            contaminant_type = contaminant_map.get(reading.get('parameter'))
            
            if contaminant_type:
                # Convertir el timestamp de OpenAQ a datetime
                timestamp_str = reading['date']['utc']
                timestamp_dt = datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%S+00:00')
                
                normalized_data.append({
                    'Estación_ID': location_id,
                    'Estación_Nombre': station_name,
                    'Tipo_Contaminante': contaminant_type,
                    'Valor': reading.get('value'),
                    'Unidad': reading.get('unit'),
                    'Timestamp': timestamp_dt, 
                    'Geolocalización': {
                        'lat': location['coordinates']['latitude'],
                        'lon': location['coordinates']['longitude']
                    }
                })
                
    return normalized_data

# --- FUNCIÓN DE ETL COMPLETA (E, T, L) ---
def run_etl_process():
    """Ejecuta la Extracción, Transformación y Carga de datos."""
    print("Iniciando proceso ETL...")

    # 1. Extracción (E)
    try:
        response = requests.get(OPENAQ_API_URL, params=OPENAQ_PARAMETERS)
        response.raise_for_status() 
        openaq_data = response.json()
        print(f"Datos extraídos: {len(openaq_data.get('results', []))} estaciones.")
    except requests.RequestException as e:
        print(f"Error en la extracción de OpenAQ: {e}")
        return False

    # 2. Transformación (T)
    normalized_readings = normalize_reading(openaq_data)
    print(f"Lecturas normalizadas listas para cargar: {len(normalized_readings)}")

    # 3. Carga (L)
    if normalized_readings:
        try:
            # Insertar múltiples documentos a la vez en MongoDB
            # Nota: Esto no maneja duplicados. Se podria mejorar con insert_one + upsert
            result = LECTURAS_COLLECTION.insert_many(normalized_readings)
            print(f"Carga exitosa. Documentos insertados: {len(result.inserted_ids)}")
            return True
        except Exception as e:
            print(f"Error en la carga a MongoDB: {e}")
            return False
    
    print("No hay datos para cargar.")
    return True

# --- LOOP PRINCIPAL DEL WORKER ---
if __name__ == '__main__':
    # Es importante esperar un momento para asegurar que MongoDB esté completamente listo
    print("Worker: Esperando 10 segundos para asegurar conexión con BBDD...")
    time.sleep(10)
    
    print("Iniciando Worker de Recolección de Datos...")
    while True:
        # 1. Ejecutar el proceso ETL
        run_etl_process()
        
        # 2. Esperar el intervalo definido
        wait_time_minutes = COLLECTION_INTERVAL_SECONDS / 60
        print(f"ETL completada. Esperando {wait_time_minutes:.1f} minutos para la próxima ejecución...")
        time.sleep(COLLECTION_INTERVAL_SECONDS)