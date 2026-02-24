# HU-033: Gamificación - Sistema de Puntos (XP)

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** 6
**Story Points:** 5
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** ganar puntos de experiencia (XP) por completar actividades
**Para** competir con otros estudiantes y mantener motivación

---

## Criterios de Aceptación

- [ ] **AC1:** Sistema de puntos definido: Completar lección (10 XP), Aprobar quiz (20 XP), Completar lab (30 XP), Entregar proyecto (50 XP), Ganar badge (100 XP)
- [ ] **AC2:** Modelo UserXP: userId, totalXP, level, xpToNextLevel
- [ ] **AC3:** Cálculo de nivel: level = floor(sqrt(totalXP / 100))
- [ ] **AC4:** Barra de progreso de nivel en navbar mostrando XP actual / XP necesario
- [ ] **AC5:** Leaderboard global mostrando top 10 estudiantes por XP total
- [ ] **AC6:** Animación visual al subir de nivel con sound effect (opcional)
- [ ] **AC7:** Historial de XP ganado en timeline (últimas 50 acciones)
- [ ] **AC8:** Otorgamiento automático de XP al completar actividades
- [ ] **AC9:** Endpoint GET /api/leaderboard retornando top usuarios
- [ ] **AC10:** Filtros de leaderboard: global, por curso, por periodo (semana/mes)

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
- HU-015, - HU-029

**Bloqueante para:**
- HU-034

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-033: Gamificación - Sistema de Puntos (XP)', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Gamificación - Sistema de Puntos (XP)] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-033
- Diseño de base de datos: `docs/database-schema.md`
