# Laboratorio 03: JWT Authentication System - Sistema de Autenticación Completo

## Objetivos

Al completar este laboratorio, serás capaz de:

1. Implementar un sistema de autenticación completo con JWT (Access + Refresh tokens)
2. Crear un JWKS endpoint dinámico con rotación automática de claves
3. Implementar Rate Limiting y Token Revocation
4. Integrar OAuth 2.0 Authorization Code Flow
5. Implementar Token Introspection (RFC 7662)
6. Detectar y prevenir vulnerabilidades comunes (JWT injection, algorithm confusion)
7. Implementar Proof-of-Possession (PoP) tokens para mayor seguridad

## Requisitos Previos

- Python 3.8+
- Conocimientos de JWT, OAuth 2.0 y seguridad de APIs
- Lectura previa: `03_jwt_seguridad_best_practices.md`, `04_oauth2_openid_connect.md`
- Redis instalado (para gestión de tokens revocados)

## Duración Estimada

4-5 horas

---

## Parte 1: Configuración del Entorno

### Instalación de Dependencias

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install flask python-jose[cryptography] cryptography redis \
    flask-limiter flask-cors pyjwt argon2-cffi
```

### Estructura del Proyecto

```
lab_03_jwt_auth_system/
├── app.py                      # Flask application principal
├── auth_service.py             # Servicio de autenticación
├── token_manager.py            # Gestión de tokens (issue/verify/revoke)
├── jwks_manager.py             # JWKS endpoint con rotación
├── middleware.py               # Middleware de autenticación
├── rate_limiter.py             # Rate limiting
├── oauth2_flow.py              # Implementación OAuth 2.0
├── token_introspection.py      # RFC 7662 implementation
├── pop_tokens.py               # Proof-of-Possession tokens
├── database.py                 # Simulación de DB (SQLite)
├── requirements.txt
└── README.md
```

---

## Parte 2: Token Manager - Core del Sistema

### Archivo: `token_manager.py`

```python
"""
Token Manager - Gestión completa de JWT tokens
"""

from jose import jwt, jwk, JWTError
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import secrets
import time
import hashlib
import redis
from typing import Dict, Any, Optional, List
import json

