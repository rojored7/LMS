# SSH Hardening y Gestión Segura de Acceso Remoto

## Objetivos de Aprendizaje

1. Configurar SSH de forma segura según mejores prácticas
2. Implementar autenticación basada en claves asimétricas
3. Utilizar bastion hosts y jump servers
4. Configurar autenticación de dos factores (2FA) con SSH
5. Implementar SSH tunneling y port forwarding de forma segura
6. Monitorear y auditar accesos SSH

---

## 1. Introducción a SSH Security

### 1.1 ¿Por Qué es Crítico Asegurar SSH?

SSH (Secure Shell) es el protocolo **más común** para acceso remoto a sistemas Linux. Es también uno de los **vectores de ataque más explotados**:

**Amenazas comunes:**
- **Brute force attacks**: Intentos masivos de adivinar credenciales
- **Credential stuffing**: Uso de credenciales filtradas
- **Man-in-the-Middle (MitM)**: Interposición en primera conexión
- **Exploits de versiones antiguas**: CVEs en OpenSSH (ej: CVE-2023-38408)
- **Lateral movement**: Uso de claves SSH robadas para pivotar

**Estadísticas:**
- ~50% de ataques SSH provienen de botnets (Shodan, Censys)
- Puerto 22 recibe ~10-100 intentos de login por minuto en IPs públicas
- ~30% de organizaciones sufren compromisos por claves SSH mal gestionadas

### 1.2 Arquitectura de OpenSSH

```
┌─────────────────────────────────────────────────────────┐
│                   SSH Client (ssh)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ~/.ssh/      │  │ Host Key DB  │  │ Known Hosts  │  │
│  │ - id_rsa     │  │ ~/.ssh/      │  │ Verification │  │
│  │ - id_ed25519 │  │ known_hosts  │  └──────────────┘  │
│  └──────────────┘  └──────────────┘                     │
└────────────┬────────────────────────────────────────────┘
             │
             │  SSH Protocol (TCP port 22)
             │  1. Version exchange
             │  2. Key exchange (KEX)
             │  3. Server authentication
             │  4. Client authentication
             │  5. Session encryption
             ▼
┌─────────────────────────────────────────────────────────┐
│                  SSH Server (sshd)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ /etc/ssh/    │  │ Host Keys    │  │ Authorized   │  │
│  │ sshd_config  │  │ ssh_host_*   │  │ Keys         │  │
│  │              │  │ _key         │  │ ~/.ssh/      │  │
│  └──────────────┘  └──────────────┘  │ authorized_  │  │
│                                       │ keys         │  │
│  ┌──────────────────────────────────┐ └──────────────┘  │
│  │  Authentication Methods:          │                  │
│  │  - PublicKey                      │                  │
│  │  - Password                       │                  │
│  │  - Keyboard-Interactive (PAM)     │                  │
│  │  - GSSAPI (Kerberos)              │                  │
│  └──────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Configuración Segura de sshd_config

### 2.1 Archivo de Configuración Base

**Ubicación:** `/etc/ssh/sshd_config`

**Configuración hardened completa:**

```bash
# /etc/ssh/sshd_config - HARDENED CONFIGURATION

# ============================================
# 1. PROTOCOLOS Y ALGORITMOS CRIPTOGRÁFICOS
# ============================================

# Solo SSH v2 (v1 tiene vulnerabilidades conocidas)
Protocol 2

# Key Exchange Algorithms (solo los más seguros)
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256

# Ciphers (cifrados seguros, sin CBC)
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# MACs (Message Authentication Codes)
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

# Host Key Algorithms (preferir Ed25519)
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# Host Keys (deshabilitar DSA y ECDSA débiles)
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

# ============================================
# 2. AUTENTICACIÓN
# ============================================

# DESHABILITAR autenticación por password (CRÍTICO)
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# SOLO autenticación con clave pública
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Deshabilitar métodos obsoletos
GSSAPIAuthentication no
HostbasedAuthentication no
KerberosAuthentication no
RhostsRSAAuthentication no

