# Skill: Cuestionario Interactivo

Realiza entrevista paso a paso al usuario para definir completamente el curso a generar.

## Propósito

Capturar todos los parámetros necesarios para generar un curso de calidad mediante preguntas interactivas UNA POR UNA.

## Entradas

- Ninguna (inicia conversación desde cero)

## Salidas

Objeto `Questionnaire` completo con todas las respuestas del usuario.

## Herramientas a Usar

- `AskUserQuestion`: Para cada pregunta individual
- Conversación directa: Para preguntas abiertas

## Proceso Detallado

### SECCIÓN A: IDENTIFICACIÓN DEL CURSO (Preguntas 1-3)

#### Pregunta 1: Tema Principal
```
Mostrar:
"🎯 Pregunta 1 de 15: ¿Cuál es el tema principal del curso?

Ejemplos:
- Kubernetes para DevOps
- Machine Learning con Python
- Desarrollo de APIs con GraphQL
- Blockchain y Smart Contracts
- Arquitectura de Microservicios

Por favor escribe el tema:"

Esperar respuesta del usuario.
Validar: No vacío, mínimo 3 palabras.
Guardar en: questionnaire.topic
```

#### Pregunta 2: Tipo de Cobertura
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Quieres cubrir el tema completo o especializarte en algo específico?",
    header: "Cobertura",
    multiSelect: false,
    options: [
      {
        label: "Cobertura completa",
        description: "De cero a avanzado, cubriendo todos los aspectos"
      },
      {
        label: "Especialización",
        description: "Profundizar en un aspecto específico del tema"
      },
      {
        label: "Híbrido",
        description: "Fundamentos + especialización en un área"
      }
    ]
  }
]

Si elige "Especialización" o "Híbrido":
  Preguntar: "¿En qué aspecto específico quieres especializar?"
  Esperar respuesta.
  Guardar en: questionnaire.specialization
```

#### Pregunta 3: Duración Total
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Cuántas horas totales de contenido tendrá el curso?",
    header: "Duración",
    multiSelect: false,
    options: [
      {
        label: "Sprint (8-12 horas)",
        description: "Curso intensivo, enfocado en lo esencial"
      },
      {
        label: "Estándar (20-40 horas)",
        description: "Curso completo con teoría y práctica balanceada"
      },
      {
        label: "Extenso (50-80 horas)",
        description: "Bootcamp profundo y exhaustivo"
      },
      {
        label: "Personalizado",
        description: "Especificar cantidad exacta de horas"
      }
    ]
  }
]

Si elige "Personalizado":
  Preguntar: "¿Cuántas horas exactamente? (número entre 5 y 100)"
  Validar: Número válido entre 5 y 100
  Guardar en: questionnaire.totalDuration
```

### SECCIÓN B: NIVEL Y AUDIENCIA (Preguntas 4-6)

#### Pregunta 4: Nivel de Entrada
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Cuál es el nivel de conocimiento previo de tus estudiantes?",
    header: "Prerequisitos",
    multiSelect: false,
    options: [
      {
        label: "Cero absoluto",
        description: "Sin conocimientos previos en el tema"
      },
      {
        label: "Básico",
        description: "Nociones fundamentales de programación/tecnología"
      },
      {
        label: "Intermedio",
        description: "Experiencia práctica en el área"
      },
      {
        label: "Avanzado",
        description: "Profesionales buscando especialización"
      }
    ]
  }
]

Guardar en: questionnaire.entryLevel
```

#### Pregunta 5: Nivel de Salida
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Qué nivel de dominio alcanzará el estudiante al finalizar?",
    header: "Objetivo Final",
    multiSelect: false,
    options: [
      {
        label: "Fundamentos",
        description: "Entender conceptos y usar herramientas básicas"
      },
      {
        label: "Practicante",
        description: "Implementar soluciones reales"
      },
      {
        label: "Profesional",
        description: "Diseñar arquitecturas y aplicar mejores prácticas"
      },
      {
        label: "Experto",
        description: "Optimización avanzada, contribuir a proyectos open source"
      }
    ]
  }
]

Guardar en: questionnaire.exitLevel
```

