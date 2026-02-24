# 4.2 ALGORITMOS NIST PQC ESTANDARIZADOS

**Estándares publicados**: Agosto 2024

---

## ML-KEM (Module-Lattice-based Key Encapsulation Mechanism)

**Anteriormente**: CRYSTALS-Kyber
**Finalista NIST**: Round 3 Winner (2022)
**Estandarizado**: FIPS 203 (2024)

### Variantes

| Variante | Nivel Seguridad | Tamaño Clave Pública | Tamaño Ciphertext |
|----------|-----------------|----------------------|-------------------|
| ML-KEM-512 | NIST Nivel 1 (~AES-128) | 800 bytes | 768 bytes |
| ML-KEM-768 | NIST Nivel 3 (~AES-192) | 1,184 bytes | 1,088 bytes |
| ML-KEM-1024 | NIST Nivel 5 (~AES-256) | 1,568 bytes | 1,568 bytes |

**Recomendado**: ML-KEM-768 (balance seguridad/rendimiento)

### Funcionamiento

**Basado en**: Learning With Errors over Module Lattices (M-LWE)

```
Alice (encapsular):
1. Generar shared secret s
2. Encapsular: c = Encaps(pk_Bob, s)
3. Enviar c a Bob

Bob (desencapsular):
4. Recuperar: s = Decaps(sk_Bob, c)

Resultado: Alice y Bob comparten s
```

### Implementación (Python con liboqs)

```python
import oqs

# Generar par de claves
kem = oqs.KeyEncapsulation("ML-KEM-768")
public_key = kem.generate_keypair()
secret_key = kem.export_secret_key()

# Encapsular (Alice)
ciphertext, shared_secret_alice = kem.encap_secret(public_key)

# Desencapsular (Bob)
shared_secret_bob = kem.decap_secret(ciphertext)

assert shared_secret_alice == shared_secret_bob
```

### Casos de Uso

- Reemplazo de RSA/ECDH en TLS
- VPNs
- Encriptación de claves simétricas
- Protocolos de key exchange

---

## ML-DSA (Module-Lattice-based Digital Signature Algorithm)

**Anteriormente**: CRYSTALS-Dilithium
**Estandarizado**: FIPS 204 (2024)

### Variantes

| Variante | Nivel Seguridad | Clave Pública | Firma |
|----------|-----------------|---------------|-------|
| ML-DSA-44 | Nivel 2 | 1,312 bytes | 2,420 bytes |
| ML-DSA-65 | Nivel 3 | 1,952 bytes | 3,293 bytes |
| ML-DSA-87 | Nivel 5 | 2,592 bytes | 4,595 bytes |

**Recomendado**: ML-DSA-65

### Funcionamiento

```
Generar claves:
(pk, sk) = KeyGen()

Firmar:
σ = Sign(sk, mensaje)

Verificar:
{válido, inválido} = Verify(pk, mensaje, σ)
```

### Implementación

```python
import oqs

# Generar claves
sig = oqs.Signature("ML-DSA-65")
public_key = sig.generate_keypair()
secret_key = sig.export_secret_key()

# Firmar
message = b"Documento importante"
signature = sig.sign(message)

# Verificar
is_valid = sig.verify(message, signature, public_key)
print(f"Firma válida: {is_valid}")
```

### Casos de Uso

- Firmas de código
- Certificados digitales PQC
- Blockchain/DLT
- Documentos legales

---

## Falcon (Fast Fourier Lattice-based Compact Signatures)

**Estandarizado**: FIPS 206 (2024)

### Ventajas

- **Firmas más pequeñas** que ML-DSA
- Basado en NTRU lattices
- Rápido en verificación

### Variantes

| Variante | Nivel | Clave Pública | Firma |
|----------|-------|---------------|-------|
| Falcon-512 | 1 | 897 bytes | ~666 bytes |
| Falcon-1024 | 5 | 1,793 bytes | ~1,280 bytes |

### Desventaja

- Generación de claves más lenta
- Implementación más compleja

### Uso

