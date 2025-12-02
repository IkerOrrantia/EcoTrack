FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Usaremos un puerto diferente para este servicio
EXPOSE 5001 
CMD ["python", "app.py"]