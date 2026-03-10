# HU-001: Registro de Usuario con Email/Password

**Épica:** EP-001 - Autenticación y Autorización
**Sprint:** 1
**Story Points:** 3
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** usuario nuevo
**Quiero** registrarme en la plataforma con mi email y contraseña
**Para** poder acceder a los cursos disponibles

---

## Criterios de Aceptación

- [ ] **AC1:** Formulario de registro con campos obligatorios: nombre completo, email, password y confirmación de password
- [ ] **AC2:** Validación de email único en base de datos - mostrar error si el email ya existe
- [ ] **AC3:** Contraseña debe cumplir requisitos mínimos: 8 caracteres, al menos 1 mayúscula, 1 número y 1 carácter especial
- [ ] **AC4:** Hash de contraseña con bcrypt usando salt rounds de 10 antes de almacenar en DB
- [ ] **AC5:** Validación de campos tanto en frontend (inmediata) como en backend (seguridad)
- [ ] **AC6:** Mensaje de confirmación visible tras registro exitoso
- [ ] **AC7:** Redirección automática a página de login tras registro exitoso
- [ ] **AC8:** Campo de confirmación de password debe coincidir exactamente con el password

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
- `POST /api/auth/register` - Registro de nuevo usuario

**Modelos (Prisma):**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}
```

**Servicios:**
- `AuthService.register(data)` - Lógica de registro
- `hashPassword(password)` - Utilidad bcrypt

**Middlewares:**
- Validación de schema con Zod

**Schema de Validación (Zod):**
```typescript
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})
```

### Frontend

**Componentes:**
- `RegisterForm.tsx` - Formulario de registro
- `PasswordStrengthMeter.tsx` - Indicador de fortaleza de contraseña

**Páginas:**
- `/register` - Página de registro

**Estado (Zustand):**
- `useAuthStore` - Estado de autenticación

**Hooks:**
- `useRegister()` - Hook personalizado para registro con React Query

**Validación:**
- React Hook Form + Zod resolver

### Base de Datos

**Migraciones:**
```sql
-- Crear tabla users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'STUDENT',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

**Seeders:**
No requeridos para esta historia

---

## Dependencias

**Depende de:**
- Ninguna (historia inicial del Sprint 1)

**Bloqueante para:**
- HU-002: Login con Credenciales
- HU-003: Sistema de Roles (RBAC)

---

## Tests a Implementar

### Tests Unitarios

```typescript
// backend/tests/unit/auth.service.test.ts
describe('HU-001: Registro de Usuario', () => {
  it('AC1: Debe registrar usuario con datos válidos', async () => {
    const userData = {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!'
    }

    const result = await authService.register(userData)

    expect(result.email).toBe(userData.email)
    expect(result.password).not.toBe(userData.password) // debe estar hasheado
  })

  it('AC2: Debe rechazar email duplicado', async () => {
    const userData = { name: 'Test', email: 'existing@test.com', password: 'Pass123!' }

    await authService.register(userData)

    await expect(authService.register(userData))
      .rejects.toThrow('Email ya registrado')
  })

  it('AC3: Debe validar requisitos de contraseña', async () => {
    const weakPasswords = [
      'short',           // muy corta
      'nouppercase1!',   // sin mayúscula
      'NoNumbers!',      // sin números
      'NoSpecial123'     // sin caracteres especiales
    ]

    for (const password of weakPasswords) {
      await expect(authService.register({
        name: 'Test',
        email: 'test@example.com',
        password
      })).rejects.toThrow()
    }
  })

  it('AC4: Debe hashear contraseña con bcrypt', async () => {
    const password = 'SecurePass123!'
    const user = await authService.register({
      name: 'Test',
      email: 'test@example.com',
      password
    })

    const isValidHash = await bcrypt.compare(password, user.password)
    expect(isValidHash).toBe(true)
    expect(user.password).not.toBe(password)
  })
})
```

### Tests de Integración

```typescript
// backend/tests/integration/register.test.ts
describe('[Registro] Integration Tests', () => {
  it('AC7: Debe completar flujo completo de registro', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      })
      .expect(201)

    expect(response.body).toHaveProperty('user')
    expect(response.body.user.email).toBe('newuser@test.com')
    expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente')
  })

  it('AC5: Debe validar en backend aunque frontend no lo haga', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: '',
        email: 'invalid-email',
        password: 'weak'
      })
      .expect(400)

    expect(response.body.errors).toBeDefined()
  })
})
```

### Tests Frontend (React Testing Library)

```typescript
// frontend/tests/RegisterForm.test.tsx
describe('RegisterForm Component', () => {
  it('AC1: Debe mostrar todos los campos requeridos', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument()
  })

  it('AC8: Debe validar que las contraseñas coincidan', async () => {
    render(<RegisterForm />)

    await userEvent.type(screen.getByLabelText(/^contraseña/i), 'Pass123!')
    await userEvent.type(screen.getByLabelText(/confirmar/i), 'Different123!')
    await userEvent.click(screen.getByRole('button', { name: /registrarse/i }))

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
  })

  it('AC6, AC7: Debe mostrar mensaje y redireccionar tras éxito', async () => {
    const mockNavigate = jest.fn()
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }))

    render(<RegisterForm />)

    // Simular registro exitoso
    // Verificar mensaje de éxito y redirección
  })
})
```

---

## Notas Adicionales

**Seguridad:**
- Nunca almacenar contraseñas en texto plano
- Usar bcrypt con salt rounds mínimo de 10 (configurar como variable de entorno)
- Implementar rate limiting en endpoint de registro (máximo 5 intentos por IP cada 15 minutos)
- Sanitizar inputs para prevenir XSS

**UX/UI:**
- Mostrar indicador de fortaleza de contraseña en tiempo real
- Mostrar/ocultar contraseña con icono de ojo
- Feedback inmediato de validación en cada campo
- Deshabilitar botón de submit mientras hay errores de validación
- Loading state en botón durante el envío

**Performance:**
- Debounce en validación de email único (300ms)
- Lazy loading del componente de registro

**Accesibilidad:**
- Labels asociados correctamente con inputs
- Mensajes de error en aria-live regions
- Navegación por teclado funcional
- Contraste de colores WCAG AA

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md` - Sección 3.2 (Backend Stack)
- Backlog: `docs/backlog.md` - Sprint 1, HU-001
- Prisma Schema: `backend/prisma/schema.prisma`
- API Documentation: `docs/api/auth.md`
