# HU-031: Envío de Certificado por Email

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** 6
**Story Points:** 3
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** recibir mi certificado automáticamente por email
**Para** tenerlo disponible fácilmente en mi correo

---

## Criterios de Aceptación

- [ ] **AC1:** Al completar 100% de un curso, disparar evento de generación y envío
- [ ] **AC2:** Generar PDF (HU-030) y enviar email con adjunto
- [ ] **AC3:** Asunto personalizado: "¡Felicidades! Has completado [Nombre del Curso]"
- [ ] **AC4:** Mensaje de felicitación personalizado con nombre del estudiante
- [ ] **AC5:** Certificado adjunto como PDF
- [ ] **AC6:** Link a verificación online del certificado
- [ ] **AC7:** Template de email profesional en HTML responsive
- [ ] **AC8:** Logs de envío exitoso/fallido para debugging
- [ ] **AC9:** Opción de reenviar certificado desde perfil (botón "Reenviar a mi email")
- [ ] **AC10:** Rate limiting para prevenir spam de reenvíos

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
- HU-030

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-031: Envío de Certificado por Email', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Envío de Certificado por Email] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-031
- Diseño de base de datos: `docs/database-schema.md`
