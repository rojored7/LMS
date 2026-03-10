# HIDS: Host-based Intrusion Detection Systems

## Objetivos de Aprendizaje

1. Comprender diferencias entre HIDS, NIDS y SIEM
2. Instalar y configurar OSSEC/Wazuh
3. Implementar detección de rootkits con Rootkit Hunter y chkrootkit
4. Configurar File Integrity Monitoring (FIM) con AIDE
5. Crear reglas personalizadas de detección
6. Integrar HIDS con SIEM para correlación de eventos
7. Responder a alertas de intrusión

---

## 1. Fundamentos de Detección de Intrusiones

### 1.1 HIDS vs NIDS vs SIEM

```
┌──────────────────────────────────────────────────────────────┐
│                     Security Monitoring Stack                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               SIEM (Security Information            │    │
│  │            and Event Management)                    │    │
│  │  - Correlación de eventos multi-fuente              │    │
│  │  - Análisis de comportamiento                       │    │
│  │  - Dashboards y reporting                           │    │
│  │  Ejemplos: Splunk, ELK, QRadar, Sentinel           │    │
│  └─────────────────┬───────────────────────────────────┘    │
│                    │ Consume logs de:                       │
│         ┌──────────┴──────────┬──────────────┐             │
│         ▼                     ▼              ▼             │
│  ┌─────────────┐      ┌─────────────┐  ┌─────────────┐    │
│  │    HIDS     │      │    NIDS     │  │  Firewall   │    │
│  │ (Host-based)│      │(Network-bas)│  │    Logs     │    │
│  ├─────────────┤      ├─────────────┤  └─────────────┘    │
│  │ • File      │      │ • Traffic   │                      │
│  │   integrity │      │   analysis  │                      │
│  │ • Log       │      │ • Signature │                      │
│  │   analysis  │      │   matching  │                      │
│  │ • Rootkit   │      │ • Anomaly   │                      │
│  │   detection │      │   detection │                      │
│  │ • Process   │      │             │                      │
│  │   monitoring│      │ Ejemplos:   │                      │
│  │             │      │ Snort,      │                      │
│  │ Ejemplos:   │      │ Suricata,   │                      │
│  │ OSSEC,      │      │ Zeek        │                      │
│  │ Wazuh,      │      │             │                      │
│  │ AIDE        │      │             │                      │
│  └─────────────┘      └─────────────┘                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 ¿Cuándo Usar HIDS?

**Ventajas de HIDS:**
- ✅ Detecta ataques que NIDS no ve (tráfico cifrado, USB, consola física)
- ✅ Visibilidad de cambios en archivos críticos
- ✅ Detección de rootkits y malware local
- ✅ Correlación de eventos de sistema operativo
- ✅ Cumplimiento de regulaciones (PCI-DSS 10.6, 11.5)

**Limitaciones:**
- ❌ Sobrecarga en host (CPU, disco)
- ❌ No detecta ataques de red antes de llegar al host
- ❌ Puede ser deshabilitado por atacante con privilegios

**Solución:** Usar HIDS + NIDS + SIEM (defensa en profundidad)

---

## 2. OSSEC/Wazuh

### 2.1 Arquitectura de OSSEC

```
┌─────────────────────────────────────────────────────────────┐
│                    OSSEC/Wazuh Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Wazuh Manager (Server)              │      │
│  │                                                  │      │
│  │  ┌──────────────┐  ┌──────────────┐            │      │
│  │  │  Analysis    │  │   Rules      │            │      │
│  │  │  Engine      │  │  & Decoders  │            │      │
│  │  └──────┬───────┘  └──────┬───────┘            │      │
│  │         │                 │                     │      │
│  │  ┌──────▼─────────────────▼───────┐            │      │
│  │  │     Active Response             │            │      │
│  │  │  (firewall blocks, scripts)     │            │      │
│  │  └─────────────────────────────────┘            │      │
│  │                                                  │      │
│  │  ┌─────────────────────────────────┐            │      │
│  │  │        Alerts / Logs            │            │      │
│  │  └──────┬──────────────────────────┘            │      │
│  │         │                                        │      │
│  └─────────┼────────────────────────────────────────┘      │
│            │                                               │
│            │ Alerts to:                                    │
│            ├──► Wazuh Dashboard (Kibana)                   │
│            ├──► SIEM (Splunk, QRadar)                      │
│            └──► Email / Slack / PagerDuty                  │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │  Wazuh Agent        │  │  Wazuh Agent        │         │
│  │  (Linux)            │  │  (Windows)          │         │
│  ├─────────────────────┤  ├─────────────────────┤         │
│  │ • Log collector     │  │ • Log collector     │         │
│  │ • FIM (File         │  │ • FIM (File         │         │
│  │   Integrity)        │  │   Integrity)        │         │
│  │ • Rootkit detection │  │ • Registry monitor  │         │
│  │ • Syscollector      │  │ • Syscollector      │         │
│  │ • Command monitor   │  │ • Command monitor   │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Instalación de Wazuh

