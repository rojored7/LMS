---
name: incidents
description: Revisar y diagnosticar incidentes pendientes de la plataforma LMS
user_invocable: true
---

# Skill: Diagnostico de Incidentes

Cuando el usuario dice "revisa incidentes pendientes", "/incidents", o "hay incidentes?":

## Pasos

1. **Leer incidentes pendientes**: Buscar archivos `*.json` en `plataforma/incidents/` que NO tengan un archivo `.resolved` correspondiente.

2. **Para cada incidente sin resolver**:
   - Leer el JSON completo
   - Extraer: error type, message, file:line, user email/role, request path, breadcrumbs
   - Buscar el archivo fuente mencionado en el stack trace (`Read` el archivo, ir a la linea)
   - Analizar el codigo alrededor del error
   - Correlacionar los breadcrumbs (que estaba haciendo el usuario antes del error)
   - Formular diagnostico: causa raiz + solucion propuesta

3. **Presentar resumen**:
   ```
   Encontre N incidentes pendientes:

   1. INC-XXXX - ErrorType en archivo.py:linea
      User: email (role)
      Ruta: breadcrumb1 -> breadcrumb2 -> error
      Causa: [explicacion de la causa raiz]
      Fix: [solucion propuesta con archivo y linea]

   2. ...
   ```

4. **Preguntar**: "Quieres que arregle alguno?"

5. **Si el usuario dice si**: Usar el flujo `/flow-bugfix` para implementar la correccion.

6. **Marcar como resuelto**: Crear archivo `INC-XXXX.resolved` en el directorio de incidentes.

## Estructura del JSON de incidente

```json
{
  "incident_id": "INC-20260422-0001",
  "severity": "error",
  "timestamp": "2026-04-22T18:11:54Z",
  "error": {
    "type": "RuntimeError",
    "message": "descripcion del error",
    "file": "main.py:206",
    "function": "debug_trigger_error",
    "stack_trace": ["linea1", "linea2"]
  },
  "user": {
    "id": "abc123",
    "email": "user@test.com",
    "role": "STUDENT",
    "enrolled_courses": 3
  },
  "request": {
    "method": "GET",
    "path": "/api/endpoint",
    "query": ""
  },
  "breadcrumbs": [
    {"time": "...", "type": "navigation", "message": "/courses"},
    {"time": "...", "type": "http", "data": {"url": "/api/..."}}
  ],
  "backend_logs": ["linea de log 1", "linea de log 2"],
  "glitchtip_url": "http://localhost:8001/ciber-platform/issues/X"
}
```

## Directorio

Los incidentes se guardan en `plataforma/incidents/`:
- `INC-XXXX.json` = incidente abierto
- `INC-XXXX.resolved` = incidente resuelto (crear este archivo al resolver)
