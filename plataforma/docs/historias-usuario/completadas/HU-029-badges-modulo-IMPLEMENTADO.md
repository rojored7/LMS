# HU-029: Sistema de Badges por Módulo

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** 6
**Story Points:** 5
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** ganar badges al completar módulos y logros
**Para** sentir logro y motivación para continuar aprendiendo

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo Badge: id, name, description, imageUrl (SVG/PNG), criteria (JSON con condiciones)
- [ ] **AC2:** Modelo UserBadge: userId, badgeId, earnedAt
- [ ] **AC3:** Badges predefinidos: "First Steps" (completar primer módulo), "Quiz Master" (aprobar 10 quizzes consecutivos), "Lab Expert" (completar 5 labs con 100%), "Course Graduate" (completar curso completo), badges específicos por curso
- [ ] **AC4:** Otorgamiento automático al cumplir criterios mediante event listeners
- [ ] **AC5:** Notificación visual animada (modal) al ganar badge con confetti
- [ ] **AC6:** Galería de badges en perfil de usuario mostrando obtenidos y bloqueados
- [ ] **AC7:** Badges bloqueados muestran cómo desbloquearlos (progress bar hacia logro)
- [ ] **AC8:** Endpoint GET /api/badges retornando todos los badges disponibles
- [ ] **AC9:** Endpoint GET /api/users/:id/badges retornando badges del usuario

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
- HU-015, - HU-024

**Bloqueante para:**
- HU-033, - HU-034

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-029: Sistema de Badges por Módulo', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Sistema de Badges por Módulo] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-029
- Diseño de base de datos: `docs/database-schema.md`
