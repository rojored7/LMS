# PAM (Pluggable Authentication Modules)

## Objetivos de Aprendizaje

1. Comprender la arquitectura de PAM y su rol en autenticación Linux
2. Configurar políticas de contraseñas seguras
3. Implementar autenticación multifactor (MFA) con PAM
4. Configurar control de accesos basado en tiempo y ubicación
5. Integrar PAM con LDAP/Active Directory
6. Implementar auditoría y logging de autenticaciones

---

## 1. Introducción a PAM

### 1.1 ¿Qué es PAM?

**PAM (Pluggable Authentication Modules)** es un framework modular que proporciona autenticación dinámica para aplicaciones y servicios en Linux/Unix.

**Problema que resuelve:**
Tradicionalmente, cada aplicación implementaba su propia autenticación (login, su, sudo, SSH, etc.), resultando en:
- ❌ Código duplicado
- ❌ Inconsistencias en políticas de seguridad
- ❌ Difícil de mantener y actualizar

**Solución PAM:**
- ✅ Centraliza autenticación en módulos reutilizables
- ✅ Políticas de autenticación consistentes en todo el sistema
- ✅ Fácil integración con sistemas externos (LDAP, Kerberos, RADIUS)
- ✅ Soporte para MFA (multi-factor authentication)

### 1.2 Arquitectura de PAM

```
┌─────────────────────────────────────────────────────────────┐
│                      Applications                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  login  │  │   su    │  │  sudo   │  │   sshd  │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │             │
│       └────────────┴────────────┴────────────┘             │
│                          │                                  │
│                          │ libpam.so                        │
│                          ▼                                  │
├─────────────────────────────────────────────────────────────┤
│                  PAM Library (libpam)                       │
│               Lee configuración de:                         │
│               /etc/pam.d/*                                  │
│                                                             │
│  Procesa 4 tipos de tareas:                                │
│  ┌────────────┬─────────────┬──────────────┬────────────┐  │
│  │   auth     │  account    │   password   │  session   │  │
│  │(autentica) │(autoriza)   │(cambio pwd)  │(setup)     │  │
│  └────┬───────┴─────┬───────┴──────┬───────┴────┬───────┘  │
│       │             │              │            │           │
│       ▼             ▼              ▼            ▼           │
├─────────────────────────────────────────────────────────────┤
│                   PAM Modules                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ pam_unix.so  │  │ pam_ldap.so  │  │pam_google_au │     │
│  │(local auth)  │  │(LDAP auth)   │  │thenticator.so│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │pam_cracklib  │  │ pam_tally2   │  │ pam_limits   │     │
│  │(pwd strength)│  │(login tries) │  │(resources)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Tipos de Módulos PAM

PAM procesa autenticación en **4 tipos de tareas** (stacks):

| Tipo | Función | Ejemplos de Módulos |
|------|---------|---------------------|
| **auth** | Autenticación (verificar identidad) | pam_unix (password), pam_ldap, pam_google_authenticator (2FA) |
| **account** | Autorización (permisos de acceso) | pam_access (control de acceso), pam_time (horarios), pam_nologin |
| **password** | Cambio de contraseña | pam_pwquality (calidad), pam_cracklib, pam_passwdqc |
| **session** | Setup/teardown de sesión | pam_limits (límites de recursos), pam_loginuid (audit), pam_systemd |

### 1.4 Control Flags

Cada módulo tiene un **control flag** que determina cómo PAM maneja el resultado:

| Flag | Comportamiento |
|------|----------------|
| **required** | Debe tener éxito. Si falla, continúa con otros módulos pero **rechaza** al final |
| **requisite** | Debe tener éxito. Si falla, **rechaza inmediatamente** (no evalúa más módulos) |
| **sufficient** | Si tiene éxito, **acepta inmediatamente** (no evalúa más módulos). Si falla, continúa |
| **optional** | Resultado ignorado (solo importa si es el único módulo) |
| **include** | Incluye configuración de otro archivo PAM |

**Sintaxis avanzada (control values):**
```
[success=ok new_authtok_reqd=ok ignore=ignore default=bad]
```

---

## 2. Configuración de PAM

### 2.1 Archivos de Configuración

**Ubicación:** `/etc/pam.d/`

Cada servicio tiene su propio archivo:
```bash
/etc/pam.d/
├── common-auth          # Autenticación común (Debian/Ubuntu)
├── common-account       # Autorización común
├── common-password      # Cambio de contraseña común
├── common-session       # Sesión común
├── login                # Comando login
├── sshd                 # SSH daemon
├── sudo                 # Comando sudo
├── su                   # Comando su
├── passwd               # Comando passwd
└── ...
```

**Sintaxis de configuración:**
```
tipo  control_flag  módulo  [argumentos]
```

Ejemplo:
```
auth  required  pam_unix.so  nullok
│     │         │            │
│     │         │            └─ Argumento: permite passwords vacíos
│     │         └─ Módulo
│     └─ Control flag
└─ Tipo de tarea
```

### 2.2 Configuración Típica de SSH (sshd)

```bash
# /etc/pam.d/sshd

