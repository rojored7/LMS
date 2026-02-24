FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    git \
    && rm -rf /var/cache/apk/*

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Build
RUN npm run build || echo "No build script"

# Comando por defecto
CMD ["npm", "run", "seed:help"]
