# Laboratorio 1: Implementación de PKI Completa de 3 Niveles

## Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Diseñar e implementar** una jerarquía de PKI de 3 niveles (Root CA → Intermediate CA → End-Entity)
2. **Configurar y operar** una Root CA offline y una Intermediate CA online
3. **Emitir certificados** para diferentes casos de uso (TLS, Code Signing, Email)
4. **Implementar servicios** de revocación (CRL y OCSP)
5. **Validar certificados** usando OpenSSL y herramientas de verificación
6. **Automatizar** el ciclo de vida de certificados con scripts Python
7. **Simular escenarios** de compromiso y rotación de certificados

## Duración Estimada

- **Tiempo total**: 4-5 horas
- Setup inicial: 30 minutos
- Implementación PKI: 2 horas
- Ejercicios prácticos: 1.5 horas
- Laboratorio final: 1 hora

---

## Prerrequisitos

### Software Requerido

```bash
# Verificar instalación de herramientas
openssl version  # OpenSSL 3.x recomendado
python3 --version  # Python 3.8+
```

### Instalación de Dependencias

```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y openssl libssl-dev python3 python3-pip

# macOS
brew install openssl python3

# Windows (PowerShell como administrador)
choco install openssl python3

# Python libraries
pip3 install cryptography python-dateutil click tabulate
```

---

## Parte 1: Arquitectura de la PKI

### Diseño de la Jerarquía

```
┌──────────────────────────────────────────────────┐
│              ROOT CA (Offline)                   │
│  CN: Example Root CA                             │
│  Validity: 20 years                              │
│  Key: RSA 4096 bits                             │
│  Usage: keyCertSign, cRLSign                    │
└─────────────────┬────────────────────────────────┘
                  │
        ┌─────────┴─────────┬────────────────┐
        │                   │                │
        ▼                   ▼                ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────┐
│Intermediate   │  │Intermediate   │  │Intermediate  │
│CA (TLS)       │  │CA (Code Sign) │  │CA (Email)    │
│Validity: 10yr │  │Validity: 10yr │  │Validity: 10yr│
│RSA 4096       │  │RSA 4096       │  │RSA 4096      │
└───────┬───────┘  └───────┬───────┘  └──────┬───────┘
        │                  │                  │
   ┌────┴────┐        ┌────┴────┐       ┌────┴────┐
   │         │        │         │       │         │
   ▼         ▼        ▼         ▼       ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Server│ │Server│ │ Code │ │ Code │ │Email │ │Email │
│ Cert │ │ Cert │ │ Cert │ │ Cert │ │ Cert │ │ Cert │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

### Estructura de Directorios

```bash
# Crear estructura de directorios
mkdir -p pki-lab/{root-ca,intermediate-ca-tls,intermediate-ca-codesign,intermediate-ca-email}
cd pki-lab

# Para cada CA, crear subdirectorios
for ca in root-ca intermediate-ca-tls intermediate-ca-codesign intermediate-ca-email; do
    mkdir -p $ca/{private,certs,crl,newcerts,csr,scripts}
    chmod 700 $ca/private
    touch $ca/index.txt
    echo 1000 > $ca/serial
    echo 1000 > $ca/crlnumber
done
```

---

## Parte 2: Configuración de Root CA

### Archivo de Configuración OpenSSL para Root CA

Crear `root-ca/openssl.cnf`:

```ini
# Root CA Configuration

[ ca ]
default_ca = CA_default

[ CA_default ]
# Directorios y archivos
dir               = ./root-ca
certs             = $dir/certs
crl_dir           = $dir/crl
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
RANDFILE          = $dir/private/.rand

# Clave privada y certificado de Root CA
private_key       = $dir/private/root-ca.key
certificate       = $dir/certs/root-ca.crt

# CRL
crlnumber         = $dir/crlnumber
crl               = $dir/crl/root-ca.crl
crl_extensions    = crl_ext
default_crl_days  = 30

# Configuración de firma
default_md        = sha256
name_opt          = ca_default
cert_opt          = ca_default
default_days      = 3650
preserve          = no
policy            = policy_strict

[ policy_strict ]
# Root CA solo firma Intermediate CAs con política estricta
countryName             = match
stateOrProvinceName     = match
organizationName        = match
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ policy_loose ]
countryName             = optional
stateOrProvinceName     = optional
localityName            = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
default_bits        = 4096
distinguished_name  = req_distinguished_name
string_mask         = utf8only
default_md          = sha256
x509_extensions     = v3_ca

