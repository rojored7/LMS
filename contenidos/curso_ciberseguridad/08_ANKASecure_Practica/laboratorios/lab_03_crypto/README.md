# Laboratorio 03: Operaciones Criptográficas Avanzadas con ANKASecure

## Objetivos

1. Implementar cifrado híbrido (AES + ML-KEM) con ANKASecure
2. Crear firmas digitales postcuánticas
3. Generar y verificar HMACs para integridad
4. Implementar derivación segura de claves (KDF)
5. Optimizar performance de operaciones criptográficas

## Duración: 3-4 horas

---

## Parte 1: Cifrado Híbrido con ANKASecure

```python
#!/usr/bin/env python3
"""
Cifrado híbrido usando ANKASecure Crypto Service
AES-256-GCM + ML-KEM-768 para máxima seguridad
"""

import requests
import os
from base64 import b64encode, b64decode
import json

class ANKACryptoService:
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def hybrid_encrypt(self, plaintext, recipient_public_key_id):
        """
        Cifrado híbrido:
        1. Genera clave simétrica (DEK - Data Encryption Key)
        2. Cifra datos con AES-256-GCM
        3. Envuelve DEK con ML-KEM (clave del destinatario)
        """
        print("\n" + "=" * 70)
        print("CIFRADO HÍBRIDO")
        print("=" * 70)

        # Paso 1: Generar DEK (Data Encryption Key)
        dek_response = requests.post(
            f"{self.api_url}/crypto/generate-dek",
            headers=self.headers,
            json={"algorithm": "AES-256-GCM"},
            timeout=10
        )

        if dek_response.status_code != 200:
            raise Exception(f"Error generando DEK: {dek_response.text}")

        dek = dek_response.json()["dek"]
        print(f"✓ DEK generada (AES-256)")

        # Paso 2: Cifrar datos con DEK
        encrypt_response = requests.post(
            f"{self.api_url}/crypto/encrypt",
            headers=self.headers,
            json={
                "algorithm": "AES-256-GCM",
                "plaintext": b64encode(plaintext.encode()).decode(),
                "key": dek
            },
            timeout=10
        )

        if encrypt_response.status_code != 200:
            raise Exception(f"Error cifrando: {encrypt_response.text}")

        ciphertext = encrypt_response.json()["ciphertext"]
        print(f"✓ Datos cifrados con AES-256-GCM")

        # Paso 3: Envolver DEK con ML-KEM
        wrap_response = requests.post(
            f"{self.api_url}/crypto/wrap-key",
            headers=self.headers,
            json={
                "key_to_wrap": dek,
                "wrapping_key_id": recipient_public_key_id,
                "algorithm": "ML-KEM-768"
            },
            timeout=10
        )

        if wrap_response.status_code != 200:
            raise Exception(f"Error envolviendo DEK: {wrap_response.text}")

        wrapped_dek = wrap_response.json()["wrapped_key"]
        print(f"✓ DEK envuelta con ML-KEM-768")

        return {
            "ciphertext": ciphertext,
            "wrapped_dek": wrapped_dek,
            "algorithm": "AES-256-GCM + ML-KEM-768"
        }

    def hybrid_decrypt(self, encrypted_data, recipient_private_key_id):
        """
        Descifrado híbrido:
        1. Desenvuelve DEK con ML-KEM
        2. Descifra datos con AES-256-GCM
        """
        print("\n" + "=" * 70)
        print("DESCIFRADO HÍBRIDO")
        print("=" * 70)

        # Paso 1: Desenvolver DEK
        unwrap_response = requests.post(
            f"{self.api_url}/crypto/unwrap-key",
            headers=self.headers,
            json={
                "wrapped_key": encrypted_data["wrapped_dek"],
                "unwrapping_key_id": recipient_private_key_id
            },
            timeout=10
        )

        if unwrap_response.status_code != 200:
            raise Exception(f"Error desenvolviendo DEK: {unwrap_response.text}")

        dek = unwrap_response.json()["unwrapped_key"]
        print(f"✓ DEK desenvuelta con ML-KEM-768")

        # Paso 2: Descifrar datos
        decrypt_response = requests.post(
            f"{self.api_url}/crypto/decrypt",
            headers=self.headers,
            json={
                "ciphertext": encrypted_data["ciphertext"],
                "key": dek
            },
            timeout=10
        )

        if decrypt_response.status_code != 200:
            raise Exception(f"Error descifrando: {decrypt_response.text}")

        plaintext_b64 = decrypt_response.json()["plaintext"]
        plaintext = b64decode(plaintext_b64).decode()
        print(f"✓ Datos descifrados con AES-256-GCM")

        return plaintext

# Demostración
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    API_URL = os.getenv('ANKASECURE_API_URL')
    API_KEY = os.getenv('ANKASECURE_API_KEY')
    RECIPIENT_KEY_ID = os.getenv('RECIPIENT_ML_KEM_KEY_ID')

    crypto = ANKACryptoService(API_URL, API_KEY)

    # Datos sensibles
    sensitive_data = "Código secreto de lanzamiento nuclear: Alpha-7-9-Charlie"

    # Cifrar
    encrypted = crypto.hybrid_encrypt(sensitive_data, RECIPIENT_KEY_ID)

    print(f"\n{'=' * 70}")
    print("RESULTADO DEL CIFRADO")
    print(f"{'=' * 70}")
    print(f"Ciphertext (primeros 64 chars): {encrypted['ciphertext'][:64]}...")
    print(f"Wrapped DEK (primeros 64 chars): {encrypted['wrapped_dek'][:64]}...")
    print(f"Algoritmo: {encrypted['algorithm']}")

    # Descifrar
    decrypted = crypto.hybrid_decrypt(encrypted, RECIPIENT_KEY_ID)

    print(f"\n{'=' * 70}")
    print("VERIFICACIÓN")
    print(f"{'=' * 70}")

    if sensitive_data == decrypted:
        print("\n✓✓ ¡CIFRADO/DESCIFRADO HÍBRIDO EXITOSO! ✓✓")
        print(f"  Original:   \"{sensitive_data}\"")
        print(f"  Descifrado: \"{decrypted}\"")
    else:
        print("\n✗ ERROR: Los datos no coinciden")
```

