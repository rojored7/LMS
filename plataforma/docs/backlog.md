# Backlog de Producto - Plataforma Multi-Curso de Ciberseguridad

**Versión:** 1.0
**Fecha de creación:** 2026-02-24
**Product Owner:** Equipo de Desarrollo
**Metodología:** Scrum (Sprints de 5 días)
**Timeline:** 6 sprints (30 días hábiles)

---

## 1. INFORMACIÓN GENERAL

### 1.1 Visión del Producto

Desarrollar una **plataforma educativa multi-curso especializada en ciberseguridad** que permita a organizaciones crear perfiles de entrenamiento personalizados, gestionar múltiples cursos modulares, y proporcionar experiencias de aprendizaje interactivas mediante quizzes auto-calificados, laboratorios ejecutables y proyectos evaluables. La plataforma facilitará la administración centralizada, seguimiento de progreso y certificación de estudiantes.

### 1.2 Objetivos del Proyecto

| ID | Objetivo | Medible | Plazo |
|----|----------|---------|-------|
| OBJ-01 | Sistema de autenticación seguro con roles (Admin, Instructor, Student) | 100% de usuarios pueden autenticarse | Sprint 1 |
| OBJ-02 | Dashboard administrativo completo con gestión de usuarios y perfiles | Panel funcional con todas las métricas | Sprint 2 |
| OBJ-03 | Soporte para múltiples cursos con tracking independiente | Mínimo 3 cursos simultáneos | Sprint 3 |
| OBJ-04 | Sistema de evaluaciones automáticas (quizzes) | 80% de auto-calificación | Sprint 4 |
| OBJ-05 | Laboratorios ejecutables en sandbox seguro | Ejecución de Python/Bash/Node | Sprint 5 |
| OBJ-06 | Certificación y gamificación | Generación automática de PDFs | Sprint 6 |

### 1.3 Definición de "Hecho" (Definition of Done - DoD)

Una historia de usuario se considera **HECHA** cuando:

- [ ] Código implementado y revisado (code review)
- [ ] Tests unitarios escritos con cobertura mínima del 70%
- [ ] Tests de integración para endpoints API (si aplica)
- [ ] Documentación técnica actualizada (JSDoc/Swagger)
- [ ] UI/UX validada con criterios de accesibilidad (WCAG AA)
- [ ] Sin bugs críticos o bloqueantes
- [ ] Desplegado en entorno de staging
- [ ] Validado por el Product Owner
- [ ] Documentación de usuario actualizada (si aplica)

### 1.4 Criterios de Aceptación Generales

**Todos los desarrollos deben cumplir:**

1. **Seguridad:**
   - Autenticación JWT con expiración
   - Validación de entrada en backend (sanitización)
   - HTTPS obligatorio en producción
   - CORS configurado correctamente

2. **Performance:**
   - Tiempo de carga inicial < 3 segundos
   - API response time < 500ms (95th percentile)
   - Optimización de imágenes y assets

3. **Usabilidad:**
   - Responsive design (mobile-first)
   - Navegación intuitiva (máximo 3 clicks a cualquier función)
   - Mensajes de error claros y accionables

4. **Calidad de Código:**
   - ESLint/Prettier configurado
   - Sin code smells críticos (SonarQube)
   - Commits atómicos y descriptivos

---

## 2. ÉPICAS

### ÉPICA 1: Autenticación y Autorización
**ID:** EP-001
**Prioridad:** MUST HAVE
**Valor de Negocio:** CRÍTICO
**Story Points Totales:** 21

**Descripción:**
Implementar un sistema de autenticación robusto con JWT que soporte tres roles (Admin, Instructor, Student), incluyendo registro, login, recuperación de contraseña y middleware de autorización para proteger rutas según permisos.

**Criterios de Éxito:**
- 100% de usuarios pueden registrarse y autenticarse
- Roles correctamente implementados con restricciones
- Tokens JWT con refresh automático
- Recuperación de contraseña funcional vía email

**Historias Asociadas:** HU-001, HU-002, HU-003, HU-004, HU-005

---

### ÉPICA 2: Dashboard Administrativo
**ID:** EP-002
**Prioridad:** MUST HAVE
**Valor de Negocio:** ALTO
**Story Points Totales:** 26

**Descripción:**
Desarrollar un dashboard completo para administradores que permita gestionar usuarios, visualizar estadísticas globales, asignar perfiles de entrenamiento y monitorear el progreso individual de estudiantes.

**Criterios de Éxito:**
- Panel de control con métricas en tiempo real
- CRUD completo de usuarios
- Sistema de perfiles de entrenamiento configurable
- Exportación de reportes en CSV/PDF

**Historias Asociadas:** HU-006, HU-007, HU-008, HU-009, HU-010

---

### ÉPICA 3: Sistema Multi-Curso
**ID:** EP-003
**Prioridad:** MUST HAVE
**Valor de Negocio:** CRÍTICO
**Story Points Totales:** 34

**Descripción:**
Implementar la arquitectura para soportar múltiples cursos simultáneos con estructura modular (módulos > lecciones > contenido), sistema de inscripción, catálogo filtrado por perfil y tracking independiente de progreso.

**Criterios de Éxito:**
- Modelo de datos escalable para N cursos
- Importador de cursos desde markdown
- Estudiantes pueden inscribirse a múltiples cursos
- Tracking de progreso por curso con persistencia

**Historias Asociadas:** HU-011, HU-012, HU-013, HU-014, HU-015

---

### ÉPICA 4: Visualización de Contenido Educativo
**ID:** EP-004
**Prioridad:** MUST HAVE
**Valor de Negocio:** ALTO
**Story Points Totales:** 29

**Descripción:**
Desarrollar el sistema de visualización de lecciones con soporte para markdown, código con syntax highlighting, navegación entre módulos y lecciones, y marcado de lecciones completadas.

**Criterios de Éxito:**
- Renderizado de markdown con seguridad (sanitización)
- Navegación fluida entre contenido
- Persistencia del estado de progreso
- Soporte para multimedia embebido

**Historias Asociadas:** HU-016, HU-017, HU-020, HU-023

---

### ÉPICA 5: Sistema de Evaluaciones (Quizzes)
**ID:** EP-005
**Prioridad:** SHOULD HAVE
**Valor de Negocio:** ALTO
**Story Points Totales:** 26

**Descripción:**
Implementar sistema de quizzes auto-calificados con soporte para preguntas de opción múltiple, verdadero/falso, respuesta corta, incluyendo intentos múltiples, historial y feedback inmediato.

**Criterios de Éxito:**
- Auto-calificación con 95% de precisión
- Historial de intentos persistente
- Feedback inmediato post-quiz
- Estadísticas de desempeño por estudiante

**Historias Asociadas:** HU-018, HU-019, HU-024, HU-025

---

### ÉPICA 6: Laboratorios Ejecutables
**ID:** EP-006
**Prioridad:** SHOULD HAVE
**Valor de Negocio:** MUY ALTO
**Story Points Totales:** 42

**Descripción:**
Desarrollar sistema de laboratorios prácticos con editor de código in-browser (Monaco Editor), servicio de ejecución en sandbox Docker, validación automática de resultados y soporte para Python, Bash y Node.js.

**Criterios de Éxito:**
- Editor funcional con autocompletado
- Ejecución segura en contenedores aislados
- Timeout de 30 segundos por ejecución
- Validación automática con test cases

**Historias Asociadas:** HU-021, HU-022, HU-026, HU-027, HU-028

---

### ÉPICA 7: Proyectos y Evaluación Manual
**ID:** EP-007
**Prioridad:** SHOULD HAVE
**Valor de Negocio:** MEDIO
**Story Points Totales:** 21

**Descripción:**
Implementar sistema de entrega de proyectos finales con upload de archivos, interfaz de evaluación manual para instructores, rúbricas de calificación y feedback detallado.

**Criterios de Éxito:**
- Upload de archivos (max 50MB)
- Interfaz de evaluación con rúbricas
- Notificaciones de calificación
- Historial de entregas

**Historias Asociadas:** HU-029, HU-030, HU-031, HU-032

---

