# Kernel Hardening y Mandatory Access Control

## Objetivos de Aprendizaje

1. Comprender la arquitectura de seguridad del kernel Linux
2. Dominar SELinux y AppArmor como sistemas MAC
3. Implementar Linux Capabilities para privilegio mínimo
4. Configurar parámetros sysctl para hardening del kernel
5. Aplicar módulos de seguridad del kernel (LSM)

---

## 1. Introducción al Kernel Hardening

### 1.1 ¿Qué es el Kernel Hardening?

El **kernel hardening** es el proceso de fortalecer el kernel del sistema operativo mediante la aplicación de configuraciones, parches y mecanismos de seguridad que reducen la superficie de ataque y limitan el impacto de vulnerabilidades.

**Objetivos principales:**
- **Reducir la superficie de ataque**: Desactivar funcionalidades innecesarias
- **Aplicar principio de mínimo privilegio**: Limitar capacidades de procesos
- **Implementar defensa en profundidad**: Múltiples capas de seguridad
- **Mitigar exploits conocidos**: ASLR, DEP, stack canaries
- **Auditar y monitorear**: Registro detallado de eventos de seguridad

### 1.2 Arquitectura de Seguridad del Kernel Linux

```
┌─────────────────────────────────────────────────────────┐
│                   User Space                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Process  │  │ Process  │  │ Process  │             │
│  │   UID    │  │   UID    │  │   UID    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        │    System Call Interface  │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                    Kernel Space                         │
│  ┌────────────────────────────────────────────────┐    │
│  │        Linux Security Modules (LSM)            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│  │  │ SELinux  │ │ AppArmor │ │   Smack  │       │    │
│  │  └──────────┘ └──────────┘ └──────────┘       │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │      Traditional DAC (Discretionary AC)        │    │
│  │          (User/Group permissions)              │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │         Linux Capabilities                     │    │
│  │   (CAP_NET_ADMIN, CAP_SYS_ADMIN, etc.)        │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │         Kernel Core (VFS, Network, etc.)       │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
   Hardware Layer (CPU, Memory, I/O)
```

**Capas de seguridad:**
1. **DAC (Discretionary Access Control)**: Permisos tradicionales Unix (rwx)
2. **Linux Capabilities**: Granularización de privilegios root
3. **MAC (Mandatory Access Control)**: SELinux, AppArmor - políticas obligatorias
4. **Kernel mitigation**: ASLR, DEP, SMEP, SMAP

---

## 2. SELinux (Security-Enhanced Linux)

### 2.1 Arquitectura de SELinux

SELinux implementa **Mandatory Access Control (MAC)** mediante un framework de **Type Enforcement (TE)** desarrollado por la NSA.

**Componentes principales:**
```
┌──────────────────────────────────────────────────────┐
│              SELinux Architecture                    │
├──────────────────────────────────────────────────────┤
│  User Space:                                         │
│  ┌─────────────┐  ┌──────────────┐                  │
│  │ libselinux  │  │ Policy Store │                  │
│  └──────┬──────┘  └──────┬───────┘                  │
│         │                │                           │
│  ┌──────▼────────────────▼───────┐                  │
│  │    SELinux Userspace Tools    │                  │
│  │ (semanage, restorecon, etc.)  │                  │
│  └──────────────┬─────────────────┘                  │
├─────────────────┼──────────────────────────────────┤
│  Kernel Space:  │                                   │
│  ┌──────────────▼──────────────┐                    │
│  │  Security Server            │                    │
│  │  - Access Vector Cache (AVC)│                    │
│  │  - Policy Decision Logic    │                    │
│  └──────────────┬──────────────┘                    │
│  ┌──────────────▼──────────────┐                    │
│  │  LSM Hooks                  │                    │
│  │  (Object Managers)          │                    │
│  └─────────────────────────────┘                    │
└──────────────────────────────────────────────────────┘
```

### 2.2 Conceptos Fundamentales

#### Contextos de Seguridad (Security Contexts)

Cada objeto (archivo, proceso, puerto, etc.) tiene un **contexto de seguridad**:

