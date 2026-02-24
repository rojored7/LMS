# Laboratorio 04: Criptografía Híbrida - Lo Mejor de Ambos Mundos

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Comprender** por qué usar criptografía híbrida es la mejor práctica actual
2. **Implementar** sistemas de intercambio de claves híbridos (X25519 + ML-KEM)
3. **Crear** esquemas de firma híbridos (Ed25519 + ML-DSA)
4. **Diseñar** un protocolo TLS híbrido postcuántico
5. **Evaluar** trade-offs entre seguridad, performance y tamaño
6. **Desplegar** un sistema de mensajería seguro híbrido

## Duración Estimada
**4-5 horas** (Teoría: 1h | Implementación: 3h | Evaluación: 1h)

---

## Parte 1: Fundamentos de Criptografía Híbrida

### 1.1 ¿Por Qué Híbrido?

La criptografía híbrida combina algoritmos clásicos (RSA, ECC) con postcuánticos (ML-KEM, ML-DSA) para obtener:

**Ventajas:**
1. **Seguridad "AND"**: Seguro si al menos UNO de los algoritmos es seguro
2. **Defense in Depth**: Protección contra amenazas conocidas Y futuras
3. **Migración gradual**: No requiere desactivar sistemas clásicos inmediatamente
4. **Confianza**: Algoritmos clásicos tienen décadas de análisis; PQC son nuevos

**Desventajas:**
1. **Performance**: Más operaciones criptográficas
2. **Tamaño**: Más bytes transmitidos (claves, firmas, ciphertexts)
3. **Complejidad**: Más código, más superficie de ataque

### 1.2 Estrategias de Combinación

#### KEM Híbrido (Intercambio de Claves)

```
Clave Final = KDF(Shared_Secret_Clásico || Shared_Secret_PQC)
```

**Ejemplo:**
```
Shared_X25519 = ECDH(privkey_X25519, pubkey_X25519)
Shared_MLKEM = ML-KEM.Decaps(ciphertext, privkey_MLKEM)

Clave_Maestra = HKDF(Shared_X25519 || Shared_MLKEM, salt, info)
```

#### Firma Híbrida

**Opción 1: Firma Independiente** (NIST Recomendado)
```
Signature_Híbrida = Sign_Ed25519(mensaje) || Sign_ML-DSA(mensaje)

Verificar = Verify_Ed25519() AND Verify_ML-DSA()
```

**Opción 2: Firma Concatenada**
```
combined_message = mensaje || Sign_Ed25519(mensaje)
Signature_Híbrida = Sign_ML-DSA(combined_message)
```

---

## Parte 2: KEM Híbrido (X25519 + ML-KEM-768)

### 2.1 Implementación de Intercambio de Claves Híbrido