#### Pregunta 6: Audiencia Objetivo
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Quién es tu estudiante ideal? (puedes seleccionar varios)",
    header: "Audiencia",
    multiSelect: true,
    options: [
      {
        label: "Estudiantes universitarios",
        description: "Carreras de CS, IT, Ingeniería"
      },
      {
        label: "Desarrolladores junior",
        description: "0-2 años de experiencia"
      },
      {
        label: "Desarrolladores senior",
        description: "3+ años de experiencia"
      },
      {
        label: "DevOps/SRE",
        description: "Especialistas en operaciones"
      },
      {
        label: "Arquitectos",
        description: "Diseñadores de sistemas"
      },
      {
        label: "Data Scientists",
        description: "Especialistas en datos/ML"
      }
    ]
  }
]

Guardar en: questionnaire.targetAudience
```

### SECCIÓN C: PROFUNDIDAD Y ALCANCE (Preguntas 7-9)

#### Pregunta 7: Profundidad Técnica General
```
Mostrar:
"🔬 Pregunta 7 de 15: ¿Qué nivel de profundidad técnica requieres?

Escala de 1 a 5:

⭐ Nivel 1 - SUPERFICIE
   Conceptos generales, uso básico de herramientas
   Ejemplo: 'Qué es Docker y cómo ejecutar un container'

⭐⭐ Nivel 2 - MODERADO
   Implementación práctica, patrones comunes
   Ejemplo: 'Cómo crear Dockerfiles optimizados'

⭐⭐⭐ Nivel 3 - PROFUNDO
   Internals, optimización, debugging avanzado
   Ejemplo: 'Cómo funciona overlay filesystem en Docker'

⭐⭐⭐⭐ Nivel 4 - MUY PROFUNDO
   Source code, arquitectura interna, contribución a proyectos
   Ejemplo: 'Análisis del código de containerd'

⭐⭐⭐⭐⭐ Nivel 5 - EXPERTO
   Research, edge cases, desarrollo de herramientas propias
   Ejemplo: 'Implementar runtime de containers desde cero'

¿Qué nivel? (escribe 1, 2, 3, 4 o 5)"

Validar: Número entre 1 y 5
Guardar en: questionnaire.technicalDepth.overall
```

#### Pregunta 8: Balance Teoría/Práctica
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Cuál es la distribución ideal entre teoría y práctica?",
    header: "Balance",
    multiSelect: false,
    options: [
      {
        label: "20/80 (Muy práctico)",
        description: "Mínima teoría, máximos ejercicios hands-on"
      },
      {
        label: "40/60 (Balanceado)",
        description: "Balance equilibrado - RECOMENDADO"
      },
      {
        label: "60/40 (Teórico)",
        description: "Énfasis en conceptos y fundamentos"
      }
    ]
  }
]

Guardar en: questionnaire.theoryPracticeBalance
```

#### Pregunta 9: Profundidad por Componente
```
Mostrar:
"Para cada componente del curso, indica el nivel de profundidad deseado (1-5):

Por ejemplo, puedes querer profundidad 5 en 'Implementación' pero solo 3 en 'Seguridad'.

Usa el mismo criterio de 1-5 que antes.
Si no estás seguro, deja en blanco y usaré la profundidad general (X).

Componente                    | Nivel (1-5)
------------------------------|-------------
Teoría fundamental            | __
Arquitectura/Diseño           | __
Implementación práctica       | __
Optimización/Performance      | __
Troubleshooting avanzado      | __
Seguridad                     | __
Escalabilidad                 | __

Escribe los niveles separados por comas (ej: 4,5,5,4,3,4,3)
O presiona Enter para usar nivel general en todos:"

Parsear respuesta y guardar en: questionnaire.technicalDepth.byComponent
Si vacío: usar questionnaire.technicalDepth.overall para todos
```

### SECCIÓN D: ENFOQUE PEDAGÓGICO (Preguntas 10-11)