[ req_distinguished_name ]
countryName                     = Country Name (2 letter code)
stateOrProvinceName             = State or Province Name
localityName                    = Locality Name
0.organizationName              = Organization Name
organizationalUnitName          = Organizational Unit Name
commonName                      = Common Name
emailAddress                    = Email Address

# Valores por defecto
countryName_default             = US
stateOrProvinceName_default     = California
localityName_default            = San Francisco
0.organizationName_default      = Example Corp
organizationalUnitName_default  = IT Security
emailAddress_default            = pki@example.com

[ v3_ca ]
# Extensiones para Root CA
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ v3_intermediate_ca ]
# Extensiones para Intermediate CA
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true, pathlen:0
keyUsage = critical, digitalSignature, cRLSign, keyCertSign
crlDistributionPoints = URI:http://pki.example.com/crl/root-ca.crl

[ crl_ext ]
# Extensiones para CRL
authorityKeyIdentifier=keyid:always

[ ocsp ]
# Extensiones para OCSP Signing
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, OCSPSigning
```

### Generar Root CA

```bash
cd root-ca

# 1. Generar clave privada de Root CA (4096 bits, AES-256 encryption)
openssl genrsa -aes256 -out private/root-ca.key 4096
chmod 400 private/root-ca.key

# Nota: Usar password fuerte (mínimo 20 caracteres, alfanumérico + símbolos)
# Ejemplo: "RootCA!2025#SecurePass@Example$PKI"

# 2. Crear certificado autofirmado de Root CA (20 años de validez)
openssl req -config openssl.cnf \
    -key private/root-ca.key \
    -new -x509 -days 7300 -sha256 -extensions v3_ca \
    -out certs/root-ca.crt \
    -subj "/C=US/ST=California/L=San Francisco/O=Example Corp/OU=IT Security/CN=Example Root CA"

# 3. Verificar certificado Root CA
openssl x509 -noout -text -in certs/root-ca.crt

# 4. Verificar detalles clave
openssl x509 -in certs/root-ca.crt -noout -subject -issuer -dates -ext basicConstraints,keyUsage

cd ..
```

**Salida esperada**:

```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: ...
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, ST=California, L=San Francisco, O=Example Corp, OU=IT Security, CN=Example Root CA
        Validity
            Not Before: Feb 23 00:00:00 2025 GMT
            Not After : Feb 18 00:00:00 2045 GMT
        Subject: C=US, ST=California, L=San Francisco, O=Example Corp, OU=IT Security, CN=Example Root CA
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (4096 bit)
        X509v3 extensions:
            X509v3 Basic Constraints: critical
                CA:TRUE
            X509v3 Key Usage: critical
                Digital Signature, Certificate Sign, CRL Sign
```

---

## Parte 3: Configuración de Intermediate CAs

### Configuración para Intermediate CA (TLS)

Crear `intermediate-ca-tls/openssl.cnf`:

```ini
# Intermediate CA Configuration (TLS)

[ ca ]
default_ca = CA_default

[ CA_default ]
dir               = ./intermediate-ca-tls
certs             = $dir/certs
crl_dir           = $dir/crl
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
RANDFILE          = $dir/private/.rand

private_key       = $dir/private/intermediate-ca-tls.key
certificate       = $dir/certs/intermediate-ca-tls.crt

crlnumber         = $dir/crlnumber
crl               = $dir/crl/intermediate-ca-tls.crl
crl_extensions    = crl_ext
default_crl_days  = 30

default_md        = sha256
name_opt          = ca_default
cert_opt          = ca_default
default_days      = 375  # Certificados TLS: 1 año + margen
preserve          = no
policy            = policy_loose

[ policy_loose ]
countryName             = optional
stateOrProvinceName     = optional
localityName            = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
default_bits        = 4096
distinguished_name  = req_distinguished_name
string_mask         = utf8only
default_md          = sha256

[ req_distinguished_name ]
countryName                     = Country Name (2 letter code)
stateOrProvinceName             = State or Province Name
localityName                    = Locality Name
0.organizationName              = Organization Name
organizationalUnitName          = Organizational Unit Name
commonName                      = Common Name
emailAddress                    = Email Address

countryName_default             = US
stateOrProvinceName_default     = California
0.organizationName_default      = Example Corp

