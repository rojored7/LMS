# 2.2 PROTOCOLOS DE SEGURIDAD

**Duración**: 45 minutos

---

## TLS/SSL (Transport Layer Security / Secure Sockets Layer)

### Historia
- **SSL 1.0** (1994): Nunca lanzado (inseguro)
- **SSL 2.0** (1995): DEPRECADO (vulnerabilidades graves)
- **SSL 3.0** (1996): DEPRECADO (POODLE attack 2014)
- **TLS 1.0** (1999): DEPRECADO (2020)
- **TLS 1.1** (2006): DEPRECADO (2020)
- **TLS 1.2** (2008): ✅ Soportado
- **TLS 1.3** (2018): ✅ Recomendado

### TLS Handshake (TLS 1.2)

```
Cliente                              Servidor
   |                                    |
   |--- ClientHello ------------------>|
   |    (versión, cipher suites,       |
   |     random, extensiones)          |
   |                                    |
   |<-- ServerHello -------------------|
   |    (versión, cipher suite,        |
   |     random, certificate)          |
   |                                    |
   |    [Verificar certificado]        |
   |                                    |
   |--- ClientKeyExchange ------------>|
   |    (pre-master secret cifrado)    |
   |                                    |
   |--- ChangeCipherSpec ------------->|
   |--- Finished --------------------->|
   |                                    |
   |<-- ChangeCipherSpec --------------|
   |<-- Finished -----------------------|
   |                                    |
   |===== CANAL CIFRADO ESTABLECIDO ==|
   |                                    |
   |<--- Application Data ------------->|
```

**Tiempo**: ~2 RTTs (Round Trip Times)

### TLS 1.3 Handshake (Mejorado)

```
Cliente                              Servidor
   |                                    |
   |--- ClientHello ------------------>|
   |    + KeyShare                     |
   |    + Signature                    |
   |                                    |
   |<-- ServerHello -------------------|
   |    + KeyShare                     |
   |    + Certificate                  |
   |    + CertVerify                   |
   |    + Finished                     |
   |                                    |
   |--- Finished --------------------->|
   |                                    |
   |===== DATOS CIFRADOS ==============|
```

**Tiempo**: ~1 RTT (50% más rápido!)

**0-RTT**: Con session resumption, datos instantáneos (trade-off seguridad)

### Certificados Digitales X.509

**Estructura**:
```
Certificate:
    Version: 3 (0x2)
    Serial Number: 12345678
    Signature Algorithm: sha256WithRSAEncryption
    Issuer: CN=Let's Encrypt Authority X3
    Validity
        Not Before: Jan 1 00:00:00 2024 GMT
        Not After : Apr 1 23:59:59 2024 GMT
    Subject: CN=www.example.com
    Subject Public Key Info:
        Public Key Algorithm: rsaEncryption
            RSA Public-Key: (2048 bit)
    X509v3 extensions:
        X509v3 Subject Alternative Name:
            DNS:example.com, DNS:www.example.com
        X509v3 Key Usage:
            Digital Signature, Key Encipherment
        X509v3 Extended Key Usage:
            TLS Web Server Authentication
```

**Cadena de confianza**:
```
Root CA (auto-firmado, 25 años)
    ↓
Intermediate CA (5-10 años)
    ↓
Leaf Certificate (90 días - Let's Encrypt)
```

### Cipher Suites

**Formato**:
```
TLS_<KeyExchange>_WITH_<Cipher>_<MAC>

Ejemplo:
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
│   │     │        │       │   │
│   │     │        │       │   └─ MAC: SHA-384
│   │     │        │       └─ AEAD mode
│   │     │        └─ Cipher: AES-256
│   │     └─ Auth: RSA
│   └─ Key Exchange: ECDHE
└─ Protocolo
```

**Cipher Suites Recomendados (2024)**:
```
TLS 1.3:
- TLS_AES_256_GCM_SHA384
- TLS_CHACHA20_POLY1305_SHA256
- TLS_AES_128_GCM_SHA256

TLS 1.2:
- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
- TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
```

**❌ Cipher Suites INSEGUROS (NO USAR)**:
```
- Cualquier cosa con RC4
- Cualquier cosa con MD5
- Cipher suites con "EXPORT"
- NULL cipher suites
- CBC mode en TLS 1.0/1.1
```

### Perfect Forward Secrecy (PFS)

**Concepto**: Compromiso de clave privada NO compromete sesiones pasadas

**Con PFS** (ECDHE):
```
Session 1: Clave efímera A (destruida)
Session 2: Clave efímera B (destruida)
Session 3: Clave efímera C (destruida)

Si servidor comprometido → Solo Session 3 afectada
```

**Sin PFS** (RSA key exchange):
```
Todas las sesiones usan misma clave del servidor
Si servidor comprometido → TODAS las sesiones pasadas comprometidas
```

**Implementación**:
- Usar ECDHE (Ephemeral Diffie-Hellman con curvas elípticas)
- Evitar RSA key exchange

