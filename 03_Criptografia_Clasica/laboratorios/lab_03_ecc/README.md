# LAB 03.3: ECC - Ed25519 y X25519

**Duración**: 45 minutos

---

## Ed25519 - Firmas Digitales

```python
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Generar clave
private_key = ed25519.Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Firmar
message = b"Mensaje a firmar"
signature = private_key.sign(message)

# Verificar
try:
    public_key.verify(signature, message)
    print("✅ Firma válida")
except:
    print("❌ Firma inválida")

# Guardar claves
with open('ed25519_private.pem', 'wb') as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ))
```

---

## X25519 - Key Exchange (ECDH)

```python
from cryptography.hazmat.primitives.asymmetric import x25519

# Alice
alice_private = x25519.X25519PrivateKey.generate()
alice_public = alice_private.public_key()

# Bob
bob_private = x25519.X25519PrivateKey.generate()
bob_public = bob_private.public_key()

# Shared secret (ambos obtienen el mismo)
shared_alice = alice_private.exchange(bob_public)
shared_bob = bob_private.exchange(alice_public)

assert shared_alice == shared_bob
print(f"Shared secret: {shared_alice.hex()}")

# Derivar clave AES
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

key = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=b'handshake data',
).derive(shared_alice)
```

---

## Benchmark: RSA vs Ed25519

```python
import time

# RSA
start = time.time()
for _ in range(100):
    rsa_private = rsa.generate_private_key(65537, 2048)
    sig = rsa_private.sign(b"msg", padding.PSS(...), hashes.SHA256())
rsa_time = time.time() - start

# Ed25519
start = time.time()
for _ in range(100):
    ed_private = ed25519.Ed25519PrivateKey.generate()
    sig = ed_private.sign(b"msg")
ed_time = time.time() - start

print(f"RSA: {rsa_time:.2f}s")
print(f"Ed25519: {ed_time:.2f}s")
print(f"Ed25519 es {rsa_time/ed_time:.1f}x más rápido")
```

---

## Entregables

- Implementación Ed25519
- Implementación X25519 ECDH
- Benchmark comparativo

---

[⬅️ Anterior](../lab_02_rsa/) | [➡️ Siguiente](../lab_04_ataques/)
