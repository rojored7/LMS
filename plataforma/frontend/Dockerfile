# ===== STAGE: BASE =====
FROM node:20-alpine AS base
WORKDIR /app

# ===== STAGE: DEPENDENCIES =====
FROM base AS dependencies

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# ===== STAGE: DEVELOPMENT =====
FROM base AS development

# Copiar dependencias
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de desarrollo
CMD ["npm", "start"]

# ===== STAGE: BUILD =====
FROM base AS build

# Variables de entorno para build
ARG VITE_API_URL
ARG VITE_EXECUTOR_URL
ARG VITE_ENV

ENV VITE_API_URL=${VITE_API_URL:-/api}
ENV VITE_EXECUTOR_URL=${VITE_EXECUTOR_URL:-/executor}
ENV VITE_ENV=${VITE_ENV:-production}
ENV NODE_ENV=production

# Copiar dependencias
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Build optimizado para producción
RUN npm run build

# ===== STAGE: PRODUCTION =====
FROM nginx:1.25-alpine AS production

# Copiar configuración de nginx
COPY nginx.production.conf /etc/nginx/conf.d/default.conf

# Copiar build de React
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar script de inicio que inyecta variables de entorno
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto (3000 para compatibilidad con docker-compose y nginx upstream)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Comando de inicio
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
