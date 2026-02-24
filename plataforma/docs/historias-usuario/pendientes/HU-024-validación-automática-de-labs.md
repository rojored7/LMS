# HU-024: Validación Automática de Labs

**Épica:** EP-006 - Laboratorios Ejecutables
**Sprint:** 5
**Story Points:** 8
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** instructor
**Quiero** definir test cases que validen automáticamente el código del estudiante
**Para** reducir evaluación manual y dar feedback inmediato

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo Lab: id, lessonId, starterCode, instructions (markdown), language
- [ ] **AC2:** Modelo TestCase: id, labId, input (JSON), expectedOutput, isHidden (prevenir hardcoding)
- [ ] **AC3:** Interfaz de creación de lab con editor de test cases (agregar/eliminar)
- [ ] **AC4:** Al ejecutar lab, correr todos los test cases automáticamente
- [ ] **AC5:** Comparación de output: string matching exacto, regex, JSON diff
- [ ] **AC6:** Resultado visual por test case: ✅ Test Passed / ❌ Test Failed
- [ ] **AC7:** Detalles de error mostrando: expected vs actual output
- [ ] **AC8:** Progreso de tests: "X/Y tests pasados" con barra de progreso
- [ ] **AC9:** Marcar lab como completado solo si 100% de tests pasan
- [ ] **AC10:** Endpoint POST /api/labs/:id/run con body: { code }

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
- HU-022

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-024: Validación Automática de Labs', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Validación Automática de Labs] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 5, HU-024
- Diseño de base de datos: `docs/database-schema.md`
