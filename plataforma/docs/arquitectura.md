# Arquitectura Técnica - Plataforma Multi-Curso de Ciberseguridad

**Version:** 2.0
**Fecha:** Abril 2026
**Estado:** Actualizado tras migracion de Express/Prisma a FastAPI/SQLAlchemy

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura de Alto Nivel](#2-arquitectura-de-alto-nivel)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Seguridad](#5-seguridad)
6. [Flujos Principales](#6-flujos-principales)
7. [APIs](#7-apis)
8. [Deployment](#8-deployment)
9. [Escalabilidad y Performance](#9-escalabilidad-y-performance)
10. [Monitoreo y Logging](#10-monitoreo-y-logging)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Propósito del Sistema

La Plataforma Multi-Curso de Ciberseguridad es una solución educativa integral diseñada para ofrecer formación especializada en ciberseguridad a través de múltiples perfiles de entrenamiento. El sistema permite la gestión, distribución y seguimiento de cursos modulares con contenido interactivo, laboratorios prácticos ejecutables en sandbox aislados y certificaciones verificables.

**Objetivos principales:**
- Proporcionar una experiencia de aprendizaje interactiva y segura
- Permitir la ejecución de código en entornos aislados para laboratorios prácticos
- Facilitar la gestión administrativa de cursos, usuarios y progreso
- Generar certificados verificables al completar cursos
- Soportar múltiples perfiles de entrenamiento personalizados

### 1.2 Stakeholders

| Rol | Descripción | Responsabilidades |
|-----|-------------|-------------------|
| **Administrador** | Gestión completa de la plataforma | - Gestión de usuarios y roles<br>- Asignación de perfiles de entrenamiento<br>- Monitoreo de progreso general<br>- Configuración de cursos y contenidos |
| **Instructor** | Creación y gestión de contenido educativo | - Desarrollo de cursos y módulos<br>- Creación de quizzes y laboratorios<br>- Revisión de proyectos<br>- Soporte a estudiantes |
| **Estudiante** | Consumidor final del contenido educativo | - Inscripción en cursos<br>- Completar lecciones y evaluaciones<br>- Ejecutar laboratorios prácticos<br>- Obtener certificaciones |
| **Desarrolladores** | Equipo técnico de desarrollo y mantenimiento | - Desarrollo de features<br>- Mantenimiento del sistema<br>- Resolución de bugs |
| **DevOps** | Infraestructura y operaciones | - Deployment y configuración<br>- Monitoreo y alertas<br>- Gestión de backups |

### 1.3 Alcance

**Incluye:**
- Sistema de autenticación y autorización basado en roles (RBAC)
- Dashboard administrativo para gestión de usuarios y contenido
- Sistema de perfiles de entrenamiento personalizables
- Cursos modulares con lecciones, quizzes y laboratorios
- Motor de ejecución de código en sandbox Docker aislado
- Sistema de progreso y tracking de estudiantes
- Generación y emisión de certificados digitales
- API RESTful completa
- Interfaz responsive y moderna

**No incluye (v1.0):**
- Integración con sistemas LMS externos (Moodle, Blackboard)
- Sistema de pago y monetización
- Video conferencia integrada
- Foros y comunidad social
- Aplicación móvil nativa
- Gamificación avanzada (badges, leaderboards)

---

## 2. ARQUITECTURA DE ALTO NIVEL

### 2.1 Diagrama C4 - Nivel 1: Context

```mermaid
graph TB
    subgraph External
        Admin[Administrador]
        Instructor[Instructor]
        Student[Estudiante]
    end

    Platform[Plataforma Multi-Curso<br>Ciberseguridad]

    Email[Sistema Email<br>SMTP]
    Storage[Almacenamiento<br>Archivos]

    Admin --> Platform
    Instructor --> Platform
    Student --> Platform

    Platform --> Email
    Platform --> Storage

    style Platform fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style Email fill:#95E1D3,stroke:#5FA89A
    style Storage fill:#95E1D3,stroke:#5FA89A
```

### 2.2 Diagrama C4 - Nivel 2: Container

```mermaid
graph TB
    subgraph Users
        U1[Usuario Web Browser]
    end

    subgraph Frontend Container
        React[React Application<br>TypeScript + Tailwind]
    end

    subgraph Backend Container
        API[API REST<br>Python 3.12 + FastAPI]
    end

    subgraph Executor Container
        Executor[Code Executor Service<br>Docker-in-Docker Sandbox]
    end

    subgraph Data Layer
        PostgreSQL[(PostgreSQL<br>Base de Datos)]
        Redis[(Redis<br>Cache + Sessions)]
    end

    subgraph Infrastructure
        Nginx[Nginx<br>Reverse Proxy + Load Balancer]
    end

    U1 -->|HTTPS| Nginx
    Nginx -->|Port 3000| React
    React -->|REST API| Nginx
    Nginx -->|Port 5000| API
    API -->|Ejecuta código| Executor
    API -->|Query| PostgreSQL
    API -->|Cache/Session| Redis

    style React fill:#61DAFB,stroke:#21A1C4,color:#000
    style API fill:#68A063,stroke:#3C5D3A,color:#fff
    style Executor fill:#E94E31,stroke:#A83621,color:#fff
    style PostgreSQL fill:#336791,stroke:#1F3F5A,color:#fff
    style Redis fill:#DC382D,stroke:#8A2319,color:#fff
    style Nginx fill:#009639,stroke:#005722,color:#fff
```

### 2.3 Componentes Principales

#### 2.3.1 Frontend Application (React)

**Responsabilidades:**
- Interfaz de usuario responsive y moderna
- Gestión de estado de la aplicación (Zustand)
- Routing y navegación (React Router)
- Comunicación con API backend
- Editor de código integrado (Monaco Editor)

**Tecnologías:**
- React 18+ con TypeScript
- Tailwind CSS + Shadcn/ui para componentes
- Zustand para state management
- React Query para data fetching
- Monaco Editor para edición de código

#### 2.3.2 Backend API (Python + FastAPI)

**Responsabilidades:**
- Logica de negocio principal
- Autenticacion y autorizacion (JWT)
- Validacion de datos (Pydantic v2)
- Comunicacion con base de datos (SQLAlchemy 2.0 async con asyncpg)
- Gestion de cache (Redis)
- Coordinacion de ejecucion de codigo

**Tecnologias:**
- Python 3.12 con uvicorn
- FastAPI
- SQLAlchemy 2.0 async con asyncpg
- python-jose para JWT
- Pydantic v2 para validacion de schemas
- Alembic para migraciones de base de datos

#### 2.3.3 Code Executor Service

**Responsabilidades:**
- Ejecución segura de código en sandbox aislado
- Gestión de contenedores Docker efímeros
- Limitación de recursos (CPU, memoria, tiempo)
- Captura de output y errores
- Prevención de ataques y código malicioso

**Tecnologías:**
- Node.js con Docker SDK
- Docker-in-Docker (DinD)
- Contenedores efímeros con timeout
- Networking aislado

#### 2.3.4 PostgreSQL Database

**Responsabilidades:**
- Almacenamiento persistente de datos
- Gestión de transacciones ACID
- Relaciones y constraints
- Full-text search (opcional)

**Características:**
- PostgreSQL 15+
- Esquema gestionado por Alembic Migrations
- Índices optimizados para queries frecuentes
- Backups automáticos

#### 2.3.5 Redis Cache

**Responsabilidades:**
- Caché de datos frecuentes (cursos, módulos)
- Gestión de sesiones de usuario
- Rate limiting
- Cache de resultados de quizzes

**Características:**
- Redis 7+
- TTL configurables por tipo de dato
- Estrategias de invalidación

#### 2.3.6 Nginx Reverse Proxy

**Responsabilidades:**
- Routing de requests
- Terminación SSL/TLS
- Load balancing (escalabilidad futura)
- Compresión gzip
- Servir archivos estáticos

### 2.4 Flujo de Datos General

```mermaid
sequenceDiagram
    participant U as Usuario
    participant N as Nginx
    participant F as Frontend
    participant A as API Backend
    participant R as Redis
    participant DB as PostgreSQL
    participant E as Executor

    U->>N: HTTPS Request
    N->>F: Forward to React App
    F->>U: HTML/CSS/JS

    U->>N: API Request + JWT
    N->>A: Forward to Backend API
    A->>A: Validar JWT

    alt Cache Hit
        A->>R: Check Cache
        R-->>A: Cached Data
    else Cache Miss
        A->>DB: Query Database
        DB-->>A: Data
        A->>R: Store in Cache
    end

    alt Ejecutar Lab
        A->>E: Execute Code Request
        E->>E: Create Docker Container
        E->>E: Execute Code (Timeout)
        E->>E: Destroy Container
        E-->>A: Execution Result
    end

    A-->>N: JSON Response
    N-->>U: Response
```

---

## 3. STACK TECNOLÓGICO

### 3.1 Frontend Stack

#### 3.1.1 Core Framework

```typescript
// package.json (frontend)
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.5.0"
  }
}
```

**React 18+**
- Virtual DOM para performance óptimo
- Hooks para gestión de estado
- Suspense para lazy loading
- TypeScript para type safety

#### 3.1.2 Styling & UI Components

**Tailwind CSS**
- Utility-first CSS framework
- Configuración JIT (Just-In-Time)
- Purge automático en producción
- Responsive design

**Shadcn/ui**
- Componentes accesibles (ARIA)
- Themeable con CSS variables
- Copy-paste components (no npm dependency)
- Basado en Radix UI primitives

```typescript
// Ejemplo de componente Shadcn
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CourseCard({ course }) {
  return (
    <Card>
      <CardHeader>{course.title}</CardHeader>
      <CardContent>
        <Button variant="default">Inscribirse</Button>
      </CardContent>
    </Card>
  )
}
```

#### 3.1.3 State Management

**Zustand**
- Librería minimalista de state management
- API simple basada en hooks
- No boilerplate
- DevTools integration

```typescript
// store/auth.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const response = await api.login(email, password)
    set({ user: response.user, token: response.token })
  },
  logout: () => set({ user: null, token: null })
}))
```

#### 3.1.4 Routing

**React Router v6**
- Client-side routing
- Nested routes
- Protected routes (authentication)
- Lazy loading de páginas

```typescript
// routes.tsx
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'courses/:id', element: <CourseDetail /> },
      { path: 'labs/:id', element: <LabEditor /> }
    ]
  }
])
```

#### 3.1.5 Data Fetching

**TanStack Query (React Query)**
- Cache management automático
- Background refetching
- Optimistic updates
- Error handling

```typescript
// hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query'

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => api.getCourses(),
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}
```

#### 3.1.6 Code Editor

**Monaco Editor**
- Editor de código de VS Code
- Syntax highlighting multi-lenguaje
- IntelliSense y autocomplete
- Diff editor
- Múltiples themes

```typescript
// components/CodeEditor.tsx
import Editor from '@monaco-editor/react'

export function CodeEditor({ language, value, onChange }) {
  return (
    <Editor
      height="500px"
      language={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on'
      }}
    />
  )
}
```

#### 3.1.7 Form Management

**React Hook Form + Zod**
- Validación performante
- Type-safe validation schemas
- Mínimos re-renders

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export function LoginForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(loginSchema)
  })

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

### 3.2 Backend Stack

#### 3.2.1 Core Framework

**Python 3.12 + FastAPI + uvicorn**

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, courses, labs, admin, progress, certificates

app = FastAPI(title="Plataforma Ciberseguridad API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(labs.router, prefix="/api/labs", tags=["labs"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
```

#### 3.2.2 ORM - SQLAlchemy 2.0 async

**SQLAlchemy 2.0 con asyncpg**
- Modelos declarativos con Mapped types
- Sesiones async con AsyncSession
- Migraciones con Alembic
- Connection pooling nativo
- Soporte para relaciones y eager/lazy loading

```python
# app/models/user.py
from sqlalchemy import String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    STUDENT = "STUDENT"

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.STUDENT)
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="user")
```

#### 3.2.3 Authentication - JWT

**python-jose + passlib[bcrypt]**

```python
# app/services/auth_service.py
from jose import jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def login(email: str, password: str, db: AsyncSession):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = jwt.encode(
        {"sub": str(user.id), "role": user.role, "exp": ...},
        settings.JWT_SECRET,
        algorithm="HS256"
    )
    refresh_token = jwt.encode(
        {"sub": str(user.id), "exp": ...},
        settings.JWT_REFRESH_SECRET,
        algorithm="HS256"
    )
    return {"user": user, "access_token": access_token, "refresh_token": refresh_token}
```

#### 3.2.4 Validation - Pydantic v2

```python
# app/schemas/course.py
from pydantic import BaseModel, Field
from enum import Enum

class CourseDifficulty(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class CreateCourseRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=2000)
    difficulty: CourseDifficulty
    duration: int = Field(gt=0)
    profile_ids: list[str]
```

#### 3.2.5 Middleware Stack

```python
# app/middleware/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles):
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return role_checker
```

### 3.3 Database Layer

#### 3.3.1 PostgreSQL Configuration

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cybersecurity_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

#### 3.3.2 Redis Configuration

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

```python
# app/config.py (fragmento Redis)
import redis.asyncio as aioredis

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)
```

### 3.4 Infrastructure

#### 3.4.1 Docker

**Dockerfile - Frontend**
```dockerfile
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile - Backend**
```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

COPY . .

EXPOSE 4000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"]
```

**Dockerfile - Executor**
```dockerfile
FROM node:20-alpine

RUN apk add --no-cache docker-cli

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5001
CMD ["node", "dist/executor.js"]
```

#### 3.4.2 Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }

    # Code Executor
    location /api/executor {
        proxy_pass http://executor:5001;
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

---

## 4. MODELO DE DATOS

### 4.1 Diagrama ERD Completo

```mermaid
erDiagram
    User ||--o{ Enrollment : creates
    User ||--o| TrainingProfile : "has assigned"
    User ||--o{ UserProgress : tracks
    User ||--o{ Certificate : earns
    User {
        uuid id PK
        string email UK
        string password
        enum role
        string firstName
        string lastName
        timestamp createdAt
        timestamp updatedAt
    }

    TrainingProfile ||--o{ User : "assigned to"
    TrainingProfile ||--o{ CourseProfile : contains
    TrainingProfile {
        uuid id PK
        string name UK
        string description
        boolean isActive
        timestamp createdAt
    }

    Course ||--o{ CourseProfile : "belongs to"
    Course ||--o{ Module : contains
    Course ||--o{ Enrollment : "enrolled by"
    Course ||--o{ Certificate : issues
    Course {
        uuid id PK
        string title
        text description
        enum difficulty
        int duration
        string imageUrl
        boolean isPublished
        timestamp createdAt
        timestamp updatedAt
    }

    CourseProfile {
        uuid courseId FK
        uuid profileId FK
        int orderIndex
        timestamp addedAt
    }

    Module ||--o{ Lesson : contains
    Module ||--o{ Quiz : contains
    Module ||--o{ Lab : contains
    Module {
        uuid id PK
        uuid courseId FK
        string title
        text description
        int orderIndex
        timestamp createdAt
    }

    Lesson ||--o{ UserProgress : "progress tracked"
    Lesson {
        uuid id PK
        uuid moduleId FK
        string title
        text content
        enum contentType
        string videoUrl
        int duration
        int orderIndex
        timestamp createdAt
    }

    Quiz ||--o{ Question : contains
    Quiz ||--o{ QuizAttempt : attempted
    Quiz {
        uuid id PK
        uuid moduleId FK
        string title
        text description
        int passingScore
        int timeLimit
        int orderIndex
        timestamp createdAt
    }

    Question ||--o{ Answer : contains
    Question {
        uuid id PK
        uuid quizId FK
        text questionText
        enum questionType
        int points
        int orderIndex
    }

    Answer {
        uuid id PK
        uuid questionId FK
        text answerText
        boolean isCorrect
        text explanation
    }

    Lab ||--o{ LabAttempt : attempted
    Lab {
        uuid id PK
        uuid moduleId FK
        string title
        text description
        text instructions
        enum language
        text starterCode
        text solutionCode
        json testCases
        int timeLimit
        int orderIndex
    }

    Enrollment {
        uuid id PK
        uuid userId FK
        uuid courseId FK
        enum status
        int progress
        timestamp enrolledAt
        timestamp completedAt
    }

    UserProgress {
        uuid id PK
        uuid userId FK
        uuid lessonId FK
        boolean completed
        int timeSpent
        timestamp lastAccessedAt
        timestamp completedAt
    }

    QuizAttempt {
        uuid id PK
        uuid userId FK
        uuid quizId FK
        int score
        json answers
        boolean passed
        timestamp startedAt
        timestamp completedAt
    }

    LabAttempt {
        uuid id PK
        uuid userId FK
        uuid labId FK
        text submittedCode
        json executionResult
        boolean passed
        int attempts
        timestamp submittedAt
    }

    Certificate {
        uuid id PK
        uuid userId FK
        uuid courseId FK
        string certificateNumber UK
        timestamp issuedAt
        timestamp expiresAt
        string verificationUrl
    }
```

### 4.2 Descripción de Entidades Principales

#### 4.2.1 User (Usuario)

Entidad central que representa a todos los usuarios del sistema.

```typescript
interface User {
  id: string                    // UUID
  email: string                 // Único, validado
  password: string              // Hash bcrypt
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
  firstName: string
  lastName: string
  profileId?: string            // FK a TrainingProfile
  enrollments: Enrollment[]
  progress: UserProgress[]
  certificates: Certificate[]
  createdAt: Date
  updatedAt: Date
}
```

**Índices:**
- PRIMARY KEY: `id`
- UNIQUE: `email`
- INDEX: `role`, `profileId`

**Constraints:**
- Email debe ser válido y único
- Password mínimo 8 caracteres (validado en backend)
- Role por defecto: STUDENT

#### 4.2.2 TrainingProfile (Perfil de Entrenamiento)

Define conjuntos de cursos personalizados para diferentes tipos de estudiantes.

```typescript
interface TrainingProfile {
  id: string
  name: string                  // Único, ej: "Pentester Junior"
  description: string
  isActive: boolean             // Permite activar/desactivar perfiles
  users: User[]                 // Usuarios asignados a este perfil
  courses: CourseProfile[]      // Cursos incluidos (N:N)
  createdAt: Date
}
```

**Casos de uso:**
- "Pentester Junior" → Cursos básicos de ethical hacking
- "Security Analyst" → Cursos de análisis y respuesta a incidentes
- "Cryptography Specialist" → Cursos avanzados de criptografía

#### 4.2.3 Course (Curso)

Contenedor principal de contenido educativo modular.

```typescript
interface Course {
  id: string
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  duration: number              // Estimado en minutos
  imageUrl?: string
  isPublished: boolean
  modules: Module[]
  profiles: CourseProfile[]     // Perfiles que incluyen este curso
  enrollments: Enrollment[]
  certificates: Certificate[]
  createdAt: Date
  updatedAt: Date
}
```

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `isPublished`, `difficulty`
- FULLTEXT: `title`, `description` (para búsqueda)

#### 4.2.4 CourseProfile (Relación N:N)

Tabla pivote entre Course y TrainingProfile con orden.

```typescript
interface CourseProfile {
  courseId: string              // FK
  profileId: string             // FK
  orderIndex: number            // Orden del curso dentro del perfil
  addedAt: Date
}
```

**PRIMARY KEY:** `(courseId, profileId)`

#### 4.2.5 Module (Módulo)

Agrupación lógica de contenido dentro de un curso.

```typescript
interface Module {
  id: string
  courseId: string              // FK
  title: string
  description: string
  orderIndex: number
  lessons: Lesson[]
  quizzes: Quiz[]
  labs: Lab[]
  createdAt: Date
}
```

**Orden de ejecución sugerido:**
1. Lessons (teoría)
2. Quizzes (evaluación)
3. Labs (práctica)

#### 4.2.6 Lesson (Lección)

Contenido teórico de aprendizaje.

```typescript
interface Lesson {
  id: string
  moduleId: string              // FK
  title: string
  content: string               // Markdown o HTML
  contentType: 'TEXT' | 'VIDEO' | 'INTERACTIVE'
  videoUrl?: string
  duration: number              // Minutos
  orderIndex: number
  userProgress: UserProgress[]
  createdAt: Date
}
```

#### 4.2.7 Quiz (Evaluación)

Evaluación de conocimientos con preguntas múltiples.

```typescript
interface Quiz {
  id: string
  moduleId: string              // FK
  title: string
  description: string
  passingScore: number          // Porcentaje mínimo para aprobar
  timeLimit: number             // Segundos (0 = sin límite)
  orderIndex: number
  questions: Question[]
  attempts: QuizAttempt[]
  createdAt: Date
}
```

#### 4.2.8 Question (Pregunta)

Pregunta individual dentro de un quiz.

```typescript
interface Question {
  id: string
  quizId: string                // FK
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTI_SELECT'
  points: number
  orderIndex: number
  answers: Answer[]
}
```

#### 4.2.9 Answer (Respuesta)

Opciones de respuesta para una pregunta.

```typescript
interface Answer {
  id: string
  questionId: string            // FK
  answerText: string
  isCorrect: boolean
  explanation?: string          // Mostrar después de responder
}
```

#### 4.2.10 Lab (Laboratorio)

Ejercicio práctico de programación ejecutable.

```typescript
interface Lab {
  id: string
  moduleId: string              // FK
  title: string
  description: string
  instructions: string          // Markdown con pasos detallados
  language: 'python' | 'javascript' | 'bash' | 'c' | 'java'
  starterCode: string           // Código inicial
  solutionCode: string          // Solución de referencia (oculta)
  testCases: TestCase[]         // JSON con casos de prueba
  timeLimit: number             // Segundos de ejecución máxima
  orderIndex: number
  attempts: LabAttempt[]
}

interface TestCase {
  input: string
  expectedOutput: string
  description: string
  isHidden: boolean             // Tests ocultos para evitar hardcoding
}
```

#### 4.2.11 Enrollment (Inscripción)

Relación estudiante-curso con tracking de progreso.

```typescript
interface Enrollment {
  id: string
  userId: string                // FK
  courseId: string              // FK
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  progress: number              // 0-100 porcentaje
  enrolledAt: Date
  completedAt?: Date
}
```

**Índices:**
- PRIMARY KEY: `id`
- UNIQUE: `(userId, courseId)`
- INDEX: `status`, `completedAt`

#### 4.2.12 UserProgress (Progreso por Lección)

Tracking detallado de progreso en lecciones.

```typescript
interface UserProgress {
  id: string
  userId: string                // FK
  lessonId: string              // FK
  completed: boolean
  timeSpent: number             // Segundos
  lastAccessedAt: Date
  completedAt?: Date
}
```

**UNIQUE:** `(userId, lessonId)`

#### 4.2.13 QuizAttempt (Intento de Quiz)

Registro de intentos de evaluaciones.

```typescript
interface QuizAttempt {
  id: string
  userId: string                // FK
  quizId: string                // FK
  score: number                 // Porcentaje 0-100
  answers: object               // JSON con respuestas del usuario
  passed: boolean
  startedAt: Date
  completedAt: Date
}
```

#### 4.2.14 LabAttempt (Intento de Lab)

Registro de ejecuciones de laboratorios.

```typescript
interface LabAttempt {
  id: string
  userId: string                // FK
  labId: string                 // FK
  submittedCode: string
  executionResult: object       // JSON con output, errores, tests
  passed: boolean               // Todos los test cases pasaron
  attempts: number              // Contador de intentos
  submittedAt: Date
}
```

#### 4.2.15 Certificate (Certificado)

Certificado digital emitido al completar un curso.

```typescript
interface Certificate {
  id: string
  userId: string                // FK
  courseId: string              // FK
  certificateNumber: string     // Único, ej: "CYBER-2026-001234"
  issuedAt: Date
  expiresAt?: Date              // Algunos certificados expiran
  verificationUrl: string       // URL pública para verificar autenticidad
}
```

**UNIQUE:** `certificateNumber`

### 4.3 Modelos SQLAlchemy

Los modelos se definen en `backend-fastapi/app/models/` usando SQLAlchemy 2.0 declarative con Mapped types. A continuacion se muestra una representacion equivalente al schema anterior:

```python
# backend-fastapi/app/models/ (representacion simplificada)
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

# Modelos principales (ver backend-fastapi/app/models/ para definicion completa)

class User(Base):
    __tablename__ = "users"
    id = mapped_column(String, primary_key=True)
    email = mapped_column(String, unique=True, index=True)
    password = mapped_column(String)
    role = mapped_column(SAEnum(UserRole), default=UserRole.STUDENT)
    first_name = mapped_column(String)
    last_name = mapped_column(String)
    profile_id = mapped_column(String, ForeignKey("training_profiles.id"), nullable=True)
    # relationships: profile, enrollments, progress, quiz_attempts, lab_attempts, certificates

class TrainingProfile(Base):
    __tablename__ = "training_profiles"
    id = mapped_column(String, primary_key=True)
    name = mapped_column(String, unique=True)
    description = mapped_column(String)
    is_active = mapped_column(Boolean, default=True)
    # relationships: users, courses

class Course(Base):
    __tablename__ = "courses"
    id = mapped_column(String, primary_key=True)
    title = mapped_column(String)
    description = mapped_column(String)
    difficulty = mapped_column(SAEnum(CourseDifficulty))
    duration = mapped_column(Integer)
    is_published = mapped_column(Boolean, default=False)
    # relationships: modules, profiles, enrollments, certificates

class Module(Base):
    __tablename__ = "modules"
    id = mapped_column(String, primary_key=True)
    course_id = mapped_column(String, ForeignKey("courses.id", ondelete="CASCADE"))
    title = mapped_column(String)
    order_index = mapped_column(Integer)
    # relationships: course, lessons, quizzes, labs

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = mapped_column(String, primary_key=True)
    user_id = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    course_id = mapped_column(String, ForeignKey("courses.id", ondelete="CASCADE"))
    status = mapped_column(SAEnum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE)
    progress = mapped_column(Integer, default=0)
    # UniqueConstraint("user_id", "course_id")

# Modelos adicionales: Lesson, Quiz, Question, Answer, Lab, UserProgress,
# QuizAttempt, LabAttempt, Certificate
# Ver backend-fastapi/app/models/ para la definicion completa
```

---

## 5. SEGURIDAD

### 5.1 Autenticación

#### 5.1.1 JWT (JSON Web Tokens)

**Estrategia de doble token:**

```python
# Access Token (corta duracion)
{
  "sub": "uuid",
  "role": "STUDENT",
  "exp": 900  # 15 minutos
}

# Refresh Token (larga duracion)
{
  "sub": "uuid",
  "exp": 604800  # 7 dias
}
```

**Flow de autenticación:**

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as API
    participant DB as Database

    C->>A: POST /api/auth/login {email, password}
    A->>DB: SELECT user WHERE email
    DB-->>A: User data
    A->>A: bcrypt.compare(password, hash)

    alt Valid credentials
        A->>A: Generate Access Token (15m)
        A->>A: Generate Refresh Token (7d)
        A->>DB: Store refresh token hash
        A-->>C: {accessToken, refreshToken, user}
    else Invalid credentials
        A-->>C: 401 Unauthorized
    end

    Note over C: Store tokens in memory/localStorage

    C->>A: GET /api/courses (Authorization: Bearer {accessToken})
    A->>A: Verify JWT signature

    alt Token valid
        A-->>C: Courses data
    else Token expired
        C->>A: POST /api/auth/refresh {refreshToken}
        A->>DB: Verify refresh token
        A->>A: Generate new Access Token
        A-->>C: {accessToken}
        C->>A: Retry original request
    end
```

**Implementacion:**

```python
# app/services/auth_service.py (fragmento token)
from jose import jwt, JWTError
from datetime import datetime, timedelta
import hashlib

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm="HS256")

def verify_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def verify_refresh_token(token: str) -> str:
    payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    stored = await redis_client.get(f"refresh:{payload['sub']}")
    if stored != token_hash:
        raise HTTPException(status_code=401, detail="Token revoked")
    return payload["sub"]

async def revoke_refresh_token(user_id: str):
    await redis_client.delete(f"refresh:{user_id}")
```

#### 5.1.2 Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)
```

**Politica de contrasenas:**
- Minimo 8 caracteres
- Al menos una letra mayuscula
- Al menos una letra minuscula
- Al menos un numero
- Al menos un caracter especial
- No puede contener el email del usuario

```python
# app/schemas/auth.py (fragmento validacion)
from pydantic import BaseModel, field_validator
import re

class RegisterRequest(BaseModel):
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[@$!%*?&#]", v):
            raise ValueError("Password must contain at least one special character")
        return v
```

### 5.2 Autorización (RBAC)

#### 5.2.1 Roles y Permisos

```python
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    STUDENT = "STUDENT"

PERMISSIONS = {
    # User management
    "users:read": [UserRole.ADMIN, UserRole.INSTRUCTOR],
    "users:write": [UserRole.ADMIN],
    "users:delete": [UserRole.ADMIN],

    # Course management
    "courses:create": [UserRole.ADMIN, UserRole.INSTRUCTOR],
    "courses:update": [UserRole.ADMIN, UserRole.INSTRUCTOR],
    "courses:delete": [UserRole.ADMIN],
    "courses:publish": [UserRole.ADMIN],

    # Profile management
    "profiles:assign": [UserRole.ADMIN],
    "profiles:create": [UserRole.ADMIN],

    # Content access
    "courses:enroll": [UserRole.STUDENT],
    "lessons:access": [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN],
    "labs:execute": [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN],

    # Certificates
    "certificates:issue": [UserRole.ADMIN],
    "certificates:view": [UserRole.STUDENT, UserRole.ADMIN],
}
```

#### 5.2.2 Middleware de Autorización

```python
# app/middleware/auth.py
from fastapi import Depends, HTTPException

def require_role(*allowed_roles: UserRole):
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role {current_user.role} not authorized to access this resource"
            )
        return current_user
    return role_checker

# Uso en routers
@router.post("/api/courses")
async def create_course(
    data: CreateCourseRequest,
    user = Depends(require_role(UserRole.ADMIN, UserRole.INSTRUCTOR))
):
    ...

@router.post("/api/admin/users/{user_id}/profile")
async def assign_profile(
    user_id: str,
    user = Depends(require_role(UserRole.ADMIN))
):
    ...
```

#### 5.2.3 Resource-Level Authorization

```python
# app/middleware/auth.py (fragmento ownership)
async def require_ownership(
    resource_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        return current_user  # Admins bypass ownership check

    enrollment = await db.get(Enrollment, resource_id)
    if not enrollment or enrollment.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="You do not own this resource")
    return current_user

# Uso en router
@router.get("/api/enrollments/{enrollment_id}")
async def get_enrollment(
    enrollment_id: str,
    user = Depends(require_ownership)
):
    ...
```

### 5.3 Sandboxing de Código

#### 5.3.1 Arquitectura de Aislamiento

```mermaid
graph TB
    subgraph API Backend
        A[Lab Submit Request]
    end

    subgraph Executor Service
        B[Executor API]
        C[Docker SDK]
    end

    subgraph Docker Host
        D[Ephemeral Container 1]
        E[Ephemeral Container 2]
        F[Ephemeral Container N]
    end

    A -->|HTTP Request| B
    B -->|Create Container| C
    C -->|Isolated Network| D
    C -->|Isolated Network| E
    C -->|Isolated Network| F

    D -->|Auto-destroy| C
    E -->|Auto-destroy| C
    F -->|Auto-destroy| C

    style D fill:#FFA07A,stroke:#FF6347
    style E fill:#FFA07A,stroke:#FF6347
    style F fill:#FFA07A,stroke:#FF6347
```

#### 5.3.2 Configuración de Sandbox

```typescript
// executor/sandbox.service.ts
import Docker from 'dockerode'

const docker = new Docker()

interface SandboxConfig {
  language: string
  code: string
  testCases: TestCase[]
  timeLimit: number // seconds
}

export class SandboxService {
  async execute(config: SandboxConfig): Promise<ExecutionResult> {
    const image = this.getImage(config.language)
    const containerName = `sandbox-${Date.now()}-${Math.random()}`

    // Create container with strict limits
    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      HostConfig: {
        Memory: 128 * 1024 * 1024, // 128 MB
        MemorySwap: 128 * 1024 * 1024, // No swap
        NanoCpus: 0.5 * 1e9, // 0.5 CPU
        PidsLimit: 50, // Max 50 processes
        NetworkMode: 'none', // No network access
        ReadonlyRootfs: true, // Read-only filesystem
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=10m' // 10MB temp storage
        },
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'] // Drop all capabilities
      },
      Cmd: this.buildCommand(config),
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false
    })

    try {
      // Start container
      await container.start()

      // Set execution timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')),
                   config.timeLimit * 1000)
      })

      // Wait for completion or timeout
      const result = await Promise.race([
        container.wait(),
        timeoutPromise
      ])

      // Get logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false
      })

      return {
        success: result.StatusCode === 0,
        output: this.parseLogs(logs),
        exitCode: result.StatusCode
      }

    } catch (error) {
      return {
        success: false,
        output: error.message,
        exitCode: -1
      }
    } finally {
      // Always cleanup
      try {
        await container.remove({ force: true })
      } catch (e) {
        console.error('Failed to remove container:', e)
      }
    }
  }

  private getImage(language: string): string {
    const images = {
      python: 'python:3.11-alpine',
      javascript: 'node:20-alpine',
      bash: 'bash:5.2-alpine',
      c: 'gcc:13-alpine',
      java: 'openjdk:17-alpine'
    }
    return images[language] || 'alpine:latest'
  }
}
```

#### 5.3.3 Medidas de Seguridad

**Limitaciones implementadas:**
- ✅ **Aislamiento de red:** NetworkMode: 'none'
- ✅ **Límites de recursos:** CPU, RAM, procesos
- ✅ **Filesystem read-only:** Previene modificación del sistema
- ✅ **Sin privilegios:** CapDrop: ['ALL']
- ✅ **Timeout estricto:** Máximo 30 segundos de ejecución
- ✅ **Auto-destrucción:** Contenedores eliminados automáticamente
- ✅ **Logs limitados:** Máximo 1MB de output

**Lenguajes soportados:**
- Python 3.11
- JavaScript (Node.js 20)
- Bash
- C (GCC)
- Java (OpenJDK 17)

### 5.4 Validación de Inputs

#### 5.4.1 Pydantic Schemas

```python
# app/schemas/lab.py
from pydantic import BaseModel, Field
from enum import Enum

class LabLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    BASH = "bash"
    C = "c"
    JAVA = "java"

class SubmitLabRequest(BaseModel):
    lab_id: str
    code: str = Field(min_length=1, max_length=10000)
    language: LabLanguage

# app/schemas/course.py
class CreateCourseRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200, pattern=r"^[a-zA-Z0-9\s\-:]+$")
    description: str = Field(min_length=10, max_length=5000)
    difficulty: CourseDifficulty
    duration: int = Field(gt=0, le=10000)
    profile_ids: list[str] = Field(min_length=1)

# FastAPI valida automaticamente con Pydantic al declarar el tipo en el endpoint
@router.post("/api/labs/{lab_id}/submit")
async def submit_lab(
    lab_id: str,
    data: SubmitLabRequest,
    user = Depends(get_current_user)
):
    ...
```

#### 5.4.2 SQL Injection Prevention

**SQLAlchemy previene SQL injection automaticamente:**

```python
# Seguro (SQLAlchemy ORM)
result = await db.execute(select(User).where(User.email == user_input))
user = result.scalar_one_or_none()

# Inseguro (Raw SQL sin parametros - NO usar)
# result = await db.execute(text(f"SELECT * FROM users WHERE email = '{user_input}'"))
```

#### 5.4.3 XSS Prevention

```typescript
// Frontend - DOMPurify para sanitizar HTML
import DOMPurify from 'dompurify'

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}

// Backend - Headers de seguridad (configurados via Nginx o middleware FastAPI)
// En FastAPI, los headers de seguridad se configuran con middleware personalizado
// o a traves de Nginx reverse proxy (ver seccion 2.3.6)
```

### 5.5 Rate Limiting

```python
# app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)

# Uso en routers con decoradores
@router.post("/api/auth/login")
@limiter.limit("5/15minutes")  # 5 intentos de login por ventana de 15 min
async def login(request: Request, data: LoginRequest):
    ...

@router.post("/api/labs/{lab_id}/execute")
@limiter.limit("10/minute")  # 10 ejecuciones por minuto
async def execute_lab(request: Request, lab_id: str, user = Depends(get_current_user)):
    ...

# Rate limit general configurado en main.py
# app.state.limiter = limiter
# 100 requests por 15 minutos por IP en /api/*
```

### 5.6 HTTPS/TLS

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name platform.cybersecurity.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name platform.cybersecurity.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/platform.cybersecurity.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.cybersecurity.com/privkey.pem;

    # SSL configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # ... rest of config
}
```

---

## 6. FLUJOS PRINCIPALES

### 6.1 Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as API
    participant DB as Database
    participant R as Redis

    Note over U,R: REGISTRO
    U->>F: Completa formulario registro
    F->>F: Validar frontend (Zod)
    F->>A: POST /api/auth/register
    A->>A: Validar schema (Pydantic)
    A->>A: Hash password (bcrypt)
    A->>DB: INSERT user
    DB-->>A: User created
    A->>A: Generate tokens (JWT)
    A->>R: Store refresh token hash
    A-->>F: {user, accessToken, refreshToken}
    F->>F: Store tokens in memory
    F-->>U: Redirect to /dashboard

    Note over U,R: LOGIN
    U->>F: Enter credentials
    F->>A: POST /api/auth/login
    A->>DB: SELECT user WHERE email
    DB-->>A: User data
    A->>A: bcrypt.compare(password, hash)

    alt Valid credentials
        A->>A: Generate tokens
        A->>R: Store refresh token
        A-->>F: {user, accessToken, refreshToken}
        F->>F: Store tokens
        F-->>U: Redirect to /dashboard
    else Invalid credentials
        A-->>F: 401 Unauthorized
        F-->>U: Show error message
    end

    Note over U,R: ACCESO A RECURSO PROTEGIDO
    U->>F: Click on "My Courses"
    F->>A: GET /api/enrollments (Auth header)
    A->>A: Verify JWT

    alt Token válido
        A->>DB: Query enrollments
        DB-->>A: Enrollments data
        A-->>F: Enrollments
        F-->>U: Show courses
    else Token expirado
        A-->>F: 401 Token expired
        F->>A: POST /api/auth/refresh {refreshToken}
        A->>R: Verify refresh token
        R-->>A: Valid
        A->>A: Generate new accessToken
        A-->>F: {accessToken}
        F->>F: Update token
        F->>A: Retry GET /api/enrollments
        A-->>F: Enrollments
        F-->>U: Show courses
    end

    Note over U,R: LOGOUT
    U->>F: Click logout
    F->>A: POST /api/auth/logout {refreshToken}
    A->>R: Delete refresh token
    R-->>A: Deleted
    A-->>F: 200 OK
    F->>F: Clear tokens from memory
    F-->>U: Redirect to /login
```

### 6.2 Flujo de Admin

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant API as Backend API
    participant DB as Database

    Note over A,DB: VER TODOS LOS USUARIOS
    A->>F: Navigate to /admin/users
    F->>API: GET /api/admin/users
    API->>API: Check role === ADMIN
    API->>DB: SELECT users with profiles
    DB-->>API: Users list
    API-->>F: Users data
    F-->>A: Display users table

    Note over A,DB: VER PROGRESO DE USUARIO
    A->>F: Click on user "John Doe"
    F->>API: GET /api/admin/users/:id/progress
    API->>DB: Query enrollments + progress
    DB-->>API: Progress data
    API-->>F: {courses, modules, completion %}
    F-->>A: Display progress dashboard

    Note over A,DB: ASIGNAR PERFIL DE ENTRENAMIENTO
    A->>F: Select profile "Pentester Junior"
    A->>F: Click "Assign to John Doe"
    F->>API: PUT /api/admin/users/:id/profile
    API->>API: Validate user and profile exist
    API->>DB: UPDATE user SET profileId
    DB-->>API: User updated

    API->>DB: Query courses for profile
    DB-->>API: Course list
    API->>DB: Auto-enroll user in courses
    DB-->>API: Enrollments created

    API-->>F: {user, enrollments}
    F-->>A: Show success + updated data

    Note over A,DB: CREAR NUEVO CURSO
    A->>F: Navigate to /admin/courses/new
    A->>F: Fill course form
    F->>API: POST /api/admin/courses
    API->>API: Validate schema (Zod)
    API->>DB: INSERT course
    DB-->>API: Course created
    API->>DB: Link to profiles (CourseProfile)
    DB-->>API: Relations created
    API-->>F: Course data
    F-->>A: Redirect to /admin/courses/:id

    Note over A,DB: PUBLICAR CURSO
    A->>F: Click "Publish Course"
    F->>API: PATCH /api/admin/courses/:id/publish
    API->>DB: UPDATE course SET isPublished = true
    DB-->>API: Updated
    API->>API: Invalidate cache (Redis)
    API-->>F: Success
    F-->>A: Show published state
```

### 6.3 Flujo de Estudiante

```mermaid
sequenceDiagram
    participant S as Estudiante
    participant F as Frontend
    participant API as Backend
    participant R as Redis
    participant DB as Database
    participant E as Executor

    Note over S,E: VER CURSOS DISPONIBLES
    S->>F: Navigate to /courses
    F->>API: GET /api/courses?profileId=user.profileId
    API->>R: Check cache

    alt Cache hit
        R-->>API: Cached courses
    else Cache miss
        API->>DB: Query courses filtered by profile
        DB-->>API: Courses
        API->>R: Cache for 5min
    end

    API-->>F: Courses list
    F-->>S: Display course cards

    Note over S,E: INSCRIBIRSE EN CURSO
    S->>F: Click "Enroll in Course X"
    F->>API: POST /api/enrollments
    API->>DB: Check if already enrolled
    DB-->>API: Not enrolled
    API->>DB: INSERT enrollment
    DB-->>API: Enrollment created
    API-->>F: Enrollment data
    F-->>S: Redirect to /courses/:id

    Note over S,E: TOMAR LECCIÓN
    S->>F: Click on "Lesson 1"
    F->>API: GET /api/lessons/:id
    API->>DB: Query lesson + check access
    DB-->>API: Lesson content
    API-->>F: Lesson data
    F-->>S: Display lesson content

    S->>S: Read lesson (5 min)
    S->>F: Click "Mark as complete"
    F->>API: POST /api/lessons/:id/complete
    API->>DB: UPSERT user_progress
    DB-->>API: Progress updated
    API->>DB: Recalculate enrollment progress
    DB-->>API: Progress %
    API-->>F: {completed: true, progress: 25%}
    F-->>S: Show completion + unlock next

    Note over S,E: REALIZAR QUIZ
    S->>F: Click "Take Quiz"
    F->>API: GET /api/quizzes/:id
    API->>DB: Query quiz + questions
    DB-->>API: Quiz data
    API-->>F: Questions (without correct answers)
    F-->>S: Display quiz form

    S->>S: Answer questions
    S->>F: Click "Submit Quiz"
    F->>API: POST /api/quizzes/:id/submit {answers}
    API->>DB: Query correct answers
    DB-->>API: Correct answers
    API->>API: Calculate score

    alt Passed (score >= passingScore)
        API->>DB: INSERT quiz_attempt (passed: true)
        API->>DB: Update enrollment progress
        API-->>F: {passed: true, score: 85}
        F-->>S: Show success + feedback
    else Failed
        API->>DB: INSERT quiz_attempt (passed: false)
        API-->>F: {passed: false, score: 60}
        F-->>S: Show retry option
    end

    Note over S,E: EJECUTAR LABORATORIO
    S->>F: Click "Start Lab"
    F->>API: GET /api/labs/:id
    API->>DB: Query lab details
    DB-->>API: {starterCode, testCases, instructions}
    API-->>F: Lab data
    F-->>S: Display Monaco Editor with starter code

    S->>S: Write code solution
    S->>F: Click "Run Code"
    F->>API: POST /api/labs/:id/execute {code}
    API->>E: Execute code in sandbox
    E->>E: Create Docker container
    E->>E: Run code with testCases
    E->>E: Capture output
    E->>E: Destroy container
    E-->>API: {success, output, testsPassed}

    alt All tests passed
        API->>DB: INSERT lab_attempt (passed: true)
        API->>DB: Update enrollment progress
        API-->>F: {passed: true, output, feedback}
        F-->>S: Show success + output
    else Some tests failed
        API->>DB: INSERT lab_attempt (passed: false)
        API-->>F: {passed: false, output, errors}
        F-->>S: Show errors + hints
    end

    Note over S,E: COMPLETAR CURSO Y OBTENER CERTIFICADO
    S->>F: Complete all modules
    F->>API: GET /api/enrollments/:id
    API->>DB: Check completion (progress === 100)
    DB-->>API: {completed: true}

    API->>API: Generate certificate
    API->>DB: INSERT certificate
    DB-->>API: Certificate data
    API-->>F: {certificate, downloadUrl}
    F-->>S: Display certificate + download button
```

---

## 7. APIS

### 7.1 Estructura General

**Base URL:** `/api`

**Formato de Respuesta:**
```typescript
// Success
{
  success: true,
  data: any,
  message?: string
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Headers comunes:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 7.2 Endpoints por Módulo

#### 7.2.1 Authentication (`/api/auth`)

```typescript
// POST /api/auth/register
{
  email: string
  password: string
  firstName: string
  lastName: string
}
// Response: {user, accessToken, refreshToken}

// POST /api/auth/login
{
  email: string
  password: string
}
// Response: {user, accessToken, refreshToken}

// POST /api/auth/refresh
{
  refreshToken: string
}
// Response: {accessToken}

// POST /api/auth/logout
{
  refreshToken: string
}
// Response: {success: true}

// GET /api/auth/me
// Headers: Authorization: Bearer <token>
// Response: {user}

// POST /api/auth/forgot-password
{
  email: string
}
// Response: {success: true, message}

// POST /api/auth/reset-password
{
  token: string
  newPassword: string
}
// Response: {success: true}
```

#### 7.2.2 Admin (`/api/admin`)

```typescript
// GET /api/admin/users
// Query: ?page=1&limit=20&role=STUDENT&search=john
// Response: {users: User[], total: number, page, limit}

// GET /api/admin/users/:id
// Response: {user: User, enrollments: Enrollment[]}

// GET /api/admin/users/:id/progress
// Response: {
//   enrollments: [{course, progress, modules: [{module, lessons, completed}]}]
// }

// PUT /api/admin/users/:id/profile
{
  profileId: string
}
// Response: {user, enrollments: Enrollment[]}

// DELETE /api/admin/users/:id
// Response: {success: true}

// POST /api/admin/courses
{
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  duration: number
  profileIds: string[]
}
// Response: {course}

// PATCH /api/admin/courses/:id/publish
// Response: {course}

// GET /api/admin/stats
// Response: {
//   totalUsers: number
//   totalCourses: number
//   totalEnrollments: number
//   completionRate: number
// }
```

#### 7.2.3 Courses (`/api/courses`)

```typescript
// GET /api/courses
// Query: ?profileId=uuid&difficulty=BEGINNER&search=security
// Response: {courses: Course[]}

// GET /api/courses/:id
// Response: {
//   course: Course,
//   modules: Module[],
//   isEnrolled: boolean,
//   progress?: number
// }

// GET /api/courses/:id/modules
// Response: {modules: Module[]}

// GET /api/courses/:id/syllabus
// Response: {
//   course: Course,
//   modules: [{module, lessons, quizzes, labs}]
// }
```

#### 7.2.4 Enrollments (`/api/enrollments`)

```typescript
// GET /api/enrollments
// Response: {enrollments: Enrollment[]}

// POST /api/enrollments
{
  courseId: string
}
// Response: {enrollment}

// GET /api/enrollments/:id
// Response: {
//   enrollment,
//   course,
//   progress: {
//     modules: [{module, completed, lessons, quizzes, labs}]
//   }
// }

// DELETE /api/enrollments/:id
// Response: {success: true}
```

#### 7.2.5 Modules (`/api/modules`)

```typescript
// GET /api/modules/:id
// Response: {
//   module: Module,
//   lessons: Lesson[],
//   quizzes: Quiz[],
//   labs: Lab[]
// }

// GET /api/modules/:id/progress
// Response: {
//   progress: {
//     lessonsCompleted: number,
//     totalLessons: number,
//     quizzesPassed: number,
//     totalQuizzes: number,
//     labsPassed: number,
//     totalLabs: number
//   }
// }
```

#### 7.2.6 Lessons (`/api/lessons`)

```typescript
// GET /api/lessons/:id
// Response: {lesson, progress?: UserProgress}

// POST /api/lessons/:id/complete
// Response: {progress: UserProgress, enrollmentProgress: number}

// POST /api/lessons/:id/track-time
{
  timeSpent: number // seconds
}
// Response: {progress}
```

#### 7.2.7 Quizzes (`/api/quizzes`)

```typescript
// GET /api/quizzes/:id
// Response: {
//   quiz: Quiz,
//   questions: Question[], // without correct answers
//   attempts: number
// }

// POST /api/quizzes/:id/submit
{
  answers: {
    [questionId: string]: string[] // answer IDs
  }
}
// Response: {
//   attempt: QuizAttempt,
//   score: number,
//   passed: boolean,
//   feedback: {
//     [questionId: string]: {
//       correct: boolean,
//       correctAnswers: string[],
//       explanation: string
//     }
//   }
// }

// GET /api/quizzes/:id/attempts
// Response: {attempts: QuizAttempt[]}
```

#### 7.2.8 Labs (`/api/labs`)

```typescript
// GET /api/labs/:id
// Response: {
//   lab: Lab,
//   starterCode: string,
//   testCases: TestCase[], // visible test cases only
//   attempts: LabAttempt[]
// }

// POST /api/labs/:id/execute
{
  code: string
}
// Response: {
//   output: string,
//   errors?: string,
//   testResults: {
//     passed: number,
//     total: number,
//     cases: [{description, passed, expected, actual}]
//   },
//   executionTime: number,
//   passed: boolean
// }

// POST /api/labs/:id/submit
{
//   code: string
// }
// Response: {attempt: LabAttempt}

// GET /api/labs/:id/attempts
// Response: {attempts: LabAttempt[]}
```

#### 7.2.9 Executor (`/api/executor`)

```typescript
// POST /api/executor/run
// (Internal API, llamado por Labs service)
{
  language: string,
  code: string,
  testCases: TestCase[],
  timeLimit: number
}
// Response: {
//   output: string,
//   errors?: string,
//   exitCode: number,
//   executionTime: number,
//   testResults: TestResult[]
// }
```

#### 7.2.10 Certificates (`/api/certificates`)

```typescript
// GET /api/certificates
// Response: {certificates: Certificate[]}

// GET /api/certificates/:id
// Response: {certificate, course, user}

// GET /api/certificates/:certificateNumber/verify
// Public endpoint
// Response: {
//   valid: boolean,
//   certificate?: Certificate,
//   course?: Course,
//   user?: {firstName, lastName}
// }

// GET /api/certificates/:id/download
// Response: PDF file
```

### 7.3 Error Handling

```python
# app/middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An unexpected error occurred"
                    }
                }
            )

# FastAPI usa HTTPException nativamente para errores de aplicacion:
# raise HTTPException(status_code=401, detail="Unauthorized")
# raise HTTPException(status_code=403, detail="Forbidden")
# raise HTTPException(status_code=404, detail="Resource not found")
# raise HTTPException(status_code=400, detail="Validation failed")

# Pydantic valida automaticamente y retorna 422 con detalles del error
```

---

## 8. DEPLOYMENT

### 8.1 Docker Compose Structure

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cyber-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost/api
    depends_on:
      - backend
    networks:
      - cyber-network
    restart: unless-stopped

  # Backend API (FastAPI)
  backend:
    build:
      context: ./backend-fastapi
      dockerfile: Dockerfile
    container_name: cyber-backend
    ports:
      - "4000:4000"
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql+asyncpg://postgres:${DB_PASSWORD}@postgres:5432/cybersecurity_platform
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - EXECUTOR_URL=http://executor:5001
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend-fastapi/uploads:/app/uploads
    networks:
      - cyber-network
    restart: unless-stopped

  # Code Executor Service
  executor:
    build:
      context: ./executor
      dockerfile: Dockerfile
    container_name: cyber-executor
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    privileged: true
    networks:
      - cyber-network
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: cyber-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=cybersecurity_platform
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cyber-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: cyber-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - cyber-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: cyber-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - cyber-network
    restart: unless-stopped

  # Certbot for SSL
  certbot:
    image: certbot/certbot
    container_name: cyber-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - cyber-network

networks:
  cyber-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 8.2 Environment Variables

```bash
# .env.example

# Database
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/cybersecurity_platform

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters

# API URLs
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Docker
COMPOSE_PROJECT_NAME=cybersecurity_platform
```

### 8.3 Deployment Commands

```bash
# Development
docker-compose up -d

# Production build
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose logs -f [service_name]

# Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Seed database
docker-compose exec backend python -m app.scripts.seed_base

# Backup database
docker-compose exec postgres pg_dump -U postgres cybersecurity_platform > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres cybersecurity_platform < backup.sql

# Scale services (ejemplo: múltiples backends)
docker-compose up -d --scale backend=3

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ data loss)
docker-compose down -v
```

### 8.4 CI/CD Pipeline (GitHub Actions Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Setup Node.js (frontend)
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend-fastapi && pip install -e ".[dev]"
          cd ../frontend && npm ci

      - name: Run tests
        run: |
          cd backend-fastapi && pytest
          cd ../frontend && npm test

      - name: Lint
        run: |
          cd backend-fastapi && ruff check .
          cd ../frontend && npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push images
        run: |
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml push

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/cybersecurity-platform
            git pull origin main
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose exec backend alembic upgrade head
```

### 8.5 Health Checks

```python
# app/routers/health.py
from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db = Depends(get_db)):
    health = {
        "status": "OK",
        "services": {
            "database": "unknown",
            "redis": "unknown"
        }
    }

    try:
        await db.execute(text("SELECT 1"))
        health["services"]["database"] = "healthy"
    except Exception:
        health["services"]["database"] = "unhealthy"
        health["status"] = "ERROR"

    try:
        await redis_client.ping()
        health["services"]["redis"] = "healthy"
    except Exception:
        health["services"]["redis"] = "unhealthy"
        health["status"] = "ERROR"

    status_code = 200 if health["status"] == "OK" else 503
    return JSONResponse(content=health, status_code=status_code)
```

---

## 9. ESCALABILIDAD Y PERFORMANCE

### 9.1 Caching Strategy

#### 9.1.1 Cache Layers

```python
# app/services/cache_service.py
import json
from app.config import redis_client

class CacheService:
    # Cache de cursos (TTL: 5 minutos)
    async def get_courses(self, profile_id: str | None = None) -> list:
        cache_key = f"courses:{profile_id or 'all'}"

        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        # Query con SQLAlchemy
        stmt = select(Course).where(Course.is_published == True)
        if profile_id:
            stmt = stmt.join(CourseProfile).where(CourseProfile.profile_id == profile_id)
        result = await db.execute(stmt)
        courses = result.scalars().all()

        await redis_client.setex(cache_key, 300, json.dumps([c.to_dict() for c in courses]))
        return courses

    # Invalidar cache
    async def invalidate_course(self, course_id: str):
        keys = await redis_client.keys("courses:*")
        course_key = f"course:{course_id}"
        if keys:
            await redis_client.delete(*keys, course_key)
```

#### 9.1.2 Cache Patterns

**Cache-Aside (Lazy Loading):**
```typescript
async function getCourse(id: string) {
  // 1. Check cache first
  const cached = await cache.get(`course:${id}`)
  if (cached) return cached

  // 2. Query database
  const course = await db.findCourse(id)

  // 3. Store in cache
  await cache.set(`course:${id}`, course, TTL)

  return course
}
```

**Write-Through:**
```typescript
async function updateCourse(id: string, data: any) {
  // 1. Update database
  const course = await db.updateCourse(id, data)

  // 2. Update cache immediately
  await cache.set(`course:${id}`, course, TTL)

  return course
}
```

### 9.2 Database Optimization

#### 9.2.1 Indexes

```python
# Indices definidos en los modelos SQLAlchemy

class User(Base):
    __tablename__ = "users"
    # Index: email (unique), role, profile_id

class Course(Base):
    __tablename__ = "courses"
    # Index: is_published, difficulty
    # GIN index en title + description para busqueda full-text (opcional)

class Enrollment(Base):
    __tablename__ = "enrollments"
    # Index: (user_id, status), (course_id, completed_at)
    # UniqueConstraint: (user_id, course_id)

class UserProgress(Base):
    __tablename__ = "user_progress"
    # Index: (user_id, completed_at), (lesson_id, completed)
    # UniqueConstraint: (user_id, lesson_id)
```

#### 9.2.2 Query Optimization

```python
# N+1 Problem - evitar con eager loading

# Incorrecto: N+1 queries
enrollments = (await db.execute(select(Enrollment))).scalars().all()
for enrollment in enrollments:
    course = await db.get(Course, enrollment.course_id)  # N queries adicionales

# Correcto: eager loading con joinedload/selectinload
from sqlalchemy.orm import joinedload, selectinload

stmt = (
    select(Enrollment)
    .options(
        joinedload(Enrollment.course).selectinload(Course.modules),
        joinedload(Enrollment.user)
    )
)
enrollments = (await db.execute(stmt)).unique().scalars().all()

# Paginacion
PAGE_SIZE = 20

async def get_courses(page: int = 1):
    offset = (page - 1) * PAGE_SIZE
    stmt = (
        select(Course)
        .where(Course.is_published == True)
        .order_by(Course.created_at.desc())
        .offset(offset)
        .limit(PAGE_SIZE)
    )
    courses = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(
        select(func.count(Course.id)).where(Course.is_published == True)
    )).scalar()

    return {
        "courses": courses,
        "pagination": {
            "page": page,
            "page_size": PAGE_SIZE,
            "total": total,
            "total_pages": (total + PAGE_SIZE - 1) // PAGE_SIZE
        }
    }
