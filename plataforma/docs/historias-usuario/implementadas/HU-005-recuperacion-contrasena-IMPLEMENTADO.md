# HU-005: Recuperación de Contraseña - IMPLEMENTADO

**Épica:** EP-001 - Autenticación y Autorización
**Sprint:** 1
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** ✅ COMPLETADO

---

## Resumen de Implementación

Se ha implementado completamente el flujo de recuperación de contraseña siguiendo todos los criterios de aceptación especificados en la historia de usuario. La implementación incluye:

- ✅ Backend completo con endpoints RESTful
- ✅ Frontend con páginas de Forgot Password y Reset Password
- ✅ Sistema de envío de emails con nodemailer
- ✅ Tokens de reseteo seguros con hash SHA-256
- ✅ Tests de integración completos
- ✅ Validaciones robustas en backend y frontend

---

## Archivos Implementados

### Backend

#### 1. **Modelo de Base de Datos**
- **Archivo:** `backend/prisma/schema.prisma`
- **Cambios:**
  - Agregado modelo `PasswordResetToken`
  - Relación con modelo `User`
  - Índices para optimización de queries

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([token, expiresAt])
  @@index([userId])
  @@map("password_reset_tokens")
}
```

#### 2. **Servicio de Email**
- **Archivo:** `backend/src/services/email.service.ts`
- **Funcionalidad:**
  - Envío de emails HTML con template responsive
  - Validación de conexión SMTP
  - Manejo de errores

#### 3. **Servicio de Autenticación**
- **Archivo:** `backend/src/services/auth.service.ts`
- **Métodos agregados:**
  - `requestPasswordReset()` - Genera token y envía email
  - `verifyResetToken()` - Valida token sin revelarlo
  - `resetPassword()` - Actualiza contraseña con token válido

#### 4. **Controlador**
- **Archivo:** `backend/src/controllers/auth.controller.ts`
- **Endpoints implementados:**
  - `forgotPassword()` - POST /api/auth/forgot-password
  - `verifyResetToken()` - GET /api/auth/verify-reset-token/:token
  - `resetPassword()` - POST /api/auth/reset-password

#### 5. **Rutas**
- **Archivo:** `backend/src/routes/auth.routes.ts`
- **Rutas agregadas:**
  ```typescript
  router.post('/forgot-password', asyncHandler(authController.forgotPassword));
  router.get('/verify-reset-token/:token', asyncHandler(authController.verifyResetToken));
  router.post('/reset-password', asyncHandler(authController.resetPassword));
  ```

#### 6. **Validadores**
- **Archivo:** `backend/src/validators/auth.validator.ts`
- **Schemas agregados:**
  - `forgotPasswordSchema` - Validación de email
  - `resetPasswordSchema` - Validación de contraseña nueva (8+ caracteres, mayúscula, minúscula, número, carácter especial)

#### 7. **Tests**
- **Archivo:** `backend/src/__tests__/auth/password-reset.test.ts`
- **Cobertura:**
  - Tests de todos los criterios de aceptación (AC1-AC8)
  - Test de flujo completo end-to-end
  - Tests de casos de error
  - Tests de seguridad (no revelar emails)

### Frontend

#### 8. **Página Forgot Password**
- **Archivo:** `frontend/src/pages/ForgotPassword.tsx`
- **Características:**
  - Formulario de email con validación
  - Estado de éxito con instrucciones
  - Manejo de errores
  - UI/UX responsive

#### 9. **Página Reset Password**
- **Archivo:** `frontend/src/pages/ResetPassword.tsx`
- **Características:**
  - Verificación automática de token
  - Formulario de nueva contraseña
  - Indicadores de requisitos de contraseña
  - Estados de carga y error
  - Redirección a login tras éxito

#### 10. **Servicio de Auth**
- **Archivo:** `frontend/src/services/auth.service.ts`
- **Métodos agregados:**
  - `forgotPassword(email)` - Solicita reseteo
  - `verifyResetToken(token)` - Verifica token
  - `resetPassword(token, newPassword)` - Resetea contraseña

#### 11. **Rutas**
- **Archivo:** `frontend/src/App.tsx`
- **Rutas agregadas:**
  - `/forgot-password` - Página de solicitud de reseteo
  - `/reset-password` - Página de reseteo con token

#### 12. **Constantes**
- **Archivo:** `frontend/src/utils/constants.ts`
- **Agregadas:**
  - `ROUTES.FORGOT_PASSWORD`
  - `ROUTES.RESET_PASSWORD`

#### 13. **Actualización Login**
- **Archivo:** `frontend/src/pages/Login.tsx`
- **Cambio:** Link "¿Olvidaste tu contraseña?" ahora apunta a `/forgot-password`

---

## Criterios de Aceptación - Verificación

### ✅ AC1: Formulario de "Olvidé mi contraseña"
- Página `/forgot-password` implementada
- Formulario con campo email
- Validación de email en frontend y backend

### ✅ AC2: Generación de token
- Token de 32 bytes generado con `crypto.randomBytes()`
- Token hasheado con SHA-256 antes de almacenar
- Expiración de 1 hora configurada
- Almacenado en tabla `password_reset_tokens`

### ✅ AC3: Envío de email
- Template HTML responsive diseñado
- Email enviado con nodemailer
- Link en formato: `https://frontend.com/reset-password?token=<token>`
- Instrucciones claras para el usuario

