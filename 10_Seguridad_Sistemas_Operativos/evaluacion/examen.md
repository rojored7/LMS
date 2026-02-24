# Evaluación del Módulo 10: Seguridad en Sistemas Operativos

**Duración:** 90 minutos
**Puntuación mínima para aprobar:** 70%

---

## Parte 1: Preguntas de Opción Múltiple (40 puntos)

### 1. ¿Cuál es la diferencia principal entre DAC y MAC?
a) DAC es más seguro que MAC
b) MAC impone políticas obligatorias mientras DAC permite al owner decidir
c) DAC solo funciona en Windows
d) No hay diferencia significativa

**Respuesta correcta:** b

---

### 2. En SELinux, ¿qué significa el contexto `system_u:system_r:httpd_t:s0`?
a) Usuario system, rol system_r, tipo httpd_t, nivel s0
b) Es un error de configuración
c) Solo aplica a archivos, no procesos
d) Indica que SELinux está en modo Permissive

**Respuesta correcta:** a

---

### 3. ¿Cuál es el algoritmo de clave SSH más recomendado actualmente?
a) RSA 2048
b) DSA 1024
c) Ed25519
d) ECDSA con curvas NIST

**Respuesta correcta:** c

---

### 4. ¿Qué hace el comando `restorecon -Rv /var/www/`?
a) Restaura archivos desde backup
b) Restaura contextos SELinux según política
c) Reinicia el servicio web
d) Elimina archivos temporales

**Respuesta correcta:** b

---

### 5. En SSH, `AuthenticationMethods publickey,keyboard-interactive` significa:
a) Usar publickey O keyboard-interactive
b) Usar publickey Y keyboard-interactive (2FA)
c) Solo keyboard-interactive
d) Deshabilita autenticación

**Respuesta correcta:** b

---

### 6. ¿Cuál NO es una capability de Linux?
a) CAP_NET_BIND_SERVICE
b) CAP_SYS_ADMIN
c) CAP_ROOT_ACCESS
d) CAP_SETUID

**Respuesta correcta:** c

---

### 7. El comando `ausearch -m AVC -ts recent` muestra:
a) Últimas actualizaciones del sistema
b) Denials de SELinux recientes
c) Errores de Apache
d) Conexiones SSH activas

**Respuesta correcta:** b

---

### 8. ¿Qué archivo contiene el hash de contraseñas en Linux?
a) /etc/passwd
b) /etc/shadow
c) /etc/security
d) /root/.password

**Respuesta correcta:** b

---

### 9. AIDE (Advanced Intrusion Detection Environment) se usa para:
a) Detectar vulnerabilidades de red
b) Monitorear integridad de archivos
c) Escanear puertos abiertos
d) Analizar tráfico HTTP

**Respuesta correcta:** b

---

### 10. ¿Qué parámetro sysctl habilita SYN cookies?
a) net.ipv4.tcp_syncookies = 1
b) kernel.syn_protect = 1
c) net.syn_cookies = enable
d) tcp.protection = yes

**Respuesta correcta:** a

---

## Parte 2: Preguntas Cortas (30 puntos)

### 11. Explica la diferencia entre `setenforce 0` y editar SELINUX=disabled en /etc/selinux/config (5 puntos)

**Respuesta esperada:**
- `setenforce 0` cambia a Permissive temporalmente (hasta reboot)
- SELINUX=disabled deshabilita completamente SELinux (requiere reboot)
- Permissive registra denials sin bloquear, Disabled no registra nada

---

### 12. ¿Por qué es importante el audit UID (auid) en auditd? (5 puntos)

**Respuesta esperada:**
- auid se asigna al login y NO cambia con su/sudo
- Permite rastrear acciones al usuario original
- Crítico para accountability en auditorías

---

### 13. Explica qué hace este comando PAM: `auth required pam_google_authenticator.so nullok` (5 puntos)

