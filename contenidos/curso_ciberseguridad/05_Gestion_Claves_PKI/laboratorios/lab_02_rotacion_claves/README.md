# Laboratorio 2: Rotación Avanzada de Claves y Migración de PKI

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Planificar y ejecutar** rotación de claves criptográficas sin interrupción de servicio
2. **Implementar algoritmos** de rotación (Blue-Green, Rolling, Canary)
3. **Migrar** de algoritmos criptográficos débiles a algoritmos fuertes (RSA → ECDSA, SHA-1 → SHA-256)
4. **Gestionar** período de superposición (overlap) durante la rotación
5. **Automatizar** rotación programática con scripts Python
6. **Validar** integridad de certificados después de rotación
7. **Manejar escenarios** de compromiso de claves y recuperación de desastres

## Duración Estimada

- **Tiempo total**: 5-6 horas
- Planificación y setup: 45 minutos
- Implementación de rotación: 2 horas
- Migración de algoritmos: 1.5 horas
- Automatización: 1.5 horas
- Ejercicios prácticos: 1 hora

---

## Prerrequisitos

### Conocimientos Previos

- Laboratorio 1 completado (PKI completa)
- Conocimiento de criptografía asimétrica
- Familiaridad con OpenSSL
- Python 3.8+

### Software Requerido

```bash
# Verificar instalaciones
openssl version  # OpenSSL 3.x
python3 --version  # Python 3.8+

# Instalar dependencias Python
pip3 install cryptography python-dateutil click tabulate pyyaml
```

---

## Parte 1: Fundamentos de Rotación de Claves

### ¿Por Qué Rotar Claves?

| Razón | Descripción | Frecuencia Recomendada |
|-------|-------------|------------------------|
| **Fin de ciclo de vida** | Certificado próximo a expirar | Antes de expiración |
| **Compromiso de clave** | Clave privada expuesta o sospechada de compromiso | Inmediato |
| **Cambio de algoritmo** | Migración a algoritmos más seguros (ej. RSA → ECDSA) | Planificado |
| **Cambio de tamaño de clave** | Incrementar tamaño de clave (ej. RSA 2048 → 4096) | Planificado |
| **Cumplimiento regulatorio** | Políticas de seguridad requieren rotación periódica | Según política |
| **Cambio de CA** | Migración de CA pública a privada, o cambio de proveedor | Planificado |
| **Reorganización** | Cambios en DN (Distinguished Name) | Según necesidad |

### Estrategias de Rotación

```
┌──────────────────────────────────────────────────────────────┐
│                  ESTRATEGIAS DE ROTACIÓN                     │
└──────────────────────────────────────────────────────────────┘

1. BLUE-GREEN DEPLOYMENT
   ├─ Preparar entorno completamente nuevo (Green)
   ├─ Validar en paralelo
   ├─ Cambio instantáneo (switch)
   └─ Rollback rápido si falla

2. ROLLING ROTATION
   ├─ Rotar claves en subconjuntos (ej. 10% de servidores a la vez)
   ├─ Monitorear métricas de éxito
   ├─ Continuar o pausar según resultados
   └─ Gradual y controlado

3. CANARY ROTATION
   ├─ Rotar en un pequeño subconjunto (canary)
   ├─ Monitorear errores/problemas
   ├─ Si OK, expandir a más sistemas
   └─ Si falla, rollback del canary

4. OVERLAP (Superposición)
   ├─ Nuevo certificado emitido ANTES de expiración del antiguo
   ├─ Ambos válidos simultáneamente (overlap period)
   ├─ Gradual migración de sistemas
   └─ Retirar antiguo después de período de gracia
```

### Timeline de Rotación (Ejemplo)

```
Día 0: Certificado Actual (RSA 2048, válido hasta día 365)
│
│  Día 300: ⚠️ Alerta - Certificado expira en 65 días
│
│  Día 330: 📋 Planificación de rotación iniciada
│           ├─ Inventario de sistemas afectados
│           ├─ Plan de comunicación a stakeholders
│           └─ Preparar nuevo certificado (RSA 4096)
│
│  Día 340: 🆕 Nuevo certificado emitido (válido desde día 340 hasta día 705)
│           │
│           ├─── OVERLAP PERIOD (25 días) ────┐
│           │                                   │
│  Día 345: 🔄 Inicio de despliegue gradual    │
│           ├─ 10% de servidores (canary)      │
│           ├─ 50% de servidores               │
│           └─ 100% de servidores               │
│                                               │
│  Día 365: ❌ Certificado antiguo expira ──────┘
│           ✅ Todos los sistemas migrados
│
│  Día 370: 🗑️ Revocar certificado antiguo (cleanup)
│
│  Día 705: ⏰ Nuevo certificado expira (iniciar nuevo ciclo)
```

---

## Parte 2: Setup del Entorno de Rotación

### Estructura de Directorios

