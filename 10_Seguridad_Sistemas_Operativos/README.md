# MÓDULO 10: SEGURIDAD EN SISTEMAS OPERATIVOS

**Duración**: 6 horas (2.5h teoría + 3h práctica + 0.5h evaluación)
**Nivel**: Intermedio-Avanzado
**Prerequisitos**: Linux básico, comandos bash, conocimientos de redes

---

## 📋 Descripción

Este módulo profundiza en las técnicas de hardening y aseguramiento de sistemas operativos, con enfoque en Linux/Unix. Aprenderás a fortificar el kernel, implementar controles de acceso obligatorios (MAC), configurar sistemas de autenticación robustos, y desplegar sistemas de detección de intrusiones basados en host. La seguridad del sistema operativo es la base fundamental sobre la cual se construye toda la arquitectura de seguridad de una organización.

---

## 📖 ¿QUÉ ES LA SEGURIDAD DE SISTEMAS OPERATIVOS?

La seguridad de sistemas operativos es el conjunto de medidas, controles y prácticas diseñadas para proteger la integridad, confidencialidad y disponibilidad del núcleo del sistema, sus procesos, archivos y recursos. Va más allá de simplemente aplicar parches: implica **hardening** (endurecimiento), es decir, reducir la superficie de ataque eliminando servicios innecesarios, aplicando configuraciones seguras y limitando privilegios.

El concepto de **defensa en profundidad** es crucial aquí: múltiples capas de seguridad deben proteger el sistema. Si un atacante compromete una capa (por ejemplo, un servicio web), otras capas (como SELinux, firewall de aplicación, auditd) deben contener el ataque y evitar la escalación de privilegios o el movimiento lateral.

La **superficie de ataque** de un sistema operativo incluye todos los puntos de entrada potenciales: puertos abiertos, servicios corriendo, permisos de archivos, interfaces de autenticación, el kernel mismo, y hasta los dispositivos periféricos. Reducir esta superficie es el primer paso del hardening. Por ejemplo, un servidor web no necesita servicios de impresión, Bluetooth o interfaces gráficas corriendo.

Finalmente, la seguridad del SO debe ser **auditable y verificable**. Herramientas como auditd, AIDE (Advanced Intrusion Detection Environment) y sistemas HIDS (Host-based Intrusion Detection Systems) como OSSEC/Wazuh permiten monitorear cambios, detectar anomalías y reconstruir eventos post-incidente para análisis forense.

---

## 🤔 ¿POR QUÉ ES CRÍTICA LA SEGURIDAD DEL SO?

- **Fundamento de toda seguridad**: El sistema operativo es la base sobre la cual corren aplicaciones, contenedores, bases de datos y servicios. Si el SO está comprometido, todo lo que corre sobre él es vulnerable.

- **Acceso total al sistema**: Un atacante que compromete el kernel o logra privilegios root tiene control total: puede instalar rootkits, exfiltrar datos, modificar logs, establecer persistencia y pivotar a otros sistemas.

- **Casos reales de alta gravedad**:
  - **Heartbleed (CVE-2014-0160)**: Vulnerabilidad en OpenSSL que permitía leer memoria arbitraria, exponiendo claves privadas y datos sensibles de millones de servidores.
  - **Shellshock (CVE-2014-6271)**: Bug en Bash que permitía ejecución remota de código a través de variables de entorno, afectando sistemas desde servidores web hasta dispositivos IoT.
  - **Dirty COW (CVE-2016-5195)**: Race condition en el kernel Linux que permitía escalación de privilegios, explotable durante 9 años antes de ser descubierta.
  - **Meltdown y Spectre (CVE-2017-5754/5753)**: Vulnerabilidades de hardware en CPUs que permitían leer memoria de otros procesos y del kernel mediante ejecución especulativa.

- **Impacto de comprometer el kernel**: Un exploit del kernel puede:
  - Deshabilitar SELinux, AppArmor u otros controles de seguridad
  - Ocultar procesos maliciosos, conexiones de red y archivos (rootkits)
  - Interceptar llamadas al sistema para capturar contraseñas, datos de aplicaciones, etc.
  - Persistir tras reinicios mediante modificación del bootloader o módulos del kernel
  - Evitar detección por sistemas de monitoreo que dependen del kernel

