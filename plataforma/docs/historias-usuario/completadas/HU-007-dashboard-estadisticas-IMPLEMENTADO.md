# HU-007: Dashboard con Estadísticas Globales

**Épica:** EP-002 - Dashboard Administrativo
**Sprint:** 2
**Story Points:** 8
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** ver un dashboard con métricas clave de la plataforma
**Para** tomar decisiones informadas basadas en datos

---

## Criterios de Aceptación

- [ ] **AC1:** KPIs principales visibles: Total usuarios (activos/inactivos), Total cursos publicados, Tasa de completitud promedio, Usuarios activos últimos 7 días
- [ ] **AC2:** Gráfico de registros por semana (últimos 3 meses) usando Chart.js
- [ ] **AC3:** Gráfico de cursos más populares (top 5) en formato bar chart
- [ ] **AC4:** Distribución de usuarios por perfil en pie chart
- [ ] **AC5:** Tabla de actividad reciente mostrando últimos 10 eventos del sistema
- [ ] **AC6:** Actualización automática de datos cada 5 minutos usando polling o websocket
- [ ] **AC7:** Botón para exportar estadísticas en formato CSV con todos los datos visibles
- [ ] **AC8:** Endpoint GET /api/admin/dashboard/stats retornando todas las métricas

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
- HU-006

**Bloqueante para:**
- HU-008

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-007: Dashboard con Estadísticas Globales', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Dashboard con Estadísticas Globales] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 2, HU-007
- Diseño de base de datos: `docs/database-schema.md`
