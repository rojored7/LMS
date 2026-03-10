# Skill: Generador de Evaluaciones

Genera quizzes y casos prácticos basados en el contenido del módulo.

## Propósito

Crear evaluaciones que verifiquen comprensión de conceptos y habilidades prácticas.

## Entradas

- `module`: Módulo completo con lecciones
- `questionCount`: Número de preguntas

## Salidas

`QuizData` con preguntas, respuestas y explicaciones.

## Proceso

1. **Extraer conceptos clave** de cada lección
2. **Generar preguntas** con distribución:
   - 30% fácil
   - 50% medio
   - 20% difícil
3. **Tipos de pregunta**:
   - Multiple choice
   - True/False
   - Multiple select
   - Short answer (si depth>=4)
4. **Añadir explicaciones** a cada respuesta

## Formato

```json
{
  "questions": [
    {
      "question": "...",
      "type": "MULTIPLE_CHOICE",
      "options": [...],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
```

## Tiempo Estimado

5-7 minutos por quiz.
