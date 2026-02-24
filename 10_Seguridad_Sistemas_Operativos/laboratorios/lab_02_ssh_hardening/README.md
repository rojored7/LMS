# Laboratorio 02: SSH Hardening y Autenticación Multifactor

## Objetivos

1. Configurar SSH con hardening completo (sshd_config)
2. Implementar autenticación con claves asimétricas (Ed25519)
3. Configurar Google Authenticator para 2FA
4. Implementar bastion host con ProxyJump
5. Configurar Fail2Ban para protección contra brute force
6. Auditar y monitorear accesos SSH

## Duración: 3-4 horas

---

## Parte 1: Configuración Básica Hardened

### Paso 1.1: Backup y Configuración Inicial

```bash
# IMPORTANTE: Mantener sesión SSH activa durante TODO el lab

# Backup de configuración original
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Ver configuración actual (sin comentarios)
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

### Paso 1.2: Crear Configuración Hardened

```bash
sudo nano /etc/ssh/sshd_config
```

**Configuración completa hardened:**

```bash
# /etc/ssh/sshd_config - HARDENED CONFIGURATION

# === PROTOCOLOS Y ALGORITMOS ===
Protocol 2

# Key Exchange Algorithms (solo seguros)
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256

# Ciphers (sin CBC)
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

# Host Key Algorithms
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# Host Keys
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

# === AUTENTICACIÓN ===
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# DESHABILITAR password authentication (DESPUÉS de configurar claves)
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# Métodos obsoletos
GSSAPIAuthentication no
HostbasedAuthentication no
KerberosAuthentication no

# Intentos permitidos
MaxAuthTries 3
LoginGraceTime 30

# === RESTRICCIONES ===
PermitRootLogin no

# Whitelist de usuarios (AJUSTAR según tu sistema)
# AllowUsers tuusuario admin

# === SESIONES ===
AllowTcpForwarding no
AllowStreamLocalForwarding no
X11Forwarding no
AllowAgentForwarding no
PermitTunnel no
GatewayPorts no

# === TIMEOUTS ===
ClientAliveInterval 300
ClientAliveCountMax 2

# === LOGGING ===
LogLevel VERBOSE
SyslogFacility AUTH

# === BANNER ===
Banner /etc/ssh/banner.txt

# === OTROS ===
PrintMotd yes
PrintLastLog yes
StrictModes yes
UseDNS no
Compression no

# Subsistema SFTP
Subsystem sftp /usr/lib/openssh/sftp-server -f AUTHPRIV -l INFO
```

### Paso 1.3: Crear Banner

```bash
sudo nano /etc/ssh/banner.txt
```

```
╔═══════════════════════════════════════════════════════════════╗
║                    ⚠️  AUTHORIZED ACCESS ONLY ⚠️               ║
╠═══════════════════════════════════════════════════════════════╣
║  This system is for authorized use only. Unauthorized access ║
║  may subject violators to criminal prosecution.              ║
║                                                               ║
║  All activities are logged and monitored.                    ║
╚═══════════════════════════════════════════════════════════════╝
```

### Paso 1.4: Validar y Aplicar Cambios

```bash
# CRÍTICO: Validar sintaxis ANTES de reiniciar
sudo sshd -t

# Si hay errores, corregir antes de continuar

# Recargar servicio (NO cerrar sesión activa)
sudo systemctl reload sshd

# Verificar que el servicio sigue activo
sudo systemctl status sshd
```

---

## Parte 2: Autenticación con Claves Ed25519

### Paso 2.1: Generar Clave Ed25519 (En tu máquina local)

```bash
# En tu laptop/desktop (NO en el servidor)
ssh-keygen -t ed25519 -a 100 -C "tu-email@empresa.com" -f ~/.ssh/id_ed25519_lab

# Opciones:
# -t ed25519: Tipo de clave
# -a 100: Rondas de KDF (más seguridad contra brute force)
# -C: Comentario
# -f: Archivo de salida