### ÉPICA 8: Gamificación y Certificados
**ID:** EP-008
**Prioridad:** COULD HAVE
**Valor de Negocio:** MEDIO
**Story Points Totales:** 21

**Descripción:**
Implementar sistema de badges/insignias por logros, generación automática de certificados PDF personalizados, galería de logros y envío de certificados vía email.

**Criterios de Éxito:**
- Sistema de badges con 10+ insignias
- Generación de PDF con datos dinámicos
- Envío automático de email con certificado
- Galería pública de logros (opcional)

**Historias Asociadas:** HU-033, HU-034, HU-035, HU-036

---

## 3. HISTORIAS DE USUARIO

### SPRINT 1 - AUTENTICACIÓN Y AUTORIZACIÓN (21 pts)

#### HU-001: Registro de Usuario con Email/Password
**ID:** HU-001
**Épica:** EP-001
**Prioridad:** MUST HAVE
**Story Points:** 3
**Sprint:** 1
**Estado:** Pendiente

**Historia:**
Como **usuario nuevo**, quiero **registrarme en la plataforma con mi email y contraseña**, para **poder acceder a los cursos disponibles**.

**Criterios de Aceptación:**
- [ ] Formulario de registro con campos: nombre, email, password, confirmación de password
- [ ] Validación de email único en base de datos
- [ ] Contraseña con requisitos mínimos: 8 caracteres, 1 mayúscula, 1 número
- [ ] Hash de contraseña con bcrypt (salt rounds: 10)
- [ ] Mensaje de confirmación tras registro exitoso
- [ ] Validación de campos en frontend y backend
- [ ] Redirección automática a login tras registro

**Dependencias:** Ninguna

---

#### HU-002: Login con Credenciales
**ID:** HU-002
**Épica:** EP-001
**Prioridad:** MUST HAVE
**Story Points:** 3
**Sprint:** 1
**Estado:** Pendiente

**Historia:**
Como **usuario registrado**, quiero **iniciar sesión con mi email y contraseña**, para **acceder a mi perfil y cursos**.

**Criterios de Aceptación:**
- [ ] Formulario de login con email y password
- [ ] Validación de credenciales contra base de datos
- [ ] Generación de JWT token con expiración de 24h
- [ ] Almacenamiento seguro de token en localStorage/httpOnly cookie
- [ ] Redirección según rol: Admin → dashboard, Student → cursos
- [ ] Mensaje de error claro si credenciales inválidas
- [ ] Throttling de intentos (máximo 5 intentos cada 15 minutos)

**Dependencias:** HU-001

---

#### HU-003: Sistema de Roles (RBAC)
**ID:** HU-003
**Épica:** EP-001
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 1
**Estado:** Pendiente

**Historia:**
Como **administrador del sistema**, quiero **que los usuarios tengan roles diferenciados (Admin, Instructor, Student)**, para **controlar el acceso a funcionalidades según permisos**.

**Criterios de Aceptación:**
- [ ] Modelo de usuario con campo `role` (enum: admin, instructor, student)
- [ ] Middleware de autorización que verifica rol en JWT
- [ ] Rutas protegidas por rol:
  - Admin: todas las rutas
  - Instructor: gestión de evaluaciones, visualización de estudiantes
  - Student: solo cursos y perfil personal
- [ ] Interfaz diferenciada según rol (navbar adaptativo)
- [ ] Tests de permisos para cada rol
- [ ] Página 403 (Forbidden) para accesos no autorizados

**Dependencias:** HU-002

---

#### HU-004: Middleware de Autenticación JWT
**ID:** HU-004
**Épica:** EP-001
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 1
**Estado:** Pendiente

**Historia:**
Como **desarrollador**, quiero **implementar un middleware que valide tokens JWT en todas las rutas protegidas**, para **asegurar que solo usuarios autenticados accedan a recursos**.

**Criterios de Aceptación:**
- [ ] Middleware `authMiddleware` que extrae y verifica JWT
- [ ] Validación de firma y expiración del token
- [ ] Extracción de datos del usuario (id, email, role) en `req.user`
- [ ] Respuesta 401 (Unauthorized) si token inválido o expirado
- [ ] Implementación de refresh token con expiración de 7 días
- [ ] Endpoint `/auth/refresh` para renovar token
- [ ] Blacklist de tokens revocados (logout)

**Dependencias:** HU-002

---

#### HU-005: Recuperación de Contraseña
**ID:** HU-005
**Épica:** EP-001
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 1
**Estado:** Pendiente

**Historia:**
Como **usuario registrado**, quiero **poder recuperar mi contraseña si la olvido**, para **volver a acceder a mi cuenta**.

**Criterios de Aceptación:**
- [ ] Formulario de "Olvidé mi contraseña" con campo email
- [ ] Generación de token de reseteo con expiración de 1 hora
- [ ] Envío de email con link de recuperación
- [ ] Página de reseteo de contraseña (accesible solo con token válido)
- [ ] Validación de nueva contraseña (mismos requisitos de registro)
- [ ] Invalidación del token tras uso exitoso
- [ ] Mensaje de confirmación tras cambio de contraseña

**Dependencias:** HU-001, HU-002

---

### SPRINT 2 - DASHBOARD ADMINISTRATIVO (26 pts)

#### HU-006: Vista de Lista de Usuarios (Tabla Completa)
**ID:** HU-006
**Épica:** EP-002
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 2
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **ver una tabla completa de todos los usuarios registrados**, para **gestionar la plataforma eficientemente**.

**Criterios de Aceptación:**
- [ ] Tabla con columnas: ID, Nombre, Email, Rol, Perfil, Fecha de Registro, Estado
- [ ] Paginación (20 usuarios por página)
- [ ] Filtros por: rol, perfil, estado (activo/inactivo)
- [ ] Búsqueda por nombre o email (búsqueda fuzzy)
- [ ] Ordenamiento por cualquier columna (ASC/DESC)
- [ ] Acciones rápidas: Ver detalles, Editar, Desactivar/Activar
- [ ] Indicador visual de estado (badge colorido)

**Dependencias:** HU-003 (roles)

---

#### HU-007: Dashboard con Estadísticas Globales
**ID:** HU-007
**Épica:** EP-002
**Prioridad:** MUST HAVE
**Story Points:** 8
**Sprint:** 2
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **ver un dashboard con métricas clave de la plataforma**, para **tomar decisiones informadas**.

**Criterios de Aceptación:**
- [ ] KPIs principales:
  - Total de usuarios (activos/inactivos)
  - Total de cursos publicados
  - Tasa de completitud promedio
  - Usuarios activos en últimos 7 días
- [ ] Gráfico de registros por semana (últimos 3 meses)
- [ ] Gráfico de cursos más populares (top 5)
- [ ] Distribución de usuarios por perfil (pie chart)
- [ ] Tabla de actividad reciente (últimos 10 eventos)
- [ ] Actualización de datos cada 5 minutos (polling o websocket)
- [ ] Opción de exportar estadísticas (CSV)

**Dependencias:** HU-006

---

#### HU-008: Ver Progreso Detallado de un Usuario
**ID:** HU-008
**Épica:** EP-002
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 2
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **ver el progreso detallado de un estudiante específico**, para **identificar necesidades de soporte**.

**Criterios de Aceptación:**
- [ ] Modal o página de detalles de usuario con:
  - Información personal (nombre, email, perfil, fecha de registro)
  - Cursos inscritos con % de completitud
  - Badges obtenidos
  - Historial de quizzes (score promedio)
  - Laboratorios completados
  - Proyectos entregados y calificaciones
- [ ] Línea de tiempo de actividad (últimas 30 acciones)
- [ ] Gráfico de progreso por módulo (bar chart)
- [ ] Botón para enviar mensaje directo (futuro)

**Dependencias:** HU-006, HU-015 (tracking)

---

#### HU-009: Gestión de Perfiles de Entrenamiento
**ID:** HU-009
**Épica:** EP-002
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 2
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **crear y gestionar perfiles de entrenamiento personalizados**, para **agrupar cursos según necesidades organizacionales**.

**Criterios de Aceptación:**
- [ ] CRUD de perfiles con campos:
  - Nombre del perfil (ej: "SOC Analyst", "Pentester Junior")
  - Descripción
  - Cursos incluidos (selección múltiple)
  - Duración estimada (horas)
  - Estado (activo/inactivo)