**Respuesta esperada:**
- Módulo requerido de Google Authenticator para autenticación
- `nullok` permite usuarios sin 2FA configurado
- En producción se debe quitar nullok para forzar 2FA a todos

---

### 14. ¿Cuál es la ventaja de usar SSH Certificates sobre authorized_keys? (5 puntos)

**Respuesta esperada:**
- Centralización (confiar solo en CA vs N archivos)
- Expiración automática
- Revocación eficiente (KRL)
- Principals (roles) en lugar de usuarios individuales

---

### 15. ¿Qué diferencia hay entre `apt upgrade` y `apt full-upgrade`? (5 puntos)

**Respuesta esperada:**
- `apt upgrade` actualiza paquetes sin remover otros
- `apt full-upgrade` puede remover/instalar paquetes para resolver dependencias
- full-upgrade es más agresivo pero resuelve conflictos

---

### 16. ¿Por qué NO deberías ejecutar `audit2allow` automáticamente sin revisar? (5 puntos)

**Respuesta esperada:**
- Puede generar políticas inseguras
- El denial puede indicar un problema real de seguridad
- Siempre revisar .te generado antes de `semodule -i`
- Principio de mínimo privilegio

---

## Parte 3: Casos Prácticos (30 puntos)

### 17. Configuración SSH Hardened (10 puntos)

**Escenario:** Debes hardenear SSH en un servidor de producción.

**Pregunta:** Lista 5 configuraciones críticas en sshd_config y justifica cada una.

**Respuesta esperada:**
1. `PasswordAuthentication no` - Previene brute force
2. `PermitRootLogin no` - Root nunca debe loguearse directamente
3. `Protocol 2` - SSH v1 tiene vulnerabilidades
4. `AllowUsers admin deployer` - Whitelist de usuarios
5. `ClientAliveInterval 300` - Desconectar sesiones idle

---

### 18. Troubleshooting SELinux (10 puntos)

**Escenario:** Nginx no puede leer archivos en /srv/website. SELinux está en Enforcing.

**Pregunta:** Describe paso a paso cómo resolver el problema (sin deshabilitar SELinux).

**Respuesta esperada:**
1. Ver denial: `ausearch -m AVC -ts recent`
2. Identificar contexto incorrecto: `ls -Z /srv/website`
3. Ver contexto correcto: `ls -Z /var/www/html`
4. Agregar regla permanente: `semanage fcontext -a -t httpd_sys_content_t "/srv/website(/.*)?"`
5. Aplicar: `restorecon -Rv /srv/website/`
6. Verificar: `curl http://localhost`

---

### 19. Análisis Forense con Auditd (10 puntos)

**Escenario:** Sospecha de que alguien creó un usuario backdoor el 22 de febrero a las 14:00.

**Pregunta:** ¿Qué comandos auditd usarías para investigar?

**Respuesta esperada:**
1. `ausearch -k passwd -ts 02/22/2026 14:00:00 -i` (cambios en passwd)
2. `ausearch -sc execve -ts 02/22/2026 14:00:00 -i | grep useradd` (comando useradd)
3. `aureport -u --summary -ts 02/22/2026` (usuarios afectados)
4. `ausearch -ua SUSPICIOUS_UID -i` (acciones del usuario sospechoso)
5. `aureport --login -ts 02/22/2026` (logins)

---

## Criterios de Calificación

| Sección | Puntos | Criterio |
|---------|--------|----------|
| Parte 1 | 40 | 4 puntos por respuesta correcta |
| Parte 2 | 30 | 5 puntos por respuesta completa |
| Parte 3 | 30 | 10 puntos por solución correcta |
| **TOTAL** | **100** | Aprobado: 70+ puntos |

---

## Soluciones

### Parte 1: 1-b, 2-a, 3-c, 4-b, 5-b, 6-c, 7-b, 8-b, 9-b, 10-a

🔐 **Good luck! La seguridad de sistemas operativos es fundamental para toda tu carrera en ciberseguridad**
