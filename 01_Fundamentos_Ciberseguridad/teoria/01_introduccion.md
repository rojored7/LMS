# 1.1 Introducción a la Ciberseguridad

**Duración**: 30 minutos
**Última actualización**: 2026-02-10

---

## ¿Qué es la Ciberseguridad?

La **ciberseguridad** es la práctica de proteger sistemas informáticos, redes, programas y datos contra ataques digitales, daños o accesos no autorizados.

### Definición Formal

> "La ciberseguridad comprende todas las tecnologías, procesos y prácticas diseñadas para proteger redes, dispositivos, programas y datos de ataques, daños o acceso no autorizado."
> — NIST (National Institute of Standards and Technology)

### Objetivos Principales

1. **Proteger la información** contra accesos no autorizados
2. **Mantener la integridad** de los datos
3. **Garantizar la disponibilidad** de sistemas y servicios
4. **Asegurar la privacidad** de usuarios y organizaciones
5. **Cumplir con regulaciones** y normativas legales

---

## Evolución Histórica de la Ciberseguridad

### 1970s - Los Inicios

**1971**: Primer virus informático "Creeper"
- Programa que se copiaba a sí mismo en mainframes
- Mostraba el mensaje: "I'm the creeper, catch me if you can!"
- Se creó "Reaper", el primer antivirus, para eliminarlo

**1975**: ARPANET implementa primeras medidas de seguridad
- Contraseñas de acceso
- Sistemas de autenticación básicos

### 1980s - Nacimiento de la Era Hacker

**1983**: Película "WarGames" populariza el concepto de hacking
- Aumenta la conciencia pública sobre vulnerabilidades

**1986**: Primer caso de espionaje cibernético
- Clifford Stoll descubre hackers alemanes accediendo a redes estadounidenses

**1988**: Morris Worm
- Primer gusano de Internet masivo
- Infectó ~10% de computadoras conectadas a Internet (6,000 máquinas)
- Llevó a la creación de CERT (Computer Emergency Response Team)

### 1990s - Internet y Nuevas Amenazas

**1991**: Phil Zimmermann crea PGP (Pretty Good Privacy)
- Primera herramienta de cifrado accesible al público

**1994**: Inicio del comercio electrónico
- SSL (Secure Sockets Layer) desarrollado por Netscape
- Necesidad de proteger transacciones financieras

**1999**: Virus Melissa
- Primer virus de propagación masiva por email
- Causó daños estimados en $80 millones

### 2000s - Era del Cibercrimen Organizado

**2000**: Ataques DDoS masivos
- Yahoo!, Amazon, eBay, CNN sufrieron caídas simultáneas

**2003**: SQL Slammer Worm
- Ralentizó Internet globalmente en 15 minutos

**2007**: Estonia bajo ciberataque masivo
- Primer caso de "ciberguerra" a nivel nacional
- Gobierno, bancos, medios fuera de servicio

**2009**: Operación Aurora (China → Google)
- Ataque sofisticado de espionaje industrial

### 2010s - APT y Ciberguerra

**2010**: Stuxnet
- Primer malware diseñado para sabotear infraestructura crítica
- Atacó centrifugadoras nucleares de Irán
- Marcó inicio de ciberarmas

**2013**: Filtración de Edward Snowden
- Reveló programas de vigilancia masiva (NSA)
- Aumentó conciencia sobre privacidad

**2014**: Sony Pictures hackeado
- Ataque atribuido a Corea del Norte
- Filtración de 100 TB de datos

**2016**: Botnet Mirai
- Infectó dispositivos IoT (cámaras, routers)
- DDoS masivo que afectó Twitter, Netflix, PayPal

**2017**: WannaCry Ransomware
- Cifró 230,000 computadoras en 150 países
- Explotó vulnerabilidad EternalBlue (NSA)
- Daños: $4 mil millones

**2017**: NotPetya
- Ransomware disfrazado, realmente "wiper"
- Atacó principalmente Ucrania
- Daños: $10 mil millones (el ciberataque más costoso de la historia)

### 2020s - Era Actual: Pandemia y Postcuántica

**2020**: Aumento de ataques durante COVID-19
- Zoom: vulnerabilidades expuestas ("Zoombombing")
- Phishing relacionado con vacunas y ayudas
- Ransomware contra hospitales

**2021**: Colonial Pipeline
- Ransomware cerró oleoducto principal de EE.UU.
- Escasez de combustible en la Costa Este
- Rescate pagado: $4.4 millones

**2021**: Log4Shell (Log4j vulnerability)
- Vulnerabilidad crítica en librería Java ubicua
- Calificada 10/10 en severidad
- Millones de sistemas afectados