# Ingresar passphrase FUERTE
# Ejemplo: "Mi-Passphrase-Segura-2026!"

# Resultado:
# ~/.ssh/id_ed25519_lab (privada)
# ~/.ssh/id_ed25519_lab.pub (pública)
```

### Paso 2.2: Copiar Clave Pública al Servidor

```bash
# Método 1: ssh-copy-id (recomendado)
ssh-copy-id -i ~/.ssh/id_ed25519_lab.pub usuario@tu-servidor

# Método 2: Manual (si ssh-copy-id no está disponible)
cat ~/.ssh/id_ed25519_lab.pub | ssh usuario@tu-servidor "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# En el servidor, verificar permisos
ssh usuario@tu-servidor
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
ls -la ~/.ssh/
# drwx------ 2 usuario usuario 4096 ... .ssh/
# -rw------- 1 usuario usuario  103 ... authorized_keys
```

### Paso 2.3: Probar Autenticación con Clave

```bash
# Desde tu máquina local
ssh -i ~/.ssh/id_ed25519_lab usuario@tu-servidor

# Debería pedir la passphrase de la clave (NO el password del usuario)
# Enter passphrase for key '~/.ssh/id_ed25519_lab':

# ✓ Si funciona, continuar
```

### Paso 2.4: Deshabilitar Password Authentication

```bash
# En el servidor
sudo nano /etc/ssh/sshd_config

# Cambiar:
PasswordAuthentication no

# Validar y recargar
sudo sshd -t
sudo systemctl reload sshd

# MANTENER sesión activa, probar en nueva terminal
ssh -i ~/.ssh/id_ed25519_lab usuario@tu-servidor
# ✓ Debe funcionar SOLO con clave

# Intentar con password (debe fallar)
ssh -o PubkeyAuthentication=no usuario@tu-servidor
# Permission denied (publickey).  ✓ Correcto!
```

---

## Parte 3: Autenticación de Dos Factores (2FA)

### Paso 3.1: Instalar Google Authenticator

```bash
# En el servidor
# Debian/Ubuntu
sudo apt install libpam-google-authenticator -y

# RHEL/CentOS
sudo dnf install google-authenticator -y
```

### Paso 3.2: Configurar Google Authenticator (Por Usuario)

```bash
# Como TU usuario (NO root)
google-authenticator

# Responder preguntas:
# "Do you want authentication tokens to be time-based (y/n)" → y

# ESCANEAR QR CODE con app móvil:
# - Google Authenticator (Android/iOS)
# - Authy (Android/iOS/Desktop)
# - Microsoft Authenticator

# GUARDAR CÓDIGOS DE EMERGENCIA (recovery codes)
# Ejemplo:
# 12345678
# 23456789
# 34567890
# 45678901
# 56789012

# "Do you want me to update your ~/.google_authenticator file?" → y

# "Do you want to disallow multiple uses of the same authentication token?" → y
# (Previene replay attacks)

# "By default, tokens are good for 30 seconds..." → n
# (NO aumentar ventana de tiempo)

# "Do you want to enable rate-limiting?" → y
# (Máximo 3 intentos cada 30 segundos)
```

### Paso 3.3: Configurar PAM

```bash
sudo nano /etc/pam.d/sshd
```

**Agregar AL PRINCIPIO (antes de @include common-auth):**

```
# Google Authenticator 2FA
auth required pam_google_authenticator.so nullok
```

**Explicación:**
- `auth required`: Módulo requerido
- `nullok`: Permite usuarios sin 2FA configurado (quitar en producción)

### Paso 3.4: Configurar sshd para 2FA

```bash
sudo nano /etc/ssh/sshd_config
```

**Modificar/agregar:**

```
# Habilitar ChallengeResponseAuthentication (para PAM)
ChallengeResponseAuthentication yes

