# Estándar JOSE Completo: JWK, JWA, JWT, JWE y Arquitectura

## Índice
1. [Introducción al Ecosistema JOSE](#introducción)
2. [JWK - JSON Web Key (RFC 7517)](#jwk)
3. [JWA - JSON Web Algorithms (RFC 7518)](#jwa)
4. [JWT - JSON Web Token Deep Dive](#jwt-deep-dive)
5. [JWE - JSON Web Encryption](#jwe)
6. [Nested JWT](#nested-jwt)
7. [Detached Content](#detached-content)
8. [Mejores Prácticas de Implementación](#mejores-practicas)
9. [Referencias](#referencias)

---

## Introducción al Ecosistema JOSE {#introducción}

**JOSE** (JavaScript Object Signing and Encryption) es un conjunto de estándares del IETF que define formatos compactos y seguros para representar tokens, claves criptográficas y algoritmos en JSON.

### Componentes del Ecosistema JOSE

| RFC | Estándar | Propósito |
|-----|----------|-----------|
| **RFC 7515** | JWS (JSON Web Signature) | Firmar contenido JSON |
| **RFC 7516** | JWE (JSON Web Encryption) | Encriptar contenido JSON |
| **RFC 7517** | JWK (JSON Web Key) | Representar claves criptográficas en JSON |
| **RFC 7518** | JWA (JSON Web Algorithms) | Definir algoritmos criptográficos |
| **RFC 7519** | JWT (JSON Web Token) | Tokens de identidad y claims |
| **RFC 7520** | JOSE Cookbook | Ejemplos prácticos |

### Casos de Uso Principales

- **Autenticación y Autorización**: OAuth 2.0, OpenID Connect
- **APIs RESTful**: Bearer tokens, API keys firmados
- **Microservicios**: Propagación de identidad entre servicios
- **Single Sign-On (SSO)**: Tokens de sesión distribuidos
- **Data Encryption**: Protección de datos sensibles en tránsito/reposo

---

## JWK - JSON Web Key (RFC 7517) {#jwk}

JWK proporciona una representación estándar de claves criptográficas en formato JSON, facilitando la interoperabilidad entre plataformas.

### Estructura de un JWK

Un JWK es un objeto JSON con parámetros que describen la clave y su uso.

#### Parámetros Comunes

| Parámetro | Descripción | Requerido |
|-----------|-------------|-----------|
| `kty` | Key Type (RSA, EC, oct, OKP) | Sí |
| `use` | Public Key Use (sig, enc) | No |
| `key_ops` | Key Operations (sign, verify, encrypt, decrypt) | No |
| `alg` | Algorithm intended for use with the key | No |
| `kid` | Key ID (identificador único) | No |

### JWK para Claves RSA

```json
{
  "kty": "RSA",
  "use": "sig",
  "kid": "2024-01-rsa-key",
  "alg": "RS256",
  "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
  "e": "AQAB"
}
```

**Parámetros RSA específicos**:
- `n`: Módulo (codificado en Base64URL)
- `e`: Exponente público (típicamente `AQAB` = 65537)
- `d`: Exponente privado (solo en claves privadas)
- `p`, `q`, `dp`, `dq`, `qi`: Valores de optimización CRT (opcional)

### JWK para Claves de Curva Elíptica (EC)

```json
{
  "kty": "EC",
  "crv": "P-256",
  "use": "sig",
  "kid": "2024-01-ec-key",
  "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGl96oc0CWuis",
  "y": "y77t-RvAHRKTsSGdIYUfweuOvwrvDD-Q3Hv5J0fSKbE",
  "d": "Hs8Y9lNe4Sg5Eb0L5RkR7R3bQlvWqYCmOqnbV2LmVm0"
}
```

**Parámetros EC específicos**:
- `crv`: Curva elíptica (P-256, P-384, P-521, secp256k1)
- `x`: Coordenada X del punto público
- `y`: Coordenada Y del punto público
- `d`: Valor de clave privada (solo en claves privadas)

### JWK para Claves Simétricas (oct)

```json
{
  "kty": "oct",
  "use": "enc",
  "kid": "aes-256-key-2024",
  "alg": "A256GCM",
  "k": "GawgguFyGrWKav7AX4VKUg"
}
```

**Parámetros oct específicos**:
- `k`: Valor de la clave simétrica (Base64URL)

### JWK para Claves EdDSA (OKP - Octet Key Pairs)

```json
{
  "kty": "OKP",
  "crv": "Ed25519",
  "use": "sig",
  "kid": "ed25519-2024",
  "x": "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"
}
```

**Curvas soportadas**:
- `Ed25519`: Firmas EdDSA (recomendado)
- `Ed448`: Firmas EdDSA de mayor seguridad
- `X25519`: ECDH para intercambio de claves
- `X448`: ECDH de mayor seguridad

### JWK Set (JWKS)

Un **JWKS** es un conjunto de JWKs, típicamente expuesto en un endpoint público para validación de firmas.

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-rsa-primary",
      "alg": "RS256",
      "n": "0vx7ag...",
      "e": "AQAB"
    },
    {
      "kty": "EC",
      "use": "sig",
      "kid": "2024-ec-backup",
      "crv": "P-256",
      "x": "WKn-ZI...",
      "y": "y77t-R..."
    }
  ]
}
```

**Endpoint típico**: `https://auth.example.com/.well-known/jwks.json`

### Key Operations (key_ops)

Define operaciones permitidas con la clave:

```json
{
  "kty": "RSA",
  "key_ops": ["sign", "verify"],
  "kid": "signing-key-001"
}
```

**Operaciones estándar**:
- `sign`: Crear firmas digitales
- `verify`: Verificar firmas digitales
- `encrypt`: Encriptar contenido
- `decrypt`: Desencriptar contenido
- `wrapKey`: Encriptar claves simétricas
- `unwrapKey`: Desencriptar claves simétricas
- `deriveKey`: Derivar claves (ECDH)
- `deriveBits`: Derivar bits (ECDH)

### JWK Thumbprint (RFC 7638)

Un thumbprint es un hash único de una JWK, útil para comparación y referencia.

```python
import json
import hashlib
import base64

def jwk_thumbprint(jwk, hash_alg='sha256'):
    # Solo incluir parámetros requeridos en orden lexicográfico
    if jwk['kty'] == 'RSA':
        required = {'e': jwk['e'], 'kty': jwk['kty'], 'n': jwk['n']}
    elif jwk['kty'] == 'EC':
        required = {'crv': jwk['crv'], 'kty': jwk['kty'],
                    'x': jwk['x'], 'y': jwk['y']}

    # Serializar sin espacios
    json_str = json.dumps(required, separators=(',', ':'), sort_keys=True)

    # Hash SHA-256
    hash_obj = hashlib.sha256(json_str.encode('utf-8'))
    thumbprint = base64.urlsafe_b64encode(hash_obj.digest()).rstrip(b'=')

    return thumbprint.decode('utf-8')

# Ejemplo
jwk = {
    "kty": "RSA",
    "n": "0vx7agoebGc...",
    "e": "AQAB"
}
print(jwk_thumbprint(jwk))  # Output: NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs
```

---

## JWA - JSON Web Algorithms (RFC 7518) {#jwa}

JWA define los algoritmos criptográficos utilizados en JWS, JWE y JWK.

### Algoritmos de Firma Digital (para JWS)

| Algorithm | Descripción | Clave | Seguridad |
|-----------|-------------|-------|-----------|
| **HS256** | HMAC con SHA-256 | Simétrica (256 bits) | 128 bits |
| **HS384** | HMAC con SHA-384 | Simétrica (384 bits) | 192 bits |
| **HS512** | HMAC con SHA-512 | Simétrica (512 bits) | 256 bits |
| **RS256** | RSASSA-PKCS1-v1_5 con SHA-256 | RSA (2048+ bits) | 112 bits |
| **RS384** | RSASSA-PKCS1-v1_5 con SHA-384 | RSA (3072+ bits) | 128 bits |
| **RS512** | RSASSA-PKCS1-v1_5 con SHA-512 | RSA (4096+ bits) | 192 bits |
| **ES256** | ECDSA con P-256 y SHA-256 | EC P-256 | 128 bits |
| **ES384** | ECDSA con P-384 y SHA-384 | EC P-384 | 192 bits |
| **ES512** | ECDSA con P-521 y SHA-512 | EC P-521 | 256 bits |
| **PS256** | RSASSA-PSS con SHA-256 | RSA (2048+ bits) | 128 bits |
| **PS384** | RSASSA-PSS con SHA-384 | RSA (3072+ bits) | 192 bits |
| **PS512** | RSASSA-PSS con SHA-512 | RSA (4096+ bits) | 256 bits |
| **EdDSA** | EdDSA con Ed25519 o Ed448 | OKP | 128/224 bits |
| **none** | Sin firma (INSEGURO, nunca usar) | N/A | 0 bits |

### Algoritmos de Key Management (para JWE)

Estos algoritmos protegen la Content Encryption Key (CEK).

| Algorithm | Descripción | Uso |
|-----------|-------------|-----|
| **RSA1_5** | RSAES-PKCS1-v1_5 | Deprecated (vulnerable a ataques) |
| **RSA-OAEP** | RSAES-OAEP con SHA-1 | Recomendado para RSA |
| **RSA-OAEP-256** | RSAES-OAEP con SHA-256 | Más seguro que RSA-OAEP |
| **A128KW** | AES Key Wrap con 128-bit key | Wrapping de claves simétricas |
| **A192KW** | AES Key Wrap con 192-bit key | Wrapping de claves simétricas |
| **A256KW** | AES Key Wrap con 256-bit key | Wrapping de claves simétricas |
| **dir** | Direct use of shared symmetric key | Clave pre-compartida |
| **ECDH-ES** | ECDH Ephemeral Static | Intercambio de claves EC |
| **ECDH-ES+A128KW** | ECDH-ES con AES-128 Key Wrap | Hybrid EC + AES |
| **ECDH-ES+A192KW** | ECDH-ES con AES-192 Key Wrap | Hybrid EC + AES |
| **ECDH-ES+A256KW** | ECDH-ES con AES-256 Key Wrap | Hybrid EC + AES |
| **A128GCMKW** | AES-GCM Key Wrap con 128-bit key | Authenticated wrapping |
| **A192GCMKW** | AES-GCM Key Wrap con 192-bit key | Authenticated wrapping |
| **A256GCMKW** | AES-GCM Key Wrap con 256-bit key | Authenticated wrapping |
| **PBES2-HS256+A128KW** | Password-based encryption | Derivación de clave desde password |

### Algoritmos de Content Encryption (para JWE)

Estos algoritmos encriptan el contenido (payload).

| Algorithm | Descripción | Clave | Autenticación |
|-----------|-------------|-------|---------------|
| **A128CBC-HS256** | AES-128-CBC + HMAC-SHA-256 | 256 bits | HMAC |
| **A192CBC-HS384** | AES-192-CBC + HMAC-SHA-384 | 384 bits | HMAC |
| **A256CBC-HS512** | AES-256-CBC + HMAC-SHA-512 | 512 bits | HMAC |
| **A128GCM** | AES-128-GCM | 128 bits | GCM |
| **A192GCM** | AES-192-GCM | 192 bits | GCM |
| **A256GCM** | AES-256-GCM | 256 bits | GCM |

**Recomendación**: Preferir algoritmos GCM (autenticación integrada) sobre CBC-HMAC.

### Recomendaciones de Algoritmos por Caso de Uso

```yaml
# Firma digital (JWS)
Microservicios:
  - ES256 (rápido, eficiente, 128-bit security)
  - EdDSA (Ed25519 - más rápido aún)

APIs públicas:
  - RS256 (amplio soporte, interoperabilidad)
  - ES256 (mejor rendimiento)

Shared secret:
  - HS256 (simple, pero requiere clave compartida)

# Encriptación (JWE)
Máxima seguridad:
  - Key Management: RSA-OAEP-256 o ECDH-ES+A256KW
  - Content Encryption: A256GCM

Balance seguridad/rendimiento:
  - Key Management: ECDH-ES+A128KW
  - Content Encryption: A128GCM

Direct encryption (clave pre-compartida):
  - Key Management: dir
  - Content Encryption: A256GCM
```

### Agilidad de Algoritmos

**Diseño para migración futura**:

```python
# Whitelist de algoritmos permitidos
ALLOWED_SIGNATURE_ALGORITHMS = ['ES256', 'RS256', 'EdDSA']
ALLOWED_ENCRYPTION_ALGORITHMS = ['RSA-OAEP-256', 'ECDH-ES+A256KW']

def validate_algorithm(token_header):
    alg = token_header.get('alg')

    if alg not in ALLOWED_SIGNATURE_ALGORITHMS:
        raise ValueError(f"Algorithm {alg} not allowed")

    # Log deprecation warnings
    if alg == 'RS256':
        logger.warning("RS256 is deprecated, migrate to ES256")

    return alg
```

---

## JWT - JSON Web Token Deep Dive {#jwt-deep-dive}

JWT es un estándar para crear tokens de acceso que afirman claims (declaraciones) sobre una entidad.

### Anatomía de un JWT

Un JWT tiene tres partes separadas por puntos (`.`):

```
HEADER.PAYLOAD.SIGNATURE
```

**Ejemplo real**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

#### 1. Header (Decodificado)

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### 2. Payload (Decodificado)

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

#### 3. Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Claims Estándar (Registered Claims)

Definidos en RFC 7519, son opcionales pero recomendados.

| Claim | Descripción | Tipo | Ejemplo |
|-------|-------------|------|---------|
| **iss** | Issuer (quién emitió el token) | String | `"https://auth.example.com"` |
| **sub** | Subject (de quién es el token) | String | `"user@example.com"` o `"1234567890"` |
| **aud** | Audience (para quién es el token) | String o Array | `"https://api.example.com"` |
| **exp** | Expiration Time (cuándo expira) | NumericDate | `1735689600` (timestamp Unix) |
| **nbf** | Not Before (no válido antes de) | NumericDate | `1735689000` |
| **iat** | Issued At (cuándo se emitió) | NumericDate | `1735689000` |
| **jti** | JWT ID (identificador único) | String | `"a4f8c1b2-3d5e-6f7g-8h9i"` (UUID) |

**Ejemplo completo de claims estándar**:

```json
{
  "iss": "https://auth.ejemplo.com",
  "sub": "usuario@ejemplo.com",
  "aud": ["https://api.ejemplo.com", "https://admin.ejemplo.com"],
  "exp": 1735690200,
  "nbf": 1735689600,
  "iat": 1735689600,
  "jti": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
}
```

### Claims Públicos Registrados

Algunos claims adicionales comúnmente usados (registro IANA):

| Claim | Descripción | Uso |
|-------|-------------|-----|
| **name** | Nombre completo | `"Juan Pérez"` |
| **given_name** | Nombre de pila | `"Juan"` |
| **family_name** | Apellido | `"Pérez"` |
| **email** | Correo electrónico | `"juan@ejemplo.com"` |
| **email_verified** | Email verificado | `true` o `false` |
| **phone_number** | Teléfono | `"+34612345678"` |
| **phone_number_verified** | Teléfono verificado | `true` o `false` |
| **picture** | URL de foto de perfil | `"https://ejemplo.com/foto.jpg"` |
| **preferred_username** | Username preferido | `"juanp"` |
| **updated_at** | Última actualización de perfil | `1735689600` |

### Claims Privados (Custom Claims)

Claims específicos de tu aplicación. **Buena práctica**: usar namespacing.

```json
{
  "iss": "https://auth.ejemplo.com",
  "sub": "usuario123",
  "exp": 1735690200,

  // Claims privados con namespace
  "https://ejemplo.com/roles": ["admin", "editor"],
  "https://ejemplo.com/tenant_id": "empresa-xyz",
  "https://ejemplo.com/permissions": [
    "users:read",
    "users:write",
    "billing:read"
  ],
  "https://ejemplo.com/features": {
    "ai_assistant": true,
    "advanced_analytics": false
  }
}
```

**Evitar**:
```json
{
  // Mal - claims sin namespace pueden colisionar con estándares futuros
  "roles": ["admin"],
  "tenant": "xyz",
  "is_premium": true
}
```

### Validación de Claims

**Proceso de validación completo**:

```python
import jwt
import time
from datetime import datetime, timedelta

def validate_jwt(token, secret, allowed_issuers, expected_audience):
    try:
        # Decodificar y validar firma
        decoded = jwt.decode(
            token,
            secret,
            algorithms=['HS256'],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_aud": True,
                "verify_iss": True,
                "require": ["exp", "iat", "iss", "sub"]
            }
        )

        # 1. Validar exp (expiration)
        exp = decoded.get('exp')
        if exp < time.time():
            raise ValueError("Token expired")

        # 2. Validar nbf (not before) con tolerancia de 5 minutos
        nbf = decoded.get('nbf')
        if nbf and nbf > time.time() + 300:
            raise ValueError("Token not yet valid")

        # 3. Validar iat (issued at) - no futuro
        iat = decoded.get('iat')
        if iat > time.time() + 300:  # 5 min tolerancia por clock skew
            raise ValueError("Token issued in the future")

        # 4. Validar iss (issuer) - whitelist
        iss = decoded.get('iss')
        if iss not in allowed_issuers:
            raise ValueError(f"Invalid issuer: {iss}")

        # 5. Validar aud (audience) - exact match o contains
        aud = decoded.get('aud')
        if isinstance(aud, list):
            if expected_audience not in aud:
                raise ValueError(f"Invalid audience: {aud}")
        elif aud != expected_audience:
            raise ValueError(f"Invalid audience: {aud}")

        # 6. Validar jti (anti-replay) - check against blacklist/database
        jti = decoded.get('jti')
        if jti and is_token_revoked(jti):
            raise ValueError("Token has been revoked")

        return decoded

    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")

def is_token_revoked(jti):
    # Check Redis/database for revoked tokens
    # return redis_client.exists(f"revoked:{jti}")
    return False
```

### JWT Lifetime Recommendations

```yaml
Access Tokens:
  - Short-lived: 15 minutes (máximo 1 hora)
  - Use case: API access, microservices
  - No almacenar en localStorage (riesgo XSS)

Refresh Tokens:
  - Long-lived: 7 días a 90 días
  - Use case: Obtener nuevos access tokens
  - Almacenar en httpOnly, secure cookies
  - Rotation on each use (revoke old refresh token)

ID Tokens (OpenID Connect):
  - Short-lived: 5-15 minutos
  - Use case: User information, SSO
  - Típicamente no se almacenan

One-Time Tokens:
  - Very short-lived: 5-10 minutos
  - Use case: Email verification, password reset
  - Single use only (revoke after consumption)
```

---

## JWE - JSON Web Encryption {#jwe}

JWE proporciona encriptación de contenido, garantizando **confidencialidad**.

### Estructura de JWE (Compact Serialization)

Un JWE tiene cinco partes separadas por puntos:

```
HEADER.ENCRYPTED_KEY.INITIALIZATION_VECTOR.CIPHERTEXT.AUTHENTICATION_TAG
```

**Ejemplo**:
```
eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.
OKOawDo13gRp2ojaHV7LFpZcgV7T6DVZKTyKOMTYUmKoTCVJRgckCL9kiMT03JGe
ipsEdY3mx_etLbbWSrFr05kLzcSr4qKAq7YN7e9jwQRb23nfa6c9d-StnImGyFDb
Sv04uVuxIp5Zms1gNxKKK2Da14B8S4rzVRltdYwam_lDp5XnZAYpQdb76FdIKLaV
mqgfwX7XWRxv2322i_wD6rp3ZDxnPO-fNH16lw.
48V1_ALb6US04U3b.
5eym8TW_c8SuK0ltJ3rpYIzOeDQz7TALvtu6UG9oMo4vpzs9tX_EFShS8iB7j6ji
SdiwkIr3ajwQzaBtQD_A.
XFBoMYUZodetZdvTiFvSkQ
```

### Componentes de JWE

#### 1. JOSE Header

```json
{
  "alg": "RSA-OAEP-256",   // Algoritmo de key management
  "enc": "A256GCM",         // Algoritmo de content encryption
  "kid": "recipient-key-1"
}
```

#### 2. Encrypted Key (JWE Encrypted Key)

La CEK (Content Encryption Key) encriptada con la clave pública del destinatario.

#### 3. Initialization Vector (IV)

Vector de inicialización para el algoritmo de encriptación simétrica.

#### 4. Ciphertext

El payload encriptado con la CEK.

#### 5. Authentication Tag

Tag de autenticación para verificar integridad (si usa AEAD como GCM).

### Proceso de Encriptación JWE

```
1. Generar CEK (Content Encryption Key) aleatoria
2. Encriptar CEK con la clave pública del destinatario → Encrypted Key
3. Generar IV (Initialization Vector) aleatorio
4. Encriptar el payload con CEK + IV → Ciphertext + Authentication Tag
5. Serializar las 5 partes en formato compacto
```

### Ejemplo de Implementación JWE

#### Encriptación con RSA-OAEP + A256GCM

```python
from jose import jwe
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# 1. Generar par de claves RSA del destinatario
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
public_key = private_key.public_key()

# Serializar clave pública a PEM
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# 2. Payload sensible
payload = {
    "ssn": "123-45-6789",
    "credit_card": "4111111111111111",
    "cvv": "123"
}

# 3. Encriptar con JWE
encrypted_token = jwe.encrypt(
    plaintext=json.dumps(payload).encode('utf-8'),
    key=public_pem,
    algorithm='RSA-OAEP-256',
    encryption='A256GCM'
)

print("JWE Token:", encrypted_token)

# 4. Desencriptar
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivatFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

decrypted = jwe.decrypt(encrypted_token, private_pem)
payload_decrypted = json.loads(decrypted.decode('utf-8'))

print("Decrypted:", payload_decrypted)
```

#### Encriptación con ECDH-ES + A128GCM (Curva Elíptica)

```python
from jose import jwe
from cryptography.hazmat.primitives.asymmetric import ec

# Generar par de claves EC del destinatario
private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
public_key = private_key.public_key()

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Encriptar con ECDH-ES
encrypted = jwe.encrypt(
    plaintext=b"Sensitive data",
    key=public_pem,
    algorithm='ECDH-ES+A128KW',
    encryption='A128GCM'
)

# Desencriptar
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

decrypted = jwe.decrypt(encrypted, private_pem)
```

### JWE con Clave Simétrica (Direct Encryption)

```python
import os
from jose import jwe

# Clave simétrica pre-compartida (256 bits para A256GCM)
symmetric_key = os.urandom(32)  # 32 bytes = 256 bits

# Encriptar
encrypted = jwe.encrypt(
    plaintext=b"Top secret message",
    key=symmetric_key,
    algorithm='dir',       # Direct use of symmetric key
    encryption='A256GCM'
)

# Desencriptar
decrypted = jwe.decrypt(encrypted, symmetric_key)
```

---

## Nested JWT (JWE + JWS) {#nested-jwt}

Un **Nested JWT** combina firma (JWS) y encriptación (JWE) para proporcionar tanto **autenticidad** como **confidencialidad**.

### Casos de Uso

1. **Tokens con datos sensibles**: El payload contiene PII que debe estar encriptado
2. **Multi-tenant systems**: El token contiene información del tenant que no debe ser visible
3. **Compliance requirements**: GDPR, HIPAA requieren encriptación de datos personales

### Estructura: JWE(JWS(payload))

```
1. Crear JWT firmado (JWS)
2. Encriptar el JWS completo (JWE)
3. El resultado es un JWE que contiene un JWS como payload
```

### Implementación de Nested JWT

```python
from jose import jwt, jwe
import json

# === PASO 1: Crear JWT firmado (JWS) ===
signing_key = "secret-key-for-signing"

jwt_payload = {
    "sub": "user@example.com",
    "iss": "https://auth.example.com",
    "aud": "https://api.example.com",
    "exp": int(time.time()) + 900,  # 15 minutos
    "iat": int(time.time()),
    "https://example.com/roles": ["admin", "user"],
    "https://example.com/sensitive_data": {
        "ssn": "123-45-6789",
        "salary": 150000
    }
}

# Firmar con HS256
signed_jwt = jwt.encode(
    jwt_payload,
    signing_key,
    algorithm='HS256'
)

print("Signed JWT (JWS):", signed_jwt)
# Cualquiera puede decodificar el payload (NO es confidencial)

# === PASO 2: Encriptar el JWS (crear JWE) ===
# Generar clave pública del destinatario
from cryptography.hazmat.primitives.asymmetric import rsa

recipient_private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
recipient_public_key = recipient_private_key.public_key()

recipient_public_pem = recipient_public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Encriptar el JWS
nested_jwt = jwe.encrypt(
    plaintext=signed_jwt.encode('utf-8'),
    key=recipient_public_pem,
    algorithm='RSA-OAEP-256',
    encryption='A256GCM'
)

print("\nNested JWT (JWE of JWS):", nested_jwt)
# Ahora el payload está ENCRIPTADO y FIRMADO

# === PASO 3: Validación del Nested JWT ===

# Desencriptar primero (JWE → JWS)
recipient_private_pem = recipient_private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

decrypted_jws = jwe.decrypt(nested_jwt, recipient_private_pem)

# Verificar firma (JWS → payload)
verified_payload = jwt.decode(
    decrypted_jws.decode('utf-8'),
    signing_key,
    algorithms=['HS256'],
    audience='https://api.example.com',
    issuer='https://auth.example.com'
)

print("\nVerified Payload:", json.dumps(verified_payload, indent=2))
```

### Orden de Operaciones: Firmar primero, encriptar después

**Correcto**: `JWE(JWS(payload))` ✅
- Razón: La firma protege la integridad del payload original. Si encriptaras primero, no podrías verificar la firma sin desencriptar.

**Incorrecto**: `JWS(JWE(payload))` ❌
- Problema: La firma es visible, la encriptación interna no tiene sentido si luego se firma todo.

### Nested JWT con Claves Asimétricas en Ambos Pasos

```python
# Firmar con clave privada del emisor (RS256)
issuer_private_key = rsa.generate_private_key(...)
issuer_private_pem = issuer_private_key.private_bytes(...)

signed_jwt = jwt.encode(
    jwt_payload,
    issuer_private_pem,
    algorithm='RS256'
)

# Encriptar con clave pública del destinatario
nested_jwt = jwe.encrypt(
    plaintext=signed_jwt.encode('utf-8'),
    key=recipient_public_pem,
    algorithm='RSA-OAEP-256',
    encryption='A256GCM'
)

# Validación requiere:
# 1. Clave privada del destinatario (para desencriptar)
# 2. Clave pública del emisor (para verificar firma)

decrypted_jws = jwe.decrypt(nested_jwt, recipient_private_pem)

issuer_public_pem = issuer_private_key.public_key().public_bytes(...)
verified_payload = jwt.decode(
    decrypted_jws.decode('utf-8'),
    issuer_public_pem,
    algorithms=['RS256']
)
```

---

## Detached Content {#detached-content}

**Detached content** permite separar el payload de la firma/encriptación, útil para archivos grandes.

### Detached JWS

En lugar de `header.payload.signature`, se envía `header..signature` (payload vacío) y el payload por separado.

```python
import base64
import hmac
import hashlib
import json

def create_detached_jws(payload, secret):
    # Header
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(
        json.dumps(header).encode()
    ).rstrip(b'=').decode()

    # Payload (enviado por separado, no incluido en el JWS)
    payload_b64 = base64.urlsafe_b64encode(payload).rstrip(b'=').decode()

    # Crear firma con el payload completo
    message = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(
        secret.encode(),
        message,
        hashlib.sha256
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()

    # Detached JWS: header..signature (payload vacío)
    detached_jws = f"{header_b64}..{signature_b64}"

    return detached_jws, payload

# Ejemplo
large_file_content = b"Este es un archivo muy grande..." * 1000
secret = "my-secret-key"

detached_jws, original_payload = create_detached_jws(large_file_content, secret)

print("Detached JWS:", detached_jws)
print("Payload separado:", len(original_payload), "bytes")

# Verificación
def verify_detached_jws(detached_jws, payload, secret):
    parts = detached_jws.split('.')
    header_b64 = parts[0]
    signature_b64 = parts[2]

    # Reconstruir payload para verificar
    payload_b64 = base64.urlsafe_b64encode(payload).rstrip(b'=').decode()

    message = f"{header_b64}.{payload_b64}".encode()
    expected_signature = hmac.new(
        secret.encode(),
        message,
        hashlib.sha256
    ).digest()
    expected_signature_b64 = base64.urlsafe_b64encode(
        expected_signature
    ).rstrip(b'=').decode()

    return signature_b64 == expected_signature_b64

is_valid = verify_detached_jws(detached_jws, original_payload, secret)
print("Signature valid:", is_valid)
```

### Uso en APIs

```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="signature"

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

--boundary
Content-Disposition: form-data; name="file"; filename="large-file.bin"
Content-Type: application/octet-stream

<binary content here>
```

---

## Mejores Prácticas de Implementación {#mejores-practicas}

### 1. Selección de Algoritmos

```python
# Whitelist de algoritmos permitidos (NUNCA aceptar cualquier alg)
ALLOWED_ALGORITHMS = {
    'signature': ['ES256', 'RS256', 'EdDSA'],  # NO incluir HS256 en APIs públicas
    'encryption': ['RSA-OAEP-256', 'ECDH-ES+A256KW'],
    'content_encryption': ['A256GCM']
}

def validate_token_algorithm(token_header):
    alg = token_header.get('alg')

    # Prevenir ataque alg=none
    if alg == 'none':
        raise ValueError("Algorithm 'none' is not allowed")

    # Prevenir confusión de algoritmos (RS256 → HS256)
    if alg not in ALLOWED_ALGORITHMS['signature']:
        raise ValueError(f"Algorithm {alg} is not allowed")

    return alg
```

### 2. Gestión de Claves con JWKS

```python
import requests
from jose import jwk
import time

class JWKSCache:
    def __init__(self, jwks_url, cache_ttl=3600):
        self.jwks_url = jwks_url
        self.cache_ttl = cache_ttl
        self.cache = {}
        self.last_fetch = 0

    def get_key(self, kid):
        # Refrescar cache si expiró
        if time.time() - self.last_fetch > self.cache_ttl:
            self._refresh_cache()

        if kid not in self.cache:
            # Intentar refrescar cache si la clave no existe
            self._refresh_cache()

        return self.cache.get(kid)

    def _refresh_cache(self):
        response = requests.get(self.jwks_url, timeout=10)
        response.raise_for_status()

        jwks = response.json()

        for key in jwks['keys']:
            kid = key.get('kid')
            if kid:
                self.cache[kid] = key

        self.last_fetch = time.time()

# Uso
jwks_cache = JWKSCache('https://auth.example.com/.well-known/jwks.json')

def verify_token_with_jwks(token):
    header = jwt.get_unverified_header(token)
    kid = header.get('kid')

    if not kid:
        raise ValueError("Token missing 'kid' in header")

    # Obtener clave pública del JWKS
    public_key_jwk = jwks_cache.get_key(kid)

    if not public_key_jwk:
        raise ValueError(f"Key {kid} not found in JWKS")

    # Convertir JWK a PEM o usar directamente
    public_key = jwk.construct(public_key_jwk)

    # Verificar token
    decoded = jwt.decode(
        token,
        public_key,
        algorithms=['RS256', 'ES256']
    )

    return decoded
```

### 3. Clock Skew Tolerance

```python
# Aceptar tokens con ±5 minutos de diferencia de reloj
CLOCK_SKEW_SECONDS = 300  # 5 minutos

def validate_time_claims(claims):
    now = int(time.time())

    # exp (expiration) - debe ser futuro (con tolerancia)
    exp = claims.get('exp')
    if exp and exp < (now - CLOCK_SKEW_SECONDS):
        raise ValueError("Token expired")

    # nbf (not before) - debe ser pasado (con tolerancia)
    nbf = claims.get('nbf')
    if nbf and nbf > (now + CLOCK_SKEW_SECONDS):
        raise ValueError("Token not yet valid")

    # iat (issued at) - no debe ser muy futuro
    iat = claims.get('iat')
    if iat and iat > (now + CLOCK_SKEW_SECONDS):
        raise ValueError("Token issued in the future")
```

### 4. Key Rotation con Múltiples Claves Activas

```python
# JWKS con múltiples claves (permite rotación sin downtime)
jwks_with_rotation = {
    "keys": [
        {
            "kty": "RSA",
            "use": "sig",
            "kid": "2024-01-primary",
            "alg": "RS256",
            "n": "...",
            "e": "AQAB"
        },
        {
            "kty": "RSA",
            "use": "sig",
            "kid": "2024-02-new",  # Nueva clave para nuevos tokens
            "alg": "RS256",
            "n": "...",
            "e": "AQAB"
        },
        {
            "kty": "RSA",
            "use": "sig",
            "kid": "2023-12-deprecated",  # Clave antigua, aún válida para verificación
            "alg": "RS256",
            "n": "...",
            "e": "AQAB"
        }
    ]
}

# Al firmar nuevos tokens, usar la clave más nueva
# Al verificar, aceptar cualquier clave del JWKS que coincida con el kid
```

---

## Referencias {#referencias}

### RFCs Oficiales

- **RFC 7515**: JSON Web Signature (JWS) - https://datatracker.ietf.org/doc/html/rfc7515
- **RFC 7516**: JSON Web Encryption (JWE) - https://datatracker.ietf.org/doc/html/rfc7516
- **RFC 7517**: JSON Web Key (JWK) - https://datatracker.ietf.org/doc/html/rfc7517
- **RFC 7518**: JSON Web Algorithms (JWA) - https://datatracker.ietf.org/doc/html/rfc7518
- **RFC 7519**: JSON Web Token (JWT) - https://datatracker.ietf.org/doc/html/rfc7519
- **RFC 7638**: JSON Web Key (JWK) Thumbprint - https://datatracker.ietf.org/doc/html/rfc7638
- **RFC 8725**: JWT Best Current Practices - https://datatracker.ietf.org/doc/html/rfc8725

### Herramientas Online

- **jwt.io**: Decodificar y debuggear JWTs - https://jwt.io
- **mkjwk.org**: Generar JWKs online - https://mkjwk.org
- **JOSE Cookbook**: Ejemplos prácticos - https://datatracker.ietf.org/doc/html/rfc7520

### Librerías Recomendadas

- **Python**: `python-jose`, `PyJWT`, `cryptography`
- **JavaScript**: `jsonwebtoken`, `jose` (Panva)
- **Java**: `nimbus-jose-jwt`, `java-jwt` (Auth0)
- **Go**: `golang-jwt/jwt`, `go-jose` (Square)
- **Ruby**: `ruby-jwt`
- **.NET**: `System.IdentityModel.Tokens.Jwt`

### Próximos Pasos

1. Leer [03_jwt_seguridad_best_practices.md](./03_jwt_seguridad_best_practices.md) para ataques y mitigaciones
2. Estudiar [04_oauth2_openid_connect.md](./04_oauth2_openid_connect.md) para integración de autenticación
3. Practicar con [Lab 01: JWS Avanzado](../laboratorios/lab_01_jws_avanzado/README.md)

---

**Autor**: Curso de Ciberseguridad Avanzada
**Última actualización**: 2026-02-23
**Versión**: 1.0
