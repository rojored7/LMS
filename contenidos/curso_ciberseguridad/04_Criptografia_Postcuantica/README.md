# MÓDULO 04: CRIPTOGRAFÍA POSTCUÁNTICA (PQC)

**Duración**: 6 horas (2.5h teoría + 3h práctica + 0.5h evaluación)
**Nivel**: Avanzado
**Prerequisitos**: Módulo 03 completado

---

## 📖 ¿QUÉ ES LA CRIPTOGRAFÍA POST-CUÁNTICA?

### Definición Académica

La **Criptografía Post-Cuántica (PQC)** es el conjunto de algoritmos criptográficos diseñados para resistir ataques tanto de computadoras clásicas como de computadoras cuánticas suficientemente potentes. A diferencia de los sistemas actuales (RSA, ECC), que se basan en problemas matemáticos resolubles por algoritmos cuánticos, PQC utiliza problemas que permanecen difíciles incluso para computadoras cuánticas.

**Características clave:**
- **Ejecución en hardware clásico**: No requieren computadoras cuánticas para funcionar
- **Resistencia cuántica**: Inmunes a algoritmos como Shor y Grover
- **Compatibilidad**: Pueden integrarse en protocolos existentes (TLS, SSH, VPN)
- **Matemática diferente**: Basados en retículos, códigos, hashes o sistemas multivariados

### Historia: NIST PQC Competition (2016-2024)

La estandarización de criptografía post-cuántica es uno de los procesos más importantes en la historia de la criptografía moderna:

**Timeline:**
- **2016**: NIST lanza la convocatoria global - 82 candidatos iniciales
- **2019**: Segunda ronda - 26 algoritmos seleccionados
- **2020**: Tercera ronda - 7 finalistas + 8 alternos
- **2022**: NIST anuncia los primeros 4 algoritmos ganadores
- **2023**: NIST inicia proceso de estandarización adicional
- **2024**: Publicación de FIPS 203, 204, 205 (estándares oficiales)

**Criterios de evaluación:**
- Seguridad contra ataques clásicos y cuánticos
- Rendimiento (velocidad de encriptación/firma)
- Tamaño de claves y firmas
- Facilidad de implementación
- Diversidad de enfoques matemáticos

### Diferencia vs Criptografía Cuántica (QKD)

Es crucial no confundir PQC con QKD (Quantum Key Distribution):

| Aspecto | PQC | QKD |
|---------|-----|-----|
| **Hardware requerido** | Computadoras clásicas | Equipos cuánticos especializados |
| **Infraestructura** | Redes existentes (Internet) | Fibra óptica dedicada |
| **Distancia** | Ilimitada (global) | <100 km sin repetidores |
| **Costo** | Actualización software | Millones de dólares |
| **Disponibilidad** | Ya disponible (2024) | Limitada a casos especiales |
| **Seguridad** | Matemática | Física cuántica |
| **Estandarización** | NIST, IETF, ISO | ITU-T, ETSI |

**Conclusión**: PQC es la solución práctica para la mayoría de organizaciones. QKD queda reservada para comunicaciones gubernamentales/militares ultra-sensibles.

### Familias de Algoritmos Post-Cuánticos

Los algoritmos PQC se clasifican en familias según el problema matemático subyacente:

#### 1. Lattice-Based (Basados en Retículos)
**Problema base**: Shortest Vector Problem (SVP), Learning With Errors (LWE)

**Ventajas:**
- Muy eficientes en hardware moderno
- Claves y cifrados relativamente compactos
- Soportan criptografía homomórfica

**Ejemplos:**
- ML-KEM (Kyber) - Ganador NIST
- ML-DSA (Dilithium) - Ganador NIST
- Falcon - Ganador NIST

**Uso recomendado**: Propósito general (TLS, VPN, email)

#### 2. Code-Based (Basados en Códigos)
**Problema base**: Decodificación de códigos lineales aleatorios

**Ventajas:**
- Décadas de análisis criptográfico
- Encriptación/desencriptación muy rápida
- Seguridad bien comprendida

**Desventajas:**
- Claves públicas muy grandes (100KB-1MB)

**Ejemplos:**
- Classic McEliece - Finalista NIST

**Uso recomendado**: Sistemas con restricciones de tiempo pero sin límites de almacenamiento

#### 3. Hash-Based (Basados en Hashes)
**Problema base**: Resistencia de funciones hash criptográficas

**Ventajas:**
- Seguridad basada en primitivas bien conocidas (SHA-256, SHA-3)
- Firmas sin estado (SPHINCS+)
- Confianza conservadora

**Desventajas:**
- Firmas grandes (>15KB en algunos casos)
- Velocidad de firma lenta

**Ejemplos:**
- SLH-DSA (SPHINCS+) - Ganador NIST
- XMSS (stateful) - RFC 8391

**Uso recomendado**: Firmas de firmware, certificados raíz, sistemas críticos

#### 4. Multivariate (Multivariados)
**Problema base**: Resolver sistemas de ecuaciones polinomiales multivariadas

**Estado**: Ningún candidato NIST llegó a la ronda final debido a ataques encontrados

**Nota histórica**: Rainbow fue seleccionado inicialmente pero luego roto en 2022

## 🤔 ¿POR QUÉ ES URGENTE LA MIGRACIÓN A PQC?

### La Amenaza "Harvest Now, Decrypt Later" (HNDL)

El ataque **HNDL** es la razón principal por la que la migración a PQC es urgente **HOY**, no en 2030:

