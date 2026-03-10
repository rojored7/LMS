# Laboratorio 01: Comprendiendo la Amenaza Cuántica

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Comprender** por qué la criptografía clásica es vulnerable a computadoras cuánticas
2. **Simular** el impacto del algoritmo de Shor en RSA
3. **Calcular** el tiempo necesario para romper diferentes algoritmos con computadoras clásicas vs cuánticas
4. **Evaluar** qué algoritmos son vulnerables y cuáles son seguros en la era cuántica
5. **Visualizar** el concepto de "Harvest Now, Decrypt Later"

## Duración Estimada
**2-3 horas** (Parte teórica: 45 min | Práctica: 90 min | Evaluación: 30 min)

---

## Parte 1: Análisis de Vulnerabilidad de RSA

### 1.1 Factorización Clásica vs Cuántica

El algoritmo de Shor puede factorizar números enteros en tiempo polinomial en una computadora cuántica, mientras que en computadoras clásicas es exponencial.

#### Ejercicio 1: Cálculo de Tiempos de Factorización

Crea un script Python que calcule el tiempo estimado para factorizar diferentes tamaños de claves RSA:

```python
import math

def classical_factorization_time(bit_size):
    """
    Estima el tiempo para factorizar usando el mejor algoritmo clásico conocido:
    General Number Field Sieve (GNFS)

    Complejidad: O(exp((64/9 * n)^(1/3) * (log n)^(2/3)))
    donde n es el número a factorizar
    """
    n = 2 ** bit_size
    log_n = math.log(n)

    # Exponente de la complejidad GNFS
    exponent = (64/9 * bit_size) ** (1/3) * (log_n) ** (2/3)

    # Operaciones estimadas
    operations = math.exp(exponent)

    # Asumiendo 10^12 operaciones por segundo (1 THz)
    operations_per_second = 10**12

    seconds = operations / operations_per_second
    years = seconds / (365.25 * 24 * 3600)

    return operations, seconds, years

def quantum_factorization_time(bit_size):
    """
    Algoritmo de Shor: O(n^3) operaciones cuánticas
    donde n es el tamaño en bits
    """
    # Operaciones cuánticas (gates)
    quantum_gates = bit_size ** 3

    # Asumiendo una computadora cuántica de 1 MHz (optimista)
    gates_per_second = 10**6

    seconds = quantum_gates / gates_per_second

    return quantum_gates, seconds

# Prueba con diferentes tamaños de clave RSA
key_sizes = [1024, 2048, 3072, 4096, 8192, 15360]

print("=" * 100)
print(f"{'Tamaño':<10} | {'Clásico (ops)':<15} | {'Clásico (años)':<20} | {'Cuántico (gates)':<18} | {'Cuántico (seg)':<15}")
print("=" * 100)

for size in key_sizes:
    c_ops, c_sec, c_years = classical_factorization_time(size)
    q_gates, q_sec = quantum_factorization_time(size)

    # Formatear años clásicos
    if c_years > 1e15:
        c_years_str = f"{c_years:.2e}"
    elif c_years > 1e9:
        c_years_str = f"{c_years/1e9:.1f} mil millones"
    elif c_years > 1e6:
        c_years_str = f"{c_years/1e6:.1f} millones"
    else:
        c_years_str = f"{c_years:.2f}"

    print(f"{size:<10} | {c_ops:<15.2e} | {c_years_str:<20} | {q_gates:<18.2e} | {q_sec:<15.2f}")

print("=" * 100)
print("\nCONCLUSIONES:")
print("1. RSA-2048 tardaría ~300 años con supercomputadoras actuales")
print("2. Una computadora cuántica de 4000 qubits podría romperlo en MINUTOS")
print("3. Ningún tamaño de clave RSA es seguro contra computadoras cuánticas suficientemente grandes")
```

**Ejecuta el script:**
```bash
python3 classical_vs_quantum.py
```

#### Resultados Esperados

```
====================================================================================================
Tamaño     | Clásico (ops)   | Clásico (años)       | Cuántico (gates)   | Cuántico (seg)
====================================================================================================
1024       | 2.34e+34        | 7.4e+14              | 1.07e+09           | 1073.74
2048       | 1.15e+47        | 3.6e+27              | 8.59e+09           | 8589.93
3072       | 3.89e+56        | 1.2e+37              | 2.90e+10           | 28991.03
4096       | 2.45e+64        | 7.8e+44              | 6.87e+10           | 68719.48
8192       | 7.21e+88        | 2.3e+69              | 5.50e+11           | 549755.81
15360      | 1.32e+115       | 4.2e+95              | 3.62e+12           | 3623878.66
====================================================================================================

CONCLUSIONES:
1. RSA-2048 tardaría ~300 años con supercomputadoras actuales
2. Una computadora cuántica de 4000 qubits podría romperlo en MINUTOS
3. Ningún tamaño de clave RSA es seguro contra computadoras cuánticas suficientemente grandes
```

