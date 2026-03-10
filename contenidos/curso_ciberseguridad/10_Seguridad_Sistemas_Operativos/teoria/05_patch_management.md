# Patch Management y Gestión de Vulnerabilidades

## Objetivos de Aprendizaje

1. Comprender el ciclo de vida de vulnerabilidades y parches
2. Implementar estrategias de patch management efectivas
3. Automatizar actualizaciones de seguridad
4. Gestionar actualizaciones de kernel sin downtime (live patching)
5. Realizar vulnerability assessment con herramientas profesionales
6. Implementar procesos de compliance (PCI-DSS, ISO 27001)

---

## 1. Fundamentos de Patch Management

### 1.1 ¿Por Qué es Crítico el Patch Management?

**Estadísticas:**
- 📊 **60%** de brechas de seguridad explotan vulnerabilidades conocidas con parches disponibles
- ⏱️ Tiempo promedio entre descubrimiento de vulnerabilidad y explotación masiva: **7-14 días**
- 🎯 **80%** de exploits exitosos usan vulnerabilidades con parches disponibles > 1 año

**Casos famosos:**
- **WannaCry (2017):** Explotó MS17-010 (EternalBlue) - parche disponible 2 meses antes
- **Equifax (2017):** Struts CVE-2017-5638 - parche disponible 2 meses antes, $700M en pérdidas
- **Log4Shell (2021):** CVE-2021-44228 - explotación en horas, afectó millones de sistemas

### 1.2 Ciclo de Vida de Vulnerabilidades

```
┌────────────────────────────────────────────────────────────────┐
│              Vulnerability Lifecycle                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. DISCOVERY          Investigador encuentra vulnerabilidad  │
│     │                                                          │
│     ▼                                                          │
│  2. DISCLOSURE         Responsable: Vendor notificado         │
│     │                  Irresponsable: Public disclosure       │
│     │                                                          │
│     ▼                                                          │
│  3. PATCH DEVELOPMENT  Vendor desarrolla parche               │
│     │                  Asigna CVE (Common Vulnerabilities     │
│     │                  and Exposures)                         │
│     │                                                          │
│     ▼                                                          │
│  4. PATCH RELEASE      Advisory publicado                     │
│     │                  Parche disponible                      │
│     │                  Exploit code puede publicarse (PoC)    │
│     │                                                          │
│     ▼                                                          │
│  5. TESTING            Organizaciones prueban parche          │
│     │                                                          │
│     ▼                                                          │
│  6. DEPLOYMENT         Parche aplicado a producción           │
│     │                                                          │
│     ▼                                                          │
│  7. VERIFICATION       Confirmar que vulnerabilidad fue       │
│                        mitigada                               │
│                                                                │
│  ⚠️  WINDOW OF EXPOSURE: Entre PATCH RELEASE y DEPLOYMENT     │
│      Este es el período MÁS CRÍTICO                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 1.3 Tipos de Parches

| Tipo | Descripción | Urgencia | Downtime |
|------|-------------|----------|----------|
| **Security Patch** | Corrige vulnerabilidades de seguridad | 🔴 CRÍTICA | Mínimo |
| **Bug Fix** | Corrige bugs funcionales (no seguridad) | 🟡 Media | Variable |
| **Feature Update** | Nueva funcionalidad | 🟢 Baja | Variable |
| **Kernel Update** | Actualización de kernel | 🔴 Alta | Reboot (o live patching) |
| **Package Update** | Actualización de paquetes (libraries) | 🟡 Media | Mínimo |

---

## 2. Gestión de Actualizaciones en Linux

### 2.1 Debian/Ubuntu (APT)

**Actualizar lista de paquetes:**
```bash
apt update
```

**Ver actualizaciones disponibles:**
```bash
apt list --upgradable

# Ver solo actualizaciones de seguridad
apt list --upgradable | grep -i security
```

**Instalar actualizaciones:**
```bash
# Todas las actualizaciones
apt upgrade

# Actualizaciones + manejo de dependencias (puede remover paquetes)
apt full-upgrade