---

## Parte 2: Firmas Digitales Postcuánticas

```python
#!/usr/bin/env python3
"""
Firma y verificación de documentos con ML-DSA
"""

import requests
from base64 import b64encode, b64decode
import hashlib

class ANKASignatureService:
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def sign_document(self, document, signing_key_id):
        """
        Firma un documento con ML-DSA-65
        """
        print("\n" + "=" * 70)
        print("FIRMANDO DOCUMENTO")
        print("=" * 70)

        # Calcular hash del documento (mejor práctica)
        doc_hash = hashlib.sha256(document.encode()).digest()

        response = requests.post(
            f"{self.api_url}/crypto/sign",
            headers=self.headers,
            json={
                "message": b64encode(doc_hash).decode(),
                "key_id": signing_key_id,
                "algorithm": "ML-DSA-65"
            },
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f"Error firmando: {response.text}")

        signature = response.json()["signature"]

        print(f"✓ Documento firmado con ML-DSA-65")
        print(f"  Hash SHA-256: {doc_hash.hex()}")
        print(f"  Firma (tamaño): {len(b64decode(signature))} bytes")

        return {
            "document": document,
            "signature": signature,
            "hash": b64encode(doc_hash).decode(),
            "algorithm": "ML-DSA-65"
        }

    def verify_signature(self, signed_doc, verifying_key_id):
        """
        Verifica firma de documento
        """
        print("\n" + "=" * 70)
        print("VERIFICANDO FIRMA")
        print("=" * 70)

        # Recalcular hash del documento
        doc_hash = hashlib.sha256(signed_doc["document"].encode()).digest()

        response = requests.post(
            f"{self.api_url}/crypto/verify",
            headers=self.headers,
            json={
                "message": b64encode(doc_hash).decode(),
                "signature": signed_doc["signature"],
                "key_id": verifying_key_id
            },
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f"Error verificando: {response.text}")

        is_valid = response.json()["valid"]

        if is_valid:
            print(f"\n✓✓ FIRMA VÁLIDA ✓✓")
            print(f"  El documento NO ha sido alterado")
            print(f"  Firmante: Clave {verifying_key_id}")
        else:
            print(f"\n✗✗ FIRMA INVÁLIDA ✗✗")
            print(f"  ⚠️  ADVERTENCIA: Documento alterado o firma incorrecta")

        return is_valid

# Demo
if __name__ == "__main__":
    from dotenv import load_dotenv
    import os

    load_dotenv()

    signer = ANKASignatureService(
        os.getenv('ANKASECURE_API_URL'),
        os.getenv('ANKASECURE_API_KEY')
    )

    # Documento legal
    contract = """
    CONTRATO DE TRANSFERENCIA DE ACTIVOS

    Por medio del presente documento, la empresa ACME Corp transfiere
    la suma de $5,000,000 USD a XYZ Industries.

    Firmado digitalmente el 22 de febrero de 2026.
    """

    KEY_ID = os.getenv('SIGNING_KEY_ID')

    # Firmar
    signed = signer.sign_document(contract, KEY_ID)

    # Verificar
    signer.verify_signature(signed, KEY_ID)

    # Intentar con documento alterado
    print(f"\n{'=' * 70}")
    print("PRUEBA: DOCUMENTO ALTERADO")
    print(f"{'=' * 70}")

    signed_tampered = signed.copy()
    signed_tampered["document"] = contract.replace("$5,000,000", "$9,999,999")

    signer.verify_signature(signed_tampered, KEY_ID)
```

