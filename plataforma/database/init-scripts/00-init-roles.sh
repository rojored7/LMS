#!/bin/bash
set -e

# Crear rol de aplicacion con privilegios minimos
# Solo se ejecuta en la primera inicializacion de PostgreSQL

CIBER_APP_PASS="${CIBER_APP_PASSWORD:-$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ciber_app') THEN
      CREATE ROLE ciber_app LOGIN PASSWORD '${CIBER_APP_PASS}';
      RAISE NOTICE 'Rol ciber_app creado.';
    END IF;
  END \$\$;

  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ciber_app;
  GRANT USAGE ON SCHEMA public TO ciber_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ciber_app;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ciber_app;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ciber_app;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ciber_app;
EOSQL

echo "Init roles completado. ciber_app password: ${CIBER_APP_PASS}"
