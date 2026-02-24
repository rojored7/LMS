# Laboratorio 01: JWS Avanzado - Múltiples Algoritmos y Seguridad

## Objetivos

Al completar este laboratorio, serás capaz de:

1. Implementar JWS con múltiples algoritmos (HS256, RS256, ES256, EdDSA)
2. Crear un JWKS (JSON Web Key Set) endpoint con rotación de claves
3. Implementar whitelist de algoritmos y validación robusta
4. Testear vulnerabilidades comunes (alg=none, algorithm confusion)
5. Implementar detached JWS para firmar archivos grandes

## Requisitos Previos

- Python 3.8+
- Conocimientos de JWT y criptografía asimétrica
- Lectura previa: `02_jose_completo.md`, `03_jwt_seguridad_best_practices.md`

## Duración Estimada

2-3 horas

---

## Parte 1: Configuración del Entorno

### Instalación de Dependencias

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install python-jose[cryptography] cryptography flask redis
```

### Estructura del Proyecto

```
lab_01_jws_avanzado/
├── app.py                    # Flask application
├── jws_service.py            # JWS signing/verification
├── jwks_manager.py           # JWKS generation and rotation
├── security_tests.py         # Vulnerability tests
├── requirements.txt
└── README.md
```

---

## Parte 2: Implementación de JWS con Múltiples Algoritmos

### Archivo: `jws_service.py`

```python
"""
JWS Service - Implementación de firma y verificación con múltiples algoritmos
"""

from jose import jws, jwk
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
import json
import secrets
import time
from typing import Dict, Any, Optional