```

### 9.3 Load Balancing

```nginx
# nginx/nginx.conf
upstream backend_servers {
    least_conn; # Load balancing algorithm

    server backend1:5000 weight=1 max_fails=3 fail_timeout=30s;
    server backend2:5000 weight=1 max_fails=3 fail_timeout=30s;
    server backend3:5000 weight=1 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

server {
    location /api {
        proxy_pass http://backend_servers;

        # Connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Load balancer headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 9.4 Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
      restart_policy:
        condition: on-failure
        max_attempts: 3

  executor:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

```bash
# Scale up
docker-compose up -d --scale backend=5 --scale executor=3

# Scale down
docker-compose up -d --scale backend=2 --scale executor=1
```

### 9.5 CDN Integration

```python
# app/services/cdn_service.py (ejemplo)
import boto3
from app.config import settings

s3_client = boto3.client("s3", region_name="us-east-1")

async def upload_to_cdn(file_data: bytes, key: str, content_type: str) -> str:
    s3_client.put_object(
        Bucket=settings.CDN_BUCKET,
        Key=key,
        Body=file_data,
        ContentType=content_type,
        CacheControl="public, max-age=31536000"  # 1 year
    )
    return f"{settings.CDN_URL}/{key}"

# Upload course images to CDN
image_url = await upload_to_cdn(
    image_buffer,
    f"courses/{course_id}/cover.jpg",
    "image/jpeg"
)
```

### 9.6 Database Connection Pooling

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,  # postgresql+asyncpg://user:pass@host:5432/db
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    echo=False  # True para debug de queries
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session
```

---

## 10. MONITOREO Y LOGGING

### 10.1 Logging Strategy

#### 10.1.1 Python Logging (structlog / logging)

```python
# app/config.py (fragmento logging)
import logging
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

logger = structlog.get_logger(service="cybersecurity-platform")

# Middleware de request logging para FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start

        logger.info(
            "HTTP Request",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2),
        )
        return response
```

#### 10.1.2 Structured Logging

```python
# app/services/audit_service.py
import structlog

logger = structlog.get_logger()

class AuditService:
    def log_user_action(self, user_id: str, action: str, details: dict | None = None):
        logger.info("User Action", user_id=user_id, action=action, details=details)

    def log_security_event(self, event_type: str, severity: str, details: dict):
        logger.warning("Security Event", type=event_type, severity=severity, details=details)

    def log_system_error(self, error: Exception, context: dict | None = None):
        logger.error("System Error", message=str(error), context=context, exc_info=True)

# Uso
audit_service.log_user_action(user_id, "COURSE_ENROLLED", {"course_id": course_id})
audit_service.log_security_event("FAILED_LOGIN_ATTEMPT", "medium", {"email": email, "ip": ip})
audit_service.log_system_error(error, {"endpoint": "/api/courses", "method": "POST"})
```

### 10.2 Metrics Collection

```python
# app/middleware/metrics.py
from prometheus_client import Histogram, Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
import time

http_request_duration = Histogram(
    "http_request_duration_seconds",
    "Duration of HTTP requests in seconds",
    ["method", "route", "status_code"]
)

http_request_total = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "route", "status_code"]
)