[ v3_intermediate_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true, pathlen:0
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ server_cert ]
# Extensiones para certificados TLS de servidor
basicConstraints = CA:FALSE
nsCertType = server
nsComment = "OpenSSL Generated Server Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
crlDistributionPoints = URI:http://pki.example.com/crl/intermediate-ca-tls.crl
authorityInfoAccess = OCSP;URI:http://ocsp.example.com

[ client_cert ]
# Extensiones para certificados de cliente
basicConstraints = CA:FALSE
nsCertType = client, email
nsComment = "OpenSSL Generated Client Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection

[ crl_ext ]
authorityKeyIdentifier=keyid:always

[ ocsp ]
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, OCSPSigning
```

### Generar Intermediate CA (TLS)

```bash
cd intermediate-ca-tls

# 1. Generar clave privada
openssl genrsa -aes256 -out private/intermediate-ca-tls.key 4096
chmod 400 private/intermediate-ca-tls.key

# 2. Crear Certificate Signing Request (CSR)
openssl req -config openssl.cnf -new -sha256 \
    -key private/intermediate-ca-tls.key \
    -out csr/intermediate-ca-tls.csr \
    -subj "/C=US/ST=California/L=San Francisco/O=Example Corp/OU=IT Security/CN=Example Intermediate CA - TLS"

# 3. Firmar CSR con Root CA
cd ../root-ca
openssl ca -config openssl.cnf -extensions v3_intermediate_ca \
    -days 3650 -notext -md sha256 \
    -in ../intermediate-ca-tls/csr/intermediate-ca-tls.csr \
    -out ../intermediate-ca-tls/certs/intermediate-ca-tls.crt

# 4. Verificar certificado
openssl x509 -noout -text -in ../intermediate-ca-tls/certs/intermediate-ca-tls.crt

# 5. Verificar cadena de certificación
openssl verify -CAfile certs/root-ca.crt ../intermediate-ca-tls/certs/intermediate-ca-tls.crt

# 6. Crear cadena completa (certificate chain)
cd ../intermediate-ca-tls
cat certs/intermediate-ca-tls.crt ../root-ca/certs/root-ca.crt > certs/ca-chain.crt

cd ..
```

**Repetir el proceso** para `intermediate-ca-codesign` y `intermediate-ca-email` (ajustar nombres y configuraciones según corresponda).

---

## Parte 4: Emisión de Certificados End-Entity

### 4.1: Certificado TLS para Servidor Web

```bash
cd intermediate-ca-tls

# 1. Generar clave privada del servidor
openssl genrsa -out private/www.example.com.key 2048
chmod 400 private/www.example.com.key

# 2. Crear configuración con SANs (Subject Alternative Names)
cat > csr/www.example.com.cnf <<EOF
[req]
default_bits = 2048
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
EOF

# 3. Crear CSR con SANs
openssl req -new -key private/www.example.com.key \
    -out csr/www.example.com.csr \
    -config csr/www.example.com.cnf

# 4. Firmar certificado con Intermediate CA
openssl ca -config openssl.cnf -extensions server_cert \
    -days 375 -notext -md sha256 \
    -in csr/www.example.com.csr \
    -out certs/www.example.com.crt

# 5. Verificar certificado
openssl x509 -noout -text -in certs/www.example.com.crt

# 6. Verificar cadena completa
openssl verify -CAfile certs/ca-chain.crt certs/www.example.com.crt

# 7. Crear bundle completo (cert + chain)
cat certs/www.example.com.crt certs/ca-chain.crt > certs/www.example.com-fullchain.crt

cd ..
```

### 4.2: Certificado para Code Signing

```bash
cd intermediate-ca-codesign

# 1. Generar clave privada
openssl genrsa -aes256 -out private/developer.key 2048
chmod 400 private/developer.key

# 2. Crear CSR
openssl req -new -key private/developer.key \
    -out csr/developer.csr \
    -subj "/C=US/ST=California/O=Example Corp/CN=John Doe (Developer)/emailAddress=john.doe@example.com"

# 3. Crear extensiones para code signing
cat > csr/codesign.ext <<EOF
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature
extendedKeyUsage = codeSigning
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
crlDistributionPoints = URI:http://pki.example.com/crl/intermediate-ca-codesign.crl
EOF