# ============================================
# AUTH (Autenticación)
# ============================================

# Deshabilitar temporalmente autenticación (archivo /etc/nologin)
auth       required     pam_nologin.so

# Autenticación con contraseña local (Unix)
auth       required     pam_unix.so     nullok

# Alternativa: 2FA con Google Authenticator
# auth       required     pam_google_authenticator.so

# ============================================
# ACCOUNT (Autorización)
# ============================================

# Verificar que cuenta no esté expirada
account    required     pam_unix.so

# Control de acceso basado en usuarios/grupos/horarios
# account    required     pam_access.so

# Restricciones de tiempo (horarios permitidos)
# account    required     pam_time.so

# ============================================
# PASSWORD (Cambio de contraseña)
# ============================================

# Calidad de contraseña
password   required     pam_pwquality.so   retry=3

# Actualizar archivo /etc/shadow
password   required     pam_unix.so        sha512 shadow

# ============================================
# SESSION (Configuración de sesión)
# ============================================

# Límites de recursos (ulimit)
session    required     pam_limits.so

# Registrar login en audit log
session    required     pam_loginuid.so

# Integración con systemd
session    optional     pam_systemd.so

# MOTD (Message of the Day)
session    optional     pam_motd.so

# Última vez que el usuario hizo login
session    optional     pam_lastlog.so
```

### 2.3 Common Files (Debian/Ubuntu)

En Debian/Ubuntu, se usan archivos "common-*" para evitar duplicación:

**common-auth:**
```bash
# /etc/pam.d/common-auth

# Permitir acceso temporal con /etc/security/faillock.conf
auth    [success=1 default=ignore]  pam_unix.so nullok
auth    requisite                   pam_deny.so
auth    required                    pam_permit.so
```

**Otros archivos incluyen common-auth:**
```bash
# /etc/pam.d/sshd
@include common-auth
@include common-account
@include common-session
```

---

## 3. Políticas de Contraseñas Seguras

### 3.1 pam_pwquality (Calidad de Contraseñas)

**Configuración en Debian/Ubuntu:**
```bash
# /etc/pam.d/common-password

password  requisite  pam_pwquality.so  retry=3 \
    minlen=14 \
    dcredit=-1 \
    ucredit=-1 \
    ocredit=-1 \
    lcredit=-1 \
    maxrepeat=3 \
    usercheck=1 \
    enforce_for_root

password  [success=1 default=ignore]  pam_unix.so obscure use_authtok sha512 shadow remember=5
```

**Parámetros de pam_pwquality:**

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `minlen` | Longitud mínima | `minlen=14` |
| `dcredit` | Dígitos requeridos (-N = mínimo N) | `dcredit=-1` (min 1 dígito) |
| `ucredit` | Mayúsculas requeridas | `ucredit=-1` |
| `lcredit` | Minúsculas requeridas | `lcredit=-1` |
| `ocredit` | Símbolos requeridos | `ocredit=-1` (min 1 símbolo) |
| `maxrepeat` | Caracteres repetidos consecutivos | `maxrepeat=3` |
| `usercheck` | Rechazar si contiene username | `usercheck=1` |
| `dictcheck` | Verificar contra diccionario | `dictcheck=1` |
| `enforce_for_root` | Aplicar a root también | `enforce_for_root` |
| `retry` | Intentos permitidos | `retry=3` |

**Configuración avanzada (archivo /etc/security/pwquality.conf):**
```bash
# /etc/security/pwquality.conf

