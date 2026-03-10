# Laboratorio 01.1: Configuración de Entorno Seguro

**Módulo**: 01 - Fundamentos de Ciberseguridad
**Duración**: 1 hora
**Dificultad**: ⭐ Principiante
**Prerequisitos**: Máquina virtual con Kali Linux instalada

---

## 📋 Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

- [x] Instalar y configurar una máquina virtual con Kali Linux
- [x] Configurar un firewall básico con `ufw`/`iptables`
- [x] Aplicar hardening básico del sistema operativo
- [x] Verificar la configuración de seguridad
- [x] Documentar cambios de configuración

---

## 🛠️ Requisitos

### Software Necesario
- **VirtualBox** 7.0+ o VMware Workstation
- **Kali Linux** 2024.1+ (imagen .ova)
- **Espacio en disco**: 30 GB libres
- **RAM**: Mínimo 2 GB asignados a la VM

### Conocimientos Previos
- Uso básico de terminal Linux
- Conceptos básicos de redes (IP, puertos)

---

## 📖 Contexto

La configuración segura del entorno es el primer paso en cualquier operación de ciberseguridad. Un sistema mal configurado puede exponerte a ataques incluso antes de empezar a trabajar. En este laboratorio:

1. **Configurarás un firewall** para controlar tráfico entrante/saliente
2. **Aplicarás hardening** para reducir superficie de ataque
3. **Verificarás la seguridad** con herramientas de auditoría

---

## 🚀 Parte 1: Importación y Configuración Inicial de Kali Linux

### Paso 1.1: Descargar Kali Linux

Si aún no lo has hecho:

```bash
# Descargar desde:
# https://www.kali.org/get-kali/#kali-virtual-machines

# Archivo: kali-linux-2024.1-virtualbox-amd64.ova (aprox. 4 GB)
```

### Paso 1.2: Importar en VirtualBox

1. Abrir VirtualBox
2. **Archivo** → **Importar Servicio Virtualizado** (Ctrl+I)
3. Seleccionar el archivo `.ova` descargado
4. **Configuración recomendada**:
   ```
   Nombre: Kali-Lab-2026
   RAM: 4096 MB (mínimo 2048 MB)
   CPUs: 2 núcleos
   Video Memory: 128 MB
   Red: NAT (por seguridad)
   ```
5. Click en **Importar**
6. Esperar 5-10 minutos

### Paso 1.3: Primer Arranque

1. Iniciar la VM
2. **Credenciales por defecto**:
   ```
   Usuario: kali
   Password: kali
   ```

### Paso 1.4: Actualizar Sistema

**MUY IMPORTANTE**: Antes de cualquier cosa, actualizar el sistema.

```bash
# Abrir terminal (Ctrl+Alt+T)

# Actualizar repositorios
sudo apt update

# Upgrade de paquetes (puede tardar 15-30 min)
sudo apt full-upgrade -y

# Limpiar paquetes innecesarios
sudo apt autoremove -y
sudo apt autoclean

# Verificar versión
cat /etc/os-release
# Debería mostrar: Kali GNU/Linux Rolling 2024.x
```

### Paso 1.5: Cambiar Password por Defecto

**CRÍTICO**: El password `kali` es conocido públicamente.

```bash
# Cambiar password
passwd

# Ingresar:
# - Password actual: kali
# - Nuevo password: [elige uno fuerte: 12+ chars, mayúsculas, números, símbolos]
# - Confirmar

# Ejemplo de password fuerte: K@l1Lab2026!Secure
```

**⚠️ ADVERTENCIA**: Anota tu password en lugar seguro. Si lo olvidas, tendrás que reinstalar la VM.

---

## 🔥 Parte 2: Configuración de Firewall

### Contexto: ¿Qué es un Firewall?

Un firewall controla el tráfico de red basado en reglas predefinidas:
- **Tráfico entrante (Inbound)**: Conexiones que llegan a tu sistema
- **Tráfico saliente (Outbound)**: Conexiones que tu sistema inicia

### Paso 2.1: Verificar Estado del Firewall