# Solo actualizaciones de seguridad
unattended-upgrade --dry-run  # Test
unattended-upgrade
```

**Actualizar paquete específico:**
```bash
apt install --only-upgrade nginx
```

**Ver changelog de paquete:**
```bash
apt changelog nginx
```

### 2.2 RHEL/CentOS/Fedora (YUM/DNF)

**Actualizar lista de paquetes:**
```bash
dnf check-update
# o
yum check-update
```

**Ver actualizaciones de seguridad:**
```bash
dnf updateinfo list security
dnf updateinfo list --security

# Ver detalles de CVEs
dnf updateinfo info CVE-2023-12345
```

**Instalar actualizaciones:**
```bash
# Todas las actualizaciones
dnf upgrade

# Solo actualizaciones de seguridad
dnf upgrade --security

# Solo CVEs críticos
dnf upgrade --sec-severity=Critical
```

**Actualizar paquete específico:**
```bash
dnf upgrade nginx
```

### 2.3 Actualizaciones Automáticas

#### Debian/Ubuntu: unattended-upgrades

**Instalación:**
```bash
apt install unattended-upgrades apt-listchanges
```

**Configuración:**
```bash
# /etc/apt/apt.conf.d/50unattended-upgrades

Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    // "${distro_id}:${distro_codename}-updates";  // Descomentar para updates normales
};

// Paquetes a NO actualizar automáticamente
Unattended-Upgrade::Package-Blacklist {
    "nginx";        // Requiere testing manual
    "postgresql-*"; // Bases de datos críticas
};

// Actualizar automáticamente solo si no hay usuarios conectados
// Unattended-Upgrade::OnlyOnACPower "true";

// Reiniciar automáticamente si es necesario (CUIDADO)
Unattended-Upgrade::Automatic-Reboot "false";

// Reiniciar solo a ciertas horas
Unattended-Upgrade::Automatic-Reboot-Time "03:00";

// Reiniciar solo si no hay usuarios (útil para desktops)
Unattended-Upgrade::Automatic-Reboot-WithUsers "false";

// Enviar email con reporte
Unattended-Upgrade::Mail "sysadmin@empresa.com";
Unattended-Upgrade::MailReport "on-change";  // only-on-error, always, on-change

// Eliminar dependencias innecesarias
Unattended-Upgrade::Remove-Unused-Dependencies "true";

// Limpiar cache de paquetes antiguos
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";

// Logging
Unattended-Upgrade::SyslogEnable "true";
Unattended-Upgrade::SyslogFacility "daemon";
```

**Habilitar actualizaciones automáticas:**
```bash
# /etc/apt/apt.conf.d/20auto-upgrades

APT::Periodic::Update-Package-Lists "1";           # apt update diario
APT::Periodic::Download-Upgradeable-Packages "1";  # Descargar paquetes
APT::Periodic::AutocleanInterval "7";              # Limpiar cache cada 7 días
APT::Periodic::Unattended-Upgrade "1";             # Instalar automáticamente
```

**Testing manual:**
```bash
# Dry-run (ver qué se actualizaría)
unattended-upgrade --dry-run --debug

# Forzar ejecución
unattended-upgrade --debug
```

**Ver logs:**
```bash
cat /var/log/unattended-upgrades/unattended-upgrades.log
cat /var/log/unattended-upgrades/unattended-upgrades-dpkg.log
```

#### RHEL/CentOS: dnf-automatic

**Instalación:**
```bash
dnf install dnf-automatic
```

**Configuración:**
```bash
# /etc/dnf/automatic.conf

[commands]
# Qué hacer con las actualizaciones:
# download: Solo descargar
# apply: Descargar e instalar automáticamente
upgrade_type = security
# upgrade_type = default  # Todas las actualizaciones

download_updates = yes
apply_updates = yes

[emitters]
# Notificaciones
emit_via = email,motd

[email]
email_from = dnf-automatic@servidor.empresa.com
email_to = sysadmin@empresa.com
email_host = localhost

[base]
debuglevel = 1
```

**Habilitar servicio:**
```bash
# Aplicar actualizaciones automáticamente
systemctl enable --now dnf-automatic.timer

# O solo descargar (sin instalar)
systemctl enable --now dnf-automatic-download.timer

# Verificar status
systemctl status dnf-automatic.timer
systemctl list-timers *dnf*
```

---

## 3. Gestión de Kernel Updates

### 3.1 Proceso Tradicional (Requiere Reboot)

**Verificar kernel actual:**
```bash
uname -r
# 5.15.0-56-generic
```

**Actualizar kernel:**
```bash
# Debian/Ubuntu
apt install linux-image-generic

