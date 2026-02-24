# Laboratorio 04: Cifrado de Streaming Seguro

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Comprender** los desafíos de cifrar streams de datos en tiempo real
2. **Implementar** cifrado de video/audio en vivo usando ChaCha20
3. **Crear** un sistema de streaming seguro con WebSockets
4. **Gestionar** claves de sesión efímeras para Perfect Forward Secrecy
5. **Proteger** transmisiones de archivos grandes sin cargar todo en memoria
6. **Diseñar** protocolos de streaming con autenticación continua

## Duración Estimada
**4-5 horas** (Teoría: 1h | Implementación: 3h | Pruebas: 1h)

---

## Parte 1: Fundamentos de Cifrado de Streaming

### 1.1 ¿Por Qué Streaming Cifrado es Diferente?

**Desafíos únicos:**
1. **Tamaño desconocido**: No sabes cuántos datos vendrán
2. **Memoria limitada**: No puedes cargar todo en RAM
3. **Latencia crítica**: Cifrado debe ser en tiempo real (< 100ms)
4. **Pérdida de paquetes**: Algoritmos deben tolerar paquetes perdidos
5. **Sincronización**: Receptor debe poder descifrar desde cualquier punto

**Algoritmos adecuados:**
- ✅ **ChaCha20-Poly1305**: Stream cipher, muy rápido
- ✅ **AES-GCM**: Con soporte de hardware (AES-NI)
- ✅ **AES-CTR**: Counter mode permite paralelización
- ❌ **AES-CBC**: Requiere padding, no tolera pérdidas

### 1.2 Modos de Operación para Streaming

#### ChaCha20 (Stream Cipher)

```
Plaintext Stream:   [chunk1][chunk2][chunk3][chunk4]...
                       |       |       |       |
Key + Nonce ------> ChaCha20 Cipher
                       |       |       |       |
Ciphertext Stream: [enc1  ][enc2  ][enc3  ][enc4  ]...
```

**Ventajas:**
- No requiere padding
- Cada chunk es independiente (con counter diferente)
- Muy rápido en software (ideal para mobile)

---

## Parte 2: Streaming de Archivos Grandes

### 2.1 Cifrado Incremental con ChaCha20

