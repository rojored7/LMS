# Laboratorio 03: Firmas Digitales Postcuánticas con ML-DSA

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Comprender** el algoritmo ML-DSA (Module-Lattice-Based Digital Signature Algorithm)
2. **Generar** pares de claves de firma ML-DSA
3. **Firmar** mensajes usando ML-DSA-65, ML-DSA-87
4. **Verificar** firmas digitales postcuánticas
5. **Comparar** ML-DSA con firmas clásicas (RSA, ECDSA, Ed25519)
6. **Implementar** un sistema de autenticación basado en ML-DSA

## Duración Estimada
**3-4 horas** (Teoría: 45 min | Implementación: 2h | Evaluación: 45 min)

---

## Parte 1: Introducción a ML-DSA

### 1.1 ¿Qué es ML-DSA?

**ML-DSA** (antes conocido como CRYSTALS-Dilithium) es uno de los tres algoritmos de firma digital estandarizados por NIST en 2024 como parte del proyecto de criptografía postcuántica.

**Características clave:**
- Basado en **lattices** (retículos/rejillas)
- Problema matemático: **Module-LWE** y **Module-SIS**
- Tres niveles de seguridad: ML-DSA-44, ML-DSA-65, ML-DSA-87
- Tamaños de firma relativamente pequeños (~2-4 KB)
- Velocidad de verificación muy rápida

### 1.2 Parámetros de ML-DSA

| Parámetro | ML-DSA-44 | ML-DSA-65 | ML-DSA-87 |
|-----------|-----------|-----------|-----------|
| **Seguridad (NIST)** | Nivel 2 | Nivel 3 | Nivel 5 |
| **Equivalente Clásico** | AES-128 | AES-192 | AES-256 |
| **Tamaño Clave Pública** | 1,312 bytes | 1,952 bytes | 2,592 bytes |
| **Tamaño Clave Privada** | 2,528 bytes | 4,000 bytes | 4,864 bytes |
| **Tamaño Firma** | 2,420 bytes | 3,293 bytes | 4,595 bytes |
| **Velocidad Firma** | Rápida | Media | Más lenta |
| **Velocidad Verificación** | Muy rápida | Muy rápida | Muy rápida |

**Recomendación**: ML-DSA-65 para la mayoría de aplicaciones (equilibrio seguridad/performance)

---

## Parte 2: Instalación y Setup

### 2.1 Instalar liboqs (Open Quantum Safe)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y cmake ninja-build libssl-dev

# Clonar liboqs
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build

# Compilar con soporte para ML-DSA
cmake -GNinja -DCMAKE_INSTALL_PREFIX=/usr/local ..
ninja
sudo ninja install
```

### 2.2 Instalar liboqs-python

```bash
# Crear entorno virtual
python3 -m venv venv_pqc
source venv_pqc/bin/activate  # En Windows: venv_pqc\Scripts\activate

# Instalar liboqs-python
pip install liboqs-python

# Verificar instalación
python -c "import oqs; print(oqs.get_enabled_sig_mechanisms())"
```

**Salida esperada:**
```
['Dilithium2', 'Dilithium3', 'Dilithium5', 'Falcon-512', 'Falcon-1024', 'SPHINCS+-SHA2-128f-simple', ...]
```

---

## Parte 3: Generación de Claves ML-DSA

### 3.1 Script Básico de Generación

```python
#!/usr/bin/env python3
"""
Generación de pares de claves ML-DSA
"""

import oqs
import os
import json
from base64 import b64encode, b64decode

def generate_mldsa_keypair(algorithm="Dilithium3"):
    """
    Genera un par de claves ML-DSA

    Algoritmos disponibles:
    - Dilithium2 (ML-DSA-44)
    - Dilithium3 (ML-DSA-65)  ← Recomendado
    - Dilithium5 (ML-DSA-87)
    """
    print(f"\n{'=' * 60}")
    print(f"Generando par de claves {algorithm}")
    print(f"{'=' * 60}")

    # Crear instancia del algoritmo de firma
    with oqs.Signature(algorithm) as signer:
        # Generar clave pública y privada
        public_key = signer.generate_keypair()
        secret_key = signer.export_secret_key()

        # Información de las claves
        print(f"\n✓ Claves generadas exitosamente")
        print(f"\nClave Pública:")
        print(f"  - Tamaño: {len(public_key)} bytes")
        print(f"  - Primeros 32 bytes (hex): {public_key[:32].hex()}")

        print(f"\nClave Privada:")
        print(f"  - Tamaño: {len(secret_key)} bytes")
        print(f"  - Hash SHA-256: {hash(secret_key)}")

        return {
            "algorithm": algorithm,
            "public_key": b64encode(public_key).decode('utf-8'),
            "secret_key": b64encode(secret_key).decode('utf-8')
        }

