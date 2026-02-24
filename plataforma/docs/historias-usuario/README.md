# Historias de Usuario - Plataforma Multi-Curso de Ciberseguridad

**Última actualización:** 2026-02-24
**Total de Historias:** 45
**Metodología:** Scrum (Sprints de 5 días)

---

## Índice

- [Estado General](#estado-general)
- [Organización por Sprints](#organización-por-sprints)
- [Organización por Épicas](#organización-por-épicas)
- [Lista Completa de Historias](#lista-completa-de-historias)
- [Métricas del Proyecto](#métricas-del-proyecto)
- [Guía de Uso](#guía-de-uso)

---

## Estado General

### Resumen de Progreso

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| 🔄 PENDIENTE | 45 | 100% |
| 🚧 EN PROGRESO | 0 | 0% |
| ✅ COMPLETADA | 0 | 0% |
| **TOTAL** | **45** | **100%** |

### Distribución por Prioridad

| Prioridad | Cantidad | Story Points |
|-----------|----------|--------------|
| Must Have | 20 | 112 |
| Should Have | 15 | 92 |
| Could Have | 5 | 31 |
| Wont Have (Backlog) | 10 | 160 |

---

## Organización por Sprints

### Sprint 1 - Autenticación y Autorización (21 pts)

**Duración:** Días 1-5
**Objetivo:** Sistema de autenticación seguro con roles

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-001](pendientes/HU-001-registro-usuario.md) | Registro de Usuario con Email/Password | 3 | 🔄 PENDIENTE |
| [HU-002](pendientes/HU-002-login-credenciales.md) | Login con Credenciales | 3 | 🔄 PENDIENTE |
| [HU-003](pendientes/HU-003-sistema-roles-rbac.md) | Sistema de Roles (RBAC) | 5 | 🔄 PENDIENTE |
| [HU-004](pendientes/HU-004-middleware-autenticacion.md) | Middleware de Autenticación JWT | 5 | 🔄 PENDIENTE |
| [HU-005](pendientes/HU-005-recuperacion-contrasena.md) | Recuperación de Contraseña | 5 | 🔄 PENDIENTE |

---

### Sprint 2 - Dashboard Administrativo (26 pts)

**Duración:** Días 6-10
**Objetivo:** Panel de control completo para administradores

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-006](pendientes/HU-006-lista-usuarios.md) | Vista de Lista de Usuarios (Tabla Completa) | 5 | 🔄 PENDIENTE |
| [HU-007](pendientes/HU-007-dashboard-con-estadísticas-globales.md) | Dashboard con Estadísticas Globales | 8 | 🔄 PENDIENTE |
| [HU-008](pendientes/HU-008-ver-progreso-detallado-de-un-usuario.md) | Ver Progreso Detallado de un Usuario | 5 | 🔄 PENDIENTE |
| [HU-009](pendientes/HU-009-gestión-de-perfiles-de-entrenamiento.md) | Gestión de Perfiles de Entrenamiento | 5 | 🔄 PENDIENTE |
| [HU-010](pendientes/HU-010-asignar-perfil-usuario.md) | Asignar/Modificar Perfil de Usuario | 3 | 🔄 PENDIENTE |

---

### Sprint 3 - Sistema Multi-Curso (34 pts)

**Duración:** Días 11-15
**Objetivo:** Arquitectura escalable para múltiples cursos

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-011](pendientes/HU-011-modelo-de-datos-para-múltiples-cursos.md) | Modelo de Datos para Múltiples Cursos | 8 | 🔄 PENDIENTE |
| [HU-012](pendientes/HU-012-importador-de-curso-desde-markdown.md) | Importador de Curso desde Markdown | 8 | 🔄 PENDIENTE |
| [HU-013](pendientes/HU-013-catálogo-de-cursos-filtrado-por-perfil.md) | Catálogo de Cursos Filtrado por Perfil | 5 | 🔄 PENDIENTE |
| [HU-014](pendientes/HU-014-sistema-de-inscripción-a-cursos.md) | Sistema de Inscripción a Cursos | 5 | 🔄 PENDIENTE |
| [HU-015](pendientes/HU-015-tracking-de-progreso-por-curso-y-módulo.md) | Tracking de Progreso por Curso y Módulo | 8 | 🔄 PENDIENTE |

---

### Sprint 4 - Contenido Educativo y Quizzes (29 pts)

**Duración:** Días 16-20
**Objetivo:** Visualización de contenido y sistema de evaluaciones

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-016](pendientes/HU-016-visor-de-lecciones-con-markdown-rendering.md) | Visor de Lecciones con Markdown Rendering | 5 | 🔄 PENDIENTE |
| [HU-017](pendientes/HU-017-sistema-quizzes.md) | Sistema de Quizzes (Multiple Choice, True/False) | 8 | 🔄 PENDIENTE |
| [HU-018](pendientes/HU-018-auto-calificación-de-quizzes.md) | Auto-calificación de Quizzes | 5 | 🔄 PENDIENTE |
| [HU-019](pendientes/HU-019-historial-de-intentos-de-quiz.md) | Historial de Intentos de Quiz | 3 | 🔄 PENDIENTE |
| [HU-020](pendientes/HU-020-navegación-por-módulos-y-lecciones.md) | Navegación por Módulos y Lecciones | 5 | 🔄 PENDIENTE |
| [HU-023](pendientes/HU-023-soporte-para-multimedia-embebido.md) | Soporte para Multimedia Embebido | 3 | 🔄 PENDIENTE |

---

### Sprint 5 - Laboratorios Ejecutables (42 pts)

**Duración:** Días 21-25
**Objetivo:** Sistema de laboratorios prácticos con ejecución de código

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-021](pendientes/HU-021-editor-de-código-in-browser-monaco.md) | Editor de Código In-Browser (Monaco) | 8 | 🔄 PENDIENTE |
| [HU-022](pendientes/HU-022-servicio-de-ejecución-de-código-sandbox-docker.md) | Servicio de Ejecución de Código (Sandbox Docker) | 13 | 🔄 PENDIENTE |
| [HU-024](pendientes/HU-024-validación-automática-de-labs.md) | Validación Automática de Labs | 8 | 🔄 PENDIENTE |
| [HU-025](pendientes/HU-025-terminal-output-simulation.md) | Terminal Output Simulation | 5 | 🔄 PENDIENTE |
| [HU-026](pendientes/HU-026-soporte-multi-lenguaje-python,-bash,-node.md) | Soporte Multi-Lenguaje (Python, Bash, Node) | 8 | 🔄 PENDIENTE |

---

### Sprint 6 - Proyectos y Gamificación (52 pts)

**Duración:** Días 26-30
**Objetivo:** Completar MVP con evaluación de proyectos y elementos de gamificación

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-027](pendientes/HU-027-sistema-de-entrega-de-proyectos-finales.md) | Sistema de Entrega de Proyectos Finales | 8 | 🔄 PENDIENTE |
| [HU-028](pendientes/HU-028-interfaz-de-evaluación-manual-instructores.md) | Interfaz de Evaluación Manual (Instructores) | 8 | 🔄 PENDIENTE |
| [HU-029](pendientes/HU-029-sistema-de-badges-por-módulo.md) | Sistema de Badges por Módulo | 5 | 🔄 PENDIENTE |
| [HU-030](pendientes/HU-030-generación-de-certificados-pdf.md) | Generación de Certificados PDF | 8 | 🔄 PENDIENTE |
| [HU-031](pendientes/HU-031-envío-de-certificado-por-email.md) | Envío de Certificado por Email | 3 | 🔄 PENDIENTE |
| [HU-032](pendientes/HU-032-rúbricas-de-calificación.md) | Rúbricas de Calificación | 5 | 🔄 PENDIENTE |
| [HU-033](pendientes/HU-033-gamificación---sistema-de-puntos-xp.md) | Gamificación - Sistema de Puntos (XP) | 5 | 🔄 PENDIENTE |
| [HU-034](pendientes/HU-034-perfil-público-de-usuario.md) | Perfil Público de Usuario | 5 | 🔄 PENDIENTE |
| [HU-035](pendientes/HU-035-notificaciones-in-app.md) | Notificaciones In-App | 5 | 🔄 PENDIENTE |