#### Pregunta 10: Metodología de Enseñanza
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Qué enfoque pedagógico prefieres? (puedes seleccionar varios)",
    header: "Metodología",
    multiSelect: true,
    options: [
      {
        label: "Project-Based Learning",
        description: "Aprender construyendo proyectos completos"
      },
      {
        label: "Problem-Based Learning",
        description: "Resolver problemas reales del mundo laboral"
      },
      {
        label: "Tutorial-Based",
        description: "Seguir guías paso a paso estructuradas"
      },
      {
        label: "Conceptual",
        description: "Entender el 'por qué' antes del 'cómo'"
      },
      {
        label: "Case Studies",
        description: "Analizar implementaciones de empresas reales"
      }
    ]
  }
]

Guardar en: questionnaire.methodology
```

#### Pregunta 11: Tipo de Evaluación
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Cómo se evaluará el aprendizaje? (puedes seleccionar varios)",
    header: "Evaluación",
    multiSelect: true,
    options: [
      {
        label: "Quizzes teóricos",
        description: "Preguntas de opción múltiple sobre conceptos"
      },
      {
        label: "Ejercicios de código",
        description: "Implementar funcionalidades específicas"
      },
      {
        label: "Proyectos",
        description: "Aplicaciones completas end-to-end"
      },
      {
        label: "Exámenes prácticos",
        description: "Troubleshooting y debugging"
      },
      {
        label: "Certificación final",
        description: "Examen integral al finalizar"
      }
    ]
  }
]

Guardar en: questionnaire.evaluation
```

### SECCIÓN E: STACK TECNOLÓGICO (Preguntas 12-13)

#### Pregunta 12: Lenguajes y Frameworks
```
Mostrar:
"💻 Pregunta 12 de 15: ¿Qué lenguajes y frameworks se usarán en el curso?

Lenguajes de programación (ej: Python, JavaScript, Go):
_______________________________________________________

Frameworks principales (ej: React, Django, Kubernetes):
_______________________________________________________

Herramientas (ej: Docker, Git, VS Code):
_______________________________________________________

Plataformas (ej: AWS, Azure, GCP):
_______________________________________________________

Puedes dejar en blanco los que no apliquen."

Parsear respuestas y guardar en:
- questionnaire.languages
- questionnaire.frameworks
- questionnaire.tools
- questionnaire.platforms
```

#### Pregunta 13: Entorno de Desarrollo
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿En qué entorno trabajarán los estudiantes?",
    header: "Entorno",
    multiSelect: false,
    options: [
      {
        label: "Local",
        description: "En su propia máquina (requiere instalación)"
      },
      {
        label: "Cloud-based",
        description: "CodeSandbox, Replit, GitHub Codespaces"
      },
      {
        label: "Containers",
        description: "Todo dentro de Docker containers"
      },
      {
        label: "Hybrid",
        description: "Combinación de local y cloud"
      }
    ]
  }
]

Guardar en: questionnaire.environment
```

### SECCIÓN F: INVESTIGACIÓN (Preguntas 14-15)

#### Pregunta 14: Fuentes Mandatorias
```
Mostrar:
"📖 Pregunta 14 de 15: ¿Hay documentación oficial o fuentes específicas que DEBEN incluirse?

Por ejemplo:
- Documentación oficial de Kubernetes (kubernetes.io)
- RFC 7519 para JWT
- Paper 'Attention Is All You Need' para Transformers

Lista las fuentes obligatorias (una por línea), o escribe 'ninguna':
_______________________________________________________
_______________________________________________________
_______________________________________________________"

Parsear y guardar en: questionnaire.mandatorySources
Si 'ninguna': guardar array vacío
```

#### Pregunta 15: Casos de Uso Reales
```
Usar AskUserQuestion con:

questions: [
  {
    question: "¿Quieres incluir casos de uso de empresas/proyectos reales?",
    header: "Casos Reales",
    multiSelect: true,
    options: [
      {
        label: "Empresas FAANG",
        description: "Google, Meta, Amazon, Netflix, Apple"
      },
      {
        label: "Startups exitosas",
        description: "Unicornios y scale-ups"
      },
      {
        label: "Proyectos open source",
        description: "Kubernetes, React, TensorFlow, etc."
      },
      {
        label: "Industrias específicas",
        description: "Fintech, healthtech, e-commerce, etc."
      }
    ]
  }
]