def save_keypair(keypair, filename_prefix="mldsa_key"):
    """
    Guarda el par de claves en archivos
    """
    # Guardar clave pública
    public_key_file = f"{filename_prefix}.pub"
    with open(public_key_file, 'w') as f:
        json.dump({
            "algorithm": keypair["algorithm"],
            "public_key": keypair["public_key"]
        }, f, indent=2)

    # Guardar clave privada (con permisos restrictivos)
    secret_key_file = f"{filename_prefix}.key"
    with open(secret_key_file, 'w') as f:
        json.dump({
            "algorithm": keypair["algorithm"],
            "secret_key": keypair["secret_key"]
        }, f, indent=2)

    # Cambiar permisos (solo lectura para el propietario)
    os.chmod(secret_key_file, 0o400)

    print(f"\n✓ Claves guardadas:")
    print(f"  - Pública: {public_key_file}")
    print(f"  - Privada: {secret_key_file} (permisos: 400)")

# Generar claves para los tres niveles de seguridad
if __name__ == "__main__":
    algorithms = ["Dilithium2", "Dilithium3", "Dilithium5"]

    for algo in algorithms:
        keypair = generate_mldsa_keypair(algo)
        save_keypair(keypair, f"mldsa_{algo.lower()}")
        print("\n" + "=" * 60 + "\n")
```

**Ejecutar:**
```bash
python3 generate_mldsa_keys.py
```

---

## Parte 4: Firmar y Verificar Mensajes

### 4.1 Sistema de Firma Digital

```python
#!/usr/bin/env python3
"""
Sistema de firma y verificación con ML-DSA
"""

import oqs
import json
from base64 import b64encode, b64decode
from datetime import datetime

def sign_message(message, secret_key_file, algorithm="Dilithium3"):
    """
    Firma un mensaje usando ML-DSA
    """
    print(f"\n{'=' * 60}")
    print(f"FIRMANDO MENSAJE CON {algorithm}")
    print(f"{'=' * 60}")

    # Cargar clave privada
    with open(secret_key_file, 'r') as f:
        key_data = json.load(f)
        secret_key = b64decode(key_data["secret_key"])

    # Convertir mensaje a bytes
    message_bytes = message.encode('utf-8')

    # Firmar
    with oqs.Signature(algorithm, secret_key) as signer:
        signature = signer.sign(message_bytes)

    print(f"\n✓ Mensaje firmado exitosamente")
    print(f"\nMensaje original:")
    print(f"  {message}")
    print(f"\nFirma:")
    print(f"  - Tamaño: {len(signature)} bytes")
    print(f"  - Primeros 64 bytes (hex): {signature[:64].hex()}")

    # Crear objeto de firma
    signed_data = {
        "algorithm": algorithm,
        "message": message,
        "signature": b64encode(signature).decode('utf-8'),
        "timestamp": datetime.now().isoformat()
    }

    return signed_data

def verify_signature(signed_data, public_key_file):
    """
    Verifica una firma ML-DSA
    """
    algorithm = signed_data["algorithm"]

    print(f"\n{'=' * 60}")
    print(f"VERIFICANDO FIRMA CON {algorithm}")
    print(f"{'=' * 60}")

    # Cargar clave pública
    with open(public_key_file, 'r') as f:
        key_data = json.load(f)
        public_key = b64decode(key_data["public_key"])

    # Extraer mensaje y firma
    message_bytes = signed_data["message"].encode('utf-8')
    signature = b64decode(signed_data["signature"])

    # Verificar
    with oqs.Signature(algorithm) as verifier:
        is_valid = verifier.verify(message_bytes, signature, public_key)

    if is_valid:
        print(f"\n✓ FIRMA VÁLIDA ✓")
        print(f"  Mensaje: {signed_data['message']}")
        print(f"  Timestamp: {signed_data['timestamp']}")
        return True
    else:
        print(f"\n✗ FIRMA INVÁLIDA ✗")
        print(f"  ¡ADVERTENCIA! El mensaje ha sido alterado o la firma es incorrecta")
        return False