# RHEL/CentOS
dnf upgrade kernel
```

**Verificar kernels instalados:**
```bash
# Debian/Ubuntu
dpkg --list | grep linux-image

# RHEL/CentOS
rpm -qa | grep kernel
```

**Reiniciar:**
```bash
# Programar reboot para horario de mantenimiento
shutdown -r +60 "Reboot for kernel update in 1 hour"

# Cancelar si es necesario
shutdown -c

# Reboot inmediato
reboot
```

**Verificar nuevo kernel:**
```bash
uname -r
```

### 3.2 Live Kernel Patching (Sin Reboot)

#### Ubuntu: Canonical Livepatch

**Requisitos:** Ubuntu Pro subscription (gratis para uso personal, 5 máquinas)

**Instalación:**
```bash
# Obtener token en: https://ubuntu.com/pro
ubuntu-advantage attach TOKEN

# Habilitar livepatch
ua enable livepatch
```

**Verificar status:**
```bash
canonical-livepatch status
# client-version: "X.Y.Z"
# machine-id: ...
# architecture: x86_64
# cpu-model: ...
# last-check: 2026-02-22T10:15:30Z
# boot-time: 2026-01-15T08:00:00Z
# uptime: 38d 2h 15m
#
# Patch Status:
#   kernel: 5.15.0-56.62-generic
#   fully-patched: true
#   patchState: applied
```

**Ver parches aplicados:**
```bash
canonical-livepatch status --verbose
```

#### RHEL/CentOS: kpatch

**Instalación:**
```bash
# RHEL 8/9
dnf install kpatch kpatch-runtime

# Habilitar servicio
systemctl enable kpatch.service
```

**Aplicar parche:**
```bash
# Los parches vienen como RPMs
dnf install kpatch-patch-$(uname -r)

# Ver parches instalados
kpatch list

# Cargar parche
kpatch load /var/lib/kpatch/X.Y.Z/kpatch-X.Y.Z.ko

# Verificar
kpatch list
```

#### SUSE: kGraft

```bash
# Instalar
zypper install kgraft

# Ver parches disponibles
zypper se kgraft-patch

# Instalar parche
zypper in kgraft-patch-X_Y_Z-default
```

#### Alternativa Universal: KernelCare (Comercial)

**Ventajas:**
- ✅ Soporte para Debian, Ubuntu, RHEL, CentOS, Amazon Linux, etc.
- ✅ Parches automáticos sin intervención
- ✅ No requiere reboot NUNCA

**Instalación:**
```bash
wget -qq -O - https://repo.cloudlinux.com/kernelcare/kernelcare_install.sh | bash
```

---

## 4. Vulnerability Scanning

### 4.1 Lynis (Security Auditing)

**Instalación:**
```bash
# Debian/Ubuntu
apt install lynis

# RHEL/CentOS
yum install lynis

# O desde GitHub (última versión)
git clone https://github.com/CISOfy/lynis
cd lynis && ./lynis audit system
```

**Ejecutar auditoría:**
```bash
lynis audit system

# Con reporte detallado
lynis audit system --verbose

# Solo ciertas categorías
lynis audit system --tests-from-category security

# Salida en JSON (para automatización)
lynis audit system --output json > lynis-report.json
```

**Ver recomendaciones:**
```bash
grep Suggestion /var/log/lynis.log

# Warnings
grep Warning /var/log/lynis.log
```

**Interpretación de scores:**
```
Lynis security scan details:

  Hardening index : 72 [████████████████        ]
  Tests performed : 245
  Plugins enabled : 0

  - Security audit                     [OK]
  - File permissions                   [WARNING]
  - SSH configuration                  [SUGGESTION]

Hardening index:
< 50  : Pobre (acción inmediata requerida)
50-70 : Aceptable (mejoras necesarias)
70-85 : Bueno (algunas mejoras recomendadas)
> 85  : Excelente (mantener)
```

### 4.2 OpenSCAP (Compliance Scanning)

**Instalación:**
```bash
# Debian/Ubuntu
apt install libopenscap8 openscap-scanner scap-security-guide

