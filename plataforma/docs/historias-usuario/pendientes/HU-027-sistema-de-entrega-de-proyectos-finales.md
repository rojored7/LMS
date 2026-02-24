# HU-027: Sistema de Entrega de Proyectos Finales

**Épica:** EP-007 - Proyectos y Evaluación Manual
**Sprint:** 6
**Story Points:** 8
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** entregar mi proyecto final subiendo archivos
**Para** completar el curso y demostrar mi aprendizaje

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo Project: id, courseId, title, description, maxFileSize, allowedFormats, dueDate
- [ ] **AC2:** Modelo Submission: id, projectId, userId, files (JSON array), submittedAt, status (pending, graded)
- [ ] **AC3:** Interfaz de upload con drag & drop de archivos
- [ ] **AC4:** Validación de tamaño de archivos (máximo 50MB total)
- [ ] **AC5:** Validación de formatos permitidos (pdf, zip, docx, etc.) configurables por proyecto
- [ ] **AC6:** Preview de archivos antes de enviar (mostrar nombres, tamaños)
- [ ] **AC7:** Confirmación de entrega con timestamp y número de confirmación
- [ ] **AC8:** Email de confirmación de entrega al estudiante con resumen
- [ ] **AC9:** Posibilidad de re-entregar antes de deadline (overwrite submission anterior)
- [ ] **AC10:** Endpoint POST /api/projects/:id/submit (multipart/form-data)

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
- HU-015

**Bloqueante para:**
- HU-028

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-027: Sistema de Entrega de Proyectos Finales', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Sistema de Entrega de Proyectos Finales] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-027
- Diseño de base de datos: `docs/database-schema.md`