**Wazuh Manager (Servidor Central):**

```bash
# Instalación all-in-one (Manager + Indexer + Dashboard)
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
curl -sO https://packages.wazuh.com/4.7/config.yml

# Editar config.yml con IPs de tus servidores
nano config.yml

# Ejecutar instalador
bash wazuh-install.sh --wazuh-indexer node-1
bash wazuh-install.sh --wazuh-server wazuh-1
bash wazuh-install.sh --wazuh-dashboard dashboard

# Extraer password de admin
tar -xvf wazuh-install-files.tar
```

**Wazuh Agent (En cada servidor a monitorear):**

```bash
# Debian/Ubuntu
wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.0-1_amd64.deb
WAZUH_MANAGER="192.168.1.100" dpkg -i wazuh-agent_4.7.0-1_amd64.deb

# RHEL/CentOS
wget https://packages.wazuh.com/4.x/yum/wazuh-agent-4.7.0-1.x86_64.rpm
WAZUH_MANAGER="192.168.1.100" rpm -ihv wazuh-agent-4.7.0-1.x86_64.rpm

# Iniciar agente
systemctl daemon-reload
systemctl enable wazuh-agent
systemctl start wazuh-agent

# Verificar conexión
/var/ossec/bin/agent_control -l
```

**Acceder a Dashboard:**
```
https://wazuh-dashboard-ip:443
Usuario: admin
Contraseña: (la extraída de wazuh-install-files.tar)
```

### 2.3 Configuración de Wazuh Agent

```xml
<!-- /var/ossec/etc/ossec.conf (en el agente) -->

<ossec_config>
  <!-- Cliente -->
  <client>
    <server>
      <address>192.168.1.100</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>

    <config-profile>centos, centos8</config-profile>
    <notify_time>10</notify_time>
    <time-reconnect>60</time-reconnect>

    <!-- Auto-restart si se detiene -->
    <auto_restart>yes</auto_restart>
  </client>

  <!-- Logs a monitorear -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/messages</location>
  </localfile>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/secure</location>
  </localfile>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/audit/audit.log</location>
  </localfile>

  <!-- Logs de Apache -->
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/httpd/access_log</location>
  </localfile>

  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/httpd/error_log</location>
  </localfile>

  <!-- Logs de SSH -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>

  <!-- File Integrity Monitoring -->
  <syscheck>
    <disabled>no</disabled>

    <!-- Frecuencia de escaneo (segundos) -->
    <frequency>43200</frequency> <!-- 12 horas -->

    <!-- Directorios a monitorear -->
    <directories check_all="yes" realtime="yes">/etc,/usr/bin,/usr/sbin</directories>
    <directories check_all="yes" realtime="yes">/bin,/sbin</directories>
    <directories check_all="yes" realtime="yes">/boot</directories>

    <!-- Web server directories -->
    <directories check_all="yes" realtime="yes">/var/www</directories>

    <!-- Ignorar ciertos archivos/directorios -->
    <ignore>/etc/mtab</ignore>
    <ignore>/etc/mnttab</ignore>
    <ignore>/etc/hosts.deny</ignore>
    <ignore>/etc/mail/statistics</ignore>
    <ignore>/etc/random-seed</ignore>
    <ignore>/etc/adjtime</ignore>
    <ignore>/etc/prelink.cache</ignore>

    <!-- No alertar sobre cambios en archivos temporales -->
    <ignore type="sregex">.log$|.swp$</ignore>

    <!-- Opciones de chequeo -->
    <!-- check_all = check_sum + check_sha1sum + check_md5sum + check_size + check_owner + check_group + check_perm + check_mtime + check_inode -->

    <!-- Alerta en cambios de registry (Windows) -->
    <!-- <windows_registry>HKEY_LOCAL_MACHINE\Software</windows_registry> -->
  </syscheck>

  <!-- Rootkit detection -->
  <rootcheck>
    <disabled>no</disabled>

    <!-- Escaneo cada 12 horas -->
    <frequency>43200</frequency>

    <rootkit_files>/var/ossec/etc/shared/rootkit_files.txt</rootkit_files>
    <rootkit_trojans>/var/ossec/etc/shared/rootkit_trojans.txt</rootkit_trojans>

    <system_audit>/var/ossec/etc/shared/system_audit_rcl.txt</system_audit>
    <system_audit>/var/ossec/etc/shared/cis_debian_linux_rcl.txt</system_audit>
  </rootcheck>

  <!-- Active response (bloqueo automático) -->
  <active-response>
    <disabled>no</disabled>
    <ca_store>/var/ossec/etc/wpk_root.pem</ca_store>
  </active-response>

  <!-- System inventory (hardware, packages, procesos) -->
  <wodle name="syscollector">
    <disabled>no</disabled>
    <interval>1h</interval>
    <scan_on_start>yes</scan_on_start>
    <hardware>yes</hardware>
    <os>yes</os>
    <network>yes</network>
    <packages>yes</packages>
    <ports all="no">yes</ports>
    <processes>yes</processes>
  </wodle>

  <!-- Vulnerability detection -->
  <wodle name="vulnerability-detector">
    <disabled>no</disabled>
    <interval>1d</interval>
    <run_on_start>yes</run_on_start>
    <feed name="ubuntu-20">
      <disabled>no</disabled>
      <update_interval>1h</update_interval>
    </feed>
  </wodle>

  <!-- Command monitoring (ejecutar comandos periódicamente) -->
  <wodle name="command">
    <disabled>no</disabled>
    <command>df -h</command>
    <interval>5m</interval>
    <tag>disk_space</tag>
    <timeout>30</timeout>
  </wodle>

</ossec_config>
```

