# Cheatsheet - Comandos Esenciales de Seguridad Linux

## SELinux

```bash
# Ver estado
getenforce
sestatus

# Cambiar modo
setenforce 0  # Permissive
setenforce 1  # Enforcing

# Ver contextos
ls -Z /path/to/file
ps auxZ | grep httpd

# Cambiar contexto (temporal)
chcon -t httpd_sys_content_t /var/www/html/index.html

# Cambiar contexto (permanente)
semanage fcontext -a -t httpd_sys_content_t "/srv/web(/.*)?"
restorecon -Rv /srv/web/

# Booleanos
getsebool -a | grep httpd
setsebool -P httpd_can_network_connect on

# Puertos
semanage port -l | grep http
semanage port -a -t http_port_t -p tcp 8080

# Troubleshooting
ausearch -m AVC -ts recent
sealert -a /var/log/audit/audit.log
audit2allow -a  # Generar política
```

## SSH

```bash
# Generar claves
ssh-keygen -t ed25519 -a 100 -C "email@domain.com"
ssh-keygen -t rsa -b 4096

# Copiar clave pública
ssh-copy-id user@server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# SSH con opciones
ssh -i ~/.ssh/key user@server
ssh -J bastion user@internal-server  # Jump server
ssh -L 8080:localhost:80 user@server  # Local forward
ssh -D 1080 user@server  # SOCKS proxy

# Configuración
sudo nano /etc/ssh/sshd_config
sudo sshd -t  # Validar sintaxis
sudo systemctl reload sshd

# SSH Agent
eval $(ssh-agent)
ssh-add ~/.ssh/id_ed25519
ssh-add -l  # Listar claves
ssh-add -D  # Eliminar todas

# Auditoría
ssh-audit server.com
```

## Auditd

```bash
# Control básico
sudo systemctl start auditd
sudo auditctl -l  # Ver reglas activas
sudo augenrules --load  # Cargar reglas

# Búsquedas
ausearch -k ssh_config  # Por key
ausearch -f /etc/passwd  # Por archivo
ausearch -ua 1000  # Por usuario (auid)
ausearch -ts today  # Hoy
ausearch -ts 10:00:00 -te 11:00:00  # Rango
ausearch -m AVC  # Denials SELinux
ausearch -sc execve  # Por syscall
ausearch -i  # Interpretar (legible)

# Reportes
aureport  # Reporte general
aureport --auth  # Autenticación
aureport --login --failed  # Logins fallidos
aureport -f  # Archivos accedidos
aureport -x  # Comandos ejecutados
aureport --summary
```

## AIDE

```bash
# Inicializar
sudo aideinit
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Verificar
sudo aide --check

# Actualizar baseline
sudo aide --update
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Configuración
sudo nano /etc/aide/aide.conf
```

## PAM

```bash
# Archivos de configuración
/etc/pam.d/sshd
/etc/pam.d/sudo
/etc/pam.d/common-auth  # Debian/Ubuntu
/etc/security/pwquality.conf
/etc/security/access.conf

# Fail2Ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
sudo fail2ban-client set sshd unbanip 1.2.3.4

# Gestión de usuarios
chage -l usuario  # Ver expiración
chage -M 90 usuario  # Max 90 días
passwd -l usuario  # Bloquear
passwd -u usuario  # Desbloquear
```

## Patch Management

```bash
# Debian/Ubuntu
sudo apt update
sudo apt list --upgradable
sudo apt upgrade
sudo apt full-upgrade

# Solo seguridad
sudo unattended-upgrade --dry-run
sudo unattended-upgrade

# RHEL/CentOS
sudo dnf check-update
sudo dnf updateinfo list security
sudo dnf upgrade --security

# Kernel
uname -r  # Ver versión actual
sudo apt install linux-image-generic  # Actualizar
sudo reboot  # Aplicar

# Livepatch (Ubuntu)
sudo ua enable livepatch
canonical-livepatch status
```

## Firewall

```bash
# iptables
sudo iptables -L -n -v
sudo iptables -A INPUT -s 1.2.3.4 -j DROP
sudo iptables-save > /tmp/rules.txt
sudo iptables-restore < /tmp/rules.txt

# firewalld (RHEL/CentOS)
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=ssh --permanent
sudo firewall-cmd --reload

# ufw (Ubuntu)
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw enable
```

## Capabilities

```bash
# Ver capabilities
getcap /usr/bin/ping
getcap -r / 2>/dev/null  # Buscar todos

# Asignar capability
sudo setcap cap_net_bind_service=+ep /usr/bin/myserver

# Ver de proceso
grep Cap /proc/PID/status
capsh --decode=00000000a80425fb
```

## sysctl (Kernel Parameters)

```bash
# Ver parámetros
sysctl -a
sysctl net.ipv4.ip_forward

# Cambiar temporal
sudo sysctl -w net.ipv4.ip_forward=0

# Cambiar permanente
sudo nano /etc/sysctl.d/99-hardening.conf
sudo sysctl -p /etc/sysctl.d/99-hardening.conf

# Parámetros clave
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
kernel.randomize_va_space = 2
kernel.dmesg_restrict = 1
```

## Rootkit Detection

```bash
# rkhunter
sudo rkhunter --update
sudo rkhunter --propupd
sudo rkhunter --check

# chkrootkit
sudo chkrootkit
sudo chkrootkit -q  # Quiet

# Lynis
sudo lynis audit system
sudo lynis show details TEST-ID
```

## Logs

```bash
# Ver logs
sudo tail -f /var/log/auth.log  # Debian/Ubuntu
sudo tail -f /var/log/secure  # RHEL/CentOS
sudo journalctl -u sshd -f
sudo journalctl -xe

# Buscar patrones
sudo grep "Failed password" /var/log/auth.log
sudo grep "Accepted publickey" /var/log/auth.log | tail -20
```

## Monitoring

```bash
# Procesos
ps auxf
ps auxZ  # Con contexto SELinux
top
htop

# Red
netstat -tulpn
ss -tulpn
lsof -i :22

# Disco
df -h
du -sh /var/log/*
iostat

# Usuarios activos
who
w
last
lastb  # Logins fallidos
```

## Permisos

```bash
# Ver permisos
ls -la
ls -lZ  # Con SELinux

# Cambiar permisos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Cambiar owner
chown user:group file
chown -R www-data:www-data /var/www

# SUID/SGID
chmod u+s /path/to/binary  # SUID
chmod g+s /path/to/binary  # SGID
find / -perm -4000 2>/dev/null  # Buscar SUID
```

## Backup & Forensics

```bash
# Backup de configuraciones
sudo tar -czf config-backup.tar.gz /etc/

# Preservar evidencia
sudo dd if=/dev/sda of=/mnt/forensics/disk.dd bs=4M status=progress
sha256sum disk.dd > disk.dd.sha256

# Análisis de memoria
sudo cat /proc/meminfo
sudo cat /proc/PID/maps
```

---

💡 **Tip**: Crea alias en ~/.bashrc para comandos frecuentes
```bash
alias audit-today='sudo ausearch -ts today -i'
alias check-ssh='sudo grep "Accepted\|Failed" /var/log/auth.log | tail -50'
alias selinux-denials='sudo ausearch -m AVC -ts recent'
```

🔐 **Practica en VMs antes de producción - Un comando mal escrito puede bloquearte del sistema**