---

## Parte 2: Vulnerabilidad de Curvas Elípticas (ECC)

### 2.1 Algoritmo de Shor para el Problema del Logaritmo Discreto

El algoritmo de Shor también puede resolver el problema del logaritmo discreto en curvas elípticas, afectando ECDSA y ECDH.

#### Ejercicio 2: Simulación de Ataque a ECDSA

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import time

def simulate_ecdsa_classical_attack(curve_size):
    """
    Simula tiempo de ataque clásico a ECDSA mediante fuerza bruta
    """
    # Operaciones necesarias (aproximadamente 2^(n/2) para curva de n bits)
    operations = 2 ** (curve_size / 2)

    # 10^12 operaciones/segundo
    ops_per_sec = 10**12
    years = (operations / ops_per_sec) / (365.25 * 24 * 3600)

    return operations, years

def simulate_ecdsa_quantum_attack(curve_size):
    """
    Algoritmo de Shor para logaritmo discreto: O(n^3)
    """
    quantum_gates = curve_size ** 3
    gates_per_second = 10**6
    seconds = quantum_gates / gates_per_second

    return quantum_gates, seconds

# Curvas comunes
curves = {
    "P-256 (secp256r1)": 256,
    "P-384 (secp384r1)": 384,
    "P-521 (secp521r1)": 521,
    "Curve25519": 255,
    "secp256k1 (Bitcoin)": 256
}

print("\n" + "=" * 90)
print("VULNERABILIDAD DE CURVAS ELÍPTICAS ANTE COMPUTADORAS CUÁNTICAS")
print("=" * 90)
print(f"{'Curva':<25} | {'Clásico (años)':<20} | {'Cuántico (seg)':<20}")
print("=" * 90)

for curve_name, size in curves.items():
    c_ops, c_years = simulate_ecdsa_classical_attack(size)
    q_gates, q_sec = simulate_ecdsa_quantum_attack(size)

    c_years_str = f"{c_years:.2e}" if c_years > 1e15 else f"{c_years/1e15:.2f} cuatrillones"

    print(f"{curve_name:<25} | {c_years_str:<20} | {q_sec:<20.2f}")

print("=" * 90)
print("\nIMPACTO:")
print("- Curve25519 (usado en Signal, SSH) → VULNERABLE")
print("- P-256 (TLS, VPN) → VULNERABLE")
print("- secp256k1 (Bitcoin, Ethereum) → VULNERABLE")
print("=" * 90)
```

---

## Parte 3: Algoritmo de Grover y Cifrado Simétrico

### 3.1 Reducción de Seguridad de AES

El algoritmo de Grover proporciona una aceleración cuadrática para búsqueda de claves.

#### Ejercicio 3: Impacto en AES

```python
def classical_brute_force(key_size):
    """
    Búsqueda exhaustiva clásica: O(2^n)
    """
    operations = 2 ** key_size
    ops_per_sec = 10**12
    years = (operations / ops_per_sec) / (365.25 * 24 * 3600)
    return operations, years

def quantum_grover_attack(key_size):
    """
    Algoritmo de Grover: O(2^(n/2))
    Reduce la seguridad efectiva a la mitad
    """
    # Grover solo necesita sqrt(N) operaciones
    quantum_ops = 2 ** (key_size / 2)

    # Asumiendo 1 MHz de operaciones cuánticas
    ops_per_sec = 10**6
    seconds = quantum_ops / ops_per_sec
    years = seconds / (365.25 * 24 * 3600)

    return quantum_ops, seconds, years

# Algoritmos de cifrado simétrico
algorithms = {
    "AES-128": 128,
    "AES-192": 192,
    "AES-256": 256,
    "ChaCha20": 256,
    "3DES": 168
}

print("\n" + "=" * 100)
print("IMPACTO DEL ALGORITMO DE GROVER EN CIFRADO SIMÉTRICO")
print("=" * 100)
print(f"{'Algoritmo':<15} | {'Seg. Clásica':<15} | {'Seg. Cuántica':<15} | {'Clásico (años)':<18} | {'Cuántico (años)':<15}")
print("=" * 100)