active_users = Gauge("active_users_total", "Total number of active users")

lab_executions = Counter(
    "lab_executions_total",
    "Total number of lab code executions",
    ["language", "status"]
)

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start

        route = request.url.path
        http_request_duration.labels(request.method, route, response.status_code).observe(duration)
        http_request_total.labels(request.method, route, response.status_code).inc()

        return response

@router.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

### 10.3 Health Monitoring

```python
# app/routers/monitoring.py
from fastapi import APIRouter, Depends
from sqlalchemy import text
import psutil, time, httpx

router = APIRouter()

@router.get("/health")
async def health(db = Depends(get_db)):
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": await check_database(db),
            "redis": await check_redis(),
            "executor": await check_executor()
        },
        "system": {
            "memory": {
                "total": psutil.virtual_memory().total,
                "free": psutil.virtual_memory().available,
                "usage_percent": psutil.virtual_memory().percent
            },
            "cpu": {
                "cores": psutil.cpu_count(),
                "load_average": psutil.getloadavg()
            }
        }
    }
    all_healthy = all(s["status"] == "healthy" for s in health["services"].values())
    health["status"] = "healthy" if all_healthy else "degraded"
    return JSONResponse(content=health, status_code=200 if all_healthy else 503)

@router.get("/ready")
async def readiness(db = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        await redis_client.ping()
        return {"ready": True}
    except Exception as e:
        return JSONResponse(content={"ready": False, "error": str(e)}, status_code=503)

@router.get("/live")
async def liveness():
    return {"alive": True}
```

