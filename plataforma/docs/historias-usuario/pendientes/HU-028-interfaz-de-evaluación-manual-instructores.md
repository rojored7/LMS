# HU-028: Interfaz de Evaluación Manual (Instructores)

**Épica:** EP-007 - Proyectos y Evaluación Manual
**Sprint:** 6
**Story Points:** 8
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** instructor
**Quiero** evaluar proyectos de estudiantes con una interfaz dedicada
**Para** proporcionar feedback detallado de forma eficiente

---

## Criterios de Aceptación

- [ ] **AC1:** Página /instructor/projects/:projectId/submissions con lista de entregas
- [ ] **AC2:** Filtros: pendiente, evaluado, atrasado (submitted después de dueDate)
- [ ] **AC3:** Click en entrega abre panel lateral de evaluación con información del estudiante
- [ ] **AC4:** Archivos entregados con download links individuales
- [ ] **AC5:** Viewer integrado para PDFs sin necesidad de descargar
- [ ] **AC6:** Rúbrica de evaluación configurable por proyecto (ver HU-032)
- [ ] **AC7:** Campo de puntuación numérica (0-100) con validación
- [ ] **AC8:** Área de feedback con rich text editor (bold, italic, lists)
- [ ] **AC9:** Botones: "Guardar como borrador" y "Enviar calificación final"
- [ ] **AC10:** Al enviar, actualizar estado a "graded" y notificar estudiante por email
- [ ] **AC11:** Historial de evaluaciones para auditoría
- [ ] **AC12:** Endpoint POST /api/projects/:id/submissions/:submissionId/grade

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
- HU-027

**Bloqueante para:**
- HU-032

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-028: Interfaz de Evaluación Manual (Instructores)', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Interfaz de Evaluación Manual (Instructores)] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-028
- Diseño de base de datos: `docs/database-schema.md`