**2023**: ChatGPT y IA Generativa
- Nuevos vectores de ataque con IA
- Phishing sofisticado generado por IA
- Deepfakes para ingeniería social

**2024**: Estandarización NIST PQC
- Primeros algoritmos postcuánticos estandarizados
- Inicio de migración para proteger contra amenaza cuántica

**2026 (ahora)**: Preparación para Q-Day
- Migración activa a criptografía postcuántica
- Regulaciones exigen protección cuántica
- Amenaza "Harvest now, decrypt later"

---

## Panorama Actual de Amenazas (2024-2026)

### Estadísticas Clave

- **Costo global del cibercrimen**: $10.5 trillones anuales (2024)
- **Ransomware**: Un ataque cada 11 segundos
- **Tiempo promedio para detectar una brecha**: 207 días
- **Costo promedio de una brecha de datos**: $4.45 millones
- **Dispositivos IoT vulnerables**: 41 mil millones conectados
- **Ataques de phishing**: 90% de todas las brechas comienzan con phishing

### Top Amenazas Actuales

#### 1. Ransomware-as-a-Service (RaaS)
- Modelo de negocio criminal democratizado
- Bandas: LockBit, BlackCat, Cl0p
- Doble y triple extorsión

#### 2. Supply Chain Attacks
- Compromiso de proveedores para atacar clientes
- Ejemplo: SolarWinds (2020), Kaseya (2021)
- Difícil detección y alto impacto

#### 3. Zero-Day Exploits
- Vulnerabilidades desconocidas explotadas antes de ser parcheadas
- Mercado negro: $100K - $2.5M por zero-day
- Usados por APT (Advanced Persistent Threats)

#### 4. Phishing Sofisticado con IA
- Correos indistinguibles de legítimos
- Deepfakes de voz para CEO fraud
- Business Email Compromise (BEC)

#### 5. Ataques a IoT y Dispositivos Inteligentes
- Cámaras, termostatos, wearables vulnerables
- Botnets para DDoS
- Espionaje doméstico

#### 6. Criptojacking
- Uso no autorizado de recursos para minar criptomonedas
- Difícil de detectar, degrada rendimiento

#### 7. Ataques a Cloud
- Misconfiguración de S3, Azure Blob
- Credenciales comprometidas
- API inseguras

#### 8. Amenaza Cuántica (Emergente)
- "Harvest now, decrypt later"
- Algoritmos cuánticos romperán RSA/ECC
- Urgencia de migrar a PQC

### Sectores Más Atacados

1. **Salud**: Datos médicos valen 10x más que datos financieros
2. **Financiero**: Objetivo obvio por dinero directo
3. **Gobierno**: Espionaje y ciberguerra
4. **Educación**: Infraestructura débil, datos valiosos
5. **Energía e Infraestructura Crítica**: Impacto nacional

---

## El Rol de la Ciberseguridad en la Era Digital

### ¿Por Qué Es Crítica?

#### 1. Transformación Digital
- Más servicios online = más superficie de ataque
- Cloud, IoT, 5G expanden perímetro de seguridad
- Trabajo remoto explotó con COVID-19

#### 2. Dependencia de Tecnología
- Infraestructuras críticas digitalizadas
- Economía depende de conectividad
- Datos son el "nuevo petróleo"

#### 3. Regulaciones Crecientes
- GDPR (Europa), CCPA (California)
- PCI DSS, HIPAA, SOX
- Multas millonarias por incumplimiento

#### 4. Confianza del Consumidor
- Brechas destruyen reputación
- Pérdida de clientes
- Impacto en valor de acciones

### Profesiones en Ciberseguridad

La demanda supera ampliamente la oferta.

#### Roles Comunes

| Rol | Descripción | Salario Promedio (USD) |
|-----|-------------|------------------------|
| **Security Analyst** | Monitoreo y respuesta a incidentes | $70K - $95K |
| **Penetration Tester** | Simula ataques para encontrar vulnerabilidades | $85K - $120K |
| **Security Engineer** | Diseña e implementa soluciones de seguridad | $90K - $130K |
| **Security Architect** | Define arquitectura de seguridad empresarial | $120K - $180K |
| **CISO** (Chief Information Security Officer) | Liderazgo estratégico de seguridad | $150K - $400K+ |
| **Incident Responder** | Gestiona brechas de seguridad | $80K - $110K |
| **Cryptographer** | Diseña algoritmos criptográficos | $100K - $150K |
| **Threat Intelligence Analyst** | Analiza tendencias y actores maliciosos | $85K - $115K |
| **Security Auditor/Consultant** | Evalúa cumplimiento y riesgos | $90K - $140K |
| **Malware Analyst** | Realiza ingeniería inversa de malware | $85K - $125K |

