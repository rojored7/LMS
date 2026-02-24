# HU-002: Login con Credenciales

**Épica:** EP-001 - Autenticación y Autorización
**Sprint:** 1
**Story Points:** 3
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** usuario registrado
**Quiero** iniciar sesión con mi email y contraseña
**Para** acceder a mi perfil y cursos

---

## Criterios de Aceptación

- [ ] **AC1:** Formulario de login con campos email y password
- [ ] **AC2:** Validación de credenciales contra base de datos con comparación segura de hash bcrypt
- [ ] **AC3:** Generación de JWT token con expiración de 24 horas que incluya: userId, email, role
- [ ] **AC4:** Almacenamiento seguro de token en localStorage con clave específica (ej: 'auth_token')
- [ ] **AC5:** Redirección automática según rol del usuario: Admin → `/dashboard`, Instructor → `/instructor`, Student → `/courses`
- [ ] **AC6:** Mensaje de error claro y genérico si credenciales son inválidas ("Email o contraseña incorrectos")
- [ ] **AC7:** Implementación de throttling: máximo 5 intentos fallidos cada 15 minutos por IP
- [ ] **AC8:** Generación simultánea de refresh token con expiración de 7 días

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
- `POST /api/auth/login` - Autenticación de usuario
- `POST /api/auth/refresh` - Renovar access token usando refresh token

**Modelos (Prisma):**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Servicios:**
- `AuthService.login(email, password)` - Lógica de autenticación
- `generateAccessToken(userId, email, role)` - Generar JWT
- `generateRefreshToken(userId)` - Generar refresh token
- `verifyPassword(password, hash)` - Comparar con bcrypt

**Middlewares:**
- `rateLimitMiddleware` - Limitar intentos de login

**JWT Payload:**
```typescript
interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
  iat: number  // issued at
  exp: number  // expiration
}
```

### Frontend

**Componentes:**
- `LoginForm.tsx` - Formulario de login
- `ProtectedRoute.tsx` - HOC para rutas protegidas

**Páginas:**
- `/login` - Página de inicio de sesión

**Estado (Zustand):**
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}
```

**Hooks:**
- `useLogin()` - Hook para login con React Query
- `useAuth()` - Hook para acceder al estado de autenticación

### Base de Datos

**Migraciones:**
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## Dependencias

**Depende de:**
- HU-001: Registro de Usuario (debe existir al menos un usuario para hacer login)

**Bloqueante para:**
- HU-003: Sistema de Roles (RBAC)
- HU-004: Middleware de Autenticación JWT
- Todas las historias posteriores que requieran autenticación

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-002: Login con Credenciales', () => {
  it('AC2: Debe autenticar usuario con credenciales válidas', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'SecurePass123!'
    })

    const result = await authService.login('test@example.com', 'SecurePass123!')

    expect(result.user.email).toBe('test@example.com')
    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
  })

  it('AC6: Debe rechazar credenciales incorrectas con mensaje genérico', async () => {
    await expect(authService.login('test@example.com', 'WrongPassword'))
      .rejects.toThrow('Email o contraseña incorrectos')
  })

  it('AC3: JWT debe contener datos correctos y expirar en 24h', () => {
    const token = generateAccessToken({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'STUDENT'
    })

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload

    expect(decoded.userId).toBe('user-123')
    expect(decoded.email).toBe('test@example.com')
    expect(decoded.role).toBe('STUDENT')
    expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60) // 24 horas
  })

  it('AC8: Refresh token debe expirar en 7 días', async () => {
    const refreshToken = await authService.generateRefreshToken('user-123')

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    })

    const expirationTime = tokenRecord.expiresAt.getTime() - Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

    expect(expirationTime).toBeCloseTo(sevenDaysMs, -100000) // tolerancia 100s
  })

  it('AC7: Debe bloquear intentos después del límite', async () => {
    const ip = '192.168.1.1'

    // Simular 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login('test@example.com', 'wrong', ip)
      } catch (e) {}
    }

    // Intento 6 debe ser bloqueado
    await expect(authService.login('test@example.com', 'wrong', ip))
      .rejects.toThrow('Demasiados intentos. Intente nuevamente en 15 minutos')
  })
})
```

### Tests de Integración

```typescript
describe('[Login] Integration Tests', () => {
  it('AC5: Debe completar flujo de login y retornar tokens', async () => {
    const user = await createTestUser({
      email: 'student@test.com',
      password: 'SecurePass123!',
      role: 'STUDENT'
    })

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'SecurePass123!'
      })
      .expect(200)

    expect(response.body.accessToken).toBeDefined()
    expect(response.body.refreshToken).toBeDefined()
    expect(response.body.user.role).toBe('STUDENT')
  })

  it('Debe renovar access token con refresh token válido', async () => {
    const { refreshToken } = await loginTestUser()

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200)

    expect(response.body.accessToken).toBeDefined()
    expect(response.body.accessToken).not.toBe(refreshToken)
  })
})
```

### Tests Frontend

```typescript
describe('LoginForm Component', () => {
  it('AC1: Debe mostrar formulario con campos email y password', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('AC4, AC5: Debe almacenar token y redireccionar según rol', async () => {
    const mockNavigate = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

    mockAuthService.login.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'fake-token'
    })

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'SecurePass123!')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('fake-token')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('AC6: Debe mostrar error con credenciales inválidas', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Email o contraseña incorrectos'))

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText(/email o contraseña incorrectos/i)).toBeInTheDocument()
  })
})
```

---

## Notas Adicionales

**Seguridad:**
- Nunca revelar en mensajes de error si el email existe o no (prevenir enumeración de usuarios)
- Usar constante de tiempo para comparaciones de contraseñas (bcrypt.compare ya lo hace)
- Implementar CSRF tokens en producción
- Considerar 2FA para roles Admin/Instructor (futuro)
- JWT_SECRET debe ser variable de entorno segura (mínimo 256 bits)

**UX/UI:**
- Botón "Olvidé mi contraseña" visible
- Link a página de registro
- Loading state durante autenticación
- Persistir sesión entre reloads de página (verificar token en localStorage al montar app)

**Performance:**
- Cache de rate limiting en Redis (no en memoria para escalabilidad)
- Índices en tabla users para búsqueda por email

**Manejo de Refresh Tokens:**
- Limpiar tokens expirados periódicamente (cron job)
- Invalidar todos los refresh tokens al cambiar contraseña
- Endpoint de logout debe invalidar refresh token

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md` - Sección 5 (Seguridad)
- Backlog: `docs/backlog.md` - Sprint 1, HU-002
- RFC 7519 (JWT): https://tools.ietf.org/html/rfc7519
- OWASP Authentication Cheat Sheet