```python
#!/usr/bin/env python3
"""
Cifrado de archivos grandes por chunks (streaming)
No carga todo el archivo en memoria
"""

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os

class StreamCipher:
    def __init__(self, key=None, nonce=None):
        """
        Inicializa cipher para streaming

        key: 32 bytes (256 bits) para ChaCha20
        nonce: 16 bytes para ChaCha20
        """
        self.key = key or os.urandom(32)
        self.nonce = nonce or os.urandom(16)

        self.cipher = Cipher(
            algorithms.ChaCha20(self.key, self.nonce),
            mode=None,
            backend=default_backend()
        )

    def encrypt_file_stream(self, input_file, output_file, chunk_size=65536):
        """
        Cifra un archivo grande por chunks (64 KB por defecto)
        """
        print(f"\n{'=' * 70}")
        print(f"CIFRANDO ARCHIVO: {input_file}")
        print(f"{'=' * 70}")

        encryptor = self.cipher.encryptor()

        total_bytes = 0
        chunks_processed = 0

        with open(input_file, 'rb') as fin:
            with open(output_file, 'wb') as fout:
                # Escribir header (nonce para descifrado posterior)
                fout.write(self.nonce)

                while True:
                    # Leer chunk
                    chunk = fin.read(chunk_size)

                    if not chunk:
                        break

                    # Cifrar chunk
                    encrypted_chunk = encryptor.update(chunk)

                    # Escribir chunk cifrado
                    fout.write(encrypted_chunk)

                    total_bytes += len(chunk)
                    chunks_processed += 1

                    if chunks_processed % 100 == 0:
                        print(f"  Procesados: {total_bytes / 1024 / 1024:.2f} MB ({chunks_processed} chunks)")

        print(f"\n✓ Archivo cifrado exitosamente")
        print(f"  Total: {total_bytes / 1024 / 1024:.2f} MB")
        print(f"  Chunks: {chunks_processed}")
        print(f"  Output: {output_file}")

        return {
            "key": self.key,
            "nonce": self.nonce,
            "total_bytes": total_bytes,
            "chunks": chunks_processed
        }

    def decrypt_file_stream(self, input_file, output_file, chunk_size=65536):
        """
        Descifra un archivo cifrado por chunks
        """
        print(f"\n{'=' * 70}")
        print(f"DESCIFRANDO ARCHIVO: {input_file}")
        print(f"{'=' * 70}")

        with open(input_file, 'rb') as fin:
            # Leer nonce del header
            nonce = fin.read(16)

            # Crear decryptor con el nonce original
            cipher = Cipher(
                algorithms.ChaCha20(self.key, nonce),
                mode=None,
                backend=default_backend()
            )
            decryptor = cipher.decryptor()

            total_bytes = 0
            chunks_processed = 0

            with open(output_file, 'wb') as fout:
                while True:
                    chunk = fin.read(chunk_size)

                    if not chunk:
                        break

                    # Descifrar chunk
                    decrypted_chunk = decryptor.update(chunk)

                    # Escribir chunk descifrado
                    fout.write(decrypted_chunk)

                    total_bytes += len(chunk)
                    chunks_processed += 1

                    if chunks_processed % 100 == 0:
                        print(f"  Procesados: {total_bytes / 1024 / 1024:.2f} MB ({chunks_processed} chunks)")

        print(f"\n✓ Archivo descifrado exitosamente")
        print(f"  Total: {total_bytes / 1024 / 1024:.2f} MB")
        print(f"  Output: {output_file}")

# Demostración
if __name__ == "__main__":
    # Crear archivo de prueba grande (100 MB)
    print("Generando archivo de prueba de 100 MB...")

    test_file = "test_large_file.bin"
    with open(test_file, 'wb') as f:
        for _ in range(100):  # 100 chunks de 1 MB
            f.write(os.urandom(1024 * 1024))

    print(f"✓ Archivo creado: {test_file}")

    # Cifrar archivo
    cipher = StreamCipher()
    metadata = cipher.encrypt_file_stream(test_file, "test_large_file.enc")

    # Guardar clave (en producción, usar KMS)
    with open("encryption_key.bin", 'wb') as f:
        f.write(metadata["key"])

    print(f"\n✓ Clave guardada en encryption_key.bin")

    # Descifrar archivo
    cipher.decrypt_file_stream("test_large_file.enc", "test_large_file_decrypted.bin")

    # Verificación
    print("\n" + "=" * 70)
    print("VERIFICACIÓN")
    print("=" * 70)

    import hashlib

    def sha256_file(filename):
        h = hashlib.sha256()
        with open(filename, 'rb') as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()

    original_hash = sha256_file(test_file)
    decrypted_hash = sha256_file("test_large_file_decrypted.bin")

    if original_hash == decrypted_hash:
        print("\n✓✓ ¡VERIFICACIÓN EXITOSA! ✓✓")
        print(f"  SHA-256 Original:   {original_hash}")
        print(f"  SHA-256 Descifrado: {decrypted_hash}")
    else:
        print("\n✗ ERROR: Los archivos no coinciden")

    # Limpiar archivos de prueba
    os.remove(test_file)
    os.remove("test_large_file_decrypted.bin")
    print("\n✓ Archivos de prueba eliminados")
```

**Ejecutar:**
```bash
python3 file_streaming.py
```

---

## Parte 3: Streaming de Video en Vivo (WebRTC)

### 3.1 Servidor de Streaming con ChaCha20