- [ ] Interfaz de creación con drag & drop de cursos
- [ ] Validación de nombre único
- [ ] Confirmación antes de eliminar perfil
- [ ] Vista de perfiles en tarjetas (cards) con información resumida

**Dependencias:** HU-011 (modelo de cursos)

---

#### HU-010: Asignar/Modificar Perfil de Usuario
**ID:** HU-010
**Épica:** EP-002
**Prioridad:** MUST HAVE
**Story Points:** 3
**Sprint:** 2
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **asignar o modificar el perfil de entrenamiento de un usuario**, para **personalizar su ruta de aprendizaje**.

**Criterios de Aceptación:**
- [ ] Desde la tabla de usuarios (HU-006), opción "Asignar Perfil"
- [ ] Dropdown con lista de perfiles disponibles
- [ ] Al asignar perfil, auto-inscribir al usuario en los cursos del perfil
- [ ] Confirmación visual de cambio exitoso
- [ ] Notificación por email al usuario del nuevo perfil asignado
- [ ] Historial de cambios de perfil (auditoría)

**Dependencias:** HU-006, HU-009

---

### SPRINT 3 - SISTEMA MULTI-CURSO (34 pts)

#### HU-011: Modelo de Datos para Múltiples Cursos
**ID:** HU-011
**Épica:** EP-003
**Prioridad:** MUST HAVE
**Story Points:** 8
**Sprint:** 3
**Estado:** Pendiente

**Historia:**
Como **desarrollador**, quiero **diseñar un modelo de datos escalable para soportar múltiples cursos**, para **permitir el crecimiento de la plataforma**.

**Criterios de Aceptación:**
- [ ] Esquema de base de datos con entidades:
  - **Course:** id, title, description, slug, duration, difficulty, imageUrl, createdAt
  - **Module:** id, courseId, title, order, description
  - **Lesson:** id, moduleId, title, order, type (video, text, quiz, lab), content (markdown o JSON)
  - **UserCourseEnrollment:** userId, courseId, enrolledAt, progress (%), completedAt
  - **UserLessonProgress:** userId, lessonId, completed, completedAt, attempts
- [ ] Relaciones definidas con foreign keys
- [ ] Índices en campos frecuentemente consultados (slug, userId, courseId)
- [ ] Migrations con Sequelize/Prisma
- [ ] Seeds con datos de ejemplo (3 cursos mínimo)

**Dependencias:** Ninguna (Sprint 3 inicial)

---

#### HU-012: Importador de Curso desde Markdown
**ID:** HU-012
**Épica:** EP-003
**Prioridad:** MUST HAVE
**Story Points:** 8
**Sprint:** 3
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **importar un curso completo desde archivos markdown estructurados**, para **acelerar la creación de contenido**.

**Criterios de Aceptación:**
- [ ] Endpoint `/api/admin/courses/import` (POST multipart/form-data)
- [ ] Aceptar ZIP con estructura:
  ```
  course-name/
    course.json (metadata)
    modules/
      01-module-name/
        lessons/
          01-lesson.md
          02-quiz.json
          03-lab.md
  ```
- [ ] Parser de markdown con frontmatter (título, orden, tipo)
- [ ] Validación de estructura antes de importar
- [ ] Preview de curso antes de confirmar importación
- [ ] Creación automática de Course, Modules, Lessons en DB
- [ ] Manejo de errores con rollback si falla

**Dependencias:** HU-011

---

#### HU-013: Catálogo de Cursos Filtrado por Perfil
**ID:** HU-013
**Épica:** EP-003
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 3
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **ver un catálogo de cursos filtrado según mi perfil asignado**, para **enfocarme en contenido relevante**.

**Criterios de Aceptación:**
- [ ] Página `/courses` con grid de tarjetas de cursos
- [ ] Cada tarjeta muestra: imagen, título, descripción corta, duración, dificultad
- [ ] Filtrado automático si el usuario tiene perfil asignado
- [ ] Filtros manuales: dificultad (básico, intermedio, avanzado), duración
- [ ] Búsqueda por nombre de curso
- [ ] Indicador visual de cursos en los que ya está inscrito
- [ ] Click en tarjeta lleva a página de detalles del curso

**Dependencias:** HU-011, HU-009 (perfiles)

---

#### HU-014: Sistema de Inscripción a Cursos
**ID:** HU-014
**Épica:** EP-003
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 3
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **inscribirme en un curso con un solo click**, para **comenzar mi aprendizaje**.

**Criterios de Aceptación:**
- [ ] Botón "Inscribirse" en página de detalles de curso
- [ ] Creación de registro en `UserCourseEnrollment`
- [ ] Verificación de que el usuario no esté ya inscrito
- [ ] Confirmación visual con mensaje de éxito
- [ ] Redirección a la primera lección del curso
- [ ] Email de bienvenida al curso con información general
- [ ] El curso aparece ahora en "Mis Cursos"

**Dependencias:** HU-013

---

#### HU-015: Tracking de Progreso por Curso y Módulo
**ID:** HU-015
**Épica:** EP-003
**Prioridad:** MUST HAVE
**Story Points:** 8
**Sprint:** 3
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **que mi progreso se guarde automáticamente**, para **retomar donde lo dejé**.

**Criterios de Aceptación:**
- [ ] Al completar una lección, actualizar `UserLessonProgress.completed = true`
- [ ] Cálculo de progreso del curso: `(lecciones_completadas / total_lecciones) * 100`
- [ ] Actualización de `UserCourseEnrollment.progress` en tiempo real
- [ ] Barra de progreso visual en cada módulo y curso
- [ ] Persistencia inmediata (debounce de 2 segundos)
- [ ] Sincronización entre dispositivos (misma cuenta)
- [ ] Endpoint `/api/courses/:id/progress` para obtener estado

**Dependencias:** HU-014

---

### SPRINT 4 - CONTENIDO EDUCATIVO Y QUIZZES (29 pts)

#### HU-016: Visor de Lecciones con Markdown Rendering
**ID:** HU-016
**Épica:** EP-004
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 4
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **ver lecciones formateadas con markdown**, para **tener una experiencia de lectura agradable**.

**Criterios de Aceptación:**
- [ ] Renderizado de markdown con librería segura (marked.js + DOMPurify)
- [ ] Soporte para:
  - Encabezados (h1-h6)
  - Código con syntax highlighting (highlight.js)
  - Listas ordenadas y desordenadas
  - Imágenes embebidas
  - Tablas
  - Links externos (abrir en nueva pestaña)
- [ ] Estilo consistente con diseño de la plataforma
- [ ] Copy button en bloques de código
- [ ] Navegación anterior/siguiente lección
- [ ] Botón "Marcar como completada"

**Dependencias:** HU-015 (tracking)

---

#### HU-017: Sistema de Quizzes (Multiple Choice, True/False)
**ID:** HU-017
**Épica:** EP-005
**Prioridad:** SHOULD HAVE
**Story Points:** 8
**Sprint:** 4
**Estado:** Pendiente

**Historia:**
Como **instructor**, quiero **crear quizzes con diferentes tipos de preguntas**, para **evaluar el conocimiento de los estudiantes**.

**Criterios de Aceptación:**
- [ ] Modelo de datos para Quiz:
  - Quiz: id, lessonId, title, passingScore (%), timeLimit (minutos), attemptsAllowed
  - Question: id, quizId, type (multiple_choice, true_false, short_answer), text, order, points
  - Answer: id, questionId, text, isCorrect
- [ ] Interfaz de creación de quiz (admin/instructor):
  - Drag & drop para ordenar preguntas
  - Editor de preguntas con opciones de respuesta
  - Marcar respuesta(s) correcta(s)
  - Preview del quiz antes de publicar
- [ ] Validación de al menos 1 respuesta correcta por pregunta

**Dependencias:** HU-011 (modelo de lecciones)

---

#### HU-018: Auto-calificación de Quizzes
**ID:** HU-018
**Épica:** EP-005
**Prioridad:** SHOULD HAVE
**Story Points:** 5
**Sprint:** 4
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **recibir mi calificación inmediatamente después de completar un quiz**, para **saber mi nivel de comprensión**.

