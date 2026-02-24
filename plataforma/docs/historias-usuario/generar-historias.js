/**
 * Script para generar las historias de usuario faltantes
 * Basado en el backlog.md y el patrón establecido en HU-001 a HU-006
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'pendientes');

// Definir todas las historias de usuario según el backlog
const historias = [
  // Sprint 1 - Ya creadas (HU-001 a HU-005)

  // Sprint 2 - Dashboard Administrativo
  // HU-006 ya creada
  {
    id: 'HU-007',
    titulo: 'Dashboard con Estadísticas Globales',
    epica: 'EP-002 - Dashboard Administrativo',
    sprint: 2,
    puntos: 8,
    prioridad: 'Must Have',
    rol: 'administrador',
    funcionalidad: 'ver un dashboard con métricas clave de la plataforma',
    beneficio: 'tomar decisiones informadas basadas en datos',
    criterios: [
      'KPIs principales visibles: Total usuarios (activos/inactivos), Total cursos publicados, Tasa de completitud promedio, Usuarios activos últimos 7 días',
      'Gráfico de registros por semana (últimos 3 meses) usando Chart.js',
      'Gráfico de cursos más populares (top 5) en formato bar chart',
      'Distribución de usuarios por perfil en pie chart',
      'Tabla de actividad reciente mostrando últimos 10 eventos del sistema',
      'Actualización automática de datos cada 5 minutos usando polling o websocket',
      'Botón para exportar estadísticas en formato CSV con todos los datos visibles',
      'Endpoint GET /api/admin/dashboard/stats retornando todas las métricas'
    ],
    dependencias: {
      depende: ['HU-006'],
      bloqueante: ['HU-008']
    }
  },
  {
    id: 'HU-008',
    titulo: 'Ver Progreso Detallado de un Usuario',
    epica: 'EP-002 - Dashboard Administrativo',
    sprint: 2,
    puntos: 5,
    prioridad: 'Must Have',
    rol: 'administrador',
    funcionalidad: 'ver el progreso detallado de un estudiante específico',
    beneficio: 'identificar necesidades de soporte y áreas de mejora individual',
    criterios: [
      'Modal o página de detalles con información personal (nombre, email, perfil, fecha de registro)',
      'Lista de cursos inscritos con porcentaje de completitud visual (progress bars)',
      'Badges obtenidos mostrados en galería con iconos',
      'Historial de quizzes con score promedio y tendencia',
      'Lista de laboratorios completados con fecha y resultado',
      'Proyectos entregados con calificaciones y estado de evaluación',
      'Línea de tiempo de actividad mostrando últimas 30 acciones del usuario',
      'Gráfico de progreso por módulo en cada curso (bar chart horizontal)',
      'Endpoint GET /api/admin/users/:id/progress con toda la información'
    ],
    dependencias: {
      depende: ['HU-006', 'HU-015'],
      bloqueante: []
    }
  },
  {
    id: 'HU-009',
    titulo: 'Gestión de Perfiles de Entrenamiento',
    epica: 'EP-002 - Dashboard Administrativo',
    sprint: 2,
    puntos: 5,
    prioridad: 'Must Have',
    rol: 'administrador',
    funcionalidad: 'crear y gestionar perfiles de entrenamiento personalizados',
    beneficio: 'agrupar cursos según necesidades organizacionales y roles',
    criterios: [
      'CRUD completo de perfiles: crear, leer, actualizar, eliminar',
      'Formulario con campos: nombre del perfil, descripción detallada, cursos incluidos (selección múltiple), duración estimada en horas, estado (activo/inactivo)',
      'Interfaz de creación con drag & drop para ordenar cursos incluidos',
      'Validación de nombre único a nivel de base de datos y frontend',
      'Modal de confirmación antes de eliminar perfil (warning si tiene usuarios asignados)',
      'Vista de perfiles en grid de tarjetas mostrando información resumida',
      'Endpoints: GET/POST /api/admin/profiles, GET/PUT/DELETE /api/admin/profiles/:id',
      'Modelo Profile con relaciones a Course y User'
    ],
    dependencias: {
      depende: ['HU-011'],
      bloqueante: ['HU-010', 'HU-013']
    }
  },
  {
    id: 'HU-010',
    titulo: 'Asignar/Modificar Perfil de Usuario',
    epica: 'EP-002 - Dashboard Administrativo',
    sprint: 2,
    puntos: 3,
    prioridad: 'Must Have',
    rol: 'administrador',
    funcionalidad: 'asignar o modificar el perfil de entrenamiento de un usuario',
    beneficio: 'personalizar la ruta de aprendizaje según rol del estudiante',
    criterios: [
      'Opción "Asignar Perfil" disponible en tabla de usuarios (HU-006)',
      'Dropdown con lista de perfiles activos disponibles',
      'Al asignar perfil, auto-inscribir al usuario en todos los cursos del perfil',
      'Confirmación visual con toast notification tras cambio exitoso',
      'Email de notificación automático al usuario informando del nuevo perfil asignado',
      'Historial de cambios de perfil almacenado para auditoría (tabla ProfileHistory)',
      'Endpoint PATCH /api/admin/users/:id/assign-profile con body: { profileId }',
      'Validación de que el perfil existe y está activo'
    ],
    dependencias: {
      depende: ['HU-006', 'HU-009'],
      bloqueante: []
    }
  },

  // Sprint 3 - Sistema Multi-Curso
  {
    id: 'HU-011',
    titulo: 'Modelo de Datos para Múltiples Cursos',
    epica: 'EP-003 - Sistema Multi-Curso',
    sprint: 3,
    puntos: 8,
    prioridad: 'Must Have',
    rol: 'desarrollador',
    funcionalidad: 'diseñar un modelo de datos escalable para soportar múltiples cursos',
    beneficio: 'permitir el crecimiento ilimitado de la plataforma con arquitectura sólida',
    criterios: [
      'Esquema Prisma con entidades: Course (id, title, description, slug, duration, difficulty, imageUrl, createdAt)',
      'Modelo Module: id, courseId, title, order, description con relación a Course',
      'Modelo Lesson: id, moduleId, title, order, type (video, text, quiz, lab), content (markdown o JSON)',
      'Modelo UserCourseEnrollment: userId, courseId, enrolledAt, progress (%), completedAt',
      'Modelo UserLessonProgress: userId, lessonId, completed, completedAt, attempts',
      'Foreign keys y constraints de integridad referencial definidos',
      'Índices en campos frecuentemente consultados: slug, userId, courseId',
      'Migrations de Prisma ejecutables y versionadas correctamente',
      'Seeds con datos de ejemplo: mínimo 3 cursos completos con 2-3 módulos cada uno'
    ],
    dependencias: {
      depende: [],
      bloqueante: ['HU-012', 'HU-013', 'HU-014', 'HU-015', 'HU-009']
    }
  },
  {
    id: 'HU-012',
    titulo: 'Importador de Curso desde Markdown',
    epica: 'EP-003 - Sistema Multi-Curso',
    sprint: 3,
    puntos: 8,
    prioridad: 'Must Have',
    rol: 'administrador',
    funcionalidad: 'importar un curso completo desde archivos markdown estructurados',
    beneficio: 'acelerar la creación de contenido sin necesidad de interfaces complejas',
    criterios: [
      'Endpoint POST /api/admin/courses/import aceptando multipart/form-data (ZIP file)',
      'Estructura de ZIP esperada: course-name/{course.json, modules/01-module-name/lessons/{01-lesson.md, 02-quiz.json, 03-lab.md}}',
      'Parser de markdown con frontmatter (título, orden, tipo de lección)',
      'Validación de estructura completa antes de iniciar importación',
      'Preview del curso en interfaz antes de confirmar importación definitiva',
      'Creación automática de registros Course, Modules, Lessons en base de datos',
      'Manejo robusto de errores con rollback completo si falla cualquier paso',
      'Progress indicator durante importación (websocket o polling)',
      'Logs detallados de importación guardados para debugging'
    ],
    dependencias: {
      depende: ['HU-011'],
      bloqueante: ['HU-013']
    }
  },
  {
    id: 'HU-013',
    titulo: 'Catálogo de Cursos Filtrado por Perfil',
    epica: 'EP-003 - Sistema Multi-Curso',
    sprint: 3,
    puntos: 5,
    prioridad: 'Must Have',
    rol: 'estudiante',
    funcionalidad: 'ver un catálogo de cursos filtrado según mi perfil asignado',
    beneficio: 'enfocarme en contenido relevante para mi rol sin distracciones',
    criterios: [
      'Página /courses con grid responsive de tarjetas de cursos',
      'Cada tarjeta muestra: imagen destacada, título, descripción corta (150 chars), duración estimada, nivel de dificultad',
      'Filtrado automático si el usuario tiene perfil asignado (mostrar solo cursos de su perfil)',
      'Filtros manuales adicionales: dificultad (básico, intermedio, avanzado), duración (<10h, 10-20h, >20h)',
      'Búsqueda por nombre de curso con highlighting de resultados',
      'Indicador visual claro de cursos en los que ya está inscrito (badge "Inscrito")',
      'Click en tarjeta lleva a página de detalles del curso (/courses/:slug)',
      'Endpoint GET /api/courses con query params: profile, difficulty, search'
    ],
    dependencias: {
      depende: ['HU-011', 'HU-009'],
      bloqueante: ['HU-014']
    }
  },
  {
    id: 'HU-014',
    titulo: 'Sistema de Inscripción a Cursos',
    epica: 'EP-003 - Sistema Multi-Curso',
    sprint: 3,
    puntos: 5,
    prioridad: 'Must Have',
    rol: 'estudiante',
    funcionalidad: 'inscribirme en un curso con un solo click',
    beneficio: 'comenzar mi aprendizaje inmediatamente sin fricciones',
    criterios: [
      'Botón "Inscribirse" prominente en página de detalles de curso',
      'Creación de registro en UserCourseEnrollment con timestamp de inscripción',
      'Verificación de que el usuario no esté ya inscrito (prevenir duplicados)',
      'Confirmación visual con modal o toast notification de éxito',
      'Redirección automática a la primera lección del primer módulo del curso',
      'Email de bienvenida al curso con información general y tabla de contenidos',
      'El curso aparece ahora en sección "Mis Cursos" del dashboard del estudiante',
      'Endpoint POST /api/courses/:id/enroll',
      'Tracking inicial de progreso: 0% completado'
    ],
    dependencias: {
      depende: ['HU-013'],
      bloqueante: ['HU-015', 'HU-016']
    }
  },
  {
    id: 'HU-015',
    titulo: 'Tracking de Progreso por Curso y Módulo',
    epica: 'EP-003 - Sistema Multi-Curso',
    sprint: 3,
    puntos: 8,
    prioridad: 'Must Have',
    rol: 'estudiante',
    funcionalidad: 'que mi progreso se guarde automáticamente',
    beneficio: 'retomar donde lo dejé sin perder mi avance',
    criterios: [
      'Al completar una lección, actualizar UserLessonProgress.completed = true automáticamente',
      'Cálculo dinámico de progreso del curso: (lecciones_completadas / total_lecciones) * 100',
      'Actualización de UserCourseEnrollment.progress en tiempo real (debounce 2 segundos)',
      'Barra de progreso visual en cada módulo y en vista general del curso',
      'Persistencia inmediata en base de datos con manejo de errores',
      'Sincronización entre dispositivos (misma cuenta)',
      'Endpoint GET /api/courses/:id/progress retornando estado completo',
      'Endpoint PATCH /api/lessons/:id/complete para marcar lección',
      'Cálculo de fecha estimada de completitud basada en ritmo actual'
    ],
    dependencias: {
      depende: ['HU-014'],
      bloqueante: ['HU-008', 'HU-016', 'HU-027', 'HU-029', 'HU-030']
    }
  },

  // Sprint 4 - Contenido Educativo y Quizzes
  {
    id: 'HU-016',
    titulo: 'Visor de Lecciones con Markdown Rendering',
    epica: 'EP-004 - Visualización de Contenido Educativo',
    sprint: 4,
    puntos: 5,
    prioridad: 'Must Have',
    rol: 'estudiante',
    funcionalidad: 'ver lecciones formateadas con markdown',
    beneficio: 'tener una experiencia de lectura agradable y profesional',
    criterios: [
      'Renderizado de markdown usando marked.js + DOMPurify para seguridad',
      'Soporte completo para: encabezados (h1-h6), código con syntax highlighting (highlight.js), listas ordenadas y desordenadas, imágenes embebidas, tablas, links externos (abrir en nueva pestaña)',
      'Estilo consistente con diseño de la plataforma (tipografía, colores)',
      'Copy button en cada bloque de código para copiar al clipboard',
      'Navegación anterior/siguiente lección con keyboard shortcuts (←/→)',
      'Botón "Marcar como completada" que actualiza progreso (HU-015)',
      'Renderizado responsivo para móviles',
      'Endpoint GET /api/lessons/:id retornando contenido markdown'
    ],
    dependencias: {
      depende: ['HU-015'],
      bloqueante: ['HU-020', 'HU-023']
    }
  },
  {
    id: 'HU-017',
    titulo: 'Sistema de Quizzes (Multiple Choice, True/False)',
    epica: 'EP-005 - Sistema de Evaluaciones',
    sprint: 4,
    puntos: 8,
    prioridad: 'Should Have',
    rol: 'instructor',
    funcionalidad: 'crear quizzes con diferentes tipos de preguntas',
    beneficio: 'evaluar el conocimiento de los estudiantes automáticamente',
    criterios: [
      'Modelo de datos Quiz: id, lessonId, title, passingScore (%), timeLimit (minutos), attemptsAllowed',
      'Modelo Question: id, quizId, type (multiple_choice, true_false, short_answer), text, order, points',
      'Modelo Answer: id, questionId, text, isCorrect (boolean)',
      'Interfaz admin de creación de quiz con editor WYSIWYG',
      'Drag & drop para ordenar preguntas dentro del quiz',
      'Editor de preguntas con opciones de respuesta dinámicas (agregar/eliminar)',
      'Marcar una o múltiples respuestas correctas según tipo de pregunta',
      'Preview del quiz completo antes de publicar',
      'Validación: al menos 1 respuesta correcta por pregunta',
      'Endpoints: POST/GET /api/quizzes, GET/PUT/DELETE /api/quizzes/:id'
    ],
    dependencias: {
      depende: ['HU-011'],
      bloqueante: ['HU-018', 'HU-019']
    }
  },
  {
    id: 'HU-018',
    titulo: 'Auto-calificación de Quizzes',
    epica: 'EP-005 - Sistema de Evaluaciones',
    sprint: 4,
    puntos: 5,
    prioridad: 'Should Have',
    rol: 'estudiante',
    funcionalidad: 'recibir mi calificación inmediatamente después de completar un quiz',
    beneficio: 'saber mi nivel de comprensión sin esperar evaluación manual',
    criterios: [
      'Al enviar quiz, calcular score automático: (puntos_obtenidos / puntos_totales) * 100',
      'Mostrar resultados desglosados: Score total (%), Preguntas correctas vs incorrectas, Tiempo tomado, Estado: Aprobado/Reprobado (según passingScore)',
      'Feedback por pregunta mostrando respuesta correcta vs seleccionada',
      'Guardar intento en modelo QuizAttempt con timestamp, userId, quizId, score, answers (JSON)',
      'Actualizar progreso de lección automáticamente si aprueba (score >= passingScore)',
      'Permitir reintento si attemptsAllowed > intentos actuales del usuario',
      'Mostrar intentos restantes antes de iniciar quiz',
      'Endpoint POST /api/quizzes/:id/submit con body: { answers: [{ questionId, selectedAnswerIds }] }'
    ],
    dependencias: {
      depende: ['HU-017'],
      bloqueante: ['HU-019']
    }
  },
  {
    id: 'HU-019',
    titulo: 'Historial de Intentos de Quiz',
    epica: 'EP-005 - Sistema de Evaluaciones',
    sprint: 4,
    puntos: 3,
    prioridad: 'Should Have',
    rol: 'estudiante',
    funcionalidad: 'ver mi historial de intentos en cada quiz',
    beneficio: 'identificar mis áreas de mejora y evolución',
    criterios: [
      'Tabla de intentos con columnas: Intento #, Fecha/Hora, Score (%), Tiempo tomado, Estado (Aprobado/Reprobado)',
      'Click en cada intento para ver detalles: respuestas dadas, feedback por pregunta',
      'Gráfico de evolución de scores entre intentos (line chart)',
      'Indicador visual del mejor intento con badge destacado',
      'Botón "Reintentar Quiz" si quedan intentos permitidos',
      'Estadísticas generales: score promedio, tiempo promedio, tasa de aprobación',
      'Endpoint GET /api/quizzes/:id/attempts retornando historial del usuario',
      'Filtros por estado (aprobado/reprobado) y ordenamiento por fecha'
    ],
    dependencias: {
      depende: ['HU-018'],
      bloqueante: []
    }
  },
  {
    id: 'HU-020',
    titulo: 'Navegación por Módulos y Lecciones',
    epica: 'EP-004 - Visualización de Contenido Educativo',
    sprint: 4,
    puntos: 5,
    prioridad: 'Must Have',
    rol: 'estudiante',
    funcionalidad: 'navegar fácilmente entre módulos y lecciones',
    beneficio: 'avanzar en el curso sin fricción ni confusión',
    criterios: [
      'Sidebar con acordeón de módulos expandibles/colapsables',
      'Cada módulo muestra lista de lecciones con iconos según tipo: 📖 (texto), 🎥 (video), ❓ (quiz), 💻 (lab)',
      'Indicador de completitud visual (checkmark verde) en lecciones completadas',
      'Lección actual destacada con fondo de color diferente',
      'Breadcrumbs en parte superior: Curso > Módulo > Lección',
      'Botones "Anterior" y "Siguiente" en cada lección con navegación fluida',
      'Auto-scroll a lección actual en sidebar al cargar página',
      'Bloqueo opcional de lecciones (requieren completar previas) - configurable por curso',
      'Contador de lecciones: "Lección X de Y" visible'
    ],
    dependencias: {
      depende: ['HU-016'],
      bloqueante: []
    }
  },
  {
    id: 'HU-023',
    titulo: 'Soporte para Multimedia Embebido',
    epica: 'EP-004 - Visualización de Contenido Educativo',
    sprint: 4,
    puntos: 3,
    prioridad: 'Should Have',
    rol: 'instructor',
    funcionalidad: 'embebir videos de YouTube y otros recursos multimedia',
    beneficio: 'enriquecer el contenido educativo con recursos visuales',
    criterios: [
      'Markdown parser detecta automáticamente enlaces de YouTube/Vimeo',
      'Renderizado automático como iframe embebido responsive',
      'Soporte para archivos de audio (mp3, wav) con reproductor HTML5',
      'Embebido de diagramas usando Mermaid.js en bloques de código ```mermaid',
      'Galería de imágenes con lightbox para visualización ampliada',
      'Validación de URLs externas con whitelist de dominios confiables',
      'Lazy loading de iframes para performance',
      'Placeholder con thumbnail mientras carga el video'
    ],
    dependencias: {
      depende: ['HU-016'],
      bloqueante: []
    }
  },

  // Sprint 5 - Laboratorios Ejecutables
  {
    id: 'HU-021',
    titulo: 'Editor de Código In-Browser (Monaco)',
    epica: 'EP-006 - Laboratorios Ejecutables',
    sprint: 5,
    puntos: 8,
    prioridad: 'Should Have',
    rol: 'estudiante',
    funcionalidad: 'escribir código directamente en el navegador',
    beneficio: 'practicar sin configurar mi entorno local',
    criterios: [
      'Integración de Monaco Editor (mismo editor de VS Code)',
      'Soporte para lenguajes: Python, JavaScript, Bash con detección automática',
      'Syntax highlighting automático según lenguaje seleccionado',
      'Autocompletado básico con snippets estándar del lenguaje',
      'Numeración de líneas visible y clickable',
      'Tema oscuro/claro con toggle persistente en localStorage',
      'Botones de acción: Ejecutar código, Resetear a código inicial, Descargar código',
      'Tamaño del editor ajustable (resize) con drag handle',
      'Atajos de teclado: Ctrl+S para ejecutar, Ctrl+R para resetear'
    ],
    dependencias: {
      depende: ['HU-011'],
      bloqueante: ['HU-022']
    }
  },
  {
    id: 'HU-022',
    titulo: 'Servicio de Ejecución de Código (Sandbox Docker)',
    epica: 'EP-006 - Laboratorios Ejecutables',
    sprint: 5,
    puntos: 13,
    prioridad: 'Should Have',
    rol: 'administrador',
    funcionalidad: 'ejecutar código de estudiantes en un entorno aislado',
    beneficio: 'proteger el servidor de código malicioso',
    criterios: [
      'Microservicio de ejecución con contenedores Docker efímeros',
      'API endpoint POST /api/labs/execute con body: { language, code, testCases }',
      'Timeout estricto de 30 segundos por ejecución (kill container después)',
      'Límite de memoria: 256MB por contenedor (configuración Docker)',
      'Límite de CPU: 0.5 cores máximo',
      'Captura completa de stdout, stderr y código de salida del proceso',
      'Limpieza automática de contenedores (max lifetime: 1 minuto)',
      'Rate limiting: 10 ejecuciones por minuto por usuario (Redis)',
      'Logging detallado de todas las ejecuciones para auditoría y debugging',
      'Network isolation: sin acceso a internet desde contenedores'
    ],
    dependencias: {
      depende: ['HU-021'],
      bloqueante: ['HU-024', 'HU-025', 'HU-026']
    }
  },
  {
    id: 'HU-024',
    titulo: 'Validación Automática de Labs',
    epica: 'EP-006 - Laboratorios Ejecutables',
    sprint: 5,
    puntos: 8,
    prioridad: 'Should Have',
    rol: 'instructor',
    funcionalidad: 'definir test cases que validen automáticamente el código del estudiante',
    beneficio: 'reducir evaluación manual y dar feedback inmediato',
    criterios: [
      'Modelo Lab: id, lessonId, starterCode, instructions (markdown), language',
      'Modelo TestCase: id, labId, input (JSON), expectedOutput, isHidden (prevenir hardcoding)',
      'Interfaz de creación de lab con editor de test cases (agregar/eliminar)',
      'Al ejecutar lab, correr todos los test cases automáticamente',
      'Comparación de output: string matching exacto, regex, JSON diff',
      'Resultado visual por test case: ✅ Test Passed / ❌ Test Failed',
      'Detalles de error mostrando: expected vs actual output',
      'Progreso de tests: "X/Y tests pasados" con barra de progreso',
      'Marcar lab como completado solo si 100% de tests pasan',
      'Endpoint POST /api/labs/:id/run con body: { code }'
    ],
    dependencias: {
      depende: ['HU-022'],
      bloqueante: []
    }
  },
  {
    id: 'HU-025',
    titulo: 'Terminal Output Simulation',
    epica: 'EP-006 - Laboratorios Ejecutables',
    sprint: 5,
    puntos: 5,
    prioridad: 'Should Have',
    rol: 'estudiante',
    funcionalidad: 'ver la salida de mi código como si estuviera en una terminal real',
    beneficio: 'experiencia auténtica de desarrollo',
    criterios: [
      'Componente de terminal estilo xterm.js con apariencia realista',
      'Colores ANSI preservados correctamente (stdout en blanco, stderr en rojo)',
      'Scroll automático al final del output al recibir nuevas líneas',
      'Timestamp de inicio y fin de ejecución visibles',
      'Indicador de proceso en ejecución (spinner animado) durante ejecución',
      'Botón "Clear output" para limpiar la terminal',
      'Botón "Copy output to clipboard" para copiar todo el output',
      'Máximo 10,000 líneas de output (prevenir flood y lag del navegador)',
      'Syntax highlighting básico de errores comunes'
    ],
    dependencias: {
      depende: ['HU-022'],
      bloqueante: []
    }
  },
  {
    id: 'HU-026',
    titulo: 'Soporte Multi-Lenguaje (Python, Bash, Node)',
    epica: 'EP-006 - Laboratorios Ejecutables',
    sprint: 5,
    puntos: 8,
    prioridad: 'Should Have',
    rol: 'instructor',
    funcionalidad: 'crear labs en diferentes lenguajes de programación',
    beneficio: 'cubrir diversas necesidades de aprendizaje en ciberseguridad',
    criterios: [
      'Imágenes Docker pre-construidas: Python 3.11 (con pip, pytest), Node.js 20 (con npm, jest), Bash 5.x (con herramientas estándar de Unix)',
      'Auto-detección de lenguaje desde extensión de archivo o metadata',
      'Configuración de dependencias por lab: requirements.txt para Python, package.json para Node',
      'Instalación automática de dependencias en contenedor antes de ejecutar',
      'Cache de imágenes Docker para reducir latencia de creación',
      'Selector de lenguaje en interfaz de creación de lab para instructores',
      'Validación de código malicioso básica (blacklist de comandos peligrosos)',
      'Soporte futuro para más lenguajes: Go, Rust, Ruby (arquitectura extensible)'
    ],
    dependencias: {
      depende: ['HU-022'],
      bloqueante: []
    }
  },

  // Sprint 6 - Proyectos y Gamificación
  {
    id: 'HU-027',
    titulo: 'Sistema de Entrega de Proyectos Finales',
    epica: 'EP-007 - Proyectos y Evaluación Manual',
    sprint: 6,
    puntos: 8,
    prioridad: 'Should Have',
    rol: 'estudiante',
    funcionalidad: 'entregar mi proyecto final subiendo archivos',
    beneficio: 'completar el curso y demostrar mi aprendizaje',
    criterios: [
      'Modelo Project: id, courseId, title, description, maxFileSize, allowedFormats, dueDate',
      'Modelo Submission: id, projectId, userId, files (JSON array), submittedAt, status (pending, graded)',
      'Interfaz de upload con drag & drop de archivos',
      'Validación de tamaño de archivos (máximo 50MB total)',
      'Validación de formatos permitidos (pdf, zip, docx, etc.) configurables por proyecto',
      'Preview de archivos antes de enviar (mostrar nombres, tamaños)',
      'Confirmación de entrega con timestamp y número de confirmación',
      'Email de confirmación de entrega al estudiante con resumen',
      'Posibilidad de re-entregar antes de deadline (overwrite submission anterior)',
      'Endpoint POST /api/projects/:id/submit (multipart/form-data)'
    ],
    dependencias: {
      depende: ['HU-015'],
      bloqueante: ['HU-028']
    }
  },
  {
    id: 'HU-028',
    titulo: 'Interfaz de Evaluación Manual (Instructores)',
    epica: 'EP-007 - Proyectos y Evaluación Manual',
    sprint: 6,
    puntos: 8,
    prioridad: 'Should Have',
    rol: 'instructor',
    funcionalidad: 'evaluar proyectos de estudiantes con una interfaz dedicada',
    beneficio: 'proporcionar feedback detallado de forma eficiente',
    criterios: [
      'Página /instructor/projects/:projectId/submissions con lista de entregas',
      'Filtros: pendiente, evaluado, atrasado (submitted después de dueDate)',
      'Click en entrega abre panel lateral de evaluación con información del estudiante',
      'Archivos entregados con download links individuales',
      'Viewer integrado para PDFs sin necesidad de descargar',
      'Rúbrica de evaluación configurable por proyecto (ver HU-032)',
      'Campo de puntuación numérica (0-100) con validación',
      'Área de feedback con rich text editor (bold, italic, lists)',
      'Botones: "Guardar como borrador" y "Enviar calificación final"',
      'Al enviar, actualizar estado a "graded" y notificar estudiante por email',
      'Historial de evaluaciones para auditoría',
      'Endpoint POST /api/projects/:id/submissions/:submissionId/grade'
    ],
    dependencias: {
      depende: ['HU-027'],
      bloqueante: ['HU-032']
    }
  },
  {
    id: 'HU-029',
    titulo: 'Sistema de Badges por Módulo',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 6,
    puntos: 5,
    prioridad: 'Could Have',
    rol: 'estudiante',
    funcionalidad: 'ganar badges al completar módulos y logros',
    beneficio: 'sentir logro y motivación para continuar aprendiendo',
    criterios: [
      'Modelo Badge: id, name, description, imageUrl (SVG/PNG), criteria (JSON con condiciones)',
      'Modelo UserBadge: userId, badgeId, earnedAt',
      'Badges predefinidos: "First Steps" (completar primer módulo), "Quiz Master" (aprobar 10 quizzes consecutivos), "Lab Expert" (completar 5 labs con 100%), "Course Graduate" (completar curso completo), badges específicos por curso',
      'Otorgamiento automático al cumplir criterios mediante event listeners',
      'Notificación visual animada (modal) al ganar badge con confetti',
      'Galería de badges en perfil de usuario mostrando obtenidos y bloqueados',
      'Badges bloqueados muestran cómo desbloquearlos (progress bar hacia logro)',
      'Endpoint GET /api/badges retornando todos los badges disponibles',
      'Endpoint GET /api/users/:id/badges retornando badges del usuario'
    ],
    dependencias: {
      depende: ['HU-015', 'HU-024'],
      bloqueante: ['HU-033', 'HU-034']
    }
  },
  {
    id: 'HU-030',
    titulo: 'Generación de Certificados PDF',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 6,
    puntos: 8,
    prioridad: 'Could Have',
    rol: 'estudiante',
    funcionalidad: 'obtener un certificado en PDF al completar un curso',
    beneficio: 'demostrar mi logro profesionalmente',
    criterios: [
      'Generación de PDF usando librería PDFKit o Puppeteer',
      'Template de certificado profesional con: logo de la plataforma, nombre del estudiante, nombre del curso completado, fecha de completitud, firma digital (imagen del instructor/admin), código único de verificación (UUID)',
      'Almacenamiento de PDF en S3/storage local con URL pública',
      'Botón "Descargar Certificado" visible en perfil del usuario',
      'Página pública de verificación /verify-certificate/:code mostrando certificado válido',
      'Watermark de seguridad en background del PDF',
      'Metadata del PDF: autor, fecha de creación, keywords',
      'Generación asíncrona con queue (Bull/BullMQ) para no bloquear',
      'Endpoint GET /api/certificates/:courseId retornando URL del certificado'
    ],
    dependencias: {
      depende: ['HU-015'],
      bloqueante: ['HU-031']
    }
  },
  {
    id: 'HU-031',
    titulo: 'Envío de Certificado por Email',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 6,
    puntos: 3,
    prioridad: 'Could Have',
    rol: 'estudiante',
    funcionalidad: 'recibir mi certificado automáticamente por email',
    beneficio: 'tenerlo disponible fácilmente en mi correo',
    criterios: [
      'Al completar 100% de un curso, disparar evento de generación y envío',
      'Generar PDF (HU-030) y enviar email con adjunto',
      'Asunto personalizado: "¡Felicidades! Has completado [Nombre del Curso]"',
      'Mensaje de felicitación personalizado con nombre del estudiante',
      'Certificado adjunto como PDF',
      'Link a verificación online del certificado',
      'Template de email profesional en HTML responsive',
      'Logs de envío exitoso/fallido para debugging',
      'Opción de reenviar certificado desde perfil (botón "Reenviar a mi email")',
      'Rate limiting para prevenir spam de reenvíos'
    ],
    dependencias: {
      depende: ['HU-030'],
      bloqueante: []
    }
  },
  {
    id: 'HU-032',
    titulo: 'Rúbricas de Calificación',
    epica: 'EP-007 - Proyectos y Evaluación Manual',
    sprint: 6,
    puntos: 5,
    prioridad: 'Should Have',
    rol: 'instructor',
    funcionalidad: 'usar rúbricas predefinidas para evaluar proyectos',
    beneficio: 'mantener consistencia en calificaciones entre estudiantes',
    criterios: [
      'Modelo Rubric: id, projectId, criteria (JSON array de criterios)',
      'Modelo Criterion: name, description, maxPoints, levels (array de descriptores por nivel)',
      'Interfaz de creación de rúbricas en configuración de proyecto',
      'Agregar/eliminar criterios dinámicamente',
      'Definir niveles de logro: Excelente (10pts), Bueno (7pts), Suficiente (5pts), Insuficiente (0pts)',
      'Preview de rúbrica antes de guardar',
      'En evaluación (HU-028), mostrar rúbrica con radio buttons por nivel de cada criterio',
      'Cálculo automático de puntuación total sumando puntos de cada criterio',
      'Rúbricas reutilizables entre proyectos (copiar de proyecto anterior)',
      'Template library con rúbricas comunes pre-diseñadas',
      'Endpoint POST/GET /api/rubrics'
    ],
    dependencias: {
      depende: ['HU-028'],
      bloqueante: []
    }
  },
  {
    id: 'HU-033',
    titulo: 'Gamificación - Sistema de Puntos (XP)',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 6,
    puntos: 5,
    prioridad: 'Could Have',
    rol: 'estudiante',
    funcionalidad: 'ganar puntos de experiencia (XP) por completar actividades',
    beneficio: 'competir con otros estudiantes y mantener motivación',
    criterios: [
      'Sistema de puntos definido: Completar lección (10 XP), Aprobar quiz (20 XP), Completar lab (30 XP), Entregar proyecto (50 XP), Ganar badge (100 XP)',
      'Modelo UserXP: userId, totalXP, level, xpToNextLevel',
      'Cálculo de nivel: level = floor(sqrt(totalXP / 100))',
      'Barra de progreso de nivel en navbar mostrando XP actual / XP necesario',
      'Leaderboard global mostrando top 10 estudiantes por XP total',
      'Animación visual al subir de nivel con sound effect (opcional)',
      'Historial de XP ganado en timeline (últimas 50 acciones)',
      'Otorgamiento automático de XP al completar actividades',
      'Endpoint GET /api/leaderboard retornando top usuarios',
      'Filtros de leaderboard: global, por curso, por periodo (semana/mes)'
    ],
    dependencias: {
      depende: ['HU-015', 'HU-029'],
      bloqueante: ['HU-034']
    }
  },
  {
    id: 'HU-034',
    titulo: 'Perfil Público de Usuario',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 6,
    puntos: 5,
    prioridad: 'Could Have',
    rol: 'estudiante',
    funcionalidad: 'tener un perfil público con mis logros',
    beneficio: 'compartir mi progreso con otros',
    criterios: [
      'Página /profile/:username con información pública del usuario',
      'Secciones: Avatar, nombre, bio personalizable, nivel y XP total con barra de progreso, badges ganados en galería con tooltips',
      'Cursos completados con certificados descargables',
      'Estadísticas: total quizzes aprobados, labs completados, tiempo total invertido',
      'Timeline de actividad reciente (últimas 20 acciones)',
      'Configuración de privacidad: perfil público/privado (toggle en settings)',
      'URL personalizada: /profile/custom-username (editable, validación de único)',
      'Botón "Compartir perfil" generando link + QR code',
      'Open Graph tags para preview bonito en redes sociales',
      'Endpoint GET /api/users/:username/public-profile'
    ],
    dependencias: {
      depende: ['HU-029', 'HU-033'],
      bloqueante: []
    }
  },
  {
    id: 'HU-035',
    titulo: 'Notificaciones In-App',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 6,
    puntos: 5,
    prioridad: 'Could Have',
    rol: 'usuario',
    funcionalidad: 'recibir notificaciones in-app de eventos importantes',
    beneficio: 'estar al tanto de mi progreso y actualizaciones',
    criterios: [
      'Modelo Notification: userId, type, title, message, read (boolean), createdAt',
      'Tipos de notificaciones: nuevo badge ganado, curso completado, proyecto calificado, nuevo curso disponible (según perfil), recordatorio de curso sin completar (7 días inactivo)',
      'Icono de campana en navbar con badge numérico de cantidad no leída',
      'Dropdown con lista de notificaciones (últimas 10) al hacer click',
      'Marcar como leída al hacer click en la notificación',
      'Página completa /notifications con todas las notificaciones',
      'Filtros por tipo y estado (leída/no leída)',
      'Ordenamiento por fecha (más recientes primero)',
      'Real-time notifications usando websockets (Socket.io)',
      'Endpoint GET /api/notifications, PATCH /api/notifications/:id/read'
    ],
    dependencias: {
      depende: ['HU-029', 'HU-030', 'HU-028'],
      bloqueante: []
    }
  },

  // Backlog Futuro (10 historias adicionales)
  {
    id: 'HU-036',
    titulo: 'Soporte Multi-Idioma (i18n)',
    epica: 'EP-008 - Gamificación y Certificados',
    sprint: 'Backlog',
    puntos: 13,
    prioridad: 'Wont Have',
    rol: 'usuario internacional',
    funcionalidad: 'usar la plataforma en mi idioma nativo',
    beneficio: 'mejorar mi experiencia de aprendizaje',
    criterios: [
      'Integración de i18next (React) con detección automática de idioma',
      'Idiomas soportados inicialmente: Español, Inglés',
      'Traducción completa de interfaz (UI strings)',
      'Selector de idioma en navbar con flags',
      'Persistencia de preferencia de idioma en localStorage',
      'Contenido de cursos multiidioma (metadata separada por idioma)',
      'Fallback a idioma por defecto si traducción no existe',
      'Números, fechas y monedas formateadas según locale'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-037',
    titulo: 'Modo Oscuro/Claro Personalizable',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 3,
    prioridad: 'Could Have',
    rol: 'usuario',
    funcionalidad: 'cambiar entre modo oscuro y claro',
    beneficio: 'reducir fatiga visual',
    criterios: [
      'Toggle en navbar para cambiar tema',
      'Persistencia en localStorage',
      'Transición suave entre temas',
      'Variables CSS para colores',
      'Respeto por preferencia del sistema operativo (prefers-color-scheme)',
      'Todos los componentes adaptados a ambos temas'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-038',
    titulo: 'Analytics Avanzados para Instructores',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 13,
    prioridad: 'Wont Have',
    rol: 'instructor',
    funcionalidad: 'ver analytics detallados de desempeño de mis estudiantes',
    beneficio: 'identificar contenido difícil y ajustar enseñanza',
    criterios: [
      'Dashboard de instructor con métricas por curso',
      'Gráficos de progreso promedio',
      'Heatmap de dificultad por lección',
      'Identificación de estudiantes en riesgo',
      'Exportación de reportes en PDF/Excel'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-039',
    titulo: 'Exportar Progreso de Estudiante',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 5,
    prioridad: 'Wont Have',
    rol: 'administrador',
    funcionalidad: 'exportar datos de progreso de estudiantes',
    beneficio: 'generar reportes externos',
    criterios: [
      'Exportación a CSV/Excel',
      'Filtros por curso, fecha, estado',
      'Incluir: progreso, calificaciones, tiempo invertido'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-040',
    titulo: 'Integración SCORM',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 21,
    prioridad: 'Wont Have',
    rol: 'administrador',
    funcionalidad: 'integrar cursos SCORM desde LMS externos',
    beneficio: 'ampliar catálogo sin recrear contenido',
    criterios: [
      'Importador de paquetes SCORM 1.2 y 2004',
      'Player SCORM integrado',
      'Tracking de progreso según estándar SCORM'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-041',
    titulo: 'PWA - Modo Offline',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 13,
    prioridad: 'Wont Have',
    rol: 'estudiante',
    funcionalidad: 'acceder a lecciones descargadas sin conexión',
    beneficio: 'estudiar en cualquier lugar',
    criterios: [
      'Service Worker para cache offline',
      'Descarga de lecciones para lectura offline',
      'Sincronización automática cuando hay conexión'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-042',
    titulo: 'Chat de Soporte en Vivo',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 21,
    prioridad: 'Wont Have',
    rol: 'estudiante',
    funcionalidad: 'hacer preguntas en tiempo real a instructores',
    beneficio: 'resolver dudas rápidamente',
    criterios: [
      'Chat en tiempo real con websockets',
      'Notificaciones push',
      'Historial de conversaciones'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-043',
    titulo: 'Foros de Discusión por Curso',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 13,
    prioridad: 'Wont Have',
    rol: 'estudiante',
    funcionalidad: 'participar en foros de discusión por curso',
    beneficio: 'aprender colaborativamente',
    criterios: [
      'Sistema de threads y respuestas',
      'Votación de respuestas útiles',
      'Moderación de contenido'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-044',
    titulo: 'Peer Review de Proyectos',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 13,
    prioridad: 'Wont Have',
    rol: 'estudiante',
    funcionalidad: 'revisar proyectos de otros estudiantes',
    beneficio: 'aprender de mis pares',
    criterios: [
      'Sistema de asignación aleatoria de revisiones',
      'Rúbricas para peer review',
      'Calificación combinada: instructor + peers'
    ],
    dependencias: { depende: [], bloqueante: [] }
  },
  {
    id: 'HU-045',
    titulo: 'Leaderboard Global',
    epica: 'Backlog Futuro',
    sprint: 'Backlog',
    puntos: 5,
    prioridad: 'Wont Have',
    rol: 'estudiante',
    funcionalidad: 'ver mi ranking global en la plataforma',
    beneficio: 'competir sanamente con otros estudiantes',
    criterios: [
      'Tabla de posiciones por XP',
      'Filtros por periodo y curso',
      'Sistema de temporadas/seasons'
    ],
    dependencias: { depende: [], bloqueante: [] }
  }
];

// Función para generar el contenido markdown de cada historia
function generarHistoria(historia) {
  const {
    id,
    titulo,
    epica,
    sprint,
    puntos,
    prioridad,
    rol,
    funcionalidad,
    beneficio,
    criterios,
    dependencias
  } = historia;

  const criteriosFormatted = criterios
    .map((c, index) => `- [ ] **AC${index + 1}:** ${c}`)
    .join('\n');

  const dependeFormatted = dependencias.depende.length > 0
    ? dependencias.depende.map(d => `- ${d}`).join(', ')
    : '- Ninguna';

  const bloqueaFormatted = dependencias.bloqueante.length > 0
    ? dependencias.bloqueante.map(d => `- ${d}`).join(', ')
    : '- Ninguna';

  return `# ${id}: ${titulo}

**Épica:** ${epica}
**Sprint:** ${sprint}
**Story Points:** ${puntos}
**Prioridad:** ${prioridad}
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** ${rol}
**Quiero** ${funcionalidad}
**Para** ${beneficio}

---

## Criterios de Aceptación

${criteriosFormatted}

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
${dependeFormatted}

**Bloqueante para:**
${bloqueaFormatted}

---

## Tests a Implementar

### Tests Unitarios
\`\`\`typescript
describe('${id}: ${titulo}', () => {
  // Implementar tests según criterios de aceptación
  it('debe cumplir AC1', () => {
    // test implementation
  });
});
\`\`\`

### Tests de Integración
\`\`\`typescript
describe('[${titulo}] Integration Tests', () => {
  // Implementar tests end-to-end
  it('debe completar flujo completo', async () => {
    // test implementation
  });
});
\`\`\`

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

- Documento de Arquitectura: \`docs/arquitectura.md\`
- Backlog: \`docs/backlog.md\` - Sprint ${sprint}, ${id}
- Diseño de base de datos: \`docs/database-schema.md\`
`;
}

// Generar archivos para historias faltantes (HU-007 en adelante)
const historiasFaltantes = historias.filter(h => {
  const num = parseInt(h.id.split('-')[1]);
  return num >= 7; // Ya tenemos HU-001 a HU-006
});

historiasFaltantes.forEach(historia => {
  const fileName = `${historia.id}-${historia.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}.md`;
  const filePath = path.join(BASE_DIR, fileName);
  const content = generarHistoria(historia);

  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Creado: ${fileName}`);
  } catch (error) {
    console.error(`❌ Error al crear ${fileName}:`, error.message);
  }
});

console.log(`\n🎉 Generación completa! ${historiasFaltantes.length} historias creadas.`);
