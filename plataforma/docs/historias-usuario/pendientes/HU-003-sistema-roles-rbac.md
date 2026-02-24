# HU-003: Sistema de Roles (RBAC)

**Épica:** EP-001 - Autenticación y Autorización
**Sprint:** 1
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador del sistema
**Quiero** que los usuarios tengan roles diferenciados (Admin, Instructor, Student)
**Para** controlar el acceso a funcionalidades según permisos

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo de usuario con campo `role` (enum: ADMIN, INSTRUCTOR, STUDENT) con valor por defecto STUDENT
- [ ] **AC2:** Middleware de autorización que verifica rol extraído del JWT antes de acceder a rutas protegidas
- [ ] **AC3:** Rutas backend protegidas correctamente por rol:
  - Admin: acceso a TODAS las rutas (usuarios, cursos, estadísticas, configuración)
  - Instructor: acceso a evaluaciones, visualización de estudiantes, gestión de sus cursos
  - Student: acceso solo a cursos disponibles y perfil personal
- [ ] **AC4:** Interfaz frontend adaptativa que muestra/oculta elementos según rol del usuario autenticado
- [ ] **AC5:** Tests de permisos automatizados para cada combinación de rol y endpoint
- [ ] **AC6:** Página de error 403 (Forbidden) con mensaje claro cuando usuario intenta acceder a recurso no autorizado
- [ ] **AC7:** Navbar dinámico que muestra opciones según rol (Admin ve "Dashboard", Student ve "Mis Cursos")

---

## Definición de Hecho (DoD)

- [ ] Código implementado (backend y frontend)
- [ ] Tests unitarios escritos y pasando (>80% coverage)
- [ ] Tests de integración escritos y pasando
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Code review realizado y aprobado
- [ ] Documentación técnica actualizada (JSDoc/Swagger)
- [ ] Validado en entorno Docker local
- [ ] Sin warnings de linter ni TypeScript errors

---

## Detalles Técnicos

### Backend

**Endpoints Protegidos:**
```typescript
// Rutas Admin (require ADMIN role)
GET    /api/admin/users
POST   /api/admin/users/:id/assign-profile
GET    /api/admin/dashboard/stats
DELETE /api/admin/users/:id

// Rutas Instructor (require ADMIN o INSTRUCTOR)
GET    /api/instructor/students
POST   /api/instructor/projects/:id/grade
GET    /api/instructor/courses/mine

// Rutas Student (require autenticación, cualquier rol)
GET    /api/courses
POST   /api/courses/:id/enroll
GET    /api/my-progress
```

**Modelos (Prisma):**
```prisma
enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Middlewares:**
```typescript
// authMiddleware.ts - Verifica JWT
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { userId, email, role }
    next()
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' })
  }
}

// roleMiddleware.ts - Verifica rol
export const requireRole = (...allowedRoles: Role[]) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' })

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para acceder a este recurso'
      })
    }

    next()
  }
}

// Uso:
router.get('/admin/users', authMiddleware, requireRole('ADMIN'), getUsersController)
router.post('/instructor/grade', authMiddleware, requireRole('ADMIN', 'INSTRUCTOR'), gradeController)
```

**Servicios:**
- `AuthorizationService.hasPermission(userId, resource, action)` - Verificar permisos
- `UserService.updateRole(userId, newRole)` - Cambiar rol (solo Admin)

### Frontend

**Componentes:**
- `ProtectedRoute.tsx` - Wrapper para rutas que requieren roles específicos
- `RoleGuard.tsx` - Componente para mostrar/ocultar contenido por rol
- `Navbar.tsx` - Navegación adaptativa según rol
- `Forbidden.tsx` - Página de error 403

**Páginas:**
- `/403` - Página de acceso denegado

**Hooks:**
```typescript
// useRole.ts
export function useRole() {
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN'
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isStudent = user?.role === 'STUDENT'

  const hasRole = (...roles: Role[]) => {
    return user && roles.includes(user.role)
  }

  return { isAdmin, isInstructor, isStudent, hasRole }
}
```

**Rutas Protegidas:**
```typescript
// routes.tsx
import { ProtectedRoute } from './components/ProtectedRoute'

<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminDashboard />
  </ProtectedRoute>
} />

<Route path="/instructor" element={
  <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
    <InstructorPanel />
  </ProtectedRoute>
} />
```

**Navbar Dinámico:**
```typescript
export function Navbar() {
  const { isAdmin, isInstructor, isStudent } = useRole()

  return (
    <nav>
      {isAdmin && <Link to="/dashboard">Dashboard</Link>}
      {(isAdmin || isInstructor) && <Link to="/instructor">Panel Instructor</Link>}
      {isStudent && <Link to="/courses">Mis Cursos</Link>}
      <Link to="/profile">Perfil</Link>
    </nav>
  )
}
```

### Base de Datos

**Migraciones:**
```sql
-- El campo role ya existe de HU-001, pero agregamos constraint
ALTER TABLE users
  ADD CONSTRAINT check_role
  CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT'));

