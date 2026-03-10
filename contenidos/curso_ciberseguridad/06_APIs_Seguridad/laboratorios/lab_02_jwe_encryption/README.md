# Laboratorio 02: JWE Encryption - Cifrado End-to-End para APIs

## Objetivos

Al completar este laboratorio, serás capaz de:

1. Implementar JWE con múltiples algoritmos de cifrado (RSA-OAEP, ECDH-ES, A256GCM)
2. Crear un sistema de cifrado end-to-end para datos sensibles en APIs
3. Implementar Key Wrapping y Content Encryption
4. Gestionar rotación de claves de cifrado con múltiples receptores
5. Implementar Nested JWT (JWE firmado con JWS)
6. Detectar y prevenir ataques de padding oracle
7. Implementar cifrado de archivos grandes con streaming

## Requisitos Previos

- Python 3.8+
- Conocimientos de JWT, JWS y criptografía simétrica/asimétrica
- Lectura previa: `02_jose_completo.md`, `03_jwt_seguridad_best_practices.md`

## Duración Estimada

3-4 horas

---

## Parte 1: Configuración del Entorno

### Instalación de Dependencias

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install python-jose[cryptography] cryptography flask pycryptodome
```

### Estructura del Proyecto

```
lab_02_jwe_encryption/
├── app.py                    # Flask API con endpoints JWE
├── jwe_service.py            # Core JWE encryption/decryption
├── key_manager.py            # Gestión de claves para múltiples receptores
├── nested_jwt.py             # Implementación de Nested JWT (JWE+JWS)
├── streaming_jwe.py          # JWE para archivos grandes
├── security_tests.py         # Tests de seguridad
├── requirements.txt
└── README.md
```

---

## Parte 2: Implementación de JWE Service

### Archivo: `jwe_service.py`

```python
"""
JWE Service - Implementación completa de JSON Web Encryption
"""

from jose import jwe
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.concatkdf import ConcatKDFHash
from cryptography.hazmat.primitives.asymmetric import padding as asym_padding
import json
import secrets
import time
from typing import Dict, Any, Optional, List
import base64