---

## Parte 3: HMAC para Integridad de Mensajes

```python
#!/usr/bin/env python3
"""
Generación y verificación de HMACs
"""

import requests
from base64 import b64encode, b64decode

class ANKAHMACService:
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_hmac(self, message, hmac_key_id):
        """
        Genera HMAC-SHA256 de un mensaje
        """
        response = requests.post(
            f"{self.api_url}/crypto/hmac",
            headers=self.headers,
            json={
                "message": b64encode(message.encode()).decode(),
                "key_id": hmac_key_id,
                "algorithm": "HMAC-SHA256"
            },
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f"Error generando HMAC: {response.text}")

        hmac_value = response.json()["hmac"]

        print(f"✓ HMAC generado: {hmac_value[:32]}...")

        return hmac_value

    def verify_hmac(self, message, hmac_value, hmac_key_id):
        """
        Verifica HMAC de un mensaje
        """
        expected_hmac = self.generate_hmac(message, hmac_key_id)

        is_valid = (expected_hmac == hmac_value)

        if is_valid:
            print(f"✓ HMAC VÁLIDO - Integridad confirmada")
        else:
            print(f"✗ HMAC INVÁLIDO - Mensaje alterado")

        return is_valid

# Demo
if __name__ == "__main__":
    from dotenv import load_dotenv
    import os

    load_dotenv()

    hmac_service = ANKAHMACService(
        os.getenv('ANKASECURE_API_URL'),
        os.getenv('ANKASECURE_API_KEY')
    )

    message = "Transferencia de $100,000 a cuenta 12345"
    KEY_ID = os.getenv('HMAC_KEY_ID')

    # Generar HMAC
    hmac = hmac_service.generate_hmac(message, KEY_ID)

    # Transmitir mensaje + HMAC
    transmitted_data = {
        "message": message,
        "hmac": hmac
    }

    # Verificar HMAC en el receptor
    is_valid = hmac_service.verify_hmac(
        transmitted_data["message"],
        transmitted_data["hmac"],
        KEY_ID
    )

    assert is_valid, "HMAC verification failed!"
```

---

## Parte 4: Derivación Segura de Claves (KDF)

```python
#!/usr/bin/env python3
"""
Key Derivation Functions con ANKASecure
"""

import requests
from base64 import b64encode, b64decode

def derive_keys_hkdf(master_key_id, context, num_keys=5):
    """
    Deriva múltiples claves de una clave maestra usando HKDF
    """
    print("\n" + "=" * 70)
    print("DERIVACIÓN DE CLAVES (HKDF-SHA256)")
    print("=" * 70)

    API_URL = os.getenv('ANKASECURE_API_URL')
    API_KEY = os.getenv('ANKASECURE_API_KEY')

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    derived_keys = []

    for i in range(num_keys):
        response = requests.post(
            f"{API_URL}/crypto/derive-key",
            headers=headers,
            json={
                "master_key_id": master_key_id,
                "algorithm": "HKDF-SHA256",
                "context": f"{context}-{i}".encode().hex(),
                "length": 32  # 256 bits
            },
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f"Error derivando clave: {response.text}")

        derived_key = response.json()["derived_key"]
        derived_keys.append(derived_key)

        print(f"✓ Clave {i+1} derivada: {derived_key[:32]}...")

    print(f"\n✓ {len(derived_keys)} claves derivadas de clave maestra")

    return derived_keys

# Demo
if __name__ == "__main__":
    from dotenv import load_dotenv
    import os

    load_dotenv()

    MASTER_KEY_ID = os.getenv('MASTER_KEY_ID')

    # Derivar claves para diferentes propósitos
    encryption_keys = derive_keys_hkdf(
        MASTER_KEY_ID,
        context="database-encryption",
        num_keys=5
    )

    print(f"\n✓ Claves listas para cifrar 5 bases de datos diferentes")
```

---

## Evidencias

1. Screenshots de operaciones criptográficas ejecutándose
2. Código de implementación híbrida
3. Resultados de benchmarks de performance
4. Logs de auditoría de ANKASecure

## Recursos

- NIST SP 800-108: KDF Recommendations
- NIST FIPS 198-1: HMAC Standard
- NIST SP 800-56C: Key Derivation

🔐 **Dominar operaciones criptográficas es esencial para sistemas seguros!**