Kali viene con `ufw` (Uncomplicated Firewall) instalado pero deshabilitado.

```bash
# Verificar si ufw está instalado
which ufw
# Salida: /usr/sbin/ufw

# Ver estado
sudo ufw status
# Salida: Status: inactive
```

### Paso 2.2: Configurar Reglas Base

Vamos a implementar una política de **"Default Deny"** (denegar por defecto, permitir explícitamente).

```bash
# 1. Denegar todo el tráfico entrante por defecto
sudo ufw default deny incoming

# 2. Permitir todo el tráfico saliente por defecto
sudo ufw default allow outgoing

# 3. Permitir SSH (puerto 22) para administración remota
sudo ufw allow 22/tcp

# 4. Permitir HTTP y HTTPS (si vas a correr servidor web)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 5. Habilitar el firewall
sudo ufw enable
# Confirmar: y [Enter]

# 6. Verificar reglas
sudo ufw status verbose
```

**Salida esperada**:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

### Paso 2.3: Reglas Avanzadas (Opcional)

```bash
# Permitir SSH solo desde una IP específica
sudo ufw delete allow 22/tcp  # Eliminar regla anterior
sudo ufw allow from 192.168.1.100 to any port 22 proto tcp

# Rate limiting en SSH (prevenir fuerza bruta)
sudo ufw limit 22/tcp
# Permite máximo 6 conexiones en 30 segundos por IP

# Permitir ping (ICMP)
sudo ufw allow from any to any proto icmp

# Ver reglas numeradas (para eliminar específicas)
sudo ufw status numbered
```

### Paso 2.4: Logging del Firewall

```bash
# Habilitar logging
sudo ufw logging on

# Niveles:
# - off: sin logs
# - low: solo conexiones bloqueadas
# - medium: + límites de rate
# - high: + conexiones permitidas (verbose)
# - full: todos los paquetes

# Configurar nivel medio
sudo ufw logging medium

# Ver logs
sudo tail -f /var/log/ufw.log
# Ctrl+C para salir
```

### 📝 Checkpoint 1: Documentar Configuración

Crear archivo de documentación:

```bash
nano ~/lab01_firewall_config.txt
```

Contenido:
```
=== CONFIGURACIÓN FIREWALL - LAB 01 ===
Fecha: 2026-02-10
Sistema: Kali Linux 2024.1

POLÍTICAS POR DEFECTO:
- Incoming: DENY
- Outgoing: ALLOW

REGLAS ACTIVAS:
1. SSH (22/tcp): ALLOW con rate limiting
2. HTTP (80/tcp): ALLOW
3. HTTPS (443/tcp): ALLOW

LOGGING: Medium

VERIFICACIÓN:
$ sudo ufw status verbose
[pegar salida aquí]
```

**Guardar**: Ctrl+X → Y → Enter

---

## 🔒 Parte 3: Hardening del Sistema

### Contexto: ¿Qué es System Hardening?

Hardening es el proceso de reducir la superficie de ataque eliminando servicios innecesarios, aplicando configuraciones seguras y limitando permisos.

### Paso 3.1: Auditoría de Servicios Activos

```bash
# Ver servicios en ejecución
sudo systemctl list-units --type=service --state=running

# Ver puertos abiertos
sudo ss -tulpn

# O con netstat
sudo netstat -tulpn
```

**Analizar**: ¿Hay servicios innecesarios corriendo?

### Paso 3.2: Deshabilitar Servicios Innecesarios

**Ejemplo**: Si no necesitas Bluetooth:

```bash
# Ver estado
sudo systemctl status bluetooth

# Deshabilitar (no arrancará en boot)
sudo systemctl disable bluetooth

# Detener inmediatamente
sudo systemctl stop bluetooth

# Verificar
sudo systemctl status bluetooth
# Debería mostrar: "inactive (dead)" y "disabled"
```

**Otros servicios comunes a considerar**:
```bash
# Avahi (descubrimiento de red, tipo Bonjour)
sudo systemctl disable avahi-daemon
sudo systemctl stop avahi-daemon

# Cups (servidor de impresión)
sudo systemctl disable cups
sudo systemctl stop cups
```

