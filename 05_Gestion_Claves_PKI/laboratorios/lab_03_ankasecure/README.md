# Laboratorio 03: Integración con ANKASecure KMS

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Comprender** la arquitectura de ANKASecure como KMS (Key Management Service)
2. **Integrar** aplicaciones con ANKASecure API para gestión de claves
3. **Generar** y rotar claves criptográficas usando ANKASecure
4. **Cifrar/Descifrar** datos usando claves gestionadas por ANKASecure
5. **Implementar** políticas de acceso y auditoría de uso de claves
6. **Migrar** un sistema legacy a gestión centralizada de claves

## Duración Estimada
**3-4 horas** (Setup: 45 min | Integración: 2h | Proyecto: 1h | Evaluación: 30 min)

---

## Parte 1: Arquitectura de ANKASecure

### 1.1 Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    APLICACIÓN                            │
│  (Backend, Frontend, Mobile, Microservicios)            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ REST API / SDK
                   │
┌──────────────────┴──────────────────────────────────────┐
│              ANKA SECURE API GATEWAY                     │
│   - Autenticación (API Keys, OAuth, mTLS)               │
│   - Rate Limiting                                        │
│   - Auditoría de requests                               │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───┴────┐   ┌────┴─────┐   ┌───┴────────┐
│  KMS   │   │  CRYPTO  │   │   VAULT    │
│ Service│   │  Service │   │  Service   │
└───┬────┘   └────┬─────┘   └───┬────────┘
    │             │             │
    └─────────────┴─────────────┘
                  │
         ┌────────┴────────┐
         │   HSM CLUSTER   │
         │ (Hardware Sec.) │
         └─────────────────┘
```

### 1.2 Casos de Uso

1. **KMS (Key Management Service)**
   - Generación de claves (simétri cas, asimétricas, PQC)
   - Rotación automática de claves
   - Versionado de claves
   - Destrucción segura

2. **Crypto Service**
   - Cifrado/Descifrado (AES-GCM, ChaCha20, ML-KEM)
   - Firma digital (Ed25519, ML-DSA)
   - Hashing (SHA-2, SHA-3, Argon2)

3. **Vault Service**
   - Almacenamiento seguro de secretos
   - API keys, contraseñas, certificados
   - Control de acceso granular

---

## Parte 2: Setup de Entorno de Desarrollo

### 2.1 Instalación de ANKASecure SDK

```bash
# Crear entorno virtual
python3 -m venv venv_ankasecure
source venv_ankasecure/bin/activate  # Windows: venv_ankasecure\Scripts\activate

# Instalar SDK de Python
pip install ankasecure-python cryptography requests

# Verificar instalación
python -c "import ankasecure; print(ankasecure.__version__)"
```

### 2.2 Configuración de Credenciales

Crea un archivo `.env` con tus credenciales de desarrollo:

```bash
# .env
ANKASECURE_API_URL=https://api-dev.ankasecure.com/v1
ANKASECURE_API_KEY=your_api_key_here
ANKASECURE_PROJECT_ID=your_project_id_here
```

**IMPORTANTE**: Nunca commit archivos `.env` a repositorios Git.

```bash
# .gitignore
.env
*.key
*.pem
```

### 2.3 Verificación de Conectividad

```python
#!/usr/bin/env python3
"""
Verificación de conectividad con ANKASecure
"""

import os
from dotenv import load_dotenv
import requests

# Cargar variables de entorno
load_dotenv()

API_URL = os.getenv('ANKASECURE_API_URL')
API_KEY = os.getenv('ANKASECURE_API_KEY')

