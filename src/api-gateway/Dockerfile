# Usa una imagen base de Node.js
FROM node:18-alpine

WORKDIR /app

# Instala dependencias
COPY package.json .
RUN npm install

# Copia el código
COPY server.js .

# Expone el puerto del Gateway
EXPOSE 8080

CMD ["node", "server.js"]