```
user:role:type:level
```

Ejemplo:
```bash
# Proceso Apache
system_u:system_r:httpd_t:s0

# Archivo en /var/www/html
system_u:object_r:httpd_sys_content_t:s0

# Puerto 80
system_u:object_r:http_port_t:s0
```

**Componentes del contexto:**
- **user**: Usuario SELinux (no es el mismo que el usuario Unix)
- **role**: Rol del sujeto (ej: `system_r`, `user_r`)
- **type**: Tipo del objeto/sujeto - **fundamental para Type Enforcement**
- **level**: Nivel de seguridad MLS/MCS (ej: `s0`, `s0-s0:c0.c1023`)

#### Type Enforcement (TE)

Las reglas de política especifican qué **tipos** pueden acceder a qué **tipos**:

```
# Sintaxis básica de una regla
allow <source_type> <target_type>:<class> { <permissions> };

# Ejemplos reales
allow httpd_t httpd_sys_content_t:file { read getattr open };
allow httpd_t http_port_t:tcp_socket { bind listen };
allow httpd_t postgresql_port_t:tcp_socket { name_connect };
```

### 2.3 Modos de Operación

SELinux opera en tres modos:

1. **Enforcing**: Políticas aplicadas activamente, violaciones bloqueadas y registradas
2. **Permissive**: Políticas NO aplicadas, pero violaciones registradas (útil para debugging)
3. **Disabled**: SELinux completamente deshabilitado

```bash
# Ver modo actual
getenforce

# Cambiar temporalmente a permissive
setenforce 0

# Cambiar permanentemente (editar /etc/selinux/config)
SELINUX=enforcing
SELINUXTYPE=targeted
```

### 2.4 Políticas de SELinux

**Tipos de políticas:**

1. **Targeted Policy** (por defecto en RHEL/CentOS/Fedora):
   - Solo ciertos servicios confinados (httpd, sshd, postgresql, etc.)
   - Procesos de usuario no confinados (`unconfined_t`)
   - Balance entre seguridad y usabilidad

2. **MLS Policy** (Multi-Level Security):
   - Clasificación de datos (Top Secret, Secret, Confidential, etc.)
   - Usado en entornos militares y gubernamentales
   - Implementa modelo Bell-LaPadula

3. **Strict Policy**:
   - TODO está confinado, incluyendo procesos de usuario
   - Máxima seguridad, pero complejo de administrar

### 2.5 Comandos Esenciales

```bash
# Ver contexto de archivos
ls -Z /var/www/html/
# -rw-r--r--. apache apache system_u:object_r:httpd_sys_content_t:s0 index.html

# Ver contexto de procesos
ps auxZ | grep httpd
# system_u:system_r:httpd_t:s0 apache 1234 ... /usr/sbin/httpd

# Cambiar contexto (temporal)
chcon -t httpd_sys_rw_content_t /var/www/uploads/

# Restaurar contexto según política
restorecon -Rv /var/www/

# Cambiar contexto de forma permanente
semanage fcontext -a -t httpd_sys_content_t "/web(/.*)?"
restorecon -Rv /web/

# Ver booleanos (switches de política)
getsebool -a | grep httpd
# httpd_can_network_connect --> off
# httpd_enable_cgi --> on

# Cambiar booleano (permanente)
setsebool -P httpd_can_network_connect on

# Buscar reglas de política
sesearch --allow -s httpd_t -t postgresql_port_t

# Ver denials en audit log
ausearch -m AVC -ts recent
```

### 2.6 Debugging de Problemas SELinux

**Flujo de trabajo típico:**

```bash
# 1. Reproducir el problema en modo permissive
setenforce 0

# 2. Realizar la acción que falla

# 3. Buscar denials
ausearch -m AVC -ts recent > denials.txt

# 4. Generar módulo de política
grep httpd denials.txt | audit2allow -M mypolicy

# 5. Instalar el módulo (¡CUIDADO! Revisar antes)
semodule -i mypolicy.pp

# 6. Volver a enforcing
setenforce 1
```

