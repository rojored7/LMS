# VPN Modernas: WireGuard vs IPsec

## Introducción

Las VPNs (Virtual Private Networks) crean túneles cifrados sobre redes no confiables.

### Comparación de Protocolos VPN

| Protocolo | Velocidad | Seguridad | Complejidad | Uso |
|-----------|-----------|-----------|-------------|-----|
| **WireGuard** | Muy alta | Alta (Curve25519, ChaCha20) | Baja (4K líneas) | Moderno, móvil |
| **IPsec** | Media-Alta | Alta (AES-256, SHA-256) | Alta (500K líneas) | Enterprise, site-to-site |
| **OpenVPN** | Media | Alta (configurable) | Media | Legacy, compatible |

---

## WireGuard

**WireGuard** es un protocolo VPN moderno, simple y rápido.

### Conceptos Clave

- **Criptografía moderna**: Curve25519, ChaCha20-Poly1305, BLAKE2s
- **UDP only**: Puerto configurable (51820 default)
- **Stateless**: No handshake complejo
- **Roaming**: Cambia de IP/red sin reconectar

### Instalación y Configuración

```bash
# Ubuntu/Debian
sudo apt install wireguard

# Generar claves
wg genkey | tee privatekey | wg pubkey > publickey

# Configuración servidor (/etc/wireguard/wg0.conf)
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = <CLIENT_PUBLIC_KEY>
AllowedIPs = 10.0.0.2/32

# Configuración cliente
[Interface]
Address = 10.0.0.2/24
PrivateKey = <CLIENT_PRIVATE_KEY>
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

# Activar
sudo wg-quick up wg0
```

---

## IPsec

**IPsec** es un framework de protocolos para seguridad IP (RFC 4301).

### Modos

| Modo | Encapsula | Uso |
|------|-----------|-----|
| **Transport** | Solo payload | Host-to-host |
| **Tunnel** | Todo el paquete IP | Site-to-site, VPN |

### Protocolos

- **AH** (Authentication Header): Integridad, no confidencialidad
- **ESP** (Encapsulating Security Payload): Cifrado + integridad
- **IKEv2** (Internet Key Exchange v2): Establecimiento de SA

### Configuración StrongSwan (Ubuntu)

```bash
sudo apt install strongswan

# /etc/ipsec.conf
config setup
    charondebug="ike 2, knl 2, cfg 2"

conn %default
    ikelifetime=60m
    keylife=20m
    rekeymargin=3m
    keyingtries=1
    keyexchange=ikev2
    authby=secret

conn site-to-site
    left=192.168.1.1
    leftsubnet=10.1.0.0/24
    right=203.0.113.1
    rightsubnet=10.2.0.0/24
    auto=start

# /etc/ipsec.secrets
192.168.1.1 203.0.113.1 : PSK "SuperSecretKey123!"

# Iniciar
sudo ipsec start
sudo ipsec up site-to-site
```

---

## Performance Benchmark

```
Throughput (Gbps):
WireGuard:  ~10 Gbps (single core)
IPsec:      ~8 Gbps
OpenVPN:    ~2 Gbps

Latency adicional:
WireGuard:  <1ms
IPsec:      ~2ms
OpenVPN:    ~5ms
```

---

## Referencias

- **WireGuard**: https://www.wireguard.com/papers/wireguard.pdf
- **RFC 4301**: Security Architecture for IP
- **RFC 7296**: IKEv2 Protocol

---

**Palabras**: ~450