class TokenManager:
    """Gestiona creación, verificación y revocación de JWT tokens"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.keys = {}
        self._generate_signing_keys()

        # Configuración de tokens
        self.access_token_ttl = 900  # 15 minutos
        self.refresh_token_ttl = 2592000  # 30 días
        self.issuer = 'https://auth.example.com'
        self.algorithm = 'RS256'

    def _generate_signing_keys(self):
        """Genera par de claves RSA para firma de tokens"""

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )

        self.keys['private_key'] = private_key
        self.keys['public_key'] = private_key.public_key()

        # Serializar en PEM
        self.keys['private_pem'] = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        self.keys['public_pem'] = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # Generar kid (Key ID) basado en hash de la clave pública
        public_key_hash = hashlib.sha256(self.keys['public_pem']).hexdigest()
        self.keys['kid'] = f"key-{public_key_hash[:16]}"

    def generate_access_token(
        self,
        user_id: str,
        email: str,
        roles: List[str],
        additional_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Genera un Access Token JWT

        Args:
            user_id: ID único del usuario
            email: Email del usuario
            roles: Lista de roles del usuario
            additional_claims: Claims adicionales opcionales

        Returns:
            JWT Access Token (string)
        """

        now = int(time.time())

        # Claims estándar + custom
        claims = {
            # Standard claims (RFC 7519)
            'iss': self.issuer,
            'sub': user_id,
            'aud': ['https://api.example.com'],
            'exp': now + self.access_token_ttl,
            'nbf': now,
            'iat': now,
            'jti': secrets.token_urlsafe(32),  # JWT ID único

            # Custom claims
            'email': email,
            'roles': roles,
            'token_type': 'access',
        }

        # Agregar claims adicionales si existen
        if additional_claims:
            claims.update(additional_claims)

        # Firmar JWT
        token = jwt.encode(
            claims,
            self.keys['private_pem'],
            algorithm=self.algorithm,
            headers={'kid': self.keys['kid']}
        )

        # Registrar en Redis para tracking
        self._track_token(claims['jti'], 'access', now + self.access_token_ttl)

        return token

    def generate_refresh_token(
        self,
        user_id: str,
        access_token_jti: str
    ) -> str:
        """
        Genera un Refresh Token JWT

        Args:
            user_id: ID del usuario
            access_token_jti: JTI del access token asociado

        Returns:
            JWT Refresh Token (string)
        """

        now = int(time.time())

        claims = {
            'iss': self.issuer,
            'sub': user_id,
            'aud': [f'{self.issuer}/token'],
            'exp': now + self.refresh_token_ttl,
            'nbf': now,
            'iat': now,
            'jti': secrets.token_urlsafe(32),
            'token_type': 'refresh',
            'access_token_jti': access_token_jti,  # Vincular con access token
        }

        token = jwt.encode(
            claims,
            self.keys['private_pem'],
            algorithm=self.algorithm,
            headers={'kid': self.keys['kid']}
        )

        # Registrar en Redis
        self._track_token(claims['jti'], 'refresh', now + self.refresh_token_ttl)

        # Almacenar relación access <-> refresh
        self.redis.setex(
            f"refresh:{claims['jti']}:access",
            self.refresh_token_ttl,
            access_token_jti
        )

        return token

    def verify_token(
        self,
        token: str,
        expected_token_type: str = 'access',
        audience: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Verifica y decodifica un JWT token

        Args:
            token: JWT token string
            expected_token_type: 'access' o 'refresh'
            audience: Audiencia esperada (opcional)

        Returns:
            Claims del token decodificado

        Raises:
            JWTError: Si el token es inválido, expirado o revocado
        """

        try:
            # Decodificar y verificar
            claims = jwt.decode(
                token,
                self.keys['public_pem'],
                algorithms=[self.algorithm],
                audience=audience,
                issuer=self.issuer
            )

            # Verificar tipo de token
            if claims.get('token_type') != expected_token_type:
                raise JWTError(f"Invalid token type. Expected {expected_token_type}")

            # Verificar que no esté revocado
            jti = claims.get('jti')
            if self.is_token_revoked(jti):
                raise JWTError("Token has been revoked")

            return claims

        except JWTError as e:
            raise JWTError(f"Token verification failed: {str(e)}")

    def revoke_token(self, jti: str):
        """
        Revoca un token agregándolo a la blacklist

        Args:
            jti: JWT ID del token a revocar
        """

        # Obtener TTL del token si existe en tracking
        token_key = f"token:{jti}"
        ttl = self.redis.ttl(token_key)

        if ttl > 0:
            # Agregar a blacklist con mismo TTL
            self.redis.setex(f"revoked:{jti}", ttl, '1')

            # Si es refresh token, revocar también el access token asociado
            access_jti_key = f"refresh:{jti}:access"
            access_jti = self.redis.get(access_jti_key)

            if access_jti:
                access_jti = access_jti.decode('utf-8')
                access_ttl = self.redis.ttl(f"token:{access_jti}")
                if access_ttl > 0:
                    self.redis.setex(f"revoked:{access_jti}", access_ttl, '1')

    def is_token_revoked(self, jti: str) -> bool:
        """
        Verifica si un token está revocado

        Args:
            jti: JWT ID del token

        Returns:
            True si está revocado, False si no
        """

        return self.redis.exists(f"revoked:{jti}") == 1

    def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        """
        Genera un nuevo access token usando un refresh token válido

        Args:
            refresh_token: Refresh token JWT

        Returns:
            Diccionario con nuevo access_token y refresh_token

        Raises:
            JWTError: Si el refresh token es inválido
        """

        # Verificar refresh token
        claims = self.verify_token(
            refresh_token,
            expected_token_type='refresh',
            audience=[f'{self.issuer}/token']
        )

        user_id = claims['sub']

        # Obtener información del usuario (en producción, desde DB)
        # Para el ejemplo, usamos valores dummy
        user_info = self._get_user_info(user_id)

        # Generar nuevos tokens
        new_access_token = self.generate_access_token(
            user_id=user_id,
            email=user_info['email'],
            roles=user_info['roles']
        )

        # Decodificar para obtener jti
        new_claims = jwt.decode(
            new_access_token,
            self.keys['public_pem'],
            algorithms=[self.algorithm]
        )

        new_refresh_token = self.generate_refresh_token(
            user_id=user_id,
            access_token_jti=new_claims['jti']
        )

        # Revocar refresh token anterior
        self.revoke_token(claims['jti'])

        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
            'token_type': 'Bearer',
            'expires_in': self.access_token_ttl
        }

    def _track_token(self, jti: str, token_type: str, expires_at: int):
        """Registra token en Redis para tracking"""

        ttl = expires_at - int(time.time())

        if ttl > 0:
            self.redis.setex(
                f"token:{jti}",
                ttl,
                json.dumps({
                    'type': token_type,
                    'expires_at': expires_at
                })
            )

    def _get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Obtiene información del usuario (mock)"""

        # En producción, consultar base de datos
        return {
            'email': f'user{user_id}@example.com',
            'roles': ['user']
        }

    def get_public_key_jwk(self) -> Dict[str, Any]:
        """
        Retorna la clave pública en formato JWK

        Returns:
            JWK (JSON Web Key)
        """

        public_key = self.keys['public_key']

        # Extraer componentes RSA
        public_numbers = public_key.public_numbers()

        # Convertir a bytes y luego a base64url
        def int_to_base64url(n: int) -> str:
            byte_length = (n.bit_length() + 7) // 8
            n_bytes = n.to_bytes(byte_length, byteorder='big')

            # Base64url encoding
            import base64
            return base64.urlsafe_b64encode(n_bytes).rstrip(b'=').decode('utf-8')

        return {
            'kty': 'RSA',
            'use': 'sig',
            'kid': self.keys['kid'],
            'alg': self.algorithm,
            'n': int_to_base64url(public_numbers.n),
            'e': int_to_base64url(public_numbers.e)
        }


# Ejemplo de uso
if __name__ == '__main__':
    # Conectar a Redis
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=False)

    # Inicializar TokenManager
    token_manager = TokenManager(redis_client)

    # 1. Generar tokens
    print("=== Test 1: Generate Tokens ===")
    access_token = token_manager.generate_access_token(
        user_id='12345',
        email='user@example.com',
        roles=['user', 'admin']
    )

    # Decodificar para obtener jti
    access_claims = jwt.decode(
        access_token,
        token_manager.keys['public_pem'],
        algorithms=['RS256']
    )

    refresh_token = token_manager.generate_refresh_token(
        user_id='12345',
        access_token_jti=access_claims['jti']
    )

    print(f"Access Token: {access_token[:100]}...")
    print(f"Refresh Token: {refresh_token[:100]}...")
    print()

    # 2. Verificar access token
    print("=== Test 2: Verify Access Token ===")
    try:
        verified_claims = token_manager.verify_token(
            access_token,
            expected_token_type='access',
            audience=['https://api.example.com']
        )
        print(f"Token verified successfully!")
        print(f"User ID: {verified_claims['sub']}")
        print(f"Email: {verified_claims['email']}")
        print(f"Roles: {verified_claims['roles']}")
        print()
    except JWTError as e:
        print(f"Verification failed: {e}")

    # 3. Revocar token
    print("=== Test 3: Revoke Token ===")
    token_manager.revoke_token(access_claims['jti'])
    print(f"Token {access_claims['jti'][:16]}... revoked")

    # Intentar verificar token revocado
    try:
        token_manager.verify_token(access_token, expected_token_type='access')
        print("ERROR: Token should be revoked!")
    except JWTError as e:
        print(f"Token correctly rejected: {e}")
    print()

    # 4. Refresh token
    print("=== Test 4: Refresh Access Token ===")

    # Generar nuevos tokens primero (ya que revocamos los anteriores)
    access_token = token_manager.generate_access_token(
        user_id='12345',
        email='user@example.com',
        roles=['user', 'admin']
    )

    access_claims = jwt.decode(
        access_token,
        token_manager.keys['public_pem'],
        algorithms=['RS256']
    )

    refresh_token = token_manager.generate_refresh_token(
        user_id='12345',
        access_token_jti=access_claims['jti']
    )

    # Hacer refresh
    new_tokens = token_manager.refresh_access_token(refresh_token)
    print(f"New Access Token: {new_tokens['access_token'][:100]}...")
    print(f"New Refresh Token: {new_tokens['refresh_token'][:100]}...")
    print()

    # 5. Obtener clave pública en formato JWK
    print("=== Test 5: Get Public Key JWK ===")
    jwk_key = token_manager.get_public_key_jwk()
    print(f"JWK:")
    print(json.dumps(jwk_key, indent=2))

    print("\nToken Manager tests completed successfully!")
