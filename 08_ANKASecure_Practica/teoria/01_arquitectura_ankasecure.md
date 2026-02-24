# 8.1 ARQUITECTURA DE ANKASECURE

## VISIÓN GENERAL EXPANDIDA

### 📖 ¿QUÉ ES ANKASecure?

**ANKASecure** es una plataforma empresarial de **Key Management Service (KMS)** diseñada para centralizar el ciclo de vida de claves criptográficas en entornos multi-tenant. Proporciona:

1. **Gestión centralizada de claves**: AES, RSA, ECC, y PQC (ML-KEM, ML-DSA)
2. **HSM Integration**: Integración con Hardware Security Modules (PKCS#11, KMIP)
3. **API RESTful**: OAuth 2.0 + mTLS para autenticación
4. **Multi-tenancy**: Aislamiento de claves por organización/tenant
5. **Compliance**: ISO 27001, SOC 2 Type II, FIPS 140-2 Level 3
6. **Auditoría**: Logs inmutables de todas las operaciones

### 🤔 ¿POR QUÉ ESTA ARQUITECTURA?

**Problema que resuelve**:
- ❌ **Antes**: Claves hardcodeadas en aplicaciones (90% de breaches involucran credenciales comprometidas - Verizon DBIR 2023)
- ❌ **Antes**: Cada app gestiona sus propias claves (sin rotación, sin auditoría)
- ❌ **Antes**: No hay cumplimiento de compliance (ISO 27001 Anexo A.10.1)

**Solución ANKASecure**:
- ✅ **Centralización**: Single source of truth para claves
- ✅ **Rotación automática**: Policies de rotación cada 90 días
- ✅ **Auditoría completa**: Cada operación loggeada con timestamp + usuario
- ✅ **HSM backing**: Claves sensibles nunca salen del HSM

### 🎯 ¿PARA QUÉ SE USA?

**Casos de uso principales**:

1. **Cifrado de bases de datos (TDE - Transparent Data Encryption)**
   - Postgres/MySQL con pg_crypto/keyring
   - Master keys en ANKASecure, data keys en app

2. **API Key Management**
   - JWT signing keys para OAuth 2.0
   - HMAC keys para webhook validation
   - API keys con scopes y expiración

3. **Cifrado de archivos (File Encryption)**
   - S3 buckets con SSE-C (Server-Side Encryption - Customer Provided)
   - DEK (Data Encryption Keys) envueltas con KEK (Key Encryption Keys)

4. **PKI as a Service**
   - Generación de certificados X.509
   - CSR signing con CA intermedia en HSM
   - Revocación con OCSP/CRL

5. **Compliance**
   - PCI-DSS Requirement 3 (Protect Stored Cardholder Data)
   - GDPR Art. 32 (Security of Processing)
   - HIPAA §164.312(a)(2)(iv) (Encryption)

---

## Componentes Principales

### 1. Key Management Service (KMS)

#### 📖 ¿Qué es?
El KMS es el corazón de ANKASecure. Gestiona todo el ciclo de vida de claves criptográficas desde su generación hasta su destrucción segura.

**Operaciones soportadas**:
- Generación de claves (RSA, ECC, PQC)
- Almacenamiento seguro
- Rotación automática
- Revocación
- Auditoría

#### 🤔 ¿Por qué centralizar claves?
- **Eliminación de silos**: Sin el KMS, cada aplicación genera y guarda claves localmente (archivos .pem, variables de entorno, bases de datos)
- **Auditoría unificada**: Un único punto para rastrear quién usó qué clave y cuándo
- **Rotación coordinada**: Actualizar 50 servicios con nuevas claves manualmente es propenso a errores

#### 🎯 ¿Para qué sirve?
```python
# Ejemplo: Gestión completa de ciclo de vida de claves

import ankasecure_sdk as anka

client = anka.Client(api_key="ak_live_...")

# 1. GENERACIÓN: Crear clave AES para cifrado de DB
key = client.kms.create_key(
    algorithm="AES-256-GCM",
    purpose="encrypt",
    metadata={
        "app": "payment-service",
        "env": "production",
        "owner": "team-backend"
    },
    auto_rotate=True,
    rotation_period_days=90
)
print(f"Key ID: {key.id}")

# 2. USO: Cifrar datos sensibles
plaintext = "4532-1234-5678-9010"  # Número de tarjeta
encrypted = client.kms.encrypt(
    key_id=key.id,
    plaintext=plaintext,
    context={"user_id": "usr_12345"}  # Additional Authenticated Data (AAD)
)

# 3. ROTACIÓN: Forzar rotación inmediata
client.kms.rotate_key(key.id)

# 4. AUDITORÍA: Ver histórico de uso
audit_logs = client.kms.get_key_audit_log(
    key_id=key.id,
    start_date="2024-01-01",
    end_date="2024-12-31"
)
for log in audit_logs:
    print(f"{log.timestamp} - {log.operation} by {log.user_id}")

# 5. REVOCACIÓN: Desactivar clave comprometida
client.kms.revoke_key(key.id, reason="Suspected compromise")
```

#### 🏗️ Arquitectura interna del KMS

```
┌─────────────────────────────────────────────────────────────┐
│                      KMS SERVICE                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Key Manager │  │  Rotation    │  │  Audit       │      │
│  │              │  │  Scheduler   │  │  Logger      │      │
│  │  - CRUD      │  │              │  │              │      │
│  │  - Validation│  │  - Cron jobs │  │  - Write-once│      │
│  │  - Policies  │  │  - Alerts    │  │  - ELK       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │           PostgreSQL (Key Metadata DB)             │     │
│  │                                                     │     │
│  │  Table: keys                                        │     │
│  │  - id (UUID)                                        │     │
│  │  - tenant_id                                        │     │
│  │  - algorithm (AES-256, RSA-4096, ML-KEM-768)       │     │
│  │  - wrapped_key (encrypted with HSM KEK)            │     │
│  │  - created_at, rotated_at, expires_at              │     │
│  │  - status (active, rotated, revoked)               │     │
│  └─────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │              HSM Cluster (FIPS 140-2 L3)           │     │
│  │                                                     │     │
│  │  - KEK (Key Encryption Key) stored here            │     │
│  │  - Never leaves HSM                                │     │
│  │  - Used to wrap/unwrap DEKs                        │     │
│  └─────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

#### 💻 Esquema de Base de Datos

```sql
-- Tabla principal de claves
CREATE TABLE keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    key_id VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "key_prod_payment_001"
    algorithm VARCHAR(50) NOT NULL,        -- AES-256-GCM, RSA-4096, etc.
    purpose VARCHAR(50) NOT NULL,          -- encrypt, sign, wrap, derive
    wrapped_key BYTEA NOT NULL,            -- DEK encrypted with HSM KEK
    hsm_key_id VARCHAR(255),               -- Handle for HSM-resident keys
    created_at TIMESTAMP DEFAULT NOW(),
    rotated_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',   -- active, rotated, revoked, destroyed
    auto_rotate BOOLEAN DEFAULT FALSE,
    rotation_period_days INTEGER,
    metadata JSONB,                        -- Custom tags, cost center, etc.

    CONSTRAINT valid_status CHECK (status IN ('active', 'rotated', 'revoked', 'destroyed')),
    CONSTRAINT valid_purpose CHECK (purpose IN ('encrypt', 'sign', 'wrap', 'derive', 'mac'))
);

-- Índices para performance
CREATE INDEX idx_tenant_keys ON keys(tenant_id, status);
CREATE INDEX idx_expires ON keys(expires_at) WHERE status = 'active';
CREATE INDEX idx_rotation ON keys(rotated_at) WHERE auto_rotate = TRUE;