**Escenario:**
1. **HOY (2024-2025)**: Adversarios capturan tráfico cifrado (TLS, VPN, email)
2. **Almacenamiento**: Guardan los datos cifrados en centros de datos masivos
3. **2030-2035**: Cuando existan computadoras cuánticas, descifran todo retroactivamente

**¿Por qué funciona?**
- RSA-2048 y ECC-256 son rompibles con computadoras cuánticas suficientemente grandes
- Los datos interceptados hoy permanecen cifrados con algoritmos vulnerables
- No existe "fecha de expiración" para los datos robados

**Datos en riesgo inmediato:**
- Secretos gubernamentales (clasificados por 25+ años)
- Propiedad intelectual (diseños de chips, fármacos, tecnología militar)
- Datos de salud (historiales médicos permanentes)
- Información financiera histórica
- Claves maestras y certificados raíz

**EJEMPLO REAL**: En 2023, agencias de inteligencia confirmaron que adversarios estatales están acumulando tráfico cifrado de cables submarinos, satélites y backbones de Internet.

### Timeline de Computadoras Cuánticas

**Estado actual (2024):**
- **Google Willow chip (Diciembre 2024)**: 105 qubits, reducción exponencial de errores
- **IBM Quantum**: 433 qubits (Osprey), 1121 qubits esperados en 2024 (Condor)
- **IonQ**: Sistemas comerciales disponibles vía cloud
- **China**: Alegaciones de sistemas de 1000+ qubits (no verificado públicamente)

**Qubits necesarios para romper RSA-2048:**
- Estimación conservadora: ~20 millones de qubits físicos
- Con corrección de errores avanzada: ~4000-10000 qubits lógicos
- Timeline estimado: 2030-2035 (rango optimista)
- Algunas estimaciones pesimistas: 2025-2028

**Progreso exponencial:**
```
2019: 53 qubits (Google Sycamore - Supremacía cuántica)
2021: 127 qubits (IBM Eagle)
2023: 433 qubits (IBM Osprey)
2024: 1121 qubits (IBM Condor)
2025+: Entrada en era de corrección de errores
```

**Q-Day**: Término acuñado para el día en que una computadora cuántica rompa RSA-2048 en tiempo práctico. Consenso de expertos: **2030-2035**.

### Mandatos y Regulaciones Globales

#### Estados Unidos: CNSA 2.0 (NSA)

En **Agosto 2022**, la NSA publicó la **Commercial National Security Algorithm Suite 2.0**:

**Mandatos obligatorios:**
- **2025**: Software de seguridad nacional debe soportar algoritmos PQC
- **2030**: Todos los sistemas de NSS deben usar exclusivamente PQC
- **2033**: Eliminación completa de algoritmos clásicos en sistemas críticos

**Algoritmos aprobados:**
- ML-KEM-768 o superior para encapsulación de claves
- ML-DSA-65 o superior para firmas digitales
- Esquemas híbridos clásico+PQC recomendados en período de transición

#### Unión Europea

**ENISA PQC Guidelines (2023):**
- Inventario de activos criptográficos obligatorio para sectores críticos
- Plan de migración PQC requerido para infraestructuras esenciales
- Soporte de algoritmos NIST PQC en licitaciones públicas desde 2024

**NIS2 Directive (2023):**
- Incluye "crypto-agility" como requisito de ciberseguridad
- Empresas medianas/grandes deben documentar estrategia de transición a PQC

#### China

**GB Standards (2023):**
- China publicó sus propios estándares PQC paralelos a NIST
- Mandato de adopción para sistemas gubernamentales antes de 2025
- Algoritmos propios: SM2 híbrido con lattice-based

#### Otros países

- **Reino Unido (NCSC)**: Guías de migración PQC publicadas en 2023
- **Alemania (BSI)**: Recomendaciones de esquemas híbridos obligatorias
- **Australia (ASD)**: Timeline similar a CNSA 2.0
- **India**: Draft standards en proceso (2024)

### Datos con Vida Útil >10 Años en Riesgo HOY

**Categorías críticas:**

1. **Información Clasificada Gubernamental**
   - TOP SECRET: Clasificado 25-75 años
   - Riesgo: Documentos de 2024 descifrados en 2035 aún son sensibles

2. **Propiedad Intelectual**
   - Patentes de fármacos: 20 años de exclusividad
   - Diseños de semiconductores: Ventaja competitiva de 5-10 años
   - Algoritmos de IA propietarios

3. **Datos Biométricos y de Salud**
   - Genomas humanos: Información para toda la vida
   - Historiales médicos: 30+ años de retención legal
   - Riesgo: No se pueden "cambiar" como passwords

4. **Infraestructura Crítica**
   - Planos de centrales nucleares, represas, telecomunicaciones
   - Vida útil de infraestructura: 30-50 años
   - Datos de control industrial (SCADA)

5. **Claves Maestras y Certificados Raíz**
   - Certificados raíz CA: Válidos 20-25 años
   - Claves de firma de código (code signing)
   - Claves de HSMs bancarios

**Cálculo de riesgo:**
```
SI: Vida útil de datos > (Años hasta Q-Day + Años de valor comercial)
ENTONCES: Migrar a PQC inmediatamente
```

**Ejemplo:**
- Datos de 2024 con valor hasta 2040 (16 años)
- Q-Day estimado: 2032 (8 años desde hoy)
- Ventana de vulnerabilidad: 2032-2040 (8 años expuestos)
- **Acción**: Migrar a PQC en 2024-2025