```bash
mkdir -p rotation-lab/{current-keys,new-keys,backup,logs,scripts}
cd rotation-lab

# Directorios para diferentes versiones
mkdir -p current-keys/{tls,codesign,email}
mkdir -p new-keys/{tls,codesign,email}
mkdir -p backup/{pre-rotation,post-rotation}
```

### Inventario de Certificados Actuales

Crear `scripts/inventory.py`:

```python
#!/usr/bin/env python3
"""
Certificate Inventory - Lista todos los certificados actuales
"""

import os
from pathlib import Path
from datetime import datetime
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from tabulate import tabulate

class CertificateInventory:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.certificates = []

    def scan_directory(self, directory):
        """Escanea directorio en busca de certificados"""
        cert_dir = Path(directory)
        if not cert_dir.exists():
            print(f"⚠️  Directory not found: {cert_dir}")
            return

        for cert_file in cert_dir.rglob("*.crt"):
            if 'ca-chain' in cert_file.name or 'root-ca' in cert_file.name:
                continue

            try:
                with open(cert_file, 'rb') as f:
                    cert = x509.load_pem_x509_certificate(f.read(), default_backend())

                cert_info = self.extract_cert_info(cert, cert_file)
                self.certificates.append(cert_info)

            except Exception as e:
                print(f"⚠️  Error reading {cert_file}: {e}")

    def extract_cert_info(self, cert, file_path):
        """Extrae información relevante del certificado"""
        try:
            cn = cert.subject.get_attributes_for_oid(x509.oid.NameOID.COMMON_NAME)[0].value
        except:
            cn = "Unknown"

        try:
            serial = format(cert.serial_number, 'X')
        except:
            serial = "Unknown"

        not_before = cert.not_valid_before
        not_after = cert.not_valid_after
        today = datetime.now()
        days_left = (not_after - today).days

        # Determinar algoritmo de clave pública
        pub_key = cert.public_key()
        from cryptography.hazmat.primitives.asymmetric import rsa, ec
        if isinstance(pub_key, rsa.RSAPublicKey):
            key_type = f"RSA {pub_key.key_size}"
        elif isinstance(pub_key, ec.EllipticCurvePublicKey):
            key_type = f"ECDSA {pub_key.curve.name}"
        else:
            key_type = "Unknown"

        # Determinar algoritmo de firma
        sig_alg = cert.signature_algorithm_oid._name

        # Estado
        if days_left < 0:
            status = "❌ Expired"
        elif days_left < 30:
            status = "🔴 Critical"
        elif days_left < 90:
            status = "🟡 Warning"
        else:
            status = "✅ Valid"

        return {
            'File': str(file_path.name),
            'Common Name': cn,
            'Serial': serial,
            'Algorithm': key_type,
            'Signature': sig_alg,
            'Expires': not_after.strftime('%Y-%m-%d'),
            'Days Left': days_left,
            'Status': status
        }

    def generate_report(self):
        """Genera reporte tabular"""
        if not self.certificates:
            print("No certificates found.")
            return

        # Ordenar por días restantes
        sorted_certs = sorted(self.certificates, key=lambda x: x['Days Left'])

        print("\n" + "="*100)
        print("CERTIFICATE INVENTORY REPORT")
        print("="*100 + "\n")

        print(tabulate(sorted_certs, headers='keys', tablefmt='grid'))

        # Resumen
        total = len(sorted_certs)
        expired = sum(1 for c in sorted_certs if c['Days Left'] < 0)
        critical = sum(1 for c in sorted_certs if 0 <= c['Days Left'] < 30)
        warning = sum(1 for c in sorted_certs if 30 <= c['Days Left'] < 90)
        valid = sum(1 for c in sorted_certs if c['Days Left'] >= 90)

        print("\n" + "="*100)
        print("SUMMARY")
        print("="*100)
        print(f"Total certificates: {total}")
        print(f"  ✅ Valid (90+ days):  {valid}")
        print(f"  🟡 Warning (30-90 days): {warning}")
        print(f"  🔴 Critical (<30 days): {critical}")
        print(f"  ❌ Expired: {expired}")
        print("="*100 + "\n")

        # Recomendaciones
        print("RECOMMENDATIONS:")
        if expired > 0:
            print(f"  🚨 {expired} certificate(s) expired - RENEW IMMEDIATELY")
        if critical > 0:
            print(f"  ⚠️  {critical} certificate(s) expiring soon - SCHEDULE ROTATION")
        if warning > 0:
            print(f"  📋 {warning} certificate(s) in warning period - PLAN ROTATION")

        return sorted_certs

    def export_json(self, output_file):
        """Exporta inventario a JSON"""
        import json
        with open(output_file, 'w') as f:
            json.dump(self.certificates, f, indent=2, default=str)
        print(f"\n✅ Inventory exported to {output_file}")


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 inventory.py <directory>")
        sys.exit(1)

    directory = sys.argv[1]

    inventory = CertificateInventory(directory)
    inventory.scan_directory(directory)
    inventory.generate_report()

    # Exportar a JSON
    inventory.export_json('certificate_inventory.json')
```