### HSTS (HTTP Strict Transport Security)

**Header**:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Efecto**:
- Browser SOLO acepta HTTPS
- Previene SSL Stripping
- Duración: max-age en segundos

**HSTS Preload List**:
- Lista hardcodeada en browsers
- Protección desde primera visita
- Submit en: https://hstspreload.org/

---

## SSH (Secure Shell)

### Arquitectura

```
SSH Protocol Stack:

[Aplicación] (scp, sftp, tunneling)
      ↓
[SSH Connection Protocol] (canales, port forwarding)
      ↓
[SSH Authentication Protocol] (password, pubkey, hostbased)
      ↓
[SSH Transport Protocol] (cifrado, MAC, compresión)
      ↓
[TCP]
```

### SSH Handshake

```
Cliente                              Servidor
   |                                    |
   |<-- SSH-2.0-OpenSSH_8.9 -----------|
   |--- SSH-2.0-OpenSSH_8.9 ---------->|
   |                                    |
   |<-- KEX Init (algoritmos) ---------|
   |--- KEX Init (algoritmos) -------->|
   |                                    |
   |    [Negociar algoritmos]          |
   |                                    |
   |<-- ECDH Key Exchange -------------|
   |--- ECDH Key Exchange ------------->|
   |                                    |
   |    [Derivar session keys]         |
   |                                    |
   |<-- New Keys -----------------------|
   |--- New Keys ---------------------->|
   |                                    |
   |===== CANAL CIFRADO ===============|
   |                                    |
   |--- Auth Request ----------------->|
   |<-- Auth Success/Failure -----------|
```

### Autenticación SSH

**1. Password** (menos seguro):
```bash
ssh user@host
# Ingresa password
```

**2. Public Key** (recomendado):
```bash
# Generar par de claves
ssh-keygen -t ed25519 -C "tu@email.com"

# Copiar clave pública al servidor
ssh-copy-id user@host

# Conectar (sin password)
ssh user@host
```

**3. Host-based** (para confianza entre hosts)

**4. Keyboard-interactive** (MFA, TOTP)

### Configuración Segura SSH

**Server** (`/etc/ssh/sshd_config`):
```bash
# Deshabilitar password auth
PasswordAuthentication no

# Solo public key
PubkeyAuthentication yes

# No root login
PermitRootLogin no

# Versión de protocolo
Protocol 2

# Cipher suites fuertes
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org

# Port no estándar (opcional)
Port 2222

# Limit users
AllowUsers alice bob

# SSH keys only
AuthenticationMethods publickey
```

**Cliente** (`~/.ssh/config`):
```bash
Host myserver
    HostName 192.168.1.100
    User alice
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

    # Security
    StrictHostKeyChecking yes
    VisualHostKey yes

    # Forward agent (cuidado)
    ForwardAgent no
```

### SSH Tunneling (Port Forwarding)

**Local Port Forwarding**:
```bash
# Acceder servicio remoto via túnel
ssh -L 8080:localhost:80 user@server

# Ahora: localhost:8080 → server:80
```

**Remote Port Forwarding**:
```bash
# Exponer puerto local a servidor remoto
ssh -R 9090:localhost:3000 user@server

# Ahora: server:9090 → localhost:3000
```

**Dynamic Port Forwarding (SOCKS)**:
```bash
# Proxy SOCKS5
ssh -D 1080 user@server

# Configure browser: SOCKS5 localhost:1080
# Todo el tráfico del browser pasa por túnel
```

---

## IPsec (Internet Protocol Security)

### Componentes

**AH (Authentication Header)**:
- Autenticación e integridad
- NO cifrado
- Protege IP header y payload

**ESP (Encapsulating Security Payload)**:
- Cifrado + autenticación
- Protege payload solamente

### Modos

**Transport Mode**:
```
[IP Header][IPsec Header][TCP][Data]
                  ↑
          Solo esto cifrado
```
- Usado para host-to-host
- No modifica IP header

**Tunnel Mode**:
```
[New IP][IPsec][Original IP][TCP][Data]
              ↑_________________________↑
                    Todo cifrado
```
- Usado para VPNs site-to-site
- Encapsula paquete completo

### IKE (Internet Key Exchange)

**IKEv2 (2005)** - Recomendado

**Phase 1** (IKE SA):
```
Establecer canal seguro
- Autenticación (PSK, certificates)
- Acuerdo de claves (DH)
- Negociar crypto
```

**Phase 2** (IPsec SA):
```
Crear túnel de datos
- Usar canal de Phase 1
- Negociar ESP/AH
- Instalar SAs
```

### Ejemplo: StrongSwan (Linux)

```bash
# Instalar
apt install strongswan

# Configurar /etc/ipsec.conf
conn myvpn
    type=tunnel
    auto=start
    keyexchange=ikev2
    authby=secret
    left=%any
    leftid=@client
    leftsubnet=0.0.0.0/0
    right=vpn.example.com
    rightid=@server
    rightsubnet=0.0.0.0/0
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!

# PSK en /etc/ipsec.secrets
@client @server : PSK "your-strong-psk-here"

# Iniciar
ipsec start
```