# Longitud mínima
minlen = 14

# Complejidad
minclass = 3     # Mínimo 3 clases de caracteres (lower, upper, digit, other)
dcredit = -1     # Mínimo 1 dígito
ucredit = -1     # Mínimo 1 mayúscula
lcredit = -1     # Mínimo 1 minúscula
ocredit = -1     # Mínimo 1 símbolo

# Protecciones
maxrepeat = 3    # No más de 3 caracteres repetidos consecutivos
maxclassrepeat = 4  # No más de 4 caracteres de la misma clase consecutivos
gecoscheck = 1   # Rechazar si contiene info de GECOS (nombre real, etc.)
dictcheck = 1    # Verificar contra diccionario
usercheck = 1    # Rechazar si contiene username
enforcing = 1    # Enforcing mode (vs warn)

# Aplicar a root
enforce_for_root

# Diccionario personalizado
dictpath = /usr/share/dict/passwords-blacklist

# Permitir bypass si admin usa pam_pwquality con opciones específicas
# local_users_only
```

### 3.2 Historial de Contraseñas (Evitar Reutilización)

```bash
# /etc/pam.d/common-password

# Recordar últimas 5 contraseñas (no permitir reutilización)
password  required  pam_unix.so sha512 shadow remember=5

# O usar pam_pwhistory (más robusto)
password  required  pam_pwhistory.so remember=10 enforce_for_root
```

**Archivo de historial:**
```bash
/etc/security/opasswd
```

### 3.3 Expiración de Contraseñas

```bash
# /etc/login.defs

# Días antes de que expire contraseña
PASS_MAX_DAYS   90

# Días mínimos antes de poder cambiar contraseña
PASS_MIN_DAYS   1

# Días de advertencia antes de expiración
PASS_WARN_AGE   7

# Longitud mínima (obsoleto, usar pwquality)
# PASS_MIN_LEN    14
```

**Configurar para usuario específico:**
```bash
# Ver configuración actual
chage -l usuario

# Configurar expiración
chage -M 90 -m 1 -W 7 usuario
# -M: max days
# -m: min days
# -W: warning days

# Forzar cambio en próximo login
chage -d 0 usuario

# Expirar cuenta en fecha específica
chage -E 2026-12-31 usuario
```

---

## 4. Control de Accesos

### 4.1 pam_access (Control de Acceso por Usuario/Grupo/Red)

**Habilitar pam_access:**
```bash
# /etc/pam.d/sshd (o common-account)

account  required  pam_access.so
```

**Configuración:**
```bash
# /etc/security/access.conf

# Sintaxis: permission : users : origins

# EJEMPLOS:

# 1. Permitir root solo desde localhost
+ : root : LOCAL

# 2. Denegar root desde red
- : root : ALL EXCEPT LOCAL

# 3. Permitir admin solo desde red interna
+ : admin : 192.168.1.0/24 10.0.0.0/8

# 4. Denegar usuario específico
- : baduser : ALL

# 5. Permitir grupo sysadmin desde cualquier lugar
+ : @sysadmin : ALL

# 6. Denegar acceso a todos excepto grupo permitido
+ : @allowedusers : ALL
- : ALL : ALL

# 7. Permitir desde hosts específicos
+ : deployer : server1.empresa.com server2.empresa.com

# 8. Restricción por TTY (solo consola física)
+ : @console-only : tty1 tty2 tty3 tty4 tty5 tty6
- : @console-only : ALL

# ORDEN ES IMPORTANTE: Primera regla que coincide gana
```

### 4.2 pam_time (Control de Acceso por Horario)

**Habilitar pam_time:**
```bash
# /etc/pam.d/sshd

account  required  pam_time.so
```

**Configuración:**
```bash
# /etc/security/time.conf

# Sintaxis: services ; ttys ; users ; times

# EJEMPLOS:

# 1. Permitir login solo en horario laboral (Lun-Vie 9-17h)
login ; * ; !root ; Wk0900-1700

# 2. Denegar SSH fuera de horario laboral
sshd ; * ; * ; !Wk0900-1700

# 3. Permitir admin 24/7
sshd ; * ; admin ; Al0000-2400

# 4. Denegar usuarios normales en fin de semana
* ; * ; !@sysadmin ; Wk

