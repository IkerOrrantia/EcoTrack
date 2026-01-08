from flask import Flask, jsonify
from flask_cors import CORS  # 1. Importar CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)  # 2. Habilitar CORS para todas las rutas

# --- CONFIGURACIÓN DE CONEXIÓN ---
MONGO_URI = os.environ.get('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['ecotrack_data']
LECTURAS_COLLECTION = db['Lecturas_Contaminantes']

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    try:
        client.admin.command('ping')
        status = "ok"
    except Exception as e:
        status = f"error: {e}"
    return jsonify({"service": "Data Microservice", "status": status}), 200

@app.route('/api/v1/data/latest', methods=['GET'])
def get_latest_readings():
    try:
        pipeline = [
            {"$sort": {"Timestamp": -1}},
            {"$group": {
                "_id": "$Estación_ID",
                "Estación_Nombre": {"$first": "$Estación_Nombre"},
                "Timestamp": {"$first": "$Timestamp"},
                "Valor": {"$first": "$Valor"},
                "Unidad": {"$first": "$Unidad"},
                "Tipo_Contaminante": {"$first": "$Tipo_Contaminante"},
                "Geolocalizacion": {"$first": "$Geolocalización"}, # Mapeamos 'Geolocalización' a 'Geolocalizacion' para evitar líos de tildes en el JSON
            }},
            {"$project": {
                "_id": 0,
                "Estación_ID": "$_id",
                "Estación_Nombre": 1,
                "Timestamp": {"$dateToString": {"format": "%Y-%m-%dT%H:%M:%S", "date": "$Timestamp"}},
                "Valor": 1,
                "Unidad": 1,
                "Tipo_Contaminante": 1,
                "Geolocalizacion": 1,
            }}
        ]
        latest_data = list(LECTURAS_COLLECTION.aggregate(pipeline))
        return jsonify(latest_data), 200
    except Exception as e:
        return jsonify({"message": "Error", "error": str(e)}), 500

@app.route('/api/v1/data/history/<station_id>', methods=['GET'])
def get_historical_data(station_id):
    try:
        # Convertimos a int porque en tu Mongo el ID es numérico
        s_id = int(station_id) 
        time_limit = datetime.utcnow() - timedelta(hours=48)
        
        historical_readings = list(LECTURAS_COLLECTION.find({
            "Estación_ID": s_id,
            "Timestamp": {"$gte": time_limit}
        }).sort("Timestamp", 1))

        formatted_readings = []
        for reading in historical_readings:
            reading['_id'] = str(reading['_id'])
            reading['Timestamp'] = reading['Timestamp'].isoformat()
            formatted_readings.append(reading)
        return jsonify(formatted_readings), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/v1/data/near', methods=['GET'])
def get_nearest_data():
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        
        # Buscamos la lectura más reciente cerca de estas coordenadas
        # (Simplificado: buscamos la estación más cercana en nuestro último set de datos)
        reading = LECTURAS_COLLECTION.find_one(
            {}, 
            sort=[("Timestamp", -1)]
        )
        # Nota: En una versión Pro usarías un índice $near de MongoDB
        return jsonify(reading), 200
    except:
        return jsonify({"error": "No data found"}), 404

if __name__ == '__main__':
    # El puerto 5000 es el interno del contenedor
    app.run(host='0.0.0.0', port=5000, debug=True)