---

## DNSSEC (DNS Security Extensions)

### Problema con DNS Normal

```
Atacante puede:
- DNS Spoofing: Respuesta falsa
- Cache Poisoning: Contaminar cache
- Man-in-the-Middle: Interceptar queries
```

### Solución: DNSSEC

**Añade firmas criptográficas** a registros DNS

**Tipos de Registros**:
```
RRSIG: Firma digital del record
DNSKEY: Clave pública de zona
DS: Hash de DNSKEY (en parent zone)
NSEC/NSEC3: Proof of non-existence
```

**Cadena de Confianza**:
```
. (root) [Trust Anchor]
    ↓ (DS record)
.com [DNSKEY + RRSIG]
    ↓ (DS record)
example.com [DNSKEY + RRSIG]
    ↓
www.example.com [A record + RRSIG]
```

### Verificación DNSSEC

```bash
# Consulta con validación DNSSEC
dig +dnssec www.example.com

# Verificar manualmente
delv @8.8.8.8 www.example.com
```

**Flags importantes**:
- **ad** (Authenticated Data): DNSSEC validado
- **cd** (Checking Disabled): Sin validación

### Limitaciones DNSSEC

❌ **NO cifra** queries (usa DoH/DoT para eso)
❌ **NO protege privacidad** (queries visibles)
✅ **Solo garantiza autenticidad** e integridad

---

## DNS over HTTPS (DoH) y DNS over TLS (DoT)

### Problema

DNS tradicional va en **texto plano** (puerto 53/UDP)

```
ISP puede ver:
- Cada sitio que visitas
- Perfil de navegación completo
- Vender datos a advertisers
```

### Solución 1: DoT (DNS over TLS)

```
DNS queries sobre TLS
Puerto: 853/TCP
```

**Configurar (Linux)**:
```bash
# systemd-resolved
sudo nano /etc/systemd/resolved.conf

[Resolve]
DNS=1.1.1.1 9.9.9.9
DNSOverTLS=yes

sudo systemctl restart systemd-resolved
```

### Solución 2: DoH (DNS over HTTPS)

```
DNS queries como HTTPS requests
Puerto: 443/TCP (indistinguible de HTTPS normal)
```

**Configurar (Firefox)**:
```
Settings → Privacy → DNS over HTTPS
Provider: Cloudflare (1.1.1.1)
```

**Servidores públicos**:
```
Cloudflare:
- DoH: https://1.1.1.1/dns-query
- DoT: 1.1.1.1:853

Google:
- DoH: https://dns.google/dns-query
- DoT: dns.google:853

Quad9:
- DoH: https://dns.quad9.net/dns-query
- DoT: dns.quad9.net:853
```

### DoT vs DoH

| Feature | DoT | DoH |
|---------|-----|-----|
| Puerto | 853 (dedicado) | 443 (HTTPS) |
| Detectable | Sí (puede bloquearse) | No (parece HTTPS) |
| Simplicidad | Más simple | Más complejo |
| Adopción | Routers, sistemas | Browsers |

---

## Comparativa de Protocolos

| Protocolo | Capa OSI | Puerto | Propósito | Cifrado |
|-----------|----------|--------|-----------|---------|
| TLS/SSL | 5-6 | 443 | Web seguro | ✅ |
| SSH | 7 | 22 | Shell remoto | ✅ |
| IPsec | 3 | - | VPN L3 | ✅ |
| DNSSEC | 7 | 53 | DNS auth | ❌ (firma) |
| DoT | 7 | 853 | DNS cifrado | ✅ |
| DoH | 7 | 443 | DNS over HTTPS | ✅ |

---

## Mejores Prácticas

### TLS/SSL
✅ Usar TLS 1.3 (o mínimo 1.2)
✅ Perfect Forward Secrecy (ECDHE)
✅ Certificados de autoridades confiables
✅ HSTS con preload
✅ OCSP Stapling
✅ Strong cipher suites
❌ NO SSL 2.0/3.0
❌ NO TLS 1.0/1.1
❌ NO certificados auto-firmados en producción

### SSH
✅ Solo autenticación por llave pública
✅ Ed25519 o RSA 4096 bits
✅ Deshabilitar password auth
✅ No root login
✅ Port knocking (opcional)
✅ fail2ban para brute force
❌ NO password authentication
❌ NO RSA 1024 bits
❌ NO PermitRootLogin yes

### IPsec
✅ IKEv2 (no IKEv1)
✅ Strong crypto (AES-256, SHA-256)
✅ Certificados (no PSK en producción)
✅ Perfect Forward Secrecy
❌ NO 3DES
❌ NO MD5
❌ NO PSK débiles

---

[⬅️ Anterior: Fundamentos](./01_fundamentos_redes.md) | [➡️ Siguiente: Ataques de Red](./03_ataques_red.md)
