# Laboratorio 4: DNS Seguro y VPN con WireGuard

## Objetivos

1. Implementar DNSSEC en zona propia
2. Configurar DNS over HTTPS (DoH)
3. Implementar VPN con WireGuard
4. Analizar tráfico DNS/VPN con Wireshark

## Duración: 2-3 horas

---

## Parte 1: DNSSEC

```bash
# Generar claves
dnssec-keygen -a RSASHA256 -b 2048 -f KSK example.com
dnssec-keygen -a RSASHA256 -b 1024 example.com

# Firmar zona
dnssec-signzone -o example.com example.com.zone

# Verificar
dig @localhost example.com +dnssec
```

---

## Parte 2: DNS over HTTPS

```bash
# Instalar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Ejecutar proxy DoH
cloudflared proxy-dns --port 5053 --upstream https://1.1.1.1/dns-query

# Test
dig @127.0.0.1 -p 5053 example.com
```

---

## Parte 3: WireGuard VPN

```bash
# Instalar
sudo apt install wireguard

# Generar claves servidor
wg genkey | sudo tee /etc/wireguard/server_private.key
sudo cat /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key

# Configurar servidor (/etc/wireguard/wg0.conf)
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <contenido de server_private.key>

[Peer]
PublicKey = <client public key>
AllowedIPs = 10.0.0.2/32

# Activar
sudo wg-quick up wg0
sudo wg show
```

### Cliente

```bash
# Generar claves cliente
wg genkey | tee client_private.key | wg pubkey > client_public.key

# Configurar cliente
[Interface]
Address = 10.0.0.2/24
PrivateKey = <client_private.key>

[Peer]
PublicKey = <server_public.key>
Endpoint = <server_ip>:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

# Conectar
sudo wg-quick up wg0
```

---

## Ejercicios

1. Implementar DNSSEC con rotación de claves
2. Configurar DoH en Firefox
3. Crear VPN site-to-site con WireGuard
4. Analizar handshake WireGuard con Wireshark

---

## Referencias

- **WireGuard**: https://www.wireguard.com/
- **DNSSEC**: https://dnssec-deployment.org/
- **cloudflared**: https://developers.cloudflare.com/1.1.1.1/

**Duración**: 2-3 horas