**Herramienta interactiva:**
```bash
# sealert lee audit.log y da sugerencias
sealert -a /var/log/audit/audit.log
```

---

## 3. AppArmor

### 3.1 Diferencias con SELinux

| Característica | SELinux | AppArmor |
|----------------|---------|----------|
| **Enfoque** | Etiquetas en inodos (xattr) | Rutas de archivos |
| **Complejidad** | Alta - requiere expertise | Moderada - más accesible |
| **Granularidad** | Muy alta (tipos, roles, MLS) | Moderada (perfiles por aplicación) |
| **Distribuciones** | RHEL, Fedora, CentOS | Ubuntu, Debian, SUSE |
| **Modo de aprendizaje** | Permissive | Complain mode |
| **Administración** | semanage, ausearch, audit2allow | aa-enforce, aa-complain, aa-logprof |

### 3.2 Arquitectura de AppArmor

```
┌─────────────────────────────────────────────────────┐
│             AppArmor Architecture                   │
├─────────────────────────────────────────────────────┤
│  User Space:                                        │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  Profile Files   │  │  AppArmor Utils  │        │
│  │ /etc/apparmor.d/ │  │  aa-enforce, etc.│        │
│  └────────┬─────────┘  └────────┬─────────┘        │
│           │                     │                   │
│  ┌────────▼─────────────────────▼─────────┐        │
│  │         apparmor_parser               │        │
│  │  (compila perfiles a formato kernel)   │        │
│  └──────────────┬──────────────────────────┘        │
├─────────────────┼──────────────────────────────────┤
│  Kernel Space:  │                                  │
│  ┌──────────────▼───────────────┐                  │
│  │   AppArmor LSM Module        │                  │
│  │   - Path-based matching      │                  │
│  │   - Capability control       │                  │
│  └──────────────────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### 3.3 Perfiles de AppArmor

**Estructura de un perfil:**

```
# /etc/apparmor.d/usr.bin.firefox
#include <tunables/global>

