# Skill: Validacion de Calidad

Valida que el curso generado cumple con estandares de calidad. Ejecuta validaciones reales de sintaxis de codigo y formato de evaluaciones.

## Proposito

Asegurar calidad profesional del curso antes de marcarlo como completo. Incluye ejecucion real de syntax checks.

## Entradas

- `course`: Curso completo generado

## Salidas

`ValidationReport` con score y issues detectados.

## Checklist de Validacion

### Completitud (25%)
- [ ] Todos los modulos tienen contenido
- [ ] Todas las lecciones tienen markdown
- [ ] Todos los labs tienen codigo
- [ ] Todas las evaluaciones tienen preguntas

### Calidad de Contenido (25%)
- [ ] >= 2 ejemplos de codigo por leccion
- [ ] >= 1 diagrama por leccion
- [ ] >= 1 caso real si depth>=3
- [ ] Referencias a fuentes incluidas
- [ ] Ninguna tabla Markdown tiene 0 filas de datos (solo encabezado sin contenido)

### Codigo Ejecutable (25%)
- [ ] Para cada lab, ejecutar syntax check segun lenguaje:
  - bash: `bash -n archivo.sh` (escribir a /tmp/ primero)
  - python: `python3 -c "compile(open('archivo.py').read(), 'archivo.py', 'exec')"`
  - javascript/nodejs: `node --check archivo.js`
- [ ] Todo starter_code pasa syntax check sin errores
- [ ] Toda solution pasa syntax check sin errores
- [ ] Cada step.code de los labs pasa syntax check sin errores
- [ ] Scripts bash no contienen parentesis sin escapar fuera de strings/comillas
- [ ] Todos los tests pasan contra la solucion
- [ ] No hay vulnerabilidades obvias en el codigo

### Formato de Evaluaciones (NUEVO - parte de Calidad)
- [ ] TODAS las preguntas son type "MULTIPLE_CHOICE"
- [ ] TODAS las preguntas tienen exactamente 4 opciones en el array options
- [ ] Todos los correctAnswer son indices validos (entero 0, 1, 2 o 3)
- [ ] NO existe ninguna pregunta con type TRUE_FALSE, MULTIPLE_SELECT o SHORT_ANSWER
- [ ] Todas las preguntas tienen explanation no vacio
- [ ] No hay opciones duplicadas dentro de una misma pregunta

### Fuentes (15%)
- [ ] >= 70% fuentes oficiales/academicas
- [ ] 100% de enlaces verificados HTTP 200 al momento de generacion (re-validar con WebFetch)
- [ ] Fechas <= 3 anos

### Otros (10%)
- [ ] Ortografia correcta
- [ ] Formato markdown valido
- [ ] Navegacion entre lecciones funciona

## Procedimiento de Validacion Automatica

### Paso 0: Verificar Links Activos

Para CADA URL presente en `research.sources[]` Y en el contenido markdown de todas las lecciones:

1. Extraer todas las URLs con regex `https?://[^\s\)\"]+`
2. Para cada URL usar `WebFetch` para verificar que responde con contenido valido
3. Si la URL falla (error de red, timeout, HTTP 4xx/5xx, pagina "404 not found", "page not found"):
   - Agregar a issues[] con severidad: CRITICAL
   - Formato: `"Link roto: [URL] en [leccion/fuente donde aparece]"`
4. Si todas las URLs responden: marcar como validado

**Regla**: Si hay CUALQUIER link roto → DETENER y exigir URL alternativa al usuario antes de continuar. No omitir ni ignorar links rotos.

### Paso 1: Validar Sintaxis de Labs

Para CADA archivo de lab generado:

1. Extraer todos los bloques de codigo (starter_code, solution, steps[].code)
2. Escribir cada bloque a un archivo temporal en /tmp/
3. Ejecutar el comando de syntax check correspondiente al language del lab:
   ```bash
   # bash
   bash -n /tmp/lab_validate.sh

   # python
   python3 -c "compile(open('/tmp/lab_validate.py').read(), 'lab', 'exec')"

   # javascript
   node --check /tmp/lab_validate.js
   ```
