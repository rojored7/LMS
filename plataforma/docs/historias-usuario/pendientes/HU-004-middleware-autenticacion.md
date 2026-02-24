# HU-004: Middleware de Autenticación JWT

**Épica:** EP-001 - Autenticación y Autorización
**Sprint:** 1
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** desarrollador
**Quiero** implementar un middleware que valide tokens JWT en todas las rutas protegidas
**Para** asegurar que solo usuarios autenticados accedan a recursos

---

## Criterios de Aceptación

- [ ] **AC1:** Middleware `authMiddleware` que extrae JWT del header Authorization (formato: `Bearer <token>`)
- [ ] **AC2:** Validación de firma del token usando JWT_SECRET y verificación de expiración
- [ ] **AC3:** Extracción exitosa de datos del usuario (id, email, role) y población en `req.user` para uso posterior
- [ ] **AC4:** Respuesta 401 (Unauthorized) con mensaje claro si token es inválido, expirado o faltante
- [ ] **AC5:** Implementación de refresh token mechanism con endpoint `/auth/refresh` y expiración de 7 días
- [ ] **AC6:** Endpoint `/auth/logout` que invalida refresh token agregándolo a blacklist en Redis
- [ ] **AC7:** Sistema de blacklist de tokens revocados almacenado en Redis con TTL automático

---

## Definición de Hecho (DoD)

- [ ] Código implementado (backend middleware)
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
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/logout` - Cerrar sesión e invalidar tokens

**Middlewares:**
```typescript
// middleware/auth.middleware.ts
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { redisClient } from '../config/redis'

interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // AC1: Extraer token del header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticación requerido'
      })
    }

    const token = authHeader.split(' ')[1]

    // AC7: Verificar si token está en blacklist
    const isBlacklisted = await redisClient.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token ha sido revocado'
      })
    }

    // AC2: Verificar y decodificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload

    // AC3: Poblar req.user
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }

    next()
  } catch (error) {
    // AC4: Manejo de errores
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      })
    }

    return res.status(500).json({
      error: 'Error de autenticación'
    })
  }
}
```

**Servicios:**
```typescript
// services/token.service.ts
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { prisma } from '../config/database'
import { redisClient } from '../config/redis'

export class TokenService {
  // Generar access token (24h)
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h'
    })
  }

  // AC5: Generar refresh token (7 días)
  static async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(40).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    })

    return token
  }

  // AC5: Renovar access token con refresh token
  static async refreshAccessToken(refreshToken: string): Promise<string> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    })

    if (!tokenRecord) {
      throw new Error('Refresh token inválido')
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Refresh token expirado')
    }

    return this.generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role
    })
  }

  // AC6: Revocar token (blacklist)
  static async revokeToken(token: string, expiresIn: number = 24 * 60 * 60): Promise<void> {
    // Almacenar en Redis con TTL igual al tiempo restante del token
    await redisClient.setex(`blacklist:${token}`, expiresIn, '1')
  }

  // AC6: Logout - revocar todos los tokens del usuario
  static async logout(userId: string, accessToken: string): Promise<void> {
    // Blacklist del access token
    await this.revokeToken(accessToken)

    // Eliminar todos los refresh tokens del usuario
    await prisma.refreshToken.deleteMany({
      where: { userId }
    })
  }
}
```

**Controladores:**
```typescript
// controllers/auth.controller.ts
export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' })
    }

    const accessToken = await TokenService.refreshAccessToken(refreshToken)

    res.json({ accessToken })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
}

export const logoutController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]!
    const { userId } = req.user!

    await TokenService.logout(userId, token)

    res.json({ message: 'Sesión cerrada exitosamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' })
  }
}
```

### Frontend

**Servicios:**
```typescript
// services/auth.service.ts
export class AuthService {
  private static refreshTokenPromise: Promise<string> | null = null

  // Interceptor para renovar token automáticamente
  static setupAxiosInterceptors() {
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config

        // Si error es 401 y código TOKEN_EXPIRED, renovar token
        if (
          error.response?.status === 401 &&
          error.response?.data?.code === 'TOKEN_EXPIRED' &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true

          try {
            // Evitar múltiples llamadas simultáneas a /refresh
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshToken()
            }

            const newToken = await this.refreshTokenPromise
            this.refreshTokenPromise = null

            // Actualizar token en localStorage
            localStorage.setItem('auth_token', newToken)

            // Reintentar request original con nuevo token
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return axios(originalRequest)
          } catch (refreshError) {
            // Si refresh falla, redirigir a login
            this.logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  static async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) throw new Error('No refresh token')

    const response = await axios.post('/api/auth/refresh', { refreshToken })
    return response.data.accessToken
  }

  static async logout(): Promise<void> {
    await axios.post('/api/auth/logout')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }
}

// Inicializar interceptors al cargar app
AuthService.setupAxiosInterceptors()
```

### Base de Datos

**Redis Configuration:**
```typescript
// config/redis.ts
import Redis from 'ioredis'

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0
})

