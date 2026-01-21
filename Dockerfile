FROM node:18-alpine

WORKDIR /app

# Copiar package.json del servidor
COPY server/package*.json ./

# Instalar dependencias del servidor
RUN npm install --production

# Copiar código del servidor
COPY server/ .

# Copiar cliente compilado a la carpeta correcta
COPY client/dist/client/browser ./client_dist

# Puerto que escucha el servidor
EXPOSE 8080

# Variables de entorno por defecto
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "server.js"]
