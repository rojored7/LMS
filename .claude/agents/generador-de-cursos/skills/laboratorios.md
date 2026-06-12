# Skill: Generador de Laboratorios

Genera laboratorios prácticos completos con código inicial, solución y tests.

## Propósito

Crear ejercicios prácticos ejecutables y validables automáticamente.

## Entradas

- `lab`: Especificación del laboratorio
- `language`: Lenguaje de programación
- `difficulty`: Nivel de dificultad (1-5)

## Salidas

`LabPackage` con README, código inicial, solución y tests.

## Herramientas

- `Write`: Crear archivos
- `Bash`: Ejecutar tests para validar

## Proceso

1. **Generar README** con instrucciones paso a paso
2. **Crear código inicial** con TODOs
3. **Implementar solución completa**
4. **Generar tests automatizados**
5. **Ejecutar tests** contra solución
6. **Crear script de validación**

## Estructura de Salida

```
lab_XX_nombre/
├── README.md
├── codigo_inicial/
├── solucion/
├── tests/
└── validate.sh
```

## Tiempo Estimado

10-15 minutos por lab.
