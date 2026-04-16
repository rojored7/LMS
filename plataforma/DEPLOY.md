# Guia de Despliegue - Plataforma LMS Ciberseguridad

## Requisitos

- Docker >= 20.10
- Docker Compose >= 2.0
- git
- 4GB RAM minimo
- 10GB disco libre

Verificar:
```bash
docker --version
docker compose version
```

---

## 1. Instalacion desde cero

```bash
# Clonar repositorio
git clone https://github.com/rojored7/LMS.git
cd LMS/plataforma

# Dar permisos a los scripts
chmod +x setup.sh cleanup.sh

# Instalar (puerto 80 por defecto)
./setup.sh
```

Si el puerto 80 esta ocupado:
```bash
# Especificar puerto manualmente
./setup.sh --port 8080

# O dejar que detecte un puerto libre
./setup.sh --port auto
```

Al finalizar el script muestra la URL y credenciales del admin.

---

## 2. Acceso

| Servicio | URL |
|----------|-----|
| Plataforma | http://localhost (o el puerto que eligio) |
| Backend API | http://localhost:4000/api |
| Swagger docs | http://localhost:4000/api-docs |

Credenciales del admin: las muestra el setup.sh al finalizar.

---

## 3. Importar cursos

Los cursos se importan desde archivos ZIP o directorios con contenido en Markdown.

```bash
cd LMS/plataforma

# Importar un curso desde directorio
docker compose exec backend python -m app.scripts.import_course \
  --content-dir /content/contenidos/NOMBRE_CURSO --publish --force

# Importar desde ZIP (via interfaz web)
# Login como admin -> /admin/courses -> Importar
```

---

## 4. Actualizar (cuando hay cambios en el repo)

```bash
cd ~/LMS

# Descartar cambios locales si los hay
git checkout -- .

# Bajar cambios
git pull origin master

# Rebuild y restart (conserva datos de DB y Redis)
cd plataforma
docker compose up -d --build
```

Los datos de usuarios, cursos y progreso se conservan entre actualizaciones.

---

## 5. Parar servicios (sin perder datos)

```bash
cd ~/LMS/plataforma
docker compose down
```

Para volver a levantar:
```bash
docker compose up -d
```

---

## 6. Reiniciar servicios

```bash
cd ~/LMS/plataforma

# Reiniciar todo
docker compose restart

# Reiniciar solo un servicio
docker compose restart backend
docker compose restart frontend
```

---

## 7. Ver logs

```bash
cd ~/LMS/plataforma

# Todos los servicios
docker compose logs -f

# Solo un servicio
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f executor
docker compose logs -f postgres
docker compose logs -f nginx

# Ultimas 50 lineas
docker compose logs --tail 50 backend
```

---

## 8. Limpiar instalacion / Desinstalar

Tres niveles de limpieza:

```bash
cd ~/LMS/plataforma

# SUAVE: para containers, conserva datos y configuracion
./cleanup.sh

# COMPLETO: elimina datos, imagenes construidas y .env
./cleanup.sh --full

# NUCLEAR: elimina absolutamente todo (imagenes base incluidas)
./cleanup.sh --nuclear
```

Agregar `-f` para saltar confirmacion:
```bash
./cleanup.sh --full -f
```

---

## 9. Reinstalar desde cero (despues de una falla)

```bash
cd ~/LMS/plataforma

# Limpiar todo
./cleanup.sh --full -f

# Volver a instalar
./setup.sh --port 8080
```

---

## 10. Backup y restauracion de base de datos

### Crear backup
```bash
cd ~/LMS/plataforma
docker compose exec postgres pg_dump -U ciber_admin ciber_platform > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
cd ~/LMS/plataforma
docker compose exec -T postgres psql -U ciber_admin ciber_platform < backup_20260416.sql
```

---

## 11. Acceso a base de datos

```bash
cd ~/LMS/plataforma
docker compose exec postgres psql -U ciber_admin -d ciber_platform
```

Consultas utiles:
```sql
-- Ver usuarios
SELECT email, role, name FROM users ORDER BY role;

-- Ver cursos
SELECT title, is_published, duration FROM courses;

-- Ver inscripciones
SELECT u.email, c.title, e.progress
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id;
```

---

## 12. Cambiar password de un usuario

```bash
cd ~/LMS/plataforma

# Generar hash
docker compose exec backend python -c "
from app.services.auth_service import hash_password
print(hash_password('NuevaPassword123!'))
"

# Actualizar en DB (reemplazar el hash y email)
docker compose exec postgres psql -U ciber_admin -d ciber_platform -c "
UPDATE users SET password_hash='HASH_GENERADO' WHERE email='usuario@email.com';
"
```

---

## 13. Crear usuario admin adicional

```bash
cd ~/LMS/plataforma

HASH=$(docker compose exec backend python -c "
from app.services.auth_service import hash_password
print(hash_password('MiPassword123!'))
" | tail -1)

docker compose exec postgres psql -U ciber_admin -d ciber_platform -c "
INSERT INTO users (id, email, password_hash, name, role, xp, theme, locale, created_at, updated_at)
VALUES (
  '$(openssl rand -hex 16)',
  'nuevo.admin@email.com',
  '$HASH',
  'Nuevo Admin',
  'ADMIN',
  0, 'system', 'es', NOW(), NOW()
);
"
```

---

## 14. Estado de los servicios

```bash
cd ~/LMS/plataforma

# Ver estado de containers
docker compose ps

# Health checks
curl http://localhost:4000/health          # Backend
curl http://localhost:5000/health          # Executor
curl http://localhost/api/health           # Nginx -> Backend
```

---

## 15. Estructura de puertos

| Puerto | Servicio | Notas |
|--------|----------|-------|
| 80 (configurable) | Nginx | Entry point principal |
| 3000 | Frontend | React/Vite dev server |
| 4000 | Backend | FastAPI |
| 5000 | Executor | Ejecucion de codigo |
| 5433 | PostgreSQL | Base de datos |
| 6380 | Redis | Cache y sesiones |

Los puertos 3000-6380 son internos (127.0.0.1). Solo Nginx se expone publicamente.

---

## 16. Solucion de problemas

### Puerto ocupado
```bash
# Ver que usa el puerto
sudo lsof -i :80
# o
sudo ss -tlnp | grep :80

# Opcion A: matar el proceso
sudo systemctl stop apache2
sudo systemctl stop nginx

# Opcion B: usar otro puerto
./setup.sh --port 8080
```

### Container no arranca
```bash
# Ver logs del container con problemas
docker compose logs backend
docker compose logs executor

# Reiniciar solo ese servicio
docker compose restart backend
```

### Base de datos no conecta
```bash
# Verificar que postgres esta corriendo
docker compose ps postgres

# Ver logs de postgres
docker compose logs postgres

# Verificar conexion
docker compose exec postgres pg_isready
```

### Migraciones fallan
```bash
# Ver estado actual de migraciones
docker compose exec backend python -m alembic current

# Forzar migracion
docker compose exec backend python -m alembic upgrade head
```

### Limpiar y empezar de nuevo
```bash
./cleanup.sh --full -f
./setup.sh --port 8080
```

### Conflictos al hacer git pull
```bash
cd ~/LMS
git checkout -- .
git pull origin master
cd plataforma
docker compose up -d --build
```