```

---

## Parte 3: JWKS Manager con Rotación Automática

### Archivo: `jwks_manager.py`

```python
"""
JWKS Manager - Gestión de JSON Web Key Set con rotación automática
"""

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import hashlib
import time
import json
from typing import Dict, Any, List, Optional
import redis
import threading

class JWKSManager:
    """Gestiona JWKS endpoint con rotación automática de claves"""

    def __init__(
        self,
        redis_client: redis.Redis,
        rotation_interval_hours: int = 24,
        max_active_keys: int = 3
    ):
        self.redis = redis_client
        self.rotation_interval = rotation_interval_hours * 3600  # Convertir a segundos
        self.max_active_keys = max_active_keys

        # Inicializar con claves
        self._initialize_keys()

        # Iniciar thread de rotación automática
        self._start_rotation_thread()

    def _initialize_keys(self):
        """Inicializa claves si no existen en Redis"""

        keys_count = len(self._get_active_keys())

        if keys_count == 0:
            # Generar claves iniciales
            for _ in range(2):
                self._generate_new_key()

    def _generate_new_key(self) -> Dict[str, Any]:
        """
        Genera un nuevo par de claves RSA

        Returns:
            Diccionario con metadata de la clave
        """

        # Generar par de claves RSA
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )

        public_key = private_key.public_key()

        # Serializar
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # Generar kid
        public_key_hash = hashlib.sha256(public_pem).hexdigest()
        kid = f"key-{public_key_hash[:16]}"

        # Metadata
        now = int(time.time())
        key_data = {
            'kid': kid,
            'kty': 'RSA',
            'use': 'sig',
            'alg': 'RS256',
            'private_pem': private_pem.decode('utf-8'),
            'public_pem': public_pem.decode('utf-8'),
            'created_at': now,
            'expires_at': now + self.rotation_interval,
            'status': 'active'
        }

        # Almacenar en Redis
        self.redis.setex(
            f"jwks:key:{kid}",
            self.rotation_interval,
            json.dumps(key_data)
        )

        # Agregar a conjunto de claves activas
        self.redis.zadd('jwks:active', {kid: now})

        print(f"[JWKS] New key generated: {kid}")

        return key_data

    def _get_active_keys(self) -> List[Dict[str, Any]]:
        """
        Obtiene todas las claves activas

        Returns:
            Lista de claves activas
        """

        kids = self.redis.zrange('jwks:active', 0, -1)
        keys = []

        for kid in kids:
            kid = kid.decode('utf-8') if isinstance(kid, bytes) else kid
            key_json = self.redis.get(f"jwks:key:{kid}")

            if key_json:
                key_data = json.loads(key_json)

                # Verificar que no esté expirada
                if key_data['expires_at'] > int(time.time()):
                    keys.append(key_data)
                else:
                    # Remover de activas
                    self.redis.zrem('jwks:active', kid)

        return keys

    def get_jwks(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Retorna JWKS en formato estándar RFC 7517

        Returns:
            JWKS object con claves públicas
        """

        active_keys = self._get_active_keys()

        jwks_keys = []

        for key_data in active_keys:
            # Convertir PEM a JWK
            from cryptography.hazmat.primitives.serialization import load_pem_public_key

            public_key = load_pem_public_key(
                key_data['public_pem'].encode('utf-8'),
                backend=default_backend()
            )

            public_numbers = public_key.public_numbers()

            # Convertir a base64url
            def int_to_base64url(n: int) -> str:
                byte_length = (n.bit_length() + 7) // 8
                n_bytes = n.to_bytes(byte_length, byteorder='big')
                import base64
                return base64.urlsafe_b64encode(n_bytes).rstrip(b'=').decode('utf-8')

            jwk = {
                'kty': key_data['kty'],
                'use': key_data['use'],
                'kid': key_data['kid'],
                'alg': key_data['alg'],
                'n': int_to_base64url(public_numbers.n),
                'e': int_to_base64url(public_numbers.e)
            }

            jwks_keys.append(jwk)

        return {'keys': jwks_keys}

    def get_signing_key(self, kid: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtiene clave de firma (más reciente o por kid)

        Args:
            kid: Key ID específico (opcional)

        Returns:
            Diccionario con clave privada y metadata
        """

        if kid:
            # Obtener clave específica
            key_json = self.redis.get(f"jwks:key:{kid}")

            if not key_json:
                raise ValueError(f"Key {kid} not found")

            return json.loads(key_json)

        else:
            # Obtener clave más reciente
            active_keys = self._get_active_keys()

            if not active_keys:
                raise ValueError("No active keys available")

            # Ordenar por created_at (más reciente primero)
            active_keys.sort(key=lambda k: k['created_at'], reverse=True)

            return active_keys[0]

    def rotate_keys(self):
        """Ejecuta rotación de claves"""

        print("[JWKS] Starting key rotation...")

        active_keys = self._get_active_keys()

        # Generar nueva clave
        self._generate_new_key()

        # Archivar claves antiguas si exceden max_active_keys
        if len(active_keys) >= self.max_active_keys:
            # Ordenar por created_at (más antigua primero)
            active_keys.sort(key=lambda k: k['created_at'])

            # Archivar la más antigua
            oldest_key = active_keys[0]
            self.redis.zrem('jwks:active', oldest_key['kid'])

            print(f"[JWKS] Archived old key: {oldest_key['kid']}")

        print(f"[JWKS] Key rotation completed. Active keys: {len(self._get_active_keys())}")

    def _start_rotation_thread(self):
        """Inicia thread de rotación automática"""

        def rotation_loop():
            while True:
                time.sleep(self.rotation_interval)
                self.rotate_keys()

        rotation_thread = threading.Thread(target=rotation_loop, daemon=True)
        rotation_thread.start()

        print(f"[JWKS] Auto-rotation thread started (interval: {self.rotation_interval/3600}h)")


# Ejemplo de uso
if __name__ == '__main__':
    # Conectar a Redis
    redis_client = redis.Redis(host='localhost', port=6379, db=0)

    # Limpiar datos previos
    redis_client.flushdb()

    # Inicializar JWKS Manager (rotación cada 5 segundos para test)
    jwks_manager = JWKSManager(
        redis_client,
        rotation_interval_hours=5/3600,  # 5 segundos
        max_active_keys=3
    )

    # Obtener JWKS
    print("=== Test 1: Get JWKS ===")
    jwks = jwks_manager.get_jwks()
    print(f"JWKS:")
    print(json.dumps(jwks, indent=2))
    print()

    # Obtener clave de firma
    print("=== Test 2: Get Signing Key ===")
    signing_key = jwks_manager.get_signing_key()
    print(f"Signing Key ID: {signing_key['kid']}")
    print(f"Created at: {signing_key['created_at']}")
    print()

    # Esperar rotación automática
    print("=== Test 3: Auto-rotation ===")
    print("Waiting 10 seconds for auto-rotation...")
    time.sleep(10)

    # Verificar claves después de rotación
    jwks_after = jwks_manager.get_jwks()
    print(f"JWKS after rotation:")
    print(json.dumps(jwks_after, indent=2))
    print()

    # Forzar rotación manual
    print("=== Test 4: Manual Rotation ===")
    jwks_manager.rotate_keys()

    jwks_manual = jwks_manager.get_jwks()
    print(f"JWKS after manual rotation:")
    print(json.dumps(jwks_manual, indent=2))

    print("\nJWKS Manager tests completed successfully!")
```

---

## Parte 4: Flask Application - API Completa

### Archivo: `app.py`

```python
"""
Flask API - Sistema de autenticación JWT completo
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
from token_manager import TokenManager
from jwks_manager import JWKSManager
from functools import wraps
from jose import JWTError
import argon2
import json

app = Flask(__name__)
CORS(app)

# Conectar a Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=False)

# Inicializar servicios
token_manager = TokenManager(redis_client)
jwks_manager = JWKSManager(redis_client, rotation_interval_hours=24)

# Rate Limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

# Password hasher (Argon2)
ph = argon2.PasswordHasher()

# Database simulada (en producción usar SQL/NoSQL real)
USERS_DB = {}


# Middleware de autenticación
def require_auth(f):
    """Decorator para proteger endpoints con JWT"""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({'error': 'Missing Authorization header'}), 401

        try:
            # Extraer token (formato: "Bearer <token>")
            parts = auth_header.split()

            if len(parts) != 2 or parts[0].lower() != 'bearer':
                return jsonify({'error': 'Invalid Authorization header format'}), 401

            token = parts[1]

            # Verificar token
            claims = token_manager.verify_token(
                token,
                expected_token_type='access',
                audience=['https://api.example.com']
            )

            # Agregar claims al request context
            request.user = claims

            return f(*args, **kwargs)

        except JWTError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401

    return decorated


def require_roles(*required_roles):
    """Decorator para verificar roles del usuario"""

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_roles = request.user.get('roles', [])

            if not any(role in user_roles for role in required_roles):
                return jsonify({'error': 'Insufficient permissions'}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator


@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    """
    Registro de usuario

    Request:
    {
        "email": "user@example.com",
        "password": "SecurePass123!",
        "name": "John Doe"
    }

    Response:
    {
        "user_id": "uuid-here",
        "email": "user@example.com",
        "message": "User registered successfully"
    }
    """

    data = request.get_json()

    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    # Validaciones
    if not email or not password or not name:
        return jsonify({'error': 'email, password and name are required'}), 400

    if email in USERS_DB:
        return jsonify({'error': 'Email already registered'}), 409

    # Hash password con Argon2
    password_hash = ph.hash(password)

    # Generar user_id
    import uuid
    user_id = str(uuid.uuid4())

    # Guardar usuario
    USERS_DB[email] = {
        'user_id': user_id,
        'email': email,
        'password_hash': password_hash,
        'name': name,
        'roles': ['user']  # Rol default
    }

    return jsonify({
        'user_id': user_id,
        'email': email,
        'message': 'User registered successfully'
    }), 201


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """
    Login de usuario

    Request:
    {
        "email": "user@example.com",
        "password": "SecurePass123!"
    }

    Response:
    {
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "token_type": "Bearer",
        "expires_in": 900
    }
    """

    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    # Verificar usuario
    user = USERS_DB.get(email)

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Verificar password
    try:
        ph.verify(user['password_hash'], password)
    except argon2.exceptions.VerifyMismatchError:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Re-hash si es necesario (para actualizar parámetros de Argon2)
    if ph.check_needs_rehash(user['password_hash']):
        user['password_hash'] = ph.hash(password)

    # Generar tokens
    access_token = token_manager.generate_access_token(
        user_id=user['user_id'],
        email=user['email'],
        roles=user['roles']
    )

    # Decodificar para obtener jti
    from jose import jwt
    access_claims = jwt.decode(
        access_token,
        token_manager.keys['public_pem'],
        algorithms=['RS256']
    )

    refresh_token = token_manager.generate_refresh_token(
        user_id=user['user_id'],
        access_token_jti=access_claims['jti']
    )

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': token_manager.access_token_ttl
    }), 200


@app.route('/api/auth/refresh', methods=['POST'])
@limiter.limit("20 per hour")
def refresh():
    """
    Refresh access token

    Request:
    {
        "refresh_token": "eyJ..."
    }

    Response:
    {
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "token_type": "Bearer",
        "expires_in": 900
    }
    """

    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if not refresh_token:
        return jsonify({'error': 'refresh_token is required'}), 400

    try:
        new_tokens = token_manager.refresh_access_token(refresh_token)
        return jsonify(new_tokens), 200

    except JWTError as e:
        return jsonify({'error': str(e)}), 401


@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """
    Logout (revoca tokens)

    Request:
    Headers: Authorization: Bearer <access_token>
    Body:
    {
        "refresh_token": "eyJ..."
    }

    Response:
    {
        "message": "Logged out successfully"
    }
    """

    # Revocar access token
    access_jti = request.user['jti']
    token_manager.revoke_token(access_jti)

    # Revocar refresh token si se proporciona
    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if refresh_token:
        try:
            refresh_claims = token_manager.verify_token(
                refresh_token,
                expected_token_type='refresh'
            )
            token_manager.revoke_token(refresh_claims['jti'])
        except:
            pass  # Ignorar errores en refresh token

    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/auth/.well-known/jwks.json', methods=['GET'])
def jwks_endpoint():
    """
    JWKS endpoint (RFC 7517)

    Response:
    {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "key-abc123",
                "alg": "RS256",
                "n": "0vx7agoebGc...",
                "e": "AQAB"
            },
            ...
        ]
    }
    """

    jwks = jwks_manager.get_jwks()
    return jsonify(jwks), 200


@app.route('/api/protected/profile', methods=['GET'])
@require_auth
def get_profile():
    """
    Endpoint protegido - Obtener perfil de usuario

    Headers: Authorization: Bearer <access_token>

    Response:
    {
        "user_id": "...",
        "email": "...",
        "roles": [...]
    }
    """

    return jsonify({
        'user_id': request.user['sub'],
        'email': request.user['email'],
        'roles': request.user['roles']
    }), 200


@app.route('/api/protected/admin', methods=['GET'])
@require_auth
@require_roles('admin')
def admin_endpoint():
    """
    Endpoint protegido solo para admins

    Headers: Authorization: Bearer <access_token>

    Response:
    {
        "message": "Admin access granted",
        "user": {...}
    }
    """

    return jsonify({
        'message': 'Admin access granted',
        'user': request.user
    }), 200


@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""

    return jsonify({
        'status': 'healthy',
        'redis': redis_client.ping(),
        'active_jwks': len(jwks_manager.get_jwks()['keys'])
    }), 200


if __name__ == '__main__':
    print("=" * 60)
    print("JWT Authentication System")
    print("=" * 60)
    print("\nAvailable endpoints:")
    print("  POST   /api/auth/register          - Register new user")
    print("  POST   /api/auth/login             - Login and get tokens")
    print("  POST   /api/auth/refresh           - Refresh access token")
    print("  POST   /api/auth/logout            - Logout (revoke tokens)")
    print("  GET    /api/auth/.well-known/jwks.json - JWKS endpoint")
    print("  GET    /api/protected/profile      - Get user profile (protected)")
    print("  GET    /api/protected/admin        - Admin endpoint (protected)")
    print("  GET    /api/health                 - Health check")
    print("\n" + "=" * 60)
    print("\nStarting server on http://localhost:5000")
    print("=" * 60 + "\n")

    app.run(debug=True, port=5000)
```

---

## Parte 5: Ejercicios Prácticos

### Ejercicio 1: Test Completo del Sistema

```bash
# 1. Registrar usuario
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Guardar access_token y refresh_token de la respuesta

# 3. Acceder a endpoint protegido
curl -X GET http://localhost:5000/api/protected/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 4. Refresh token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN>"
  }'

# 5. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN>"
  }'

# 6. Obtener JWKS
curl http://localhost:5000/api/auth/.well-known/jwks.json
```

### Ejercicio 2: Implementar MFA (Multi-Factor Authentication)

Extiende el sistema para soportar TOTP (Time-based One-Time Password):

```python
# Agregar a requirements.txt: pyotp

import pyotp

# En el registro, generar secret TOTP
def register_with_mfa():
    # ... código existente ...

    # Generar secret TOTP
    totp_secret = pyotp.random_base32()
    user['totp_secret'] = totp_secret

    # Generar QR code URI
    totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
        name=email,
        issuer_name='MyApp'
    )

    return {
        'user_id': user_id,
        'totp_uri': totp_uri  # Codificar como QR
    }

# En login, verificar TOTP
def login_with_mfa(email, password, totp_code):
    # ... verificar password ...

    # Verificar TOTP
    totp = pyotp.TOTP(user['totp_secret'])

    if not totp.verify(totp_code):
        raise ValueError("Invalid TOTP code")

    # ... generar tokens ...
```

### Ejercicio 3: Implementar Token Introspection (RFC 7662)

```python
@app.route('/api/auth/introspect', methods=['POST'])
@require_auth
@require_roles('admin')
def introspect_token():
    """
    Token Introspection (RFC 7662)

    Request:
    {
        "token": "eyJ...",
        "token_type_hint": "access_token"
    }

    Response:
    {
        "active": true,
        "sub": "12345",
        "email": "user@example.com",
        "exp": 1735689600,
        ...
    }
    """

    data = request.get_json()
    token = data.get('token')

    if not token:
        return jsonify({'error': 'token is required'}), 400

    try:
        claims = token_manager.verify_token(token, expected_token_type='access')

        return jsonify({
            'active': True,
            **claims
        }), 200

    except JWTError:
        return jsonify({'active': False}), 200
```

---

## Parte 6: Verificación de Completado

### Checklist de Verificación

- [ ] Sistema de registro de usuarios implementado
- [ ] Sistema de login con generación de access + refresh tokens
- [ ] Refresh token flow funcionando correctamente
- [ ] Sistema de revocación de tokens implementado
- [ ] JWKS endpoint con claves públicas activas
- [ ] Rotación automática de claves configurada
- [ ] Middleware de autenticación funcionando
- [ ] Rate limiting implementado
- [ ] Verificación de roles implementada
- [ ] Passwords hasheados con Argon2
- [ ] Tests de todos los endpoints completados
- [ ] MFA implementado (ejercicio opcional)
- [ ] Token Introspection implementado (ejercicio opcional)

### Comandos de Verificación

```bash
# Iniciar Redis
redis-server

# Ejecutar tests individuales
python token_manager.py
python jwks_manager.py

# Iniciar aplicación
python app.py

# Ejecutar test completo (script bash)
./test_auth_system.sh
```

---

## Referencias

### RFCs Oficiales
- **RFC 7519** - JSON Web Token (JWT)
- **RFC 7515** - JSON Web Signature (JWS)
- **RFC 7517** - JSON Web Key (JWK)
- **RFC 7662** - OAuth 2.0 Token Introspection
- **RFC 6749** - The OAuth 2.0 Authorization Framework
- **RFC 6750** - OAuth 2.0 Bearer Token Usage

### OWASP Guidelines
- **OWASP JWT Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- **OWASP Authentication Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

### Documentación Oficial
- **python-jose**: https://python-jose.readthedocs.io/
- **Flask-Limiter**: https://flask-limiter.readthedocs.io/
- **Argon2-cffi**: https://argon2-cffi.readthedocs.io/

### Papers Académicos
- Fett, D., Küsters, R., & Schmitz, G. (2016). "A Comprehensive Formal Security Analysis of OAuth 2.0"
- Mainka, C., Mladenov, V., & Schwenk, J. (2017). "Do Not Trust Me: Using Malicious IdPs for Analyzing and Attacking Single Sign-On"

### Libros Técnicos
- Jones, M., & Hardt, D. (2020). *OAuth 2.0 Simplified*. OAuth.com
- Madden, N. (2020). *API Security in Action*. Manning Publications

### Standards
- **NIST SP 800-63B** - Digital Identity Guidelines: Authentication and Lifecycle Management
- **OWASP ASVS** - Application Security Verification Standard (sección V3: Session Management)

---

## Notas Finales de Seguridad

1. **Nunca** uses `alg=none` en producción
2. **Siempre** valida la firma del JWT antes de confiar en los claims
3. **Implementa** rate limiting en todos los endpoints de autenticación
4. **Usa** HTTPS en producción (los JWTs son bearer tokens)
5. **Almacena** claves privadas en HSMs o servicios seguros (AWS KMS, Azure Key Vault)
6. **Implementa** rotación automática de claves cada 30-90 días
7. **Considera** usar short-lived access tokens (15 minutos o menos)
8. **Implementa** logout en servidor mediante revocación de tokens
9. **Monitorea** uso anómalo de tokens (geolocalización, user-agent)
10. **Usa** Argon2id para hasheo de passwords (no bcrypt ni scrypt)