### 10.4 Error Tracking (Sentry Integration)

```python
# app/config.py (fragmento Sentry)
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

def init_sentry():
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions
        profiles_sample_rate=0.1,
    )

# Manual error reporting
def report_error(error: Exception, context: dict | None = None):
    logger.error(str(error), context=context, exc_info=True)
    sentry_sdk.capture_exception(error)
```

### 10.5 Alerting

```python
# app/services/alert_service.py
import httpx
import structlog
from app.config import settings

logger = structlog.get_logger()

class AlertService:
    async def send_alert(self, severity: str, message: str, details: dict | None = None):
        logger.log(severity, f"ALERT: {message}", details=details)

        if severity == "critical":
            await self._send_slack_notification(severity, message, details)

    async def _send_slack_notification(self, severity: str, message: str, details: dict | None):
        webhook = settings.SLACK_WEBHOOK_URL
        if not webhook:
            return

        async with httpx.AsyncClient() as client:
            await client.post(webhook, json={
                "text": f"[{severity.upper()}]: {message}",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*{message}*\n```{details}```"
                        }
                    }
                ]
            })

# Uso
await alert_service.send_alert("critical", "Database connection lost", {"service": "postgres"})
await alert_service.send_alert("warning", "High memory usage detected", {"usage": "85%"})
```

