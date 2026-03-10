# 🎓 Proyecto: Sistema LMS Multi-Curso + Contenidos de Ciberseguridad

**Sistema de gestión de aprendizaje (LMS)** con laboratorios ejecutables + Material educativo de ciberseguridad.

> **Estado**: LMS 95% completo | Contenidos 70% completos | 100% funcional

---

## 📋 Descripción General

Este repositorio contiene **DOS componentes principales**:

### 1️⃣ Plataforma LMS (`plataforma/`) - **SOFTWARE**
Sistema de gestión de aprendizaje (LMS) con:
- Backend API REST (Node.js + TypeScript)
- Frontend React (21 páginas + 69 componentes)
- Autenticación JWT + RBAC
- Laboratorios ejecutables en Docker
- Gamificación (XP, badges, certificados)

**Estado**: 95% completo, 100% funcional

### 2️⃣ Contenidos Educativos (`contenidos/curso_ciberseguridad/`) - **MATERIAL**
Curso de ciberseguridad postcuántica (40h):
- 10 módulos en Markdown
- Teorías, laboratorios, evaluaciones
- Enfoque en ANKASecure

**Estado**: 70% completo (módulos 01-02 listos)

---

## 🚀 Inicio Rápido

### Opción 1: Iniciar el LMS (Recomendado)

```bash
# Clonar repositorio
git clone <repo-url>
cd Curso_ciber/plataforma

# Iniciar servicios (Docker Compose)
docker-compose up -d

# Seed de datos iniciales
docker exec ciber-backend npm run seed:curso

# Acceso
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# API Docs: http://localhost:4000/api-docs

# Usuario admin: admin@ciberplatform.com / Admin123!
```

Ver documentación completa: [`ESTADO_LMS.md`](./ESTADO_LMS.md)

### Opción 2: Ver solo los contenidos

```bash
# Navegar a los contenidos
cd contenidos/curso_ciberseguridad

# Ver temario
cat 00_TEMARIO_COMPLETO.md

# Ver módulo 01
cd 01_Fundamentos_Ciberseguridad
```

Ver documentación: `contenidos/curso_ciberseguridad/00_TEMARIO_COMPLETO.md`

---

## 📂 Estructura del Proyecto

```
Curso_ciber/
├── plataforma/                      # Sistema LMS (código)
│   ├── backend/                     # API REST (Node.js + TypeScript)
│   ├── frontend/                    # Web App (React + TypeScript)
│   ├── executor/                    # Docker Executor (sandboxing)
│   ├── docs/                        # Documentación técnica
│   │   └── historias-usuario/       # User stories (30 completadas)
│   ├── docker-compose.yml           # Infraestructura
│   └── CLAUDE.md                    # Guía de desarrollo
│
├── contenidos/                      # Material educativo (Markdown)
│   └── curso_ciberseguridad/
│       ├── 01_Fundamentos_Ciberseguridad/
│       ├── 02_Redes_y_Protocolos/
│       ├── 03-10/                   # Otros módulos
│       ├── 00_TEMARIO_COMPLETO.md   # Temario del curso (40h)
│       └── PROGRESO_CONTENIDOS.md   # Estado del contenido
│
├── ESTADO_LMS.md                    # Estado del sistema LMS
├── CLAUDE.md                        # Guía global del proyecto
├── cleanup.sh                       # Script de limpieza
└── README.md                        # Este archivo
```

---

## 📚 Contenidos del Curso (40 horas)

**10 módulos** de ciberseguridad postcuántica (ver `contenidos/curso_ciberseguridad/00_TEMARIO_COMPLETO.md` para detalles completos)

---

## 🎯 Diferencia Importante: LMS vs Contenidos

### ✅ Plataforma LMS (Software)
- **Qué es**: Sistema de gestión de cursos (como Moodle, Canvas)
- **Tecnología**: Node.js, React, Docker, PostgreSQL
- **Objetivo**: Plataforma REUTILIZABLE para CUALQUIER curso
- **Estado**: 95% completo, 100% funcional
- **LOC**: ~71,550 líneas de código

### 📚 Contenidos (Material Educativo)
- **Qué es**: Material de aprendizaje en Markdown
- **Tecnología**: Archivos .md con teoría, labs, evaluaciones
- **Objetivo**: Curso ESPECÍFICO de ciberseguridad
- **Estado**: 70% completo (módulos 01-02 listos)

**Nota**: La plataforma LMS puede funcionar con CUALQUIER contenido, no solo ciberseguridad.

---

## 🚀 Stack Tecnológico

### Backend
- Node.js 20 + TypeScript 5.3
- Express 4 (REST API)
- Prisma ORM (PostgreSQL 15)
- Redis 7 (cache + sessions)
- JWT (autenticación)
- Docker (code executor sandbox)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- Monaco Editor (code editor)
- xterm.js (terminal)

### Infraestructura
- Docker Compose
- Nginx (reverse proxy)
- PostgreSQL 15
- Redis 7
- Playwright (E2E tests)

---

## 📊 Métricas del Proyecto LMS

```
Backend:     ~22,500 LOC (147+ archivos)
Frontend:    ~18,750 LOC (110+ archivos)
Tests:       ~10,500 LOC (67 archivos)
Docs:        ~15,000 LOC
TOTAL:       ~71,550 LOC
```

**Features**: 30 historias de usuario completadas (204 story points)

---

## 🔧 Desarrollo

```bash
# Backend
cd plataforma/backend
npm install
npm run dev

# Frontend
cd plataforma/frontend
npm install
npm run dev

# Tests
npm test
```

Ver `plataforma/CLAUDE.md` para guía completa de desarrollo.

---

## 📝 Documentación

### Plataforma LMS
- [`ESTADO_LMS.md`](./ESTADO_LMS.md) - Estado actual detallado
- [`plataforma/CLAUDE.md`](./plataforma/CLAUDE.md) - Guía de desarrollo
- [`plataforma/docs/historias-usuario/`](./plataforma/docs/historias-usuario/) - User stories

### Contenidos Educativos
- [`contenidos/curso_ciberseguridad/00_TEMARIO_COMPLETO.md`](./contenidos/curso_ciberseguridad/00_TEMARIO_COMPLETO.md) - Temario completo (40h)
- [`contenidos/curso_ciberseguridad/PROGRESO_CONTENIDOS.md`](./contenidos/curso_ciberseguridad/PROGRESO_CONTENIDOS.md) - Estado de contenidos

---

## 🎯 Próximos Pasos

### Plataforma LMS (2 semanas)
1. ✅ Activar routes analytics y export
2. ✅ Commitear archivos pendientes
3. ⏳ Incrementar tests a 70% coverage
4. ⏳ Deployment a staging

### Contenidos (4 semanas)
1. Completar Módulo 03
2. Completar Módulos 04-10
3. Evaluaciones finales
4. Proyecto final

---

## 📄 Licencia

[Pendiente de definir]

---

**Última actualización**: 2026-03-09