### Uso del Inventario

```bash
# Hacer ejecutable
chmod +x scripts/inventory.py

# Escanear certificados (desde el lab anterior)
./scripts/inventory.py ../pki-lab/intermediate-ca-tls/certs/
```

---

## Parte 3: Rotación de Certificados TLS (Blue-Green)

### Escenario

- **Certificado actual**: `www.example.com` (RSA 2048, expira en 30 días)
- **Certificado nuevo**: `www.example.com` (RSA 4096, validez 1 año)
- **Estrategia**: Blue-Green (preparar nuevo, cambiar, validar)

### Paso 1: Preparar Nuevo Certificado (Green)

```bash
cd rotation-lab/new-keys/tls

# 1. Generar nueva clave privada (RSA 4096)
openssl genrsa -out www.example.com-new.key 4096
chmod 400 www.example.com-new.key

# 2. Crear CSR con SANs actualizadas
cat > www.example.com-new.cnf <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=California
L=San Francisco
O=Example Corp
CN=www.example.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = www.example.com
DNS.2 = example.com
DNS.3 = api.example.com
DNS.4 = *.dev.example.com
DNS.5 = www2.example.com
EOF

# 3. Generar CSR
openssl req -new -key www.example.com-new.key \
    -out www.example.com-new.csr \
    -config www.example.com-new.cnf

# 4. Firmar con Intermediate CA (desde lab anterior)
# (Asumiendo que tenemos acceso a la PKI del Lab 1)
openssl ca -config ../../pki-lab/intermediate-ca-tls/openssl.cnf \
    -extensions server_cert \
    -days 395 -notext -md sha256 \
    -in www.example.com-new.csr \
    -out www.example.com-new.crt

# 5. Verificar nuevo certificado
openssl x509 -in www.example.com-new.crt -text -noout

# 6. Verificar cadena
openssl verify -CAfile ../../pki-lab/intermediate-ca-tls/certs/ca-chain.crt \
    www.example.com-new.crt
```

### Paso 2: Backup del Entorno Actual (Blue)

```bash
cd ../../

# Backup de certificados y claves actuales
cp current-keys/tls/* backup/pre-rotation/
ls -lh backup/pre-rotation/

# Crear snapshot de configuraciones
cat > backup/pre-rotation/rotation-metadata.txt <<EOF
Rotation Date: $(date)
Old Certificate: www.example.com.crt
Old Key: www.example.com.key
Old Algorithm: RSA 2048
Old Expiry: $(openssl x509 -in current-keys/tls/www.example.com.crt -noout -enddate 2>/dev/null || echo "N/A")

New Certificate: www.example.com-new.crt
New Key: www.example.com-new.key
New Algorithm: RSA 4096
New Expiry: $(openssl x509 -in new-keys/tls/www.example.com-new.crt -noout -enddate)
EOF

cat backup/pre-rotation/rotation-metadata.txt
```

### Paso 3: Validación en Paralelo (Green Validation)

```bash
# Simular servidor web con nuevo certificado en puerto alternativo
# (Requiere instalación de nginx o apache)

# Opción 1: Usar OpenSSL s_server para validación rápida
cd new-keys/tls

# Terminal 1: Servidor de prueba con nuevo certificado
openssl s_server -accept 4433 \
    -cert www.example.com-new.crt \
    -key www.example.com-new.key \
    -CAfile ../../pki-lab/intermediate-ca-tls/certs/ca-chain.crt \
    -www

# Terminal 2: Cliente de prueba
openssl s_client -connect localhost:4433 \
    -CAfile ../../pki-lab/intermediate-ca-tls/certs/ca-chain.crt \
    -servername www.example.com \
    -showcerts

# Verificar que muestra:
# - Verify return code: 0 (ok)
# - Certificado correcto en la cadena
```

### Paso 4: Cambio (Switch Blue → Green)

```bash
# Detener servicio actual (simulado)
# sudo systemctl stop nginx  # (en producción)

# Actualizar certificados
cd current-keys/tls
mv www.example.com.crt www.example.com.crt.old
mv www.example.com.key www.example.com.key.old

ln -s ../../new-keys/tls/www.example.com-new.crt www.example.com.crt
ln -s ../../new-keys/tls/www.example.com-new.key www.example.com.key

# Verificar symlinks
ls -l

# Reiniciar servicio (simulado)
# sudo systemctl start nginx  # (en producción)
```

### Paso 5: Validación Post-Rotación

Crear `scripts/validate_rotation.sh`:

