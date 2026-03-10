# Linux Auditd: Auditoría y Forense de Sistemas

## Objetivos de Aprendizaje

1. Comprender el framework de auditoría del kernel Linux
2. Configurar auditd para compliance (PCI-DSS, HIPAA, SOC2)
3. Crear reglas de auditoría para eventos críticos
4. Analizar logs de auditoría para detección de intrusiones
5. Implementar alertas en tiempo real
6. Utilizar aureport y ausearch para análisis forense

---

## 1. Introducción a Linux Audit Framework

### 1.1 ¿Qué es Auditd?

**Linux Audit Framework** es un sistema de auditoría a nivel de kernel que:
- 📝 Registra eventos del sistema con precisión forense
- 🔍 Rastrea accesos a archivos, syscalls, comandos ejecutados
- 🛡️ Cumple requisitos de compliance (PCI-DSS 10.2, HIPAA, SOC2)
- ⚖️ Genera evidencia admisible en procesos legales
- 🚨 Permite detección de comportamientos anómalos

**Casos de uso:**
- Compliance regulatorio (auditorías financieras, healthcare)
- Forense post-incidente (¿qué hizo el atacante?)
- Detección de insider threats
- Auditoría de accesos a datos sensibles
- Monitoreo de cambios en configuraciones críticas

### 1.2 Arquitectura de Auditd

```
┌─────────────────────────────────────────────────────────────┐
│                       User Space                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   auditctl   │  │  ausearch    │  │  aureport    │     │
│  │ (configurar) │  │  (buscar)    │  │ (reportes)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│  ┌──────▼─────────────────▼─────────────────▼───────┐     │
│  │              auditd (daemon)                      │     │
│  │  - Lee /etc/audit/auditd.conf                     │     │
│  │  - Lee /etc/audit/rules.d/*.rules                 │     │
│  │  - Escribe a /var/log/audit/audit.log             │     │
│  └──────────────────────┬────────────────────────────┘     │
│                         │                                   │
│                         │ Netlink Socket                    │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│                  Kernel Space                               │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────┐     │
│  │          Kernel Audit Subsystem                   │     │
│  │  - kauditd (kernel thread)                        │     │
│  │  - Filtros de auditoría                           │     │
│  │  - Buffer de eventos                              │     │
│  └──────────────────────┬────────────────────────────┘     │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────┐     │
│  │     System Call Interface                         │     │
│  │     (syscalls: open, execve, connect, etc.)       │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Componentes Clave

| Componente | Descripción |
|------------|-------------|
| **auditd** | Daemon que lee eventos del kernel y los escribe a logs |
| **auditctl** | Herramienta para configurar reglas de auditoría |
| **ausearch** | Buscar eventos específicos en logs |
| **aureport** | Generar reportes agregados |
| **audispd** | Dispatcher de eventos en tiempo real (plugins) |
| **/etc/audit/auditd.conf** | Configuración del daemon |
| **/etc/audit/rules.d/** | Directorio de reglas de auditoría |
| **/var/log/audit/audit.log** | Log principal de auditoría |

---

## 2. Instalación y Configuración Básica

### 2.1 Instalación

```bash
# Debian/Ubuntu
apt install auditd audispd-plugins

# RHEL/CentOS/Fedora
yum install audit audit-libs

# Verificar instalación
systemctl status auditd
auditctl -l  # Listar reglas activas
```

### 2.2 Configuración del Daemon (auditd.conf)

```bash
# /etc/audit/auditd.conf

# ============================================
# ALMACENAMIENTO DE LOGS
# ============================================

# Directorio de logs
log_file = /var/log/audit/audit.log

# Formato de log (RAW es el más completo)
log_format = RAW

# Grupo del archivo de log
log_group = root

# Prioridad del daemon
priority_boost = 4

# Flush de datos a disco (DATA, INCREMENTAL, SYNC, NONE)
# DATA: flush inmediato (más seguro, menos performance)
flush = INCREMENTAL_ASYNC

# Frecuencia de flush en milisegundos
freq = 50

# Tamaño máximo de un archivo de log (en MB)
max_log_file = 100

