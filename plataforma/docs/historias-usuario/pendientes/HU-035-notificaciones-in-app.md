# HU-035: Notificaciones In-App

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** 6
**Story Points:** 5
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** usuario
**Quiero** recibir notificaciones in-app de eventos importantes
**Para** estar al tanto de mi progreso y actualizaciones

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo Notification: userId, type, title, message, read (boolean), createdAt
- [ ] **AC2:** Tipos de notificaciones: nuevo badge ganado, curso completado, proyecto calificado, nuevo curso disponible (según perfil), recordatorio de curso sin completar (7 días inactivo)
- [ ] **AC3:** Icono de campana en navbar con badge numérico de cantidad no leída
- [ ] **AC4:** Dropdown con lista de notificaciones (últimas 10) al hacer click
- [ ] **AC5:** Marcar como leída al hacer click en la notificación
- [ ] **AC6:** Página completa /notifications con todas las notificaciones
- [ ] **AC7:** Filtros por tipo y estado (leída/no leída)
- [ ] **AC8:** Ordenamiento por fecha (más recientes primero)
- [ ] **AC9:** Real-time notifications usando websockets (Socket.io)
- [ ] **AC10:** Endpoint GET /api/notifications, PATCH /api/notifications/:id/read

---

## Definición de Hecho (DoD)

- [ ] Código implementado (backend y/o frontend según aplique)
- [ ] Tests unitarios escritos y pasando (>80% coverage)
- [ ] Tests de integración escritos y pasando
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Code review realizado y aprobado
- [ ] Documentación técnica actualizada (JSDoc/Swagger)
- [ ] Validado en entorno Docker local
- [ ] Sin warnings de linter ni TypeScript errors

---

## Detalles Técnicos

### Backend (si aplica)
- **Endpoints:** Ver criterios de aceptación para detalles específicos
- **Modelos (Prisma):** Ver criterios de aceptación
- **Servicios:** Lógica de negocio según funcionalidad
- **Middlewares:** Validaciones necesarias (Zod, auth, roles)

### Frontend (si aplica)
- **Componentes:** React components necesarios
- **Páginas:** Rutas definidas en criterios
- **Estado (Zustand):** State management según necesidades
- **Hooks:** Custom hooks con React Query

### Base de Datos (si aplica)
- **Migraciones:** Cambios en schema según modelos
- **Seeders:** Datos iniciales si son necesarios

---

## Dependencias

**Depende de:**
- HU-029, - HU-030, - HU-028

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-035: Notificaciones In-App', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Notificaciones In-App] Integration Tests', () => {
  // Implementar tests end-to-end
  it('debe completar flujo completo', async () => {
    // test implementation
  });
});
```

---

## Notas Adicionales

**Seguridad:**
- Validación de inputs en backend
- Sanitización de datos
- Protección de rutas según roles

**UX/UI:**
- Feedback visual claro
- Loading states
- Mensajes de error informativos

**Performance:**
- Optimización de queries
- Caché cuando sea apropiado
- Lazy loading de componentes

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md`
- Backlog: `docs/backlog.md` - Sprint 6, HU-035
- Diseño de base de datos: `docs/database-schema.md`