def test_connection():
    """
    Prueba la conexión con ANKASecure API
    """
    print("\n" + "=" * 70)
    print("VERIFICANDO CONEXIÓN CON ANKASECURE")
    print("=" * 70)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(
            f"{API_URL}/health",
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ Conexión exitosa")
            print(f"  Estado: {data.get('status')}")
            print(f"  Versión: {data.get('version')}")
            print(f"  Región: {data.get('region')}")
            return True
        else:
            print(f"\n✗ Error: {response.status_code}")
            print(f"  {response.text}")
            return False

    except Exception as e:
        print(f"\n✗ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    test_connection()
```

**Ejecutar:**
```bash
python3 test_connection.py
```

---

## Parte 3: Gestión de Claves con ANKASecure

### 3.1 Generación de Claves

```python
#!/usr/bin/env python3
"""
Generación de claves con ANKASecure KMS
"""

import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

API_URL = os.getenv('ANKASECURE_API_URL')
API_KEY = os.getenv('ANKASECURE_API_KEY')
PROJECT_ID = os.getenv('ANKASECURE_PROJECT_ID')

class ANKASecureKMS:
    def __init__(self):
        self.api_url = API_URL
        self.headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

    def create_key(self, key_type="AES-256-GCM", purpose="ENCRYPT_DECRYPT", algorithm="AES_256"):
        """
        Crea una nueva clave en ANKASecure

        Tipos soportados:
        - SYMMETRIC: AES-128, AES-256, ChaCha20
        - ASYMMETRIC: RSA-2048, RSA-4096, Ed25519, X25519
        - PQC: ML-KEM-768, ML-DSA-65
        """
        print("\n" + "=" * 70)
        print(f"CREANDO CLAVE: {key_type}")
        print("=" * 70)

        payload = {
            "project_id": PROJECT_ID,
            "key_type": key_type,
            "purpose": purpose,
            "algorithm": algorithm,
            "rotation_period_days": 90,  # Rotación automática cada 90 días
            "tags": {
                "environment": "development",
                "created_by": "lab_03_ankasecure"
            }
        }

        try:
            response = requests.post(
                f"{self.api_url}/kms/keys",
                headers=self.headers,
                json=payload,
                timeout=10
            )

            if response.status_code == 201:
                data = response.json()
                key_id = data.get('key_id')
                print(f"\n✓ Clave creada exitosamente")
                print(f"  Key ID: {key_id}")
                print(f"  Tipo: {data.get('key_type')}")
                print(f"  Estado: {data.get('state')}")
                print(f"  Versión: {data.get('version')}")
                print(f"  Creada: {data.get('created_at')}")
                return key_id
            else:
                print(f"\n✗ Error: {response.status_code}")
                print(f"  {response.text}")
                return None

        except Exception as e:
            print(f"\n✗ Error: {e}")
            return None

    def list_keys(self):
        """
        Lista todas las claves del proyecto
        """
        print("\n" + "=" * 70)
        print("LISTANDO CLAVES")
        print("=" * 70)

        try:
            response = requests.get(
                f"{self.api_url}/kms/keys?project_id={PROJECT_ID}",
                headers=self.headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                keys = data.get('keys', [])

                print(f"\n✓ {len(keys)} claves encontradas\n")
                print(f"{'ID':<40} | {'Tipo':<20} | {'Estado':<10} | {'Versión':<8}")
                print("-" * 90)

                for key in keys:
                    print(f"{key['key_id']:<40} | {key['key_type']:<20} | {key['state']:<10} | {key['version']:<8}")

                return keys
            else:
                print(f"\n✗ Error: {response.status_code}")
                return []

        except Exception as e:
            print(f"\n✗ Error: {e}")
            return []

    def rotate_key(self, key_id):
        """
        Rota una clave (crea nueva versión)
        """
        print("\n" + "=" * 70)
        print(f"ROTANDO CLAVE: {key_id}")
        print("=" * 70)

        try:
            response = requests.post(
                f"{self.api_url}/kms/keys/{key_id}/rotate",
                headers=self.headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                print(f"\n✓ Clave rotada exitosamente")
                print(f"  Nueva versión: {data.get('version')}")
                print(f"  Estado anterior: DEPRECATED")
                return data
            else:
                print(f"\n✗ Error: {response.status_code}")
                return None

        except Exception as e:
            print(f"\n✗ Error: {e}")
            return None

# Demostración
if __name__ == "__main__":
    kms = ANKASecureKMS()

    # Crear varias claves
    aes_key_id = kms.create_key("SYMMETRIC", "ENCRYPT_DECRYPT", "AES_256")
    rsa_key_id = kms.create_key("ASYMMETRIC", "SIGN_VERIFY", "RSA_4096")
    mlkem_key_id = kms.create_key("PQC", "ENCRYPT_DECRYPT", "ML_KEM_768")

    # Listar claves
    kms.list_keys()

    # Rotar clave AES
    if aes_key_id:
        kms.rotate_key(aes_key_id)
```

**Ejecutar:**
```bash
python3 key_management.py
```

---

## Parte 4: Cifrado y Descifrado con ANKASecure

### 4.1 Operaciones Criptográficas

```python
#!/usr/bin/env python3
"""
Cifrado y descifrado usando claves de ANKASecure
"""

import os
from dotenv import load_dotenv
import requests
import json
from base64 import b64encode, b64decode

load_dotenv()

API_URL = os.getenv('ANKASECURE_API_URL')
API_KEY = os.getenv('ANKASECURE_API_KEY')

class ANKASecureCrypto:
    def __init__(self, key_id):
        self.api_url = API_URL
        self.key_id = key_id
        self.headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

    def encrypt(self, plaintext, context=None):
        """
        Cifra datos usando una clave de ANKASecure

        context: Metadata adicional (AAD - Additional Authenticated Data)
        """
        print("\n" + "=" * 70)
        print("CIFRANDO DATOS")
        print("=" * 70)

        # Codificar plaintext a base64
        plaintext_b64 = b64encode(plaintext.encode('utf-8')).decode('utf-8')

        payload = {
            "key_id": self.key_id,
            "plaintext": plaintext_b64,
            "context": context or {}
        }

        try:
            response = requests.post(
                f"{self.api_url}/crypto/encrypt",
                headers=self.headers,
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                ciphertext = data.get('ciphertext')
                key_version = data.get('key_version')

                print(f"\n✓ Datos cifrados exitosamente")
                print(f"  Key ID: {self.key_id}")
                print(f"  Key Version: {key_version}")
                print(f"  Ciphertext (primeros 64 chars): {ciphertext[:64]}...")
                print(f"  Tamaño: {len(ciphertext)} caracteres")

                return {
                    "ciphertext": ciphertext,
                    "key_id": self.key_id,
                    "key_version": key_version,
                    "context": context
                }
            else:
                print(f"\n✗ Error: {response.status_code}")
                print(f"  {response.text}")
                return None

        except Exception as e:
            print(f"\n✗ Error: {e}")
            return None

    def decrypt(self, ciphertext, context=None):
        """
        Descifra datos usando ANKASecure
        """
        print("\n" + "=" * 70)
        print("DESCIFRANDO DATOS")
        print("=" * 70)

        payload = {
            "key_id": self.key_id,
            "ciphertext": ciphertext,
            "context": context or {}
        }

        try:
            response = requests.post(
                f"{self.api_url}/crypto/decrypt",
                headers=self.headers,
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                plaintext_b64 = data.get('plaintext')
                key_version = data.get('key_version')

                # Decodificar de base64
                plaintext = b64decode(plaintext_b64).decode('utf-8')

                print(f"\n✓ Datos descifrados exitosamente")
                print(f"  Key Version utilizada: {key_version}")
                print(f"  Plaintext: \"{plaintext}\"")

                return plaintext
            else:
                print(f"\n✗ Error: {response.status_code}")
                print(f"  {response.text}")
                return None

        except Exception as e:
            print(f"\n✗ Error: {e}")
            return None

# Demostración
if __name__ == "__main__":
    # Usar clave creada anteriormente (reemplazar con tu key_id real)
    key_id = "ank_key_01234567890abcdef"  # Ejemplo

    crypto = ANKASecureCrypto(key_id)

    # Datos sensibles a cifrar
    sensitive_data = "SSN: 123-45-6789 | Credit Card: 4111-1111-1111-1111"

    # Contexto de auditoría
    context = {
        "user_id": "user_12345",
        "action": "payment_processing",
        "ip_address": "192.168.1.100"
    }

    # Cifrar
    encrypted_data = crypto.encrypt(sensitive_data, context)

    if encrypted_data:
        # Guardar ciphertext (en DB, archivo, etc.)
        with open("encrypted_data.json", 'w') as f:
            json.dump(encrypted_data, f, indent=2)

        print(f"\n✓ Datos cifrados guardados en encrypted_data.json")

        # Descifrar
        plaintext = crypto.decrypt(
            encrypted_data["ciphertext"],
            encrypted_data["context"]
        )

        # Verificación
        print("\n" + "=" * 70)
        print("VERIFICACIÓN")
        print("=" * 70)

        if plaintext == sensitive_data:
            print("\n✓✓ ¡CIFRADO/DESCIFRADO EXITOSO! ✓✓")
            print(f"  Original: \"{sensitive_data}\"")
            print(f"  Descifrado: \"{plaintext}\"")
        else:
            print("\n✗ ERROR: Los datos no coinciden")
```

**Ejecutar:**
```bash
python3 crypto_operations.py
```

---

## Parte 5: Integración en Aplicación Real

### 5.1 API de Usuario con Cifrado de PII

```python
#!/usr/bin/env python3
"""
API REST que usa ANKASecure para proteger información personal (PII)
"""

from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import requests
from base64 import b64encode, b64decode
import uuid

load_dotenv()

app = Flask(__name__)

API_URL = os.getenv('ANKASECURE_API_URL')
API_KEY = os.getenv('ANKASECURE_API_KEY')
ENCRYPTION_KEY_ID = os.getenv('ANKASECURE_ENCRYPTION_KEY_ID')

class ANKACryptoClient:
    """Cliente simplificado para operaciones criptográficas"""

    @staticmethod
    def encrypt(plaintext, key_id=ENCRYPTION_KEY_ID):
        """Cifra datos usando ANKASecure"""
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "key_id": key_id,
            "plaintext": b64encode(plaintext.encode('utf-8')).decode('utf-8')
        }

        response = requests.post(
            f"{API_URL}/crypto/encrypt",
            headers=headers,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            return response.json()["ciphertext"]
        else:
            raise Exception(f"Encryption failed: {response.text}")

    @staticmethod
    def decrypt(ciphertext, key_id=ENCRYPTION_KEY_ID):
        """Descifra datos usando ANKASecure"""
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "key_id": key_id,
            "ciphertext": ciphertext
        }

        response = requests.post(
            f"{API_URL}/crypto/decrypt",
            headers=headers,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            plaintext_b64 = response.json()["plaintext"]
            return b64decode(plaintext_b64).decode('utf-8')
        else:
            raise Exception(f"Decryption failed: {response.text}")

# Simulación de base de datos
users_db = {}

@app.route('/api/users', methods=['POST'])
def create_user():
    """
    Crea un nuevo usuario con datos sensibles cifrados
    """
    try:
        data = request.json

        # Datos sensibles que deben cifrarse
        ssn = data.get('ssn')
        credit_card = data.get('credit_card')
        address = data.get('address')

        # Datos no sensibles (pueden almacenarse en texto plano)
        name = data.get('name')
        email = data.get('email')

        # Cifrar PII usando ANKASecure
        encrypted_ssn = ANKACryptoClient.encrypt(ssn)
        encrypted_cc = ANKACryptoClient.encrypt(credit_card)
        encrypted_address = ANKACryptoClient.encrypt(address)

        # Generar ID de usuario
        user_id = str(uuid.uuid4())

        # Almacenar en "DB" (simulado)
        users_db[user_id] = {
            "user_id": user_id,
            "name": name,  # Plain text
            "email": email,  # Plain text
            "ssn_encrypted": encrypted_ssn,  # Cifrado
            "credit_card_encrypted": encrypted_cc,  # Cifrado
            "address_encrypted": encrypted_address  # Cifrado
        }

        return jsonify({
            "status": "success",
            "user_id": user_id,
            "message": "Usuario creado con PII cifrado usando ANKASecure"
        }), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """
    Obtiene datos de usuario (descifrando PII)
    """
    try:
        if user_id not in users_db:
            return jsonify({"status": "error", "message": "Usuario no encontrado"}), 404

        user_data = users_db[user_id]

        # Descifrar PII usando ANKASecure
        ssn = ANKACryptoClient.decrypt(user_data["ssn_encrypted"])
        credit_card = ANKACryptoClient.decrypt(user_data["credit_card_encrypted"])
        address = ANKACryptoClient.decrypt(user_data["address_encrypted"])

        # Retornar datos descifrados (solo a usuarios autorizados en producción)
        return jsonify({
            "user_id": user_data["user_id"],
            "name": user_data["name"],
            "email": user_data["email"],
            "ssn": ssn,  # Descifrado
            "credit_card": credit_card,  # Descifrado
            "address": address  # Descifrado
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "healthy", "service": "User API with ANKASecure"}), 200

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("INICIANDO API CON CIFRADO ANKASECURE")
    print("=" * 70)
    print("\nEndpoints disponibles:")
    print("  POST /api/users - Crear usuario (cifra PII)")
    print("  GET /api/users/<id> - Obtener usuario (descifra PII)")
    print("  GET /api/health - Health check")
    print("\n" + "=" * 70 + "\n")

    app.run(debug=True, port=5000)
```

**Ejecutar:**
```bash
python3 user_api.py
```

**Probar la API:**
```bash
# Crear usuario
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "ssn": "123-45-6789",
    "credit_card": "4111-1111-1111-1111",
    "address": "123 Main St, Springfield"
  }'

# Obtener usuario (respuesta incluye datos descifrados)
curl http://localhost:5000/api/users/<user_id_retornado>
```

---

## Parte 6: Auditoría y Políticas de Acceso

### 6.1 Consultar Logs de Auditoría

```python
#!/usr/bin/env python3
"""
Consulta de logs de auditoría en ANKASecure
"""

import os
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta

load_dotenv()

API_URL = os.getenv('ANKASECURE_API_URL')
API_KEY = os.getenv('ANKASECURE_API_KEY')
PROJECT_ID = os.getenv('ANKASECURE_PROJECT_ID')

def get_audit_logs(hours=24):
    """
    Obtiene logs de auditoría de las últimas N horas
    """
    print("\n" + "=" * 70)
    print(f"CONSULTANDO LOGS DE AUDITORÍA (últimas {hours} horas)")
    print("=" * 70)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # Calcular rango de tiempo
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)

    params = {
        "project_id": PROJECT_ID,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }

    try:
        response = requests.get(
            f"{API_URL}/audit/logs",
            headers=headers,
            params=params,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])

            print(f"\n✓ {len(logs)} eventos encontrados\n")
            print(f"{'Timestamp':<20} | {'Acción':<25} | {'Usuario':<20} | {'Key ID':<30} | {'Resultado':<10}")
            print("-" * 120)

            for log in logs:
                timestamp = log.get('timestamp', '')[:19]
                action = log.get('action', '')
                user = log.get('user_id', 'N/A')
                key_id = log.get('key_id', 'N/A')[:28]
                result = log.get('result', '')

                print(f"{timestamp:<20} | {action:<25} | {user:<20} | {key_id:<30} | {result:<10}")

            return logs
        else:
            print(f"\n✗ Error: {response.status_code}")
            return []

    except Exception as e:
        print(f"\n✗ Error: {e}")
        return []

if __name__ == "__main__":
    logs = get_audit_logs(hours=24)

    print("\n" + "=" * 70)
    print("ANÁLISIS DE SEGURIDAD")
    print("=" * 70)

    if logs:
        total_encrypt = sum(1 for log in logs if log.get('action') == 'ENCRYPT')
        total_decrypt = sum(1 for log in logs if log.get('action') == 'DECRYPT')
        total_key_create = sum(1 for log in logs if log.get('action') == 'CREATE_KEY')
        failed_ops = sum(1 for log in logs if log.get('result') == 'FAILED')

        print(f"\nEstadísticas:")
        print(f"  Total de operaciones: {len(logs)}")
        print(f"  Cifraciones: {total_encrypt}")
        print(f"  Descifraciones: {total_decrypt}")
        print(f"  Claves creadas: {total_key_create}")
        print(f"  Operaciones fallidas: {failed_ops}")

        if failed_ops > 0:
            print(f"\n⚠️  ALERTA: {failed_ops} operaciones fallidas detectadas")
    else:
        print("\nNo hay eventos en el período seleccionado")

    print("=" * 70)
```

**Ejecutar:**
```bash
python3 audit_logs.py
```

---

## Evidencias de Aprendizaje

### Archivos a Entregar

1. **Screenshots** de claves creadas en ANKASecure
2. **Logs de auditoría** mostrando operaciones criptográficas
3. **Código fuente** de la API de usuarios con PII cifrado
4. **Resultados de pruebas** de cifrado/descifrado
5. **Diagrama de arquitectura** de integración con ANKASecure

### Preguntas de Reflexión

1. **¿Cuáles son las ventajas de usar un KMS centralizado vs gestión local de claves?**

2. **¿Qué pasa si ANKASecure está offline? ¿Cómo manejarías la disponibilidad?**

3. **¿Es seguro enviar plaintext a ANKASecure para cifrado? ¿Qué alternativas existen?**

4. **¿Cómo implementarías rotación de claves sin downtime en producción?**

5. **¿Qué datos deberías cifrar con ANKASecure y cuáles no? Justifica tu respuesta.**

---

## Recursos Adicionales

- **NIST SP 800-57**: Recommendation for Key Management
- **AWS KMS Best Practices**: Similar architecture
- **Google Cloud KMS**: Comparación de features
- **HashiCorp Vault**: Alternativa open-source

---

## Próximos Pasos

En el **Módulo 8**, implementarás un sistema completo de producción con ANKASecure, incluyendo:
- Despliegue en Docker/Kubernetes
- Alta disponibilidad y disaster recovery
- Migración de sistemas legacy
- Monitoreo y alertas

🚀 **La gestión centralizada de claves es fundamental para sistemas seguros y escalables!** 🔐
