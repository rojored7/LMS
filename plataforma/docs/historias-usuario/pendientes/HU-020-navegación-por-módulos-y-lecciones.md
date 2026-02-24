# HU-020: Navegación por Módulos y Lecciones

**Épica:** EP-004 - Visualización de Contenido Educativo
**Sprint:** 4
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** navegar fácilmente entre módulos y lecciones
**Para** avanzar en el curso sin fricción ni confusión

---

## Criterios de Aceptación

- [ ] **AC1:** Sidebar con acordeón de módulos expandibles/colapsables
- [ ] **AC2:** Cada módulo muestra lista de lecciones con iconos según tipo: 📖 (texto), 🎥 (video), ❓ (quiz), 💻 (lab)
- [ ] **AC3:** Indicador de completitud visual (checkmark verde) en lecciones completadas
- [ ] **AC4:** Lección actual destacada con fondo de color diferente
- [ ] **AC5:** Breadcrumbs en parte superior: Curso > Módulo > Lección
- [ ] **AC6:** Botones "Anterior" y "Siguiente" en cada lección con navegación fluida
- [ ] **AC7:** Auto-scroll a lección actual en sidebar al cargar página
- [ ] **AC8:** Bloqueo opcional de lecciones (requieren completar previas) - configurable por curso
- [ ] **AC9:** Contador de lecciones: "Lección X de Y" visible

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
- HU-016

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-020: Navegación por Módulos y Lecciones', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Navegación por Módulos y Lecciones] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 4, HU-020
- Diseño de base de datos: `docs/database-schema.md`
