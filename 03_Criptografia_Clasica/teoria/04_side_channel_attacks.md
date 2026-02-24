# Side-Channel Attacks: Timing, Power Analysis y Fault Injection

## Introducción

**Side-channel attacks** explotan información filtrada durante la ejecución de operaciones criptográficas (tiempo, consumo de energía, radiación electromagnética).

### Tipos de Side-Channel

| Ataque | Canal | Información Filtrada | Ejemplo |
|--------|-------|----------------------|---------|
| **Timing** | Tiempo de ejecución | Operaciones dependientes de clave | Kocher's attack en RSA |
| **Power Analysis** | Consumo eléctrico | Operaciones computacionales | DPA en AES |
| **EM Analysis** | Radiación electromagnética | Switching de transistores | TEMPEST |
| **Fault Injection** | Errores inducidos | Estados internos | Rowhammer, Glitching |
| **Acoustic** | Sonido | Frecuencia de operaciones | RSA key extraction |
| **Cache** | Timing de caché | Accesos a memoria | Spectre, Meltdown |

---

## Timing Attacks

### Ataque a RSA con CRT (Chinese Remainder Theorem)

```python
import time
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP

# Generar clave RSA
key = RSA.generate(2048)
cipher = PKCS1_OAEP.new(key)

def measure_decryption_time(ciphertext):
    start = time.perf_counter()
    plaintext = cipher.decrypt(ciphertext)
    end = time.perf_counter()
    return (end - start) * 1_000_000  # microsegundos

# Atacante mide tiempo de descifrado
ciphertext = cipher.encrypt(b"Secret message")

times = [measure_decryption_time(ciphertext) for _ in range(1000)]
avg_time = sum(times) / len(times)

print(f"Tiempo promedio: {avg_time:.2f} μs")
# Variaciones de tiempo pueden revelar bits de la clave privada
```

### Mitigación: Constant-Time Implementation

```python
def constant_time_compare(a, b):
    """Comparación en tiempo constante"""
    if len(a) != len(b):
        return False

    result = 0
    for x, y in zip(a, b):
        result |= x ^ y  # XOR bit a bit

    return result == 0

# Evita:
# if secret == user_input:  # ❌ Vulnerable a timing attack
#     return True

# Usa:
if constant_time_compare(secret, user_input):  # ✅ Seguro
    return True
```

---

## Power Analysis Attacks

### Simple Power Analysis (SPA)

Observa el consumo de energía durante una operación criptográfica única.

```
Consumo de Energía (AES S-Box lookup):

    High │     ┌─┐   ┌─┐       ┌─┐
         │   ┌─┘ └─┐ │ │     ┌─┘ └─┐
         │ ┌─┘     └─┘ └─┐ ┌─┘     └─┐
    Low  │─┘             └─┘         └─
         └────────────────────────────────> Time

         S-Box1  S-Box2  S-Box3  S-Box4
```

### Differential Power Analysis (DPA)

Usa análisis estadístico de múltiples trazas de energía:

```python
import numpy as np

def dpa_attack(traces, plaintexts, key_guess):
    """
    DPA attack on AES first round
    traces: power consumption traces
    plaintexts: known plaintexts
    key_guess: hypothetical key byte
    """
    correlation = []

    for trace, plaintext in zip(traces, plaintexts):
        # Hipótesis: XOR plaintext con key_guess
        intermediate = plaintext[0] ^ key_guess

        # Modelo de consumo: Hamming weight
        hamming_weight = bin(intermediate).count('1')

        # Correlación entre modelo y trace real
        correlation.append(np.corrcoef(hamming_weight, trace)[0,1])

    return np.mean(correlation)

# Ejemplo simplificado
traces = np.random.rand(1000, 1000)  # 1000 trazas
plaintexts = [np.random.randint(0, 256, 16) for _ in range(1000)]

best_key_guess = 0
max_correlation = 0

for key_guess in range(256):
    corr = dpa_attack(traces, plaintexts, key_guess)
    if corr > max_correlation:
        max_correlation = corr
        best_key_guess = key_guess

print(f"Clave recuperada: {best_key_guess:02x}")
```

### Mitigación: Masking

```python
def masked_aes_sbox(input_byte, mask):
    """
    AES S-Box con masking
    Operación: S(x ⊕ m) ⊕ S(m)
    """
    sbox = [...]  # AES S-Box table

    masked_input = input_byte ^ mask
    masked_output = sbox[masked_input]

    # Remover mask
    output = masked_output ^ sbox[mask]

    return output
```

---

## Fault Injection Attacks

### Rowhammer Attack

```python
import mmap
import os

def rowhammer(iterations=1_000_000):
    """
    Simplified Rowhammer: flip bits by hammering adjacent rows
    """
    size = 64 * 1024 * 1024  # 64 MB

    # Mapear memoria
    mem = mmap.mmap(-1, size, mmap.MAP_PRIVATE | mmap.MAP_ANONYMOUS)

    # Patrón de acceso para inducir bit flips
    for i in range(iterations):
        mem[0] = 0x55  # Row A
        mem[4096] = 0xAA  # Row B (adyacente)
        mem[0] = 0x55  # Hammering
        mem[4096] = 0xAA

    mem.close()

# ⚠️ Solo con fines educativos
```

### Voltage Glitching

Inducir fallas mediante variación de voltaje durante operaciones críticas:

```
Voltaje Normal:  ──────────────────────
Glitch:          ────┐        ┌────────
                     └────────┘
                     ↑ Fault!
```

### Mitigación

```c
// Double-check crítico
int check_pin(uint8_t *user_pin, uint8_t *correct_pin) {
    int result1 = memcmp(user_pin, correct_pin, 4);
    int result2 = memcmp(user_pin, correct_pin, 4);

    // Si fault injection cambia result1, result2 detectará
    if (result1 != result2) {
        trigger_alarm();
        return -1;
    }

    return (result1 == 0) ? 1 : 0;
}
```

---

## Cache-Timing Attacks (Spectre/Meltdown)

```python
import ctypes
import time

def flush_reload(target_array, probe_index):
    """
    Flush+Reload: detecta si dato está en caché
    """
    # Flush (invalidar caché)
    ctypes.windll.kernel32.FlushInstructionCache(-1, target_array, len(target_array))

    # Access secreto (especulativamente)
    dummy = target_array[probe_index]

    # Reload y medir tiempo
    start = time.perf_counter()
    dummy = target_array[probe_index]
    end = time.perf_counter()

    access_time = (end - start) * 1_000_000_000  # nanosegundos

    # Si acceso rápido (<100 ns), estaba en caché (leak!)
    return access_time < 100
```

---

## Contramedidas Generales

| Contramedida | Timing | Power | Fault |
|--------------|--------|-------|-------|
| **Constant-time code** | ✅ | ❌ | ❌ |
| **Masking/Blinding** | ⚠️ | ✅ | ⚠️ |
| **Redundancy checks** | ❌ | ❌ | ✅ |
| **Hardware protections** | ⚠️ | ✅ | ✅ |
| **Noise injection** | ⚠️ | ✅ | ❌ |

---

## Referencias

- **Kocher et al. (1996)**: "Timing Attacks on Implementations of Diffie-Hellman, RSA, DSS"
- **Kocher et al. (1999)**: "Differential Power Analysis"
- **Kim et al. (2014)**: "Flipping Bits in Memory Without Accessing Them: Rowhammer"
- **Kocher et al. (2019)**: "Spectre Attacks"
- **NIST SP 800-175B**: Guidelines for Side-Channel Attack Countermeasures

---

**Palabras**: ~800