### ✅ AC4: Página de reseteo con validación de token
- Verificación automática al cargar página
- Endpoint GET `/verify-reset-token/:token`
- Validación de expiración y uso previo
- UI clara para token inválido o expirado

### ✅ AC5: Validación de contraseña
- Mismos requisitos que registro:
  - Mínimo 8 caracteres
  - 1 mayúscula
  - 1 minúscula
  - 1 número
  - 1 carácter especial
- Validación en backend con Zod
- Validación en frontend con regex
- Indicadores visuales de requisitos

### ✅ AC6: Invalidación de token tras uso
- Campo `usedAt` marcado tras uso exitoso
- Token no puede reutilizarse
- Tests verifican rechazo de tokens usados

### ✅ AC7: Confirmación y redirección
- Mensaje de éxito tras cambio
- Redirección automática a `/login`
- Toast notification en frontend

### ✅ AC8: No revelar existencia de email
- Misma respuesta para emails existentes y no existentes
- Tests verifican igualdad de respuestas
- Logging interno sin revelar al usuario

---

## Seguridad Implementada

1. **Token Seguro:**
   - Generación criptográficamente segura con `crypto.randomBytes()`
   - Hash SHA-256 antes de almacenar en BD
   - Token plano solo enviado por email, nunca almacenado

2. **Prevención de Enumeración:**
   - No revelar si un email existe o no
   - Misma respuesta HTTP 200 para ambos casos
   - Logging silencioso de intentos

3. **Expiración:**
   - Tokens expiran en 1 hora
   - Validación de expiración en cada uso

4. **Un Solo Uso:**
   - Campo `usedAt` previene reutilización
   - Token marcado inmediatamente tras uso

5. **Invalidación de Sesiones:**
   - Todos los refresh tokens del usuario se eliminan tras reseteo
   - Forzar re-login con nueva contraseña

---

## Configuración Requerida

### Variables de Entorno (.env)

```bash
# SMTP Configuration (requerido para envío de emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@plataforma-cursos.com

# Frontend URL (para construir links en emails)
FRONTEND_URL=http://localhost:3000
```

