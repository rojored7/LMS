# LAB 04.2: IMPLEMENTACIÓN ML-KEM (Kyber)

**Duración**: 3-4 horas
**Nivel**: Intermedio-Avanzado
**Prerequisitos**: Conocimientos de álgebra lineal, criptografía simétrica, Python

---

## Tabla de Contenidos

1. [Introducción Teórica](#1-introducción-teórica)
2. [Fundamentos Matemáticos](#2-fundamentos-matemáticos)
3. [Casos Reales de Implementación](#3-casos-reales-de-implementación)
4. [Instalación y Configuración](#4-instalación-y-configuración)
5. [Implementaciones Completas](#5-implementaciones-completas)
6. [Ejercicios Progresivos](#6-ejercicios-progresivos)
7. [Análisis de Seguridad](#7-análisis-de-seguridad)
8. [Referencias y Recursos](#8-referencias-y-recursos)

---

## 1. Introducción Teórica

### 📖 ¿QUÉ ES ML-KEM?

**ML-KEM** (Module-Lattice-Based Key Encapsulation Mechanism) es el algoritmo de encapsulación de claves basado en retículos estandarizado por NIST en **FIPS 203 (Agosto 2024)**. Anteriormente conocido como **CRYSTALS-Kyber**, fue el ganador de la competencia de criptografía post-cuántica del NIST (Round 3, 2022).

**Características técnicas**:
- **Problema base**: Module Learning With Errors (M-LWE) sobre retículos algebraicos
- **Seguridad**: IND-CCA2 (Indistinguishability under Adaptive Chosen Ciphertext Attack)
- **Variantes**: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Propósito**: Establecer secretos compartidos de forma segura contra ataques cuánticos

**Definición formal**:
Un KEM (Key Encapsulation Mechanism) consiste en tres algoritmos:
1. **KeyGen()** → (pk, sk): Genera par de claves pública/privada
2. **Encaps(pk)** → (ct, ss): Genera ciphertext y shared secret
3. **Decaps(sk, ct)** → ss: Recupera shared secret desde ciphertext

### 🤔 ¿POR QUÉ ML-KEM?

**1. Amenaza Cuántica Real**
- **Algoritmo de Shor (1994)**: Factoriza enteros en tiempo polinomial en computadora cuántica
- RSA-2048 vulnerable: Requiere ~4,000 qubits lógicos
- ECC (curvas elípticas) vulnerable: Requiere ~2,330 qubits para ECDH P-256
- **Timeline**: IBM Quantum Roadmap proyecta 100,000+ qubits para 2033
- **"Store Now, Decrypt Later"**: Adversarios almacenan tráfico cifrado hoy para descifrarlo con computadoras cuánticas futuras

**2. Ventajas sobre Alternativas Post-Cuánticas**

| Algoritmo           | Tamaño Clave Pública | Tamaño Ciphertext | Velocidad Encaps | Seguridad Cuántica |
|---------------------|----------------------|-------------------|------------------|--------------------|
| **ML-KEM-768**      | 1,184 bytes          | 1,088 bytes       | ~95 μs           | ~AES-192           |
| Classic McEliece    | 261,120 bytes        | 128 bytes         | ~15 μs           | AES-256            |
| NTRU                | 1,230 bytes          | 1,230 bytes       | ~120 μs          | AES-192            |
| FrodoKEM            | 9,616 bytes          | 9,720 bytes       | ~2,500 μs        | AES-192            |
| RSA-3072 (clásico)  | 384 bytes            | 384 bytes         | ~850 μs          | ❌ VULNERABLE      |

**3. Madurez Criptográfica**
- **2016**: Primera versión de Kyber publicada
- **2017-2020**: 3 rondas de análisis NIST PQC Competition
- **2022**: Seleccionado como ganador Round 3
- **2023**: Adopción por Google Chrome, Signal, Cloudflare
- **2024**: Estandarización FIPS 203
- **8+ años** de escrutinio académico y militar

### 🎯 ¿PARA QUÉ SE USA ML-KEM?

**Aplicaciones en Producción**:

1. **TLS 1.3 Híbrido** (X25519Kyber768)
   - Combina X25519 (clásico) + ML-KEM-768
   - Chrome, Firefox, Cloudflare implementado
   - Protección contra "downgrade attacks"

2. **VPNs Cuántico-Resistentes**
   - WireGuard + ML-KEM para handshake
   - OpenVPN con plugin PQC
   - Cisco AnyConnect roadmap 2025

3. **Mensajería Segura**
   - Signal Protocol PQXDH (X3DH + ML-KEM-1024)
   - WhatsApp (Meta) en testing
   - iMessage PQ3 (Kyber variant)

4. **Infraestructura PKI**
   - Certificados X.509 híbridos
   - HSMs con soporte ML-KEM (Thales, Entrust)
   - OCSP/CRL post-cuántico

5. **Blockchain y Criptomonedas**
   - Wallets cuántico-resistentes
   - Bitcoin BIP-XXX proposal para PQC addresses
   - Ethereum research sobre quantum-safe validators

---

## 2. Fundamentos Matemáticos

### 📖 ¿QUÉ ES EL PROBLEMA M-LWE?

**Module Learning With Errors (M-LWE)** es la base matemática de ML-KEM. Es una variante del problema LWE (Learning With Errors) sobre retículos modulares.

**Definición del problema**:
```
Dado: (A, b = As + e mod q)
Encontrar: s (vector secreto)

Donde:
- A ∈ R_q^(k×k): Matriz de polinomios públicos (aleatoria)
- s ∈ R_q^k: Vector secreto (pequeño, distribución centrada)
- e ∈ R_q^k: Vector de error (pequeño, distribución gaussiana)
- R_q = Z_q[X]/(X^n + 1): Anillo de polinomios ciclotómicos
- Parámetros ML-KEM-768: n=256, q=3329, k=3
```

### 🤔 ¿POR QUÉ ES DIFÍCIL M-LWE?

**Reducción desde problemas de retículos NP-hard**:
1. **SVP** (Shortest Vector Problem): Encontrar el vector no-cero más corto en un retículo
2. **CVP** (Closest Vector Problem): Encontrar el vector del retículo más cercano a un punto
3. M-LWE se reduce a estos problemas en el peor caso

**Resistencia cuántica**:
- **Algoritmo de Shor**: NO aplica (requiere estructura de grupo finito)
- **Algoritmo de Grover**: Solo acelera búsqueda exhaustiva a O(√N) → Doblar tamaño de clave
- **Algoritmo BKZ**: Mejor ataque conocido, exponencial en dimensión del retículo

**Complejidad concreta** (ML-KEM-768):
- Dimensión del retículo: k·n = 3·256 = 768
- Tiempo de ataque BKZ: ~2^170 operaciones (AES-192 equivalente)
- Memoria requerida: > 2^85 bytes (intratable)

### 🎯 ¿PARA QUÉ USAR RETÍCULOS?

**Ventajas sobre otros enfoques PQC**:

1. **Eficiencia**:
   - Operaciones en anillos polinomiales (FFT/NTT rápido)
   - Complejidad O(n log n) para multiplicación
   - Paralelizable en hardware

2. **Tamaños Manejables**:
   - Claves ~1 KB (vs 200+ KB en McEliece)
   - Ciphertexts ~1 KB
   - Balance entre seguridad y tamaño

3. **Seguridad Probada**:
   - Reducción desde peor caso de problemas de retículos
   - Resistencia a ataques conocidos (8 años de análisis)
   - Transformación Fujisaki-Okamoto para IND-CCA2

### 🔍 EJEMPLO SIMPLIFICADO

**Toy example** (parámetros reducidos para ilustración):
```python
# Parámetros: n=4, q=17, k=2
import numpy as np

# Anillo R_q = Z_17[X]/(X^4 + 1)
q = 17
n = 4
k = 2

# KeyGen: Generar A (pública), s y e (secretos pequeños)
A = np.random.randint(0, q, (k, k, n))  # k×k matriz de polinomios grado n-1
s = np.random.randint(-2, 3, (k, n))    # Pequeño
e = np.random.randint(-1, 2, (k, n))    # Error pequeño

# b = As + e mod q (clave pública)
# pk = (A, b), sk = s

# Encaps: Generar r, e1, e2 pequeños
r = np.random.randint(-2, 3, (k, n))
e1 = np.random.randint(-1, 2, (k, n))
e2 = np.random.randint(-1, 2, n)

# u = A^T·r + e1 (parte del ciphertext)
# v = b^T·r + e2 + encode(message) (parte del ciphertext)
# ct = (u, v)

# Decaps: Recuperar message
# decode(v - s^T·u) = decode(e2 - s^T·e1 + encode(message))
# Si e2 - s^T·e1 es pequeño → decodificación correcta
```

**Nota**: ML-KEM usa polinomios de grado 255, módulo 3329, con transformaciones NTT para eficiencia.

---

## 3. Casos Reales de Implementación

### 🔍 CASO 1: Google Chrome - X25519Kyber768

**📖 ¿QUÉ ES?**
Implementación híbrida de TLS 1.3 que combina curva elíptica clásica (X25519) con ML-KEM-768 (Kyber768).

**🤔 ¿POR QUÉ?**
- **Fecha**: Agosto 2023, Chrome 116
- **Motivación**: "Store Now, Decrypt Later" - proteger tráfico actual de futuros ataques cuánticos
- **Enfoque híbrido**: Mantener seguridad clásica (X25519) + agregar seguridad post-cuántica (Kyber)
- **Alcance**: 3+ billones de usuarios

**🎯 ¿PARA QUÉ?**
- Proteger navegación HTTPS de usuarios
- Validar performance de PQC en producción
- Interoperabilidad con servidores (Cloudflare, etc.)

**🔍 DETALLES TÉCNICOS**:
```
TLS 1.3 ClientHello:
  - Extensión "key_share":
    - Group: x25519_kyber768_draft00 (0x6399)
    - KeyExchange: 1216 bytes (32 X25519 + 1184 Kyber pk)

  - Overhead: +1.2 KB por handshake
  - Latencia adicional: +0.5 ms (imperceptible)
  - Tasa de éxito: 99.7% (0.3% fallback a X25519)
```

**📚 REFERENCIAS**:
- Google Security Blog: "Protecting Chrome Traffic with Hybrid Kyber KEM" (Agosto 2023)
- IETF Draft: draft-ietf-tls-hybrid-design-09
- Cloudflare Research: "Sizing Up Post-Quantum Signatures" (2023)

---

### 🔍 CASO 2: Signal - Protocolo PQXDH

**📖 ¿QUÉ ES?**
Extensión post-cuántica del protocolo X3DH (Extended Triple Diffie-Hellman) usado por Signal, con Kyber1024 (equivalente a ML-KEM-1024).

**🤔 ¿POR QUÉ?**
- **Fecha**: Septiembre 2023, Signal Android/iOS/Desktop
- **Problema**: X3DH usa solo curvas elípticas (X25519) vulnerable a ataques cuánticos
- **Solución**: Agregar KEM post-cuántico en paralelo sin romper compatibilidad
- **Impacto**: 40M+ usuarios activos mensuales

**🎯 ¿PARA QUÉ?**
- Proteger conversaciones privadas de vigilancia futura
- Mantener forward secrecy post-cuántico
- Integración con Double Ratchet

**🔍 ARQUITECTURA PQXDH**:
```
Claves pre-compartidas:
  - IK: Identity Key (X25519) + PQ_IK (Kyber1024)
  - SPK: Signed Prekey (X25519) + PQ_SPK (Kyber1024)
  - OPK: One-Time Prekeys (X25519) + PQ_OPK (Kyber1024)

Derivación de Master Secret:
  MS = KDF(
    DH(IK_a, SPK_b) ||       // Clásico
    DH(EK_a, IK_b) ||        // Clásico
    DH(EK_a, SPK_b) ||       // Clásico
    [DH(EK_a, OPK_b)] ||     // Clásico (opcional)
    KEM_Decaps(PQ_SPK_b) ||  // Post-cuántico
    [KEM_Decaps(PQ_OPK_b)]   // Post-cuántico (opcional)
  )

Overhead:
  - Initial message: +3.5 KB (2 Kyber ciphertexts)
  - Subsequent messages: 0 KB (usa Double Ratchet normal)
```

**📚 REFERENCIAS**:
- Signal Blog: "PQXDH: Building a Post-Quantum Signal Protocol" (Sep 2023)
- Specification: https://signal.org/docs/specifications/pqxdh/
- Paper: "More Efficient Post-Quantum Signal" (Brendel et al., 2023)

---

### 🔍 CASO 3: Apple iMessage - PQ3

**📖 ¿QUÉ ES?**
Protocolo de mensajería con "Level 3" PQC security - el nivel más alto de seguridad post-cuántica definido públicamente.

**🤔 ¿POR QUÉ?**
- **Fecha**: Febrero 2024, iOS 17.4
- **Alcance**: 2+ billones de dispositivos Apple
- **Innovación**: Primer protocolo de mensajería con PQC key rekeying continuo
- **Algoritmo**: Kyber (pre-estandarización FIPS 203)

**🎯 ¿PARA QUÉ?**
- Proteger iMessages de adversarios con capacidades cuánticas futuras
- Rekeying automático post-cuántico cada N mensajes
- Healing de compromisos (forward secrecy + future secrecy)

**🔍 NIVELES DE SEGURIDAD PQC** (Apple):
```
Level 0: No PQC
  - RSA/ECDH solamente
  - Vulnerable a ataques cuánticos

Level 1: PQC en key establishment inicial
  - Ejemplo: Signal PQXDH
  - Compromiso inicial = pérdida total

Level 2: PQC en rekeying periódico
  - Re-establecer PQC keys ocasionalmente
  - Ventana de vulnerabilidad limitada

Level 3: PQC en rekeying continuo (PQ3)
  - Kyber rekey cada 50 mensajes
  - Compromiso de una key NO compromete futuro
  - Self-healing protocol
```

**📚 REFERENCIAS**:
- Apple Security Research: "iMessage with PQ3: The New State of the Art in Quantum-Secure Messaging at Scale" (Feb 2024)
- Technical Analysis: "PQ3 Protocol Specification" (Apple Cryptography Team)

---

### 🔍 CASO 4: Cloudflare - "Post-Quantum for Everyone"

**📖 ¿QUÉ ES?**
Habilitación de TLS post-cuántico para todos los clientes de Cloudflare (incluyendo plan gratuito).

**🤔 ¿POR QUÉ?**
- **Fecha**: Enero 2024
- **Alcance**: 20%+ del tráfico web mundial
- **Motivación**: Democratizar acceso a PQC sin costos adicionales
- **Soporte**: X25519Kyber768 Draft 00

**🎯 ¿PARA QUÉ?**
- Proteger sitios web y APIs de clientes
- Recolectar telemetría de performance PQC a escala
- Acelerar adopción de estándares

**🔍 ESTADÍSTICAS REALES** (Q1 2024):
```
Adopción:
  - 15% de conexiones TLS usan PQC hybrid
  - 35% de navegadores soportan PQC (Chrome, Firefox, Safari TP)
  - 0.001% tasa de errores (problemas de middlebox/firewall)

Performance:
  - Overhead promedio: +1.1 KB ClientHello
  - Latencia p50: +0.3 ms
  - Latencia p99: +2.1 ms
  - CPU servidor: +2% (negligible)

Limitaciones:
  - Algunos firewalls corporativos bloquean ClientHello >2KB
  - Workaround: Fallback automático a X25519
```

**📚 REFERENCIAS**:
- Cloudflare Blog: "Announcing support for post-quantum cryptography for all" (Enero 2024)
- Technical Deep Dive: "Post-Quantum Cryptography at Cloudflare" (Bas Westerbaan, 2023)
- Dashboard: https://radar.cloudflare.com/adoption-and-usage?metric=pqc

---

## 4. Instalación y Configuración

### 📖 ¿QUÉ ES liboqs?

**liboqs** (Open Quantum Safe) es una biblioteca C open-source que implementa todos los algoritmos post-cuánticos estandarizados por NIST.

**Características**:
- **Algoritmos soportados**: ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), FrodoKEM, etc.
- **Optimizaciones**: AVX2, AVX512, NEON (ARM)
- **Bindings**: Python, Go, Rust, Java, .NET
- **Testing**: Constant-time validation, fuzzing, NIST KATs

### 🤔 ¿POR QUÉ liboqs?

- **Referencia oficial**: Implementaciones de referencia NIST
- **Performance**: Optimizaciones de bajo nivel (assembly, SIMD)
- **Portabilidad**: Linux, macOS, Windows, BSD, embedded
- **Seguridad**: Auditorías de código, side-channel hardening

### 🎯 INSTALACIÓN COMPLETA

```bash
# Ubuntu/Debian - Dependencias
sudo apt update
sudo apt install -y \
  cmake gcc g++ ninja-build \
  libssl-dev \
  python3-pytest python3-pytest-xdist \
  unzip xsltproc doxygen graphviz \
  astyle valgrind

# Clonar repositorio
git clone -b main https://github.com/open-quantum-safe/liboqs.git
cd liboqs

# Configurar build con optimizaciones
mkdir build && cd build
cmake -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DOQS_USE_OPENSSL=ON \
  -DBUILD_SHARED_LIBS=ON \
  -DOQS_DIST_BUILD=ON \
  ..

# Compilar (paralelizado)
ninja

# Ejecutar tests (verificar instalación)
ninja run_tests

# Instalar sistema (requiere sudo)
sudo ninja install
sudo ldconfig  # Actualizar cache de librerías

# Python bindings
pip install liboqs-python

# Verificar instalación
python3 -c "import oqs; print('KEMs:', oqs.get_enabled_KEM_mechanisms())"
```

### 🔍 VERIFICACIÓN POST-INSTALACIÓN

```python
#!/usr/bin/env python3
"""Verificar instalación de liboqs"""
import oqs

print("=" * 60)
print("liboqs Installation Verification")
print("=" * 60)

# KEMs disponibles
kems = oqs.get_enabled_KEM_mechanisms()
print(f"\n[KEMs Enabled] {len(kems)} algorithms:")
for kem in sorted(kems):
    if 'Kyber' in kem or 'ML-KEM' in kem:
        print(f"  ✅ {kem}")

# Test rápido ML-KEM-768
try:
    kem = oqs.KeyEncapsulation("Kyber768")
    pk = kem.generate_keypair()
    ct, ss = kem.encap_secret(pk)
    print(f"\n✅ ML-KEM-768 functional")
    print(f"   Public key: {len(pk)} bytes")
    print(f"   Ciphertext: {len(ct)} bytes")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
```

---

## 5. Implementaciones Completas

### 💻 IMPLEMENTACIÓN 1: Benchmark ML-KEM (3 niveles de seguridad)

```python
#!/usr/bin/env python3
"""
Benchmark completo de ML-KEM en sus 3 variantes
NIST FIPS 203 - Agosto 2024
"""
import oqs
import time
import statistics

def benchmark_kem(kem_name: str, iterations: int = 100):
    """Benchmark de un KEM específico"""
    kem = oqs.KeyEncapsulation(kem_name)

    # Métricas
    keygen_times = []
    encaps_times = []
    decaps_times = []

    # Warm-up (evitar outliers de caché)
    for _ in range(10):
        pk = kem.generate_keypair()
        ct, ss1 = kem.encap_secret(pk)
        ss2 = kem.decap_secret(ct)

    # Benchmark real
    for i in range(iterations):
        # KeyGen
        t0 = time.perf_counter()
        public_key = kem.generate_keypair()
        keygen_times.append(time.perf_counter() - t0)

        # Encaps
        t0 = time.perf_counter()
        ciphertext, shared_secret_alice = kem.encap_secret(public_key)
        encaps_times.append(time.perf_counter() - t0)

        # Decaps
        t0 = time.perf_counter()
        shared_secret_bob = kem.decap_secret(ciphertext)
        decaps_times.append(time.perf_counter() - t0)

        # Verificar corrección
        assert shared_secret_alice == shared_secret_bob

    # Estadísticas
    return {
        'algorithm': kem_name,
        'pk_size': len(public_key),
        'ct_size': len(ciphertext),
        'ss_size': len(shared_secret_alice),
        'keygen_mean': statistics.mean(keygen_times) * 1000,
        'keygen_stdev': statistics.stdev(keygen_times) * 1000,
        'encaps_mean': statistics.mean(encaps_times) * 1000,
        'encaps_stdev': statistics.stdev(encaps_times) * 1000,
        'decaps_mean': statistics.mean(decaps_times) * 1000,
        'decaps_stdev': statistics.stdev(decaps_times) * 1000,
    }

def main():
    algorithms = [
        'Kyber512',   # ML-KEM-512 (NIST Level 1 ≈ AES-128)
        'Kyber768',   # ML-KEM-768 (NIST Level 3 ≈ AES-192)
        'Kyber1024',  # ML-KEM-1024 (NIST Level 5 ≈ AES-256)
    ]

    print("=" * 80)
    print("ML-KEM Benchmark - NIST FIPS 203 (liboqs)")
    print("=" * 80)
    print(f"Iterations: 100 per algorithm")
    print()

    results = []
    for alg in algorithms:
        print(f"[*] Benchmarking {alg}...", end=" ", flush=True)
        r = benchmark_kem(alg, iterations=100)
        results.append(r)
        print("✅")

    # Imprimir resultados
    print("\n" + "=" * 80)
    print("SIZES (bytes)")
    print("=" * 80)
    print(f"{'Algorithm':<15} {'Public Key':>12} {'Ciphertext':>12} {'Shared Secret':>15}")
    print("-" * 80)
    for r in results:
        print(f"{r['algorithm']:<15} {r['pk_size']:>12,} {r['ct_size']:>12,} {r['ss_size']:>15}")

    print("\n" + "=" * 80)
    print("PERFORMANCE (milliseconds, mean ± stdev)")
    print("=" * 80)
    print(f"{'Algorithm':<15} {'KeyGen':>20} {'Encaps':>20} {'Decaps':>20}")
    print("-" * 80)
    for r in results:
        print(f"{r['algorithm']:<15} "
              f"{r['keygen_mean']:>7.3f} ± {r['keygen_stdev']:>6.3f}  "
              f"{r['encaps_mean']:>7.3f} ± {r['encaps_stdev']:>6.3f}  "
              f"{r['decaps_mean']:>7.3f} ± {r['decaps_stdev']:>6.3f}")

    print("\n" + "=" * 80)
    print("TOTAL OVERHEAD (KeyGen + Encaps + Decaps)")
    print("=" * 80)
    for r in results:
        total = r['keygen_mean'] + r['encaps_mean'] + r['decaps_mean']
        print(f"{r['algorithm']:<15} {total:>7.3f} ms")

if __name__ == "__main__":
    main()
```

**Salida esperada**:
```
================================================================================
ML-KEM Benchmark - NIST FIPS 203 (liboqs)
================================================================================
Iterations: 100 per algorithm

[*] Benchmarking Kyber512... ✅
[*] Benchmarking Kyber768... ✅
[*] Benchmarking Kyber1024... ✅

================================================================================
SIZES (bytes)
================================================================================
Algorithm       Public Key  Ciphertext  Shared Secret
--------------------------------------------------------------------------------
Kyber512               800         768             32
Kyber768             1,184       1,088             32
Kyber1024            1,568       1,568             32

================================================================================
PERFORMANCE (milliseconds, mean ± stdev)
================================================================================
Algorithm       KeyGen              Encaps              Decaps
--------------------------------------------------------------------------------
Kyber512          0.045 ±  0.012    0.055 ±  0.008    0.052 ±  0.007
Kyber768          0.072 ±  0.015    0.089 ±  0.011    0.084 ±  0.010
Kyber1024         0.098 ±  0.018    0.121 ±  0.014    0.115 ±  0.012

================================================================================
TOTAL OVERHEAD (KeyGen + Encaps + Decaps)
================================================================================
Kyber512          0.152 ms
Kyber768          0.245 ms
Kyber1024         0.334 ms
```

---

### 💻 IMPLEMENTACIÓN 2: Cifrado Híbrido de Archivos (ML-KEM + AES-GCM)

```python
#!/usr/bin/env python3
"""
Sistema de cifrado de archivos usando ML-KEM-768 + AES-256-GCM
Patrón: KEM deriva clave AES, AES cifra datos
"""
import oqs
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import os
import sys
import json
import base64

class MLKEM_FileEncryptor:
    """Encriptador de archivos con ML-KEM-768"""

    def __init__(self):
        self.kem = oqs.KeyEncapsulation("Kyber768")

    def generate_keypair(self, private_key_file: str, public_key_file: str):
        """Genera y guarda par de claves"""
        public_key = self.kem.generate_keypair()
        secret_key = self.kem.export_secret_key()

        # Guardar claves (en producción usar protección adicional)
        with open(public_key_file, 'wb') as f:
            f.write(public_key)

        with open(private_key_file, 'wb') as f:
            f.write(secret_key)

        print(f"✅ Keypair generado:")
        print(f"   Public:  {public_key_file} ({len(public_key)} bytes)")
        print(f"   Private: {private_key_file} ({len(secret_key)} bytes)")

    def encrypt_file(self, input_file: str, output_file: str, public_key_file: str):
        """Cifra archivo usando ML-KEM + AES-GCM"""
        # Cargar clave pública
        with open(public_key_file, 'rb') as f:
            public_key = f.read()

        # 1. Encapsular con ML-KEM (genera shared secret)
        ciphertext_kem, shared_secret = self.kem.encap_secret(public_key)

        # 2. Derivar clave AES-256 usando HKDF
        kdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,  # AES-256
            salt=None,
            info=b'ML-KEM-768-FILE-ENCRYPTION',
        )
        aes_key = kdf.derive(shared_secret)

        # 3. Cifrar archivo con AES-GCM
        with open(input_file, 'rb') as f:
            plaintext = f.read()

        aesgcm = AESGCM(aes_key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)

        # 4. Guardar metadata + ciphertext
        output_data = {
            'version': '1.0',
            'algorithm': 'ML-KEM-768 + AES-256-GCM',
            'kem_ciphertext': base64.b64encode(ciphertext_kem).decode(),
            'nonce': base64.b64encode(nonce).decode(),
            'ciphertext': base64.b64encode(ciphertext).decode(),
        }

        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

        print(f"✅ Archivo cifrado:")
        print(f"   Input:  {input_file} ({len(plaintext):,} bytes)")
        print(f"   Output: {output_file} ({os.path.getsize(output_file):,} bytes)")
        print(f"   KEM CT: {len(ciphertext_kem)} bytes")
        print(f"   Overhead: {os.path.getsize(output_file) - len(plaintext):,} bytes")

    def decrypt_file(self, input_file: str, output_file: str, private_key_file: str):
        """Descifra archivo usando ML-KEM + AES-GCM"""
        # Cargar clave privada
        with open(private_key_file, 'rb') as f:
            secret_key = f.read()

        # Cargar archivo cifrado
        with open(input_file, 'r') as f:
            data = json.load(f)

        ciphertext_kem = base64.b64decode(data['kem_ciphertext'])
        nonce = base64.b64decode(data['nonce'])
        ciphertext = base64.b64decode(data['ciphertext'])

        # 1. Desencapsular con ML-KEM
        shared_secret = self.kem.decap_secret(ciphertext_kem)

        # 2. Derivar clave AES-256
        kdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'ML-KEM-768-FILE-ENCRYPTION',
        )
        aes_key = kdf.derive(shared_secret)

        # 3. Descifrar con AES-GCM
        aesgcm = AESGCM(aes_key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)

        # 4. Guardar archivo
        with open(output_file, 'wb') as f:
            f.write(plaintext)

        print(f"✅ Archivo descifrado:")
        print(f"   Input:  {input_file}")
        print(f"   Output: {output_file} ({len(plaintext):,} bytes)")

def main():
    encryptor = MLKEM_FileEncryptor()

    # Demo
    print("=" * 70)
    print("ML-KEM-768 File Encryption Demo")
    print("=" * 70)

    # 1. Generar keypair
    encryptor.generate_keypair('mlkem.sk', 'mlkem.pk')
    print()

    # 2. Crear archivo de prueba
    test_file = 'test_document.txt'
    with open(test_file, 'w') as f:
        f.write("DOCUMENTO CONFIDENCIAL\n" + "=" * 50 + "\n\n")
        f.write("Este documento contiene información sensible protegida\n")
        f.write("con criptografía post-cuántica (ML-KEM-768 + AES-256-GCM).\n\n")
        f.write("Contenido: " + "X" * 1000 + "\n")

    # 3. Cifrar
    print("[ENCRYPT]")
    encryptor.encrypt_file(test_file, 'test_document.enc', 'mlkem.pk')
    print()

    # 4. Descifrar
    print("[DECRYPT]")
    encryptor.decrypt_file('test_document.enc', 'test_document_recovered.txt', 'mlkem.sk')
    print()

    # 5. Verificar
    with open(test_file, 'rb') as f:
        original = f.read()
    with open('test_document_recovered.txt', 'rb') as f:
        recovered = f.read()

    if original == recovered:
        print("✅ VERIFICATION SUCCESS: Files match perfectly")
    else:
        print("❌ VERIFICATION FAILED: Files differ")

if __name__ == "__main__":
    main()
```

---

### 💻 IMPLEMENTACIÓN 3: Código Original del Lab (Conservado)

```python
import oqs
import time

# ML-KEM-768 (Kyber768)
kem = oqs.KeyEncapsulation("ML-KEM-768")

# Generar claves
print("Generando par de claves...")
start = time.time()
public_key = kem.generate_keypair()
keygen_time = time.time() - start

# Alice: Encapsular
start = time.time()
ciphertext, shared_secret_alice = kem.encap_secret(public_key)
encap_time = time.time() - start

# Bob: Desencapsular
start = time.time()
shared_secret_bob = kem.decap_secret(ciphertext)
decap_time = time.time() - start

# Verificar
assert shared_secret_alice == shared_secret_bob
print("✅ Key exchange exitoso!")

# Stats
print(f"\nRendimiento:")
print(f"KeyGen: {keygen_time*1000:.2f} ms")
print(f"Encaps: {encap_time*1000:.2f} ms")
print(f"Decaps: {decap_time*1000:.2f} ms")

print(f"\nTamaños:")
print(f"Public key: {len(public_key)} bytes")
print(f"Ciphertext: {len(ciphertext)} bytes")
print(f"Shared secret: {len(shared_secret_alice)} bytes")
```

---

## Comparación con X25519

```python
from cryptography.hazmat.primitives.asymmetric import x25519

# X25519 (clásico)
start = time.time()
private = x25519.X25519PrivateKey.generate()
public = private.public_key()
x25519_keygen = time.time() - start

print(f"\nComparación:")
print(f"X25519 KeyGen: {x25519_keygen*1000:.2f} ms")
print(f"ML-KEM-768 KeyGen: {keygen_time*1000:.2f} ms")
print(f"Ratio: {keygen_time/x25519_keygen:.1f}x")

print(f"\nTamaño clave pública:")
print(f"X25519: 32 bytes")
print(f"ML-KEM-768: {len(public_key)} bytes ({len(public_key)/32:.1f}x)")
```

---

## Integración con AES

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

# Key exchange con ML-KEM
ciphertext, shared_secret = kem.encap_secret(public_key)

# Derivar clave AES
kdf = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=b'ML-KEM to AES',
)
aes_key = kdf.derive(shared_secret)

# Cifrar mensaje
aesgcm = AESGCM(aes_key)
nonce = os.urandom(12)
message = b"Mensaje confidencial postcuántico"
encrypted = aesgcm.encrypt(nonce, message, None)

print("✅ Mensaje cifrado con clave postcuántica!")
```

---

## 6. Ejercicios Progresivos

### 📝 EJERCICIO 1: Básico - Comparación ML-KEM vs RSA

**🎯 Objetivo**: Entender diferencias de performance entre criptografía clásica y post-cuántica.

**📖 Descripción**:
Implementar benchmark comparativo entre ML-KEM-768 y RSA-3072 midiendo:
1. Tiempo de generación de claves
2. Tiempo de encapsulación/cifrado
3. Tiempo de desencapsulación/descifrado
4. Tamaño de claves y ciphertexts

**💻 Código inicial**:
```python
#!/usr/bin/env python3
import oqs
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
import time
import os

def benchmark_mlkem():
    """Implementar benchmark ML-KEM-768"""
    # TODO: Implementar usando código de IMPLEMENTACIÓN 1
    pass

def benchmark_rsa():
    """Implementar benchmark RSA-3072"""
    # TODO:
    # 1. Generar keypair RSA-3072
    # 2. Cifrar secreto aleatorio de 32 bytes con OAEP
    # 3. Descifrar
    # 4. Medir tiempos
    pass

# TODO: Comparar resultados y graficar
```

**✅ Criterios de éxito**:
- Tiempos medidos con ±10% precisión
- Comparación tabulada clara
- Análisis de trade-offs

---

### 📝 EJERCICIO 2: Intermedio - TLS 1.3 Hybrid Handshake Simulator

**🎯 Objetivo**: Simular intercambio de claves híbrido X25519Kyber768 como Chrome.

**📖 Descripción**:
Implementar simulador que combina:
1. X25519 (ECDH clásico)
2. ML-KEM-768 (post-cuántico)
3. Derivación de master secret con HKDF

**Flujo del protocolo**:
```
Cliente                                    Servidor
-------                                    --------
1. Generar X25519 keypair
2. Generar ML-KEM-768 public key
3. Enviar (X25519_pk || ML-KEM_pk) ------>

                                 4. Generar X25519 keypair
                                 5. ECDH shared secret (X25519)
                                 6. ML-KEM Encaps
                      <------ 7. Enviar (X25519_pk || ML-KEM_ct)

8. ECDH shared secret
9. ML-KEM Decaps
10. Derivar master = HKDF(ss_ecdh || ss_kem)

                                11. Derivar master (igual)

[Ambos tienen mismo master secret]
```

**💻 Template**:
```python
#!/usr/bin/env python3
import oqs
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

class HybridTLS:
    def __init__(self):
        self.kem = oqs.KeyEncapsulation("Kyber768")

    def client_hello(self):
        """Generar ClientHello con X25519 + ML-KEM"""
        # TODO: Implementar
        pass

    def server_response(self, client_x25519_pk, client_mlkem_pk):
        """Generar ServerHello + derivar master"""
        # TODO: Implementar
        pass

    def client_derive_master(self, server_x25519_pk, server_mlkem_ct):
        """Cliente deriva master secret"""
        # TODO: Implementar
        pass

# TODO: Demostrar handshake completo
```

**✅ Criterios de éxito**:
- Shared secret match entre cliente y servidor
- Overhead calculado (<1.5 KB)
- Implementación compatible con RFC draft

---

### 📝 EJERCICIO 3: Avanzado - Quantum-Safe Messaging Protocol

**🎯 Objetivo**: Implementar protocolo de mensajería estilo Signal PQXDH.

**📖 Descripción**:
Extender X3DH clásico con ML-KEM-1024:
1. Identity keys (X25519 + ML-KEM)
2. Signed prekeys (X25519 + ML-KEM)
3. One-time prekeys (X25519 + ML-KEM)
4. Derivación de master secret combinado

**Arquitectura**:
```python
class PQXDH:
    """Post-Quantum Extended Diffie-Hellman"""

    def __init__(self):
        self.kem = oqs.KeyEncapsulation("Kyber1024")

    def generate_identity_keys(self):
        """
        Generar:
        - IK_classic (X25519)
        - IK_pq (ML-KEM-1024)
        """
        pass

    def generate_signed_prekey(self, identity_key):
        """
        Generar:
        - SPK_classic (X25519)
        - SPK_pq (ML-KEM-1024)
        - Firma con ML-DSA (Ejercicio futuro)
        """
        pass

    def derive_master_secret(self, dh_outputs, kem_outputs):
        """
        MS = HKDF(
            DH(IK_a, SPK_b) ||
            DH(EK_a, IK_b) ||
            DH(EK_a, SPK_b) ||
            KEM_Decaps(PQ_SPK_b)
        )
        """
        pass

# TODO: Implementar handshake completo Alice <-> Bob
```

**✅ Criterios de éxito**:
- 3+ DH operations correctas
- 1+ KEM operations correctas
- Master secret derivado correctamente
- Resistencia a compromiso de 1 clave

---

### 📝 EJERCICIO 4: Desafío - Side-Channel Timing Analysis

**🎯 Objetivo**: Verificar implementación constant-time de ML-KEM.

**📖 Descripción**:
Analizar si liboqs tiene vulnerabilidades de timing en:
1. Comparación de shared secrets
2. Decapsulation con ciphertexts inválidos
3. Operaciones modulares

**Metodología**:
```python
#!/usr/bin/env python3
import oqs
import time
import numpy as np
import matplotlib.pyplot as plt

def timing_attack_decaps():
    """
    Medir varianza en decapsulation con:
    - Ciphertexts válidos
    - Ciphertexts inválidos (bit flips)
    """
    kem = oqs.KeyEncapsulation("Kyber768")
    pk = kem.generate_keypair()

    # Generar ciphertext válido
    ct_valid, _ = kem.encap_secret(pk)

    times_valid = []
    times_invalid = []

    for i in range(1000):
        # Timing válido
        t0 = time.perf_counter()
        kem.decap_secret(ct_valid)
        times_valid.append(time.perf_counter() - t0)

        # Timing inválido (flip 1 bit)
        ct_invalid = bytearray(ct_valid)
        ct_invalid[i % len(ct_invalid)] ^= 0x01
        ct_invalid = bytes(ct_invalid)

        t0 = time.perf_counter()
        try:
            kem.decap_secret(ct_invalid)
        except:
            pass
        times_invalid.append(time.perf_counter() - t0)

    # Análisis estadístico
    print(f"Valid mean:   {np.mean(times_valid)*1e6:.2f} μs ± {np.std(times_valid)*1e6:.2f}")
    print(f"Invalid mean: {np.mean(times_invalid)*1e6:.2f} μs ± {np.std(times_invalid)*1e6:.2f}")

    # TODO: T-test, visualización

# TODO: Implementar mitigaciones si se detecta varianza
```

**✅ Criterios de éxito**:
- T-test estadístico (p-value > 0.05 = seguro)
- Gráficos de distribución de tiempos
- Identificación de leaks (si existen)
- Propuesta de mitigaciones

---

## 7. Análisis de Seguridad

### 🔒 SEGURIDAD DE ML-KEM

**📖 ¿QUÉ GARANTÍAS OFRECE?**

1. **IND-CCA2** (Indistinguishability under Adaptive Chosen Ciphertext Attack)
   - Adversario no puede distinguir entre encapsulaciones de mensajes elegidos
   - Resistencia a ataques con acceso a oráculo de descifrado
   - Logrado mediante transformación Fujisaki-Okamoto

2. **Reducción a M-LWE**
   - Seguridad reducida a problema M-LWE en peor caso
   - Si M-LWE es difícil → ML-KEM es seguro
   - Reducción probabilística con pérdida de factor poli-logarítmico

3. **Resistencia Cuántica Concreta**
   ```
   ML-KEM-512:  ~2^143 operaciones cuánticas (AES-128 equiv.)
   ML-KEM-768:  ~2^207 operaciones cuánticas (AES-192 equiv.)
   ML-KEM-1024: ~2^272 operaciones cuánticas (AES-256 equiv.)
   ```

### 🤔 ¿QUÉ ATAQUES EXISTEN?

**1. Ataques Estructurales (Criptoanálisis)**

| Ataque           | Año  | Complejidad   | Impacto                | Mitigación              |
|------------------|------|---------------|------------------------|-------------------------|
| LLL + BKZ        | 2024 | 2^170 (768)   | Ninguno (teórico)      | Parámetros adecuados    |
| Primal attack    | 2023 | 2^165 (768)   | Ninguno                | Dimensión suficiente    |
| Dual attack      | 2022 | 2^168 (768)   | Ninguno                | Distribución de error   |

**2. Ataques de Implementación (Side-Channel)**

**Caso real - CVE-2022-XXXX** (Hipotético):
```
Ataque: Timing attack en comparación de shared secret
Vector: Medir tiempo de decaps con ciphertexts modificados
Impacto: Recuperación parcial de clave secreta (20 bits)
Fix: Comparación constant-time con crypto_verify_32()
```

**Mitigaciones en liboqs**:
- `crypto_verify_32()` para comparaciones
- Rechazo de muestras constant-time
- No branching basado en datos secretos
- Validación con Valgrind + memcheck

### 🎯 MEJORES PRÁCTICAS

**1. Uso Híbrido (SIEMPRE)**
```python
# ❌ MAL: Solo PQC
master_secret = mlkem_shared_secret

# ✅ BIEN: Híbrido clásico + PQC
master_secret = HKDF(ecdh_secret || mlkem_secret)
```

**Razón**: Si ML-KEM se rompe, X25519 aún protege. Si computadoras cuánticas llegan, ML-KEM protege.

**2. Validación de Entradas**
```python
# ✅ Validar tamaños antes de desencapsular
if len(ciphertext) != kem.length_ciphertext:
    raise ValueError("Invalid ciphertext length")

# ✅ Manejar errores de decaps sin leaks
try:
    shared_secret = kem.decap_secret(ciphertext)
except:
    # NO revelar por qué falló (timing leak)
    return None
```

**3. Rotación de Claves**
```python
# Rotar ML-KEM keys periódicamente
# Ejemplo: Cada 10,000 mensajes (iMessage PQ3)
if message_count % 10000 == 0:
    new_pk = kem.generate_keypair()
    # Ratchet forward
```

---

## 8. Referencias y Recursos

### 📚 ESTÁNDARES OFICIALES

1. **NIST FIPS 203** (Agosto 2024)
   *Module-Lattice-Based Key-Encapsulation Mechanism Standard*
   https://csrc.nist.gov/pubs/fips/203/final

2. **IETF RFC draft-ietf-tls-hybrid-design-09** (2024)
   *Hybrid key exchange in TLS 1.3*
   https://datatracker.ietf.org/doc/draft-ietf-tls-hybrid-design/

3. **NIST SP 800-227** (Draft 2024)
   *Recommendations for Stateful Hash-Based Signature Schemes*
   https://csrc.nist.gov/pubs/sp/800/227/ipd

### 📚 PAPERS ACADÉMICOS

4. **Bos, J., Ducas, L., Kiltz, E., et al.** (2018)
   *CRYSTALS-Kyber: A CCA-Secure Module-Lattice-Based KEM*
   IEEE European Symposium on Security and Privacy (EuroS&P)
   https://pq-crystals.org/kyber/

5. **Avanzi, R., Bos, J., Ducas, L., et al.** (2020)
   *CRYSTALS-Kyber Algorithm Specifications And Supporting Documentation*
   NIST PQC Round 3 Submission
   https://pq-crystals.org/kyber/data/kyber-specification-round3-20210804.pdf

6. **Regev, O.** (2005)
   *On lattices, learning with errors, random linear codes, and cryptography*
   Proceedings of the 37th Annual ACM Symposium on Theory of Computing (STOC)
   DOI: 10.1145/1060590.1060603

7. **Lyubashevsky, V., Peikert, C., Regev, O.** (2013)
   *On Ideal Lattices and Learning with Errors Over Rings*
   Journal of the ACM, Vol. 60, No. 6
   DOI: 10.1145/2535925

### 📚 IMPLEMENTACIONES REALES

8. **Google Security Blog** (Agosto 2023)
   *Protecting Chrome Traffic with Hybrid Kyber KEM*
   https://security.googleblog.com/2023/08/protecting-chrome-traffic-with-hybrid.html

9. **Signal Foundation** (Septiembre 2023)
   *PQXDH: Building a Post-Quantum Signal Protocol*
   https://signal.org/docs/specifications/pqxdh/
   Paper: Brendel, J., et al. "Post-Quantum Asynchronous Deniable Key Exchange" (2023)

10. **Apple Security Research** (Febrero 2024)
    *iMessage with PQ3: The New State of the Art in Quantum-Secure Messaging*
    https://security.apple.com/blog/imessage-pq3/

11. **Cloudflare Blog** (Enero 2024)
    *Announcing support for post-quantum cryptography for all Cloudflare services*
    https://blog.cloudflare.com/post-quantum-for-all/
    Technical: Westerbaan, B. "A Detailed Look at RFC 9180: Hybrid Public Key Encryption" (2023)

### 📚 ANÁLISIS DE SEGURIDAD

12. **Hermelink, J., Pessl, P., Pöppelmann, T.** (2022)
    *Simpler, Faster, and More Robust T-Tests for Kyber on ARM Cortex-M4*
    IACR Transactions on Cryptographic Hardware and Embedded Systems (CHES)
    https://tches.iacr.org/index.php/TCHES/article/view/9296

13. **Ravi, P., Roy, S. S., Chattopadhyay, A., Bhasin, S.** (2020)
    *Generic Side-Channel Attacks on CCA-Secure Lattice-Based PKE and KEMs*
    IACR Transactions on Cryptographic Hardware and Embedded Systems
    https://eprint.iacr.org/2019/948

14. **Primas, R., Pessl, P., Mangard, S.** (2017)
    *Single-Trace Side-Channel Attacks on Masked Lattice-Based Encryption*
    CHES 2017
    DOI: 10.1007/978-3-319-66787-4_18

### 📚 HERRAMIENTAS Y LIBRERÍAS

15. **Open Quantum Safe (liboqs)**
    https://github.com/open-quantum-safe/liboqs
    Documentación: https://openquantumsafe.org/

16. **PQClean**
    https://github.com/PQClean/PQClean
    Implementaciones limpias y portables de algoritmos PQC

17. **NIST PQC Forum**
    https://csrc.nist.gov/projects/post-quantum-cryptography
    Discusiones técnicas y actualizaciones de estandarización

### 📚 RECURSOS EDUCATIVOS

18. **Peikert, C.** (2016)
    *A Decade of Lattice Cryptography*
    Foundations and Trends in Theoretical Computer Science
    https://web.eecs.umich.edu/~cpeikert/pubs/lattice-survey.pdf

19. **Bernstein, D. J., Lange, T.** (2017)
    *Post-quantum cryptography*
    Nature, Vol. 549, pp. 188–194
    DOI: 10.1038/nature23461

20. **NIST PQC Competition Videos**
    https://www.youtube.com/playlist?list=PLs_3T2yw4AAAAcSIDqLs1cKXqPWJHk9SH
    Presentaciones de candidatos Round 3

---

## Entregables del Laboratorio

### Mínimo (Aprobar)
- [ ] Instalación funcional de liboqs
- [ ] Ejecución exitosa de IMPLEMENTACIÓN 1 (Benchmark)
- [ ] Ejecución exitosa de IMPLEMENTACIÓN 3 (Código original)
- [ ] Ejercicio 1 completado (Comparación ML-KEM vs RSA)

### Completo (Nota alta)
- [ ] Todo lo anterior
- [ ] IMPLEMENTACIÓN 2 funcionando (Cifrado de archivos)
- [ ] Ejercicio 2 completado (TLS Hybrid Handshake)
- [ ] Análisis escrito de trade-offs performance vs seguridad

### Excelencia (Nota máxima)
- [ ] Todo lo anterior
- [ ] Ejercicio 3 completado (PQXDH)
- [ ] Ejercicio 4 completado (Side-Channel Analysis)
- [ ] Documento técnico estilo paper (5-10 páginas) con:
  - Metodología de benchmarks
  - Análisis de resultados
  - Propuestas de optimización
  - Conclusiones sobre viabilidad de ML-KEM en producción

---

## Notas Finales

**Compatibilidad de nombres**:
- liboqs usa nombres `Kyber512`, `Kyber768`, `Kyber1024`
- NIST FIPS 203 los renombró a `ML-KEM-512`, `ML-KEM-768`, `ML-KEM-1024`
- Son **el mismo algoritmo**, solo cambio de nomenclatura
- Versión liboqs 0.10.0+ soportará nombres ML-KEM oficiales

**Limitaciones conocidas**:
- Windows: liboqs requiere MinGW o WSL para compilar
- ARM: Algunas optimizaciones AVX2 no disponibles (usar NEON)
- Python GIL: Para benchmarks precisos usar `multiprocessing` o Rust bindings

**Próximos pasos**:
- Lab 03: ML-DSA (Dilithium) - Firmas digitales post-cuánticas
- Lab 04: SLH-DSA (SPHINCS+) - Firmas hash-based stateless
- Lab 05: Integración completa TLS 1.3 con BoringSSL

---

[⬅️ Volver](../../README.md) | [➡️ Siguiente Lab: ML-DSA](../lab_03_mldsa/)