# Método: PRIMERO clave pública, LUEGO 2FA
AuthenticationMethods publickey,keyboard-interactive

# PAM debe estar habilitado
UsePAM yes

# Password authentication DEBE estar deshabilitado
PasswordAuthentication no
```

**Validar y reiniciar:**

```bash
sudo sshd -t
sudo systemctl restart sshd  # ⚠️ RESTART (no reload) para cambios de PAM
```

### Paso 3.5: Probar 2FA

```bash
# Desde tu máquina local
ssh -i ~/.ssh/id_ed25519_lab usuario@tu-servidor

# Flujo de autenticación:
# 1. Pide passphrase de clave SSH
# Enter passphrase for key '~/.ssh/id_ed25519_lab':

# 2. Pide código 2FA de Google Authenticator
# Verification code:
# (Ingresar código de 6 dígitos de la app móvil)

# ✓ Autenticación exitosa!
```

### Paso 3.6: Excepciones de 2FA (Opcional)

```bash
# Si quieres excluir ciertos usuarios de 2FA
sudo nano /etc/ssh/sshd_config
```

**Agregar al final:**

```
# Usuario automation SIN 2FA
Match User ansible
    AuthenticationMethods publickey

# Volver a default para otros usuarios
Match User *
    AuthenticationMethods publickey,keyboard-interactive
```

---

## Parte 4: Bastion Host (Jump Server)

### Escenario

```
[Tu Laptop] → [Bastion (IP pública)] → [Servidor Interno (sin IP pública)]
```

### Paso 4.1: Configurar Bastion

```bash
# En el bastion
sudo nano /etc/ssh/sshd_config

# Configuración específica del bastion:
# Logging verboso (auditoría)
LogLevel VERBOSE

# Restricciones estrictas
PermitRootLogin no
MaxSessions 10
AllowTcpForwarding yes  # Necesario para ProxyJump
X11Forwarding no
AllowAgentForwarding no  # ⚠️ Seguridad: no forward agent
GatewayPorts no
PermitTunnel no

# 2FA obligatorio
AuthenticationMethods publickey,keyboard-interactive
```

### Paso 4.2: Configurar ~/.ssh/config (En tu laptop)

```bash
nano ~/.ssh/config
```

```
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
Host webserver
    HostName web01.internal.empresa.com
    ProxyJump bastion
    User deployer
    LocalForward 8080 localhost:80
```

### Paso 4.3: Probar ProxyJump

```bash
# Conexión directa al servidor interno (a través del bastion)
ssh webserver

# Flujo de autenticación:
# 1. Autentica en bastion (clave + 2FA)
# 2. Desde bastion, conecta a webserver (clave)
# 3. Sesión directa a webserver (¡sin SSH manual al bastion!)

# ✓ Ahora estás en webserver
```

---

## Parte 5: Fail2Ban (Protección contra Brute Force)

### Paso 5.1: Instalar Fail2Ban

```bash
sudo apt install fail2ban -y
```

### Paso 5.2: Configurar Fail2Ban

```bash
# NO editar /etc/fail2ban/jail.conf (se sobreescribe en updates)
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
# Ban por 1 hora
bantime  = 3600

# Ventana de tiempo para contar intentos (10 minutos)
findtime  = 600

# Máximo de intentos permitidos
maxretry = 3

# Acción al detectar ataque
banaction = iptables-multiport
action = %(action_mwl)s
# action_mwl: ban + enviar email con whois + logs

# Email de alertas
destemail = sysadmin@empresa.com
sender = fail2ban@servidor.com
mta = sendmail

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log  # Debian/Ubuntu
# logpath = /var/log/secure   # RHEL/CentOS
maxretry = 3
findtime = 600
bantime = 3600

# Regex custom para detectar ataques específicos
[sshd-aggressive]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 2  # Más agresivo
findtime = 300
bantime = 86400  # Ban por 24 horas
```

### Paso 5.3: Iniciar Fail2Ban

```bash
# Iniciar servicio
sudo systemctl enable --now fail2ban

