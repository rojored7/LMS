#!/bin/sh
# Inyectar variables de entorno en runtime para el build estatico de React
# Las variables VITE_* se reemplazan en los archivos JS ya compilados

# Directorio del build
BUILD_DIR=/usr/share/nginx/html

# Reemplazar placeholders de env vars en los JS compilados (si hay)
if [ -n "$VITE_API_URL" ]; then
    find "$BUILD_DIR" -name '*.js' -exec sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" {} +
fi

# Ejecutar el comando original (nginx)
exec "$@"