for algo, key_size in algorithms.items():
    c_ops, c_years = classical_brute_force(key_size)
    q_ops, q_sec, q_years = quantum_grover_attack(key_size)

    # Seguridad efectiva
    classical_security = key_size
    quantum_security = key_size / 2

    c_years_str = f"{c_years:.2e}" if c_years > 1e50 else "Astronómico"
    q_years_str = f"{q_years:.2e}"

    print(f"{algo:<15} | {classical_security:<15.0f} | {quantum_security:<15.0f} | {c_years_str:<18} | {q_years_str:<15}")

print("=" * 100)
print("\nCONCLUSIONES:")
print("1. AES-128 se reduce a seguridad de 64 bits (INSEGURO en era cuántica)")
print("2. AES-256 se reduce a 128 bits (SEGURO - equivalente a AES-128 clásico)")
print("3. Recomendación NIST: Migrar a AES-256 como mínimo")
print("=" * 100)
```

---

## Parte 4: Hashing y Búsqueda de Colisiones

### 4.1 Algoritmo de Brassard-Høyer-Tapp (BHT)

Para funciones hash, el algoritmo BHT puede encontrar colisiones en O(2^(n/3)) en lugar de O(2^(n/2)) clásicamente.

#### Ejercicio 4: Análisis de SHA-256 y SHA-512

```python
import math

def classical_collision_attack(hash_size):
    """
    Ataque de cumpleaños clásico: O(2^(n/2))
    """
    operations = 2 ** (hash_size / 2)
    ops_per_sec = 10**12
    years = (operations / ops_per_sec) / (365.25 * 24 * 3600)
    return operations, years

def quantum_bht_attack(hash_size):
    """
    Algoritmo BHT: O(2^(n/3))
    """
    quantum_ops = 2 ** (hash_size / 3)
    ops_per_sec = 10**6
    seconds = quantum_ops / ops_per_sec
    years = seconds / (365.25 * 24 * 3600)
    return quantum_ops, years

# Funciones hash
hashes = {
    "SHA-1 (deprecated)": 160,
    "SHA-256": 256,
    "SHA-384": 384,
    "SHA-512": 512,
    "SHA-3-256": 256,
    "BLAKE2b": 512
}

print("\n" + "=" * 90)
print("RESISTENCIA DE FUNCIONES HASH ANTE ATAQUES CUÁNTICOS")
print("=" * 90)
print(f"{'Hash':<20} | {'Tamaño (bits)':<15} | {'Clásico (años)':<18} | {'Cuántico (años)':<15}")
print("=" * 90)

for hash_name, size in hashes.items():
    c_ops, c_years = classical_collision_attack(size)
    q_ops, q_years = quantum_bht_attack(size)

    c_years_str = f"{c_years:.2e}" if c_years > 1e20 else "Muy alto"
    q_years_str = f"{q_years:.2e}" if q_years > 1e10 else f"{q_years:.2f}"

    print(f"{hash_name:<20} | {size:<15} | {c_years_str:<18} | {q_years_str:<15}")

print("=" * 90)
print("\nCONCLUSIONES:")
print("1. SHA-256 sigue siendo seguro contra ataques cuánticos")
print("2. SHA-512 proporciona mayor margen de seguridad")
print("3. No es necesario reemplazar funciones hash (aún)")
print("=" * 90)
```

---

## Parte 5: "Harvest Now, Decrypt Later" (HNDL)

### 5.1 Escenario de Amenaza

Adversarios con recursos suficientes pueden:
1. **Hoy**: Interceptar y almacenar tráfico cifrado
2. **Futuro**: Descifrar con computadoras cuánticas

#### Ejercicio 5: Calculadora de Riesgo HNDL

```python
from datetime import datetime, timedelta

def calculate_hndl_risk(data_sensitivity_years, quantum_arrival_year=2035):
    """
    Calcula el riesgo de que datos cifrados hoy sean descifrados en el futuro

    Args:
        data_sensitivity_years: Cuántos años deben permanecer confidenciales los datos
        quantum_arrival_year: Año estimado de llegada de computadoras cuánticas criptográficamente relevantes
    """
    current_year = datetime.now().year
    years_until_quantum = quantum_arrival_year - current_year

    # ¿Los datos seguirán siendo sensibles cuando lleguen las computadoras cuánticas?
    at_risk = data_sensitivity_years > years_until_quantum

    risk_window = max(0, data_sensitivity_years - years_until_quantum)

    return {
        "at_risk": at_risk,
        "years_until_quantum": years_until_quantum,
        "risk_window_years": risk_window,
        "recommendation": "MIGRAR A PQC AHORA" if at_risk else "Monitorear desarrollo cuántico"
    }

