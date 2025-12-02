import time
import os
from pymongo import MongoClient
import requests
from datetime import datetime
# Importa la función de normalización (la necesitarás, la puedes mover de app.py)

# --- CONFIGURACIÓN Y CONEXIÓN ---
MONGO_URI = os.environ.get('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['ecotrack_data']
LECTURAS_COLLECTION = db['Lecturas_Contaminantes']

# Parámetros y URL de OpenAQ (igual que en app.py)
OPENAQ_API_URL = "https://api.openaq.org/v2/latest"
OPENAQ_PARAMETERS = {
    'country_id': 'ES',
    'limit': 1000,
    'parameter': ['pm25', 'no2', 'co']
}

# Tasa de recolección (ej. cada 1 hora)
COLLECTION_INTERVAL_SECONDS = 3600 

# --- FUNCIÓN DE NORMALIZACIÓN Y ETL (Mover aquí desde app.py) ---

# [Aquí debes pegar las funciones `normalize_reading` y `run_etl_process` del Paso 2.1]

# --- LOOP PRINCIPAL DEL WORKER ---
if __name__ == '__main__':
    print("Iniciando Worker de Recolección de Datos...")
    while True:
        # 1. Ejecutar el proceso ETL
        run_etl_process()
        
        # 2. Esperar el intervalo definido
        print(f"ETL completada. Esperando {COLLECTION_INTERVAL_SECONDS / 60} minutos para la próxima ejecución...")
        time.sleep(COLLECTION_INTERVAL_SECONDS)