**Reiniciar agente:**
```bash
systemctl restart wazuh-agent
```

### 2.4 Reglas Personalizadas de Wazuh

**Ubicación de reglas:** `/var/ossec/etc/rules/local_rules.xml` (en el Manager)

```xml
<!-- local_rules.xml -->

<group name="local,syslog,sshd,">

  <!-- Alerta en login exitoso de root vía SSH -->
  <rule id="100001" level="5">
    <if_sid>5501</if_sid>
    <user>root</user>
    <description>Successful root login via SSH</description>
  </rule>

  <!-- Alerta CRÍTICA: Múltiples fallos SSH desde misma IP -->
  <rule id="100002" level="10" frequency="5" timeframe="300">
    <if_matched_sid>5710</if_matched_sid>
    <description>Multiple SSH authentication failures from same source IP</description>
    <group>authentication_failures,pci_dss_10.2.4,pci_dss_10.2.5,</group>
  </rule>

  <!-- Alerta: Usuario agregado al grupo sudo -->
  <rule id="100003" level="8">
    <if_sid>5901</if_sid>
    <match>usermod</match>
    <match>sudo|wheel</match>
    <description>User added to sudo/wheel group</description>
    <group>privilege_escalation,</group>
  </rule>

  <!-- Alerta: Cambios en /etc/passwd -->
  <rule id="100004" level="12">
    <if_sid>550</if_sid>
    <match>/etc/passwd</match>
    <description>Critical file /etc/passwd modified</description>
    <group>file_integrity,pci_dss_10.6.1,</group>
  </rule>

  <!-- Alerta: Descarga sospechosa con wget/curl -->
  <rule id="100005" level="7">
    <if_sid>2501</if_sid>
    <match>wget|curl</match>
    <description>Suspicious download activity detected</description>
    <group>recon,</group>
  </rule>

  <!-- Alerta: Cambios en authorized_keys SSH -->
  <rule id="100006" level="10">
    <if_sid>550</if_sid>
    <match>authorized_keys</match>
    <description>SSH authorized_keys file modified</description>
    <group>file_integrity,backdoor,pci_dss_10.2.7,</group>
  </rule>

  <!-- Alerta: Cron job modificado -->
  <rule id="100007" level="8">
    <if_sid>550</if_sid>
    <match>/etc/cron</match>
    <description>Cron configuration modified (possible persistence)</description>
    <group>file_integrity,persistence,</group>
  </rule>

  <!-- Alerta: Módulo del kernel cargado -->
  <rule id="100008" level="9">
    <decoded_as>syslog</decoded_as>
    <match>insmod|modprobe</match>
    <description>Kernel module loaded (potential rootkit)</description>
    <group>rootkit,</group>
  </rule>

  <!-- Alerta: Múltiples comandos de reconnaissance -->
  <rule id="100009" level="6" frequency="10" timeframe="60">
    <if_sid>2501</if_sid>
    <match>whoami|id|hostname|uname|ifconfig|ip addr</match>
    <description>Multiple reconnaissance commands executed</description>
    <group>recon,enumeration,</group>
  </rule>

  <!-- Alerta: Espacio en disco bajo -->
  <rule id="100010" level="7">
    <if_sid>530</if_sid>
    <match>disk_space</match>
    <regex>9[0-9]%|100%</regex>
    <description>Disk space above 90%</description>
    <group>system_health,</group>
  </rule>

</group>
```