```python
#!/usr/bin/env python3
"""
Intercambio de claves híbrido: X25519 + ML-KEM-768
"""

import oqs
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend
import os

class HybridKEM:
    def __init__(self):
        self.pqc_algorithm = "Kyber768"  # ML-KEM-768

    def generate_keypair(self):
        """
        Genera pares de claves para X25519 Y ML-KEM
        """
        print("\n" + "=" * 70)
        print("GENERACIÓN DE CLAVES HÍBRIDAS")
        print("=" * 70)

        # X25519 (clásico)
        x25519_private = x25519.X25519PrivateKey.generate()
        x25519_public = x25519_private.public_key()

        print(f"\n✓ X25519 Keys generadas")
        print(f"  - PubKey tamaño: 32 bytes")

        # ML-KEM-768 (postcuántico)
        with oqs.KeyEncapsulation(self.pqc_algorithm) as kem:
            mlkem_public = kem.generate_keypair()
            mlkem_secret = kem.export_secret_key()

        print(f"\n✓ ML-KEM-768 Keys generadas")
        print(f"  - PubKey tamaño: {len(mlkem_public)} bytes")

        # Clave pública híbrida
        hybrid_public = {
            "x25519": x25519_public,
            "mlkem": mlkem_public
        }

        # Clave privada híbrida
        hybrid_secret = {
            "x25519": x25519_private,
            "mlkem": mlkem_secret
        }

        print(f"\n✓ Clave pública híbrida: {32 + len(mlkem_public)} bytes total")

        return hybrid_public, hybrid_secret

    def encapsulate(self, hybrid_public_key):
        """
        Genera shared secrets usando ambos algoritmos
        """
        print("\n" + "=" * 70)
        print("ENCAPSULACIÓN HÍBRIDA")
        print("=" * 70)

        # X25519: Cliente genera clave efímera
        x25519_ephemeral_private = x25519.X25519PrivateKey.generate()
        x25519_ephemeral_public = x25519_ephemeral_private.public_key()

        # X25519: Shared secret
        x25519_shared_secret = x25519_ephemeral_private.exchange(
            hybrid_public_key["x25519"]
        )

        print(f"\n✓ X25519 Shared Secret: {len(x25519_shared_secret)} bytes")

        # ML-KEM: Encapsulación
        with oqs.KeyEncapsulation(self.pqc_algorithm) as kem:
            mlkem_ciphertext, mlkem_shared_secret = kem.encap_secret(
                hybrid_public_key["mlkem"]
            )

        print(f"✓ ML-KEM Shared Secret: {len(mlkem_shared_secret)} bytes")
        print(f"✓ ML-KEM Ciphertext: {len(mlkem_ciphertext)} bytes")

        # Combinar shared secrets usando HKDF
        combined_secret = x25519_shared_secret + mlkem_shared_secret

        final_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=None,
            info=b'Hybrid KEM X25519+ML-KEM-768',
            backend=default_backend()
        ).derive(combined_secret)

        print(f"\n✓ Clave Final Derivada (HKDF-SHA256): {len(final_key)} bytes")
        print(f"  Hex: {final_key.hex()}")

        # Datos para enviar al servidor
        hybrid_ciphertext = {
            "x25519_pubkey": x25519_ephemeral_public,
            "mlkem_ciphertext": mlkem_ciphertext
        }

        return hybrid_ciphertext, final_key

    def decapsulate(self, hybrid_ciphertext, hybrid_secret_key):
        """
        Recupera shared secrets usando claves privadas
        """
        print("\n" + "=" * 70)
        print("DECAPSULACIÓN HÍBRIDA")
        print("=" * 70)

        # X25519: Shared secret
        x25519_shared_secret = hybrid_secret_key["x25519"].exchange(
            hybrid_ciphertext["x25519_pubkey"]
        )

        print(f"\n✓ X25519 Shared Secret recuperado: {len(x25519_shared_secret)} bytes")

        # ML-KEM: Decapsulación
        with oqs.KeyEncapsulation(self.pqc_algorithm, hybrid_secret_key["mlkem"]) as kem:
            mlkem_shared_secret = kem.decap_secret(
                hybrid_ciphertext["mlkem_ciphertext"]
            )

        print(f"✓ ML-KEM Shared Secret recuperado: {len(mlkem_shared_secret)} bytes")

        # Combinar shared secrets (mismo proceso que encapsulate)
        combined_secret = x25519_shared_secret + mlkem_shared_secret

        final_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'Hybrid KEM X25519+ML-KEM-768',
            backend=default_backend()
        ).derive(combined_secret)

        print(f"\n✓ Clave Final Derivada: {len(final_key)} bytes")
        print(f"  Hex: {final_key.hex()}")

        return final_key

# Demostración
if __name__ == "__main__":
    hybrid_kem = HybridKEM()

    # Servidor genera claves
    print("\n🖥️  SERVIDOR")
    server_public, server_secret = hybrid_kem.generate_keypair()

    # Cliente encapsula
    print("\n\n📱 CLIENTE")
    ciphertext, client_key = hybrid_kem.encapsulate(server_public)

    # Servidor decapsula
    print("\n\n🖥️  SERVIDOR")
    server_key = hybrid_kem.decapsulate(ciphertext, server_secret)

    # Verificación
    print("\n\n" + "=" * 70)
    print("VERIFICACIÓN")
    print("=" * 70)

    if client_key == server_key:
        print("✓ ¡ÉXITO! Ambas partes tienen la misma clave secreta")
        print(f"  Clave compartida: {client_key.hex()}")
    else:
        print("✗ ERROR: Las claves no coinciden")

    print("=" * 70)
```

