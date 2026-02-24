# HU-030: Generación de Certificados PDF

**Épica:** EP-008 - Gamificación y Certificados
**Sprint:** 6
**Story Points:** 8
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** obtener un certificado en PDF al completar un curso
**Para** demostrar mi logro profesionalmente

---

## Criterios de Aceptación

- [ ] **AC1:** Generación de PDF usando librería PDFKit o Puppeteer
- [ ] **AC2:** Template de certificado profesional con: logo de la plataforma, nombre del estudiante, nombre del curso completado, fecha de completitud, firma digital (imagen del instructor/admin), código único de verificación (UUID)
- [ ] **AC3:** Almacenamiento de PDF en S3/storage local con URL pública
- [ ] **AC4:** Botón "Descargar Certificado" visible en perfil del usuario
- [ ] **AC5:** Página pública de verificación /verify-certificate/:code mostrando certificado válido
- [ ] **AC6:** Watermark de seguridad en background del PDF
- [ ] **AC7:** Metadata del PDF: autor, fecha de creación, keywords
- [ ] **AC8:** Generación asíncrona con queue (Bull/BullMQ) para no bloquear
- [ ] **AC9:** Endpoint GET /api/certificates/:courseId retornando URL del certificado

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
- HU-015

**Bloqueante para:**
- HU-031

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-030: Generación de Certificados PDF', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Generación de Certificados PDF] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 6, HU-030
- Diseño de base de datos: `docs/database-schema.md`