# 4. Firmar certificado
openssl ca -config openssl.cnf -extensions v3_req \
    -extfile csr/codesign.ext \
    -days 1095 -notext -md sha256 \
    -in csr/developer.csr \
    -out certs/developer.crt

# 5. Exportar a PKCS#12 (para uso en herramientas de firma)
openssl pkcs12 -export -out certs/developer.pfx \
    -inkey private/developer.key \
    -in certs/developer.crt \
    -certfile certs/ca-chain.crt \
    -name "John Doe Code Signing Certificate"

cd ..
```

### 4.3: Certificado S/MIME para Email

```bash
cd intermediate-ca-email

# 1. Generar clave privada
openssl genrsa -aes256 -out private/alice.key 2048
chmod 400 private/alice.key

# 2. Crear CSR
openssl req -new -key private/alice.key \
    -out csr/alice.csr \
    -subj "/C=US/ST=California/O=Example Corp/CN=Alice Smith/emailAddress=alice@example.com"

# 3. Crear extensiones para S/MIME
cat > csr/email.ext <<EOF
basicConstraints = CA:FALSE
keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = emailProtection, clientAuth
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
subjectAltName = email:alice@example.com
crlDistributionPoints = URI:http://pki.example.com/crl/intermediate-ca-email.crl
EOF

# 4. Firmar certificado
openssl ca -config openssl.cnf \
    -extfile csr/email.ext \
    -days 730 -notext -md sha256 \
    -in csr/alice.csr \
    -out certs/alice.crt

# 5. Exportar a PKCS#12 para clientes de email
openssl pkcs12 -export -out certs/alice.pfx \
    -inkey private/alice.key \
    -in certs/alice.crt \
    -certfile certs/ca-chain.crt \
    -name "Alice Smith Email Certificate"

cd ..
```

---

## Parte 5: Revocación de Certificados

### 5.1: Certificate Revocation List (CRL)

```bash
cd intermediate-ca-tls

# 1. Revocar un certificado (simular compromiso de clave)
openssl ca -config openssl.cnf \
    -revoke certs/www.example.com.crt \
    -crl_reason keyCompromise

# 2. Generar CRL actualizada
openssl ca -config openssl.cnf -gencrl -out crl/intermediate-ca-tls.crl

# 3. Verificar CRL
openssl crl -in crl/intermediate-ca-tls.crl -noout -text

# 4. Verificar que el certificado está en la CRL
openssl crl -in crl/intermediate-ca-tls.crl -noout -text | grep -A 5 "Serial Number"

# 5. Convertir CRL a formato DER (para distribución web)
openssl crl -in crl/intermediate-ca-tls.crl -outform DER -out crl/intermediate-ca-tls.crl.der

cd ..
```

### 5.2: OCSP Responder

**Paso 1: Generar certificado para OCSP Responder**

```bash
cd intermediate-ca-tls

# 1. Generar clave para OCSP
openssl genrsa -out private/ocsp.key 2048

# 2. Crear CSR
openssl req -new -key private/ocsp.key \
    -out csr/ocsp.csr \
    -subj "/C=US/ST=California/O=Example Corp/CN=OCSP Responder"

# 3. Firmar con extensiones OCSP
openssl ca -config openssl.cnf -extensions ocsp \
    -days 375 -notext -md sha256 \
    -in csr/ocsp.csr \
    -out certs/ocsp.crt

cd ..
```

**Paso 2: Ejecutar OCSP Responder**

```bash
cd intermediate-ca-tls

# Ejecutar OCSP Responder en puerto 2560
openssl ocsp -port 2560 -text -sha256 \
    -index index.txt \
    -CA certs/ca-chain.crt \
    -rkey private/ocsp.key \
    -rsigner certs/ocsp.crt \
    -nrequest 1

# En otra terminal, probar OCSP
cd intermediate-ca-tls
openssl ocsp -CAfile certs/ca-chain.crt \
    -url http://127.0.0.1:2560 \
    -resp_text \
    -issuer certs/intermediate-ca-tls.crt \
    -cert certs/www.example.com.crt
```

**Salida esperada para certificado revocado**:

```
Response verify OK
certs/www.example.com.crt: revoked
    This Update: Feb 23 10:00:00 2025 GMT
    Next Update: Feb 23 11:00:00 2025 GMT
    Revocation Time: Feb 23 09:30:00 2025 GMT
    Revocation Reason: keyCompromise