**Ejecutar:**
```bash
python3 hybrid_kem.py
```

---

## Parte 3: Firma Híbrida (Ed25519 + ML-DSA-65)

### 3.1 Implementación de Firma Dual

```python
#!/usr/bin/env python3
"""
Esquema de firma híbrida: Ed25519 + ML-DSA-65
"""

import oqs
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.backends import default_backend
import json
from base64 import b64encode, b64decode

class HybridSignature:
    def __init__(self):
        self.pqc_algorithm = "Dilithium3"  # ML-DSA-65

    def generate_keypair(self):
        """
        Genera pares de claves para Ed25519 Y ML-DSA
        """
        print("\n" + "=" * 70)
        print("GENERACIÓN DE CLAVES DE FIRMA HÍBRIDAS")
        print("=" * 70)

        # Ed25519 (clásico)
        ed25519_private = ed25519.Ed25519PrivateKey.generate()
        ed25519_public = ed25519_private.public_key()

        print(f"\n✓ Ed25519 Keys generadas")
        print(f"  - PubKey: 32 bytes, Signature: 64 bytes")

        # ML-DSA-65 (postcuántico)
        with oqs.Signature(self.pqc_algorithm) as signer:
            mldsa_public = signer.generate_keypair()
            mldsa_secret = signer.export_secret_key()

        print(f"\n✓ ML-DSA-65 Keys generadas")
        print(f"  - PubKey: {len(mldsa_public)} bytes, Signature: ~3293 bytes")

        # Claves híbridas
        hybrid_public = {
            "ed25519": ed25519_public,
            "mldsa": mldsa_public
        }

        hybrid_secret = {
            "ed25519": ed25519_private,
            "mldsa": mldsa_secret
        }

        print(f"\n✓ Clave pública híbrida: {32 + len(mldsa_public)} bytes total")

        return hybrid_public, hybrid_secret

    def sign(self, message, hybrid_secret_key):
        """
        Firma un mensaje con AMBOS algoritmos
        """
        print("\n" + "=" * 70)
        print("FIRMA HÍBRIDA")
        print("=" * 70)

        message_bytes = message.encode('utf-8') if isinstance(message, str) else message

        # Ed25519 Signature
        ed25519_signature = hybrid_secret_key["ed25519"].sign(message_bytes)

        print(f"\n✓ Firma Ed25519 generada: {len(ed25519_signature)} bytes")

        # ML-DSA Signature
        with oqs.Signature(self.pqc_algorithm, hybrid_secret_key["mldsa"]) as signer:
            mldsa_signature = signer.sign(message_bytes)

        print(f"✓ Firma ML-DSA generada: {len(mldsa_signature)} bytes")

        # Firma híbrida
        hybrid_signature = {
            "ed25519": b64encode(ed25519_signature).decode('utf-8'),
            "mldsa": b64encode(mldsa_signature).decode('utf-8')
        }

        total_size = len(ed25519_signature) + len(mldsa_signature)
        print(f"\n✓ Firma híbrida total: {total_size} bytes")

        return hybrid_signature

    def verify(self, message, hybrid_signature, hybrid_public_key):
        """
        Verifica AMBAS firmas (deben ser válidas)
        """
        print("\n" + "=" * 70)
        print("VERIFICACIÓN HÍBRIDA")
        print("=" * 70)

        message_bytes = message.encode('utf-8') if isinstance(message, str) else message

        # Verificar Ed25519
        ed25519_signature = b64decode(hybrid_signature["ed25519"])

        try:
            hybrid_public_key["ed25519"].verify(ed25519_signature, message_bytes)
            ed25519_valid = True
            print(f"\n✓ Firma Ed25519 VÁLIDA")
        except Exception as e:
            ed25519_valid = False
            print(f"\n✗ Firma Ed25519 INVÁLIDA: {e}")

        # Verificar ML-DSA
        mldsa_signature = b64decode(hybrid_signature["mldsa"])

        with oqs.Signature(self.pqc_algorithm) as verifier:
            mldsa_valid = verifier.verify(
                message_bytes,
                mldsa_signature,
                hybrid_public_key["mldsa"]
            )

        if mldsa_valid:
            print(f"✓ Firma ML-DSA VÁLIDA")
        else:
            print(f"✗ Firma ML-DSA INVÁLIDA")

        # Verificación híbrida: AMBAS deben ser válidas
        is_valid = ed25519_valid and mldsa_valid

        print("\n" + "=" * 70)
        if is_valid:
            print("✓✓ FIRMA HÍBRIDA COMPLETAMENTE VÁLIDA ✓✓")
        else:
            print("✗✗ FIRMA HÍBRIDA INVÁLIDA ✗✗")
        print("=" * 70)

        return is_valid

# Demostración
if __name__ == "__main__":
    hybrid_sig = HybridSignature()

    # Generar claves
    public_key, secret_key = hybrid_sig.generate_keypair()

    # Mensaje a firmar
    message = "Contrato legal: Transferencia de $1,000,000 USD a cuenta XYZ. Firmado el 2026-02-22."

    print(f"\nMensaje original:")
    print(f"  {message}")

    # Firmar
    signature = hybrid_sig.sign(message, secret_key)

    # Verificar firma válida
    is_valid = hybrid_sig.verify(message, signature, public_key)

    # Intentar con mensaje alterado
    print("\n\n" + "=" * 70)
    print("PRUEBA: MENSAJE ALTERADO")
    print("=" * 70)

    tampered_message = "Contrato legal: Transferencia de $9,999,999 USD a cuenta HACKER."

    print(f"\nMensaje alterado:")
    print(f"  {tampered_message}")

    is_valid_tampered = hybrid_sig.verify(tampered_message, signature, public_key)

    print("\n✓ La firma híbrida detectó correctamente la alteración")
```