**Cargar reglas:**
```bash
# En el manager
/var/ossec/bin/ossec-control restart
```

### 2.5 Active Response (Respuesta Automática)

**Configuración en Manager:**

```xml
<!-- /var/ossec/etc/ossec.conf (Manager) -->

<ossec_config>
  <!-- Comandos de active response -->
  <command>
    <name>firewall-drop</name>
    <executable>firewall-drop</executable>
    <timeout_allowed>yes</timeout_allowed>
  </command>

  <command>
    <name>host-deny</name>
    <executable>host-deny</executable>
    <timeout_allowed>yes</timeout_allowed>
  </command>

  <command>
    <name>restart-wazuh</name>
    <executable>restart-wazuh</executable>
  </command>

  <!-- Active responses -->
  <active-response>
    <!-- Bloquear IP tras 5 fallos SSH en 5 minutos -->
    <command>firewall-drop</command>
    <location>local</location>
    <rules_id>100002</rules_id>
    <timeout>600</timeout> <!-- Bloquear por 10 minutos -->
  </active-response>

  <active-response>
    <!-- Agregar a hosts.deny tras múltiples fallos -->
    <command>host-deny</command>
    <location>local</location>
    <level>10</level>
    <timeout>86400</timeout> <!-- 24 horas -->
  </active-response>

  <!-- Response solo en ciertos agentes -->
  <active-response>
    <command>firewall-drop</command>
    <location>defined-agent</location>
    <agent_id>001,002,003</agent_id>
    <level>12</level>
    <timeout>0</timeout> <!-- Permanente (hasta desbloqueo manual) -->
  </active-response>

</ossec_config>
```

**Scripts personalizados de active response:**

```bash
# /var/ossec/active-response/bin/custom-block.sh

#!/bin/bash
# Custom active response script

ACTION=$1
USER=$2
IP=$3
ALERTID=$4
RULEID=$5

# Logging
LOCAL=`dirname $0`;
cd $LOCAL
cd ../
PWD=`pwd`
echo "`date` $0 $1 $2 $3 $4 $5" >> ${PWD}/../logs/active-responses.log

# Acción
if [ "x${ACTION}" = "xadd" ]; then
    # Bloquear IP en firewall
    iptables -I INPUT -s ${IP} -j DROP
    echo "${IP} blocked at `date`" >> ${PWD}/../logs/custom-blocks.log

    # Notificar a Slack
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
        -d "{\"text\": \"⚠️ IP ${IP} blocked due to alert ${ALERTID} (Rule ${RULEID})\"}"

elif [ "x${ACTION}" = "xdelete" ]; then
    # Desbloquear IP
    iptables -D INPUT -s ${IP} -j DROP
    echo "${IP} unblocked at `date`" >> ${PWD}/../logs/custom-blocks.log
fi

exit 0
```

**Agregar a ossec.conf:**
```xml
<command>
  <name>custom-block</name>
  <executable>custom-block.sh</executable>
  <timeout_allowed>yes</timeout_allowed>
</command>

<active-response>
  <command>custom-block</command>
  <location>local</location>
  <level>12</level>
  <timeout>3600</timeout>
</active-response>
```

---

## 3. File Integrity Monitoring (FIM)

### 3.1 AIDE (Advanced Intrusion Detection Environment)

**Instalación:**
```bash
apt install aide aide-common
```