# RHEL/CentOS
dnf install openscap-scanner scap-security-guide
```

**Perfiles disponibles:**
```bash
# Ver perfiles SCAP
oscap info /usr/share/xml/scap/ssg/content/ssg-ubuntu2004-ds.xml

# Perfiles comunes:
# - PCI-DSS
# - HIPAA
# - STIG (Security Technical Implementation Guide)
# - CIS Benchmark
```

**Ejecutar scan:**
```bash
# Scan con perfil PCI-DSS
oscap xccdf eval \
    --profile xccdf_org.ssgproject.content_profile_pci-dss \
    --results scan-results.xml \
    --report scan-report.html \
    /usr/share/xml/scap/ssg/content/ssg-ubuntu2004-ds.xml

# Ver reporte en navegador
firefox scan-report.html
```

**Remediation automática:**
```bash
# Generar script de remediación
oscap xccdf generate fix \
    --profile xccdf_org.ssgproject.content_profile_pci-dss \
    --output remediation.sh \
    scan-results.xml

# Revisar script (SIEMPRE revisar antes de ejecutar)
less remediation.sh

# Ejecutar remediación
bash remediation.sh
```

### 4.3 Vulnerability Scanners Profesionales

#### Nessus (Comercial)

**Uso:**
```bash
# Instalar Nessus
# Descargar desde: https://www.tenable.com/downloads/nessus

dpkg -i Nessus-X.Y.Z-debian10_amd64.deb
systemctl start nessusd

# Acceder a https://servidor:8834
# Configurar scan policies
# Ejecutar scans programados
```

#### OpenVAS (Open Source)

**Instalación:**
```bash
# Debian/Ubuntu
apt install openvas

# Configuración inicial
gvm-setup

# Iniciar servicios
gvm-start

# Acceder a https://servidor:9392
```

#### Qualys VMDR (Cloud)

**Instalación de agente:**
```bash
# Descargar instalador desde Qualys portal
dpkg -i qualys-cloud-agent.deb

# Activar
/usr/local/qualys/cloud-agent/bin/qualys-cloud-agent.sh ActivationId=XXXX CustomerId=YYYY
```

---

## 5. Estrategias de Patch Management

### 5.1 Modelo de 4 Fases

```
┌─────────────────────────────────────────────────────────────┐
│                  Patch Management Lifecycle                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FASE 1: DISCOVERY                                          │
│  ├─ Vulnerability scanning (semanal)                        │
│  ├─ Monitoring de security advisories                      │
│  ├─ CVE databases (NVD, vendor-specific)                   │
│  └─ Threat intelligence feeds                              │
│                                                             │
│  FASE 2: ASSESSMENT                                         │
│  ├─ Risk scoring (CVSS, EPSS)                              │
│  ├─ Asset criticality                                      │
│  ├─ Exploitability (exploit available?)                    │
│  └─ Priorización (Critical → High → Medium → Low)          │
│                                                             │
│  FASE 3: TESTING                                            │
│  ├─ DEV environment testing                                │
│  ├─ QA environment validation                              │
│  ├─ Performance impact assessment                          │
│  ├─ Rollback plan                                          │
│  └─ Change approval (CAB)                                  │
│                                                             │
│  FASE 4: DEPLOYMENT                                         │
│  ├─ Staging environment deployment                         │
│  ├─ Canary deployment (subset de producción)               │
│  ├─ Full production rollout                                │
│  ├─ Verification & monitoring                              │
│  └─ Documentation & reporting                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Priorización con CVSS

**CVSS (Common Vulnerability Scoring System):**

```
CVSS v3.1 Score Ranges:
┌──────────────┬─────────────┬──────────────┐
│ Severity     │ Score       │ SLA          │
├──────────────┼─────────────┼──────────────┤
│ CRITICAL     │ 9.0 - 10.0  │ 24-48 horas  │
│ HIGH         │ 7.0 - 8.9   │ 7 días       │
│ MEDIUM       │ 4.0 - 6.9   │ 30 días      │
│ LOW          │ 0.1 - 3.9   │ 90 días      │
└──────────────┴─────────────┴──────────────┘
```

**Factores adicionales:**

