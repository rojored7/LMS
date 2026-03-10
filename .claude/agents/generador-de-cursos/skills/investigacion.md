# Skill: Investigación de Fuentes

Busca automáticamente las mejores fuentes de información para cualquier tema tecnológico.

## Propósito

Investigar y recopilar fuentes de alta calidad (documentación oficial, papers académicos, casos de uso reales) para fundamentar el contenido del curso.

## Entradas

- `topic`: string - Tema del curso (ej: "GraphQL", "Kubernetes")
- `depth`: number (1-5) - Nivel de profundidad técnica
- `targetCompanies`: string[] (opcional) - Empresas específicas para casos de uso
- `mandatorySources`: string[] (opcional) - Fuentes obligatorias del cuestionario

## Salidas

Objeto `ResearchResults` con fuentes clasificadas y rankeadas.

## Herramientas a Usar

- `WebSearch`: Para todas las búsquedas
- `WebFetch`: Para extraer y analizar contenido de páginas específicas

## Proceso Paso a Paso

### FASE 1: FUENTES PRIMARIAS (Obligatorias)

#### 1.1 Documentación Oficial
```
Mostrar: "🔍 Buscando documentación oficial de [TOPIC]..."

Ejecutar búsquedas:
1. WebSearch: "[topic] official documentation"
2. WebSearch: "[topic] docs site:github.com"
3. WebSearch: "[topic] getting started official"

Para cada resultado:
- Verificar que sea sitio oficial (.org, .io, o repo oficial)
- Validar que esté actualizado (< 2 años)
- Asignar qualityScore: 100 si es oficial

Criterios de oficial:
- Dominio del proyecto (ej: kubernetes.io, graphql.org)
- Org oficial en GitHub
- Documentación en sitio del creador

Mostrar: "✓ Encontrado: [URL] - [Título]"

Guardar en: research.primarySources.officialDocs[]
```

#### 1.2 Especificaciones y RFCs
```
Si profundidad >= 3:
  Mostrar: "🔍 Buscando especificaciones técnicas..."

  Buscar:
  - WebSearch: "[topic] RFC specification"
  - WebSearch: "[topic] technical specification"
  - WebSearch: "[topic] W3C recommendation"
  - WebSearch: "[topic] ISO standard"

  Filtrar:
  - Solo documentos de estándares oficiales (IETF, W3C, ISO, ECMA)
  - Verificar relevancia al tema

  Mostrar: "✓ Encontrado: RFC XXXX - [Título]"

  Guardar en: research.primarySources.specifications[]
```

#### 1.3 Repositorios Oficiales
```
Mostrar: "🔍 Buscando repositorios oficiales..."

Buscar:
- WebSearch: "[topic] github official repository"
- WebSearch: "site:github.com [topic] [creator]"

Para cada repo encontrado:
  WebFetch: Para extraer README y stats

  Validar:
  - Stars > 1000 (para proyectos conocidos)
  - Última actualización < 6 meses
  - Tiene documentación (README, docs/, wiki)

  Extraer:
  - URL del repo
  - Número de stars
  - Número de contributors
  - Última actualización
  - Lenguajes usados

Mostrar: "✓ Encontrado: [REPO] ([STARS]⭐, [CONTRIBUTORS] contributors)"

Guardar en: research.primarySources.officialRepos[]
```

### FASE 2: FUENTES SECUNDARIAS (Recomendadas)

#### 2.1 Papers Académicos
```
Si depth >= 3:
  Mostrar: "🔍 Buscando papers académicos..."

  Buscar:
  - WebSearch: "[topic] research paper site:scholar.google.com"
  - WebSearch: "[topic] site:arxiv.org"
  - WebSearch: "[topic] ACM digital library"

  Para cada paper:
    WebFetch: Para extraer metadata

    Validar:
    - Citaciones >= 50 (papers influyentes)
    - Año >= 2020 (reciente, excepto papers seminales)
    - Autores de instituciones/empresas reconocidas

    Extraer:
    - Título
    - Autores
    - Venue (conferencia/journal)
    - Año
    - Número de citaciones
    - DOI/URL
    - Abstract

  Limitar a top 5 papers más citados

  Mostrar: "✓ Encontrado: [TÍTULO] ([CITAS] citaciones)"

  Guardar en: research.secondarySources.academicPapers[]
```