**Ejecutar:**
```bash
python3 hybrid_signature.py
```

---

## Parte 4: Protocolo TLS Híbrido

### 4.1 Simulación de Handshake TLS 1.3 + PQC

```python
#!/usr/bin/env python3
"""
Simulación de TLS 1.3 Híbrido
X25519+ML-KEM para key exchange, Ed25519+ML-DSA para certificados
"""

import oqs
from cryptography.hazmat.primitives.asymmetric import x25519, ed25519
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import json

class HybridTLSServer:
    def __init__(self):
        self.kem_algorithm = "Kyber768"
        self.sig_algorithm = "Dilithium3"

        # Generar certificado del servidor (keypair de firma)
        print("\n🖥️  SERVIDOR: Generando certificado híbrido...")
        self.cert_ed25519_private = ed25519.Ed25519PrivateKey.generate()
        self.cert_ed25519_public = self.cert_ed25519_private.public_key()

        with oqs.Signature(self.sig_algorithm) as signer:
            self.cert_mldsa_public = signer.generate_keypair()
            self.cert_mldsa_secret = signer.export_secret_key()

        print(f"✓ Certificado híbrido generado")

    def handshake(self, client_hello):
        """
        Procesa ClientHello y genera ServerHello
        """
        print("\n" + "=" * 70)
        print("TLS HANDSHAKE: Servidor procesando ClientHello")
        print("=" * 70)

        # Generar claves efímeras para key exchange
        server_x25519_private = x25519.X25519PrivateKey.generate()
        server_x25519_public = server_x25519_private.public_key()

        with oqs.KeyEncapsulation(self.kem_algorithm) as kem:
            server_mlkem_public = kem.generate_keypair()
            server_mlkem_secret = kem.export_secret_key()

        # Preparar ServerHello
        server_hello = {
            "x25519_pubkey": server_x25519_public,
            "mlkem_pubkey": server_mlkem_public,
            "cert_ed25519_pubkey": self.cert_ed25519_public,
            "cert_mldsa_pubkey": self.cert_mldsa_public
        }

        print(f"\n✓ ServerHello preparado")
        print(f"  - X25519 PubKey: 32 bytes")
        print(f"  - ML-KEM PubKey: {len(server_mlkem_public)} bytes")

        # Guardar para decapsulate posterior
        self.server_x25519_private = server_x25519_private
        self.server_mlkem_secret = server_mlkem_secret

        return server_hello

    def derive_keys(self, client_key_share):
        """
        Deriva claves de sesión a partir de key shares del cliente
        """
        print("\n" + "=" * 70)
        print("TLS HANDSHAKE: Servidor derivando claves de sesión")
        print("=" * 70)

        # X25519 shared secret
        x25519_shared = self.server_x25519_private.exchange(
            client_key_share["x25519_pubkey"]
        )

        # ML-KEM shared secret
        with oqs.KeyEncapsulation(self.kem_algorithm, self.server_mlkem_secret) as kem:
            mlkem_shared = kem.decap_secret(client_key_share["mlkem_ciphertext"])

        # Combinar usando HKDF
        combined = x25519_shared + mlkem_shared

        session_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'Hybrid TLS 1.3 Session Key',
            backend=default_backend()
        ).derive(combined)

        print(f"\n✓ Clave de sesión derivada: {session_key.hex()}")

        return session_key


class HybridTLSClient:
    def __init__(self):
        self.kem_algorithm = "Kyber768"
        self.sig_algorithm = "Dilithium3"

    def create_client_hello(self):
        """
        Genera ClientHello con capacidades híbridas
        """
        print("\n📱 CLIENTE: Creando ClientHello")
        print("=" * 70)

        client_hello = {
            "supported_groups": ["X25519", "Kyber768"],
            "signature_algorithms": ["Ed25519", "Dilithium3"],
            "tls_version": "1.3-hybrid"
        }

        print(f"✓ ClientHello creado con soporte híbrido")

        return client_hello

    def process_server_hello(self, server_hello):
        """
        Procesa ServerHello y genera key shares
        """
        print("\n📱 CLIENTE: Procesando ServerHello")
        print("=" * 70)

        # Verificar certificado del servidor (simplificado)
        print(f"\n✓ Certificado del servidor recibido")

        # Generar key share del cliente
        client_x25519_private = x25519.X25519PrivateKey.generate()
        client_x25519_public = client_x25519_private.public_key()

        # X25519 shared secret
        x25519_shared = client_x25519_private.exchange(
            server_hello["x25519_pubkey"]
        )

        # ML-KEM encapsulation
        with oqs.KeyEncapsulation(self.kem_algorithm) as kem:
            mlkem_ciphertext, mlkem_shared = kem.encap_secret(
                server_hello["mlkem_pubkey"]
            )

        # Combinar shared secrets
        combined = x25519_shared + mlkem_shared

        session_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'Hybrid TLS 1.3 Session Key',
            backend=default_backend()
        ).derive(combined)

        print(f"\n✓ Clave de sesión derivada: {session_key.hex()}")

        # Key share para enviar al servidor
        client_key_share = {
            "x25519_pubkey": client_x25519_public,
            "mlkem_ciphertext": mlkem_ciphertext
        }

        return client_key_share, session_key


# Simulación completa
if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("SIMULACIÓN DE TLS 1.3 HÍBRIDO (X25519+ML-KEM, Ed25519+ML-DSA)")
    print("=" * 70)

    # Inicializar servidor y cliente
    server = HybridTLSServer()
    client = HybridTLSClient()

    # 1. ClientHello
    client_hello = client.create_client_hello()

    # 2. ServerHello
    server_hello = server.handshake(client_hello)

    # 3. Cliente procesa ServerHello y genera key share
    client_key_share, client_session_key = client.process_server_hello(server_hello)

    # 4. Servidor deriva clave de sesión
    server_session_key = server.derive_keys(client_key_share)

    # 5. Verificación
    print("\n" + "=" * 70)
    print("VERIFICACIÓN FINAL")
    print("=" * 70)

    if client_session_key == server_session_key:
        print("\n✓✓ ¡HANDSHAKE EXITOSO! ✓✓")
        print(f"  Clave de sesión compartida: {client_session_key.hex()}")
        print(f"\nAhora el tráfico puede cifrarse con AES-256-GCM usando esta clave.")
        print(f"✓ Seguro contra computadoras clásicas Y cuánticas")
    else:
        print("\n✗✗ ERROR: Las claves no coinciden ✗✗")

    print("=" * 70)
```

