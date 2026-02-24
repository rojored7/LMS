# HU-034: Perfil Público de Usuario

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** 6
**Story Points:** 5
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** tener un perfil público con mis logros
**Para** compartir mi progreso con otros

---

## Criterios de Aceptación

- [ ] **AC1:** Página /profile/:username con información pública del usuario
- [ ] **AC2:** Secciones: Avatar, nombre, bio personalizable, nivel y XP total con barra de progreso, badges ganados en galería con tooltips
- [ ] **AC3:** Cursos completados con certificados descargables
- [ ] **AC4:** Estadísticas: total quizzes aprobados, labs completados, tiempo total invertido
- [ ] **AC5:** Timeline de actividad reciente (últimas 20 acciones)
- [ ] **AC6:** Configuración de privacidad: perfil público/privado (toggle en settings)
- [ ] **AC7:** URL personalizada: /profile/custom-username (editable, validación de único)
- [ ] **AC8:** Botón "Compartir perfil" generando link + QR code
- [ ] **AC9:** Open Graph tags para preview bonito en redes sociales
- [ ] **AC10:** Endpoint GET /api/users/:username/public-profile

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
- HU-029, - HU-033

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-034: Perfil Público de Usuario', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Perfil Público de Usuario] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-034
- Diseño de base de datos: `docs/database-schema.md`