-- Tabla de auditoría
CREATE TABLE key_audit_log (
    id BIGSERIAL PRIMARY KEY,
    key_id UUID NOT NULL REFERENCES keys(id),
    operation VARCHAR(50) NOT NULL,  -- create, encrypt, decrypt, rotate, revoke
    user_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Índice para búsquedas de auditoría
CREATE INDEX idx_audit_key_time ON key_audit_log(key_id, timestamp DESC);
CREATE INDEX idx_audit_user ON key_audit_log(user_id, timestamp DESC);

-- Vista para claves próximas a expirar
CREATE VIEW keys_expiring_soon AS
SELECT
    key_id,
    tenant_id,
    expires_at,
    expires_at - NOW() AS time_remaining
FROM keys
WHERE
    status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW() + INTERVAL '30 days';
```

### 2. Crypto Service

#### 📖 ¿Qué es?
El Crypto Service proporciona operaciones criptográficas de alto nivel sin exponer directamente las claves. Implementa estándares JOSE (JSON Object Signing and Encryption).

**Operaciones soportadas**:
- **JWS**: Firmas JSON (RFC 7515)
- **JWE**: Cifrado JSON (RFC 7516)
- **JWET**: Streaming seguro (archivos >5MB) - Extensión propietaria de ANKASecure
- **Híbrido**: Clásico + PQC (dual signatures para transición cuántica)

#### 🤔 ¿Por qué JOSE (JWS/JWE)?
- **Estándar abierto**: Interoperabilidad con servicios externos (Auth0, Okta)
- **Flexibilidad**: Soporta múltiples algoritmos (RS256, ES256, EdDSA)
- **Compacto**: Formato serializado en base64url (apto para HTTP headers)
- **Auditable**: Headers revelan algoritmo usado (`alg`, `kid`)

#### 🎯 ¿Para qué se usa?

**Caso 1: JWS - Firmar tokens JWT**
```python
import ankasecure_sdk as anka

client = anka.Client(api_key="ak_live_...")

# Crear clave para firmar JWTs
signing_key = client.kms.create_key(
    algorithm="ES256",  # ECDSA with P-256 and SHA-256
    purpose="sign"
)

# Firmar payload JWT
payload = {
    "sub": "user_12345",
    "name": "John Doe",
    "iat": 1703001600,
    "exp": 1703005200
}

jws = client.crypto.sign_jws(
    key_id=signing_key.id,
    payload=payload,
    headers={
        "kid": signing_key.id,
        "typ": "JWT"
    }
)

# Resultado: eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleV8xMjMiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzAzMDAxNjAwLCJleHAiOjE3MDMwMDUyMDB9.MEUCIQDx...

# Verificar firma
is_valid = client.crypto.verify_jws(
    jws=jws,
    key_id=signing_key.id
)
print(f"Signature valid: {is_valid}")
```

**Caso 2: JWE - Cifrar datos sensibles**
```python
# Crear clave para cifrado
encryption_key = client.kms.create_key(
    algorithm="RSA-OAEP-256",
    purpose="encrypt"
)

# Cifrar datos médicos (HIPAA compliance)
medical_record = {
    "patient_id": "P-9876",
    "diagnosis": "Diabetes Type 2",
    "medications": ["Metformin 500mg", "Insulin"]
}

jwe = client.crypto.encrypt_jwe(
    key_id=encryption_key.id,
    plaintext=medical_record,
    content_encryption="A256GCM"  # AES-256 in GCM mode
)

# Resultado JWE compacto: eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.OKOawDo13gRp2ojaHV7LFpZcgV7T6DVZKTyKOMTYUmKoTCVJRgckCL9kiMT03JGeipsEdY3mx_etLbbWSrFr05kLzcSr4qKAq7YN6y...

# Descifrar
decrypted = client.crypto.decrypt_jwe(
    jwe=jwe,
    key_id=encryption_key.id
)
assert decrypted == medical_record
```

**Caso 3: JWET - Streaming de archivos grandes**
```python
# Problema: JWE estándar carga todo en memoria
# Solución: JWET (ANKASecure extension) procesa por chunks

import io

# Cifrar archivo de 500MB sin cargarlo en memoria
with open("database_backup.sql", "rb") as input_file:
    with open("database_backup.sql.jwet", "wb") as output_file:
        client.crypto.encrypt_jwet_stream(
            key_id=encryption_key.id,
            input_stream=input_file,
            output_stream=output_file,
            chunk_size=1024 * 1024  # 1MB chunks
        )

# Descifrar streaming
with open("database_backup.sql.jwet", "rb") as encrypted_file:
    with open("restored.sql", "wb") as output_file:
        client.crypto.decrypt_jwet_stream(
            key_id=encryption_key.id,
            input_stream=encrypted_file,
            output_stream=output_file
        )
```

**Caso 4: Firmas híbridas (Clásico + PQC)**
```python
# Crear par de claves híbrido
classic_key = client.kms.create_key(algorithm="ECDSA-P384", purpose="sign")
pqc_key = client.kms.create_key(algorithm="ML-DSA-65", purpose="sign")

# Firmar con ambas claves (quantum-safe)
document = b"Contrato de compraventa..."

hybrid_signature = client.crypto.sign_hybrid(
    classic_key_id=classic_key.id,
    pqc_key_id=pqc_key.id,
    data=document
)

# Formato: {"classic": "MEUCIQD...", "pqc": "A3F2B1..."}

# Verificar (ambas firmas deben ser válidas)
is_valid = client.crypto.verify_hybrid(
    signature=hybrid_signature,
    classic_key_id=classic_key.id,
    pqc_key_id=pqc_key.id,
    data=document
)
```

#### 🏗️ Diagrama de flujo JWE

```
┌─────────────┐
│   Cliente   │
│             │
│  Plaintext  │
│  + Key ID   │
└──────┬──────┘
       │
       │ POST /v1/crypto/jwe/encrypt
       │
       ▼
┌────────────────────────────────────────┐
│       Crypto Service                   │
│                                        │
│  1. Validar Key ID y permisos          │
│  2. Generar CEK (Content Encryption    │
│     Key) aleatorio AES-256             │
│  3. Cifrar plaintext con CEK+GCM       │
│  4. Cifrar CEK con RSA-OAEP (usando    │
│     clave del KMS)                     │
│  5. Ensamblar JWE:                     │
│     - Header (alg, enc, kid)           │
│     - Encrypted CEK                    │
│     - IV (96 bits para GCM)            │
│     - Ciphertext                       │
│     - Auth Tag (128 bits GCM)          │
└────────────┬───────────────────────────┘
             │
             │ JWE compacto (5 partes separadas por '.')
             │
             ▼
      ┌──────────────┐
      │   Cliente    │
      │              │
      │  Almacena JWE│
      │  en DB/S3    │
      └──────────────┘
```

### 3. API Gateway

#### 📖 ¿Qué es?
El API Gateway es el punto de entrada único para todas las peticiones a ANKASecure. Actúa como proxy reverso que aplica políticas de seguridad, rate limiting, y observabilidad antes de enrutar las peticiones a los microservicios internos.

**Responsabilidades**:
- Autenticación (API keys, OAuth 2.0, mTLS)
- Autorización (validación de scopes)
- Rate limiting (prevención de DDoS)
- Logging centralizado
- Métricas y monitoreo
- Transformación de requests/responses

#### 🤔 ¿Por qué un API Gateway?
**Sin Gateway (problemas)**:
- ❌ Cada microservicio implementa autenticación independientemente (código duplicado)
- ❌ No hay protección contra ataques de fuerza bruta coordinados
- ❌ Logging inconsistente entre servicios
- ❌ Difícil implementar cambios de seguridad (actualizar 15 servicios vs 1 gateway)

**Con Gateway (beneficios)**:
- ✅ **Seguridad centralizada**: Un único punto para aplicar políticas
- ✅ **Desacoplamiento**: Backend no necesita conocer detalles de autenticación
- ✅ **Observabilidad**: Logs estructurados de todas las peticiones
- ✅ **Rate limiting inteligente**: Por tenant, por API key, por IP

#### 🎯 ¿Para qué se usa?

**Flujo de autenticación OAuth 2.0 + mTLS**
```bash
# 1. Cliente obtiene access token
curl -X POST https://auth.ankasecure.com/oauth/token \
  --cert client.crt \
  --key client.key \
  --cacert ca.crt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=app_prod_payment" \
  -d "client_secret=cs_live_..." \
  -d "scope=keys:read keys:write"

# Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIn0.eyJpc3MiOiJodHRwczovL2F1dGguYW5rYXNlY3VyZS5jb20iLCJzdWIiOiJhcHBfcHJvZF9wYXltZW50IiwiYXVkIjoiaHR0cHM6Ly9hcGkuYW5rYXNlY3VyZS5jb20iLCJleHAiOjE3MDMwMDg4MDAsImlhdCI6MTcwMzAwNTIwMCwic2NvcGUiOiJrZXlzOnJlYWQga2V5czp3cml0ZSJ9.MEUCIQDxyz...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "keys:read keys:write"
}