class JWSService:
    """Servicio para crear y verificar JWS con múltiples algoritmos"""

    # Whitelist de algoritmos permitidos
    ALLOWED_ALGORITHMS = {
        'HS256', 'HS384', 'HS512',      # HMAC
        'RS256', 'RS384', 'RS512',      # RSA-PKCS1
        'ES256', 'ES384', 'ES512',      # ECDSA
        'PS256', 'PS384', 'PS512',      # RSA-PSS
        'EdDSA'                         # Ed25519
    }

    def __init__(self):
        self.keys = {}
        self._generate_all_keys()

    def _generate_all_keys(self):
        """Genera claves para todos los algoritmos soportados"""

        # 1. HMAC Secrets (256 bits = 32 bytes)
        self.keys['hmac_secret'] = secrets.token_bytes(32)

        # 2. RSA Keys (2048 bits)
        rsa_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.keys['rsa_private'] = rsa_private_key
        self.keys['rsa_public'] = rsa_private_key.public_key()

        # 3. EC Keys (P-256)
        ec_private_key = ec.generate_private_key(
            ec.SECP256R1(),  # P-256
            backend=default_backend()
        )
        self.keys['ec_private'] = ec_private_key
        self.keys['ec_public'] = ec_private_key.public_key()

        # 4. Ed25519 Keys
        ed_private_key = Ed25519PrivateKey.generate()
        self.keys['ed_private'] = ed_private_key
        self.keys['ed_public'] = ed_private_key.public_key()

    def create_jws(self, payload: Dict[str, Any], algorithm: str, kid: str) -> str:
        """
        Crea un JWS con el algoritmo especificado

        Args:
            payload: Diccionario con los claims del JWT
            algorithm: Algoritmo a usar (debe estar en whitelist)
            kid: Key ID para identificar la clave

        Returns:
            JWS token string

        Raises:
            ValueError: Si el algoritmo no está permitido
        """

        # Validar algoritmo
        if algorithm not in self.ALLOWED_ALGORITHMS:
            raise ValueError(f"Algorithm {algorithm} not allowed")

        # Rechazar explícitamente alg=none
        if algorithm.lower() == 'none':
            raise ValueError("Algorithm 'none' is forbidden")

        # Agregar claims estándar
        payload = {
            **payload,
            'iat': int(time.time()),
            'exp': int(time.time()) + 900,  # 15 minutos
        }

        # Header con kid
        headers = {'kid': kid}

        # Seleccionar clave según algoritmo
        if algorithm.startswith('HS'):
            # HMAC - usar secret
            key = self.keys['hmac_secret']

        elif algorithm.startswith('RS') or algorithm.startswith('PS'):
            # RSA - serializar clave privada a PEM
            key = self.keys['rsa_private'].private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

        elif algorithm.startswith('ES'):
            # ECDSA - serializar clave privada EC
            key = self.keys['ec_private'].private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

        elif algorithm == 'EdDSA':
            # Ed25519
            key = self.keys['ed_private'].private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        # Crear JWS
        token = jws.sign(
            payload,
            key,
            algorithm=algorithm,
            headers=headers
        )

        return token

    def verify_jws(self, token: str, allowed_algorithms: Optional[list] = None) -> Dict[str, Any]:
        """
        Verifica un JWS token

        Args:
            token: JWS token string
            allowed_algorithms: Lista de algoritmos permitidos (opcional)

        Returns:
            Payload decodificado

        Raises:
            ValueError: Si la verificación falla
        """

        # Usar algoritmos por defecto si no se especifican
        if allowed_algorithms is None:
            allowed_algorithms = list(self.ALLOWED_ALGORITHMS)

        # Obtener header sin verificar firma (para extraer kid y alg)
        header = jws.get_unverified_header(token)

        # Validar algoritmo
        alg = header.get('alg')
        if alg not in allowed_algorithms:
            raise ValueError(f"Algorithm {alg} not allowed")

        # Rechazar alg=none explícitamente
        if alg == 'none':
            raise ValueError("Algorithm 'none' is forbidden")

        kid = header.get('kid')

        # Seleccionar clave según algoritmo
        if alg.startswith('HS'):
            key = self.keys['hmac_secret']

        elif alg.startswith('RS') or alg.startswith('PS'):
            # RSA - usar clave pública
            key = self.keys['rsa_public'].public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

        elif alg.startswith('ES'):
            key = self.keys['ec_public'].public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

        elif alg == 'EdDSA':
            key = self.keys['ed_public'].public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

        else:
            raise ValueError(f"Unsupported algorithm: {alg}")

        # Verificar firma
        payload = jws.verify(token, key, algorithms=[alg])

        # Decodificar payload
        payload_dict = json.loads(payload)

        # Validar exp
        exp = payload_dict.get('exp')
        if exp and exp < time.time():
            raise ValueError("Token expired")

        return payload_dict

    def get_public_key_jwk(self, algorithm: str, kid: str) -> Dict[str, Any]:
        """
        Obtiene la clave pública en formato JWK

        Args:
            algorithm: Algoritmo (determina qué clave retornar)
            kid: Key ID

        Returns:
            JWK dict
        """

        if algorithm.startswith('RS') or algorithm.startswith('PS'):
            public_key = self.keys['rsa_public']
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

            # Convertir PEM a JWK
            public_jwk = jwk.construct(public_pem, algorithm)
            jwk_dict = json.loads(public_jwk.to_json())

        elif algorithm.startswith('ES'):
            public_key = self.keys['ec_public']
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

            public_jwk = jwk.construct(public_pem, algorithm)
            jwk_dict = json.loads(public_jwk.to_json())

        elif algorithm == 'EdDSA':
            public_key = self.keys['ed_public']
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

            # Para EdDSA necesitamos construcción especial
            public_jwk = {
                "kty": "OKP",
                "crv": "Ed25519",
                "use": "sig",
                "kid": kid,
                "alg": "EdDSA",
                "x": "..."  # Extraer coordenada X
            }
            # Nota: python-jose puede no soportar completamente EdDSA JWK
            # En producción usar library más completa
            return public_jwk

        else:
            raise ValueError(f"Cannot export symmetric key for {algorithm}")

        # Agregar kid y use
        jwk_dict['kid'] = kid
        jwk_dict['use'] = 'sig'
        jwk_dict['alg'] = algorithm

        return jwk_dict