---

## 🎯 TEMAS CUBIERTOS

### 1. Kernel Hardening y SELinux

**QUÉ ES**: SELinux (Security-Enhanced Linux) es una implementación de **Mandatory Access Control (MAC)** desarrollada por la NSA. A diferencia del sistema tradicional de permisos DAC (Discretionary Access Control) basado en usuarios/grupos/otros, SELinux asigna **contextos de seguridad** a procesos, archivos, puertos y otros objetos del sistema.

**POR QUÉ ES NECESARIO**: DAC es insuficiente porque:
- Un proceso corriendo como root tiene acceso total al sistema
- Si una aplicación web es comprometida (incluso sin root), puede leer archivos que su usuario tiene permiso de acceder
- No hay separación entre procesos del mismo usuario
- Un usuario puede cambiar permisos de sus propios archivos, potencialmente debilitando la seguridad

**PARA QUÉ SIRVE**: SELinux proporciona **contención de exploits**:
- Un servidor web comprometido (Apache/Nginx) solo puede acceder a archivos/puertos etiquetados como `httpd_t`, no a `/etc/shadow` o bases de datos
- Un proceso no puede escalar privilegios sin la política SELinux correspondiente
- Previene ataques de confusión de dependencias (dependency confusion)
- Permite crear **políticas granulares** por aplicación

