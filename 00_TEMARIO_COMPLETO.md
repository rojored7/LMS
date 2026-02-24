# TEMARIO COMPLETO - CURSO DE CIBERSEGURIDAD
## De Principiante a Experto en Criptografía Postcuántica

**Duración Total**: 40 horas
**Modalidad**: Teórico-Práctica (60% práctica, 40% teoría)
**Última actualización**: 2026-02-10

---

## DISTRIBUCIÓN HORARIA GENERAL

| Tipo de Actividad | Horas | Porcentaje |
|-------------------|-------|------------|
| Teoría | 16h | 40% |
| Laboratorios Prácticos | 20h | 50% |
| Proyecto Final | 2h | 5% |
| Evaluaciones | 2h | 5% |
| **TOTAL** | **40h** | **100%** |

---

# MÓDULO 01: FUNDAMENTOS DE CIBERSEGURIDAD
**Duración**: 6 horas (2.5h teoría + 3h práctica + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Explicar los principios fundamentales de la tríada CIA
- [ ] Identificar vectores de ataque comunes y sus mitigaciones
- [ ] Evaluar riesgos y vulnerabilidades en sistemas
- [ ] Aplicar el modelo Zero Trust
- [ ] Configurar entornos seguros básicos

## Contenido Teórico (2.5 horas)

### 1.1 Introducción a la Ciberseguridad (30 min)
- ¿Qué es la ciberseguridad?
- Evolución histórica de las amenazas
- Panorama actual: ciberataques más comunes 2024-2026
- El rol de la ciberseguridad en la era digital

### 1.2 Principios Fundamentales (45 min)
- **Tríada CIA (Confidencialidad, Integridad, Disponibilidad)**
  - Confidencialidad: control de acceso a información
  - Integridad: protección contra modificaciones no autorizadas
  - Disponibilidad: garantía de acceso cuando se necesite
- **Principios adicionales**: Autenticación, Autorización, No repudio
- **Defensa en profundidad (Defense in Depth)**
- **Principio de mínimo privilegio**
- **Zero Trust Architecture**

### 1.3 Amenazas, Vulnerabilidades y Riesgos (45 min)
- Definiciones y diferencias
- **Tipos de amenazas**:
  - Malware (virus, ransomware, troyanos, spyware)
  - Phishing y ataques de ingeniería social
  - Ataques de fuerza bruta y diccionario
  - DDoS (Distributed Denial of Service)
  - Man-in-the-Middle (MitM)
  - SQL Injection, XSS, CSRF
- **Vulnerabilidades comunes**:
  - CVE (Common Vulnerabilities and Exposures)
  - OWASP Top 10
  - CWE (Common Weakness Enumeration)
- **Gestión de riesgos**:
  - Identificación, análisis, evaluación
  - Matrices de riesgo
  - Tratamiento: mitigar, transferir, aceptar, evitar

### 1.4 Modelos y Marcos de Seguridad (30 min)
- NIST Cybersecurity Framework
- ISO/IEC 27001/27002
- MITRE ATT&CK Framework
- Kill Chain de Lockheed Martin
- Modelo de seguridad Bell-LaPadula y Biba

## Laboratorios Prácticos (3 horas)

### Lab 01.1: Configuración de Entorno Seguro (1 hora)
**Objetivos**:
- Instalar y configurar máquina virtual con Kali Linux
- Configurar firewall y reglas básicas
- Implementar hardening básico del sistema

**Entregables**:
- Máquina virtual funcional
- Documento con configuraciones aplicadas

### Lab 01.2: Análisis de Vulnerabilidades con Nmap (1 hora)
**Objetivos**:
- Realizar escaneo de puertos
- Identificar servicios y versiones
- Detectar vulnerabilidades potenciales
- Generar reporte de hallazgos

**Herramientas**: Nmap, Zenmap, Metasploit Framework

**Entregables**:
- Reporte de escaneo
- Análisis de vulnerabilidades encontradas

### Lab 01.3: Simulación de Ataque y Defensa (1 hora)
**Objetivos**:
- Simular ataque de phishing (entorno controlado)
- Detectar el ataque con herramientas SIEM
- Implementar contramedidas
- Documentar incidente

**Herramientas**: GoPhish, Splunk (versión gratuita)

**Entregables**:
- Reporte de incidente
- Plan de mitigación

## Evaluación (30 min)
- Cuestionario de conceptos (20 preguntas)
- Análisis de caso práctico

## Recursos Adicionales
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MITRE ATT&CK](https://attack.mitre.org/)
- Libro recomendado: "The Web Application Hacker's Handbook"

---

# MÓDULO 02: REDES Y PROTOCOLOS DE SEGURIDAD
**Duración**: 4 horas (1.5h teoría + 2h práctica + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Explicar el funcionamiento de protocolos de red seguros
- [ ] Analizar tráfico de red con Wireshark
- [ ] Implementar TLS/SSL en aplicaciones
- [ ] Detectar y mitigar ataques de red comunes
- [ ] Configurar VPNs y túneles seguros

## Contenido Teórico (1.5 horas)

### 2.1 Fundamentos de Redes (30 min)
- Modelo OSI y TCP/IP
- Protocolos fundamentales: TCP, UDP, IP, ICMP
- DNS y resolución de nombres
- Subnetting y VLANs

### 2.2 Protocolos de Seguridad (45 min)
- **TLS/SSL**:
  - Handshake TLS
  - Certificados digitales X.509
  - Cipher suites y negociación
  - TLS 1.2 vs TLS 1.3
  - Perfect Forward Secrecy (PFS)
- **HTTPS y seguridad web**
- **SSH (Secure Shell)**
- **IPsec y VPNs**
- **DNSSEC**

### 2.3 Ataques de Red y Mitigaciones (15 min)
- ARP Spoofing
- DNS Poisoning
- Man-in-the-Middle (MitM)
- SSL Stripping
- Session Hijacking

## Laboratorios Prácticos (2 horas)

### Lab 02.1: Análisis de Tráfico con Wireshark (45 min)
**Objetivos**:
- Capturar tráfico HTTP, HTTPS, DNS
- Analizar handshake TLS
- Identificar información sensible en tráfico no cifrado
- Aplicar filtros avanzados

**Entregables**:
- Capturas de tráfico (.pcap)
- Análisis documentado

### Lab 02.2: Implementación de TLS (45 min)
**Objetivos**:
- Generar certificados autofirmados
- Configurar servidor HTTPS (Node.js/Python)
- Validar configuración TLS con SSLLabs
- Implementar HSTS

**Entregables**:
- Servidor funcional con TLS
- Reporte de configuración

### Lab 02.3: Ataque MitM y Contramedidas (30 min)
**Objetivos**:
- Simular ataque MitM con Ettercap (entorno controlado)
- Detectar el ataque
- Implementar contramedidas (ARP static entries, certificate pinning)

**Entregables**:
- Documentación del ataque y detección

## Evaluación (30 min)
- Cuestionario técnico
- Análisis de captura de tráfico

## Recursos Adicionales
- [RFC 8446 - TLS 1.3](https://tools.ietf.org/html/rfc8446)
- [SSL Labs](https://www.ssllabs.com/)
- Wireshark University

---

# MÓDULO 03: CRIPTOGRAFÍA CLÁSICA
**Duración**: 6 horas (2.5h teoría + 3h práctica + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Explicar diferencias entre cifrado simétrico y asimétrico
- [ ] Implementar AES, RSA, ECDSA desde cero
- [ ] Generar y gestionar claves criptográficas
- [ ] Aplicar funciones hash y firmas digitales
- [ ] Identificar vulnerabilidades criptográficas comunes

## Contenido Teórico (2.5 horas)

### 3.1 Fundamentos de Criptografía (30 min)
- Historia de la criptografía
- Cifrado clásico: César, Vigenère, Enigma
- Criptografía moderna
- Principios de Kerckhoffs
- Entropía y aleatoriedad

### 3.2 Cifrado Simétrico (45 min)
- **Conceptos**:
  - Clave compartida
  - Modos de operación (ECB, CBC, GCM, CTR)
  - Padding
- **Algoritmos**:
  - **AES (Advanced Encryption Standard)**:
    - AES-128, AES-192, AES-256
    - Rondas de cifrado
    - S-boxes y mezcla de columnas
  - DES/3DES (legado)
  - ChaCha20
- **Aplicaciones prácticas**

### 3.3 Cifrado Asimétrico (45 min)
- **Conceptos**:
  - Par de claves (pública/privada)
  - Problema matemático subyacente
- **RSA (Rivest-Shamir-Adleman)**:
  - Generación de claves
  - Cifrado y descifrado
  - Firmas digitales RSA
  - Padding (PKCS#1, OAEP)
  - Tamaños de clave: 2048, 3072, 4096 bits
- **Criptografía de Curva Elíptica (ECC)**:
  - ECDSA (firmas)
  - ECDH (intercambio de claves)
  - Curvas: P-256, P-384, P-521
  - Ed25519, X25519
- **Ventajas ECC vs RSA**

### 3.4 Funciones Hash y MACs (30 min)
- **Funciones Hash criptográficas**:
  - Propiedades: preimage resistance, collision resistance
  - SHA-256, SHA-384, SHA-512
  - SHA-3 (Keccak)
  - BLAKE2, BLAKE3
- **MACs (Message Authentication Codes)**:
  - HMAC
  - CMAC
- **Password Hashing**:
  - bcrypt, scrypt, Argon2

### 3.5 Infraestructura de Clave Pública (PKI) (20 min)
- Certificados digitales X.509
- Autoridades de certificación (CA)
- Cadenas de confianza
- Revocación (CRL, OCSP)

## Laboratorios Prácticos (3 horas)

### Lab 03.1: Implementación de AES (45 min)
**Objetivos**:
- Implementar cifrado AES-256-GCM en Python
- Cifrar y descifrar archivos
- Comparar modos de operación (CBC vs GCM)

**Código base**: Proporcionado

**Entregables**:
- Script funcional
- Comparativa de rendimiento

### Lab 03.2: Generación y Uso de Claves RSA (45 min)
**Objetivos**:
- Generar pares de claves RSA (2048, 3072 bits)
- Implementar cifrado y descifrado RSA
- Crear firmas digitales RSA
- Verificar firmas

**Herramientas**: OpenSSL, Python cryptography library

**Entregables**:
- Claves generadas
- Script de cifrado/firma

### Lab 03.3: Criptografía de Curva Elíptica (45 min)
**Objetivos**:
- Generar claves ECDSA (P-256)
- Implementar firma y verificación ECDSA
- Comparar con Ed25519
- Implementar ECDH para intercambio de claves

**Entregables**:
- Implementación funcional
- Análisis comparativo

### Lab 03.4: Ataque a Criptografía Débil (45 min)
**Objetivos**:
- Romper cifrado ECB (Penguin ECB attack)
- Ataque de padding oracle
- Rainbow tables para hashes débiles
- Identificar malas prácticas

**Entregables**:
- Demostraciones de ataques
- Recomendaciones de mitigación

## Evaluación (30 min)
- Cuestionario técnico avanzado
- Ejercicio de implementación

## Recursos Adicionales
- [Crypto101](https://www.crypto101.io/)
- [Cryptography I - Stanford (Coursera)](https://www.coursera.org/learn/crypto)
- Libro: "Serious Cryptography" - Jean-Philippe Aumasson

---

# MÓDULO 04: CRIPTOGRAFÍA POSTCUÁNTICA (PQC)
**Duración**: 6 horas (2.5h teoría + 3h práctica + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Explicar la amenaza de la computación cuántica
- [ ] Comprender algoritmos postcuánticos estandarizados por NIST
- [ ] Implementar ML-KEM y ML-DSA
- [ ] Diseñar estrategias de migración a PQC
- [ ] Evaluar esquemas híbridos clásico-postcuántico

## Contenido Teórico (2.5 horas)

### 4.1 La Amenaza Cuántica (45 min)
- **Computación Cuántica: Fundamentos**:
  - Qubits y superposición
  - Entrelazamiento cuántico
  - Compuertas cuánticas
- **Algoritmos Cuánticos que Rompen Criptografía**:
  - **Algoritmo de Shor**: rompe RSA y ECC
  - **Algoritmo de Grover**: debilita cifrado simétrico
- **Línea de Tiempo**:
  - Estado actual de computadoras cuánticas
  - "Harvest now, decrypt later" attack
  - Q-Day: ¿cuándo llegará?
- **Impacto en seguridad actual**

### 4.2 Criptografía Postcuántica: Introducción (30 min)
- Definición y objetivos
- Proceso de estandarización NIST PQC (2016-2024)
- Familias de algoritmos PQC:
  - **Lattice-based** (basados en retículas)
  - **Code-based** (basados en códigos)
  - **Hash-based** (basados en hashes)
  - **Multivariate** (ecuaciones multivariables)
  - **Isogeny-based** (isogenias de curvas elípticas)

### 4.3 Algoritmos NIST PQC Estandarizados (60 min)

#### Encapsulación de Claves (KEM)
- **ML-KEM (Module-Lattice KEM)** - anteriormente CRYSTALS-Kyber:
  - ML-KEM-512, ML-KEM-768, ML-KEM-1024
  - Funcionamiento: retículas modulares
  - Casos de uso: intercambio de claves, TLS
- **FrodoKEM**:
  - FrodoKEM-640, FrodoKEM-976, FrodoKEM-1344
  - Enfoque conservador (LWE)
- **HQC (Hamming Quasi-Cyclic)**:
  - HQC-128, HQC-192, HQC-256
  - Basado en códigos

#### Firmas Digitales
- **ML-DSA (Module-Lattice Digital Signature)** - anteriormente CRYSTALS-Dilithium:
  - ML-DSA-44, ML-DSA-65, ML-DSA-87
  - Firmas compactas y rápidas
- **Falcon (Fast Fourier Lattice-based Compact)**:
  - Falcon-512, Falcon-1024
  - Firmas muy compactas
- **SLH-DSA (Stateless Hash-based Digital Signature)** - anteriormente SPHINCS+:
  - Basado únicamente en funciones hash
  - Más conservador pero firmas grandes

### 4.4 Esquemas Híbridos (15 min)
- **Motivación**: transición gradual
- **Hybrid KEM**: X25519+ML-KEM
- **Dual Signature**: ECDSA+ML-DSA
- **Semántica AND-decrypt**
- Casos de uso en ANKASecure

### 4.5 Migración a PQC (20 min)
- Inventario de activos criptográficos
- Priorización de sistemas críticos
- Estrategias de migración:
  - Lift-and-shift
  - Híbrida
  - Completa
- Desafíos y consideraciones

## Laboratorios Prácticos (3 horas)

### Lab 04.1: Demostración de la Amenaza Cuántica (30 min)
**Objetivos**:
- Simular algoritmo de Shor (factorización)
- Calcular tiempo de ataque para RSA-2048
- Comparar resistencia cuántica de algoritmos

**Herramientas**: Qiskit (IBM), simuladores

**Entregables**:
- Análisis de vulnerabilidad

### Lab 04.2: Implementación de ML-KEM (Kyber) (1 hora)
**Objetivos**:
- Instalar liboqs (Open Quantum Safe)
- Generar claves ML-KEM-768
- Realizar encapsulación y desencapsulación
- Comparar con ECDH (X25519)

**Entregables**:
- Script funcional
- Benchmark de rendimiento

### Lab 04.3: Implementación de ML-DSA (Dilithium) (1 hora)
**Objetivos**:
- Generar claves ML-DSA-65
- Firmar mensajes
- Verificar firmas
- Comparar con ECDSA

**Entregables**:
- Implementación de firmas
- Comparativa de tamaños

### Lab 04.4: Esquema Híbrido Clásico-PQC (30 min)
**Objetivos**:
- Implementar X25519+ML-KEM-768
- Verificar semántica AND-decrypt
- Documentar ventajas

**Entregables**:
- Código híbrido funcional

## Evaluación (30 min)
- Cuestionario sobre PQC
- Diseño de estrategia de migración

## Recursos Adicionales
- [NIST PQC Standardization](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Open Quantum Safe](https://openquantumsafe.org/)
- [PQShield Resources](https://pqshield.com/resources/)
- Whitepaper: "Transitioning to Post-Quantum Cryptography"

---

# MÓDULO 05: GESTIÓN DE CLAVES Y PKI
**Duración**: 4 horas (1.5h teoría + 2h práctica + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Diseñar sistemas de gestión de claves robustos
- [ ] Implementar rotación y revocación de claves
- [ ] Trabajar con HSMs (Hardware Security Modules)
- [ ] Administrar PKI completa (CA, certificados)
- [ ] Migrar claves PKCS#12 a sistemas modernos

## Contenido Teórico (1.5 horas)

### 5.1 Ciclo de Vida de Claves (30 min)
- **Fases**:
  1. Generación
  2. Distribución
  3. Almacenamiento
  4. Uso
  5. Rotación
  6. Revocación
  7. Destrucción
- **Mejores prácticas en cada fase**
- **Key derivation (KDF)**

### 5.2 Almacenamiento Seguro (20 min)
- HSM (Hardware Security Module)
- TPM (Trusted Platform Module)
- Software key stores (PKCS#11, PKCS#12)
- Key wrapping y envelopes
- Secretos en la nube (AWS KMS, Azure Key Vault)

### 5.3 PKI (Public Key Infrastructure) (30 min)
- Arquitectura de PKI:
  - Root CA
  - Intermediate CA
  - Leaf certificates
- Certificados X.509:
  - Estructura
  - Extensiones
  - Perfil de certificado
- Procesos:
  - CSR (Certificate Signing Request)
  - Emisión
  - Renovación
  - Revocación (CRL, OCSP)
- PKI privada vs pública

### 5.4 Gestión de Claves en ANKASecure (10 min)
- API de gestión
- Importación PKCS#12
- Rotación automática
- Auditoría de operaciones

## Laboratorios Prácticos (2 horas)

### Lab 05.1: Creación de PKI Privada (1 hora)
**Objetivos**:
- Crear Root CA
- Crear Intermediate CA
- Emitir certificados de servidor
- Configurar CRL y OCSP

**Herramientas**: OpenSSL, Easy-RSA

**Entregables**:
- PKI funcional
- Certificados generados

### Lab 05.2: Rotación de Claves (30 min)
**Objetivos**:
- Implementar script de rotación automática
- Rotación sin downtime
- Notificación de eventos

**Entregables**:
- Script de rotación

### Lab 05.3: Gestión de Claves con ANKASecure (30 min)
**Objetivos**:
- Crear claves vía API
- Importar PKCS#12
- Rotar claves
- Revocar claves
- Consultar auditoría

**Entregables**:
- Scripts de gestión

## Evaluación (30 min)
- Cuestionario
- Diseño de arquitectura PKI

## Recursos Adicionales
- [RFC 5280 - X.509 PKI](https://tools.ietf.org/html/rfc5280)
- [NIST SP 800-57 - Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

---

# MÓDULO 06: APIs DE SEGURIDAD (JWS/JWE/JOSE)
**Duración**: 4 horas (1.5h teoría + 2h práctica + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Implementar JWS (JSON Web Signature)
- [ ] Implementar JWE (JSON Web Encryption)
- [ ] Trabajar con JWT (JSON Web Tokens)
- [ ] Implementar streaming seguro (detached signatures)
- [ ] Integrar ANKASecure en aplicaciones REST

## Contenido Teórico (1.5 horas)

### 6.1 Introducción a JOSE (30 min)
- JSON Object Signing and Encryption
- Familia de estándares:
  - JWS (RFC 7515)
  - JWE (RFC 7516)
  - JWK (RFC 7517)
  - JWA (RFC 7518)
  - JWT (RFC 7519)

### 6.2 JWS (JSON Web Signature) (25 min)
- Estructura:
  - Header (algoritmo, tipo)
  - Payload
  - Signature
- Formato compacto vs JSON serialization
- Algoritmos: HS256, RS256, ES256, EdDSA
- Casos de uso: autenticación, integridad

### 6.3 JWE (JSON Web Encryption) (25 min)
- Estructura:
  - Protected header
  - Encrypted key
  - IV
  - Ciphertext
  - Authentication tag
- Modos: Content Encryption + Key Encryption
- Algoritmos de cifrado de contenido (alg): A256GCM
- Algoritmos de cifrado de clave (enc): RSA-OAEP, ECDH-ES
- Casos de uso: confidencialidad

### 6.4 JWT (JSON Web Tokens) (10 min)
- Estructura de un JWT
- Claims estándar (iss, sub, exp, etc.)
- Uso en autenticación (OAuth 2.0, OpenID Connect)
- Mejores prácticas y riesgos

### 6.5 Streaming Seguro y Detached Signatures (20 min)
- Problema: archivos grandes (> 5 MB)
- Solución: detached-JWS
- JWET (JWE Streaming)
- Implementación en ANKASecure

## Laboratorios Prácticos (2 horas)

### Lab 06.1: Implementación de JWS (30 min)
**Objetivos**:
- Crear y firmar JWS con RS256
- Verificar firmas
- Experimentar con diferentes algoritmos

**Entregables**:
- API REST con autenticación JWS

### Lab 06.2: Implementación de JWE (30 min)
**Objetivos**:
- Cifrar payloads con JWE
- Descifrar
- Combinar JWS + JWE (firma + cifrado)

**Entregables**:
- Servicio de cifrado

### Lab 06.3: JWT para Autenticación (30 min)
**Objetivos**:
- Implementar login con JWT
- Proteger endpoints con JWT
- Refresh tokens

**Entregables**:
- Sistema de autenticación completo

### Lab 06.4: Streaming Seguro con ANKASecure (30 min)
**Objetivos**:
- Firmar archivo grande (>100 MB) con detached-JWS
- Cifrar archivo grande con JWET
- Verificar integridad

**Entregables**:
- Pipeline de procesamiento seguro

## Evaluación (30 min)
- Cuestionario técnico
- Implementación de endpoint seguro

## Recursos Adicionales
- [JWT.io](https://jwt.io/)
- [RFC 7519 - JWT](https://tools.ietf.org/html/rfc7519)
- [Auth0 JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

---

# MÓDULO 07: NORMATIVAS Y CUMPLIMIENTO
**Duración**: 3 horas (1.5h teoría + 1h casos prácticos + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Explicar requisitos de cumplimiento principales
- [ ] Aplicar controles de seguridad según normativas
- [ ] Realizar auditorías de cumplimiento
- [ ] Documentar evidencias de cumplimiento
- [ ] Alinear soluciones técnicas con mandatos regulatorios

## Contenido Teórico (1.5 horas)

### 7.1 NIST (National Institute of Standards and Technology) (20 min)
- NIST Cybersecurity Framework
- NIST SP 800 series
- **NIST PQC Project**: migración a postcuántico
- Línea de tiempo de estándares PQC

### 7.2 FIPS (Federal Information Processing Standards) (15 min)
- FIPS 140-2 / FIPS 140-3
- Niveles de seguridad (1-4)
- Módulos criptográficos validados
- Importancia para contratos gubernamentales

### 7.3 PCI DSS (Payment Card Industry Data Security Standard) (15 min)
- Requisitos clave (12 requisitos)
- Protección de datos de tarjetas
- Cifrado de transmisión y almacenamiento
- Gestión de claves criptográficas

### 7.4 HIPAA (Health Insurance Portability and Accountability Act) (15 min)
- Protección de PHI (Protected Health Information)
- Requisitos técnicos de seguridad
- Cifrado de datos médicos
- Auditoría y trazabilidad

### 7.5 GDPR (General Data Protection Regulation) (15 min)
- Protección de datos personales
- Cifrado como medida técnica
- Derecho al olvido
- Notificación de brechas

### 7.6 Normativas de Seguridad Nacional (15 min)
- **NSA CNSA 2.0 (Commercial National Security Algorithm)**:
  - Transición a algoritmos PQC
  - Fechas límite
- **GSA PQC Mandate**:
  - Requisitos para sistemas federales
- Implicaciones para ANKASecure

### 7.7 ISO/IEC 27001:2022 (15 min)
- Sistema de Gestión de Seguridad de la Información (SGSI)
- Controles del Anexo A
- Certificación

## Casos Prácticos (1 hora)

### Caso 01: Auditoría PCI DSS (20 min)
**Escenario**: E-commerce con procesamiento de pagos

**Objetivos**:
- Identificar requisitos aplicables
- Verificar cumplimiento de cifrado
- Documentar controles

### Caso 02: Migración a PQC según CNSA 2.0 (20 min)
**Escenario**: Sistema federal con fecha límite 2035

**Objetivos**:
- Planificar migración
- Identificar algoritmos conformes
- Cronograma de implementación

### Caso 03: Cumplimiento HIPAA (20 min)
**Escenario**: Aplicación de salud digital

**Objetivos**:
- Implementar controles técnicos
- Documentar evidencias
- Plan de respuesta a incidentes

## Evaluación (30 min)
- Análisis de caso de cumplimiento
- Matriz de controles

## Recursos Adicionales
- [NIST PQC Timeline](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [PCI DSS v4.0](https://www.pcisecuritystandards.org/)
- [GDPR Official Text](https://gdpr.eu/)

---

# MÓDULO 08: ANKASecure EN PRODUCCIÓN
**Duración**: 5 horas (1.5h teoría + 3h práctica intensiva + 0.5h evaluación)

## Objetivos de Aprendizaje
Al finalizar este módulo, el estudiante será capaz de:
- [ ] Desplegar ANKASecure en entornos SaaS y On-Premise
- [ ] Integrar ANKASecure en aplicaciones reales
- [ ] Migrar sistemas clásicos a postcuánticos
- [ ] Implementar observabilidad y monitoreo
- [ ] Optimizar rendimiento de operaciones criptográficas

## Contenido Teórico (1.5 horas)

### 8.1 Arquitectura de ANKASecure (20 min)
- Componentes principales:
  - Key Management Service
  - Crypto Service (JWS/JWE/JWET)
  - API Gateway
  - Audit Log Service
- Despliegue SaaS vs On-Premise
- Multi-tenancy

### 8.2 APIs y SDKs (30 min)
- **REST API**:
  - Autenticación (API keys, OAuth)
  - Endpoints principales
  - Rate limiting
- **CLI**:
  - Comandos principales
  - Scripting y automatización
- **SDK Java**:
  - Integración en Spring Boot
  - Mejores prácticas

### 8.3 Casos de Uso en Producción (20 min)
- Protección de datos IoT
- CI/CD seguro
- Servicios financieros
- Sanidad
- Gobierno

### 8.4 Migración RSA → PQC (20 min)
- Estrategias:
  - Re-cifrado de datos en reposo
  - Re-firmado de documentos
  - Migración híbrida
- Herramientas de migración ANKASecure
- Downtime cero

### 8.5 Observabilidad (10 min)
- Logs de auditoría
- Métricas de rendimiento
- Alertas
- Integración con Splunk, ELK, Prometheus

## Laboratorios Prácticos (3 horas)

### Lab 08.1: Configuración Inicial de ANKASecure (30 min)
**Objetivos**:
- Crear cuenta y tenant
- Configurar API keys
- Instalar CLI y SDK
- Verificar conectividad

**Entregables**:
- Entorno configurado

### Lab 08.2: Gestión de Claves Completa (45 min)
**Objetivos**:
- Crear claves clásicas (RSA, ECDSA)
- Crear claves PQC (ML-KEM, ML-DSA)
- Crear claves híbridas
- Importar PKCS#12
- Rotar claves
- Revocar claves
- Consultar auditoría

**Entregables**:
- Scripts de gestión automatizada

### Lab 08.3: Cifrado y Firma con ANKASecure (45 min)
**Objetivos**:
- Cifrar payload (<5 MB) con JWE
- Firmar payload con JWS
- Firma + cifrado combinados
- Streaming seguro (archivo >100 MB)
- Verificación de integridad

**Entregables**:
- Microservicio de cifrado/firma

### Lab 08.4: Integración en Aplicación Real (45 min)
**Objetivo principal**: Crear API REST completa con:
- Autenticación con JWT (firmado con ANKASecure)
- Endpoints protegidos
- Cifrado end-to-end de datos sensibles
- Logging y auditoría

**Stack sugerido**: Node.js/Python + ANKASecure SDK

**Entregables**:
- Aplicación funcional
- Documentación de API

### Lab 08.5: Proyecto de Migración (15 min)
**Escenario**: Sistema existente con RSA-2048

**Objetivos**:
- Identificar claves y datos cifrados
- Migrar a ML-KEM-768
- Re-cifrar datos
- Validar integridad
- Documentar proceso

**Entregables**:
- Plan de migración ejecutado
- Reporte de validación

## Evaluación (30 min)
- Implementación de caso práctico
- Revisión de código

## Recursos Adicionales
- [ANKASecure Documentation](https://docs.ankatech.co/)
- [ANKASecure SDK Examples](https://github.com/ankatech)
- Colecciones Postman

---

# MÓDULO 09: PROYECTO FINAL INTEGRADOR
**Duración**: 2 horas

## Descripción

Diseñar e implementar un **sistema seguro completo end-to-end** que integre todos los conceptos aprendidos.

## Objetivos
- [ ] Demostrar dominio de criptografía clásica y postcuántica
- [ ] Implementar gestión de claves robusta
- [ ] Aplicar mejores prácticas de seguridad
- [ ] Documentar arquitectura y decisiones técnicas
- [ ] Presentar solución funcionando

## Especificaciones del Proyecto

### Opción A: Sistema de Mensajería Segura
**Requisitos**:
- Cifrado end-to-end con ML-KEM
- Firmas digitales con ML-DSA
- Gestión de claves con ANKASecure
- Autenticación con JWT
- Interfaz web o móvil
- Auditoría completa

### Opción B: Servicio de Almacenamiento Seguro
**Requisitos**:
- Cifrado de archivos en reposo (AES-256-GCM)
- Cifrado de claves con ML-KEM
- Compartición segura de archivos
- Control de acceso granular
- API REST completa
- Integración S3/Azure Blob

### Opción C: Sistema de Autenticación PQC
**Requisitos**:
- Autenticación multifactor
- Certificados digitales postcuánticos
- SSO (Single Sign-On)
- Gestión de sesiones
- Dashboard de administración

### Opción D: Propuesta Propia
(Sujeto a aprobación del instructor)

## Entregables

1. **Código fuente** (GitHub/GitLab)
   - Documentado y limpio
   - README con instrucciones de setup
   - Tests unitarios

2. **Documentación técnica** (10-15 páginas):
   - Arquitectura del sistema
   - Diagramas (flujo, secuencia, componentes)
   - Decisiones de diseño y justificación
   - Algoritmos criptográficos utilizados
   - Gestión de claves
   - Análisis de amenazas y mitigaciones

3. **Video de demostración** (5-10 min):
   - Funcionalidades principales
   - Flujos de uso
   - Explicación técnica

4. **Presentación** (10 slides):
   - Problema resuelto
   - Solución propuesta
   - Stack tecnológico
   - Desafíos y lecciones aprendidas

## Criterios de Evaluación

| Criterio | Peso | Descripción |
|----------|------|-------------|
| Funcionalidad | 30% | El sistema funciona correctamente |
| Seguridad | 30% | Implementación robusta de controles |
| Arquitectura | 15% | Diseño escalable y mantenible |
| Código | 10% | Calidad, legibilidad, tests |
| Documentación | 10% | Completa, clara, profesional |
| Presentación | 5% | Comunicación efectiva |

## Recursos de Apoyo
- Sesión de Q&A
- Revisiones de código opcionales
- Acceso completo a ANKASecure

---

# RESUMEN EJECUTIVO

## Distribución Total por Tipo de Actividad

| Actividad | Horas | Porcentaje |
|-----------|-------|------------|
| Teoría | 15.5h | 38.75% |
| Laboratorios Prácticos | 20h | 50% |
| Evaluaciones | 2.5h | 6.25% |
| Proyecto Final | 2h | 5% |
| **TOTAL** | **40h** | **100%** |

## Progresión de Aprendizaje

```
Principiante                                        Experto
    ↓                                                  ↓
[M01-M02] → [M03] → [M04] → [M05-M06] → [M07-M08] → [M09]
Fundamentos  Cripto  PQC    Gestión    Producción   Proyecto
            Clásica         Avanzada
```

## Tecnologías Cubiertas

- **Lenguajes**: Python, JavaScript/Node.js, Java
- **Frameworks**: Spring Boot, Express.js, FastAPI
- **Herramientas**: OpenSSL, Wireshark, Nmap, Docker, Postman
- **Librerías Criptográficas**: liboqs, cryptography, jose, Bouncy Castle
- **Plataformas**: ANKASecure, AWS KMS, Azure Key Vault
- **Protocolos**: TLS 1.3, JWS/JWE, JOSE, HTTP/2
- **Algoritmos Clásicos**: AES, RSA, ECDSA, Ed25519, SHA-256
- **Algoritmos PQC**: ML-KEM, ML-DSA, Falcon, SLH-DSA, FrodoKEM, HQC

## Certificaciones Relacionadas (Opcionales)

Preparación para:
- CompTIA Security+
- Certified Information Systems Security Professional (CISSP)
- Certified Ethical Hacker (CEH)
- GIAC Security Essentials (GSEC)

## Próximos Pasos Después del Curso

1. **Profundizar**: Especializarse en un área (pentesting, cryptography, cloud security)
2. **Certificarse**: Obtener certificaciones profesionales
3. **Practicar**: HackTheBox, TryHackMe, CTFs
4. **Contribuir**: Open Quantum Safe, proyectos FOSS
5. **Mantenerse actualizado**: Conferencias, blogs, papers

---

**¡Bienvenido al curso! Estás a punto de convertirte en un experto en ciberseguridad postcuántica.**
