# HU-032: Rúbricas de Calificación

**Épica:** EP-007 - Proyectos y Evaluación Manual
**Sprint:** 6
**Story Points:** 5
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** instructor
**Quiero** usar rúbricas predefinidas para evaluar proyectos
**Para** mantener consistencia en calificaciones entre estudiantes

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo Rubric: id, projectId, criteria (JSON array de criterios)
- [ ] **AC2:** Modelo Criterion: name, description, maxPoints, levels (array de descriptores por nivel)
- [ ] **AC3:** Interfaz de creación de rúbricas en configuración de proyecto
- [ ] **AC4:** Agregar/eliminar criterios dinámicamente
- [ ] **AC5:** Definir niveles de logro: Excelente (10pts), Bueno (7pts), Suficiente (5pts), Insuficiente (0pts)
- [ ] **AC6:** Preview de rúbrica antes de guardar
- [ ] **AC7:** En evaluación (HU-028), mostrar rúbrica con radio buttons por nivel de cada criterio
- [ ] **AC8:** Cálculo automático de puntuación total sumando puntos de cada criterio
- [ ] **AC9:** Rúbricas reutilizables entre proyectos (copiar de proyecto anterior)
- [ ] **AC10:** Template library con rúbricas comunes pre-diseñadas
- [ ] **AC11:** Endpoint POST/GET /api/rubrics

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
- HU-028

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-032: Rúbricas de Calificación', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Rúbricas de Calificación] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-032
- Diseño de base de datos: `docs/database-schema.md`
