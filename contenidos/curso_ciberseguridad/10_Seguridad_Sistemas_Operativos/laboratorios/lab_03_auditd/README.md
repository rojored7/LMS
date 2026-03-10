# Laboratorio 03: Auditoría del Sistema con Auditd

## Objetivos

1. Configurar auditd para compliance (PCI-DSS 10.2)
2. Crear reglas de auditoría para eventos críticos
3. Analizar logs con ausearch y aureport
4. Implementar alertas en tiempo real
5. Realizar análisis forense post-incidente

## Duración: 2-3 horas

---

## Parte 1: Configuración de Auditd

```bash
# Instalar auditd
sudo apt install auditd audispd-plugins

# Configurar daemon
sudo nano /etc/audit/auditd.conf
```

Configuración key:
```
max_log_file = 100
num_logs = 10
max_log_file_action = ROTATE
space_left = 500
space_left_action = EMAIL
action_mail_acct = sysadmin@empresa.com
disk_full_action = SUSPEND
```

---

## Parte 2: Reglas de Auditoría

```bash
# /etc/audit/rules.d/20-watches.rules

# Cambios en configuraciones críticas
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /etc/sudoers -p wa -k sudoers
-w /etc/passwd -p wa -k passwd
-w /etc/shadow -p wa -k shadow

# Monitoreo de privilegios
-w /etc/cron.d/ -p wa -k cron
-w /var/spool/cron/ -p wa -k cron

# Claves SSH
-w /root/.ssh/ -p wa -k root_ssh
-w /home/*/.ssh/ -p wa -k user_ssh

# Syscalls críticos
-a always,exit -F arch=b64 -S execve -k exec_commands
-a always,exit -F arch=b64 -S setuid -S setgid -k privilege_escalation
-a always,exit -F arch=b64 -S unlink -S rename -k file_deletion

# Cargar reglas
augenrules --load
```

---

## Parte 3: Análisis de Logs

```bash
# Buscar cambios en /etc/passwd
ausearch -f /etc/passwd -i

# Ver comandos ejecutados como root
ausearch -ua 0 -sc execve -i

# Intentos de acceso fallidos
ausearch -m USER_LOGIN -sv no -ts today -i

# Reporte de autenticación
aureport --auth

# Reporte de archivos modificados
aureport -f
```

---

## Parte 4: Caso Práctico - Detectar Compromiso

**Escenario:** Usuario malicioso creó cuenta backdoor

```bash
# 1. Buscar cambios en passwd
ausearch -k passwd -ts today -i

# 2. Identificar proceso que modificó
# Output mostrará: uid=0 exe="/usr/sbin/useradd"

# 3. Ver comandos relacionados
ausearch -p PID -i

# 4. Timeline completo
ausearch -ts 10:00:00 -te 11:00:00 -i > timeline.txt
```

---

## Checklist

- [ ] auditd configurado y activo
- [ ] Reglas para archivos críticos
- [ ] Reglas para syscalls importantes
- [ ] ausearch funcionando
- [ ] aureport generando reportes
- [ ] Análisis forense de incidente simulado

🔐 **Compliance PCI-DSS 10.2 completado**