1. **EPSS (Exploit Prediction Scoring System):**
   - Probabilidad de explotación en próximos 30 días
   - Ejemplo: EPSS 95% → altísima prioridad

2. **Criticidad del activo:**
   - Producción > Staging > Dev
   - Público > Interno
   - PII/PCI data > Datos no sensibles

3. **Compensating controls:**
   - WAF filtrando exploit → menor urgencia
   - Firewall bloqueando puerto → menor urgencia

### 5.3 Patch Windows (Ventanas de Mantenimiento)

**Definir ventanas por criticidad:**

```bash
# Ejemplo: Empresa financiera

CRITICAL PATCHES:
- Deployment: Emergency (cualquier momento con aprobación C-level)
- Testing: Mínimo (solo smoke tests)
- Rollback: Plan obligatorio

HIGH PATCHES:
- Deployment: Weekly maintenance window (Sábados 2-4 AM)
- Testing: 24-48 horas en staging
- Rollback: Automatizado

MEDIUM/LOW PATCHES:
- Deployment: Monthly maintenance window (primer domingo del mes)
- Testing: 1 semana en staging
- Rollback: Standard procedure
```

**Implementación con maintenance mode:**

```bash
#!/bin/bash
# maintenance-mode.sh

# Activar modo mantenimiento
enable_maintenance() {
    # Nginx: Redirigir a página de mantenimiento
    ln -sf /etc/nginx/sites-available/maintenance /etc/nginx/sites-enabled/maintenance
    systemctl reload nginx

    # Notificar a monitoring
    curl -X POST "https://status.empresa.com/api/maintenance" -d '{"status": "active"}'

    # Bloquear nuevos logins
    touch /etc/nologin
    echo "Sistema en mantenimiento. Volvemos en 2 horas." > /etc/nologin
}

# Aplicar parches
apply_patches() {
    apt update
    apt upgrade -y

    # Si kernel fue actualizado
    if [ -f /var/run/reboot-required ]; then
        shutdown -r +5 "Reboot for kernel update in 5 minutes"
    fi
}

# Desactivar modo mantenimiento
disable_maintenance() {
    rm -f /etc/nologin
    rm -f /etc/nginx/sites-enabled/maintenance
    systemctl reload nginx

    curl -X POST "https://status.empresa.com/api/maintenance" -d '{"status": "completed"}'
}

# Ejecución
enable_maintenance
apply_patches
sleep 300  # Esperar 5 minutos para verificar estabilidad
disable_maintenance
```

---

## 6. Automatización con Ansible

### 6.1 Playbook de Patch Management

```yaml
# patch-management.yml

---
- name: Patch Management Automation
  hosts: all
  become: yes

  vars:
    patch_window: "2026-02-24 02:00:00"
    reboot_required: false

  tasks:
    - name: Check if patch window is open
      assert:
        that:
          - ansible_date_time.iso8601 >= patch_window
        fail_msg: "Outside of maintenance window"
      when: ansible_host != 'localhost'

    - name: Update apt cache (Debian/Ubuntu)
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Upgrade all packages (Debian/Ubuntu)
      apt:
        upgrade: dist
        autoremove: yes
        autoclean: yes
      register: apt_upgrade
      when: ansible_os_family == "Debian"

    - name: Upgrade all packages (RHEL/CentOS)
      dnf:
        name: '*'
        state: latest
        security: yes
      register: dnf_upgrade
      when: ansible_os_family == "RedHat"

    - name: Check if reboot is required (Debian/Ubuntu)
      stat:
        path: /var/run/reboot-required
      register: reboot_required_file
      when: ansible_os_family == "Debian"

    - name: Set reboot flag
      set_fact:
        reboot_required: true
      when: reboot_required_file.stat.exists | default(false)

    - name: Reboot if required
      reboot:
        msg: "Reboot initiated by Ansible for kernel updates"
        connect_timeout: 5
        reboot_timeout: 600
        pre_reboot_delay: 0
        post_reboot_delay: 30
        test_command: uptime
      when: reboot_required

    - name: Verify services are running post-reboot
      systemd:
        name: "{{ item }}"
        state: started
      loop:
        - sshd
        - nginx
        - postgresql
      when: reboot_required

    - name: Send notification
      mail:
        host: smtp.empresa.com
        to: sysadmin@empresa.com
        subject: "Patch Management: {{ inventory_hostname }}"
        body: |
          Server: {{ inventory_hostname }}
          Patches applied: {{ apt_upgrade.changed | default(dnf_upgrade.changed) }}
          Reboot required: {{ reboot_required }}
          Date: {{ ansible_date_time.iso8601 }}
      delegate_to: localhost
```