#### Certificaciones Valiosas
- **CompTIA Security+**: Entrada al campo
- **CEH** (Certified Ethical Hacker): Pentesting
- **CISSP** (Certified Information Systems Security Professional): Gestión
- **OSCP** (Offensive Security Certified Professional): Pentesting avanzado
- **CISM** (Certified Information Security Manager): Gestión de seguridad

---

## Tipos de Seguridad

La ciberseguridad se divide en múltiples dominios:

### 1. Network Security (Seguridad de Redes)
- Proteger redes de intrusiones
- Firewalls, IDS/IPS, VPN
- Segmentación de redes

### 2. Application Security (Seguridad de Aplicaciones)
- Código seguro desde el diseño
- Testing: SAST, DAST
- OWASP Top 10

### 3. Information Security (Seguridad de Información)
- Proteger datos en reposo y tránsito
- Cifrado, DLP (Data Loss Prevention)
- Clasificación de datos

### 4. Operational Security (OpSec)
- Procesos y decisiones para proteger datos
- Gestión de permisos
- Manejo de datos sensibles

### 5. Disaster Recovery / Business Continuity
- Planes para recuperación ante desastres
- Backups, sistemas redundantes
- RTO (Recovery Time Objective), RPO (Recovery Point Objective)

### 6. End-User Education
- El usuario es el eslabón más débil
- Capacitación en phishing, contraseñas
- Cultura de seguridad

### 7. Cloud Security
- Proteger datos y aplicaciones en la nube
- Responsabilidad compartida (proveedor + cliente)
- CASB (Cloud Access Security Broker)

### 8. IoT Security
- Dispositivos con seguridad limitada
- Actualización de firmware
- Aislamiento de red

### 9. Identity and Access Management (IAM)
- Control de quién accede a qué
- MFA (Multi-Factor Authentication)
- SSO (Single Sign-On)

---

## Actores de Amenazas

### 1. Script Kiddies
- **Nivel**: Principiante
- **Motivación**: Diversión, reconocimiento
- **Métodos**: Herramientas automatizadas
- **Peligro**: Bajo a medio

### 2. Hacktivistas
- **Nivel**: Intermedio
- **Motivación**: Ideológica, política
- **Ejemplos**: Anonymous, LulzSec
- **Métodos**: DDoS, deface, leaks
- **Peligro**: Medio

### 3. Cibercriminales
- **Nivel**: Intermedio a avanzado
- **Motivación**: Financiera
- **Métodos**: Ransomware, robo de datos, fraude
- **Peligro**: Alto

### 4. Insiders Maliciosos
- **Nivel**: Varía
- **Motivación**: Venganza, dinero
- **Ventaja**: Acceso legítimo
- **Peligro**: Muy alto

### 5. APT (Advanced Persistent Threats)
- **Nivel**: Experto
- **Respaldo**: Estados-nación
- **Motivación**: Espionaje, sabotaje
- **Ejemplos**: APT28 (Rusia), APT29 (Rusia), Lazarus (Corea del Norte)
- **Métodos**: Zero-days, ingeniería social sofisticada
- **Peligro**: Crítico

### 6. Terroristas Cibernéticos
- **Nivel**: Avanzado
- **Motivación**: Miedo, destrucción
- **Objetivo**: Infraestructura crítica
- **Peligro**: Crítico

---

## Conceptos Clave a Recordar

1. **La ciberseguridad es un proceso continuo**, no un producto
2. **La seguridad perfecta no existe** - se trata de gestión de riesgo
3. **El usuario es fundamental** - tecnología sola no basta
4. **Defensa en capas** es esencial
5. **Asumir que serás comprometido** - preparar respuesta
6. **La amenaza evoluciona constantemente** - aprendizaje continuo

---

## Ejercicio de Reflexión

Antes de continuar, reflexiona:

1. **Identifica**: ¿Qué sistemas o datos usas diariamente que requieren protección?
2. **Analiza**: ¿Has sido víctima de algún ciberataque? (phishing, malware, etc.)
3. **Evalúa**: ¿Qué medidas de seguridad ya implementas?
4. **Considera**: ¿Por qué te interesa la ciberseguridad?

---

## Próximo Tema

En el siguiente tema exploraremos los **Principios Fundamentales** de ciberseguridad, incluyendo la famosa tríada CIA, defensa en profundidad y Zero Trust Architecture.

➡️ [02_principios_fundamentales.md](./02_principios_fundamentales.md)

---

## Referencias

- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- Verizon Data Breach Investigations Report (DBIR) 2024
- IBM Cost of a Data Breach Report 2024
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- MITRE ATT&CK: https://attack.mitre.org/
