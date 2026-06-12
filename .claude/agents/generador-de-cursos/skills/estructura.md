# Skill: Generador de Estructura

Genera la arquitectura modular completa del curso basándose en el cuestionario y la investigación.

## Propósito

Crear estructura de módulos, lecciones y laboratorios optimizada pedagógicamente.

## Entradas

- `questionnaire`: Respuestas del cuestionario
- `research`: Resultados de la investigación

## Salidas

Objeto `CourseStructure` con módulos, lecciones, labs y proyecto final.

## Herramientas

Ninguna (procesamiento de datos).

## Proceso

### 1. Calcular Número de Módulos

```
Basado en duración total:
- 8-12h → 4-6 módulos
- 20-40h → 6-10 módulos
- 50-80h → 10-15 módulos

Fórmula: numModulos = Math.ceil(duracionTotal / 5)
Ajustar según profundidad y balance
```

### 2. Distribuir Duración

```
Patrón estándar:
- Módulo 1 (Fundamentos): 15% si entryLevel=zero, sino 10%
- Módulos intermedios: 60-70% distribuido equitativamente
- Módulos avanzados: 15-20% si exitLevel>=professional
- Proyecto final: 5%
```

### 3. Definir Títulos de Módulos

```
Basado en research.primarySources.officialDocs:
- Analizar estructura de documentación oficial
- Extraer temas principales
- Ordenar por progresión lógica

Si topic="GraphQL", generar:
1. Fundamentos de GraphQL
2. Schema y Type System
3. Queries y Mutations
4. Resolvers y Data Sources
5. Autenticación y Autorización
6. Performance y Caching
7. Testing y Debugging
8. Producción y Monitoreo
9. Proyecto Final
```

### 4. Generar Lecciones por Módulo

```
Para cada módulo:
  numLecciones = Math.ceil(duracionModulo / 45) // 45 min por lección

  Distribuir según theoryPracticeBalance:
  - Si 40/60: 40% del tiempo en lecciones teóricas
  - Resto en labs

  Para cada lección:
    - Título extraído de docs oficiales
    - Duración: 30-60 min
    - Depth: según questionnaire
    - Topics: subtemas cubiertos
    - Sources: URLs de fuentes para ese tema específico
```

### 5. Generar Labs por Módulo

```
Para cada módulo:
  numLabs = Math.ceil(numLecciones * 0.75) // ~3 labs por 4 lecciones

  Para cada lab:
    - Título: basado en objetivos prácticos
    - Duración: 45-90 min
    - Difficulty: escala según profundidad del módulo
    - Objectives: qué logrará el estudiante
    - Prerequisites: lecciones previas necesarias
```

### 6. Generar Evaluaciones

```
Para cada módulo:
  quiz = {
    title: "Evaluación: [Título del Módulo]",
    questionCount: Math.max(10, Math.ceil(numLecciones * 2.5)),
    passingScore: 70,
    timeLimit: questionCount * 2, // 2 min por pregunta
    attempts: 3
  }
```

### 7. Diseñar Proyecto Final

```
Basado en exitLevel:
- Fundamentals: Proyecto básico integrador
- Practitioner: Aplicación funcional completa
- Professional: Sistema production-ready
- Expert: Contribución a proyecto real o herramienta propia

Complexity:
- basic: Usa 3-4 conceptos del curso
- intermediate: Integra mayoría del contenido
- advanced: Todo el contenido + features adicionales
- production: Deployable, monitoreado, documentado

Deliverables:
- Código funcional
- Tests
- Documentación
- (Opcional) Video demo
- (Opcional) Deployment live
```

## Mostrar Estructura al Usuario

```
Mostrar:
"🏗️ ESTRUCTURA GENERADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Curso: [título]
⏱️ Duración: [X] horas
📦 [Y] módulos | [Z] lecciones | [W] labs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MÓDULO 01: [Título] (Xh)
├─ Lección 1.1: [Título] (45 min)
├─ Lección 1.2: [Título] (45 min)
├─ Lab 1.1: [Título] (60 min)
├─ Lab 1.2: [Título] (60 min)
└─ Quiz 1 (20 preguntas)

MÓDULO 02: [Título] (Xh)
├─ Lección 2.1: [Título] (45 min)
...

[Mostrar todos los módulos]

MÓDULO [N]: Proyecto Final (Xh)
└─ Proyecto: [Descripción]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Distribución:
   Teoría: [X]h ([Y]%)
   Práctica: [W]h ([Z]%)
   Evaluación: [V]h

¿Aprobar esta estructura?"

Opciones:
A) Sí, continuar
B) Ajustar duración de módulos
C) Cambiar títulos
D) Agregar/quitar módulos
E) Ver detalles de un módulo específico

Permitir ajustes interactivos
```

## Formato de Salida

```json
{
  "course": {
    "title": "GraphQL: De Básico a Profesional",
    "slug": "graphql-basico-profesional",
    "description": "Curso completo...",
    "duration": 2400,
    "level": "INTERMEDIATE",
    "tags": ["graphql", "api", "backend"]
  },
  "modules": [
    {
      "order": 1,
      "title": "Fundamentos de GraphQL",
      "description": "...",
      "duration": 360,
      "depth": 3,
      "objectives": ["...", "..."],
      "lessons": [
        {
          "order": 1,
          "title": "¿Qué es GraphQL?",
          "duration": 45,
          "type": "TEXT",
          "depth": 2,
          "topics": ["historia", "ventajas", "vs REST"],
          "sources": ["https://graphql.org/learn/"]
        }
      ],
      "labs": [
        {
          "order": 1,
          "title": "Primera Query GraphQL",
          "duration": 60,
          "difficulty": 2,
          "objectives": ["Ejecutar queries", "Filtrar datos"],
          "prerequisites": ["Lección 1.1", "Lección 1.2"]
        }
      ],
      "quiz": {
        "title": "Evaluación: Fundamentos",
        "questionCount": 15,
        "passingScore": 70,
        "timeLimit": 30,
        "attempts": 3
      }
    }
  ],
  "finalProject": {
    "title": "API GraphQL Production-Ready",
    "description": "...",
    "duration": 120,
    "complexity": "advanced",
    "deliverables": ["Código", "Tests", "Docs", "Deployment"]
  },
  "metadata": {
    "totalModules": 9,
    "totalLessons": 36,
    "totalLabs": 27,
    "totalQuizzes": 9,
    "theoryHours": 16,
    "practiceHours": 22,
    "evaluationHours": 2
  }
}
```

## Validaciones

- Suma de duraciones = duración total del curso
- Cada módulo tiene >= 2 lecciones
- Cada módulo tiene >= 1 lab
- Progresión lógica de temas
- Balance teoría/práctica según questionnaire

## Tiempo Estimado

2-3 minutos.
