FROM nginx:1.25-alpine

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Crear directorio para SSL (aunque sea self-signed por ahora)
RUN mkdir -p /etc/nginx/ssl

# Crear directorio de logs
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Exponer puertos
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
