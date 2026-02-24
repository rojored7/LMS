# OAuth 2.0 y OpenID Connect: Autenticación y Autorización para APIs

## Índice
1. [OAuth 2.0: Fundamentos](#oauth2)
2. [Authorization Grant Types](#grant-types)
3. [OpenID Connect (OIDC)](#oidc)
4. [Token Introspection y Revocation](#introspection)
5. [Integración con APIs](#integracion)
6. [Flujos Prácticos](#flujos)
7. [Referencias](#referencias)

---

## OAuth 2.0: Fundamentos {#oauth2}

**OAuth 2.0** (RFC 6749) es un framework de **autorización** que permite a aplicaciones de terceros obtener acceso limitado a recursos protegidos **sin compartir credenciales**.

### OAuth NO es Autenticación

```
❌ Concepto erróneo: "OAuth es para login"
✅ Realidad: OAuth es para autorización (delegar acceso a recursos)

Autenticación: ¿Quién eres? → OpenID Connect
Autorización: ¿Qué puedes hacer? → OAuth 2.0
```

### Roles en OAuth 2.0

| Rol | Descripción | Ejemplo |
|-----|-------------|---------|
| **Resource Owner** | Usuario dueño de los datos | Usuario de Gmail |
| **Client** | Aplicación que solicita acceso | App móvil de terceros |
| **Authorization Server** | Emite access tokens | accounts.google.com |
| **Resource Server** | API que protege recursos | Gmail API |

### Diagrama de Flujo General

```
┌────────────┐                                ┌───────────────────┐
│  Resource  │                                │  Authorization    │
│   Owner    │◄───(1) Authorization Request──│     Server        │
│  (Usuario) │                                │ (accounts.google) │
└─────┬──────┘                                └────────┬──────────┘
      │                                                │
      │ (2) Authorization Grant                       │
      │ (user consents)                               │
      └───────────────────────┐                       │
                              ▼                       │
                      ┌───────────────┐               │
                      │    Client     │               │
                      │  (Your App)   │───(3) Grant──►│
                      └───────┬───────┘               │
                              │                       │
                              │◄──(4) Access Token────┘
                              │
                              │ (5) Access Token
                              ▼
                      ┌──────────────────┐
                      │  Resource Server │
                      │   (Gmail API)    │
                      └──────────────────┘
```

---

## Authorization Grant Types {#grant-types}

OAuth 2.0 define diferentes flujos según el tipo de cliente.

### 1. Authorization Code Grant (Recomendado para Web Apps)

**Uso**: Aplicaciones server-side (Node.js, Python, Java, etc.)

**Flujo**:

```
1. User → Client: Click "Login with Google"
2. Client → Authorization Server: Redirect to /authorize
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=YOUR_CLIENT_ID
     &redirect_uri=https://yourapp.com/callback
     &response_type=code
     &scope=openid email profile
     &state=random-state-value

3. User → Authorization Server: Login y consent
4. Authorization Server → Client: Redirect con authorization code
   https://yourapp.com/callback?code=AUTH_CODE&state=random-state-value

5. Client → Authorization Server: Exchange code for token (POST /token)
   POST https://oauth2.googleapis.com/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=AUTH_CODE
   &client_id=YOUR_CLIENT_ID
   &client_secret=YOUR_CLIENT_SECRET
   &redirect_uri=https://yourapp.com/callback

6. Authorization Server → Client: Access Token + Refresh Token
   {
     "access_token": "ya29.a0AfH6SMC...",
     "refresh_token": "1//0gHdFq3vZ...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "scope": "openid email profile"
   }

7. Client → Resource Server: Use access token
   GET https://gmail.googleapis.com/gmail/v1/users/me/messages
   Authorization: Bearer ya29.a0AfH6SMC...
```

**Código Python (Flask)**:

```python
from flask import Flask, redirect, request, session
import requests
import secrets

app = Flask(__name__)
app.secret_key = 'your-secret-key'

CLIENT_ID = 'your-client-id'
CLIENT_SECRET = 'your-client-secret'
REDIRECT_URI = 'http://localhost:5000/callback'
AUTHORIZATION_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN_URL = 'https://oauth2.googleapis.com/token'

@app.route('/login')
def login():
    # Generar state para prevenir CSRF
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state

    # Redirect a authorization server
    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state
    }
    auth_url = f"{AUTHORIZATION_BASE_URL}?{urlencode(params)}"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    # Validar state (prevenir CSRF)
    state = request.args.get('state')
    if state != session.get('oauth_state'):
        return "Invalid state", 403

    # Obtener authorization code
    code = request.args.get('code')

    # Exchange code for access token
    token_response = requests.post(TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI
    })

    tokens = token_response.json()
    access_token = tokens['access_token']
    refresh_token = tokens.get('refresh_token')

    # Guardar tokens en sesión (en producción: database)
    session['access_token'] = access_token
    session['refresh_token'] = refresh_token

    return redirect('/profile')

@app.route('/profile')
def profile():
    access_token = session.get('access_token')

    # Llamar a API protegida
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info = requests.get(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        headers=headers
    ).json()

    return f"Hello, {user_info['email']}"
```

### 2. Authorization Code with PKCE (Para Mobile y SPAs)

**PKCE** (Proof Key for Code Exchange, RFC 7636) previene ataques de intercepción en clientes públicos.

**Flujo**:

```python
import hashlib
import base64
import secrets

# 1. Cliente genera code_verifier (random string)
code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=')
print("Code Verifier:", code_verifier)  # Guardar en memoria

# 2. Cliente genera code_challenge (SHA256 de verifier)
challenge = hashlib.sha256(code_verifier).digest()
code_challenge = base64.urlsafe_b64encode(challenge).rstrip(b'=').decode()
print("Code Challenge:", code_challenge)

# 3. Authorization request con code_challenge
auth_url = (
    f"{AUTHORIZATION_BASE_URL}?"
    f"client_id={CLIENT_ID}&"
    f"redirect_uri={REDIRECT_URI}&"
    f"response_type=code&"
    f"code_challenge={code_challenge}&"
    f"code_challenge_method=S256&"  # SHA256
    f"scope=openid email"
)

# 4. User authorize, recibe code
# 5. Token request con code_verifier (NO client_secret)
token_response = requests.post(TOKEN_URL, data={
    'grant_type': 'authorization_code',
    'code': authorization_code,
    'client_id': CLIENT_ID,
    'redirect_uri': REDIRECT_URI,
    'code_verifier': code_verifier  # ← Prueba de posesión
})

# Authorization Server verifica: SHA256(code_verifier) == code_challenge
```

**Sin PKCE**: Atacante intercepta `code` → puede canjearlo por token
**Con PKCE**: Atacante intercepta `code` → no tiene `code_verifier` → no puede canjearlo

### 3. Client Credentials Grant (Para Service-to-Service)

**Uso**: Servidor backend llamando a otra API (no hay usuario involucrado)

```python
# Ejemplo: Microservicio A necesita acceder a API de Microservicio B

import requests

# Token request directo (sin autorización de usuario)
token_response = requests.post(
    'https://auth.example.com/oauth/token',
    data={
        'grant_type': 'client_credentials',
        'client_id': 'service-a',
        'client_secret': 'service-a-secret',
        'scope': 'api:read api:write'
    },
    auth=('service-a', 'service-a-secret')  # HTTP Basic Auth
)

tokens = token_response.json()
access_token = tokens['access_token']

# Usar token para llamar a API B
response = requests.get(
    'https://api-b.example.com/data',
    headers={'Authorization': f'Bearer {access_token}'}
)
```

### 4. Refresh Token Grant

**Uso**: Obtener nuevo access token sin reautenticar al usuario

```python
def refresh_access_token(refresh_token):
    token_response = requests.post(
        TOKEN_URL,
        data={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }
    )

    tokens = token_response.json()
    new_access_token = tokens['access_token']
    new_refresh_token = tokens.get('refresh_token')  # Puede rotarse

    return new_access_token, new_refresh_token
```

### Grant Types Deprecated

| Grant Type | Status | Razón |
|------------|--------|-------|
| **Implicit Flow** | ❌ Deprecated | Tokens en URL (visible en historial), no soporta refresh tokens |
| **Resource Owner Password Credentials** | ⚠️ Discouraged | App ve las credenciales del usuario (anti-patrón OAuth) |

**Usar siempre Authorization Code + PKCE en su lugar**.

---

## OpenID Connect (OIDC) {#oidc}

**OpenID Connect** es una capa de **autenticación** sobre OAuth 2.0.

### OAuth 2.0 vs OpenID Connect

| Aspecto | OAuth 2.0 | OpenID Connect |
|---------|-----------|----------------|
| **Propósito** | Autorización | Autenticación + Autorización |
| **Tokens** | Access Token | Access Token + **ID Token** |
| **Información de usuario** | Endpoint separado (/userinfo) | En el ID Token (JWT) |
| **Scope** | Definido por API | `openid` es requerido |

### ID Token (JWT)

Un **ID Token** es un JWT firmado que contiene información del usuario.

```json
{
  "iss": "https://accounts.google.com",
  "sub": "110169484474386276334",
  "aud": "your-client-id",
  "exp": 1735690200,
  "iat": 1735689600,
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/a/..."
}
```

**Validación de ID Token**:

```python
from jose import jwt

def validate_id_token(id_token, client_id):
    # Obtener JWKS del provider
    jwks_url = 'https://www.googleapis.com/oauth2/v3/certs'
    jwks = requests.get(jwks_url).json()

    # Decodificar header para obtener kid
    header = jwt.get_unverified_header(id_token)
    kid = header['kid']

    # Buscar clave pública correspondiente
    public_key = None
    for key in jwks['keys']:
        if key['kid'] == kid:
            public_key = jwk.construct(key)
            break

    if not public_key:
        raise ValueError("Public key not found")

    # Validar ID token
    decoded = jwt.decode(
        id_token,
        public_key,
        algorithms=['RS256'],
        audience=client_id,
        issuer='https://accounts.google.com'
    )

    return decoded
```

### UserInfo Endpoint

```python
def get_user_info(access_token):
    response = requests.get(
        'https://openidconnect.googleapis.com/v1/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    return response.json()

# Resultado:
{
  "sub": "110169484474386276334",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://...",
  "locale": "en"
}
```

### Discovery Endpoint (.well-known/openid-configuration)

```python
# Obtener configuración del provider OIDC
discovery_url = 'https://accounts.google.com/.well-known/openid-configuration'
config = requests.get(discovery_url).json()

print("Authorization Endpoint:", config['authorization_endpoint'])
print("Token Endpoint:", config['token_endpoint'])
print("UserInfo Endpoint:", config['userinfo_endpoint'])
print("JWKS URI:", config['jwks_uri'])
print("Supported Scopes:", config['scopes_supported'])
```

---

## Token Introspection y Revocation {#introspection}

### Token Introspection (RFC 7662)

Permite al Resource Server validar tokens opacos (no-JWT).

```python
def introspect_token(access_token):
    response = requests.post(
        'https://auth.example.com/oauth/introspect',
        data={'token': access_token},
        auth=('resource-server', 'resource-server-secret')
    )

    introspection = response.json()
    return introspection

# Respuesta:
{
  "active": true,
  "scope": "read write",
  "client_id": "client-123",
  "username": "user@example.com",
  "token_type": "Bearer",
  "exp": 1735690200,
  "iat": 1735689600,
  "sub": "user-id-123"
}
```

### Token Revocation (RFC 7009)

```python
def revoke_token(token, token_type_hint='access_token'):
    response = requests.post(
        'https://auth.example.com/oauth/revoke',
        data={
            'token': token,
            'token_type_hint': token_type_hint  # 'access_token' o 'refresh_token'
        },
        auth=(CLIENT_ID, CLIENT_SECRET)
    )

    return response.status_code == 200  # 200 = revocado

# Uso
revoke_token(access_token, 'access_token')
revoke_token(refresh_token, 'refresh_token')
```

---

## Integración con APIs {#integracion}

### Bearer Token Authentication (RFC 6750)

```http
GET /api/protected HTTP/1.1
Host: api.example.com
Authorization: Bearer ya29.a0AfH6SMC...
```

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/api/protected')
def protected_resource():
    # Extraer token del header
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return {"error": "Missing or invalid Authorization header"}, 401

    access_token = auth_header.split(' ')[1]

    # Validar token (introspection o JWT decode)
    try:
        token_info = introspect_token(access_token)

        if not token_info.get('active'):
            return {"error": "Invalid or expired token"}, 401

        # Verificar scopes
        required_scope = 'api:read'
        token_scopes = token_info.get('scope', '').split()

        if required_scope not in token_scopes:
            return {"error": "Insufficient permissions"}, 403

        # Access granted
        return {"data": "protected resource", "user": token_info['username']}

    except Exception as e:
        return {"error": "Token validation failed"}, 401
```

### Scope-Based Authorization

```python
from functools import wraps

def require_scope(required_scope):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            access_token = auth_header.split(' ')[1]

            token_info = introspect_token(access_token)
            token_scopes = token_info.get('scope', '').split()

            if required_scope not in token_scopes:
                return {"error": f"Scope {required_scope} required"}, 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/users')
@require_scope('users:read')
def list_users():
    return {"users": [...]}

@app.route('/api/users', methods=['POST'])
@require_scope('users:write')
def create_user():
    return {"status": "created"}
```

---

## Flujos Prácticos {#flujos}

### Single Page Application (SPA) + Backend API

```
┌──────────────┐
│  SPA (React) │
│  Frontend    │
└──────┬───────┘
       │
       │ (1) Authorization Code + PKCE
       ▼
┌──────────────────┐
│  Auth0 / Okta /  │
│  Keycloak        │
└──────┬───────────┘
       │
       │ (2) Access Token (JWT)
       ▼
┌──────────────┐       (3) API Request
│  SPA (React) │───────────────────────►┌─────────────────┐
│              │                        │  Backend API    │
│              │◄───────────────────────│  (validates JWT)│
└──────────────┘       (4) Response     └─────────────────┘
```

### Mobile App + API

```
┌──────────────┐
│  Mobile App  │
│  (iOS/Android│
└──────┬───────┘
       │
       │ (1) Authorization Code + PKCE
       │     (ASWebAuthenticationSession / Custom Tabs)
       ▼
┌──────────────────┐
│  OAuth Provider  │
└──────┬───────────┘
       │
       │ (2) Access Token + Refresh Token
       ▼
┌──────────────┐       (3) API Requests
│  Mobile App  │───────────────────────►┌─────────────────┐
│ (Keychain)   │                        │  Backend API    │
│              │◄───────────────────────│                 │
└──────────────┘       (4) Responses    └─────────────────┘
       │
       │ (5) Token expired → use refresh_token
       ▼
┌──────────────────┐
│  OAuth Provider  │
│  /token          │
└──────────────────┘
```

---

## Referencias {#referencias}

### Estándares

- **RFC 6749**: OAuth 2.0 Authorization Framework - https://datatracker.ietf.org/doc/html/rfc6749
- **RFC 6750**: OAuth 2.0 Bearer Token Usage - https://datatracker.ietf.org/doc/html/rfc6750
- **RFC 7636**: PKCE for OAuth 2.0 - https://datatracker.ietf.org/doc/html/rfc7636
- **RFC 7662**: Token Introspection - https://datatracker.ietf.org/doc/html/rfc7662
- **RFC 7009**: Token Revocation - https://datatracker.ietf.org/doc/html/rfc7009
- **OpenID Connect Core**: https://openid.net/specs/openid-connect-core-1_0.html

### Providers Populares

- **Auth0**: https://auth0.com
- **Okta**: https://www.okta.com
- **Keycloak** (open source): https://www.keycloak.org
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Microsoft Azure AD**: https://docs.microsoft.com/en-us/azure/active-directory/

### Próximos Pasos

1. Leer [05_api_authentication_patterns.md](./05_api_authentication_patterns.md)
2. Practicar con [Lab 03: Sistema Auth JWT](../laboratorios/lab_03_jwt_auth_system/README.md)

---

**Autor**: Curso de Ciberseguridad Avanzada
**Última actualización**: 2026-02-23
**Versión**: 1.0