---

## 🎯 Objetivos de Aprendizaje

- [ ] Explicar la amenaza de la computación cuántica
- [ ] Comprender algoritmos postcuánticos NIST
- [ ] Implementar ML-KEM y ML-DSA
- [ ] Diseñar estrategias de migración a PQC
- [ ] Evaluar esquemas híbridos clásico-postcuántico

---

## 🎯 ¿PARA QUÉ SIRVE ESTE MÓDULO?

### Competencias que Desarrollarás

Al completar este módulo, serás capaz de:

#### 1. Evaluar Riesgo Cuántico en Organizaciones

**Habilidades prácticas:**
- Realizar un inventario de activos criptográficos (Crypto Discovery)
- Clasificar sistemas según exposición a amenaza HNDL
- Calcular ventanas de vulnerabilidad basadas en vida útil de datos
- Priorizar sistemas críticos para migración temprana

**Herramientas:**
- OpenSSL inventory scripts
- NIST Crypto Agility assessment framework
- Timeline calculators para Q-Day

**Entregable**: Reporte de evaluación de riesgo cuántico para una organización ficticia

#### 2. Implementar Esquemas Post-Cuánticos

**Algoritmos que dominarás:**
- **ML-KEM-768** (Kyber): Implementación de encapsulación de claves
- **ML-DSA-65** (Dilithium): Generación y verificación de firmas digitales
- **SLH-DSA** (SPHINCS+): Firmas hash-based para casos críticos

**Librerías:**
- `liboqs` (Open Quantum Safe) - Implementaciones de referencia
- `PQClean` - Implementaciones optimizadas y auditadas
- Integración con OpenSSL 3.2+ (provider model)

**Casos de uso:**
- Cifrado de archivos con ML-KEM
- Firma digital de documentos con ML-DSA
- Verificación de firmware con SLH-DSA

#### 3. Diseñar Estrategias de Migración

**Modelos de transición:**

1. **Esquema Híbrido (Recomendado 2024-2030)**
   ```
   Encriptación: (RSA-2048 + ML-KEM-768)
   Firma: (ECDSA-P256 + ML-DSA-65)
   ```
   - **Ventaja**: Seguridad dual - protege contra amenaza actual y futura
   - **Desventaja**: Overhead de tamaño (~1.5x) y tiempo (~1.3x)

2. **PQC Puro (Post-2030)**
   ```
   Encriptación: ML-KEM-1024
   Firma: ML-DSA-87
   ```
   - **Ventaja**: Máxima eficiencia post-cuántica
   - **Desventaja**: Sin compatibilidad con clientes antiguos

3. **Transición Progresiva**
   - Fase 1 (2024-2026): Híbrido opcional
   - Fase 2 (2026-2030): Híbrido obligatorio
   - Fase 3 (2030+): PQC puro

**Protocolos a actualizar:**
- TLS 1.3 con extensiones PQC (RFC draft)
- SSH con algoritmos post-cuánticos
- VPNs (IPsec, WireGuard)
- Firma de código y certificados X.509

#### 4. Prepararse para Mandatos Regulatorios

**Cumplimiento normativo:**
- Documentar inventario criptográfico (ENISA, CNSA 2.0)
- Implementar crypto-agility en arquitectura
- Generar reportes de estado de migración PQC
- Planificar roadmap de 5-10 años

**Certificaciones relevantes:**
- (Emergente) Post-Quantum Cryptography Specialist
- Cloud Security Alliance: Quantum Safe Security
- NIST CSF: Identify.RM-5 (Quantum risk)

#### 5. Comunicar Amenaza Cuántica a Stakeholders

**Audiencias clave:**
- **C-Level**: Impacto en negocio, timeline, presupuesto
- **Equipos técnicos**: Implementación, testing, integración
- **Legal/Compliance**: Requisitos regulatorios, responsabilidad
- **Auditores**: Evidencia de medidas proactivas

**Habilidades de comunicación:**
- Traducir conceptos cuánticos a riesgo de negocio
- Justificar inversión en PQC pre-Q-Day
- Presentar roadmap de migración ejecutable

---

## 🔍 CASOS REALES DE ADOPCIÓN PQC

### Google Chrome: X25519Kyber768 (2023)

**Timeline:**
- **Agosto 2023**: Google anuncia despliegue en Chrome 116
- **Mecanismo**: TLS 1.3 híbrido X25519 (ECDH) + Kyber768 (PQC)
- **Escala**: ~3 mil millones de usuarios
- **Resultados**:
  - Incremento de handshake: +0.5ms (imperceptible)
  - Tamaño de ClientHello: +800 bytes
  - Sin incidentes de interoperabilidad reportados

**Lecciones aprendidas:**
- Esquemas híbridos son viables a escala global
- Overhead de red es mínimo en conexiones modernas
- Importancia de backward compatibility

**Impacto:** Primera implementación masiva de PQC en producción, validó viabilidad de ML-KEM (Kyber).

### Signal: PQXDH Protocol (2023)

**Innovación:**
- **Septiembre 2023**: Signal actualiza su protocolo de intercambio de claves
- **PQXDH**: Post-Quantum Extended Diffie-Hellman
- **Componentes**: X25519 + Kyber1024 (nivel de seguridad más alto)

**Características:**
- Forward secrecy post-cuántica
- Resistente a ataques HNDL desde día 1
- Transparente para usuarios (sin cambios en UX)