**Configuración:**
```bash
# /etc/aide/aide.conf

# Selección de atributos a verificar:
# p: permissions
# i: inode
# n: number of links
# u: user
# g: group
# s: size
# m: mtime
# c: ctime
# S: check for growing size
# md5: md5 checksum
# sha256: SHA256 checksum

# Reglas predefinidas
NORMAL = p+i+n+u+g+s+m+c+md5+sha256
DIR = p+i+n+u+g

# Directorios a monitorear
/bin NORMAL
/sbin NORMAL
/usr/bin NORMAL
/usr/sbin NORMAL
/lib NORMAL
/lib64 NORMAL
/etc NORMAL

# Configuraciones críticas
/etc/ssh/sshd_config NORMAL
/etc/passwd NORMAL
/etc/shadow NORMAL
/etc/group NORMAL

# Web server
/var/www NORMAL

# Ignorar archivos temporales y logs
!/var/log
!/tmp
!/var/tmp
!/var/cache

# Ignorar archivos que cambian frecuentemente
!/etc/mtab
!/etc/adjtime
```

**Inicializar base de datos:**
```bash
# Primera ejecución: crear baseline
aideinit

# Esto crea /var/lib/aide/aide.db.new
# Mover a aide.db
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

**Verificar integridad:**
```bash
# Verificar contra baseline
aide --check

# Output ejemplo:
# Start timestamp: 2026-02-22 10:15:30
# AIDE found differences between database and filesystem!!
#
# Changed entries:
# f = ....C.... : /etc/ssh/sshd_config
#   Mtime    : 2026-02-20 10:00:00  , 2026-02-22 09:30:00
#   Ctime    : 2026-02-20 10:00:00  , 2026-02-22 09:30:00
#   SHA256   : abc123...  , def456...
```

**Actualizar baseline (tras cambios legítimos):**
```bash
aide --update

# Esto crea nuevo aide.db.new
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

**Automatizar con cron:**
```bash
# /etc/cron.daily/aide-check
#!/bin/bash

/usr/bin/aide --check | mail -s "AIDE Daily Report - $(hostname)" sysadmin@empresa.com

exit 0
```

### 3.2 Tripwire (Alternativa Comercial/Open Source)

```bash
# Instalación
apt install tripwire

# Configuración inicial (genera claves)
tripwire-setup-keyfiles

# Inicializar base de datos
tripwire --init

# Verificar integridad
tripwire --check

# Actualizar base de datos
tripwire --update --accept-all
```

---

## 4. Detección de Rootkits

### 4.1 rkhunter (Rootkit Hunter)

**Instalación:**
```bash
apt install rkhunter
```

**Configuración:**
```bash
# /etc/rkhunter.conf

# Actualizar propfile (base de datos local)
UPDATE_MIRRORS=1
MIRRORS_MODE=0

# Email de alertas
MAIL-ON-WARNING=sysadmin@empresa.com
MAIL_CMD=mail -s "[rkhunter] Warnings on \$(hostname)"

# Tests a ejecutar
ENABLE_TESTS=all

# Ignorar warnings específicos (después de verificar que son falsos positivos)
# SCRIPTWHITELIST=/usr/bin/lwp-request
# SCRIPTWHITELIST=/usr/bin/GET

# Permitir hidden directories conocidos
ALLOWHIDDENDIR=/dev/.udev
ALLOWHIDDENDIR=/dev/.static
ALLOWHIDDENDIR=/dev/.initramfs

# Ports permitidos
ALLOWPROMISC=/usr/sbin/tcpdump
```

**Ejecutar escaneo:**
```bash
# Actualizar base de datos
rkhunter --update

# Actualizar propfile (después de cambios legítimos)
rkhunter --propupd

# Escaneo completo
rkhunter --check

# Escaneo silencioso (sin pausas)
rkhunter --check --skip-keypress

# Escaneo con reporte por email
rkhunter --check --report-warnings-only
```

**Automatizar con cron:**
```bash
# /etc/cron.daily/rkhunter
#!/bin/bash

/usr/bin/rkhunter --update --quiet
/usr/bin/rkhunter --cronjob --report-warnings-only

exit 0
```

### 4.2 chkrootkit

**Instalación:**
```bash
apt install chkrootkit
```

