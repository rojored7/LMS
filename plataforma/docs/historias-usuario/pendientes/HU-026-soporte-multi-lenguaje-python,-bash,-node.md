# HU-026: Soporte Multi-Lenguaje (Python, Bash, Node)

**Épica:** EP-006 - Laboratorios Ejecutables
**Sprint:** 5
**Story Points:** 8
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** instructor
**Quiero** crear labs en diferentes lenguajes de programación
**Para** cubrir diversas necesidades de aprendizaje en ciberseguridad

---

## Criterios de Aceptación

- [ ] **AC1:** Imágenes Docker pre-construidas: Python 3.11 (con pip, pytest), Node.js 20 (con npm, jest), Bash 5.x (con herramientas estándar de Unix)
- [ ] **AC2:** Auto-detección de lenguaje desde extensión de archivo o metadata
- [ ] **AC3:** Configuración de dependencias por lab: requirements.txt para Python, package.json para Node
- [ ] **AC4:** Instalación automática de dependencias en contenedor antes de ejecutar
- [ ] **AC5:** Cache de imágenes Docker para reducir latencia de creación
- [ ] **AC6:** Selector de lenguaje en interfaz de creación de lab para instructores
- [ ] **AC7:** Validación de código malicioso básica (blacklist de comandos peligrosos)
- [ ] **AC8:** Soporte futuro para más lenguajes: Go, Rust, Ruby (arquitectura extensible)

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
describe('HU-026: Soporte Multi-Lenguaje (Python, Bash, Node)', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Soporte Multi-Lenguaje (Python, Bash, Node)] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 5, HU-026
- Diseño de base de datos: `docs/database-schema.md`