**Especificación pública:**
- Publicaron especificación completa en GitHub
- Peer-reviewed por criptógrafos independientes
- Ahora es referencia para otras apps de mensajería

**Impacto:** Primer protocolo de mensajería E2E con PQC en producción. WhatsApp y otros están evaluando adopción.

### Apple iMessage: PQ3 Protocol (2024)

**Anuncio:**
- **Febrero 2024**: Apple presenta PQ3 (Post-Quantum level 3)
- **Claim**: "Más allá de estado del arte en seguridad post-cuántica"

**Arquitectura:**
- Nivel 1 (Classic): ECDH solo
- Nivel 2 (Hybrid): ECDH + PQC en establecimiento inicial
- **Nivel 3 (PQ3)**: Re-keying post-cuántico periódico automático

**Innovación clave:**
- Ratcheting con Kyber para cada mensaje
- Protección contra "compromiso de clave" cuántico futuro
- Implementado en iOS 17.4+

**Especificación técnica:**
- Combina X25519 + Kyber1024
- Re-key automático cada semana o cada 50 mensajes
- Forward y backward secrecy post-cuántica

**Impacto:** Establece nuevo estándar para mensajería segura. Presiona a competidores a adoptar PQC.

### Cloudflare: PQC en Todos los Planes (2022-2024)

**Timeline:**
- **2022**: Beta de TLS post-cuántico
- **2023**: Disponible en todos los planes (incluso Free)
- **2024**: PQC por defecto en Enterprise

**Estadísticas:**
- >30% de tráfico TLS ya usa esquemas híbridos PQC
- >100 millones de sitios con opción de PQC habilitada
- Overhead medido: <1% en latencia

**Implementación:**
- Soporte para X25519Kyber768 y X25519Kyber512
- Fallback automático a clásico si cliente no soporta PQC
- Dashboard de analytics para adopción de PQC

**Impacto:** Democratizó acceso a PQC para millones de sitios web.

### Zoom: Post-Quantum E2EE (2023)

**Lanzamiento:**
- **Mayo 2023**: Zoom añade opción de PQC en meetings E2E
- **Algoritmo**: Kyber768 en modo híbrido

**Casos de uso:**
- Reuniones gubernamentales
- Discusiones de propiedad intelectual
- Calls de alta sensibilidad

**Adopción:**
- Opt-in para planes Business y Enterprise
- Requiere activación por administrador
- Compatible solo entre clientes Zoom 5.14+

**Impacto:** Primera plataforma de videoconferencia con PQC, relevante para trabajo remoto seguro.

### Mandatos Gubernamentales en Acción

#### USA: Migración de NSA (2023-2025)

**Sistema JWICS (Joint Worldwide Intelligence Communications System):**
- Inicio de migración a PQC en 2023
- Plan de 3 años para transición completa
- Presupuesto: Clasificado, estimado >$500M

**CNS (Classified Networks):**
- Mandato: Todos los sistemas deben soportar ML-KEM y ML-DSA antes de 2025
- Certificación FIPS para implementaciones

#### EU: Proyecto Quantum Flagship (2024)

**PROMETHEUS Project:**
- €15M para migración PQC en infraestructura crítica EU
- Pilotos en: Energía, Finanzas, Telecomunicaciones
- Deliverable: Guías de migración sector-específicas

#### China: Infraestructura Nacional (2023+)

**Beijing-Shanghai Quantum Network:**
- Integración de PQC en backbone nacional
- Esquemas propios + NIST (diversidad)
- Objetivo: Red completamente quantum-safe para 2025

---

## 📊 ESTÁNDARES NIST PQC (2024)

### Tabla Comparativa de Algoritmos Ganadores

| Algoritmo | Tipo | Familia | Tamaño Clave Pública | Tamaño Clave Privada | Tamaño Firma/Ciphertext | Estado | FIPS |
|-----------|------|---------|---------------------|---------------------|------------------------|--------|------|
| **ML-KEM-512** | KEM | Lattice | 800 bytes | 1632 bytes | 768 bytes | Estándar | FIPS 203 |
| **ML-KEM-768** | KEM | Lattice | 1184 bytes | 2400 bytes | 1088 bytes | **Recomendado** | FIPS 203 |
| **ML-KEM-1024** | KEM | Lattice | 1568 bytes | 3168 bytes | 1568 bytes | Alta seguridad | FIPS 203 |
| **ML-DSA-44** | Firma | Lattice | 1312 bytes | 2560 bytes | ~2420 bytes | Compacto | FIPS 204 |
| **ML-DSA-65** | Firma | Lattice | 1952 bytes | 4032 bytes | ~3309 bytes | **Recomendado** | FIPS 204 |
| **ML-DSA-87** | Firma | Lattice | 2592 bytes | 4896 bytes | ~4627 bytes | Alta seguridad | FIPS 204 |
| **SLH-DSA-128s** | Firma | Hash | 32 bytes | 64 bytes | 7856 bytes | Compacto/Rápido | FIPS 205 |
| **SLH-DSA-128f** | Firma | Hash | 32 bytes | 64 bytes | 17088 bytes | Grande/Muy rápido | FIPS 205 |
| **SLH-DSA-256s** | Firma | Hash | 64 bytes | 128 bytes | 29792 bytes | Máxima seguridad | FIPS 205 |
| **Falcon-512** | Firma | Lattice | 897 bytes | 1281 bytes | ~666 bytes | Compacto (CNSA 2.0) | En proceso |
| **Falcon-1024** | Firma | Lattice | 1793 bytes | 2305 bytes | ~1280 bytes | Alta seguridad | En proceso |

