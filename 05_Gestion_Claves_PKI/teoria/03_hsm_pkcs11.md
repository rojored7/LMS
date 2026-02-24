# HSM y PKCS#11: Hardware Security Modules y Estándar de Interfaz Criptográfica

## Índice

1. [Introducción a HSM](#introducción)
2. [Arquitectura de HSM](#arquitectura)
3. [FIPS 140-2/140-3 Security Levels](#fips)
4. [PKCS#11 - Cryptoki Standard](#pkcs11)
5. [Operaciones Criptográficas con HSM](#operaciones)
6. [Gestión de Claves en HSM](#gestión-claves)
7. [HSM en la Nube (Cloud HSM)](#cloud-hsm)
8. [Integración de HSM con PKI](#integración-pki)
9. [Casos de Uso Empresariales](#casos-uso)
10. [Mejores Prácticas](#mejores-prácticas)
11. [Referencias](#referencias)

---

## Introducción a HSM {#introducción}

Un **Hardware Security Module (HSM)** es un dispositivo físico que gestiona claves criptográficas y realiza operaciones criptográficas en un entorno altamente seguro y con protección contra manipulación (tamper-resistant/tamper-evident).

### Propósito de HSM

| Funcionalidad | Descripción |
|---------------|-------------|
| **Generación de claves** | Generación de claves en hardware con RNG certificado |
| **Almacenamiento seguro** | Claves nunca salen del HSM en formato plano |
| **Operaciones criptográficas** | Firma, cifrado, hash realizados dentro del HSM |
| **Protección física** | Detección y respuesta a intentos de manipulación física |
| **Rendimiento** | Aceleración hardware de operaciones criptográficas |
| **Cumplimiento** | Certificación FIPS 140-2/140-3 |

### Diferencias: HSM vs Software Crypto

| Aspecto | HSM | Software Crypto |
|---------|-----|-----------------|
| **Seguridad de clave** | Clave no exportable, protegida por hardware | Clave en memoria RAM, archivo o KMS |
| **Protección física** | Tamper detection, auto-destrucción | No aplicable |
| **Rendimiento** | Hardware accelerated (1000-10000 ops/sec) | CPU-bound (100-1000 ops/sec) |
| **Costo** | Alto ($10k-$100k+) | Bajo (gratis - $1k/mes cloud) |
| **Complejidad** | Alta (PKCS#11, administración física) | Baja (APIs estándar) |
| **Certificación** | FIPS 140-2 Level 2-4 | No certificado (excepto algunos KMS cloud) |
| **Uso típico** | Root CAs, payment systems, code signing | Desarrollo, pruebas, apps de bajo riesgo |

---

## Arquitectura de HSM {#arquitectura}

### Componentes Internos

```
┌─────────────────────────────────────────────────────────────────┐
│                   HARDWARE SECURITY MODULE                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           TAMPER-DETECTION ENVELOPE                       │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │                                                      │  │ │
│  │  │   ┌──────────────┐      ┌──────────────┐           │  │ │
│  │  │   │ Crypto Engine│      │   Secure     │           │  │ │
│  │  │   │              │      │  Processor   │           │  │ │
│  │  │   │ - RSA/ECC    │◄────►│              │           │  │ │
│  │  │   │ - AES/3DES   │      │  (ARM/MIPS)  │           │  │ │
│  │  │   │ - SHA family │      └──────┬───────┘           │  │ │
│  │  │   └──────────────┘             │                   │  │ │
│  │  │                                │                   │  │ │
│  │  │   ┌──────────────┐      ┌──────▼───────┐           │  │ │
│  │  │   │  True RNG    │      │   Secure     │           │  │ │
│  │  │   │  (TRNG)      │◄────►│   Memory     │           │  │ │
│  │  │   │              │      │   (SRAM)     │           │  │ │
│  │  │   │ Entropy src  │      │              │           │  │ │
│  │  │   └──────────────┘      │ Key Storage  │           │  │ │
│  │  │                         └──────┬───────┘           │  │ │
│  │  │                                │                   │  │ │
│  │  │   ┌──────────────────────────────────────┐         │  │ │
│  │  │   │      Battery-backed RAM             │         │  │ │
│  │  │   │  (Persistent key storage)           │         │  │ │
│  │  │   └──────────────────────────────────────┘         │  │ │
│  │  │                                                      │  │ │
│  │  └──────────────────┬───────────────────────────────────┘  │ │
│  │                     │                                      │ │
│  └─────────────────────┼──────────────────────────────────────┘ │
│                        │                                        │
│  ┌─────────────────────▼──────────────────────────────────────┐ │
│  │          TAMPER DETECTION & RESPONSE SYSTEM               │ │
│  │                                                            │ │
│  │  • Mesh sensors (voltage, temperature, light)             │ │
│  │  • Zeroization on tamper detection                        │ │
│  │  • Event logging                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Host Interface  │
              │                  │
              │  • PKCS#11       │
              │  • JCE/JCA       │
              │  • MS CAPI/CNG   │
              │  • Network (RPC) │
              └──────────────────┘
```

### Tipos de HSM

#### 1. General Purpose HSM

**Ejemplos**: Thales Luna, Entrust nShield, Utimaco SecurityServer

**Características**:
- Soporte múltiples algoritmos (RSA, ECC, AES, SHA, etc.)
- PKCS#11, JCE, MS CAPI/CNG
- Rendimiento: 1,000-10,000 ops/sec
- Uso: PKI, code signing, database encryption

#### 2. Payment HSM

**Ejemplos**: Thales payShield, Utimaco CryptoServer

**Características**:
- Optimizados para PIN processing, EMV, tokenización
- Soportan algoritmos específicos de payment (3DES, DUKPT)
- Cumplimiento PCI-HSM
- Rendimiento: 250-500 PIN verifications/sec

#### 3. Cloud HSM

**Ejemplos**: AWS CloudHSM, Azure Dedicated HSM, Google Cloud HSM

**Características**:
- HSM físico dedicado en datacenter del proveedor
- Acceso vía PKCS#11 sobre VPN/DirectConnect
- Certificación FIPS 140-2 Level 3
- Pricing: $1-2/hora + setup fee

#### 4. Managed HSM (HSM as a Service)

**Ejemplos**: AWS KMS, Azure Key Vault, Google Cloud KMS

**Características**:
- HSM compartido (multi-tenant) gestionado por proveedor
- API REST (no PKCS#11)
- Certificación FIPS 140-2 Level 2-3
- Pricing: $1/key/mes + operaciones

---

## FIPS 140-2/140-3 Security Levels {#fips}

### FIPS 140-2 Levels

| Level | Requisitos | Uso Típico |
|-------|------------|------------|
| **Level 1** | Componentes production-grade, sin protección física | Software crypto, desarrollo |
| **Level 2** | Tamper-evident seals, role-based authentication | Enterprise applications, CAs |
| **Level 3** | Tamper-detection circuits, identity-based auth, zeroization | Root CAs, payment systems, gov/military |
| **Level 4** | Protección contra ataques de canal lateral, environmental failure protection | High-security gov, military, critical infrastructure |

### Comparación FIPS 140-2 vs 140-3

| Aspecto | FIPS 140-2 (2001) | FIPS 140-3 (2019) |
|---------|-------------------|-------------------|
| **Algoritmos** | Lista cerrada (AES, RSA, ECC) | ISO/IEC 19790 annexes |
| **Longitud de clave mínima** | RSA 1024, ECC 160 | RSA 2048, ECC 224 |
| **Autenticación** | Password, token | Biometrics permitido |
| **Side-channel attacks** | Solo Level 4 | Todos los niveles (diferentes grados) |
| **Transition period** | N/A | Hasta Sept 2026 (convivencia con 140-2) |

### Ejemplo de Certificación FIPS

**Thales Luna Network HSM 7.4**:
- **FIPS 140-2 Level 3** (Certificate #3653)
- Algoritmos aprobados: AES, Triple-DES, RSA, ECC, SHA-2, HMAC
- Funciones: Key generation, signing, encryption, random number generation
- Interfaces: PKCS#11, JCE, MS CAPI/CNG
- Protección física: Tamper-detection circuits, zeroization

---

## PKCS#11 - Cryptoki Standard {#pkcs11}

**PKCS#11** (Public-Key Cryptography Standards #11) define una API independiente de tecnología para dispositivos criptográficos como HSMs, smart cards, y tokens.

### Conceptos Básicos

| Concepto | Descripción |
|----------|-------------|
| **Slot** | Contenedor físico o lógico (ej. un HSM, una partición) |
| **Token** | Dispositivo criptográfico dentro de un slot |
| **Session** | Conexión lógica entre aplicación y token |
| **Object** | Entidad almacenada (clave pública, privada, certificado, datos) |
| **Mechanism** | Algoritmo criptográfico (CKM_RSA_PKCS, CKM_SHA256, etc.) |

### Flujo de Operación PKCS#11

```
┌──────────────┐
│ Application  │
└──────┬───────┘
       │
       │ 1. C_Initialize()
       ▼
┌──────────────────────┐
│  PKCS#11 Library     │  (libpkcs11.so / cryptoki.dll)
└──────┬───────────────┘
       │
       │ 2. C_GetSlotList()
       │ 3. C_OpenSession(slot)
       ▼
┌──────────────────────┐
│      HSM Token       │
│                      │
│  ┌────────────────┐  │
│  │  Slot 0        │  │
│  │  Token: "HSM1" │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       │ 4. C_Login(session, CKU_USER, "pin")
       │
       │ 5. C_FindObjects(session, template)
       │    → Returns key handles
       │
       │ 6. C_Sign(session, key_handle, data)
       │    OR
       │    C_Encrypt(session, key_handle, plaintext)
       │
       │ 7. C_Logout(session)
       │ 8. C_CloseSession(session)
       │ 9. C_Finalize()
       ▼
```

### Ejemplo de Código PKCS#11 (Python + PyKCS11)

```python
"""
PKCS#11 con Python - Ejemplo de firma RSA
"""

from PyKCS11 import *
import binascii

# 1. Inicializar PKCS#11 library
pkcs11 = PyKCS11Lib()
pkcs11.load('/usr/lib/libCryptoki2_64.so')  # Ruta a biblioteca PKCS#11 del HSM

# 2. Obtener slots
slots = pkcs11.getSlotList(tokenPresent=True)
print(f"Slots disponibles: {slots}")

slot = slots[0]  # Usar primer slot

# 3. Obtener información del token
token_info = pkcs11.getTokenInfo(slot)
print(f"Token label: {token_info.label}")
print(f"Manufacturer: {token_info.manufacturerID}")
print(f"Model: {token_info.model}")

# 4. Abrir sesión
session = pkcs11.openSession(slot, CKF_SERIAL_SESSION | CKF_RW_SESSION)

# 5. Login (PIN del usuario)
pin = "userpin123"
session.login(pin)

# 6. Buscar clave privada RSA
template = [
    (CKA_CLASS, CKO_PRIVATE_KEY),
    (CKA_KEY_TYPE, CKK_RSA),
    (CKA_LABEL, "MySigningKey")
]

private_key = session.findObjects(template)[0]
print(f"Clave privada encontrada: handle={private_key}")

# 7. Firmar datos
data = b"Hello, HSM!"
mechanism = Mechanism(CKM_SHA256_RSA_PKCS, None)

signature = session.sign(private_key, data, mechanism)
print(f"Firma (hex): {binascii.hexlify(bytes(signature))}")

# 8. Buscar clave pública correspondiente
template_pub = [
    (CKA_CLASS, CKO_PUBLIC_KEY),
    (CKA_KEY_TYPE, CKK_RSA),
    (CKA_LABEL, "MySigningKey")
]

public_key = session.findObjects(template_pub)[0]

# 9. Verificar firma
try:
    session.verify(public_key, data, signature, mechanism)
    print("Firma verificada correctamente!")
except:
    print("ERROR: Firma inválida")

# 10. Logout y cerrar sesión
session.logout()
session.closeSession()
```

### Atributos de Objetos PKCS#11

#### Atributos Comunes

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `CKA_CLASS` | CK_OBJECT_CLASS | Clase de objeto (CKO_PUBLIC_KEY, CKO_PRIVATE_KEY, CKO_SECRET_KEY, CKO_CERTIFICATE) |
| `CKA_TOKEN` | CK_BBOOL | Si TRUE, objeto persiste en token |
| `CKA_PRIVATE` | CK_BBOOL | Si TRUE, requiere login para acceder |
| `CKA_LABEL` | String | Etiqueta legible |
| `CKA_ID` | Bytes | ID único para vincular pub/priv keys |

#### Atributos de Clave Privada RSA

| Atributo | Descripción |
|----------|-------------|
| `CKA_SIGN` | Clave puede firmar |
| `CKA_DECRYPT` | Clave puede descifrar |
| `CKA_UNWRAP` | Clave puede unwrap otras claves |
| `CKA_EXTRACTABLE` | Clave puede exportarse (típicamente FALSE en HSM) |
| `CKA_SENSITIVE` | Clave es sensible, no se puede leer (TRUE en HSM) |
| `CKA_MODULUS` | Módulo RSA (n) |
| `CKA_PUBLIC_EXPONENT` | Exponente público (e) |
| `CKA_PRIVATE_EXPONENT` | Exponente privado (d) - no accesible si CKA_SENSITIVE=TRUE |

### Mechanisms (Algoritmos)

```c
// Signing mechanisms
CKM_RSA_PKCS          // RSA PKCS#1 v1.5 signature
CKM_RSA_PKCS_PSS      // RSA-PSS signature
CKM_SHA256_RSA_PKCS   // SHA-256 + RSA PKCS#1 v1.5 (single-part)
CKM_ECDSA             // ECDSA signature
CKM_ECDSA_SHA256      // SHA-256 + ECDSA

// Encryption mechanisms
CKM_RSA_PKCS          // RSA PKCS#1 v1.5 encryption
CKM_RSA_PKCS_OAEP     // RSA OAEP encryption
CKM_AES_CBC           // AES CBC mode
CKM_AES_GCM           // AES GCM mode

// Key generation mechanisms
CKM_RSA_PKCS_KEY_PAIR_GEN   // Generate RSA key pair
CKM_EC_KEY_PAIR_GEN         // Generate EC key pair
CKM_AES_KEY_GEN             // Generate AES key

// Digest mechanisms
CKM_SHA256
CKM_SHA384
CKM_SHA512
```

---

## Operaciones Criptográficas con HSM {#operaciones}

### Generación de Par de Claves RSA

```python
"""
Generar par de claves RSA en HSM via PKCS#11
"""

from PyKCS11 import *

pkcs11 = PyKCS11Lib()
pkcs11.load('/usr/lib/libCryptoki2_64.so')

slot = pkcs11.getSlotList(tokenPresent=True)[0]
session = pkcs11.openSession(slot, CKF_SERIAL_SESSION | CKF_RW_SESSION)
session.login("userpin123")

# Template para clave pública
public_template = [
    (CKA_CLASS, CKO_PUBLIC_KEY),
    (CKA_KEY_TYPE, CKK_RSA),
    (CKA_TOKEN, True),          # Persistir en token
    (CKA_PRIVATE, False),        # No requiere login para leer
    (CKA_MODULUS_BITS, 2048),    # Tamaño de clave
    (CKA_PUBLIC_EXPONENT, [0x01, 0x00, 0x01]),  # 65537
    (CKA_ENCRYPT, True),
    (CKA_VERIFY, True),
    (CKA_WRAP, True),
    (CKA_LABEL, "MyRSAPublicKey"),
    (CKA_ID, [0x01])
]

# Template para clave privada
private_template = [
    (CKA_CLASS, CKO_PRIVATE_KEY),
    (CKA_KEY_TYPE, CKK_RSA),
    (CKA_TOKEN, True),
    (CKA_PRIVATE, True),         # Requiere login
    (CKA_SENSITIVE, True),       # No exportable
    (CKA_EXTRACTABLE, False),    # No se puede exportar
    (CKA_DECRYPT, True),
    (CKA_SIGN, True),
    (CKA_UNWRAP, True),
    (CKA_LABEL, "MyRSAPrivateKey"),
    (CKA_ID, [0x01])             # Mismo ID que public key
]

# Generar par de claves
(public_key, private_key) = session.generateKeyPair(
    public_template,
    private_template,
    mecha=Mechanism(CKM_RSA_PKCS_KEY_PAIR_GEN, None)
)

print(f"Par de claves RSA generado:")
print(f"  Public key handle: {public_key}")
print(f"  Private key handle: {private_key}")

session.logout()
session.closeSession()
```

### Firma Digital con RSA-PSS

```python
"""
Firma RSA-PSS con HSM
"""

from PyKCS11 import *
import hashlib

pkcs11 = PyKCS11Lib()
pkcs11.load('/usr/lib/libCryptoki2_64.so')

slot = pkcs11.getSlotList(tokenPresent=True)[0]
session = pkcs11.openSession(slot, CKF_SERIAL_SESSION)
session.login("userpin123")

# Buscar clave privada
template = [(CKA_CLASS, CKO_PRIVATE_KEY), (CKA_LABEL, "MyRSAPrivateKey")]
private_key = session.findObjects(template)[0]

# Datos a firmar
data = b"Contract: Pay $1M to Bob on 2025-01-01"

# Hash de los datos (SHA-256)
digest = hashlib.sha256(data).digest()

# Configurar mechanism RSA-PSS
pss_params = CK_RSA_PKCS_PSS_PARAMS()
pss_params.hashAlg = CKM_SHA256
pss_params.mgf = CKG_MGF1_SHA256
pss_params.sLen = 32  # Salt length = hash length

mechanism = Mechanism(CKM_RSA_PKCS_PSS, pss_params)

# Firmar (single-part)
signature = session.sign(private_key, digest, mechanism)

print(f"Firma RSA-PSS: {signature.hex()}")

session.logout()
session.closeSession()
```

### Cifrado AES-GCM

```python
"""
Cifrado AES-GCM con HSM
"""

from PyKCS11 import *
import os

pkcs11 = PyKCS11Lib()
pkcs11.load('/usr/lib/libCryptoki2_64.so')

slot = pkcs11.getSlotList(tokenPresent=True)[0]
session = pkcs11.openSession(slot, CKF_SERIAL_SESSION | CKF_RW_SESSION)
session.login("userpin123")

# Generar clave AES 256-bit
aes_template = [
    (CKA_CLASS, CKO_SECRET_KEY),
    (CKA_KEY_TYPE, CKK_AES),
    (CKA_TOKEN, True),
    (CKA_PRIVATE, True),
    (CKA_SENSITIVE, True),
    (CKA_EXTRACTABLE, False),
    (CKA_ENCRYPT, True),
    (CKA_DECRYPT, True),
    (CKA_VALUE_LEN, 32),  # 256 bits
    (CKA_LABEL, "MyAESKey")
]

aes_key = session.generateKey(
    aes_template,
    mecha=Mechanism(CKM_AES_KEY_GEN, None)
)

# Datos a cifrar
plaintext = b"Top secret data: nuclear launch codes 12345"

# IV (nonce) aleatorio de 12 bytes (recomendado para GCM)
iv = os.urandom(12)

# AAD (Additional Authenticated Data)
aad = b"Transaction ID: 67890"

# Configurar GCM parameters
gcm_params = CK_GCM_PARAMS()
gcm_params.pIv = iv
gcm_params.ulIvLen = len(iv)
gcm_params.pAAD = aad
gcm_params.ulAADLen = len(aad)
gcm_params.ulTagBits = 128  # 128-bit authentication tag

mechanism = Mechanism(CKM_AES_GCM, gcm_params)

# Cifrar
ciphertext = session.encrypt(aes_key, plaintext, mechanism)

print(f"IV: {iv.hex()}")
print(f"Ciphertext + Tag: {bytes(ciphertext).hex()}")

# Descifrar
decrypted = session.decrypt(aes_key, ciphertext, mechanism)

print(f"Decrypted: {bytes(decrypted)}")

assert bytes(decrypted) == plaintext

session.logout()
session.closeSession()
```

---

## Gestión de Claves en HSM {#gestión-claves}

### Key Wrapping (Transporte de Claves)

El **Key Wrapping** permite exportar una clave sensible cifrada con otra clave (KEK - Key Encryption Key).

```python
"""
Key Wrapping con AES-KW (RFC 3394)
"""

from PyKCS11 import *

pkcs11 = PyKCS11Lib()
pkcs11.load('/usr/lib/libCryptoki2_64.so')

slot = pkcs11.getSlotList(tokenPresent=True)[0]
session = pkcs11.openSession(slot, CKF_SERIAL_SESSION | CKF_RW_SESSION)
session.login("userpin123")

# 1. Generar KEK (Key Encryption Key) - AES 256
kek_template = [
    (CKA_CLASS, CKO_SECRET_KEY),
    (CKA_KEY_TYPE, CKK_AES),
    (CKA_TOKEN, True),
    (CKA_SENSITIVE, True),
    (CKA_EXTRACTABLE, False),
    (CKA_WRAP, True),          # Puede wrap otras claves
    (CKA_UNWRAP, True),        # Puede unwrap claves
    (CKA_VALUE_LEN, 32),
    (CKA_LABEL, "KEK")
]

kek = session.generateKey(kek_template, mecha=Mechanism(CKM_AES_KEY_GEN, None))

# 2. Generar clave a exportar (DEK - Data Encryption Key)
dek_template = [
    (CKA_CLASS, CKO_SECRET_KEY),
    (CKA_KEY_TYPE, CKK_AES),
    (CKA_TOKEN, True),
    (CKA_SENSITIVE, True),
    (CKA_EXTRACTABLE, True),   # Permitir export via wrapping
    (CKA_ENCRYPT, True),
    (CKA_DECRYPT, True),
    (CKA_VALUE_LEN, 32),
    (CKA_LABEL, "DEK")
]

dek = session.generateKey(dek_template, mecha=Mechanism(CKM_AES_KEY_GEN, None))

# 3. Wrap DEK con KEK (exportar cifrado)
wrapped_key = session.wrapKey(kek, dek, mecha=Mechanism(CKM_AES_KEY_WRAP, None))

print(f"Wrapped key (hex): {bytes(wrapped_key).hex()}")
print(f"Wrapped key length: {len(wrapped_key)} bytes")

# 4. Unwrap (importar clave cifrada)
unwrap_template = [
    (CKA_CLASS, CKO_SECRET_KEY),
    (CKA_KEY_TYPE, CKK_AES),
    (CKA_TOKEN, False),        # No persistir (temporal)
    (CKA_SENSITIVE, True),
    (CKA_ENCRYPT, True),
    (CKA_DECRYPT, True),
    (CKA_LABEL, "DEK_Unwrapped")
]

unwrapped_key = session.unwrapKey(
    kek,
    wrapped_key,
    unwrap_template,
    mecha=Mechanism(CKM_AES_KEY_WRAP, None)
)

print(f"Key unwrapped successfully: handle={unwrapped_key}")

session.logout()
session.closeSession()
```

### Backup y Recuperación de Claves

Los HSMs ofrecen mecanismos de backup seguros:

#### 1. M of N Key Share (Shamir Secret Sharing)

```
Clave maestra del HSM se divide en N shares
Se requieren M shares para reconstruir la clave

Ejemplo: 5 of 7
- 7 shares totales
- Se necesitan 5 shares para recuperar
- Cada share se entrega a un custodio diferente
- Almacenamiento: cajas fuertes en ubicaciones geográficas distintas
```

#### 2. Backup a Otro HSM

```python
# Proceso de backup HSM-to-HSM:
# 1. Wrap todas las claves con una KEK común
# 2. Exportar wrapped keys
# 3. Importar (unwrap) en HSM de backup
# 4. Verificar que las operaciones producen mismos resultados
```

#### 3. Cloning (Solo para HSMs que lo soportan)

Algunos HSMs (ej. Thales Luna) permiten clonar particiones completas de un HSM a otro usando un protocolo seguro sobre TLS.

---

## HSM en la Nube (Cloud HSM) {#cloud-hsm}

### AWS CloudHSM

**Arquitectura**:
```
┌──────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              VPC (Customer)                            │ │
│  │                                                        │ │
│  │  ┌──────────────┐         ┌──────────────┐           │ │
│  │  │   EC2 App    │         │   EC2 App    │           │ │
│  │  │              │         │              │           │ │
│  │  │ PKCS#11 CLI  │         │ PKCS#11 CLI  │           │ │
│  │  └──────┬───────┘         └──────┬───────┘           │ │
│  │         │                        │                   │ │
│  │         │  ┌─────────────────────┘                   │ │
│  │         │  │                                         │ │
│  │         ▼  ▼                                         │ │
│  │  ┌──────────────────────────────────┐               │ │
│  │  │    CloudHSM Client Daemon        │               │ │
│  │  │  (Load balancer for HSM cluster) │               │ │
│  │  └─────────────┬────────────────────┘               │ │
│  │                │                                     │ │
│  └────────────────┼─────────────────────────────────────┘ │
│                   │                                       │
│  ┌────────────────▼─────────────────────────────────────┐ │
│  │          CloudHSM Cluster (HA)                       │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│ │
│  │  │ HSM Instance │  │ HSM Instance │  │ HSM Inst.  ││ │
│  │  │  (AZ-1)      │  │  (AZ-2)      │  │  (AZ-3)    ││ │
│  │  │ FIPS 140-2   │  │ FIPS 140-2   │  │ FIPS 140-2 ││ │
│  │  │  Level 3     │  │  Level 3     │  │  Level 3   ││ │
│  │  └──────────────┘  └──────────────┘  └────────────┘│ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Características**:
- **Hardware**: Dedicated Thales Luna HSM 7
- **Certificación**: FIPS 140-2 Level 3
- **Interfaces**: PKCS#11, JCE, MS CNG
- **Pricing**: $1.45/hora por HSM ($1,088/mes) + cross-AZ transfer
- **HA**: Cluster de múltiples HSMs en diferentes AZs

**Ejemplo de uso**:

```bash
# Instalar CloudHSM Client
wget https://s3.amazonaws.com/cloudhsmv2-software/CloudHsmClient/EL7/cloudhsm-client-latest.el7.x86_64.rpm
sudo yum install cloudhsm-client-latest.el7.x86_64.rpm

# Configurar cliente
sudo /opt/cloudhsm/bin/configure -a <HSM_IP>

# Iniciar daemon
sudo start cloudhsm-client

# Usar vía PKCS#11
export PKCS11_LIB=/opt/cloudhsm/lib/libcloudhsm_pkcs11.so
```

### Azure Dedicated HSM

**Características**:
- **Hardware**: Thales SafeNet Luna Network HSM 7
- **Certificación**: FIPS 140-2 Level 3
- **Deployment**: Injected into customer VNet
- **Pricing**: $5,900/mes + data transfer

### Google Cloud HSM

**Características**:
- **Hardware**: Managed service (hardware no revelado)
- **Certificación**: FIPS 140-2 Level 3
- **Interface**: Cloud KMS API (REST, no PKCS#11 directamente)
- **Pricing**: Incluido en Cloud KMS pricing

---

## Integración de HSM con PKI {#integración-pki}

### OpenSSL con HSM (PKCS#11 Engine)

```bash
# Instalar engine PKCS#11 para OpenSSL
sudo apt-get install libengine-pkcs11-openssl

# Configurar OpenSSL para usar HSM
cat >> openssl-hsm.cnf <<EOF
openssl_conf = openssl_init

[openssl_init]
engines = engine_section

[engine_section]
pkcs11 = pkcs11_section

[pkcs11_section]
engine_id = pkcs11
dynamic_path = /usr/lib/x86_64-linux-gnu/engines-1.1/pkcs11.so
MODULE_PATH = /usr/lib/libCryptoki2_64.so
init = 0
EOF

# Generar CSR con clave privada en HSM
openssl req -new -engine pkcs11 -keyform engine \
  -key "pkcs11:token=MyToken;object=MyRSAPrivateKey;type=private" \
  -out server.csr \
  -config openssl-hsm.cnf \
  -subj "/C=US/O=Example/CN=example.com"

# Firmar certificado con CA en HSM
openssl ca -config ca-hsm.cnf -engine pkcs11 \
  -keyfile "pkcs11:token=CAToken;object=CAPrivateKey;type=private" \
  -keyform engine \
  -in server.csr \
  -out server.crt
```

### EJBCA con HSM

**EJBCA** (Enterprise Java Beans Certificate Authority) soporta HSMs vía PKCS#11 (JCA/JCE).

```bash
# Configurar EJBCA para usar HSM
# En /opt/ejbca/conf/cesecore.properties

# PKCS#11 library
cryptotoken.p11.lib.0.name=Luna
cryptotoken.p11.lib.0.file=/usr/lib/libCryptoki2_64.so

# Slot
pkcs11.slotlistindex=0

# PIN (o usar HSM with PED)
pkcs11.pin=userpin123

# Crear Crypto Token en EJBCA
# Admin Web -> Crypto Tokens -> Create New
# - Type: PKCS#11
# - Library: Luna
# - Slot reference: 0
# - Authentication code: userpin123

# Generar claves en HSM
# Admin Web -> Crypto Tokens -> Luna -> Generate Key Pair
# - Key Algorithm: RSA 2048
# - Key Alias: CASignKey
```

### Microsoft CA con HSM

```powershell
# Instalar rol de CA
Install-WindowsFeature AD-Certificate -IncludeManagementTools

# Configurar CA para usar HSM (Thales Luna)
# 1. Instalar Luna CSP (Cryptographic Service Provider)
# 2. Durante CA setup, seleccionar "Use existing private key"
# 3. Select CSP: "Luna Cryptographic Services for Microsoft Windows"
# 4. Seleccionar clave en HSM
```

---

## Casos de Uso Empresariales {#casos-uso}

### 1. Root CA en HSM

```
Caso: Implementar Root CA con clave privada en HSM

Requisitos:
- HSM FIPS 140-2 Level 3 (Thales Luna, nShield)
- Air-gapped (sin conexión de red)
- Dual control (2 personas para operaciones)
- Audit logging

Proceso:
1. Generar par de claves RSA 4096 en HSM (CKA_EXTRACTABLE=FALSE)
2. Crear certificado autofirmado Root CA
3. Firmar Intermediate CA CSRs (ceremonia, logged)
4. Apagar HSM y almacenar en vault físico
5. Backups: M-of-N key shares en cajas fuertes geográficamente distribuidas
```

### 2. Code Signing para Software

```
Caso: Firma de código para distribución de software

Requisitos:
- EV Code Signing Certificate (Extended Validation)
- Clave privada en HSM (requerido por CA/Browser Forum)
- Integración con CI/CD pipeline

Flujo:
1. Desarrollador commit código a Git
2. CI/CD (Jenkins/GitLab) builds binario
3. CI/CD llama a HSM vía PKCS#11 para firmar
   - Authenticación: API key + IP whitelisting
   - HSM sign binario con clave de Code Signing
4. Binario firmado se publica en CDN
5. Usuarios verifican firma antes de ejecutar
```

### 3. Payment Processing (PCI-DSS)

```
Caso: Procesamiento de tarjetas de crédito

Requisitos:
- Payment HSM (Thales payShield, Utimaco CryptoServer)
- Cumplimiento PCI-DSS 3.2.1
- PIN encryption, tokenización

Operaciones:
- Derivar PIN encryption keys (DUKPT)
- Verificar PIN (compare encrypted PIN with reference)
- Tokenize PAN (Primary Account Number)
- Generate/verify CVV/CVV2
- MAC generation/verification para transacciones
```

### 4. TLS/SSL Acceleration

```
Caso: Offload de operaciones TLS a HSM para web servers de alto tráfico

Configuración:
- Nginx/Apache con mod_ssl + engine_pkcs11
- Clave privada de TLS en HSM
- HSM handle RSA/ECDH handshakes

Beneficio:
- Rendimiento: HSM puede hacer 1,000-10,000 RSA ops/sec
- Seguridad: Clave privada nunca en RAM del servidor
- Cumplimiento: FIPS 140-2 certificado
```

---

## Mejores Prácticas {#mejores-prácticas}

### Seguridad

1. **Dual Control**: Requerir 2+ personas para operaciones críticas (M-of-N)
2. **Role Separation**: SO (Security Officer) vs. User roles
3. **Audit Logging**: Habilitar todos los logs, exportar a SIEM
4. **Firmware Updates**: Mantener HSM actualizado, seguir security bulletins
5. **Physical Security**: HSM en datacenter con acceso controlado, cámaras, logging

### Operaciones

6. **Backup Regular**: Backups mensuales/trimestrales con M-of-N
7. **Disaster Recovery**: Procedimiento documentado y testeado anualmente
8. **Monitoring**: Alertas de fallos de hardware, intentos de manipulación
9. **Load Balancing**: Cluster de HSMs en activo-activo para HA
10. **Key Lifecycle**: Rotación regular (Root CA: never, Intermediate: 5-10 años, TLS: anual)

### Performance

11. **Session Pooling**: Reusar sesiones PKCS#11 en vez de abrir/cerrar constantemente
12. **Batch Operations**: Agrupar operaciones cuando sea posible
13. **Caching**: Cachear claves públicas, no requieren HSM
14. **Algoritmos Eficientes**: Preferir ECDSA sobre RSA para mejor rendimiento

### Cumplimiento

15. **FIPS Mode**: Habilitar modo FIPS 140-2 en HSM
16. **Algoritmos Aprobados**: Solo usar algoritmos aprobados por FIPS/NIST
17. **Documentación**: Mantener Certificate Policy (CP) y CPS actualizado
18. **Auditorías**: Auditorías anuales de cumplimiento (PCI-DSS, SOC 2, ISO 27001)

---

## Referencias {#referencias}

### Standards

- **PKCS#11 v2.40** - Cryptographic Token Interface Standard (OASIS)
- **FIPS 140-2** - Security Requirements for Cryptographic Modules (NIST)
- **FIPS 140-3** - Security Requirements for Cryptographic Modules (ISO/IEC 19790:2012)
- **Common Criteria** - ISO/IEC 15408

### RFCs

- **RFC 3394** - Advanced Encryption Standard (AES) Key Wrap Algorithm
- **RFC 5649** - Advanced Encryption Standard (AES) Key Wrap with Padding Algorithm

### Libros

- Menezes, A., van Oorschot, P., & Vanstone, S. (1996). *Handbook of Applied Cryptography*. CRC Press. (Chapter 13: Key Management)
- Ramsdell, B., & Turner, S. (2010). *Secure/Multipurpose Internet Mail Extensions (S/MIME)*. RFC 5751.

### Documentación de Fabricantes

- **Thales Luna HSM**: https://thalesdocs.com/gphsm/luna/
- **Entrust nShield**: https://www.entrust.com/digital-security/hsm/products/nshield-hsms
- **Utimaco**: https://hsm.utimaco.com/
- **AWS CloudHSM**: https://docs.aws.amazon.com/cloudhsm/
- **Azure Dedicated HSM**: https://docs.microsoft.com/azure/dedicated-hsm/

### Open Source

- **PyKCS11**: https://github.com/LudovicRousseau/PyKCS11
- **SoftHSMv2**: https://github.com/opendnssec/SoftHSMv2 (HSM emulator para testing)
- **OpenSC**: https://github.com/OpenSC/OpenSC (Smart card tools + PKCS#11)

### Payment HSM

- **PCI PTS HSM v3.0** - Payment Card Industry - PIN Transaction Security - Hardware Security Module Requirements

---

## Conclusión

Los HSMs son componentes críticos en infraestructuras de seguridad empresariales, proporcionando:

- **Seguridad física** contra extracción de claves
- **Certificación FIPS** para cumplimiento regulatorio
- **Alto rendimiento** para operaciones criptográficas a escala
- **Gestión de ciclo de vida** de claves con protección end-to-end

PKCS#11 es el estándar de facto para interfaz con HSMs, ofreciendo:
- **Interoperabilidad** entre diferentes fabricantes
- **API completa** para todas las operaciones criptográficas
- **Soporte multi-plataforma** (C, Java, Python, Go)

Para producción, considerar:
- **On-Premise HSM** si se requiere control total y FIPS 140-2 Level 4
- **Cloud HSM dedicado** (AWS CloudHSM, Azure Dedicated HSM) para FIPS Level 3 en cloud
- **Managed KMS** (AWS KMS, Azure Key Vault, GCP KMS) para simplicity y menor costo