---

### Backlog Futuro (10 historias - 160 pts)

**Objetivo:** Mejoras y features avanzadas post-MVP

| ID | Historia | Puntos | Estado |
|----|----------|--------|--------|
| [HU-036](pendientes/HU-036-soporte-multi-idioma-i18n.md) | Soporte Multi-Idioma (i18n) | 13 | 🔄 PENDIENTE |
| [HU-037](pendientes/HU-037-modo-oscuro-claro.md) | Modo Oscuro/Claro Personalizable | 3 | 🔄 PENDIENTE |
| [HU-038](pendientes/HU-038-analytics-avanzados-para-instructores.md) | Analytics Avanzados para Instructores | 13 | 🔄 PENDIENTE |
| [HU-039](pendientes/HU-039-exportar-progreso-de-estudiante.md) | Exportar Progreso de Estudiante | 5 | 🔄 PENDIENTE |
| [HU-040](pendientes/HU-040-integración-scorm.md) | Integración SCORM | 21 | 🔄 PENDIENTE |
| [HU-041](pendientes/HU-041-pwa---modo-offline.md) | PWA - Modo Offline | 13 | 🔄 PENDIENTE |
| [HU-042](pendientes/HU-042-chat-de-soporte-en-vivo.md) | Chat de Soporte en Vivo | 21 | 🔄 PENDIENTE |
| [HU-043](pendientes/HU-043-foros-de-discusión-por-curso.md) | Foros de Discusión por Curso | 13 | 🔄 PENDIENTE |
| [HU-044](pendientes/HU-044-peer-review-de-proyectos.md) | Peer Review de Proyectos | 13 | 🔄 PENDIENTE |
| [HU-045](pendientes/HU-045-leaderboard-global.md) | Leaderboard Global | 5 | 🔄 PENDIENTE |