# Intentos de autenticación antes de desconectar
MaxAuthTries 3

# Tiempo máximo para autenticar (segundos)
LoginGraceTime 30

# ============================================
# 3. RESTRICCIONES DE ACCESO
# ============================================

# DESHABILITAR login como root (CRÍTICO)
PermitRootLogin no

# Usuarios/grupos permitidos (whitelist)
AllowUsers deployer admin monitoring
# o por grupos:
# AllowGroups sshusers

# Denegar usuarios específicos
# DenyUsers baduser compromisedaccount

# Restricción por IP/Red
# Match Address 192.168.1.0/24
#     PasswordAuthentication yes

# ============================================
# 4. SESIONES Y FORWARDING
# ============================================

# TCP forwarding (deshabilitar si no es necesario)
AllowTcpForwarding no
AllowStreamLocalForwarding no

# X11 Forwarding (deshabilitar - riesgo de seguridad)
X11Forwarding no

# Agent Forwarding (deshabilitar - peligro de robo de claves)
AllowAgentForwarding no

# Túneles de dispositivos (deshabilitar)
PermitTunnel no

# Gateway ports
GatewayPorts no

# ============================================
# 5. TIMEOUTS Y CONEXIONES
# ============================================

# ClientAlive keepalive (desconectar sesiones idle)
ClientAliveInterval 300
ClientAliveCountMax 2

# Máximo de sesiones simultáneas por conexión
MaxSessions 2

# Máximo de conexiones concurrentes pendientes de autenticación
MaxStartups 10:30:60
# 10 conexiones sin autenticar
# Después de 10, rechazar 30% de nuevas conexiones aleatoriamente
# Rechazar todas las conexiones cuando haya 60 sin autenticar

# ============================================
# 6. LOGGING Y AUDITORÍA
# ============================================

# Nivel de logging (INFO para auditoría, DEBUG para troubleshooting)
LogLevel VERBOSE

# Ubicación de logs (journald en systemd)
SyslogFacility AUTH

# ============================================
# 7. BANNERS Y COMPLIANCE
# ============================================

# Banner legal (mostrar aviso antes de login)
Banner /etc/ssh/banner.txt

# PrintMotd y PrintLastLog
PrintMotd yes
PrintLastLog yes

# ============================================
# 8. HARDENING ADICIONAL
# ============================================

# Deshabilitar .rhosts
IgnoreRhosts yes

# Strict modes (verificar permisos de archivos)
StrictModes yes

# Usar DNS reverso para verificar hostnames
UseDNS no  # Deshabilitar para evitar latencia

# Compresión (deshabilitar - puede facilitar side-channel attacks)
Compression no

# Subsistemas (solo SFTP si es necesario)
Subsystem sftp /usr/lib/openssh/sftp-server -f AUTHPRIV -l INFO

# ============================================
# 9. MATCH BLOCKS (CONFIGURACIONES CONDICIONALES)
# ============================================

# Ejemplo: SFTP jail para ciertos usuarios
Match Group sftponly
    ChrootDirectory /sftp/%u
    ForceCommand internal-sftp
    AllowTcpForwarding no
    X11Forwarding no
    PermitTunnel no

# Ejemplo: Administradores desde IPs específicas
Match User admin Address 10.0.0.0/8
    PermitRootLogin prohibit-password
    AllowTcpForwarding yes
```

### 2.2 Aplicar Cambios

```bash
# 1. Validar sintaxis
sshd -t

# 2. Hacer backup
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 3. Recargar configuración
systemctl reload sshd
# o
service ssh reload

# 4. Verificar que el servicio sigue activo
systemctl status sshd

