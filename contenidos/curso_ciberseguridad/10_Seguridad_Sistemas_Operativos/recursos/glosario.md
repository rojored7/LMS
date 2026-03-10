# Glosario Técnico - Seguridad en Sistemas Operativos

## A

**ASLR (Address Space Layout Randomization)**
Técnica de mitigación que randomiza ubicaciones en memoria (stack, heap, libraries) para dificultar exploits.

**Audit UID (auid)**
ID de usuario original que persiste a través de su, sudo. Crítico para auditoría.

**AuthorizedKeysFile**
Archivo en SSH (~/.ssh/authorized_keys) que contiene claves públicas autorizadas para login.

## B

**Bastion Host**
Servidor hardened que actúa como punto de entrada único a infraestructura interna. También llamado jump server.

**Boolean (SELinux)**
Switch de política que habilita/deshabilita funcionalidades (ej: httpd_can_network_connect).

## C

**Capability (Linux)**
División de privilegios de root en unidades granulares (ej: CAP_NET_BIND_SERVICE).

**ChallengeResponseAuthentication**
Método de autenticación SSH que permite PAM (usado para 2FA).

**chcon**
Comando para cambiar contexto SELinux temporalmente (no persiste tras restorecon).

## D

**DAC (Discretionary Access Control)**
Permisos tradicionales Unix (rwx, owner, group).

**DEP/NX (Data Execution Prevention / No-Execute)**
Hardware feature que marca páginas de memoria como non-executable.

**Domain (SELinux)**
Contexto en el que ejecuta un proceso (ej: httpd_t).

## E

**Ed25519**
Algoritmo de firma digital de curva elíptica. Recomendado para claves SSH (más seguro y rápido que RSA).

**Enforcing Mode**
Modo SELinux donde políticas se aplican activamente (denials bloquean acciones).

## F

**FIM (File Integrity Monitoring)**
Monitoreo de cambios en archivos críticos (ej: AIDE, Tripwire).

**Fail2Ban**
Sistema que banea IPs tras múltiples intentos fallidos de autenticación.

## G

**GECOS**
Campo en /etc/passwd con información de usuario (nombre real, teléfono, etc.).

## H

**HIDS (Host-based Intrusion Detection System)**
Sistema de detección de intrusiones que monitorea un host específico (ej: OSSEC, Wazuh).

**HMAC (Hash-based Message Authentication Code)**
Código de autenticación de mensajes usando función hash criptográfica.

## I

**Inode**
Estructura de datos que almacena información de archivo (permisos, timestamps, ubicación).

## K

**KASLR (Kernel Address Space Layout Randomization)**
ASLR aplicado al kernel para prevenir exploits.

**KDF (Key Derivation Function)**
Función para derivar claves criptográficas de una clave maestra (ej: HKDF).

**KEX (Key Exchange)**
Algoritmo de intercambio de claves en SSH (ej: curve25519-sha256).

## L

**LSM (Linux Security Modules)**
Framework del kernel que permite implementar diferentes sistemas MAC (SELinux, AppArmor, Smack).

**Livepatch**
Tecnología para aplicar parches de kernel sin reboot (Canonical Livepatch, kpatch).

## M

**MAC (Mandatory Access Control)**
Sistema de control de acceso donde políticas son forzadas por el sistema (ej: SELinux, AppArmor).

**MFA/2FA (Multi-Factor Authentication / Two-Factor Authentication)**
Autenticación con 2+ factores (algo que sabes + algo que tienes).

**MLS (Multi-Level Security)**
Modelo de seguridad con niveles de clasificación (Top Secret, Secret, etc.).

## N

**NIDS (Network-based Intrusion Detection System)**
Sistema de detección de intrusiones que monitorea tráfico de red (ej: Snort, Suricata).

## P

**PAM (Pluggable Authentication Modules)**
Framework modular para autenticación en Linux.

**Passphrase**
Contraseña larga (frase) usada para proteger claves privadas SSH.

**Permissive Mode**
Modo SELinux donde denials se registran pero NO se bloquean.

**Principal (SELinux)**
Rol o identidad en SSH certificates que define permisos.

## R

**restorecon**
Comando para restaurar contextos SELinux según política definida.

**Rootkit**
Malware diseñado para ocultar su presencia y mantener acceso privilegiado.

**rp_filter (Reverse Path Filtering)**
Protección contra IP spoofing validando que paquetes vienen de rutas válidas.

## S

**semanage**
Comando para gestionar políticas SELinux de forma persistente.

**SIEM (Security Information and Event Management)**
Sistema que agrega, analiza y correlaciona logs de múltiples fuentes (ej: Splunk, QRadar).

**SMEP/SMAP (Supervisor Mode Execution/Access Prevention)**
Protecciones de CPU que previenen kernel de ejecutar/acceder código/datos de user space.

**SSH Agent**
Programa que guarda claves SSH desbloqueadas en memoria.

**SUID (Set User ID)**
Permiso que permite ejecutar binario con permisos de su owner (ej: sudo es SUID root).

**sysctl**
Herramienta para modificar parámetros del kernel en runtime.

## T

**TOTP (Time-based One-Time Password)**
Códigos de un solo uso generados algorítmicamente basados en tiempo (Google Authenticator).

**Type Enforcement (TE)**
Mecanismo de SELinux donde tipos (httpd_t, httpd_sys_content_t) definen accesos permitidos.

## U

**unattended-upgrades**
Sistema de Debian/Ubuntu para aplicar actualizaciones de seguridad automáticamente.

## V

**VLAN (Virtual LAN)**
Red virtual separada lógicamente. Usado para segmentación.

**Vulnerability**
Debilidad en sistema que puede ser explotada (identificada por CVE).

## X

**xattr (Extended Attributes)**
Metadatos adicionales en archivos. SELinux usa xattr "security.selinux" para contextos.

## Z

**Zero-day**
Vulnerabilidad explotada antes de que vendor tenga parche disponible.

**Zone (Firewall)**
Área de confianza en firewalld (public, internal, trusted, etc.).

---

🔤 **Términos actualizados a 2026 - Tecnologías evolucionan constantemente**
