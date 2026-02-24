# Arquitectura Técnica - Plataforma Multi-Curso de Ciberseguridad

**Versión:** 1.0
**Fecha:** Febrero 2026
**Estado:** Documento Base de Referencia

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
        API[API REST<br>Node.js + Express + TypeScript]
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

#### 2.3.2 Backend API (Node.js + Express)

**Responsabilidades:**
- Lógica de negocio principal
- Autenticación y autorización (JWT)
- Validación de datos (Zod)
- Comunicación con base de datos (Prisma ORM)
- Gestión de caché (Redis)
- Coordinación de ejecución de código

**Tecnologías:**
- Node.js 20+ LTS
- Express.js con TypeScript
- Prisma ORM
- JWT para autenticación
- Zod para validación de schemas

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
- Esquema gestionado por Prisma Migrations
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

**Node.js 20 LTS + Express + TypeScript**

```typescript
// server.ts
import express, { Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'

const app: Express = express()

// Middleware
app.use(helmet()) // Security headers
app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/labs', labRoutes)

export default app
```

#### 3.2.2 ORM - Prisma

**Prisma 5+**
- Type-safe database client
- Auto-generated TypeScript types
- Database migrations
- Introspection
- Query builder

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(STUDENT)
  profile   TrainingProfile?
  enrollments Enrollment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}
```

#### 3.2.3 Authentication - JWT

**jsonwebtoken + bcrypt**

```typescript
// services/auth.service.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedError('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedError('Invalid credentials')

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )

    return { user, accessToken, refreshToken }
  }
}
```

#### 3.2.4 Validation - Zod

```typescript
// schemas/course.schema.ts
import { z } from 'zod'

export const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.number().positive(),
  profileIds: z.array(z.string().uuid())
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
```

#### 3.2.5 Middleware Stack

```typescript
// middleware/auth.middleware.ts
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new UnauthorizedError()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = payload
    next()
  } catch (error) {
    throw new UnauthorizedError('Invalid token')
  }
}

// middleware/authorize.middleware.ts
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError()
    }
    next()
  }
}
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

```typescript
// config/redis.ts
import { createClient } from 'redis'

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
})

redisClient.on('error', (err) => console.error('Redis Error:', err))
await redisClient.connect()
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
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/server.js"]
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

### 4.3 Schema Prisma Completo

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(STUDENT)
  firstName String
  lastName  String
  profileId String?

  profile       TrainingProfile? @relation(fields: [profileId], references: [id])
  enrollments   Enrollment[]
  progress      UserProgress[]
  quizAttempts  QuizAttempt[]
  labAttempts   LabAttempt[]
  certificates  Certificate[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role])
  @@index([profileId])
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

model TrainingProfile {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  isActive    Boolean  @default(true)

  users   User[]
  courses CourseProfile[]

  createdAt DateTime @default(now())
}

model Course {
  id          String       @id @default(uuid())
  title       String
  description String
  difficulty  Difficulty
  duration    Int
  imageUrl    String?
  isPublished Boolean      @default(false)

  modules      Module[]
  profiles     CourseProfile[]
  enrollments  Enrollment[]
  certificates Certificate[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isPublished])
  @@index([difficulty])
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model CourseProfile {
  courseId   String
  profileId  String
  orderIndex Int
  addedAt    DateTime @default(now())

  course  Course          @relation(fields: [courseId], references: [id], onDelete: Cascade)
  profile TrainingProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@id([courseId, profileId])
}

model Module {
  id          String @id @default(uuid())
  courseId    String
  title       String
  description String
  orderIndex  Int

  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]
  quizzes Quiz[]
  labs    Lab[]

  createdAt DateTime @default(now())

  @@index([courseId])
}

model Lesson {
  id          String      @id @default(uuid())
  moduleId    String
  title       String
  content     String      @db.Text
  contentType ContentType
  videoUrl    String?
  duration    Int
  orderIndex  Int

  module   Module         @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress UserProgress[]

  createdAt DateTime @default(now())

  @@index([moduleId])
}

enum ContentType {
  TEXT
  VIDEO
  INTERACTIVE
}

model Quiz {
  id           String @id @default(uuid())
  moduleId     String
  title        String
  description  String
  passingScore Int
  timeLimit    Int
  orderIndex   Int

  module    Module        @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  questions Question[]
  attempts  QuizAttempt[]

  createdAt DateTime @default(now())

  @@index([moduleId])
}

model Question {
  id           String       @id @default(uuid())
  quizId       String
  questionText String       @db.Text
  questionType QuestionType
  points       Int
  orderIndex   Int

  quiz    Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers Answer[]

  @@index([quizId])
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  MULTI_SELECT
}

model Answer {
  id          String  @id @default(uuid())
  questionId  String
  answerText  String  @db.Text
  isCorrect   Boolean
  explanation String?

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
}

model Lab {
  id           String @id @default(uuid())
  moduleId     String
  title        String
  description  String @db.Text
  instructions String @db.Text
  language     String
  starterCode  String @db.Text
  solutionCode String @db.Text
  testCases    Json
  timeLimit    Int
  orderIndex   Int

  module   Module       @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  attempts LabAttempt[]

  @@index([moduleId])
}

model Enrollment {
  id          String           @id @default(uuid())
  userId      String
  courseId    String
  status      EnrollmentStatus @default(ACTIVE)
  progress    Int              @default(0)
  enrolledAt  DateTime         @default(now())
  completedAt DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([status])
  @@index([completedAt])
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  DROPPED
}

model UserProgress {
  id             String    @id @default(uuid())
  userId         String
  lessonId       String
  completed      Boolean   @default(false)
  timeSpent      Int       @default(0)
  lastAccessedAt DateTime  @default(now())
  completedAt    DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
}

model QuizAttempt {
  id          String   @id @default(uuid())
  userId      String
  quizId      String
  score       Int
  answers     Json
  passed      Boolean
  startedAt   DateTime @default(now())
  completedAt DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([quizId])
}

model LabAttempt {
  id              String   @id @default(uuid())
  userId          String
  labId           String
  submittedCode   String   @db.Text
  executionResult Json
  passed          Boolean
  attempts        Int      @default(1)
  submittedAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  lab  Lab  @relation(fields: [labId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([labId])
}

model Certificate {
  id                String    @id @default(uuid())
  userId            String
  courseId          String
  certificateNumber String    @unique
  issuedAt          DateTime  @default(now())
  expiresAt         DateTime?
  verificationUrl   String

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([courseId])
}
```