# 5. Mantenimiento: solo root los domingos 2-4 AM
* ; * ; root ; Su0200-0400

# CÓDIGOS DE TIEMPO:
# Al - All days (todos los días)
# Wk - Weekdays (Lun-Vie)
# Wd - Weekend (Sáb-Dom)
# Mo, Tu, We, Th, Fr, Sa, Su - Días específicos

# FORMATO DE HORA:
# 0000-2400 (HHMM-HHMM)

# NEGACIÓN:
# ! = NOT (negar la regla)
```

### 4.3 pam_listfile (Listas Blancas/Negras)

**Permitir solo usuarios en whitelist:**
```bash
# /etc/pam.d/sshd

auth  required  pam_listfile.so \
    onerr=fail \
    item=user \
    sense=allow \
    file=/etc/ssh/allowed-users

# /etc/ssh/allowed-users
admin
deployer
developer
```

**Denegar usuarios en blacklist:**
```bash
auth  required  pam_listfile.so \
    onerr=succeed \
    item=user \
    sense=deny \
    file=/etc/ssh/denied-users
```

**Opciones:**
- `item`: user, group, host, tty
- `sense`: allow (whitelist), deny (blacklist)
- `onerr`: succeed, fail (qué hacer si hay error leyendo archivo)

---

## 5. Protección contra Brute Force

### 5.5.1 pam_faillock (Bloqueo por Intentos Fallidos)

**Configuración moderna (RHEL 8+, Ubuntu 20.04+):**

```bash
# /etc/pam.d/system-auth (o common-auth)

# AUTH
auth        required      pam_faillock.so preauth silent audit deny=3 unlock_time=600
auth        sufficient    pam_unix.so nullok
auth        [default=die] pam_faillock.so authfail audit deny=3 unlock_time=600

# ACCOUNT
account     required      pam_faillock.so

# Parámetros:
# deny=3: Bloquear tras 3 intentos fallidos
# unlock_time=600: Desbloquear automáticamente tras 10 minutos (0 = manual)
# audit: Registrar en audit log
# even_deny_root: Aplicar a root también
# root_unlock_time=60: Tiempo de bloqueo para root (menor que usuarios normales)
```

**Configuración avanzada:**
```bash
# /etc/security/faillock.conf

# Intentos permitidos
deny = 3

# Tiempo de bloqueo (segundos, 0 = permanente hasta desbloqueo manual)
unlock_time = 900

# Ventana de tiempo para contar intentos (segundos)
fail_interval = 900

# Aplicar a root
even_deny_root

# Tiempo de bloqueo para root (más corto)
root_unlock_time = 60

# Directorio de tracking
dir = /var/run/faillock

# Auditoría
audit

# Solo usuarios locales (no LDAP/AD)
local_users_only
```

**Comandos de administración:**
```bash
# Ver usuarios bloqueados
faillock

# Ver estado de usuario específico
faillock --user admin

# Desbloquear usuario
faillock --user admin --reset

# Desbloquear todos
faillock --reset
```

### 5.2 pam_tally2 (Obsoleto, usar faillock)

```bash
# /etc/pam.d/common-auth
auth required pam_tally2.so deny=3 onerr=fail unlock_time=600

# Ver intentos fallidos
pam_tally2 --user admin

# Resetear contador
pam_tally2 --user admin --reset
```

---

## 6. Autenticación Multifactor (MFA)

### 6.1 Google Authenticator (TOTP)

**Instalación:**
```bash
apt install libpam-google-authenticator
```

**Configuración de usuario:**
```bash
# Como usuario (no root)
google-authenticator

# Responder preguntas:
# Time-based tokens? YES
# Update .google_authenticator file? YES
# Disallow multiple uses? YES
# Rate limiting? YES
# Window size: 3 (permitir 1.5 min de desincronización de reloj)

# Escanear QR code con app móvil
# Guardar emergency scratch codes
```

**Configurar PAM:**
```bash
# /etc/pam.d/sshd

# OPCIÓN 1: Password + 2FA (ambos requeridos)
auth required pam_unix.so
auth required pam_google_authenticator.so

# OPCIÓN 2: Solo clave SSH + 2FA (sin password)
# En /etc/ssh/sshd_config:
# PasswordAuthentication no
# PubkeyAuthentication yes
# ChallengeResponseAuthentication yes
# AuthenticationMethods publickey,keyboard-interactive

