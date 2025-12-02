# Usa una imagen base ligera de Python
FROM python:3.9-slim

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo de dependencias e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto de la aplicacion
COPY . .

# Expone el puerto por defecto de Flask
EXPOSE 5000

# Comando para ejecutar la aplicacion
CMD ["python", "app.py"]