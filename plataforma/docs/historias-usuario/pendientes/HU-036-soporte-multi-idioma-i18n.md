# HU-036: Soporte Multi-Idioma (i18n)

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** Backlog
**Story Points:** 13
**Prioridad:** Wont Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** usuario internacional
**Quiero** usar la plataforma en mi idioma nativo
**Para** mejorar mi experiencia de aprendizaje

---

## Criterios de Aceptación

- [ ] **AC1:** Integración de i18next (React) con detección automática de idioma
- [ ] **AC2:** Idiomas soportados inicialmente: Español, Inglés
- [ ] **AC3:** Traducción completa de interfaz (UI strings)
- [ ] **AC4:** Selector de idioma en navbar con flags
- [ ] **AC5:** Persistencia de preferencia de idioma en localStorage
- [ ] **AC6:** Contenido de cursos multiidioma (metadata separada por idioma)
- [ ] **AC7:** Fallback a idioma por defecto si traducción no existe
- [ ] **AC8:** Números, fechas y monedas formateadas según locale

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
- Ninguna

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-036: Soporte Multi-Idioma (i18n)', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Soporte Multi-Idioma (i18n)] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint Backlog, HU-036
- Diseño de base de datos: `docs/database-schema.md`