```

---

## Parte 6: Script de Automatización en Python

### Gestor Automatizado de PKI

Crear `scripts/pki_manager.py`:

```python
#!/usr/bin/env python3
"""
PKI Manager - Automated Certificate Management
"""

import os
import subprocess
import json
from datetime import datetime, timedelta
from pathlib import Path
import click
from tabulate import tabulate
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa

class PKIManager:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.root_ca_dir = self.base_dir / "root-ca"
        self.intermediate_dirs = {
            'tls': self.base_dir / "intermediate-ca-tls",
            'codesign': self.base_dir / "intermediate-ca-codesign",
            'email': self.base_dir / "intermediate-ca-email"
        }

    def list_certificates(self, ca_type='tls'):
        """Lista todos los certificados emitidos por una CA"""
        ca_dir = self.intermediate_dirs.get(ca_type, self.intermediate_dirs['tls'])
        index_file = ca_dir / "index.txt"

        if not index_file.exists():
            click.echo(f"❌ Index file not found: {index_file}")
            return

        certs = []
        with open(index_file, 'r') as f:
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) >= 6:
                    status = parts[0]
                    exp_date = parts[1]
                    revoke_date = parts[2] if status == 'R' else '-'
                    serial = parts[3]
                    filename = parts[4]
                    dn = parts[5]

                    # Parsear DN para extraer CN
                    cn = "Unknown"
                    for component in dn.split('/'):
                        if component.startswith('CN='):
                            cn = component[3:]
                            break

                    certs.append({
                        'Status': '✅ Valid' if status == 'V' else '❌ Revoked',
                        'Serial': serial,
                        'Common Name': cn,
                        'Expiration': exp_date,
                        'Revoke Date': revoke_date
                    })

        if certs:
            click.echo(f"\n📋 Certificates issued by {ca_type.upper()} CA:\n")
            click.echo(tabulate(certs, headers='keys', tablefmt='grid'))
        else:
            click.echo("No certificates found.")

    def check_expiration(self, days=30):
        """Verifica certificados que expiran pronto"""
        click.echo(f"\n⏰ Checking certificates expiring in {days} days...\n")

        expiring_soon = []
        today = datetime.now()
        threshold = today + timedelta(days=days)

        for ca_name, ca_dir in self.intermediate_dirs.items():
            certs_dir = ca_dir / "certs"
            if not certs_dir.exists():
                continue

            for cert_file in certs_dir.glob("*.crt"):
                if cert_file.name in ['ca-chain.crt', f'intermediate-ca-{ca_name}.crt']:
                    continue

                try:
                    with open(cert_file, 'rb') as f:
                        cert = x509.load_pem_x509_certificate(f.read(), default_backend())

                    not_after = cert.not_valid_after
                    days_left = (not_after - today).days

                    if not_after <= threshold:
                        cn = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
                        expiring_soon.append({
                            'CA Type': ca_name.upper(),
                            'Common Name': cn,
                            'Expires': not_after.strftime('%Y-%m-%d'),
                            'Days Left': days_left,
                            'Status': '🔴 URGENT' if days_left < 7 else '🟡 Warning'
                        })
                except Exception as e:
                    click.echo(f"⚠️  Error reading {cert_file}: {e}")

        if expiring_soon:
            click.echo(tabulate(expiring_soon, headers='keys', tablefmt='grid'))
        else:
            click.echo(f"✅ No certificates expiring in the next {days} days.")

    def revoke_certificate(self, ca_type, serial, reason='unspecified'):
        """Revoca un certificado"""
        ca_dir = self.intermediate_dirs.get(ca_type)
        if not ca_dir:
            click.echo(f"❌ Unknown CA type: {ca_type}")
            return

        config_file = ca_dir / "openssl.cnf"

        # Buscar certificado por serial
        index_file = ca_dir / "index.txt"
        cert_found = False

        with open(index_file, 'r') as f:
            for line in f:
                if serial.lower() in line.lower():
                    cert_found = True
                    break

        if not cert_found:
            click.echo(f"❌ Certificate with serial {serial} not found.")
            return

        # Buscar archivo del certificado
        newcerts_dir = ca_dir / "newcerts"
        cert_file = newcerts_dir / f"{serial}.pem"

        if not cert_file.exists():
            click.echo(f"❌ Certificate file not found: {cert_file}")
            return

        # Revocar certificado
        cmd = [
            'openssl', 'ca', '-config', str(config_file),
            '-revoke', str(cert_file),
            '-crl_reason', reason
        ]

        try:
            result = subprocess.run(cmd, cwd=str(ca_dir), capture_output=True, text=True)
            if result.returncode == 0:
                click.echo(f"✅ Certificate {serial} revoked successfully.")
                click.echo(f"   Reason: {reason}")

                # Generar nueva CRL
                self.generate_crl(ca_type)
            else:
                click.echo(f"❌ Error revoking certificate: {result.stderr}")
        except Exception as e:
            click.echo(f"❌ Exception: {e}")

    def generate_crl(self, ca_type):
        """Genera una nueva CRL"""
        ca_dir = self.intermediate_dirs.get(ca_type)
        config_file = ca_dir / "openssl.cnf"
        crl_file = ca_dir / "crl" / f"intermediate-ca-{ca_type}.crl"

        cmd = ['openssl', 'ca', '-config', str(config_file), '-gencrl', '-out', str(crl_file)]

        try:
            result = subprocess.run(cmd, cwd=str(ca_dir), capture_output=True, text=True)
            if result.returncode == 0:
                click.echo(f"✅ CRL generated: {crl_file}")
            else:
                click.echo(f"❌ Error generating CRL: {result.stderr}")
        except Exception as e:
            click.echo(f"❌ Exception: {e}")

    def verify_chain(self, cert_path):
        """Verifica la cadena de certificación"""
        cert_path = Path(cert_path)

        if not cert_path.exists():
            click.echo(f"❌ Certificate not found: {cert_path}")
            return

        # Determinar tipo de CA basado en la ruta
        ca_type = None
        for key, ca_dir in self.intermediate_dirs.items():
            if str(ca_path).startswith(str(ca_dir)):
                ca_type = key
                break

        if not ca_type:
            click.echo("❌ Could not determine CA type from path.")
            return

        ca_chain = self.intermediate_dirs[ca_type] / "certs" / "ca-chain.crt"

        cmd = ['openssl', 'verify', '-CAfile', str(ca_chain), str(cert_path)]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                click.echo(f"✅ {result.stdout.strip()}")
            else:
                click.echo(f"❌ Verification failed: {result.stderr}")
        except Exception as e:
            click.echo(f"❌ Exception: {e}")

    def stats(self):
        """Muestra estadísticas de la PKI"""
        click.echo("\n📊 PKI Statistics\n")

        total_certs = 0
        valid_certs = 0
        revoked_certs = 0

        stats_table = []

        for ca_name, ca_dir in self.intermediate_dirs.items():
            index_file = ca_dir / "index.txt"
            if not index_file.exists():
                continue

            ca_total = 0
            ca_valid = 0
            ca_revoked = 0

            with open(index_file, 'r') as f:
                for line in f:
                    parts = line.strip().split('\t')
                    if len(parts) >= 6:
                        status = parts[0]
                        ca_total += 1
                        if status == 'V':
                            ca_valid += 1
                        elif status == 'R':
                            ca_revoked += 1

            total_certs += ca_total
            valid_certs += ca_valid
            revoked_certs += ca_revoked

            stats_table.append({
                'CA Type': ca_name.upper(),
                'Total': ca_total,
                'Valid': ca_valid,
                'Revoked': ca_revoked
            })

        stats_table.append({
            'CA Type': '── TOTAL ──',
            'Total': total_certs,
            'Valid': valid_certs,
            'Revoked': revoked_certs
        })

        click.echo(tabulate(stats_table, headers='keys', tablefmt='grid'))