# Verificar status
sudo fail2ban-client status

# Status de jail específico
sudo fail2ban-client status sshd
```

### Paso 5.4: Probar Fail2Ban

```bash
# Desde otra máquina, intentar login con password incorrecto 3 veces
ssh -o PubkeyAuthentication=no usuario-falso@tu-servidor
# Permission denied

# (Repetir 3 veces)

# Verificar que la IP fue baneada
sudo fail2ban-client status sshd

# Output:
# Status for the jail: sshd
# |- Filter
# |  |- Currently failed:	0
# |  |- Total failed:	3
# |  `- File list:	/var/log/auth.log
# `- Actions
#    |- Currently banned:	1
#    |- Total banned:	1
#    `- Banned IP list:	203.0.113.100

# Verificar en iptables
sudo iptables -L -n | grep 203.0.113.100
# DROP       all  --  203.0.113.100        0.0.0.0/0
```

### Paso 5.5: Desbanear IP (Si es necesario)

```bash
# Desbanear IP específica
sudo fail2ban-client set sshd unbanip 203.0.113.100

# Desbanear TODAS las IPs
sudo fail2ban-client unban --all
```

---

## Parte 6: Monitoreo y Auditoría

### Paso 6.1: Analizar Logs de SSH

```bash
# Conexiones exitosas
sudo grep "Accepted publickey" /var/log/auth.log | tail -20

# Intentos fallidos
sudo grep "Failed password" /var/log/auth.log | tail -20

# Conexiones desde IP específica
sudo grep "203.0.113.1" /var/log/auth.log

# Últimos logins
last -20

# Últimos logins fallidos
lastb -20
```

### Paso 6.2: Script de Alertas por Email

```bash
sudo nano /etc/ssh/alert-on-login.sh
```

```bash
#!/bin/bash
# Script de alerta en login SSH

# Obtener información
USER=$USER
IP=$(echo $SSH_CLIENT | awk '{print $1}')
HOSTNAME=$(hostname)
DATE=$(date)

# Enviar email
echo "SSH Login Detected

User: $USER
IP: $IP
Server: $HOSTNAME
Date: $DATE
" | mail -s "SSH Login Alert: $HOSTNAME" sysadmin@empresa.com
```

```bash
# Hacer ejecutable
sudo chmod +x /etc/ssh/alert-on-login.sh

# Agregar a ~/.bashrc de usuarios críticos
echo 'if [ -n "$SSH_CLIENT" ]; then /etc/ssh/alert-on-login.sh & fi' >> ~/.bashrc
```

### Paso 6.3: Dashboard de Accesos SSH

```bash
# Script de estadísticas
cat > ~/ssh-stats.sh <<'EOF'
#!/bin/bash

echo "=== SSH Access Statistics ==="
echo ""
echo "Total successful logins (last 7 days):"
sudo grep "Accepted publickey" /var/log/auth.log | grep "$(date -d '7 days ago' '+%b %e')" | wc -l

echo ""
echo "Top 10 IPs by login attempts:"
sudo grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10

echo ""
echo "Currently banned IPs (Fail2Ban):"
sudo fail2ban-client status sshd | grep "Banned IP"

echo ""
echo "Active SSH sessions:"
who
EOF

chmod +x ~/ssh-stats.sh
~/ssh-stats.sh
```

---

## Parte 7: Configuración Avanzada

### Paso 7.1: Restricciones en authorized_keys

```bash
nano ~/.ssh/authorized_keys
```

**Ejemplos de restricciones:**

```
# Solo desde IP específica
from="192.168.1.100" ssh-ed25519 AAAAC3... user@laptop

# Solo comando específico (script de backup)
command="/usr/local/bin/backup.sh" ssh-ed25519 AAAAC3... backup@server

# Sin port forwarding
no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAAC3... user@host