```python
#!/usr/bin/env python3
"""
Servidor de streaming de video cifrado
Simula WebRTC con cifrado de paquetes
"""

import asyncio
import websockets
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import time

class SecureStreamServer:
    def __init__(self):
        self.clients = {}  # {client_id: {key, nonce, cipher}}

    def generate_session_keys(self, client_id):
        """
        Genera claves de sesión únicas para cada cliente
        """
        key = os.urandom(32)
        nonce = os.urandom(16)

        cipher = Cipher(
            algorithms.ChaCha20(key, nonce),
            mode=None,
            backend=default_backend()
        )

        self.clients[client_id] = {
            "key": key,
            "nonce": nonce,
            "encryptor": cipher.encryptor(),
            "connected_at": time.time()
        }

        print(f"✓ Claves de sesión generadas para cliente {client_id}")

        return key, nonce

    async def handle_client(self, websocket, path):
        """
        Maneja conexión de cliente WebSocket
        """
        client_id = id(websocket)

        print(f"\n{'=' * 70}")
        print(f"NUEVO CLIENTE CONECTADO: {client_id}")
        print(f"{'=' * 70}")

        # Intercambio de claves (simplificado - en producción usar ECDH)
        key, nonce = self.generate_session_keys(client_id)

        # Enviar claves al cliente
        await websocket.send(json.dumps({
            "type": "keys",
            "key": key.hex(),
            "nonce": nonce.hex()
        }))

        try:
            # Simular stream de video (enviar chunks cifrados)
            chunk_number = 0

            while True:
                # Simular frame de video (en producción, captura de cámara)
                video_frame = os.urandom(1024 * 10)  # 10 KB por frame

                # Cifrar frame
                encryptor = self.clients[client_id]["encryptor"]
                encrypted_frame = encryptor.update(video_frame)

                # Enviar frame cifrado
                await websocket.send(json.dumps({
                    "type": "frame",
                    "chunk_number": chunk_number,
                    "data": encrypted_frame.hex()
                }))

                chunk_number += 1

                # Log cada 100 frames
                if chunk_number % 100 == 0:
                    print(f"  Cliente {client_id}: {chunk_number} frames enviados")

                # 30 FPS (33ms por frame)
                await asyncio.sleep(0.033)

        except websockets.exceptions.ConnectionClosed:
            print(f"\n✗ Cliente {client_id} desconectado")
            del self.clients[client_id]

async def start_server():
    """
    Inicia servidor WebSocket
    """
    server = SecureStreamServer()

    async with websockets.serve(server.handle_client, "localhost", 8765):
        print("\n" + "=" * 70)
        print("SERVIDOR DE STREAMING SEGURO INICIADO")
        print("=" * 70)
        print("Escuchando en: ws://localhost:8765")
        print("Cifrado: ChaCha20 (claves de sesión únicas por cliente)")
        print("=" * 70 + "\n")

        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(start_server())
```

### 3.2 Cliente de Streaming

```python
#!/usr/bin/env python3
"""
Cliente para recibir y descifrar stream de video
"""

import asyncio
import websockets
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class SecureStreamClient:
    def __init__(self):
        self.key = None
        self.nonce = None
        self.decryptor = None
        self.frames_received = 0

    async def connect(self):
        """
        Conecta al servidor de streaming
        """
        uri = "ws://localhost:8765"

        print("\n" + "=" * 70)
        print(f"CONECTANDO A SERVIDOR: {uri}")
        print("=" * 70)

        async with websockets.connect(uri) as websocket:
            print("✓ Conexión establecida\n")

            async for message in websocket:
                data = json.loads(message)

                if data["type"] == "keys":
                    # Recibir claves de sesión
                    self.key = bytes.fromhex(data["key"])
                    self.nonce = bytes.fromhex(data["nonce"])

                    cipher = Cipher(
                        algorithms.ChaCha20(self.key, self.nonce),
                        mode=None,
                        backend=default_backend()
                    )
                    self.decryptor = cipher.decryptor()

                    print("✓ Claves de sesión recibidas")
                    print(f"  Key: {self.key.hex()[:32]}...")
                    print(f"  Nonce: {self.nonce.hex()}\n")

                elif data["type"] == "frame":
                    # Recibir y descifrar frame
                    chunk_number = data["chunk_number"]
                    encrypted_frame = bytes.fromhex(data["data"])

                    # Descifrar
                    decrypted_frame = self.decryptor.update(encrypted_frame)

                    self.frames_received += 1

                    # Log cada 100 frames
                    if self.frames_received % 100 == 0:
                        print(f"✓ {self.frames_received} frames recibidos y descifrados")
                        print(f"  Último frame: #{chunk_number} ({len(decrypted_frame)} bytes)")

                    # Aquí se renderizaría el frame (OpenCV, FFmpeg, etc.)

if __name__ == "__main__":
    client = SecureStreamClient()

    try:
        asyncio.run(client.connect())
    except KeyboardInterrupt:
        print("\n\n✓ Cliente detenido por usuario")
```

**Ejecutar:**
```bash
# Terminal 1: Servidor
python3 stream_server.py

# Terminal 2: Cliente
python3 stream_client.py
```

---

## Parte 4: Streaming con Autenticación Continua (AEAD)

### 4.1 ChaCha20-Poly1305 para Streaming Autenticado