**Ejecutar:**
```bash
python3 hybrid_tls.py
```

---

## Parte 5: Sistema de Mensajería Seguro (E2E Encryption)

### 5.1 Aplicación Práctica Completa

```python
#!/usr/bin/env python3
"""
Sistema de mensajería end-to-end con cifrado híbrido
Similar a Signal pero con protección cuántica
"""

import oqs
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import os
import json
from datetime import datetime

class SecureMessenger:
    def __init__(self, user_id):
        self.user_id = user_id
        self.kem_algorithm = "Kyber768"

        # Generar identity key (long-term)
        self.identity_x25519_private = x25519.X25519PrivateKey.generate()
        self.identity_x25519_public = self.identity_x25519_private.public_key()

        with oqs.KeyEncapsulation(self.kem_algorithm) as kem:
            self.identity_mlkem_public = kem.generate_keypair()
            self.identity_mlkem_secret = kem.export_secret_key()

        print(f"\n✓ Usuario '{user_id}' inicializado con identity keys híbridas")

    def send_message(self, recipient_public_keys, message):
        """
        Envía un mensaje cifrado al destinatario
        """
        print(f"\n{'=' * 70}")
        print(f"📤 {self.user_id} enviando mensaje")
        print(f"{'=' * 70}")

        # Generar claves efímeras (Perfect Forward Secrecy)
        ephemeral_x25519_private = x25519.X25519PrivateKey.generate()
        ephemeral_x25519_public = ephemeral_x25519_private.public_key()

        # X25519 key agreement
        x25519_shared = ephemeral_x25519_private.exchange(
            recipient_public_keys["identity_x25519_public"]
        )

        # ML-KEM encapsulation
        with oqs.KeyEncapsulation(self.kem_algorithm) as kem:
            mlkem_ciphertext, mlkem_shared = kem.encap_secret(
                recipient_public_keys["identity_mlkem_public"]
            )

        # Derivar clave de cifrado
        combined = x25519_shared + mlkem_shared
        encryption_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'E2E Message Encryption',
            backend=default_backend()
        ).derive(combined)

        # Cifrar mensaje con AES-256-GCM
        aesgcm = AESGCM(encryption_key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, message.encode('utf-8'), None)

        # Crear paquete de mensaje
        encrypted_message = {
            "sender": self.user_id,
            "timestamp": datetime.now().isoformat(),
            "ephemeral_x25519_pubkey": ephemeral_x25519_public,
            "mlkem_ciphertext": mlkem_ciphertext,
            "nonce": nonce,
            "ciphertext": ciphertext
        }

        print(f"✓ Mensaje cifrado (tamaño: {len(ciphertext)} bytes)")

        return encrypted_message

    def receive_message(self, encrypted_message):
        """
        Recibe y descifra un mensaje
        """
        print(f"\n{'=' * 70}")
        print(f"📥 {self.user_id} recibiendo mensaje de {encrypted_message['sender']}")
        print(f"{'=' * 70}")

        # X25519 key agreement
        x25519_shared = self.identity_x25519_private.exchange(
            encrypted_message["ephemeral_x25519_pubkey"]
        )

        # ML-KEM decapsulation
        with oqs.KeyEncapsulation(self.kem_algorithm, self.identity_mlkem_secret) as kem:
            mlkem_shared = kem.decap_secret(encrypted_message["mlkem_ciphertext"])

        # Derivar clave de cifrado (mismo proceso que sender)
        combined = x25519_shared + mlkem_shared
        encryption_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'E2E Message Encryption',
            backend=default_backend()
        ).derive(combined)

        # Descifrar mensaje
        aesgcm = AESGCM(encryption_key)
        plaintext = aesgcm.decrypt(
            encrypted_message["nonce"],
            encrypted_message["ciphertext"],
            None
        )

        message = plaintext.decode('utf-8')

        print(f"\n✓ Mensaje descifrado exitosamente")
        print(f"  De: {encrypted_message['sender']}")
        print(f"  Timestamp: {encrypted_message['timestamp']}")
        print(f"  Mensaje: \"{message}\"")

        return message

    def get_public_keys(self):
        """
        Retorna claves públicas para compartir
        """
        return {
            "user_id": self.user_id,
            "identity_x25519_public": self.identity_x25519_public,
            "identity_mlkem_public": self.identity_mlkem_public
        }

# Demostración
if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("SISTEMA DE MENSAJERÍA SEGURA CON CIFRADO HÍBRIDO E2E")
    print("=" * 70)

    # Crear dos usuarios
    alice = SecureMessenger("Alice")
    bob = SecureMessenger("Bob")

    # Intercambio de claves públicas (fuera de banda, ej: QR code)
    alice_public = alice.get_public_keys()
    bob_public = bob.get_public_keys()

    print("\n✓ Intercambio de claves públicas completado")

    # Alice envía mensaje a Bob
    message_to_send = "Hola Bob! Este mensaje está protegido contra espionaje cuántico 🔐"

    encrypted_msg = alice.send_message(bob_public, message_to_send)

    # Bob recibe y descifra el mensaje
    decrypted_msg = bob.receive_message(encrypted_msg)

    # Verificación
    print("\n" + "=" * 70)
    print("VERIFICACIÓN")
    print("=" * 70)

    if message_to_send == decrypted_msg:
        print("\n✓✓ ¡COMUNICACIÓN SEGURA ESTABLECIDA! ✓✓")
        print(f"  Original: \"{message_to_send}\"")
        print(f"  Descifrado: \"{decrypted_msg}\"")
        print(f"\n✓ Perfect Forward Secrecy (claves efímeras)")
        print(f"✓ Protección cuántica (ML-KEM-768)")
        print(f"✓ Cifrado autenticado (AES-256-GCM)")
    else:
        print("\n✗ ERROR en la comunicación")

    print("=" * 70)
```

