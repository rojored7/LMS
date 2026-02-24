# ===== STAGE: BASE =====
FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/cache/apk/*

# ===== STAGE: DEPENDENCIES =====
FROM base AS dependencies

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Instalar dependencias de desarrollo
RUN npm ci && \
    npx prisma generate

# ===== STAGE: DEVELOPMENT =====
FROM base AS development

# Copiar dependencias desde stage anterior
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Comando por defecto (puede ser sobreescrito en docker-compose)
CMD ["npm", "run", "dev"]

# ===== STAGE: BUILD =====
FROM base AS build

# Copiar dependencias
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copiar código fuente
COPY . .

# Build
RUN npm run build && \
    npx prisma generate

# ===== STAGE: PRODUCTION =====
FROM base AS production

# Variables de entorno
ENV NODE_ENV=production

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias de producción
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copiar build
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

# Crear directorio de uploads y logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Comando de inicio
CMD ["node", "dist/server.js"]
