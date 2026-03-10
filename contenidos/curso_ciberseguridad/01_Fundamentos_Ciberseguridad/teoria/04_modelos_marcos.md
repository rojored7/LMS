# 1.4 MODELOS Y MARCOS DE SEGURIDAD

**Duración**: 30 minutos
**Nivel**: Principiante

---

## 📋 Contenido

1. [NIST Cybersecurity Framework](#nist-cybersecurity-framework)
2. [ISO/IEC 27001/27002](#isoiec-2700127002)
3. [MITRE ATT&CK Framework](#mitre-attck-framework)
4. [Cyber Kill Chain](#cyber-kill-chain)
5. [Modelos de Seguridad Clásicos](#modelos-de-seguridad-clásicos)
6. [Comparativa y Aplicación](#comparativa-y-aplicación)

---

## NIST Cybersecurity Framework

**Desarrollado por**: National Institute of Standards and Technology (USA)
**Año**: 2014 (Actualización 2.0: 2024)
**Propósito**: Marco flexible para gestionar riesgos de ciberseguridad

### Estructura: Las 5 Funciones

```
IDENTIFICAR → PROTEGER → DETECTAR → RESPONDER → RECUPERAR
    ↓           ↓           ↓           ↓           ↓
  Assets    Safeguards  Anomalies   Actions    Resilience
```

#### 1. IDENTIFICAR (Identify)
Entender el contexto organizacional y riesgos.

**Categorías**:
- **Gestión de Activos (ID.AM)**
  - Inventario de dispositivos
  - Inventario de software
  - Mapeo de flujos de datos
  - Clasificación de activos

- **Entorno de Negocio (ID.BE)**
  - Rol en cadena de suministro
  - Prioridades organizacionales
  - Dependencias críticas

- **Gobierno (ID.GV)**
  - Políticas de seguridad
  - Roles y responsabilidades
  - Requisitos legales y regulatorios

- **Evaluación de Riesgos (ID.RA)**
  - Identificación de vulnerabilidades
  - Análisis de amenazas internas/externas
  - Evaluación de impacto

- **Estrategia de Gestión de Riesgos (ID.RM)**
  - Procesos de toma de decisiones
  - Tolerancia al riesgo
  - Priorización

**Ejemplo práctico**:
```
Activo: Servidor de base de datos con PII
Categorización: Crítico - Alta confidencialidad
Amenazas: SQLi, acceso no autorizado, ransomware
Impacto: Alto (GDPR, reputación)
Prioridad: #1 en protección
```

#### 2. PROTEGER (Protect)
Implementar salvaguardas para asegurar servicios críticos.

**Categorías**:
- **Control de Acceso (PR.AC)**
  - Autenticación multifactor
  - Principio de mínimo privilegio
  - Gestión de identidades

- **Concienciación y Entrenamiento (PR.AT)**
  - Capacitación en seguridad
  - Simulacros de phishing
  - Políticas de uso aceptable

- **Seguridad de Datos (PR.DS)**
  - Cifrado en reposo y tránsito
  - Gestión de claves
  - Destrucción segura de datos

- **Procesos de Protección de Información (PR.IP)**
  - Baseline de configuración
  - Gestión de cambios
  - Backups

- **Mantenimiento (PR.MA)**
  - Mantenimiento predictivo
  - Control de acceso remoto
  - Logs de mantenimiento

- **Tecnología de Protección (PR.PT)**
  - Firewalls
  - IDS/IPS
  - DLP (Data Loss Prevention)
  - Email security

#### 3. DETECTAR (Detect)
Identificar ocurrencia de eventos de ciberseguridad.

**Categorías**:
- **Anomalías y Eventos (DE.AE)**
  - Análisis de comportamiento (UEBA)
  - Alertas de eventos
  - Correlación de logs

- **Monitoreo Continuo de Seguridad (DE.CM)**
  - SIEM
  - Escaneo de vulnerabilidades
  - Inteligencia de amenazas

- **Procesos de Detección (DE.DP)**
  - Roles y responsabilidades
  - Testing de detección
  - Comunicación de eventos

**Herramientas típicas**:
- SIEM: Splunk, ELK, QRadar
- EDR: CrowdStrike, Carbon Black
- NDR: Darktrace, ExtraHop

#### 4. RESPONDER (Respond)
Tomar acción ante incidente detectado.

**Categorías**:
- **Planificación de Respuesta (RS.RP)**
  - Plan de respuesta a incidentes
  - Procedimientos documentados
  - Contactos clave

- **Comunicaciones (RS.CO)**
  - Stakeholders internos
  - Coordinación externa
  - Compartir información (ISACs)

- **Análisis (RS.AN)**
  - Investigación forense
  - Entender impacto
  - Análisis de causa raíz

- **Mitigación (RS.MI)**
  - Contención
  - Erradicación
  - Prevención de expansión

- **Mejoras (RS.IM)**
  - Lecciones aprendidas
  - Actualización de planes
  - Testing post-incidente

**Flujo de Respuesta**:
```
Detección → Triage → Contención → Erradicación → Recuperación → Lessons Learned
```

#### 5. RECUPERAR (Recover)
Restaurar capacidades y servicios afectados.

**Categorías**:
- **Planificación de Recuperación (RC.RP)**
  - Plan de continuidad de negocio (BCP)
  - Plan de recuperación ante desastres (DRP)
  - RTOs y RPOs definidos

- **Mejoras (RC.IM)**
  - Incorporar lecciones
  - Actualizar estrategias
  - Comunicación de cambios

- **Comunicaciones (RC.CO)**
  - Gestión de crisis
  - Comunicación pública
  - Stakeholders

**KPIs de recuperación**:
- **RTO (Recovery Time Objective)**: Tiempo máximo de downtime aceptable
- **RPO (Recovery Point Objective)**: Pérdida máxima de datos aceptable

```
Ejemplo:
Sistema crítico: RTO = 2 horas, RPO = 15 minutos
→ Backups cada 15 min, capacidad de restaurar en < 2h
```

### Niveles de Implementación (Tiers)

**Tier 1 - Parcial**:
- Gestión ad-hoc
- Conciencia limitada de riesgos
- No hay procesos formales

**Tier 2 - Informado por Riesgo**:
- Prácticas aprobadas pero no políticas
- Conciencia de riesgos pero no a nivel org
- Compartición informal

**Tier 3 - Repetible**:
- Políticas formales
- Prácticas consistentes
- Colaboración regular

**Tier 4 - Adaptativo**:
- Gestión proactiva
- Mejora continua
- Integración completa con negocio

---

## ISO/IEC 27001/27002

**Desarrollado por**: International Organization for Standardization
**Tipo**: Estándar internacional certificable

### ISO/IEC 27001 - Sistema de Gestión de Seguridad de la Información (SGSI)

**Enfoque**: Gestión y certificación

**Ciclo PDCA**:
```
PLAN → DO → CHECK → ACT
  ↓     ↓      ↓      ↓
 Pol.  Impl. Audit. Mejora
  ↑                    ↓
  └────────────────────┘
```

**Cláusulas principales**:

**4. Contexto de la Organización**
- Entender organización y contexto
- Necesidades de partes interesadas
- Alcance del SGSI

**5. Liderazgo**
- Compromiso de dirección
- Política de seguridad
- Roles y responsabilidades

**6. Planificación**
- Acciones para riesgos y oportunidades
- Objetivos de seguridad
- Planificación de cambios

**7. Soporte**
- Recursos
- Competencia
- Concienciación
- Comunicación
- Información documentada

**8. Operación**
- Planificación operacional
- Evaluación de riesgos
- Tratamiento de riesgos

**9. Evaluación del Desempeño**
- Monitoreo y medición
- Auditoría interna
- Revisión por dirección

**10. Mejora**
- No conformidades
- Acción correctiva
- Mejora continua

### ISO/IEC 27002 - Controles de Seguridad

**Actualización**: 2022 (de 14 dominios a 4 temas)

**Estructura nueva**:

**1. Controles Organizacionales (37 controles)**
- Políticas de seguridad
- Organización de seguridad de información
- Seguridad de RRHH
- Gestión de activos
- Control de acceso
- Seguridad física y ambiental
- Operaciones de seguridad
- Seguridad en comunicaciones
- etc.

**2. Controles de Personas (8 controles)**
- Screening
- Términos y condiciones de empleo
- Concienciación y entrenamiento
- Proceso disciplinario
- Responsabilidades al terminar empleo

**3. Controles Físicos (14 controles)**
- Perímetros de seguridad física
- Entrada física
- Seguridad de oficinas, salas y instalaciones
- Protección contra amenazas externas
- Trabajo en áreas seguras
- etc.

**4. Controles Tecnológicos (34 controles)**
- Dispositivos de usuario final
- Derechos de acceso privilegiado
- Restricción de acceso a información
- Acceso a código fuente
- Autenticación segura
- Gestión de capacidades
- Protección contra malware
- Backup
- Logging
- Monitoreo
- Criptografía
- Desarrollo seguro
- etc.

**Total**: 93 controles (anteriormente 114 en versión 2013)

### Proceso de Certificación ISO 27001

```
1. Definir alcance
2. Realizar análisis de brechas
3. Implementar controles
4. Documentar SGSI
5. Auditoría interna
6. Revisión de dirección
7. Auditoría de certificación (Etapa 1 y 2)
8. Certificación (válida 3 años)
9. Auditorías de seguimiento (anuales)
```

**Duración típica**: 6-12 meses para implementación inicial

---

## MITRE ATT&CK Framework

**ATT&CK**: Adversarial Tactics, Techniques, and Common Knowledge
**Desarrollado por**: MITRE Corporation
**Propósito**: Base de conocimiento de tácticas y técnicas de adversarios

### Matrices

**1. Enterprise**
- Windows
- macOS
- Linux
- Cloud (AWS, Azure, GCP)
- Network
- Containers

**2. Mobile**
- Android
- iOS

**3. ICS (Industrial Control Systems)**
- Sistemas SCADA
- PLCs

### Estructura: Tácticas y Técnicas

**14 Tácticas** (objetivos del adversario):

```
TA0001: Reconocimiento
TA0002: Desarrollo de Recursos
TA0003: Acceso Inicial
TA0004: Ejecución
TA0005: Persistencia
TA0006: Escalada de Privilegios
TA0007: Evasión de Defensas
TA0008: Acceso a Credenciales
TA0009: Descubrimiento
TA0010: Movimiento Lateral
TA0011: Recolección
TA0012: Comando y Control (C2)
TA0013: Exfiltración
TA0014: Impacto
```

**Ejemplo detallado - TA0003 Acceso Inicial**:

| ID | Técnica | Descripción |
|----|---------|-------------|
| T1566 | Phishing | Correos maliciosos |
| T1566.001 | └─ Spearphishing Attachment | Adjunto malicioso |
| T1566.002 | └─ Spearphishing Link | Enlace malicioso |
| T1190 | Exploit Public-Facing Application | Explotar vulnerabilidad web |
| T1133 | External Remote Services | VPN, RDP comprometidos |
| T1078 | Valid Accounts | Uso de credenciales legítimas |

### Uso Práctico

**1. Threat Intelligence**
```
APT29 (Cozy Bear) usa:
- T1566.001 (Spearphishing)
- T1059.001 (PowerShell)
- T1071.001 (C2 over HTTPS)
```

**2. Detección**
```
Técnica: T1003.001 - LSASS Memory Dump
Detección:
- Acceso a proceso lsass.exe por proceso no autorizado
- Alertas Sysmon Event ID 10 (ProcessAccess)
```

**3. Emulación de Adversario (Red Team)**
```
Scenario: Ransomware
1. T1566.001: Phishing email
2. T1204.002: User executes macro
3. T1059.003: Windows Command Shell
4. T1486: Data Encrypted for Impact
```

**4. Mapeo de Controles**
```
Técnica: T1078 (Valid Accounts)
Controles:
- MFA (mitiga)
- Monitoreo de autenticaciones anómalas (detecta)
- Principio de mínimo privilegio (reduce)
```

### Herramientas

- **ATT&CK Navigator**: Visualización interactiva
- **Caldera**: Plataforma de emulación automatizada
- **Atomic Red Team**: Tests de técnicas ATT&CK

---

## Cyber Kill Chain

**Desarrollado por**: Lockheed Martin
**Año**: 2011
**Propósito**: Modelar fases de un ciberataque

### Las 7 Fases

```
1. RECONOCIMIENTO → 2. ARMAMENTO → 3. ENTREGA → 4. EXPLOTACIÓN →
5. INSTALACIÓN → 6. C2 → 7. ACCIONES EN OBJETIVOS
```

#### 1. Reconocimiento (Reconnaissance)
Recopilación de información sobre el objetivo.

**Técnicas**:
- OSINT (Open Source Intelligence)
- Escaneo de redes (Nmap)
- Ingeniería social
- Búsqueda en redes sociales (LinkedIn)
- Whois, DNS enumeration

**Defensas**:
- Limitar información pública
- Honeypots para detectar reconocimiento
- Monitoreo de logs de firewall

#### 2. Armamento (Weaponization)
Crear entregable malicioso.

**Ejemplos**:
- Documento Office con macro maliciosa
- PDF con exploit
- Troyano empaquetado en instalador legítimo

**Componentes**:
- Payload (malware)
- Exploit (vulnerabilidad a explotar)

#### 3. Entrega (Delivery)
Transmitir arma al objetivo.

**Vectores**:
- Email (phishing)
- Sitio web comprometido (watering hole)
- USB malicioso
- Redes sociales

**Defensas**:
- Email security gateway
- Filtrado web
- Endpoint protection
- Educación de usuarios

#### 4. Explotación (Exploitation)
Ejecutar código en sistema víctima.

**Tipos**:
- Exploit de vulnerabilidad
- Ejecución por usuario (social engineering)
- Bypass de autenticación

**Defensas**:
- Patching
- DEP (Data Execution Prevention)
- ASLR (Address Space Layout Randomization)
- Application whitelisting

#### 5. Instalación (Installation)
Instalar backdoor para persistencia.

**Técnicas**:
- Registry keys
- Scheduled tasks
- Servicios de Windows
- DLLs maliciosas

**Defensas**:
- Endpoint Detection and Response (EDR)
- Application control
- Integrity monitoring (HIDS)

#### 6. Comando y Control (C2)
Establecer canal de comunicación con atacante.

**Protocolos comunes**:
- HTTP/HTTPS (puerto 80/443)
- DNS tunneling
- Redes sociales (Twitter, Telegram)

**Características**:
- Ofuscación
- Cifrado
- Domain generation algorithms (DGA)

**Defensas**:
- Proxy filtering
- IDS/IPS signatures
- Análisis de tráfico (Zeek/Suricata)
- Threat intelligence feeds

#### 7. Acciones en Objetivos (Actions on Objectives)
Lograr objetivo del ataque.

**Objetivos comunes**:
- Exfiltración de datos
- Destrucción de datos
- Cifrado (ransomware)
- Movimiento lateral
- Escalada de privilegios

**Defensas**:
- DLP (Data Loss Prevention)
- Network segmentation
- Backup y recovery
- Incident response plan

### Concepto Clave: "Romper la Cadena"

```
Si rompes CUALQUIER eslabón, el ataque falla.

Ejemplo:
❌ Reconocimiento detectado → Honeypot activado
✅ Entrega bloqueada → Email filtrado
✅ Instalación prevenida → EDR bloquea backdoor
✅ C2 interrumpido → Firewall bloquea dominio malicioso
```

**Estrategia**: Defensas en cada fase (defensa en profundidad)

---

## Modelos de Seguridad Clásicos

### Modelo Bell-LaPadula

**Enfoque**: **Confidencialidad**
**Año**: 1973

**Principios**:

**1. No Read Up (Simple Security Property)**
```
Sujeto en nivel L no puede leer objeto en nivel > L
```

**2. No Write Down (*-Property / Star Property)**
```
Sujeto en nivel L no puede escribir objeto en nivel < L
```

**Niveles de clasificación**:
```
Top Secret
   ↑
  Secret
   ↑
Confidential
   ↑
Unclassified
```

**Ejemplo militar**:
- Usuario con "Secret" clearance:
  - ✅ Puede leer "Confidential" o "Unclassified"
  - ❌ NO puede leer "Top Secret"
  - ✅ Puede escribir en "Secret" o superior
  - ❌ NO puede escribir en "Confidential" o "Unclassified" (evita fuga de info)

**Limitación**: No protege integridad

### Modelo Biba

**Enfoque**: **Integridad**
**Año**: 1977

**Principios** (inverso a Bell-LaPadula):

**1. No Read Down (Simple Integrity Axiom)**
```
No leer datos de nivel inferior (pueden estar contaminados)
```

**2. No Write Up (Integrity *-Property)**
```
No escribir a nivel superior (contaminarías datos más confiables)
```

**Niveles de integridad**:
```
Alta Integridad (Verificado)
        ↓
  Media Integridad
        ↓
  Baja Integridad (No confiable)
```

**Ejemplo**:
- Proceso crítico (alta integridad):
  - ✅ Solo lee de fuentes confiables (alta integridad)
  - ❌ NO lee de input de usuario (baja integridad)
  - ✅ Escribe a su nivel o inferior
  - ❌ NO puede escribir a nivel superior

### Modelo Clark-Wilson

**Enfoque**: Integridad comercial (transacciones)
**Año**: 1987

**Conceptos**:

**CDI (Constrained Data Item)**: Datos sujetos a controles de integridad
**UDI (Unconstrained Data Item)**: Datos sin restricciones
**TP (Transformation Procedure)**: Programas que modifican CDIs
**IVP (Integrity Verification Procedure)**: Validan integridad de CDIs

**Reglas**:
- Los CDIs solo pueden ser modificados por TPs autorizados
- Los usuarios solo pueden ejecutar TPs para los que tienen autorización
- Separación de deberes

**Ejemplo bancario**:
```
CDI: Saldo de cuenta bancaria
TP: Transferencia bancaria
IVP: Auditoría de sumas (débitos = créditos)

Usuario no puede modificar saldo directamente.
Solo puede ejecutar TP "transferir" si está autorizado.
```

### Modelo Brewer-Nash (Chinese Wall)

**Enfoque**: Conflicto de interés
**Año**: 1989

**Propósito**: Prevenir conflictos de interés (ej: consultor trabajando para competidores)

**Regla**:
- Si accediste a información de Compañía A, no puedes acceder a información de Compañía B si están en conflicto

**Ejemplo**:
```
Consultor accede a datos financieros de Coca-Cola
→ Sistema BLOQUEA acceso a datos de Pepsi
(ambas son competidoras en "Industria de Bebidas")
```

**Implementación**: DLP, etiquetado de datos, políticas dinámicas

---

## Comparativa y Aplicación

### Cuándo Usar Cada Marco

| Marco | Mejor Para | Industria | Certificable |
|-------|------------|-----------|--------------|
| **NIST CSF** | Gestión de riesgos flexible | Gobierno US, Critical Infrastructure | No |
| **ISO 27001** | Certificación formal | Global, Todas | Sí |
| **MITRE ATT&CK** | Threat intelligence, Red Team | SOC, Threat Hunters | No |
| **Kill Chain** | Modelar ataques, Defensas | Todas | No |
| **Bell-LaPadula** | Confidencialidad estricta | Militar, Gobierno | No |
| **Biba** | Integridad crítica | Industrial, Control Systems | No |

### Marcos Complementarios

```
NIST CSF (Estrategia) + ISO 27001 (Implementación) + MITRE ATT&CK (Detección)
```

**Ejemplo de integración**:

1. **NIST CSF "Identificar"**: Define activos críticos
2. **ISO 27001**: Implementa controles del Anexo A
3. **MITRE ATT&CK**: Mapea detecciones específicas
4. **Kill Chain**: Modela cómo adversario atacaría

### Ejemplo Práctico Completo

**Escenario**: Proteger aplicación web con datos financieros

**NIST CSF**:
- **Identificar**: App web es activo crítico, PCI DSS aplica
- **Proteger**: WAF, cifrado TLS, MFA
- **Detectar**: SIEM con correlación
- **Responder**: Plan de respuesta a incidentes
- **Recuperar**: Backups cada 1 hora, RTO 2h

**ISO 27001**:
- Control A.8.2: Clasificación de información → Datos = "Confidencial"
- Control A.12.6: Gestión de vulnerabilidades → Escaneos mensuales
- Control A.14.2: Desarrollo seguro → SSDLC implementado

**MITRE ATT&CK**:
- Técnicas a monitorear: T1190 (Exploit web), T1059 (Command shell)
- Detección: WAF alerts, web shell detection

**Kill Chain Defensas**:
- Fase 1 (Recon): Limitar info pública, honeypots
- Fase 3 (Delivery): WAF reglas anti-exploit
- Fase 4 (Exploitation): Input validation, prepared statements
- Fase 7 (Actions): DLP para exfiltración

**Modelo de Seguridad**:
- Biba: Datos de usuarios (baja integridad) no modifican directamente BD
- Clark-Wilson: Transacciones solo vía stored procedures autorizados

---

## Resumen

### Marcos Principales

1. **NIST CSF**: Framework de gestión de riesgos (5 funciones)
2. **ISO 27001/27002**: Estándar certificable (SGSI + 93 controles)
3. **MITRE ATT&CK**: Base de conocimiento de técnicas de adversarios
4. **Cyber Kill Chain**: Modelo de 7 fases de ataque
5. **Modelos Clásicos**: Bell-LaPadula (confidencialidad), Biba (integridad)

### Principio Clave

**No hay "marco perfecto"**. La seguridad efectiva combina múltiples marcos según:
- Industria y regulaciones
- Madurez organizacional
- Recursos disponibles
- Amenazas específicas

---

## Ejercicios

### Ejercicio 1: Mapeo de Controles
Mapea estos controles a funciones NIST CSF:
1. Implementar MFA
2. Escaneo de vulnerabilidades mensual
3. Simulacro de ransomware
4. Backups diarios
5. Capacitación anual de phishing

<details>
<summary>Ver respuestas</summary>

1. Proteger
2. Detectar
3. Responder
4. Recuperar
5. Proteger
</details>

### Ejercicio 2: Kill Chain
Para cada defensa, indica qué fase del Kill Chain interrumpe:
1. Email gateway que escanea adjuntos
2. EDR que bloquea creación de scheduled tasks
3. Firewall que bloquea dominios de C2
4. Educación de usuarios

### Ejercicio 3: MITRE ATT&CK
Investiga el grupo APT28 (Fancy Bear) y documenta:
- 3 tácticas que usan
- 5 técnicas específicas (con IDs)
- Controles para mitigarlas

---

## Referencias

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [Lockheed Martin Cyber Kill Chain](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)
- [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)

---

[⬅️ Anterior: Amenazas y Vulnerabilidades](./03_amenazas_vulnerabilidades_riesgos.md) | [➡️ Siguiente: Laboratorios](../laboratorios/)