**⚠️ ADVERTENCIA**: Solo deshabilita servicios que estés SEGURO que no necesitas.

### Paso 3.3: Configurar Actualizaciones Automáticas

```bash
# Instalar unattended-upgrades
sudo apt install unattended-upgrades -y

# Habilitar
sudo dpkg-reconfigure -plow unattended-upgrades
# Seleccionar: Yes

# Verificar configuración
cat /etc/apt/apt.conf.d/50unattended-upgrades
```

### Paso 3.4: Configurar Permisos de Archivos Críticos

```bash
# /etc/passwd: lista de usuarios (debe ser legible por todos)
sudo chmod 644 /etc/passwd
sudo chown root:root /etc/passwd

# /etc/shadow: hashes de passwords (solo root)
sudo chmod 600 /etc/shadow
sudo chown root:root /etc/shadow

# Verificar permisos
ls -l /etc/passwd /etc/shadow
# Salida esperada:
# -rw-r--r-- 1 root root  xxx /etc/passwd
# -rw------- 1 root root  xxx /etc/shadow
```

### Paso 3.5: Configurar SYSCTL para Seguridad de Red

```bash
# Editar configuración
sudo nano /etc/sysctl.conf

# Agregar al final:
```

```bash
# === HARDENING DE RED ===

# Ignorar pings (prevenir reconocimiento)
net.ipv4.icmp_echo_ignore_all = 1

# Proteger contra SYN flood attacks
net.ipv4.tcp_syncookies = 1

# Desactivar IP forwarding (no somos router)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Desactivar source routing (prevenir spoofing)
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Proteger contra ataques de redirección ICMP
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Habilitar reverse path filtering (anti-spoofing)
net.ipv4.conf.all.rp_filter = 1

# Loguear paquetes sospechosos
net.ipv4.conf.all.log_martians = 1
```

**Guardar**: Ctrl+X → Y → Enter

```bash
# Aplicar configuración
sudo sysctl -p

# Verificar
sudo sysctl net.ipv4.icmp_echo_ignore_all
# Salida: net.ipv4.icmp_echo_ignore_all = 1
```

### Paso 3.6: Configurar Límites de Recursos (ulimit)

Prevenir ataques de fork bomb y agotamiento de recursos.

```bash
# Editar
sudo nano /etc/security/limits.conf

# Agregar al final:
```

```
# === LÍMITES DE RECURSOS ===

# Máximo de procesos por usuario
* soft nproc 1000
* hard nproc 1500

# Máximo de archivos abiertos
* soft nofile 4096
* hard nofile 8192

# Máximo de tamaño de core dumps (0 = deshabilitar)
* hard core 0
```

**Guardar** y **reiniciar sesión** para aplicar.

### Paso 3.7: Instalar y Configurar Fail2Ban

Fail2Ban protege contra ataques de fuerza bruta baneando IPs con múltiples intentos fallidos.

```bash
# Instalar
sudo apt install fail2ban -y

# Crear configuración personalizada
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar
sudo nano /etc/fail2ban/jail.local
```

**Buscar y modificar** (Ctrl+W para buscar):

```ini
[DEFAULT]
bantime = 1h       # Tiempo de baneo
findtime = 10m     # Ventana de tiempo para contar intentos
maxretry = 3       # Intentos máximos antes de ban

[sshd]
enabled = true     # Habilitar protección SSH
port = 22
logpath = /var/log/auth.log
```

**Guardar** y **reiniciar Fail2Ban**:

```bash
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Verificar estado
sudo fail2ban-client status

# Ver estadísticas de SSH
sudo fail2ban-client status sshd
```

---

## ✅ Parte 4: Verificación de Seguridad

### Paso 4.1: Escaneo de Puertos Local

```bash
# Con nmap (escaneo a nosotros mismos)
sudo nmap -sT -O localhost

# Debería mostrar solo puertos que explícitamente abrimos (22, 80, 443)
```

### Paso 4.2: Auditoría con Lynis