```bash
#!/bin/bash
# Validación automatizada post-rotación

set -e

echo "======================================"
echo "POST-ROTATION VALIDATION"
echo "======================================"
echo ""

CERT_FILE="$1"
KEY_FILE="$2"
CA_CHAIN="$3"

if [ -z "$CERT_FILE" ] || [ -z "$KEY_FILE" ] || [ -z "$CA_CHAIN" ]; then
    echo "Usage: $0 <cert_file> <key_file> <ca_chain>"
    exit 1
fi

echo "1. Verificando existencia de archivos..."
[ -f "$CERT_FILE" ] && echo "  ✅ Certificado encontrado" || { echo "  ❌ Certificado no encontrado"; exit 1; }
[ -f "$KEY_FILE" ] && echo "  ✅ Clave privada encontrada" || { echo "  ❌ Clave privada no encontrada"; exit 1; }
[ -f "$CA_CHAIN" ] && echo "  ✅ CA chain encontrada" || { echo "  ❌ CA chain no encontrada"; exit 1; }
echo ""

echo "2. Verificando cadena de certificación..."
openssl verify -CAfile "$CA_CHAIN" "$CERT_FILE" && echo "  ✅ Cadena válida" || { echo "  ❌ Cadena inválida"; exit 1; }
echo ""

echo "3. Verificando correspondencia cert-key..."
CERT_MODULUS=$(openssl x509 -noout -modulus -in "$CERT_FILE" | openssl md5)
KEY_MODULUS=$(openssl rsa -noout -modulus -in "$KEY_FILE" 2>/dev/null | openssl md5)

if [ "$CERT_MODULUS" == "$KEY_MODULUS" ]; then
    echo "  ✅ Certificado y clave privada coinciden"
else
    echo "  ❌ Certificado y clave privada NO coinciden"
    exit 1
fi
echo ""

echo "4. Verificando fecha de expiración..."
EXPIRY=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "  Expira: $EXPIRY"
echo "  Días restantes: $DAYS_LEFT"

if [ $DAYS_LEFT -lt 30 ]; then
    echo "  ⚠️  Certificado expira en menos de 30 días"
elif [ $DAYS_LEFT -lt 90 ]; then
    echo "  🟡 Certificado expira en menos de 90 días"
else
    echo "  ✅ Certificado válido por $DAYS_LEFT días"
fi
echo ""

echo "5. Verificando algoritmo de clave..."
KEY_SIZE=$(openssl x509 -in "$CERT_FILE" -noout -text | grep "Public-Key:" | grep -oE '[0-9]+')
echo "  Tamaño de clave: $KEY_SIZE bits"

if [ $KEY_SIZE -lt 2048 ]; then
    echo "  ❌ Clave débil (< 2048 bits)"
    exit 1
else
    echo "  ✅ Tamaño de clave adecuado"
fi
echo ""

echo "6. Verificando algoritmo de firma..."
SIG_ALG=$(openssl x509 -in "$CERT_FILE" -noout -text | grep "Signature Algorithm:" | head -1 | awk '{print $3}')
echo "  Algoritmo: $SIG_ALG"

if [[ "$SIG_ALG" == *"sha1"* ]]; then
    echo "  ❌ Algoritmo de firma débil (SHA-1)"
    exit 1
else
    echo "  ✅ Algoritmo de firma adecuado"
fi
echo ""

echo "======================================"
echo "✅ VALIDACIÓN COMPLETADA EXITOSAMENTE"
echo "======================================"
```

### Uso del Script de Validación

```bash
chmod +x scripts/validate_rotation.sh

./scripts/validate_rotation.sh \
    new-keys/tls/www.example.com-new.crt \
    new-keys/tls/www.example.com-new.key \
    ../pki-lab/intermediate-ca-tls/certs/ca-chain.crt
```

---

## Parte 4: Rotación con Algoritmo Diferente (RSA → ECDSA)

### ¿Por Qué ECDSA?

| Característica | RSA 2048 | RSA 4096 | ECDSA P-256 | ECDSA P-384 |
|----------------|----------|----------|-------------|-------------|
| **Tamaño de clave pública** | 256 bytes | 512 bytes | 64 bytes | 96 bytes |
| **Tamaño de firma** | 256 bytes | 512 bytes | 64 bytes | 96 bytes |
| **Velocidad de firma** | Lenta | Muy lenta | Rápida | Rápida |
| **Velocidad de verificación** | Rápida | Rápida | Muy rápida | Muy rápida |
| **Seguridad equivalente** | 112 bits | 140 bits | 128 bits | 192 bits |
| **Uso de CPU** | Alto | Muy alto | Bajo | Bajo |
| **Uso en IoT** | No recomendado | No recomendado | ✅ Ideal | ✅ Ideal |

### Generar Certificado ECDSA

```bash
cd new-keys/tls

# 1. Generar clave privada ECDSA P-256
openssl ecparam -genkey -name prime256v1 -out api.example.com-ecdsa.key

# Ver parámetros de la curva
openssl ec -in api.example.com-ecdsa.key -text -noout

# 2. Crear CSR
cat > api.example.com-ecdsa.cnf <<EOF
[req]
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=California
O=Example Corp
CN=api.example.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = api.example.com
DNS.2 = api-v2.example.com
EOF

openssl req -new -key api.example.com-ecdsa.key \
    -out api.example.com-ecdsa.csr \
    -config api.example.com-ecdsa.cnf

# 3. Firmar con Intermediate CA
# (Requiere que openssl.cnf de la CA soporte ECDSA)
openssl ca -config ../../pki-lab/intermediate-ca-tls/openssl.cnf \
    -extensions server_cert \
    -days 395 -notext -md sha256 \
    -in api.example.com-ecdsa.csr \
    -out api.example.com-ecdsa.crt

# 4. Verificar certificado ECDSA
openssl x509 -in api.example.com-ecdsa.crt -text -noout | grep -A 5 "Public Key Algorithm"

# Salida esperada:
#     Public Key Algorithm: id-ecPublicKey
#         Public-Key: (256 bit)
#         ASN1 OID: prime256v1
#         NIST CURVE: P-256
```