@click.group()
@click.option('--base-dir', default='./pki-lab', help='Base directory of PKI')
@click.pass_context
def cli(ctx, base_dir):
    """PKI Manager - Automated Certificate Management"""
    ctx.obj = PKIManager(base_dir)


@cli.command()
@click.option('--ca-type', default='tls', type=click.Choice(['tls', 'codesign', 'email']),
              help='CA type')
@click.pass_obj
def list(pki, ca_type):
    """List all certificates"""
    pki.list_certificates(ca_type)


@cli.command()
@click.option('--days', default=30, help='Days threshold')
@click.pass_obj
def expiring(pki, days):
    """Check expiring certificates"""
    pki.check_expiration(days)


@cli.command()
@click.option('--ca-type', required=True, type=click.Choice(['tls', 'codesign', 'email']))
@click.option('--serial', required=True, help='Certificate serial number')
@click.option('--reason', default='unspecified',
              type=click.Choice(['unspecified', 'keyCompromise', 'CACompromise',
                                 'affiliationChanged', 'superseded', 'cessationOfOperation']))
@click.pass_obj
def revoke(pki, ca_type, serial, reason):
    """Revoke a certificate"""
    pki.revoke_certificate(ca_type, serial, reason)


@cli.command()
@click.option('--ca-type', required=True, type=click.Choice(['tls', 'codesign', 'email']))
@click.pass_obj
def gencrl(pki, ca_type):
    """Generate CRL"""
    pki.generate_crl(ca_type)


