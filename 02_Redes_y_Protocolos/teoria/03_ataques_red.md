# 2.3 ATAQUES DE RED Y MITIGACIONES

**Duración**: 15 minutos

---

## ARP Spoofing (ARP Poisoning)

### ¿Qué es ARP?

**Address Resolution Protocol**: Traduce IP → MAC address

```
PC: "¿Quién tiene 192.168.1.1?"
Router: "Yo, mi MAC es AA:BB:CC:DD:EE:FF"
```

### Ataque ARP Spoofing

```
Red Normal:
PC (192.168.1.10) ←→ Router (192.168.1.1)

Ataque:
Atacante envía ARP falsos:
"192.168.1.1 está en MAC del atacante"

Resultado:
PC → Atacante → Router
     (MitM)
```

### Herramienta: Ettercap

```bash
# ARP spoofing con Ettercap
ettercap -T -M arp:remote /192.168.1.1// /192.168.1.10//
#                           ↑ Router      ↑ Víctima
```

### Mitigaciones

✅ **Static ARP entries** (solo para servidores críticos):
```bash
arp -s 192.168.1.1 AA:BB:CC:DD:EE:FF
```

✅ **Dynamic ARP Inspection (DAI)** en switches:
```cisco
ip arp inspection vlan 10
```

✅ **Detección**:
```bash
# Monitorear ARP table changes
arpwatch
```

---

## DNS Poisoning (DNS Cache Poisoning)

### Ataque

```
1. Atacante consulta: "¿Cuál es IP de bank.com?"
2. Atacante envía respuesta falsa ANTES que servidor real
3. Resolver cachea respuesta falsa
4. Víctimas obtienen IP maliciosa
```

### Kaminsky Attack (2008)

Explota:
- Predicción de Transaction ID
- Ventana de tiempo entre query y respuesta

### Mitigaciones

✅ **DNSSEC**: Firmas criptográficas
✅ **DNS over HTTPS/TLS**: Cifrado
✅ **Source port randomization**
✅ **0x20 encoding**: Case randomization

---

## Man-in-the-Middle (MitM)

### Técnicas

**1. ARP Spoofing** (LAN)
**2. DHCP Spoofing** (LAN)
**3. Rogue Wi-Fi** (acceso falso)
**4. BGP Hijacking** (Internet scale)
**5. SSL Stripping** (degradar HTTPS)

### SSL Stripping

```
Víctima quiere: https://bank.com
Atacante intercepta
Atacante → banco: HTTPS (cifrado)
Atacante → víctima: HTTP (plano)
```

**Víctima ve**: http://bank.com (sin candado)

### Mitigaciones MitM

✅ **HSTS**: Forzar HTTPS
✅ **Certificate Pinning**: Validar cert específico
✅ **VPN**: Cifrado end-to-end
✅ **Mutual TLS**: Cliente también se autentica
✅ **Network segmentation**: Aislar tráfico crítico
✅ **802.1X**: Autenticación de puerto

---

## Session Hijacking

### Tipos

**1. Session Sidejacking** (captura de cookie):
```
Atacante sniffea cookie de sesión
Atacante replay cookie
Atacante impersona víctima
```

**2. Session Fixation**:
```
Atacante fija session ID conocido
Víctima autenticaAsí que el atacante conoce el session ID válido
```

### Mitigaciones

✅ **HTTPS only**: Cifrar cookies
```http
Set-Cookie: sessionid=abc123; Secure; HttpOnly; SameSite=Strict
```

✅ **Session regeneration** después de login
✅ **IP binding**: Validar IP de sesión
✅ **User-Agent validation**
✅ **Session timeout**: Expiración corta

---

## Packet Sniffing

### Herramientas

```bash
# tcpdump
sudo tcpdump -i eth0 -w capture.pcap

# Wireshark
wireshark

# tshark (CLI Wireshark)
tshark -i eth0 -Y "http.request"
```

### Qué puede capturar atacante

❌ **HTTP**: Todo en texto plano
❌ **FTP**: Credenciales
❌ **Telnet**: Todo
❌ **SMTP sin TLS**: Emails
❌ **DNS**: Queries

✅ **HTTPS**: Solo metadatos (IP, dominio en SNI)
✅ **SSH**: Solo metadatos
✅ **VPN**: Tráfico completamente cifrado

### Mitigaciones

✅ **Cifrado end-to-end**: TLS/SSL
✅ **VPN**: Todo el tráfico cifrado
✅ **Switch (no hub)**: Segmentación
✅ **Port security**: Limit MAC addresses
✅ **802.1X**: Network access control

---

## Rogue Access Point (Evil Twin)

### Ataque

```
1. Atacante crea AP con SSID legítimo
   "Free-Airport-WiFi"

2. Señal más fuerte que AP real
3. Víctima se conecta
4. Atacante captura todo el tráfico
```

### Herramientas

```bash
# Crear rogue AP
hostapd + dnsmasq

# Capturar credenciales
sslstrip + iptables
```

### Mitigaciones

✅ **VPN siempre** en redes públicas
✅ **Validar certificados** SSL
✅ **No autoconectar** a redes conocidas
✅ **Deshabilitar Wi-Fi** cuando no se use
✅ **WPA3-Enterprise**: Autenticación mutua

---

## Denial of Service (DoS)

### Tipos

**1. Bandwidth Exhaustion**:
```
Saturar ancho de banda con tráfico
```

**2. Resource Exhaustion**:
```
SYN Flood: Llenar tabla de conexiones
```

**3. Application Layer**:
```
Slowloris: Mantener conexiones abiertas
```

### SYN Flood

```
Atacante envía SYN
Servidor responde SYN-ACK
Atacante NO responde ACK
→ Servidor espera, tabla se llena
```

**Mitigación**: SYN cookies
```bash
sysctl -w net.ipv4.tcp_syncookies=1
```

### Mitigaciones DoS/DDoS

✅ **Rate limiting**: Limitar requests/segundo
✅ **SYN cookies**: Para SYN flood
✅ **Geo-blocking**: Bloquear países
✅ **Blackholing**: Descartar tráfico malicioso
✅ **CDN**: Cloudflare, Akamai, AWS Shield
✅ **Anycast**: Distribuir tráfico
✅ **Overprovisioning**: Capacidad extra

---

## Resumen de Mitigaciones

| Ataque | Mitigación Principal | Herramienta |
|--------|----------------------|-------------|
| ARP Spoofing | DAI, static ARP | arpwatch |
| DNS Poisoning | DNSSEC, DoH/DoT | BIND9 |
| MitM | HSTS, VPN, cert pinning | OpenVPN |
| Session Hijack | HTTPS, Secure cookies | - |
| Sniffing | TLS/SSL, VPN | - |
| Rogue AP | VPN, validación cert | - |
| DoS/DDoS | Rate limit, CDN | Cloudflare |

---

## Defensa en Profundidad

```
    Internet
        ↓
   [Firewall] ← Reglas estrictas
        ↓
     [IDS/IPS] ← Detección de ataques
        ↓
      [DMZ] ← Servidores públicos
        ↓
   [Firewall interno]
        ↓
   [Red Interna] ← Segmentación
        ↓
   [Endpoints] ← EDR, antivirus
        ↓
   [Cifrado] ← TLS/SSL
```

**Cada capa añade protección**

---

[⬅️ Anterior: Protocolos](./02_protocolos_seguridad.md) | [➡️ Siguiente: Laboratorios](../laboratorios/)