**Criterios de Aceptación:**
- [ ] Al enviar quiz, calcular score: `(puntos_obtenidos / puntos_totales) * 100`
- [ ] Mostrar resultados desglosados:
  - Score total (%)
  - Preguntas correctas vs incorrectas
  - Tiempo tomado
  - Estado: Aprobado/Reprobado (según passingScore)
- [ ] Feedback por pregunta (respuesta correcta vs seleccionada)
- [ ] Guardar intento en `QuizAttempt` con timestamp
- [ ] Actualizar progreso de lección si aprueba
- [ ] Permitir reintento si attemptsAllowed > intentos actuales

**Dependencias:** HU-017

---

#### HU-019: Historial de Intentos de Quiz
**ID:** HU-019
**Épica:** EP-005
**Prioridad:** SHOULD HAVE
**Story Points:** 3
**Sprint:** 4
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **ver mi historial de intentos en cada quiz**, para **identificar mis áreas de mejora**.

**Criterios de Aceptación:**
- [ ] Tabla de intentos con columnas: Intento #, Fecha, Score, Tiempo, Estado
- [ ] Click en intento para ver detalles (respuestas dadas)
- [ ] Gráfico de evolución de scores (line chart)
- [ ] Indicador de mejor intento (badge)
- [ ] Opción de reintentar (si permitido)
- [ ] Estadísticas: promedio de scores, tiempo promedio

**Dependencias:** HU-018

---

#### HU-020: Navegación por Módulos y Lecciones
**ID:** HU-020
**Épica:** EP-004
**Prioridad:** MUST HAVE
**Story Points:** 5
**Sprint:** 4
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **navegar fácilmente entre módulos y lecciones**, para **avanzar en el curso sin fricción**.

**Criterios de Aceptación:**
- [ ] Sidebar con acordeón de módulos:
  - Cada módulo muestra lista de lecciones
  - Iconos según tipo: 📖 (texto), 🎥 (video), ❓ (quiz), 💻 (lab)
  - Indicador de completitud (checkmark verde)
  - Lección actual destacada
- [ ] Breadcrumbs en la parte superior (Curso > Módulo > Lección)
- [ ] Botones "Anterior" y "Siguiente" en cada lección
- [ ] Auto-scroll a lección actual en sidebar
- [ ] Bloqueo opcional de lecciones (requieren completar previas)

**Dependencias:** HU-016

---

#### HU-023: Soporte para Multimedia Embebido
**ID:** HU-023
**Épica:** EP-004
**Prioridad:** SHOULD HAVE
**Story Points:** 3
**Sprint:** 4
**Estado:** Pendiente

**Historia:**
Como **instructor**, quiero **embebir videos de YouTube y otros recursos**, para **enriquecer el contenido**.

**Criterios de Aceptación:**
- [ ] Markdown parser detecta enlaces de YouTube/Vimeo
- [ ] Renderizado automático como iframe embebido
- [ ] Soporte para archivos de audio (mp3, wav)
- [ ] Embebido de diagramas (Mermaid.js)
- [ ] Galería de imágenes con lightbox
- [ ] Validación de URLs externas (whitelist de dominios)

**Dependencias:** HU-016

---

### SPRINT 5 - LABORATORIOS EJECUTABLES (42 pts)

#### HU-021: Editor de Código In-Browser (Monaco)
**ID:** HU-021
**Épica:** EP-006
**Prioridad:** SHOULD HAVE
**Story Points:** 8
**Sprint:** 5
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **escribir código directamente en el navegador**, para **practicar sin configurar mi entorno local**.

**Criterios de Aceptación:**
- [ ] Integración de Monaco Editor (mismo de VS Code)
- [ ] Soporte para lenguajes: Python, JavaScript, Bash
- [ ] Syntax highlighting automático según lenguaje
- [ ] Autocompletado básico (snippets estándar)
- [ ] Numeración de líneas
- [ ] Tema oscuro/claro (toggle)
- [ ] Botones: Ejecutar, Resetear, Descargar código
- [ ] Tamaño ajustable del editor (resize)

**Dependencias:** HU-011 (lecciones tipo "lab")

---

#### HU-022: Servicio de Ejecución de Código (Sandbox Docker)
**ID:** HU-022
**Épica:** EP-006
**Prioridad:** SHOULD HAVE
**Story Points:** 13
**Sprint:** 5
**Estado:** Pendiente

**Historia:**
Como **administrador**, quiero **ejecutar código de estudiantes en un entorno aislado**, para **proteger el servidor de código malicioso**.

**Criterios de Aceptación:**
- [ ] Microservicio de ejecución con Docker containers efímeros
- [ ] API endpoint `/api/labs/execute` (POST):
  ```json
  {
    "language": "python",
    "code": "print('Hello')",
    "testCases": [...]
  }
  ```
- [ ] Timeout de 30 segundos por ejecución
- [ ] Límite de memoria: 256MB por contenedor
- [ ] Límite de CPU: 0.5 cores
- [ ] Captura de stdout, stderr y código de salida
- [ ] Limpieza automática de contenedores (max lifetime: 1 min)
- [ ] Rate limiting: 10 ejecuciones por minuto por usuario
- [ ] Logging de todas las ejecuciones (auditoría)

**Dependencias:** HU-021

---

#### HU-024: Validación Automática de Labs
**ID:** HU-024
**Épica:** EP-006
**Prioridad:** SHOULD HAVE
**Story Points:** 8
**Sprint:** 5
**Estado:** Pendiente

**Historia:**
Como **instructor**, quiero **definir test cases que validen automáticamente el código del estudiante**, para **reducir evaluación manual**.

**Criterios de Aceptación:**
- [ ] Modelo de datos para Lab:
  - Lab: id, lessonId, starterCode, instructions, language
  - TestCase: id, labId, input, expectedOutput, isHidden (para evitar hardcoding)
- [ ] Interfaz de creación de lab con editor de test cases
- [ ] Al ejecutar lab, correr todos los test cases
- [ ] Comparación de output (string matching, regex, JSON diff)
- [ ] Resultado visual: ✅ Test Passed / ❌ Test Failed
- [ ] Detalles de error (expected vs actual)
- [ ] Progreso: X/Y tests pasados
- [ ] Marcar lab como completado si 100% tests pasan

**Dependencias:** HU-022

---

#### HU-025: Terminal Output Simulation
**ID:** HU-025
**Épica:** EP-006
**Prioridad:** SHOULD HAVE
**Story Points:** 5
**Sprint:** 5
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **ver la salida de mi código como si estuviera en una terminal real**, para **una experiencia auténtica**.

**Criterios de Aceptación:**
- [ ] Componente de terminal estilo xterm.js
- [ ] Colores ANSI preservados (stdout en blanco, stderr en rojo)
- [ ] Scroll automático al final del output
- [ ] Timestamp de inicio/fin de ejecución
- [ ] Indicador de proceso en ejecución (spinner)
- [ ] Clear output button
- [ ] Copy output to clipboard
- [ ] Máximo 10,000 líneas de output (prevenir flood)

**Dependencias:** HU-022

---

#### HU-026: Soporte Multi-Lenguaje (Python, Bash, Node)
**ID:** HU-026
**Épica:** EP-006
**Prioridad:** SHOULD HAVE
**Story Points:** 8
**Sprint:** 5
**Estado:** Pendiente

**Historia:**
Como **instructor**, quiero **crear labs en diferentes lenguajes de programación**, para **cubrir diversas necesidades de aprendizaje**.

**Criterios de Aceptación:**
- [ ] Imágenes Docker para:
  - Python 3.11 (con pip, pytest)
  - Node.js 20 (con npm, jest)
  - Bash 5.x (con herramientas estándar de Unix)
- [ ] Auto-detección de lenguaje desde extensión de archivo
- [ ] Configuración de dependencias por lab (requirements.txt, package.json)
- [ ] Instalación de dependencias en contenedor antes de ejecutar
- [ ] Cache de imágenes para reducir latencia
- [ ] Selector de lenguaje en interfaz de creación de lab

**Dependencias:** HU-022

---

### SPRINT 6 - PROYECTOS Y GAMIFICACIÓN (42 pts)