```python
#!/usr/bin/env python3
"""
Streaming con Autenticación (AEAD)
ChaCha20-Poly1305 asegura integridad de cada chunk
"""

from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
import os
import struct

class AEADStreamCipher:
    def __init__(self, key=None):
        """
        Inicializa AEAD cipher
        """
        self.key = key or ChaCha20Poly1305.generate_key()
        self.aead = ChaCha20Poly1305(self.key)

    def encrypt_stream(self, data_stream, chunk_size=65536):
        """
        Cifra y autentica stream de datos

        Retorna: [(nonce, ciphertext, tag), ...]
        """
        print(f"\n{'=' * 70}")
        print("CIFRANDO STREAM CON AEAD")
        print(f"{'=' * 70}")

        encrypted_chunks = []
        chunk_number = 0

        for i in range(0, len(data_stream), chunk_size):
            chunk = data_stream[i:i+chunk_size]

            # Generar nonce único por chunk (12 bytes para ChaCha20-Poly1305)
            nonce = os.urandom(12)

            # AAD (Additional Authenticated Data) - metadatos no cifrados
            aad = struct.pack('<Q', chunk_number)  # Número de chunk

            # Cifrar y autenticar
            ciphertext = self.aead.encrypt(nonce, chunk, aad)

            encrypted_chunks.append({
                "chunk_number": chunk_number,
                "nonce": nonce,
                "ciphertext": ciphertext,
                "aad": aad
            })

            chunk_number += 1

        print(f"✓ {len(encrypted_chunks)} chunks cifrados y autenticados")

        return encrypted_chunks

    def decrypt_stream(self, encrypted_chunks):
        """
        Descifra y verifica stream
        """
        print(f"\n{'=' * 70}")
        print("DESCIFRANDO Y VERIFICANDO STREAM")
        print(f"{'=' * 70}")

        decrypted_stream = b""

        for chunk in encrypted_chunks:
            try:
                # Descifrar y verificar autenticidad
                plaintext = self.aead.decrypt(
                    chunk["nonce"],
                    chunk["ciphertext"],
                    chunk["aad"]
                )

                decrypted_stream += plaintext

            except Exception as e:
                print(f"✗ Chunk {chunk['chunk_number']} INVÁLIDO: {e}")
                print(f"  ⚠️  Posible alteración detectada!")
                raise

        print(f"✓ Stream descifrado y verificado (integridad confirmada)")

        return decrypted_stream

# Demostración
if __name__ == "__main__":
    # Crear stream de datos
    original_data = b"Este es un stream de datos sensibles " * 10000  # ~400 KB

    print(f"Datos originales: {len(original_data)} bytes")

    # Cifrar stream
    cipher = AEADStreamCipher()
    encrypted_chunks = cipher.encrypt_stream(original_data, chunk_size=8192)

    # Simular transmisión (guardar en archivos)
    print(f"\n{'=' * 70}")
    print("SIMULANDO TRANSMISIÓN")
    print(f"{'=' * 70}")

    with open("stream_chunks.bin", 'wb') as f:
        for chunk in encrypted_chunks:
            # Formato: [nonce (12B)] [ciphertext (variable)]
            f.write(chunk["nonce"])
            f.write(struct.pack('<I', len(chunk["ciphertext"])))
            f.write(chunk["ciphertext"])

    print(f"✓ {len(encrypted_chunks)} chunks guardados en stream_chunks.bin")

    # Descifrar stream
    decrypted_data = cipher.decrypt_stream(encrypted_chunks)

    # Verificación
    print(f"\n{'=' * 70}")
    print("VERIFICACIÓN")
    print(f"{'=' * 70}")

    if original_data == decrypted_data:
        print("\n✓✓ ¡CIFRADO AEAD EXITOSO! ✓✓")
        print(f"  Tamaño original: {len(original_data)} bytes")
        print(f"  Tamaño descifrado: {len(decrypted_data)} bytes")
        print(f"  Chunks procesados: {len(encrypted_chunks)}")
        print(f"  Integridad: VERIFICADA ✓")
    else:
        print("\n✗ ERROR: Los datos no coinciden")

    # Prueba de alteración
    print(f"\n{'=' * 70}")
    print("PRUEBA: DETECTANDO ALTERACIÓN")
    print(f"{'=' * 70}")

    # Alterar un chunk
    encrypted_chunks[10]["ciphertext"] = os.urandom(len(encrypted_chunks[10]["ciphertext"]))

    try:
        cipher.decrypt_stream(encrypted_chunks)
    except Exception as e:
        print(f"\n✓ Alteración detectada correctamente")
        print(f"  La verificación de autenticidad FALLÓ (esperado)")

    os.remove("stream_chunks.bin")
```

**Ejecutar:**
```bash
python3 aead_streaming.py
```

---

## Parte 5: Streaming HTTP (Chunked Transfer Encoding)

### 5.1 API REST con Streaming Cifrado

