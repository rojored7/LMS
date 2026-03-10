# HU-013: Catálogo de Cursos Filtrado por Perfil

**Épica:** EP-003 - Sistema Multi-Curso
**Sprint:** 3
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** ver un catálogo de cursos filtrado según mi perfil asignado
**Para** enfocarme en contenido relevante para mi rol sin distracciones

---

## Criterios de Aceptación

- [ ] **AC1:** Página /courses con grid responsive de tarjetas de cursos
- [ ] **AC2:** Cada tarjeta muestra: imagen destacada, título, descripción corta (150 chars), duración estimada, nivel de dificultad
- [ ] **AC3:** Filtrado automático si el usuario tiene perfil asignado (mostrar solo cursos de su perfil)
- [ ] **AC4:** Filtros manuales adicionales: dificultad (básico, intermedio, avanzado), duración (<10h, 10-20h, >20h)
- [ ] **AC5:** Búsqueda por nombre de curso con highlighting de resultados
- [ ] **AC6:** Indicador visual claro de cursos en los que ya está inscrito (badge "Inscrito")
- [ ] **AC7:** Click en tarjeta lleva a página de detalles del curso (/courses/:slug)
- [ ] **AC8:** Endpoint GET /api/courses con query params: profile, difficulty, search

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
- HU-011, - HU-009

**Bloqueante para:**
- HU-014

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-013: Catálogo de Cursos Filtrado por Perfil', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Catálogo de Cursos Filtrado por Perfil] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 3, HU-013
- Diseño de base de datos: `docs/database-schema.md`