redisClient.on('error', (err) => {
  console.error('Redis error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis connected')
})
```

---

## Dependencias

**Depende de:**
- HU-002: Login con Credenciales (necesita generación de JWT)
- HU-003: Sistema de Roles (middleware usa información de rol)

**Bloqueante para:**
- Todas las rutas protegidas de la aplicación
- HU-006 en adelante (requieren autenticación)

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-004: Middleware de Autenticación JWT', () => {
  it('AC1: Debe extraer token del header Authorization', async () => {
    const token = TokenService.generateAccessToken({
      userId: 'user-123',
      email: 'test@test.com',
      role: 'STUDENT'
    })

    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as any
    const res = {} as any
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(req.user).toBeDefined()
    expect(next).toHaveBeenCalled()
  })

  it('AC4: Debe retornar 401 si no hay token', async () => {
    const req = { headers: {} } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('AC2, AC4: Debe retornar 401 si token está expirado', async () => {
    const expiredToken = jwt.sign(
      { userId: 'user-123', email: 'test@test.com', role: 'STUDENT' },
      process.env.JWT_SECRET!,
      { expiresIn: '-1h' } // token expirado hace 1 hora
    )

    const req = {
      headers: { authorization: `Bearer ${expiredToken}` }
    } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TOKEN_EXPIRED' })
    )
  })

  it('AC3: Debe poblar req.user con datos correctos', async () => {
    const payload = {
      userId: 'user-123',
      email: 'test@test.com',
      role: 'ADMIN' as const
    }
    const token = TokenService.generateAccessToken(payload)

    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as any
    const res = {} as any
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(req.user.userId).toBe(payload.userId)
    expect(req.user.email).toBe(payload.email)
    expect(req.user.role).toBe(payload.role)
  })

  it('AC5: Debe renovar access token con refresh token válido', async () => {
    const user = await createTestUser()
    const refreshToken = await TokenService.generateRefreshToken(user.id)

    const newAccessToken = await TokenService.refreshAccessToken(refreshToken)

    const decoded = jwt.verify(newAccessToken, process.env.JWT_SECRET!) as any
    expect(decoded.userId).toBe(user.id)
  })

  it('AC7: Debe rechazar token en blacklist', async () => {
    const token = TokenService.generateAccessToken({
      userId: 'user-123',
      email: 'test@test.com',
      role: 'STUDENT'
    })

    // Agregar a blacklist
    await TokenService.revokeToken(token)

    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token ha sido revocado' })
    )
  })

  it('AC6: Logout debe invalidar todos los tokens del usuario', async () => {
    const user = await createTestUser()
    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    const refreshToken = await TokenService.generateRefreshToken(user.id)

    await TokenService.logout(user.id, accessToken)

    // Access token debe estar en blacklist
    const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`)
    expect(isBlacklisted).toBe('1')

    // Refresh tokens deben estar eliminados
    const tokens = await prisma.refreshToken.findMany({
      where: { userId: user.id }
    })
    expect(tokens).toHaveLength(0)
  })
})
```

### Tests de Integración

```typescript
describe('[Auth Middleware] Integration Tests', () => {
  it('Debe proteger rutas que requieren autenticación', async () => {
    await request(app)
      .get('/api/courses')
      .expect(401)
  })

  it('Debe permitir acceso con token válido', async () => {
    const token = await getValidToken()

    await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('Flujo completo: login → access → refresh → logout', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'SecurePass123!' })

    const { accessToken, refreshToken } = loginRes.body

    // 2. Acceder a recurso protegido
    await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    // 3. Renovar token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200)

    const newAccessToken = refreshRes.body.accessToken
    expect(newAccessToken).toBeDefined()
    expect(newAccessToken).not.toBe(accessToken)

    // 4. Logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200)

    // 5. Token revocado no debe funcionar
    await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(401)
  })
})
```

---

## Notas Adicionales

**Seguridad:**
- JWT_SECRET debe ser seguro (mínimo 256 bits, usar crypto.randomBytes)
- Almacenar JWT_SECRET en variable de entorno, NUNCA en código
- Refresh tokens deben ser aleatorios (no JWT) para poder revocarlos
- Blacklist en Redis debe tener TTL igual al tiempo restante del token
- Considerar rotación de refresh tokens (emitir nuevo al usar uno)

**Performance:**
- Redis es crítico - implementar fallback si falla
- Caché de verificaciones frecuentes
- Índice en tabla refresh_tokens para búsquedas rápidas

**Escalabilidad:**
- Redis puede ser clúster para alta disponibilidad
- Considerar usar Redis Streams para auditoría de tokens
- Implementar limpieza periódica de refresh tokens expirados (cron job)

**UX/UI:**
- Renovación silenciosa de tokens en frontend (interceptors)
- Mostrar notificación si sesión está por expirar
- Logout en todas las pestañas (usar BroadcastChannel API)

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md` - Sección 5.1 (Autenticación)
- Backlog: `docs/backlog.md` - Sprint 1, HU-004
- RFC 7519 (JWT): https://tools.ietf.org/html/rfc7519
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
