# HU-009: Gestión de Perfiles de Entrenamiento

**Épica:** EP-002 - Dashboard Administrativo
**Sprint:** 2
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** crear y gestionar perfiles de entrenamiento personalizados
**Para** agrupar cursos según necesidades organizacionales y roles

---

## Criterios de Aceptación

- [ ] **AC1:** CRUD completo de perfiles: crear, leer, actualizar, eliminar
- [ ] **AC2:** Formulario con campos: nombre del perfil, descripción detallada, cursos incluidos (selección múltiple), duración estimada en horas, estado (activo/inactivo)
- [ ] **AC3:** Interfaz de creación con drag & drop para ordenar cursos incluidos
- [ ] **AC4:** Validación de nombre único a nivel de base de datos y frontend
- [ ] **AC5:** Modal de confirmación antes de eliminar perfil (warning si tiene usuarios asignados)
- [ ] **AC6:** Vista de perfiles en grid de tarjetas mostrando información resumida
- [ ] **AC7:** Endpoints: GET/POST /api/admin/profiles, GET/PUT/DELETE /api/admin/profiles/:id
- [ ] **AC8:** Modelo Profile con relaciones a Course y User

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
- HU-010, - HU-013

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-009: Gestión de Perfiles de Entrenamiento', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Gestión de Perfiles de Entrenamiento] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 2, HU-009
- Diseño de base de datos: `docs/database-schema.md`