---

## 5. SEGURIDAD

### 5.1 Autenticación

#### 5.1.1 JWT (JSON Web Tokens)

**Estrategia de doble token:**

```typescript
// Access Token (corta duración)
{
  userId: "uuid",
  role: "STUDENT",
  exp: 900 // 15 minutos
}

// Refresh Token (larga duración)
{
  userId: "uuid",
  exp: 604800 // 7 días
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

**Implementación:**

```typescript
// services/token.service.ts
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export class TokenService {
  generateAccessToken(userId: string, role: Role): string {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )
  }

  generateRefreshToken(userId: string): string {
    const token = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )
    return token
  }

  verifyAccessToken(token: string): { userId: string; role: Role } {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as any
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token')
    }
  }

  async verifyRefreshToken(token: string): Promise<string> {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any

    // Verificar que el token no haya sido revocado
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const storedToken = await redis.get(`refresh:${payload.userId}`)

    if (storedToken !== tokenHash) {
      throw new UnauthorizedError('Token revoked')
    }

    return payload.userId
  }

  async revokeRefreshToken(userId: string) {
    await redis.del(`refresh:${userId}`)
  }
}
```

#### 5.1.2 Password Hashing

```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

**Política de contraseñas:**
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial
- No puede contener el email del usuario

```typescript
// validators/password.validator.ts
import { z } from 'zod'

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character')
```

### 5.2 Autorización (RBAC)

#### 5.2.1 Roles y Permisos

```typescript
enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT'
}

const PERMISSIONS = {
  // User management
  'users:read': [Role.ADMIN, Role.INSTRUCTOR],
  'users:write': [Role.ADMIN],
  'users:delete': [Role.ADMIN],

  // Course management
  'courses:create': [Role.ADMIN, Role.INSTRUCTOR],
  'courses:update': [Role.ADMIN, Role.INSTRUCTOR],
  'courses:delete': [Role.ADMIN],
  'courses:publish': [Role.ADMIN],

  // Profile management
  'profiles:assign': [Role.ADMIN],
  'profiles:create': [Role.ADMIN],

  // Content access
  'courses:enroll': [Role.STUDENT],
  'lessons:access': [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN],
  'labs:execute': [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN],

  // Certificates
  'certificates:issue': [Role.ADMIN],
  'certificates:view': [Role.STUDENT, Role.ADMIN]
}
```