```python
import oqs

sig = oqs.Signature("Falcon-512")
public_key = sig.generate_keypair()
signature = sig.sign(b"message")
valid = sig.verify(b"message", signature, public_key)
```

---

## SLH-DSA (Stateless Hash-based Digital Signature Algorithm)

**Anteriormente**: SPHINCS+
**Estandarizado**: FIPS 205 (2024)

### Características Únicas

- **Basado SOLO en funciones hash** (SHA-256, SHAKE256)
- **Más conservador** (no asunciones difíciles)
- **Stateless** (no necesita tracking de estado)

### Variantes

Múltiples combinaciones de:
- Hash function: SHA-256, SHAKE256
- Tamaño: 128f, 192f, 256f (f=fast, s=small)

### Trade-offs

| Aspecto | SLH-DSA | ML-DSA |
|---------|---------|---------|
| Seguridad | Más conservador | Asumción lattice |
| Tamaño firma | **MUY GRANDE** (7-49 KB) | Mediano (2-4 KB) |
| Velocidad | Lento | Rápido |
| Confianza | Alta (solo hash) | Media-Alta |

### Uso

```python
import oqs

sig = oqs.Signature("SPHINCS+-SHA256-128f-simple")
public_key = sig.generate_keypair()
signature = sig.sign(b"critical document")
```

### Caso de Uso Ideal

- **Sistemas ultra-críticos** donde conservadurismo > eficiencia
- Infraestructura de largo plazo (Root CAs)
- Sistemas con restricciones de estado

---

## Alternates (Round 4 Candidates)

### FrodoKEM

**Status**: Alternate (más conservador que Kyber)
**Basado en**: Learning With Errors (LWE) puro

**Trade-off**:
- ✅ Más conservador
- ❌ Claves MÁS GRANDES (~15 KB)

### Classic McEliece

**Status**: Alternate
**Basado en**: Error-correcting codes

**Trade-off**:
- ✅ Muy maduro (40+ años)
- ❌ Claves ENORMES (>200 KB)

### HQC (Hamming Quasi-Cyclic)

**Status**: Alternate
**Basado en**: Codes

**Trade-off**:
- ✅ Balance código/tamaño
- ❌ Menos estudiado

---

## Tabla Comparativa Completa

| Algoritmo | Tipo | Base | Clave Pub | Firma/CT | Velocidad | Status |
|-----------|------|------|-----------|----------|-----------|--------|
| **ML-KEM-768** | KEM | Lattice | 1.2 KB | 1 KB | Rápido | ✅ FIPS 203 |
| **ML-DSA-65** | Sig | Lattice | 2 KB | 3.3 KB | Rápido | ✅ FIPS 204 |
| **Falcon-512** | Sig | Lattice | 0.9 KB | 0.7 KB | Medio | ✅ FIPS 206 |
| **SLH-DSA-128f** | Sig | Hash | 32 bytes | 7.8 KB | Lento | ✅ FIPS 205 |
| FrodoKEM-976 | KEM | LWE | 15.6 KB | 15.7 KB | Lento | ⚠️ Alternate |
| McEliece | KEM | Code | 261 KB | 128 bytes | Rápido | ⚠️ Alternate |

---

## Recomendaciones de Uso

### Propósito General
✅ **ML-KEM-768** + **ML-DSA-65**
- Balance óptimo
- Amplio soporte
- Rendimiento excelente

### Ultra-Conservador
✅ **FrodoKEM** + **SLH-DSA**
- Máxima confianza
- Aceptar tamaños grandes

### Restricciones de Ancho de Banda
✅ **ML-KEM-512** + **Falcon-512**
- Firmas más pequeñas
- Nivel seguridad aceptable

### Híbrido (Transición)
✅ **X25519+ML-KEM-768** (KEM)
✅ **Ed25519+ML-DSA-65** (Firmas)
- Protección doble
- Compatibilidad

---

[⬅️ Anterior: Amenaza](./01_amenaza_cuantica.md) | [➡️ Siguiente: Implementación](./03_implementacion_pqc.md)
