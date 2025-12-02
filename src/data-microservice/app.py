from flask import Flask, jsonify, request
from pymongo import MongoClient
import os
from bson.objectid import ObjectId
# Estos imports son necesarios para la función 'collect_data_manually' y el worker.py
# Aunque la ETL recurrente esté en worker.py, la lógica de apoyo se mantiene aquí si es necesaria.
import requests
from datetime import datetime

app = Flask(__name__)

# --- CONFIGURACIÓN DE CONEXIÓN ---
# La URI de MongoDB se obtiene de las variables de entorno de Docker Compose
MONGO_URI = os.environ.get('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['ecotrack_data']
LECTURAS_COLLECTION = db['Lecturas_Contaminantes']

# Parámetros para la API de OpenAQ
OPENAQ_API_URL = "https://api.openaq.org/v2/latest"
OPENAQ_PARAMETERS = {
    'country_id': 'ES', 
    'limit': 1000,
    'parameter': ['pm25', 'no2', 'co']
}


# --- FUNCIÓN DE NORMALIZACIÓN (MANTENIDA AQUÍ PARA LA ETL MANUAL O DE PRUEBA) ---

def normalize_reading(openaq_result):
    """
    Transforma un resultado de OpenAQ al esquema de Lecturas_Contaminantes.
    """
    normalized_data = []
    contaminant_map = {'co': 'CO', 'pm25': 'PM2.5', 'no2': 'NO2'}
    
    for location in openaq_result.get('results', []):
        location_id = location.get('location_id')
        station_name = location.get('name')
        
        for reading in location.get('measurements', []):
            contaminant_type = contaminant_map.get(reading.get('parameter'))
            
            if contaminant_type:
                timestamp_str = reading['date']['utc']
                # Asegura que la conversión del timestamp se haga correctamente
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

# --- FUNCIÓN DE ETL COMPLETA (MANTENIDA AQUÍ PARA LA ETL MANUAL O DE PRUEBA) ---

def run_etl_process():
    """Ejecuta la Extracción, Transformación y Carga de datos."""
    print("Iniciando proceso ETL...")

    try:
        response = requests.get(OPENAQ_API_URL, params=OPENAQ_PARAMETERS)
        response.raise_for_status()
        openaq_data = response.json()
        print(f"Datos extraídos: {len(openaq_data.get('results', []))} estaciones.")
    except requests.RequestException as e:
        print(f"Error en la extracción de OpenAQ: {e}")
        return False

    normalized_readings = normalize_reading(openaq_data)

    if normalized_readings:
        try:
            # Insertar múltiples documentos a la vez en MongoDB
            result = LECTURAS_COLLECTION.insert_many(normalized_readings)
            print(f"Carga exitosa. Documentos insertados: {len(result.inserted_ids)}")
            return True
        except Exception as e:
            print(f"Error en la carga a MongoDB: {e}")
            return False
    
    print("No hay datos para cargar.")
    return True


# --- ENDPOINTS DE LA API RESTful (FLASK) ---

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Endpoint para verificar si el microservicio y la BBDD están funcionando."""
    try:
        # Intenta un comando simple para verificar la conexión a MongoDB
        client.admin.command('ping')
        status = "ok"
    except Exception as e:
        status = f"error: {e}"

    return jsonify({"service": "Data Microservice", "status": status, "db": "MongoDB"}), 200

@app.route('/api/v1/data/latest', methods=['GET'])
def get_latest_readings():
    """
    Endpoint para obtener las últimas lecturas de contaminantes.
    Implementa la funcionalidad de Mapa en Tiempo Real.
    """
    try:
        # Usar un 'aggregation pipeline' o una consulta avanzada para obtener la última lectura
        # por Estación_ID para evitar devolver todos los datos crudos.
        
        # Agregación para obtener el último valor registrado para cada estación
        pipeline = [
            # 1. Agrupar por Estación_ID y encontrar el último timestamp
            {"$sort": {"Timestamp": -1}},
            {"$group": {
                "_id": "$Estación_ID",
                "Estación_Nombre": {"$first": "$Estación_Nombre"},
                "lat": {"$first": "$Geolocalización.lat"},
                "lon": {"$first": "$Geolocalización.lon"},
                "Contaminantes": {"$push": {
                    "Tipo": "$Tipo_Contaminante",
                    "Valor": "$Valor",
                    "Unidad": "$Unidad",
                    "Timestamp": "$Timestamp"
                }}
            }},
            # 2. Desenrollar y agrupar de nuevo para tener un objeto por estación con
            #    todos los contaminantes en una lista (simplificando la estructura para el frontend)
            # Para simplificar, limitaremos a 100 resultados
            {"$limit": 100}
        ]

        latest_data = list(LECTURAS_COLLECTION.aggregate(pipeline))

        # El resultado de la agregación ya está casi listo, solo necesitamos asegurar la serialización.
        return jsonify(latest_data), 200

    except Exception as e:
        return jsonify({"message": "Error al consultar las últimas lecturas", "error": str(e)}), 500

@app.route('/api/v1/data/history/<string:station_id>', methods=['GET'])
def get_historical_data(station_id):
    """
    Endpoint para obtener la serie temporal de contaminantes de una estación específica.
    Implementa la funcionalidad de Consulta Histórica.
    """
    try:
        # Consulta: obtén todas las lecturas para una Estación_ID en las últimas 48h (ejemplo)
        time_limit = datetime.now() - timedelta(hours=48)
        
        historical_readings = list(LECTURAS_COLLECTION.find({
            "Estación_ID": station_id,
            "Timestamp": {"$gte": time_limit}
        }).sort("Timestamp", 1))

        # Formatea la respuesta (ObjectId no es serializable JSON, convertir Timestamp a string)
        formatted_readings = []
        for reading in historical_readings:
            reading['_id'] = str(reading['_id'])
            reading['Timestamp'] = reading['Timestamp'].isoformat()
            formatted_readings.append(reading)

        return jsonify(formatted_readings), 200

    except Exception as e:
        return jsonify({"message": "Error al consultar datos históricos", "error": str(e)}), 500


@app.route('/api/v1/data/collect', methods=['POST'])
def collect_data_manually():
    """Endpoint para iniciar la recolección de datos bajo demanda (solo para pruebas o uso administrativo)."""
    success = run_etl_process()
    if success:
        return jsonify({"message": "Proceso ETL completado con éxito."}), 200
    else:
        return jsonify({"message": "Proceso ETL fallido. Revisar logs."}), 500


if __name__ == '__main__':
    # Usar puerto 5000 (el expuesto en Docker)
    app.run(host='0.0.0.0', port=5000, debug=True)