#### 5.2.2 Middleware de Autorización

```typescript
// middleware/authorize.middleware.ts
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError(
        `Role ${userRole} not authorized to access this resource`
      )
    }

    next()
  }
}

// Uso en rutas
router.post(
  '/api/courses',
  authenticate,
  authorize(Role.ADMIN, Role.INSTRUCTOR),
  createCourse
)

router.post(
  '/api/admin/users/:id/profile',
  authenticate,
  authorize(Role.ADMIN),
  assignProfile
)
```

#### 5.2.3 Resource-Level Authorization

```typescript
// middleware/ownership.middleware.ts
export function requireOwnership(resourceType: 'enrollment' | 'progress') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId
    const resourceId = req.params.id

    if (req.user.role === Role.ADMIN) {
      return next() // Admins bypass ownership check
    }

    let isOwner = false

    if (resourceType === 'enrollment') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: resourceId }
      })
      isOwner = enrollment?.userId === userId
    }

    if (!isOwner) {
      throw new ForbiddenError('You do not own this resource')
    }

    next()
  }
}

// Uso
router.get(
  '/api/enrollments/:id',
  authenticate,
  requireOwnership('enrollment'),
  getEnrollment
)
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

#### 5.4.1 Zod Schemas

```typescript
// schemas/lab.schema.ts
import { z } from 'zod'

export const submitLabSchema = z.object({
  labId: z.string().uuid(),
  code: z.string()
    .min(1, 'Code cannot be empty')
    .max(10000, 'Code too large (max 10KB)'),
  language: z.enum(['python', 'javascript', 'bash', 'c', 'java'])
})

// schemas/course.schema.ts
export const createCourseSchema = z.object({
  title: z.string()
    .min(3, 'Title too short')
    .max(200, 'Title too long')
    .regex(/^[a-zA-Z0-9\s\-:]+$/, 'Invalid characters in title'),
  description: z.string()
    .min(10, 'Description too short')
    .max(5000, 'Description too long'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.number().int().positive().max(10000),
  profileIds: z.array(z.string().uuid()).min(1)
})

// Middleware de validación
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors)
      }
      throw error
    }
  }
}

// Uso
router.post(
  '/api/labs/:id/submit',
  authenticate,
  validate(submitLabSchema),
  submitLab
)
```

#### 5.4.2 SQL Injection Prevention

**Prisma ORM previene SQL injection automáticamente:**

```typescript
// ✅ Seguro (Prisma)
const user = await prisma.user.findUnique({
  where: { email: userInput } // Parameterized automatically
})

// ❌ Inseguro (Raw SQL)
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
` // Don't use unless absolutely necessary
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

// Backend - Headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

### 5.5 Rate Limiting

```typescript
// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redisClient } from '@/config/redis'

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

// Auth endpoints (más estricto)
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login
  skipSuccessfulRequests: true
})

// Lab execution (muy estricto)
export const labLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:lab:'
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 ejecuciones por minuto
  keyGenerator: (req) => req.user.userId // Por usuario
})

// Uso
app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/labs/:id/execute', authenticate, labLimiter, executeLab)
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
    A->>A: Validar schema (Zod)
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

```typescript
// error-handler.middleware.ts
export class AppError extends Error {
  statusCode: number
  code: string
  details?: any

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(errors: any[]) {
    super('Validation failed', 400, 'VALIDATION_ERROR', errors)
  }
}

// Global error handler
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
  }

  // Unexpected errors
  console.error('Unexpected error:', error)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  })
}
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

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cyber-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/cybersecurity_platform
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
      - ./backend/uploads:/app/uploads
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
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed

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

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

      - name: Lint
        run: |
          cd backend && npm run lint
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
            docker-compose exec backend npx prisma migrate deploy
```

### 8.5 Health Checks

```typescript
// backend/routes/health.route.ts
import { Router } from 'express'
import { prisma } from '@/config/database'
import { redisClient } from '@/config/redis'

const router = Router()

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database = 'healthy'
  } catch (error) {
    health.services.database = 'unhealthy'
    health.status = 'ERROR'
  }

  try {
    await redisClient.ping()
    health.services.redis = 'healthy'
  } catch (error) {
    health.services.redis = 'unhealthy'
    health.status = 'ERROR'
  }

  const statusCode = health.status === 'OK' ? 200 : 503
  res.status(statusCode).json(health)
})

export default router
```