# IMPORTANTE: Mantener sesión SSH activa hasta verificar que nueva configuración funciona
```

### 2.3 Banner de Seguridad

```bash
# /etc/ssh/banner.txt
cat > /etc/ssh/banner.txt <<'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                    ⚠️  AUTHORIZED ACCESS ONLY ⚠️               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  This system is for authorized use only. Unauthorized access ║
║  or use may subject violators to criminal prosecution under  ║
║  applicable laws.                                            ║
║                                                               ║
║  All activities on this system are logged and monitored.     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
```

---

## 3. Autenticación con Claves Asimétricas

### 3.1 Tipos de Claves SSH

| Algoritmo | Tamaño Clave | Seguridad | Performance | Recomendación |
|-----------|-------------|-----------|-------------|---------------|
| **Ed25519** | 256 bits | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐⭐ Muy rápida | ✅ **RECOMENDADO** |
| **RSA** | 4096 bits | ⭐⭐⭐⭐ Muy buena | ⭐⭐⭐ Moderada | ✅ Aceptable |
| **RSA** | 2048 bits | ⭐⭐⭐ Buena | ⭐⭐⭐⭐ Buena | ⚠️ Mínimo aceptable |
| **ECDSA** | 521 bits | ⭐⭐⭐ Buena* | ⭐⭐⭐⭐ Buena | ⚠️ Curvas NIST controversiales |
| **DSA** | 1024 bits | ❌ Inseguro | ⭐⭐ Lenta | ❌ **OBSOLETO** |

*ECDSA depende de curvas NIST, que tienen sospechas de backdoors

### 3.2 Generar Claves SSH (Cliente)

**Ed25519 (RECOMENDADO):**
```bash
ssh-keygen -t ed25519 -a 100 -C "usuario@empresa.com" -f ~/.ssh/id_ed25519

# Opciones:
# -t ed25519: Tipo de clave
# -a 100: Rondas de KDF (key derivation function) - más seguro contra brute force
# -C: Comentario (email o identificador)
# -f: Archivo de salida

# Ingresar passphrase FUERTE (OBLIGATORIO para producción)
```

**RSA 4096 (alternativa):**
```bash
ssh-keygen -t rsa -b 4096 -C "usuario@empresa.com" -f ~/.ssh/id_rsa_4096
```

**Resultado:**
```
~/.ssh/id_ed25519      # Clave PRIVADA (NUNCA compartir)
~/.ssh/id_ed25519.pub  # Clave PÚBLICA (copiar a servidores)
```

### 3.3 Proteger Claves Privadas

```bash
# Permisos CRÍTICOS
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Verificar
ls -la ~/.ssh/
# drwx------  2 user user 4096 ... .ssh/
# -rw-------  1 user user  411 ... id_ed25519
# -rw-r--r--  1 user user  103 ... id_ed25519.pub
```

**⚠️ WARNING:** Si la clave privada tiene permisos incorrectos, SSH la rechazará:
```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/user/.ssh/id_rsa' are too open.
```

### 3.4 Copiar Clave Pública al Servidor

**Método 1: ssh-copy-id (recomendado)**
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@servidor.com
```

**Método 2: Manual**
```bash
# En el servidor
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "contenido de id_ed25519.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Método 3: Usando un bastion/jump host**
```bash
ssh-copy-id -o ProxyJump=bastion.empresa.com usuario@servidor-interno
```

### 3.5 SSH Agent (Gestión de Claves)

**Problema:** Tener que escribir passphrase cada vez que usas SSH.

**Solución:** SSH Agent guarda claves desbloqueadas en memoria.

```bash
# Iniciar SSH agent
eval $(ssh-agent)
# Agent pid 12345

# Agregar clave (pedirá passphrase una sola vez)
ssh-add ~/.ssh/id_ed25519
# Enter passphrase for ~/.ssh/id_ed25519:
# Identity added: ~/.ssh/id_ed25519 (usuario@empresa.com)

# Listar claves cargadas
ssh-add -l

# Eliminar todas las claves del agent
ssh-add -D

# Configurar timeout (eliminar claves tras X segundos de inactividad)
ssh-add -t 3600 ~/.ssh/id_ed25519  # 1 hora
```

**Auto-start SSH agent (añadir a ~/.bashrc):**
```bash
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval $(ssh-agent -s)
    ssh-add ~/.ssh/id_ed25519
