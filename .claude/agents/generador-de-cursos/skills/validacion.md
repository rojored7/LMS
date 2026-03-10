# Skill: Validación de Calidad

Valida que el curso generado cumple con estándares de calidad.

## Propósito

Asegurar calidad profesional del curso antes de marcarlo como completo.

## Entradas

- `course`: Curso completo generado

## Salidas

`ValidationReport` con score y issues detectados.

## Checklist de Validación

### Completitud (25%)
- [ ] Todos los módulos tienen contenido
- [ ] Todas las lecciones tienen markdown
- [ ] Todos los labs tienen código
- [ ] Todas las evaluaciones tienen preguntas

### Calidad de Contenido (25%)
- [ ] >= 2 ejemplos de código por lección
- [ ] >= 1 diagrama por lección
- [ ] >= 1 caso real si depth>=3
- [ ] Referencias a fuentes incluidas

### Código Ejecutable (25%)
- [ ] Todo el código inicial ejecuta sin errores
- [ ] Todas las soluciones ejecutan sin errores
- [ ] Todos los tests pasan
- [ ] No hay vulnerabilidades obvias

### Fuentes (15%)
- [ ] >= 70% fuentes oficiales/académicas
- [ ] Todos los enlaces funcionan
- [ ] Fechas <= 3 años

### Otros (10%)
- [ ] Ortografía correcta
- [ ] Formato markdown válido
- [ ] Navegación entre lecciones funciona

## Score

```
Score = (completitud * 0.25) +
        (calidad * 0.25) +
        (codigo * 0.25) +
        (fuentes * 0.15) +
        (otros * 0.10)

>= 90: ⭐⭐⭐⭐⭐ Excelente
>= 80: ⭐⭐⭐⭐ Muy bueno
>= 70: ⭐⭐⭐ Bueno
>= 60: ⭐⭐ Aceptable
< 60: ⭐ Requiere mejoras
```

## Tiempo Estimado

3-5 minutos.