# Ejemplo de uso
if __name__ == "__main__":
    # Mensaje a firmar
    message = "Este es un contrato digital que NO puede ser repudiado. Firmado el 2026-02-22."

    # Firmar con ML-DSA-65
    signed_data = sign_message(
        message,
        secret_key_file="mldsa_dilithium3.key",
        algorithm="Dilithium3"
    )

    # Guardar firma
    with open("mensaje_firmado.json", 'w') as f:
        json.dump(signed_data, f, indent=2)

    print(f"\n✓ Firma guardada en mensaje_firmado.json")

    # Verificar firma
    verify_signature(signed_data, public_key_file="mldsa_dilithium3.pub")

    # Intentar con mensaje alterado
    print(f"\n{'=' * 60}")
    print("PRUEBA: Verificación con mensaje alterado")
    print(f"{'=' * 60}")

    signed_data_modified = signed_data.copy()
    signed_data_modified["message"] = "Mensaje ALTERADO maliciosamente"

    verify_signature(signed_data_modified, public_key_file="mldsa_dilithium3.pub")
```

**Ejecutar:**
```bash
python3 sign_and_verify.py
```

---

## Parte 5: Benchmark - Comparación con Firmas Clásicas

### 5.1 Script de Comparación de Performance

```python
#!/usr/bin/env python3
"""
Benchmark: ML-DSA vs RSA vs ECDSA vs Ed25519
"""

import oqs
import time
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

def benchmark_mldsa(algorithm, iterations=100):
    """
    Benchmark de ML-DSA
    """
    message = b"Mensaje de prueba para benchmark de firmas digitales"

    # Generar claves
    start = time.time()
    with oqs.Signature(algorithm) as signer:
        public_key = signer.generate_keypair()
        secret_key = signer.export_secret_key()
    keygen_time = (time.time() - start) * 1000  # ms

    # Benchmark de firma
    with oqs.Signature(algorithm, secret_key) as signer:
        start = time.time()
        for _ in range(iterations):
            signature = signer.sign(message)
        sign_time = ((time.time() - start) / iterations) * 1000  # ms

    # Benchmark de verificación
    with oqs.Signature(algorithm) as verifier:
        start = time.time()
        for _ in range(iterations):
            verifier.verify(message, signature, public_key)
        verify_time = ((time.time() - start) / iterations) * 1000  # ms

    return {
        "algorithm": algorithm,
        "keygen_ms": keygen_time,
        "sign_ms": sign_time,
        "verify_ms": verify_time,
        "pubkey_size": len(public_key),
        "signature_size": len(signature)
    }

