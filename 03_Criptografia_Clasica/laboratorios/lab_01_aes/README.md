# LAB 03.1: IMPLEMENTACIÓN DE AES

**Duración**: 45 minutos
**Nivel**: Básico-Intermedio
**Prerequisitos**: Conocimientos básicos de Python, conceptos de cifrado simétrico

---

## Índice

1. [Introducción](#introducción)
   - [¿Qué es AES?](#-qué-es-aes)
   - [¿Por qué AES?](#-por-qué-aes)
   - [¿Para qué se usa AES?](#-para-qué-se-usa-aes)
2. [Casos Reales](#-casos-reales)
3. [Modos de Operación](#-modos-de-operación)
4. [Implementación Práctica](#código-completo---aes-256-gcm)
5. [Ejercicios](#ejercicios-expandidos)
6. [Comparativa de Algoritmos](#-comparativa-de-algoritmos)
7. [Referencias](#-referencias)

---

## Introducción

### 📖 ¿QUÉ ES AES?

**AES (Advanced Encryption Standard)**, también conocido por su nombre original **Rijndael**, es el estándar de cifrado simétrico más utilizado en el mundo. Fue adoptado por el NIST (National Institute of Standards and Technology) como estándar federal de procesamiento de información (FIPS 197) en noviembre de 2001.

**Características principales**:

- **Tipo**: Cifrado por bloques simétrico
- **Tamaño de bloque**: 128 bits (16 bytes) - FIJO
- **Tamaños de clave**: 128, 192, o 256 bits (AES-128, AES-192, AES-256)
- **Estructura**: Red de sustitución-permutación (SPN - Substitution-Permutation Network)
- **Rondas**:
  - 10 rondas para AES-128
  - 12 rondas para AES-192
  - 14 rondas para AES-256

**Proceso interno de cifrado (simplificado)**:

```
┌─────────────────────────────────────────────────────┐
│ Plaintext (128 bits / 16 bytes)                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ AddRoundKey (XOR con subkey inicial)                │
└────────────────┬────────────────────────────────────┘
                 │
       ┌─────────▼─────────┐
       │ Ronda 1 ... N-1:  │
       │ - SubBytes        │ ← S-Box (sustitución)
       │ - ShiftRows       │ ← Permutación de filas
       │ - MixColumns      │ ← Difusión de columnas
       │ - AddRoundKey     │ ← XOR con subkey
       └─────────┬─────────┘
                 │
┌─────────────────────────────────────────────────────┐
│ Ronda final (sin MixColumns):                       │
│ - SubBytes                                          │
│ - ShiftRows                                         │
│ - AddRoundKey                                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Ciphertext (128 bits / 16 bytes)                    │
└─────────────────────────────────────────────────────┘
```

**Origen del nombre "Rijndael"**:
- Creado por **Vincent Rijmen** y **Joan Daemen** (criptógrafos belgas)
- Nombre = Combinación de sus apellidos: **Rijmen** + **Daemen**
- Presentado en la competencia NIST AES en 1997

**Matemática subyacente**:
AES opera en el **campo finito GF(2^8)** (Galois Field), usando polinomios sobre GF(2). Cada byte se representa como un polinomio de grado 7:

```
Byte 0x57 = 01010111₂ = x⁶ + x⁴ + x² + x + 1
```

Las operaciones MixColumns usan multiplicación en este campo con un polinomio irreducible:
```
m(x) = x⁸ + x⁴ + x³ + x + 1
```

### 🤔 ¿POR QUÉ AES?

AES surgió como solución a las debilidades de su predecesor, DES (Data Encryption Standard).

**Timeline histórico**:

| Año | Evento | Impacto |
|-----|--------|---------|
| **1977** | DES adoptado como estándar federal (FIPS 46) | Clave de 56 bits considerada segura en ese momento |
| **1993** | Primer ataque teórico a DES (criptoanálisis diferencial) | Demostró debilidades estructurales |
| **1998** | **EFF DES Cracker** rompe DES en **56 horas** (fuerza bruta) | DES oficialmente obsoleto |
| **1997** | NIST anuncia competencia para sucesor de DES (AES) | 15 candidatos iniciales de todo el mundo |
| **1999** | 5 finalistas: Rijndael, Serpent, Twofish, RC6, MARS | Evaluación pública de seguridad y rendimiento |
| **2000** | **Rijndael seleccionado como ganador** | Mejor balance velocidad/seguridad/flexibilidad |
| **2001** | AES publicado como FIPS 197 | Estándar oficial de EEUU |
| **2002-hoy** | Adopción mundial en TLS, VPNs, disk encryption | Estándar de facto global |

**¿Por qué Rijndael ganó?**

```
┌──────────────────────────────────────────────────────────┐
│ Criterios de evaluación NIST (orden de importancia):    │
├──────────────────────────────────────────────────────────┤
│ 1. SEGURIDAD                                             │
│    - Resistencia a criptoanálisis conocido               │
│    - Margen de seguridad (rounds de sobra)               │
│    ✓ Rijndael: Sin ataques prácticos conocidos          │
│                                                          │
│ 2. RENDIMIENTO                                           │
│    - Velocidad en software (CPUs típicas)                │
│    - Velocidad en hardware (ASICs, FPGAs)                │
│    ✓ Rijndael: Más rápido que Serpent, comparable a RC6 │
│                                                          │
│ 3. EFICIENCIA                                            │
│    - Consumo de RAM                                      │
│    - Tamaño de código                                    │
│    ✓ Rijndael: Footprint pequeño, ideal para embedded   │
│                                                          │
│ 4. FLEXIBILIDAD                                          │
│    - Soporte múltiples tamaños de clave/bloque           │
│    ✓ Rijndael: Soportaba 128/192/256 bits desde inicio  │
│                                                          │
│ 5. SIMPLICIDAD                                           │
│    - Facilidad de implementación                         │
│    - Análisis criptográfico                              │
│    ✓ Rijndael: Estructura clara, fácil de analizar      │
└──────────────────────────────────────────────────────────┘
```

**Problemas que resolvió**:

1. **DES roto por fuerza bruta**:
   - DES: 56 bits → 2^56 = 72 cuatrillones de claves (factible en 1998)
   - AES-128: 128 bits → 2^128 = 340 undecillones de claves (inviable)
   - AES-256: 256 bits → 2^256 = computacionalmente imposible incluso para computadoras cuánticas (post-quantum security parcial)

2. **3DES demasiado lento**:
   - 3DES = Aplicar DES 3 veces (encrypt-decrypt-encrypt)
   - 3× overhead en rendimiento
   - AES-128: **10-15× más rápido** que 3DES en software moderno
   - Con AES-NI (instrucciones de hardware): **50-100× más rápido**

3. **Meet-in-the-middle attack**:
   - 2DES no ofrece 112 bits de seguridad, solo ~57 bits (MITM)
   - AES diseñado para resistir MITM y ataques relacionados

**Comparativa DES vs 3DES vs AES**:

| Característica | DES | 3DES | AES-128 | AES-256 |
|----------------|-----|------|---------|---------|
| Tamaño clave efectiva | 56 bits | 112/168 bits | 128 bits | 256 bits |
| Tamaño bloque | 64 bits | 64 bits | 128 bits | 128 bits |
| Seguridad en 2024 | ❌ Roto | ⚠️ Deprecated | ✅ Seguro | ✅ Muy seguro |
| Velocidad (software) | 1× | 0.3× | 10× | 8× |
| Velocidad (AES-NI) | N/A | N/A | 100× | 80× |
| Resistencia cuántica | ❌ No | ❌ No | ⚠️ Parcial (Grover) | ✅ Buena (Grover) |

**Ataque de Grover (computación cuántica)**:
- Algoritmo cuántico reduce complejidad de búsqueda de clave a **√N**
- AES-128: 2^128 → 2^64 (preocupante para largo plazo)
- AES-256: 2^256 → 2^128 (seguro incluso post-quantum)
- Por eso NSA recomienda AES-256 para datos "TOP SECRET"

### 🎯 ¿PARA QUÉ SE USA AES?

AES es **ubicuo** en la seguridad informática moderna. Si usas internet, estás usando AES docenas de veces al día sin saberlo.

**1. Comunicaciones seguras (TLS/SSL - HTTPS)**

Cuando ves el candado 🔒 en tu navegador:

```
Cliente                                  Servidor
  │                                         │
  ├─ ClientHello ────────────────────────→ │
  │  (cipher suites soportados)             │
  │                                         │
  │ ←──────────────────── ServerHello ─────┤
  │        (selecciona TLS_AES_128_GCM)     │
  │                                         │
  ├─ [Handshake con RSA/ECDHE]              │
  │                                         │
  ├─ [Derivación de session key]            │
  │                                         │
  ├═ Todo el tráfico cifrado con AES-GCM ═→│
  │  (HTTP requests, cookies, passwords)    │
  │                                         │
  │←═ Respuestas cifradas con AES-GCM ═════┤
  │  (HTML, JSON, imágenes, etc.)           │
```

**Cipher suites más comunes en TLS 1.3** (2024):
- `TLS_AES_128_GCM_SHA256` (más usado, balance velocidad/seguridad)
- `TLS_AES_256_GCM_SHA384` (máxima seguridad)
- `TLS_CHACHA20_POLY1305_SHA256` (móviles sin AES-NI)

**2. VPNs (Virtual Private Networks)**

```
┌────────────────────────────────────────────────────┐
│ Protocolo VPN    │ Cifrado usado                   │
├──────────────────┼─────────────────────────────────┤
│ IPsec/IKEv2      │ AES-GCM-256 (ESP)               │
│ OpenVPN          │ AES-256-CBC/GCM (configurable)  │
│ WireGuard        │ ChaCha20-Poly1305 (default)     │
│                  │ AES-256-GCM (opcional)          │
│ Cisco AnyConnect │ AES-256-GCM                     │
│ Windows VPN      │ AES-256-CBC (legacy)            │
└──────────────────┴─────────────────────────────────┘
```

**Ejemplo de paquete VPN**:
```
┌─────────────────────────────────────────┐
│ IP Header (sin cifrar)                  │
├─────────────────────────────────────────┤
│ ESP Header (IPsec)                      │
├─────────────────────────────────────────┤
│ ╔═══════════════════════════════════╗   │
│ ║ IP interno (cifrado con AES)      ║   │
│ ║ TCP/UDP (cifrado)                 ║   │
│ ║ Datos de aplicación (cifrado)     ║   │
│ ╚═══════════════════════════════════╝   │
├─────────────────────────────────────────┤
│ Authentication Tag (GCM)                │
└─────────────────────────────────────────┘
```

**3. Cifrado de disco (Full Disk Encryption)**

Cuando enciendes tu computadora:

```
┌────────────────────────────────────────────────────────┐
│ Sistema operativo │ Tecnología          │ Cifrado      │
├───────────────────┼─────────────────────┼──────────────┤
│ Windows 10/11     │ BitLocker           │ AES-128-XTS  │
│ macOS             │ FileVault 2         │ AES-128-XTS  │
│ Linux             │ LUKS (dm-crypt)     │ AES-256-XTS  │
│ Android           │ FBE (File-Based)    │ AES-256-XTS  │
│ iOS               │ Data Protection     │ AES-256-XTS  │
│ VeraCrypt         │ Contenedores        │ AES-256-XTS  │
│ Samsung phones    │ Knox                │ AES-256-XTS  │
└───────────────────┴─────────────────────┴──────────────┘
```

**Modo XTS (XEX-based Tweaked CodeBook)**:
- Diseñado específicamente para disk encryption
- Cada sector del disco tiene un "tweak" único (previene ataques)
- Usado en lugar de CBC/GCM porque permite acceso aleatorio rápido

**Rendimiento con AES-NI**:
```
Sin AES-NI:  ~100-200 MB/s   (lento, uso intensivo de CPU)
Con AES-NI:  ~2000-5000 MB/s (casi sin overhead)
```

**4. WiFi (WPA2/WPA3)**

Tu conexión WiFi doméstica/corporativa:

```
┌─────────────────────────────────────────────────────┐
│ Protocolo  │ Año  │ Cifrado              │ Estado   │
├────────────┼──────┼──────────────────────┼──────────┤
│ WEP        │ 1997 │ RC4                  │ ❌ ROTO  │
│ WPA        │ 2003 │ TKIP (RC4 mejorado)  │ ❌ ROTO  │
│ WPA2       │ 2004 │ AES-128-CCM (CCMP)   │ ✅ Seguro│
│ WPA3       │ 2018 │ AES-128-GCM (GCMP)   │ ✅ Mejor │
└────────────┴──────┴──────────────────────┴──────────┘
```

**CCMP (Counter Mode with CBC-MAC Protocol)**:
- Usado en WPA2
- Combina CTR mode (cifrado) + CBC-MAC (autenticación)
- Cada paquete WiFi cifrado individualmente con AES

**GCMP (Galois/Counter Mode Protocol)**:
- Usado en WPA3
- Más rápido que CCMP (usa GCM en lugar de CBC-MAC)
- Mejor para WiFi 6/6E (mayor throughput)

**5. Mensajería cifrada**

```
┌──────────────────────────────────────────────────────┐
│ App         │ Protocolo │ Cifrado de mensajes        │
├─────────────┼───────────┼────────────────────────────┤
│ Signal      │ Signal    │ AES-256-CBC + HMAC-SHA256  │
│ WhatsApp    │ Signal    │ AES-256-CBC + HMAC-SHA256  │
│ Telegram    │ MTProto   │ AES-256-IGE (inseguro!)    │
│ iMessage    │ Propietary│ AES-128-CTR + HMAC-SHA256  │
│ Wire        │ Proteus   │ AES-256-CBC                │
└─────────────┴───────────┴────────────────────────────┘
```

**Nota**: Signal Protocol es el estándar de oro (usado por WhatsApp, Signal, FB Messenger)

**6. Bases de datos**

Cifrado transparente de datos (TDE):

```sql
-- SQL Server
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE MyServerCert;

-- MySQL
ALTER TABLE usuarios ENCRYPTION='Y' ENCRYPTION_KEY_ID=1;
-- Usa AES-256-CBC internamente

-- PostgreSQL (con pgcrypto)
SELECT pgp_sym_encrypt('datos sensibles', 'password',
                       'cipher-algo=aes256');
```

**7. Almacenamiento en la nube**

```
┌─────────────────────────────────────────────────────┐
│ Servicio      │ Cifrado en reposo                   │
├───────────────┼─────────────────────────────────────┤
│ AWS S3        │ AES-256-GCM (SSE-S3/SSE-KMS)        │
│ Google Cloud  │ AES-256-GCM                         │
│ Azure Storage │ AES-256-GCM                         │
│ Dropbox       │ AES-256-GCM                         │
│ iCloud        │ AES-128 (metadata), AES-256 (files) │
└───────────────┴─────────────────────────────────────┘
```

**8. Otros usos**:
- **Contenedores Docker**: secretos cifrados con AES
- **Git-crypt**: cifrado de archivos en repos Git
- **Password managers**: 1Password, Bitwarden, LastPass (AES-256-GCM)
- **Archivos ZIP/RAR**: AES-256 (desde WinZip 9.0)
- **PDFs protegidos**: AES-128/256 (Adobe Acrobat)
- **Bluetooth**: AES-CCM (desde Bluetooth 4.0)

**Estimación de uso diario**:
Un usuario promedio usa AES:
- 50-100 veces navegando web (HTTPS)
- 10-20 veces en mensajería (WhatsApp, Signal)
- 1 vez al desbloquear el teléfono (disk encryption)
- 5-10 veces en apps bancarias
- **Total: ~100-200 operaciones AES al día**

---

## 🔍 CASOS REALES

### Caso 1: NSA Suite B Cryptography (2005-2015)

**¿Qué fue NSA Suite B?**

En **agosto de 2005**, la NSA (National Security Agency) de EEUU publicó **Suite B**, un conjunto de algoritmos criptográficos de **dominio público** aprobados para proteger información clasificada del gobierno estadounidense.

**Componentes de Suite B**:
```
┌──────────────────────────────────────────────────────┐
│ Función              │ Algoritmo aprobado            │
├──────────────────────┼───────────────────────────────┤
│ Cifrado simétrico    │ AES-128, AES-256              │
│ Firma digital        │ ECDSA (P-256, P-384)          │
│ Key exchange         │ ECDH (P-256, P-384)           │
│ Hashing              │ SHA-256, SHA-384              │
└──────────────────────┴───────────────────────────────┘
```

**Niveles de clasificación**:

| Nivel de seguridad | Algoritmos requeridos | Uso |
|--------------------|-----------------------|-----|
| **SECRET** | AES-128, ECDSA P-256, SHA-256 | Documentos clasificados estándar |
| **TOP SECRET** | AES-256, ECDSA P-384, SHA-384 | Información de máxima sensibilidad |

**¿Por qué fue importante?**

1. **Primera vez que NSA aprobó criptografía pública**: Antes usaban algoritmos clasificados (Type 1, Type 2)
2. **Validación de AES**: Si la NSA confía en AES-256 para TOP SECRET, es **suficientemente seguro**
3. **Interoperabilidad**: Permitió a contratistas/aliados usar los mismos algoritmos

**¿Qué pasó después?**

En **agosto de 2015**, la NSA anunció el **reemplazo de Suite B** con **Suite B Transition** (preparación para criptografía post-cuántica), pero **AES-256 permanece aprobado**:

```
2005: Suite B lanzado (AES-128/256)
2015: Anuncio de transición a post-quantum
2022: NIST selecciona Kyber (key exchange) + Dilithium (signatures)
2024: AES-256 sigue siendo estándar para cifrado simétrico
```

**Conclusión**: Incluso con computación cuántica en el horizonte, **AES-256 se considera seguro** (Grover solo reduce a 2^128 complejidad).

**Referencia**:
- NSA Suite B Fact Sheet (archivado)
- CNSS Policy 15: "Use of AES for National Security Systems"

---

### Caso 2: Heartbleed y AES-GCM (2014)

**CVE-2014-0160 - Heartbleed**

**¿Qué fue Heartbleed?**

En **abril de 2014** se descubrió una vulnerabilidad catastrófica en **OpenSSL** (librería criptográfica más usada del mundo):

```
┌────────────────────────────────────────────────────┐
│ Heartbeat Request (TLS extension):                │
│ "Envíame de vuelta 'HOLA' (longitud: 4 bytes)"    │
│                                                    │
│ Servidor responde: "HOLA"                         │
└────────────────────────────────────────────────────┘

ATAQUE HEARTBLEED:
┌────────────────────────────────────────────────────┐
│ Heartbeat Request MALICIOSO:                       │
│ "Envíame de vuelta 'HOLA' (longitud: 65535 bytes)"│
│                                                    │
│ Servidor responde:                                │
│ "HOLA" + 65531 bytes DE MEMORIA RANDOM            │
│  ↓                                                 │
│ Puede contener:                                   │
│ - Claves privadas RSA                             │
│ - Session keys de AES                             │
│ - Cookies de usuarios                             │
│ - Passwords en plaintext                          │
└────────────────────────────────────────────────────┘
```

**Impacto en AES**:

Aunque **AES como algoritmo no fue vulnerable**, las **claves de sesión AES-GCM** podían filtrarse:

```c
// Memoria del servidor (simplificado)
char memory[] = {
    // ... otros datos ...
    0x2A, 0x3F, 0x1B, ...  // ← Session key AES-GCM (256 bits)
    // ... más datos ...
};

// Heartbleed podía leer esto sin autenticación
```

**Timeline**:
```
2012-03-14: Bug introducido en OpenSSL 1.0.1
2014-04-01: Google Security descubre Heartbleed
2014-04-07: Divulgación pública (CVE-2014-0160)
2014-04-08: 17% de servidores HTTPS vulnerables (~500,000)
2014-04-15: 85% parcheados
2024:       Aún ~30,000 servidores vulnerables
```

**Servidores afectados**:
- Yahoo! Mail
- Canadian Revenue Agency (robaron 900 números de seguro social)
- Community Health Systems (robo de 4.5M registros médicos)

**Lecciones aprendidas**:

1. **AES-GCM es seguro**, pero las **claves deben protegerse en memoria**
2. **Perfect Forward Secrecy (PFS)** limita el daño:
   - Con PFS (ECDHE): Robar session key solo compromete esa sesión
   - Sin PFS (RSA): Robar private key descifra TODO el tráfico grabado

3. **Post-Heartbleed**: TLS 1.3 **requiere PFS**, haciendo ataques de memoria menos dañinos

**Mitigación moderna**:
```python
# Limpieza segura de claves en Python (post-Heartbleed)
import secrets
from cryptography.hazmat.primitives import constant_time

key = secrets.token_bytes(32)  # Genera clave AES-256

# Usar clave...

# Limpiar memoria (en C/Rust más garantizado)
del key  # En Python, depende del GC
```

**Referencia**:
- CVE-2014-0160
- Paper: "The Heartbleed Bug" (Zakir Durumeric et al., 2014)

---

### Caso 3: Apple vs FBI - San Bernardino iPhone (2016)

**United States v. Apple Inc. (C.D. Cal. 2016)**

**Contexto**:

En **diciembre de 2015**, un tiroteo en San Bernardino (California) dejó 14 muertos. Los atacantes tenían un **iPhone 5C** bloqueado. El FBI pidió a Apple desbloquear el dispositivo.

**¿Por qué no podían hackearlo?**

```
┌───────────────────────────────────────────────────┐
│ Protecciones de iOS (iPhone 5C, iOS 9):          │
├───────────────────────────────────────────────────┤
│ 1. Cifrado de disco: AES-256-XTS                  │
│    - Clave derivada de:                           │
│      * Passcode del usuario (4-6 dígitos)         │
│      * UID key (única por dispositivo, en Secure  │
│        Enclave, no extraíble)                     │
│                                                   │
│ 2. Límite de intentos:                            │
│    - 10 intentos fallidos → Auto-wipe             │
│    - Delay exponencial entre intentos             │
│                                                   │
│ 3. Derivación lenta de clave:                     │
│    - PBKDF2 con 10,000+ iteraciones               │
│    - ~80ms por intento                            │
│                                                   │
│ RESULTADO: Fuerza bruta inviable                  │
└───────────────────────────────────────────────────┘
```

**Matemática del cifrado**:

```
Clave AES-256 = PBKDF2-HMAC-SHA256(
    passcode || UID_key,
    salt=device_id,
    iterations=10000
)

Datos cifrados = AES-256-XTS(datos, clave)
```

**Timeline legal**:

```
2015-12-02: Tiroteo de San Bernardino
2016-02-16: Juez ordena a Apple crear "GovtOS" (backdoor)
2016-02-17: Tim Cook publica carta abierta rechazando
2016-03-21: FBI retira demanda (contrató a Cellebrite por $1M)
2016-04-14: FBI confirma acceso exitoso
```

**¿Cómo lo desbloquearon?**

Nunca se reveló oficialmente, pero teorías:

1. **NAND mirroring**:
   ```
   1. Decap chip NAND (almacenamiento)
   2. Copiar contenido antes de cada intento
   3. Restaurar copia si falla
   4. Bypass del contador de intentos
   ```

2. **Exploit de bootloader**:
   - Vulnerabilidad en BootROM (iPhone 5C no tiene Secure Enclave)
   - Permitió cargar firmware modificado sin verificación

**¿AES fue roto? NO**:
- El cifrado AES-256 **nunca fue atacado**
- La debilidad fue en **la implementación del sistema** (passcode débil, vulnerabilidades de software)
- Con passcode alfanumérico fuerte (ejemplo: 12 caracteres), sería inviable incluso con bypass

**Lecciones**:

1. **AES es seguro, pero las claves débiles no**:
   - Passcode 4 dígitos = 10,000 combinaciones (fácil con bypass)
   - Passcode 12 caracteres = 62^12 ≈ 3×10^21 combinaciones (inviable)

2. **Secure Enclave importa**:
   - iPhone 5S+ tienen Secure Enclave (procesador dedicado)
   - Hace derivación de clave en hardware aislado
   - No extraíble incluso con NAND mirroring

3. **Cifrado end-to-end perfecto sin clave fuerte = inútil**

**Impacto legislativo**:
- Debate público sobre "backdoors" en cifrado
- Apple implementó **USB Restricted Mode** (iOS 12+): puerto Lightning bloqueado tras 1 hora sin unlock

**Referencia**:
- Apple's Letter to Customers (Feb 2016)
- Paper: "Keys Under Doormats" (Abelson et al., 2015)

---

### Caso 4: WhatsApp cifrado end-to-end (2016-hoy)

**WhatsApp + Signal Protocol = AES a escala masiva**

En **abril de 2016**, WhatsApp (propiedad de Facebook/Meta) implementó **cifrado end-to-end por defecto** usando el **Signal Protocol** para sus **2 mil millones de usuarios**.

**Escala del cifrado**:
```
┌────────────────────────────────────────────────┐
│ Estadísticas de WhatsApp (2024):              │
├────────────────────────────────────────────────┤
│ - 100 mil millones mensajes/día                │
│ - Cada mensaje cifrado con AES-256-CBC         │
│ - ~1.16 millones de operaciones AES/segundo    │
│ - Carga computacional: ~100 petaFLOPS          │
└────────────────────────────────────────────────┘
```

**Cómo funciona (simplificado)**:

```
Alice                                         Bob
  │                                            │
  ├─ Genera par de claves ECDH ───────────→   │
  │  (Curva25519)                              │
  │                                            │
  │ ←─────────── Clave pública de Bob ─────────┤
  │                                            │
  ├─ Deriva shared secret (ECDH) ─────────┐    │
  │                                        │    │
  ├─ Genera Chain Key ────────────────────┤    │
  │  = HKDF-SHA256(shared_secret)          │    │
  │                                        │    │
  ├─ Deriva Message Key ──────────────────┤    │
  │  = HMAC-SHA256(chain_key, 0x01)        │    │
  │                                        │    │
  ├─ Cifra mensaje: ──────────────────────┤    │
  │  ciphertext = AES-256-CBC(msg, msg_key)│    │
  │  mac = HMAC-SHA256(ciphertext)         │    │
  │                                        │    │
  ├─ Envía: ciphertext || mac ────────────────→│
  │                                            │
  │                              Bob descifra: │
  │                      (deriva misma msg_key)│
```

**Detalles técnicos**:

1. **Double Ratchet Algorithm**:
   - Nueva clave AES para **cada mensaje** (forward secrecy)
   - Si roban tu teléfono hoy, no pueden descifrar mensajes de ayer

2. **Cifrado**:
   ```
   Message Key (256 bits) deriva:
   - AES-256-CBC key (256 bits)
   - HMAC-SHA256 key (256 bits)
   - IV (128 bits)

   Ciphertext = AES-256-CBC(plaintext, aes_key, iv)
   MAC = HMAC-SHA256(ciphertext || metadata, mac_key)
   ```

3. **Metadata NO cifrado**:
   - Quién habla con quién (visible para WhatsApp/Meta)
   - Timestamp
   - Contenido del mensaje: **SÍ cifrado** (WhatsApp no puede leer)

**Controversias**:

1. **Backups en la nube** (2018-2021):
   - WhatsApp en iCloud/Google Drive **NO estaba cifrado E2E**
   - Gobierno podía pedir backups a Apple/Google
   - Solucionado en 2021: **Encrypted Backups** opcional

2. **Metadatos**:
   - WhatsApp sabe que Alice habló con Bob a las 2 AM
   - Suficiente para análisis de grafos sociales

3. **Clientes modificados**:
   - WhatsApp Business API permite leer mensajes (empresas pueden ver chats de soporte)

**Impacto social**:

```
ANTES (2016):             DESPUÉS (2024):
┌─────────────────┐       ┌──────────────────────┐
│ Mensajería:     │       │ Mensajería E2E:      │
│ - SMS (sin      │       │ - WhatsApp (2B)      │
│   cifrado)      │       │ - Signal (40M)       │
│ - FB Messenger  │       │ - iMessage (1.5B)    │
│   (sin E2E)     │       │ - Telegram (800M)    │
│                 │       │   (solo chats secret)│
│ Usuarios con    │       │                      │
│ E2E: <10M       │       │ Usuarios con E2E:    │
│                 │       │ >3 mil millones      │
└─────────────────┘       └──────────────────────┘
```

**Lección clave**: AES-256 es tan eficiente que puede escalar a **miles de millones de usuarios** sin problemas de rendimiento (especialmente con AES-NI en servidores).

**Referencia**:
- WhatsApp Security Whitepaper (2024)
- Signal Protocol Specification
- Paper: "The Double Ratchet Algorithm" (Perrin & Marlinspike, 2016)

---

## 💻 MODOS DE OPERACIÓN

AES es un **cifrado por bloques** (128 bits fijos). Para cifrar datos más largos, necesitamos un **modo de operación** que defina cómo dividir y procesar múltiples bloques.

### ⚠️ ECB (Electronic Codebook) - INSEGURO

**NO usar en producción, solo para fines educativos.**

```
┌─────────────────────────────────────────────────────┐
│ Plaintext:  [Bloque 1] [Bloque 2] [Bloque 3]       │
│                 │          │          │             │
│                 ▼          ▼          ▼             │
│            ┌────────┐ ┌────────┐ ┌────────┐        │
│            │AES(K1) │ │AES(K1) │ │AES(K1) │        │
│            └────────┘ └────────┘ └────────┘        │
│                 │          │          │             │
│                 ▼          ▼          ▼             │
│ Ciphertext: [Bloque 1] [Bloque 2] [Bloque 3]       │
└─────────────────────────────────────────────────────┘
```

**Matemática**:
```
C₁ = AES_encrypt(K, P₁)
C₂ = AES_encrypt(K, P₂)
C₃ = AES_encrypt(K, P₃)
```

**Problema**: Si `P₁ = P₂`, entonces `C₁ = C₂` → **patrones visibles**

**Ejemplo visual - ECB Penguin**:

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from PIL import Image
import os

def encrypt_image_ecb(input_file, output_file):
    """
    Demuestra la inseguridad de ECB con imágenes

    El resultado mostrará la silueta de la imagen original
    porque píxeles idénticos generan ciphertext idéntico
    """
    key = os.urandom(32)  # AES-256 key

    # Leer imagen (BMP no comprimido recomendado)
    with open(input_file, 'rb') as f:
        header = f.read(54)  # BMP header (mantener sin cifrar)
        data = f.read()

    # Padding PKCS#7
    padding_len = 16 - (len(data) % 16) if len(data) % 16 != 0 else 0
    if padding_len:
        data += bytes([padding_len] * padding_len)

    # Cifrar con ECB (INSEGURO)
    cipher = Cipher(algorithms.AES(key), modes.ECB())
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()

    # Guardar
    with open(output_file, 'wb') as f:
        f.write(header)  # Header sin cifrar para visualización
        f.write(encrypted)

    print(f"[!] Imagen cifrada con ECB: {output_file}")
    print(f"[!] Abre la imagen - verás la silueta original!")

# Uso:
# encrypt_image_ecb("tux.bmp", "tux_ecb.bmp")
```

**Resultado**: Verás la silueta del pingüino Tux incluso "cifrado" porque áreas del mismo color generan el mismo ciphertext.

**Caso real**: Adobe Password Breach (2013) - Usó 3DES-ECB, permitió descifrar millones de contraseñas por frecuencia de patrones.

---

### ✅ CBC (Cipher Block Chaining) - Seguro con IV único

```
┌─────────────────────────────────────────────────────┐
│ IV (aleatorio)                                      │
│   │                                                 │
│   ├──→ XOR ────→ AES(K) ────→ C₁                    │
│   │    ↑                      │                     │
│   │    P₁                     │                     │
│   │                           │                     │
│   │                           ├──→ XOR ─→ AES(K) ─→ C₂
│   │                           │    ↑                │
│   │                           │    P₂               │
│   │                           │                     │
│   │                           └──→ XOR ─→ AES(K) ─→ C₃
│                                    ↑                │
│                                    P₃               │
└─────────────────────────────────────────────────────┘
```

**Matemática**:
```
C₀ = IV (Initialization Vector, aleatorio)
C₁ = AES_encrypt(K, P₁ ⊕ C₀)
C₂ = AES_encrypt(K, P₂ ⊕ C₁)
C₃ = AES_encrypt(K, P₃ ⊕ C₂)
```

**Características**:
- **Requiere IV aleatorio único** por mensaje (16 bytes para AES)
- IV puede ser público (se envía junto al ciphertext)
- No permite paralelización en cifrado (secuencial)
- Permite paralelización en descifrado
- **Requiere autenticación separada** (HMAC-SHA256)

**Implementación segura**:

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, hmac
import os

class AES_CBC_HMAC:
    """
    AES-256-CBC con autenticación HMAC-SHA256 (Encrypt-then-MAC)

    Implementa el patrón Encrypt-then-MAC recomendado:
    1. Cifrar con AES-CBC
    2. Calcular HMAC del ciphertext
    3. Verificar HMAC antes de descifrar (previene padding oracle)
    """

    def __init__(self, key_enc, key_mac):
        """
        Args:
            key_enc: Clave AES-256 (32 bytes)
            key_mac: Clave HMAC-SHA256 (32 bytes)

        IMPORTANTE: Usar claves diferentes para cifrado y MAC
        """
        self.key_enc = key_enc
        self.key_mac = key_mac

    def encrypt(self, plaintext: bytes) -> dict:
        """
        Cifra datos con AES-256-CBC + HMAC-SHA256

        Returns:
            dict con 'iv', 'ciphertext', 'mac'
        """
        # Generar IV aleatorio único
        iv = os.urandom(16)

        # Padding PKCS#7
        padding_len = 16 - (len(plaintext) % 16)
        plaintext_padded = plaintext + bytes([padding_len] * padding_len)

        # Cifrar con CBC
        cipher = Cipher(algorithms.AES(self.key_enc), modes.CBC(iv))
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext_padded) + encryptor.finalize()

        # Calcular HMAC (sobre IV + ciphertext)
        h = hmac.HMAC(self.key_mac, hashes.SHA256())
        h.update(iv + ciphertext)
        mac = h.finalize()

        return {
            'iv': iv,
            'ciphertext': ciphertext,
            'mac': mac
        }

    def decrypt(self, iv: bytes, ciphertext: bytes, mac: bytes) -> bytes:
        """
        Descifra y verifica autenticidad

        Raises:
            ValueError: Si MAC inválido (posible manipulación)
        """
        # Verificar HMAC ANTES de descifrar (previene padding oracle)
        h = hmac.HMAC(self.key_mac, hashes.SHA256())
        h.update(iv + ciphertext)
        try:
            h.verify(mac)
        except Exception:
            raise ValueError("MAC inválido - datos manipulados o corruptos")

        # Descifrar
        cipher = Cipher(algorithms.AES(self.key_enc), modes.CBC(iv))
        decryptor = cipher.decryptor()
        plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()

        # Remover padding PKCS#7
        padding_len = plaintext_padded[-1]
        return plaintext_padded[:-padding_len]

# Uso:
key_enc = os.urandom(32)  # Clave de cifrado
key_mac = os.urandom(32)  # Clave de autenticación (DIFERENTE)

cipher = AES_CBC_HMAC(key_enc, key_mac)

# Cifrar
message = b"Mensaje secreto importante"
encrypted = cipher.encrypt(message)
print(f"IV: {encrypted['iv'].hex()}")
print(f"Ciphertext: {encrypted['ciphertext'].hex()}")
print(f"MAC: {encrypted['mac'].hex()}")

# Descifrar
decrypted = cipher.decrypt(encrypted['iv'], encrypted['ciphertext'], encrypted['mac'])
assert decrypted == message
```

**Usos**:
- TLS 1.2 (TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384)
- IPsec (AES-CBC + HMAC)
- SSH (aes256-cbc, aunque CTR preferido)

**Vulnerabilidades históricas**:
- **Padding Oracle Attack** (si no se valida MAC primero)
- **BEAST attack** (TLS 1.0, mitigado en TLS 1.1+)
- **Lucky13** (timing attack en TLS, parcheado)

---

### 🏆 GCM (Galois/Counter Mode) - RECOMENDADO

**GCM es el modo más usado en 2024** porque combina:
- **Cifrado** (modo CTR)
- **Autenticación** (GMAC)
- **Alto rendimiento** (paralelizable, aceleración hardware)

```
┌─────────────────────────────────────────────────────┐
│ CIFRADO (Counter Mode):                            │
│                                                     │
│ Nonce+Counter1 ─→ AES(K) ─→ Keystream1 ⊕ P₁ = C₁  │
│ Nonce+Counter2 ─→ AES(K) ─→ Keystream2 ⊕ P₂ = C₂  │
│ Nonce+Counter3 ─→ AES(K) ─→ Keystream3 ⊕ P₃ = C₃  │
│                                                     │
│ AUTENTICACIÓN (GMAC - Galois Message Authentication):│
│                                                     │
│ AAD (Additional Authenticated Data)                │
│  │                                                  │
│  ├──→ [GHASH con clave derivada]                   │
│  │                                                  │
│  └──→ C₁ || C₂ || C₃ ──→ Authentication Tag (128 bits)│
└─────────────────────────────────────────────────────┘
```

**Matemática simplificada**:
```
Cifrado (CTR mode):
  Keystream_i = AES_encrypt(K, Nonce || Counter_i)
  C_i = P_i ⊕ Keystream_i

Autenticación (GMAC):
  Tag = GHASH(H, AAD || C || len(AAD) || len(C))
  H = AES_encrypt(K, 0^128)  # Hash subkey
```

**Ventajas de GCM**:

1. **AEAD (Authenticated Encryption with Associated Data)**:
   - Cifra + autentica en una sola operación
   - No necesita HMAC separado

2. **Associated Data (AAD)**:
   - Puede autenticar datos **sin cifrarlos**
   - Ejemplo: Headers HTTP, metadata de protocolos

3. **Paralelización total**:
   - Todos los bloques se pueden cifrar en paralelo
   - Ideal para CPUs multi-core y GPUs

4. **Aceleración hardware**:
   - Intel AES-NI + PCLMULQDQ (multiplicación en GF(2^128))
   - ARM Cryptography Extensions
   - Velocidad: **5-10 GB/s** en CPUs modernas

**Implementación con cryptography**:

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

class SecureAESGCM:
    """
    AES-256-GCM con manejo seguro de nonces

    CRÍTICO: Nunca reutilizar nonce con la misma clave
    Si N nonces generados aleatoriamente:
    - Probabilidad de colisión (cumpleaños): ~N²/2^97 para nonce de 96 bits
    - Para 2^32 mensajes (~4 mil millones): prob ~2^-33 (muy baja)
    - Solución: Rotar clave cada 2^32 mensajes
    """

    def __init__(self, key=None):
        """
        Args:
            key: Clave AES-256 (32 bytes), o None para generar
        """
        if key is None:
            self.key = AESGCM.generate_key(bit_length=256)
        else:
            self.key = key

        self.aesgcm = AESGCM(self.key)
        self.message_count = 0

    def encrypt(self, plaintext: bytes, associated_data: bytes = b'') -> tuple:
        """
        Cifra con AES-256-GCM

        Args:
            plaintext: Datos a cifrar
            associated_data: Datos a autenticar pero NO cifrar (ej: headers)

        Returns:
            (nonce, ciphertext)
            El ciphertext incluye el authentication tag (16 bytes al final)
        """
        # Generar nonce aleatorio (96 bits recomendado para GCM)
        nonce = os.urandom(12)  # 96 bits

        # Cifrar y autenticar
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, associated_data)

        self.message_count += 1
        if self.message_count > 2**32:
            raise RuntimeError("Límite de mensajes alcanzado - rotar clave")

        return (nonce, ciphertext)

    def decrypt(self, nonce: bytes, ciphertext: bytes,
                associated_data: bytes = b'') -> bytes:
        """
        Descifra y verifica autenticidad

        Raises:
            cryptography.exceptions.InvalidTag: Si tag inválido
        """
        return self.aesgcm.decrypt(nonce, ciphertext, associated_data)

# ============================================================
# EJEMPLO 1: Cifrado básico
# ============================================================
cipher = SecureAESGCM()

message = b"Este mensaje es confidencial"
nonce, encrypted = cipher.encrypt(message)

print(f"Nonce (12 bytes): {nonce.hex()}")
print(f"Encrypted (msg + 16-byte tag): {encrypted.hex()}")
print(f"Tamaño: {len(message)} bytes → {len(encrypted)} bytes")

decrypted = cipher.decrypt(nonce, encrypted)
assert decrypted == message
print(f"✓ Descifrado exitoso")

# ============================================================
# EJEMPLO 2: Associated Data (AAD)
# ============================================================
# Caso de uso: API REST donde header debe ser auténtico pero visible

header = b'{"user_id": 12345, "timestamp": 1708790400}'
body = b'{"action": "transfer", "amount": 10000}'

# Cifrar body, autenticar header+body
nonce, encrypted_body = cipher.encrypt(body, associated_data=header)

# Enviar: header (plaintext) + nonce + encrypted_body

# Recibir y verificar:
try:
    decrypted_body = cipher.decrypt(nonce, encrypted_body, associated_data=header)
    print(f"✓ Header autenticado: {header}")
    print(f"✓ Body descifrado: {decrypted_body}")
except Exception as e:
    print(f"✗ Autenticación fallida - datos manipulados")

# ============================================================
# EJEMPLO 3: Detección de manipulación
# ============================================================
nonce, encrypted = cipher.encrypt(b"Transferir $100")

# Atacante modifica ciphertext
tampered = encrypted[:-1] + bytes([encrypted[-1] ^ 0xFF])

try:
    cipher.decrypt(nonce, tampered)
except Exception as e:
    print(f"✓ Manipulación detectada: {type(e).__name__}")

# ============================================================
# EJEMPLO 4: Cifrado de archivo grande
# ============================================================
def encrypt_file(input_file, output_file, cipher):
    """
    Cifra archivo grande en chunks para no cargar todo en RAM

    Formato de salida:
    [nonce 12 bytes][ciphertext][tag 16 bytes]
    """
    CHUNK_SIZE = 1024 * 1024  # 1 MB chunks

    with open(input_file, 'rb') as f_in:
        data = f_in.read()

    nonce, encrypted = cipher.encrypt(data)

    with open(output_file, 'wb') as f_out:
        f_out.write(nonce)
        f_out.write(encrypted)

    print(f"✓ Archivo cifrado: {output_file}")
    print(f"  Tamaño original: {len(data):,} bytes")
    print(f"  Tamaño cifrado: {len(nonce) + len(encrypted):,} bytes")
    print(f"  Overhead: {len(nonce) + 16} bytes (nonce + tag)")

# Uso:
# with open("documento.pdf", "wb") as f:
#     f.write(b"PDF content...")
#
# cipher = SecureAESGCM()
# encrypt_file("documento.pdf", "documento.pdf.enc", cipher)
```

**Usos en producción**:

| Protocolo/Sistema | Cifrado | Notas |
|-------------------|---------|-------|
| **TLS 1.3** | `TLS_AES_128_GCM_SHA256` | Mandatory cipher suite |
| **TLS 1.3** | `TLS_AES_256_GCM_SHA384` | Máxima seguridad |
| **IPsec** | AES-GCM (RFC 4106) | ESP mode |
| **SSH** | aes256-gcm@openssh.com | Desde OpenSSH 6.2 |
| **WPA3** | AES-128-GCMP | WiFi 6/6E |
| **QUIC** | AES-128-GCM | HTTP/3 |
| **Cloud storage** | AWS S3, Google Cloud, Azure | Cifrado en reposo |

**Vulnerabilidades**:

1. **Nonce reuse = CATASTRÓFICO**:
   ```
   Si se reutiliza (K, nonce):
   C₁ = P₁ ⊕ AES(K, nonce||1)
   C₂ = P₂ ⊕ AES(K, nonce||1)  # MISMO keystream!

   → C₁ ⊕ C₂ = P₁ ⊕ P₂  (el cifrado se cancela)
   → Recuperar P₁ y P₂ usando criptoanálisis
   → Recuperar authentication key H
   → Forjar MACs
   ```

2. **Caso real**: Forbidden Attack (2016) - TLS implementations reutilizaron nonces

**Mitigación**:
- Usar nonces aleatorios de 96 bits (recomendado)
- O usar contadores determinísticos (requiere state management)
- Rotar clave cada 2^32 mensajes

---

### 📊 Comparativa de Modos

| Modo | Seguridad | Velocidad | Paralelizable | Autenticación | Uso recomendado |
|------|-----------|-----------|---------------|---------------|------------------|
| **ECB** | ❌ Inseguro | Muy rápido | ✅ Sí | ❌ No | NUNCA usar |
| **CBC** | ✅ Seguro* | Rápido | ⚠️ Solo decrypt | ❌ Requiere HMAC | Legacy TLS 1.2 |
| **CTR** | ✅ Seguro | Muy rápido | ✅ Sí | ❌ Requiere HMAC | Streaming |
| **GCM** | ✅ Muy seguro | Muy rápido | ✅ Sí | ✅ Integrada | **TLS 1.3, RECOMENDADO** |
| **CCM** | ✅ Muy seguro | Medio | ❌ No | ✅ Integrada | WPA2, Bluetooth |
| **XTS** | ✅ Seguro | Rápido | ✅ Sí | ❌ No | Disk encryption |

\* Con IV único aleatorio y autenticación externa (Encrypt-then-MAC)

**Recomendación 2024**:
- **Uso general**: AES-256-GCM (TLS, VPNs, mensajería)
- **Disk encryption**: AES-256-XTS (BitLocker, LUKS)
- **Constrained devices**: AES-128-CCM (IoT, Bluetooth)
- **Legacy**: AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC)

---

## Código Completo - AES-256-GCM

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class AESCipher:
    def __init__(self):
        self.key = AESGCM.generate_key(bit_length=256)
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, plaintext: bytes) -> tuple:
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, b'')
        return (nonce, ciphertext)

    def decrypt(self, nonce: bytes, ciphertext: bytes) -> bytes:
        return self.aesgcm.decrypt(nonce, ciphertext, b'')

# Uso
cipher = AESCipher()

# Cifrar
message = b"Este es un mensaje secreto"
nonce, encrypted = cipher.encrypt(message)
print(f"Cifrado: {encrypted.hex()}")

# Descifrar
decrypted = cipher.decrypt(nonce, encrypted)
print(f"Descifrado: {decrypted}")

# Cifrar archivo
with open("archivo.txt", "rb") as f:
    data = f.read()
    nonce, encrypted = cipher.encrypt(data)

with open("archivo.enc", "wb") as f:
    f.write(nonce + encrypted)
```

---

## Ejercicio: Comparar Modos ECB vs GCM

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image
import os

key = os.urandom(32)

# ECB (INSEGURO - para demostración)
def encrypt_ecb(data):
    cipher = Cipher(algorithms.AES(key), modes.ECB())
    encryptor = cipher.encryptor()
    return encryptor.update(data) + encryptor.finalize()

# Cifrar imagen con ECB (verás patrones)
img = Image.open("tux.bmp")
pixels = img.tobytes()

# Padding
if len(pixels) % 16 != 0:
    pixels += b'\x00' * (16 - len(pixels) % 16)

encrypted_ecb = encrypt_ecb(pixels)

# Guardar imagen cifrada (patrones visibles!)
Image.frombytes(img.mode, img.size, encrypted_ecb).save("tux_ecb.bmp")
```

**Resultado**: Verás la silueta del pingüino incluso cifrado!

---

## 🔬 EJERCICIOS EXPANDIDOS

### Ejercicio 1: Cifrado Básico (10 minutos)

**Objetivo**: Familiarizarse con la API de AES-GCM

**Tareas**:
1. Cifrar un mensaje de texto
2. Descifrar el mensaje
3. Verificar que el descifrado coincide con el original

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# TODO: Completar el código
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

mensaje = b"Mi primer mensaje cifrado con AES-256-GCM"

# 1. Cifrar
nonce = os.urandom(12)
cifrado = aesgcm.encrypt(nonce, mensaje, b'')

print(f"Mensaje original: {mensaje}")
print(f"Nonce: {nonce.hex()}")
print(f"Cifrado: {cifrado.hex()}")

# 2. Descifrar
descifrado = aesgcm.decrypt(nonce, cifrado, b'')

# 3. Verificar
assert descifrado == mensaje
print(f"✓ Descifrado exitoso: {descifrado}")
```

**Preguntas de reflexión**:
- ¿Qué tamaño tiene el nonce? ¿Por qué 12 bytes?
- ¿Qué pasa si usas el mismo nonce dos veces?
- ¿Cuánto overhead agrega el cifrado? (len(cifrado) - len(mensaje))

---

### Ejercicio 2: Cifrado de Archivos (20 minutos)

**Objetivo**: Implementar cifrado de archivos con diferentes modos

**Tarea**: Crear un script que cifre y descifre archivos usando AES-GCM

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_file_gcm(input_path, output_path, key):
    """
    Cifra un archivo usando AES-256-GCM

    Formato de salida: [nonce 12 bytes][ciphertext + tag]
    """
    aesgcm = AESGCM(key)

    # Leer archivo
    with open(input_path, 'rb') as f:
        plaintext = f.read()

    # Cifrar
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext, b'')

    # Guardar: nonce + ciphertext
    with open(output_path, 'wb') as f:
        f.write(nonce)
        f.write(ciphertext)

    print(f"✓ Archivo cifrado: {output_path}")
    print(f"  Tamaño original: {len(plaintext):,} bytes")
    print(f"  Tamaño cifrado: {12 + len(ciphertext):,} bytes")
    print(f"  Overhead: {12 + 16} bytes (nonce + auth tag)")

def decrypt_file_gcm(input_path, output_path, key):
    """
    Descifra un archivo cifrado con AES-256-GCM
    """
    aesgcm = AESGCM(key)

    # Leer archivo cifrado
    with open(input_path, 'rb') as f:
        nonce = f.read(12)
        ciphertext = f.read()

    # Descifrar
    plaintext = aesgcm.decrypt(nonce, ciphertext, b'')

    # Guardar
    with open(output_path, 'wb') as f:
        f.write(plaintext)

    print(f"✓ Archivo descifrado: {output_path}")

# Uso:
if __name__ == "__main__":
    # Generar clave (en producción, usar KDF o almacenar de forma segura)
    key = AESGCM.generate_key(bit_length=256)

    # Crear archivo de prueba
    with open("documento.txt", "w") as f:
        f.write("Contenido secreto del documento\n" * 100)

    # Cifrar
    encrypt_file_gcm("documento.txt", "documento.txt.enc", key)

    # Descifrar
    decrypt_file_gcm("documento.txt.enc", "documento_decrypted.txt", key)

    # Verificar
    with open("documento.txt", "rb") as f1, open("documento_decrypted.txt", "rb") as f2:
        assert f1.read() == f2.read()
        print("✓ Verificación exitosa - archivos idénticos")
```

**Desafío adicional**:
1. Modificar para soportar archivos grandes (procesar en chunks de 1 MB)
2. Agregar barra de progreso con `tqdm`
3. Agregar compresión con `gzip` antes de cifrar

---

### Ejercicio 3: Comparación ECB vs GCM con Imágenes (30 minutos)

**Objetivo**: Visualizar la diferencia entre un modo inseguro (ECB) y uno seguro (GCM)

**Materiales necesarios**:
- Imagen BMP sin comprimir (puedes descargar Tux: https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg → convertir a BMP)
- Librería Pillow: `pip install pillow`

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image
import os

def encrypt_image_ecb(input_path, output_path):
    """
    INSEGURO: Cifra imagen con ECB para demostración
    """
    key = os.urandom(32)

    # Leer imagen
    img = Image.open(input_path)
    with open(input_path, 'rb') as f:
        header = f.read(54)  # BMP header
        data = f.read()

    # Padding
    padding_len = 16 - (len(data) % 16) if len(data) % 16 != 0 else 0
    if padding_len:
        data += bytes([padding_len] * padding_len)

    # Cifrar con ECB
    cipher = Cipher(algorithms.AES(key), modes.ECB())
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()

    # Guardar (mantener header para que sea BMP válido)
    with open(output_path, 'wb') as f:
        f.write(header)
        f.write(encrypted)

    print(f"[ECB] Imagen cifrada: {output_path}")
    print(f"[ECB] ⚠️ Abre la imagen - verás patrones visibles!")

def encrypt_image_gcm(input_path, output_path):
    """
    SEGURO: Cifra imagen con GCM (resultado: ruido aleatorio)
    """
    key = AESGCM.generate_key(bit_length=256)
    aesgcm = AESGCM(key)

    # Leer imagen completa
    with open(input_path, 'rb') as f:
        data = f.read()

    # Cifrar con GCM
    nonce = os.urandom(12)
    encrypted = aesgcm.encrypt(nonce, data, b'')

    # Guardar
    with open(output_path, 'wb') as f:
        f.write(nonce)
        f.write(encrypted)

    print(f"[GCM] Imagen cifrada: {output_path}")
    print(f"[GCM] ✓ Datos completamente aleatorios (no se puede visualizar como BMP)")

# Uso:
# 1. Descargar imagen tux.bmp
# 2. Ejecutar:
encrypt_image_ecb("tux.bmp", "tux_ecb.bmp")
encrypt_image_gcm("tux.bmp", "tux_gcm.enc")

print("\n[COMPARACIÓN]")
print("- tux_ecb.bmp: Abre con visor de imágenes → verás silueta de Tux")
print("- tux_gcm.enc: Intenta abrir → error (datos aleatorios)")
```

**Resultado esperado**:
- `tux_ecb.bmp`: Se verá la silueta del pingüino (INSEGURO)
- `tux_gcm.enc`: No se puede visualizar, datos completamente aleatorios (SEGURO)

---

### Ejercicio 4: Padding Oracle Defense (Avanzado, 45 minutos)

**Objetivo**: Implementar defensa contra Padding Oracle Attack

**Contexto**: En CBC sin autenticación, un atacante puede descifrar datos enviando texto cifrado modificado y observando si el padding es válido o no.

**Tarea**: Implementar AES-CBC con Encrypt-then-MAC correctamente

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, hmac
import os
import time

class SecureAESCBC:
    def __init__(self, key_enc, key_mac):
        self.key_enc = key_enc
        self.key_mac = key_mac

    def encrypt(self, plaintext):
        # Padding PKCS#7
        padding_len = 16 - (len(plaintext) % 16)
        plaintext += bytes([padding_len] * padding_len)

        # Cifrar
        iv = os.urandom(16)
        cipher = Cipher(algorithms.AES(self.key_enc), modes.CBC(iv))
        ciphertext = cipher.encryptor().update(plaintext) + cipher.encryptor().finalize()

        # MAC (Encrypt-then-MAC)
        h = hmac.HMAC(self.key_mac, hashes.SHA256())
        h.update(iv + ciphertext)
        tag = h.finalize()

        return {'iv': iv, 'ciphertext': ciphertext, 'tag': tag}

    def decrypt(self, iv, ciphertext, tag):
        # CRITICAL: Verificar MAC ANTES de descifrar
        h = hmac.HMAC(self.key_mac, hashes.SHA256())
        h.update(iv + ciphertext)

        try:
            h.verify(tag)
        except:
            # Timing attack mitigation: delay constante
            time.sleep(0.001)
            raise ValueError("Invalid MAC")

        # Descifrar
        cipher = Cipher(algorithms.AES(self.key_enc), modes.CBC(iv))
        plaintext = cipher.decryptor().update(ciphertext) + cipher.decryptor().finalize()

        # Remover padding
        padding_len = plaintext[-1]
        if padding_len > 16 or padding_len == 0:
            raise ValueError("Invalid padding")

        # Verificar padding (constant time)
        expected_padding = bytes([padding_len] * padding_len)
        if plaintext[-padding_len:] != expected_padding:
            raise ValueError("Invalid padding")

        return plaintext[:-padding_len]

# Test: Simular ataque de padding oracle
cipher = SecureAESCBC(os.urandom(32), os.urandom(32))

message = b"Secreto bancario: $1,000,000"
encrypted = cipher.encrypt(message)

# Ataque: modificar último byte del ciphertext
print("[ATAQUE] Modificando ciphertext...")
tampered = encrypted['ciphertext'][:-1] + bytes([encrypted['ciphertext'][-1] ^ 0x01])

try:
    cipher.decrypt(encrypted['iv'], tampered, encrypted['tag'])
    print("✗ VULNERABLE: Descifrado exitoso (no debería)")
except ValueError as e:
    print(f"✓ PROTEGIDO: {e}")
    print("✓ MAC verification previene padding oracle attack")
```

**Preguntas**:
1. ¿Por qué verificar MAC antes de descifrar?
2. ¿Qué es un timing attack? ¿Cómo se mitiga?
3. ¿Por qué GCM es mejor solución?

---

### Ejercicio 5: Benchmark de Rendimiento (30 minutos)

**Objetivo**: Comparar velocidad de AES vs ChaCha20

```python
import time
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305

def benchmark_cipher(cipher_class, name, data_size_mb=10):
    """
    Benchmark de velocidad de cifrado
    """
    data = os.urandom(data_size_mb * 1024 * 1024)  # MB de datos
    key = cipher_class.generate_key(bit_length=256)
    cipher = cipher_class(key)
    nonce = os.urandom(12)

    # Cifrado
    start = time.perf_counter()
    ciphertext = cipher.encrypt(nonce, data, b'')
    encrypt_time = time.perf_counter() - start

    # Descifrado
    start = time.perf_counter()
    plaintext = cipher.decrypt(nonce, ciphertext, b'')
    decrypt_time = time.perf_counter() - start

    # Resultados
    print(f"\n{'='*50}")
    print(f"{name}")
    print(f"{'='*50}")
    print(f"Tamaño de datos: {data_size_mb} MB")
    print(f"Cifrado:   {encrypt_time:.4f}s ({data_size_mb/encrypt_time:.2f} MB/s)")
    print(f"Descifrado: {decrypt_time:.4f}s ({data_size_mb/decrypt_time:.2f} MB/s)")

    return {
        'name': name,
        'encrypt_speed': data_size_mb / encrypt_time,
        'decrypt_speed': data_size_mb / decrypt_time
    }

# Benchmarks
results = []
results.append(benchmark_cipher(AESGCM, "AES-256-GCM", 100))
results.append(benchmark_cipher(ChaCha20Poly1305, "ChaCha20-Poly1305", 100))

# Comparación
print(f"\n{'='*50}")
print("COMPARACIÓN")
print(f"{'='*50}")

aes_speed = results[0]['encrypt_speed']
chacha_speed = results[1]['encrypt_speed']

if aes_speed > chacha_speed:
    print(f"✓ AES-GCM es {aes_speed/chacha_speed:.2f}x más rápido (probablemente AES-NI disponible)")
else:
    print(f"✓ ChaCha20 es {chacha_speed/aes_speed:.2f}x más rápido (sin AES-NI)")

print("\nNOTA: Si AES-GCM es mucho más rápido, tu CPU tiene AES-NI")
print("      Si ChaCha20 es más rápido, estás en CPU sin AES-NI (ej: móviles antiguos)")
```

**Valores esperados**:
- Con AES-NI (Intel/AMD moderno): AES-GCM ~2-5 GB/s
- Sin AES-NI: ChaCha20 ~500 MB/s, AES-GCM ~200 MB/s

---

### Ejercicio 6: Associated Authenticated Data (AAD) (20 minutos)

**Objetivo**: Entender el uso de AAD en GCM

**Escenario**: Sistema de mensajería donde el header debe ser auténtico pero visible

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import json

class SecureMessageSystem:
    def __init__(self):
        self.key = AESGCM.generate_key(bit_length=256)
        self.aesgcm = AESGCM(self.key)

    def send_message(self, sender, recipient, message_text):
        """
        Cifra mensaje con header visible pero autenticado

        Header (AAD): visible, autenticado
        Body: cifrado, autenticado
        """
        # Header (metadata visible)
        header = {
            'from': sender,
            'to': recipient,
            'timestamp': 1708790400,
            'version': '1.0'
        }
        header_bytes = json.dumps(header).encode()

        # Body (cifrado)
        body = message_text.encode()

        # Cifrar con AAD
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, body, header_bytes)

        return {
            'header': header,  # Plaintext
            'nonce': nonce.hex(),
            'body': ciphertext.hex()
        }

    def receive_message(self, envelope):
        """
        Descifra y verifica autenticidad del header + body
        """
        header_bytes = json.dumps(envelope['header']).encode()
        nonce = bytes.fromhex(envelope['nonce'])
        ciphertext = bytes.fromhex(envelope['body'])

        # Descifrar (verifica tanto header como body)
        try:
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, header_bytes)
            return {
                'header': envelope['header'],
                'message': plaintext.decode(),
                'verified': True
            }
        except Exception as e:
            return {
                'error': str(e),
                'verified': False
            }

# Uso
system = SecureMessageSystem()

# Enviar mensaje
envelope = system.send_message("alice@example.com", "bob@example.com",
                               "Reunión secreta a las 3 PM")

print("MENSAJE ENVIADO:")
print(json.dumps(envelope, indent=2))

# Recibir mensaje
received = system.receive_message(envelope)
print(f"\nMENSAJE RECIBIDO:")
print(f"De: {received['header']['from']}")
print(f"Para: {received['header']['to']}")
print(f"Mensaje: {received['message']}")
print(f"✓ Verificado: {received['verified']}")

# Ataque: modificar header
print("\n[ATAQUE] Modificando header...")
envelope['header']['from'] = "eve@example.com"  # Atacante cambia remitente

received = system.receive_message(envelope)
print(f"✓ Ataque detectado: {received}")
```

**Resultado esperado**:
- Mensaje legítimo: verificado correctamente
- Header modificado: autenticación falla

---

## 📊 COMPARATIVA DE ALGORITMOS

### AES vs Alternativas Modernas

| Algoritmo | Tipo | Tamaño bloque | Tamaños de clave | Velocidad (software) | Velocidad (hardware) | Estado 2024 |
|-----------|------|---------------|------------------|----------------------|----------------------|-------------|
| **AES** | Bloque | 128 bits | 128, 192, 256 bits | Medio | **Muy rápido** (AES-NI) | ✅ Estándar actual |
| **ChaCha20** | Stream | N/A | 256 bits | Rápido | Medio | ✅ Alternativa (móviles) |
| **Serpent** | Bloque | 128 bits | 128, 192, 256 bits | Lento | Medio | ⚠️ Muy conservador |
| **Twofish** | Bloque | 128 bits | 128, 192, 256 bits | Medio | Medio | ⚠️ Poco usado |
| **3DES** | Bloque | 64 bits | 168 bits (efectivo: 112) | Muy lento | Lento | ❌ Deprecated (2023) |
| **DES** | Bloque | 64 bits | 56 bits | Rápido | Rápido | ❌ Roto (1998) |

### Detalles de Rendimiento (CPU Intel i7, AES-NI habilitado)

```
┌─────────────────────────────────────────────────────┐
│ Algoritmo        │ Cifrado    │ Descifrado │ Uso    │
├──────────────────┼────────────┼────────────┼────────┤
│ AES-128-GCM      │ 5.2 GB/s   │ 5.0 GB/s   │ TLS 1.3│
│ AES-256-GCM      │ 4.1 GB/s   │ 3.9 GB/s   │ Máximo │
│ ChaCha20-Poly    │ 1.2 GB/s   │ 1.2 GB/s   │ Móviles│
│ AES-256-CBC      │ 2.8 GB/s   │ 2.5 GB/s   │ Legacy │
│ 3DES-CBC         │ 0.05 GB/s  │ 0.05 GB/s  │ ❌     │
└──────────────────┴────────────┴────────────┴────────┘

Nota: Rendimiento SIN AES-NI:
- AES-128-GCM: ~200 MB/s (26× más lento)
- ChaCha20-Poly: ~600 MB/s (2× más lento)
```

### Seguridad Comparativa

| Algoritmo | Ataques conocidos | Complejidad mejor ataque | Margen de seguridad | Post-quantum |
|-----------|-------------------|--------------------------|---------------------|--------------|
| **AES-128** | Related-key attack (teórico) | 2^126.1 | ~25% rounds de sobra | ⚠️ Grover → 2^64 |
| **AES-256** | Related-key attack (teórico) | 2^254.4 | ~40% rounds de sobra | ✅ Grover → 2^128 |
| **ChaCha20** | Ninguno práctico | 2^256 (brute force) | Amplio margen | ✅ Grover → 2^128 |
| **Serpent** | Ninguno | 2^256 (brute force) | Muy amplio (32 rounds) | ✅ Grover → 2^128 |
| **3DES** | Sweet32 (2016) | 2^64 (birthday) | ❌ Insuficiente | ❌ |
| **DES** | Fuerza bruta | 2^56 | ❌ Roto | ❌ |

### Casos de Uso Recomendados

```
┌────────────────────────────────────────────────────────┐
│ Escenario                  │ Algoritmo recomendado     │
├────────────────────────────┼───────────────────────────┤
│ HTTPS/TLS                  │ AES-128-GCM (TLS 1.3)     │
│ VPN corporativa            │ AES-256-GCM               │
│ Disk encryption (PC)       │ AES-256-XTS + AES-NI      │
│ Móviles sin AES-NI         │ ChaCha20-Poly1305         │
│ WiFi (WPA3)                │ AES-128-GCMP              │
│ Gobierno/Militar (TOP SEC) │ AES-256-GCM + FIPS 140-2  │
│ IoT/Embedded               │ AES-128-CCM (bajo RAM)    │
│ Mensajería (Signal)        │ AES-256-CBC + HMAC-SHA256 │
│ Cloud storage              │ AES-256-GCM               │
│ Archivos sensibles         │ AES-256-GCM o ChaCha20    │
└────────────────────────────┴───────────────────────────┘
```

### ¿Cuándo NO usar AES?

1. **CPUs sin AES-NI y rendimiento crítico**:
   - Usar: ChaCha20-Poly1305
   - Ejemplo: Móviles antiguos, Raspberry Pi

2. **Extreme paranoia (NSA puede romper AES?)**:
   - Usar: Serpent-256 (más conservador) + AES-256 (cascada)
   - Ejemplo: VeraCrypt permite AES+Serpent+Twofish

3. **Computación cuántica en 20+ años**:
   - Usar: AES-256 (128 bits post-quantum suficiente)
   - O considerar: Lattice-based crypto (NIST PQC)

---

## 📚 REFERENCIAS

### Documentos Oficiales

1. **NIST FIPS 197** (2001)
   - Título: "Advanced Encryption Standard (AES)"
   - URL: https://csrc.nist.gov/publications/detail/fips/197/final
   - Especificación oficial del estándar AES

2. **NIST SP 800-38A** (2001)
   - Título: "Recommendation for Block Cipher Modes of Operation"
   - URL: https://csrc.nist.gov/publications/detail/sp/800-38a/final
   - Describe ECB, CBC, CFB, OFB, CTR

3. **NIST SP 800-38D** (2007)
   - Título: "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC"
   - URL: https://csrc.nist.gov/publications/detail/sp/800-38d/final
   - Especificación completa de AES-GCM

4. **RFC 3602** - AES-CBC in IPsec
   - URL: https://www.rfc-editor.org/rfc/rfc3602

5. **RFC 4106** - AES-GCM in IPsec ESP
   - URL: https://www.rfc-editor.org/rfc/rfc4106

6. **RFC 5288** - AES-GCM Cipher Suites for TLS
   - URL: https://www.rfc-editor.org/rfc/rfc5288

### Papers Académicos Fundamentales

7. **"AES Proposal: Rijndael"** (1999)
   - Autores: Joan Daemen, Vincent Rijmen
   - URL: https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/aes-development/rijndael-ammended.pdf
   - Documento original de la propuesta ganadora

8. **"The Design of Rijndael"** (2002)
   - Autores: Joan Daemen, Vincent Rijmen
   - Libro: Springer-Verlag
   - ISBN: 3-540-42580-2
   - Descripción completa del diseño interno de AES

9. **"Biclique Cryptanalysis of the Full AES"** (2011)
   - Autores: Andrey Bogdanov, Dmitry Khovratovich, Christian Rechberger
   - Mejor ataque teórico contra AES-128 (2^126.1 operaciones)
   - URL: https://eprint.iacr.org/2011/449

10. **"Related-Key Cryptanalysis of the Full AES-192 and AES-256"** (2009)
    - Autores: Alex Biryukov, Dmitry Khovratovich
    - Ataques teóricos en modelos related-key (no prácticos)
    - URL: https://eprint.iacr.org/2009/317

### Implementaciones de Referencia

11. **OpenSSL AES Implementation**
    - URL: https://github.com/openssl/openssl/blob/master/crypto/aes/
    - Implementación en C con optimizaciones AES-NI

12. **Python Cryptography Library**
    - URL: https://cryptography.io/en/latest/
    - Librería usada en este laboratorio

13. **Bouncy Castle**
    - URL: https://www.bouncycastle.org/
    - Implementaciones en Java/C#

### Casos de Estudio y Vulnerabilidades

14. **Heartbleed (CVE-2014-0160)**
    - Paper: "The Matter of Heartbleed" (Zakir Durumeric et al., 2014)
    - URL: https://jhalderm.com/pub/papers/heartbleed-imc14.pdf

15. **Padding Oracle Attack**
    - Paper: "Security Flaws Induced by CBC Padding" (Serge Vaudenay, 2002)
    - URL: https://www.iacr.org/cryptodb/archive/2002/EUROCRYPT/2850/2850.pdf

16. **BEAST Attack on TLS** (2011)
    - Paper: "Here Come The ⊕ Ninjas" (Thai Duong, Juliano Rizzo)
    - Ataque a TLS 1.0 con AES-CBC

17. **Sweet32 - 64-bit Block Ciphers** (2016)
    - URL: https://sweet32.info/
    - Demuestra debilidad de bloques de 64 bits (3DES)

18. **Forbidden Attack on GCM Nonce Reuse** (2016)
    - Paper: "Nonce-Disrespecting Adversaries" (Joux et al., 2016)

### Recursos Educativos

19. **"A Stick Figure Guide to AES"**
    - URL: https://www.moserware.com/2009/09/stick-figure-guide-to-advanced.html
    - Explicación visual paso a paso

20. **Computerphile - AES Explained**
    - URL: https://www.youtube.com/watch?v=O4xNJsjtN6E
    - Video educativo sobre AES

21. **Cryptography I - Coursera (Dan Boneh)**
    - URL: https://www.coursera.org/learn/crypto
    - Curso completo incluyendo AES

22. **"Serious Cryptography"** (Jean-Philippe Aumasson, 2017)
    - Libro: No Starch Press
    - ISBN: 978-1593278267
    - Capítulo 4: Block Ciphers

### Herramientas y Testing

23. **NIST Cryptographic Algorithm Validation Program (CAVP)**
    - URL: https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program
    - Test vectors oficiales para validar implementaciones

24. **Test Vectors for AES**
    - URL: https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines/example-values
    - Ejemplos de entrada/salida para verificar implementaciones

25. **OpenSSL Speed Benchmark**
    - Comando: `openssl speed -evp aes-128-gcm aes-256-gcm chacha20-poly1305`
    - Compara rendimiento de algoritmos

### Estándares Industriales

26. **PCI DSS 4.0** (Payment Card Industry)
    - Requiere: AES-128 mínimo, AES-256 recomendado
    - URL: https://www.pcisecuritystandards.org/

27. **FIPS 140-2/140-3** (Federal Information Processing Standards)
    - Certificación de módulos criptográficos
    - URL: https://csrc.nist.gov/publications/detail/fips/140/2/final

28. **NSA Commercial Solutions for Classified (CSfC)**
    - Requiere: AES-256 para TOP SECRET
    - URL: https://www.nsa.gov/Resources/Commercial-Solutions-for-Classified-Program/

### Blogs y Artículos Técnicos

29. **"Why AES-256 is not enough for the NSA"** (Schneier on Security)
    - URL: https://www.schneier.com/blog/
    - Análisis de por qué NSA usa Suite B

30. **"The Security Impact of HTTPS Interception"** (2017)
    - Muestra importancia de AES-GCM correcto en TLS

### Código de Ejemplo y Labs

31. **Repositorio de este curso**
    - Path: `03_Criptografia_Clasica/laboratorios/lab_01_aes/`
    - Ejemplos completos de implementaciones seguras

32. **CryptoHack - AES Challenges**
    - URL: https://cryptohack.org/courses/symmetric/
    - Retos prácticos de criptografía simétrica

33. **CryptoPals Crypto Challenges**
    - URL: https://cryptopals.com/
    - Sets 2-3 cubren AES y ataques

---

## Entregables

### Mínimos (para aprobar)
- ✅ Implementación funcional de AES-256-GCM
- ✅ Script de cifrado/descifrado de archivos
- ✅ Demostración ECB vs GCM con imágenes

### Opcionales (para nota completa)
- ✅ Benchmark comparativo AES vs ChaCha20
- ✅ Implementación de AES-CBC con Encrypt-then-MAC
- ✅ Ejemplo de uso de AAD (Associated Authenticated Data)
- ✅ Detección de manipulación de datos

### Formato de entrega
```
lab_01_aes/
├── aes_gcm_basic.py          # Ejercicio 1
├── aes_file_encryption.py    # Ejercicio 2
├── ecb_vs_gcm_images.py      # Ejercicio 3
├── aes_cbc_secure.py         # Ejercicio 4
├── benchmark.py              # Ejercicio 5
├── aad_example.py            # Ejercicio 6
├── tux.bmp                   # Imagen de prueba
├── tux_ecb.bmp              # Resultado ECB
├── tux_gcm.enc              # Resultado GCM
└── README.md                # Reporte con conclusiones
```

---

[⬅️ Volver](../../README.md) | [➡️ Siguiente](../lab_02_rsa/)
