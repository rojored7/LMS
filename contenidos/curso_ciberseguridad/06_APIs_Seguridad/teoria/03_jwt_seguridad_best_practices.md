# JWT Security Best Practices (RFC 8725)

## Índice
1. [Introducción a Amenazas JWT](#introduccion)
2. [Ataques de Confusión de Algoritmos](#algoritmos)
3. [Gestión de Tiempo de Vida de Tokens](#lifetime)
4. [Almacenamiento Seguro de Tokens](#storage)
5. [Validación Robusta de Tokens](#validation)
6. [Patrones de Refresh Tokens](#refresh)
7. [Seguridad Cross-Origin](#cross-origin)
8. [Rate Limiting y Prevención de Abuso](#rate-limiting)
9. [Checklist de Seguridad](#checklist)
10. [Referencias](#referencias)

---

## Introducción a Amenazas JWT {#introduccion}

RFC 8725 **"JSON Web Token Best Current Practices"** documenta vulnerabilidades conocidas y mejores prácticas para implementaciones seguras de JWT.

### Vulnerabilidades Comunes

| Vulnerabilidad | Impacto | CVSS | Prevalencia |
|----------------|---------|------|-------------|
| **alg=none bypass** | Autenticación completa bypasseada | 9.8 Critical | Común en librerías antiguas |
| **Algorithm confusion (RS256→HS256)** | Falsificación de tokens | 9.1 Critical | Medio |
| **Weak secrets (HS256)** | Brute-force de claves | 7.5 High | Alto |
| **Missing exp validation** | Tokens nunca expiran | 6.5 Medium | Alto |
| **Kid injection** | SQL injection, path traversal | 8.0 High | Bajo |
| **XXE in JWKS** | Remote Code Execution | 9.0 Critical | Bajo |

### Modelo de Amenazas

```
┌─────────────┐
│   Atacante  │
└──────┬──────┘
       │
       ├─ 1. Intercepta token (MitM)
       ├─ 2. Modifica payload (sin validar firma)
       ├─ 3. Bypass de firma (alg=none)
       ├─ 4. Confusión de algoritmo (RS256→HS256)
       ├─ 5. Brute-force de secret (HS256)
       ├─ 6. Token theft (XSS, local storage)
       ├─ 7. Token reuse (CSRF)
       └─ 8. kid injection
```

---

## Ataques de Confusión de Algoritmos {#algoritmos}

### 1. Ataque alg=none

**Descripción**: El atacante cambia `alg` a `none` y elimina la firma, bypass completo de autenticación.

#### Token Original (Válido)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIiwiZXhwIjoxNzM1NjkwMjAwLCJyb2xlIjoidXNlciJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header decodificado**:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### Token Malicioso (alg=none)

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIiwiZXhwIjoxNzM1NjkwMjAwLCJyb2xlIjoiYWRtaW4ifQ.
```

**Header modificado**:
```json
{
  "alg": "none",  // ← ATAQUE
  "typ": "JWT"
}
```

**Payload modificado**:
```json
{
  "sub": "user@example.com",
  "role": "admin"  // ← Escalación de privilegios
}
```

**Firma**: Vacía (sin punto al final o con punto pero sin firma)

#### Mitigación

```python
# ❌ VULNERABLE - acepta cualquier algoritmo
def decode_jwt_vulnerable(token, secret):
    return jwt.decode(token, secret, options={"verify_signature": True})

# ✅ SEGURO - whitelist explícita, rechaza 'none'
def decode_jwt_secure(token, secret):
    # Opción 1: Especificar algoritmos permitidos
    return jwt.decode(
        token,
        secret,
        algorithms=['HS256', 'RS256'],  # Whitelist explícita
        options={"verify_signature": True}
    )

    # Opción 2: Validar header manualmente primero
    header = jwt.get_unverified_header(token)
    if header.get('alg') == 'none':
        raise ValueError("Algorithm 'none' is not allowed")

    return jwt.decode(token, secret, algorithms=['HS256'])
```

**Configuración de librerías**:

```javascript
// JavaScript (jsonwebtoken)
const jwt = require('jsonwebtoken');

// ❌ VULNERABLE
jwt.verify(token, secret); // Acepta 'none' por defecto en versiones antiguas

// ✅ SEGURO
jwt.verify(token, secret, {
  algorithms: ['HS256', 'RS256']  // Whitelist explícita
});
```

```java
// Java (nimbus-jose-jwt)
import com.nimbusds.jose.JWSAlgorithm;

// ✅ SEGURO
JWTProcessor jwtProcessor = new DefaultJWTProcessor();
jwtProcessor.setJWSTypeVerifier(
    new DefaultJOSEObjectTypeVerifier(JOSEObjectType.JWT)
);
jwtProcessor.setJWSKeySelector(new JWSVerificationKeySelector(
    JWSAlgorithm.HS256,  // Solo permitir HS256
    jwkSource
));
```

### 2. Ataque de Confusión RS256 → HS256

**Descripción**: El atacante cambia el algoritmo de asimétrico (RS256) a simétrico (HS256), usando la clave pública como secret de HMAC.

#### Contexto del Ataque

1. El servidor usa **RS256** (RSA, clave privada para firmar)
2. El servidor publica la **clave pública** en JWKS (para que clientes verifiquen)
3. El atacante descarga la clave pública
4. El atacante crea un token con **HS256**, usando la clave pública como secret HMAC
5. Si el servidor no valida el algoritmo, acepta el token forjado

#### Demostración del Ataque

```python
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import jwt

# === SERVIDOR: Genera par de claves RSA ===
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
public_key = private_key.public_key()

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# === ATACANTE: Obtiene clave pública del JWKS ===
# (En producción, esto sería público en https://auth.example.com/.well-known/jwks.json)

# === ATACANTE: Crea token malicioso con HS256 usando clave pública como secret ===
payload = {
    "sub": "attacker@evil.com",
    "role": "admin",  # Escalación de privilegios
    "iat": 1735689600,
    "exp": 1735690200
}

# El atacante usa la clave pública como secret HMAC
malicious_token = jwt.encode(
    payload,
    public_pem,       # ← Clave pública usada como secret HMAC
    algorithm='HS256' # ← Cambio de algoritmo
)

print("Malicious Token:", malicious_token)

# === SERVIDOR VULNERABLE: Verifica sin validar algoritmo ===
# ❌ CÓDIGO VULNERABLE
def verify_vulnerable(token):
    # El servidor intenta verificar con la clave pública
    # Si el token usa HS256, la clave pública se usa como secret HMAC
    # ¡Y funciona! El atacante logró forjar el token
    try:
        decoded = jwt.decode(
            token,
            public_pem,
            algorithms=['RS256', 'HS256']  # ← VULNERABLE: acepta ambos
        )
        return decoded
    except:
        return None

result = verify_vulnerable(malicious_token)
print("Vulnerable verification result:", result)
# Output: {'sub': 'attacker@evil.com', 'role': 'admin', ...}

# === SERVIDOR SEGURO: Validación con tipo de clave ===
# ✅ CÓDIGO SEGURO
def verify_secure(token):
    header = jwt.get_unverified_header(token)
    alg = header.get('alg')

    # Validar que el algoritmo coincide con el tipo de clave
    if alg == 'HS256':
        raise ValueError("HS256 not allowed for this endpoint (RS256 expected)")

    # Solo permitir RS256 con clave pública
    decoded = jwt.decode(
        token,
        public_pem,
        algorithms=['RS256']  # ← SEGURO: solo RS256
    )
    return decoded

try:
    verify_secure(malicious_token)
except ValueError as e:
    print("Secure verification blocked attack:", e)
```

#### Mitigación: Separación de Claves por Uso

```python
class TokenVerifier:
    def __init__(self):
        # Claves separadas por tipo de algoritmo
        self.hmac_secrets = {
            'service-a': 'secret-for-service-a',
            'service-b': 'secret-for-service-b'
        }

        self.rsa_public_keys = {
            'auth-server': public_key_pem
        }

    def verify_token(self, token):
        header = jwt.get_unverified_header(token)
        alg = header.get('alg')
        kid = header.get('kid')

        # Determinar clave según el algoritmo
        if alg in ['HS256', 'HS384', 'HS512']:
            # Solo buscar en secrets HMAC
            if kid not in self.hmac_secrets:
                raise ValueError(f"Unknown HMAC key: {kid}")
            key = self.hmac_secrets[kid]
            allowed_algs = ['HS256']

        elif alg in ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']:
            # Solo buscar en claves públicas
            if kid not in self.rsa_public_keys:
                raise ValueError(f"Unknown public key: {kid}")
            key = self.rsa_public_keys[kid]
            allowed_algs = ['RS256', 'ES256']

        else:
            raise ValueError(f"Algorithm {alg} not allowed")

        # Decodificar con clave y algoritmo apropiados
        decoded = jwt.decode(token, key, algorithms=allowed_algs)
        return decoded
```

### 3. Weak Secrets para HS256

**Descripción**: Claves HMAC débiles pueden ser crackeadas por brute-force.

#### Ejemplo de Ataque

```bash
# Herramienta: hashcat
# Diccionario: rockyou.txt (14 millones de passwords comunes)

# Crackear JWT con HS256
hashcat -m 16500 -a 0 jwt.txt rockyou.txt

# Resultado: "secret123" crackeado en segundos
```

#### Generación de Secrets Seguros

```python
import secrets

# ❌ DÉBIL - predecible
weak_secret = "my-secret-key"  # 13 caracteres, baja entropía

# ✅ FUERTE - 256 bits de entropía
strong_secret = secrets.token_urlsafe(32)  # 32 bytes = 256 bits
print(strong_secret)
# Output: 'T2iZ9X8fQ3mR7vK4nL1sY6wE0pU5hG9'

# Almacenar en variable de entorno o secrets manager
# export JWT_SECRET='T2iZ9X8fQ3mR7vK4nL1sY6wE0pU5hG9'
```

**Longitud mínima recomendada**:
- **HS256**: 256 bits (32 bytes)
- **HS384**: 384 bits (48 bytes)
- **HS512**: 512 bits (64 bytes)

---

## Gestión de Tiempo de Vida de Tokens {#lifetime}

### Principio de Menor Privilegio Temporal

```yaml
Token Types y Lifetimes:

Access Token (API access):
  - Lifetime: 15 minutos (máximo 1 hora)
  - Storage: Memoria (variable), sessionStorage (con cuidado)
  - Renewal: Vía refresh token

Refresh Token (obtener nuevos access tokens):
  - Lifetime: 7-30 días (máximo 90 días)
  - Storage: httpOnly, secure, sameSite cookie
  - Rotation: Sí, emitir nuevo refresh token en cada uso
  - Revocation: Sí, mantener blacklist/whitelist

ID Token (user info, OpenID Connect):
  - Lifetime: 5-15 minutos
  - Storage: No almacenar (usar una vez y descartar)
  - Purpose: Obtener información del usuario

One-Time Token (email verification, password reset):
  - Lifetime: 5-15 minutos
  - Storage: Base de datos (mapeo token→user)
  - Revocation: Sí, invalidar tras uso
```

### Implementación de Sliding Windows

```python
from datetime import datetime, timedelta
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def create_access_token_with_sliding(user_id):
    now = datetime.utcnow()

    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=15)).timestamp()),
        "type": "access"
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    # Guardar en Redis con TTL de 1 hora (sliding window)
    redis_key = f"session:{user_id}"
    redis_client.setex(
        redis_key,
        timedelta(hours=1),
        value="active"
    )

    return token

def validate_with_sliding_window(token):
    decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    user_id = decoded['sub']

    # Verificar que la sesión aún existe
    session = redis_client.get(f"session:{user_id}")
    if not session:
        raise ValueError("Session expired")

    # Extender la sesión (sliding window)
    redis_client.expire(f"session:{user_id}", timedelta(hours=1))

    return decoded
```

### Token Revocation Patterns

#### 1. Blacklist (Rechazar tokens específicos)

```python
def revoke_token(jti):
    # Agregar jti a blacklist en Redis
    # TTL = tiempo restante hasta exp del token
    decoded = jwt.decode(token, options={"verify_signature": False})
    exp = decoded['exp']
    ttl = exp - int(time.time())

    if ttl > 0:
        redis_client.setex(f"blacklist:{jti}", ttl, value="revoked")

def is_token_blacklisted(jti):
    return redis_client.exists(f"blacklist:{jti}")

# En validación
decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
if is_token_blacklisted(decoded.get('jti')):
    raise ValueError("Token has been revoked")
```

#### 2. Whitelist (Solo aceptar tokens conocidos)

```python
def create_access_token_whitelisted(user_id):
    jti = str(uuid.uuid4())
    exp = datetime.utcnow() + timedelta(minutes=15)

    payload = {
        "sub": user_id,
        "jti": jti,
        "exp": int(exp.timestamp())
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    # Guardar jti en whitelist
    redis_client.setex(
        f"whitelist:{jti}",
        timedelta(minutes=15),
        value=user_id
    )

    return token

def validate_whitelisted_token(token):
    decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    jti = decoded.get('jti')

    # Verificar que el token está en la whitelist
    user_id = redis_client.get(f"whitelist:{jti}")
    if not user_id:
        raise ValueError("Token not in whitelist (invalid or expired)")

    return decoded
```

### Global Logout (Invalidar todos los tokens del usuario)

```python
def logout_all_sessions(user_id):
    # Incrementar versión de token del usuario
    redis_client.incr(f"token_version:{user_id}")

def create_access_token_with_version(user_id):
    # Obtener versión actual
    version = int(redis_client.get(f"token_version:{user_id}") or 0)

    payload = {
        "sub": user_id,
        "v": version,  # Versión del token
        "exp": int((datetime.utcnow() + timedelta(minutes=15)).timestamp())
    }

    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def validate_token_version(token):
    decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    user_id = decoded['sub']
    token_version = decoded.get('v', 0)

    current_version = int(redis_client.get(f"token_version:{user_id}") or 0)

    if token_version < current_version:
        raise ValueError("Token version outdated (user logged out globally)")

    return decoded
```

---

## Almacenamiento Seguro de Tokens {#storage}

### Comparación de Opciones de Almacenamiento

| Storage Location | XSS Risk | CSRF Risk | Accesible desde JS | Enviado automáticamente | Recomendación |
|------------------|----------|-----------|---------------------|-------------------------|---------------|
| **localStorage** | ⚠️ Alto | ✅ Bajo | Sí | No | ❌ Evitar |
| **sessionStorage** | ⚠️ Alto | ✅ Bajo | Sí | No | ⚠️ Solo para datos no sensibles |
| **Cookie (httpOnly)** | ✅ Bajo | ⚠️ Alto | No | Sí | ✅ **Recomendado con SameSite** |
| **Cookie (no httpOnly)** | ⚠️ Alto | ⚠️ Alto | Sí | Sí | ❌ Nunca usar |
| **Memoria (variable)** | ✅ Bajo | ✅ Bajo | Sí (temporal) | No | ✅ Ideal para SPAs |

### Almacenamiento en Cookies (Recomendado)

```python
from flask import Flask, make_response

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    # ... validar credenciales ...

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    response = make_response({"message": "Login successful"})

    # Access token en cookie httpOnly, secure, sameSite
    response.set_cookie(
        'access_token',
        value=access_token,
        httponly=True,       # No accesible desde JavaScript (previene XSS)
        secure=True,         # Solo enviar sobre HTTPS
        samesite='Strict',   # Prevenir CSRF (no enviar en requests cross-origin)
        max_age=15*60,       # 15 minutos
        path='/api'          # Solo enviar a rutas /api/*
    )

    # Refresh token en cookie separada
    response.set_cookie(
        'refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='Strict',
        max_age=7*24*60*60,  # 7 días
        path='/auth/refresh' # Solo enviar a endpoint de refresh
    )

    return response

@app.route('/api/protected', methods=['GET'])
def protected_route():
    access_token = request.cookies.get('access_token')

    if not access_token:
        return {"error": "Unauthorized"}, 401

    try:
        decoded = jwt.decode(access_token, SECRET_KEY, algorithms=['HS256'])
        return {"data": "protected resource", "user": decoded['sub']}
    except:
        return {"error": "Invalid token"}, 401
```

### SameSite Cookie Attribute

| Valor | Comportamiento | Uso |
|-------|----------------|-----|
| **Strict** | Nunca enviar en requests cross-origin | Máxima seguridad, puede afectar UX (links externos) |
| **Lax** | Enviar en top-level GET (links, no forms/fetch) | Balance seguridad/UX (recomendado por defecto) |
| **None** | Enviar siempre (requiere Secure=true) | Solo para APIs cross-domain específicas |

```http
Set-Cookie: access_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/api
```

### Almacenamiento en Memoria (SPA)

```javascript
// React/Vue/Angular: Almacenar en variable de estado
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setTokens(access, refresh) {
    this.accessToken = access;
    this.refreshToken = refresh;  // O en httpOnly cookie
  }

  getAccessToken() {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

const tokenManager = new TokenManager();

// Usar con axios interceptor
axios.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Al refrescar la página, el token se pierde (feature, not bug)
// El usuario debe hacer login de nuevo o usar refresh token
```

### Mobile App Storage

```swift
// iOS: Keychain (almacenamiento seguro)
import Security

func saveTokenToKeychain(token: String) {
    let data = token.data(using: .utf8)!
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: "access_token",
        kSecValueData as String: data,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ]

    SecItemDelete(query as CFDictionary)  // Eliminar token anterior
    SecItemAdd(query as CFDictionary, nil)
}

func getTokenFromKeychain() -> String? {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: "access_token",
        kSecReturnData as String: true
    ]

    var result: AnyObject?
    SecItemCopyMatching(query as CFDictionary, &result)

    if let data = result as? Data {
        return String(data: data, encoding: .utf8)
    }
    return nil
}
```

```java
// Android: EncryptedSharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

MasterKey masterKey = new MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build();

SharedPreferences sharedPreferences = EncryptedSharedPreferences.create(
    context,
    "secure_tokens",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
);

// Guardar token
sharedPreferences.edit()
    .putString("access_token", token)
    .apply();

// Obtener token
String token = sharedPreferences.getString("access_token", null);
```

---

## Validación Robusta de Tokens {#validation}

### Checklist de Validación Completa

```python
import time
from typing import List, Optional

CLOCK_SKEW_SECONDS = 300  # 5 minutos de tolerancia

def validate_jwt_comprehensive(
    token: str,
    secret: str,
    allowed_algorithms: List[str],
    expected_issuer: str,
    expected_audience: str,
    require_claims: Optional[List[str]] = None
):
    """
    Validación completa de JWT según RFC 8725
    """
    require_claims = require_claims or ["exp", "iat", "iss", "sub"]

    try:
        # 1. Decodificar y validar firma
        decoded = jwt.decode(
            token,
            secret,
            algorithms=allowed_algorithms,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_aud": True,
                "verify_iss": True,
                "require": require_claims
            },
            audience=expected_audience,
            issuer=expected_issuer,
            leeway=CLOCK_SKEW_SECONDS
        )

        # 2. Validar algoritmo explícitamente (defense in depth)
        header = jwt.get_unverified_header(token)
        if header.get('alg') not in allowed_algorithms:
            raise ValueError(f"Algorithm {header.get('alg')} not allowed")

        # Rechazar alg=none explícitamente
        if header.get('alg') == 'none':
            raise ValueError("Algorithm 'none' is forbidden")

        # 3. Validar exp con clock skew
        exp = decoded.get('exp')
        now = int(time.time())
        if exp < (now - CLOCK_SKEW_SECONDS):
            raise ValueError(f"Token expired (exp: {exp}, now: {now})")

        # 4. Validar nbf (not before)
        nbf = decoded.get('nbf')
        if nbf and nbf > (now + CLOCK_SKEW_SECONDS):
            raise ValueError(f"Token not yet valid (nbf: {nbf}, now: {now})")

        # 5. Validar iat (issued at) - no futuro
        iat = decoded.get('iat')
        if iat and iat > (now + CLOCK_SKEW_SECONDS):
            raise ValueError(f"Token issued in future (iat: {iat}, now: {now})")

        # 6. Validar máximo age del token (prevenir tokens antiguos)
        max_age_seconds = 3600  # 1 hora
        if iat and (now - iat) > max_age_seconds:
            raise ValueError(f"Token too old (iat: {iat}, max_age: {max_age_seconds})")

        # 7. Validar iss (issuer) - exact match
        iss = decoded.get('iss')
        if iss != expected_issuer:
            raise ValueError(f"Invalid issuer: {iss} (expected: {expected_issuer})")

        # 8. Validar aud (audience) - exact match o contains
        aud = decoded.get('aud')
        if isinstance(aud, list):
            if expected_audience not in aud:
                raise ValueError(f"Invalid audience: {aud} (expected: {expected_audience})")
        elif aud != expected_audience:
            raise ValueError(f"Invalid audience: {aud} (expected: {expected_audience})")

        # 9. Validar jti (anti-replay) - verificar blacklist
        jti = decoded.get('jti')
        if jti and is_token_revoked(jti):
            raise ValueError(f"Token has been revoked (jti: {jti})")

        # 10. Validar custom claims según negocio
        validate_custom_claims(decoded)

        return decoded

    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired (signature verification)")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")

def validate_custom_claims(decoded):
    """
    Validaciones específicas del negocio
    """
    # Ejemplo: validar que el token tiene roles
    roles = decoded.get('https://example.com/roles')
    if not roles or not isinstance(roles, list):
        raise ValueError("Token missing required roles claim")

    # Ejemplo: validar tenant_id
    tenant_id = decoded.get('https://example.com/tenant_id')
    if not tenant_id:
        raise ValueError("Token missing tenant_id")

    # Ejemplo: validar que el token es del tipo correcto
    token_type = decoded.get('type')
    if token_type not in ['access', 'refresh']:
        raise ValueError(f"Invalid token type: {token_type}")
```

### Validación con Constant-Time Comparison

```python
import hmac

def constant_time_compare(a: str, b: str) -> bool:
    """
    Compara dos strings en tiempo constante (previene timing attacks)
    """
    return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))

# Uso en validación de firma
def verify_signature_constant_time(token, secret):
    header_b64, payload_b64, signature_b64 = token.split('.')

    # Recrear firma
    message = f"{header_b64}.{payload_b64}".encode()
    expected_signature = hmac.new(
        secret.encode(),
        message,
        hashlib.sha256
    ).digest()
    expected_signature_b64 = base64.urlsafe_b64encode(
        expected_signature
    ).rstrip(b'=').decode()

    # Comparar en tiempo constante
    if not constant_time_compare(signature_b64, expected_signature_b64):
        raise ValueError("Invalid signature")
```

---

## Patrones de Refresh Tokens {#refresh}

### Refresh Token Rotation

```python
def refresh_access_token(refresh_token):
    # 1. Validar refresh token
    try:
        decoded = jwt.decode(
            refresh_token,
            REFRESH_SECRET,
            algorithms=['HS256']
        )
    except:
        raise ValueError("Invalid refresh token")

    # 2. Verificar que es un refresh token (no access token)
    if decoded.get('type') != 'refresh':
        raise ValueError("Token is not a refresh token")

    # 3. Verificar que el token no ha sido usado (anti-replay)
    jti = decoded.get('jti')
    if redis_client.exists(f"used_refresh:{jti}"):
        # Token reusado, posible ataque → invalidar toda la familia
        user_id = decoded['sub']
        invalidate_all_refresh_tokens(user_id)
        raise ValueError("Refresh token reuse detected - all tokens revoked")

    # 4. Marcar refresh token como usado
    redis_client.setex(
        f"used_refresh:{jti}",
        timedelta(days=90),  # Tiempo máximo de vida de refresh tokens
        value="used"
    )

    # 5. Generar nuevo access token
    user_id = decoded['sub']
    new_access_token = create_access_token(user_id)

    # 6. Generar nuevo refresh token (rotación)
    new_refresh_token = create_refresh_token(user_id)

    # 7. Revocar el refresh token viejo
    revoke_token(jti)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "Bearer",
        "expires_in": 900  # 15 minutos
    }

def invalidate_all_refresh_tokens(user_id):
    """
    Invalida todos los refresh tokens del usuario (detección de robo)
    """
    # Incrementar versión de tokens
    redis_client.incr(f"refresh_version:{user_id}")

    # Log del evento de seguridad
    logger.warning(f"Refresh token reuse detected for user {user_id}")
```

### Refresh Token Families

```python
def create_refresh_token_with_family(user_id):
    family_id = str(uuid.uuid4())  # ID de familia de tokens

    payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "family_id": family_id,  # ← Familia de tokens relacionados
        "iat": int(time.time()),
        "exp": int((datetime.utcnow() + timedelta(days=30)).timestamp())
    }

    token = jwt.encode(payload, REFRESH_SECRET, algorithm='HS256')

    # Guardar familia en Redis
    redis_client.sadd(f"family:{family_id}", payload['jti'])
    redis_client.expire(f"family:{family_id}", timedelta(days=30))

    return token

def detect_token_theft(refresh_token):
    decoded = jwt.decode(refresh_token, REFRESH_SECRET, algorithms=['HS256'])
    jti = decoded['jti']
    family_id = decoded.get('family_id')

    # Si el token ya fue usado y pertenece a una familia
    if redis_client.exists(f"used_refresh:{jti}") and family_id:
        # Invalidar toda la familia (posible robo)
        family_members = redis_client.smembers(f"family:{family_id}")
        for member_jti in family_members:
            revoke_token(member_jti.decode('utf-8'))

        redis_client.delete(f"family:{family_id}")
        raise ValueError("Token theft detected - family revoked")
```

---

## Seguridad Cross-Origin {#cross-origin}

### CORS Configuration

```python
from flask_cors import CORS

app = Flask(__name__)

# ❌ INSEGURO - permite todos los orígenes
CORS(app, origins="*")

# ✅ SEGURO - whitelist explícita
CORS(app, origins=[
    "https://app.example.com",
    "https://admin.example.com"
], supports_credentials=True)  # Permite cookies

# Configuración granular por endpoint
@app.route('/api/public', methods=['GET'])
@cross_origin(origins="*")  # Public API, sin auth
def public_api():
    return {"data": "public"}

@app.route('/api/protected', methods=['GET'])
@cross_origin(
    origins=["https://app.example.com"],
    methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=True
)
def protected_api():
    return {"data": "protected"}
```

### CSRF Protection con Tokens

```python
# Para APIs con cookies (no Bearer tokens), agregar CSRF token
@app.route('/api/protected', methods=['POST'])
def protected_post():
    # 1. Validar CSRF token (enviado en header o body)
    csrf_token = request.headers.get('X-CSRF-Token')

    if not csrf_token:
        return {"error": "CSRF token missing"}, 403

    # 2. Verificar CSRF token contra sesión
    session_csrf = session.get('csrf_token')
    if not hmac.compare_digest(csrf_token, session_csrf):
        return {"error": "CSRF token invalid"}, 403

    # 3. Continuar con lógica de negocio
    return {"status": "success"}

# Generar CSRF token al login
@app.route('/login', methods=['POST'])
def login():
    # ... validar credenciales ...

    csrf_token = secrets.token_urlsafe(32)
    session['csrf_token'] = csrf_token

    response = make_response({
        "message": "Login successful",
        "csrf_token": csrf_token  # Enviar al cliente
    })

    # Configurar cookie de sesión
    response.set_cookie('access_token', ...)

    return response
```

### Content Security Policy (CSP)

```python
@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' https://cdn.example.com; "
        "connect-src 'self' https://api.example.com; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline'"
    )

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = (
        'max-age=31536000; includeSubDomains; preload'
    )

    return response