---

## 9. ESCALABILIDAD Y PERFORMANCE

### 9.1 Caching Strategy

#### 9.1.1 Cache Layers

```typescript
// services/cache.service.ts
import { redisClient } from '@/config/redis'

export class CacheService {
  // Cache de cursos (TTL: 5 minutos)
  async getCourses(profileId?: string): Promise<Course[]> {
    const cacheKey = `courses:${profileId || 'all'}`

    const cached = await redisClient.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const courses = await prisma.course.findMany({
      where: profileId ? {
        profiles: { some: { profileId } }
      } : { isPublished: true }
    })

    await redisClient.setEx(cacheKey, 300, JSON.stringify(courses))
    return courses
  }

  // Cache de módulos (TTL: 10 minutos)
  async getModule(moduleId: string): Promise<Module> {
    const cacheKey = `module:${moduleId}`

    const cached = await redisClient.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { lessons: true, quizzes: true, labs: true }
    })

    if (module) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(module))
    }

    return module
  }

  // Invalidar cache
  async invalidateCourse(courseId: string) {
    const keys = await redisClient.keys(`courses:*`)
    const courseKey = `course:${courseId}`

    await redisClient.del([...keys, courseKey])
  }

  // Cache de sesiones de usuario (TTL: 24 horas)
  async setUserSession(userId: string, data: any) {
    await redisClient.setEx(`session:${userId}`, 86400, JSON.stringify(data))
  }

  async getUserSession(userId: string) {
    const session = await redisClient.get(`session:${userId}`)
    return session ? JSON.parse(session) : null
  }
}
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

```prisma
// Índices críticos para performance

model User {
  @@index([email]) // Login lookup
  @@index([role, profileId]) // Admin queries
}

model Course {
  @@index([isPublished, difficulty]) // Course listing
  @@fulltext([title, description]) // Search
}

model Enrollment {
  @@index([userId, status]) // User enrollments
  @@index([courseId, completedAt]) // Course analytics
}

model UserProgress {
  @@index([userId, completedAt]) // Progress tracking
  @@index([lessonId, completed]) // Lesson analytics
}
```

#### 9.2.2 Query Optimization

```typescript
// ❌ N+1 Problem
const enrollments = await prisma.enrollment.findMany()
for (const enrollment of enrollments) {
  const course = await prisma.course.findUnique({
    where: { id: enrollment.courseId }
  })
}

// ✅ Optimized with include
const enrollments = await prisma.enrollment.findMany({
  include: {
    course: {
      include: {
        modules: {
          select: { id: true, title: true }
        }
      }
    },
    user: {
      select: { id: true, firstName: true, lastName: true }
    }
  }
})

// ✅ Pagination
const PAGE_SIZE = 20

async function getCourses(page: number = 1) {
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.course.count({ where: { isPublished: true } })
  ])

  return {
    courses,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE)
    }
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

```typescript
// config/cdn.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({ region: 'us-east-1' })

export async function uploadToCDN(
  file: Buffer,
  key: string,
  contentType: string
) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.CDN_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000' // 1 year
  }))

  return `${process.env.CDN_URL}/${key}`
}

// Upload course images to CDN
const imageUrl = await uploadToCDN(
  imageBuffer,
  `courses/${courseId}/cover.jpg`,
  'image/jpeg'
)
```

### 9.6 Database Connection Pooling

```typescript
// config/database.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'minimal'
})

// Connection pool configuration (via DATABASE_URL)
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10

export { prisma }
```

---

## 10. MONITOREO Y LOGGING

### 10.1 Logging Strategy

#### 10.1.1 Winston Logger

```typescript
// config/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'cybersecurity-platform',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // Error logs file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),

    // Combined logs file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
})

// HTTP request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start

    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      userId: req.user?.userId
    })
  })

  next()
}

export default logger
```

#### 10.1.2 Structured Logging

```typescript
// services/audit.service.ts
import logger from '@/config/logger'

export class AuditService {
  logUserAction(userId: string, action: string, details?: any) {
    logger.info('User Action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    })
  }

  logSecurityEvent(type: string, severity: 'low' | 'medium' | 'high', details: any) {
    logger.warn('Security Event', {
      type,
      severity,
      details,
      timestamp: new Date().toISOString()
    })
  }

  logSystemError(error: Error, context?: any) {
    logger.error('System Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }
}

// Usage
auditService.logUserAction(userId, 'COURSE_ENROLLED', { courseId })
auditService.logSecurityEvent('FAILED_LOGIN_ATTEMPT', 'medium', { email, ip })
auditService.logSystemError(error, { endpoint: '/api/courses', method: 'POST' })
```

