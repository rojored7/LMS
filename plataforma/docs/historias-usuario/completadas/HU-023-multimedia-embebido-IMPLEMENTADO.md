# HU-023: Soporte para Multimedia Embebido

**Épica:** EP-004 - Visualización de Contenido Educativo
**Sprint:** 4
**Story Points:** 3
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** instructor
**Quiero** embebir videos de YouTube y otros recursos multimedia
**Para** enriquecer el contenido educativo con recursos visuales

---

## Criterios de Aceptación

- [ ] **AC1:** Markdown parser detecta automáticamente enlaces de YouTube/Vimeo
- [ ] **AC2:** Renderizado automático como iframe embebido responsive
- [ ] **AC3:** Soporte para archivos de audio (mp3, wav) con reproductor HTML5
- [ ] **AC4:** Embebido de diagramas usando Mermaid.js en bloques de código ```mermaid
- [ ] **AC5:** Galería de imágenes con lightbox para visualización ampliada
- [ ] **AC6:** Validación de URLs externas con whitelist de dominios confiables
- [ ] **AC7:** Lazy loading de iframes para performance
- [ ] **AC8:** Placeholder con thumbnail mientras carga el video

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
describe('HU-023: Soporte para Multimedia Embebido', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Soporte para Multimedia Embebido] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 4, HU-023
- Diseño de base de datos: `docs/database-schema.md`