---

## Organización por Épicas

### EP-001: Autenticación y Autorización (21 pts)

Sistema completo de autenticación con JWT, roles y recuperación de contraseña.

**Historias:** HU-001, HU-002, HU-003, HU-004, HU-005

---

### EP-002: Dashboard Administrativo (26 pts)

Panel de control para administradores con gestión de usuarios, estadísticas y perfiles.

**Historias:** HU-006, HU-007, HU-008, HU-009, HU-010

---

### EP-003: Sistema Multi-Curso (34 pts)

Arquitectura escalable para soportar múltiples cursos con tracking de progreso.

**Historias:** HU-011, HU-012, HU-013, HU-014, HU-015

---

### EP-004: Visualización de Contenido Educativo (13 pts)

Sistema de visualización de lecciones con markdown, navegación y multimedia.

**Historias:** HU-016, HU-020, HU-023

---

### EP-005: Sistema de Evaluaciones (16 pts)

Quizzes auto-calificados con diferentes tipos de preguntas.

**Historias:** HU-017, HU-018, HU-019

---

### EP-006: Laboratorios Ejecutables (42 pts)

Editor de código in-browser con ejecución en sandbox Docker aislado.

**Historias:** HU-021, HU-022, HU-024, HU-025, HU-026

---

### EP-007: Proyectos y Evaluación Manual (21 pts)

Sistema de entrega de proyectos con evaluación manual por instructores.

**Historias:** HU-027, HU-028, HU-032

---

### EP-008: Gamificación y Certificados (31 pts)

Badges, certificados PDF, XP y perfiles públicos para motivar estudiantes.

**Historias:** HU-029, HU-030, HU-031, HU-033, HU-034, HU-035, HU-036

---

## Lista Completa de Historias

### Índice Alfabético