**Ejecutar escaneo:**
```bash
# Escaneo completo
chkrootkit

# Escaneo silencioso
chkrootkit -q

# Solo buscar rootkits conocidos específicos
chkrootkit -l  # Listar tests disponibles
chkrootkit sniffer  # Solo test de sniffer
```

**Automatizar:**
```bash
# /etc/cron.daily/chkrootkit
#!/bin/bash

OUTPUT=$(chkrootkit -q)

if [ -n "$OUTPUT" ]; then
    echo "$OUTPUT" | mail -s "[chkrootkit] Possible rootkit detected on $(hostname)" sysadmin@empresa.com
fi

exit 0
```

---

## 5. Integración con SIEM

### 5.1 Enviar Alertas de Wazuh a Elasticsearch

**Ya integrado en Wazuh 4.x** (Wazuh Indexer es OpenSearch/Elasticsearch)

**Query en Dashboard:**
```json
GET wazuh-alerts-*/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "@timestamp": {
              "gte": "now-24h"
            }
          }
        },
        {
          "range": {
            "rule.level": {
              "gte": 10
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "@timestamp": {
        "order": "desc"
      }
    }
  ],
  "size": 100
}
```

### 5.2 Enviar Alertas de Wazuh a Splunk

**Configurar forwarder en Manager:**

```xml
<!-- /var/ossec/etc/ossec.conf (Manager) -->

<integration>
  <name>splunk</name>
  <hook_url>https://splunk.empresa.com:8088/services/collector</hook_url>
  <api_key>YOUR-HEC-TOKEN</api_key>
  <level>7</level> <!-- Solo alertas nivel 7+ -->
  <alert_format>json</alert_format>
</integration>
```

### 5.3 Enviar a Slack/PagerDuty

```xml
<!-- Slack -->
<integration>
  <name>slack</name>
  <hook_url>https://hooks.slack.com/services/YOUR/WEBHOOK/URL</hook_url>
  <level>10</level>
  <alert_format>json</alert_format>
</integration>

<!-- PagerDuty -->
<integration>
  <name>pagerduty</name>
  <api_key>YOUR-PAGERDUTY-API-KEY</api_key>
  <level>12</level>
</integration>
```

---

## 6. Respuesta a Incidentes con HIDS

### 6.1 Análisis de Alertas

**Alerta: File integrity violation en /etc/passwd**

```bash
# 1. Ver alerta en Wazuh Dashboard
# Rule: 550 - Integrity checksum changed
# File: /etc/passwd
# Agent: webserver-01

# 2. Conectarse al servidor afectado
ssh webserver-01

# 3. Verificar cambios recientes
grep "passwd" /var/log/auth.log | tail -20

# 4. Ver diferencias (si AIDE está configurado)
aide --check | grep passwd

# 5. Ver quién modificó el archivo
ausearch -f /etc/passwd -ts recent -i

# 6. Ver usuarios agregados recientemente
tail -20 /etc/passwd
lastlog

# 7. Si es malicioso: AISLAR servidor
iptables -A INPUT -j DROP
iptables -A OUTPUT -j DROP
iptables -I INPUT 1 -s ADMIN_IP -j ACCEPT
iptables -I OUTPUT 1 -d ADMIN_IP -j ACCEPT

# 8. Preservar evidencia
tar -czf /tmp/forensics-$(date +%Y%m%d-%H%M%S).tar.gz \
    /var/log/ \
    /etc/passwd \
    /etc/shadow \
    /var/ossec/logs/

# 9. Remediar: Eliminar usuario malicioso
userdel -r malicious_user

# 10. Actualizar baseline AIDE
aide --update
```

### 6.2 Investigación de Rootkit

**Alerta: rkhunter detecta archivo sospechoso**

```bash
# 1. Ver reporte completo
cat /var/log/rkhunter.log

# Warning: Hidden directory found: /dev/.hiddendir
# Warning: Suspicious file found: /usr/bin/...

# 2. Investigar archivo sospechoso
ls -la /usr/bin/suspicious_file
file /usr/bin/suspicious_file
strings /usr/bin/suspicious_file | less

# 3. Verificar si está en ejecución
ps aux | grep suspicious_file

# 4. Ver conexiones de red
lsof -i -n -P | grep suspicious_file
netstat -tulpn | grep PID

# 5. Verificar firma digital (si aplicable)
debsums -c  # Debian/Ubuntu
rpm -V package_name  # RHEL/CentOS

# 6. Buscar persistencia
find /etc/cron.* -name "*suspicious*"
systemctl list-units | grep suspicious

# 7. Si es rootkit confirmado:
# - Aislar servidor
# - NO reiniciar (puede activar rootkit en boot)
# - Hacer imagen forense del disco
dd if=/dev/sda of=/mnt/forensics/disk-image.dd bs=4M status=progress

# - Reinstalar desde backup conocido
# - Auditar TODOS los servidores similares
```