/usr/bin/firefox {
  #include <abstractions/base>
  #include <abstractions/audio>
  #include <abstractions/dbus-session-strict>

  # Capabilities
  capability sys_ptrace,
  capability setgid,

  # Network
  network inet stream,
  network inet6 stream,

  # Archivos
  /usr/bin/firefox mr,
  /usr/lib/firefox/** mr,

  # Home directory (lectura/escritura)
  owner @{HOME}/.mozilla/** rw,
  owner @{HOME}/Downloads/** rw,

  # Denegar acceso a directorios sensibles
  deny /etc/shadow r,
  deny @{HOME}/.ssh/** rw,
  deny /proc/sys/kernel/** w,

  # Transiciones a otros perfiles
  /usr/lib/firefox/firefox Cx -> firefox_sandbox,

  profile firefox_sandbox {
    #include <abstractions/base>

    /usr/lib/firefox/** mr,
    owner @{HOME}/.mozilla/firefox/**/Cache/** rw,

    deny /home/** rw,
  }
}
```

**Permisos de archivos:**
- `r` - read
- `w` - write
- `m` - memory map (ejecutable)
- `x` - execute
- `k` - lock
- `l` - link
- `a` - append

**Modificadores de ejecución:**
- `ix` - inherit (heredar perfil del padre)
- `Px` - profile execute (transición discreta a nuevo perfil)
- `Cx` - child profile (transición a sub-perfil)
- `Ux` - unconfined execute (ejecutar sin restricciones - ¡PELIGROSO!)

### 3.4 Comandos de AppArmor

```bash
# Estado de AppArmor
aa-status

# Poner perfil en modo enforce
aa-enforce /etc/apparmor.d/usr.bin.firefox

# Poner perfil en modo complain (learning)
aa-complain /etc/apparmor.d/usr.bin.firefox

# Deshabilitar perfil
aa-disable /etc/apparmor.d/usr.bin.firefox

# Generar/actualizar perfil basándose en logs
aa-logprof

# Generar perfil automáticamente
aa-genprof /usr/bin/miapp

# Ver denials en syslog
journalctl -xe | grep apparmor
# o
dmesg | grep DENIED
```

### 3.5 Creación de Perfil Custom

**Flujo de trabajo:**

```bash
# 1. Generar perfil base
sudo aa-genprof /opt/myapp/bin/server

# 2. En otra terminal, ejecutar la aplicación
/opt/myapp/bin/server

# 3. Usar todas las funcionalidades

# 4. En la primera terminal, presionar 's' para escanear logs

# 5. Revisar sugerencias y aceptar/denegar accesos

# 6. Guardar perfil

# 7. Poner en modo enforce
sudo aa-enforce /opt/myapp/bin/server
```

---

## 4. Linux Capabilities

### 4.1 Problema con Root Tradicional

Tradicionalmente, Linux tiene dos categorías de procesos:
- **Privilegiado (UID 0 = root)**: Puede hacer TODO
- **No privilegiado (UID > 0)**: Limitado por DAC

**Problema:** Muchas aplicaciones necesitan solo UN privilegio específico, pero requieren ejecutarse como root, obteniendo TODOS los privilegios.

### 4.2 ¿Qué son las Capabilities?

Las **Linux Capabilities** dividen los privilegios de root en unidades atómicas que pueden otorgarse independientemente.

**Ejemplo:**
- Antes: `ping` necesitaba SUID root para abrir raw sockets
- Ahora: `ping` solo necesita `CAP_NET_RAW`

### 4.3 Capabilities Importantes

| Capability | Descripción | Uso Común |
|------------|-------------|-----------|
| `CAP_NET_BIND_SERVICE` | Bind a puertos < 1024 | Nginx, Apache sin root |
| `CAP_NET_RAW` | Usar raw/packet sockets | ping, traceroute |
| `CAP_NET_ADMIN` | Configuración de red | ip, iptables |
| `CAP_SYS_ADMIN` | Múltiples operaciones de sistema | mount, swapon, bpf |
| `CAP_SYS_PTRACE` | Trace procesos arbitrarios | strace, gdb |
| `CAP_DAC_OVERRIDE` | Bypass permisos de archivo (lectura/escritura) | Backups |
| `CAP_DAC_READ_SEARCH` | Bypass permisos de lectura | find, locate |
| `CAP_SETUID` | Cambiar UID del proceso | su, sudo |
| `CAP_SETGID` | Cambiar GID del proceso | su, sudo |
| `CAP_KILL` | Enviar señales a procesos arbitrarios | kill, systemd |
| `CAP_CHOWN` | Cambiar ownership de archivos | chown |
| `CAP_SYS_TIME` | Modificar reloj del sistema | ntpd, chronyd |
| `CAP_SYS_MODULE` | Cargar/descargar módulos del kernel | modprobe, insmod |
| `CAP_SYS_BOOT` | Reiniciar sistema | reboot, shutdown |

**Lista completa:** `man 7 capabilities` (actualmente ~40 capabilities)

### 4.4 Tipos de Capabilities

Cada proceso tiene 5 sets de capabilities:

```
Permitted (P):    Máximo de capabilities que el proceso puede usar
Inheritable (I):  Capabilities que pueden heredarse tras exec()
Effective (E):    Capabilities actualmente en uso
Bounding (B):     Límite de capabilities que pueden ser adquiridas
Ambient (A):      Capabilities preservadas tras exec() (kernel >= 4.3)
```

### 4.5 Comandos de Capabilities

```bash
# Ver capabilities de un archivo
getcap /usr/bin/ping
# /usr/bin/ping cap_net_raw=ep

# Asignar capability a un archivo
setcap cap_net_bind_service=+ep /usr/bin/myserver

# Ver capabilities de un proceso en ejecución
grep Cap /proc/$PID/status
# Decodificar con:
capsh --decode=00000000a80425fb

# Ver capabilities del proceso actual
capsh --print

# Ejecutar comando eliminando capabilities
capsh --drop=cap_setuid,cap_setgid -- -c "/bin/bash"

# Ejecutar con SOLO ciertas capabilities
capsh --keep=1 --caps="cap_net_raw+eip" -- -c "ping 8.8.8.8"
```

### 4.6 Uso Práctico: Nginx sin Root

```bash
# 1. Asignar CAP_NET_BIND_SERVICE a nginx
setcap cap_net_bind_service=+ep /usr/sbin/nginx

# 2. Crear usuario sin privilegios
useradd -r -s /bin/false nginx

# 3. Configurar nginx para ejecutarse como nginx user
# En nginx.conf:
user nginx;

# 4. Iniciar nginx (ahora puede bind puerto 80 sin ser root)
/usr/sbin/nginx

# 5. Verificar
ps aux | grep nginx
# nginx    1234  ... /usr/sbin/nginx: master process

grep Cap /proc/1234/status
# CapEff: 0000000000000400  (CAP_NET_BIND_SERVICE)
```

### 4.7 Security Best Practices

**DO:**
- ✅ Usar capabilities en lugar de SUID root cuando sea posible
- ✅ Principle of least privilege: otorgar solo las capabilities necesarias
- ✅ Usar `--cap-drop` y `--cap-add` en Docker containers
- ✅ Auditar regularmente archivos con capabilities: `getcap -r / 2>/dev/null`

**DON'T:**
- ❌ Dar `CAP_SYS_ADMIN` (equivale casi a root completo)
- ❌ Combinar múltiples capabilities peligrosas
- ❌ Capabilities en archivos world-writable

---

## 5. Kernel Security Parameters (sysctl)

### 5.1 ¿Qué es sysctl?

`sysctl` permite modificar parámetros del kernel en tiempo de ejecución sin recompilar.

**Configuración:**
- Temporal: `sysctl -w kernel.parameter=value`
- Permanente: Editar `/etc/sysctl.conf` o `/etc/sysctl.d/*.conf`

### 5.2 Parámetros Críticos de Seguridad

#### 5.2.1 Protecciones de Red

```bash
# Deshabilitar IP forwarding (a menos que sea router/firewall)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Protección contra IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignorar ICMP redirects (previene MITM)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# No enviar ICMP redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Ignorar ICMP echo requests (stealth mode)
net.ipv4.icmp_echo_ignore_all = 1

# Protección contra SYN floods
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# Protección contra broadcast pings (Smurf attack)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignorar bogus ICMP error responses
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Source Address Verification
net.ipv4.conf.all.arp_filter = 1

# Log packets con IPs imposibles (Martian packets)
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
```

#### 5.2.2 Protecciones de Memoria

```bash
# Address Space Layout Randomization (ASLR)
# 0 = disabled, 1 = conservative, 2 = full (recomendado)
kernel.randomize_va_space = 2

# Restricción de acceso a dmesg
kernel.dmesg_restrict = 1

# Restricción de acceso a kernel pointers en /proc
kernel.kptr_restrict = 2

# Restringir perf_event_paranoid (previene leak de KASLR)
kernel.perf_event_paranoid = 3

# Restricción de ptrace (solo procesos hijos)
kernel.yama.ptrace_scope = 1
# 0 = classic ptrace
# 1 = restricted (solo procesos hijos o CAP_SYS_PTRACE)
# 2 = admin-only (solo CAP_SYS_PTRACE)
# 3 = no ptrace
```

#### 5.2.3 Filesystem Protections

```bash
# Protección de hardlinks (previene escalada de privilegios)
fs.protected_hardlinks = 1

# Protección de symlinks
fs.protected_symlinks = 1

# Protección de FIFOs
fs.protected_fifos = 2

# Protección de archivos regulares en sticky directories
fs.protected_regular = 2

# SUID core dumps deshabilitados (previene leak de memoria)
fs.suid_dumpable = 0
```

#### 5.2.4 User Namespace Restrictions

```bash
# Deshabilitar user namespaces (si no se usan containers)
user.max_user_namespaces = 0

# O limitar el número
kernel.unprivileged_userns_clone = 0  # Debian/Ubuntu
```

### 5.3 Aplicar Configuración

**Temporal:**
```bash
sysctl -w net.ipv4.ip_forward=0
```

**Permanente:**
```bash
# Crear archivo de configuración
cat > /etc/sysctl.d/99-hardening.conf <<EOF
# Network hardening
net.ipv4.ip_forward = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.tcp_syncookies = 1
# (resto de parámetros...)
EOF

# Aplicar cambios
sysctl -p /etc/sysctl.d/99-hardening.conf

# Verificar
sysctl net.ipv4.ip_forward
```

---

## 6. Kernel Exploit Mitigations

### 6.1 ASLR (Address Space Layout Randomization)

Randomiza ubicaciones en memoria de:
- Stack
- Heap
- Shared libraries
- Executable base (PIE - Position Independent Executable)

**Verificar:**
```bash
cat /proc/sys/kernel/randomize_va_space
# 2 = full ASLR

# Ver mapa de memoria de un proceso
cat /proc/$PID/maps
```

### 6.2 DEP/NX (Data Execution Prevention / No-Execute)

Hardware-enforced: marca páginas de memoria como non-executable.

**Verificar soporte:**
```bash
grep nx /proc/cpuinfo
# flags: ... nx ...

# Verificar binario
readelf -l /bin/bash | grep GNU_STACK
# GNU_STACK ... RW  (Read-Write, NO execute)
```

### 6.3 Stack Canaries

Valores aleatorios colocados antes del return address en el stack para detectar buffer overflows.

**Compilar con stack protection:**
```bash
gcc -fstack-protector-strong program.c -o program
```

### 6.4 SMEP/SMAP (Supervisor Mode Execution/Access Prevention)

**SMEP:** Kernel no puede ejecutar código en páginas de user space
**SMAP:** Kernel no puede acceder memoria de user space (salvo con instrucciones especiales)

**Verificar:**
```bash
grep -E 'smep|smap' /proc/cpuinfo
# flags: ... smep smap ...

dmesg | grep -E 'SMEP|SMAP'
```

### 6.5 KASLR (Kernel Address Space Layout Randomization)

Randomiza ubicación del kernel en memoria (dificulta exploits).

**Verificar:**
```bash
# En boot, debe tener:
cat /proc/cmdline | grep kaslr
# ... kaslr

# O revisar
dmesg | grep KASLR
```

### 6.6 Kernel Lockdown

Previene acceso a memoria del kernel incluso con root (protege contra rootkits).

**Modes:**
- `none`: Sin lockdown
- `integrity`: Bloquea modificaciones al kernel
- `confidentiality`: Bloquea lectura de memoria del kernel

```bash
# Ver estado
cat /sys/kernel/security/lockdown
# [none] integrity confidentiality

# Habilitar en boot (GRUB)
# lockdown=confidentiality
```

---

## 7. Auditoría y Verificación

### 7.1 Verificar Configuración Actual

```bash
# SELinux
getenforce
sestatus

# AppArmor
aa-status

# Capabilities en archivos
getcap -r / 2>/dev/null | grep -v "=" | head -20

# sysctl hardening
sysctl -a | grep -E '(ip_forward|rp_filter|randomize_va_space)'

# Kernel mitigations
dmesg | grep -E '(ASLR|SMEP|SMAP|KASLR)'
cat /proc/cpuinfo | grep flags | head -1
```

### 7.2 Herramientas de Auditoría

**Lynis:**
```bash
# Instalar
apt install lynis  # Debian/Ubuntu
yum install lynis  # RHEL/CentOS

# Ejecutar auditoría
lynis audit system

# Ver recomendaciones
grep Suggestion /var/log/lynis.log
```

**Linux Kernel Hardening Checker:**
```bash
git clone https://github.com/a13xp0p0v/kernel-hardening-checker
cd kernel-hardening-checker
python3 -m pip install .

# Verificar configuración del kernel
kconfig-hardened-check -c /boot/config-$(uname -r)
```

---

## 8. Best Practices Resumen

### 8.1 Checklist de Hardening

- [ ] SELinux o AppArmor en modo Enforcing
- [ ] Capabilities en lugar de SUID root cuando sea posible
- [ ] sysctl hardening aplicado y persistente
- [ ] ASLR habilitado (randomize_va_space=2)
- [ ] SMEP/SMAP habilitados en hardware
- [ ] Kernel actualizado con últimos security patches
- [ ] Auditoría regular con Lynis o similar
- [ ] Monitoreo de logs (/var/log/audit/audit.log, journalctl)
- [ ] User namespaces restringidos si no se usan containers
- [ ] Kernel modules firmados y whitelist

### 8.2 Defensa en Profundidad

```
┌─────────────────────────────────────────┐
│  1. MAC (SELinux/AppArmor)              │
│     └─ Políticas obligatorias           │
├─────────────────────────────────────────┤
│  2. Capabilities                        │
│     └─ Granularidad de privilegios      │
├─────────────────────────────────────────┤
│  3. DAC (permisos tradicionales)        │
│     └─ chmod, chown, ACLs               │
├─────────────────────────────────────────┤
│  4. sysctl hardening                    │
│     └─ Mitigaciones a nivel kernel      │
├─────────────────────────────────────────┤
│  5. Exploit mitigations (ASLR, DEP)     │
│     └─ Protecciones de memoria          │
├─────────────────────────────────────────┤
│  6. Auditoría y Monitoreo               │
│     └─ Detección de anomalías           │
└─────────────────────────────────────────┘
```

---

## 9. Casos de Uso Reales

### 9.1 Servidor Web (Nginx + PHP-FPM)

**SELinux:**
```bash
# Permitir nginx conectarse a PHP-FPM
setsebool -P httpd_can_network_connect on

# Context para directorio web personalizado
semanage fcontext -a -t httpd_sys_content_t "/srv/www(/.*)?"
restorecon -Rv /srv/www/
```

**Capabilities:**
```bash
# Nginx sin root
setcap cap_net_bind_service=+ep /usr/sbin/nginx
```

### 9.2 Base de Datos PostgreSQL

**SELinux:**
```bash
# Context para data directory custom
semanage fcontext -a -t postgresql_db_t "/data/pgsql(/.*)?"
restorecon -Rv /data/pgsql/
```

**AppArmor:**
```bash
# Perfil custom para PostgreSQL
aa-complain /etc/apparmor.d/usr.bin.postgres
# ... realizar operaciones normales ...
aa-logprof  # Generar reglas
aa-enforce /etc/apparmor.d/usr.bin.postgres
```

### 9.3 Container con Capabilities Restringidas

```bash
# Docker con solo CAP_NET_BIND_SERVICE
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE \
  -p 80:80 nginx:latest
```

---

## 10. Recursos Adicionales

### Documentación Oficial
- **SELinux:** https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/using_selinux/
- **AppArmor:** https://gitlab.com/apparmor/apparmor/-/wikis/Documentation
- **Capabilities:** `man 7 capabilities`
- **sysctl:** https://www.kernel.org/doc/Documentation/sysctl/

### Herramientas
- **SELinux:** setroubleshoot, setools-console
- **AppArmor:** apparmor-utils, apparmor-profiles-extra
- **Auditoría:** Lynis, OpenSCAP, Nessus
- **Hardening:** AIDE, Tripwire, rkhunter

### Cursos y Certificaciones
- RHCE (Red Hat Certified Engineer) - SELinux proficiency
- LPIC-3 304: Virtualization & High Availability (incluye MAC)
- CIS Benchmarks - Linux hardening guides

---

## Conclusión

El **kernel hardening** es fundamental para la seguridad de sistemas Linux modernos. La combinación de:
- **MAC** (SELinux/AppArmor)
- **Capabilities**
- **sysctl hardening**
- **Exploit mitigations** (ASLR, SMEP, SMAP)

...proporciona defensa en profundidad contra una amplia gama de ataques, desde escalada de privilegios hasta exploits de memoria.

**Principio clave:** *Nunca confíes en una sola capa de seguridad.*

🔒 **"Security is not a product, but a process"** - Bruce Schneier