- [HU-001: Registro de Usuario con Email/Password](pendientes/HU-001-registro-usuario.md) - 3 pts
- [HU-002: Login con Credenciales](pendientes/HU-002-login-credenciales.md) - 3 pts
- [HU-003: Sistema de Roles (RBAC)](pendientes/HU-003-sistema-roles-rbac.md) - 5 pts
- [HU-004: Middleware de Autenticación JWT](pendientes/HU-004-middleware-autenticacion.md) - 5 pts
- [HU-005: Recuperación de Contraseña](pendientes/HU-005-recuperacion-contrasena.md) - 5 pts
- [HU-006: Vista de Lista de Usuarios](pendientes/HU-006-lista-usuarios.md) - 5 pts
- [HU-007: Dashboard con Estadísticas Globales](pendientes/HU-007-dashboard-con-estadísticas-globales.md) - 8 pts
- [HU-008: Ver Progreso Detallado de un Usuario](pendientes/HU-008-ver-progreso-detallado-de-un-usuario.md) - 5 pts
- [HU-009: Gestión de Perfiles de Entrenamiento](pendientes/HU-009-gestión-de-perfiles-de-entrenamiento.md) - 5 pts
- [HU-010: Asignar/Modificar Perfil de Usuario](pendientes/HU-010-asignar-perfil-usuario.md) - 3 pts
- [HU-011: Modelo de Datos para Múltiples Cursos](pendientes/HU-011-modelo-de-datos-para-múltiples-cursos.md) - 8 pts
- [HU-012: Importador de Curso desde Markdown](pendientes/HU-012-importador-de-curso-desde-markdown.md) - 8 pts
- [HU-013: Catálogo de Cursos Filtrado por Perfil](pendientes/HU-013-catálogo-de-cursos-filtrado-por-perfil.md) - 5 pts
- [HU-014: Sistema de Inscripción a Cursos](pendientes/HU-014-sistema-de-inscripción-a-cursos.md) - 5 pts
- [HU-015: Tracking de Progreso por Curso y Módulo](pendientes/HU-015-tracking-de-progreso-por-curso-y-módulo.md) - 8 pts
- [HU-016: Visor de Lecciones con Markdown Rendering](pendientes/HU-016-visor-de-lecciones-con-markdown-rendering.md) - 5 pts
- [HU-017: Sistema de Quizzes](pendientes/HU-017-sistema-quizzes.md) - 8 pts
- [HU-018: Auto-calificación de Quizzes](pendientes/HU-018-auto-calificación-de-quizzes.md) - 5 pts
- [HU-019: Historial de Intentos de Quiz](pendientes/HU-019-historial-de-intentos-de-quiz.md) - 3 pts
- [HU-020: Navegación por Módulos y Lecciones](pendientes/HU-020-navegación-por-módulos-y-lecciones.md) - 5 pts
- [HU-021: Editor de Código In-Browser (Monaco)](pendientes/HU-021-editor-de-código-in-browser-monaco.md) - 8 pts
- [HU-022: Servicio de Ejecución de Código (Sandbox Docker)](pendientes/HU-022-servicio-de-ejecución-de-código-sandbox-docker.md) - 13 pts
- [HU-023: Soporte para Multimedia Embebido](pendientes/HU-023-soporte-para-multimedia-embebido.md) - 3 pts
- [HU-024: Validación Automática de Labs](pendientes/HU-024-validación-automática-de-labs.md) - 8 pts
- [HU-025: Terminal Output Simulation](pendientes/HU-025-terminal-output-simulation.md) - 5 pts
- [HU-026: Soporte Multi-Lenguaje (Python, Bash, Node)](pendientes/HU-026-soporte-multi-lenguaje-python,-bash,-node.md) - 8 pts
- [HU-027: Sistema de Entrega de Proyectos Finales](pendientes/HU-027-sistema-de-entrega-de-proyectos-finales.md) - 8 pts
- [HU-028: Interfaz de Evaluación Manual (Instructores)](pendientes/HU-028-interfaz-de-evaluación-manual-instructores.md) - 8 pts
- [HU-029: Sistema de Badges por Módulo](pendientes/HU-029-sistema-de-badges-por-módulo.md) - 5 pts
- [HU-030: Generación de Certificados PDF](pendientes/HU-030-generación-de-certificados-pdf.md) - 8 pts
- [HU-031: Envío de Certificado por Email](pendientes/HU-031-envío-de-certificado-por-email.md) - 3 pts
- [HU-032: Rúbricas de Calificación](pendientes/HU-032-rúbricas-de-calificación.md) - 5 pts
- [HU-033: Gamificación - Sistema de Puntos (XP)](pendientes/HU-033-gamificación---sistema-de-puntos-xp.md) - 5 pts
- [HU-034: Perfil Público de Usuario](pendientes/HU-034-perfil-público-de-usuario.md) - 5 pts
- [HU-035: Notificaciones In-App](pendientes/HU-035-notificaciones-in-app.md) - 5 pts
- [HU-036: Soporte Multi-Idioma (i18n)](pendientes/HU-036-soporte-multi-idioma-i18n.md) - 13 pts
- [HU-037: Modo Oscuro/Claro Personalizable](pendientes/HU-037-modo-oscuro-claro.md) - 3 pts
- [HU-038: Analytics Avanzados para Instructores](pendientes/HU-038-analytics-avanzados-para-instructores.md) - 13 pts
- [HU-039: Exportar Progreso de Estudiante](pendientes/HU-039-exportar-progreso-de-estudiante.md) - 5 pts
- [HU-040: Integración SCORM](pendientes/HU-040-integración-scorm.md) - 21 pts
- [HU-041: PWA - Modo Offline](pendientes/HU-041-pwa---modo-offline.md) - 13 pts
- [HU-042: Chat de Soporte en Vivo](pendientes/HU-042-chat-de-soporte-en-vivo.md) - 21 pts
- [HU-043: Foros de Discusión por Curso](pendientes/HU-043-foros-de-discusión-por-curso.md) - 13 pts
- [HU-044: Peer Review de Proyectos](pendientes/HU-044-peer-review-de-proyectos.md) - 13 pts
- [HU-045: Leaderboard Global](pendientes/HU-045-leaderboard-global.md) - 5 pts

---

## Métricas del Proyecto

### Story Points por Sprint

```
Sprint 1: ████████ 21 pts
Sprint 2: ██████████ 26 pts
Sprint 3: █████████████ 34 pts
Sprint 4: ███████████ 29 pts
Sprint 5: ████████████████ 42 pts
Sprint 6: ████████████████████ 52 pts
Backlog:  ████████████████████████████████ 160 pts

Total MVP (Sprints 1-6): 204 pts
Total General: 364 pts
```

