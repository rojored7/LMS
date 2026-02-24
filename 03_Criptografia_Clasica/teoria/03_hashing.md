# 3.3 FUNCIONES HASH Y MACs

## Funciones Hash Criptográficas

### Propiedades

1. **Preimage Resistance**: Dado h, encontrar m tal que hash(m)=h es difícil
2. **Second Preimage Resistance**: Dado m1, encontrar m2≠m1 con hash(m1)=hash(m2) es difícil
3. **Collision Resistance**: Encontrar cualquier m1≠m2 con hash(m1)=hash(m2) es difícil

### SHA-2 Family

```python
from hashlib import sha256, sha384, sha512

# SHA-256 (256 bits = 32 bytes)
hash256 = sha256(b"message").hexdigest()

# SHA-384
hash384 = sha384(b"message").hexdigest()

# SHA-512
hash512 = sha512(b"message").hexdigest()
```

**Tamaños**:
- SHA-256: 256 bits (recomendado)
- SHA-384: 384 bits
- SHA-512: 512 bits

### SHA-3 (Keccak)

```python
from hashlib import sha3_256, sha3_512

hash = sha3_256(b"message").hexdigest()
```

**Diferencia con SHA-2**: Construcción completamente diferente (sponge construction)

### BLAKE2

```python
from hashlib import blake2b, blake2s

# BLAKE2b (hasta 512 bits)
hash = blake2b(b"message", digest_size=32).hexdigest()

# BLAKE2s (hasta 256 bits)
hash = blake2s(b"message").hexdigest()
```

**Ventajas**:
- Más rápido que SHA-2/SHA-3
- Configurable (tamaño, key, salt)
- Usado en Argon2

---

## MACs (Message Authentication Codes)

### HMAC (Hash-based MAC)

```python
import hmac
from hashlib import sha256

key = b"secret-key"
message = b"important message"

# Crear HMAC
mac = hmac.new(key, message, sha256).hexdigest()

# Verificar
def verify_hmac(key, message, received_mac):
    expected = hmac.new(key, message, sha256).hexdigest()
    return hmac.compare_digest(expected, received_mac)
```

**Construcción**:
```
HMAC(K, m) = H((K ⊕ opad) || H((K ⊕ ipad) || m))
```

### CMAC (Cipher-based MAC)

Basado en block cipher (AES).

```python
from cryptography.hazmat.primitives import cmac
from cryptography.hazmat.primitives.ciphers import algorithms

key = os.urandom(32)
c = cmac.CMAC(algorithms.AES(key))
c.update(b"message")
mac = c.finalize()
```

---

## Password Hashing

### ❌ NO USAR PARA PASSWORDS

```python
# NUNCA hacer esto
password_hash = sha256(password.encode()).hexdigest()
```

**Por qué NO**:
- Demasiado rápido (brute force fácil)
- Sin salt (rainbow tables)
- Sin key stretching

### ✅ bcrypt

```python
import bcrypt

# Hash password
password = b"user_password"
salt = bcrypt.gensalt(rounds=12)  # work factor
hashed = bcrypt.hashpw(password, salt)

# Verificar
if bcrypt.checkpw(password, hashed):
    print("Correcto")
```

**Work factor**: 12-14 recomendado (2024)

### ✅ Argon2 (GANADOR PHC 2015)

```python
from argon2 import PasswordHasher

ph = PasswordHasher()

# Hash
hash = ph.hash("password")

# Verificar
try:
    ph.verify(hash, "password")
    print("Correcto")
except:
    print("Incorrecto")
```

**Parámetros** (defaults seguros):
- time_cost: 2
- memory_cost: 102400 (100 MB)
- parallelism: 8

**Ventajas**:
- Resistente a GPU/ASIC
- Ajustable (tiempo, memoria)
- Recomendado por OWASP

### Comparativa

| Algoritmo | Velocidad | Memoria | GPU Resist | Recomendado |
|-----------|-----------|---------|------------|-------------|
| MD5 | Muy rápido | Baja | ❌ | ❌ NUNCA |
| SHA-256 | Rápido | Baja | ❌ | ❌ NO passwords |
| bcrypt | Lento | Media | ⚠️ Parcial | ✅ Aceptable |
| scrypt | Lento | Alta | ✅ | ✅ Bueno |
| Argon2 | Configurable | Alta | ✅ | ✅ MEJOR |

---

## Casos de Uso

### Integridad de Archivos

```python
import hashlib

def file_hash(filename):
    sha256_hash = hashlib.sha256()
    with open(filename, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

# Uso
checksum = file_hash("archivo.iso")
```

### Merkle Trees (Blockchain)

```
      Root Hash
       /    \
    H(AB)   H(CD)
    / \      / \
  H(A) H(B) H(C) H(D)
   |    |    |    |
   A    B    C    D
```

### Content-Addressable Storage

```python
# Git, IPFS usan hashes como IDs
content_id = sha256(data).hexdigest()
storage[content_id] = data
```

---

## Ataques y Defensas

### Length Extension Attack (SHA-256, SHA-512)

**Vulnerable**:
```
Si conoces hash(secret || message)
Puedes calcular hash(secret || message || extra)
¡Sin conocer secret!
```

**Defensa**: Usar HMAC (no hash directo)

### Collision Attacks

**SHA-1**: ROTO (2017, SHAttered attack)
**MD5**: ROTO (desde 2004)
**SHA-256**: ✅ Seguro

### Rainbow Tables

**Ataque**: Tabla precalculada de hashes
**Defensa**: Salt único por password

```python
# Con salt
salt = os.urandom(16)
hash = argon2.hash(password + salt)
# Almacenar: (salt, hash)
```

---

## Mejores Prácticas

### Hashing General
✅ SHA-256 (mínimo)
✅ SHA-3 o BLAKE2 (alternativas)
✅ Verificar integridad con hash + firma
❌ NO MD5 (roto)
❌ NO SHA-1 (roto)

### Password Hashing
✅ Argon2id (mejor opción)
✅ bcrypt (alternativa aceptable)
✅ Salt único por password
✅ Work factor alto (lento = seguro)
❌ NO SHA-256 simple
❌ NO MD5
❌ NO almacenar passwords en texto plano

### MACs
✅ HMAC-SHA256
✅ AEAD cuando sea posible (GCM)
✅ Constant-time comparison
❌ NO comparación simple (timing attack)

---

[⬅️ Anterior: Asimétrico](./02_cifrado_asimetrico.md) | [➡️ Siguiente: Labs](../laboratorios/)