fi
```

### 3.6 Restricciones en authorized_keys

```bash
# ~/.ssh/authorized_keys

# Restricción 1: Solo desde IP específica
from="192.168.1.100" ssh-ed25519 AAAAC3... user@laptop

# Restricción 2: Solo comando específico (no shell interactivo)
command="/usr/bin/backup.sh" ssh-ed25519 AAAAC3... backup-script

# Restricción 3: Sin port forwarding
no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAAC3... user@host

# Restricción 4: Combinadas
from="10.0.0.0/8",command="/usr/bin/rsync --server",no-pty,no-port-forwarding ssh-ed25519 AAAAC3... backup@backupserver

# Expiración (requiere script externo de limpieza)
# Example: expiry-time="2026-12-31" ssh-ed25519 AAAAC3... tempuser
```

---

## 4. Bastion Hosts y Jump Servers

### 4.1 Arquitectura con Bastion

```
┌─────────────┐          ┌──────────────────┐          ┌─────────────┐
│             │   SSH    │   Bastion Host   │   SSH    │   Private   │
│  Internet   ├─────────►│   (Jump Server)  ├─────────►│   Servers   │
│   User      │   :22    │  Public IP       │  :22     │  No Public  │
│             │          │  Hardened        │          │     IP      │
└─────────────┘          └──────────────────┘          └─────────────┘
                                   │
                                   │ Audit Logs
                                   ▼
                         ┌──────────────────┐
                         │   SIEM / Logging │
                         │    (Splunk,      │
                         │  Elasticsearch)  │
                         └──────────────────┘
```

**Ventajas:**
- ✅ **Single point of entry** para auditoría
- ✅ **MFA enforcement** centralizado
- ✅ **Reducción de superficie de ataque** (solo bastion público)
- ✅ **Session recording** y logging centralizado

### 4.2 Configurar SSH Client para Jump Host

**Método 1: Línea de comandos**
```bash
# Conexión en 2 pasos
ssh -J bastion.empresa.com usuario@servidor-interno

# Múltiples saltos
ssh -J bastion1.empresa.com,bastion2.empresa.com usuario@servidor-final
```

**Método 2: ~/.ssh/config (RECOMENDADO)**
```bash
# ~/.ssh/config

# Bastion host
Host bastion
    HostName bastion.empresa.com
    User admin
    Port 22
    IdentityFile ~/.ssh/id_ed25519_bastion
    ServerAliveInterval 60

# Servidores internos (usa bastion como proxy)
Host *.internal.empresa.com
    ProxyJump bastion
    User deployer
    IdentityFile ~/.ssh/id_ed25519_internal
    StrictHostKeyChecking yes

# Servidor específico
Host db-prod
    HostName db01.internal.empresa.com
    ProxyJump bastion
    User dba
    LocalForward 5432 localhost:5432  # Port forward PostgreSQL
```

**Uso después de configurar:**
```bash
# Conexión simple
ssh db-prod

# Port forwarding automático
ssh db-prod
# Ahora puedes conectarte a PostgreSQL en localhost:5432
```

### 4.3 Hardening del Bastion Host

**Configuración específica:**
```bash
# /etc/ssh/sshd_config (Bastion)

# Forzar MFA (ver sección 5)
AuthenticationMethods publickey,keyboard-interactive

# Restricciones estrictas
PermitRootLogin no
AllowUsers admin deployer
MaxSessions 10

# Logging verboso (CRÍTICO)
LogLevel VERBOSE

# Deshabilitar TODAS las funcionalidades innecesarias
AllowTcpForwarding yes  # SOLO para acceso a servidores internos
X11Forwarding no
AllowAgentForwarding no
GatewayPorts no
PermitTunnel no

# Banner de advertencia legal
Banner /etc/ssh/bastion-banner.txt
```

**Monitoreo del bastion:**
```bash
# Instalar auditd (ver teoría 03_auditd.md)
# Monitorear TODOS los accesos SSH