4. Si EXIT_CODE != 0: agregar a issues[] con:
   - Nombre del lab
   - Bloque que fallo (starter_code/solution/step N)
   - Linea y error exacto del mensaje
   - Severidad: CRITICAL
5. Si EXIT_CODE == 0: marcar bloque como validado

### Paso 1.5: Validar Tablas Markdown

Para CADA leccion generada:

1. Buscar bloques de tabla con regex: detectar lineas que contengan `|` seguidas de linea `|---|`
2. Contar las filas de datos despues de la linea separadora `|---|`
3. Si una tabla tiene 0 filas de datos (solo encabezado + separador, sin contenido):
   - Agregar a issues[] con severidad: HIGH
   - Formato: `"Tabla vacia en leccion [nombre]: tabla con encabezado [columnas] sin filas de datos"`
   - Accion inmediata: completar la tabla con minimo 2 filas de datos reales antes de continuar
4. Si todas las tablas tienen >= 1 fila: marcar como validado

**Penalizacion**: -15% de Calidad de Contenido por cada tabla vacia encontrada.

### Paso 2: Validar Formato de Quizzes

Para CADA quiz generado:

1. Verificar que TODAS las questions tienen `type == "MULTIPLE_CHOICE"`
   - Si alguna tiene otro tipo: agregar a issues[] con severidad CRITICAL
2. Verificar que TODAS las questions tienen `options` como array de exactamente 4 elementos
   - Si alguna tiene != 4: agregar a issues[] con severidad CRITICAL
3. Verificar que TODOS los `correctAnswer` son enteros entre 0 y 3
   - Si alguno esta fuera de rango: agregar a issues[] con severidad CRITICAL
4. Verificar que TODAS las questions tienen `explanation` no vacio
   - Si alguna esta vacia: agregar a issues[] con severidad HIGH
5. Verificar deduplicacion cross-modulo: comparar las primeras 10 palabras del enunciado de cada pregunta (normalizado: minusculas, sin puntuacion) entre TODOS los quizzes del curso
   - Si se detecta pregunta duplicada o muy similar (misma huella): agregar a issues[] con severidad HIGH
   - Formato: `"Pregunta duplicada: '[inicio pregunta]...' aparece en modulo X y modulo Y"`

### Paso 3: Calcular Score

```
Reglas de penalizacion:
- Si ALGUNA validacion de sintaxis de labs falla: Codigo Ejecutable = 0%
  (NO se puede dar puntos parciales si hay codigo roto)
- Si ALGUNA pregunta no es MULTIPLE_CHOICE: deducir 50% de Calidad de Contenido
- Si ALGUNA pregunta no tiene 4 opciones: deducir 50% de Calidad de Contenido
- Si hay preguntas duplicadas cross-modulo: deducir 20% de Calidad de Contenido
- Por cada tabla vacia detectada: deducir 15% de Calidad de Contenido
- Si hay CUALQUIER link roto: Fuentes = 0% (NO se puede dar puntos si hay links muertos)

Score = (completitud * 0.25) +
        (calidad * 0.25) +
        (codigo * 0.25) +
        (fuentes * 0.15) +
        (otros * 0.10)

>= 90: Excelente
>= 80: Muy bueno
>= 70: Bueno (minimo aceptable)
>= 60: Aceptable (requiere correccion)
< 60: Requiere mejoras significativas
```

### Paso 4: Acciones segun resultado

- Si hay issues CRITICAL: DETENER y corregir antes de continuar
- Si score < 70: preguntar al usuario si regenerar secciones con issues
- Si score >= 70 sin CRITICAL: continuar al seed

## Tiempo Estimado

5-10 minutos (incluye ejecucion de syntax checks).