---

## Apéndices

### A. Glosario

| Término | Definición |
|---------|------------|
| **RBAC** | Role-Based Access Control - Control de acceso basado en roles |
| **JWT** | JSON Web Token - Token de autenticación basado en JSON |
| **ORM** | Object-Relational Mapping - Mapeo objeto-relacional |
| **Sandbox** | Entorno aislado para ejecución segura de código |
| **TTL** | Time To Live - Tiempo de vida de un elemento en caché |
| **CDN** | Content Delivery Network - Red de distribución de contenido |
| **CSRF** | Cross-Site Request Forgery - Falsificación de petición en sitios cruzados |
| **XSS** | Cross-Site Scripting - Inyección de scripts maliciosos |

### B. Referencias

- **React Documentation:** https://react.dev
- **FastAPI Documentation:** https://fastapi.tiangolo.com
- **SQLAlchemy Documentation:** https://docs.sqlalchemy.org
- **Alembic Documentation:** https://alembic.sqlalchemy.org
- **Pydantic Documentation:** https://docs.pydantic.dev
- **PostgreSQL Documentation:** https://www.postgresql.org/docs
- **Redis Documentation:** https://redis.io/docs
- **Docker Documentation:** https://docs.docker.com
- **Nginx Documentation:** https://nginx.org/en/docs

### C. Change Log

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-02-24 | Documento inicial de arquitectura |
| 2.0 | 2026-04-14 | Migracion de Express/Prisma/Zod a FastAPI/SQLAlchemy/Pydantic |

---

**Fin del Documento de Arquitectura Técnica**

---

Este documento es un living document y debe actualizarse conforme evoluciona la plataforma. Para cambios arquitectónicos significativos, se debe abrir un RFC (Request for Comments) para revisión del equipo.
