from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import bcrypt # Para hasheo de contraseñas
import jwt      # Para JSON Web Tokens (JWT)
from datetime import datetime, timedelta, timezone
from functools import wraps # Para el decorador JWT

app = Flask(__name__)
CORS(app)
# --- CONFIGURACIÓN Y CONEXIÓN ---

# Configuración de PostgreSQL (Usa las credenciales definidas en docker-compose)
POSTGRES_URI = 'postgresql://user:password@postgres:5432/ecotrack_users_db' 
app.config['SQLALCHEMY_DATABASE_URI'] = POSTGRES_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Clave secreta para firmar los JWT (viene de docker-compose)
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-fallback-key-debes-cambiarla') 

db = SQLAlchemy(app)

# --- MODELOS DE DATOS (Mapeo de Tablas) ---

# Ubicaciones Favoritas
class UbicacionFavorita(db.Model):
    __tablename__ = 'ubicaciones_favoritas'
    id_ubicacion = db.Column(db.Integer, primary_key=True)
    latitud = db.Column(db.Float, nullable=False)
    longitud = db.Column(db.Float, nullable=False)
    umbral_pm25 = db.Column(db.Integer)
    umbral_no2 = db.Column(db.Integer)
    nombre_ubicacion = db.Column(db.String(255), nullable=False)

# Usuario_Ubicacion (Tabla de unión Many-to-Many)
class UsuarioUbicacion(db.Model):
    __tablename__ = 'usuario_ubicacion'
    id_usuario_ubicacion = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_ubicacion = db.Column(db.Integer, db.ForeignKey('ubicaciones_favoritas.id_ubicacion'), nullable=False)
    __table_args__ = (db.UniqueConstraint('id_usuario', 'id_ubicacion', name='_user_location_uc'),)

# Usuarios
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    ubicaciones = db.relationship(
        'UbicacionFavorita', 
        secondary='usuario_ubicacion', 
        backref=db.backref('usuarios', lazy='dynamic'), 
        lazy='dynamic'
    )

# --- FUNCIÓN DECORADORA PARA PROTECCIÓN DE RUTAS ---

def token_required(f):
    """Decorador que verifica la validez del token JWT en el encabezado."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # El token se espera en el encabezado: Authorization: Bearer <token>
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Formato de token no válido (Esperado: Bearer <token>)'}), 401

        if not token:
            return jsonify({'message': 'Se requiere un token JWT'}), 401

        try:
            # Decodificar el token con la clave secreta
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            # Buscar al usuario basado en el ID del token
            current_user = db.session.get(Usuario, data['user_id'])
            if not current_user:
                 return jsonify({'message': 'Usuario no encontrado'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        # Pasa el objeto Usuario a la función decorada
        return f(current_user, *args, **kwargs)

    return decorated

# --- ENDPOINTS PÚBLICOS ---

@app.route('/api/v1/users/health', methods=['GET'])
def health_check():
    """Endpoint para verificar el estado del microservicio y la conexión a la BBDD."""
    try:
        # Intenta una consulta simple a la BBDD
        db.session.execute(db.select(1)) 
        db_status = "ok"
    except Exception:
        db_status = "error"
        
    return jsonify({"service": "User Microservice", "db_status": db_status}), 200

@app.route('/api/v1/users/register', methods=['POST'])
def register_user():
    """Endpoint para registrar un nuevo usuario."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Faltan email o contraseña"}), 400
    
    # Verificar si el usuario ya existe
    if Usuario.query.filter_by(email=email).first():
        return jsonify({"message": "El email ya está registrado"}), 409

    # Hashear la contraseña (CRUCIAL para seguridad)
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    new_user = Usuario(nombre=data.get('nombre'), email=email, password_hash=hashed_password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuario creado con éxito", "user_id": new_user.id_usuario}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al registrar usuario", "error": str(e)}), 500

