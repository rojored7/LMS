# HU-006: Vista de Lista de Usuarios (Tabla Completa)

**Épica:** EP-002 - Dashboard Administrativo
**Sprint:** 2
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** ver una tabla completa de todos los usuarios registrados
**Para** gestionar la plataforma eficientemente y realizar acciones administrativas

---

## Criterios de Aceptación

- [ ] **AC1:** Tabla con columnas: ID, Nombre, Email, Rol, Perfil Asignado, Fecha de Registro, Estado (Activo/Inactivo)
- [ ] **AC2:** Paginación funcional que muestre 20 usuarios por página con controles de navegación (anterior, siguiente, ir a página)
- [ ] **AC3:** Filtros por: rol (Admin/Instructor/Student), perfil asignado, estado (activo/inactivo) con aplicación en tiempo real
- [ ] **AC4:** Búsqueda fuzzy por nombre o email con debounce de 300ms y highlighting de resultados
- [ ] **AC5:** Ordenamiento ASC/DESC por cualquier columna (nombre, email, fecha) con indicador visual
- [ ] **AC6:** Acciones rápidas en cada fila: Ver Detalles, Editar, Desactivar/Activar con confirmación modal
- [ ] **AC7:** Indicador visual de estado con badge colorido (verde=activo, rojo=inactivo, gris=suspendido)
- [ ] **AC8:** Endpoint GET /api/admin/users con query params: page, limit, search, role, profile, status, sortBy, sortOrder

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

**Endpoints:**
```typescript
GET /api/admin/users
  Query params:
    - page: number (default: 1)
    - limit: number (default: 20, max: 100)
    - search: string (busca en name y email)
    - role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
    - profile: string (profileId)
    - status: 'active' | 'inactive'
    - sortBy: 'name' | 'email' | 'createdAt' | 'role'
    - sortOrder: 'asc' | 'desc'

  Response:
  {
    users: User[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }

GET /api/admin/users/:id
PATCH /api/admin/users/:id/status
  Body: { status: 'active' | 'inactive' }
```

**Modelos (Prisma):**
```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String
  role      Role      @default(STUDENT)
  profileId String?
  profile   Profile?  @relation(fields: [profileId], references: [id])
  status    UserStatus @default(ACTIVE)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Profile {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  users       User[]
  courses     Course[]
  createdAt   DateTime @default(now())
}
```

**Servicios:**
```typescript
// services/user-management.service.ts
export class UserManagementService {
  static async getUsers(filters: UserFilters): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      profile,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters

    const skip = (page - 1) * limit

    // Construir where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) where.role = role
    if (status) where.status = status
    if (profile) where.profileId = profile

    // Query con paginación
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          profile: { select: { id: true, name: true } }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          profileId: true,
          profile: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async updateUserStatus(
    userId: string,
    status: UserStatus
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { status }
    })
  }
}
```

**Controladores:**
```typescript
// controllers/user-management.controller.ts
import { Request, Response } from 'express'
import { z } from 'zod'

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
  profile: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const getUsersController = async (req: Request, res: Response) => {
  try {
    const filters = getUsersSchema.parse(req.query)
    const result = await UserManagementService.getUsers(filters)

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

export const updateUserStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const user = await UserManagementService.updateUserStatus(id, status)

    res.json({ user, message: 'Estado actualizado exitosamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
}
```

### Frontend

**Componentes:**
```typescript
// components/UserTable.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'

export function UserTable() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => adminApi.getUsers(filters)
  })

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Student</option>
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </Select>
      </div>

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('name')}>
              Nombre {getSortIcon('name')}
            </TableHead>
            <TableHead onClick={() => handleSort('email')}>
              Email {getSortIcon('email')}
            </TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead onClick={() => handleSort('createdAt')}>
              Fecha Registro {getSortIcon('createdAt')}
            </TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell><RoleBadge role={user.role} /></TableCell>
              <TableCell>{user.profile?.name || '-'}</TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell><StatusBadge status={user.status} /></TableCell>
              <TableCell>
                <UserActions user={user} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginación */}
      <Pagination
        currentPage={filters.page}
        totalPages={data?.pagination.totalPages}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  )
}
```