### Comparación de Tamaños

```bash
# Comparar tamaños de claves y certificados
echo "=== Tamaños de Archivos ==="
ls -lh www.example.com-new.key api.example.com-ecdsa.key
ls -lh www.example.com-new.crt api.example.com-ecdsa.crt

# Comparar tamaños de firma TLS
echo ""
echo "=== Tamaño de Firma TLS ==="
openssl x509 -in www.example.com-new.crt -text -noout | grep -A 50 "Signature Algorithm" | tail -20
openssl x509 -in api.example.com-ecdsa.crt -text -noout | grep -A 50 "Signature Algorithm" | tail -20
```

---

## Parte 5: Rolling Rotation (Rotación Gradual)

### Escenario: 10 Servidores Web

Simular rotación gradual de 10 servidores:

```bash
cd rotation-lab

# Crear directorio para simular múltiples servidores
mkdir -p servers/{server01..server10}/{certs,keys}

# Script de rotación gradual
cat > scripts/rolling_rotation.sh <<'EOF'
#!/bin/bash
# Rolling Rotation - Rotar certificados gradualmente

set -e

SERVERS=("server01" "server02" "server03" "server04" "server05" "server06" "server07" "server08" "server09" "server10")
BATCH_SIZE=2  # Rotar 2 servidores a la vez
WAIT_TIME=10  # Esperar 10 segundos entre batches

NEW_CERT="new-keys/tls/www.example.com-new.crt"
NEW_KEY="new-keys/tls/www.example.com-new.key"

echo "======================================"
echo "ROLLING ROTATION"
echo "======================================"
echo "Total servers: ${#SERVERS[@]}"
echo "Batch size: $BATCH_SIZE"
echo "Wait time between batches: ${WAIT_TIME}s"
echo ""

# Contador
total_rotated=0
total_failed=0

# Procesar en batches
for (( i=0; i<${#SERVERS[@]}; i+=BATCH_SIZE )); do
    batch_num=$((i / BATCH_SIZE + 1))
    echo "--- Batch $batch_num ---"

    # Procesar servidores en el batch actual
    for (( j=i; j<i+BATCH_SIZE && j<${#SERVERS[@]}; j++ )); do
        server="${SERVERS[$j]}"
        echo "  Rotating $server..."

        # Copiar nuevos certificados
        cp "$NEW_CERT" "servers/$server/certs/server.crt"
        cp "$NEW_KEY" "servers/$server/keys/server.key"

        # Simular validación
        if openssl x509 -in "servers/$server/certs/server.crt" -noout -checkend 0 >/dev/null 2>&1; then
            echo "    ✅ $server rotated successfully"
            ((total_rotated++))
        else
            echo "    ❌ $server rotation FAILED"
            ((total_failed++))
        fi
    done

    # Esperar entre batches (excepto en el último)
    if [ $((i + BATCH_SIZE)) -lt ${#SERVERS[@]} ]; then
        echo ""
        echo "  ⏳ Waiting ${WAIT_TIME}s before next batch..."
        sleep $WAIT_TIME
        echo ""
    fi
done

echo ""
echo "======================================"
echo "ROTATION SUMMARY"
echo "======================================"
echo "Total rotated: $total_rotated"
echo "Total failed: $total_failed"
echo "Success rate: $(( total_rotated * 100 / ${#SERVERS[@]} ))%"
echo "======================================"
EOF

chmod +x scripts/rolling_rotation.sh
```

### Ejecutar Rolling Rotation

```bash
# Crear certificados iniciales (simulación)
for i in {01..10}; do
    cp new-keys/tls/www.example.com-new.crt servers/server$i/certs/server.crt
    cp new-keys/tls/www.example.com-new.key servers/server$i/keys/server.key
done

# Ejecutar rotación gradual
./scripts/rolling_rotation.sh
```

---

## Parte 6: Automatización Completa con Python

### Key Rotation Manager

Crear `scripts/key_rotation_manager.py`:

```python
#!/usr/bin/env python3
"""
Key Rotation Manager - Automated Key Rotation System
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
import yaml
import click
from tabulate import tabulate
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec

class KeyRotationManager:
    def __init__(self, config_file):
        self.config = self.load_config(config_file)
        self.base_dir = Path(self.config.get('base_dir', '.'))
        self.ca_dir = Path(self.config.get('ca_dir', '../pki-lab/intermediate-ca-tls'))
        self.backup_dir = self.base_dir / 'backup'
        self.log_dir = self.base_dir / 'logs'

        # Crear directorios si no existen
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def load_config(self, config_file):
        """Carga configuración desde YAML"""
        with open(config_file, 'r') as f:
            return yaml.safe_load(f)

    def log(self, message):
        """Registra mensaje en log file"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_message = f"[{timestamp}] {message}"
        print(log_message)

        log_file = self.log_dir / f"rotation_{datetime.now().strftime('%Y%m%d')}.log"
        with open(log_file, 'a') as f:
            f.write(log_message + '\n')

    def backup_current_cert(self, cert_path):
        """Realiza backup del certificado actual"""
        cert_path = Path(cert_path)
        if not cert_path.exists():
            self.log(f"⚠️  Certificate not found: {cert_path}")
            return False

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_subdir = self.backup_dir / f"backup_{timestamp}"
        backup_subdir.mkdir(parents=True, exist_ok=True)

        # Backup cert y key
        shutil.copy2(cert_path, backup_subdir / cert_path.name)

        key_path = cert_path.with_suffix('.key')
        if key_path.exists():
            shutil.copy2(key_path, backup_subdir / key_path.name)

        self.log(f"✅ Backup created: {backup_subdir}")
        return True

    def generate_new_key(self, algorithm='rsa', key_size=4096, curve='prime256v1'):
        """Genera nueva clave privada"""
        if algorithm.lower() == 'rsa':
            self.log(f"Generating RSA {key_size} key...")
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size,
                backend=default_backend()
            )
        elif algorithm.lower() == 'ecdsa':
            self.log(f"Generating ECDSA {curve} key...")
            if curve == 'prime256v1':
                curve_obj = ec.SECP256R1()
            elif curve == 'secp384r1':
                curve_obj = ec.SECP384R1()
            elif curve == 'secp521r1':
                curve_obj = ec.SECP521R1()
            else:
                raise ValueError(f"Unsupported curve: {curve}")

            private_key = ec.generate_private_key(curve_obj, default_backend())
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        return private_key

    def create_csr(self, private_key, subject_dict, san_list):
        """Crea Certificate Signing Request"""
        subject_attrs = []
        for key, value in subject_dict.items():
            if key == 'C':
                oid = NameOID.COUNTRY_NAME
            elif key == 'ST':
                oid = NameOID.STATE_OR_PROVINCE_NAME
            elif key == 'L':
                oid = NameOID.LOCALITY_NAME
            elif key == 'O':
                oid = NameOID.ORGANIZATION_NAME
            elif key == 'OU':
                oid = NameOID.ORGANIZATIONAL_UNIT_NAME
            elif key == 'CN':
                oid = NameOID.COMMON_NAME
            else:
                continue

            subject_attrs.append(x509.NameAttribute(oid, value))

        subject = x509.Name(subject_attrs)

        # SANs
        san_entries = [x509.DNSName(san) for san in san_list]

        csr = (
            x509.CertificateSigningRequestBuilder()
            .subject_name(subject)
            .add_extension(
                x509.SubjectAlternativeName(san_entries),
                critical=False
            )
            .sign(private_key, hashes.SHA256(), default_backend())
        )

        return csr

    def sign_csr(self, csr_path, output_cert_path):
        """Firma CSR con la CA"""
        config_file = self.ca_dir / 'openssl.cnf'

        cmd = [
            'openssl', 'ca',
            '-config', str(config_file),
            '-extensions', 'server_cert',
            '-days', '395',
            '-notext',
            '-md', 'sha256',
            '-in', str(csr_path),
            '-out', str(output_cert_path),
            '-batch'  # No preguntar confirmación
        ]

        try:
            result = subprocess.run(cmd, cwd=str(self.ca_dir), capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ CSR signed successfully: {output_cert_path}")
                return True
            else:
                self.log(f"❌ Error signing CSR: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ Exception signing CSR: {e}")
            return False

    def rotate_certificate(self, cert_config):
        """Ejecuta rotación completa de un certificado"""
        self.log(f"\n{'='*60}")
        self.log(f"Starting rotation: {cert_config['name']}")
        self.log(f"{'='*60}")

        # 1. Backup
        current_cert_path = Path(cert_config['current_cert'])
        if not self.backup_current_cert(current_cert_path):
            self.log("❌ Backup failed, aborting rotation.")
            return False

        # 2. Generar nueva clave
        algorithm = cert_config.get('algorithm', 'rsa')
        key_size = cert_config.get('key_size', 4096)
        curve = cert_config.get('curve', 'prime256v1')

        try:
            private_key = self.generate_new_key(algorithm, key_size, curve)
        except Exception as e:
            self.log(f"❌ Error generating key: {e}")
            return False

        # Guardar clave privada
        new_key_path = Path(cert_config['new_key'])
        new_key_path.parent.mkdir(parents=True, exist_ok=True)

        with open(new_key_path, 'wb') as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        os.chmod(new_key_path, 0o400)
        self.log(f"✅ New key saved: {new_key_path}")

        # 3. Crear CSR
        subject = cert_config['subject']
        sans = cert_config['sans']

        try:
            csr = self.create_csr(private_key, subject, sans)
        except Exception as e:
            self.log(f"❌ Error creating CSR: {e}")
            return False

        # Guardar CSR
        csr_path = new_key_path.with_suffix('.csr')
        with open(csr_path, 'wb') as f:
            f.write(csr.public_bytes(serialization.Encoding.PEM))
        self.log(f"✅ CSR created: {csr_path}")

        # 4. Firmar CSR
        new_cert_path = Path(cert_config['new_cert'])
        if not self.sign_csr(csr_path, new_cert_path):
            self.log("❌ Signing failed, aborting rotation.")
            return False

        # 5. Verificar certificado
        if not self.verify_certificate(new_cert_path):
            self.log("❌ Verification failed, aborting rotation.")
            return False

        # 6. Activar nuevo certificado (opcional: requiere confirmar)
        if cert_config.get('auto_activate', False):
            self.activate_certificate(new_cert_path, new_key_path, current_cert_path)

        self.log(f"✅ Rotation completed: {cert_config['name']}")
        return True

    def verify_certificate(self, cert_path):
        """Verifica certificado contra CA chain"""
        ca_chain = self.ca_dir / 'certs' / 'ca-chain.crt'

        cmd = ['openssl', 'verify', '-CAfile', str(ca_chain), str(cert_path)]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ Certificate verified: {cert_path}")
                return True
            else:
                self.log(f"❌ Verification failed: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ Exception verifying certificate: {e}")
            return False

    def activate_certificate(self, new_cert_path, new_key_path, current_cert_path):
        """Activa el nuevo certificado (reemplaza el actual)"""
        self.log("Activating new certificate...")

        current_cert_path = Path(current_cert_path)
        current_key_path = current_cert_path.with_suffix('.key')

        # Mover certificado y clave actuales a .old
        if current_cert_path.exists():
            shutil.move(current_cert_path, str(current_cert_path) + '.old')
        if current_key_path.exists():
            shutil.move(current_key_path, str(current_key_path) + '.old')

        # Copiar nuevos certificados
        shutil.copy2(new_cert_path, current_cert_path)
        shutil.copy2(new_key_path, current_key_path)

        self.log(f"✅ Certificate activated: {current_cert_path}")

    def check_rotation_needed(self, cert_path, days_threshold=30):
        """Verifica si un certificado necesita rotación"""
        cert_path = Path(cert_path)
        if not cert_path.exists():
            return False, "Certificate not found"

        try:
            with open(cert_path, 'rb') as f:
                cert = x509.load_pem_x509_certificate(f.read(), default_backend())

            not_after = cert.not_valid_after
            today = datetime.now()
            days_left = (not_after - today).days

            if days_left < 0:
                return True, f"Expired {abs(days_left)} days ago"
            elif days_left < days_threshold:
                return True, f"Expires in {days_left} days"
            else:
                return False, f"Valid for {days_left} days"

        except Exception as e:
            return False, f"Error reading certificate: {e}"


@click.group()
def cli():
    """Key Rotation Manager"""
    pass


@cli.command()
@click.option('--config', required=True, help='Configuration YAML file')
def rotate(config):
    """Rotate certificates based on config"""
    manager = KeyRotationManager(config)

    rotation_configs = manager.config.get('rotations', [])

    if not rotation_configs:
        click.echo("No rotations configured.")
        return

    results = []

    for cert_config in rotation_configs:
        success = manager.rotate_certificate(cert_config)
        results.append({
            'Name': cert_config['name'],
            'Status': '✅ Success' if success else '❌ Failed'
        })

    click.echo("\n" + "="*60)
    click.echo("ROTATION SUMMARY")
    click.echo("="*60)
    click.echo(tabulate(results, headers='keys', tablefmt='grid'))


@cli.command()
@click.option('--config', required=True, help='Configuration YAML file')
@click.option('--days', default=30, help='Days threshold')
def check(config, days):
    """Check which certificates need rotation"""
    manager = KeyRotationManager(config)

    rotation_configs = manager.config.get('rotations', [])

    if not rotation_configs:
        click.echo("No rotations configured.")
        return

    results = []

    for cert_config in rotation_configs:
        cert_path = cert_config['current_cert']
        needs_rotation, reason = manager.check_rotation_needed(cert_path, days)

        results.append({
            'Name': cert_config['name'],
            'Path': cert_path,
            'Needs Rotation': '✅ Yes' if needs_rotation else '❌ No',
            'Reason': reason
        })

    click.echo("\n" + "="*60)
    click.echo("ROTATION CHECK")
    click.echo("="*60)
    click.echo(tabulate(results, headers='keys', tablefmt='grid'))


if __name__ == '__main__':
    cli()
```