# Auditd rule
-w /var/log/auth.log -p wa -k ssh_access
-w /etc/ssh/sshd_config -p wa -k sshd_config_changes
-w /home/*/.ssh/authorized_keys -p wa -k ssh_key_changes
```

---

## 5. Autenticación de Dos Factores (2FA)

### 5.1 Arquitectura de 2FA con SSH

```
┌──────────────────────────────────────────────────────┐
│              SSH 2FA Authentication                  │
├──────────────────────────────────────────────────────┤
│  1. Algo que TIENES (clave SSH privada)             │
│     └─ Criptografía asimétrica                      │
├──────────────────────────────────────────────────────┤
│  2. Algo que SABES (TOTP code)                      │
│     └─ Google Authenticator / Authy / Duo           │
└──────────────────────────────────────────────────────┘
```

### 5.2 Configurar TOTP (Time-based OTP)

**Instalación de Google Authenticator PAM:**

```bash
# Debian/Ubuntu
apt install libpam-google-authenticator

# RHEL/CentOS
yum install google-authenticator
```

**Configurar para un usuario:**

```bash
# Como el usuario (NO como root)
google-authenticator

# Responder preguntas:
# "Do you want authentication tokens to be time-based?" → YES
# "Do you want me to update your ~/.google_authenticator file?" → YES
# "Do you want to disallow multiple uses of the same authentication token?" → YES
# "By default, a new token is generated every 30 seconds..." → NO (rate limiting)
# "Do you want to enable rate-limiting?" → YES
```

**Escanear QR code con app móvil:**
- Google Authenticator (Android/iOS)
- Authy (Android/iOS/Desktop)
- Microsoft Authenticator

**Guardar códigos de emergencia** (recovery codes)

### 5.3 Configurar PAM

**Editar `/etc/pam.d/sshd`:**

```bash
# /etc/pam.d/sshd

# Añadir AL PRINCIPIO (antes de @include common-auth)
auth required pam_google_authenticator.so nullok

# nullok: Permite usuarios sin 2FA configurado (quitar en producción)
# Sin nullok: TODOS los usuarios DEBEN tener 2FA
```

### 5.4 Configurar sshd para 2FA

```bash
# /etc/ssh/sshd_config

# Habilitar ChallengeResponseAuthentication (para PAM)
ChallengeResponseAuthentication yes

# Método de autenticación: PRIMERO publickey, LUEGO keyboard-interactive (PAM)
AuthenticationMethods publickey,keyboard-interactive

# Asegurar que PAM está habilitado
UsePAM yes

# Password authentication DEBE estar deshabilitado
PasswordAuthentication no
```

**Reiniciar SSH:**
```bash
systemctl restart sshd
```

### 5.5 Flujo de Autenticación 2FA

```bash
# Cliente ejecuta:
ssh usuario@servidor.com

# 1. SSH pide clave privada (first factor)
Enter passphrase for key '/home/user/.ssh/id_ed25519':
# Usuario ingresa passphrase

# 2. SSH pide código TOTP (second factor)
Verification code:
# Usuario ingresa código de 6 dígitos de app móvil (ej: 123456)

# 3. Autenticación exitosa
usuario@servidor:~$
```

### 5.6 Excluir Ciertos Usuarios/Hosts de 2FA

```bash
# /etc/ssh/sshd_config

# Match block para usuarios automation (NO requieren 2FA)
Match User ansible
    AuthenticationMethods publickey

# Volver a default para resto de usuarios
Match User *
    AuthenticationMethods publickey,keyboard-interactive
```

---

## 6. SSH Tunneling y Port Forwarding

### 6.1 Local Port Forwarding

**Caso de uso:** Acceder a un servicio en servidor remoto a través de túnel SSH.

```bash
# Sintaxis:
ssh -L [local_port]:[target_host]:[target_port] usuario@jump_host

# Ejemplo: Acceder a PostgreSQL en servidor remoto
ssh -L 5432:db.internal:5432 usuario@bastion.empresa.com

# Ahora puedes conectarte a localhost:5432 → db.internal:5432
psql -h localhost -p 5432 -U postgres
```

**Diagrama:**
```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Laptop  │                │  Bastion │                │Database  │
│          │                │          │                │          │
│localhost │ SSH Tunnel     │          │ TCP            │ :5432    │
│  :5432   ├───────────────►│  :22     ├───────────────►│          │
│          │ (encrypted)    │          │ (encrypted)    │          │
└──────────┘                └──────────┘                └──────────┘
```

### 6.2 Remote Port Forwarding

**Caso de uso:** Exponer servicio local a servidor remoto.

```bash
# Sintaxis:
ssh -R [remote_port]:[local_host]:[local_port] usuario@remote_server

# Ejemplo: Exponer servidor web local al servidor remoto
ssh -R 8080:localhost:3000 usuario@public-server.com

# Ahora public-server.com:8080 → tu localhost:3000
```

**⚠️ Riesgo de seguridad:** Puede exponer servicios internos. Usar con precaución.

### 6.3 Dynamic Port Forwarding (SOCKS Proxy)

**Caso de uso:** Proxy SOCKS para enrutar TODO el tráfico.

```bash
# Crear SOCKS proxy en puerto 1080
ssh -D 1080 -N -f usuario@bastion.empresa.com

# -D: Dynamic forwarding (SOCKS)
# -N: No ejecutar comando remoto
# -f: Background

# Configurar navegador para usar SOCKS proxy localhost:1080
```

**Configurar Firefox para SOCKS proxy:**
```
Preferences → General → Network Settings → Manual proxy configuration
SOCKS Host: localhost
Port: 1080
SOCKS v5: ✓
Proxy DNS when using SOCKS v5: ✓
```

### 6.4 Restricciones de Forwarding (Seguridad)

```bash
# /etc/ssh/sshd_config

# Deshabilitar TODOS los forwardings por defecto
AllowTcpForwarding no
AllowStreamLocalForwarding no
GatewayPorts no
PermitTunnel no

# Habilitar solo para usuarios específicos
Match User developer
    AllowTcpForwarding local  # Solo local forwarding
    # "local" = -L, "remote" = -R, "yes" = ambos

Match User admin
    AllowTcpForwarding yes
    PermitOpen localhost:5432 localhost:3306  # Whitelist de destinos
```

---

## 7. SSH Certificates (Advanced)

### 7.1 Problema con Authorized Keys

En organizaciones grandes:
- ❌ Distribuir claves públicas a N servidores es complejo
- ❌ Revocar acceso requiere modificar N archivos `authorized_keys`
- ❌ Sin expiración automática de claves
- ❌ Difícil auditar quién tiene acceso a qué servidor

### 7.2 Solución: SSH Certificates

**Arquitectura:**
```
┌───────────────────────────────────────────────────────┐
│         Certificate Authority (CA)                    │
│  - Firma certificados de usuario                     │
│  - Firma certificados de host                        │
│  - Define principals (roles)                         │
└───────────────┬───────────────────────────────────────┘
                │ firma certificados
                ▼
┌───────────────────────────────────────────────────────┐
│  Usuario solicita certificado para su clave pública  │
│  CA firma: "Esta clave pertenece a 'admin'            │
│            y puede acceder a 'prod-servers'           │
│            hasta 2026-12-31"                          │
└───────────────┬───────────────────────────────────────┘
                │ usa certificado
                ▼
        ┌───────────────┐
        │   Servidor    │
        │  Confía en CA │
        │  (TrustedUser │
        │  CAKeys)      │
        └───────────────┘
```

**Ventajas:**
- ✅ Centralización (solo confiar en CA)
- ✅ Expiración automática
- ✅ Revocación eficiente (KRL - Key Revocation List)
- ✅ Principals (roles) en lugar de usuarios individuales

### 7.3 Configurar CA

```bash
# 1. Generar clave privada de CA (PROTEGER CON MÁXIMA SEGURIDAD)
ssh-keygen -t ed25519 -f /etc/ssh/ca_user_key -C "User CA"

# 2. Distribuir clave pública de CA a todos los servidores
# En cada servidor:
# /etc/ssh/sshd_config
TrustedUserCAKeys /etc/ssh/ca_user_key.pub
```

### 7.4 Emitir Certificados de Usuario

```bash
# Usuario genera su clave
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519

# CA firma la clave pública del usuario
ssh-keygen -s /etc/ssh/ca_user_key \
    -I "john.doe" \
    -n admin,developer \
    -V +52w \
    -z 1 \
    ~/.ssh/id_ed25519.pub

# Opciones:
# -s: Clave privada de CA
# -I: Identity (nombre para logs)
# -n: Principals (roles permitidos)
# -V: Validez (+52w = 52 semanas, o fechas específicas)
# -z: Serial number (incremental)

# Genera: id_ed25519-cert.pub
```

**Restricciones avanzadas:**
```bash
# Certificado con restricciones de source address
ssh-keygen -s /etc/ssh/ca_user_key \
    -I "john.doe" \
    -n admin \
    -V +4w \
    -O source-address=10.0.0.0/8 \
    ~/.ssh/id_ed25519.pub

# Restricciones de comando
ssh-keygen -s /etc/ssh/ca_user_key \
    -I "backup-script" \
    -n backup \
    -V +365d \
    -O force-command="/usr/bin/backup.sh" \
    ~/.ssh/id_backup.pub
```

### 7.5 Configurar Servidor para Principals

```bash
# /etc/ssh/sshd_config
TrustedUserCAKeys /etc/ssh/ca_user_key.pub
AuthorizedPrincipalsFile /etc/ssh/auth_principals/%u

# Crear archivo de principals por usuario
# /etc/ssh/auth_principals/deployer
admin
developer

# /etc/ssh/auth_principals/root
root-admin
```

### 7.6 Revocar Certificados (KRL)

```bash
# Crear KRL (Key Revocation List)
ssh-keygen -k -f /etc/ssh/revoked_keys \
    -s /etc/ssh/ca_user_key \
    id_compromised-cert.pub

# En servidores:
# /etc/ssh/sshd_config
RevokedKeys /etc/ssh/revoked_keys

# Actualizar KRL (agregar más certificados revocados)
ssh-keygen -k -u -f /etc/ssh/revoked_keys \
    id_another_compromised-cert.pub
```

---

## 8. Monitoreo y Logging

### 8.1 Logs de SSH

**Ubicaciones:**
```bash
# Debian/Ubuntu
/var/log/auth.log

# RHEL/CentOS
/var/log/secure

# systemd (todas las distros modernas)
journalctl -u sshd
```

### 8.2 Análisis de Logs

**Conexiones exitosas:**
```bash
grep "Accepted publickey" /var/log/auth.log
# Feb 22 10:15:32 server sshd[12345]: Accepted publickey for admin from 192.168.1.100 port 54321 ssh2: ED25519 SHA256:...
```

**Intentos fallidos:**
```bash
grep "Failed password" /var/log/auth.log
# Feb 22 10:20:15 server sshd[12346]: Failed password for invalid user test from 203.0.113.1 port 12345 ssh2
```

**Conexiones desde IPs específicas:**
```bash
grep "203.0.113.1" /var/log/auth.log
```

### 8.3 Fail2Ban (Protección contra Brute Force)

**Instalación:**
```bash
apt install fail2ban
```

**Configuración:**
```bash
# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 600  # 10 minutos
bantime = 3600  # Ban por 1 hora
```

**Comandos:**
```bash
# Ver estado
fail2ban-client status sshd

# Desbanear IP
fail2ban-client set sshd unbanip 203.0.113.1

# Ver IPs baneadas
iptables -L -n | grep DROP
```

### 8.4 Alertas de Accesos SSH

**Script de alerta por email:**
```bash
# /etc/ssh/alert-on-ssh-login.sh
#!/bin/bash
echo "SSH Login: $(date)" | \
mail -s "SSH Login to $(hostname) from ${SSH_CLIENT%% *}" security@empresa.com

# Agregar a ~/.bashrc de usuarios críticos
if [ -n "$SSH_CLIENT" ]; then
    /etc/ssh/alert-on-ssh-login.sh &
fi
```

---

## 9. Mejores Prácticas (Checklist)

### 9.1 Configuración del Servidor

- [ ] ✅ PasswordAuthentication = no
- [ ] ✅ PermitRootLogin = no
- [ ] ✅ Solo SSH v2 (Protocol 2)
- [ ] ✅ Algoritmos criptográficos modernos (Ed25519, ChaCha20)
- [ ] ✅ AllowUsers/AllowGroups (whitelist)
- [ ] ✅ MaxAuthTries = 3
- [ ] ✅ ClientAliveInterval para timeouts
- [ ] ✅ Logging verboso (LogLevel VERBOSE)
- [ ] ✅ Fail2Ban instalado y configurado

### 9.2 Gestión de Claves

- [ ] ✅ Claves Ed25519 con passphrase fuerte
- [ ] ✅ Permisos correctos (700 .ssh/, 600 private keys)
- [ ] ✅ SSH Agent con timeout
- [ ] ✅ Rotación de claves cada 6-12 meses
- [ ] ✅ Auditoría regular de authorized_keys
- [ ] ✅ Usar SSH certificates en lugar de authorized_keys (organizaciones grandes)

### 9.3 Arquitectura de Red

- [ ] ✅ Bastion hosts para acceso a servidores internos
- [ ] ✅ Servidores internos SIN IPs públicas
- [ ] ✅ Firewall (solo bastion acepta :22 desde internet)
- [ ] ✅ VPN + SSH (defensa en profundidad)

### 9.4 Autenticación y Autorización

- [ ] ✅ 2FA/MFA habilitado (TOTP)
- [ ] ✅ Authorized keys con restricciones (from=, command=)
- [ ] ✅ Principals (roles) en lugar de usuarios individuales
- [ ] ✅ Integración con LDAP/Active Directory

### 9.5 Monitoreo y Auditoría

- [ ] ✅ Centralized logging (Splunk, ELK, Graylog)
- [ ] ✅ SIEM con alertas en tiempo real
- [ ] ✅ Auditd configurado (ver teoría 03_auditd.md)
- [ ] ✅ Grabación de sesiones SSH (asciinema, sshlog)
- [ ] ✅ Revisión mensual de logs de acceso

---

## 10. Casos de Uso Reales

### 10.1 Startup (5-20 servidores)

```bash
# sshd_config simple pero seguro
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
AllowUsers deployer admin

# Claves Ed25519 para todos
# Fail2Ban instalado
# ~/.ssh/config en laptops de desarrolladores
```

### 10.2 Empresa Mediana (100-500 servidores)

```bash
# Bastion hosts en cada datacenter
# SSH Certificates con CA
# 2FA obligatorio para administradores
# LDAP integration
# Centralized logging (ELK)
# Auditd en TODOS los servidores
```

### 10.3 Enterprise (1000+ servidores)

```bash
# Múltiples bastions con load balancing
# SSH Certificates con HSM-backed CA
# MFA obligatorio para TODOS
# Session recording (Teleport, Boundary)
# SIEM con ML-based anomaly detection
# Zero Trust Network Access (ZTNA)
# Regular key rotation automation
# Compliance automation (PCI-DSS, SOC2, ISO 27001)
```

---

## Conclusión

SSH es la puerta de entrada a la infraestructura Linux. Una configuración débil puede comprometer TODA la organización.

**Principios clave:**
1. **Autenticación fuerte:** Claves asimétricas + 2FA
2. **Defensa en profundidad:** Bastions + Firewall + VPN
3. **Principio de mínimo privilegio:** AllowUsers, Principals, restricted authorized_keys
4. **Auditoría constante:** Logging, SIEM, alertas
5. **Mantener actualizado:** OpenSSH tiene CVEs regularmente

🔐 **"The only secure password is the one you don't use"** - Usa claves SSH con 2FA.