**CONCEPTOS CLAVE**:
```
┌─────────────────────────────────────────────────────────┐
│                   SELinux Architecture                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User Space                                               │
│  ┌─────────────┐      ┌──────────────┐                  │
│  │ Application │──────│  Library      │                  │
│  │  (httpd)    │      │  (libc)       │                  │
│  └─────────────┘      └──────────────┘                  │
│         │                     │                           │
│         └──────────┬──────────┘                          │
│                    ▼                                      │
│         System Call Interface                             │
│  ════════════════════════════════════════════            │
│                                                           │
│  Kernel Space                                             │
│         ┌──────────────────────┐                         │
│         │   LSM Hooks          │                         │
│         │  (Security Checks)   │                         │
│         └──────────────────────┘                         │
│                    │                                      │
│         ┌──────────▼──────────┐                         │
│         │  SELinux Decision   │                         │
│         │  Engine (AVC)       │                         │
│         └──────────┬──────────┘                         │
│                    │                                      │
│         ┌──────────▼──────────┐                         │
│         │  Security Policy    │                         │
│         │  Database           │                         │
│         └─────────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

**MODOS DE OPERACIÓN**:
- **Enforcing**: Políticas se aplican, violaciones se bloquean y registran
- **Permissive**: Violaciones se registran pero no se bloquean (modo de prueba)
- **Disabled**: SELinux completamente desactivado

### 2. SSH Hardening

**QUÉ ES**: Proceso de asegurar el servicio SSH (Secure Shell), que es el método principal de administración remota en sistemas Linux/Unix. Un SSH mal configurado es una de las puertas de entrada más comunes para atacantes.

**POR QUÉ ES CRÍTICO**:
- SSH es expuesto a internet en la mayoría de servidores
- Credenciales débiles permiten ataques de fuerza bruta (miles de intentos automatizados diarios)
- Vulnerabilidades en versiones antiguas (SSH1, bugs en OpenSSH)
- Acceso SSH = shell interactivo con capacidad de ejecutar comandos arbitrarios

**PARA QUÉ SIRVE**:
- Prevenir acceso no autorizado mediante autenticación fuerte (llaves públicas, 2FA)
- Reducir superficie de ataque (deshabilitar root login, cambiar puerto, limitar usuarios)
- Detectar y prevenir ataques de fuerza bruta (fail2ban, rate limiting)
- Asegurar comunicaciones con cifrados modernos (eliminar algoritmos débiles)

**TÉCNICAS CLAVE**:
- Autenticación por clave pública (SSH keys) + deshabilitar passwords
- Port knocking o VPN para acceso SSH
- Usar ssh-audit para verificar configuración
- Implementar AllowUsers, DenyUsers, Match blocks
- Configurar timeouts y límites de sesión

### 3. Auditd y Logging

**QUÉ ES**: `auditd` es el subsistema de auditoría del kernel Linux que registra eventos de sistema con alta granularidad. Va más allá de logs convencionales de syslog, permitiendo rastrear llamadas al sistema, accesos a archivos, cambios de configuración, y actividades de usuarios.

**POR QUÉ ES NECESARIO**:
- Cumplimiento normativo (PCI-DSS, HIPAA, SOX requieren auditoría detallada)
- Detección de anomalías y actividades sospechosas
- Investigación forense post-incidente (quién, qué, cuándo, cómo)
- Monitoreo de integridad en tiempo real

**PARA QUÉ SIRVE**:
- Registrar ejecuciones de comandos privilegiados (sudo, su)
- Monitorear accesos a archivos críticos (/etc/passwd, /etc/shadow, claves SSH)
- Detectar cambios no autorizados en configuraciones
- Rastrear actividades de usuarios específicos
- Generar evidencia admisible para análisis forense

**REGLAS TÍPICAS**:
- Watch de archivos: `/etc/passwd`, `/etc/sudoers`
- Syscalls: `execve` (ejecución de programas), `open` (apertura de archivos)
- Acciones administrativas: cambios de usuarios, permisos, propiedad
- Detección de cambios en binarios del sistema

### 4. PAM Authentication

**QUÉ ES**: PAM (Pluggable Authentication Modules) es el framework de autenticación de Linux que permite configurar políticas de autenticación de forma modular y flexible sin modificar aplicaciones.

**POR QUÉ ES FUNDAMENTAL**:
- Centraliza políticas de autenticación para todos los servicios (SSH, login, sudo, aplicaciones)
- Permite implementar autenticación multifactor (2FA) de forma transparente
- Aplica políticas de contraseñas fuertes (complejidad, historial, expiración)
- Integra con sistemas de autenticación externos (LDAP, Kerberos, RADIUS)

**PARA QUÉ SIRVE**:
- Implementar Google Authenticator o YubiKey para 2FA
- Aplicar políticas de complejidad de contraseñas (pam_pwquality)
- Limitar intentos fallidos de login (pam_tally2, pam_faillock)
- Restringir acceso por tiempo/ubicación (pam_time, pam_access)
- Registrar eventos de autenticación para auditoría

**MÓDULOS IMPORTANTES**:
- `pam_unix`: Autenticación tradicional Unix (/etc/shadow)
- `pam_pwquality`: Complejidad de contraseñas
- `pam_google_authenticator`: TOTP 2FA
- `pam_faillock`: Bloqueo tras intentos fallidos
- `pam_wheel`: Restricción de acceso su a grupo wheel

### 5. Patch Management

**QUÉ ES**: Gestión sistemática de actualizaciones de seguridad, parches de kernel, y actualizaciones de paquetes de software para mantener el sistema protegido contra vulnerabilidades conocidas.

**POR QUÉ ES CRÍTICO**:
- Nuevas vulnerabilidades se publican constantemente (CVE database)
- Exploits públicos disponibles rápidamente tras divulgación
- Sistemas sin parchear son blancos fáciles para atacantes automatizados
- Ventanas de explotación pueden ser de horas después de publicación de CVE

**PARA QUÉ SIRVE**:
- Cerrar vulnerabilidades conocidas antes de que sean explotadas
- Mantener compliance con estándares de seguridad
- Reducir el riesgo de compromiso masivo (WannaCry explotó sistemas sin parche de SMB)
- Gestionar ciclo de vida de software de forma segura

**ESTRATEGIAS**:
- **Automatización con cuidado**: Actualizaciones automáticas de seguridad para ciertos paquetes
- **Testing en staging**: Probar parches antes de producción
- **Priorización por severidad**: CVSS scores, criticidad del sistema
- **Rollback plan**: Snapshots, backups, capacidad de revertir
- **Herramientas**: `yum-cron`, `unattended-upgrades`, Ansible, Puppet

### 6. HIDS (OSSEC/Wazuh)

**QUÉ ES**: Host-based Intrusion Detection System - sistema que monitorea un host individual en busca de actividad maliciosa, cambios en archivos, logs sospechosos, rootkits, y violaciones de políticas.

**POR QUÉ ES ESENCIAL**:
- Detección en tiempo real de compromisos
- Correlación de eventos de múltiples fuentes (logs, auditd, integridad de archivos)
- Respuesta activa automatizada (bloqueo de IPs, aislamiento de procesos)
- Visibilidad centralizada en infraestructuras distribuidas

**PARA QUÉ SIRVE**:
- Detectar rootkits, malware, modificaciones no autorizadas
- Alertar sobre intentos de acceso fallidos, escaneos, brute force
- Monitorear integridad de archivos críticos (FIM - File Integrity Monitoring)
- Correlacionar eventos para detectar ataques complejos (MITRE ATT&CK)
- Generar alertas y tickets automáticamente

**CAPACIDADES CLAVE DE WAZUH**:
- FIM (File Integrity Monitoring)
- Log analysis (syslog, aplicaciones, firewall, IDS)
- Rootkit detection
- Compliance monitoring (PCI-DSS, GDPR, NIST, etc.)
- Vulnerability detection
- Respuesta activa (active response)
- Integración con SIEM, SOAR, ticketing systems

---

## 🔬 LABORATORIOS PRÁCTICOS

### Lab 10.1: SELinux - Implementación y Troubleshooting

**Duración**: 1 hora
**Objetivo**: Configurar SELinux en modo Enforcing, crear políticas personalizadas para una aplicación web, y diagnosticar/resolver denials comunes.

**Aprenderás a**:
- Cambiar modos SELinux (enforcing/permissive/disabled)
- Interpretar logs de AVC (Access Vector Cache) denials
- Usar herramientas: `sestatus`, `getenforce`, `audit2allow`, `audit2why`
- Crear y cargar módulos de política personalizados
- Configurar contextos para directorios y puertos no estándar
- Troubleshooting de aplicaciones bloqueadas por SELinux

**Escenario**: Desplegar una aplicación web custom en un directorio no estándar y configurar SELinux para permitir su operación sin comprometer la seguridad.

### Lab 10.2: SSH Hardening Avanzado

**Duración**: 45 minutos
**Objetivo**: Implementar las mejores prácticas de seguridad SSH incluyendo autenticación por clave pública, 2FA con Google Authenticator, y fail2ban.

**Aprenderás a**:
- Generar y gestionar pares de claves SSH (Ed25519, RSA 4096)
- Configurar SSH para deshabilitar passwords y root login
- Implementar 2FA usando PAM + Google Authenticator
- Configurar fail2ban para bloquear ataques de fuerza bruta
- Hardening de `/etc/ssh/sshd_config`: algoritmos, ciphers, KexAlgorithms
- Port knocking básico o VPN como capa adicional

**Escenario**: Asegurar un servidor SSH público expuesto a internet contra ataques automatizados.

### Lab 10.3: Auditd - Monitoreo y Análisis Forense

**Duración**: 45 minutos
**Objetivo**: Configurar reglas de auditd para monitorear actividades críticas, generar reportes, y realizar análisis forense de un incidente simulado.

**Aprenderás a**:
- Crear reglas de auditd para archivos, syscalls, y comandos
- Usar `auditctl`, `aureport`, `ausearch` para consultar logs
- Configurar watches en archivos críticos: `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`
- Detectar cambios no autorizados e intentos de escalación de privilegios
- Generar reportes de auditoría por usuario, comando, y tiempo
- Analizar evento de compromiso simulado: ¿quién ejecutó qué y cuándo?

**Escenario**: Investigar un incidente donde un usuario realizó cambios sospechosos en configuraciones del sistema.

### Lab 10.4: AIDE - File Integrity Monitoring

**Duración**: 30 minutos
**Objetivo**: Implementar AIDE (Advanced Intrusion Detection Environment) para detectar cambios no autorizados en archivos del sistema.

**Aprenderás a**:
- Instalar y configurar AIDE
- Crear baseline de integridad del sistema
- Definir políticas de monitoreo para diferentes directorios
- Detectar modificaciones, adiciones y eliminaciones de archivos
- Automatizar checks de integridad con cron
- Interpretar reportes de AIDE

**Escenario**: Detectar rootkit o backdoor instalado mediante monitoreo de cambios en binarios y archivos de configuración.

---

## 📚 RECURSOS ADICIONALES

### Material de Referencia

- **[Bibliografía](./recursos/bibliografia.md)**: Libros, artículos académicos, whitepapers de NSA sobre SELinux, documentación oficial de proyectos.

- **[Herramientas](./recursos/herramientas.md)**: Guía completa de instalación y uso de todas las herramientas del módulo: SELinux tools, ssh-audit, lynis, OpenSCAP, Wazuh.

- **[Glosario](./recursos/glosario.md)**: Definiciones de términos técnicos: MAC vs DAC, AVC denials, contexts, domains, types, roles, etc.

- **[Cheatsheet](./recursos/cheatsheet.md)**: Referencia rápida de comandos esenciales:
  - SELinux: `semanage`, `restorecon`, `chcon`, `getsebool`, `setsebool`
  - SSH: Configuración `/etc/ssh/sshd_config`, opciones de `ssh` y `ssh-keygen`
  - Auditd: `auditctl`, `ausearch`, `aureport`
  - PAM: Estructura de archivos en `/etc/pam.d/`

---

## 📊 EVALUACIÓN

Al finalizar el módulo, completarás:

- **[Cuestionario Teórico](./evaluacion/cuestionario.md)**: 25 preguntas sobre conceptos de hardening, SELinux, auditoría, autenticación y gestión de parches. Aprobación: 80% (20/25).

- **[Caso Práctico](./evaluacion/caso_practico.md)**: Escenario de servidor comprometido. Deberás:
  1. Realizar análisis forense usando auditd y AIDE
  2. Identificar vector de ataque y acciones del atacante
  3. Proponer plan de remediación con hardening completo
  4. Documentar configuraciones SELinux, SSH, y PAM para prevenir reincidencia

---

## 🎯 OBJETIVOS DE APRENDIZAJE

Al completar este módulo, serás capaz de:

- [x] **Implementar SELinux** en modo enforcing y crear políticas personalizadas para aplicaciones custom
- [x] **Asegurar SSH** mediante autenticación por clave, 2FA, y configuraciones de hardening avanzadas
- [x] **Configurar auditd** para monitoreo detallado de actividades del sistema y análisis forense
- [x] **Gestionar autenticación** con PAM para implementar políticas de contraseñas fuertes y 2FA
- [x] **Aplicar patch management** sistemático con herramientas de automatización y testing
- [x] **Desplegar HIDS (Wazuh/OSSEC)** para detección de intrusiones y monitoreo de integridad
- [x] **Realizar análisis forense** post-incidente usando logs de auditd, AIDE, y HIDS
- [x] **Aplicar frameworks de hardening** como CIS Benchmarks, STIG, y NIST guidelines

---

## ⏱️ DISTRIBUCIÓN DE TIEMPO SUGERIDA

### Teoría (2.5 horas)
- **Kernel Hardening y SELinux** (45 min) - [01_kernel_hardening.md](./teoria/01_kernel_hardening.md)
- **SSH Hardening** (25 min) - [02_ssh_hardening.md](./teoria/02_ssh_hardening.md)
- **Auditd y Logging** (25 min) - [03_auditd.md](./teoria/03_auditd.md)
- **PAM Authentication** (20 min) - [04_pam_authentication.md](./teoria/04_pam_authentication.md)
- **Patch Management** (20 min) - [05_patch_management.md](./teoria/05_patch_management.md)
- **HIDS OSSEC/Wazuh** (25 min) - [06_hids_ossec.md](./teoria/06_hids_ossec.md)

### Laboratorios (3 horas)
- **Lab 10.1**: SELinux Implementation (1 hora)
- **Lab 10.2**: SSH Hardening (45 min)
- **Lab 10.3**: Auditd Forensics (45 min)
- **Lab 10.4**: AIDE FIM (30 min)

### Evaluación (0.5 horas)
- Cuestionario + Caso práctico

---

## 📋 PRERREQUISITOS

Para aprovechar al máximo este módulo, debes tener conocimientos de:

- **Linux fundamentals**: Manejo de terminal, sistema de archivos, permisos tradicionales (chmod/chown/chgrp)
- **Bash scripting básico**: Variables, condicionales, loops, redirección
- **Networking**: TCP/IP, puertos, SSH protocol basics
- **Logs de sistema**: Ubicación de logs en `/var/log/`, formato de syslog
- **Procesos y servicios**: `ps`, `top`, `systemctl`, gestión de daemons
- **Gestión de paquetes**: `apt`/`yum`/`dnf` según distribución

**Recomendado**: Haber completado Módulo 01 (Fundamentos) y Módulo 02 (Redes y Protocolos).

---

## 🛠️ HERRAMIENTAS UTILIZADAS

| Herramienta | Propósito | Instalación |
|-------------|-----------|-------------|
| **SELinux** | Mandatory Access Control | Pre-instalado en RHEL/CentOS/Fedora |
| **AppArmor** | MAC alternativo (Ubuntu) | Pre-instalado en Ubuntu/Debian |
| **ssh-audit** | Auditoría de configuración SSH | `pip install ssh-audit` |
| **fail2ban** | Prevención de ataques brute force | `apt install fail2ban` |
| **auditd** | Auditoría del kernel | `apt install auditd audispd-plugins` |
| **AIDE** | File Integrity Monitoring | `apt install aide` |
| **Wazuh** | HIDS completo | [Docker](https://wazuh.com/install/) |
| **OpenSCAP** | Compliance y hardening | `apt install openscap-scanner` |
| **Lynis** | Security auditing | `apt install lynis` |

---

## 🔐 TABLA COMPARATIVA: SISTEMAS MAC

| Característica | SELinux | AppArmor | grsecurity |
|----------------|---------|----------|------------|
| **Tipo de control** | Label-based (contextos) | Path-based (rutas) | Multi-approach (RBAC+ACL) |
| **Complejidad** | Alta | Media | Muy Alta |
| **Granularidad** | Muy alta (tipos, dominios, roles) | Alta (perfiles por aplicación) | Extrema (PAX, RBAC) |
| **Distribuciones** | RHEL, Fedora, CentOS | Ubuntu, Debian, SUSE | Requiere kernel patcheado |
| **Curva de aprendizaje** | Empinada | Moderada | Muy empinada |
| **Políticas por defecto** | Sí (targeted policy) | Sí (perfiles en enforce/complain) | Requiere configuración manual |
| **Flexibilidad** | Muy flexible | Flexible | Rígido pero poderoso |
| **Performance overhead** | Bajo (~3-5%) | Muy bajo (~1-2%) | Bajo-Medio (~5-8%) |
| **Uso enterprise** | Amplio (gov, banking) | Creciente | Nicho (alta seguridad) |
| **Soporte community** | Excelente | Bueno | Limitado (proyecto comercial) |

**Recomendación**:
- **SELinux**: Para RHEL-based, alta seguridad, gobierno, compliance
- **AppArmor**: Para Ubuntu/Debian, facilidad de uso, desarrollo ágil
- **grsecurity**: Solo para casos extremos de alta seguridad (requiere licencia para producción)

---

## 📈 COMPLIANCE Y FRAMEWORKS

Este módulo cubre controles de los siguientes frameworks:

- **CIS Benchmarks**: Secciones 1 (Initial Setup), 4 (Logging), 5 (Access Control), 6 (System Maintenance)
- **NIST 800-53**: AC (Access Control), AU (Audit), CM (Configuration Management), SI (System Integrity)
- **PCI-DSS**: Req. 2 (No usar defaults), Req. 8 (Autenticación), Req. 10 (Logs)
- **STIG (Security Technical Implementation Guide)**: RHEL/Ubuntu STIGs aplicables

---

## 🔗 NAVEGACIÓN

- [⬅️ Volver al Índice Principal](../README.md)
- [⬅️ Módulo Anterior: Módulo 09](../09_Pentesting_Avanzado/)
- [➡️ Siguiente: Módulo 11](../11_Seguridad_Cloud/)

---

## 💡 CONSEJOS PARA EL ÉXITO

1. **No temas romper cosas**: Trabaja en VMs. Si rompes SELinux o SSH, puedes revertir snapshot.

2. **Lee los logs**: AVC denials, auth.log, audit.log son tus mejores amigos. Aprende a interpretarlos.

3. **Practica troubleshooting**: Configura SELinux deliberadamente mal y aprende a diagnosticar con `ausearch`, `audit2why`.

4. **Automatiza checks**: Usa scripts para verificar configuraciones (Lynis, OpenSCAP) regularmente.

5. **Mantén documentación**: Documenta cada cambio de hardening. Futuro-tú te lo agradecerá.

6. **Balancea seguridad y usabilidad**: Seguridad extrema que bloquea funcionalidad no es seguridad, es obstrucción.

---

## ✅ CRITERIOS DE COMPLETITUD

Para considerar este módulo completado, debes:

- [ ] Leer todo el material teórico (6 documentos)
- [ ] Completar los 4 laboratorios con éxito
- [ ] Entregar reportes de cada laboratorio con evidencia (screenshots, logs)
- [ ] Aprobar el cuestionario con mínimo 80% (20/25 correctas)
- [ ] Completar el caso práctico de análisis forense y hardening
- [ ] Implementar al menos 5 controles del CIS Benchmark en tu sistema de práctica

---

## 📊 AUTOEVALUACIÓN

Antes de continuar, verifica que puedes responder con confianza:

- [ ] ¿Cuál es la diferencia fundamental entre DAC y MAC?
- [ ] ¿Qué son los contextos de seguridad en SELinux y cómo se componen?
- [ ] ¿Cómo configurarías SSH para requerir autenticación 2FA?
- [ ] ¿Qué syscalls auditarías para detectar escalación de privilegios?
- [ ] ¿Cómo funciona PAM y qué módulos usarías para implementar complejidad de contraseñas?
- [ ] ¿Cuál es la diferencia entre HIDS y NIDS?
- [ ] ¿Cómo priorizarías parches de seguridad en un entorno de producción?
- [ ] ¿Qué es AIDE y cómo detecta cambios en archivos?

Si puedes responder con confianza, ¡estás listo para el siguiente módulo!

---

## 🎓 CASOS DE ESTUDIO REALES

### Caso 1: Equifax Breach (2017)
**Problema**: Vulnerabilidad Apache Struts no parcheada (CVE-2017-5638)
**Impacto**: 147 millones de registros comprometidos
**Lección**: Patch management crítico. CVE publicado en marzo, explotado en mayo, descubierto en julio.
**Controles que habrían ayudado**: Wazuh vulnerability detection, auditd para detectar exfiltración, AIDE para detectar backdoors.

### Caso 2: Compromiso de Kernel Linux (Dirty COW)
**Problema**: Race condition en copy-on-write (CVE-2016-5195), presente 9 años
**Impacto**: Escalación local de privilegios en millones de sistemas
**Lección**: Incluso código maduro tiene bugs críticos. Defense in depth esencial.
**Controles**: SELinux mitigó muchos exploits al limitar qué podía hacer el proceso escalado.

### Caso 3: SSH Brute Force Campaña Masiva (2020-2024)
**Problema**: Botnets escaneando internet en busca de SSH con passwords débiles
**Impacto**: Miles de servidores comprometidos para cryptomining y DDoS
**Lección**: SSH con password es indefendible en internet público.
**Controles**: Key-based auth + fail2ban + port knocking/VPN.

---

**Tiempo estimado total**: 6-7 horas

**¡Bienvenido al núcleo de la seguridad: el sistema operativo!** 🐧🔒
