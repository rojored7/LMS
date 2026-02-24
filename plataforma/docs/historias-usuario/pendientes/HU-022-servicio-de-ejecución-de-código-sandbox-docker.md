# HU-022: Servicio de Ejecución de Código (Sandbox Docker)

**Épica:** EP-006 - Laboratorios Ejecutables
**Sprint:** 5
**Story Points:** 13
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** ejecutar código de estudiantes en un entorno aislado
**Para** proteger el servidor de código malicioso

---

## Criterios de Aceptación

- [ ] **AC1:** Microservicio de ejecución con contenedores Docker efímeros
- [ ] **AC2:** API endpoint POST /api/labs/execute con body: { language, code, testCases }
- [ ] **AC3:** Timeout estricto de 30 segundos por ejecución (kill container después)
- [ ] **AC4:** Límite de memoria: 256MB por contenedor (configuración Docker)
- [ ] **AC5:** Límite de CPU: 0.5 cores máximo
- [ ] **AC6:** Captura completa de stdout, stderr y código de salida del proceso
- [ ] **AC7:** Limpieza automática de contenedores (max lifetime: 1 minuto)
- [ ] **AC8:** Rate limiting: 10 ejecuciones por minuto por usuario (Redis)
- [ ] **AC9:** Logging detallado de todas las ejecuciones para auditoría y debugging
- [ ] **AC10:** Network isolation: sin acceso a internet desde contenedores

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
- HU-021

**Bloqueante para:**
- HU-024, - HU-025, - HU-026

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-022: Servicio de Ejecución de Código (Sandbox Docker)', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Servicio de Ejecución de Código (Sandbox Docker)] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 5, HU-022
- Diseño de base de datos: `docs/database-schema.md`