#### 2.2 Libros Técnicos
```
Mostrar: "🔍 Buscando libros técnicos recomendados..."

Buscar:
- WebSearch: "[topic] O'Reilly book"
- WebSearch: "[topic] Manning book"
- WebSearch: "[topic] best book site:goodreads.com"

Para cada libro:
  WebFetch: Para extraer info

  Validar:
  - Rating >= 4.0/5
  - Publicado en editorial reconocida
  - Actualizado (edición reciente < 3 años)

  Extraer:
  - Título
  - Autor(es)
  - Editorial
  - Año
  - Rating
  - ISBN

Limitar a top 3 libros mejor valorados

Mostrar: "✓ Encontrado: [TÍTULO] - [AUTOR] (Rating: X/5)"

Guardar en: research.secondarySources.books[]
```

#### 2.3 Blogs de Expertos
```
Mostrar: "🔍 Buscando blogs de expertos y contributors..."

Buscar:
- WebSearch: "[topic] blog [maintainer name]"
- WebSearch: "[topic] engineering blog site:medium.com"
- WebSearch: "[topic] tutorial site:dev.to"

Priorizar:
- Blogs oficiales del proyecto
- Blogs de maintainers/contributors principales
- Engineering blogs de empresas reconocidas

Validar:
- Autor es contributor verificado
- Contenido técnico profundo
- Fecha reciente (< 2 años)

Limitar a 5 blogs más relevantes

Mostrar: "✓ Encontrado: [BLOG] - [AUTOR]"

Guardar en: research.secondarySources.expertBlogs[]
```

### FASE 3: FUENTES TERCIARIAS (Complementarias)

#### 3.1 Casos de Uso Reales
```
Mostrar: "🔍 Buscando casos de uso de empresas..."

Empresas objetivo:
- Si questionnaire.targetCompanies existe: usar esa lista
- Si no: usar ["Google", "Netflix", "Amazon", "Uber", "Airbnb"]

Para cada empresa:
  Buscar:
  - WebSearch: "[topic] case study [company]"
  - WebSearch: "[company] engineering blog [topic]"
  - WebSearch: "site:engineering.[company].com [topic]"

  Para cada caso encontrado:
    WebFetch: Extraer contenido

    Validar:
    - Es blog oficial de la empresa
    - Incluye métricas o resultados cuantificables
    - Describe arquitectura o implementación

    Extraer:
    - Empresa
    - Título del caso
    - Problema que enfrentaban
    - Solución implementada
    - Resultados (métricas de mejora)
    - URL

Mostrar: "✓ [EMPRESA]: [TÍTULO]"

Guardar en: research.tertiarySources.caseStudies[]
```

#### 3.2 Conferencias y Talks
```
Si depth >= 4:
  Mostrar: "🔍 Buscando talks de conferencias..."

  Buscar:
  - WebSearch: "[topic] conference talk youtube"
  - WebSearch: "[topic] keynote [conference name]"

  Conferencias relevantes según tema:
  - Tech general: QCon, GOTO, DevOps Summit
  - Web: JSConf, React Conf
  - Cloud: KubeCon, AWS re:Invent
  - Data: PyCon, ML Conference

  Validar:
  - Speaker es experto reconocido
  - Conferencia tier-1
  - Views > 10k (popular)

  Limitar a 3 talks más relevantes

  Mostrar: "✓ [CONFERENCIA]: [TÍTULO] - [SPEAKER]"

  Guardar en: research.tertiarySources.talks[]
```

## Síntesis Final

