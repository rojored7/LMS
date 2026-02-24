# 6.1 JOSE: JWS, JWE, JWT

## JSON Object Signing and Encryption (JOSE)

### Familia de estándares

- **JWS** (RFC 7515): JSON Web Signature
- **JWE** (RFC 7516): JSON Web Encryption
- **JWK** (RFC 7517): JSON Web Key
- **JWA** (RFC 7518): JSON Web Algorithms
- **JWT** (RFC 7519): JSON Web Token

---

## JWS (JSON Web Signature)

### Estructura

```
header.payload.signature
```

**Ejemplo**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

### Algoritmos Soportados

**HMAC** (simétrico):
- HS256 (HMAC-SHA256)
- HS384
- HS512

**RSA** (asimétrico):
- RS256 (RSA-SHA256)
- RS384
- RS512
- PS256 (RSA-PSS-SHA256)

**ECDSA** (asimétrico):
- ES256 (ECDSA-P256-SHA256)
- ES384
- ES512

**EdDSA**:
- EdDSA (Ed25519)

### Implementación Python

```python
from jose import jws
import json

# Payload
payload = json.dumps({"user": "alice", "role": "admin"})

# Firmar con HMAC
secret = "your-256-bit-secret"
token = jws.sign(payload, secret, algorithm='HS256')

# Verificar
verified_payload = jws.verify(token, secret, algorithms=['HS256'])
```

```python
# Con RSA
from cryptography.hazmat.primitives.asymmetric import rsa

private_key = rsa.generate_private_key(65537, 2048)
public_key = private_key.public_key()

# Firmar
token = jws.sign(payload, private_key, algorithm='RS256')

# Verificar
verified = jws.verify(token, public_key, algorithms=['RS256'])
```

---

## JWE (JSON Web Encryption)

### Estructura

```
header.encrypted_key.iv.ciphertext.tag
```

### Algoritmos

**Content Encryption (enc)**:
- A128GCM, A192GCM, A256GCM

**Key Encryption (alg)**:
- RSA-OAEP
- RSA-OAEP-256
- ECDH-ES
- ECDH-ES+A256KW
- dir (direct symmetric)

### Implementación

```python
from jose import jwe

# Payload
plaintext = b"Confidential message"

# Cifrar (RSA-OAEP + AES-256-GCM)
token = jwe.encrypt(plaintext, public_key,
                    algorithm='RSA-OAEP',
                    encryption='A256GCM')

# Descifrar
decrypted = jwe.decrypt(token, private_key)
```

---

## JWT (JSON Web Tokens)

### Claims Estándar

```json
{
  "iss": "issuer",          // Emisor
  "sub": "subject",         // Usuario
  "aud": "audience",        // Destinatario
  "exp": 1735686400,        // Expiración (Unix timestamp)
  "nbf": 1735600000,        // Not Before
  "iat": 1735600000,        // Issued At
  "jti": "unique-id"        // JWT ID (anti-replay)
}
```

### Ejemplo Completo (Autenticación)

```python
from jose import jwt
from datetime import datetime, timedelta

# Crear JWT
payload = {
    "sub": "user123",
    "name": "Alice",
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(hours=1),
    "iat": datetime.utcnow()
}

secret = "your-secret-key"
token = jwt.encode(payload, secret, algorithm='HS256')

# Verificar y decodificar
try:
    decoded = jwt.decode(token, secret, algorithms=['HS256'])
    print(f"Usuario: {decoded['sub']}")
except jwt.ExpiredSignatureError:
    print("Token expirado")
except jwt.JWTClaimsError:
    print("Claims inválidos")
except jwt.JWTError:
    print("Token inválido")
```

### Refresh Tokens

```python
# Access token (corta duración)
access_token = jwt.encode({
    "sub": "user123",
    "exp": datetime.utcnow() + timedelta(minutes=15)
}, secret)

# Refresh token (larga duración)
refresh_token = jwt.encode({
    "sub": "user123",
    "type": "refresh",
    "exp": datetime.utcnow() + timedelta(days=30)
}, secret)

# Renovar access token
def refresh_access(refresh_token):
    try:
        payload = jwt.decode(refresh_token, secret)
        if payload.get('type') != 'refresh':
            raise ValueError("Not a refresh token")

        new_access = jwt.encode({
            "sub": payload['sub'],
            "exp": datetime.utcnow() + timedelta(minutes=15)
        }, secret)

        return new_access
    except:
        raise
```

---

## Mejores Prácticas

### JWS/JWT
✅ Usar algoritmos fuertes (RS256, ES256, EdDSA)
✅ Validar `exp`, `iat`, `nbf`
✅ Validar `aud` e `iss`
✅ Usar HTTPS siempre
✅ Tokens cortos (15-60 min)
✅ Refresh tokens para renovación
❌ NO algoritmo "none"
❌ NO almacenar datos sensibles en payload (es Base64, no cifrado)
❌ NO tokens sin expiración

### JWE
✅ AES-256-GCM para contenido
✅ RSA-OAEP o ECDH-ES para clave
✅ Combinar JWS+JWE si necesario
❌ NO algoritmos débiles

---

[⬅️ Volver](../README.md) | [➡️ Siguiente: Streaming](./02_streaming.md)