Si selecciona opciones:
  Preguntar: "¿Hay empresas o proyectos específicos que quieras mencionar?"
  Guardar en: questionnaire.targetCompanies

Guardar selección en: questionnaire.includeRealCases
```

## Finalización del Cuestionario

```
Mostrar:
"✅ ¡Cuestionario completado!

Déjame mostrarte un resumen de tu curso..."

Generar y mostrar resumen completo:

"📋 RESUMEN DE TU CURSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Tema: [questionnaire.topic]
⏱️  Duración: [questionnaire.totalDuration] horas
📊 Nivel: [questionnaire.entryLevel] → [questionnaire.exitLevel]
👥 Audiencia: [questionnaire.targetAudience.join(', ')]
⚖️  Balance: [theory]% Teoría / [practice]% Práctica
🎯 Profundidad: Nivel [questionnaire.technicalDepth.overall]
🛠️  Stack: [languages, frameworks, tools]
🎓 Metodología: [questionnaire.methodology.join(', ')]

📦 Contenido estimado:
   - [X] módulos (calculado automáticamente)
   - ~[Y] lecciones teóricas
   - ~[Z] laboratorios prácticos
   - [W] evaluaciones
   - 1 proyecto final integrador

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Confirmas esta configuración?"

Opciones:
A) Sí, continuar con esta configuración
B) No, quiero cambiar algo
C) Mostrar detalles completos del cuestionario

Esperar respuesta:

Si A:
  Guardar cuestionario en: .claude/checkpoint-questionnaire.json
  Marcar skill como COMPLETADA
  Retornar: questionnaire object

Si B:
  Preguntar: "¿Qué quieres cambiar?"
  Permitir ir a pregunta específica
  Repetir desde esa pregunta

Si C:
  Mostrar JSON completo del questionnaire
  Volver a preguntar A/B/C
```

## Validaciones

- Todas las preguntas obligatorias deben tener respuesta
- Duración total: 5-100 horas
- Profundidad: 1-5
- Balance teoría/práctica: suma 100%
- Al menos 1 lenguaje de programación si profundidad >= 3
- Al menos 1 metodología seleccionada
- Al menos 1 tipo de evaluación seleccionado

## Formato de Salida

```json
{
  "topic": "Desarrollo de APIs con GraphQL",
  "coverage": "full",
  "specialization": null,
  "totalDuration": 40,
  "entryLevel": "basic",
  "exitLevel": "professional",
  "targetAudience": ["Desarrolladores backend", "Desarrolladores senior"],
  "technicalDepth": {
    "overall": 4,
    "byComponent": {
      "theory": 4,
      "architecture": 5,
      "implementation": 5,
      "optimization": 4,
      "troubleshooting": 4,
      "security": 4,
      "scalability": 5
    }
  },
  "theoryPracticeBalance": {
    "theory": 40,
    "practice": 60
  },
  "methodology": ["project-based", "case-studies"],
  "evaluation": ["quizzes", "coding", "projects"],
  "languages": ["JavaScript", "TypeScript"],
  "frameworks": ["Apollo Server", "Relay", "Prisma"],
  "tools": ["Docker", "Git", "Postman"],
  "platforms": ["Node.js", "PostgreSQL"],
  "environment": "hybrid",
  "mandatorySources": [
    "https://graphql.org/",
    "https://www.apollographql.com/docs/"
  ],
  "includeRealCases": true,
  "targetCompanies": ["GitHub", "Netflix", "Shopify"]
}
```

## Manejo de Errores

- Si usuario da respuesta inválida: explicar el error y volver a preguntar
- Si usuario dice "no sé": ofrecer opción recomendada basada en otros parámetros
- Si usuario quiere saltar pregunta opcional: permitir y usar valor por defecto
- Si usuario se confunde: ofrecer ejemplos adicionales o reformular pregunta

## Tiempo Estimado

8-12 minutos para completar todas las preguntas.