# En /etc/pam.d/sshd:
auth required pam_google_authenticator.so nullok

# nullok: Permite usuarios sin 2FA configurado (quitar en producción)
```

**Opciones avanzadas de google_authenticator:**
```bash
# ~/.google_authenticator

# Permitir configuración opcional (nullok en PAM)
# nullok

# Forward window (códigos futuros permitidos)
# -w 3

# Grace period (segundos de gracia para código expirado)
# -g

# No solicitar 2FA desde IPs de confianza
# /etc/pam.d/sshd
auth [success=done default=ignore] pam_succeed_if.so user ingroup no2fa
auth required pam_google_authenticator.so
```

### 6.2 Duo Security (MFA Comercial)

**Instalación:**
```bash
apt install duo-unix
```

**Configuración:**
```bash
# /etc/duo/pam_duo.conf

[duo]
ikey = INTEGRATION_KEY
skey = SECRET_KEY
host = api-XXXXXXX.duosecurity.com

# Fallback si Duo no está disponible
failmode = safe  # safe = permitir, secure = denegar

# Autopush (enviar push automáticamente)
autopush = yes

# Prompts
prompts = 1
```

**PAM:**
```bash
# /etc/pam.d/sshd

# Después de autenticación con clave/password
auth required pam_duo.so
```

### 6.3 YubiKey (Hardware Token)

**Instalación:**
```bash
apt install libpam-yubico
```

**Configuración:**
```bash
# /etc/pam.d/sshd

auth required pam_yubico.so \
    id=YOUR_CLIENT_ID \
    key=YOUR_SECRET_KEY \
    authfile=/etc/yubikeys/%u \
    mode=client

# /etc/yubikeys/admin (mapeo usuario → YubiKey ID)
admin:cccccccgklgc:ccccccchvekf

# Usuario admin puede autenticarse con cualquiera de esos 2 YubiKeys
```

---

## 7. Límites de Recursos con pam_limits

### 7.1 Configuración de Límites

```bash
# /etc/pam.d/common-session

session  required  pam_limits.so
```

**Definir límites:**
```bash
# /etc/security/limits.conf

# Sintaxis: <domain> <type> <item> <value>

# EJEMPLOS:

# 1. Limitar procesos por usuario
*               soft    nproc           1024
*               hard    nproc           2048

# 2. Limitar archivos abiertos
*               soft    nofile          4096
*               hard    nofile          8192

# 3. Limitar memoria (KB)
@developers     soft    rss             512000
@developers     hard    rss             1024000

# 4. Limitar tamaño de archivos (KB)
*               hard    fsize           2097152   # 2 GB

# 5. Limitar core dumps
*               hard    core            0        # Deshabilitar core dumps

# 6. Limitar CPU time (minutos)
@users          hard    cpu             30

# 7. Limitar logins concurrentes
*               hard    maxlogins       4

# 8. Limitar memoria locked (para aplicaciones críticas)
oracle          soft    memlock         unlimited
oracle          hard    memlock         unlimited

# 9. Priority (nice)
@admins         -       priority        -10      # Mayor prioridad

# TIPOS:
# soft: Límite soft (usuario puede aumentar hasta hard)
# hard: Límite hard (solo root puede aumentar)
# -: Ambos (soft y hard)

# ITEMS:
# nproc: Número de procesos
# nofile: Archivos abiertos
# rss: Resident set size (RAM)
# fsize: File size
# core: Core file size
# cpu: CPU time
# maxlogins: Logins concurrentes
# priority: Scheduling priority
```

### 7.2 Verificar Límites

```bash
# Ver límites del proceso actual
ulimit -a

# Ver límites de otro proceso
cat /proc/PID/limits

# Ver límite específico
ulimit -n  # File descriptors
ulimit -u  # Procesos
```

---

## 8. Integración con LDAP/Active Directory

### 8.1 Autenticación LDAP

**Instalación:**
```bash
apt install libpam-ldap nscd
```

**Configuración de pam_ldap:**
```bash
# /etc/pam_ldap.conf

# URI del servidor LDAP
uri ldap://ldap.empresa.com

# Base DN
base dc=empresa,dc=com

# Versión de protocolo
ldap_version 3

