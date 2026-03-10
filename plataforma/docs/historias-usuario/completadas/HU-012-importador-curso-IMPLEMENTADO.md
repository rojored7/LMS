# HU-012: Importador de Curso desde Markdown

**Épica:** EP-003 - Sistema Multi-Curso
**Sprint:** 3
**Story Points:** 8
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** importar un curso completo desde archivos markdown estructurados
**Para** acelerar la creación de contenido sin necesidad de interfaces complejas

---

## Criterios de Aceptación

- [ ] **AC1:** Endpoint POST /api/admin/courses/import aceptando multipart/form-data (ZIP file)
- [ ] **AC2:** Estructura de ZIP esperada: course-name/{course.json, modules/01-module-name/lessons/{01-lesson.md, 02-quiz.json, 03-lab.md}}
- [ ] **AC3:** Parser de markdown con frontmatter (título, orden, tipo de lección)
- [ ] **AC4:** Validación de estructura completa antes de iniciar importación
- [ ] **AC5:** Preview del curso en interfaz antes de confirmar importación definitiva
- [ ] **AC6:** Creación automática de registros Course, Modules, Lessons en base de datos
- [ ] **AC7:** Manejo robusto de errores con rollback completo si falla cualquier paso
- [ ] **AC8:** Progress indicator durante importación (websocket o polling)
- [ ] **AC9:** Logs detallados de importación guardados para debugging

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
- HU-011

**Bloqueante para:**
- HU-013

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-012: Importador de Curso desde Markdown', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Importador de Curso desde Markdown] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 3, HU-012
- Diseño de base de datos: `docs/database-schema.md`
