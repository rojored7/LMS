# LAB 03.2: RSA - GENERACIÓN Y USO

**Duración**: 45 minutos

---

## Generación de Claves RSA

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

# Generar par de claves RSA-4096
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=4096,
)
public_key = private_key.public_key()

# Guardar clave privada (cifrada con password)
pem_private = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.BestAvailableEncryption(b'password123')
)
with open('private_key.pem', 'wb') as f:
    f.write(pem_private)

# Guardar clave pública
pem_public = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)
with open('public_key.pem', 'wb') as f:
    f.write(pem_public)
```

---

## Cifrado y Descifrado

```python
# Cifrar mensaje
message = b"Mensaje confidencial"
ciphertext = public_key.encrypt(
    message,
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
```

---

## Firmas Digitales

```python
# Firmar
document = b"Contrato importante"
signature = private_key.sign(
    document,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)

# Verificar
try:
    public_key.verify(
        signature,
        document,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    print("✅ Firma válida")
except:
    print("❌ Firma inválida")
```

---

## Entregables

- Par de claves RSA-4096
- Demo de cifrado/descifrado
- Demo de firma digital

---

[⬅️ Anterior](../lab_01_aes/) | [➡️ Siguiente](../lab_03_ecc/)
