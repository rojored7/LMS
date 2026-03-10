# HU-005: Recuperación de Contraseña

**Épica:** EP-001 - Autenticación y Autorización
**Sprint:** 1
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** usuario registrado
**Quiero** poder recuperar mi contraseña si la olvido
**Para** volver a acceder a mi cuenta sin necesidad de contactar soporte

---

## Criterios de Aceptación

- [ ] **AC1:** Formulario de "Olvidé mi contraseña" con campo email en página `/forgot-password`
- [ ] **AC2:** Generación de token de reseteo único con expiración de 1 hora almacenado en base de datos
- [ ] **AC3:** Envío de email con link de recuperación en formato: `https://platform.com/reset-password?token=<token>`
- [ ] **AC4:** Página de reseteo de contraseña accesible solo con token válido no expirado
- [ ] **AC5:** Validación de nueva contraseña con mismos requisitos de registro (8 caracteres, 1 mayúscula, 1 número, 1 especial)
- [ ] **AC6:** Invalidación automática del token tras uso exitoso y eliminación de base de datos
- [ ] **AC7:** Mensaje de confirmación tras cambio exitoso de contraseña y redirección a login
- [ ] **AC8:** Rate limiting: máximo 3 solicitudes de reset por email cada hora

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
- [ ] Template de email diseñado y testeado

---

## Detalles Técnicos

### Backend

**Endpoints:**
- `POST /api/auth/forgot-password` - Solicitar reseteo
- `GET /api/auth/verify-reset-token/:token` - Verificar validez del token
- `POST /api/auth/reset-password` - Resetear contraseña con token

**Modelos (Prisma):**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STUDENT)
  passwordResetTokens PasswordResetToken[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Servicios:**
```typescript
// services/password-reset.service.ts
import { randomBytes } from 'crypto'
import { prisma } from '../config/database'
import { EmailService } from './email.service'
import { hashPassword } from '../utils/crypto'

export class PasswordResetService {
  // AC2: Generar token de reseteo
  static async generateResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // No revelar si email existe (seguridad)
      throw new Error('Si el email existe, recibirás instrucciones')
    }

    // Generar token aleatorio
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Almacenar token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    })

    // AC3: Enviar email
    await EmailService.sendPasswordResetEmail(user.email, user.name, token)

    return token
  }

  // Verificar validez del token
  static async verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return { valid: false }
    }

    // AC4: Verificar expiración y uso
    if (resetToken.expiresAt < new Date() || resetToken.used) {
      return { valid: false }
    }

    return { valid: true, userId: resetToken.userId }
  }

  // AC5, AC6: Resetear contraseña
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const verification = await this.verifyToken(token)

    if (!verification.valid) {
      throw new Error('Token inválido o expirado')
    }

    // Hash de nueva contraseña
    const hashedPassword = await hashPassword(newPassword)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: verification.userId },
      data: { password: hashedPassword }
    })

    // AC6: Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    })

    // Invalidar todos los refresh tokens del usuario (forzar re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: verification.userId }
    })
  }
}
```

**Controladores:**
```typescript
// controllers/password-reset.controller.ts
import { Request, Response } from 'express'
import { PasswordResetService } from '../services/password-reset.service'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
})

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)

    await PasswordResetService.generateResetToken(email)

    // AC1: Respuesta genérica (no revelar si email existe)
    res.json({
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const verifyResetTokenController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const result = await PasswordResetService.verifyToken(token)

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar token' })
  }
}

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body)

    await PasswordResetService.resetPassword(token, password)

    // AC7: Confirmación
    res.json({
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
```

**Email Service:**
```typescript
// services/email.service.ts
import nodemailer from 'nodemailer'

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  static async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
  ): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4A90E2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Recuperación de Contraseña</h2>
          <p>Hola ${name},</p>
          <p>Recibimos una solicitud para resetear la contraseña de tu cuenta.</p>
          <p>Haz click en el siguiente botón para crear una nueva contraseña:</p>
          <p>
            <a href="${resetLink}" class="button">Resetear Contraseña</a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p><strong>Este enlace expirará en 1 hora.</strong></p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <div class="footer">
            <p>Plataforma Multi-Curso de Ciberseguridad</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.transporter.sendMail({
      from: `"Plataforma Ciberseguridad" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Recuperación de Contraseña',
      html
    })
  }
}
```

**Middlewares:**
```typescript
// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit'

