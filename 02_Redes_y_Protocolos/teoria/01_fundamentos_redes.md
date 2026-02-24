# 2.1 FUNDAMENTOS DE REDES

**Duración**: 30 minutos

---

## Modelo OSI vs TCP/IP

### Modelo OSI (7 capas)

```
7. APLICACIÓN     → HTTP, HTTPS, FTP, SMTP
6. PRESENTACIÓN   → Cifrado, compresión
5. SESIÓN         → Establecimiento de conexiones
4. TRANSPORTE     → TCP, UDP
3. RED            → IP, ICMP, routing
2. ENLACE         → Ethernet, Wi-Fi, ARP
1. FÍSICA         → Cables, señales
```

### Modelo TCP/IP (4 capas)

```
4. APLICACIÓN     → HTTP, DNS, SSH
3. TRANSPORTE     → TCP, UDP
2. INTERNET       → IP, ICMP
1. ACCESO A RED   → Ethernet, Wi-Fi
```

---

## Protocolos Fundamentales

### TCP (Transmission Control Protocol)
- **Orientado a conexión** (3-way handshake)
- **Confiable**: Retransmisión automática
- **Ordenado**: Paquetes en secuencia
- **Control de flujo**: Previene saturación

**3-Way Handshake**:
```
Cliente → SYN → Servidor
Cliente ← SYN-ACK ← Servidor
Cliente → ACK → Servidor
[Conexión establecida]
```

### UDP (User Datagram Protocol)
- **Sin conexión**: No handshake
- **No confiable**: Sin retransmisión
- **Rápido**: Menos overhead
- **Uso**: Streaming, gaming, DNS

### IP (Internet Protocol)
- **IPv4**: 32 bits (ej: 192.168.1.1)
- **IPv6**: 128 bits (ej: 2001:0db8::1)
- **Routing**: Enrutamiento de paquetes

### ICMP (Internet Control Message Protocol)
- **Diagnóstico**: Ping, traceroute
- **Mensajes de error**: Destino inalcanzable

---

## DNS (Domain Name System)

**Resolución**:
```
www.example.com → DNS → 93.184.216.34
```

**Tipos de registros**:
- **A**: IPv4 address
- **AAAA**: IPv6 address
- **CNAME**: Alias
- **MX**: Mail server
- **TXT**: Texto (SPF, DKIM)

**Vulnerabilidades**:
- DNS Spoofing
- DNS Cache Poisoning
- DNS Tunneling

**Mitigación**: DNSSEC

---

## Subnetting

**Máscara de subred** divide redes:

```
192.168.1.0/24
/24 = 255.255.255.0 = 256 IPs (254 hosts)

192.168.1.0/25
/25 = 255.255.255.128 = 128 IPs (126 hosts)
```

**Cálculo rápido**:
- /24: 256 IPs
- /25: 128 IPs
- /26: 64 IPs
- /27: 32 IPs
- /28: 16 IPs
- /29: 8 IPs
- /30: 4 IPs (útil para enlaces punto a punto)

---

## VLANs (Virtual LANs)

**Propósito**: Segmentar red lógicamente

**Ejemplo**:
```
VLAN 10: Desarrollo    (192.168.10.0/24)
VLAN 20: Producción    (192.168.20.0/24)
VLAN 30: Administración (192.168.30.0/24)
```

**Beneficios de seguridad**:
- Aislamiento de tráfico
- Reducción de broadcast domain
- Microsegmentación

---

## Puertos Comunes

| Puerto | Protocolo | Seguro? |
|--------|-----------|---------|
| 20/21 | FTP | ❌ No cifrado |
| 22 | SSH | ✅ Cifrado |
| 23 | Telnet | ❌ No cifrado |
| 25 | SMTP | ❌ No cifrado (usar 587 TLS) |
| 53 | DNS | ❌ Sin cifrado (DoH/DoT mejor) |
| 80 | HTTP | ❌ No cifrado |
| 443 | HTTPS | ✅ TLS/SSL |
| 3389 | RDP | ⚠️ Usar VPN |
| 3306 | MySQL | ⚠️ No exponer |
| 5432 | PostgreSQL | ⚠️ No exponer |

---

[⬅️ Anterior](../README.md) | [➡️ Siguiente: Protocolos de Seguridad](./02_protocolos_seguridad.md)