# 2. Usar token para acceder a API
curl -X POST https://api.ankasecure.com/v1/keys \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "AES-256-GCM",
    "purpose": "encrypt"
  }'
```

**Configuración de Rate Limiting**
```yaml
# config/gateway.yaml
rate_limiting:
  # Por tenant (prevenir que un tenant abuse recursos)
  - scope: tenant
    limit: 10000  # requests
    window: 60s   # por minuto

  # Por API key (prevenir key comprometida)
  - scope: api_key
    limit: 1000
    window: 60s

  # Por IP (prevenir DDoS)
  - scope: ip_address
    limit: 100
    window: 60s
    burst: 20  # Permitir bursts cortos

  # Por operación (operaciones costosas)
  - scope: operation
    path: "/v1/keys/*/sign"
    limit: 500
    window: 60s
```

**Implementación con Kong Gateway**
```bash
# Instalar Kong
docker run -d --name kong-gateway \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=postgres.internal" \
  -e "KONG_PG_PASSWORD=secret" \
  -p 8000:8000 \
  -p 8443:8443 \
  kong:3.5

# Configurar servicio KMS
curl -X POST http://localhost:8001/services \
  -d "name=kms-service" \
  -d "url=http://kms.internal:8080"

# Configurar ruta
curl -X POST http://localhost:8001/services/kms-service/routes \
  -d "paths[]=/v1/keys" \
  -d "methods[]=GET" \
  -d "methods[]=POST"

# Habilitar plugin de autenticación JWT
curl -X POST http://localhost:8001/services/kms-service/plugins \
  -d "name=jwt" \
  -d "config.secret_is_base64=false" \
  -d "config.key_claim_name=kid"

# Habilitar rate limiting
curl -X POST http://localhost:8001/services/kms-service/plugins \
  -d "name=rate-limiting" \
  -d "config.minute=1000" \
  -d "config.policy=redis" \
  -d "config.redis_host=redis.internal"

# Habilitar logging a ELK
curl -X POST http://localhost:8001/services/kms-service/plugins \
  -d "name=http-log" \
  -d "config.http_endpoint=http://logstash.internal:5044"
```

#### 🏗️ Arquitectura del Gateway

```
                    Internet
                       │
                       │ HTTPS (TLS 1.3)
                       │
                       ▼
         ┌─────────────────────────────┐
         │     Load Balancer (AWS ALB)  │
         │  - SSL Termination           │
         │  - Health checks             │
         └─────────────┬───────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌──────────┐             ┌──────────┐
    │ Gateway  │             │ Gateway  │
    │  Node 1  │             │  Node 2  │
    └────┬─────┘             └────┬─────┘
         │                         │
         │  Shared Redis (rate limit counters)
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    1. JWT Validation          2. Rate Limit Check
         │                         │
         │                         ▼
         │                   ┌──────────┐
         │                   │  Redis   │
         │                   │  Cluster │
         │                   └──────────┘
         │
    3. Route to backend
         │
         ▼
    ┌──────────────────────────────────┐
    │      Microservices (K8s)         │
    │                                  │
    │  ┌────────┐  ┌────────┐         │
    │  │  KMS   │  │ Crypto │         │
    │  │  Svc   │  │  Svc   │         │
    │  └────────┘  └────────┘         │
    └──────────────────────────────────┘
```

#### 💻 Logging estructurado

**Formato de logs (JSON)**
```json
{
  "timestamp": "2024-12-19T10:30:45.123Z",
  "request_id": "req_a1b2c3d4",
  "method": "POST",
  "path": "/v1/keys",
  "status": 201,
  "duration_ms": 45,
  "client_ip": "203.0.113.45",
  "user_agent": "ankasecure-sdk/2.1.0 python/3.11",
  "tenant_id": "tenant_prod_acme",
  "user_id": "app_payment_service",
  "response_size_bytes": 512,
  "rate_limit_remaining": 9500,
  "tags": {
    "environment": "production",
    "region": "us-east-1"
  }
}
```

**Query logs con ELK**
```
# Buscar errores 5xx en últimas 24h
status:[500 TO 599] AND timestamp:[now-24h TO now]

# Peticiones lentas (>1s)
duration_ms:>1000

# Top usuarios por volumen
{
  "aggs": {
    "top_users": {
      "terms": {
        "field": "user_id",
        "size": 10
      }
    }
  }
}
```

### 4. Audit Log Service

#### 📖 ¿Qué es?
El Audit Log Service registra **todas** las operaciones realizadas en ANKASecure de forma inmutable, cumpliendo requisitos de compliance como SOC 2, ISO 27001, HIPAA, y PCI-DSS.

**Características**:
- Todas las operaciones registradas (WHO, WHAT, WHEN, WHERE)
- Inmutable (append-only, no se pueden modificar/eliminar logs)
- Compliance (HIPAA, PCI DSS, SOC 2)
- Retención configurable (mínimo 7 años para compliance financiero)
- Búsqueda en tiempo real (Elasticsearch)
- Alertas automáticas (anomalías, accesos sospechosos)

#### 🤔 ¿Por qué inmutabilidad?
**Requisitos de compliance**:
- **PCI-DSS 10.3.4**: Los registros de auditoría deben estar protegidos contra modificaciones
- **SOC 2 CC6.3**: Los logs de acceso deben ser completos, precisos, y protegidos
- **HIPAA §164.312(b)**: Implementar mecanismos para registrar y examinar actividad

**Implementación técnica**:
- **Write-Ahead Log (WAL)**: Logs escritos secuencialmente, nunca sobreescritos
- **Cryptographic chaining**: Cada log firma el hash del log anterior (blockchain-style)
- **Tamper detection**: Verificación de integridad con Merkle trees

#### 🎯 ¿Para qué se usa?

**Caso 1: Investigación de incidentes**
```python
import ankasecure_sdk as anka

client = anka.Client(api_key="ak_live_...")

# Buscar accesos a una clave específica en las últimas 24h
logs = client.audit.search(
    resource_type="key",
    resource_id="key_prod_payment_001",
    start_time="2024-12-18T00:00:00Z",
    end_time="2024-12-19T00:00:00Z",
    operations=["decrypt", "export"]
)

for log in logs:
    print(f"{log.timestamp} - {log.user_id} - {log.operation} - {log.ip_address}")
    if log.geo_location.country != "US":
        print(f"  ⚠️ ALERTA: Acceso desde {log.geo_location.country}")

# Output:
# 2024-12-18T10:30:00Z - app_payment_service - decrypt - 10.0.1.50
# 2024-12-18T14:22:00Z - admin@acme.com - export - 203.0.113.45
#   ⚠️ ALERTA: Acceso desde RU (Rusia)
```

**Caso 2: Reporte de compliance**
```python
# Generar reporte PCI-DSS Requirement 10 (Track and monitor all access)
report = client.audit.generate_compliance_report(
    standard="PCI-DSS-4.0",
    requirement="10",
    start_date="2024-01-01",
    end_date="2024-12-31",
    format="pdf"
)