### Equivalencias de Seguridad Clásica

| Algoritmo PQC | Seguridad Cuántica | Equivalente Clásico | Uso Recomendado |
|---------------|-------------------|---------------------|------------------|
| ML-KEM-512 | ~90 bits | AES-128 | IoT, dispositivos limitados |
| ML-KEM-768 | ~128 bits | AES-192 | **Propósito general (TLS, VPN)** |
| ML-KEM-1024 | ~192 bits | AES-256 | Gobierno, datos ultra-sensibles |
| ML-DSA-44 | ~90 bits | ECDSA-P256 | Firmas frecuentes, tamaño limitado |
| ML-DSA-65 | ~128 bits | RSA-3072 | **Propósito general** |
| ML-DSA-87 | ~192 bits | RSA-4096 | Certificados raíz, long-lived keys |

### Guía de Selección de Algoritmos

**Para Encapsulación de Claves (KEM):**

```
¿Dispositivo IoT o embedded?
  → ML-KEM-512

¿Aplicación web/móvil estándar?
  → ML-KEM-768 (recomendado NIST)

¿Gobierno o datos clasificados?
  → ML-KEM-1024
```

**Para Firmas Digitales:**

```
¿Necesitas firmas muy compactas? (ej: blockchain)
  → Falcon-512 (666 bytes)

¿Propósito general? (email, documentos)
  → ML-DSA-65

¿Máxima confianza conservadora? (firmware, certificados raíz)
  → SLH-DSA-128s (solo hash, no lattice)

¿Certificados de larga duración?
  → ML-DSA-87 o SLH-DSA-256s
```

### Comparación con Algoritmos Clásicos

| Operación | RSA-2048 | ECDSA-P256 | ML-KEM-768 | ML-DSA-65 | Ratio vs Clásico |
|-----------|----------|------------|------------|-----------|------------------|
| **Generación de claves** | 50ms | 1ms | 0.5ms | 2ms | 2x más rápido (KEM) |
| **Encriptación/Firma** | 1ms | 0.5ms | 0.3ms | 4ms | 8x más lento (DSA) |
| **Desencriptación/Verificación** | 8ms | 1ms | 0.4ms | 1.5ms | 20x más rápido (KEM) |
| **Tamaño clave pública** | 256 bytes | 32 bytes | 1184 bytes | 1952 bytes | 37x más grande (KEM) |
| **Tamaño firma/ciphertext** | 256 bytes | 64 bytes | 1088 bytes | 3309 bytes | 17x más grande (KEM) |

**Conclusiones:**
- ML-KEM es más rápido que RSA en todas las operaciones
- ML-DSA es más lento en firma pero más rápido en verificación
- Tamaños significativamente mayores (5-50x) - principal desafío

---

## 📚 Contenido Teórico (2.5 horas)

### 1. La Amenaza Cuántica (45 min)

**Temas:**
- **Computación cuántica: fundamentos**
  - Qubits vs bits clásicos
  - Superposición y entrelazamiento
  - Compuertas cuánticas básicas

- **Algoritmo de Shor (rompe RSA/ECC)**
  - Factorización de enteros en tiempo polinómico
  - Cálculo de logaritmo discreto
  - Impacto en RSA, Diffie-Hellman, ECC

- **Algoritmo de Grover**
  - Búsqueda cuadrática en espacio no estructurado
  - Impacto en AES (√N speedup): AES-128 → 64 bits seguridad cuántica
  - Solución: Doblar tamaños de clave simétrica (AES-256)

- **Ataque "Harvest Now, Decrypt Later"**
  - Economía del almacenamiento vs desarrollo cuántico
  - Casos de vigilancia masiva documentados
  - Cálculo de riesgo por tipo de dato

**Materiales:**
- Video: "Quantum Computing Threat to Cryptography" (15 min)
- Paper: Shor's Algorithm Explained (lectura)
- Calculadora de Q-Day risk assessment

### 2. Criptografía Postcuántica (30 min)

**Temas:**
- **Proceso NIST PQC (2016-2024)**
  - Timeline de competencia: 82 → 26 → 7 → 4 ganadores
  - Criterios de evaluación (seguridad, rendimiento, tamaño)
  - Ataques encontrados durante el proceso (Rainbow, SIKE)

- **Familias de algoritmos**
  - **Lattice-based**: Problemas de retículos (LWE, NTRU)
  - **Code-based**: Decodificación de códigos (McEliece)
  - **Hash-based**: Árboles Merkle (XMSS, SPHINCS+)
  - **Multivariate**: Sistemas de ecuaciones (eliminados)

- **PQC vs QKD**
  - Diferencias fundamentales
  - Casos de uso específicos
  - Costos y viabilidad

**Materiales:**
- Infografía: NIST PQC Timeline
- Tabla comparativa de familias
- Caso de estudio: Por qué Rainbow fue descalificado

### 3. Algoritmos NIST PQC (60 min)

**ML-KEM (Kyber) - Encapsulación de Claves (20 min)**
- Problema matemático: Module-LWE (Learning With Errors)
- Funcionamiento: Encapsulation vs Encryption
- Variantes: ML-KEM-512, 768, 1024
- Casos de uso: TLS handshake, VPNs, email encryption
- Demo: Encapsular una clave AES-256 con ML-KEM-768

