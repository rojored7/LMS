# Skill: Generador de Contenido

Genera lecciones teóricas en markdown con ejemplos de código, diagramas y casos reales.

## Propósito

Crear contenido de alta calidad adaptado al nivel de profundidad requerido.

## Entradas

- `lesson`: Especificación de la lección
- `depth`: Nivel de profundidad (1-5)
- `sources`: Fuentes de investigación para este tema
- `language`: Lenguaje del curso (es/en)

## Salidas

Markdown completo de la lección.

## Herramientas

- `WebFetch`: Para extraer contenido de fuentes
- `Read`: Para leer templates

## Proceso

1. **Seleccionar template** según depth (nivel 1-2, 3-4, o 5)
2. **Investigar tema** en sources proporcionadas
3. **Generar secciones**:
   - Introducción contextual
   - Teoría técnica
   - Ejemplos de código (>=2)
   - Diagrama (>=1)
   - Caso de uso real (si depth>=3)
   - Mejores prácticas (si depth>=3)
   - Referencias
4. **Renderizar con template**
5. **Validar calidad**

## Templates

Ver: `../templates/lesson-surface.md`, `lesson-deep.md`, `lesson-expert.md`

## Tiempo Estimado

5-8 minutos por lección.
