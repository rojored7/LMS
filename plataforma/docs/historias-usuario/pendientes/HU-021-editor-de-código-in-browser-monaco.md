# HU-021: Editor de Código In-Browser (Monaco)

**Épica:** EP-006 - Laboratorios Ejecutables
**Sprint:** 5
**Story Points:** 8
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** escribir código directamente en el navegador
**Para** practicar sin configurar mi entorno local

---

## Criterios de Aceptación

- [ ] **AC1:** Integración de Monaco Editor (mismo editor de VS Code)
- [ ] **AC2:** Soporte para lenguajes: Python, JavaScript, Bash con detección automática
- [ ] **AC3:** Syntax highlighting automático según lenguaje seleccionado
- [ ] **AC4:** Autocompletado básico con snippets estándar del lenguaje
- [ ] **AC5:** Numeración de líneas visible y clickable
- [ ] **AC6:** Tema oscuro/claro con toggle persistente en localStorage
- [ ] **AC7:** Botones de acción: Ejecutar código, Resetear a código inicial, Descargar código
- [ ] **AC8:** Tamaño del editor ajustable (resize) con drag handle
- [ ] **AC9:** Atajos de teclado: Ctrl+S para ejecutar, Ctrl+R para resetear

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
- HU-011

**Bloqueante para:**
- HU-022

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-021: Editor de Código In-Browser (Monaco)', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Editor de Código In-Browser (Monaco)] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 5, HU-021
- Diseño de base de datos: `docs/database-schema.md`