### Archivo de Configuración YAML

Crear `config/rotation_config.yaml`:

```yaml
base_dir: ./rotation-lab
ca_dir: ../pki-lab/intermediate-ca-tls

rotations:
  - name: "www.example.com"
    current_cert: current-keys/tls/www.example.com.crt
    current_key: current-keys/tls/www.example.com.key
    new_cert: new-keys/tls/www.example.com-rotated.crt
    new_key: new-keys/tls/www.example.com-rotated.key
    algorithm: rsa
    key_size: 4096
    subject:
      C: US
      ST: California
      L: San Francisco
      O: Example Corp
      CN: www.example.com
    sans:
      - www.example.com
      - example.com
      - api.example.com
    auto_activate: false

  - name: "api.example.com (ECDSA)"
    current_cert: current-keys/tls/api.example.com.crt
    current_key: current-keys/tls/api.example.com.key
    new_cert: new-keys/tls/api.example.com-rotated.crt
    new_key: new-keys/tls/api.example.com-rotated.key
    algorithm: ecdsa
    curve: prime256v1
    subject:
      C: US
      ST: California
      O: Example Corp
      CN: api.example.com
    sans:
      - api.example.com
      - api-v2.example.com
    auto_activate: false
```

### Uso del Key Rotation Manager

```bash
# Verificar qué certificados necesitan rotación
python3 scripts/key_rotation_manager.py check --config config/rotation_config.yaml --days 90

# Ejecutar rotación automatizada
python3 scripts/key_rotation_manager.py rotate --config config/rotation_config.yaml
```

