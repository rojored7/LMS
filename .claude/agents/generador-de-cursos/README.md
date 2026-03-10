# 🎓 Generador de Cursos Técnicos - Documentación

Sistema de agente autónomo para generar cursos completos de tecnología de alta calidad.

## 📋 Contenido

1. [¿Qué es esto?](#qué-es-esto)
2. [Cómo Usar el Agente](#cómo-usar-el-agente)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Skills Disponibles](#skills-disponibles)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [FAQ](#faq)

---

## ¿Qué es esto?

Un **agente de Claude Code** que te ayuda a generar cursos técnicos completos mediante:

✅ Cuestionario interactivo paso a paso
✅ Investigación automática de fuentes de calidad
✅ Generación de estructura modular optimizada
✅ Creación de contenido teórico con ejemplos reales
✅ Laboratorios prácticos ejecutables
✅ Evaluaciones (quizzes)
✅ Validación de calidad automática
✅ Archivo seed para importar a plataforma LMS

**Importante**: Este agente es un asistente que GENERA contenido, pero **TÚ DEBES REVISARLO Y VALIDARLO** antes de usarlo en producción.

---

## Cómo Usar el Agente

### Opción 1: Comando Directo (Rápido)

```
En Claude Code, escribe:

"Quiero generar un curso de [TEMA], [DURACIÓN] horas, nivel [NIVEL]"

Ejemplos:
- "Quiero generar un curso de Kubernetes, 40 horas, nivel avanzado"
- "Generar curso de Machine Learning, 30 horas, de cero a intermedio"
- "Crear curso de GraphQL APIs, 25 horas, profesional"
```

El agente iniciará automáticamente el proceso interactivo.

### Opción 2: Invocar el Agente Manualmente

```
En Claude Code:

Menciona: "generador de cursos" o "generar curso"
```

Luego el agente te guiará paso a paso.

---

## Estructura de Archivos

```
.claude/agents/generador-de-cursos/
├── agent.md                      # Definición del agente principal
├── skills/                       # Skills especializadas (8 total)
│   ├── cuestionario.md          # Entrevista interactiva
│   ├── investigacion.md         # Búsqueda de fuentes
│   ├── estructura.md            # Generación de módulos
│   ├── contenido.md             # Creación de lecciones
│   ├── laboratorios.md          # Generación de labs
│   ├── evaluaciones.md          # Creación de quizzes
│   ├── validacion.md            # Control de calidad
│   └── seed.md                  # Generación de seed.ts
├── templates/                    # Templates para contenido
│   ├── lesson-surface.md        # Lecciones nivel 1-2
│   ├── lesson-deep.md           # Lecciones nivel 3-4 (pendiente)
│   ├── lesson-expert.md         # Lecciones nivel 5 (pendiente)
│   └── seed.ts.template         # Template de seed (pendiente)
└── README.md                     # Esta documentación
```

---

## Skills Disponibles

### 1. 📋 Cuestionario (`cuestionario.md`)

**Qué hace**: Te hace 15 preguntas interactivas para definir el curso.

**Duración estimada**: 8-12 minutos

**Preguntas clave**:
- Tema del curso
- Duración total
- Nivel de entrada/salida
- Profundidad técnica (1-5)
- Balance teoría/práctica
- Stack tecnológico
- Fuentes mandatorias

### 2. 🔍 Investigación (`investigacion.md`)

**Qué hace**: Busca automáticamente las mejores fuentes del tema.

**Duración estimada**: 3-5 minutos

**Busca**:
- Documentación oficial
- Papers académicos (si profundidad >= 3)
- Casos de uso de empresas
- Libros técnicos
- Blogs de expertos

**Nota**: La calidad de las fuentes depende de qué tan bien documentado esté el tema en internet.

### 3. 🏗️ Estructura (`estructura.md`)

**Qué hace**: Genera arquitectura modular del curso.

**Duración estimada**: 2-3 minutos

**Genera**:
- Número óptimo de módulos basado en duración
- Títulos de módulos
- Lecciones por módulo
- Labs por módulo
- Evaluaciones
- Proyecto final

### 4. 📝 Contenido (`contenido.md`)

**Qué hace**: Crea lecciones teóricas en markdown.

**Duración estimada**: 5-8 min por lección

**Intenta incluir**:
- Introducción contextual
- Teoría técnica
- Ejemplos de código
- Diagramas cuando sea apropiado
- Casos de uso reales
- Referencias a fuentes

**Limitación**: El contenido generado es un **borrador** que necesita revisión humana.

### 5. 🧪 Laboratorios (`laboratorios.md`)

**Qué hace**: Genera labs prácticos ejecutables.

**Duración estimada**: 10-15 min por lab

**Intenta generar**:
- README con instrucciones
- Código inicial
- Solución completa
- Tests básicos

**Importante**: El código generado DEBE ser probado manualmente antes de usarlo con estudiantes.

### 6. ✅ Evaluaciones (`evaluaciones.md`)

**Qué hace**: Crea quizzes con preguntas y explicaciones.

**Duración estimada**: 5-7 min por quiz

**Genera**:
- 10+ preguntas por módulo
- Mix de tipos de pregunta
- Explicaciones de respuestas
- Distribución de dificultad

**Nota**: Las preguntas generadas deben ser revisadas por un experto en el tema.

### 7. 🔬 Validación (`validacion.md`)

**Qué hace**: Valida calidad del curso completo.

**Duración estimada**: 3-5 minutos

**Valida**:
- Completitud (todos los archivos generados)
- Enlaces no rotos
- Formato markdown correcto
- Estructura de carpetas

**No valida**:
- Exactitud técnica del contenido (requiere experto humano)
- Calidad pedagógica (requiere diseñador instruccional)

### 8. 🌱 Seed (`seed.md`)

**Qué hace**: Genera archivo para importar a plataforma.

**Duración estimada**: 2-3 minutos

**Genera**:
- Archivo `seed-[curso].ts`
- Carpetas de módulos con markdown
- Script npm para ejecutar

---

## Ejemplos de Uso

### Ejemplo 1: Generar Curso Completo

```
Usuario: "Quiero generar un curso de Docker Fundamentals"

Agente: "¡Perfecto! Te guiaré paso a paso.

📋 FASE 1: DEFINICIÓN DEL CURSO

Pregunta 1 de 15:
🎯 ¿Cuál es el tema principal del curso?"

Usuario: "Docker Fundamentals"

[Continúa con 14 preguntas más...]

Agente: "✅ Cuestionario completado!

📋 RESUMEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Tema: Docker Fundamentals
⏱️ Duración: 20 horas
📊 Nivel: Básico → Intermedio
🎯 Profundidad: Nivel 3

¿Confirmar?"

Usuario: "Sí"

Agente: "🔍 FASE 2: INVESTIGACIÓN

Buscando fuentes...
✓ Encontrado: docs.docker.com
✓ Encontrado: GitHub docker/docker
✓ Encontrado: 5 casos de uso

¿Continuar?"

[... proceso continúa ...]
```

---

## FAQ

### ¿Cuánto tiempo toma generar un curso?

**Tiempo estimado** (puede variar):
- Sprint (8-12h): 20-30 minutos
- Estándar (20-40h): 45-60 minutos
- Extenso (50-80h): 90-120 minutos

**Nota**: Estos son tiempos de generación. La revisión y ajustes posteriores pueden tomar horas o días adicionales.

### ¿El contenido generado está listo para producción?

**NO**. El agente genera un **borrador sólido** que necesita:

✅ **Revisión técnica** por un experto en el tema
✅ **Revisión pedagógica** por diseñador instruccional
✅ **Prueba de código** (todos los labs deben ejecutarse manualmente)
✅ **Revisión de calidad** (ortografía, coherencia, precisión)

Piensa en el agente como un **asistente muy capaz** que te ahorra 70-80% del trabajo, pero el 20-30% restante (revisión y pulido) es tu responsabilidad.

### ¿Puedo modificar el curso después de generarlo?

**Sí**, todo el contenido generado es markdown editable:
- Puedes editar cualquier lección
- Puedes ajustar laboratorios
- Puedes modificar evaluaciones
- Vuelve a ejecutar el seed para actualizar la plataforma

### ¿El código de los labs realmente funciona?

**El agente intenta** generar código ejecutable, pero:

⚠️ **Debes probarlo tú mismo** antes de darlo a estudiantes
⚠️ Puede haber errores de sintaxis o lógica
⚠️ Puede que falten dependencias
⚠️ Los tests pueden no cubrir todos los casos

**Recomendación**: Ejecuta cada lab manualmente y ajusta lo necesario.

### ¿Qué tan precisas son las fuentes de investigación?

El agente busca fuentes de calidad (documentación oficial, papers académicos, etc.), pero:

⚠️ **No puede verificar exactitud técnica** del contenido
⚠️ Puede que no encuentre las fuentes más recientes
⚠️ Para temas muy nuevos o nicho, puede haber pocas fuentes

**Recomendación**: Revisa las fuentes sugeridas y agrega las que conozcas que son importantes.

### ¿Puedo generar cursos en cualquier idioma?

Actualmente el agente genera contenido principalmente en **español**, con ejemplos de código en inglés (convención estándar).

Para otros idiomas, necesitarías ajustar los templates.

### ¿Qué pasa si me interrumpen durante la generación?

El agente guarda **checkpoints** automáticos:
- Después del cuestionario
- Después de investigación
- Después de estructura

Puedes continuar desde el último checkpoint (aunque esta funcionalidad puede variar según la implementación).

---

## ⚠️ Limitaciones Conocidas

### Cosas que el Agente PUEDE hacer bien:
✅ Estructura lógica del curso
✅ Búsqueda de fuentes oficiales
✅ Generación de borradores de contenido
✅ Creación de plantillas de laboratorios
✅ Formato y organización de archivos

### Cosas que el Agente NO PUEDE hacer (necesitas tú):
❌ Verificar exactitud técnica del contenido
❌ Garantizar que el código funcione al 100%
❌ Evaluar calidad pedagógica
❌ Adaptar contenido a audiencias específicas
❌ Actualizar contenido cuando cambian las tecnologías

### Mejores Prácticas:

1. **Usa el agente como punto de partida**, no como producto final
2. **Revisa TODO** el contenido generado
3. **Prueba TODOS** los laboratorios
4. **Valida** las fuentes de investigación
5. **Ajusta** según tu audiencia específica
6. **Actualiza** cuando las tecnologías cambien

---

## 🚀 Comenzar Ahora

**Para generar tu primer curso**:

```
En Claude Code, escribe:

"Quiero generar un curso de [TEMA]"

O simplemente:

"generar curso"
```

El agente te guiará desde ahí.

---

## 📝 Notas Finales

Este agente es una **herramienta poderosa** para:
- Acelerar creación de cursos
- Estructurar contenido lógicamente
- Investigar fuentes de calidad
- Generar borradores sólidos

**Pero NO reemplaza**:
- Expertise técnico en el tema
- Diseño instruccional profesional
- Pruebas exhaustivas de código
- Revisión humana de calidad

**Úsalo sabiamente** y obtendrás cursos de calidad en una fracción del tiempo. ✨

---

**¿Preguntas?** El agente responde dudas en tiempo real durante el proceso de generación.
