# 4.1 LA AMENAZA CUÁNTICA

**Duración**: 45 minutos

---

## ¿Por qué es urgente la criptografía postcuántica?

> **"Harvest Now, Decrypt Later" (HNDL)** - Los atacantes están grabando tráfico cifrado HOY para descifrarlo cuando tengan computadoras cuánticas.

---

## Computación Cuántica: Fundamentos

### Bits vs Qubits

**Bit clásico**:
```
0 o 1 (uno a la vez)
```

**Qubit**:
```
|0⟩ y |1⟩ SIMULTÁNEAMENTE (superposición)
```

**Implicación**:
- 1 qubit = 2 estados
- 2 qubits = 4 estados
- n qubits = 2^n estados

Una computadora cuántica de 300 qubits puede explorar más estados que átomos en el universo.

### Entrelazamiento Cuántico

Qubits pueden estar "entrelazados": el estado de uno afecta instantáneamente al otro, sin importar la distancia.

---

## Algoritmos Cuánticos que Rompen Criptografía

### Algoritmo de Shor (1994)

**Capacidad**: Factoriza números grandes en tiempo polinomial

**Impacto**:
```
RSA-2048:
- Clásico: ~300 billones de años
- Cuántico con Shor: HORAS

✅ RSA ROTO
✅ ECC ROTO
✅ Diffie-Hellman ROTO
```

**Matemática simplificada**:
```
RSA se basa en: N = p × q (factorización difícil)
Shor encuentra p y q eficientemente usando:
- Quantum Fourier Transform
- Period finding
```

### Algoritmo de Grover (1996)

**Capacidad**: Búsqueda en base de datos no ordenada

**Impacto**:
```
AES-256:
- Seguridad clásica: 2^256 operaciones
- Seguridad cuántica: 2^128 operaciones (Grover)

⚠️ AES-256 reducido a AES-128 efectivamente
⚠️ AES-128 reducido a AES-64 (INSEGURO)
```

**Solución**: Duplicar tamaño de clave
- AES-256 → Efectivamente AES-128 (suficiente)
- AES-128 → Efectivamente AES-64 (insuficiente)

---

## Estado Actual de Computadoras Cuánticas (2024)

### Qubits Logísticos vs Físicos

**Qubits Físicos**: Qubits reales, con errores
**Qubits Lógicos**: Qubits corregidos de errores (necesitan ~1000 físicos)

**Estado actual**:
- IBM: 1,121 qubits (física)
- Google: 70 qubits (lógicos en 2024)
- Romper RSA-2048: ~20 millones de qubits lógicos estimados

### Timeline Estimado

```
2024: ~1,000 qubits físicos
2028: ~10,000 qubits físicos estimados
2030: Posible "Q-Day" (día cuántico) - MUY ESPECULATIVO
2035: Mandato CNSA 2.0 (sistemas federales US)
```

**Incertidumbre**: Podría ser 2030 o 2050+

---

## "Harvest Now, Decrypt Later"

**Escenario**:

```
2024: Atacante graba tráfico HTTPS (RSA/ECC)
     │
     │ [Almacenamiento]
     │
     ▼
2030: Computadora cuántica disponible
     │
     ▼
     Descifra TODO el tráfico histórico
```

**¿Qué datos son vulnerables?**
- Secretos gubernamentales (clasificados 50 años)
- Propiedad intelectual (válida décadas)
- Datos médicos (toda la vida)
- Secretos comerciales
- Infraestructura crítica

**¿Qué NO es vulnerable?**
- Transacciones bancarias efímeras
- Streaming de video
- Datos públicos

---

## Impacto en Seguridad Actual

### Lo que se rompe con computación cuántica:

❌ **RSA**: Shor lo factoriza
❌ **ECDSA/ECDH**: Shor resuelve problema de log discreto
❌ **Diffie-Hellman**: Shor lo rompe

### Lo que NO se rompe:

✅ **AES-256**: Grover lo debilita a AES-128 (aún seguro)
✅ **SHA-256**: Grover lo debilita pero sigue seguro
✅ **Algoritmos postcuánticos**: Diseñados para resistir

---

## Criptografía Postcuántica (PQC)

**Definición**: Algoritmos que resisten ataques de computadoras cuánticas clásicas Y cuánticas.

**Familias principales**:

### 1. Lattice-based (Retículas)
```
Problema subyacente: Learning With Errors (LWE)
Algoritmos: ML-KEM (Kyber), ML-DSA (Dilithium)
Estado: ESTANDARIZADOS por NIST
```

### 2. Code-based (Códigos)
```
Problema: Síndrome decoding
Algoritmos: Classic McEliece, BIKE, HQC
Tamaño de claves: GRANDE (100KB+)
```

### 3. Hash-based (Hashes)
```
Problema: Romper funciones hash
Algoritmos: SPHINCS+, XMSS
Ventaja: Muy conservador (solo depende de hash)
```

### 4. Multivariate (Ecuaciones multivariables)
```
Problema: Resolver sistemas de ecuaciones
Algoritmos: Rainbow (ROTO en 2022!)
```

### 5. Isogeny-based (Isogenias)
```
Problema: Isogenias de curvas elípticas
Algoritmos: SIKE (ROTO en 2022!)
```

---

## NIST PQC Standardization (2016-2024)

