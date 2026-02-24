# HU-008: Ver Progreso Detallado de un Usuario

**Épica:** EP-002 - Dashboard Administrativo
**Sprint:** 2
**Story Points:** 5
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** ver el progreso detallado de un estudiante específico
**Para** identificar necesidades de soporte y áreas de mejora individual

---

## Criterios de Aceptación

- [ ] **AC1:** Modal o página de detalles con información personal (nombre, email, perfil, fecha de registro)
- [ ] **AC2:** Lista de cursos inscritos con porcentaje de completitud visual (progress bars)
- [ ] **AC3:** Badges obtenidos mostrados en galería con iconos
- [ ] **AC4:** Historial de quizzes con score promedio y tendencia
- [ ] **AC5:** Lista de laboratorios completados con fecha y resultado
- [ ] **AC6:** Proyectos entregados con calificaciones y estado de evaluación
- [ ] **AC7:** Línea de tiempo de actividad mostrando últimas 30 acciones del usuario
- [ ] **AC8:** Gráfico de progreso por módulo en cada curso (bar chart horizontal)
- [ ] **AC9:** Endpoint GET /api/admin/users/:id/progress con toda la información

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
- HU-006, - HU-015

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-008: Ver Progreso Detallado de un Usuario', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Ver Progreso Detallado de un Usuario] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 2, HU-008
- Diseño de base de datos: `docs/database-schema.md`
