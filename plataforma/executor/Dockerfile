# ===== STAGE: BASE =====
FROM node:20-alpine AS base
WORKDIR /app

# Instalar Docker CLI (para Docker-in-Docker)
RUN apk add --no-cache \
    docker-cli \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# ===== STAGE: DEPENDENCIES =====
FROM base AS dependencies

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Instalar todas las dependencias
RUN npm ci

# ===== STAGE: DEVELOPMENT =====
FROM base AS development

# Copiar dependencias
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Comando de desarrollo
CMD ["npm", "run", "dev"]

# ===== STAGE: BUILD =====
FROM base AS build

# Copiar dependencias
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# ===== STAGE: PRODUCTION =====
FROM base AS production

# Variables de entorno
ENV NODE_ENV=production

# Crear usuario no-root (pero necesita acceso a Docker socket)
RUN addgroup -g 1001 -S executor && \
    adduser -S executor -u 1001 -G executor

# Copiar dependencias de producción
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar build
COPY --from=build --chown=executor:executor /app/dist ./dist
COPY --chown=executor:executor package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown executor:executor /app/logs

# Cambiar a usuario no-root
USER executor

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Comando de inicio
CMD ["node", "dist/server.js"]