#### HU-027: Sistema de Entrega de Proyectos Finales
**ID:** HU-027
**Épica:** EP-007
**Prioridad:** SHOULD HAVE
**Story Points:** 8
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **entregar mi proyecto final subiendo archivos**, para **completar el curso**.

**Criterios de Aceptación:**
- [ ] Modelo de datos:
  - Project: id, courseId, title, description, maxFileSize, allowedFormats, dueDate
  - Submission: id, projectId, userId, files (JSON array), submittedAt, status (pending, graded)
- [ ] Interfaz de upload con drag & drop
- [ ] Validación de tamaño (max 50MB total)
- [ ] Validación de formatos (pdf, zip, docx, etc.)
- [ ] Preview de archivos antes de enviar
- [ ] Confirmación de entrega con timestamp
- [ ] Email de confirmación de entrega
- [ ] Posibilidad de re-entregar antes de deadline (overwrite)

**Dependencias:** HU-015 (tracking)

---

#### HU-028: Interfaz de Evaluación Manual (Instructores)
**ID:** HU-028
**Épica:** EP-007
**Prioridad:** SHOULD HAVE
**Story Points:** 8
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **instructor**, quiero **evaluar proyectos de estudiantes con una interfaz dedicada**, para **proporcionar feedback detallado**.

**Criterios de Aceptación:**
- [ ] Página `/instructor/projects/:projectId/submissions`
- [ ] Lista de entregas con filtros: pendiente, evaluado, atrasado
- [ ] Al hacer click, abrir panel de evaluación con:
  - Información del estudiante
  - Archivos entregados (download links)
  - Viewer integrado para PDFs
  - Rúbrica de evaluación (configurable por proyecto)
  - Campo de puntuación (0-100)
  - Área de feedback (rich text editor)
- [ ] Botón "Guardar como borrador" y "Enviar calificación"
- [ ] Al enviar, actualizar estado y notificar estudiante
- [ ] Historial de evaluaciones (auditoría)

**Dependencias:** HU-027

---

#### HU-029: Sistema de Badges por Módulo
**ID:** HU-029
**Épica:** EP-008
**Prioridad:** COULD HAVE
**Story Points:** 5
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **ganar badges al completar módulos**, para **sentir logro y motivación**.

**Criterios de Aceptación:**
- [ ] Modelo de datos:
  - Badge: id, name, description, imageUrl, criteria (JSON)
  - UserBadge: userId, badgeId, earnedAt
- [ ] Badges predefinidos:
  - "First Steps" (completar primer módulo)
  - "Quiz Master" (aprobar 10 quizzes consecutivos)
  - "Lab Expert" (completar 5 labs con 100%)
  - "Course Graduate" (completar un curso completo)
  - Badges por curso específico
- [ ] Otorgamiento automático al cumplir criterios
- [ ] Notificación visual al ganar badge (modal animado)
- [ ] Galería de badges en perfil de usuario
- [ ] Badges bloqueados/desbloqueados con indicador de progreso

**Dependencias:** HU-015 (tracking), HU-024 (labs)

---

#### HU-030: Generación de Certificados PDF
**ID:** HU-030
**Épica:** EP-008
**Prioridad:** COULD HAVE
**Story Points:** 8
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **obtener un certificado en PDF al completar un curso**, para **demostrar mi logro profesionalmente**.

**Criterios de Aceptación:**
- [ ] Generación de PDF con librería (PDFKit o Puppeteer)
- [ ] Template de certificado con:
  - Logo de la plataforma
  - Nombre del estudiante
  - Nombre del curso
  - Fecha de completitud
  - Firma digital (imagen del instructor/admin)
  - Código único de verificación (UUID)
- [ ] Almacenamiento de PDF en S3/storage local
- [ ] Botón "Descargar Certificado" en perfil del usuario
- [ ] Página pública de verificación `/verify-certificate/:code`
- [ ] Watermark de seguridad (opcional)

**Dependencias:** HU-015 (tracking)

---

#### HU-031: Envío de Certificado por Email
**ID:** HU-031
**Épica:** EP-008
**Prioridad:** COULD HAVE
**Story Points:** 3
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **recibir mi certificado automáticamente por email**, para **tenerlo disponible fácilmente**.

**Criterios de Aceptación:**
- [ ] Al completar 100% de un curso, disparar evento de generación
- [ ] Generar PDF (HU-030) y enviar email con:
  - Asunto: "¡Felicidades! Has completado [Curso Name]"
  - Mensaje de felicitación personalizado
  - Certificado adjunto (PDF)
  - Link a verificación online
- [ ] Template de email profesional (HTML)
- [ ] Logs de envío exitoso/fallido
- [ ] Opción de reenviar certificado desde perfil

**Dependencias:** HU-030

---

#### HU-032: Rúbricas de Calificación
**ID:** HU-032
**Épica:** EP-007
**Prioridad:** SHOULD HAVE
**Story Points:** 5
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **instructor**, quiero **usar rúbricas predefinidas para evaluar proyectos**, para **mantener consistencia en calificaciones**.

**Criterios de Aceptación:**
- [ ] Modelo de datos:
  - Rubric: id, projectId, criteria (JSON array)
  - Criterion: name, description, maxPoints, levels (array de descriptores)
- [ ] Interfaz de creación de rúbricas:
  - Agregar/eliminar criterios
  - Definir niveles (ej: Excelente 10pts, Bueno 7pts, Suficiente 5pts)
  - Preview de rúbrica
- [ ] En evaluación (HU-028), mostrar rúbrica con radio buttons por nivel
- [ ] Cálculo automático de puntuación total
- [ ] Rúbricas reutilizables entre proyectos
- [ ] Template library con rúbricas comunes

**Dependencias:** HU-028

---

#### HU-033: Gamificación - Sistema de Puntos (XP)
**ID:** HU-033
**Épica:** EP-008
**Prioridad:** COULD HAVE
**Story Points:** 5
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **ganar puntos de experiencia (XP) por completar actividades**, para **competir con otros estudiantes**.

**Criterios de Aceptación:**
- [ ] Sistema de puntos:
  - Completar lección: 10 XP
  - Aprobar quiz: 20 XP
  - Completar lab: 30 XP
  - Entregar proyecto: 50 XP
  - Ganar badge: 100 XP
- [ ] Modelo de datos: UserXP con userId, totalXP, level
- [ ] Cálculo de nivel: `level = floor(sqrt(totalXP / 100))`
- [ ] Barra de progreso de nivel en navbar
- [ ] Leaderboard (top 10 estudiantes por XP)
- [ ] Animación al subir de nivel
- [ ] Historial de XP ganado (timeline)

**Dependencias:** HU-015, HU-029

---

#### HU-034: Perfil Público de Usuario
**ID:** HU-034
**Épica:** EP-008
**Prioridad:** COULD HAVE
**Story Points:** 5
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **estudiante**, quiero **tener un perfil público con mis logros**, para **compartir mi progreso**.

**Criterios de Aceptación:**
- [ ] Página `/profile/:username` con:
  - Avatar, nombre, bio
  - Nivel y XP total
  - Badges ganados (galería)
  - Cursos completados con certificados
  - Estadísticas: quizzes aprobados, labs completados, tiempo total
  - Timeline de actividad reciente
- [ ] Configuración de privacidad (público/privado)
- [ ] URL personalizada (/profile/custom-username)
- [ ] Botón "Compartir perfil" (link + QR code)
- [ ] Open Graph tags para preview en redes sociales

**Dependencias:** HU-029, HU-033

---

#### HU-035: Notificaciones In-App
**ID:** HU-035
**Épica:** EP-008
**Prioridad:** COULD HAVE
**Story Points:** 5
**Sprint:** 6
**Estado:** Pendiente

**Historia:**
Como **usuario**, quiero **recibir notificaciones in-app de eventos importantes**, para **estar al tanto de mi progreso y actualizaciones**.

**Criterios de Aceptación:**
- [ ] Modelo de datos: Notification (userId, type, title, message, read, createdAt)
- [ ] Tipos de notificaciones:
  - Nuevo badge ganado
  - Curso completado
  - Proyecto calificado
  - Nuevo curso disponible (según perfil)
  - Recordatorio de curso sin completar (7 días inactivo)
