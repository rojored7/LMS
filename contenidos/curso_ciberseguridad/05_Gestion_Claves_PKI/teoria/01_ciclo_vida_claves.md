# 5.1 CICLO DE VIDA DE CLAVES

## Fases del Ciclo

### 1. GENERACIÓN
```python
# Criptográficamente seguro
key = os.urandom(32)  # 256 bits

# RSA
private_key = rsa.generate_private_key(65537, 4096)

# Ed25519
private_key = ed25519.Ed25519PrivateKey.generate()
```

**Requisitos**:
- RNG criptográficamente seguro
- Entropía suficiente
- Tamaño apropiado

### 2. ALMACENAMIENTO

**Opciones**:
- HSM (Hardware Security Module)
- TPM (Trusted Platform Module)
- Software keystores (PKCS#11, PKCS#12)
- Cloud KMS (AWS KMS, Azure Key Vault)

```python
# PKCS#12 (protegido con password)
from cryptography.hazmat.primitives import serialization

pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.BestAvailableEncryption(b'password')
)
```

### 3. DISTRIBUCIÓN

**Canales seguros**:
- Out-of-band (físico)
- TLS con certificados
- Key wrapping
- Certificate enrollment

### 4. ROTACIÓN

```python
# Estrategia de rotación
def rotate_key(old_key, data_encrypted):
    # 1. Generar nueva clave
    new_key = generate_new_key()

    # 2. Re-cifrar datos
    plaintext = decrypt(old_key, data_encrypted)
    new_encrypted = encrypt(new_key, plaintext)

    # 3. Actualizar referencias
    update_key_reference(new_key)

    # 4. Marcar old_key como deprecada
    deprecate_key(old_key)

    # 5. Programar destrucción de old_key
    schedule_destruction(old_key, days=30)
```

**Frecuencia recomendada**:
- TLS session keys: Por sesión
- Encryption keys: 90 días - 1 año
- Signing keys: 1-3 años
- Root CA: 10-25 años

### 5. REVOCACIÓN

**CRL (Certificate Revocation List)**:
```bash
openssl ca -revoke cert.pem -keyfile ca-key.pem -cert ca-cert.pem
openssl ca -gencrl -out crl.pem
```

**OCSP (Online Certificate Status Protocol)**:
```bash
openssl ocsp -issuer ca-cert.pem -cert user-cert.pem \
  -url http://ocsp.example.com -resp_text
```

### 6. DESTRUCCIÓN

```python
# Sobrescribir memoria
import ctypes

def secure_delete(key_bytes):
    # Sobrescribir con ceros
    ctypes.memset(id(key_bytes), 0, len(key_bytes))
    # Sobrescribir con aleatorio
    for i in range(3):
        random_bytes = os.urandom(len(key_bytes))
        key_bytes = random_bytes
    # Garbage collection
    del key_bytes
```

---

## Key Derivation Functions (KDF)

### PBKDF2
```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=os.urandom(16),
    iterations=480000,  # OWASP 2023
)
key = kdf.derive(password.encode())
```

### HKDF
```python
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

hkdf = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=b'application context',
)
derived_key = hkdf.derive(master_key)
```

---

## HSM (Hardware Security Module)

**Ventajas**:
- Claves nunca salen del dispositivo
- Tamper-resistant
- FIPS 140-2/3 validated
- Generación de claves hardware

**Proveedores**:
- Thales Luna
- nCipher
- AWS CloudHSM
- Azure Dedicated HSM

---

## Mejores Prácticas

✅ Rotar claves regularmente
✅ Separar claves por entorno (dev/staging/prod)
✅ Principio de mínimo privilegio
✅ Auditar accesos
✅ Backup cifrado de claves
✅ Destrucción segura
❌ NO hardcode en código
❌ NO compartir claves privadas
❌ NO usar claves débiles
❌ NO almacenar plaintext

---

[⬅️ Volver](../README.md) | [➡️ Siguiente: PKI](./02_pki.md)