Lynis es una herramienta de auditoría de seguridad para sistemas Unix.

```bash
# Instalar
sudo apt install lynis -y

# Ejecutar auditoría completa
sudo lynis audit system

# Generar reporte
# El reporte se guarda en: /var/log/lynis-report.dat
```

**Analizar resultados**:
- **Hardening index**: Porcentaje de seguridad (objetivo: >70%)
- **Warnings**: Elementos a mejorar
- **Suggestions**: Mejoras opcionales

```bash
# Ver solo warnings
sudo grep Warning /var/log/lynis-report.dat

# Ver sugerencias
sudo grep Suggestion /var/log/lynis-report.dat
```

### Paso 4.3: Verificar Usuarios y Permisos

```bash
# Listar todos los usuarios
cat /etc/passwd | grep -v nologin | grep -v false

# Verificar usuarios con UID 0 (privilegios root)
awk -F: '($3 == 0) {print}' /etc/passwd
# Debería mostrar SOLO "root"

# Ver usuarios con capacidad de login
grep -v nologin /etc/passwd | grep -v false

# Verificar archivos con SUID bit (potencialmente peligrosos)
sudo find / -perm -4000 -type f 2>/dev/null

# Verificar archivos con SGID bit
sudo find / -perm -2000 -type f 2>/dev/null
```

### Paso 4.4: Verificar Logs de Seguridad

```bash
# Últimos inicios de sesión
last

# Intentos fallidos de login
sudo lastb

# Logs de autenticación
sudo tail -50 /var/log/auth.log

# Logs del firewall
sudo tail -50 /var/log/ufw.log
```

---

## 📊 Parte 5: Documentación y Reporte

### Paso 5.1: Crear Reporte de Laboratorio

Crear archivo:

```bash
nano ~/Lab01_Reporte_Final.md
```

**Plantilla**:

```markdown
# Reporte de Laboratorio 01: Configuración de Entorno Seguro

**Nombre**: [Tu Nombre]
**Fecha**: 2026-02-10
**Duración**: [Tiempo que te tomó]

## 1. Resumen Ejecutivo

[Párrafo breve: ¿Qué hiciste? ¿Cuál fue el resultado?]

## 2. Configuración de Firewall

### Políticas Implementadas
- Incoming: DENY
- Outgoing: ALLOW

### Reglas Activas
```
[Pegar salida de: sudo ufw status verbose]
```

## 3. Hardening Aplicado

### Servicios Deshabilitados
- [ ] Bluetooth
- [ ] Avahi
- [ ] CUPS
- [ ] Otros: _______________

### Configuraciones de Seguridad
- [x] SYSCTL hardening aplicado
- [x] Límites de recursos configurados
- [x] Fail2Ban instalado y activo
- [x] Actualizaciones automáticas habilitadas

## 4. Auditoría de Seguridad (Lynis)

### Hardening Index
- **Score**: [XX]%

### Warnings Críticos
1. [Warning 1]
2. [Warning 2]

### Plan de Remediación
- [Acción 1 para resolver warning]
- [Acción 2]

## 5. Verificación de Puertos

### Puertos Abiertos (nmap)
```
[Pegar salida de: sudo nmap -sT localhost]
```

### Análisis
[¿Son todos esperados? ¿Hay alguno inesperado?]

## 6. Lecciones Aprendidas

### Desafíos Encontrados
1. [Desafío 1]
2. [Desafío 2]

### Soluciones Aplicadas
1. [Solución 1]
2. [Solución 2]

## 7. Próximos Pasos

- [ ] Investigar warnings de Lynis
- [ ] Configurar AIDE (detección de intrusiones)
- [ ] Configurar ClamAV (antivirus)

## 8. Capturas de Pantalla

[Agregar screenshots de configuraciones clave]

---

**Firma**: _______________
```

### Paso 5.2: Tomar Capturas de Pantalla

Capturar:
1. Salida de `sudo ufw status verbose`
2. Salida de `sudo fail2ban-client status`
3. Hardening index de Lynis
4. Escaneo de nmap