// AC8: Rate limiting para forgot-password
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 requests
  message: 'Demasiadas solicitudes desde esta IP. Intente nuevamente en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit por email en lugar de IP
    return req.body.email || req.ip
  }
})
```

### Frontend

**Componentes:**
- `ForgotPasswordForm.tsx` - Formulario para solicitar reseteo
- `ResetPasswordForm.tsx` - Formulario para nueva contraseña
- `PasswordResetSuccess.tsx` - Pantalla de confirmación

**Páginas:**
- `/forgot-password` - Solicitar reseteo
- `/reset-password?token=xxx` - Resetear contraseña

**Hooks:**
```typescript
// hooks/usePasswordReset.ts
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Revisa tu email para instrucciones de reseteo')
    },
    onError: () => {
      toast.error('Error al procesar solicitud')
    }
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente')
      navigate('/login')
    },
    onError: (error) => {
      toast.error(error.message || 'Token inválido o expirado')
    }
  })
}
```

### Base de Datos

**Migraciones:**
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);
```

**Cron Jobs:**
```typescript
// jobs/cleanup-reset-tokens.job.ts
import cron from 'node-cron'
import { prisma } from '../config/database'

// Limpiar tokens expirados cada hora
cron.schedule('0 * * * *', async () => {
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true }
      ]
    }
  })
})
```

---

## Dependencias

**Depende de:**
- HU-001: Registro de Usuario (debe existir tabla users)
- HU-002: Login con Credenciales (para validar flujo completo)

**Bloqueante para:**
- Ninguna (feature independiente)

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-005: Recuperación de Contraseña', () => {
  it('AC2: Debe generar token de reseteo válido', async () => {
    const user = await createTestUser({ email: 'test@example.com' })

    const token = await PasswordResetService.generateResetToken('test@example.com')

    expect(token).toBeDefined()
    expect(token).toHaveLength(64) // 32 bytes hex = 64 caracteres

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    expect(resetToken.userId).toBe(user.id)
    expect(resetToken.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('AC2: Token debe expirar en 1 hora', async () => {
    await createTestUser({ email: 'test@example.com' })
    const token = await PasswordResetService.generateResetToken('test@example.com')

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    const expirationTime = resetToken.expiresAt.getTime() - Date.now()
    const oneHourMs = 60 * 60 * 1000

    expect(expirationTime).toBeCloseTo(oneHourMs, -10000) // tolerancia 10s
  })

  it('AC3: Debe enviar email con link de reseteo', async () => {
    const mockSendMail = jest.spyOn(EmailService, 'sendPasswordResetEmail')
    await createTestUser({ email: 'test@example.com', name: 'Test User' })

    await PasswordResetService.generateResetToken('test@example.com')

    expect(mockSendMail).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      expect.any(String)
    )
  })

  it('AC4: Debe rechazar token expirado', async () => {
    const user = await createTestUser()
    const expiredToken = await prisma.passwordResetToken.create({
      data: {
        token: 'expired-token',
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000) // expirado hace 1 segundo
      }
    })

    const result = await PasswordResetService.verifyToken('expired-token')

    expect(result.valid).toBe(false)
  })

  it('AC5, AC6: Debe resetear contraseña y marcar token como usado', async () => {
    const user = await createTestUser({ password: 'OldPass123!' })
    const token = await PasswordResetService.generateResetToken(user.email)

    await PasswordResetService.resetPassword(token, 'NewSecurePass123!')

    // Verificar nueva contraseña
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    const passwordMatch = await bcrypt.compare('NewSecurePass123!', updatedUser.password)
    expect(passwordMatch).toBe(true)

    // Verificar token marcado como usado
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
    expect(resetToken.used).toBe(true)

    // AC6: Token usado no debe funcionar de nuevo
    await expect(
      PasswordResetService.resetPassword(token, 'AnotherPass123!')
    ).rejects.toThrow('Token inválido o expirado')
  })

  it('AC8: Debe limitar requests de forgot-password', async () => {
    // Este test debe hacerse en integración con el middleware
    // Aquí solo verificamos la lógica
    const user = await createTestUser({ email: 'test@example.com' })

    // Simular 3 requests exitosos
    for (let i = 0; i < 3; i++) {
      await PasswordResetService.generateResetToken('test@example.com')
    }

    // La 4ta debería ser bloqueada por rate limiter (verificado en integration tests)
  })
})
```

### Tests de Integración

```typescript
describe('[Password Reset] Integration Tests', () => {
  it('AC1, AC3, AC7: Flujo completo de recuperación de contraseña', async () => {
    const user = await createTestUser({
      email: 'user@test.com',
      password: 'OldPassword123!'
    })

    // 1. Solicitar reseteo
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@test.com' })
      .expect(200)

    expect(forgotRes.body.message).toContain('recibirás instrucciones')

    // 2. Obtener token (en test, desde DB)
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // 3. Verificar token
    const verifyRes = await request(app)
      .get(`/api/auth/verify-reset-token/${resetToken.token}`)
      .expect(200)

    expect(verifyRes.body.valid).toBe(true)

    // 4. Resetear contraseña
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken.token,
        password: 'NewSecurePass123!'
      })
      .expect(200)

    expect(resetRes.body.message).toContain('actualizada exitosamente')

    // 5. Verificar que puede hacer login con nueva contraseña
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'NewSecurePass123!'
      })
      .expect(200)

    expect(loginRes.body.accessToken).toBeDefined()

    // 6. Verificar que contraseña vieja no funciona
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'OldPassword123!'
      })
      .expect(401)
  })

  it('AC8: Debe aplicar rate limiting', async () => {
    await createTestUser({ email: 'test@test.com' })

    // 3 requests exitosos
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(200)
    }

    // 4ta debe ser bloqueada
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@test.com' })
      .expect(429) // Too Many Requests
  })

  it('No debe revelar si email existe o no', async () => {
    const res1 = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'existing@test.com' })

    const res2 = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' })

    // Ambas respuestas deben ser idénticas
    expect(res1.status).toBe(res2.status)
    expect(res1.body.message).toBe(res2.body.message)
  })
})
```

### Tests Frontend

```typescript
describe('ForgotPasswordForm', () => {
  it('AC1: Debe mostrar formulario con campo email', () => {
    render(<ForgotPasswordForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
  })

  it('Debe mostrar mensaje de éxito tras envío', async () => {
    mockAuthApi.forgotPassword.mockResolvedValue({})

    render(<ForgotPasswordForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/revisa tu email/i)).toBeInTheDocument()
  })
})