# Combinadas
from="10.0.0.0/8",command="/usr/bin/rsync --server",no-pty,no-port-forwarding ssh-ed25519 AAAAC3... backup@server
```

### Paso 7.2: SSH Agent con Timeout

```bash
# Agregar a ~/.bashrc
cat >> ~/.bashrc <<'EOF'

# SSH Agent con timeout automático
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval $(ssh-agent -s -t 3600)  # 1 hora
    ssh-add -t 3600 ~/.ssh/id_ed25519_lab
fi
EOF

source ~/.bashrc
```

---

## Parte 8: Testing de Seguridad

### Paso 8.1: Escaneo con ssh-audit

```bash
# Instalar ssh-audit
git clone https://github.com/jtesta/ssh-audit.git
cd ssh-audit

# Auditar servidor
python3 ssh-audit.py tu-servidor

# Debería mostrar:
# (gen) banner: SSH-2.0-OpenSSH_8.9
# (gen) software: OpenSSH 8.9
# (gen) compatibility: OpenSSH 7.4+, Dropbear SSH 2018.76+
# (gen) compression: enabled (zlib@openssh.com)
#
# (kex) curve25519-sha256                   -- [info] available since OpenSSH 7.4
#                                           `- [info] default key exchange since OpenSSH 6.5
# ...
#
# (enc) chacha20-poly1305@openssh.com       -- [info] available since OpenSSH 6.5
#                                           `- [info] default cipher since OpenSSH 6.9
# ...
# ✓ NO weak algorithms!
```

### Paso 8.2: Verificar 2FA Funciona

```bash
# Test 1: Intentar login SIN código 2FA (debe fallar)
ssh -i ~/.ssh/id_ed25519_lab usuario@tu-servidor
# (Ingresar passphrase correcta)
# Verification code:
# (Ingresar código INCORRECTO)
# Permission denied  ✓

# Test 2: Intentar login solo con password (debe fallar)
ssh -o PubkeyAuthentication=no usuario@tu-servidor
# Permission denied (publickey,keyboard-interactive).  ✓

# Test 3: Login correcto (clave + 2FA)
ssh -i ~/.ssh/id_ed25519_lab usuario@tu-servidor
# (Passphrase correcta + código 2FA correcto)
# ✓ Sesión iniciada
```

---

## Desafío Final

### Objetivo

Configurar infraestructura SSH completa con:
1. Bastion host con 2FA
2. 3 servidores internos (sin IP pública)
3. Fail2Ban en todos los servidores
4. Logging centralizado
5. Alertas por email en cada login

### Arquitectura Esperada

```
[Laptop]
   │
   │ ssh -J bastion webserver
   │
   ▼
[Bastion]
10.0.0.1 (pública)
192.168.1.1 (privada)
   │
   ├──► [Web01] 192.168.1.10
   ├──► [Web02] 192.168.1.11
   └──► [DB01]  192.168.1.20
```

---

## Checklist de Completado

- [ ] sshd_config hardened (algoritmos modernos)
- [ ] Autenticación con claves Ed25519
- [ ] PasswordAuthentication deshabilitado
- [ ] 2FA con Google Authenticator configurado
- [ ] Bastion host configurado
- [ ] ProxyJump funcionando
- [ ] Fail2Ban instalado y activo
- [ ] Logging configurado
- [ ] Alertas por email funcionando
- [ ] Testing de seguridad con ssh-audit
- [ ] Desafío final completado

---

## Recursos

- OpenSSH Hardening Guide: https://infosec.mozilla.org/guidelines/openssh
- NIST SP 800-52: Guidelines for SSH: https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final
- Google Authenticator PAM: https://github.com/google/google-authenticator-libpam
- Fail2Ban Documentation: https://www.fail2ban.org/
- ssh-audit: https://github.com/jtesta/ssh-audit

🔐 **"SSH is the front door to your infrastructure - make it bulletproof"**