-- Índice para búsquedas por rol
CREATE INDEX idx_users_role ON users(role);
```

**Seeders:**
```typescript
// seeds/users.ts - Crear usuarios de prueba
await prisma.user.createMany({
  data: [
    {
      email: 'admin@platform.com',
      password: await hashPassword('Admin123!'),
      name: 'Admin User',
      role: 'ADMIN'
    },
    {
      email: 'instructor@platform.com',
      password: await hashPassword('Instructor123!'),
      name: 'Instructor User',
      role: 'INSTRUCTOR'
    },
    {
      email: 'student@platform.com',
      password: await hashPassword('Student123!'),
      name: 'Student User',
      role: 'STUDENT'
    }
  ]
})
```

---

## Dependencias

**Depende de:**
- HU-002: Login con Credenciales (necesita JWT funcionando)

**Bloqueante para:**
- HU-004: Middleware de Autenticación JWT
- HU-006: Vista de Lista de Usuarios
- HU-007: Dashboard con Estadísticas
- Todas las historias de admin/instructor

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-003: Sistema de Roles (RBAC)', () => {
  it('AC1: Usuario nuevo debe tener rol STUDENT por defecto', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'newuser@test.com',
        password: 'hashed',
        name: 'New User'
      }
    })

    expect(user.role).toBe('STUDENT')
  })

  it('AC2: Middleware debe extraer rol del JWT', async () => {
    const token = generateAccessToken({
      userId: 'user-123',
      email: 'test@test.com',
      role: 'ADMIN'
    })

    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = {}
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(req.user.role).toBe('ADMIN')
    expect(next).toHaveBeenCalled()
  })

  it('AC3: requireRole debe permitir acceso a roles autorizados', () => {
    const req = { user: { role: 'ADMIN' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()

    const middleware = requireRole('ADMIN', 'INSTRUCTOR')
    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('AC3, AC6: requireRole debe bloquear roles no autorizados con 403', () => {
    const req = { user: { role: 'STUDENT' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()

    const middleware = requireRole('ADMIN')
    middleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    )
  })
})
```

### Tests de Integración

```typescript
describe('[RBAC] Integration Tests', () => {
  it('AC3: Admin debe acceder a rutas admin', async () => {
    const adminToken = await getAdminToken()

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.users).toBeDefined()
  })

  it('AC3: Student NO debe acceder a rutas admin', async () => {
    const studentToken = await getStudentToken()

    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403)
  })

  it('AC3: Instructor debe acceder a rutas instructor', async () => {
    const instructorToken = await getInstructorToken()

    const response = await request(app)
      .get('/api/instructor/students')
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200)

    expect(response.body.students).toBeDefined()
  })

  it('AC5: Matriz completa de permisos', async () => {
    const endpoints = [
      { path: '/api/admin/users', allowedRoles: ['ADMIN'] },
      { path: '/api/instructor/students', allowedRoles: ['ADMIN', 'INSTRUCTOR'] },
      { path: '/api/courses', allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
    ]

    const roles = ['ADMIN', 'INSTRUCTOR', 'STUDENT']

    for (const endpoint of endpoints) {
      for (const role of roles) {
        const token = await getTokenForRole(role)
        const expectedStatus = endpoint.allowedRoles.includes(role) ? 200 : 403

        await request(app)
          .get(endpoint.path)
          .set('Authorization', `Bearer ${token}`)
          .expect(expectedStatus)
      }
    }
  })
})
```

### Tests Frontend

```typescript
describe('Role-Based UI', () => {
  it('AC4, AC7: Navbar debe mostrar opciones según rol Admin', () => {
    mockAuthStore.setState({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
    })

    render(<Navbar />)

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/panel instructor/i)).toBeInTheDocument()
  })

  it('AC4, AC7: Navbar debe ocultar opciones admin para Student', () => {
    mockAuthStore.setState({
      user: { id: '1', email: 'student@test.com', role: 'STUDENT' }
    })

    render(<Navbar />)

    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument()
    expect(screen.getByText(/mis cursos/i)).toBeInTheDocument()
  })

  it('AC6: Debe mostrar página 403 al acceder ruta no autorizada', async () => {
    mockAuthStore.setState({
      user: { id: '1', email: 'student@test.com', role: 'STUDENT' }
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText(/acceso denegado/i)).toBeInTheDocument()
    expect(await screen.findByText(/403/i)).toBeInTheDocument()
  })
})
```

---

## Notas Adicionales

**Seguridad:**
- NUNCA confiar en el rol del cliente - siempre verificar en backend
- JWT debe incluir el rol y verificarse en cada request
- Logs de intentos de acceso no autorizado para auditoría
- Considerar implementar permisos granulares en el futuro (ej: `canEditCourse`, `canDeleteUser`)

**UX/UI:**
- Ocultar botones/enlaces que el usuario no puede usar (evitar frustración)
- Mensajes de error 403 deben ser informativos pero no revelar información sensible
- Opción de "Solicitar acceso" en página 403 para escalar permisos

**Performance:**
- Caché de verificación de roles en Redis (TTL corto, 5 min)
- Índice en campo role para queries de administración

**Escalabilidad Futura:**
- Considerar tabla separada de `Permissions` para RBAC más complejo
- Implementar sistema de permisos basado en recursos (ACL)
- Soporte para roles personalizados definidos por administrador

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md` - Sección 5.2 (Autorización)
- Backlog: `docs/backlog.md` - Sprint 1, HU-003
- OWASP Access Control Cheat Sheet
- NIST RBAC Model: https://csrc.nist.gov/projects/role-based-access-control