# Bind DN (cuenta de servicio)
binddn cn=pam-auth,ou=service-accounts,dc=empresa,dc=com
bindpw SecretPassword123

# TLS/SSL
ssl start_tls
tls_cacertfile /etc/ssl/certs/ca-bundle.crt

# Search scope
scope sub

# Filtro para usuarios
pam_filter objectClass=posixAccount

# Mapping de atributos
pam_login_attribute uid
pam_member_attribute memberUid
```

**PAM:**
```bash
# /etc/pam.d/common-auth

# Intentar autenticación local primero, luego LDAP
auth    [success=2 default=ignore]  pam_unix.so nullok
auth    [success=1 default=ignore]  pam_ldap.so use_first_pass
auth    requisite                   pam_deny.so
auth    required                    pam_permit.so
```

### 8.2 Integración con Active Directory (SSSD)

**Instalación:**
```bash
apt install sssd sssd-tools realmd adcli
```

**Unir al dominio:**
```bash
# Descubrir dominio
realm discover EMPRESA.COM

# Unir al dominio
realm join --user=Administrator EMPRESA.COM

# Verificar
realm list
```

**Configuración SSSD:**
```bash
# /etc/sssd/sssd.conf

[sssd]
domains = empresa.com
config_file_version = 2
services = nss, pam

[domain/empresa.com]
ad_domain = empresa.com
krb5_realm = EMPRESA.COM
realmd_tags = manages-system joined-with-adcli
cache_credentials = True
id_provider = ad
krb5_store_password_if_offline = True
default_shell = /bin/bash
ldap_id_mapping = True

# Restringir acceso solo a ciertos grupos
access_provider = simple
simple_allow_groups = Domain Admins, Linux-Users

# Permisos:
chmod 600 /etc/sssd/sssd.conf
systemctl restart sssd
```

**PAM automático:**
```bash
# pam-auth-update configura PAM automáticamente
pam-auth-update --enable sss
```

---

## 9. Auditoría y Logging

### 9.1 pam_loginuid (Audit UID)

```bash
# /etc/pam.d/common-session

session  required  pam_loginuid.so
```

**Función:** Asigna audit UID (auid) que persiste a través de su, sudo, etc. Crítico para auditoría.

### 9.2 Logging de Autenticaciones

**Logs de PAM:**
```bash
# Debian/Ubuntu
/var/log/auth.log

# RHEL/CentOS
/var/log/secure

# systemd
journalctl -u sshd | grep pam
```

**Buscar eventos específicos:**
```bash
# Autenticaciones exitosas
grep "pam_unix(sshd:session): session opened" /var/log/auth.log

# Autenticaciones fallidas
grep "pam_unix(sshd:auth): authentication failure" /var/log/auth.log

# Intentos de sudo
grep "pam_unix(sudo:auth)" /var/log/auth.log

# Bloqueos por faillock
grep "pam_faillock" /var/log/auth.log

# 2FA Google Authenticator
grep "pam_google_authenticator" /var/log/auth.log
```

---

## 10. Casos de Uso Reales

### 10.1 Servidor Web de Alta Seguridad

```bash
# /etc/pam.d/sshd

# AUTH: Solo clave pública + 2FA
@include common-auth
auth required pam_google_authenticator.so

# ACCOUNT: Restricciones de horario y red
account required pam_access.so
account required pam_time.so
@include common-account

# PASSWORD
@include common-password

# SESSION
session required pam_limits.so
session required pam_loginuid.so
@include common-session

# /etc/security/access.conf
+ : @sysadmin : 10.0.0.0/8
- : ALL : ALL

# /etc/security/time.conf
sshd ; * ; !@sysadmin ; Wk0900-1700
```

### 10.2 Servidor de Base de Datos (Compliance)

```bash
# Políticas estrictas de contraseñas
# /etc/security/pwquality.conf
minlen = 16
minclass = 4
dcredit = -2
ucredit = -2
lcredit = -2
ocredit = -2
maxrepeat = 2
usercheck = 1
enforcing = 1
enforce_for_root

# Expiración de contraseñas
# /etc/login.defs
PASS_MAX_DAYS   60
PASS_MIN_DAYS   1
PASS_WARN_AGE   14

# Bloqueo tras intentos fallidos
# /etc/security/faillock.conf
deny = 3
unlock_time = 1800
even_deny_root
audit