@app.route('/api/v1/users/login', methods=['POST'])
def login_user():
    """Endpoint para autenticar al usuario y emitir un JWT."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Faltan email o contraseña"}), 400

    user = Usuario.query.filter_by(email=email).first()

    # Comprobar usuario y contraseña hasheada
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"message": "Email o contraseña incorrectos"}), 401

    # Creación del Payload del token
    token_payload = {
        'user_id': user.id_usuario,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24) # El token expira en 24h
    }
    
    # Codificación del token
    token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm="HS256")
    
    return jsonify({
        "message": "Login exitoso",
        "token": token
    }), 200

# --- ENDPOINTS PROTEGIDOS ---

@app.route('/api/v1/users/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    """Muestra el perfil del usuario autenticado."""
    return jsonify({
        "id": current_user.id_usuario,
        "nombre": current_user.nombre,
        "email": current_user.email
    })

@app.route('/api/v1/favorites', methods=['POST'])
@token_required
def add_favorite_location(current_user):
    """Crea una nueva ubicación favorita y la asocia al usuario."""
    data = request.get_json()
    
    required_fields = ['latitud', 'longitud', 'nombre_ubicacion']
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Faltan campos obligatorios (latitud, longitud, nombre_ubicacion)"}), 400

    # Crear la Ubicación
    new_location = UbicacionFavorita(
        latitud=data['latitud'],
        longitud=data['longitud'],
        nombre_ubicacion=data['nombre_ubicacion'],
        umbral_pm25=data.get('umbral_pm25'),
        umbral_no2=data.get('umbral_no2')
    )
    
    db.session.add(new_location)
    db.session.flush() # Obtener ID antes de commit

    # Asociar la ubicación al usuario
    user_location = UsuarioUbicacion(
        id_usuario=current_user.id_usuario,
        id_ubicacion=new_location.id_ubicacion
    )
    db.session.add(user_location)
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Ubicación favorita añadida", 
            "id_ubicacion": new_location.id_ubicacion
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al añadir la ubicación favorita", "error": str(e)}), 500

@app.route('/api/v1/favorites', methods=['GET'])
@token_required
def get_favorite_locations(current_user):
    """Obtiene todas las ubicaciones favoritas del usuario."""
    
    favorites = (db.session.query(UbicacionFavorita)
                 .join(UsuarioUbicacion)
                 .filter(UsuarioUbicacion.id_usuario == current_user.id_usuario)
                 .all())
    
    results = [{
        'id': f.id_ubicacion,
        'nombre': f.nombre_ubicacion,
        'latitud': f.latitud,
        'longitud': f.longitud,
        'umbral_pm25': f.umbral_pm25,
        'umbral_no2': f.umbral_no2,
    } for f in favorites]
    
    return jsonify(results), 200

@app.route('/api/v1/favorites/<int:location_id>', methods=['PUT'])
@token_required
def update_favorite_location(current_user, location_id):
    """Actualiza el nombre y umbrales de una ubicación favorita específica."""
    data = request.get_json()

    # 1. Verificar si la ubicación existe Y si pertenece al usuario actual
    user_location = (db.session.query(UsuarioUbicacion)
                     .filter(UsuarioUbicacion.id_usuario == current_user.id_usuario,
                             UsuarioUbicacion.id_ubicacion == location_id)
                     .first())
    
    if not user_location:
        return jsonify({"message": "Ubicación favorita no encontrada o no pertenece al usuario"}), 404

    # 2. Obtener la entidad UbicacionFavorita para actualizar
    location = db.session.get(UbicacionFavorita, location_id)

    # 3. Aplicar actualizaciones
    if 'nombre_ubicacion' in data:
        location.nombre_ubicacion = data['nombre_ubicacion']
    if 'umbral_pm25' in data:
        location.umbral_pm25 = data['umbral_pm25']
    if 'umbral_no2' in data:
        location.umbral_no2 = data['umbral_no2']

    try:
        db.session.commit()
        return jsonify({"message": "Ubicación favorita actualizada con éxito"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al actualizar", "error": str(e)}), 500

# --- INICIO DE LA APLICACIÓN ---

if __name__ == '__main__':
    # Inicializa las tablas si no existen (solo para desarrollo)
    with app.app_context():
        db.create_all()
    # Usar puerto 5001 (el expuesto en Docker)
    app.run(host='0.0.0.0', port=5001, debug=True)