# Número de archivos de log a rotar
num_logs = 10

# Acción cuando el log alcanza max_log_file
# ROTATE: rotar a nuevo archivo
# SUSPEND: suspender logging
# SYSLOG: enviar a syslog
# KEEP_LOGS: seguir escribiendo sin rotar
max_log_file_action = ROTATE

# ============================================
# ACCIONES EN CASO DE EMERGENCIA
# ============================================

# Acción cuando el disco está lleno
# IGNORE: continuar (perder eventos)
# SYSLOG: alertar vía syslog
# SUSPEND: suspender auditoría
# SINGLE: modo single-user (DRÁSTICO)
# HALT: apagar sistema (EXTREMO - solo para compliance estricto)
disk_full_action = SUSPEND

# Acción cuando espacio en disco es bajo
disk_error_action = SUSPEND

# Espacio mínimo libre (en MB)
space_left = 500

# Acción cuando se alcanza space_left
space_left_action = EMAIL

# Email para alertas
action_mail_acct = root

# ============================================
# CONFIGURACIÓN DE RED (para envío remoto)
# ============================================

# Enviar logs a servidor remoto (opcional)
# tcp_listen_port = 60
# tcp_max_per_addr = 1
# use_libwrap = yes

# ============================================
# INMUTABILIDAD (COMPLIANCE CRÍTICO)
# ============================================

# Hacer configuración inmutable (requiere reboot para cambiar)
# ⚠️ USAR CON PRECAUCIÓN
# -e 2 = configuración inmutable (kernel panic si hay error)
# -e 1 = auditoría habilitada
# -e 0 = auditoría deshabilitada
# Se configura en rules, no aquí
```

**Aplicar cambios:**
```bash
systemctl restart auditd
```

### 2.3 Configuración de Reglas

**Ubicación de reglas:**
```bash
/etc/audit/rules.d/
├── audit.rules (generado automáticamente, NO editar)
├── 10-base.rules
├── 20-watches.rules
├── 30-stig.rules (Security Technical Implementation Guide)
├── 40-local.rules
└── 99-finalize.rules
```

**Orden de carga:** Alfabético (10, 20, 30, ..., 99)

**Cargar reglas:**
```bash
# Compilar reglas de rules.d/ a /etc/audit/audit.rules
augenrules --load

# O reiniciar auditd
systemctl restart auditd

# Ver reglas activas
auditctl -l
```

---

## 3. Tipos de Reglas de Auditoría

### 3.1 Control Rules (Configuración)

```bash
# /etc/audit/rules.d/10-base.rules

# Buffer size (eventos en memoria antes de flush)
-b 8192

# Failure mode
# 0 = silent (continuar sin auditoría)
# 1 = printk (kernel messages)
# 2 = panic (kernel panic si falla auditoría - EXTREMO)
-f 1

# Rate limit (mensajes por segundo, 0 = sin límite)
-r 1000

# Inmutabilidad (al final de todas las reglas)
# -e 2  # ⚠️ DESCOMENTAR SOLO EN PRODUCCIÓN
```

### 3.2 File System Rules (Watches)

Monitorean accesos a archivos/directorios específicos.

**Sintaxis:**
```bash
-w /path/to/file -p permissions -k key_name

# Permisos:
# r = read
# w = write
# x = execute
# a = attribute change (chmod, chown, etc.)
```

**Ejemplos:**

```bash
# /etc/audit/rules.d/20-watches.rules

# ============================================
# MONITOREO DE CONFIGURACIONES CRÍTICAS
# ============================================

# Cambios en configuración de SSH
-w /etc/ssh/sshd_config -p wa -k sshd_config_changes

# Cambios en sudoers
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/sudoers.d/ -p wa -k sudoers_changes

# Cambios en usuarios/grupos
-w /etc/passwd -p wa -k user_changes
-w /etc/group -p wa -k group_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/gshadow -p wa -k gshadow_changes

# Cambios en PAM
-w /etc/pam.d/ -p wa -k pam_changes
-w /etc/security/ -p wa -k security_changes

# ============================================
# MONITOREO DE AUTENTICACIÓN
# ============================================