---

## Parte 7: Ejercicios Prácticos

### Ejercicio 1: Rotación de Emergencia (Compromiso de Clave)

**Escenario**: La clave privada de `www.example.com` ha sido comprometida.

**Tareas**:
1. Revocar inmediatamente el certificado comprometido
2. Generar nuevo par de claves (RSA 4096)
3. Emitir nuevo certificado
4. Publicar CRL actualizada
5. Actualizar OCSP
6. Documentar incidente

**Tiempo límite**: 30 minutos (simulando presión de producción)

---

### Ejercicio 2: Migración Masiva RSA → ECDSA

**Objetivo**: Migrar todos los certificados TLS de RSA a ECDSA.

**Criterios de éxito**:
- 0 downtime
- Todos los certificados ECDSA P-256
- Validación automatizada
- Rollback plan documentado

---

### Ejercicio 3: Rotación Canary

**Escenario**: 100 servidores, rotar 5% inicialmente (canary), expandir si éxito.

**Implementar**:
1. Script de rotación canary
2. Métricas de monitoreo (tasa de error de TLS handshake)
3. Criterios de éxito/fallo automáticos
4. Rollback automático si falla canary

---

### Ejercicio 4: Rotación Programada

**Objetivo**: Implementar rotación automática programada (cron job).

**Requisitos**:
- Rotación automática 30 días antes de expiración
- Notificaciones por email
- Logs detallados
- Alertas en caso de fallo

---

## Checklist de Verificación

- [ ] Inventario de certificados actualizado
- [ ] Backup de certificados actuales realizado
- [ ] Nuevo certificado generado con algoritmo/tamaño correcto
- [ ] CSR firmado por CA válida
- [ ] Cadena de certificación verificada
- [ ] Validación en entorno de prueba exitosa
- [ ] Rotación ejecutada sin interrupciones
- [ ] Certificado antiguo revocado (si corresponde)
- [ ] CRL actualizada y publicada
- [ ] OCSP actualizado
- [ ] Documentación de rotación completa
- [ ] Logs archivados
- [ ] Post-rotación validation exitosa

---

## Recursos Adicionales

### Documentación

- **NIST SP 800-57 Part 1**: Recommendation for Key Management
  https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf

- **RFC 4210**: Internet X.509 Public Key Infrastructure Certificate Management Protocol (CMP)
  https://tools.ietf.org/html/rfc4210

- **CA/Browser Forum Baseline Requirements**
  https://cabforum.org/baseline-requirements-documents/

### Herramientas

- **cert-manager** (Kubernetes certificate management)
  https://cert-manager.io/

- **HashiCorp Vault** (Secrets and certificate management)
  https://www.vaultproject.io/

- **Let's Encrypt ACME** (Automated certificate issuance)
  https://letsencrypt.org/docs/

---

## Conclusión

Has completado el laboratorio de rotación avanzada de claves. Ahora puedes:

✅ Planificar y ejecutar rotaciones sin downtime
✅ Implementar diferentes estrategias (Blue-Green, Rolling, Canary)
✅ Migrar entre algoritmos criptográficos
✅ Automatizar rotación con Python
✅ Manejar escenarios de compromiso y emergencias
✅ Validar certificados post-rotación

**Próximo laboratorio**: Laboratorio 3 - ANKASecure PKI Integration

---

**Tiempo total**: ~5-6 horas
**Dificultad**: Avanzada
**Prerrequisitos**: Laboratorio 1 (PKI Completa)