- [ ] Icono de campana en navbar con badge de cantidad no leída
- [ ] Dropdown con lista de notificaciones (últimas 10)
- [ ] Marcar como leída al hacer click
- [ ] Página completa de notificaciones (`/notifications`)
- [ ] Filtros por tipo y estado

**Dependencias:** Múltiples (HU-029, HU-030, HU-028)

---

#### HU-036: Soporte Multi-Idioma (i18n)
**ID:** HU-036
**Épica:** EP-008
**Prioridad:** WON'T HAVE (Futuro)
**Story Points:** 13
**Sprint:** Backlog
**Estado:** Pendiente

**Historia:**
Como **usuario internacional**, quiero **usar la plataforma en mi idioma nativo**, para **mejorar mi experiencia de aprendizaje**.

**Criterios de Aceptación:**
- [ ] Integración de i18next (React) o similar
- [ ] Idiomas soportados inicialmente: Español, Inglés
- [ ] Traducción de interfaz (UI strings)
- [ ] Selector de idioma en navbar
- [ ] Persistencia de preferencia de idioma
- [ ] Contenido de cursos multiidioma (metadata separada)
- [ ] Fallback a idioma por defecto si traducción no existe
- [ ] Números, fechas y monedas formateadas según locale

**Dependencias:** Ninguna (feature independiente)

---

### HISTORIAS ADICIONALES (Backlog Futuro)

#### HU-037: Integración con LMS Externos (SCORM)
**ID:** HU-037
**Prioridad:** WON'T HAVE
**Story Points:** 21
**Sprint:** Backlog

**Historia:**
Como **administrador**, quiero **integrar cursos SCORM desde LMS externos**, para **ampliar el catálogo sin recrear contenido**.

---

#### HU-038: Modo Offline (PWA)
**ID:** HU-038
**Prioridad:** WON'T HAVE
**Story Points:** 13
**Sprint:** Backlog

**Historia:**
Como **estudiante**, quiero **acceder a lecciones descargadas sin conexión a internet**, para **estudiar en cualquier lugar**.

---

#### HU-039: Chat en Vivo Instructor-Estudiante
**ID:** HU-039
**Prioridad:** WON'T HAVE
**Story Points:** 21
**Sprint:** Backlog

**Historia:**
Como **estudiante**, quiero **hacer preguntas en tiempo real a instructores**, para **resolver dudas rápidamente**.

---

#### HU-040: Foros de Discusión por Curso
**ID:** HU-040
**Prioridad:** WON'T HAVE
**Story Points:** 13
**Sprint:** Backlog

**Historia:**
Como **estudiante**, quiero **participar en foros de discusión por curso**, para **aprender colaborativamente**.

---

#### HU-041: Analytics Avanzado para Instructores
**ID:** HU-041
**Prioridad:** WON'T HAVE
**Story Points:** 13
**Sprint:** Backlog

**Historia:**
Como **instructor**, quiero **ver analytics detallados de desempeño de mis estudiantes**, para **identificar contenido difícil y ajustar enseñanza**.

---

#### HU-042: Integración con Calendarios (Google Calendar, Outlook)
**ID:** HU-042
**Prioridad:** WON'T HAVE
**Story Points:** 8
**Sprint:** Backlog

**Historia:**
Como **estudiante**, quiero **sincronizar deadlines de cursos con mi calendario**, para **gestionar mi tiempo eficientemente**.

---

#### HU-043: Live Coding Sessions (WebRTC)
**ID:** HU-043
**Prioridad:** WON'T HAVE
**Story Points:** 21
**Sprint:** Backlog

**Historia:**
Como **instructor**, quiero **hacer sesiones de live coding compartiendo pantalla**, para **enseñar en tiempo real**.

---

#### HU-044: Marketplace de Cursos de Terceros
**ID:** HU-044
**Prioridad:** WON'T HAVE
**Story Points:** 34
**Sprint:** Backlog

**Historia:**
Como **instructor externo**, quiero **publicar mis cursos en la plataforma y recibir ingresos**, para **monetizar mi conocimiento**.

---

#### HU-045: Modo Oscuro/Claro Personalizable
**ID:** HU-045
**Prioridad:** COULD HAVE
**Story Points:** 3
**Sprint:** Backlog

**Historia:**
Como **usuario**, quiero **cambiar entre modo oscuro y claro**, para **reducir fatiga visual**.

---

## 4. ROADMAP DE SPRINTS

### Planificación General

| Sprint | Duración | Épica Principal | Historias | Story Points | Acumulado | % Completitud |
|--------|----------|-----------------|-----------|--------------|-----------|---------------|
| **Sprint 0** | 2 días | Infraestructura | Setup inicial | N/A | - | - |
| **Sprint 1** | 5 días | EP-001 Autenticación | HU-001 a HU-005 | 21 | 21 | 10% |
| **Sprint 2** | 5 días | EP-002 Dashboard Admin | HU-006 a HU-010 | 26 | 47 | 22% |
| **Sprint 3** | 5 días | EP-003 Multi-Curso | HU-011 a HU-015 | 34 | 81 | 38% |
| **Sprint 4** | 5 días | EP-004/005 Contenido + Quizzes | HU-016 a HU-020, HU-023 | 29 | 110 | 52% |
| **Sprint 5** | 5 días | EP-006 Laboratorios | HU-021, HU-022, HU-024 a HU-026 | 42 | 152 | 71% |
| **Sprint 6** | 5 días | EP-007/008 Proyectos + Gamificación | HU-027 a HU-035 | 52 | 204 | 96% |
| **Backlog** | Futuro | Todas | HU-036 a HU-045 | 160 | - | - |

**Total Story Points MVP (Sprints 1-6):** 204
**Velocity Promedio Esperado:** 34 puntos/sprint

---

### Sprint 0: Infraestructura y Setup (2 días)

**Objetivos:**
- [ ] Configuración de repositorio Git con estructura de carpetas
- [ ] Setup de entorno de desarrollo (Node.js, PostgreSQL, Docker)
- [ ] Inicialización de proyecto backend (Express.js + Sequelize)
- [ ] Inicialización de proyecto frontend (React + Vite)
- [ ] Configuración de CI/CD básico (GitHub Actions)
- [ ] Setup de base de datos en staging
- [ ] Documentación técnica inicial (README, CONTRIBUTING.md)

**Entregables:**
- Repositorio configurado
- Backend y frontend corriendo localmente
- Primera migration de DB ejecutada
- Pipeline de CI funcionando

---

### Sprint 1: Autenticación y Autorización (Días 1-5)

**Épica:** EP-001
**Story Points:** 21
**Capacidad del Equipo:** 25 pts (buffer de 4)

**Historias:**
- HU-001: Registro de Usuario (3 pts) - Días 1-2
- HU-002: Login con Credenciales (3 pts) - Día 2
- HU-003: Sistema de Roles (5 pts) - Días 3-4
- HU-004: Middleware JWT (5 pts) - Días 4-5
- HU-005: Recuperación de Contraseña (5 pts) - Día 5

**Daily Goals:**
- **Día 1:** Modelo de User, endpoint de registro, validaciones
- **Día 2:** Completar HU-001, iniciar login con JWT
- **Día 3:** Completar HU-002, implementar modelo de roles
- **Día 4:** Testing de roles, iniciar middleware
- **Día 5:** Completar middleware, recuperación de contraseña

**Ceremonia de Cierre:**
- Sprint Review: Demo de login/registro funcional
- Sprint Retrospective: Identificar mejoras de proceso

---

### Sprint 2: Dashboard Administrativo (Días 6-10)

**Épica:** EP-002
**Story Points:** 26
**Dependencias Críticas:** Sprint 1 completado

**Historias:**
- HU-006: Lista de Usuarios (5 pts) - Días 6-7
- HU-007: Dashboard con Estadísticas (8 pts) - Días 7-9
- HU-008: Progreso Detallado de Usuario (5 pts) - Día 9
- HU-009: Gestión de Perfiles (5 pts) - Día 10
- HU-010: Asignar Perfil (3 pts) - Día 10

**Riesgos:**
- HU-007 es compleja (gráficos), podría tomar más tiempo
- **Mitigación:** Usar librería chart.js con templates