@cli.command()
@click.argument('cert_path')
@click.pass_obj
def verify(pki, cert_path):
    """Verify certificate chain"""
    pki.verify_chain(cert_path)


@cli.command()
@click.pass_obj
def stats(pki):
    """Show PKI statistics"""
    pki.stats()


if __name__ == '__main__':
    cli()
```

### Uso del Script

```bash
# Hacer ejecutable
chmod +x scripts/pki_manager.py

# Listar certificados TLS
./scripts/pki_manager.py list --ca-type tls

# Verificar certificados que expiran en 60 días
./scripts/pki_manager.py expiring --days 60

# Revocar certificado
./scripts/pki_manager.py revoke --ca-type tls --serial 1000 --reason keyCompromise

# Generar CRL
./scripts/pki_manager.py gencrl --ca-type tls

# Verificar cadena de certificación
./scripts/pki_manager.py verify intermediate-ca-tls/certs/www.example.com.crt

# Ver estadísticas
./scripts/pki_manager.py stats
```

---

## Parte 7: Ejercicios Prácticos

### Ejercicio 1: Emisión de Certificado Wildcard

**Objetivo**: Emitir un certificado wildcard `*.example.com` válido para todos los subdominios.

**Pasos**:

1. Crear CSR con SAN `*.example.com`
2. Firmar con Intermediate CA (TLS)
3. Verificar que el certificado es válido para `api.example.com`, `web.example.com`, etc.

**Pista**: Usar `DNS.1 = *.example.com` en configuración de SANs.

---

### Ejercicio 2: Rotación de Intermediate CA

**Objetivo**: Simular rotación de Intermediate CA comprometida.

**Escenario**: La Intermediate CA (TLS) fue comprometida. Debes:

1. Revocar el certificado de la Intermediate CA comprometida
2. Generar nueva Intermediate CA (TLS v2)
3. Re-emitir certificados de servidores con la nueva CA
4. Actualizar cadenas de certificación

---

### Ejercicio 3: OCSP Must-Staple

**Objetivo**: Emitir certificado TLS con extensión OCSP Must-Staple.

**Pasos**:

1. Añadir extensión `tlsfeature = status_request` (OCSP Must-Staple)
2. Emitir certificado
3. Verificar con `openssl x509 -in cert.crt -text -noout | grep "TLS Feature"`

---

### Ejercicio 4: Certificado Multi-Propósito

**Objetivo**: Emitir certificado que sirva tanto para TLS como para firma de email.

**Requisitos**:
- `extendedKeyUsage = serverAuth, emailProtection`
- `keyUsage = digitalSignature, keyEncipherment`
- SANs con dominio y email

---

### Ejercicio 5: Auditoría de PKI

**Objetivo**: Usar el script Python para auditar toda la PKI.

**Tareas**:

1. Listar todos los certificados de todas las CAs
2. Identificar certificados que expiran en 90 días
3. Verificar que todas las CRLs están actualizadas (< 30 días)
4. Generar reporte en formato JSON

**Código adicional**:

```python
def audit_report(self):
    """Genera reporte de auditoría en JSON"""
    report = {
        'audit_date': datetime.now().isoformat(),
        'cas': {}
    }

    for ca_name, ca_dir in self.intermediate_dirs.items():
        index_file = ca_dir / "index.txt"
        crl_file = ca_dir / "crl" / f"intermediate-ca-{ca_name}.crl"

        ca_data = {
            'total_certs': 0,
            'valid_certs': 0,
            'revoked_certs': 0,
            'crl_updated': None
        }

        # Contar certificados
        if index_file.exists():
            with open(index_file, 'r') as f:
                for line in f:
                    parts = line.strip().split('\t')
                    if len(parts) >= 6:
                        ca_data['total_certs'] += 1
                        if parts[0] == 'V':
                            ca_data['valid_certs'] += 1
                        elif parts[0] == 'R':
                            ca_data['revoked_certs'] += 1

        # Verificar fecha de CRL
        if crl_file.exists():
            cmd = ['openssl', 'crl', '-in', str(crl_file), '-noout', '-nextupdate']
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                ca_data['crl_updated'] = result.stdout.strip()

        report['cas'][ca_name] = ca_data

    return json.dumps(report, indent=2)