```

---

## Rate Limiting y Prevención de Abuso {#rate-limiting}

### Rate Limiting en Login

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # Máximo 5 intentos por minuto
@limiter.limit("20 per hour")   # Máximo 20 intentos por hora
def login():
    # ... lógica de login ...
    pass

# Rate limiting por usuario (después de login)
def user_rate_limit():
    token = request.headers.get('Authorization')
    if token:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return decoded['sub']  # User ID
    return get_remote_address()

@app.route('/api/resource', methods=['GET'])
@limiter.limit("100 per minute", key_func=user_rate_limit)
def api_resource():
    return {"data": "resource"}
```

### Account Lockout tras Intentos Fallidos

```python
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=30)

def check_account_lockout(username):
    lockout_key = f"lockout:{username}"

    if redis_client.exists(lockout_key):
        ttl = redis_client.ttl(lockout_key)
        raise ValueError(f"Account locked. Try again in {ttl} seconds")

def record_failed_login(username):
    failed_key = f"failed_login:{username}"

    # Incrementar contador de fallos
    failed_count = redis_client.incr(failed_key)
    redis_client.expire(failed_key, timedelta(hours=1))

    # Si excede el máximo, bloquear cuenta
    if failed_count >= MAX_FAILED_ATTEMPTS:
        redis_client.setex(
            f"lockout:{username}",
            LOCKOUT_DURATION,
            value="locked"
        )
        raise ValueError("Account locked due to excessive failed attempts")

def reset_failed_login_counter(username):
    redis_client.delete(f"failed_login:{username}")

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    # Verificar si la cuenta está bloqueada
    check_account_lockout(username)

    # Validar credenciales
    if not verify_credentials(username, password):
        record_failed_login(username)
        return {"error": "Invalid credentials"}, 401

    # Login exitoso, resetear contador
    reset_failed_login_counter(username)

    # ... generar tokens ...
```