```python
#!/usr/bin/env python3
"""
API REST que sirve archivos cifrados en streaming
usando Flask y chunked transfer encoding
"""

from flask import Flask, Response, request, jsonify
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
import os

app = Flask(__name__)

# Simulación de claves por sesión (en producción usar Redis/JWT)
session_keys = {}

@app.route('/api/stream/init', methods=['POST'])
def initialize_stream():
    """
    Inicializa sesión de streaming y genera claves
    """
    session_id = os.urandom(16).hex()
    key = ChaCha20Poly1305.generate_key()

    session_keys[session_id] = key

    return jsonify({
        "session_id": session_id,
        "key": key.hex(),
        "message": "Sesión de streaming inicializada"
    }), 201

@app.route('/api/stream/download/<filename>', methods=['GET'])
def stream_download(filename):
    """
    Descarga archivo en streaming cifrado
    """
    session_id = request.args.get('session_id')

    if not session_id or session_id not in session_keys:
        return jsonify({"error": "Sesión inválida"}), 401

    key = session_keys[session_id]
    aead = ChaCha20Poly1305(key)

    # Ruta del archivo (validar en producción)
    file_path = f"./files/{filename}"

    if not os.path.exists(file_path):
        return jsonify({"error": "Archivo no encontrado"}), 404

    def generate_encrypted_chunks():
        """
        Generator function para streaming
        """
        chunk_size = 65536  # 64 KB
        chunk_number = 0

        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(chunk_size)

                if not chunk:
                    break

                # Generar nonce único
                nonce = os.urandom(12)

                # AAD con metadatos
                import struct
                aad = struct.pack('<Q', chunk_number)

                # Cifrar chunk
                ciphertext = aead.encrypt(nonce, chunk, aad)

                # Enviar: [nonce][tamaño][ciphertext]
                yield nonce
                yield struct.pack('<I', len(ciphertext))
                yield ciphertext

                chunk_number += 1

    return Response(
        generate_encrypted_chunks(),
        mimetype='application/octet-stream',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}.enc"',
            'X-Session-ID': session_id
        }
    )

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # Crear directorio de archivos
    os.makedirs("./files", exist_ok=True)

    # Crear archivo de prueba
    with open("./files/sample_document.pdf", 'wb') as f:
        f.write(b"PDF Sample Content " * 10000)  # ~200 KB

    print("\n" + "=" * 70)
    print("API DE STREAMING CIFRADO INICIADA")
    print("=" * 70)
    print("\nEndpoints:")
    print("  POST /api/stream/init - Inicializar sesión")
    print("  GET /api/stream/download/<file>?session_id=X - Descargar cifrado")
    print("\n" + "=" * 70 + "\n")

    app.run(debug=True, port=5000)
```

**Probar la API:**
```bash
# Inicializar sesión
curl -X POST http://localhost:5000/api/stream/init

# Descargar archivo cifrado (reemplazar SESSION_ID)
curl "http://localhost:5000/api/stream/download/sample_document.pdf?session_id=SESSION_ID" --output encrypted_file.enc
```

---

## Evidencias de Aprendizaje

### Archivos a Entregar

1. **Código fuente** de cifrado de archivos grandes
2. **Screenshots** de servidor y cliente de streaming funcionando
3. **Resultados** de pruebas de AEAD con detección de alteraciones
4. **Benchmark** de performance (MB/s procesados)
5. **Diagrama** de arquitectura de streaming seguro

### Preguntas de Reflexión

1. **¿Por qué ChaCha20 es mejor que AES-CBC para streaming?**

2. **¿Qué pasa si se pierde un paquete en el stream? ¿Se puede descifrar el resto?**

3. **¿Cuál es la diferencia entre cifrado de archivo completo vs streaming?**

4. **¿Cómo asegurarías que los frames de video llegan en orden correcto?**

5. **¿Sería seguro reutilizar la misma clave para múltiples streams? Justifica.**

---

## Recursos Adicionales

- **RFC 8439**: ChaCha20 and Poly1305 for IETF Protocols
- **WebRTC Security**: DTLS-SRTP Architecture
- **FFmpeg**: Cifrado de streams multimedia
- **HLS Encryption**: HTTP Live Streaming with AES-128

---

## Próximos Pasos

En el **Módulo 8**, implementarás streaming seguro en producción con:
- CDN con cifrado en el edge
- Autoscaling de servidores de streaming
- Monitoreo de latencia y throughput
- DRM para protección de contenido

🚀 **El streaming seguro es fundamental para aplicaciones modernas de video, IoT y tiempo real!** 🔐