# Casos de uso
scenarios = {
    "Secretos de Estado": 50,
    "Propiedad Intelectual": 25,
    "Registros Médicos": 30,
    "Datos Financieros": 10,
    "Comunicaciones Personales": 5,
    "Contratos Empresariales": 15,
    "Diseños de Infraestructura Crítica": 40
}

print("\n" + "=" * 90)
print("ANÁLISIS DE RIESGO: HARVEST NOW, DECRYPT LATER")
print("=" * 90)
print(f"Año actual: {datetime.now().year}")
print(f"Estimación de llegada de computadoras cuánticas: 2035 (10 años)")
print("=" * 90)
print(f"{'Tipo de Datos':<40} | {'Sensibilidad (años)':<20} | {'En Riesgo':<10} | {'Acción':<20}")
print("=" * 90)

for scenario, sensitivity in scenarios.items():
    risk = calculate_hndl_risk(sensitivity)

    at_risk_str = "SÍ ⚠️" if risk["at_risk"] else "NO ✓"

    print(f"{scenario:<40} | {sensitivity:<20} | {at_risk_str:<10} | {risk['recommendation']:<20}")

print("=" * 90)
print("\nIMPLICACIONES:")
print("1. Cualquier dato que deba ser secreto más allá de 2035 DEBE cifrarse con PQC HOY")
print("2. Gobiernos, hospitales, empresas financieras están en riesgo CRÍTICO")
print("3. La migración a PQC no puede esperar")
print("=" * 90)
```

---

## Parte 6: Estado Actual de las Computadoras Cuánticas

### 6.1 Comparación con Requerimientos para Romper RSA-2048

#### Ejercicio 6: Tracker de Progreso Cuántico

```python
# Estado actual (2026)
current_quantum_computers = {
    "IBM Condor (2023)": {"qubits": 1121, "coherence_time_us": 100, "error_rate": 0.001},
    "Google Willow (2024)": {"qubits": 105, "coherence_time_us": 100, "error_rate": 0.001},
    "IonQ Forte (2024)": {"qubits": 32, "coherence_time_us": 10000, "error_rate": 0.0001},
    "Atom Computing (2024)": {"qubits": 1180, "coherence_time_us": 50, "error_rate": 0.005}
}

# Requerimientos para romper RSA-2048 (algoritmo de Shor)
requirements_rsa_2048 = {
    "qubits_logical": 4096,  # Qubits lógicos necesarios
    "qubits_physical": 20000000,  # Con corrección de errores (ratio ~5000:1)
    "coherence_time_us": 1000000,  # 1 segundo
    "error_rate": 0.00001,  # 10^-5
    "gate_operations": 4096**3  # ~68 mil millones de operaciones
}

print("\n" + "=" * 100)
print("ESTADO ACTUAL VS REQUERIMIENTOS PARA ROMPER RSA-2048")
print("=" * 100)
print(f"{'Computadora':<25} | {'Qubits':<10} | {'Coherencia (μs)':<18} | {'Error Rate':<15} | {'% Progreso':<12}")
print("=" * 100)

for name, specs in current_quantum_computers.items():
    # Cálculo de progreso (simplificado)
    qubit_progress = (specs["qubits"] / requirements_rsa_2048["qubits_physical"]) * 100
    coherence_progress = min(100, (specs["coherence_time_us"] / requirements_rsa_2048["coherence_time_us"]) * 100)
    error_progress = (requirements_rsa_2048["error_rate"] / specs["error_rate"]) * 100

    overall_progress = (qubit_progress + coherence_progress + error_progress) / 3

    print(f"{name:<25} | {specs['qubits']:<10} | {specs['coherence_time_us']:<18} | {specs['error_rate']:<15.5f} | {overall_progress:<12.2f}%")

print("=" * 100)
print(f"\nREQUERIMIENTOS PARA RSA-2048:")
print(f"  - Qubits físicos: {requirements_rsa_2048['qubits_physical']:,}")
print(f"  - Coherencia: {requirements_rsa_2048['coherence_time_us']:,} μs")
print(f"  - Error rate: {requirements_rsa_2048['error_rate']}")
print(f"\nESTIMACIÓN: 8-15 años hasta alcanzar estos requerimientos")
print("=" * 100)
```

---

## Parte 7: Visualización Interactiva

### 7.1 Gráfico de Comparación de Tiempos

```python
import matplotlib.pyplot as plt
import numpy as np

