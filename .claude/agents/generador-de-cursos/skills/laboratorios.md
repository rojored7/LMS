# Skill: Generador de Laboratorios

Genera laboratorios practicos completos con codigo inicial, solucion y tests. Todo codigo generado DEBE pasar validacion de sintaxis antes de entregarse.

## Proposito

Crear ejercicios practicos ejecutables y validables automaticamente. Ningun lab se considera completo hasta que su codigo pase syntax check.

## Entradas

- `lab`: Especificacion del laboratorio
- `language`: Lenguaje de programacion (python, bash, javascript, nodejs)
- `difficulty`: Nivel de dificultad (1-5)

## Salidas

`LabPackage` con README, codigo inicial, solucion y tests. Todo codigo validado sintacticamente.

## Herramientas

- `Write`: Crear archivos
- `Bash`: Ejecutar syntax checks y tests para validar

## Checklist de Sanitizacion por Lenguaje

### Bash (CRITICO - fuente principal de errores)

Antes de escribir cualquier script bash, aplicar TODAS estas reglas:

1. **Shebang obligatorio**: Primera linea siempre `#!/bin/bash` o `#!/usr/bin/env bash`
2. **Modo estricto**: Segunda linea `set -euo pipefail`
3. **Parentesis SIEMPRE entre comillas**: `echo "texto (con parentesis)"` NUNCA `echo texto (parentesis)`
4. **Variables entre comillas dobles**: `"$VAR"` NUNCA `$VAR` suelto
5. **Condicionales con doble corchete**: `[[ -f "$archivo" ]]` NUNCA `[ -f $archivo ]`
6. **Arrays con sintaxis correcta**: `arr=("a" "b" "c")` con comillas en elementos
7. **No usar caracteres especiales sin escapar fuera de strings**:
   - `$` → `\$` o dentro de comillas simples
   - Backticks → usar `$(comando)` en su lugar
   - `!` → `\!` o dentro de comillas simples
   - `(` y `)` → SIEMPRE dentro de comillas dobles si son texto literal
8. **Comentarios seguros**: Los comentarios con `#` no necesitan escapar parentesis, pero el texto DESPUES del `#` no debe contener comillas sin cerrar
9. **Heredocs**: Usar delimitador entre comillas simples para evitar expansion: `cat <<'EOF'`
10. **Comandos con output que contiene parentesis**: Capturar en variable entre comillas: `resultado="$(comando)"`

### Python

1. Indentacion consistente (4 espacios, nunca tabs)
2. Strings con caracteres especiales usar raw strings o escapar: `r"texto\n"` o `"texto\\n"`
3. f-strings con llaves literales: `f"dict = {{'key': 'val'}}"`
4. Imports al inicio del archivo
5. No usar `eval()` o `exec()` con input de usuario

### JavaScript/Node.js

1. Usar `const`/`let`, nunca `var`
2. Template literals para strings multilinea: `` `texto ${var}` ``
3. Punto y coma consistente
4. Manejar promesas con async/await o .catch()

## Proceso

1. **Generar README** con instrucciones paso a paso
2. **Crear codigo inicial** con TODOs marcados claramente
3. **Implementar solucion completa** funcional
4. **Sanitizar codigo** aplicando el checklist de sanitizacion segun el lenguaje
5. **Validar sintaxis** de CADA bloque de codigo (ver seccion "Validacion Obligatoria")
6. **Si falla validacion**: leer error, corregir, re-validar (max 3 intentos)
7. **Generar tests automatizados** para verificar la solucion
8. **Ejecutar tests** contra solucion para confirmar que pasan
9. **Crear script de validacion** (validate.sh)

## Validacion Obligatoria de Sintaxis

ANTES de marcar cualquier lab como completo, ejecutar estos comandos usando la herramienta Bash:

### Comandos por lenguaje

**bash**:
```bash
# Escribir el codigo a archivo temporal
cat > /tmp/lab_check.sh << 'SCRIPT_EOF'
[CONTENIDO_DEL_SCRIPT]
SCRIPT_EOF

# Validar sintaxis (no ejecuta, solo verifica)
bash -n /tmp/lab_check.sh
echo "EXIT_CODE: $?"
```

**python**:
```bash
# Escribir el codigo a archivo temporal
cat > /tmp/lab_check.py << 'SCRIPT_EOF'
[CONTENIDO_DEL_SCRIPT]
SCRIPT_EOF

# Validar sintaxis
python3 -c "compile(open('/tmp/lab_check.py').read(), 'lab_check.py', 'exec')"
echo "EXIT_CODE: $?"
```

**javascript/nodejs**:
```bash
# Escribir el codigo a archivo temporal
cat > /tmp/lab_check.js << 'SCRIPT_EOF'
[CONTENIDO_DEL_SCRIPT]
SCRIPT_EOF

# Validar sintaxis
node --check /tmp/lab_check.js
echo "EXIT_CODE: $?"
```

### Que validar

Para CADA lab generado, validar estos bloques de codigo:
- `starter_code` (codigo inicial del estudiante)
- `solution` (solucion completa)
- Cada `steps[].code` (si el lab usa formato de pasos)
- `validate.sh` (script de validacion)

## Loop de Validacion

```
Para CADA bloque de codigo del lab:
  1. Escribir contenido a /tmp/lab_validate.<ext>
  2. Ejecutar comando de syntax check correspondiente
  3. Si EXIT_CODE != 0 (FALLA):
     a. Leer el mensaje de error completo
     b. Identificar la linea y el caracter problematico
     c. Corregir el error especifico:
        - Parentesis sin escapar → agregar comillas dobles
        - Variable sin comillas → agregar comillas dobles
        - Caracter especial → escapar o entrecomillar
        - Indentacion → corregir espacios
     d. Re-escribir el bloque corregido
     e. Re-validar (repetir desde paso 1)
     f. Maximo 3 intentos por bloque
  4. Si EXIT_CODE == 0 (PASA): marcar como validado, continuar
  5. Si 3 intentos fallan: DETENER y reportar al usuario el error
     NO continuar con un lab que tiene errores de sintaxis
```

## Estructura de Salida

```
lab_XX_nombre/
├── README.md
├── codigo_inicial/
├── solucion/
├── tests/
└── validate.sh
```

## Errores Comunes a Prevenir

| Error | Causa | Solucion |
|-------|-------|----------|
| `syntax error near unexpected token '('` | Parentesis fuera de comillas en bash | Envolver texto en comillas dobles |
| `unexpected EOF while looking for matching` | Comilla o llave sin cerrar | Verificar pares de comillas/llaves |
| `IndentationError` | Mezcla tabs/espacios en Python | Usar solo 4 espacios |
| `SyntaxError: Unexpected token` | JS con sintaxis invalida | Verificar llaves y punto y coma |
| `command not found` | Comando no disponible | Verificar dependencias en README |

## Tiempo Estimado

10-15 minutos por lab (incluye validacion).
