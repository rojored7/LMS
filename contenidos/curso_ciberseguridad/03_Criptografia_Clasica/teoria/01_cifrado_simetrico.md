# 3.1 CIFRADO SIMÉTRICO

**Duración**: 45 minutos

---

## AES (Advanced Encryption Standard)

### Historia

```
1997: NIST convoca competencia para reemplazar DES
2000: Rijndael gana
2001: Estandarizado como AES (FIPS 197)
```

### Características

**Tamaños de clave**:
- AES-128: 128 bits (10 rondas)
- AES-192: 192 bits (12 rondas)
- AES-256: 256 bits (14 rondas)

**Tamaño de bloque**: 128 bits (16 bytes)

### Funcionamiento de AES

**Estructura de rondas**:
```
1. AddRoundKey
2. SubBytes (S-box)
3. ShiftRows
4. MixColumns
5. AddRoundKey
[Repetir]
```

**Última ronda**: Sin MixColumns

### Modos de Operación

#### ECB (Electronic Codebook) ❌ INSEGURO

```python
# Cada bloque cifrado independientemente
C1 = E(K, P1)
C2 = E(K, P2)
```

**Problema**: Patrones visibles

```
Imagen original → AES-ECB → Patrones reconocibles
```

#### CBC (Cipher Block Chaining) ⚠️ Cuidado

```
IV
↓
C1 = E(K, P1 ⊕ IV)
C2 = E(K, P2 ⊕ C1)
```

**Ventaja**: Patrones ocultos
**Desventaja**: Requiere padding, vulnerable a padding oracle

#### GCM (Galois/Counter Mode) ✅ RECOMENDADO

```
Cifrado + Autenticación en una operación
```

**Ventajas**:
- AEAD (Authenticated Encryption with Associated Data)
- Paralelizable
- Rápido
- No requiere padding

**Uso**:
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

nonce = os.urandom(12)  # 96 bits
ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
```

#### CTR (Counter Mode)

```
Convierte block cipher en stream cipher
```

**Ventaja**: Paralelizable, no padding
**Uso**: Con HMAC para autenticación

---

## ChaCha20-Poly1305

**Alternative moderna a AES-GCM**

**Ventajas**:
- Más rápido en software (sin AES-NI)
- Resistente a timing attacks
- AEAD nativo

**Uso**: TLS 1.3, VPNs (WireGuard)

```python
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

key = ChaCha20Poly1305.generate_key()
chacha = ChaCha20Poly1305(key)

nonce = os.urandom(12)
ciphertext = chacha.encrypt(nonce, plaintext, associated_data)
```

---

## Gestión de Claves Simétricas

### Generación

```python
import os

# Criptográficamente seguro
key = os.urandom(32)  # 256 bits
```

❌ **NO USAR**:
```python
import random
key = random.randbytes(32)  # NO seguro!
```

### Almacenamiento

✅ **Mejores prácticas**:
- HSM (Hardware Security Module)
- Key Wrapping
- KMS (Key Management Service)
- Encrypted at rest

❌ **NUNCA**:
- Hardcode en código fuente
- En variables de entorno (producción)
- En archivos sin cifrar

### Derivación de Claves

**PBKDF2**:
```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=480000,  # OWASP 2023
)
key = kdf.derive(password)
```

**HKDF** (para diversificación):
```python
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

hkdf = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=b'application-specific',
)
key = hkdf.derive(master_key)
```

---

## Padding

### PKCS#7 Padding

```
Plaintext: "HELLO" (5 bytes)
Block size: 16 bytes
Padding: 11 bytes con valor 0x0B

Result: "HELLO\x0B\x0B\x0B\x0B\x0B\x0B\x0B\x0B\x0B\x0B\x0B"
```

**Si plaintext = múltiplo de block size**:
- Añadir bloque completo de padding

### Padding Oracle Attack

**Vulnerabilidad**: Oracle revela si padding es válido

**Mitigación**: Usar AEAD (GCM, ChaCha20-Poly1305)

---

## Comparativa de Algoritmos

| Algoritmo | Clave | Bloque | Modo AEAD | Velocidad | Status |
|-----------|-------|--------|-----------|-----------|--------|
| AES-256-GCM | 256 | 128 | ✅ | Muy rápido (AES-NI) | ✅ Recomendado |
| ChaCha20-Poly1305 | 256 | Stream | ✅ | Rápido (software) | ✅ Recomendado |
| AES-256-CBC | 256 | 128 | ❌ | Rápido | ⚠️ Con HMAC |
| 3DES | 168 | 64 | ❌ | Lento | ❌ Deprecado |
| RC4 | Variable | Stream | ❌ | Rápido | ❌ ROTO |

---

## Implementación Segura

### Ejemplo Completo (Python)

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class SecureEncryption:
    def __init__(self):
        self.key = AESGCM.generate_key(bit_length=256)
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, plaintext: bytes, associated_data: bytes = b'') -> tuple:
        """Cifrar con AES-256-GCM"""
        nonce = os.urandom(12)  # 96 bits
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, associated_data)
        return (nonce, ciphertext)

    def decrypt(self, nonce: bytes, ciphertext: bytes,
                associated_data: bytes = b'') -> bytes:
        """Descifrar y verificar autenticación"""
        try:
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, associated_data)
            return plaintext
        except Exception as e:
            raise ValueError("Autenticación falló o datos corruptos")

# Uso
enc = SecureEncryption()
nonce, ciphertext = enc.encrypt(b"Secret message")
plaintext = enc.decrypt(nonce, ciphertext)
```

---

## Mejores Prácticas

✅ **DO**:
- Usar AES-256-GCM o ChaCha20-Poly1305
- Generar nonce/IV únicos por mensaje
- Usar AEAD (autenticación + cifrado)
- Rotar claves regularmente
- Usar KDF para derivar de password

❌ **DON'T**:
- Reusar nonce con misma clave
- Usar ECB mode
- Cifrar sin autenticar (⚠️ Encrypt-then-MAC si no AEAD)
- Hardcode claves
- Usar algoritmos deprecados (DES, 3DES, RC4)

---

[⬅️ Anterior](../README.md) | [➡️ Siguiente: Cifrado Asimétrico](./02_cifrado_asimetrico.md)