**Entregables:**
- Dashboard funcional con métricas
- CRUD de usuarios completo
- Sistema de perfiles operativo

---

### Sprint 3: Sistema Multi-Curso (Días 11-15)

**Épica:** EP-003
**Story Points:** 34 (sprint más pesado)
**Riesgo:** Alta complejidad en modelo de datos

**Historias:**
- HU-011: Modelo de Datos (8 pts) - Días 11-12
- HU-012: Importador de Curso (8 pts) - Días 12-14
- HU-013: Catálogo de Cursos (5 pts) - Día 14
- HU-014: Inscripción a Cursos (5 pts) - Día 15
- HU-015: Tracking de Progreso (8 pts) - Día 15

**Daily Goals:**
- **Día 11-12:** Diseño y creación de modelos de DB
- **Día 13-14:** Parser de markdown e importador
- **Día 15:** Catálogo e inscripción

**Hito Crítico:** Al final de este sprint, la plataforma debe soportar 3 cursos reales importados.

---

### Sprint 4: Contenido Educativo y Quizzes (Días 16-20)

**Épica:** EP-004 + EP-005
**Story Points:** 29

**Historias:**
- HU-016: Visor de Lecciones (5 pts) - Días 16-17
- HU-017: Sistema de Quizzes (8 pts) - Días 17-19
- HU-018: Auto-calificación (5 pts) - Día 19
- HU-019: Historial de Intentos (3 pts) - Día 20
- HU-020: Navegación (5 pts) - Día 20
- HU-023: Multimedia Embebido (3 pts) - Día 20

**Entregables:**
- Estudiantes pueden ver lecciones completas
- Quizzes funcionales con auto-calificación
- Navegación fluida entre módulos

---

### Sprint 5: Laboratorios Ejecutables (Días 21-25)

**Épica:** EP-006
**Story Points:** 42 (sprint más crítico)
**Riesgo:** Sandbox Docker puede ser complejo

**Historias:**
- HU-021: Editor Monaco (8 pts) - Días 21-22
- HU-022: Sandbox Docker (13 pts) - Días 22-24
- HU-024: Validación Automática (8 pts) - Día 24
- HU-025: Terminal Output (5 pts) - Día 25
- HU-026: Soporte Multi-Lenguaje (8 pts) - Día 25

**Plan de Mitigación de Riesgos:**
- **Riesgo:** Sandbox puede fallar en producción
- **Mitigación:** Testing exhaustivo en staging, fallback a ejecución local sin Docker
- **Riesgo:** Latencia en ejecución
- **Mitigación:** Precarga de imágenes Docker, optimización de contenedores

**Daily Goals:**
- **Día 21:** Integración de Monaco Editor
- **Día 22-23:** Microservicio de ejecución con Docker
- **Día 24:** Validación con test cases
- **Día 25:** Polish y testing

**Hito Crítico:** Al menos 5 labs funcionales con ejecución real.

---

### Sprint 6: Proyectos y Gamificación (Días 26-30)

**Épica:** EP-007 + EP-008
**Story Points:** 52
**Objetivo:** Completar MVP con features de retención

**Historias:**
- HU-027: Entrega de Proyectos (8 pts) - Días 26-27
- HU-028: Evaluación Manual (8 pts) - Días 27-28
- HU-029: Sistema de Badges (5 pts) - Día 28
- HU-030: Certificados PDF (8 pts) - Días 28-29
- HU-031: Envío de Certificado (3 pts) - Día 29
- HU-032: Rúbricas (5 pts) - Día 29
- HU-033: Sistema de XP (5 pts) - Día 30
- HU-034: Perfil Público (5 pts) - Día 30
- HU-035: Notificaciones (5 pts) - Día 30

**Entregables Finales:**
- Sistema completo de entrega y evaluación de proyectos
- Gamificación funcional (badges, XP, leaderboard)
- Certificados generados automáticamente
- MVP listo para producción

**Ceremonia Final:**
- Sprint Review + Demo completa del MVP
- Retrospectiva del proyecto completo
- Planning de backlog futuro

---

## 5. RIESGOS Y DEPENDENCIAS

### Matriz de Riesgos

| ID | Riesgo | Probabilidad | Impacto | Severidad | Mitigación | Owner |
|----|--------|--------------|---------|-----------|------------|-------|
| R-001 | Sandbox Docker no funciona en producción | Media | Crítico | ALTO | Testing en staging, plan B sin Docker | Backend Lead |
| R-002 | Importador de markdown falla con formatos complejos | Alta | Medio | MEDIO | Validación estricta, documentación de formato | Backend Dev |
| R-003 | Performance de DB con muchos usuarios concurrentes | Baja | Alto | MEDIO | Índices optimizados, caching con Redis | DBA |
| R-004 | Quizzes auto-calificados tienen errores de lógica | Media | Medio | MEDIO | Testing exhaustivo con casos edge | QA Lead |
| R-005 | Generación de PDFs consume mucha memoria | Media | Medio | MEDIO | Generación asíncrona, límite de concurrencia | Backend Dev |
| R-006 | Email delivery rate bajo (spam) | Alta | Bajo | BAJO | Usar servicio verificado (SendGrid), SPF/DKIM | DevOps |
| R-007 | Integración de Monaco Editor rompe build en producción | Baja | Alto | MEDIO | Testing en staging, bundle analyzer | Frontend Lead |
| R-008 | Velocity más baja de lo esperado | Media | Alto | ALTO | Buffer de 20% en estimaciones, pair programming | Scrum Master |

### Mapa de Dependencias

```
HU-001 (Registro)
  └─> HU-002 (Login)
        └─> HU-003 (Roles)
              └─> HU-004 (Middleware)
                    └─> HU-006 (Lista Usuarios)
                          └─> HU-007 (Dashboard)
                                └─> HU-008 (Progreso Usuario)

HU-011 (Modelo Cursos)
  ├─> HU-012 (Importador)
  ├─> HU-009 (Perfiles)
  │     └─> HU-013 (Catálogo)
  │           └─> HU-014 (Inscripción)
  │                 └─> HU-015 (Tracking)
  │                       ├─> HU-016 (Visor)
  │                       ├─> HU-018 (Quizzes)
  │                       └─> HU-027 (Proyectos)
  └─> HU-017 (Sistema Quiz)

HU-021 (Editor Monaco)
  └─> HU-022 (Sandbox Docker)
        ├─> HU-024 (Validación)
        ├─> HU-025 (Terminal)
        └─> HU-026 (Multi-lenguaje)

HU-015 (Tracking)
  ├─> HU-029 (Badges)
  ├─> HU-030 (Certificados)
  │     └─> HU-031 (Email Certificado)
  └─> HU-033 (Sistema XP)
        └─> HU-034 (Perfil Público)
```

### Dependencias Externas

| Dependencia | Servicio | Criticidad | Plan B |
|-------------|----------|------------|--------|
| Email sending | SendGrid / Mailgun | Alta | SMTP local (menos confiable) |
| File storage | AWS S3 / Cloudinary | Media | Local filesystem |
| Docker runtime | Docker Engine | Crítica | Ejecución sin sandbox (inseguro) |
| Database | PostgreSQL 14+ | Crítica | MySQL (requiere refactor) |
| CDN | Cloudflare | Baja | Servir assets desde servidor |

---

## 6. CRITERIOS DE PRIORIZACIÓN

### Framework MoSCoW Aplicado

**MUST HAVE (MVP Core):**
- Autenticación segura → Sin esto, no hay plataforma
- Multi-curso → Es el diferenciador principal
- Dashboard admin → Gestión es crítica
- Visualización de contenido → Los usuarios necesitan consumir cursos

**SHOULD HAVE (MVP Completo):**
- Quizzes → Evaluación es importante pero puede ser manual inicialmente
- Labs ejecutables → Alto valor pero técnicamente arriesgado
- Proyectos → Necesario para certificación completa

**COULD HAVE (Nice to Have):**
- Gamificación → Aumenta engagement pero no es bloqueante
- Certificados → Deseable pero puede hacerse manual
- Notificaciones → Mejora UX pero no es crítico