**Nota:** Para Gmail, usar [App Passwords](https://support.google.com/accounts/answer/185833)

---

## Migraciones de Base de Datos

### Ejecutar Migración

```bash
cd backend
npm run migrate
```

### SQL de Migración

El archivo de migración está en:
`backend/prisma/migrations/20250224_add_password_reset_token/migration.sql`

Crea la tabla `password_reset_tokens` con:
- Clave primaria UUID
- Relación con `users` (CASCADE on delete)
- Índices en `token`, `userId`, y compuesto `(token, expiresAt)`

---

## Testing

### Ejecutar Tests

```bash
cd backend
npm test src/__tests__/auth/password-reset.test.ts
```

### Tests Implementados

1. **Solicitud de Reseteo:**
   - Email válido acepta solicitud
   - Genera token único en BD
   - No revela si email existe

2. **Verificación de Token:**
   - Token válido retorna `valid: true`
   - Token expirado retorna `valid: false`
   - Token inválido retorna `valid: false`

3. **Reseteo de Contraseña:**
   - Token válido permite cambio
   - Contraseña actualizada en BD
   - Token marcado como usado
   - Valida requisitos de contraseña
   - Rechaza tokens usados
   - Rechaza contraseñas no coincidentes

4. **Flujo Completo:**
   - Solicitar → Verificar → Resetear → Login
   - Verifica contraseña vieja no funciona

---

## Flujo de Usuario

### 1. Usuario Olvida Contraseña

1. Hace clic en "¿Olvidaste tu contraseña?" en página de login
2. Ingresa su email en `/forgot-password`
3. Recibe mensaje: "Si el email existe, recibirás instrucciones"

### 2. Usuario Recibe Email

1. Email llega con link: `https://plataforma.com/reset-password?token=abc123`
2. Email indica expiración de 1 hora
3. Botón claro "Restablecer Contraseña"

### 3. Usuario Resetea Contraseña

1. Hace clic en link del email
2. Sistema verifica token automáticamente
3. Si válido, muestra formulario de nueva contraseña
4. Usuario ingresa nueva contraseña (con indicadores de requisitos)
5. Confirma contraseña
6. Sistema valida y actualiza
7. Redirección a login con mensaje de éxito

### 4. Token Inválido/Expirado

1. Si token inválido o expirado, muestra mensaje claro
2. Opción para solicitar nuevo link
3. Link para volver a login

---

## API Endpoints

### POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña"
}
```

### GET /api/auth/verify-reset-token/:token

**Response (válido):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "user-id-123"
  }
}
```

**Response (inválido):**
```json
{
  "success": true,
  "data": {
    "valid": false
  }
}
```

### POST /api/auth/reset-password

**Request:**
```json
{
  "token": "reset-token-123",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
}
```

---

## Mejoras Futuras (Opcionales)

1. **Rate Limiting por Email:**
   - Limitar a 3 solicitudes por email por hora
   - Prevenir spam/abuso

2. **Email de Notificación:**
   - Enviar email cuando contraseña es cambiada
   - Incluir link para reportar actividad no autorizada

3. **Limpieza Automática:**
   - Cron job para eliminar tokens expirados
   - Ejecutar cada hora

4. **Métricas:**
   - Trackear intentos de reseteo
   - Alertas de patrones sospechosos

5. **UI/UX:**
   - Indicador de fortaleza de contraseña
   - Mostrar tiempo restante de expiración del token
   - Opción para reenviar email

---

## Notas para Desarrollo

1. **Instalación de Dependencias:**
   - `nodemailer` ya incluido en `package.json`
   - No se requieren dependencias adicionales

2. **Configuración SMTP:**
   - En desarrollo, puede usar servicios como Mailtrap
   - En producción, usar SendGrid, Mailgun o AWS SES

3. **Testing:**
   - Tests requieren base de datos de prueba
   - Usar `.env.test` para configuración de tests

4. **Deployment:**
   - Ejecutar migraciones antes de deploy
   - Verificar configuración SMTP en producción
   - Configurar `FRONTEND_URL` correctamente

---

## Checklist de Deployment

- [ ] Variables de entorno SMTP configuradas
- [ ] `FRONTEND_URL` apuntando a dominio de producción
- [ ] Migración de BD ejecutada
- [ ] Tests pasando
- [ ] Configuración SPF/DKIM para emails (producción)
- [ ] Monitoreo de envío de emails configurado

---

## Autor y Fecha

**Implementado por:** Claude (AI Assistant)
**Fecha:** 24 de Febrero de 2026
**Revisado por:** Pendiente
**Aprobado por:** Pendiente

---

## Referencias

- Historia de Usuario Original: `docs/historias-usuario/pendientes/HU-005-recuperacion-contrasena.md`
- Documento de Arquitectura: `docs/arquitectura.md`
- OWASP Forgot Password Cheat Sheet
- Nodemailer Documentation: https://nodemailer.com
