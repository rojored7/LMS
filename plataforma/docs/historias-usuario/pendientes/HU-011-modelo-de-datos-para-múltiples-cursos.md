# HU-011: Modelo de Datos para Múltiples Cursos

**Épica:** EP-003 - Sistema Multi-Curso
**Sprint:** 3
**Story Points:** 8
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** desarrollador
**Quiero** diseñar un modelo de datos escalable para soportar múltiples cursos
**Para** permitir el crecimiento ilimitado de la plataforma con arquitectura sólida

---

## Criterios de Aceptación

- [ ] **AC1:** Esquema Prisma con entidades: Course (id, title, description, slug, duration, difficulty, imageUrl, createdAt)
- [ ] **AC2:** Modelo Module: id, courseId, title, order, description con relación a Course
- [ ] **AC3:** Modelo Lesson: id, moduleId, title, order, type (video, text, quiz, lab), content (markdown o JSON)
- [ ] **AC4:** Modelo UserCourseEnrollment: userId, courseId, enrolledAt, progress (%), completedAt
- [ ] **AC5:** Modelo UserLessonProgress: userId, lessonId, completed, completedAt, attempts
- [ ] **AC6:** Foreign keys y constraints de integridad referencial definidos
- [ ] **AC7:** Índices en campos frecuentemente consultados: slug, userId, courseId
- [ ] **AC8:** Migrations de Prisma ejecutables y versionadas correctamente
- [ ] **AC9:** Seeds con datos de ejemplo: mínimo 3 cursos completos con 2-3 módulos cada uno

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
- Ninguna

**Bloqueante para:**
- HU-012, - HU-013, - HU-014, - HU-015, - HU-009

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-011: Modelo de Datos para Múltiples Cursos', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Modelo de Datos para Múltiples Cursos] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 3, HU-011
- Diseño de base de datos: `docs/database-schema.md`