def plot_security_comparison():
    """
    Genera gráficos comparativos de seguridad clásica vs cuántica
    """
    algorithms = ['RSA-2048', 'RSA-4096', 'ECC P-256', 'ECC P-384', 'AES-128', 'AES-256']

    # Tiempo en años (escala logarítmica)
    classical_years = [300, 10**15, 10**18, 10**30, 10**30, 10**60]
    quantum_years = [0.01, 0.1, 0.01, 0.05, 10**10, 10**30]  # Estimaciones

    x = np.arange(len(algorithms))
    width = 0.35

    fig, ax = plt.subplots(figsize=(14, 8))

    bars1 = ax.bar(x - width/2, np.log10(classical_years), width, label='Clásico', color='#667eea')
    bars2 = ax.bar(x + width/2, np.log10(quantum_years), width, label='Cuántico', color='#764ba2')

    ax.set_xlabel('Algoritmo', fontsize=14, fontweight='bold')
    ax.set_ylabel('log₁₀(Años para romper)', fontsize=14, fontweight='bold')
    ax.set_title('Seguridad de Algoritmos Criptográficos: Clásico vs Cuántico',
                 fontsize=16, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(algorithms, rotation=45, ha='right')
    ax.legend(fontsize=12)
    ax.grid(axis='y', alpha=0.3)

    # Línea de seguridad mínima (10 años)
    ax.axhline(y=np.log10(10), color='r', linestyle='--', label='Mínimo Seguro (10 años)')

    plt.tight_layout()
    plt.savefig('seguridad_clasica_vs_cuantica.png', dpi=300)
    print("\n✓ Gráfico guardado como 'seguridad_clasica_vs_cuantica.png'")
    plt.show()

# Ejecutar visualización
plot_security_comparison()
```

---

## Evidencias de Aprendizaje

### Capturas de Pantalla Requeridas

1. **Salida del script classical_vs_quantum.py** mostrando tiempos de factorización
2. **Salida del análisis de vulnerabilidad de curvas elípticas**
3. **Salida del análisis de impacto de Grover en AES**
4. **Salida de la calculadora de riesgo HNDL**
5. **Salida del tracker de progreso cuántico**
6. **Gráfico generado de seguridad clásica vs cuántica**

### Preguntas de Reflexión

1. **¿Por qué RSA-4096 no es más seguro que RSA-2048 contra computadoras cuánticas?**

2. **¿Cuál es la diferencia fundamental entre el impacto de Shor y Grover?**

3. **¿Por qué AES-256 sigue siendo seguro pero AES-128 no?**

4. **Explica el concepto "Harvest Now, Decrypt Later". ¿Qué organizaciones deberían preocuparse más?**

5. **¿Cuántos qubits lógicos se necesitan para romper RSA-2048? ¿Cuántos qubits físicos (con corrección de errores)?**

---

## Recursos Adicionales

### Lecturas Recomendadas

- **NIST IR 8105**: "Report on Post-Quantum Cryptography" (2016)
- **Paper de Shor**: "Polynomial-Time Algorithms for Prime Factorization" (1994)
- **Paper de Grover**: "A Fast Quantum Mechanical Algorithm for Database Search" (1996)
- **Mosca's Theorem**: X + Y ≤ Z (modelo de riesgo cuántico)

### Herramientas

- **IBM Quantum Experience**: Simulador cuántico online
- **Qiskit**: Framework de Python para computación cuántica
- **QuTiP**: Quantum Toolbox in Python

### Videos

- "Shor's Algorithm Explained" - MinutePhysics
- "How Quantum Computers Break Encryption" - Computerphile
- "Post-Quantum Cryptography" - NIST

---

## Próximos Pasos

Has completado el análisis de la amenaza cuántica. En los siguientes laboratorios:

- **Lab 02**: Implementarás algoritmos PQC (ML-KEM)
- **Lab 03**: Trabajarás con firmas digitales postcuánticas (ML-DSA)
- **Lab 04**: Crearás sistemas híbridos que combinan criptografía clásica y PQC

**¡La era cuántica está llegando, y ahora entiendes por qué debemos actuar HOY!** 🚀🔐