```

---

## Checklist de Verificación

Antes de completar el laboratorio, verifica:

- [ ] Root CA generada con 4096 bits RSA, validez 20 años
- [ ] Root CA almacenada de forma segura (offline)
- [ ] 3 Intermediate CAs generadas y firmadas por Root CA
- [ ] Cadenas de certificación verificadas para cada Intermediate CA
- [ ] Al menos 1 certificado TLS emitido con SANs
- [ ] Al menos 1 certificado de Code Signing emitido
- [ ] Al menos 1 certificado S/MIME emitido
- [ ] CRL generada y actualizada para cada Intermediate CA
- [ ] OCSP Responder configurado y funcionando
- [ ] Al menos 1 certificado revocado exitosamente
- [ ] Script Python funcional para gestión automatizada
- [ ] Reporte de auditoría generado
- [ ] Todos los certificados verifican correctamente contra cadena

---

## Troubleshooting

### Problema: "unable to load CA private key"

**Causa**: Password de clave privada incorrecta o archivo corrupto.

**Solución**:

```bash
# Verificar integridad de clave privada
openssl rsa -in private/root-ca.key -check -noout

# Si falla, regenerar desde backup
```

---

### Problema: "certificate signature failure"

**Causa**: Certificado no firmado correctamente por la CA.

**Solución**:

```bash
# Verificar cadena de certificación
openssl verify -CAfile root-ca/certs/root-ca.crt \
    intermediate-ca-tls/certs/intermediate-ca-tls.crt

# Verificar certificado end-entity
openssl verify -CAfile intermediate-ca-tls/certs/ca-chain.crt \
    intermediate-ca-tls/certs/www.example.com.crt
```

---

### Problema: "index.txt: No such file or directory"

**Causa**: Archivo de índice no creado.

**Solución**:

```bash
touch intermediate-ca-tls/index.txt
echo 1000 > intermediate-ca-tls/serial
echo 1000 > intermediate-ca-tls/crlnumber
```

---

## Recursos Adicionales

### Documentación Oficial

- **RFC 5280**: Internet X.509 PKI Certificate and CRL Profile
  https://tools.ietf.org/html/rfc5280

- **RFC 6960**: X.509 Internet PKI OCSP
  https://tools.ietf.org/html/rfc6960

- **RFC 8555**: ACME (Automatic Certificate Management Environment)
  https://tools.ietf.org/html/rfc8555

- **OpenSSL Documentation**
  https://www.openssl.org/docs/

### Herramientas Recomendadas

- **XCA** (X Certificate and Key management)
  https://hohnstaedt.de/xca/
  - GUI para gestión de PKI

- **Easy-RSA**
  https://github.com/OpenVPN/easy-rsa
  - Scripts para PKI simplificada

- **step-ca** (Smallstep)
  https://github.com/smallstep/certificates
  - Modern PKI with ACME support

### Libros

- Adams, C., & Lloyd, S. (2003). *Understanding PKI: Concepts, Standards, and Deployment Considerations*. Addison-Wesley.

- Housley, R., & Polk, T. (2001). *Planning for PKI: Best Practices Guide*. Wiley.

---

## Conclusión

Has completado la implementación de una PKI completa de 3 niveles. Ahora deberías ser capaz de:

✅ Diseñar jerarquías de PKI según requisitos de seguridad
✅ Configurar y operar Root CAs offline e Intermediate CAs online
✅ Emitir certificados para diferentes propósitos (TLS, Code Signing, Email)
✅ Gestionar revocación mediante CRL y OCSP
✅ Automatizar operaciones con scripts Python
✅ Auditar y monitorear el estado de la PKI

**Próximos pasos**: Laboratorio 2 - Rotación Avanzada de Claves y Migración de PKI.

---

**Tiempo total**: ~4-5 horas
**Dificultad**: Avanzada
**Prerrequisitos**: Conocimientos de criptografía asimétrica, OpenSSL básico, Python