# Login failures
-w /var/log/faillog -p wa -k login_failures
-w /var/log/lastlog -p wa -k last_login
-w /var/log/tallylog -p wa -k tally_log

# ============================================
# MONITOREO DE PRIVILEGIOS
# ============================================

# Cambios en crontabs
-w /etc/cron.allow -p wa -k cron_changes
-w /etc/cron.deny -p wa -k cron_changes
-w /etc/cron.d/ -p wa -k cron_changes
-w /etc/cron.daily/ -p wa -k cron_changes
-w /etc/cron.hourly/ -p wa -k cron_changes
-w /etc/cron.monthly/ -p wa -k cron_changes
-w /etc/cron.weekly/ -p wa -k cron_changes
-w /etc/crontab -p wa -k cron_changes
-w /var/spool/cron/ -p wa -k cron_changes

# ============================================
# MONITOREO DE RED
# ============================================

# Configuración de red
-w /etc/hosts -p wa -k network_changes
-w /etc/network/ -p wa -k network_changes
-w /etc/sysconfig/network -p wa -k network_changes
-w /etc/NetworkManager/ -p wa -k network_changes

# Firewall
-w /etc/iptables/ -p wa -k firewall_changes
-w /etc/ufw/ -p wa -k firewall_changes
-w /etc/firewalld/ -p wa -k firewall_changes

# ============================================
# MONITOREO DE KERNEL Y MÓDULOS
# ============================================

# Cambios en módulos del kernel
-w /sbin/insmod -p x -k kernel_module_load
-w /sbin/rmmod -p x -k kernel_module_unload
-w /sbin/modprobe -p x -k kernel_module_probe

# Cambios en configuración del kernel
-w /etc/sysctl.conf -p wa -k sysctl_changes
-w /etc/sysctl.d/ -p wa -k sysctl_changes

# ============================================
# MONITOREO DE DATOS SENSIBLES
# ============================================

# Accesos a directorio de bases de datos
-w /var/lib/mysql/ -p wa -k database_access
-w /var/lib/postgresql/ -p wa -k database_access

# Accesos a secretos
-w /etc/ssl/ -p wa -k ssl_cert_changes
-w /etc/pki/ -p wa -k pki_changes