def benchmark_rsa(key_size=2048, iterations=100):
    """
    Benchmark de RSA
    """
    message = b"Mensaje de prueba para benchmark de firmas digitales"

    # Generar claves
    start = time.time()
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    keygen_time = (time.time() - start) * 1000

    # Benchmark de firma
    start = time.time()
    for _ in range(iterations):
        signature = private_key.sign(
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
    sign_time = ((time.time() - start) / iterations) * 1000

    # Benchmark de verificación
    start = time.time()
    for _ in range(iterations):
        public_key.verify(
            signature,
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
    verify_time = ((time.time() - start) / iterations) * 1000

    return {
        "algorithm": f"RSA-{key_size}",
        "keygen_ms": keygen_time,
        "sign_ms": sign_time,
        "verify_ms": verify_time,
        "pubkey_size": len(public_key.public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )),
        "signature_size": len(signature)
    }

def benchmark_ecdsa(curve_name="P-256", iterations=100):
    """
    Benchmark de ECDSA
    """
    message = b"Mensaje de prueba para benchmark de firmas digitales"

    curve = ec.SECP256R1() if curve_name == "P-256" else ec.SECP384R1()

    # Generar claves
    start = time.time()
    private_key = ec.generate_private_key(curve, default_backend())
    public_key = private_key.public_key()
    keygen_time = (time.time() - start) * 1000

    # Benchmark de firma
    start = time.time()
    for _ in range(iterations):
        signature = private_key.sign(message, ec.ECDSA(hashes.SHA256()))
    sign_time = ((time.time() - start) / iterations) * 1000

    # Benchmark de verificación
    start = time.time()
    for _ in range(iterations):
        public_key.verify(signature, message, ec.ECDSA(hashes.SHA256()))
    verify_time = ((time.time() - start) / iterations) * 1000

    return {
        "algorithm": f"ECDSA-{curve_name}",
        "keygen_ms": keygen_time,
        "sign_ms": sign_time,
        "verify_ms": verify_time,
        "pubkey_size": 91 if curve_name == "P-256" else 120,  # Aproximado
        "signature_size": len(signature)
    }

def benchmark_ed25519(iterations=100):
    """
    Benchmark de Ed25519
    """
    message = b"Mensaje de prueba para benchmark de firmas digitales"

    # Generar claves
    start = time.time()
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    keygen_time = (time.time() - start) * 1000

    # Benchmark de firma
    start = time.time()
    for _ in range(iterations):
        signature = private_key.sign(message)
    sign_time = ((time.time() - start) / iterations) * 1000

    # Benchmark de verificación
    start = time.time()
    for _ in range(iterations):
        public_key.verify(signature, message)
    verify_time = ((time.time() - start) / iterations) * 1000

    return {
        "algorithm": "Ed25519",
        "keygen_ms": keygen_time,
        "sign_ms": sign_time,
        "verify_ms": verify_time,
        "pubkey_size": 32,
        "signature_size": 64
    }

# Ejecutar benchmarks
if __name__ == "__main__":
    print("\n" + "=" * 100)
    print("BENCHMARK: COMPARACIÓN DE ALGORITMOS DE FIRMA DIGITAL")
    print("=" * 100)
    print(f"Iteraciones: 100 por algoritmo\n")

    algorithms_to_test = [
        ("ML-DSA-44", lambda: benchmark_mldsa("Dilithium2")),
        ("ML-DSA-65", lambda: benchmark_mldsa("Dilithium3")),
        ("ML-DSA-87", lambda: benchmark_mldsa("Dilithium5")),
        ("RSA-2048", lambda: benchmark_rsa(2048)),
        ("RSA-4096", lambda: benchmark_rsa(4096)),
        ("ECDSA-P256", lambda: benchmark_ecdsa("P-256")),
        ("Ed25519", lambda: benchmark_ed25519())
    ]

    results = []
    for name, bench_func in algorithms_to_test:
        print(f"Ejecutando: {name}...", end=" ")
        result = bench_func()
        results.append(result)
        print("✓")

    # Tabla de resultados
    print("\n" + "=" * 100)
    print(f"{'Algoritmo':<15} | {'KeyGen (ms)':<12} | {'Firma (ms)':<12} | {'Verificar (ms)':<15} | {'PubKey (B)':<12} | {'Firma (B)':<12}")
    print("=" * 100)

    for r in results:
        print(f"{r['algorithm']:<15} | {r['keygen_ms']:<12.2f} | {r['sign_ms']:<12.4f} | {r['verify_ms']:<15.4f} | {r['pubkey_size']:<12} | {r['signature_size']:<12}")

    print("=" * 100)
    print("\nCONCLUSIONES:")
    print("1. Ed25519 es el MÁS RÁPIDO (pero vulnerable a Shor)")
    print("2. ML-DSA-65 tiene BUEN equilibrio (seguro cuánticamente)")
    print("3. RSA es LENTO en firma (no recomendado para alta frecuencia)")
    print("4. ML-DSA tiene firmas MÁS GRANDES (~3-4 KB vs 64-256 bytes)")
    print("=" * 100)
```

**Ejecutar:**
```bash
python3 benchmark_signatures.py
```

---

## Parte 6: Caso Práctico - Sistema de Autenticación

### 6.1 API de Autenticación con ML-DSA

```python
#!/usr/bin/env python3
"""
Sistema de autenticación basado en ML-DSA
Similar a JWT pero con firmas postcuánticas
"""

import oqs
import json
import base64
from datetime import datetime, timedelta

class MLDSAAuthenticator:
    def __init__(self, algorithm="Dilithium3"):
        self.algorithm = algorithm
        self.signer = None
        self.public_key = None
        self.secret_key = None

    def generate_keypair(self):
        """Genera par de claves para el servidor"""
        with oqs.Signature(self.algorithm) as signer:
            self.public_key = signer.generate_keypair()
            self.secret_key = signer.export_secret_key()

        print(f"✓ Par de claves generado para autenticación")
        return self.public_key

    def create_auth_token(self, user_id, permissions, expiration_minutes=60):
        """
        Crea un token de autenticación firmado

        Similar a JWT pero con ML-DSA en lugar de RS256/ES256
        """
        # Crear payload
        payload = {
            "user_id": user_id,
            "permissions": permissions,
            "issued_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(minutes=expiration_minutes)).isoformat()
        }

        # Serializar payload
        payload_json = json.dumps(payload, sort_keys=True)
        payload_bytes = payload_json.encode('utf-8')

        # Firmar
        with oqs.Signature(self.algorithm, self.secret_key) as signer:
            signature = signer.sign(payload_bytes)

        # Crear token (payload + signature)
        token = {
            "payload": base64.b64encode(payload_bytes).decode('utf-8'),
            "signature": base64.b64encode(signature).decode('utf-8'),
            "algorithm": self.algorithm
        }

        return json.dumps(token)

    def verify_auth_token(self, token_string):
        """
        Verifica un token de autenticación
        """
        try:
            # Parsear token
            token = json.loads(token_string)

            # Extraer componentes
            payload_bytes = base64.b64decode(token["payload"])
            signature = base64.b64decode(token["signature"])

            # Verificar firma
            with oqs.Signature(token["algorithm"]) as verifier:
                is_valid = verifier.verify(payload_bytes, signature, self.public_key)

            if not is_valid:
                return {"valid": False, "error": "Firma inválida"}

            # Verificar expiración
            payload = json.loads(payload_bytes.decode('utf-8'))
            expires_at = datetime.fromisoformat(payload["expires_at"])

            if datetime.now() > expires_at:
                return {"valid": False, "error": "Token expirado"}

            return {"valid": True, "payload": payload}

        except Exception as e:
            return {"valid": False, "error": str(e)}

# Ejemplo de uso
if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("SISTEMA DE AUTENTICACIÓN CON ML-DSA")
    print("=" * 70)

    # Inicializar autenticador
    auth = MLDSAAuthenticator(algorithm="Dilithium3")
    auth.generate_keypair()

    # Crear token para un usuario
    print("\n1. CREANDO TOKEN DE AUTENTICACIÓN")
    print("-" * 70)

    token = auth.create_auth_token(
        user_id="user12345",
        permissions=["read", "write", "admin"],
        expiration_minutes=60
    )

    print(f"✓ Token creado (tamaño: {len(token)} bytes)")
    print(f"Primeros 100 caracteres: {token[:100]}...")

    # Verificar token
    print("\n2. VERIFICANDO TOKEN")
    print("-" * 70)

    result = auth.verify_auth_token(token)

    if result["valid"]:
        print("✓ TOKEN VÁLIDO")
        print(f"  User ID: {result['payload']['user_id']}")
        print(f"  Permisos: {', '.join(result['payload']['permissions'])}")
        print(f"  Expira: {result['payload']['expires_at']}")
    else:
        print(f"✗ TOKEN INVÁLIDO: {result['error']}")

    # Intentar con token modificado
    print("\n3. PRUEBA: TOKEN MODIFICADO")
    print("-" * 70)

    tampered_token = token.replace("user12345", "user99999")
    result = auth.verify_auth_token(tampered_token)

    print(f"✗ Verificación falló (esperado): {result['error']}")

    print("\n" + "=" * 70)
```

---

## Evidencias de Aprendizaje

### Archivos a Entregar

1. **Claves generadas** (mldsa_dilithium*.pub y *.key)
2. **Mensaje firmado** (mensaje_firmado.json)
3. **Resultados de benchmark** (captura de pantalla)
4. **Token de autenticación** (ejemplo funcional)

### Preguntas de Reflexión

1. **¿Cuál es la principal diferencia entre ML-DSA y RSA en términos de seguridad cuántica?**

2. **¿Por qué ML-DSA tiene firmas más grandes que Ed25519? ¿Es esto un problema crítico?**

3. **¿En qué casos ML-DSA-44 es suficiente vs ML-DSA-87?**

4. **¿Cómo compararías el performance de ML-DSA con Ed25519? ¿Qué trade-offs existen?**

5. **¿Puede ML-DSA reemplazar completamente a RSA/ECDSA en aplicaciones actuales? ¿Qué desafíos existen?**

---

## Recursos Adicionales

- **NIST FIPS 204**: ML-DSA Standard (Draft)
- **CRYSTALS-Dilithium**: https://pq-crystals.org/dilithium/
- **liboqs Documentation**: https://openquantumsafe.org/
- **Paper Original**: "CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme"

---

## Próximos Pasos

En el **Lab 04**, implementarás sistemas híbridos que combinan ML-DSA con Ed25519 para obtener "defense in depth" contra amenazas clásicas Y cuánticas. 🚀🔐