**Páginas:**
- `/admin/users` - Página de gestión de usuarios

**Hooks:**
```typescript
// hooks/useUsers.ts
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => adminApi.getUsers(filters),
    keepPreviousData: true
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Estado actualizado')
    }
  })
}
```

### Base de Datos

**Migraciones:**
```sql
-- Agregar campo status a users
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE users ADD CONSTRAINT check_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));

-- Índices para performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_profile ON users(profile_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_name_search ON users USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_users_email_search ON users USING gin(to_tsvector('spanish', email));
```

---

## Dependencias

**Depende de:**
- HU-003: Sistema de Roles (necesita roles funcionando)
- HU-004: Middleware de Autenticación (proteger rutas admin)

**Bloqueante para:**
- HU-007: Dashboard con Estadísticas
- HU-008: Ver Progreso de Usuario
- HU-010: Asignar Perfil de Usuario

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-006: Lista de Usuarios', () => {
  it('AC2: Debe paginar correctamente los resultados', async () => {
    // Crear 50 usuarios de prueba
    await createManyTestUsers(50)

    const page1 = await UserManagementService.getUsers({ page: 1, limit: 20 })
    const page2 = await UserManagementService.getUsers({ page: 2, limit: 20 })

    expect(page1.users).toHaveLength(20)
    expect(page2.users).toHaveLength(20)
    expect(page1.pagination.total).toBe(50)
    expect(page1.pagination.totalPages).toBe(3)
    expect(page1.users[0].id).not.toBe(page2.users[0].id)
  })

  it('AC3: Debe filtrar por rol correctamente', async () => {
    await createTestUser({ role: 'ADMIN' })
    await createTestUser({ role: 'STUDENT' })
    await createTestUser({ role: 'INSTRUCTOR' })

    const admins = await UserManagementService.getUsers({ role: 'ADMIN' })
    const students = await UserManagementService.getUsers({ role: 'STUDENT' })

    expect(admins.users.every(u => u.role === 'ADMIN')).toBe(true)
    expect(students.users.every(u => u.role === 'STUDENT')).toBe(true)
  })

  it('AC4: Debe buscar por nombre o email (fuzzy)', async () => {
    await createTestUser({ name: 'Juan Pérez', email: 'juan@test.com' })
    await createTestUser({ name: 'María González', email: 'maria@test.com' })

    const resultsByName = await UserManagementService.getUsers({ search: 'juan' })
    const resultsByEmail = await UserManagementService.getUsers({ search: 'maria@' })

    expect(resultsByName.users).toHaveLength(1)
    expect(resultsByName.users[0].name).toContain('Juan')
    expect(resultsByEmail.users).toHaveLength(1)
    expect(resultsByEmail.users[0].email).toContain('maria')
  })

  it('AC5: Debe ordenar por diferentes columnas', async () => {
    await createTestUser({ name: 'Zoe', email: 'z@test.com' })
    await createTestUser({ name: 'Ana', email: 'a@test.com' })

    const ascByName = await UserManagementService.getUsers({
      sortBy: 'name',
      sortOrder: 'asc'
    })
    const descByName = await UserManagementService.getUsers({
      sortBy: 'name',
      sortOrder: 'desc'
    })

    expect(ascByName.users[0].name).toBe('Ana')
    expect(descByName.users[0].name).toBe('Zoe')
  })

  it('AC6: Debe cambiar estado de usuario', async () => {
    const user = await createTestUser({ status: 'ACTIVE' })

    const updated = await UserManagementService.updateUserStatus(user.id, 'INACTIVE')

    expect(updated.status).toBe('INACTIVE')
  })
})
```

### Tests de Integración

```typescript
describe('[Admin Users] Integration Tests', () => {
  it('AC8: Debe retornar usuarios con todos los query params', async () => {
    const adminToken = await getAdminToken()
    await createManyTestUsers(30, { role: 'STUDENT' })

    const response = await request(app)
      .get('/api/admin/users')
      .query({
        page: 2,
        limit: 10,
        role: 'STUDENT',
        sortBy: 'name',
        sortOrder: 'asc'
      })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.users).toHaveLength(10)
    expect(response.body.pagination.page).toBe(2)
    expect(response.body.users.every(u => u.role === 'STUDENT')).toBe(true)
  })

  it('Solo ADMIN debe poder acceder a lista de usuarios', async () => {
    const studentToken = await getStudentToken()

    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403)
  })

  it('AC6: Debe actualizar estado de usuario', async () => {
    const adminToken = await getAdminToken()
    const user = await createTestUser()

    await request(app)
      .patch(`/api/admin/users/${user.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INACTIVE' })
      .expect(200)

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updated.status).toBe('INACTIVE')
  })
})
```

### Tests Frontend

```typescript
describe('UserTable Component', () => {
  it('AC1: Debe mostrar todas las columnas requeridas', () => {
    render(<UserTable />)

    expect(screen.getByText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByText(/email/i)).toBeInTheDocument()
    expect(screen.getByText(/rol/i)).toBeInTheDocument()
    expect(screen.getByText(/perfil/i)).toBeInTheDocument()
    expect(screen.getByText(/fecha/i)).toBeInTheDocument()
    expect(screen.getByText(/estado/i)).toBeInTheDocument()
    expect(screen.getByText(/acciones/i)).toBeInTheDocument()
  })

  it('AC3: Debe aplicar filtros en tiempo real', async () => {
    const mockGetUsers = jest.fn()
    mockAdminApi.getUsers = mockGetUsers

    render(<UserTable />)

    const roleSelect = screen.getByRole('combobox', { name: /rol/i })
    await userEvent.selectOptions(roleSelect, 'ADMIN')

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN' })
      )
    })
  })

  it('AC4: Búsqueda debe tener debounce de 300ms', async () => {
    jest.useFakeTimers()
    const mockGetUsers = jest.fn()
    mockAdminApi.getUsers = mockGetUsers

    render(<UserTable />)

    const searchInput = screen.getByPlaceholderText(/buscar/i)

    await userEvent.type(searchInput, 'test')

    // No debe llamar inmediatamente
    expect(mockGetUsers).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'test' })
    )

    // Avanzar 300ms
    jest.advanceTimersByTime(300)

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      )
    })

    jest.useRealTimers()
  })

  it('AC5: Debe cambiar orden al hacer click en header', async () => {
    const mockGetUsers = jest.fn()
    mockAdminApi.getUsers = mockGetUsers

    render(<UserTable />)

    const nameHeader = screen.getByText(/nombre/i)
    await userEvent.click(nameHeader)

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'name',
        sortOrder: 'asc'
      })
    )

    await userEvent.click(nameHeader)

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'name',
        sortOrder: 'desc'
      })
    )
  })
})
```

---

## Notas Adicionales

**Performance:**
- Índices en columnas frecuentemente filtradas/ordenadas
- Caché de resultados en Redis (TTL 1 minuto)
- Lazy loading de datos de perfil (solo cuando se expande)
- Virtual scrolling para tablas muy grandes (futuro)

**UX/UI:**
- Loading skeletons mientras cargan datos
- Empty state amigable si no hay usuarios
- Highlight de búsqueda en resultados
- Tooltips informativos en headers
- Confirmación modal antes de desactivar usuario
- Exportar tabla a CSV/Excel (futuro)

**Seguridad:**
- No exponer password hash en response
- Rate limiting en endpoint (prevenir scraping)
- Logs de acciones administrativas (auditoría)
- Prevenir que admin se desactive a sí mismo

**Accesibilidad:**
- Tabla semántica con headers apropiados
- Navegación por teclado funcional
- Screen reader friendly
- Aria labels en acciones

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md` - Sección 4 (Modelo de Datos)
- Backlog: `docs/backlog.md` - Sprint 2, HU-006
- Shadcn/ui Table Component: https://ui.shadcn.com/docs/components/table
