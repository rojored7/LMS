# HU-015: Tracking de Progreso por Curso y Módulo

**Épica:** EP-003 - Sistema Multi-Curso
**Sprint:** 3
**Story Points:** 8
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** que mi progreso se guarde automáticamente
**Para** retomar donde lo dejé sin perder mi avance

---

## Criterios de Aceptación

- [ ] **AC1:** Al completar una lección, actualizar UserLessonProgress.completed = true automáticamente
- [ ] **AC2:** Cálculo dinámico de progreso del curso: (lecciones_completadas / total_lecciones) * 100
- [ ] **AC3:** Actualización de UserCourseEnrollment.progress en tiempo real (debounce 2 segundos)
- [ ] **AC4:** Barra de progreso visual en cada módulo y en vista general del curso
- [ ] **AC5:** Persistencia inmediata en base de datos con manejo de errores
- [ ] **AC6:** Sincronización entre dispositivos (misma cuenta)
- [ ] **AC7:** Endpoint GET /api/courses/:id/progress retornando estado completo
- [ ] **AC8:** Endpoint PATCH /api/lessons/:id/complete para marcar lección
- [ ] **AC9:** Cálculo de fecha estimada de completitud basada en ritmo actual

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
- HU-014

**Bloqueante para:**
- HU-008, - HU-016, - HU-027, - HU-029, - HU-030

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-015: Tracking de Progreso por Curso y Módulo', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Tracking de Progreso por Curso y Módulo] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 3, HU-015
- Diseño de base de datos: `docs/database-schema.md`
