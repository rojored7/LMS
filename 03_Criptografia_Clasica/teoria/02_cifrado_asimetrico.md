# 3.2 CIFRADO ASIMÉTRICO

## RSA (Rivest-Shamir-Adleman)

### Matemática Subyacente

```
1. Elegir dos primos grandes: p, q
2. Calcular n = p × q
3. Calcular φ(n) = (p-1)(q-1)
4. Elegir e (exponente público): 1 < e < φ(n), gcd(e,φ(n))=1
5. Calcular d (exponente privado): d × e ≡ 1 (mod φ(n))

Clave pública: (n, e)
Clave privada: (n, d)
```

### Cifrado y Descifrado

```
Cifrado: c = m^e mod n
Descifrado: m = c^d mod n
```

### Firmas Digitales RSA

```
Firma: s = hash(m)^d mod n
Verificación: hash(m) == s^e mod n
```

### Tamaños de Clave

- RSA-1024: ❌ INSEGURO (factorizable)
- RSA-2048: ✅ Mínimo recomendado
- RSA-3072: ✅ Equivalente a AES-128
- RSA-4096: ✅ Máxima seguridad clásica

### Generación con OpenSSL

```bash
# Generar clave privada RSA-4096
openssl genrsa -out private.pem 4096

# Extraer clave pública
openssl rsa -in private.pem -pubout -out public.pem

# Cifrar
openssl rsautl -encrypt -pubin -inkey public.pem -in plain.txt -out cipher.bin

# Descifrar
openssl rsautl -decrypt -inkey private.pem -in cipher.bin -out plain.txt
```

### Python Implementation

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

# Generar par de claves
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=4096,
)
public_key = private_key.public_key()

# Cifrar
ciphertext = public_key.encrypt(
    plaintext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Descifrar
plaintext = private_key.decrypt(
    ciphertext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Firmar
signature = private_key.sign(
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)

# Verificar
public_key.verify(
    signature,
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)
```

---

## ECC (Elliptic Curve Cryptography)

### Ventajas sobre RSA

| Feature | RSA-3072 | ECC-256 |
|---------|----------|---------|
| Seguridad | AES-128 equiv | AES-128 equiv |
| Tamaño clave | 3072 bits | 256 bits |
| Velocidad | Lento | Rápido |
| Tamaño firma | Grande | Pequeño |

### Curvas Recomendadas

**NIST Curves**:
- P-256 (secp256r1): ✅ Ampliamente soportado
- P-384 (secp384r1): ✅ Mayor seguridad
- P-521 (secp521r1): ✅ Máxima seguridad

**SafeCurves (más seguras)**:
- Curve25519: ✅ Recomendado (ECDH)
- Ed25519: ✅ Recomendado (firmas)

### ECDSA (Elliptic Curve Digital Signature Algorithm)

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes

# Generar clave
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# Firmar
signature = private_key.sign(
    message,
    ec.ECDSA(hashes.SHA256())
)

# Verificar
public_key.verify(
    signature,
    message,
    ec.ECDSA(hashes.SHA256())
)
```

### Ed25519 (Edwards-curve Digital Signature Algorithm)

```python
from cryptography.hazmat.primitives.asymmetric import ed25519

# Generar
private_key = ed25519.Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Firmar (más simple que ECDSA)
signature = private_key.sign(message)

# Verificar
public_key.verify(signature, message)
```

**Ventajas Ed25519**:
- Más rápido que ECDSA
- Más seguro (curva más robusta)
- Firmas determinísticas
- Sin necesidad de RNG durante firma

### X25519 (ECDH con Curve25519)

```python
from cryptography.hazmat.primitives.asymmetric import x25519

# Alice genera clave
alice_private = x25519.X25519PrivateKey.generate()
alice_public = alice_private.public_key()

# Bob genera clave
bob_private = x25519.X25519PrivateKey.generate()
bob_public = bob_private.public_key()

# Shared secret (ambos obtienen el mismo)
shared_alice = alice_private.exchange(bob_public)
shared_bob = bob_private.exchange(alice_public)
# shared_alice == shared_bob
```

---

## Comparativa RSA vs ECC

| Aspecto | RSA-4096 | Ed25519 |
|---------|----------|---------|
| Generación clave | Lento | Muy rápido |
| Firma | Lento | Muy rápido |
| Verificación | Rápido | Muy rápido |
| Tamaño clave pública | 512 bytes | 32 bytes |
| Tamaño firma | 512 bytes | 64 bytes |
| Seguridad postcuántica | ❌ ROTO | ❌ ROTO |
| Soporte actual | Universal | Amplio (SSH, TLS) |

---

## Diffie-Hellman (DH)

### Problema Matemático

```
Problema del logaritmo discreto:
Dado g, p, y = g^x mod p
Encontrar x es difícil
```

### Intercambio de Claves

```
Públicos: g (generador), p (primo grande)

Alice:
- Genera a (secreto)
- Calcula A = g^a mod p
- Envía A a Bob

Bob:
- Genera b (secreto)
- Calcula B = g^b mod p
- Envía B a Alice

Shared Secret:
Alice: s = B^a mod p = g^(ab) mod p
Bob:   s = A^b mod p = g^(ab) mod p
```

### ECDH (Elliptic Curve Diffie-Hellman)

Mismo concepto pero sobre curvas elípticas (más eficiente).

---

## Mejores Prácticas

### RSA
✅ Mínimo 2048 bits (preferible 4096)
✅ OAEP padding para cifrado
✅ PSS padding para firmas
✅ Exponent = 65537
❌ NO PKCS#1 v1.5 (vulnerable)
❌ NO RSA key exchange (no PFS)

### ECC
✅ Curve25519 / Ed25519 (preferido)
✅ NIST P-256+ si se requiere compatibilidad
✅ ECDHE para key exchange (PFS)
❌ NO curvas débiles (secp256k1 para crypto)
❌ NO reusar nonce en ECDSA

---

[⬅️ Anterior: Simétrico](./01_cifrado_simetrico.md) | [➡️ Siguiente: Hashing](./03_hashing.md)