**Ejecutar playbook:**
```bash
# Dry-run
ansible-playbook patch-management.yml --check

# Ejecutar en servidores staging
ansible-playbook patch-management.yml --limit staging

# Ejecutar en producción
ansible-playbook patch-management.yml --limit production
```

---

## 7. Compliance y Reporting

### 7.1 PCI-DSS Requirements

**Requirement 6.2:** Ensure all system components and software are protected from known vulnerabilities by installing applicable vendor-supplied security patches.

**Implementación:**
```bash
# Script mensual de compliance
#!/bin/bash
# pci-dss-compliance-check.sh

REPORT_FILE="/var/compliance/pci-dss-$(date +%Y%m).txt"

echo "PCI-DSS 6.2 Compliance Report - $(date)" > $REPORT_FILE
echo "=======================================" >> $REPORT_FILE

# 1. Verificar actualizaciones pendientes
echo "\n1. Pending Security Updates:" >> $REPORT_FILE
apt list --upgradable 2>/dev/null | grep -i security >> $REPORT_FILE

# 2. Último patch aplicado
echo "\n2. Last Patch Applied:" >> $REPORT_FILE
grep "install" /var/log/dpkg.log | tail -10 >> $REPORT_FILE

# 3. Kernel version (debe ser última stable)
echo "\n3. Kernel Version:" >> $REPORT_FILE
uname -r >> $REPORT_FILE

# 4. Critical CVEs pendientes
echo "\n4. Critical CVEs:" >> $REPORT_FILE
lynis audit system 2>/dev/null | grep CVE >> $REPORT_FILE

# 5. Compliance status
PENDING=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
if [ $PENDING -eq 0 ]; then
    echo "\n✓ COMPLIANT: No pending security updates" >> $REPORT_FILE
else
    echo "\n✗ NON-COMPLIANT: $PENDING security updates pending" >> $REPORT_FILE
fi

# Enviar a compliance team
mail -s "PCI-DSS 6.2 Report - $(hostname)" compliance@empresa.com < $REPORT_FILE
```

### 7.2 Patch Management Dashboard

**Exportar datos para dashboard (Grafana/Kibana):**

```bash
# prometheus-node-exporter custom metrics

# /var/lib/node_exporter/textfile_collector/patches.prom
cat > /var/lib/node_exporter/textfile_collector/patches.prom <<EOF
# HELP node_pending_updates Number of pending updates
# TYPE node_pending_updates gauge
node_pending_updates{severity="critical"} $(apt list --upgradable 2>/dev/null | grep -i security | grep -i critical | wc -l)
node_pending_updates{severity="high"} $(apt list --upgradable 2>/dev/null | grep -i security | wc -l)

# HELP node_last_patch_epoch Timestamp of last patch
# TYPE node_last_patch_epoch gauge
node_last_patch_epoch $(stat -c %Y /var/log/dpkg.log)

# HELP node_reboot_required Reboot required (1=yes, 0=no)
# TYPE node_reboot_required gauge
node_reboot_required $([ -f /var/run/reboot-required ] && echo 1 || echo 0)
EOF
```

---

## 8. Rollback Procedures

### 8.1 Snapshots (LVM)

**Antes de parchar:**
```bash
# Crear snapshot de volumen root
lvcreate -L 10G -s -n root_snapshot /dev/vg0/root

# Verificar
lvdisplay /dev/vg0/root_snapshot
```

**Si parche causa problemas:**
```bash
# Revertir a snapshot
lvconvert --merge /dev/vg0/root_snapshot

# Reboot
reboot

# Después del reboot, snapshot se habrá fusionado con original
```

### 8.2 Rollback de Paquetes

**Debian/Ubuntu:**
```bash
# Ver historial de paquetes instalados
grep "install" /var/log/dpkg.log

# Downgrade a versión anterior (si está en cache)
apt install nginx=1.18.0-0ubuntu1.2

# Si no está en cache, descargar manualmente
apt-cache policy nginx  # Ver versiones disponibles
```

