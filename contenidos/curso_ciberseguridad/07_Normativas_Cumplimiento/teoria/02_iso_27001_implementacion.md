# ISO/IEC 27001:2022 - Implementación Práctica

## Índice

1. [Introducción a ISO 27001](#introducción)
2. [Estructura del Estándar](#estructura)
3. [Sistema de Gestión de Seguridad de la Información (SGSI)](#sgsi)
4. [Ciclo PDCA (Plan-Do-Check-Act)](#pdca)
5. [Contexto de la Organización (Cláusula 4)](#cláusula-4)
6. [Liderazgo (Cláusula 5)](#cláusula-5)
7. [Planificación (Cláusula 6)](#cláusula-6)
8. [Soporte (Cláusula 7)](#cláusula-7)
9. [Operación (Cláusula 8)](#cláusula-8)
10. [Evaluación del Desempeño (Cláusula 9)](#cláusula-9)
11. [Mejora (Cláusula 10)](#cláusula-10)
12. [Anexo A: Controles de Seguridad](#anexo-a)
13. [Proceso de Certificación](#certificación)
14. [Implementación Step-by-Step](#implementación)
15. [Referencias](#referencias)

---

## Introducción a ISO 27001 {#introducción}

**ISO/IEC 27001:2022** es el estándar internacional para Sistemas de Gestión de Seguridad de la Información (SGSI). Publicado originalmente en 2005, revisado en 2013 y actualizado en 2022, especifica requisitos para establecer, implementar, mantener y mejorar continuamente un SGSI.

### Objetivos del Estándar

| Objetivo | Descripción |
|----------|-------------|
| **Proteger la confidencialidad** | Información accesible solo a personas autorizadas |
| **Mantener la integridad** | Información precisa y completa |
| **Asegurar la disponibilidad** | Información accesible cuando se necesita |
| **Gestionar riesgos** | Identificar, evaluar y tratar riesgos de seguridad |
| **Cumplimiento legal** | Cumplir requisitos legales y contractuales |
| **Mejora continua** | Evolucionar el SGSI según amenazas y necesidades |

### Cambios en ISO 27001:2022

La versión 2022 introdujo actualizaciones significativas:

- **Anexo A reestructurado**: De 114 controles (14 dominios) a **93 controles (4 temas)**
- **Nuevos controles**: Threat intelligence, Cloud security, Configuration management
- **Controles fusionados**: Reducción y consolidación de controles redundantes
- **Enfoque en tecnologías modernas**: Cloud, DevOps, trabajo remoto

---

## Estructura del Estándar {#estructura}

ISO 27001:2022 se divide en dos partes principales:

### Parte 1: Cláusulas (Requisitos Obligatorios)

```
┌──────────────────────────────────────────────────────────┐
│                 ISO 27001:2022 ESTRUCTURA                │
└──────────────────────────────────────────────────────────┘

Cláusula 1-3: Introducción, Referencias, Términos
  └─ No auditable

Cláusula 4: Contexto de la Organización
  ├─ 4.1 Comprender la organización y su contexto
  ├─ 4.2 Comprender las necesidades de partes interesadas
  ├─ 4.3 Determinar alcance del SGSI
  └─ 4.4 Sistema de gestión de seguridad de la información

Cláusula 5: Liderazgo
  ├─ 5.1 Liderazgo y compromiso
  ├─ 5.2 Política de seguridad de la información
  └─ 5.3 Roles, responsabilidades y autoridades

Cláusula 6: Planificación
  ├─ 6.1 Acciones para abordar riesgos y oportunidades
  ├─ 6.2 Objetivos de seguridad de la información
  └─ 6.3 Planificación de cambios

Cláusula 7: Soporte
  ├─ 7.1 Recursos
  ├─ 7.2 Competencia
  ├─ 7.3 Concienciación
  ├─ 7.4 Comunicación
  └─ 7.5 Información documentada

Cláusula 8: Operación
  ├─ 8.1 Planificación y control operacional
  ├─ 8.2 Evaluación de riesgos de seguridad
  └─ 8.3 Tratamiento de riesgos de seguridad

Cláusula 9: Evaluación del Desempeño
  ├─ 9.1 Seguimiento, medición, análisis y evaluación
  ├─ 9.2 Auditoría interna
  └─ 9.3 Revisión por la dirección

Cláusula 10: Mejora
  ├─ 10.1 No conformidades y acciones correctivas
  └─ 10.2 Mejora continua
```

### Parte 2: Anexo A (Controles de Referencia)

**93 controles organizados en 4 temas**:

1. **Organizacionales** (37 controles)
2. **Personas** (8 controles)
3. **Físicos** (14 controles)
4. **Tecnológicos** (34 controles)

---

## Sistema de Gestión de Seguridad de la Información (SGSI) {#sgsi}

### Definición

Un **SGSI** es un enfoque sistemático para gestionar información sensible de manera que permanezca segura. Incluye personas, procesos y sistemas tecnológicos.

### Principios del SGSI

| Principio | Descripción |
|-----------|-------------|
| **Enfoque en riesgos** | Decisiones basadas en evaluación de riesgos |
| **Ciclo PDCA** | Mejora continua mediante Plan-Do-Check-Act |
| **Liderazgo** | Compromiso de la alta dirección |
| **Enfoque en procesos** | Resultados consistentes y predecibles |
| **Mejora continua** | Objetivo permanente de mejorar el desempeño |
| **Toma de decisiones basada en evidencia** | Datos, métricas y análisis |
| **Gestión de relaciones** | Con partes interesadas internas y externas |

---

## Ciclo PDCA (Plan-Do-Check-Act) {#pdca}

ISO 27001 se basa en el ciclo PDCA de mejora continua:

```
┌─────────────────────────────────────────────────────────────┐
│                      CICLO PDCA                             │
└─────────────────────────────────────────────────────────────┘

       ┌───────────────────────────────────────┐
       │         PLAN (Planificar)             │
       │  ─────────────────────────────        │
       │  • Establecer política SGSI           │
       │  • Definir alcance                    │
       │  • Evaluación de riesgos              │
       │  • Seleccionar controles              │
       │  • Declaración de Aplicabilidad (SoA) │
       └────────────┬──────────────────────────┘
                    │
                    ▼
       ┌───────────────────────────────────────┐
       │          DO (Hacer)                   │
       │  ─────────────────────────            │
       │  • Implementar controles              │
       │  • Asignar recursos                   │
       │  • Capacitación y concienciación      │
       │  • Gestionar operaciones              │
       │  • Gestionar incidentes               │
       └────────────┬──────────────────────────┘
                    │
                    ▼
       ┌───────────────────────────────────────┐
       │        CHECK (Verificar)              │
       │  ─────────────────────────────        │
       │  • Monitorear y medir                 │
       │  • Auditorías internas                │
       │  • Revisión por la dirección          │
       │  • Evaluar eficacia de controles      │
       └────────────┬──────────────────────────┘
                    │
                    ▼
       ┌───────────────────────────────────────┐
       │          ACT (Actuar)                 │
       │  ─────────────────────────────        │
       │  • Acciones correctivas               │
       │  • Mejora continua                    │
       │  • Actualizar evaluación de riesgos   │
       │  • Revisar controles                  │
       └────────────┬──────────────────────────┘
                    │
                    └──────► VOLVER A PLAN ◄─────┘
```

---

## Contexto de la Organización (Cláusula 4) {#cláusula-4}

### 4.1 Comprender la Organización y su Contexto

Identificar factores internos y externos que afectan la seguridad de la información.

**Ejemplos de factores**:

| Tipo | Ejemplos |
|------|----------|
| **Internos** | Cultura organizacional, estructura, ubicaciones, sistemas TI, procesos de negocio |
| **Externos** | Requisitos legales, competencia, proveedores, amenazas cibernéticas, regulaciones |

**Herramienta**: Análisis PESTLE (Político, Económico, Social, Tecnológico, Legal, Ambiental)

### 4.2 Comprender las Necesidades de Partes Interesadas

Identificar **stakeholders** y sus requisitos de seguridad.

**Partes interesadas comunes**:
- Clientes
- Empleados
- Proveedores
- Reguladores
- Accionistas
- Socios de negocio

### 4.3 Determinar Alcance del SGSI

Definir **límites y aplicabilidad** del SGSI.

**Ejemplos de alcance**:
- "Sistema de gestión de información de clientes en el data center principal"
- "Procesos de desarrollo de software en la división de productos financieros"
- "Toda la organización incluyendo oficinas remotas y proveedores críticos"

**Exclusiones** deben justificarse.

### 4.4 Sistema de Gestión de Seguridad de la Información

Establecer, implementar, mantener y mejorar continuamente el SGSI según requisitos del estándar.

---

## Liderazgo (Cláusula 5) {#cláusula-5}

### 5.1 Liderazgo y Compromiso

**La alta dirección debe demostrar** liderazgo y compromiso:

- Asegurar que la política y objetivos de seguridad se establezcan
- Integrar requisitos del SGSI en procesos de negocio
- Asegurar disponibilidad de recursos
- Comunicar la importancia de la seguridad
- Asegurar que el SGSI logre sus resultados esperados
- Dirigir y apoyar a las personas
- Promover la mejora continua
- Apoyar otros roles de gestión relevantes

### 5.2 Política de Seguridad de la Información

Establecer **política de seguridad** que:

- Sea apropiada al propósito de la organización
- Incluya objetivos de seguridad o marco para establecerlos
- Incluya compromiso de cumplir requisitos aplicables
- Incluya compromiso de mejora continua
- Esté disponible como información documentada
- Se comunique dentro de la organización
- Esté disponible para partes interesadas

**Ejemplo de Política de Seguridad**:

```
POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN
Organización: Example Corp

1. PROPÓSITO
   Proteger la confidencialidad, integridad y disponibilidad de la información
   de Example Corp, clientes, empleados y socios.

2. ALCANCE
   Aplica a toda la información en cualquier formato, procesada por cualquier
   sistema o persona dentro de Example Corp.

3. OBJETIVOS
   a) Proteger información contra acceso no autorizado
   b) Mantener integridad y precisión de la información
   c) Asegurar disponibilidad de información cuando se necesite
   d) Cumplir requisitos legales y contractuales
   e) Mejorar continuamente la seguridad de la información

4. RESPONSABILIDADES
   - Alta Dirección: Proveer recursos y apoyo
   - CISO: Implementar y mantener SGSI
   - Empleados: Cumplir políticas y procedimientos
   - TI: Implementar controles técnicos

5. CUMPLIMIENTO
   El incumplimiento puede resultar en acción disciplinaria.

6. REVISIÓN
   Esta política se revisará anualmente.

Firmado: CEO, Fecha: 2025-02-23
```

### 5.3 Roles, Responsabilidades y Autoridades

Asignar responsabilidades y autoridades para:

- Asegurar conformidad del SGSI con requisitos
- Reportar desempeño del SGSI a la alta dirección

**Roles típicos**:

| Rol | Responsabilidades |
|-----|-------------------|
| **CISO (Chief Information Security Officer)** | Liderar SGSI, gestión de riesgos, cumplimiento |
| **Comité de Seguridad** | Aprobar políticas, revisar riesgos, tomar decisiones estratégicas |
| **Propietarios de Activos** | Clasificar información, autorizar acceso |
| **Administradores de Sistemas** | Implementar controles técnicos, hardening, parches |
| **Oficial de Cumplimiento** | Monitorear requisitos legales y regulatorios |
| **Todos los empleados** | Cumplir políticas, reportar incidentes |

---

## Planificación (Cláusula 6) {#cláusula-6}

### 6.1 Acciones para Abordar Riesgos y Oportunidades

#### 6.1.1 Generalidades

Planificar acciones para abordar riesgos y aprovechar oportunidades.

#### 6.1.2 Evaluación de Riesgos de Seguridad

Establecer y mantener **proceso de evaluación de riesgos** que:

- Identifique riesgos asociados a pérdida de CIA (Confidencialidad, Integridad, Disponibilidad)
- Identifique propietarios de riesgos
- Analice riesgos (consecuencia + probabilidad)
- Evalúe riesgos (compare contra criterios de aceptación)

**Metodologías populares**:
- **ISO 27005**: Gestión de Riesgos de Seguridad de la Información
- **NIST SP 800-30**: Guide for Conducting Risk Assessments
- **OCTAVE** (Operationally Critical Threat, Asset, and Vulnerability Evaluation)
- **FAIR** (Factor Analysis of Information Risk)

**Fórmula básica de riesgo**:

```
Riesgo = Impacto × Probabilidad × Vulnerabilidad
```

**Matriz de Riesgo (ejemplo)**:

```
        PROBABILIDAD
         │  Rara │ Poco │ Posible │ Probable │ Casi   │
         │  (1)  │ prob │   (3)   │   (4)    │ cierto │
         │       │ (2)  │         │          │  (5)   │
─────────┼───────┼──────┼─────────┼──────────┼────────┤
Crítico  │   M   │  A   │    A    │    C     │   C    │
  (5)    │       │      │         │          │        │
─────────┼───────┼──────┼─────────┼──────────┼────────┤
Alto     │   B   │  M   │    A    │    A     │   C    │
  (4)    │       │      │         │          │        │
─────────┼───────┼──────┼─────────┼──────────┼────────┤
Medio    │   B   │  B   │    M    │    A     │   A    │
  (3)    │       │      │         │          │        │
─────────┼───────┼──────┼─────────┼──────────┼────────┤
Bajo     │   B   │  B   │    B    │    M     │   A    │
  (2)    │       │      │         │          │        │
─────────┼───────┼──────┼─────────┼──────────┼────────┤
Mínimo   │   B   │  B   │    B    │    B     │   M    │
  (1)    │       │      │         │          │        │
─────────┴───────┴──────┴─────────┴──────────┴────────┘

B = Bajo (Aceptable)
M = Medio (Requiere atención)
A = Alto (Requiere plan de tratamiento)
C = Crítico (Acción inmediata)
```

#### 6.1.3 Tratamiento de Riesgos

Definir proceso de **tratamiento de riesgos** que seleccione opciones apropiadas:

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| **Evitar** | Eliminar la actividad que genera riesgo | No procesar datos sensibles |
| **Modificar** | Implementar controles para reducir riesgo | Cifrado, autenticación multifactor |
| **Transferir** | Compartir riesgo con terceros | Seguros, outsourcing |
| **Retener** | Aceptar riesgo consciente | Riesgos bajos con mitigación costosa |

**Salida**: Plan de Tratamiento de Riesgos (documentado)

### 6.2 Objetivos de Seguridad y Planificación

Establecer **objetivos de seguridad** que sean:

- Consistentes con la política de seguridad
- Medibles
- Comunicados
- Actualizados según corresponda

**Ejemplos de objetivos SMART**:

| Objetivo | SMART |
|----------|-------|
| "Reducir incidentes de seguridad en 30% en 12 meses" | ✅ Específico, Medible, Alcanzable, Relevante, Temporal |
| "Lograr 95% de empleados capacitados en seguridad antes de Q4" | ✅ |
| "Implementar MFA en todos los sistemas críticos antes de junio 2025" | ✅ |
| "Mejorar la seguridad" | ❌ No medible, no temporal |

### 6.3 Planificación de Cambios

Cuando se planifiquen cambios al SGSI, considerar:

- Propósito y consecuencias potenciales
- Integridad del SGSI
- Disponibilidad de recursos
- Asignación de responsabilidades

---

## Soporte (Cláusula 7) {#cláusula-7}

### 7.1 Recursos

Proveer recursos necesarios para:
- Establecer, implementar, mantener y mejorar el SGSI

### 7.2 Competencia

Asegurar que personas que realizan trabajo que afecta el SGSI sean competentes.

**Acciones**:
- Determinar competencia necesaria
- Asegurar competencia mediante capacitación/experiencia
- Tomar acciones para adquirir competencia
- Retener información documentada como evidencia

### 7.3 Concienciación (Awareness)

Asegurar que las personas sean conscientes de:

- Política de seguridad
- Su contribución a la eficacia del SGSI
- Implicaciones de no conformidad

**Programas de Concienciación**:
- Capacitación anual obligatoria
- Simulacros de phishing
- Boletines de seguridad mensuales
- Señalización y recordatorios
- Onboarding de nuevos empleados

### 7.4 Comunicación

Determinar necesidades de comunicación interna y externa:

- ¿Qué comunicar?
- ¿Cuándo comunicar?
- ¿A quién comunicar?
- ¿Quién comunica?
- ¿Cómo comunicar?

**Canales de comunicación**:
- Intranet
- Email
- Reuniones
- Reportes
- Incidentes

### 7.5 Información Documentada

#### 7.5.1 Generalidades

El SGSI debe incluir:

- Información documentada requerida por el estándar
- Información documentada determinada por la organización como necesaria

**Documentos obligatorios ISO 27001:2022**:

1. Alcance del SGSI
2. Política de seguridad de la información
3. Objetivos de seguridad
4. Proceso de evaluación de riesgos
5. Proceso de tratamiento de riesgos
6. Declaración de Aplicabilidad (Statement of Applicability - SoA)
7. Registros de capacitación y competencia
8. Registros de monitoreo y medición
9. Resultados de auditorías internas
10. Resultados de revisión por la dirección
11. No conformidades y acciones correctivas

#### 7.5.2 Creación y Actualización

Al crear/actualizar información documentada, asegurar:

- Identificación y descripción apropiada
- Formato apropiado
- Revisión y aprobación

#### 7.5.3 Control de Información Documentada

Controlar información documentada:

- Esté disponible donde y cuando se necesite
- Esté protegida adecuadamente (confidencialidad, integridad)
- Controlar distribución, acceso, recuperación, uso
- Controlar almacenamiento, preservación, legibilidad
- Controlar cambios (control de versiones)
- Controlar retención y disposición

---

## Operación (Cláusula 8) {#cláusula-8}

### 8.1 Planificación y Control Operacional

Planificar, implementar y controlar procesos necesarios para cumplir requisitos de seguridad.

**Incluye**:
- Implementar plan de tratamiento de riesgos
- Mantener información documentada
- Controlar procesos externalizados (proveedores)

### 8.2 Evaluación de Riesgos

Realizar evaluaciones de riesgos a intervalos planificados o cuando se propongan cambios significativos.

**Frecuencia recomendada**:
- Evaluación completa: Anual
- Re-evaluación: Cuando cambios significativos (nuevos sistemas, amenazas, incidentes)

### 8.3 Tratamiento de Riesgos

Implementar el plan de tratamiento de riesgos.

---

## Evaluación del Desempeño (Cláusula 9) {#cláusula-9}

### 9.1 Monitoreo, Medición, Análisis y Evaluación

Determinar:

- ¿Qué monitorear y medir?
- ¿Métodos de monitoreo, medición, análisis y evaluación?
- ¿Cuándo realizar monitoreo y medición?
- ¿Quién debe monitorear y medir?
- ¿Cuándo analizar y evaluar resultados?

**KPIs de Seguridad (ejemplos)**:

| KPI | Métrica |
|-----|---------|
| Incidentes de seguridad | Número/mes, tiempo de resolución |
| Cumplimiento de parches | % sistemas actualizados dentro de SLA |
| Accesos no autorizados | Número de intentos/detecciones |
| Capacitación | % empleados capacitados |
| Vulnerabilidades | Número de vulnerabilidades críticas abiertas |
| Disponibilidad | Uptime de sistemas críticos |

### 9.2 Auditoría Interna

Conducir auditorías internas a intervalos planificados.

**Objetivos**:
- Verificar conformidad con requisitos propios y del estándar
- Verificar que el SGSI se implementa y mantiene eficazmente

**Programa de Auditoría** debe considerar:
- Importancia de procesos
- Cambios que afectan la organización
- Resultados de auditorías previas

**Roles**:
- **Auditor interno**: Independiente del área auditada
- **Auditado**: Proporciona evidencia

**Proceso de Auditoría**:

```
1. Planificación
   ├─ Definir alcance y criterios
   ├─ Seleccionar auditores
   └─ Comunicar plan

2. Ejecución
   ├─ Reunión de apertura
   ├─ Recopilación de evidencia
   ├─ Muestreo de controles
   └─ Documentación de hallazgos

3. Reporte
   ├─ Reunión de cierre
   ├─ Informe de auditoría
   └─ No conformidades identificadas

4. Seguimiento
   ├─ Acciones correctivas
   └─ Verificación de implementación
```

### 9.3 Revisión por la Dirección

La alta dirección debe revisar el SGSI a intervalos planificados.

**Entradas de la Revisión**:

- Estado de acciones de revisiones previas
- Cambios en cuestiones internas/externas
- Retroalimentación sobre desempeño de seguridad:
  - No conformidades y acciones correctivas
  - Resultados de monitoreo y medición
  - Resultados de auditorías
  - Cumplimiento de objetivos de seguridad
- Retroalimentación de partes interesadas
- Resultados de evaluación de riesgos
- Oportunidades de mejora continua

**Salidas de la Revisión**:

- Decisiones relacionadas con oportunidades de mejora
- Necesidades de cambios al SGSI
- Necesidades de recursos

---

## Mejora (Cláusula 10) {#cláusula-10}

### 10.1 No Conformidades y Acciones Correctivas

Cuando ocurra una no conformidad:

1. **Reaccionar** ante la no conformidad:
   - Tomar acción para controlar y corregir
   - Hacer frente a las consecuencias

2. **Evaluar** necesidad de acción para eliminar causas:
   - Revisar la no conformidad
   - Determinar causas
   - Determinar si existen similares o podrían ocurrir

3. **Implementar** acciones correctivas

4. **Revisar** eficacia de acciones correctivas

5. **Actualizar** riesgos y oportunidades si es necesario

6. **Realizar cambios** al SGSI si es necesario

**Retener información documentada** como evidencia.

### 10.2 Mejora Continua

Mejorar continuamente la idoneidad, adecuación y eficacia del SGSI.

**Métodos de mejora**:
- Lecciones aprendidas de incidentes
- Resultados de auditorías
- Análisis de métricas
- Sugerencias de empleados
- Nuevas tecnologías/controles
- Cambios en amenazas

---

## Anexo A: Controles de Seguridad {#anexo-a}

### Estructura del Anexo A (2022)

**93 controles en 4 temas**:

#### 1. Controles Organizacionales (37 controles)

| ID | Control | Descripción |
|----|---------|-------------|
| A.5.1 | Políticas de seguridad | Conjunto de políticas aprobadas por la dirección |
| A.5.2 | Roles y responsabilidades | Asignación clara de responsabilidades |
| A.5.7 | Threat intelligence | Información sobre amenazas |
| A.5.23 | Seguridad en la nube | Controles para servicios cloud |

#### 2. Controles de Personas (8 controles)

| ID | Control | Descripción |
|----|---------|-------------|
| A.6.1 | Screening | Verificación de antecedentes |
| A.6.2 | Términos y condiciones de empleo | Responsabilidades de seguridad |
| A.6.3 | Concienciación y capacitación | Programa de awareness |
| A.6.4 | Proceso disciplinario | Consecuencias por violaciones |

#### 3. Controles Físicos (14 controles)

| ID | Control | Descripción |
|----|---------|-------------|
| A.7.1 | Perímetros de seguridad física | Protección de áreas |
| A.7.2 | Entrada física | Control de acceso físico |
| A.7.4 | Monitoreo de seguridad física | Vigilancia |
| A.7.7 | Escritorio limpio y pantalla limpia | Clear desk/screen policy |

#### 4. Controles Tecnológicos (34 controles)

| ID | Control | Descripción |
|----|---------|-------------|
| A.8.1 | Dispositivos de usuario final | Gestión de laptops, móviles |
| A.8.5 | Autenticación segura | MFA, passwords fuertes |
| A.8.9 | Gestión de configuración | Configuration management |
| A.8.23 | Filtrado web | Bloqueo de sitios maliciosos |
| A.8.24 | Uso de criptografía | Cifrado de datos |

**Nuevos controles en 2022**:
- **A.5.7**: Threat intelligence
- **A.5.23**: Information security for use of cloud services
- **A.8.9**: Configuration management
- **A.8.10**: Information deletion
- **A.8.11**: Data masking
- **A.8.12**: Data leakage prevention
- **A.8.16**: Monitoring activities
- **A.8.23**: Web filtering
- **A.8.28**: Secure coding

---

## Proceso de Certificación {#certificación}

### Etapas de Certificación

```
┌──────────────────────────────────────────────────────────┐
│            PROCESO DE CERTIFICACIÓN ISO 27001            │
└──────────────────────────────────────────────────────────┘

Fase 0: PRE-AUDITORÍA
├─ Gap Analysis (análisis de brechas)
├─ Implementación de controles faltantes
└─ Auditoría interna completa
   Duración: 6-12 meses

Fase 1: AUDITORÍA DE ETAPA 1 (Stage 1)
├─ Revisión documental
├─ Verificación de alcance
├─ Revisión de evaluación de riesgos
├─ Revisión de Declaración de Aplicabilidad
└─ Identificación de gaps mayores
   Duración: 1-2 días

   [Si pasa] ▼

Fase 2: AUDITORÍA DE ETAPA 2 (Stage 2)
├─ Auditoría completa en sitio
├─ Muestreo de controles implementados
├─ Entrevistas con personal
├─ Revisión de evidencias
├─ Observación de procesos
└─ Informe de auditoría con no conformidades
   Duración: 2-5 días (según tamaño organización)

   [Si pasa o NC menores] ▼

Fase 3: CERTIFICACIÓN
├─ Corrección de no conformidades (si existen)
├─ Emisión del certificado ISO 27001
└─ Válido por 3 años

Fase 4: AUDITORÍAS DE VIGILANCIA (Surveillance)
├─ Auditoría anual (año 1 y año 2)
├─ Verificación de mantenimiento del SGSI
└─ Revisión de controles por muestreo
   Duración: 1-2 días

Fase 5: RECERTIFICACIÓN
├─ Auditoría completa (año 3)
├─ Similar a Stage 2
└─ Renovación del certificado por 3 años más
```

### Costos Estimados

| Componente | Costo Estimado (USD) |
|------------|----------------------|
| Consultoría (6-12 meses) | $30,000 - $100,000 |
| Capacitación (ISO 27001 Lead Implementer) | $2,000 - $5,000/persona |
| Herramientas (GRC platform) | $10,000 - $50,000/año |
| Auditoría Stage 1 + Stage 2 | $15,000 - $40,000 |
| Auditorías de vigilancia (anual) | $5,000 - $15,000 |
| Recertificación (cada 3 años) | $15,000 - $40,000 |
| **TOTAL (3 años)** | **$80,000 - $300,000** |

Varía según tamaño de organización, alcance, complejidad.

---

## Implementación Step-by-Step {#implementación}

### Roadmap de 12 Meses

#### Mes 1-2: Preparación

- [ ] Obtener compromiso de la alta dirección
- [ ] Definir alcance del SGSI
- [ ] Formar comité de seguridad
- [ ] Designar CISO o responsable del SGSI
- [ ] Realizar Gap Analysis
- [ ] Desarrollar cronograma de proyecto

#### Mes 3-4: Documentación

- [ ] Escribir política de seguridad
- [ ] Identificar requisitos legales y contractuales
- [ ] Documentar inventario de activos
- [ ] Clasificar información
- [ ] Identificar partes interesadas

#### Mes 5-6: Evaluación de Riesgos

- [ ] Seleccionar metodología de evaluación de riesgos
- [ ] Identificar amenazas y vulnerabilidades
- [ ] Evaluar riesgos (impacto × probabilidad)
- [ ] Priorizar riesgos
- [ ] Documentar registro de riesgos

#### Mes 7-8: Tratamiento de Riesgos

- [ ] Seleccionar controles del Anexo A
- [ ] Crear Declaración de Aplicabilidad (SoA)
- [ ] Desarrollar plan de tratamiento de riesgos
- [ ] Asignar responsables de controles
- [ ] Presupuestar controles

#### Mes 9-10: Implementación de Controles

- [ ] Implementar controles organizacionales
- [ ] Implementar controles técnicos
- [ ] Implementar controles físicos
- [ ] Implementar controles de personal
- [ ] Capacitar a empleados
- [ ] Documentar procedimientos

#### Mes 11: Verificación

- [ ] Realizar auditoría interna
- [ ] Corregir no conformidades
- [ ] Ejecutar revisión por la dirección
- [ ] Monitorear KPIs
- [ ] Ajustar controles según necesidad

#### Mes 12: Certificación

- [ ] Seleccionar organismo de certificación
- [ ] Realizar auditoría Stage 1
- [ ] Corregir gaps identificados
- [ ] Realizar auditoría Stage 2
- [ ] Obtener certificación

---

## Referencias {#referencias}

### Estándares ISO

- **ISO/IEC 27001:2022** - Information security management systems — Requirements
- **ISO/IEC 27002:2022** - Code of practice for information security controls
- **ISO/IEC 27005:2022** - Information security risk management
- **ISO/IEC 27017:2015** - Cloud security controls
- **ISO/IEC 27018:2019** - Privacy in cloud computing
- **ISO 31000:2018** - Risk management — Guidelines

### Documentos NIST

- **NIST SP 800-53 Rev. 5** - Security and Privacy Controls
- **NIST SP 800-30** - Guide for Conducting Risk Assessments
- **NIST Cybersecurity Framework (CSF)**

### Guías de Implementación

- ISO/IEC 27003:2017 - Information security management system implementation guidance
- ISO/IEC 27004:2016 - Information security management — Monitoring, measurement, analysis and evaluation

### Libros Recomendados

- Calder, A., & Watkins, S. (2020). *IT Governance: An International Guide to Data Security and ISO 27001/ISO 27002*. Kogan Page.
- Humphreys, E. (2016). *Implementing the ISO/IEC 27001:2013 ISMS Standard*. Artech House.
- Disterer, G. (2013). *ISO/IEC 27001:2013 - A Pocket Guide*. IT Governance Publishing.

### Organizaciones de Certificación

- **BSI (British Standards Institution)**: https://www.bsigroup.com/
- **DNV**: https://www.dnv.com/
- **SGS**: https://www.sgs.com/
- **TÜV**: https://www.tuv.com/

### Herramientas y Plataformas

- **vComply** - GRC platform
- **ISMS.online** - ISO 27001 compliance software
- **Secureframe** - Compliance automation
- **Drata** - Continuous compliance

---

## Conclusión

ISO/IEC 27001:2022 proporciona un marco robusto y reconocido internacionalmente para gestionar la seguridad de la información. La implementación exitosa requiere:

✅ **Compromiso de liderazgo**: La alta dirección debe apoyar activamente
✅ **Enfoque en riesgos**: Decisiones basadas en evaluación rigurosa
✅ **Mejora continua**: PDCA como motor de evolución
✅ **Documentación sólida**: Evidencia de cumplimiento
✅ **Cultura de seguridad**: Todos los empleados involucrados

**Beneficios de la certificación**:
- Reducción de riesgos de seguridad
- Cumplimiento legal y contractual
- Ventaja competitiva
- Confianza de clientes y socios
- Mejora de procesos

**Próximo paso**: Laboratorio 1 - ISO 27001 Gap Analysis

---

**Palabras**: ~1850
**Lectura estimada**: 60-75 minutos
