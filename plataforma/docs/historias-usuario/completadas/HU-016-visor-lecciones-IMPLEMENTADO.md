# HU-016: Visor de Lecciones con Markdown Rendering

**Épica:** EP-004 - Visualización de Contenido Educativo
**Sprint:** 4
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** ver lecciones formateadas con markdown
**Para** tener una experiencia de lectura agradable y profesional

---

## Criterios de Aceptación

- [ ] **AC1:** Renderizado de markdown usando marked.js + DOMPurify para seguridad
- [ ] **AC2:** Soporte completo para: encabezados (h1-h6), código con syntax highlighting (highlight.js), listas ordenadas y desordenadas, imágenes embebidas, tablas, links externos (abrir en nueva pestaña)
- [ ] **AC3:** Estilo consistente con diseño de la plataforma (tipografía, colores)
- [ ] **AC4:** Copy button en cada bloque de código para copiar al clipboard
- [ ] **AC5:** Navegación anterior/siguiente lección con keyboard shortcuts (←/→)
- [ ] **AC6:** Botón "Marcar como completada" que actualiza progreso (HU-015)
- [ ] **AC7:** Renderizado responsivo para móviles
- [ ] **AC8:** Endpoint GET /api/lessons/:id retornando contenido markdown

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
- HU-020, - HU-023

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-016: Visor de Lecciones con Markdown Rendering', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Visor de Lecciones con Markdown Rendering] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 4, HU-016
- Diseño de base de datos: `docs/database-schema.md`
