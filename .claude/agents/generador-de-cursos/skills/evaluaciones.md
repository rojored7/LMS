# Skill: Generador de Evaluaciones

Genera quizzes basados en el contenido del modulo. TODAS las preguntas son MULTIPLE_CHOICE con exactamente 4 opciones.

## Proposito

Crear evaluaciones que verifiquen comprension de conceptos y habilidades practicas.

## Entradas

- `module`: Modulo completo con lecciones
- `questionCount`: Numero de preguntas

## Salidas

`QuizData` con preguntas de opcion multiple, respuestas y explicaciones.

## Proceso

1. **Extraer conceptos clave** de cada leccion
2. **Generar preguntas** con distribucion:
   - 30% facil
   - 50% medio
   - 20% dificil
3. **Tipo de pregunta**: UNICAMENTE MULTIPLE_CHOICE
   - TODAS las preguntas son tipo MULTIPLE_CHOICE sin excepcion
   - TODAS las preguntas tienen EXACTAMENTE 4 opciones
   - NO generar TRUE_FALSE, MULTIPLE_SELECT ni SHORT_ANSWER bajo ninguna circunstancia
   - correctAnswer = indice numerico (0, 1, 2 o 3)
4. **Agregar explicaciones** a cada respuesta correcta
5. **Verificar deduplicacion cross-modulo** antes de entregar el quiz:
   - Calcular la huella de cada pregunta nueva: primeras 10 palabras del enunciado en minusculas sin puntuacion
   - Comparar contra el registro global `usedQuestionFingerprints` que acumula TODAS las preguntas de modulos anteriores
   - Si la huella ya existe: regenerar la pregunta desde un angulo diferente (maximo 2 intentos)
   - Si despues de 2 intentos sigue siendo duplicada: cambiar completamente el concepto evaluado
   - Agregar la huella de cada pregunta aprobada al registro global antes de pasar al siguiente modulo

## Reglas Estrictas

- `type` SIEMPRE = `"MULTIPLE_CHOICE"` (no hay excepciones, sin importar el depth)
- `options` SIEMPRE = array de EXACTAMENTE 4 strings
- `correctAnswer` = indice numerico entero (0, 1, 2 o 3)
- Las 4 opciones deben ser plausibles y distractoras creibles
- Nunca repetir opciones identicas dentro de la misma pregunta
- Nunca usar "Ninguna de las anteriores" o "Todas las anteriores" como relleno
- `explanation` es OBLIGATORIO para cada pregunta (no puede estar vacio)
- Cada opcion debe tener longitud similar para no delatar la correcta
- Mezclar la posicion de la respuesta correcta (no siempre en la misma posicion)
- Cada pregunta DEBE ser unica en todo el curso: verificar contra `usedQuestionFingerprints` antes de confirmar

## Formato

```json
{
  "title": "Evaluacion: [Nombre del Modulo]",
  "passing_score": 70,
  "time_limit": 20,
  "attempts": 3,
  "questions": [
    {
      "question": "Cual de las siguientes opciones describe correctamente X?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "Opcion A: descripcion plausible pero incorrecta",
        "Opcion B: la respuesta correcta",
        "Opcion C: otra descripcion plausible pero incorrecta",
        "Opcion D: otra descripcion plausible pero incorrecta"
      ],
      "correctAnswer": 1,
      "explanation": "La respuesta correcta es B porque..."
    },
    {
      "question": "En el contexto de Y, que sucede cuando Z?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "Se produce un error de tipo A",
        "Se ejecuta el proceso B normalmente",
        "Se activa el mecanismo de seguridad C",
        "No tiene ningun efecto observable"
      ],
      "correctAnswer": 2,
      "explanation": "Cuando Z ocurre en el contexto de Y, se activa C porque..."
    }
  ]
}
```

## Validacion Pre-Entrega

Antes de entregar un quiz, verificar:
- [ ] Todas las preguntas tienen `type: "MULTIPLE_CHOICE"`
- [ ] Todas las preguntas tienen exactamente 4 opciones en el array `options`
- [ ] Todos los `correctAnswer` son enteros entre 0 y 3
- [ ] Todas las preguntas tienen `explanation` no vacio
- [ ] No hay opciones duplicadas dentro de una misma pregunta
- [ ] La respuesta correcta esta distribuida entre posiciones 0-3
- [ ] Ninguna pregunta es duplicada respecto a modulos anteriores (huella no esta en `usedQuestionFingerprints`)

## Tiempo Estimado

5-7 minutos por quiz.