**ML-DSA (Dilithium) - Firmas Digitales (20 min)**
- Problema matemático: CRYSTALS-Dilithium lattice
- Algoritmo: Generación, firma, verificación
- Variantes: ML-DSA-44, 65, 87
- Trade-offs: Velocidad vs tamaño de firma
- Demo: Firmar un documento PDF con ML-DSA-65

**SLH-DSA (SPHINCS+) - Hash-Based (10 min)**
- Basado en funciones hash (SHA-256, SHAKE256)
- Ventaja: Confianza conservadora (sin matemática exótica)
- Desventaja: Firmas grandes (7-30 KB)
- Uso: Firmware signing, certificados raíz CA
- Variantes: 128s/f, 192s/f, 256s/f (s=pequeño, f=rápido)

**Falcon - Firmas Compactas (10 min)**
- Firmas más pequeñas (~666 bytes para Falcon-512)
- Uso en CNSA 2.0 (NSA)
- Desafío: Implementación más compleja (aritmética punto flotante)
- Caso: Ideal para blockchain y sistemas con límites de tamaño

**Materiales:**
- Demos interactivos de cada algoritmo (Python/liboqs)
- Benchmarks de rendimiento en diferentes plataformas
- Comparativas visuales de tamaños

### 4. Esquemas Híbridos y Migración (15 min)

**Esquemas Híbridos:**
- **Concepto**: Combinar algoritmos clásicos + PQC en paralelo
- **Seguridad**: Sistema es seguro si AL MENOS UNO de los dos es seguro
- **Ejemplo TLS**: X25519 (ECDH) + Kyber768 = X25519Kyber768
- **Overhead**: ~30% en tamaño, ~10% en tiempo (aceptable)

**Estrategia de Migración:**
1. **Fase 1: Inventario** (Mes 1-2)
   - Identificar todos los usos de criptografía
   - Priorizar por sensibilidad y vida útil

2. **Fase 2: Híbrido Experimental** (Mes 3-6)
   - Implementar en entornos de test
   - Medir impacto en rendimiento

3. **Fase 3: Despliegue Híbrido** (Año 1-3)
   - Rollout progresivo en producción
   - Monitoreo de compatibilidad

4. **Fase 4: PQC Puro** (Año 4-6)
   - Eliminación gradual de algoritmos clásicos
   - Certificación FIPS

**Desafíos comunes:**
- MTU limits en redes (paquetes más grandes)
- Certificados X.509 con claves PQC (>10 KB)
- Compatibilidad con clientes legacy
- Rendimiento en dispositivos IoT/embedded

**Materiales:**
- Plantilla de roadmap de migración PQC
- Checklist de crypto-agility
- Casos de estudio: Google, Signal, Apple

---

## 🔬 Laboratorios (3 horas)

### Lab 04.1: Evaluación de Amenaza Cuántica (30 min)

**Objetivos:**
- Calcular el riesgo HNDL para diferentes tipos de datos
- Usar calculadoras de Q-Day timeline
- Generar reporte de riesgo para organización ficticia

**Actividades:**
1. **Inventario de activos criptográficos**
   - Identificar sistemas que usan RSA/ECC
   - Clasificar datos por vida útil (1, 5, 10, 25 años)
   - Mapear dependencias criptográficas

2. **Cálculo de ventana de vulnerabilidad**
   - Usar fórmula: `Riesgo = Vida_útil - (Q-Day - Hoy)`
   - Priorizar sistemas con ventana positiva
   - Ejemplo: Datos médicos (50 años vida útil) → Migrar AHORA

3. **Simulación de ataque Shor**
   - Usar implementación educativa de Shor's algorithm
   - Factorizar números pequeños (RSA-128 simulado)
   - Visualizar scaling de qubits necesarios

**Herramientas:**
- Script Python: `quantum_risk_calculator.py`
- Spreadsheet: `crypto_inventory_template.xlsx`
- Simulador Qiskit: `shors_demo.py`

**Entregable:** Reporte de 2 páginas con priorización de sistemas para migración PQC

---

### Lab 04.2: Implementación ML-KEM (Kyber) (1h)

**Objetivos:**
- Instalar librería Open Quantum Safe (liboqs)
- Encapsular claves con ML-KEM-768
- Integrar en script de cifrado híbrido

**Parte 1: Setup (15 min)**
```bash
# Instalar liboqs y bindings Python
pip install liboqs-python

# Verificar algoritmos disponibles
python -c "import oqs; print(oqs.get_enabled_KEM_mechanisms())"
```

**Parte 2: Encapsulación básica (20 min)**
```python
import oqs

# Generar par de claves ML-KEM-768
kem = oqs.KeyEncapsulation("Kyber768")
public_key = kem.generate_keypair()
print(f"Tamaño clave pública: {len(public_key)} bytes")

# Encapsular una clave compartida
ciphertext, shared_secret = kem.encap_secret(public_key)
print(f"Tamaño ciphertext: {len(ciphertext)} bytes")
print(f"Clave compartida (hex): {shared_secret.hex()[:64]}...")

# Desencapsular en el receptor
shared_secret_decrypted = kem.decap_secret(ciphertext)
assert shared_secret == shared_secret_decrypted
print("Encapsulación exitosa!")
```

**Parte 3: Cifrado híbrido de archivos (25 min)**
- Usar ML-KEM para intercambio de claves
- Derivar clave AES-256 de shared_secret
- Cifrar archivo con AES-GCM
- Comparar vs cifrado solo con RSA

**Desafíos:**
1. Implementar función `encrypt_file_pqc(filename, recipient_pubkey)`
2. Medir tiempo de encriptación vs RSA-2048
3. Comparar tamaños de ciphertext