---

## Checklist de Seguridad {#checklist}

### Pre-Production Security Checklist

```markdown
## Algoritmos y Claves
- [ ] Whitelist explícita de algoritmos permitidos
- [ ] Rechazar `alg=none` explícitamente
- [ ] Separar claves por tipo de algoritmo (HS256 vs RS256)
- [ ] Secrets HMAC de al menos 256 bits de entropía
- [ ] Rotación periódica de claves (cada 90 días)
- [ ] Claves privadas nunca en control de versiones

## Validación de Tokens
- [ ] Validar firma siempre (verify_signature=True)
- [ ] Validar exp, nbf, iat con clock skew tolerance
- [ ] Validar iss y aud con whitelist
- [ ] Requerir claims críticos (exp, iat, iss, sub)
- [ ] Implementar blacklist/whitelist de tokens
- [ ] Validar custom claims según negocio

## Lifetime Management
- [ ] Access tokens: máximo 15 minutos
- [ ] Refresh tokens: máximo 30 días
- [ ] Implementar refresh token rotation
- [ ] Detectar reutilización de refresh tokens
- [ ] Global logout (invalidar todos los tokens del usuario)

## Almacenamiento
- [ ] Cookies con httpOnly, secure, sameSite=Strict
- [ ] NO almacenar en localStorage para tokens sensibles
- [ ] Mobile apps: Keychain (iOS) / EncryptedSharedPreferences (Android)
- [ ] Backend: Secrets manager (Vault, AWS Secrets Manager)

## Cross-Origin Security
- [ ] CORS con whitelist explícita de orígenes
- [ ] CSRF protection para endpoints con cookies
- [ ] Content Security Policy (CSP) headers
- [ ] X-Frame-Options, X-Content-Type-Options headers

## Rate Limiting
- [ ] Login endpoint: 5 intentos/minuto
- [ ] Refresh endpoint: 10 intentos/hora
- [ ] API endpoints: rate limit por usuario
- [ ] Account lockout tras 5 intentos fallidos

## Monitoreo y Logging
- [ ] Log de todos los login exitosos
- [ ] Log de intentos fallidos con IP y user-agent
- [ ] Alertas de tokens revocados accediendo a recursos
- [ ] Alertas de refresh token reuse
- [ ] Alertas de account lockout

## Testing
- [ ] Unit tests para validación de tokens
- [ ] Integration tests con tokens expirados
- [ ] Security tests (alg=none, RS256→HS256)
- [ ] Penetration testing de flujo completo
```

---

## Referencias {#referencias}

### Estándares

- **RFC 8725**: JSON Web Token Best Current Practices - https://datatracker.ietf.org/doc/html/rfc8725
- **OWASP JWT Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

### Vulnerabilidades Conocidas

- **CVE-2015-9235**: alg=none bypass en multiple libraries
- **CVE-2016-10555**: Algorithm confusion RS256→HS256
- **CVE-2018-0114**: kid injection en node-jose

### Herramientas de Testing

- **jwt_tool**: Testing toolkit - https://github.com/ticarpi/jwt_tool
- **Burp Suite JWT extensions**: https://portswigger.net/burp/extensions
- **OWASP ZAP JWT addon**: https://www.zaproxy.org/

### Próximos Pasos

1. Leer [04_oauth2_openid_connect.md](./04_oauth2_openid_connect.md)
2. Practicar con [Lab 03: Sistema Auth JWT Completo](../laboratorios/lab_03_jwt_auth_system/README.md)

---

**Autor**: Curso de Ciberseguridad Avanzada
**Última actualización**: 2026-02-23
**Versión**: 1.0