### Velocity Estimado

- **Velocity Promedio Esperado:** 34 puntos/sprint
- **Duración MVP:** 6 sprints (30 días hábiles)
- **Fecha Estimada de Finalización MVP:** 2026-03-26

### Distribución de Complejidad

| Complejidad | Cantidad | % del Total |
|-------------|----------|-------------|
| Pequeña (1-3 pts) | 12 | 27% |
| Media (5-8 pts) | 25 | 56% |
| Grande (13+ pts) | 8 | 17% |

---

## Guía de Uso

### Estructura de Cada Historia

Cada archivo de historia de usuario contiene:

1. **Encabezado:** ID, título, épica, sprint, story points, prioridad, estado
2. **Historia de Usuario:** Formato: Como [rol], Quiero [funcionalidad], Para [beneficio]
3. **Criterios de Aceptación:** Lista específica y testeable (AC1-ACn)
4. **Definición de Hecho (DoD):** Checklist de completitud
5. **Detalles Técnicos:**
   - Backend: endpoints, modelos, servicios, middlewares
   - Frontend: componentes, páginas, hooks, estado
   - Base de Datos: migraciones, seeders
6. **Dependencias:** Qué historias bloquean/son bloqueadas por esta
7. **Tests a Implementar:** Ejemplos de tests unitarios e integración
8. **Notas Adicionales:** Seguridad, UX/UI, Performance
9. **Referencias:** Links a documentación relacionada

### Proceso de Trabajo

#### 1. Seleccionar Historia

```bash
# Navegar a carpeta pendientes
cd docs/historias-usuario/pendientes

# Leer historia asignada
cat HU-XXX-nombre-historia.md
```

#### 2. Mover a En Progreso

```bash
# Al iniciar desarrollo
mv pendientes/HU-XXX-nombre-historia.md en-progreso/
```

#### 3. Actualizar Estado

Editar el encabezado del archivo:
```markdown
**Estado:** 🚧 EN PROGRESO
```

#### 4. Completar Historia

Una vez cumplidos todos los criterios de aceptación:

```bash
# Mover a completadas
mv en-progreso/HU-XXX-nombre-historia.md completadas/
```

Actualizar estado en archivo:
```markdown
**Estado:** ✅ COMPLETADA
**Fecha de Completitud:** 2026-XX-XX
```

### Comandos Útiles

```bash
# Listar historias pendientes
ls pendientes/ | wc -l

# Buscar historia por keyword
grep -r "dashboard" pendientes/

# Ver todas las historias de un sprint
grep -l "Sprint: 1" pendientes/*.md

# Contar story points pendientes
grep -h "Story Points:" pendientes/*.md | awk '{sum+=$3} END {print sum}'

# Generar reporte de progreso
./scripts/generar-reporte-progreso.sh
```

### Integración con Herramientas

#### GitHub Issues

Crear issues desde historias de usuario:

```bash
# Script para crear issues automáticamente
./scripts/crear-github-issues.sh
```

#### Jira/Linear

Importar historias:

```bash
# Exportar a formato JSON compatible
./scripts/exportar-a-jira.sh
```

---

## Recursos Adicionales

### Documentos Relacionados

- **Backlog Completo:** `docs/backlog.md`
- **Arquitectura Técnica:** `docs/arquitectura.md`
- **Modelo de Datos:** `docs/database-schema.md`
- **API Documentation:** `docs/api/`
- **Testing Strategy:** `docs/testing-strategy.md`

### Plantillas

- **Plantilla de Historia de Usuario:** `templates/historia-usuario-template.md`
- **Plantilla de Bug Report:** `templates/bug-report-template.md`
- **Plantilla de Spike:** `templates/spike-template.md`

---

## Changelog

### 2026-02-24 - Creación Inicial

- ✅ Creadas 45 historias de usuario completas
- ✅ Organizadas por sprints y épicas
- ✅ Definidos criterios de aceptación y DoD
- ✅ Incluidos detalles técnicos y tests
- ✅ Establecidas dependencias entre historias

---

## Contacto y Soporte

**Product Owner:** Equipo de Desarrollo
**Scrum Master:** TBD
**Equipo de Desarrollo:** TBD

Para preguntas o clarificaciones sobre historias de usuario, contactar al Product Owner o crear un issue en el repositorio.

---

**Última sincronización con backlog:** 2026-02-24
**Próxima revisión:** 2026-03-10 (Post Sprint 3)