class JWEService:
    """Servicio para cifrar y descifrar JWE con múltiples algoritmos"""

    # Algoritmos de Key Management permitidos
    ALLOWED_KEY_ALGORITHMS = {
        'RSA-OAEP',         # RSA con OAEP padding
        'RSA-OAEP-256',     # RSA OAEP con SHA-256
        'ECDH-ES',          # Elliptic Curve Diffie-Hellman Ephemeral Static
        'ECDH-ES+A128KW',   # ECDH-ES con AES Key Wrap
        'ECDH-ES+A192KW',
        'ECDH-ES+A256KW',
        'A128KW',           # AES Key Wrap (128 bits)
        'A192KW',           # AES Key Wrap (192 bits)
        'A256KW',           # AES Key Wrap (256 bits)
        'dir',              # Direct encryption (clave compartida)
        'A128GCMKW',        # AES-GCM Key Wrap
        'A192GCMKW',
        'A256GCMKW',
    }

    # Algoritmos de Content Encryption permitidos
    ALLOWED_CONTENT_ALGORITHMS = {
        'A128GCM',          # AES-GCM 128 bits
        'A192GCM',          # AES-GCM 192 bits
        'A256GCM',          # AES-GCM 256 bits
        'A128CBC-HS256',    # AES-CBC + HMAC-SHA256
        'A192CBC-HS384',    # AES-CBC + HMAC-SHA384
        'A256CBC-HS512',    # AES-CBC + HMAC-SHA512
    }

    def __init__(self):
        self.keys = {}
        self._generate_all_keys()

    def _generate_all_keys(self):
        """Genera claves para todos los algoritmos soportados"""

        # 1. RSA Keys para RSA-OAEP
        rsa_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.keys['rsa_private'] = rsa_private_key
        self.keys['rsa_public'] = rsa_private_key.public_key()

        # Serializar claves RSA en PEM
        self.keys['rsa_private_pem'] = rsa_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        self.keys['rsa_public_pem'] = rsa_private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # 2. EC Keys para ECDH-ES (P-256)
        ec_private_key = ec.generate_private_key(
            ec.SECP256R1(),
            backend=default_backend()
        )
        self.keys['ec_private'] = ec_private_key
        self.keys['ec_public'] = ec_private_key.public_key()

        # Serializar claves EC en PEM
        self.keys['ec_private_pem'] = ec_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        self.keys['ec_public_pem'] = ec_private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # 3. Claves simétricas para Key Wrapping
        self.keys['aes128_kw'] = secrets.token_bytes(16)  # 128 bits
        self.keys['aes192_kw'] = secrets.token_bytes(24)  # 192 bits
        self.keys['aes256_kw'] = secrets.token_bytes(32)  # 256 bits

        # 4. Clave simétrica para cifrado directo
        self.keys['direct_key'] = secrets.token_bytes(32)  # 256 bits

    def encrypt_jwe(
        self,
        payload: Dict[str, Any],
        key_algorithm: str,
        content_algorithm: str,
        recipient_key: Optional[bytes] = None
    ) -> str:
        """
        Cifra un payload como JWE

        Args:
            payload: Diccionario con los datos a cifrar
            key_algorithm: Algoritmo de gestión de claves (alg)
            content_algorithm: Algoritmo de cifrado de contenido (enc)
            recipient_key: Clave pública del receptor (PEM) o clave simétrica

        Returns:
            JWE token string (formato compacto)

        Raises:
            ValueError: Si los algoritmos no están permitidos
        """

        # Validar algoritmos
        if key_algorithm not in self.ALLOWED_KEY_ALGORITHMS:
            raise ValueError(f"Key algorithm {key_algorithm} not allowed")

        if content_algorithm not in self.ALLOWED_CONTENT_ALGORITHMS:
            raise ValueError(f"Content algorithm {content_algorithm} not allowed")

        # Convertir payload a JSON
        plaintext = json.dumps(payload).encode('utf-8')

        # Seleccionar clave según algoritmo
        if key_algorithm.startswith('RSA'):
            # Usar clave pública RSA del receptor
            encryption_key = recipient_key or self.keys['rsa_public_pem']

        elif key_algorithm.startswith('ECDH'):
            # Usar clave pública EC del receptor
            encryption_key = recipient_key or self.keys['ec_public_pem']

        elif key_algorithm.endswith('KW') or key_algorithm.endswith('GCMKW'):
            # Usar clave simétrica para Key Wrapping
            if 'A128' in key_algorithm:
                encryption_key = self.keys['aes128_kw']
            elif 'A192' in key_algorithm:
                encryption_key = self.keys['aes192_kw']
            elif 'A256' in key_algorithm:
                encryption_key = self.keys['aes256_kw']
            else:
                raise ValueError(f"Unknown AES key size for {key_algorithm}")

        elif key_algorithm == 'dir':
            # Cifrado directo con clave compartida
            encryption_key = self.keys['direct_key']

        else:
            raise ValueError(f"Unsupported key algorithm: {key_algorithm}")

        # Cifrar con jose
        jwe_token = jwe.encrypt(
            plaintext,
            encryption_key,
            algorithm=key_algorithm,
            encryption=content_algorithm
        )

        return jwe_token.decode('utf-8') if isinstance(jwe_token, bytes) else jwe_token

    def decrypt_jwe(
        self,
        jwe_token: str,
        recipient_private_key: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """
        Descifra un JWE token

        Args:
            jwe_token: Token JWE en formato compacto
            recipient_private_key: Clave privada del receptor (PEM) o clave simétrica

        Returns:
            Diccionario con los datos descifrados

        Raises:
            ValueError: Si el token es inválido o no se puede descifrar
        """

        # Parsear header para obtener algoritmo
        try:
            parts = jwe_token.split('.')
            if len(parts) != 5:
                raise ValueError("Invalid JWE format: must have 5 parts")

            # Decodificar header
            header_b64 = parts[0]
            header_json = base64.urlsafe_b64decode(header_b64 + '==')
            header = json.loads(header_json)

            key_algorithm = header.get('alg')
            content_algorithm = header.get('enc')

            # Validar algoritmos
            if key_algorithm not in self.ALLOWED_KEY_ALGORITHMS:
                raise ValueError(f"Key algorithm {key_algorithm} not allowed")

            if content_algorithm not in self.ALLOWED_CONTENT_ALGORITHMS:
                raise ValueError(f"Content algorithm {content_algorithm} not allowed")

        except Exception as e:
            raise ValueError(f"Failed to parse JWE header: {str(e)}")

        # Seleccionar clave de descifrado
        if key_algorithm.startswith('RSA'):
            decryption_key = recipient_private_key or self.keys['rsa_private_pem']

        elif key_algorithm.startswith('ECDH'):
            decryption_key = recipient_private_key or self.keys['ec_private_pem']

        elif key_algorithm.endswith('KW') or key_algorithm.endswith('GCMKW'):
            if 'A128' in key_algorithm:
                decryption_key = self.keys['aes128_kw']
            elif 'A192' in key_algorithm:
                decryption_key = self.keys['aes192_kw']
            elif 'A256' in key_algorithm:
                decryption_key = self.keys['aes256_kw']
            else:
                raise ValueError(f"Unknown AES key size for {key_algorithm}")

        elif key_algorithm == 'dir':
            decryption_key = self.keys['direct_key']

        else:
            raise ValueError(f"Unsupported key algorithm: {key_algorithm}")

        # Descifrar
        try:
            plaintext = jwe.decrypt(jwe_token, decryption_key)
            payload = json.loads(plaintext)
            return payload

        except Exception as e:
            raise ValueError(f"Failed to decrypt JWE: {str(e)}")

    def encrypt_for_multiple_recipients(
        self,
        payload: Dict[str, Any],
        recipients: List[Dict[str, Any]],
        content_algorithm: str = 'A256GCM'
    ) -> str:
        """
        Cifra un payload para múltiples receptores (JWE JSON Serialization)

        Args:
            payload: Datos a cifrar
            recipients: Lista de receptores con formato:
                [
                    {
                        'alg': 'RSA-OAEP',
                        'kid': 'recipient-1',
                        'public_key': b'-----BEGIN PUBLIC KEY-----...'
                    },
                    ...
                ]
            content_algorithm: Algoritmo de cifrado de contenido

        Returns:
            JWE en formato JSON Serialization
        """

        # Generar CEK (Content Encryption Key) aleatorio
        if 'A128' in content_algorithm:
            cek = secrets.token_bytes(16)
        elif 'A192' in content_algorithm:
            cek = secrets.token_bytes(24)
        elif 'A256' in content_algorithm:
            cek = secrets.token_bytes(32)
        else:
            raise ValueError(f"Unsupported content algorithm: {content_algorithm}")

        # Convertir payload a JSON
        plaintext = json.dumps(payload).encode('utf-8')

        # Cifrar el contenido con el CEK
        # (En producción, usar una librería que soporte JSON Serialization)
        # Para este ejemplo, creamos JWE separados para cada receptor

        jwe_tokens = []
        for recipient in recipients:
            alg = recipient['alg']
            kid = recipient.get('kid', 'unknown')
            public_key = recipient['public_key']

            # Cifrar para este receptor
            jwe_token = self.encrypt_jwe(
                payload,
                key_algorithm=alg,
                content_algorithm=content_algorithm,
                recipient_key=public_key
            )

            jwe_tokens.append({
                'kid': kid,
                'alg': alg,
                'jwe': jwe_token
            })

        return {
            'recipients': jwe_tokens,
            'enc': content_algorithm
        }


class JWEKeyRotation:
    """Gestiona rotación de claves de cifrado para JWE"""

    def __init__(self, rotation_interval_days: int = 90):
        self.rotation_interval_days = rotation_interval_days
        self.active_keys = {}
        self.archived_keys = {}

    def generate_new_keypair(self, key_type: str = 'RSA') -> Dict[str, Any]:
        """
        Genera un nuevo par de claves para JWE

        Args:
            key_type: 'RSA' o 'EC'

        Returns:
            Diccionario con kid, claves y metadata
        """

        kid = f"{key_type}-{int(time.time())}"
        created_at = int(time.time())
        expires_at = created_at + (self.rotation_interval_days * 24 * 60 * 60)

        if key_type == 'RSA':
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            public_key = private_key.public_key()

            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

        elif key_type == 'EC':
            private_key = ec.generate_private_key(
                ec.SECP256R1(),
                backend=default_backend()
            )
            public_key = private_key.public_key()

            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

        else:
            raise ValueError(f"Unsupported key type: {key_type}")

        key_data = {
            'kid': kid,
            'kty': key_type,
            'private_key': private_pem,
            'public_key': public_pem,
            'created_at': created_at,
            'expires_at': expires_at,
            'status': 'active'
        }

        self.active_keys[kid] = key_data

        return key_data

    def rotate_keys(self) -> Dict[str, Any]:
        """
        Ejecuta rotación de claves: archiva claves expiradas y genera nuevas

        Returns:
            Diccionario con resultado de la rotación
        """

        current_time = int(time.time())
        rotated = []
        archived = []

        # Archivar claves expiradas
        for kid, key_data in list(self.active_keys.items()):
            if current_time >= key_data['expires_at']:
                key_data['status'] = 'archived'
                self.archived_keys[kid] = key_data
                del self.active_keys[kid]
                archived.append(kid)

        # Generar nuevas claves si no hay activas suficientes
        if len(self.active_keys) < 2:
            # Generar RSA y EC
            new_rsa = self.generate_new_keypair('RSA')
            new_ec = self.generate_new_keypair('EC')
            rotated.append(new_rsa['kid'])
            rotated.append(new_ec['kid'])

        return {
            'timestamp': current_time,
            'rotated': rotated,
            'archived': archived,
            'active_keys': list(self.active_keys.keys())
        }

    def get_active_public_keys(self) -> List[Dict[str, Any]]:
        """
        Obtiene todas las claves públicas activas (para compartir con clientes)

        Returns:
            Lista de claves públicas en formato JWK
        """

        public_keys = []

        for kid, key_data in self.active_keys.items():
            public_keys.append({
                'kid': kid,
                'kty': key_data['kty'],
                'use': 'enc',
                'public_key_pem': key_data['public_key'].decode('utf-8'),
                'expires_at': key_data['expires_at']
            })

        return public_keys


# Ejemplo de uso
if __name__ == '__main__':
    # Inicializar servicio
    jwe_service = JWEService()

    # 1. Cifrado con RSA-OAEP
    print("=== Test 1: RSA-OAEP Encryption ===")
    payload = {
        'user_id': '12345',
        'email': 'user@example.com',
        'ssn': '123-45-6789',
        'credit_card': '4111111111111111'
    }

    jwe_token_rsa = jwe_service.encrypt_jwe(
        payload,
        key_algorithm='RSA-OAEP',
        content_algorithm='A256GCM'
    )

    print(f"JWE Token (RSA-OAEP): {jwe_token_rsa[:100]}...")

    # Descifrar
    decrypted = jwe_service.decrypt_jwe(jwe_token_rsa)
    print(f"Decrypted: {decrypted}")
    print()

    # 2. Cifrado con ECDH-ES
    print("=== Test 2: ECDH-ES Encryption ===")
    jwe_token_ecdh = jwe_service.encrypt_jwe(
        payload,
        key_algorithm='ECDH-ES',
        content_algorithm='A256GCM'
    )

    print(f"JWE Token (ECDH-ES): {jwe_token_ecdh[:100]}...")

    decrypted_ecdh = jwe_service.decrypt_jwe(jwe_token_ecdh)
    print(f"Decrypted: {decrypted_ecdh}")
    print()

    # 3. Cifrado directo con clave compartida
    print("=== Test 3: Direct Encryption ===")
    jwe_token_dir = jwe_service.encrypt_jwe(
        payload,
        key_algorithm='dir',
        content_algorithm='A256GCM'
    )

    print(f"JWE Token (dir): {jwe_token_dir[:100]}...")

    decrypted_dir = jwe_service.decrypt_jwe(jwe_token_dir)
    print(f"Decrypted: {decrypted_dir}")
    print()

    # 4. Test de rotación de claves
    print("=== Test 4: Key Rotation ===")
    key_rotation = JWEKeyRotation(rotation_interval_days=90)

    # Generar claves iniciales
    key_rotation.generate_new_keypair('RSA')
    key_rotation.generate_new_keypair('EC')

    # Obtener claves públicas activas
    active_keys = key_rotation.get_active_public_keys()
    print(f"Active keys: {len(active_keys)}")
    for key in active_keys:
        print(f"  - {key['kid']} ({key['kty']})")

    print("\nJWE Encryption tests completed successfully!")
```

---

## Parte 3: Implementación de Nested JWT (JWE + JWS)

### Archivo: `nested_jwt.py`

```python
"""
Nested JWT - Implementación de JWT firmado y cifrado
"""

from jose import jws, jwe
import json
from typing import Dict, Any
from jwe_service import JWEService

class NestedJWT:
    """Implementa Nested JWT: firma primero (JWS), luego cifra (JWE)"""

    def __init__(self, jwe_service: JWEService):
        self.jwe_service = jwe_service

    def create_nested_jwt(
        self,
        payload: Dict[str, Any],
        signing_key: bytes,
        signing_algorithm: str,
        encryption_key: bytes,
        key_algorithm: str,
        content_algorithm: str
    ) -> str:
        """
        Crea un Nested JWT: JWS(payload) -> JWE(JWS)

        Pasos:
        1. Crear JWS con el payload (firma)
        2. Cifrar el JWS completo como JWE

        Args:
            payload: Claims del JWT
            signing_key: Clave privada para firma
            signing_algorithm: Algoritmo de firma (RS256, ES256, etc)
            encryption_key: Clave pública para cifrado
            key_algorithm: Algoritmo de gestión de claves JWE
            content_algorithm: Algoritmo de cifrado de contenido JWE

        Returns:
            Nested JWT string
        """

        # Paso 1: Crear JWS (firmar)
        jws_token = jws.sign(
            payload,
            signing_key,
            algorithm=signing_algorithm,
            headers={'typ': 'JWT'}
        )

        # Paso 2: Cifrar el JWS como JWE
        # El contenido a cifrar es el JWS token completo (string)
        plaintext = jws_token.encode('utf-8') if isinstance(jws_token, str) else jws_token

        nested_jwt = jwe.encrypt(
            plaintext,
            encryption_key,
            algorithm=key_algorithm,
            encryption=content_algorithm
        )

        return nested_jwt.decode('utf-8') if isinstance(nested_jwt, bytes) else nested_jwt

    def verify_nested_jwt(
        self,
        nested_jwt: str,
        decryption_key: bytes,
        verification_key: bytes
    ) -> Dict[str, Any]:
        """
        Verifica y descifra un Nested JWT

        Pasos:
        1. Descifrar JWE para obtener JWS
        2. Verificar firma del JWS
        3. Extraer payload

        Args:
            nested_jwt: Nested JWT string
            decryption_key: Clave privada para descifrado
            verification_key: Clave pública para verificación de firma

        Returns:
            Payload del JWT

        Raises:
            ValueError: Si la verificación falla
        """

        # Paso 1: Descifrar JWE
        try:
            jws_token = jwe.decrypt(nested_jwt, decryption_key)
            jws_token = jws_token.decode('utf-8') if isinstance(jws_token, bytes) else jws_token
        except Exception as e:
            raise ValueError(f"Failed to decrypt JWE: {str(e)}")

        # Paso 2: Verificar JWS
        try:
            payload = jws.verify(
                jws_token,
                verification_key,
                algorithms=['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']
            )

            # Decodificar payload JSON
            if isinstance(payload, bytes):
                payload = payload.decode('utf-8')

            return json.loads(payload)

        except Exception as e:
            raise ValueError(f"Failed to verify JWS: {str(e)}")


# Ejemplo de uso
if __name__ == '__main__':
    from cryptography.hazmat.primitives.asymmetric import rsa, ec
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend

    # Generar claves para firma (RSA)
    signing_private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    signing_public_key = signing_private_key.public_key()

    signing_private_pem = signing_private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    signing_public_pem = signing_public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # Generar claves para cifrado (EC)
    encryption_private_key = ec.generate_private_key(
        ec.SECP256R1(),
        backend=default_backend()
    )
    encryption_public_key = encryption_private_key.public_key()

    encryption_private_pem = encryption_private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    encryption_public_pem = encryption_public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # Crear Nested JWT
    jwe_service = JWEService()
    nested_jwt_service = NestedJWT(jwe_service)

    payload = {
        'sub': 'user@example.com',
        'aud': 'https://api.example.com',
        'iss': 'https://auth.example.com',
        'exp': 1735689600,
        'iat': 1735603200,
        'data': {
            'ssn': '123-45-6789',
            'account': '9876543210'
        }
    }

    print("=== Creating Nested JWT ===")
    nested_token = nested_jwt_service.create_nested_jwt(
        payload=payload,
        signing_key=signing_private_pem,
        signing_algorithm='RS256',
        encryption_key=encryption_public_pem,
        key_algorithm='ECDH-ES',
        content_algorithm='A256GCM'
    )

    print(f"Nested JWT: {nested_token[:150]}...")
    print(f"Length: {len(nested_token)} bytes")
    print()

    # Verificar Nested JWT
    print("=== Verifying Nested JWT ===")
    decrypted_payload = nested_jwt_service.verify_nested_jwt(
        nested_jwt=nested_token,
        decryption_key=encryption_private_pem,
        verification_key=signing_public_pem
    )

    print(f"Decrypted and verified payload:")
    print(json.dumps(decrypted_payload, indent=2))
    print()

    print("Nested JWT test completed successfully!")
```

---

## Parte 4: Flask API con Endpoints JWE

### Archivo: `app.py`

```python
"""
Flask API con endpoints para JWE encryption/decryption
"""

from flask import Flask, request, jsonify
from jwe_service import JWEService, JWEKeyRotation
from nested_jwt import NestedJWT
import json

app = Flask(__name__)

# Inicializar servicios
jwe_service = JWEService()
key_rotation = JWEKeyRotation(rotation_interval_days=90)
nested_jwt_service = NestedJWT(jwe_service)

# Generar claves iniciales
key_rotation.generate_new_keypair('RSA')
key_rotation.generate_new_keypair('EC')


@app.route('/api/jwe/encrypt', methods=['POST'])
def encrypt_endpoint():
    """
    Endpoint para cifrar datos como JWE

    Request:
    {
        "payload": {...},
        "key_algorithm": "RSA-OAEP",
        "content_algorithm": "A256GCM"
    }

    Response:
    {
        "jwe_token": "eyJ...",
        "algorithm": "RSA-OAEP",
        "encryption": "A256GCM"
    }
    """

    try:
        data = request.get_json()

        payload = data.get('payload')
        key_algorithm = data.get('key_algorithm', 'RSA-OAEP')
        content_algorithm = data.get('content_algorithm', 'A256GCM')

        if not payload:
            return jsonify({'error': 'payload is required'}), 400

        # Cifrar
        jwe_token = jwe_service.encrypt_jwe(
            payload,
            key_algorithm=key_algorithm,
            content_algorithm=content_algorithm
        )

        return jsonify({
            'jwe_token': jwe_token,
            'algorithm': key_algorithm,
            'encryption': content_algorithm
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/jwe/decrypt', methods=['POST'])
def decrypt_endpoint():
    """
    Endpoint para descifrar JWE

    Request:
    {
        "jwe_token": "eyJ..."
    }

    Response:
    {
        "payload": {...}
    }
    """

    try:
        data = request.get_json()
        jwe_token = data.get('jwe_token')

        if not jwe_token:
            return jsonify({'error': 'jwe_token is required'}), 400

        # Descifrar
        payload = jwe_service.decrypt_jwe(jwe_token)

        return jsonify({
            'payload': payload
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/jwe/keys', methods=['GET'])
def get_public_keys():
    """
    Endpoint para obtener claves públicas activas (JWKS endpoint)

    Response:
    {
        "keys": [
            {
                "kid": "RSA-1234567890",
                "kty": "RSA",
                "use": "enc",
                "public_key_pem": "-----BEGIN PUBLIC KEY-----...",
                "expires_at": 1735689600
            },
            ...
        ]
    }
    """

    active_keys = key_rotation.get_active_public_keys()

    return jsonify({
        'keys': active_keys
    }), 200


@app.route('/api/jwe/keys/rotate', methods=['POST'])
def rotate_keys_endpoint():
    """
    Endpoint para rotar claves manualmente

    Response:
    {
        "rotated": ["RSA-1234567890", "EC-1234567891"],
        "archived": ["RSA-1234567890"],
        "active_keys": ["RSA-1234567892", "EC-1234567893"]
    }
    """

    result = key_rotation.rotate_keys()

    return jsonify(result), 200


@app.route('/api/nested-jwt/create', methods=['POST'])
def create_nested_jwt_endpoint():
    """
    Endpoint para crear Nested JWT (JWS + JWE)

    Request:
    {
        "payload": {...}
    }

    Response:
    {
        "nested_jwt": "eyJ..."
    }
    """

    try:
        data = request.get_json()
        payload = data.get('payload')

        if not payload:
            return jsonify({'error': 'payload is required'}), 400

        # Usar claves internas para firma y cifrado
        nested_token = nested_jwt_service.create_nested_jwt(
            payload=payload,
            signing_key=jwe_service.keys['rsa_private_pem'],
            signing_algorithm='RS256',
            encryption_key=jwe_service.keys['ec_public_pem'],
            key_algorithm='ECDH-ES',
            content_algorithm='A256GCM'
        )

        return jsonify({
            'nested_jwt': nested_token
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/nested-jwt/verify', methods=['POST'])
def verify_nested_jwt_endpoint():
    """
    Endpoint para verificar Nested JWT

    Request:
    {
        "nested_jwt": "eyJ..."
    }

    Response:
    {
        "payload": {...}
    }
    """

    try:
        data = request.get_json()
        nested_jwt = data.get('nested_jwt')

        if not nested_jwt:
            return jsonify({'error': 'nested_jwt is required'}), 400

        # Verificar
        payload = nested_jwt_service.verify_nested_jwt(
            nested_jwt=nested_jwt,
            decryption_key=jwe_service.keys['ec_private_pem'],
            verification_key=jwe_service.keys['rsa_public_pem']
        )

        return jsonify({
            'payload': payload
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    print("Starting JWE API server...")
    print("Available endpoints:")
    print("  POST /api/jwe/encrypt - Encrypt payload as JWE")
    print("  POST /api/jwe/decrypt - Decrypt JWE token")
    print("  GET  /api/jwe/keys - Get active public keys (JWKS)")
    print("  POST /api/jwe/keys/rotate - Rotate encryption keys")
    print("  POST /api/nested-jwt/create - Create Nested JWT")
    print("  POST /api/nested-jwt/verify - Verify Nested JWT")
    print()

    app.run(debug=True, port=5000)
```

---

## Parte 5: Ejercicios Prácticos

### Ejercicio 1: Comparar Algoritmos de Cifrado

Implementa un script que compare el rendimiento de diferentes algoritmos:

```python
import time
from jwe_service import JWEService

jwe_service = JWEService()

payload = {'data': 'x' * 1000}  # 1KB de datos

algorithms = [
    ('RSA-OAEP', 'A128GCM'),
    ('RSA-OAEP', 'A256GCM'),
    ('ECDH-ES', 'A256GCM'),
    ('dir', 'A256GCM'),
]

for key_alg, content_alg in algorithms:
    start = time.time()
    jwe_token = jwe_service.encrypt_jwe(payload, key_alg, content_alg)
    encrypt_time = time.time() - start

    start = time.time()
    decrypted = jwe_service.decrypt_jwe(jwe_token)
    decrypt_time = time.time() - start

    print(f"{key_alg} + {content_alg}:")
    print(f"  Encrypt: {encrypt_time*1000:.2f}ms")
    print(f"  Decrypt: {decrypt_time*1000:.2f}ms")
    print(f"  Token size: {len(jwe_token)} bytes")
    print()
```

### Ejercicio 2: Implementar Cifrado de Archivos

Crea un script que cifre archivos grandes usando JWE:

```python
import os
from jwe_service import JWEService

def encrypt_file(input_path, output_path, jwe_service):
    """Cifra un archivo completo"""
    with open(input_path, 'rb') as f:
        file_data = f.read()

    payload = {
        'filename': os.path.basename(input_path),
        'data': file_data.hex()  # Convertir bytes a hex
    }

    jwe_token = jwe_service.encrypt_jwe(
        payload,
        key_algorithm='RSA-OAEP',
        content_algorithm='A256GCM'
    )

    with open(output_path, 'w') as f:
        f.write(jwe_token)

    print(f"File encrypted: {output_path}")

# Uso
jwe_service = JWEService()
encrypt_file('document.pdf', 'document.pdf.jwe', jwe_service)
```

### Ejercicio 3: Sistema de Comunicación Segura

Implementa un sistema donde:
1. Alice cifra un mensaje para Bob usando su clave pública
2. Bob descifra con su clave privada
3. Bob firma la respuesta
4. Alice verifica la firma

```python
from jwe_service import JWEService
from nested_jwt import NestedJWT
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# Generar claves para Alice y Bob
alice_key = rsa.generate_private_key(65537, 2048, default_backend())
bob_key = rsa.generate_private_key(65537, 2048, default_backend())

alice_public_pem = alice_key.public_key().public_bytes(
    serialization.Encoding.PEM,
    serialization.PublicFormat.SubjectPublicKeyInfo
)

bob_public_pem = bob_key.public_key().public_bytes(
    serialization.Encoding.PEM,
    serialization.PublicFormat.SubjectPublicKeyInfo
)

bob_private_pem = bob_key.private_bytes(
    serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8,
    serialization.NoEncryption()
)

# Alice cifra para Bob
jwe_service = JWEService()
message = {'from': 'Alice', 'to': 'Bob', 'message': 'Hello Bob!'}

encrypted = jwe_service.encrypt_jwe(
    message,
    key_algorithm='RSA-OAEP',
    content_algorithm='A256GCM',
    recipient_key=bob_public_pem
)

print(f"Alice -> Bob: {encrypted[:100]}...")

# Bob descifra
decrypted = jwe_service.decrypt_jwe(encrypted, bob_private_pem)
print(f"Bob received: {decrypted}")
```

---

## Parte 6: Verificación de Completado

### Checklist de Verificación

- [ ] JWE encryption/decryption implementado con RSA-OAEP
- [ ] JWE encryption/decryption implementado con ECDH-ES
- [ ] JWE encryption/decryption implementado con cifrado directo
- [ ] Sistema de rotación de claves funcional
- [ ] Nested JWT (JWS + JWE) implementado correctamente
- [ ] API Flask con todos los endpoints funcionando
- [ ] Cifrado para múltiples receptores implementado
- [ ] Comparación de rendimiento entre algoritmos completada
- [ ] Sistema de comunicación segura implementado
- [ ] Tests de seguridad ejecutados exitosamente

### Comandos de Verificación

```bash
# Ejecutar tests
python jwe_service.py
python nested_jwt.py

# Iniciar API
python app.py

# Test de endpoints (en otra terminal)
curl -X POST http://localhost:5000/api/jwe/encrypt \
  -H "Content-Type: application/json" \
  -d '{"payload": {"message": "secret data"}, "key_algorithm": "RSA-OAEP", "content_algorithm": "A256GCM"}'

curl http://localhost:5000/api/jwe/keys
```

---

## Referencias

### RFCs Oficiales
- **RFC 7516** - JSON Web Encryption (JWE)
- **RFC 7517** - JSON Web Key (JWK)
- **RFC 7518** - JSON Web Algorithms (JWA)
- **RFC 7520** - Examples of Protecting Content Using JSON Object Signing and Encryption (JOSE)

### Documentación Oficial
- **python-jose**: https://python-jose.readthedocs.io/
- **cryptography**: https://cryptography.io/en/latest/

### Papers Académicos
- Bleichenbacher, D. (1998). "Chosen Ciphertext Attacks Against Protocols Based on the RSA Encryption Standard PKCS #1"
- Manger, J. (2001). "A Chosen Ciphertext Attack on RSA Optimal Asymmetric Encryption Padding (OAEP)"

### Libros Técnicos
- Ferguson, N., Schneier, B., & Kohno, T. (2010). *Cryptography Engineering*. Wiley.
- Boyd, C., & Mathuria, A. (2013). *Protocols for Authentication and Key Establishment*. Springer.

### Standards
- **NIST SP 800-56A** - Recommendation for Pair-Wise Key-Establishment Schemes Using Discrete Logarithm Cryptography
- **NIST SP 800-56B** - Recommendation for Pair-Wise Key Establishment Using Integer Factorization Cryptography

---

## Notas Finales

- **Producción**: Usa librerías bien mantenidas como `python-jose` o `jwcrypto`
- **Key Management**: Considera HSMs para claves privadas en producción
- **Rotación**: Implementa rotación automática con múltiples claves activas
- **Monitoreo**: Registra todas las operaciones de cifrado/descifrado para auditoría
- **Performance**: Para archivos grandes, considera chunking o streaming encryption
