# PKI Completa: Infraestructura de Clave Pública End-to-End

## Índice

1. [Introducción a PKI](#introducción)
2. [Componentes de una PKI](#componentes)
3. [Jerarquías de Certificación](#jerarquías)
4. [Certificate Authority (CA) - Autoridad Certificadora](#ca)
5. [Registration Authority (RA)](#ra)
6. [Certificate Revocation List (CRL)](#crl)
7. [Online Certificate Status Protocol (OCSP)](#ocsp)
8. [Formatos de Certificados](#formatos)
9. [Ciclo de Vida de Certificados](#ciclo-vida)
10. [Implementación de PKI en Producción](#implementación-producción)
11. [PKI para Diferentes Casos de Uso](#casos-uso)
12. [Mejores Prácticas](#mejores-prácticas)
13. [Referencias](#referencias)

---

## Introducción a PKI {#introducción}

La **Public Key Infrastructure (PKI)** es un conjunto de roles, políticas, hardware, software y procedimientos necesarios para crear, gestionar, distribuir, usar, almacenar y revocar certificados digitales y gestionar el cifrado de clave pública.

### Objetivos de una PKI

| Objetivo | Descripción |
|----------|-------------|
| **Autenticación** | Verificar la identidad de entidades (usuarios, servidores, dispositivos) |
| **Integridad** | Asegurar que los datos no han sido modificados |
| **Confidencialidad** | Cifrar datos para que solo el receptor autorizado pueda leerlos |
| **No repudio** | Impedir que una parte niegue haber realizado una acción |
| **Autorización** | Controlar acceso a recursos basado en identidad verificada |

### Historia y Estándares

- **1977**: Creación de RSA (Rivest, Shamir, Adleman)
- **1988**: ITU-T X.509 v1 - Primer estándar de certificados digitales
- **1993**: X.509 v3 - Extensiones de certificados
- **1999**: RFC 2459 - Internet X.509 Public Key Infrastructure
- **2008**: RFC 5280 - Internet X.509 PKI Certificate and CRL Profile (actual)

---

## Componentes de una PKI {#componentes}

### Arquitectura Completa

```
┌──────────────────────────────────────────────────────────────┐
│                         ROOT CA                              │
│                  (Offline, Air-Gapped)                       │
│                                                              │
│  - Clave privada en HSM                                     │
│  - Certificado autofirmado de 20-30 años                   │
│  - Solo firma Intermediate CAs                             │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬──────────────┐
        │                     │              │              │
        ▼                     ▼              ▼              ▼
┌───────────────┐    ┌───────────────┐  ┌────────────┐  ┌────────────┐
│ Intermediate  │    │ Intermediate  │  │Policy CA   │  │Cross-Sign  │
│ CA (TLS)      │    │ CA (Code Sign)│  │            │  │ CA         │
└───────┬───────┘    └───────┬───────┘  └─────┬──────┘  └─────┬──────┘
        │                    │                 │               │
   ┌────┴─────┐         ┌────┴─────┐     ┌────┴────┐     ┌────┴────┐
   │          │         │          │     │         │     │         │
   ▼          ▼         ▼          ▼     ▼         ▼     ▼         ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ ┌────┐  ┌────┐ ┌────┐  ┌────┐
│ TLS  │  │ TLS  │  │ Code │  │ Code │ │User│  │User│ │Ext │  │Ext │
│ Cert │  │ Cert │  │ Cert │  │ Cert │ │Cert│  │Cert│ │Cert│  │Cert│
└──────┘  └──────┘  └──────┘  └──────┘ └────┘  └────┘ └────┘  └────┘

┌────────────────────────────────────────────────────────────────┐
│              SERVICIOS DE SOPORTE                              │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Registration │  │ Validation   │  │ Directory    │        │
│  │ Authority    │  │ Authority    │  │ Services     │        │
│  │ (RA)         │  │ (VA)         │  │ (LDAP/HTTP)  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ CRL          │  │ OCSP         │  │ Timestamp    │        │
│  │ Publisher    │  │ Responder    │  │ Authority    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

### Componentes Principales

#### 1. Certificate Authority (CA)
- **Root CA**: CA raíz, offline, clave privada en HSM
- **Intermediate CA**: CA intermedias, operacionales, firman certificados de usuario final
- **Issuing CA**: CA emisoras, emiten certificados directamente

#### 2. Registration Authority (RA)
- Verifica identidad de solicitantes de certificados
- No tiene clave privada de CA
- Autoriza solicitudes para que CA las firme

#### 3. Validation Authority (VA)
- Valida estado de certificados (válido/revocado/expirado)
- Implementa OCSP (Online Certificate Status Protocol)

#### 4. Certificate Repository
- Almacén público de certificados
- Implementado como LDAP, HTTP, o base de datos

#### 5. CRL Distribution Point
- Publica Certificate Revocation Lists
- Accesible vía HTTP/LDAP

#### 6. OCSP Responder
- Servicio en tiempo real para verificar estado de certificados
- Alternativa a CRLs

---

## Jerarquías de Certificación {#jerarquías}

### Modelo de Jerarquía Simple (2 niveles)

```
Root CA (offline)
  └── Issuing CA (online)
        ├── End-Entity Certificate 1
        ├── End-Entity Certificate 2
        └── End-Entity Certificate N
```

**Ventajas**:
- Simple de implementar
- Menor costo operacional
- Adecuado para organizaciones pequeñas

**Desventajas**:
- Menor seguridad (Root CA debe estar online más frecuentemente)
- No permite segregación de políticas

### Modelo de Jerarquía de 3 Niveles (Recomendado)

```
Root CA (offline, 20-30 años)
  ├── Policy CA 1 (TLS, 10 años)
  │     └── Issuing CA (TLS, 5 años)
  │           ├── TLS Certificate (1-2 años)
  │           └── ...
  ├── Policy CA 2 (Code Signing, 10 años)
  │     └── Issuing CA (Code Sign, 5 años)
  │           ├── Code Sign Certificate (3 años)
  │           └── ...
  └── Policy CA 3 (Email/User, 10 años)
        └── Issuing CA (Email, 5 años)
              ├── S/MIME Certificate (2 años)
              └── ...
```

**Ventajas**:
- Root CA completamente offline
- Segregación de políticas por tipo de certificado
- Mayor seguridad
- Facilita rotación de Intermediate CAs

**Desventajas**:
- Mayor complejidad
- Mayor costo operacional

### Modelo de Cross-Certification (Federación)

```
Organization A Root CA ←─────→ Organization B Root CA
         │                            │
         │                            │
    Intermediate CA              Intermediate CA
         │                            │
    End Certificates            End Certificates
```

**Uso**: Federación entre organizaciones, confianza mutua

---

## Certificate Authority (CA) - Autoridad Certificadora {#ca}

### Root CA - Características Técnicas

#### Configuración Recomendada

| Parámetro | Valor Recomendado |
|-----------|-------------------|
| **Algoritmo de firma** | RSA 4096 bits o ECDSA P-384 |
| **Hash** | SHA-256 o superior |
| **Validez** | 20-30 años |
| **Key Usage** | keyCertSign, cRLSign |
| **Basic Constraints** | CA:TRUE, pathLenConstraint:1 |
| **Almacenamiento de clave** | HSM FIPS 140-2 Level 3+ |
| **Disponibilidad** | Offline, air-gapped |
| **Backup** | Múltiples copias en ubicaciones físicas distintas |

#### Ejemplo de Certificado Root CA (OpenSSL)

```bash
# Generar clave privada Root CA (RSA 4096)
openssl genrsa -aes256 -out root-ca.key 4096

# Crear certificado autofirmado Root CA
openssl req -x509 -new -nodes -key root-ca.key -sha256 -days 7300 \
  -out root-ca.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=Example Corp/OU=IT Security/CN=Example Root CA"

# Verificar certificado
openssl x509 -in root-ca.crt -text -noout
```

#### Configuración OpenSSL para Root CA (openssl.cnf)

```ini
[ ca ]
default_ca = CA_default

[ CA_default ]
dir               = /etc/pki/root-ca
certs             = $dir/certs
crl_dir           = $dir/crl
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
RANDFILE          = $dir/private/.rand

private_key       = $dir/private/root-ca.key
certificate       = $dir/certs/root-ca.crt

crlnumber         = $dir/crlnumber
crl               = $dir/crl/root-ca.crl
crl_extensions    = crl_ext
default_crl_days  = 30

default_md        = sha256
name_opt          = ca_default
cert_opt          = ca_default
default_days      = 3650
preserve          = no
policy            = policy_strict

[ policy_strict ]
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

countryName_default             = US
stateOrProvinceName_default     = California
0.organizationName_default      = Example Corp
organizationalUnitName_default  = IT Security

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ v3_intermediate_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true, pathlen:0
keyUsage = critical, digitalSignature, cRLSign, keyCertSign
```

### Intermediate CA - Configuración

#### Generar Intermediate CA

```bash
# 1. Generar clave privada Intermediate CA
openssl genrsa -aes256 -out intermediate-ca.key 4096

# 2. Crear CSR (Certificate Signing Request)
openssl req -new -sha256 -key intermediate-ca.key \
  -out intermediate-ca.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=Example Corp/OU=IT Security/CN=Example Intermediate CA"

# 3. Firmar con Root CA
openssl ca -config openssl.cnf -extensions v3_intermediate_ca \
  -days 3650 -notext -md sha256 \
  -in intermediate-ca.csr \
  -out intermediate-ca.crt

# 4. Verificar cadena de certificación
openssl verify -CAfile root-ca.crt intermediate-ca.crt

# 5. Crear cadena completa (chain)
cat intermediate-ca.crt root-ca.crt > ca-chain.crt
```

---

## Registration Authority (RA) {#ra}

La **Registration Authority (RA)** es responsable de verificar la identidad de los solicitantes de certificados antes de que la CA emita el certificado.

### Funciones de la RA

1. **Verificación de Identidad**
   - Validación de documentos (DNI, pasaporte)
   - Verificación de dominio (para certificados TLS)
   - Verificación de organización (registros comerciales)

2. **Autorización de Solicitudes**
   - Aprobar/rechazar solicitudes de certificados
   - Aplicar políticas de emisión

3. **Gestión de Solicitudes**
   - Recibir y procesar CSRs
   - Comunicarse con solicitantes

4. **No tiene clave privada de CA**
   - Solo autoriza, no firma certificados

### Flujo RA - CA

```
┌─────────┐      1. CSR          ┌─────────┐      2. Authorize     ┌─────────┐
│ Usuario │ ──────────────────> │   RA    │ ──────────────────>   │   CA    │
└─────────┘                      └─────────┘                        └─────────┘
     ▲                                 │                                  │
     │                          3. Verify Identity                        │
     │                                 │                                  │
     │                                 ▼                                  │
     │                          ┌────────────┐                           │
     │                          │  Identity  │                           │
     │                          │ Validation │                           │
     │                          │  Service   │                           │
     │                          └────────────┘                           │
     │                                                                    │
     │                                                  4. Sign Certificate│
     │                                                                    │
     │                                 ┌─────────────────────────────────┘
     │                                 │
     └────────────── 5. Issue Certificate ──────────────┘
```

---

## Certificate Revocation List (CRL) {#crl}

### Estructura de CRL (RFC 5280)

```
Certificate Revocation List:
    Version: 2 (0x1)
    Signature Algorithm: sha256WithRSAEncryption
    Issuer: CN=Example Intermediate CA
    Last Update: Jan 15 10:00:00 2025 GMT
    Next Update: Jan 22 10:00:00 2025 GMT
    CRL extensions:
        X509v3 Authority Key Identifier:
            keyid:12:34:56:78:9A:BC:...
        X509v3 CRL Number:
            1234

Revoked Certificates:
    Serial Number: 0A1B2C3D4E5F
        Revocation Date: Jan 10 14:30:00 2025 GMT
        CRL entry extensions:
            X509v3 CRL Reason Code:
                Key Compromise

    Serial Number: 0F5E4D3C2B1A
        Revocation Date: Jan 12 09:15:00 2025 GMT
        CRL entry extensions:
            X509v3 CRL Reason Code:
                Superseded

    Signature Algorithm: sha256WithRSAEncryption
         aa:bb:cc:dd:ee:ff:...
```

### Generar CRL con OpenSSL

```bash
# Revocar un certificado
openssl ca -config openssl.cnf -revoke certs/compromised-cert.crt \
  -crl_reason keyCompromise

# Generar CRL
openssl ca -config openssl.cnf -gencrl -out crl/intermediate-ca.crl

# Verificar CRL
openssl crl -in crl/intermediate-ca.crl -noout -text

# Convertir CRL a formato DER
openssl crl -in crl/intermediate-ca.crl -outform DER \
  -out crl/intermediate-ca.crl.der
```

### CRL Reasons (Códigos de Revocación)

| Código | Razón | Descripción |
|--------|-------|-------------|
| **0** | unspecified | Razón no especificada |
| **1** | keyCompromise | Clave privada comprometida |
| **2** | cACompromise | CA comprometida |
| **3** | affiliationChanged | Afiliación cambió (empleado dejó la empresa) |
| **4** | superseded | Certificado reemplazado por uno nuevo |
| **5** | cessationOfOperation | Cese de operaciones |
| **6** | certificateHold | Suspensión temporal (reversible) |
| **8** | removeFromCRL | Remover de CRL (certificateHold reversado) |
| **9** | privilegeWithdrawn | Privilegios retirados |
| **10** | aACompromise | Attribute Authority comprometida |

### Limitaciones de CRL

| Limitación | Impacto |
|------------|---------|
| **Tamaño** | CRLs pueden crecer hasta varios MB con miles de certificados revocados |
| **Latencia** | Publicación periódica (ej. cada 7 días), no en tiempo real |
| **Ancho de banda** | Clientes deben descargar CRL completa |
| **Disponibilidad** | Si CRL no está accesible, validación puede fallar |

---

## Online Certificate Status Protocol (OCSP) {#ocsp}

### OCSP vs CRL

| Característica | CRL | OCSP |
|----------------|-----|------|
| **Latencia** | Alta (publicación periódica) | Baja (tiempo real) |
| **Tamaño de respuesta** | Grande (toda la lista) | Pequeño (solo estado del certificado) |
| **Ancho de banda** | Alto | Bajo |
| **Complejidad** | Baja | Media |
| **Privacidad** | Alta (descarga completa) | Baja (revela qué certificado se verifica) |

### Flujo OCSP

```
┌─────────┐                           ┌─────────────┐
│ Cliente │                           │    OCSP     │
│         │                           │  Responder  │
└────┬────┘                           └──────┬──────┘
     │                                       │
     │  1. OCSP Request                      │
     │   (Serial Number + Issuer)            │
     ├──────────────────────────────────────>│
     │                                       │
     │                                  2. Query DB
     │                                       │
     │                                       ▼
     │                              ┌─────────────────┐
     │                              │ Certificate DB  │
     │                              │  (Valid/Revoked)│
     │                              └─────────────────┘
     │                                       │
     │  3. OCSP Response                     │
     │   (good/revoked/unknown)              │
     │<──────────────────────────────────────┤
     │   Signed by OCSP Responder            │
     │                                       │
```

### OCSP Request/Response (RFC 6960)

#### OCSP Request

```
OCSP Request:
    Version: 1 (0x0)
    Requestor List:
        Certificate ID:
            Hash Algorithm: sha1
            Issuer Name Hash: 12:34:56:78:9A:...
            Issuer Key Hash: AB:CD:EF:12:34:...
            Serial Number: 0A1B2C3D4E5F
    Request Extensions:
        OCSP Nonce:
            04:14:AA:BB:CC:DD:...
```

#### OCSP Response

```
OCSP Response:
    Response Status: successful (0x0)
    Response Type: Basic OCSP Response
    Version: 1 (0x0)
    Responder ID: CN=Example OCSP Responder
    Produced At: Jan 15 10:30:00 2025 GMT
    Responses:
        Certificate ID:
            Hash Algorithm: sha1
            Issuer Name Hash: 12:34:56:78:9A:...
            Issuer Key Hash: AB:CD:EF:12:34:...
            Serial Number: 0A1B2C3D4E5F
        Cert Status: good
        This Update: Jan 15 10:30:00 2025 GMT
        Next Update: Jan 15 10:35:00 2025 GMT
    Response Extensions:
        OCSP Nonce:
            04:14:AA:BB:CC:DD:...
    Signature Algorithm: sha256WithRSAEncryption
         aa:bb:cc:dd:ee:ff:...
```

### Implementar OCSP Responder con OpenSSL

```bash
# 1. Configurar OCSP en openssl.cnf
[ v3_OCSP ]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = OCSPSigning

# 2. Generar clave para OCSP Responder
openssl genrsa -out ocsp-responder.key 2048

# 3. Crear CSR
openssl req -new -key ocsp-responder.key -out ocsp-responder.csr \
  -subj "/C=US/O=Example Corp/CN=OCSP Responder"

# 4. Firmar con Intermediate CA
openssl ca -config openssl.cnf -extensions v3_OCSP \
  -days 365 -notext -md sha256 \
  -in ocsp-responder.csr \
  -out ocsp-responder.crt

# 5. Ejecutar OCSP Responder
openssl ocsp -port 2560 -text \
  -index index.txt \
  -CA ca-chain.crt \
  -rkey ocsp-responder.key \
  -rsigner ocsp-responder.crt \
  -nrequest 1

# 6. Test OCSP desde cliente
openssl ocsp -CAfile ca-chain.crt \
  -url http://ocsp.example.com:2560 \
  -resp_text \
  -issuer intermediate-ca.crt \
  -cert client-cert.crt
```

### OCSP Stapling (RFC 6066)

**Problema**: Cliente debe contactar OCSP Responder, introduciendo latencia

**Solución**: Servidor obtiene respuesta OCSP y la "grapa" (staple) al handshake TLS

```
┌─────────┐                  ┌─────────┐                ┌──────────────┐
│ Cliente │                  │ Servidor│                │OCSP Responder│
└────┬────┘                  └────┬────┘                └──────┬───────┘
     │                            │                            │
     │  1. ClientHello            │                            │
     │   (status_request ext)     │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │  2. OCSP Request           │
     │                            │   (cached or fresh)        │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │  3. OCSP Response          │
     │                            │<───────────────────────────┤
     │                            │                            │
     │  4. ServerHello            │                            │
     │  5. Certificate            │                            │
     │  6. CertificateStatus      │                            │
     │     (OCSP Response)        │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │  7. Finish handshake       │                            │
     │<──────────────────────────>│                            │
```

**Ventajas**:
- Reduce latencia (cliente no contacta OCSP)
- Mejora privacidad (OCSP Responder no sabe qué certificados se verifican)
- Reduce carga en OCSP Responder

---

## Formatos de Certificados {#formatos}

### Formatos Comunes

| Formato | Extensión | Encoding | Uso |
|---------|-----------|----------|-----|
| **PEM** | .pem, .crt, .cer, .key | Base64 ASCII | Unix/Linux, OpenSSL |
| **DER** | .der, .cer | Binario | Windows, Java |
| **PKCS#7** | .p7b, .p7c | Base64 o binario | Cadenas de certificados, sin clave privada |
| **PKCS#12** | .pfx, .p12 | Binario | Exportar cert + clave privada (password protected) |
| **JKS** | .jks | Binario (Java) | Java KeyStore |

### Conversiones entre Formatos

```bash
# PEM a DER
openssl x509 -in cert.pem -outform DER -out cert.der

# DER a PEM
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem

# PEM a PKCS#12 (cert + clave privada)
openssl pkcs12 -export -out cert.pfx -inkey private.key -in cert.pem -certfile ca-chain.pem

# PKCS#12 a PEM
openssl pkcs12 -in cert.pfx -out cert.pem -nodes

# PEM a PKCS#7
openssl crl2pkcs7 -nocrl -certfile cert.pem -out cert.p7b

# PKCS#7 a PEM
openssl pkcs7 -print_certs -in cert.p7b -out cert.pem

# Verificar certificado PEM
openssl x509 -in cert.pem -text -noout

# Verificar PKCS#12
openssl pkcs12 -info -in cert.pfx
```

---

## Ciclo de Vida de Certificados {#ciclo-vida}

### Fases del Ciclo de Vida

```
┌────────────────────────────────────────────────────────────────┐
│                   CICLO DE VIDA DE CERTIFICADO                 │
└────────────────────────────────────────────────────────────────┘

1. SOLICITUD (Request)
   └─> Usuario/Sistema genera par de claves + CSR

2. VALIDACIÓN (Validation)
   └─> RA verifica identidad del solicitante

3. EMISIÓN (Issuance)
   └─> CA firma CSR y emite certificado

4. DISTRIBUCIÓN (Distribution)
   └─> Certificado se publica en repositorio

5. USO (Usage)
   └─> Certificado se usa para firmar/cifrar/autenticar

6. RENOVACIÓN (Renewal) [antes de expiración]
   └─> Generar nuevo certificado con nueva validez

7. REVOCACIÓN (Revocation) [opcional, si compromiso]
   └─> CA revoca certificado, publica en CRL/OCSP

8. EXPIRACIÓN (Expiration)
   └─> Certificado ya no es válido, debe renovarse

9. ARCHIVO (Archival)
   └─> Certificado y logs se archivan para auditoría
```

### Estados de Certificado

| Estado | Descripción |
|--------|-------------|
| **Pending** | Solicitud recibida, pendiente de validación |
| **Valid** | Certificado emitido y válido |
| **Expired** | Certificado expiró (pasó fecha "Not After") |
| **Revoked** | Certificado revocado antes de expiración |
| **Suspended** | Certificado temporalmente suspendido (certificateHold) |

---

## Implementación de PKI en Producción {#implementación-producción}

### Arquitectura de Referencia

```
┌──────────────────────────────────────────────────────────────────┐
│                      ROOT CA (Offline)                           │
│  - HSM FIPS 140-2 Level 3                                       │
│  - Air-gapped, vault físico                                     │
│  - Acceso solo para ceremonias de firma                         │
└─────────────────────────┬────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┬────────────────┐
        │                                   │                │
        ▼                                   ▼                ▼
┌───────────────────┐            ┌──────────────────┐  ┌──────────┐
│ Intermediate CA   │            │ Code Signing CA  │  │ Email CA │
│ (TLS/Web)         │            │                  │  │          │
│ - HSM Level 2     │            │ - HSM Level 3    │  │ - HSM L2 │
│ - Online 24/7     │            │ - Restricted     │  │ - Online │
│ - Load balanced   │            │ - Audit logs     │  │          │
└─────────┬─────────┘            └─────────┬────────┘  └────┬─────┘
          │                                │                │
    ┌─────┴──────┐                    ┌────┴────┐      ┌───┴────┐
    │            │                    │         │      │        │
    ▼            ▼                    ▼         ▼      ▼        ▼
┌────────┐  ┌────────┐           ┌────────┐ ┌──────┐ ┌───┐ ┌───┐
│TLS Cert│  │TLS Cert│           │Code Sig│ │ ... │ │...│ │...│
└────────┘  └────────┘           └────────┘ └──────┘ └───┘ └───┘

┌──────────────────────────────────────────────────────────────────┐
│              SERVICIOS DE VALIDACIÓN                             │
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐   ┌──────────────┐   │
│  │ OCSP Responder │    │ CRL Publisher  │   │  VA (LDAP)   │   │
│  │ (clustered)    │    │ (HTTP/CDN)     │   │              │   │
│  └────────────────┘    └────────────────┘   └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              SERVICIOS DE GESTIÓN                                │
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐   ┌──────────────┐   │
│  │ RA Portal      │    │ Certificate    │   │  Monitoring  │   │
│  │ (Web UI)       │    │ Lifecycle Mgmt │   │  & Alerting  │   │
│  └────────────────┘    └────────────────┘   └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Requisitos de Hardware/Software

#### Root CA

| Componente | Especificación |
|------------|----------------|
| **HSM** | Thales Luna HSM, Entrust nShield (FIPS 140-2 Level 3) |
| **Servidor** | Air-gapped, sin red, en vault físico |
| **OS** | Hardened Linux (CentOS/RHEL) o Windows Server |
| **Software** | OpenSSL 3.x, Microsoft CA, o EJBCA |
| **Backup** | Múltiples copias en ubicaciones geográficamente separadas |
| **Acceso** | Dual control (2 personas), logged |

#### Intermediate/Issuing CA

| Componente | Especificación |
|------------|----------------|
| **HSM** | FIPS 140-2 Level 2 mínimo |
| **Servidor** | Redundancia (active-active o active-passive) |
| **OS** | Hardened Linux o Windows Server |
| **Software** | EJBCA, Microsoft CA, OpenSSL, Dogtag |
| **Red** | Segmentada, firewalls, IDS/IPS |
| **Monitoreo** | SIEM, logs centralizados, alertas |

---

## PKI para Diferentes Casos de Uso {#casos-uso}

### 1. PKI para TLS/SSL (Web)

**Certificados**: Server certificates (TLS)

**Características**:
- **Validez**: 1-2 años (máximo permitido por browsers: 398 días desde 2020)
- **Key Usage**: digitalSignature, keyEncipherment
- **Extended Key Usage**: serverAuth
- **Subject Alternative Names (SAN)**: Múltiples dominios/subdominios

**Ejemplo de CSR con SANs**:

```bash
# Crear archivo de configuración con SANs
cat > req.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
CN = example.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = example.com
DNS.2 = www.example.com
DNS.3 = api.example.com
DNS.4 = *.dev.example.com
EOF

# Generar CSR
openssl req -new -key server.key -out server.csr -config req.cnf
```

### 2. PKI para Code Signing

**Certificados**: Code signing certificates

**Características**:
- **Validez**: 1-3 años
- **Key Usage**: digitalSignature
- **Extended Key Usage**: codeSigning
- **Requisitos**: Clave privada en HSM (EV Code Signing)

**Proceso**:

```bash
# Firmar binario (Windows)
signtool sign /f code-signing.pfx /p password /t http://timestamp.example.com /v binary.exe

# Verificar firma
signtool verify /pa /v binary.exe

# Firmar JAR (Java)
jarsigner -keystore code-signing.jks -storepass password app.jar "alias"

# Verificar JAR
jarsigner -verify -verbose app.jar
```

### 3. PKI para Email (S/MIME)

**Certificados**: S/MIME certificates

**Características**:
- **Validez**: 1-2 años
- **Key Usage**: digitalSignature, keyEncipherment, dataEncipherment
- **Extended Key Usage**: emailProtection
- **Subject**: email address en CN o SAN

### 4. PKI para Autenticación de Usuarios (Smart Cards)

**Certificados**: User authentication certificates

**Características**:
- **Validez**: 1-3 años
- **Key Usage**: digitalSignature, keyAgreement
- **Extended Key Usage**: clientAuth
- **Almacenamiento**: Smart card, TPM, HSM

### 5. PKI para IoT/Dispositivos

**Certificados**: Device certificates

**Características**:
- **Validez**: Variable (1-10 años dependiendo del dispositivo)
- **Identificador único**: Serial number, MAC address en Subject
- **Algoritmos**: ECDSA preferido (menor tamaño, eficiencia energética)

---

## Mejores Prácticas {#mejores-prácticas}

### Seguridad

1. **Root CA offline**: Nunca conectar Root CA a red
2. **HSMs**: Usar HSMs FIPS 140-2 Level 3 para Root CA, Level 2+ para Intermediate
3. **Dual control**: Requerir 2+ personas para operaciones críticas
4. **Audit logs**: Registrar todas las operaciones de CA
5. **Key ceremony**: Documentar y grabar ceremonias de generación de claves

### Operaciones

6. **Validez corta**: Certificados de usuario final: 1-2 años máximo
7. **Renovación automatizada**: Implementar auto-renewal (ej. ACME protocol)
8. **Monitoreo**: Alertas de expiración de certificados (30, 15, 7 días antes)
9. **OCSP**: Implementar OCSP con stapling para TLS
10. **CRL**: Publicar CRLs en CDN para alta disponibilidad

### Arquitectura

11. **Jerarquía de 3 niveles**: Root → Intermediate → End-entity
12. **Segregación**: CAs separadas por propósito (TLS, Code Signing, Email)
13. **Load balancing**: Intermediate CAs en activo-activo con balanceador
14. **Disaster recovery**: Backups de claves en múltiples ubicaciones
15. **Política de certificados**: Documentar Certificate Policy (CP) y Certificate Practice Statement (CPS)

---

## Referencias {#referencias}

### RFCs Oficiales

- **RFC 5280** - Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile
- **RFC 6960** - X.509 Internet Public Key Infrastructure Online Certificate Status Protocol (OCSP)
- **RFC 6961** - The Transport Layer Security (TLS) Multiple Certificate Status Request Extension
- **RFC 3647** - Internet X.509 Public Key Infrastructure Certificate Policy and Certification Practices Framework
- **RFC 8555** - Automatic Certificate Management Environment (ACME)

### Standards ITU-T

- **X.509** - Information technology - Open Systems Interconnection - The Directory: Public-key and attribute certificate frameworks
- **X.500** - Information technology - Open Systems Interconnection - The Directory: Overview of concepts, models and services

### NIST Publications

- **NIST SP 800-57** - Recommendation for Key Management
- **NIST SP 800-130** - A Framework for Designing Cryptographic Key Management Systems
- **FIPS 140-2/140-3** - Security Requirements for Cryptographic Modules

### CA/Browser Forum

- **Baseline Requirements for the Issuance and Management of Publicly-Trusted Certificates**
- **Extended Validation SSL Certificate Guidelines**

### Libros Técnicos

- Housley, R., & Polk, T. (2001). *Planning for PKI: Best Practices Guide for Deploying Public Key Infrastructure*. Wiley.
- Adams, C., & Lloyd, S. (2003). *Understanding PKI: Concepts, Standards, and Deployment Considerations*. Addison-Wesley.
- Brands, G. (2021). *The PKI Handbook: A Practical Guide to Deploying and Managing a Public Key Infrastructure*. PKI Press.

### Software PKI Open Source

- **EJBCA**: https://www.ejbca.org/ (Enterprise Java Beans Certificate Authority)
- **Dogtag Certificate System**: https://www.dogtagpki.org/
- **Boulder**: https://github.com/letsencrypt/boulder (ACME server de Let's Encrypt)
- **step-ca**: https://github.com/smallstep/certificates (Modern PKI for DevOps)

### Software PKI Comercial

- **Microsoft Certificate Services** (Windows Server)
- **Entrust PKI**
- **DigiCert CertCentral**
- **GlobalSign PKI Platform**

---

## Conclusión

Una PKI completa es un sistema complejo que requiere planificación cuidadosa, implementación robusta y gestión continua. Los componentes clave incluyen:

- **Jerarquía de CAs**: Root offline, Intermediate online, segregación por propósito
- **Validación**: OCSP (tiempo real) + CRL (fallback)
- **Seguridad**: HSMs, audit logs, dual control
- **Operaciones**: Automatización, monitoreo, disaster recovery
- **Cumplimiento**: Seguir RFCs, CA/Browser Forum Baseline Requirements, NIST

La elección entre implementación propia vs. PKI-as-a-Service depende de:
- Volumen de certificados
- Requisitos de cumplimiento
- Capacidad técnica del equipo
- Presupuesto

Para la mayoría de organizaciones, una combinación es óptima:
- PKI pública (Let's Encrypt, DigiCert) para TLS web
- PKI interna para autenticación de usuarios, dispositivos IoT, code signing
