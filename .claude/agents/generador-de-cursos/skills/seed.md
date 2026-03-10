# Skill: Generador de Seed

Genera archivo TypeScript para importar el curso a la base de datos.

## Propósito

Crear archivo `seed-[curso].ts` y estructura de carpetas para la plataforma LMS.

## Entradas

- `structure`: Estructura completa del curso
- `content`: Map de lessonId → markdown

## Salidas

- Archivo TypeScript: `seed-[slug].ts`
- Carpetas de módulos con markdown
- Script npm para ejecutar seed

## Proceso

1. **Generar código TypeScript**:
   - Imports de Prisma
   - Función main() con:
     - Creación del curso
     - Creación de módulos (loop)
     - Importación de lecciones desde markdown
     - Creación de quizzes con preguntas
     - Creación de proyecto final

2. **Crear archivos markdown**:
   - Para cada módulo:
     - README.md
     - teoria/01_tema.md, 02_tema.md, ...
     - laboratorios/lab_01/README.md, ...
     - evaluacion/cuestionario.md
     - recursos/cheatsheet.md

3. **Generar script npm**:
   ```json
   "seed:[slug]": "ts-node prisma/seed-[slug].ts"
   ```

## Template de Seed

Ver: `../templates/seed.ts.template`

## Estructura de Salida

```
XX_Nombre_Modulo/
├── README.md
├── teoria/
│   ├── 01_tema.md
│   └── 02_tema.md
├── laboratorios/
│   └── lab_01/
├── evaluacion/
│   └── cuestionario.md
└── recursos/
    └── cheatsheet.md

seed-curso.ts
```

## Tiempo Estimado

2-3 minutos.
