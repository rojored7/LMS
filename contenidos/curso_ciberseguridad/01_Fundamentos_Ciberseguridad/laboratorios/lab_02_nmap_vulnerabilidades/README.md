# LAB 01.2: ANÁLISIS DE VULNERABILIDADES CON NMAP

**Duración**: 1 hora
**Dificultad**: Principiante
**Prerequisitos**: Lab 01.1 completado, Kali Linux configurado

---

## 🎯 Objetivos de Aprendizaje

Al finalizar este laboratorio, serás capaz de:

- [ ] Realizar escaneos de puertos con Nmap
- [ ] Identificar servicios y versiones corriendo en sistemas
- [ ] Detectar vulnerabilidades potenciales
- [ ] Generar reportes profesionales de hallazgos
- [ ] Interpretar resultados de escaneos
- [ ] Aplicar buenas prácticas de reconocimiento ético

---

## 📋 Contenido

1. [Preparación del Entorno](#preparación-del-entorno)
2. [Fundamentos de Nmap](#fundamentos-de-nmap)
3. [Ejercicios Prácticos](#ejercicios-prácticos)
4. [Análisis de Resultados](#análisis-de-resultados)
5. [Generación de Reportes](#generación-de-reportes)

---

## Preparación del Entorno

### Requisitos

- Kali Linux (VM o físico)
- Nmap instalado (pre-instalado en Kali)
- Laboratorio de pruebas (opciones):
  - **Opción A**: Metasploitable 2/3 (VM vulnerable)
  - **Opción B**: DVWA (Damn Vulnerable Web Application)
  - **Opción C**: TryHackMe / HackTheBox (cuenta gratuita)

### Configuración del Laboratorio

#### Opción A: Metasploitable 2 (Recomendado para principiantes)

**1. Descargar Metasploitable 2**:
```bash
# En tu host (no Kali)
cd ~/VMs
wget https://sourceforge.net/projects/metasploitable/files/Metasploitable2/metasploitable-linux-2.0.0.zip
unzip metasploitable-linux-2.0.0.zip
```

**2. Configurar en VirtualBox**:
- Nueva VM → Linux → Ubuntu (64-bit)
- Usar disco existente: `Metasploitable.vmdk`
- Red: "Red Interna" o "Host-Only" (NUNCA "Bridge" o "NAT")
- Iniciar VM

**3. Credenciales predeterminadas**:
```
Usuario: msfadmin
Password: msfadmin
```

**4. Obtener IP de Metasploitable**:
```bash
# En Metasploitable
ifconfig
# Anota la IP, ej: 192.168.56.101
```

### Verificación de Conectividad

Desde tu Kali Linux:
```bash
# Verificar que puedes alcanzar el objetivo
ping -c 3 <IP_METASPLOITABLE>

# Ejemplo:
ping -c 3 192.168.56.101
```

**⚠️ ADVERTENCIA ÉTICA**:
```
NUNCA escanees sistemas sin autorización explícita.
Hacerlo es ILEGAL y puede resultar en:
- Cargos criminales
- Multas significativas
- Prisión

Solo escanea:
- Tus propios sistemas
- Laboratorios diseñados para práctica
- Sistemas con permiso escrito
```

---

## Fundamentos de Nmap

### ¿Qué es Nmap?

**Nmap** (Network Mapper) es una herramienta de código abierto para:
- Descubrimiento de hosts
- Escaneo de puertos
- Detección de servicios y versiones
- Detección de sistema operativo
- Ejecución de scripts de vulnerabilidad (NSE)

### Sintaxis Básica

```bash
nmap [Scan Type] [Options] {target}
```

### Tipos de Escaneo

| Tipo | Flag | Descripción | Sigiloso | Velocidad |
|------|------|-------------|----------|-----------|
| **TCP Connect** | `-sT` | Conexión TCP completa | No | Medio |
| **SYN Stealth** | `-sS` | Solo SYN (requiere root) | Sí | Rápido |
| **UDP** | `-sU` | Puertos UDP | Sí | Lento |
| **Null Scan** | `-sN` | Sin flags TCP | Muy | Medio |
| **FIN Scan** | `-sF` | Solo flag FIN | Muy | Medio |
| **Xmas Scan** | `-sX` | Flags FIN,PSH,URG | Muy | Medio |

### Opciones Comunes

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| `-p` | Puertos específicos | `-p 22,80,443` |
| `-p-` | Todos los puertos (1-65535) | `-p-` |
| `-F` | Fast mode (100 puertos comunes) | `-F` |
| `-sV` | Detección de versiones | `-sV` |
| `-O` | Detección de OS | `-O` |
| `-A` | Detección agresiva (OS, versión, scripts) | `-A` |
| `-T<0-5>` | Timing (0=paranoid, 5=insane) | `-T4` |
| `-oN` | Output normal | `-oN scan.txt` |
| `-oX` | Output XML | `-oX scan.xml` |
| `--script` | Ejecutar scripts NSE | `--script vuln` |

---

## Ejercicios Prácticos

### Ejercicio 1: Descubrimiento de Hosts (10 min)

**Objetivo**: Identificar qué hosts están activos en la red.

#### 1.1 Ping Scan

```bash
# Escanear rango de red para encontrar hosts activos
sudo nmap -sn 192.168.56.0/24

# Explicación:
# -sn: Ping scan (no escanea puertos)
# /24: Máscara de red (192.168.56.1-254)
```

**Salida esperada**:
```
Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.56.1
Host is up (0.00023s latency).
Nmap scan report for 192.168.56.101
Host is up (0.00056s latency).
Nmap done: 256 IP addresses (2 hosts up) scanned in 2.89 seconds
```

#### 1.2 List Scan (sin enviar paquetes)

```bash
# Solo listar objetivos, sin escanear
nmap -sL 192.168.56.0/24
```

**📝 Tarea 1**: Identifica todos los hosts activos en tu red de laboratorio y documenta sus IPs.

---

### Ejercicio 2: Escaneo de Puertos (15 min)

**Objetivo**: Identificar puertos abiertos en el objetivo.

#### 2.1 Escaneo Rápido (Top 100 puertos)

```bash
# Escaneo rápido de puertos más comunes
sudo nmap -F <IP_TARGET>

# Ejemplo:
sudo nmap -F 192.168.56.101
```

#### 2.2 Escaneo de Puertos Específicos

```bash
# Escanear puertos web comunes
sudo nmap -p 80,443,8080,8443 <IP_TARGET>

# Escanear rango de puertos
sudo nmap -p 1-1000 <IP_TARGET>
```

#### 2.3 Escaneo Completo (Todos los puertos)

```bash
# Escanear TODOS los puertos (1-65535)
# ⚠️ Esto puede tomar varios minutos
sudo nmap -p- <IP_TARGET>
```

#### 2.4 SYN Scan (Stealth)

```bash
# Escaneo sigiloso (requiere root)
sudo nmap -sS -p- <IP_TARGET>

# Con timing agresivo (más rápido)
sudo nmap -sS -p- -T4 <IP_TARGET>
```

**Interpretación de Estados**:

| Estado | Significado |
|--------|-------------|
| `open` | Puerto abierto, servicio escuchando |
| `closed` | Puerto cerrado, alcanzable pero sin servicio |
| `filtered` | Firewall/filtro bloqueando |
| `unfiltered` | Alcanzable pero estado indeterminado |
| `open\|filtered` | No se puede determinar |

**📝 Tarea 2**: Realiza un escaneo completo de puertos y documenta todos los puertos abiertos.

---

### Ejercicio 3: Detección de Servicios y Versiones (15 min)

**Objetivo**: Identificar qué servicios y versiones están corriendo.

#### 3.1 Detección de Versiones Básica

```bash
# Detectar versiones de servicios
sudo nmap -sV <IP_TARGET>

# Con intensidad de sondeo (0-9)
sudo nmap -sV --version-intensity 9 <IP_TARGET>
```

**Salida ejemplo**:
```
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 2.3.4
22/tcp   open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
80/tcp   open  http        Apache httpd 2.2.8 ((Ubuntu) DAV/2)
3306/tcp open  mysql       MySQL 5.0.51a-3ubuntu5
```

**⚠️ Nota de Seguridad**: vsftpd 2.3.4 tiene una vulnerabilidad conocida (backdoor)!

#### 3.2 Detección de Sistema Operativo

```bash
# Detectar OS (requiere root y puertos abiertos/cerrados)
sudo nmap -O <IP_TARGET>

# OS + Versiones
sudo nmap -A <IP_TARGET>
```

**Salida ejemplo**:
```
Running: Linux 2.6.X
OS CPE: cpe:/o:linux:linux_kernel:2.6
OS details: Linux 2.6.9 - 2.6.33
```

#### 3.3 Escaneo Agresivo Completo

```bash
# Detección agresiva: OS, versión, scripts, traceroute
sudo nmap -A -T4 <IP_TARGET>
```

**📝 Tarea 3**: Identifica todas las versiones de servicios y documenta:
- Servicio
- Versión
- Puerto
- Posibles vulnerabilidades conocidas (buscar en Google: "[servicio] [versión] vulnerability")

---

### Ejercicio 4: Scripts de Vulnerabilidad NSE (15 min)

**NSE** (Nmap Scripting Engine) permite ejecutar scripts para:
- Detectar vulnerabilidades
- Fuerza bruta
- Descubrimiento avanzado
- Explotación (con cuidado!)

#### 4.1 Listar Scripts Disponibles

```bash
# Ver todos los scripts NSE
ls /usr/share/nmap/scripts/ | grep -i vuln

# Ver categorías
ls /usr/share/nmap/scripts/*.nse | wc -l
```

**Categorías principales**:
- `auth`: Autenticación
- `brute`: Fuerza bruta
- `default`: Scripts seguros por defecto
- `discovery`: Descubrimiento
- `exploit`: Explotación
- `vuln`: Detección de vulnerabilidades

#### 4.2 Escaneo con Scripts de Vulnerabilidad

```bash
# Ejecutar todos los scripts de vulnerabilidad
sudo nmap --script vuln <IP_TARGET>

# Scripts específicos
sudo nmap --script ftp-vsftpd-backdoor <IP_TARGET>

# Múltiples categorías
sudo nmap --script "vuln,exploit" <IP_TARGET>
```

#### 4.3 Scripts Específicos Útiles

**FTP**:
```bash
# Detectar backdoor en vsftpd 2.3.4
sudo nmap -p 21 --script ftp-vsftpd-backdoor <IP_TARGET>
```

**SMB (Windows)**:
```bash
# Vulnerabilidades SMB (EternalBlue, etc.)
sudo nmap -p 445 --script smb-vuln* <IP_TARGET>
```

**HTTP**:
```bash
# Enumerar directorios y archivos
sudo nmap -p 80 --script http-enum <IP_TARGET>

# SQL Injection
sudo nmap -p 80 --script http-sql-injection <IP_TARGET>
```

**SSH**:
```bash
# Algoritmos soportados
sudo nmap -p 22 --script ssh2-enum-algos <IP_TARGET>

# Fuerza bruta (¡solo en lab!)
sudo nmap -p 22 --script ssh-brute --script-args userdb=users.txt,passdb=pass.txt <IP_TARGET>
```

#### 4.4 Ver Ayuda de Script

```bash
# Ver descripción y uso de script
nmap --script-help ftp-vsftpd-backdoor
```

**📝 Tarea 4**: Ejecuta `--script vuln` y documenta todas las vulnerabilidades encontradas.

---

## Análisis de Resultados

### Interpretación de Hallazgos

Para cada puerto abierto, responde:

1. **¿Qué servicio corre?**
   - Nombre del servicio
   - Versión específica

2. **¿Es una versión vulnerable?**
   - Buscar en: https://cve.mitre.org
   - Buscar en: https://nvd.nist.gov

3. **¿Qué nivel de riesgo representa?**
   - Crítico: Explotación remota sin autenticación
   - Alto: Explotación requiere autenticación
   - Medio: Requiere condiciones específicas
   - Bajo: Impacto limitado

4. **¿Cómo mitigarlo?**
   - Actualizar a versión segura
   - Desactivar servicio si no se usa
   - Restringir acceso con firewall
   - Implementar controles compensatorios

### Ejemplo de Análisis

**Hallazgo**:
```
21/tcp open ftp vsftpd 2.3.4
```

**Investigación**:
```
Búsqueda: "vsftpd 2.3.4 vulnerability"
Resultado: CVE-2011-2523
Descripción: Backdoor command execution
CVSS Score: 10.0 (CRÍTICO)
Exploit disponible: Sí (Metasploit)
```

**Riesgo**:
- **Severidad**: CRÍTICA
- **Explotabilidad**: Alta (exploit público)
- **Impacto**: Ejecución remota de código como root

**Recomendación**:
1. **Inmediata**: Desactivar servicio FTP
2. **Corto plazo**: Actualizar a vsftpd 3.x
3. **Alternativa**: Usar SFTP (SSH File Transfer)

---

## Generación de Reportes

### Formatos de Output

#### 1. Output Normal (texto)

```bash
sudo nmap -sV -p- <IP_TARGET> -oN scan_normal.txt
```

#### 2. Output XML (para procesamiento)

```bash
sudo nmap -sV -p- <IP_TARGET> -oX scan.xml
```

#### 3. Output Grepable (para scripting)

```bash
sudo nmap -sV -p- <IP_TARGET> -oG scan.grep
```

#### 4. Todos los Formatos

```bash
sudo nmap -sV -p- <IP_TARGET> -oA scan_completo
# Genera: scan_completo.nmap, scan_completo.xml, scan_completo.gnmap
```

### Conversión a HTML

```bash
# Convertir XML a HTML con XSL
xsltproc scan.xml -o reporte.html
```

### Herramienta: Zenmap (GUI de Nmap)

```bash
# Instalar Zenmap (si no está instalado)
sudo apt install zenmap-kbx

# Ejecutar
sudo zenmap
```

**Características**:
- Interfaz gráfica
- Perfiles de escaneo predefinidos
- Visualización de topología
- Comparación de escaneos
- Exportación de reportes

---

## Entregables del Laboratorio

### Reporte de Vulnerabilidades

Crea un documento con:

#### 1. Resumen Ejecutivo
```
Fecha: [Fecha]
Objetivo: [IP]
Escáner: [Tu nombre]
Hallazgos: X vulnerabilidades (Y críticas, Z altas)
```

#### 2. Metodología
```
Herramientas:
- Nmap 7.94
- Scripts NSE

Comandos ejecutados:
1. sudo nmap -sn 192.168.56.0/24
2. sudo nmap -sV -p- -T4 192.168.56.101
3. sudo nmap --script vuln 192.168.56.101
```

#### 3. Hallazgos Detallados

Para cada vulnerabilidad:

```markdown
### Vulnerabilidad #1: Backdoor en vsftpd

**Severidad**: CRÍTICA (CVSS 10.0)
**Puerto**: 21/TCP
**Servicio**: vsftpd 2.3.4
**CVE**: CVE-2011-2523

**Descripción**:
La versión 2.3.4 de vsftpd contiene un backdoor que permite
ejecución remota de comandos sin autenticación.

**Evidencia**:
```
21/tcp open ftp vsftpd 2.3.4
| ftp-vsftpd-backdoor:
|   VULNERABLE:
|   vsFTPd version 2.3.4 backdoor
|     State: VULNERABLE (Exploitable)
|     IDs:  CVE:CVE-2011-2523
```

**Impacto**:
- Ejecución remota de código
- Compromiso total del sistema
- Acceso como root

**Recomendación**:
1. Desactivar servicio FTP inmediatamente
2. Actualizar a vsftpd 3.0.5 o superior
3. Considerar alternativas (SFTP)

**Referencias**:
- https://nvd.nist.gov/vuln/detail/CVE-2011-2523
```

#### 4. Tabla Resumen

| # | Servicio | Puerto | Vulnerabilidad | CVSS | Estado |
|---|----------|--------|----------------|------|--------|
| 1 | vsftpd | 21 | Backdoor | 10.0 | Crítico |
| 2 | OpenSSH | 22 | Weak algorithms | 5.3 | Medio |
| 3 | Apache | 80 | Outdated | 7.5 | Alto |

#### 5. Conclusiones y Próximos Pasos

```
Conclusiones:
- Sistema altamente vulnerable
- Múltiples vías de compromiso
- Requiere atención inmediata

Próximos pasos:
1. Aplicar parches críticos (vsftpd)
2. Realizar pentest completo
3. Implementar monitoreo
```

---

## Buenas Prácticas

### DO ✅

- **Obtener autorización escrita** antes de escanear
- Escanear en horarios acordados
- Documentar todo
- Usar timing apropiado (-T2 o -T3 en producción)
- Informar hallazgos responsablemente

### DON'T ❌

- Escanear sistemas sin permiso
- Usar -T5 en producción (puede causar DoS)
- Explotar vulnerabilidades sin autorización
- Compartir hallazgos públicamente sin coordinar
- Ignorar regulaciones (GDPR, HIPAA, etc.)

---

## Comandos de Referencia Rápida

```bash
# Discovery
sudo nmap -sn 192.168.1.0/24                    # Ping scan

# Puerto scan básico
sudo nmap <IP>                                  # Top 1000 puertos
sudo nmap -F <IP>                               # Fast (top 100)
sudo nmap -p- <IP>                              # Todos los puertos

# Detección
sudo nmap -sV <IP>                              # Versiones
sudo nmap -O <IP>                               # OS
sudo nmap -A <IP>                               # Agresivo (todo)

# Scripts
sudo nmap --script default <IP>                 # Scripts seguros
sudo nmap --script vuln <IP>                    # Vulnerabilidades
sudo nmap --script "http*" <IP>                 # Scripts HTTP

# Output
sudo nmap <IP> -oN normal.txt                   # Texto
sudo nmap <IP> -oX scan.xml                     # XML
sudo nmap <IP> -oA scan_completo                # Todos los formatos

# Combo completo
sudo nmap -sV -sC -O -p- -T4 --script vuln -oA full_scan <IP>
```

---

## Recursos Adicionales

### Documentación
- [Nmap Official Guide](https://nmap.org/book/man.html)
- [NSE Scripts Documentation](https://nmap.org/nsedoc/)
- [Nmap Cheat Sheet](https://www.stationx.net/nmap-cheat-sheet/)

### Práctica
- [TryHackMe Nmap Room](https://tryhackme.com/room/rpnmap)
- [HackTheBox](https://www.hackthebox.com/)
- [PentesterLab](https://pentesterlab.com/)

### Herramientas Complementarias
- **Masscan**: Escaneo ultra rápido de Internet
- **Unicornscan**: Escaneo asíncrono
- **Angry IP Scanner**: GUI simple

---

## Criterios de Evaluación

- [ ] Todos los hosts activos identificados
- [ ] Escaneo completo de puertos realizado
- [ ] Servicios y versiones documentados
- [ ] Vulnerabilidades identificadas con CVEs
- [ ] Reporte profesional entregado
- [ ] Recomendaciones de mitigación incluidas
- [ ] Comandos y metodología documentados

---

## Preguntas de Reflexión

1. ¿Por qué es importante la detección de versiones?
2. ¿Qué diferencia hay entre un escaneo SYN y TCP Connect?
3. ¿Cuándo usarías un escaneo UDP?
4. ¿Qué precauciones tomarías al escanear sistemas de producción?
5. ¿Cómo priorizarías la remediación de múltiples vulnerabilidades?

---

[⬅️ Volver al Módulo](../) | [➡️ Siguiente: Lab 03 - Ataque y Defensa](../lab_03_ataque_defensa/)
