# HU-018: Auto-calificación de Quizzes

**Épica:** EP-005 - Sistema de Evaluaciones
**Sprint:** 4
**Story Points:** 5
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** estudiante
**Quiero** recibir mi calificación inmediatamente después de completar un quiz
**Para** saber mi nivel de comprensión sin esperar evaluación manual

---

## Criterios de Aceptación

- [ ] **AC1:** Al enviar quiz, calcular score automático: (puntos_obtenidos / puntos_totales) * 100
- [ ] **AC2:** Mostrar resultados desglosados: Score total (%), Preguntas correctas vs incorrectas, Tiempo tomado, Estado: Aprobado/Reprobado (según passingScore)
- [ ] **AC3:** Feedback por pregunta mostrando respuesta correcta vs seleccionada
- [ ] **AC4:** Guardar intento en modelo QuizAttempt con timestamp, userId, quizId, score, answers (JSON)
- [ ] **AC5:** Actualizar progreso de lección automáticamente si aprueba (score >= passingScore)
- [ ] **AC6:** Permitir reintento si attemptsAllowed > intentos actuales del usuario
- [ ] **AC7:** Mostrar intentos restantes antes de iniciar quiz
- [ ] **AC8:** Endpoint POST /api/quizzes/:id/submit con body: { answers: [{ questionId, selectedAnswerIds }] }

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
- HU-017

**Bloqueante para:**
- HU-019

---

## Tests a Implementar

### Tests Unitarios
```typescript
describe('HU-018: Auto-calificación de Quizzes', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
```

### Tests de Integración
```typescript
describe('[Auto-calificación de Quizzes] Integration Tests', () => {
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
- Backlog: `docs/backlog.md` - Sprint 4, HU-018
- Diseño de base de datos: `docs/database-schema.md`