**Entregable:** Script funcional + reporte de benchmarks

---

### Lab 04.3: Implementación ML-DSA (Dilithium) (1h)

**Objetivos:**
- Generar claves de firma ML-DSA-65
- Firmar documentos digitalmente
- Verificar firmas con clave pública

**Parte 1: Generación de claves (15 min)**
```python
import oqs

# Generar par de claves ML-DSA-65 (Dilithium3)
signer = oqs.Signature("Dilithium3")
public_key = signer.generate_keypair()

# Guardar claves en archivos
with open("dilithium_public.key", "wb") as f:
    f.write(public_key)
with open("dilithium_private.key", "wb") as f:
    f.write(signer.export_secret_key())

print(f"Clave pública: {len(public_key)} bytes")
print(f"Clave privada: {len(signer.export_secret_key())} bytes")
```

**Parte 2: Firma digital (20 min)**
```python
# Firmar un mensaje
message = b"Contrato de compraventa..."
signature = signer.sign(message)
print(f"Tamaño de firma: {len(signature)} bytes")

# Verificar firma
verifier = oqs.Signature("Dilithium3")
is_valid = verifier.verify(message, signature, public_key)
print(f"Firma válida: {is_valid}")

# Intentar verificar con mensaje alterado
tampered_message = b"Contrato ALTERADO..."
is_valid_tampered = verifier.verify(tampered_message, signature, public_key)
print(f"Firma válida (mensaje alterado): {is_valid_tampered}")
```

**Parte 3: Firma de documentos PDF (25 min)**
- Firmar hash SHA-256 de PDF
- Adjuntar firma como metadata
- Implementar verificador de integridad

**Casos de prueba:**
1. Firmar 100 documentos y medir tiempo total
2. Comparar con ECDSA-P256 (velocidad y tamaño)
3. Simular ataque: modificar 1 byte del PDF y verificar rechazo

**Entregable:** Sistema de firma de documentos funcional + análisis comparativo

---

### Lab 04.4: Esquema Híbrido Clásico + PQC (30 min)

**Objetivos:**
- Implementar encriptación dual RSA-2048 + ML-KEM-768
- Combinar firmas ECDSA-P256 + ML-DSA-65
- Medir overhead vs sistemas puros

**Arquitectura híbrida:**
```python
def hybrid_encrypt(plaintext, rsa_pubkey, mlkem_pubkey):
    # 1. Generar clave simétrica aleatoria
    aes_key = os.urandom(32)

    # 2. Encriptar con AES-GCM
    ciphertext = aes_gcm_encrypt(plaintext, aes_key)

    # 3. Envolver clave AES con RSA Y ML-KEM
    rsa_wrapped = rsa_encrypt(aes_key, rsa_pubkey)
    mlkem_ct, mlkem_ss = mlkem_encapsulate(mlkem_pubkey)
    mlkem_wrapped = aes_encrypt(aes_key, mlkem_ss)

    # 4. Retornar bundle híbrido
    return {
        'ciphertext': ciphertext,
        'rsa_wrapped_key': rsa_wrapped,
        'mlkem_ciphertext': mlkem_ct,
        'mlkem_wrapped_key': mlkem_wrapped
    }
```

**Actividades:**
1. **Implementar funciones híbridas**
   - `hybrid_encrypt()` y `hybrid_decrypt()`
   - `hybrid_sign()` y `hybrid_verify()`

2. **Testing de seguridad dual**
   - Escenario 1: Solo RSA roto → Sistema aún seguro vía ML-KEM
   - Escenario 2: Solo ML-KEM roto → Sistema aún seguro vía RSA

3. **Benchmark de overhead**
   - Medir tiempo: Clásico vs Híbrido vs PQC puro
   - Medir tamaño: Comparar overhead (esperado: 1.3-1.5x)

**Tabla de resultados esperada:**
| Esquema | Tiempo cifrado | Tiempo descifrado | Tamaño total |
|---------|----------------|-------------------|--------------|
| RSA-2048 solo | 8ms | 1ms | 512 bytes |
| ML-KEM-768 solo | 0.4ms | 0.3ms | 1088 bytes |
| Híbrido | 8.5ms | 1.4ms | 1600 bytes |

**Entregable:** Implementación híbrida funcional + análisis de overhead + recomendaciones de uso

---

## ⏱️ PLAN DE ESTUDIO RECOMENDADO (4-6 horas)

### Sesión 1: Amenaza Cuántica y Fundamentos (90 min)
- **00:00-00:30** - Lectura previa: ¿Qué es PQC? (sección de este README)
- **00:30-01:00** - Video: Computación cuántica y algoritmo de Shor
- **01:00-01:30** - Lab 04.1: Evaluación de riesgo HNDL

**Break: 15 minutos**

### Sesión 2: Algoritmos NIST y Estándares (90 min)
- **01:45-02:15** - Lectura: Familias de algoritmos PQC
- **02:15-02:45** - Estudio de tabla comparativa NIST
- **02:45-03:15** - Casos reales: Google, Signal, Apple

**Break: 15 minutos**

### Sesión 3: Implementación Práctica - KEM (90 min)
- **03:30-04:00** - Teoría ML-KEM (Kyber)
- **04:00-05:00** - Lab 04.2: Implementación completa
- **05:00-05:30** - Análisis de resultados y optimización

**Break: 30 minutos (almuerzo/cena)**