**RHEL/CentOS:**
```bash
# Ver historial
dnf history

# Rollback última transacción
dnf history undo last

# Rollback a ID específico
dnf history undo 42

# Downgrade paquete
dnf downgrade nginx
```

---

## 9. Mejores Prácticas

### 9.1 Checklist de Patch Management

- [ ] ✅ Inventario completo de assets
- [ ] ✅ Vulnerability scanning automatizado (semanal)
- [ ] ✅ Proceso de priorización basado en CVSS + criticidad
- [ ] ✅ Ambientes separados (Dev → QA → Staging → Prod)
- [ ] ✅ Testing obligatorio antes de producción
- [ ] ✅ Rollback plan para cada parche crítico
- [ ] ✅ Snapshots/backups antes de parchar
- [ ] ✅ Automatización con Ansible/Chef/Puppet
- [ ] ✅ Monitoring post-patch (24-48 horas)
- [ ] ✅ Documentación de cada deployment
- [ ] ✅ Reporting mensual para compliance

### 9.2 SLAs Recomendados

```
┌─────────────────┬─────────────┬─────────────┬─────────────┐
│ Severity        │ Testing     │ Deployment  │ SLA         │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ CRITICAL (CVSS  │ 4-12 horas  │ Emergency   │ 24-48 horas │
│ 9.0-10.0) con   │ (smoke test)│ deployment  │             │
│ exploit activo  │             │             │             │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ HIGH (CVSS      │ 24-48 horas │ Weekly      │ 7 días      │
│ 7.0-8.9)        │             │ window      │             │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ MEDIUM (CVSS    │ 1 semana    │ Monthly     │ 30 días     │
│ 4.0-6.9)        │             │ window      │             │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ LOW (CVSS       │ 2 semanas   │ Quarterly   │ 90 días     │
│ 0.1-3.9)        │             │             │             │
└─────────────────┴─────────────┴─────────────┴─────────────┘
```

### 9.3 Testing Checklist

**Pre-Deployment:**
- [ ] Backup completo
- [ ] Snapshot de VMs
- [ ] Rollback plan documentado
- [ ] Change ticket aprobado
- [ ] Stakeholders notificados

**Post-Deployment:**
- [ ] Servicios críticos funcionando
- [ ] Logs sin errores anómalos
- [ ] Performance normal (CPU, RAM, I/O)
- [ ] Security scan post-patch
- [ ] Monitoreo activo 24-48 horas

---

## 10. Recursos y Fuentes de Información

### 10.1 CVE Databases

- **NVD (National Vulnerability Database):** https://nvd.nist.gov/
- **CVE MITRE:** https://cve.mitre.org/
- **Exploit-DB:** https://www.exploit-db.com/
- **CISA Known Exploited Vulnerabilities:** https://www.cisa.gov/known-exploited-vulnerabilities-catalog

### 10.2 Security Advisories

**Vendor-specific:**
- Debian Security Tracker: https://security-tracker.debian.org/
- Ubuntu Security Notices: https://ubuntu.com/security/notices
- Red Hat Security Advisories: https://access.redhat.com/security/
- SUSE Security: https://www.suse.com/support/security/

**General:**
- US-CERT Alerts: https://www.cisa.gov/uscert/ncas/alerts
- SANS Internet Storm Center: https://isc.sans.edu/

### 10.3 Threat Intelligence

- AlienVault OTX: https://otx.alienvault.com/
- MISP Threat Sharing: https://www.misp-project.org/
- Cisco Talos: https://talosintelligence.com/

---

## Conclusión

El **patch management** efectivo es la defensa MÁS IMPORTANTE contra ciberataques. La mayoría de brechas explotan vulnerabilidades conocidas con parches disponibles.

**Principios clave:**
1. **Automatización:** Reduce tiempo de respuesta
2. **Testing:** Evita downtime por parches defectuosos
3. **Priorización:** No todos los parches son iguales
4. **Compliance:** Documenta todo para auditorías
5. **Monitoreo continuo:** Vulnerability scanning 24/7

🔐 **"Patch fast, patch often, but patch wisely"** - Balance entre seguridad y estabilidad.
