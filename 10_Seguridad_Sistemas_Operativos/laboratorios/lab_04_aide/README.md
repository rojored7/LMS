# Laboratorio 04: File Integrity Monitoring con AIDE

## Objetivos

1. Configurar AIDE para monitoreo de integridad
2. Crear baseline de sistema
3. Detectar cambios no autorizados
4. Responder a alertas de modificación
5. Integrar con automatización (cron)

## Duración: 2 horas

---

## Parte 1: Instalación y Configuración

```bash
# Instalar AIDE
sudo apt install aide aide-common

# Configurar
sudo nano /etc/aide/aide.conf
```

```bash
# Reglas
NORMAL = p+i+n+u+g+s+m+c+md5+sha256

# Directorios críticos
/bin NORMAL
/sbin NORMAL
/usr/bin NORMAL
/usr/sbin NORMAL
/etc NORMAL
/boot NORMAL

# Web content
/var/www NORMAL

# Ignorar logs y temporales
!/var/log
!/tmp
!/var/tmp
```

---

## Parte 2: Crear Baseline

```bash
# Inicializar base de datos
sudo aideinit

# Mover a ubicación activa
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

---

## Parte 3: Verificar Integridad

```bash
# Simular modificación sospechosa
sudo nano /etc/ssh/sshd_config
# (Agregar línea: # TEST)

# Verificar
sudo aide --check

# Output mostrará:
# Changed entries:
# f = ....C.... : /etc/ssh/sshd_config
#   Mtime    : 2026-02-20 10:00:00  , 2026-02-22 15:30:00
#   SHA256   : abc123...  , def456...
```

---

## Parte 4: Actualizar Baseline (Cambios Legítimos)

```bash
# Tras cambios legítimos
sudo aide --update

# Mover nueva baseline
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

---

## Parte 5: Automatización

```bash
# Script de verificación diaria
sudo nano /etc/cron.daily/aide-check
```

```bash
#!/bin/bash
/usr/bin/aide --check | mail -s "AIDE Daily Report - $(hostname)" sysadmin@empresa.com
```

```bash
sudo chmod +x /etc/cron.daily/aide-check
```

---

## Parte 6: Caso Práctico - Rootkit Detection

```bash
# Simular archivo sospechoso
sudo touch /usr/bin/.hidden_backdoor

# Verificar con AIDE
sudo aide --check
# Warning: Added files:
#   added: /usr/bin/.hidden_backdoor

# Investigar
file /usr/bin/.hidden_backdoor
strings /usr/bin/.hidden_backdoor
lsof | grep hidden_backdoor
```

---

## Checklist

- [ ] AIDE instalado y configurado
- [ ] Baseline creada
- [ ] Verificación funcionando
- [ ] Cambios detectados correctamente
- [ ] Automatización con cron configurada
- [ ] Respuesta a incidente practicada

🔐 **File Integrity Monitoring activo**