```
2016: Llamada a propuestas (82 candidatos)
2019: Ronda 2 (26 candidatos)
2020: Ronda 3 (15 candidatos)
2022: Ronda 4 (4 finalistas)
2024: ESTÁNDARES PUBLICADOS
```

**Ganadores (2024)**:

**Encapsulación de Claves (KEM)**:
- ✅ **ML-KEM** (Kyber): Estándar principal
- Alternativas: FrodoKEM, HQC

**Firmas Digitales**:
- ✅ **ML-DSA** (Dilithium): Propósito general
- ✅ **SLH-DSA** (SPHINCS+): Conservador (hash)
- ✅ **Falcon**: Firmas compactas

---

## ¿Qué hacer AHORA?

### 1. Inventario
```
✓ Identificar todos los sistemas criptográficos
✓ Mapear dependencias
✓ Clasificar por criticidad
```

### 2. Evaluación de Riesgo
```
¿Estos datos necesitan protección a largo plazo?
SI → URGENTE migrar a PQC
NO → Puede esperar
```

### 3. Preparación
```
✓ Probar algoritmos PQC en laboratorio
✓ Evaluar rendimiento
✓ Entrenar equipo técnico
```

### 4. Estrategia Híbrida
```
Combinar clásico + PQC:
X25519 + ML-KEM → Protección doble
ECDSA + ML-DSA → Firma dual
```

### 5. Plan de Migración
```
Fase 1 (2024-2025): Sistemas críticos
Fase 2 (2025-2030): Sistemas importantes
Fase 3 (2030-2035): Todos los sistemas
```

---

## Mitos y Realidades

### ❌ Mito 1: "Computadoras cuánticas no existen aún, no hay prisa"
✅ **Realidad**: "Harvest now, decrypt later" ya está ocurriendo

### ❌ Mito 2: "Solo afecta a gobiernos"
✅ **Realidad**: Afecta a CUALQUIER organización con datos sensibles

### ❌ Mito 3: "Migrar a PQC es simple"
✅ **Realidad**: Requiere años de planificación y testing

### ❌ Mito 4: "AES se rompe completamente"
✅ **Realidad**: AES-256 sigue siendo seguro (solo se debilita a 128 bits)

### ❌ Mito 5: "Algoritmos PQC son inmaduros"
✅ **Realidad**: ML-KEM y ML-DSA son estándares NIST (2024)

---

## Referencias Bibliográficas

### Estándares y Documentos Oficiales

1. **NIST FIPS 203** (2024): *Module-Lattice-Based Key-Encapsulation Mechanism Standard*. National Institute of Standards and Technology. https://csrc.nist.gov/pubs/fips/203/final

2. **NIST FIPS 204** (2024): *Module-Lattice-Based Digital Signature Standard*. National Institute of Standards and Technology. https://csrc.nist.gov/pubs/fips/204/final

3. **NIST FIPS 205** (2024): *Stateless Hash-Based Digital Signature Standard*. National Institute of Standards and Technology. https://csrc.nist.gov/pubs/fips/205/final

4. **NIST IR 8413** (2022): *Status Report on the Third Round of the NIST Post-Quantum Cryptography Standardization Process*. https://doi.org/10.6028/NIST.IR.8413

5. **NSA Cybersecurity Advisory** (2022): *Announcing the Commercial National Security Algorithm Suite 2.0*. National Security Agency. https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF

6. **CISA/NSA** (2022): *Quantum-Readiness: Migration to Post-Quantum Cryptography*. Cybersecurity and Infrastructure Security Agency.

### Algoritmos Cuánticos

7. **Shor, P. W.** (1997): *Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer*. SIAM Journal on Computing, 26(5), 1484-1509. https://doi.org/10.1137/S0097539795293172

8. **Grover, L. K.** (1996): *A Fast Quantum Mechanical Algorithm for Database Search*. Proceedings of the 28th Annual ACM Symposium on Theory of Computing, 212-219. https://doi.org/10.1145/237814.237866

### Amenaza "Harvest Now, Decrypt Later"

9. **Mosca, M.** (2018): *Cybersecurity in an Era with Quantum Computers: Will We Be Ready?*. IEEE Security & Privacy, 16(5), 38-41. https://doi.org/10.1109/MSP.2018.3761723

10. **Canadian Centre for Cyber Security** (2020): *An Introduction to Post-Quantum Cryptography*. Government of Canada. ITSAP.00.017.

11. **Chen, L., et al.** (2016): *Report on Post-Quantum Cryptography*. NIST IR 8105. https://doi.org/10.6028/NIST.IR.8105

### Estado de Computadoras Cuánticas

12. **Arute, F., et al.** (2019): *Quantum Supremacy Using a Programmable Superconducting Processor*. Nature, 574, 505-510. https://doi.org/10.1038/s41586-019-1666-5

13. **IBM Quantum** (2023): *IBM Quantum Computing Roadmap*. https://www.ibm.com/quantum/roadmap

14. **Google Quantum AI** (2024): *Willow Quantum Chip Announcement*. https://blog.google/technology/research/google-willow-quantum-chip/

### Recursos Adicionales

15. **Open Quantum Safe Project**: https://openquantumsafe.org/
16. **ETSI Quantum Safe Cryptography**: https://www.etsi.org/technologies/quantum-safe-cryptography
17. **PQShield Resources**: https://pqshield.com/resources/

---

[⬅️ Anterior](../README.md) | [➡️ Siguiente: Algoritmos PQC](./02_algoritmos_pqc.md)