**WON'T HAVE (Futuro):**
- i18n, foros, chat en vivo → Fuera de scope del MVP

### Criterios de Scoring

Cada historia se evalúa con puntaje de 1-10 en:

| Criterio | Peso | Descripción |
|----------|------|-------------|
| **Valor de Negocio** | 40% | ¿Qué tan importante es para el producto? |
| **Urgencia** | 20% | ¿Es bloqueante para otras historias? |
| **Riesgo/Complejidad** | 20% | ¿Qué tan difícil es implementar? (inverso) |
| **Esfuerzo** | 10% | ¿Cuántos story points requiere? (inverso) |
| **Feedback del Cliente** | 10% | ¿Qué tan solicitado es? |

**Fórmula:** `Score = (VN × 0.4) + (Urgencia × 0.2) + ((10 - Riesgo) × 0.2) + ((13 - StoryPoints)/13 × 0.1) + (Feedback × 0.1)`

**Ejemplo HU-003 (Roles):**
- Valor de Negocio: 10/10
- Urgencia: 9/10 (bloqueante para admin)
- Riesgo: 4/10 (medio)
- Esfuerzo: 5 pts → (13-5)/13 = 0.61
- Feedback: 8/10
- **Score Final:** (10×0.4) + (9×0.2) + (6×0.2) + (0.61×0.1) + (8×0.1) = **8.86/10** → ALTA PRIORIDAD

---

## 7. MÉTRICAS DE ÉXITO

### KPIs de Desarrollo

| Métrica | Meta | Medición | Responsable |
|---------|------|----------|-------------|
| **Velocity** | 30-35 pts/sprint | Burndown chart | Scrum Master |
| **Cumplimiento de Sprint** | 90%+ historias completadas | Sprint report | Product Owner |
| **Cobertura de Tests** | Mínimo 70% | SonarQube/Jest | QA Lead |
| **Code Review Time** | < 4 horas | GitHub metrics | Tech Lead |
| **Bugs por Sprint** | < 5 críticos | Jira/GitHub Issues | QA Lead |
| **Deuda Técnica** | < 10% del tiempo | SonarQube debt ratio | Tech Lead |

### KPIs de Producto

| Métrica | Meta | Herramienta | Fase |
|---------|------|-------------|-------|
| **User Registration Rate** | 100 users en primera semana | Analytics | Post-Launch |
| **Course Completion Rate** | 60%+ | Dashboard Admin | Post-Sprint 3 |
| **Quiz Pass Rate** | 75%+ | DB queries | Post-Sprint 4 |
| **Lab Completion Rate** | 50%+ | Analytics | Post-Sprint 5 |
| **Certificate Generation** | 30+ en primer mes | Logs | Post-Sprint 6 |
| **Daily Active Users (DAU)** | 40%+ de registrados | Analytics | Post-Launch |

### Burndown Chart (Plantilla)

```
Story Points
│
200 │ ●
    │   ●
150 │     ●
    │       ●
100 │         ●
    │           ●
 50 │             ●
    │               ●
  0 │_________________●
    Sprint: 1  2  3  4  5  6

● = Ideal Burndown
```

### Métricas de Calidad

**Definición de Calidad:**
- [ ] 0 bugs críticos en producción
- [ ] Uptime del 99.5%+
- [ ] API response time p95 < 500ms
- [ ] Lighthouse score > 90 (performance)
- [ ] WCAG AA compliance

**Herramientas de Monitoreo:**
- **Performance:** New Relic / Datadog
- **Errors:** Sentry
- **Uptime:** Pingdom
- **Analytics:** Google Analytics + Mixpanel

---

## 8. GESTIÓN DEL BACKLOG

### Proceso de Refinamiento

**Frecuencia:** Cada 3 días (mid-sprint)
**Duración:** 1 hora
**Participantes:** Product Owner, Tech Lead, Scrum Master

**Actividades:**
1. Revisar historias del próximo sprint
2. Clarificar criterios de aceptación
3. Estimar historias nuevas (Planning Poker)
4. Identificar dependencias técnicas
5. Actualizar prioridades según feedback

### Criterios de "Ready" (DoR - Definition of Ready)

Una historia está lista para sprint planning si:
- [ ] Tiene descripción clara y comprensible
- [ ] Criterios de aceptación específicos y medibles
- [ ] Dependencias identificadas
- [ ] Estimación de story points consensuada
- [ ] Wireframes/mockups disponibles (si es UI)
- [ ] Aprobada por Product Owner
- [ ] No tiene blockers conocidos

### Estados del Backlog

| Estado | Descripción | Acción Requerida |
|--------|-------------|------------------|
| **Idea** | Concepto inicial no refinado | Refinamiento |
| **Refinado** | Con criterios de aceptación | Estimación |
| **Estimado** | Con story points | Priorización |
| **Ready** | Cumple DoR | Mover a Sprint Planning |
| **In Sprint** | En desarrollo | Daily tracking |
| **Done** | Cumple DoD | Demostración |

---

## 9. ANEXOS

### A. Glosario de Términos

| Término | Definición |
|---------|------------|
| **Story Point** | Unidad abstracta de esfuerzo (Fibonacci: 1,2,3,5,8,13) |
| **Velocity** | Story points completados por sprint |
| **Spike** | Historia de investigación sin entregable funcional |
| **Epic** | Agrupación de historias relacionadas (feature grande) |
| **DoD** | Definition of Done - Criterios de completitud |
| **DoR** | Definition of Ready - Criterios para comenzar |
| **Burndown** | Gráfico de trabajo restante vs tiempo |
| **RBAC** | Role-Based Access Control (control por roles) |

### B. Stack Tecnológico Recomendado

**Backend:**
- Node.js 20+ con Express.js
- PostgreSQL 14+ con Sequelize ORM
- JWT para autenticación
- Docker para sandbox de código
- Redis para caching (opcional)

**Frontend:**
- React 18+ con Vite
- TailwindCSS para estilos
- Monaco Editor para código
- Chart.js para gráficos
- Axios para HTTP requests

**DevOps:**
- GitHub Actions para CI/CD
- Docker Compose para desarrollo
- AWS/Azure para producción
- Nginx como reverse proxy

### C. Estimación de Story Points

**Referencia Fibonacci:**
- **1 punto:** < 2 horas (trivial, cambio de texto)
- **2 puntos:** 2-4 horas (formulario simple)
- **3 puntos:** 4-8 horas (CRUD básico)
- **5 puntos:** 1-2 días (feature media con backend+frontend)
- **8 puntos:** 2-3 días (feature compleja con integraciones)
- **13 puntos:** 3-5 días (microservicio completo)
- **21+ puntos:** Épica, requiere división

### D. Plantilla de Historia de Usuario

```markdown
## HU-XXX: [Título]

**Como** [rol]
**Quiero** [acción/funcionalidad]
**Para** [beneficio/valor]

### Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

### Notas Técnicas
- Endpoint: POST /api/...
- Modelo de datos: User, Course
- Dependencias: librería XYZ

### Definición de Hecho
- [ ] Código en main
- [ ] Tests pasando (70%+ cobertura)
- [ ] Code review aprobado
- [ ] Documentación actualizada
- [ ] Demo al PO aprobada
```

---

## 10. APROBACIONES Y CONTROL DE CAMBIOS

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-02-24 | Equipo de Desarrollo | Creación inicial del backlog |

**Próxima Revisión:** 2026-03-10 (Post Sprint 3)

---

## RESUMEN EJECUTIVO

**Total de Historias en MVP:** 35
**Total de Story Points:** 204
**Duración Estimada:** 30 días hábiles (6 sprints de 5 días)
**Velocity Promedio Requerida:** 34 puntos/sprint
**Riesgo Global del Proyecto:** MEDIO
**Probabilidad de Éxito:** 85% (con mitigaciones aplicadas)

**Próximos Pasos:**
1. Validación de backlog con stakeholders
2. Kick-off de Sprint 0 (infraestructura)
3. Sprint Planning de Sprint 1
4. Inicio de desarrollo (Día 1)

---

**Nota Final:** Este backlog es un documento vivo. Se espera que evolucione con feedback de usuarios, descubrimientos técnicos y cambios de prioridad. Revisiones formales se harán cada 2 sprints.
