# Patrones de Autenticación para APIs

## Índice
1. [API Keys](#api-keys)
2. [HMAC-Based Authentication](#hmac)
3. [Mutual TLS (mTLS)](#mtls)
4. [Rate Limiting](#rate-limiting)
5. [API Gateways](#api-gateways)
6. [Comparación de Métodos](#comparacion)
7. [Referencias](#referencias)

---

## API Keys {#api-keys}

**API Keys** son identificadores únicos usados para autenticar requests a una API.

### Generación de API Keys

```python
import secrets
import hashlib
from datetime import datetime

def generate_api_key():
    # Generar clave aleatoria de 32 bytes (256 bits)
    raw_key = secrets.token_urlsafe(32)

    # Prefijo para identificar tipo de clave
    api_key = f"sk_live_{raw_key}"

    return api_key

# Ejemplo
api_key = generate_api_key()
print(api_key)
# Output: sk_live_T2iZ9X8fQ3mR7vK4nL1sY6wE0pU5hG9sA3bC7dE

# Almacenar hash en database (NO la clave en texto plano)
api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
```

### Almacenamiento en Base de Datos

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash
    key_prefix VARCHAR(10),  -- Primeros caracteres para identificación
    name VARCHAR(100),  -- Nombre descriptivo del key
    scopes TEXT[],  -- Permisos asignados ['read', 'write', 'admin']
    rate_limit INTEGER DEFAULT 1000,  -- Requests por hora
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP,
    INDEX idx_key_hash (key_hash),
    INDEX idx_user_id (user_id)
);
```

### Uso en Headers

```http
GET /api/v1/users HTTP/1.1
Host: api.example.com
X-API-Key: sk_live_T2iZ9X8fQ3mR7vK4nL1sY6wE0pU5hG9
```

**Alternativas de envío**:
```http
# Opción 1: Header customizado
X-API-Key: sk_live_...

# Opción 2: Authorization header
Authorization: Bearer sk_live_...

# Opción 3: Query parameter (NO recomendado - visible en logs)
GET /api/v1/users?api_key=sk_live_...
```

### Validación de API Key

```python
from flask import Flask, request
import hashlib

app = Flask(__name__)

def validate_api_key(api_key):
    # Hash de la clave recibida
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    # Buscar en database
    result = db.execute(
        "SELECT user_id, scopes, rate_limit, expires_at, revoked_at "
        "FROM api_keys WHERE key_hash = %s",
        (key_hash,)
    ).fetchone()

    if not result:
        return None

    # Verificar si está revocada
    if result['revoked_at']:
        return None

    # Verificar expiración
    if result['expires_at'] and datetime.now() > result['expires_at']:
        return None

    # Actualizar last_used_at
    db.execute(
        "UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = %s",
        (key_hash,)
    )

    return {
        'user_id': result['user_id'],
        'scopes': result['scopes'],
        'rate_limit': result['rate_limit']
    }

@app.route('/api/v1/protected')
def protected_endpoint():
    api_key = request.headers.get('X-API-Key')

    if not api_key:
        return {"error": "API key missing"}, 401

    key_info = validate_api_key(api_key)

    if not key_info:
        return {"error": "Invalid or expired API key"}, 401

    # Verificar permisos
    if 'read' not in key_info['scopes']:
        return {"error": "Insufficient permissions"}, 403

    return {"data": "protected resource", "user_id": key_info['user_id']}
```

### Scope-Based Permissions

```python
def require_api_scope(required_scope):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            api_key = request.headers.get('X-API-Key')
            key_info = validate_api_key(api_key)

            if required_scope not in key_info['scopes']:
                return {"error": f"Scope '{required_scope}' required"}, 403

            request.key_info = key_info
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/v1/users', methods=['GET'])
@require_api_scope('users:read')
def list_users():
    return {"users": [...]}

@app.route('/api/v1/users', methods=['POST'])
@require_api_scope('users:write')
def create_user():
    return {"status": "created"}
```

---

## HMAC-Based Authentication {#hmac}

**HMAC** (Hash-based Message Authentication Code) proporciona autenticación e integridad mediante firmas criptográficas.

### Patrón AWS Signature Version 4

```python
import hmac
import hashlib
from datetime import datetime
from urllib.parse import quote

def sign_request(method, path, query_params, headers, body, access_key, secret_key):
    # 1. Crear canonical request
    canonical_uri = quote(path, safe='/')
    canonical_querystring = '&'.join(
        f"{quote(k, safe='')}={quote(v, safe='')}"
        for k, v in sorted(query_params.items())
    )

    canonical_headers = '\n'.join(
        f"{k.lower()}:{v.strip()}"
        for k, v in sorted(headers.items())
    )
    signed_headers = ';'.join(sorted(h.lower() for h in headers.keys()))

    payload_hash = hashlib.sha256(body.encode()).hexdigest()

    canonical_request = '\n'.join([
        method,
        canonical_uri,
        canonical_querystring,
        canonical_headers,
        '',  # Línea vacía después de headers
        signed_headers,
        payload_hash
    ])

    # 2. Crear string to sign
    timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    date_stamp = timestamp[:8]

    algorithm = 'HMAC-SHA256'
    credential_scope = f"{date_stamp}/us-east-1/api/aws4_request"

    string_to_sign = '\n'.join([
        algorithm,
        timestamp,
        credential_scope,
        hashlib.sha256(canonical_request.encode()).hexdigest()
    ])

    # 3. Calcular firma
    def sign(key, msg):
        return hmac.new(key, msg.encode(), hashlib.sha256).digest()

    k_date = sign(f"AWS4{secret_key}".encode(), date_stamp)
    k_region = sign(k_date, "us-east-1")
    k_service = sign(k_region, "api")
    k_signing = sign(k_service, "aws4_request")

    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()

    # 4. Crear Authorization header
    authorization_header = (
        f"{algorithm} "
        f"Credential={access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, "
        f"Signature={signature}"
    )

    return {
        'Authorization': authorization_header,
        'X-Amz-Date': timestamp
    }

# Uso
method = 'POST'
path = '/api/v1/users'
query_params = {}
headers = {
    'Host': 'api.example.com',
    'Content-Type': 'application/json'
}
body = '{"name":"John Doe"}'

access_key = 'AKIAIOSFODNN7EXAMPLE'
secret_key = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'

auth_headers = sign_request(method, path, query_params, headers, body, access_key, secret_key)

# Request con firma
import requests
response = requests.post(
    'https://api.example.com/api/v1/users',
    headers={**headers, **auth_headers},
    data=body
)
```

### Validación Server-Side

```python
def verify_hmac_signature(request):
    # Extraer Authorization header
    auth_header = request.headers.get('Authorization')
    timestamp = request.headers.get('X-Amz-Date')

    # Parsear authorization header
    # Format: HMAC-SHA256 Credential=..., SignedHeaders=..., Signature=...
    parts = auth_header.split(', ')
    credential = parts[0].split('=')[1]
    signed_headers = parts[1].split('=')[1]
    received_signature = parts[2].split('=')[1]

    # Obtener access_key y secret_key de credential
    access_key = credential.split('/')[0]
    secret_key = get_secret_key(access_key)  # Lookup in database

    # Reconstruir canonical request (mismo algoritmo que el cliente)
    method = request.method
    path = request.path
    query_params = request.args.to_dict()
    headers = {k: v for k, v in request.headers.items()
               if k.lower() in signed_headers.split(';')}
    body = request.get_data(as_text=True)

    # Calcular firma esperada
    expected_auth = sign_request(method, path, query_params, headers, body,
                                  access_key, secret_key)

    expected_signature = expected_auth['Authorization'].split('Signature=')[1]

    # Comparar en tiempo constante
    if not hmac.compare_digest(received_signature, expected_signature):
        return False

    # Verificar timestamp (prevenir replay attacks)
    request_time = datetime.strptime(timestamp, '%Y%m%dT%H%M%SZ')
    time_diff = abs((datetime.utcnow() - request_time).total_seconds())

    if time_diff > 900:  # 15 minutos de tolerancia
        return False

    return True
```

### Replay Attack Prevention

```python
# Almacenar nonces usados (Redis con TTL)
import redis

redis_client = redis.Redis()

def check_replay(timestamp, signature):
    # Crear clave única basada en firma
    replay_key = f"replay:{signature}"

    # Verificar si ya fue usado
    if redis_client.exists(replay_key):
        raise ValueError("Request replay detected")

    # Marcar como usado (TTL = 15 minutos)
    redis_client.setex(replay_key, 900, value="used")
```

---

## Mutual TLS (mTLS) {#mtls}

**mTLS** autentica tanto cliente como servidor mediante certificados X.509.

### Generación de Certificados Cliente

```bash
# 1. Generar clave privada del cliente
openssl genrsa -out client.key 2048

# 2. Crear CSR (Certificate Signing Request)
openssl req -new -key client.key -out client.csr \
  -subj "/C=US/ST=CA/L=SF/O=Example/CN=client.example.com"

# 3. Firmar CSR con CA (Certificate Authority)
openssl x509 -req -in client.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out client.crt -days 365 -sha256
```

### Configuración Servidor (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    # Certificado del servidor
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # mTLS: Requerir certificado de cliente
    ssl_client_certificate /etc/nginx/ssl/ca.crt;
    ssl_verify_client on;
    ssl_verify_depth 2;

    # Pasar información del certificado a backend
    proxy_set_header X-SSL-Client-CN $ssl_client_s_dn_cn;
    proxy_set_header X-SSL-Client-Cert $ssl_client_cert;

    location /api/ {
        proxy_pass http://backend:8000;
    }
}
```

### Cliente Python con mTLS

```python
import requests

# Request con certificado de cliente
response = requests.get(
    'https://api.example.com/protected',
    cert=('client.crt', 'client.key'),  # Certificado y clave privada
    verify='ca.crt'  # CA para verificar servidor
)
```

### Extracción de Información del Certificado (Backend)

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/api/protected')
def protected():
    # Nginx pasa certificado en headers
    client_cert = request.headers.get('X-SSL-Client-Cert')
    client_cn = request.headers.get('X-SSL-Client-CN')

    if not client_cert:
        return {"error": "Client certificate required"}, 401

    # Validar CN contra whitelist
    allowed_cns = ['client.example.com', 'service-a.example.com']
    if client_cn not in allowed_cns:
        return {"error": "Unauthorized client"}, 403

    return {"message": "Authenticated", "client": client_cn}
```

---

## Rate Limiting {#rate-limiting}

### Token Bucket Algorithm

```python
import time
import redis

redis_client = redis.Redis()

class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity  # Tokens máximos
        self.refill_rate = refill_rate  # Tokens por segundo

    def consume(self, api_key, tokens=1):
        key = f"rate_limit:{api_key}"
        now = time.time()

        # Script Lua para atomicidad en Redis
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local tokens_requested = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])

        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now

        -- Calcular tokens a agregar desde último refill
        local elapsed = now - last_refill
        local tokens_to_add = elapsed * refill_rate
        tokens = math.min(capacity, tokens + tokens_to_add)

        -- Verificar si hay tokens suficientes
        if tokens >= tokens_requested then
            tokens = tokens - tokens_requested
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, 3600)
            return 1  -- Success
        else
            return 0  -- Rate limit exceeded
        end
        """

        result = redis_client.eval(
            lua_script,
            1,  # Number of keys
            key,
            self.capacity,
            self.refill_rate,
            tokens,
            now
        )

        return bool(result)

# Uso
rate_limiter = TokenBucket(capacity=100, refill_rate=10)  # 100 tokens, 10/seg

@app.route('/api/resource')
def resource():
    api_key = request.headers.get('X-API-Key')

    if not rate_limiter.consume(api_key):
        return {
            "error": "Rate limit exceeded",
            "retry_after": 10
        }, 429  # Too Many Requests

    return {"data": "resource"}
```

### Rate Limit Headers

```python
@app.after_request
def add_rate_limit_headers(response):
    api_key = request.headers.get('X-API-Key')

    if api_key:
        # Obtener estado actual
        bucket_key = f"rate_limit:{api_key}"
        bucket_data = redis_client.hgetall(bucket_key)

        tokens_remaining = int(bucket_data.get(b'tokens', 100))
        limit = 100  # Capacity

        response.headers['X-RateLimit-Limit'] = str(limit)
        response.headers['X-RateLimit-Remaining'] = str(tokens_remaining)
        response.headers['X-RateLimit-Reset'] = str(int(time.time()) + 60)

    return response
```

---

## API Gateways {#api-gateways}

### Kong API Gateway

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: user-service
    url: http://backend:8000
    routes:
      - name: users-route
        paths:
          - /api/v1/users

plugins:
  # Rate limiting
  - name: rate-limiting
    config:
      minute: 100
      hour: 5000
      policy: redis
      redis_host: redis
      redis_port: 6379

  # Authentication
  - name: key-auth
    config:
      key_names:
        - apikey

  # Request transformation
  - name: request-transformer
    config:
      add:
        headers:
          - X-Gateway-ID:kong-01

  # CORS
  - name: cors
    config:
      origins:
        - https://app.example.com
      methods:
        - GET
        - POST
      credentials: true
```

### AWS API Gateway

```python
import boto3

client = boto3.client('apigateway')

# Crear API
api = client.create_rest_api(
    name='MyAPI',
    description='Protected API with authentication',
    endpointConfiguration={'types': ['REGIONAL']}
)

# Crear API key
api_key = client.create_api_key(
    name='client-key-1',
    enabled=True,
    value='sk_live_...'
)

# Crear usage plan (rate limiting)
usage_plan = client.create_usage_plan(
    name='basic-plan',
    throttle={
        'rateLimit': 100.0,  # 100 req/seg
        'burstLimit': 200
    },
    quota={
        'limit': 10000,  # 10k req/mes
        'period': 'MONTH'
    }
)

# Asociar API key al usage plan
client.create_usage_plan_key(
    usagePlanId=usage_plan['id'],
    keyId=api_key['id'],
    keyType='API_KEY'
)
```

---

## Comparación de Métodos {#comparacion}

| Método | Complejidad | Seguridad | Rendimiento | Caso de Uso |
|--------|-------------|-----------|-------------|-------------|
| **API Keys** | Baja | Media | Alto | APIs públicas, mobile apps |
| **JWT Bearer** | Media | Alta | Alto | Microservicios, SPAs |
| **HMAC Signature** | Alta | Muy Alta | Medio | AWS SDK, high-security APIs |
| **mTLS** | Muy Alta | Muy Alta | Medio | Service-to-service, banking |
| **OAuth 2.0** | Alta | Alta | Medio | Third-party integrations |

### Recomendaciones por Escenario

```yaml
Public API (externa):
  - API Keys con rate limiting
  - OAuth 2.0 para third-party access

Internal Microservices:
  - JWT con firma asimétrica (RS256/ES256)
  - mTLS para máxima seguridad
  - Service mesh (Istio, Linkerd) para mTLS automático

Mobile Apps:
  - OAuth 2.0 + PKCE
  - JWT tokens de corta vida

IoT Devices:
  - mTLS con certificados por dispositivo
  - API Keys con rotación automática

High-Security (Banking, Healthcare):
  - mTLS obligatorio
  - HMAC signatures
  - Token encryption (JWE)
  - Hardware Security Modules (HSM)
```

---

## Referencias {#referencias}

### Estándares

- **RFC 2617**: HTTP Authentication - https://datatracker.ietf.org/doc/html/rfc2617
- **RFC 6750**: OAuth 2.0 Bearer Token Usage - https://datatracker.ietf.org/doc/html/rfc6750
- **AWS Signature v4**: https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html

### Herramientas

- **Kong Gateway**: https://konghq.com
- **AWS API Gateway**: https://aws.amazon.com/api-gateway/
- **Apigee**: https://cloud.google.com/apigee
- **Tyk**: https://tyk.io (open source)

### Próximos Pasos

1. Practicar con [Lab 01: JWS Avanzado](../laboratorios/lab_01_jws_avanzado/README.md)
2. Implementar [Lab 03: Sistema Auth JWT Completo](../laboratorios/lab_03_jwt_auth_system/README.md)

---

**Autor**: Curso de Ciberseguridad Avanzada
**Última actualización**: 2026-02-23
**Versión**: 1.0