```

---

## Parte 3: JWKS Endpoint con Rotación

### Archivo: `jwks_manager.py`

```python
"""
JWKS Manager - Gestión de JSON Web Key Sets con rotación
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from jws_service import JWSService

class JWKSManager:
    """Gestiona JWKS con soporte para rotación de claves"""

    def __init__(self):
        self.jws_service = JWSService()
        self.active_keys = []
        self.deprecated_keys = []
        self._initialize_keys()

    def _initialize_keys(self):
        """Inicializa claves activas"""

        # Clave RSA primaria
        self.active_keys.append({
            'kid': '2024-02-rsa-primary',
            'algorithm': 'RS256',
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(days=90)
        })

        # Clave EC secundaria
        self.active_keys.append({
            'kid': '2024-02-ec-backup',
            'algorithm': 'ES256',
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(days=90)
        })

    def get_jwks(self) -> Dict[str, List]:
        """
        Retorna JWKS público con todas las claves activas y deprecated

        Returns:
            Dict con keys array
        """

        keys = []

        # Agregar claves activas
        for key_info in self.active_keys:
            try:
                jwk_dict = self.jws_service.get_public_key_jwk(
                    key_info['algorithm'],
                    key_info['kid']
                )
                keys.append(jwk_dict)
            except ValueError:
                # Algoritmo simétrico, no agregar al JWKS
                pass

        # Agregar claves deprecated (aún válidas para verificación)
        for key_info in self.deprecated_keys:
            if datetime.now() < key_info['expires_at']:
                try:
                    jwk_dict = self.jws_service.get_public_key_jwk(
                        key_info['algorithm'],
                        key_info['kid']
                    )
                    jwk_dict['deprecated'] = True
                    keys.append(jwk_dict)
                except ValueError:
                    pass

        return {"keys": keys}

    def rotate_key(self, old_kid: str, new_algorithm: str = 'RS256'):
        """
        Rota una clave: mueve a deprecated y crea nueva

        Args:
            old_kid: Kid de la clave a rotar
            new_algorithm: Algoritmo para la nueva clave
        """

        # Buscar clave activa
        key_to_rotate = None
        for key in self.active_keys:
            if key['kid'] == old_kid:
                key_to_rotate = key
                break

        if not key_to_rotate:
            raise ValueError(f"Key {old_kid} not found in active keys")

        # Mover a deprecated (mantener válida 30 días)
        key_to_rotate['deprecated_at'] = datetime.now()
        key_to_rotate['expires_at'] = datetime.now() + timedelta(days=30)
        self.deprecated_keys.append(key_to_rotate)
        self.active_keys.remove(key_to_rotate)

        # Crear nueva clave
        new_kid = f"{datetime.now().strftime('%Y-%m')}-{new_algorithm.lower()}-new"
        self.active_keys.append({
            'kid': new_kid,
            'algorithm': new_algorithm,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(days=90)
        })

        return new_kid

    def cleanup_expired_keys(self):
        """Elimina claves expired de la lista deprecated"""

        self.deprecated_keys = [
            key for key in self.deprecated_keys
            if datetime.now() < key['expires_at']
        ]
```

---

## Parte 4: Tests de Vulnerabilidades

### Archivo: `security_tests.py`

```python
"""
Security Tests - Tests de vulnerabilidades comunes en JWS
"""

import json
import base64
from jws_service import JWSService

class JWSSecurityTests:
    """Suite de tests de seguridad para JWS"""

    def __init__(self):
        self.jws_service = JWSService()

    def test_alg_none_attack(self):
        """
        Test: Ataque alg=none

        Descripción: El atacante modifica el header para usar alg=none
        y elimina la firma, intentando bypass de autenticación.
        """

        print("\n=== TEST 1: Ataque alg=none ===")

        # Token original válido con RS256
        payload = {"sub": "user@example.com", "role": "user"}
        valid_token = self.jws_service.create_jws(payload, 'RS256', '2024-rsa')

        print(f"Token válido: {valid_token[:50]}...")

        # Atacante modifica header a alg=none
        header = {"alg": "none", "typ": "JWT"}
        header_b64 = base64.urlsafe_b64encode(
            json.dumps(header).encode()
        ).rstrip(b'=').decode()

        # Payload malicioso (escalación de privilegios)
        malicious_payload = {"sub": "user@example.com", "role": "admin"}
        payload_b64 = base64.urlsafe_b64encode(
            json.dumps(malicious_payload).encode()
        ).rstrip(b'=').decode()

        # Token malicioso sin firma
        malicious_token = f"{header_b64}.{payload_b64}."

        print(f"Token malicioso: {malicious_token[:50]}...")

        # Intentar verificar
        try:
            self.jws_service.verify_jws(malicious_token)
            print("❌ VULNERABLE: Token con alg=none fue aceptado")
        except ValueError as e:
            print(f"✓ SEGURO: Token rechazado - {e}")

    def test_algorithm_confusion_attack(self):
        """
        Test: Ataque de confusión de algoritmo (RS256 → HS256)

        Descripción: El atacante cambia el algoritmo de asimétrico (RS256)
        a simétrico (HS256), usando la clave pública como secret HMAC.
        """

        print("\n=== TEST 2: Algorithm Confusion (RS256 → HS256) ===")

        # Servidor usa RS256
        payload = {"sub": "user@example.com", "role": "user"}
        rs256_token = self.jws_service.create_jws(payload, 'RS256', '2024-rsa')

        # Atacante obtiene clave pública (público en JWKS)
        from cryptography.hazmat.primitives import serialization
        public_pem = self.jws_service.keys['rsa_public'].public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # Atacante crea token con HS256 usando clave pública como secret
        from jose import jws
        malicious_payload = {"sub": "attacker@evil.com", "role": "admin"}
        malicious_token = jws.sign(
            malicious_payload,
            public_pem,  # ← Clave pública como HMAC secret
            algorithm='HS256',
            headers={'kid': '2024-rsa'}
        )

        print(f"Token malicioso (HS256): {malicious_token[:50]}...")

        # Intentar verificar con whitelist que incluye HS256 (VULNERABLE)
        try:
            result = self.jws_service.verify_jws(
                malicious_token,
                allowed_algorithms=['RS256', 'HS256']  # ← VULNERABLE
            )
            print(f"❌ VULNERABLE: Token aceptado - {result}")
        except Exception as e:
            print(f"✓ SEGURO: Token rechazado - {e}")

        # Intentar verificar con whitelist solo RS256 (SEGURO)
        try:
            result = self.jws_service.verify_jws(
                malicious_token,
                allowed_algorithms=['RS256']  # ← SEGURO
            )
            print(f"❌ Token aceptado (no debería): {result}")
        except Exception as e:
            print(f"✓ SEGURO: Token rechazado con whitelist correcta - {e}")

    def test_weak_hmac_secret(self):
        """
        Test: Weak HMAC secret

        Descripción: Demuestra la importancia de usar secrets fuertes
        """

        print("\n=== TEST 3: Weak HMAC Secret ===")

        # Secret débil (predecible)
        weak_secret = b"secret123"

        # Token con secret débil
        payload = {"sub": "user@example.com"}
        weak_token = jws.sign(payload, weak_secret, algorithm='HS256')

        print(f"Token con secret débil: {weak_token}")

        # Simular brute-force (en realidad usar hashcat/john)
        common_secrets = [
            b"password", b"secret", b"secret123", b"12345678"
        ]

        for candidate_secret in common_secrets:
            try:
                jws.verify(weak_token, candidate_secret, algorithms=['HS256'])
                print(f"❌ Secret crackeado: {candidate_secret.decode()}")
                break
            except:
                pass

        # Recomendación
        import secrets as sec
        strong_secret = sec.token_bytes(32)
        print(f"\n✓ Usar secret fuerte de 256 bits: {strong_secret.hex()[:32]}...")

    def run_all_tests(self):
        """Ejecuta todos los tests de seguridad"""

        print("\n" + "="*60)
        print("SUITE DE TESTS DE SEGURIDAD JWS")
        print("="*60)

        self.test_alg_none_attack()
        self.test_algorithm_confusion_attack()
        self.test_weak_hmac_secret()

        print("\n" + "="*60)
        print("TESTS COMPLETADOS")
        print("="*60)

if __name__ == "__main__":
    tests = JWSSecurityTests()
    tests.run_all_tests()
```

---

## Parte 5: Flask API

### Archivo: `app.py`

```python
"""
Flask API - Endpoints para signing, verification y JWKS
"""

from flask import Flask, request, jsonify
from jws_service import JWSService
from jwks_manager import JWKSManager
from security_tests import JWSSecurityTests

app = Flask(__name__)
jws_service = JWSService()
jwks_manager = JWKSManager()

@app.route('/sign', methods=['POST'])
def sign_token():
    """
    Endpoint para firmar tokens

    Body:
    {
        "payload": {"sub": "user@example.com", "role": "user"},
        "algorithm": "RS256",
        "kid": "2024-02-rsa-primary"
    }
    """

    data = request.json
    payload = data.get('payload', {})
    algorithm = data.get('algorithm', 'RS256')
    kid = data.get('kid', '2024-02-rsa-primary')

    try:
        token = jws_service.create_jws(payload, algorithm, kid)
        return jsonify({"token": token}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/verify', methods=['POST'])
def verify_token():
    """
    Endpoint para verificar tokens

    Body:
    {
        "token": "eyJhbGc...",
        "allowed_algorithms": ["RS256", "ES256"]
    }
    """

    data = request.json
    token = data.get('token')
    allowed_algorithms = data.get('allowed_algorithms')

    try:
        payload = jws_service.verify_jws(token, allowed_algorithms)
        return jsonify({"valid": True, "payload": payload}), 200
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 401

@app.route('/.well-known/jwks.json', methods=['GET'])
def jwks_endpoint():
    """JWKS endpoint público"""

    jwks = jwks_manager.get_jwks()
    return jsonify(jwks), 200

@app.route('/rotate-key', methods=['POST'])
def rotate_key():
    """
    Endpoint para rotar claves

    Body:
    {
        "old_kid": "2024-02-rsa-primary",
        "new_algorithm": "ES256"
    }
    """

    data = request.json
    old_kid = data.get('old_kid')
    new_algorithm = data.get('new_algorithm', 'RS256')

    try:
        new_kid = jwks_manager.rotate_key(old_kid, new_algorithm)
        return jsonify({"new_kid": new_kid, "status": "rotated"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/security-tests', methods=['GET'])
def run_security_tests():
    """Ejecuta suite de tests de seguridad"""

    import io
    import sys

    # Capturar stdout
    old_stdout = sys.stdout
    sys.stdout = buffer = io.StringIO()

    tests = JWSSecurityTests()
    tests.run_all_tests()

    # Restaurar stdout
    sys.stdout = old_stdout
    output = buffer.getvalue()

    return jsonify({"test_output": output}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## Ejercicios Prácticos

### Ejercicio 1: Implementar EdDSA Completo

**Objetivo**: Completar el soporte para EdDSA (Ed25519) en JWK export.

**Tarea**: Modifica `jws_service.py` para exportar correctamente claves Ed25519 en formato JWK.

**Pista**: Usa `cryptography` para extraer la coordenada X de la clave pública.

### Ejercicio 2: Detached JWS

**Objetivo**: Implementar detached JWS para firmar archivos grandes.

**Tarea**: Crea una función `create_detached_jws()` que:
1. Reciba un archivo grande como parámetro
2. Calcule la firma sobre el archivo
3. Retorne el JWS sin el payload embebido

### Ejercicio 3: Key Rotation Automation

**Objetivo**: Automatizar la rotación de claves cada 90 días.

**Tarea**: Implementa un script cron que:
1. Verifique la edad de las claves activas
2. Rote automáticamente claves antiguas
3. Notifique por email cuando se rote una clave

---

## Verificación de Completado

Marca cada ítem al completarlo:

- [ ] Instalaste todas las dependencias
- [ ] Implementaste JWS con al menos 4 algoritmos diferentes
- [ ] Creaste el JWKS endpoint y verificaste que retorna claves públicas
- [ ] Ejecutaste los tests de seguridad y todos pasaron
- [ ] Testeaste el ataque alg=none y fue rechazado
- [ ] Testeaste algorithm confusion y fue rechazado con whitelist correcta
- [ ] Rotaste una clave y verificaste que la deprecated sigue funcionando
- [ ] Completaste al menos 2 de los 3 ejercicios prácticos

---

## Recursos Adicionales

- **RFC 7515** (JWS): https://datatracker.ietf.org/doc/html/rfc7515
- **RFC 7517** (JWK): https://datatracker.ietf.org/doc/html/rfc7517
- **RFC 7518** (JWA): https://datatracker.ietf.org/doc/html/rfc7518
- **jwt.io**: Debugger online - https://jwt.io
- **mkjwk.org**: Generador de JWK - https://mkjwk.org

---

**Tiempo estimado**: 2-3 horas
**Dificultad**: Media-Alta
**Prerrequisitos**: Teorías 02, 03 del módulo 6