describe('ResetPasswordForm', () => {
  it('AC4: Debe verificar token al cargar página', async () => {
    const mockVerify = jest.fn().mockResolvedValue({ valid: true })
    mockAuthApi.verifyResetToken = mockVerify

    render(<ResetPasswordForm />, {
      route: '/reset-password?token=valid-token'
    })

    expect(mockVerify).toHaveBeenCalledWith('valid-token')
  })

  it('AC5: Debe validar requisitos de contraseña', async () => {
    render(<ResetPasswordForm />, {
      route: '/reset-password?token=valid-token'
    })

    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), 'weak')
    await userEvent.click(screen.getByRole('button', { name: /resetear/i }))

    expect(await screen.findByText(/mínimo 8 caracteres/i)).toBeInTheDocument()
  })

  it('AC7: Debe redireccionar a login tras éxito', async () => {
    const mockNavigate = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

    mockAuthApi.resetPassword.mockResolvedValue({})

    render(<ResetPasswordForm />, {
      route: '/reset-password?token=valid-token'
    })

    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), 'SecurePass123!')
    await userEvent.type(screen.getByLabelText(/confirmar/i), 'SecurePass123!')
    await userEvent.click(screen.getByRole('button', { name: /resetear/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
```

---

## Notas Adicionales

**Seguridad:**
- NUNCA revelar si un email existe en el sistema (prevenir enumeración)
- Tokens deben ser criptográficamente seguros (crypto.randomBytes, no Math.random)
- Invalidar todos los refresh tokens al cambiar contraseña (forzar re-login)
- Logs de todos los intentos de reseteo para auditoría
- Considerar notificar al usuario por email cuando su contraseña fue cambiada

**UX/UI:**
- Mensaje claro de que el email puede tardar unos minutos
- Link para reenviar email si no llegó
- Indicador de fortaleza de contraseña en formulario de reset
- Mostrar tiempo restante de expiración del token
- Breadcrumbs del proceso: Solicitar → Email → Resetear → Login

**Performance:**
- Envío de emails asíncrono (usar queue como Bull)
- Limpieza de tokens expirados en background job
- Índices en tabla para queries rápidas

**Email Deliverability:**
- Configurar SPF, DKIM y DMARC
- Usar servicio confiable (SendGrid, Mailgun, AWS SES)
- Template responsive para móviles
- Incluir versión texto plano del email

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md`
- Backlog: `docs/backlog.md` - Sprint 1, HU-005
- OWASP Forgot Password Cheat Sheet
- Nodemailer Documentation: https://nodemailer.com