# Límites de recursos
# /etc/security/limits.conf
oracle    hard    nproc     16384
oracle    soft    nproc     2047
oracle    hard    nofile    65536
oracle    soft    nofile    4096
```

### 10.3 Jump Server (Bastion) con Audit Completo

```bash
# MFA obligatorio
# 2FA + session recording

# /etc/pam.d/sshd
auth required pam_google_authenticator.so
session required pam_loginuid.so
session required pam_tty_audit.so enable=*

# pam_tty_audit: Graba TODA la actividad del terminal
# enable=*: Para todos los usuarios
# enable=root,admin: Solo ciertos usuarios
```

---

## 11. Troubleshooting

### 11.1 Problemas Comunes

**Problema: Bloqueado fuera del servidor**
```bash
# Solución: Acceder por consola física o KVM/IPMI
# Editar /etc/pam.d/sshd y comentar líneas problemáticas
# O desbloquear con faillock:
faillock --user admin --reset

# Prevención: SIEMPRE mantener sesión SSH activa al hacer cambios
```

**Problema: 2FA no funciona**
```bash
# Verificar sincronización de reloj
timedatectl status

# Ver logs
journalctl -u sshd | grep google_authenticator

# Verificar permisos de ~/.google_authenticator
chmod 600 ~/.google_authenticator
```

**Problema: Autenticación LDAP falla**
```bash
# Verificar conectividad
ldapsearch -x -H ldap://ldap.empresa.com -b "dc=empresa,dc=com"

# Ver logs de pam_ldap
tail -f /var/log/auth.log | grep pam_ldap

# Debug mode
# /etc/pam.d/sshd
auth required pam_ldap.so debug
```

### 11.2 Testing de Configuración PAM

```bash
# Test sin afectar usuarios reales
pamtester sshd admin authenticate

# Verificar que módulos se cargan correctamente
ldd /lib/x86_64-linux-gnu/security/pam_unix.so

# Ver módulos PAM disponibles
ls -la /lib/x86_64-linux-gnu/security/pam_*.so
```

---

## 12. Mejores Prácticas

### 12.1 Checklist de Seguridad

- [ ] ✅ Políticas de contraseñas fuertes (minlen=14+, complejidad)
- [ ] ✅ Historial de contraseñas (remember=10+)
- [ ] ✅ Expiración de contraseñas (90 días máx)
- [ ] ✅ Bloqueo tras intentos fallidos (faillock)
- [ ] ✅ 2FA/MFA para administradores (obligatorio)
- [ ] ✅ Restricciones de acceso (pam_access, pam_time)
- [ ] ✅ Límites de recursos (pam_limits)
- [ ] ✅ Auditoría completa (pam_loginuid, pam_tty_audit)
- [ ] ✅ Logging centralizado (SIEM)

### 12.2 Defensa en Profundidad

```
┌─────────────────────────────────────────────┐
│  1. Firewall (solo bastion acceso SSH)     │
├─────────────────────────────────────────────┤
│  2. Fail2ban (bloqueo IPs atacantes)       │
├─────────────────────────────────────────────┤
│  3. PAM Access Control (whitelist IPs)     │
├─────────────────────────────────────────────┤
│  4. Autenticación fuerte (clave + 2FA)     │
├─────────────────────────────────────────────┤
│  5. Authorization (pam_time, grupos)       │
├─────────────────────────────────────────────┤
│  6. Session limits (pam_limits)            │
├─────────────────────────────────────────────┤
│  7. Auditoría (pam_loginuid, logs)         │
└─────────────────────────────────────────────┘
```

---

## Conclusión

PAM es el **corazón** de la autenticación y autorización en Linux. Una configuración correcta de PAM:

- ✅ Previene accesos no autorizados
- ✅ Asegura compliance (PCI-DSS, HIPAA, etc.)
- ✅ Proporciona auditoría forense
- ✅ Permite integración con sistemas enterprise (AD, LDAP)
- ✅ Habilita MFA sin modificar aplicaciones

**Principio clave:** *Test thoroughly before deploying to production* - Siempre mantén una sesión activa al modificar PAM.

🔐 **"With great authentication comes great responsibility"** - Una mala configuración de PAM puede bloquearte completamente del sistema.