# El reporte incluye:
# - Total de operaciones por tipo
# - Usuarios con más accesos
# - Claves más utilizadas
# - Accesos fuera de horario laboral
# - Accesos desde IPs desconocidas
# - Operaciones fallidas (posibles ataques)

report.save("compliance_report_2024.pdf")
```

**Caso 3: Alertas en tiempo real**
```python
# Configurar alerta para accesos sospechosos
client.audit.create_alert(
    name="Exportación de claves fuera de horario",
    conditions=[
        {
            "field": "operation",
            "operator": "equals",
            "value": "export_key"
        },
        {
            "field": "timestamp.hour",
            "operator": "not_in_range",
            "value": [8, 18]  # Fuera de 8am-6pm
        }
    ],
    actions=[
        {
            "type": "email",
            "recipients": ["security@acme.com"]
        },
        {
            "type": "slack",
            "webhook": "https://hooks.slack.com/services/..."
        },
        {
            "type": "pagerduty",
            "severity": "high"
        }
    ]
)
```

#### 🏗️ Arquitectura de Audit Log

```
┌──────────────────────────────────────────────────────────┐
│                  APLICACIONES                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │  KMS   │  │ Crypto │  │Gateway │  │  Auth  │         │
│  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘         │
│      │           │            │            │              │
│      └───────────┴────────────┴────────────┘              │
│                    │                                      │
│              Emit audit events                           │
└────────────────────┼──────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│               KAFKA (Event Stream)                        │
│                                                           │
│  Topic: audit-logs                                        │
│  Partitions: 10 (por tenant_id hash)                     │
│  Retention: 30 days                                       │
│  Replication: 3                                           │
└────────────┬─────────────────────────────────────────────┘
             │
             │ Consume events
             │
    ┌────────┴─────────┐
    │                  │
    ▼                  ▼
┌────────────┐   ┌─────────────┐
│ Elasticsearch│   │  PostgreSQL │
│ (búsqueda)  │   │ (storage)   │
│             │   │             │
│ - Real-time │   │ - Long-term │
│   queries   │   │   retention │
│ - Kibana    │   │ - Backups   │
│   dashboard │   │ - Compliance│
└─────────────┘   └─────────────┘
```

#### 💻 Esquema de Audit Log

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

    -- WHO
    tenant_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,  -- human, service_account, api_key

    -- WHAT
    operation VARCHAR(100) NOT NULL,  -- create_key, encrypt, decrypt, etc.
    resource_type VARCHAR(50) NOT NULL,  -- key, certificate, secret
    resource_id VARCHAR(255),

    -- WHERE
    ip_address INET NOT NULL,
    user_agent TEXT,
    geo_country VARCHAR(2),  -- ISO 3166-1 alpha-2
    geo_city VARCHAR(100),

    -- RESULT
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,

    -- CONTEXT
    request_id VARCHAR(255),
    session_id VARCHAR(255),
    metadata JSONB,

    -- INTEGRITY
    previous_log_hash VARCHAR(64),  -- SHA-256 del log anterior
    log_signature BYTEA,  -- Firma del log actual

    CONSTRAINT immutable_log CHECK (FALSE)  -- ¡Nunca permitir UPDATE/DELETE!
);

-- Índices para búsquedas comunes
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_operation ON audit_logs(operation, timestamp DESC);
CREATE INDEX idx_audit_failed ON audit_logs(success, timestamp DESC) WHERE success = FALSE;

-- Trigger para prevenir modificaciones
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_update_audit_logs
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER prevent_delete_audit_logs
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

#### 📊 Dashboard de Auditoría (Kibana)

**Visualizaciones clave**:
1. **Operaciones por minuto** (gráfico de línea)
2. **Top 10 usuarios** (gráfico de barras)
3. **Operaciones fallidas** (tabla con detalles)
4. **Mapa de accesos geográficos**
5. **Claves más accedidas** (pie chart)

**Query Elasticsearch**
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "timestamp": {
              "gte": "now-24h"
            }
          }
        },
        {
          "term": {
            "operation": "decrypt"
          }
        }
      ],
      "must_not": [
        {
          "term": {
            "success": true
          }
        }
      ]
    }
  },
  "aggs": {
    "failed_by_user": {
      "terms": {
        "field": "user_id",
        "size": 20
      }
    }
  }
}
```

---

## ARQUITECTURA COMPLETA DEL SISTEMA

