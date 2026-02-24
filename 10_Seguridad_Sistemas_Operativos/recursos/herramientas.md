# Herramientas - Seguridad en Sistemas Operativos

## Top 10 Herramientas Esenciales

### 1. **SELinux Tools**
- **Propósito**: Mandatory Access Control
- **Comandos**: `semanage`, `restorecon`, `audit2allow`, `sealert`
- **Plataforma**: RHEL, CentOS, Fedora
- **Licencia**: GPL
- **URL**: https://github.com/SELinuxProject

### 2. **AppArmor**
- **Propósito**: MAC basado en rutas
- **Comandos**: `aa-enforce`, `aa-complain`, `aa-logprof`
- **Plataforma**: Ubuntu, Debian, SUSE
- **Licencia**: GPL
- **URL**: https://gitlab.com/apparmor/apparmor

### 3. **OpenSSH**
- **Propósito**: Acceso remoto seguro
- **Comandos**: `ssh`, `sshd`, `ssh-keygen`, `ssh-copy-id`
- **Plataforma**: Todas las distros Linux
- **Licencia**: BSD
- **URL**: https://www.openssh.com/

### 4. **Auditd (Linux Audit)**
- **Propósito**: Auditoría a nivel kernel
- **Comandos**: `auditctl`, `ausearch`, `aureport`
- **Plataforma**: Todas las distros Linux
- **Licencia**: GPL
- **URL**: https://github.com/linux-audit/audit-userspace

### 5. **AIDE (Advanced Intrusion Detection Environment)**
- **Propósito**: File Integrity Monitoring
- **Comandos**: `aide`, `aideinit`
- **Plataforma**: Todas las distros Linux
- **Licencia**: GPL
- **URL**: https://aide.github.io/

### 6. **Fail2Ban**
- **Propósito**: Prevención de brute force
- **Comandos**: `fail2ban-client`
- **Plataforma**: Todas las distros Linux
- **Licencia**: GPL
- **URL**: https://www.fail2ban.org/

### 7. **Lynis**
- **Propósito**: Security auditing
- **Comandos**: `lynis audit system`
- **Plataforma**: Todas las distros Linux
- **Licencia**: GPL
- **URL**: https://cisofy.com/lynis/

### 8. **rkhunter (Rootkit Hunter)**
- **Propósito**: Detección de rootkits
- **Comandos**: `rkhunter --check`
- **Plataforma**: Todas las distros Linux
- **Licencia**: GPL
- **URL**: http://rkhunter.sourceforge.net/

### 9. **Wazuh / OSSEC**
- **Propósito**: Host-based IDS
- **Comandos**: `wazuh-control`, `ossec-control`
- **Plataforma**: Todas las distros Linux
- **Licencia**: GPL
- **URL**: https://wazuh.com/

### 10. **OpenSCAP**
- **Propósito**: Compliance scanning
- **Comandos**: `oscap`
- **Plataforma**: RHEL, CentOS, Fedora
- **Licencia**: LGPL
- **URL**: https://www.open-scap.org/

---

## Herramientas de Hardening

### **Bastille Linux**
- Hardening automatizado de servidores
- URL: http://bastille-linux.sourceforge.net/

### **Lynis**
- Security auditing y hardening
- Genera reporte con recomendaciones
- URL: https://cisofy.com/lynis/

### **CIS-CAT Pro/Lite**
- Validación contra CIS Benchmarks
- URL: https://www.cisecurity.org/

---

## Herramientas de Monitoreo

### **Osquery**
- SQL para queries de sistema operativo
- Cross-platform monitoring
- URL: https://osquery.io/

### **Sysdig**
- Container y system troubleshooting
- Performance y security
- URL: https://sysdig.com/

### **Auditbeat (Elastic)**
- Ship audit logs to Elasticsearch
- URL: https://www.elastic.co/beats/auditbeat

---

## Herramientas de Testing

### **ssh-audit**
- Auditoría de configuración SSH
- Detecta algoritmos débiles
- URL: https://github.com/jtesta/ssh-audit

### **Nmap**
- Port scanning y OS detection
- URL: https://nmap.org/

### **OpenVAS**
- Vulnerability scanning
- URL: https://www.openvas.org/

---

## Herramientas Forenses

### **The Sleuth Kit**
- Análisis forense de discos
- URL: https://www.sleuthkit.org/

### **Volatility**
- Memory forensics
- URL: https://www.volatilityfoundation.org/

### **chkrootkit**
- Detección de rootkits
- URL: http://www.chkrootkit.org/

---

## Gestores de Configuración (Automatización)

### **Ansible**
- Automation platform
- URL: https://www.ansible.com/

### **Puppet**
- Configuration management
- URL: https://puppet.com/

### **Chef**
- Infrastructure as Code
- URL: https://www.chef.io/

---

## Herramientas Cloud

### **ScoutSuite**
- Multi-cloud security auditing
- URL: https://github.com/nccgroup/ScoutSuite

### **Prowler**
- AWS security assessment
- URL: https://github.com/prowler-cloud/prowler

---

## Recursos de Instalación

```bash
# Debian/Ubuntu
sudo apt install selinux-utils apparmor-utils openssh-server auditd aide fail2ban lynis rkhunter wazuh-agent

# RHEL/CentOS
sudo dnf install selinux-policy-targeted openssh-server audit aide fail2ban lynis rkhunter

# Tools universales (Python)
pip install ansible osquery
```

🔧 **Mantén tus herramientas actualizadas - Security bugs se parchean constantemente**
