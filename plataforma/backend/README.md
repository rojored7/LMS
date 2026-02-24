# Backend - Plataforma Multi-Curso de Ciberseguridad

Backend completo de la plataforma educativa multi-curso especializada en ciberseguridad. Construido con Node.js, Express, TypeScript, Prisma y PostgreSQL.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Variables de Entorno](#variables-de-entorno)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Arquitectura](#arquitectura)

---

## Descripción

El backend de la plataforma proporciona una API RESTful completa para gestionar:

- 🔐 **Autenticación y Autorización**: Sistema JWT con refresh tokens y RBAC
- 👥 **Usuarios y Perfiles**: Gestión de usuarios con roles (Admin, Instructor, Student)
- 📚 **Cursos Modulares**: Cursos organizados en módulos y lecciones
- ✅ **Evaluaciones**: Quizzes con múltiples tipos de preguntas
- 💻 **Laboratorios Prácticos**: Ejecución de código en sandbox Docker
- 📊 **Progreso y Tracking**: Seguimiento detallado del avance de estudiantes
- 🎓 **Certificados**: Generación y verificación de certificados digitales
- 🎯 **Perfiles de Entrenamiento**: Rutas de aprendizaje personalizadas

### Características Técnicas

- ✅ TypeScript strict mode
- ✅ Validación de datos con Zod
- ✅ ORM type-safe con Prisma
- ✅ Caché con Redis
- ✅ Logging estructurado con Winston
- ✅ Manejo de errores centralizado
- ✅ Rate limiting y seguridad con Helmet
- ✅ Testing con Jest
- ✅ Dockerizado
- ✅ Health checks para K8s/Docker

---

## Requisitos

### Software Necesario

- **Node.js**: v20.x o superior (LTS recomendado)
- **PostgreSQL**: v15.x o superior
- **Redis**: v7.x o superior
- **Docker**: v24.x o superior (opcional, para desarrollo)
- **npm** o **yarn**: Gestor de paquetes

### Verificar Versiones

```bash
node --version    # v20.x.x
npm --version     # v10.x.x
psql --version    # PostgreSQL 15.x
redis-cli --version # redis-cli 7.x.x
docker --version  # Docker version 24.x.x
```

---

## Instalación

### 1. Clonar el Repositorio

```bash
cd plataforma/backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env  # o usa tu editor favorito
```

### 4. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb plataforma_cursos

# O usando psql
psql -U postgres
CREATE DATABASE plataforma_cursos;
\q
```

### 5. Ejecutar Migraciones de Prisma

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# (Opcional) Seed inicial de datos
npm run seed
```

### 6. Verificar Instalación

```bash
npm run dev
```

Deberías ver:
```
✅ Conectado a PostgreSQL
✅ Conectado a Redis
✅ Todos los servicios inicializados correctamente
🚀 Servidor iniciado
🌍 Servidor escuchando en http://0.0.0.0:5000
```

---

## Configuración

### Archivo .env

El archivo `.env` contiene todas las variables de configuración. Ver [`.env.example`](.env.example) para la lista completa.

#### Variables Críticas

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/plataforma_cursos

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT (IMPORTANTE: cambia estos valores en producción)
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
JWT_REFRESH_SECRET=otro-secreto-diferente-minimo-32-caracteres

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

#### Generar Secretos JWT Seguros

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Desarrollo

### Modo Desarrollo

```bash
# Iniciar servidor con hot-reload
npm run dev
```

El servidor se reiniciará automáticamente cuando detecte cambios en archivos TypeScript.

### Compilar TypeScript

```bash
# Compilar a JavaScript
npm run build

# Compilar en modo watch
npm run build:watch
```

### Linting y Formato

```bash
# Ejecutar ESLint
npm run lint

# Auto-fix de problemas
npm run lint:fix

# Formatear código con Prettier
npm run format
```

### Prisma Studio (GUI Base de Datos)

```bash
# Abrir interfaz gráfica de base de datos
npx prisma studio
```

Se abrirá en `http://localhost:5555`

---

## Scripts Disponibles

```json
{
  "dev": "nodemon",                          // Desarrollo con hot-reload
  "build": "tsc",                            // Compilar TypeScript
  "start": "node dist/server.js",           // Producción
  "lint": "eslint src --ext .ts",           // Linting
  "lint:fix": "eslint src --ext .ts --fix", // Auto-fix
  "format": "prettier --write \"src/**/*.ts\"", // Formatear
  "test": "jest",                            // Tests
  "test:watch": "jest --watch",             // Tests en watch mode
  "test:coverage": "jest --coverage",       // Tests con cobertura
  "prisma:generate": "prisma generate",     // Generar cliente Prisma
  "prisma:migrate": "prisma migrate dev",   // Ejecutar migraciones
  "prisma:studio": "prisma studio",         // Abrir Prisma Studio
  "prisma:seed": "ts-node prisma/seed.ts"  // Seed de datos
}
```

---

## Estructura de Carpetas

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema de base de datos
│   ├── migrations/            # Migraciones de Prisma
│   └── seed.ts                # Script de seed de datos
├── src/
│   ├── config/
│   │   └── index.ts           # Configuración con validación Zod
│   ├── controllers/           # Controladores (lógica de endpoints)
│   ├── middleware/
│   │   ├── auth.ts            # Middleware de autenticación
│   │   ├── errorHandler.ts   # Manejo de errores centralizado
│   │   ├── logger.ts          # Logging con Winston
│   │   └── validator.ts       # Validación de requests
│   ├── models/                # Modelos y tipos
│   ├── routes/                # Definición de rutas
│   ├── services/              # Lógica de negocio
│   ├── types/
│   │   └── express.d.ts       # Extensiones de tipos Express
│   ├── utils/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── redis.ts           # Cliente Redis singleton
│   │   └── helpers.ts         # Utilidades compartidas
│   ├── validators/            # Schemas de validación Zod
│   └── server.ts              # Punto de entrada
├── tests/                     # Tests unitarios e integración
├── logs/                      # Logs de aplicación (gitignored)
├── uploads/                   # Archivos subidos (gitignored)
├── certificates/              # Certificados generados (gitignored)
├── .env                       # Variables de entorno (gitignored)
├── .env.example               # Template de variables
├── .dockerignore              # Archivos ignorados por Docker
├── .eslintrc.json             # Configuración ESLint
├── .prettierrc                # Configuración Prettier
├── Dockerfile                 # Imagen Docker
├── docker-compose.yml         # Compose para desarrollo
├── jest.config.js             # Configuración Jest
├── nodemon.json               # Configuración Nodemon
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración TypeScript
└── README.md                  # Este archivo
```

---

## Variables de Entorno

### Categorías de Variables

#### 🔧 Servidor
- `NODE_ENV`: Entorno (development/production/test)
- `PORT`: Puerto del servidor (default: 5000)
- `HOST`: Host del servidor (default: 0.0.0.0)
- `FRONTEND_URL`: URL del frontend para CORS

#### 🗄️ Base de Datos
- `DATABASE_URL`: URL de conexión PostgreSQL
- `REDIS_URL`: URL de conexión Redis
- `REDIS_TTL`: TTL de caché en segundos

#### 🔐 Autenticación
- `JWT_SECRET`: Secreto para access tokens (mín. 32 chars)
- `JWT_REFRESH_SECRET`: Secreto para refresh tokens (mín. 32 chars)
- `JWT_EXPIRES_IN`: Expiración access token (ej: 15m)
- `JWT_REFRESH_EXPIRES_IN`: Expiración refresh token (ej: 7d)
- `BCRYPT_ROUNDS`: Rounds de bcrypt (10-15)

#### 🚦 Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: Ventana de tiempo en ms
- `RATE_LIMIT_MAX_REQUESTS`: Max requests por ventana

#### 📁 Archivos
- `MAX_FILE_SIZE`: Tamaño máximo en bytes
- `UPLOAD_DIR`: Directorio de uploads

#### 💻 Code Executor
- `EXECUTOR_SERVICE_URL`: URL del servicio de sandbox
- `EXECUTOR_TIMEOUT`: Timeout en ms

#### 📧 Email (SMTP)
- `SMTP_HOST`: Host SMTP
- `SMTP_PORT`: Puerto SMTP
- `SMTP_USER`: Usuario SMTP
- `SMTP_PASS`: Contraseña SMTP
- `SMTP_FROM`: Email remitente

#### 📜 Logging
- `LOG_LEVEL`: Nivel de log (error/warn/info/debug)
- `LOG_DIR`: Directorio de logs

Ver [`.env.example`](.env.example) para detalles completos.

---

## API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Endpoints Principales

#### 🔐 Autenticación (`/api/auth`)
```
POST   /api/auth/register        # Registrar nuevo usuario
POST   /api/auth/login           # Login
POST   /api/auth/refresh         # Refrescar access token
POST   /api/auth/logout          # Logout
GET    /api/auth/me              # Obtener usuario actual
```

#### 👥 Usuarios (`/api/users`)
```
GET    /api/users                # Listar usuarios (Admin)
GET    /api/users/:id            # Obtener usuario
PATCH  /api/users/:id            # Actualizar usuario
DELETE /api/users/:id            # Eliminar usuario (Admin)
```

#### 📚 Cursos (`/api/courses`)
```
GET    /api/courses              # Listar cursos
GET    /api/courses/:id          # Obtener curso
POST   /api/courses              # Crear curso (Instructor)
PATCH  /api/courses/:id          # Actualizar curso (Instructor)
DELETE /api/courses/:id          # Eliminar curso (Instructor)
```

#### 📖 Módulos (`/api/modules`)
```
GET    /api/modules/:id          # Obtener módulo
POST   /api/modules              # Crear módulo
PATCH  /api/modules/:id          # Actualizar módulo
DELETE /api/modules/:id          # Eliminar módulo
```

#### 📝 Lecciones (`/api/lessons`)
```
GET    /api/lessons/:id          # Obtener lección
POST   /api/lessons              # Crear lección
PATCH  /api/lessons/:id          # Actualizar lección
DELETE /api/lessons/:id          # Eliminar lección
```

#### ✅ Quizzes (`/api/quizzes`)
```
GET    /api/quizzes/:id          # Obtener quiz
POST   /api/quizzes              # Crear quiz
POST   /api/quizzes/:id/attempt  # Enviar intento de quiz
GET    /api/quizzes/:id/attempts # Ver intentos
```

#### 💻 Laboratorios (`/api/labs`)
```
GET    /api/labs/:id             # Obtener laboratorio
POST   /api/labs                 # Crear laboratorio
POST   /api/labs/:id/submit      # Enviar solución
POST   /api/labs/:id/execute     # Ejecutar código
GET    /api/labs/:id/submissions # Ver envíos
```

#### 📊 Proyectos (`/api/projects`)
```
GET    /api/projects/:id         # Obtener proyecto
POST   /api/projects             # Crear proyecto
POST   /api/projects/:id/submit  # Enviar proyecto
PATCH  /api/projects/:id/grade   # Calificar (Instructor)
```

#### 🎓 Inscripciones (`/api/enrollments`)
```
GET    /api/enrollments          # Mis inscripciones
POST   /api/enrollments          # Inscribirse a curso
GET    /api/enrollments/:id      # Detalle inscripción
```

#### 📜 Certificados (`/api/certificates`)
```
GET    /api/certificates         # Mis certificados
GET    /api/certificates/:id     # Descargar certificado
GET    /api/certificates/verify/:code # Verificar certificado
```

#### 🎯 Perfiles de Entrenamiento (`/api/profiles`)
```
GET    /api/profiles             # Listar perfiles
GET    /api/profiles/:id         # Obtener perfil
POST   /api/profiles             # Crear perfil (Admin)
```

### Health Checks

```
GET    /health                   # Basic health check
GET    /health/ready             # Readiness probe (DB + Redis)
GET    /health/live              # Liveness probe
```

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:coverage
```

### Estructura de Tests

```
src/
├── controllers/
│   └── __tests__/
│       └── auth.test.ts
├── services/
│   └── __tests__/
│       └── user.test.ts
└── utils/
    └── __tests__/
        └── helpers.test.ts
```

### Escribir Tests

```typescript
// src/services/__tests__/user.test.ts
import { createUser } from '../user.service';

describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const user = await createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });
  });
});
```

---

## Deployment

### Docker

#### Build

```bash
# Build imagen
docker build -t plataforma-backend .

# Run contenedor
docker run -p 5000:5000 --env-file .env plataforma-backend
```

#### Docker Compose

```bash
# Levantar todos los servicios (backend, postgres, redis)
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down
```

### Producción

#### Variables de Entorno

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
# etc.
```

#### Proceso de Deploy

1. **Build**
   ```bash
   npm ci --only=production
   npm run build
   ```

2. **Migraciones**
   ```bash
   npx prisma migrate deploy
   ```

3. **Start**
   ```bash
   npm start
   ```

#### Health Checks

- **Liveness**: `GET /health/live` (debe retornar 200)
- **Readiness**: `GET /health/ready` (verifica DB + Redis)

---

## Arquitectura

### Stack Tecnológico

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL 15
- **Caché**: Redis 7
- **Validación**: Zod
- **Testing**: Jest
- **Logging**: Winston
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Autenticación**: JWT (jsonwebtoken)

### Patrones de Diseño

- **MVC**: Separación de lógica en Modelos, Vistas (JSON), Controladores
- **Repository Pattern**: Acceso a datos a través de servicios
- **Dependency Injection**: Inyección de dependencias donde sea aplicable
- **Singleton**: Clientes de Prisma y Redis
- **Middleware Chain**: Pipeline de middlewares de Express

### Seguridad

- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Rate limiting por IP
- ✅ Validación de input con Zod
- ✅ SQL Injection prevention (Prisma ORM)
- ✅ Password hashing con bcrypt
- ✅ JWT con refresh tokens
- ✅ Role-Based Access Control (RBAC)

### Escalabilidad

- ✅ Stateless (horizontal scaling)
- ✅ Caché Redis para datos frecuentes
- ✅ Connection pooling de PostgreSQL
- ✅ Compresión de respuestas HTTP
- ✅ Logging estructurado

---

## Recursos Adicionales

- [Documentación Prisma](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Licencia

MIT

---

## Contribución

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para guías de contribución.

---

## Soporte

Para problemas o preguntas, abre un issue en el repositorio.