```
Mostrar:
"📊 RESUMEN DE INVESTIGACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fuentes primarias encontradas: [X]
  ✓ Documentación oficial: [count]
  ✓ Especificaciones: [count]
  ✓ Repositorios oficiales: [count]

Fuentes secundarias encontradas: [Y]
  ✓ Papers académicos: [count]
  ✓ Libros técnicos: [count]
  ✓ Blogs de expertos: [count]

Fuentes terciarias encontradas: [Z]
  ✓ Casos de uso: [count]
  ✓ Conference talks: [count]

Total de fuentes de calidad: [X+Y+Z]

Calidad general:
✓ [%]% fuentes oficiales/académicas
✓ Todos los enlaces verificados
✓ [count] casos de uso de empresas tier-1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Generar lista de top fuentes:
"🏆 TOP 10 FUENTES RECOMENDADAS:

1. [Fuente] - [Tipo] - Score: [X]/100
2. [Fuente] - [Tipo] - Score: [X]/100
...
10. [Fuente] - [Tipo] - Score: [X]/100"

Identificar gaps:
"⚠️ GAPS IDENTIFICADOS:

[Listar temas del curso que tienen poca cobertura en fuentes]

Ejemplo:
- Poco contenido sobre [subtema X]
- Falta profundidad en [aspecto Y]
- No hay casos de uso de [tecnología Z]"

Preguntar al usuario:
"¿Quieres que continúe con estas fuentes? (Sí/No)

Si dices 'No', puedo:
A) Buscar fuentes adicionales sobre gaps identificados
B) Buscar en fuentes alternativas
C) Modificar criterios de búsqueda

¿Qué prefieres?"
```

## Criterios de Calidad

Ranking de fuentes (0-100):

- **Documentación oficial**: 100
- **Papers con >500 citaciones**: 95-100
- **Papers con >100 citaciones**: 80-95
- **Libros rating >4.5**: 85-95
- **Blogs oficiales del proyecto**: 80-90
- **Engineering blogs FAANG**: 75-85
- **Casos de uso documentados**: 70-80
- **Otras fuentes técnicas**: 50-70
- **Fuentes no verificadas**: <50 (descartadas)

## Validaciones

- Mínimo 3 fuentes primarias OBLIGATORIO
- Al menos 70% fuentes oficiales/académicas
- Todos los enlaces deben estar activos (verificar con WebFetch)
- Si depth >= 4: mínimo 2 papers académicos
- Si includeRealCases: mínimo 2 casos de uso de empresas

## Formato de Salida

```json
{
  "topic": "GraphQL",
  "researchDate": "2026-03-03T23:00:00Z",
  "primarySources": {
    "officialDocs": [
      {
        "url": "https://graphql.org/",
        "title": "GraphQL Official Documentation",
        "qualityScore": 100,
        "relevanceScore": 100,
        "lastUpdated": "2024-01-15"
      }
    ],
    "specifications": [...],
    "officialRepos": [...]
  },
  "secondarySources": {
    "academicPapers": [...],
    "books": [...],
    "expertBlogs": [...]
  },
  "tertiarySources": {
    "caseStudies": [...],
    "talks": [...]
  },
  "synthesis": {
    "totalSources": 25,
    "officialPercentage": 85,
    "topSources": [...],
    "gaps": [
      "Poco contenido sobre GraphQL Federation v2",
      "Falta profundidad en schema stitching"
    ],
    "recommendations": [
      "Enfatizar contenido en subscriptions (mucha demanda)",
      "Incluir comparativa con REST (tema frecuente)"
    ]
  }
}
```

## Manejo de Errores

- Si WebSearch falla: reintentar hasta 3 veces
- Si no encuentra fuentes oficiales: ADVERTIR al usuario
- Si < 5 fuentes totales: FALLAR y solicitar tema más específico
- Si tema muy ambiguo: PEDIR clarificación al usuario

## Tiempo Estimado

3-5 minutos dependiendo de la profundidad.