---

## 7. Mejores Prácticas

### 7.1 Checklist de HIDS

- [ ] ✅ HIDS instalado en TODOS los servidores críticos
- [ ] ✅ Logs centralizados en servidor SIEM
- [ ] ✅ FIM configurado para archivos/directorios críticos
- [ ] ✅ Rootkit scanning automatizado (diario)
- [ ] ✅ Alertas configuradas para eventos críticos (nivel 10+)
- [ ] ✅ Active response configurado (bloqueo automático)
- [ ] ✅ Integración con ticketing (Jira, ServiceNow)
- [ ] ✅ Runbooks de respuesta a incidentes documentados
- [ ] ✅ Tuning de reglas (reducir falsos positivos)
- [ ] ✅ Testing regular de alertas (simular ataques)

### 7.2 Directorios Críticos a Monitorear

**Linux:**
```
/etc/              # Configuraciones
/bin, /sbin        # Binarios del sistema
/usr/bin, /usr/sbin # Binarios de usuario
/lib, /lib64       # Libraries
/boot/             # Kernel y bootloader
/root/.ssh/        # Claves SSH de root
/home/*/.ssh/      # Claves SSH de usuarios
/var/www/          # Web content
/etc/cron.*        # Cron jobs
/etc/systemd/      # Systemd services
```

**Windows:**
```
C:\Windows\System32\
C:\Windows\SysWOW64\
C:\Program Files\
C:\Users\*\AppData\
HKLM\Software\Microsoft\Windows\CurrentVersion\Run  # Registry startup
```

### 7.3 Tuning de Reglas (Reducir Falsos Positivos)

**Proceso iterativo:**

1. **Período de observación (1-2 semanas):**
   - Dejar HIDS en modo "observación"
   - No habilitar active response
   - Recopilar todas las alertas

2. **Análisis de alertas:**
   - Identificar patrones de falsos positivos
   - Documentar causas legítimas

3. **Ajustar reglas:**
   ```xml
   <!-- Ejemplo: Ignorar cambios en log files -->
   <rule id="100011" level="0">
     <if_sid>550</if_sid>
     <match>\.log$</match>
     <description>Log file changed (expected)</description>
   </rule>
   ```

4. **Whitelist de procesos:**
   ```xml
   <!-- Ignorar comandos de monitoreo -->
   <rule id="100012" level="0">
     <if_sid>2501</if_sid>
     <user>nagios</user>
     <description>Nagios monitoring commands (whitelisted)</description>
   </rule>
   ```

5. **Testing:**
   - Simular ataques reales
   - Verificar que alertas críticas SÍ se generen
   - Ajustar sensibilidad

---

## 8. Compliance

### 8.1 PCI-DSS Requirements

**Requirement 10.5.5:** Use file-integrity monitoring or change-detection software on logs to ensure that existing log data cannot be changed without generating alerts.

**Implementación:**
```xml
<!-- Wazuh FIM para logs -->
<syscheck>
  <directories check_all="yes" realtime="yes">/var/log/</directories>
</syscheck>
```

**Requirement 11.5:** Deploy a change-detection mechanism to alert personnel to unauthorized modification of critical system files, configuration files, or content files.

**Implementación:**
```xml
<syscheck>
  <directories check_all="yes" realtime="yes">/etc/,/boot/,/usr/bin/,/usr/sbin/</directories>
</syscheck>
```

---

## Conclusión

Los **HIDS** son esenciales para:
- **Visibilidad** dentro del host (logs, archivos, procesos)
- **Detección temprana** de compromisos
- **Compliance** (PCI-DSS, HIPAA, SOC2)
- **Respuesta automatizada** (active response)

**Arquitectura ideal:**
```
HIDS (Wazuh/OSSEC) → SIEM (Splunk/ELK) → SOC Analysts → Incident Response
```

🔐 **"Prevention is ideal, but detection is a must"** - No existe el sistema 100% seguro, la detección rápida es crítica.