**En Kali Linux**, usar:
- Aplicación "Screenshot" (buscar en menú)
- O comando: `gnome-screenshot -w` (captura ventana actual)

---

## 🎯 Entregables del Laboratorio

Al completar este laboratorio, debes tener:

1. **VM de Kali Linux** completamente configurada y hardened
2. **Archivo de configuración**: `lab01_firewall_config.txt`
3. **Reporte completo**: `Lab01_Reporte_Final.md`
4. **Capturas de pantalla** (mínimo 4)
5. **Reporte de Lynis**: `/var/log/lynis-report.dat`

---

## ✅ Criterios de Éxito

Verifica que has completado exitosamente:

- [ ] Password por defecto cambiado
- [ ] Firewall activo con política "default deny"
- [ ] Al menos 3 servicios innecesarios deshabilitados
- [ ] SYSCTL hardening configurado y aplicado
- [ ] Fail2Ban instalado y protegiendo SSH
- [ ] Auditoría Lynis ejecutada con score >60%
- [ ] Escaneo de puertos muestra solo servicios esperados
- [ ] Reporte de laboratorio completo con análisis
- [ ] Capturas de pantalla tomadas

---

## 🚨 Troubleshooting

### Problema 1: UFW no habilita

**Error**: `ERROR: problem running ufw-init`

**Solución**:
```bash
# Verificar si módulos de kernel están cargados
sudo modprobe ip_tables
sudo modprobe iptable_filter

# Intentar nuevamente
sudo ufw enable
```

### Problema 2: Lynis no encuentra problemas

**Solución**:
```bash
# Actualizar base de datos de Lynis
sudo lynis update info

# Ejecutar con debug
sudo lynis audit system --debug
```

### Problema 3: Fail2Ban no arranca

**Solución**:
```bash
# Ver logs de error
sudo journalctl -u fail2ban -n 50

# Verificar sintaxis de configuración
sudo fail2ban-client -t

# Reiniciar
sudo systemctl restart fail2ban
```

### Problema 4: No puedo hacer ping a Internet después de hardening

**Causa**: ICMP está bloqueado por SYSCTL.

**Solución** (si necesitas ping):
```bash
# Editar sysctl
sudo nano /etc/sysctl.conf

# Cambiar:
# net.ipv4.icmp_echo_ignore_all = 1
# A:
net.ipv4.icmp_echo_ignore_all = 0

# Aplicar
sudo sysctl -p
```

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [UFW Manual](https://help.ubuntu.com/community/UFW)
- [Fail2Ban Wiki](https://github.com/fail2ban/fail2ban/wiki)
- [Lynis Documentation](https://cisofy.com/documentation/lynis/)
- [Kali Linux Docs](https://www.kali.org/docs/)

### Artículos Recomendados
- "20 Linux Server Hardening Security Tips" - TecMint
- "CIS Debian Linux Benchmark" - Center for Internet Security
- "NSA Guide to Secure Configuration of RHEL" (aplicable a Debian)

### Tools Relacionados
- **AIDE**: Advanced Intrusion Detection Environment
- **rkhunter**: Rootkit Hunter
- **chkrootkit**: Check Rootkit

---

## 🎓 Preguntas de Reflexión

Después de completar el lab, responde:

1. **¿Por qué es importante la política "default deny" en firewalls?**

2. **¿Qué riesgos mitiga Fail2Ban específicamente?**

3. **¿Qué servicio deshabilitado podría causar problemas si decides compartir tu impresora en red?**

4. **¿Por qué deshabilitamos el bit SUID en archivos innecesarios?**

5. **Si tu Lynis score es 55%, ¿es eso aceptable? ¿Qué harías para mejorarlo?**

---

## 🔄 Próximo Laboratorio

Has configurado un entorno seguro. Ahora estás listo para:

➡️ **Lab 01.2: Análisis de Vulnerabilidades con Nmap**

Usarás tu entorno hardened para escanear redes y detectar vulnerabilidades.

---

**¡Felicitaciones por completar el Lab 01.1!** 🎉

Has dado el primer paso para convertirte en un profesional de ciberseguridad.
