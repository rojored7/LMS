# 🎓 Plataforma Multi-Curso de Ciberseguridad

> Sistema completo de gestión de aprendizaje (LMS) con soporte multi-curso, perfiles de entrenamiento, evaluaciones interactivas y laboratorios ejecutables.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue.svg)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Inicio Rápido](#-inicio-rápido)
- [Documentación](#-documentación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 Descripción

Plataforma educativa completa diseñada para ofrecer cursos de ciberseguridad de manera modular, con soporte para múltiples perfiles de entrenamiento (Desarrollador Backend, Security Analyst, DevSecOps, Pentester, CISO).

### ¿Qué Puedes Hacer?

- 🎓 **Estudiantes**: Inscribirse en cursos, completar lecciones, quizzes y laboratorios prácticos
- 👨‍🏫 **Instructores**: Gestionar cursos, evaluar proyectos, dar feedback
- 👨‍💼 **Administradores**: Ver progreso de todos los usuarios, gestionar perfiles, analytics globales
- 🔐 **Sistema de Roles**: Autenticación JWT con roles (ADMIN, INSTRUCTOR, STUDENT)
- 📊 **Tracking Completo**: Progreso por módulo, badges, certificados PDF
- 💻 **Labs Ejecutables**: Editor de código in-browser con ejecución en sandbox Docker

---

## ✨ Características Principales

### 🔐 Autenticación y Autorización
- Login/Registro con email y contraseña
- JWT con refresh tokens
- Sistema RBAC (Role-Based Access Control)
- Recuperación de contraseña por email
- Sesiones persistentes

### 📚 Sistema Multi-Curso
- Múltiples cursos modulares
- Perfiles de entrenamiento personalizados
- Contenido adaptado por perfil (Desarrollador, Analyst, DevSecOps, etc.)
- Sistema de inscripción y tracking

### 📖 Contenido Educativo
- Lecciones en formato Markdown
- Quizzes auto-calificados (multiple choice, true/false)
- Laboratorios con código ejecutable (Python, JavaScript, Bash)
- Proyectos finales con evaluación manual
- Feedback instantáneo

### 💻 Code Executor (Sandbox)
- Ejecución de código en containers Docker efímeros
- Soporte: Python 3, Node.js, Bash
- Seguridad: Network disabled, resource limits, timeout
- Validación automática con tests

### 👥 Panel de Administración
- Dashboard con estadísticas globales
- Gestión de usuarios (ver, editar, eliminar)
- Gestión de perfiles de entrenamiento
- Ver progreso individual de estudiantes
- Analytics de cursos

### 🎮 Gamificación
- Sistema de badges por módulo completado
- Certificados PDF al completar 100%
- Leaderboard (opcional)
- Notificaciones de logros

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand, React Query, Monaco Editor |
| **Backend** | Node.js 20, Express, TypeScript, Prisma ORM, JWT |
| **Database** | PostgreSQL 15, Redis 7 |
| **Code Executor** | Docker, Dockerode, Alpine Linux |
| **Infrastructure** | Docker Compose, Nginx, GitHub Actions |

### Servicios

```
┌─────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)            │
│                   Port 80 / 443                     │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼────┐  ┌────▼─────┐  ┌───▼──────┐
│  Frontend  │  │ Backend  │  │ Executor │
│  (React)   │  │ (Express)│  │ (Docker) │
│  Port 3000 │  │Port 4000 │  │Port 5000 │
└────────────┘  └─────┬────┘  └──────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  ┌─────▼──────┐ ┌───▼────────┐
  │ PostgreSQL │ │   Redis    │
  │ Port 5432  │ │ Port 6379  │
  └────────────┘ └────────────┘
```

### Modelo de Datos (Resumido)

- **User**: Usuarios con roles y perfiles
- **TrainingProfile**: Perfiles de entrenamiento (Backend Dev, Security Analyst, etc.)
- **Course**: Cursos modulares
- **Module**: Módulos de un curso
- **Lesson, Quiz, Lab**: Contenido educativo
- **Enrollment**: Inscripciones de usuarios a cursos
- **UserProgress**: Progreso por módulo
- **Certificate**: Certificados emitidos

Ver documentación completa en [`docs/arquitectura.md`](./docs/arquitectura.md)

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** >= 20.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0
- **Make** (opcional, para comandos simplificados)

### Instalación en 5 Minutos

```bash
# 1. Clonar el repositorio (si aún no lo tienes)
cd C:\Users\Itac\Proyectos\Curso_ciber\plataforma

# 2. Copiar variables de entorno
copy .env.example .env

# 3. Editar .env y configurar tus secretos
# Importante: Cambia JWT_SECRET, DB_PASSWORD, REDIS_PASSWORD

# 4. Levantar toda la plataforma (Docker Compose)
make start
# O sin Make:
# docker-compose up -d

# 5. Esperar a que los servicios estén listos (30-60 segundos)

# 6. Importar curso inicial de Ciberseguridad
make seed
# O sin Make:
# docker-compose run --rm importer npm run seed:ciber-course

# 7. ¡Listo! Acceder a la plataforma
```

### URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api-docs
- **Executor**: http://localhost:5000
- **Nginx**: http://localhost

### Credenciales por Defecto

Se crearán automáticamente al ejecutar el seed:

- **Admin**: `admin@ciberplatform.com` / `Admin123!`
- **Instructor**: `instructor@ciberplatform.com` / `Instructor123!`
- **Student**: `student@ciberplatform.com` / `Student123!`

---

## 📖 Documentación

### Documentación Principal

| Documento | Descripción |
|-----------|-------------|
| [`docs/arquitectura.md`](./docs/arquitectura.md) | Arquitectura técnica completa (1000+ líneas) |
| [`docs/backlog.md`](./docs/backlog.md) | Backlog de 45 historias de usuario |
| [`docs/historias-usuario/`](./docs/historias-usuario/) | Historias refinadas con criterios de aceptación |
| [`backend/README.md`](./backend/README.md) | Documentación del backend |
| [`frontend/README.md`](./frontend/README.md) | Documentación del frontend |
| [`executor/README.md`](./executor/README.md) | Documentación del executor |

### Guías Rápidas

- [Inicio Rápido](./docs/QUICKSTART.md)
- [Guía de Desarrollo](./docs/DEVELOPMENT.md)
- [Despliegue en Producción](./docs/DEPLOYMENT.md)
- [Contribuir](./CONTRIBUTING.md)
- [Seguridad](./SECURITY.md)

---

## 📁 Estructura del Proyecto

```
plataforma/
├── backend/                    # Backend API (Express + TypeScript)
│   ├── prisma/                # Schema y migraciones
│   ├── src/
│   │   ├── controllers/       # Lógica de endpoints
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── routes/            # Definición de rutas
│   │   ├── services/          # Lógica de negocio
│   │   ├── utils/             # Utilidades (Prisma, Redis)
│   │   └── server.ts          # Entry point
│   └── README.md
│
├── frontend/                   # Frontend SPA (React + TypeScript)
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas de la app
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API clients
│   │   ├── store/             # Zustand stores
│   │   └── types/             # TypeScript interfaces
│   └── README.md
│
├── executor/                   # Servicio de ejecución de código
│   ├── src/
│   │   ├── services/          # Docker executor, validator
│   │   ├── middleware/        # Rate limiting
│   │   └── server.ts
│   ├── Dockerfile.sandbox     # Imagen segura para ejecutar código
│   └── README.md
│
├── content-importer/           # Importador de cursos desde Markdown
│   └── src/
│       ├── parsers/           # Parsers de .md a DB
│       └── seeds/             # Seeds de datos iniciales
│
├── nginx/                      # Reverse proxy
│   ├── nginx.conf             # Configuración
│   └── Dockerfile
│
├── database/                   # Scripts de base de datos
│   ├── init-scripts/          # Inicialización
│   └── backups/               # Backups
│
├── docs/                       # Documentación
│   ├── arquitectura.md        # Arquitectura técnica
│   ├── backlog.md             # Backlog priorizado
│   ├── historias-usuario/     # 45 historias refinadas
│   └── testing/               # Resultados de tests
│
├── scripts/                    # Scripts de utilidad
│   ├── start.sh               # Inicio rápido
│   ├── seed-data.sh           # Import datos
│   └── backup.sh              # Backup DB
│
├── docker-compose.yml          # Orquestación de servicios
├── Makefile                    # Comandos simplificados
├── .env.example                # Template de variables
└── README.md                   # Este archivo
```

---

## 🛠️ Desarrollo

### Comandos Disponibles (Makefile)

```bash
# Gestión de servicios
make start          # Inicia toda la plataforma
make stop           # Detiene servicios
make restart        # Reinicia
make logs           # Ver logs en tiempo real
make status         # Ver estado del proyecto

# Desarrollo
make shell-backend  # Abrir shell en backend
make shell-frontend # Abrir shell en frontend
make shell-db       # Abrir psql en PostgreSQL
make migrate        # Ejecutar migraciones Prisma

# Testing
make test           # Ejecutar todos los tests
make test-backend   # Tests del backend
make test-frontend  # Tests del frontend

# Gestión de contenido
make seed           # Importar curso inicial
make add-course     # Agregar nuevo curso
make reset-db       # Reiniciar base de datos

# Utilidades
make backup         # Backup de base de datos
make clean          # Limpiar containers y volúmenes
make build          # Reconstruir imágenes Docker
```

### Variables de Entorno

Edita el archivo `.env` con tus configuraciones:

```env
# Base de datos
DB_NAME=ciber_platform
DB_USER=ciber_admin
DB_PASSWORD=<tu-password-segura>

# JWT Secrets (generar con: openssl rand -base64 32)
JWT_SECRET=<tu-secret-minimo-32-caracteres>
JWT_REFRESH_SECRET=<tu-refresh-secret-minimo-32-caracteres>

# Email (para recuperación de contraseña)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=<tu-email>
EMAIL_PASSWORD=<tu-app-password>

# ... ver .env.example para todas las opciones
```

### Agregar Nuevos Cursos

```bash
# Script interactivo
make add-course

# Te preguntará:
# - Ruta a la carpeta del curso (markdown)
# - Slug del curso
# - Título
# - Perfiles de entrenamiento aplicables
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
make test

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# End-to-End
cd frontend && npm run test:e2e
```

### Cobertura de Tests

Los umbrales de cobertura están configurados en:
- **Backend**: 70% (branches, functions, lines, statements)
- **Frontend**: 70%

```bash
# Ver cobertura
make coverage
```

---

## 🚀 Deployment

### Docker Compose (Recomendado)

```bash
# Producción
NODE_ENV=production docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# O con Make
make deploy
```

### Variables de Entorno para Producción

```env
NODE_ENV=production
JWT_SECRET=<secret-muy-seguro-64-caracteres>
DB_PASSWORD=<password-fuerte>
REDIS_PASSWORD=<password-fuerte>
CORS_ORIGIN=https://tudominio.com
FRONTEND_URL=https://tudominio.com
# ... etc
```

### Health Checks

Los servicios exponen endpoints de health check:

- **Backend**: `GET /health`
- **Backend Readiness**: `GET /health/ready` (verifica DB y Redis)
- **Executor**: `GET /health`
- **Nginx**: `GET /health`

### Backups

```bash
# Crear backup
make backup

# Se guardará en: database/backups/backup-YYYY-MM-DD_HH-MM.sql

# Restaurar backup
docker-compose exec postgres psql -U ciber_admin -d ciber_platform < backup.sql
```

---

## 📊 Progreso del Desarrollo

### Estado Actual

```
✅ Documentación Completa (100%)
   ├─ docs/arquitectura.md (1000+ líneas)
   ├─ docs/backlog.md (45 historias)
   └─ docs/historias-usuario/ (45 archivos .md)

✅ Infraestructura Docker (100%)
   ├─ docker-compose.yml (7 servicios)
   ├─ Dockerfiles (backend, frontend, executor, nginx)
   └─ Makefile (20+ comandos)

✅ Backend Base (70%)
   ├─ Prisma schema completo (15 modelos) ✅
   ├─ Server Express configurado ✅
   ├─ Middlewares (auth, error handling, logging) ✅
   ├─ Utils (Prisma, Redis singletons) ✅
   ├─ Controllers (pendiente - Sprint 1)
   ├─ Routes (pendiente - Sprint 1)
   └─ Services (pendiente - Sprint 1)

✅ Frontend Base (90%)
   ├─ Componentes comunes ✅
   ├─ Layout (Header, Footer, Sidebar) ✅
   ├─ Páginas (Login, Register, Dashboard, Admin) ✅
   ├─ Services (API, Auth) ✅
   ├─ Store (Zustand) ✅
   ├─ Hooks ✅
   └─ Integración con Backend (pendiente - Sprint 1)

✅ Executor Base (100%)
   ├─ Docker executor service ✅
   ├─ Sandbox image ✅
   ├─ Validator ✅
   └─ Rate limiting ✅
```

### Próximos Sprints

**Sprint 1 (HU-001 a HU-005): Autenticación** - En progreso
- HU-001: Registro de Usuario
- HU-002: Login con Credenciales
- HU-003: Sistema de Roles RBAC
- HU-004: Middleware de Autenticación
- HU-005: Recuperación de Contraseña

**Sprint 2 (HU-006 a HU-010): Dashboard Admin**
**Sprint 3 (HU-011 a HU-015): Sistema Multi-Curso**
**Sprint 4-6**: Contenido, Labs, Proyectos

---

## 👥 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee la [guía de contribución](./CONTRIBUTING.md).

### Proceso

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- **TypeScript strict mode**
- **ESLint + Prettier** configurados
- **Commits convencionales**: `feat:`, `fix:`, `docs:`, etc.
- **Tests** para nueva funcionalidad
- **Documentación** actualizada

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **React Team** - Por React y sus herramientas
- **Prisma Team** - Por el mejor ORM de TypeScript
- **Vercel** - Por Next.js inspiration
- **Tailwind CSS** - Por el mejor framework de CSS utility-first
- **Docker** - Por la containerización

---

## 📞 Soporte

¿Necesitas ayuda? Abre un [issue](https://github.com/tu-usuario/tu-repo/issues) o contacta al equipo.

---

## 🗺️ Roadmap

- [x] Setup inicial e infraestructura
- [x] Documentación completa
- [x] Backend base (Prisma, Express, Redis)
- [x] Frontend base (React, Tailwind, Zustand)
- [x] Executor service
- [ ] Sprint 1: Autenticación (en progreso)
- [ ] Sprint 2: Dashboard Admin
- [ ] Sprint 3: Sistema Multi-Curso
- [ ] Sprint 4-6: Contenido, Labs, Proyectos
- [ ] v1.0 Release

---

<div align="center">

**[⬆ Volver arriba](#-plataforma-multi-curso-de-ciberseguridad)**

Hecho con ❤️ por el equipo de desarrollo

</div>