# Claves SSH
-w /root/.ssh/ -p wa -k root_ssh_keys
-w /home/*/.ssh/ -p wa -k user_ssh_keys
```

### 3.3 System Call Rules (Syscall Auditing)

Monitorizan syscalls específicas del kernel.

**Sintaxis:**
```bash
-a action,filter -S syscall -F field=value -k key_name

# Actions:
# always = siempre auditar
# never = nunca auditar

# Filters:
# task = al crear proceso
# entry = entrada a syscall
# exit = salida de syscall
# user = espacio de usuario
# exclude = excluir

# Syscalls: open, execve, connect, unlink, chmod, etc.
```

**Ejemplos:**

```bash
# /etc/audit/rules.d/30-stig.rules (basado en DISA STIG)

# ============================================
# AUDITORÍA DE EJECUCIÓN DE COMANDOS
# ============================================

# Auditar TODOS los comandos ejecutados (execve)
# ⚠️ GENERA MUCHO LOG - usar solo si es necesario
-a always,exit -F arch=b64 -S execve -k exec_commands
-a always,exit -F arch=b32 -S execve -k exec_commands

# ============================================
# AUDITORÍA DE ESCALADA DE PRIVILEGIOS
# ============================================

# Cambios de UID/GID (detección de sudo, su, etc.)
-a always,exit -F arch=b64 -S setuid -S setgid -S setreuid -S setregid -k privilege_escalation
-a always,exit -F arch=b32 -S setuid -S setgid -S setreuid -S setregid -k privilege_escalation

# Ejecución de binarios SUID/SGID
-a always,exit -F arch=b64 -S execve -F perm=x -F auid>=1000 -F auid!=unset -k suid_execution
-a always,exit -F arch=b32 -S execve -F perm=x -F auid>=1000 -F auid!=unset -k suid_execution

# ============================================
# AUDITORÍA DE ACCESO A ARCHIVOS
# ============================================

# Eliminación de archivos (unlink, rename)
-a always,exit -F arch=b64 -S unlink -S unlinkat -S rename -S renameat -k file_deletion
-a always,exit -F arch=b32 -S unlink -S unlinkat -S rename -S renameat -k file_deletion

# Cambios de permisos (chmod, chown)
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -k perm_changes
-a always,exit -F arch=b32 -S chmod -S fchmod -S fchmodat -k perm_changes

-a always,exit -F arch=b64 -S chown -S fchown -S fchownat -S lchown -k owner_changes
-a always,exit -F arch=b32 -S chown -S fchown -S fchownat -S lchown -k owner_changes

# Cambios de atributos extendidos (SELinux contexts)
-a always,exit -F arch=b64 -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S lremovexattr -S fremovexattr -k xattr_changes
-a always,exit -F arch=b32 -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S lremovexattr -S fremovexattr -k xattr_changes

# ============================================
# AUDITORÍA DE RED
# ============================================

# Conexiones de red (IPv4 e IPv6)
-a always,exit -F arch=b64 -S socket -S connect -S bind -k network_connections
-a always,exit -F arch=b32 -S socket -S connect -S bind -k network_connections

# Cambios en configuración de red
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k network_config_changes
-a always,exit -F arch=b32 -S sethostname -S setdomainname -k network_config_changes

# ============================================
# AUDITORÍA DE MONTAJES Y DESMONTAJES
# ============================================

-a always,exit -F arch=b64 -S mount -S umount2 -k mount_operations
-a always,exit -F arch=b32 -S mount -S umount2 -k mount_operations

# ============================================
# AUDITORÍA DE MÓDULOS DEL KERNEL
# ============================================

-a always,exit -F arch=b64 -S init_module -S delete_module -k kernel_modules
-a always,exit -F arch=b32 -S init_module -S delete_module -k kernel_modules

# ============================================
# AUDITORÍA DE ACCESO A DATOS SENSIBLES
# ============================================

# Acceso NO autorizado a archivos sensibles
# (solo usuarios con auid >= 1000, excluir procesos del sistema)
-a always,exit -F arch=b64 -S open -S openat -F dir=/etc -F auid>=1000 -F auid!=unset -k sensitive_file_access
-a always,exit -F arch=b32 -S open -S openat -F dir=/etc -F auid>=1000 -F auid!=unset -k sensitive_file_access
```

**Filtros de campo (-F) comunes:**

| Filtro | Descripción | Ejemplo |
|--------|-------------|---------|
| `arch=b64` | Arquitectura 64-bit | `-F arch=b64` |
| `arch=b32` | Arquitectura 32-bit | `-F arch=b32` |
| `auid>=1000` | Audit UID (usuarios reales, no servicios) | `-F auid>=1000` |
| `auid!=unset` | Excluir procesos sin auid | `-F auid!=unset` |
| `uid=0` | Usuario root | `-F uid=0` |
| `perm=x` | Permiso de ejecución | `-F perm=x` |
| `dir=/etc` | Directorio específico | `-F dir=/etc` |
| `key=mykey` | Key específica (para -k) | `-k mykey` |
| `exit=-EACCES` | Códigos de error | `-F exit=-EACCES` |

### 3.4 Inmutabilidad (Finalize Rules)

```bash
# /etc/audit/rules.d/99-finalize.rules

# Hacer la configuración de auditoría INMUTABLE
# ⚠️ Requiere REBOOT para modificar reglas
# Solo usar en producción con alta compliance
-e 2

# Alternativa: solo habilitar auditoría (puede modificarse en runtime)
# -e 1
```

---

## 4. Análisis de Logs de Auditoría

### 4.1 Formato de Eventos

**Ejemplo de evento:**
```
type=SYSCALL msg=audit(1708605324.123:456): arch=c000003e syscall=59 success=yes exit=0 a0=7ffe1234 a1=7ffe5678 a2=7ffe9abc a3=0 items=2 ppid=1234 pid=1235 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=3 comm="sudo" exe="/usr/bin/sudo" key="privilege_escalation"
```

**Campos importantes:**
- `type`: Tipo de evento (SYSCALL, EXECVE, PATH, etc.)
- `msg=audit(timestamp:serial)`: Timestamp único
- `syscall=59`: Número de syscall (59 = execve)
- `success=yes`: Si la syscall tuvo éxito
- `auid=1000`: Audit UID (usuario original, no cambia con sudo/su)
- `uid=0`: UID efectivo (root en este caso)
- `comm="sudo"`: Comando ejecutado
- `key="privilege_escalation"`: Key de la regla que generó el evento

### 4.2 Búsquedas con ausearch

```bash
# Búsqueda por key
ausearch -k sshd_config_changes

# Búsqueda por usuario (auid)
ausearch -ua 1000

# Búsqueda por comando
ausearch -c sudo

# Búsqueda por syscall
ausearch -sc execve

# Búsqueda por fecha/hora
ausearch -ts today
ausearch -ts 02/22/2026 10:00:00 -te 02/22/2026 12:00:00

# Búsqueda por PID
ausearch -p 1234

# Búsqueda por hostname (en logs remotos)
ausearch --node webserver01

# Búsqueda por archivo accedido
ausearch -f /etc/shadow

# Búsqueda de eventos fallidos
ausearch -m SYSCALL -sv no  # -sv = success value

# Búsqueda de eventos de autenticación
ausearch -m USER_LOGIN -sv no  # Logins fallidos

# Interpretar eventos (formato legible)
ausearch -k privilege_escalation -i
# -i: interpreta UIDs/GIDs a nombres, syscalls a nombres, etc.

# Formato raw (para parsing con scripts)
ausearch -k privilege_escalation --raw

# Combinaciones
ausearch -k privilege_escalation -ts today -i
```

### 4.3 Reportes con aureport

```bash
# Reporte general
aureport

# Reporte de autenticación
aureport --auth

# Reporte de logins
aureport --login

# Reporte de logins fallidos
aureport --login --failed

# Reporte de ejecuciones de comandos
aureport -x

# Reporte de archivos accedidos
aureport -f

# Reporte de syscalls más frecuentes
aureport -s

# Reporte de usuarios más activos
aureport -u

# Reporte de eventos anómalos (anomaly detection)
aureport --anomaly

# Reporte de modificaciones de configuración
aureport -k

# Reporte personalizado por período
aureport --auth -ts 02/01/2026 -te 02/28/2026

# Reporte en formato CSV (para análisis con Excel/Python)
aureport --auth --format csv > auth_report.csv

# Reporte con interpretación de IDs
aureport -u -i
```

**Ejemplo de salida de aureport:**
```
Authentication Report
============================================
# date time acct host term exe success event
============================================
1. 02/22/2026 10:15:32 admin 192.168.1.100 ssh /usr/sbin/sshd yes 123
2. 02/22/2026 10:20:45 root 192.168.1.100 pts/0 /bin/su yes 124
3. 02/22/2026 11:05:12 attacker 203.0.113.1 ssh /usr/sbin/sshd no 125
```

### 4.4 Eventos Críticos a Buscar

**Escalada de privilegios:**
```bash
ausearch -k privilege_escalation -i
```

**Cambios en configuración SSH:**
```bash
ausearch -k sshd_config_changes -i
```

**Cambios en sudoers:**
```bash
ausearch -k sudoers_changes -i
```

**Ejecución de comandos por root:**
```bash
ausearch -ua 0 -sc execve -i
```

**Accesos fallidos (posible ataque):**
```bash
ausearch -m USER_LOGIN -sv no -ts today -i
```

**Cambios en usuarios/grupos:**
```bash
ausearch -k user_changes -k group_changes -i
```

**Módulos del kernel cargados:**
```bash
ausearch -k kernel_modules -i
```

---

## 5. Compliance: PCI-DSS Requirements

### 5.1 PCI-DSS Requirement 10.2

**Requirement 10.2.1:** Todos los accesos a datos de tarjetas deben ser registrados.

```bash
# Monitorear directorio con datos de tarjetas
-w /var/www/payment/ -p rwa -k pci_cardholder_data_access
```

**Requirement 10.2.2:** Todas las acciones realizadas por individuos con privilegios root/admin.

```bash
# Ya cubierto con:
-a always,exit -F arch=b64 -S execve -F auid=0 -k root_commands
```

**Requirement 10.2.3:** Acceso a logs de auditoría.

```bash
-w /var/log/audit/ -p rwa -k audit_log_access
```

**Requirement 10.2.4:** Intentos de acceso inválidos.

```bash
# Ya generado automáticamente por PAM/SSH
# Búsqueda con:
ausearch -m USER_LOGIN -sv no
```

**Requirement 10.2.5:** Cambios en mecanismos de autenticación.

```bash
# Ya cubierto con:
-w /etc/pam.d/ -p wa -k pam_changes
```

**Requirement 10.2.6:** Inicialización de logs de auditoría.

```bash
-w /var/log/audit/audit.log -p wa -k audit_log_init
```

**Requirement 10.2.7:** Creación y eliminación de objetos a nivel de sistema.

```bash
# Ya cubierto con syscall rules
```

### 5.2 Generación de Reportes de Compliance

```bash
# Script de reporte mensual PCI-DSS
#!/bin/bash
REPORT_DIR="/var/audit-reports"
MONTH=$(date +%Y-%m)
REPORT_FILE="$REPORT_DIR/pci-compliance-$MONTH.txt"

mkdir -p $REPORT_DIR

echo "PCI-DSS Compliance Audit Report - $MONTH" > $REPORT_FILE
echo "==========================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "10.2.1 - Cardholder Data Access:" >> $REPORT_FILE
aureport -k pci_cardholder_data_access -ts $MONTH-01 >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "10.2.2 - Root Commands:" >> $REPORT_FILE
aureport -k root_commands -ts $MONTH-01 >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "10.2.3 - Audit Log Access:" >> $REPORT_FILE
aureport -k audit_log_access -ts $MONTH-01 >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "10.2.4 - Failed Logins:" >> $REPORT_FILE
aureport --login --failed -ts $MONTH-01 >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Enviar a compliance team
mail -s "PCI-DSS Audit Report $MONTH" compliance@empresa.com < $REPORT_FILE
```

---

## 6. Detección de Intrusiones con Auditd

### 6.1 Patrones de Ataque Comunes

**Reconocimiento (enumeration):**
```bash
# Ejecución masiva de comandos de enumeración
ausearch -c whoami -c id -c hostname -c uname -ts recent
```

**Escalada de privilegios:**
```bash
# Cambios de UID a root
ausearch -k privilege_escalation -ts today
```

**Persistencia (backdoors):**
```bash
# Cambios en crontabs, servicios systemd
ausearch -k cron_changes -ts today
ausearch -f /etc/systemd/system/ -ts today
```

**Exfiltración de datos:**
```bash
# Compresión masiva de archivos
ausearch -c tar -c gzip -c zip -ts today

# Transferencias de red inusuales
ausearch -sc connect -ts today | grep -E "(scp|nc|curl|wget)"
```

**Lateral movement:**
```bash
# Uso de claves SSH
ausearch -k user_ssh_keys -ts today
```

### 6.2 Alertas en Tiempo Real con audispd

**Configuración de audispd:**

```bash
# /etc/audit/plugins.d/syslog.conf
active = yes
direction = out
path = builtin_syslog
type = builtin
args = LOG_INFO
format = string

# Ahora eventos van a syslog → SIEM
```

**Plugin custom para alertas:**

```bash
# /etc/audit/plugins.d/custom-alert.conf
active = yes
direction = out
path = /usr/local/bin/audit-alert.sh
type = always
format = string

# /usr/local/bin/audit-alert.sh
#!/bin/bash
while read line; do
    # Detectar eventos críticos
    if echo "$line" | grep -qE "(privilege_escalation|root_commands)"; then
        # Enviar alerta
        echo "$line" | mail -s "[ALERT] Critical Audit Event" soc@empresa.com
        # O enviar a webhook de Slack
        curl -X POST https://hooks.slack.com/... -d "{\"text\": \"$line\"}"
    fi
done
```

---

## 7. Análisis Forense Post-Incidente

### 7.1 Caso de Uso: Compromiso de Servidor Web

**Cronología del incidente:**
1. Atacante explota CVE en aplicación web
2. Obtiene shell inversa
3. Escala privilegios
4. Instala backdoor
5. Exfiltra datos

**Investigación con auditd:**

**Paso 1: Identificar conexiones inusuales**
```bash
# Buscar conexiones de red en el período del incidente
ausearch -ts 02/22/2026 14:00:00 -te 02/22/2026 16:00:00 -k network_connections -i

# Buscar procesos del servidor web ejecutando comandos inusuales
ausearch -c httpd -c apache2 -sc execve -ts 02/22/2026 14:00:00 -i
```

**Paso 2: Rastrear escalada de privilegios**
```bash
# Ver escaladas de privilegios
ausearch -k privilege_escalation -ts 02/22/2026 14:00:00 -i

# Ver comandos ejecutados como root
ausearch -ua 0 -sc execve -ts 02/22/2026 14:00:00 -i
```

**Paso 3: Identificar persistencia**
```bash
# Cambios en crontabs
ausearch -k cron_changes -ts 02/22/2026 14:00:00 -i

# Cambios en SSH (claves autorizadas)
ausearch -k user_ssh_keys -ts 02/22/2026 14:00:00 -i

# Módulos del kernel cargados
ausearch -k kernel_modules -ts 02/22/2026 14:00:00 -i
```

**Paso 4: Identificar exfiltración**
```bash
# Archivos comprimidos
ausearch -c tar -c gzip -ts 02/22/2026 14:00:00 -i

# Transferencias de archivos
ausearch -c scp -c rsync -c curl -ts 02/22/2026 14:00:00 -i
```

**Paso 5: Generar timeline completo**
```bash
# Extraer TODOS los eventos en el período
ausearch -ts 02/22/2026 14:00:00 -te 02/22/2026 16:00:00 -i > incident_timeline.txt

# Generar reporte
aureport -i -ts 02/22/2026 14:00:00 -te 02/22/2026 16:00:00 > incident_report.txt
```

### 7.2 Preservación de Evidencia

```bash
# 1. Hacer backup inmediato de logs
cp -a /var/log/audit/ /forensics/audit-backup-$(date +%Y%m%d-%H%M%S)

# 2. Calcular hashes (cadena de custodia)
sha256sum /var/log/audit/audit.log* > /forensics/audit-hashes.txt

# 3. Comprimir evidencia
tar -czf /forensics/audit-evidence.tar.gz /var/log/audit/

# 4. Firmar digitalmente (GPG)
gpg --sign /forensics/audit-evidence.tar.gz

# 5. Enviar a almacenamiento seguro (off-site)
```

---

## 8. Mejores Prácticas

### 8.1 Configuración de Producción

**DO:**
- ✅ Monitorear accesos a datos sensibles
- ✅ Auditar TODOS los comandos de usuarios privilegiados
- ✅ Enviar logs a servidor centralizado (SIEM)
- ✅ Configurar alertas en tiempo real
- ✅ Rotar logs regularmente (pero conservar por compliance)
- ✅ Proteger logs contra modificación (WORM storage, firma digital)
- ✅ Revisar logs semanalmente (mínimo)
- ✅ Usar inmutabilidad (-e 2) en producción

**DON'T:**
- ❌ Auditar TODO (syscall masivo) - impacto de performance ~10-20%
- ❌ Almacenar logs solo en el servidor auditado (backup remoto)
- ❌ Dar acceso a logs a usuarios no autorizados
- ❌ Desactivar auditd "temporalmente" (mantener siempre activo)

### 8.2 Performance Tuning

**Reducir overhead:**
```bash
# 1. Aumentar buffer size
-b 16384

# 2. Filtrar eventos innecesarios
# Excluir syscalls ruidosas para procesos del sistema
-a never,exit -S read -F auid=unset

# 3. Aumentar rate limit
-r 2000

# 4. Usar flush asíncrono
# En auditd.conf:
flush = INCREMENTAL_ASYNC
```

**Monitorear performance:**
```bash
# Ver estadísticas de auditd
auditctl -s

# Ver eventos perdidos (lost)
aureport --summary | grep -i lost

# Si hay eventos perdidos, aumentar buffer (-b)
```

### 8.3 Almacenamiento y Retención

**Cálculo de espacio:**
```bash
# Eventos por día (aproximado):
# Servidor con actividad moderada: ~500 MB/día
# Servidor con alta actividad: ~2-5 GB/día
# Servidor con auditoría exhaustiva (execve): ~10-50 GB/día

# Retención según compliance:
# PCI-DSS: 1 año (mínimo 3 meses online, 9 meses offline)
# HIPAA: 6 años
# SOC2: 1 año
# GDPR: variable según DPO
```

**Rotación y compresión:**
```bash
# /etc/audit/auditd.conf
max_log_file = 100      # MB
num_logs = 50           # mantener 50 archivos = 5 GB

# Compresión automática con cron
# /etc/cron.daily/compress-audit-logs
#!/bin/bash
find /var/log/audit/ -name "audit.log.*" -mtime +7 -exec gzip {} \;

# Mover a almacenamiento de largo plazo
find /var/log/audit/ -name "audit.log.*.gz" -mtime +30 -exec mv {} /archive/audit/ \;
```

---

## 9. Integración con SIEM

### 9.1 Enviar Logs a Elasticsearch (ELK Stack)

**Instalación de Filebeat:**
```bash
apt install filebeat
```

**Configuración:**
```bash
# /etc/filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/audit/audit.log
  fields:
    log_type: auditd
  fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch.empresa.com:9200"]
  index: "auditd-%{+yyyy.MM.dd}"

setup.template.name: "auditd"
setup.template.pattern: "auditd-*"
```

### 9.2 Enviar Logs a Splunk

```bash
# /opt/splunkforwarder/etc/system/local/inputs.conf
[monitor:///var/log/audit/audit.log]
disabled = false
sourcetype = linux:audit
index = linux_security

# Reiniciar Splunk forwarder
/opt/splunkforwarder/bin/splunk restart
```

### 9.3 Enviar Logs con Syslog-ng

```bash
# /etc/syslog-ng/conf.d/audit.conf
source s_audit {
    file("/var/log/audit/audit.log" flags(no-parse));
};

destination d_siem {
    syslog("siem.empresa.com" port(514) transport("tcp"));
};

log {
    source(s_audit);
    destination(d_siem);
};
```

---

## 10. Troubleshooting

### 10.1 Problemas Comunes

**Problema: auditd no inicia**
```bash
# Verificar sintaxis de reglas
auditctl -l

# Ver errores en journal
journalctl -u auditd -n 50

# Validar permisos
ls -la /var/log/audit/
# drwx------ 2 root root ...
```

**Problema: Eventos perdidos (lost)**
```bash
auditctl -s
# lost: 1234

# Solución: Aumentar buffer
auditctl -b 16384
# Hacer permanente en rules
```

**Problema: Disco lleno**
```bash
# Ver configuración de espacio
grep -E '(space_left|disk_full_action)' /etc/audit/auditd.conf

# Solución: Aumentar rotación o comprimir logs
```

**Problema: Performance degradado**
```bash
# Verificar número de reglas activas
auditctl -l | wc -l
# Si > 200 reglas, revisar si todas son necesarias

# Verificar syscall rules exhaustivas
auditctl -l | grep execve
# Considerar filtrar por usuario/directorio específico
```

---

## Conclusión

Auditd es **fundamental** para:
- **Compliance** (PCI-DSS, HIPAA, SOC2, ISO 27001)
- **Forense** (investigación post-incidente)
- **Detección** (comportamientos anómalos)
- **Responsabilidad** (accountability de administradores)

**Principios clave:**
1. **Auditar lo crítico**: Privilegios, autenticación, datos sensibles
2. **Centralizar logs**: SIEM para correlación
3. **Proteger logs**: Inmutabilidad, almacenamiento WORM
4. **Revisar regularmente**: Automatizar análisis con SIEM/scripts
5. **Compliance primero**: Configurar según estándares aplicables

🔒 **"Logs don't lie, but they must be protected"** - Asegura tus audit logs como tu activo más valioso para forense.