### Sesión 4: Implementación Práctica - Firmas (90 min)
- **06:00-06:15** - Teoría ML-DSA (Dilithium)
- **06:15-07:15** - Lab 04.3: Firmas digitales PQC
- **07:15-07:30** - Comparación con sistemas clásicos

**Break: 15 minutos**

### Sesión 5: Esquemas Híbridos y Migración (60 min)
- **07:45-08:00** - Estrategias de transición
- **08:00-08:30** - Lab 04.4: Implementación híbrida
- **08:30-08:45** - Roadmap de migración PQC

**Opcional: Evaluación Final (30 min)**
- Quiz de conceptos clave
- Diseño de plan de migración PQC para caso de estudio

---

## 📚 REFERENCIAS Y RECURSOS

### Papers Fundamentales

1. **Peter Shor (1994)** - "Algorithms for Quantum Computation: Discrete Logarithms and Factoring"
   - Paper que inició la urgencia de PQC
   - https://arxiv.org/abs/quant-ph/9508027

2. **Lov Grover (1996)** - "A Fast Quantum Mechanical Algorithm for Database Search"
   - Impacto en criptografía simétrica
   - https://arxiv.org/abs/quant-ph/9605043

3. **NIST (2016)** - "Report on Post-Quantum Cryptography"
   - Documento fundacional de la competencia
   - https://csrc.nist.gov/publications/detail/nistir/8105/final

4. **CRYSTALS-Kyber (2017)** - Original submission (ahora ML-KEM)
   - https://pq-crystals.org/kyber/

5. **CRYSTALS-Dilithium (2017)** - Original submission (ahora ML-DSA)
   - https://pq-crystals.org/dilithium/

### Estándares Oficiales

- **FIPS 203** - Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM)
  - https://csrc.nist.gov/pubs/fips/203/final

- **FIPS 204** - Module-Lattice-Based Digital Signature Standard (ML-DSA)
  - https://csrc.nist.gov/pubs/fips/204/final

- **FIPS 205** - Stateless Hash-Based Digital Signature Standard (SLH-DSA)
  - https://csrc.nist.gov/pubs/fips/205/final

- **NSA CNSA 2.0** - Commercial National Security Algorithm Suite
  - https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF

### Guías de Implementación

- **NIST Cybersecurity Framework** - PQC Migration Guide
  - https://www.nist.gov/cyberframework

- **ENISA** - Post-Quantum Cryptography: Current State and Quantum Mitigation
  - https://www.enisa.europa.eu/publications/post-quantum-cryptography

- **BSI (Alemania)** - Migration to Post-Quantum Cryptography
  - https://www.bsi.bund.de/EN/Topics/Companies-and-Organisations/Information-and-Recommendations/Quantum-Safe-Cryptography/quantum-safe-cryptography.html

- **NCSC (UK)** - Preparing for Quantum-Safe Cryptography
  - https://www.ncsc.gov.uk/whitepaper/preparing-for-quantum-safe-cryptography

### Proyectos Open Source

- **Open Quantum Safe (liboqs)** - Implementaciones de referencia
  - https://github.com/open-quantum-safe/liboqs
  - Bindings: Python, Go, Rust, Java

- **PQClean** - Implementaciones limpias y auditables
  - https://github.com/PQClean/PQClean

- **OpenSSL 3.2+** - Provider model con soporte PQC
  - https://github.com/openssl/openssl

- **Bouncy Castle** - Librería Java con PQC
  - https://www.bouncycastle.org/

### Roadmaps de Adopción

- **Google Chrome** - TLS Post-Quantum Rollout
  - https://security.googleblog.com/2023/08/protecting-chrome-traffic-with-hybrid.html

- **Signal** - PQXDH Specification
  - https://signal.org/docs/specifications/pqxdh/

- **Apple** - iMessage PQ3 Protocol
  - https://security.apple.com/blog/imessage-pq3/

- **Cloudflare** - Post-Quantum for Everyone
  - https://blog.cloudflare.com/post-quantum-for-all/

### Herramientas y Simuladores

- **IBM Quantum Experience** - Computadoras cuánticas reales vía cloud
  - https://quantum-computing.ibm.com/

- **Qiskit** - Framework Python para computación cuántica
  - https://qiskit.org/

- **Q-Day Calculator** - Herramienta de evaluación de riesgo
  - (Usar: https://www.quantum-security-calculator.com/)

- **PQC Benchmarks** - Comparativas de rendimiento
  - https://bench.cr.yp.to/results-kem.html

### Cursos y Certificaciones

- **Coursera** - "Quantum Computing for Computer Scientists" (Princeton)
- **edX** - "Quantum Cryptography" (Caltech)
- **Cloud Security Alliance** - Certificate of Quantum-Safe Security
- **SANS** - SEC642: Advanced Cryptography (incluye módulo PQC)

### Comunidad y Noticias

- **NIST PQC Project** - Página oficial con actualizaciones
  - https://csrc.nist.gov/projects/post-quantum-cryptography

- **PQC Forum** - Lista de correo de discusión técnica
  - pqc-forum@list.nist.gov

- **Subreddit r/crypto** - Discusiones de criptografía actual
  - https://www.reddit.com/r/crypto/

- **Crypto StackExchange** - Q&A técnico
  - https://crypto.stackexchange.com/

---

---

[⬅️ Anterior: Módulo 03](../03_Criptografia_Clasica/) | [➡️ Siguiente: Módulo 05](../05_Gestion_Claves_PKI/)