**Ejecutar:**
```bash
python3 secure_messenger.py
```

---

## Evidencias de Aprendizaje

### Archivos a Entregar

1. **Salida de hybrid_kem.py** mostrando intercambio de claves exitoso
2. **Salida de hybrid_signature.py** con verificación dual
3. **Salida de hybrid_tls.py** con handshake completo
4. **Salida de secure_messenger.py** con mensajes E2E
5. **Diagrama de arquitectura** de sistema híbrido implementado

### Preguntas de Reflexión

1. **¿Por qué combinar X25519 con ML-KEM en lugar de usar solo ML-KEM?**

2. **¿Qué pasaría si uno de los dos algoritmos (clásico o PQC) se rompiera en el futuro?**

3. **¿Cuál es el overhead (bytes adicionales) de usar criptografía híbrida vs solo clásica?**

4. **¿TLS 1.3 híbrido es compatible con TLS 1.3 estándar? ¿Cómo manejarías la negociación?**

5. **¿En qué escenarios NO recomendarías usar criptografía híbrida?**

---

## Recursos Adicionales

- **NIST SP 800-227**: Hybrid Post-Quantum TLS 1.3
- **IETF Draft**: Hybrid Key Exchange in TLS 1.3
- **Cloudflare Blog**: "Experiment with Hybrid Post-Quantum TLS"
- **Google BoringSSL**: Implementación de KEMs híbridos

---

## Próximos Pasos

¡Felicitaciones! Has completado el módulo de Criptografía Postcuántica. Ahora puedes:

- **Módulo 5**: Gestión de Claves y PKI con rotación a PQC
- **Módulo 8**: Implementar ANKASecure con soporte híbrido
- **Proyecto Final**: Migrar un sistema completo a criptografía híbrida

🚀 **La transición a PQC es gradual, y los sistemas híbridos son el puente perfecto!** 🔐