### 🏗️ Diagrama de Arquitectura Global

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTE APPS                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │   Web    │  │  Mobile  │  │ Backend  │  │   CLI    │       │
│   │   App    │  │   App    │  │ Service  │  │  Tool    │       │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│        │             │              │             │              │
│        └─────────────┴──────────────┴─────────────┘              │
│                          │                                        │
│                     HTTPS (TLS 1.3)                              │
│                     OAuth 2.0 + mTLS                              │
└─────────────────────────┬────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│                     API GATEWAY (Kong/Nginx)                      │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  - Rate Limiting (1000 req/min)                          │  │
│   │  - JWT Validation (RS256)                                │  │
│   │  - mTLS Certificate Pinning                              │  │
│   │  - Request Logging (ELK Stack)                           │  │
│   └───────────────────────┬──────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                  MICROSERVICIOS (Kubernetes)                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │  Auth Svc   │  │  Key Svc    │  │  HSM Svc    │            │
│   │  (OAuth2)   │  │  (CRUD)     │  │  (PKCS#11)  │            │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│          │                 │                 │                    │
│   ┌──────▼─────────────────▼─────────────────▼──────┐           │
│   │            PostgreSQL (Encrypted at Rest)        │           │
│   │      - Key Metadata (tenant, algo, created_at)   │           │
│   │      - Wrapped Keys (KEK-encrypted DEKs)         │           │
│   └──────────────────────────────────────────────────┘           │
│                            │                                      │
│   ┌────────────────────────▼──────────────────────────┐          │
│   │             Redis (Session Cache)                 │          │
│   │      - JWT tokens (10min TTL)                     │          │
│   │      - Rate limit counters                        │          │
│   └───────────────────────────────────────────────────┘          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                   HSM CLUSTER (FIPS 140-2 L3)                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│   │  HSM Node 1  │  │  HSM Node 2  │  │  HSM Node 3  │          │
│   │  (Active)    │  │  (Standby)   │  │  (Backup)    │          │
│   └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                    │
│   Operaciones:                                                    │
│   - GenerateKey (RSA-4096, ECDSA P-384, AES-256)                 │
│   - Sign/Verify (PKCS#1, PSS, ECDSA)                             │
│   - Wrap/Unwrap (AES-KW, RSA-OAEP)                               │
│   - Digest (SHA-256, SHA-384, SHA-512)                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modos de Despliegue

### SaaS (Software as a Service)

#### 📖 ¿Qué es?
ANKASecure hospedado en la nube (AWS, Azure, GCP) y gestionado completamente por el equipo de ANKASecure. Los clientes acceden vía API sin gestionar infraestructura.

**Características**:
- Cloud-hosted (multi-región para baja latencia)
- Multi-tenant (aislamiento lógico por tenant)
- Escalado automático (Kubernetes HPA)
- Mantenimiento gestionado (actualizaciones sin downtime)
- 99.99% SLA (uptime garantizado)

#### 🤔 ¿Por qué SaaS?
**Ventajas**:
- ✅ **Time-to-market**: Despliegue en minutos (vs semanas on-premise)
- ✅ **Cero mantenimiento**: No gestionar servidores, backups, parches
- ✅ **Escalabilidad elástica**: Paga solo por lo que usas
- ✅ **Compliance incluido**: SOC 2 Type II audit anual

**Desventajas**:
- ❌ **Menor control**: No puedes elegir infraestructura subyacente
- ❌ **Data residency**: Datos en regiones específicas (puede no cumplir regulaciones locales)
- ❌ **Vendor lock-in**: Dependencia del proveedor SaaS

#### 🎯 ¿Para qué clientes?
- **Startups/SMBs**: Sin equipo de infraestructura
- **Desarrollo rápido**: MVPs, prototipos
- **Cargas variables**: Apps con tráfico estacional

#### 💻 Ejemplo de uso SaaS

```python
# No requiere instalación de servidores
import ankasecure_sdk as anka

# Conectar a SaaS (US region)
client = anka.Client(
    api_key="ak_live_...",
    region="us-east-1"  # o eu-west-1, ap-southeast-1
)

# Listo para usar
key = client.kms.create_key(algorithm="AES-256-GCM")
```

**Pricing SaaS** (ejemplo):
```
- API calls: $0.10 por 1,000 requests
- Key storage: $0.50 por clave/mes
- HSM operations: $2.00 por 1,000 operaciones
- Support: $500/mes (enterprise)
```

---

### On-Premise

#### 📖 ¿Qué es?
ANKASecure desplegado en la infraestructura del cliente (data center propio o cloud privado). El cliente gestiona servidores, actualizaciones, y backups.

**Características**:
- Control total sobre infraestructura
- Cumplimiento estricto (datos nunca salen del país)
- Air-gapped posible (sin conexión a Internet)
- Gestión propia (DevOps del cliente)
- Customización profunda (modificar código si licencia lo permite)

#### 🤔 ¿Por qué On-Premise?
**Ventajas**:
- ✅ **Data sovereignty**: Cumplir regulaciones locales (GDPR, LGPD)
- ✅ **Security**: Air-gapped para entornos ultra sensibles (militar, gobierno)
- ✅ **Customización**: Integrar con sistemas legacy
- ✅ **Sin vendor lock-in**: Código en tu infraestructura

**Desventajas**:
- ❌ **CAPEX alto**: Comprar servidores, HSMs ($10K-$50K por HSM)
- ❌ **Mantenimiento**: Equipo dedicado (SRE, DBAs)
- ❌ **Escalado manual**: Planear capacidad con anticipación

#### 🎯 ¿Para qué clientes?
- **Bancos/Finanzas**: Regulación estricta (Basel III, PCI-DSS)
- **Gobierno**: Datos clasificados
- **Healthcare**: HIPAA compliance con PHI (Protected Health Information)
- **Enterprises**: >10,000 empleados, presupuesto IT robusto

#### 💻 Instalación On-Premise (Kubernetes)

```bash
# 1. Requisitos
# - Kubernetes 1.28+
# - PostgreSQL 15+
# - Redis 7+
# - Thales Luna HSM (FIPS 140-2 Level 3)

# 2. Instalar Helm chart
helm repo add ankasecure https://charts.ankasecure.com
helm repo update

# 3. Configurar values.yaml
cat > values.yaml <<EOF
global:
  domain: ankasecure.internal.company.com
  tls:
    enabled: true
    certManager: true

postgresql:
  enabled: true
  auth:
    password: CHANGE_ME
  primary:
    persistence:
      size: 100Gi
    resources:
      requests:
        memory: 4Gi
        cpu: 2

redis:
  enabled: true
  master:
    persistence:
      size: 20Gi

hsm:
  type: thales-luna
  host: hsm.internal.company.com
  partition: ankasecure-prod
  credentials:
    secretName: hsm-credentials

kms:
  replicas: 3
  resources:
    requests:
      memory: 2Gi
      cpu: 1
    limits:
      memory: 4Gi
      cpu: 2

gateway:
  replicas: 2
  rateLimit:
    requestsPerMinute: 10000

audit:
  elasticsearch:
    enabled: true
    storage: 500Gi
  retention:
    days: 2555  # 7 años para compliance
EOF

# 4. Desplegar
helm install ankasecure ankasecure/ankasecure \
  --namespace ankasecure \
  --create-namespace \
  --values values.yaml

# 5. Verificar despliegue
kubectl get pods -n ankasecure

# Output:
# NAME                                READY   STATUS    RESTARTS   AGE
# ankasecure-gateway-7f9b5c6d-x7k8m   1/1     Running   0          2m
# ankasecure-gateway-7f9b5c6d-p3n2q   1/1     Running   0          2m
# ankasecure-kms-6c8d4b9f-q5w1r       1/1     Running   0          2m
# ankasecure-kms-6c8d4b9f-m8t4v       1/1     Running   0          2m
# ankasecure-kms-6c8d4b9f-k2j7s       1/1     Running   0          2m
# ankasecure-postgresql-0             1/1     Running   0          2m
# ankasecure-redis-master-0           1/1     Running   0          2m
```

#### 🔒 Integración HSM On-Premise

```python
# Configurar HSM (ejecutar una vez)
from pkcs11 import lib, Mechanism, KeyType

# 1. Conectar al HSM
hsm_lib = lib('/usr/lib/libCryptoki2_64.so')  # Thales Luna
token = hsm_lib.get_token(token_label='ankasecure-prod')

# 2. Login con partition password
with token.open(user_pin='PARTITION_PASSWORD') as session:
    # 3. Generar KEK (Key Encryption Key) - NUNCA sale del HSM
    kek = session.generate_key(
        KeyType.AES,
        256,
        id=b'kek-master-001',
        label='Master-KEK',
        store=True,
        extractable=False,  # ¡CRÍTICO! No puede salir del HSM
        sensitive=True,
        capabilities=Mechanism.AES_KEY_WRAP | Mechanism.AES_KEY_UNWRAP
    )

    print(f"KEK created: {kek.label} (ID: {kek.id.hex()})")
    print("⚠️ KEK is non-exportable and will never leave HSM")

# 4. Configurar ANKASecure para usar esta KEK
# Editar config/hsm.yaml:
# hsm:
#   type: thales-luna
#   library_path: /usr/lib/libCryptoki2_64.so
#   slot: 1
#   kek_id: "6b65652d6d61737465722d303031"  # hex(b'kek-master-001')
#   partition_password: PARTITION_PASSWORD  # O usar secret manager
```

---

### Hybrid Deployment (SaaS + On-Premise)

#### 📖 ¿Qué es?
Combinar SaaS para operaciones no críticas y On-Premise para datos ultra sensibles.

**Ejemplo**:
- **SaaS**: JWT signing keys (pública)
- **On-Premise**: Claves de cifrado de base de datos (privada)

```python
# Multi-region setup
client_saas = anka.Client(
    api_key="ak_live_...",
    endpoint="https://api.ankasecure.com"  # SaaS
)

client_onprem = anka.Client(
    api_key="ak_onprem_...",
    endpoint="https://ankasecure.internal.company.com"  # On-prem
)

# Clave JWT en SaaS (low latency, público)
jwt_key = client_saas.kms.create_key(algorithm="ES256")

# Clave DB en on-premise (compliance, privado)
db_key = client_onprem.kms.create_key(algorithm="AES-256-GCM")
```

---

## APIs y SDKs

### REST API
```bash
# Crear clave
curl -X POST https://api.ankasecure.com/v1/keys \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"algorithm": "ML-KEM-768"}'

# Firmar
curl -X POST https://api.ankasecure.com/v1/sign \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"keyId": "key123", "data": "..."}'
```

### CLI
```bash
# Configurar
ankasecure config set-endpoint https://api.ankasecure.com

# Crear clave PQC
ankasecure keys create --algorithm ML-KEM-768 --name "my-pqc-key"

# Firmar archivo
ankasecure sign --key-id key123 --file document.pdf
```

### SDK Java
```java
import co.ankatech.secure.AnkaSecureClient;

AnkaSecureClient client = new AnkaSecureClient(apiKey);

// Crear clave
String keyId = client.keys().create("ML-DSA-65");

// Firmar
byte[] signature = client.sign(keyId, data);
```

---

## SEGURIDAD Y COMPLIANCE

### 🔒 Controles de Seguridad (Defense in Depth)

#### Layer 1: Network Security
```
┌────────────────────────────────────────────┐
│  VPC (Virtual Private Cloud)              │
│                                            │
│  ┌──────────────┐    ┌──────────────┐    │
│  │ Public Subnet│    │Private Subnet│    │
│  │              │    │              │    │
│  │ API Gateway  │───>│ Microservices│    │
│  │ (Port 443)   │    │ (interno)    │    │
│  └──────────────┘    └──────────────┘    │
│         │                    │            │
│         │                    │            │
│  ┌──────▼────────┐    ┌──────▼────────┐  │
│  │ Security Group│    │ Security Group│  │
│  │ - 443 from    │    │ - 5432 from   │  │
│  │   Internet    │    │   app only    │  │
│  │ - WAF enabled │    │ - No Internet │  │
│  └───────────────┘    └───────────────┘  │
└────────────────────────────────────────────┘
```

**Controles implementados**:
- ✅ **VPC Peering**: Conectar regiones sin exponer Internet
- ✅ **Security Groups**: Firewall stateful (solo permitir tráfico necesario)
- ✅ **WAF (Web Application Firewall)**: Bloquear SQL injection, XSS
- ✅ **DDoS Protection**: AWS Shield / Cloudflare
- ✅ **Private Link**: Conectar VPCs sin Internet

#### Layer 2: Transport Security
```python
# TLS 1.3 configuración (nginx)
ssl_protocols TLSv1.3;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

# Certificate pinning (opcional, para clientes móviles)
add_header Public-Key-Pins 'pin-sha256="base64+primary=="; pin-sha256="base64+backup=="; max-age=5184000';
```

**mTLS (Mutual TLS)**:
```python
# Cliente presenta certificado
import requests

response = requests.post(
    'https://api.ankasecure.com/v1/keys',
    cert=('/path/to/client.crt', '/path/to/client.key'),
    verify='/path/to/ca.crt',
    headers={'Authorization': 'Bearer ...'}
)
```

#### Layer 3: Application Security

**OAuth 2.0 Client Credentials Flow**:
```
┌─────────────┐                                ┌──────────────┐
│   Cliente   │                                │  Auth Server │
└──────┬──────┘                                └──────┬───────┘
       │                                               │
       │ 1. POST /oauth/token                          │
       │    client_id + client_secret + mTLS cert      │
       ├──────────────────────────────────────────────>│
       │                                               │
       │                               2. Validate:    │
       │                               - client_id     │
       │                               - client_secret │
       │                               - cert CN       │
       │                               - OCSP check    │
       │                                               │
       │ 3. access_token (JWT)                         │
       │<──────────────────────────────────────────────┤
       │                                               │
       │ 4. GET /v1/keys                               │
       │    Authorization: Bearer <JWT>                │
       ├──────────────────────────────────────────────>│
       │                                               │
       │                               5. Validate JWT:│
       │                               - Signature     │
       │                               - exp claim     │
       │                               - aud claim     │
       │                               - scopes        │
       │                                               │
       │ 6. Response                                   │
       │<──────────────────────────────────────────────┤
```

**JWT Structure**:
```javascript
// Header
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-2024-01"  // Key ID para rotación
}

// Payload
{
  "iss": "https://auth.ankasecure.com",
  "sub": "app_prod_payment",
  "aud": "https://api.ankasecure.com",
  "exp": 1703008800,
  "iat": 1703005200,
  "scope": "keys:read keys:write",
  "tenant_id": "tenant_acme"
}

// Signature (RS256 con clave privada del Auth Server)
```

#### Layer 4: Data Security

**Encryption at Rest**:
```sql
-- PostgreSQL - Transparent Data Encryption
-- 1. Database-level encryption (LUKS en Linux)
cryptsetup luksFormat /dev/sdb
cryptsetup open /dev/sdb pgdata
mkfs.ext4 /dev/mapper/pgdata
mount /dev/mapper/pgdata /var/lib/postgresql/data

-- 2. Column-level encryption (para campos ultra sensibles)
CREATE EXTENSION pgcrypto;

-- Encriptar wrapped_key con password adicional
UPDATE keys
SET wrapped_key = pgp_sym_encrypt(
    wrapped_key,
    current_setting('app.encryption_key')
);
```

**Encryption in Transit**:
- ✅ TLS 1.3 para cliente → API Gateway
- ✅ mTLS para API Gateway → Microservicios
- ✅ IPsec para Microservicios → Base de datos

**Encryption in Use** (futuro - Intel SGX):
```python
# Procesar claves en enclave SGX (memoria cifrada)
from pysgx import Enclave

enclave = Enclave('ankasecure_enclave.signed.so')

# DEK solo existe en memoria del enclave (invisible para OS)
result = enclave.call('decrypt_data', ciphertext, wrapped_dek)
```

#### Layer 5: Monitoring & Response

**SIEM Integration** (Splunk/ELK):
```
# Alertas configuradas
1. Más de 10 fallos de autenticación en 5 min → Posible brute force
2. Exportación de >100 claves en 1h → Posible data exfiltration
3. Acceso desde país no autorizado → Geo-fencing violation
4. Uso de clave revocada → Compliance violation
5. Operación HSM fallida → Hardware failure
```

**Anomaly Detection con ML**:
```python
# Detectar patrones anómalos
from sklearn.ensemble import IsolationForest

# Features: hora, usuario, operación, IP, cantidad
X_train = df[['hour', 'user_hash', 'operation_type', 'ip_subnet', 'count']]

model = IsolationForest(contamination=0.01)  # 1% anomalías
model.fit(X_train)

# Detectar
X_test = current_activity_features()
anomaly_score = model.predict(X_test)

if anomaly_score == -1:  # Anomalía
    alert("Actividad sospechosa detectada", severity="high")
```

---

### 📋 Compliance Frameworks

#### ISO 27001:2022 - Controles Implementados

| Control | Descripción | Implementación ANKASecure |
|---------|-------------|---------------------------|
| **A.5.23** | Information security for use of cloud services | SaaS desplegado en AWS/Azure con certificación ISO 27001 |
| **A.8.3** | User access provisioning | OAuth 2.0 + RBAC + MFA |
| **A.8.9** | Configuration management | Infrastructure as Code (Terraform) |
| **A.8.16** | Monitoring activities | Audit logs inmutables (Kafka + ELK) |
| **A.8.24** | Use of cryptography | HSM FIPS 140-2 L3 + Key rotation automática |
| **A.5.7** | Threat intelligence | Integración con MISP (Malware Information Sharing Platform) |

#### SOC 2 Type II - Trust Service Criteria

**CC6.1 - Logical and Physical Access Controls**:
```yaml
# Controles implementados
access_controls:
  authentication:
    - OAuth 2.0 Client Credentials
    - mTLS certificate validation
    - MFA for admin access (TOTP)

  authorization:
    - RBAC (Role-Based Access Control)
    - Least privilege principle
    - JIT (Just-In-Time) access for admins

  audit:
    - All access logged with WHO/WHAT/WHEN
    - Annual review of user permissions
    - Quarterly access recertification
```

**CC6.6 - Encryption**:
```python
# Evidencia para auditor
encryption_controls = {
    "data_at_rest": {
        "database": "PostgreSQL with LUKS (AES-256-XTS)",
        "backups": "AWS S3 with SSE-KMS",
        "hsm": "FIPS 140-2 Level 3 certified"
    },
    "data_in_transit": {
        "client_api": "TLS 1.3 (AES-256-GCM)",
        "internal": "mTLS with cert pinning",
        "database": "TLS 1.2+ required"
    },
    "key_management": {
        "kek": "Stored in HSM (non-exportable)",
        "dek": "Wrapped with KEK before DB storage",
        "rotation": "Automated every 90 days"
    }
}
```

#### PCI-DSS 4.0 - Requirements

**Requirement 3: Protect Stored Cardholder Data**:
```python
# Ejemplo: Cifrar número de tarjeta con ANKASecure
import ankasecure_sdk as anka

client = anka.Client(api_key="ak_live_...")

# 1. Crear clave dedicada para PAN (Primary Account Number)
pan_key = client.kms.create_key(
    algorithm="AES-256-GCM",
    purpose="encrypt",
    metadata={
        "pci_scope": "true",
        "data_type": "PAN",
        "compliance": "PCI-DSS-4.0"
    }
)

# 2. Cifrar PAN
pan_plaintext = "4532123456789010"
pan_encrypted = client.kms.encrypt(
    key_id=pan_key.id,
    plaintext=pan_plaintext,
    context={"cardholder_id": "CH-12345"}  # AAD
)

# 3. Guardar en DB (solo ciphertext)
db.execute(
    "INSERT INTO cards (cardholder_id, pan_encrypted) VALUES (%s, %s)",
    ("CH-12345", pan_encrypted)
)

# ✅ PAN nunca se guarda en plaintext
# ✅ Clave en HSM (PCI-DSS Req 3.6.1)
# ✅ Audit log automático
```

**Requirement 10: Log and Monitor All Access**:
```sql
-- Query para reporte PCI-DSS Requirement 10
SELECT
    DATE(timestamp) AS date,
    operation,
    COUNT(*) AS total_operations,
    COUNT(CASE WHEN success = FALSE THEN 1 END) AS failed_operations
FROM audit_logs
WHERE
    timestamp >= '2024-01-01'
    AND timestamp < '2025-01-01'
    AND resource_type = 'key'
GROUP BY DATE(timestamp), operation
ORDER BY date DESC;

-- Output para auditor:
-- date       | operation | total_operations | failed_operations
-- -----------|-----------|------------------|------------------
-- 2024-12-18 | encrypt   | 125,432          | 12
-- 2024-12-18 | decrypt   | 98,765           | 5
-- 2024-12-18 | create    | 234              | 0
```

---

### ⚡ PERFORMANCE Y ESCALABILIDAD

#### 📊 Benchmarks

**Metodología de testing**:
```bash
# Apache Bench para load testing
ab -n 100000 -c 100 -H "Authorization: Bearer $TOKEN" \
   https://api.ankasecure.com/v1/keys

# Output:
# Requests per second: 8,234 [#/sec]
# Time per request (mean): 12.15 ms
# Time per request (p99): 45.3 ms
```

**Resultados** (3-node cluster, AWS c5.2xlarge):

| Operación | Latencia p50 | Latencia p99 | Throughput | Limitante |
|-----------|--------------|--------------|------------|-----------|
| GenerateKey (AES-256) | 12 ms | 45 ms | 8,000 ops/s | PostgreSQL writes |
| GenerateKey (RSA-4096) | 150 ms | 400 ms | 600 ops/s | HSM crypto |
| Encrypt (AES-GCM) | 0.5 ms | 2 ms | 200,000 ops/s | CPU-bound |
| Sign (RSA-2048) | 8 ms | 25 ms | 12,000 ops/s | HSM ops |
| Wrap/Unwrap (HSM) | 5 ms | 18 ms | 15,000 ops/s | HSM ops |
| JWT validation | 2 ms | 8 ms | 50,000 ops/s | Redis cache hit |

#### 🚀 Optimizaciones Implementadas

**1. Connection Pooling (PostgreSQL)**:
```python
# config/database.yaml
postgresql:
  pool:
    min_size: 10
    max_size: 100
    timeout: 30
    recycle: 3600  # Reciclar conexiones cada 1h
    pre_ping: true  # Verificar conexión antes de usar
```

**2. Caching Strategy (Redis)**:
```python
# Cache wrapped keys (evitar query DB cada vez)
import redis

r = redis.Redis(host='redis.internal', port=6379)

def get_wrapped_key(key_id):
    # Check cache first
    cached = r.get(f"key:{key_id}")
    if cached:
        return cached

    # Cache miss - query DB
    wrapped_key = db.query("SELECT wrapped_key FROM keys WHERE key_id = %s", key_id)

    # Cache for 1 hour
    r.setex(f"key:{key_id}", 3600, wrapped_key)

    return wrapped_key
```

**3. HSM Connection Pooling**:
```python
# Mantener sesiones HSM abiertas (evitar handshake)
from pkcs11 import lib
import threading

class HSMPool:
    def __init__(self, size=10):
        self.pool = queue.Queue(maxsize=size)
        for _ in range(size):
            session = self._create_session()
            self.pool.put(session)

    def _create_session(self):
        hsm_lib = lib('/usr/lib/libCryptoki2_64.so')
        token = hsm_lib.get_token(token_label='ankasecure-prod')
        return token.open(user_pin='PASSWORD')

    def acquire(self):
        return self.pool.get()

    def release(self, session):
        self.pool.put(session)

# Usage
hsm_pool = HSMPool(size=20)

def sign_data(key_id, data):
    session = hsm_pool.acquire()
    try:
        signature = session.sign(key_id, data)
        return signature
    finally:
        hsm_pool.release(session)
```

**4. Horizontal Scaling (Kubernetes HPA)**:
```yaml
# hpa.yaml - Auto-scale KMS pods
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kms-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ankasecure-kms
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"  # 1000 req/s por pod
```

**5. Database Sharding (futuro)**:
```sql
-- Particionar tabla keys por tenant_id (para multi-tenancy)
CREATE TABLE keys (
    id UUID,
    tenant_id UUID,
    -- ... otros campos
) PARTITION BY HASH (tenant_id);

-- Crear 16 particiones
CREATE TABLE keys_p0 PARTITION OF keys FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE keys_p1 PARTITION OF keys FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... hasta p15

-- Resultado: queries solo escanean 1/16 de la tabla
```

---

## Casos de Uso

### IoT
- Firmar firmware
- Cifrar comunicaciones
- Gestión de claves en dispositivos

### CI/CD
- Firmar artifacts
- Cifrar secretos
- Rotación automática

### Finanzas
- Firmas digitales transacciones
- Cumplimiento PCI DSS
- HSM integration

---

## Migración RSA → PQC

### Estrategia
1. Inventario de claves actuales
2. Crear claves híbridas (RSA+ML-KEM)
3. Re-cifrar datos críticos
4. Actualizar referencias
5. Deprecar claves RSA

### Herramientas ANKASecure
- `ankasecure migrate analyze`
- `ankasecure migrate plan`
- `ankasecure migrate execute`

---

## REFERENCIAS Y ESTÁNDARES

### 📚 Criptografía y Key Management

1. **NIST SP 800-57 Part 1 Rev 5 (2020)**: *Recommendation for Key Management*
   - URL: https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final
   - Sección 5.3: Key Management Lifecycle
   - Tabla 2: Comparable strengths (AES-128 ≈ RSA-3072 ≈ ECC-256)

2. **NIST SP 800-175B (2020)**: *Guideline for Using Cryptographic Standards in the Federal Government*
   - Cryptographic Algorithm Validation Program (CAVP)
   - Prohibición de SHA-1 para firmas digitales (deprecated desde 2017)

3. **PKCS#11 v3.0 (2023)**: *Cryptographic Token Interface Standard*
   - URL: https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.0/pkcs11-spec-v3.0.html
   - CKM_AES_KEY_WRAP mechanism (RFC 3394)
   - CKM_RSA_PKCS_OAEP mechanism (RFC 8017)

4. **KMIP v2.1 (2022)**: *Key Management Interoperability Protocol*
   - URL: https://www.oasis-open.org/committees/kmip/
   - Operations: Create, Get, Register, Activate, Revoke, Destroy
   - Integración con HSM vendors (Thales, Entrust, AWS CloudHSM)

5. **RFC 3394** (2002): *Advanced Encryption Standard (AES) Key Wrap Algorithm*
   - Algoritmo KW (Key Wrap) para proteger claves simétricas
   - Usado por HSMs para wrap/unwrap DEKs

### 📚 OAuth y API Security

6. **RFC 6749** (2012): *The OAuth 2.0 Authorization Framework*
   - URL: https://datatracker.ietf.org/doc/html/rfc6749
   - Section 4.4: Client Credentials Grant (usado en ANKASecure)

7. **RFC 7519** (2015): *JSON Web Token (JWT)*
   - Claims: iss, sub, aud, exp, iat, nbf, jti
   - Algoritmos recomendados: RS256, ES256 (NO HS256 para APIs públicas)

8. **RFC 8705** (2020): *OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens*
   - mTLS como mecanismo de autenticación adicional
   - Certificate thumbprint en confirmación JWT

9. **RFC 7515** (2015): *JSON Web Signature (JWS)*
   - Compact serialization (usado en JWTs)
   - JSON serialization (múltiples firmas)

10. **RFC 7516** (2015): *JSON Web Encryption (JWE)*
    - Key encryption algorithms: RSA-OAEP, A256KW
    - Content encryption: A256GCM

### 📚 HSM y Hardware Security

11. **FIPS 140-2** (2001): *Security Requirements for Cryptographic Modules*
    - URL: https://csrc.nist.gov/publications/detail/fips/140/2/final
    - Level 1: Basic (software)
    - Level 2: Physical tamper-evidence
    - Level 3: Physical tamper-resistance (ANKASecure requirement)
    - Level 4: Environmental protection

12. **FIPS 140-3** (2019): *Security Requirements for Cryptographic Modules* (sucesor de 140-2)
    - Basado en ISO/IEC 19790:2012
    - Mandatory desde 2024 para nuevas certificaciones

13. **Common Criteria EAL4+**: *Evaluation Assurance Level*
    - Certificación para HSMs enterprise (Thales Luna, Entrust nShield)
    - AVA_VAN.5: Advanced methodical vulnerability analysis

14. **Thales Luna Network HSM**: *Technical Documentation*
    - URL: https://thalesdocs.com/gphsm/luna/
    - PKCS#11 library integration
    - High Availability (HA) groups (3+ nodes)

### 📚 Compliance y Auditoría

15. **ISO/IEC 27001:2022**: *Information Security Management Systems*
    - Annex A.8.24: Use of cryptography
    - Annex A.8.16: Monitoring activities (audit logs)
    - Annex A.5.23: Information security for use of cloud services

16. **SOC 2 Type II**: *Trust Services Criteria*
    - URL: https://www.aicpa.org/soc
    - CC6.1: Logical and physical access controls
    - CC6.6: Encryption of confidential information
    - CC7.2: System monitoring

17. **PCI-DSS v4.0** (2022): *Payment Card Industry Data Security Standard*
    - URL: https://www.pcisecuritystandards.org/
    - Requirement 3: Protect stored cardholder data (encryption)
    - Requirement 10: Track and monitor all access to network resources

18. **HIPAA Security Rule** (45 CFR Part 164): *Protected Health Information*
    - §164.312(a)(2)(iv): Encryption and decryption
    - §164.312(b): Audit controls
    - §164.312(c)(1): Integrity controls

19. **GDPR Article 32**: *Security of Processing*
    - URL: https://gdpr-info.eu/art-32-gdpr/
    - Encryption of personal data
    - Pseudonymization techniques
    - Regular testing and evaluation

### 📚 Architecture Patterns

20. **AWS Key Management Service (KMS) Whitepaper**: *Best Practices*
    - URL: https://docs.aws.amazon.com/kms/latest/developerguide/
    - Envelope encryption pattern (KEK wrapping DEKs)
    - Customer Master Keys (CMKs) vs Data Keys

21. **Google Cloud KMS Documentation**: *Key Management Concepts*
    - URL: https://cloud.google.com/kms/docs
    - Key hierarchy (KeyRing → CryptoKey → CryptoKeyVersion)
    - Automatic rotation policies

22. **HashiCorp Vault**: *Secret Management Architecture*
    - URL: https://www.vaultproject.io/docs/internals/architecture
    - Storage backend (Consul, etcd)
    - Seal/unseal mechanism con Shamir's Secret Sharing

23. **Microservices Security Patterns**: *OWASP*
    - URL: https://owasp.org/www-project-microservices-top-10/
    - MS1: Information Exposure
    - MS6: Sensitive Data Exposure via Logs

### 📚 Post-Quantum Cryptography

24. **NIST PQC Standardization** (2024): *Post-Quantum Cryptography Standards*
    - URL: https://csrc.nist.gov/projects/post-quantum-cryptography
    - ML-KEM (Kyber): Key Encapsulation Mechanism
    - ML-DSA (Dilithium): Digital Signature Algorithm
    - SLH-DSA (SPHINCS+): Stateless Hash-Based Signatures

25. **NIST SP 1800-38G** (2023): *Migration to Post-Quantum Cryptography*
    - Hybrid schemes (classical + PQC en paralelo)
    - Timeline: Migración completa antes de 2030

### 📚 Herramientas y SDKs

26. **python-pkcs11**: *PKCS#11 Library for Python*
    - URL: https://github.com/pyauth/python-pkcs11
    - Wrapper sobre libpkcs11 de HSM vendors

27. **PyJWT**: *JSON Web Token implementation for Python*
    - URL: https://pyjwt.readthedocs.io/
    - Soporte RS256, ES256, EdDSA

28. **Cryptography**: *Python Cryptographic Library*
    - URL: https://cryptography.io/
    - Primitivas: AES-GCM, RSA-OAEP, ECDSA
    - Binding a OpenSSL

### 📚 Libros Recomendados

29. **"Applied Cryptography" (2nd Edition)** - Bruce Schneier (1996)
    - Capítulo 8: Key Management
    - Capítulo 23: Special Algorithms for Protocols

30. **"Cryptographic Engineering"** - Ferguson, Schneier, Kohno (2010)
    - Capítulo 6: Key Management
    - Capítulo 7: Implementing Cryptography

31. **"Security Engineering" (3rd Edition)** - Ross Anderson (2020)
    - URL: https://www.cl.cam.ac.uk/~rja14/book.html
    - Capítulo 5: Cryptography
    - Capítulo 21: Network Attack and Defence

---

## RESUMEN EJECUTIVO

**ANKASecure** es una plataforma empresarial de Key Management Service (KMS) que proporciona:

1. **Gestión centralizada de claves**: AES, RSA, ECC, y algoritmos post-cuánticos (ML-KEM, ML-DSA)
2. **HSM Integration**: FIPS 140-2 Level 3 para máxima seguridad
3. **API RESTful**: OAuth 2.0 + mTLS con rate limiting y logging completo
4. **Compliance**: ISO 27001, SOC 2 Type II, PCI-DSS, HIPAA, GDPR
5. **Multi-tenancy**: Aislamiento lógico de claves por organización
6. **Auditoría inmutable**: Logs append-only con 7+ años de retención

**Componentes principales**:
- **KMS Service**: CRUD de claves con rotación automática
- **Crypto Service**: JWS/JWE/JWET para firmas y cifrado
- **API Gateway**: Autenticación, rate limiting, logging
- **Audit Log Service**: Trazabilidad completa (WHO/WHAT/WHEN/WHERE)
- **HSM Cluster**: 3+ nodos para alta disponibilidad

**Modos de despliegue**:
- **SaaS**: Cloud-hosted (AWS/Azure/GCP), 99.99% SLA
- **On-Premise**: Control total, air-gapped, compliance estricto
- **Hybrid**: Combinar SaaS (públicas) + On-Premise (sensibles)

**Performance** (3-node cluster):
- 8,000 ops/s (GenerateKey AES)
- 200,000 ops/s (Encrypt AES-GCM)
- 12,000 ops/s (Sign RSA-2048)
- Latencia p50: 0.5-12ms, p99: 2-45ms

**Seguridad**:
- Defense in Depth (5 capas: Network, Transport, Application, Data, Monitoring)
- Encryption at rest/transit/use (futuro: Intel SGX)
- SIEM integration (Splunk/ELK) + ML anomaly detection

---

[⬅️ Volver](../README.md)