### 10.2 Metrics Collection

```typescript
// middleware/metrics.middleware.ts
import promClient from 'prom-client'

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users'
})

const labExecutions = new promClient.Counter({
  name: 'lab_executions_total',
  help: 'Total number of lab code executions',
  labelNames: ['language', 'status']
})

// Middleware to track metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000

    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || 'unknown', status_code: res.statusCode },
      duration
    )

    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode
    })
  })

  next()
}

// Metrics endpoint
export async function getMetrics(req: Request, res: Response) {
  res.set('Content-Type', promClient.register.contentType)
  const metrics = await promClient.register.metrics()
  res.send(metrics)
}
```

### 10.3 Health Monitoring

```typescript
// routes/monitoring.route.ts
import { Router } from 'express'
import { prisma } from '@/config/database'
import { redisClient } from '@/config/redis'
import os from 'os'

const router = Router()

// Health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      executor: await checkExecutor()
    },
    system: {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadAverage: os.loadavg()
      }
    }
  }

  const allHealthy = Object.values(health.services).every(s => s.status === 'healthy')
  health.status = allHealthy ? 'healthy' : 'degraded'

  res.status(allHealthy ? 200 : 503).json(health)
})

// Readiness check (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    await redisClient.ping()
    res.status(200).json({ ready: true })
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message })
  }
})

// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true })
})

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', latency: 0 }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

async function checkRedis() {
  try {
    const start = Date.now()
    await redisClient.ping()
    const latency = Date.now() - start
    return { status: 'healthy', latency }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

async function checkExecutor() {
  try {
    const response = await fetch(`${process.env.EXECUTOR_URL}/health`)
    const data = await response.json()
    return { status: data.status === 'OK' ? 'healthy' : 'unhealthy' }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

export default router
```

### 10.4 Error Tracking (Sentry Integration)

```typescript
// config/sentry.ts
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'

export function initSentry(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration()
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    profilesSampleRate: 0.1
  })

  // Request handler must be first
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())
}

export function sentryErrorHandler(app: Express) {
  // Error handler must be before other error middleware
  app.use(Sentry.Handlers.errorHandler())
}

// Manual error reporting
import logger from './logger'

export function reportError(error: Error, context?: any) {
  logger.error(error.message, { stack: error.stack, context })

  Sentry.captureException(error, {
    extra: context
  })
}
```

### 10.5 Alerting

```typescript
// services/alert.service.ts
import logger from '@/config/logger'

interface Alert {
  severity: 'info' | 'warning' | 'critical'
  message: string
  details?: any
}

export class AlertService {
  async sendAlert(alert: Alert) {
    logger.log(alert.severity, `ALERT: ${alert.message}`, alert.details)

    // Send to external services
    if (alert.severity === 'critical') {
      await this.sendSlackNotification(alert)
      await this.sendEmail(alert)
    }
  }

  private async sendSlackNotification(alert: Alert) {
    // Slack webhook integration
    const webhook = process.env.SLACK_WEBHOOK_URL
    if (!webhook) return

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.message}*\n\`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\``
            }
          }
        ]
      })
    })
  }

  private async sendEmail(alert: Alert) {
    // Email notification (nodemailer)
    // Implementation depends on email provider
  }
}

// Usage examples
alertService.sendAlert({
  severity: 'critical',
  message: 'Database connection lost',
  details: { timestamp: new Date(), service: 'postgres' }
})

alertService.sendAlert({
  severity: 'warning',
  message: 'High memory usage detected',
  details: { usage: '85%', threshold: '80%' }
})
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
- **Node.js Documentation:** https://nodejs.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs
- **Redis Documentation:** https://redis.io/docs
- **Docker Documentation:** https://docs.docker.com
- **Nginx Documentation:** https://nginx.org/en/docs

### C. Change Log

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-02-24 | Documento inicial de arquitectura |

---

**Fin del Documento de Arquitectura Técnica**

---

Este documento es un living document y debe actualizarse conforme evoluciona la plataforma. Para cambios arquitectónicos significativos, se debe abrir un RFC (Request for Comments) para revisión del equipo.
