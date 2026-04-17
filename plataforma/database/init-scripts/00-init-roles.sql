-- ============================================================
-- Crear rol de aplicacion con privilegios minimos
-- Se ejecuta automaticamente en la primera inicializacion de PostgreSQL
-- ============================================================

-- Crear rol ciber_app si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ciber_app') THEN
    CREATE ROLE ciber_app LOGIN PASSWORD 'changeme_app_password';
    RAISE NOTICE 'Rol ciber_app creado. Cambiar password en produccion.';
  END IF;
END $$;

-- Permisos DML sobre schema public
GRANT CONNECT ON DATABASE ciber_platform TO ciber_app;
GRANT USAGE ON SCHEMA public TO ciber_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ciber_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ciber_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ciber_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ciber_app;

-- NOTA: Para usar ciber_app como usuario de la aplicacion:
-- 1. Cambiar DB_PASSWORD en .env al password de ciber_app
-- 2. Cambiar DB_USER en .env a ciber_app
-- 3. Reiniciar: docker compose down && docker compose up -d
