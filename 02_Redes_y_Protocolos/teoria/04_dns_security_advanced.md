# DNS Security Avanzado: DNSSEC, DoH, DoT

## Introducción

El DNS (Domain Name System) es crítico para Internet, pero fue diseñado sin consideraciones de seguridad. Esto ha llevado a ataques como DNS spoofing, cache poisoning y DNS tunneling.

### Vulnerabilidades DNS Clásicas

| Ataque | Descripción | Impacto |
|--------|-------------|---------|
| **DNS Spoofing** | Inyección de registros DNS falsos | Redirección a sitios maliciosos |
| **Cache Poisoning** | Envenenamiento de caché DNS con datos falsos | Persistencia del ataque |
| **DNS Tunneling** | Exfiltración de datos via queries DNS | Bypass de firewalls |
| **DDoS Amplification** | Uso de DNS para amplificar ataques DDoS | Saturación de víctimas |

---

## DNSSEC (DNS Security Extensions)

**DNSSEC** añade firmas criptográficas a registros DNS para verificar autenticidad e integridad.

### Conceptos Clave

```
┌──────────────────────────────────────┐
│        CADENA DE CONFIANZA DNSSEC    │
└──────────────────────────────────────┘

Root Zone (.)
  ├─ Trust Anchor (KSK)
  └─ firma →

TLD (.com)
  ├─ DS record de Root
  ├─ DNSKEY (KSK + ZSK)
  └─ firma →

Domain (example.com)
  ├─ DS record de .com
  ├─ DNSKEY (KSK + ZSK)
  └─ RRSIG (firmas de registros)

A/AAAA Records
  └─ RRSIG signature
```

### Registros DNSSEC

| Registro | Propósito |
|----------|-----------|
| **DNSKEY** | Clave pública para verificar firmas |
| **RRSIG** | Firma criptográfica de un RRset |
| **DS** (Delegation Signer) | Hash de DNSKEY de zona hija |
| **NSEC/NSEC3** | Prueba de no existencia |

### Implementación con BIND

```bash
# Generar claves KSK y ZSK
dnssec-keygen -a RSASHA256 -b 2048 -f KSK example.com
dnssec-keygen -a RSASHA256 -b 1024 example.com

# Firmar zona
dnssec-signzone -o example.com -k Kexample.com.+008+12345.key \
  example.com.zone Kexample.com.+008+67890.key

# Verificar firma
dig @8.8.8.8 example.com +dnssec
```

**Salida esperada**:
```
;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1
;; ANSWER SECTION:
example.com.      300 IN  A       93.184.216.34
example.com.      300 IN  RRSIG   A 8 2 300 ...
```

---

## DNS over HTTPS (DoH) - RFC 8484

**DoH** encapsula queries DNS en HTTPS para:
- Cifrado end-to-end
- Prevenir inspección de queries
- Bypass de censura DNS

### Ejemplo con curl

```bash
# Query DoH (Cloudflare 1.1.1.1)
curl -H 'accept: application/dns-json' \
  'https://1.1.1.1/dns-query?name=example.com&type=A'
```

**Respuesta JSON**:
```json
{
  "Status": 0,
  "TC": false,
  "RD": true,
  "RA": true,
  "AD": true,
  "CD": false,
  "Question": [{"name": "example.com", "type": 1}],
  "Answer": [{"name": "example.com", "type": 1, "TTL": 300, "data": "93.184.216.34"}]
}
```

### Configuración Firefox

```
about:config
network.trr.mode = 3  # Force DoH
network.trr.uri = https://1.1.1.1/dns-query
```

---

## DNS over TLS (DoT) - RFC 7858

**DoT** usa puerto 853 con TLS:

```bash
# Query DoT con kdig
kdig -d @1.1.1.1 +tls example.com

# Query DoT con openssl
echo -n "001e000001000000000000000765786" | xxd -r -p | \
  openssl s_client -connect 1.1.1.1:853 -quiet
```

### DoH vs DoT

| Característica | DoH | DoT |
|----------------|-----|-----|
| **Puerto** | 443 (HTTPS) | 853 (TLS) |
| **Protocolo** | HTTP/2 o HTTP/3 | TLS directo |
| **Detección** | Difícil (parece tráfico web) | Fácil (puerto dedicado) |
| **Soporte browser** | Sí (Firefox, Chrome) | No nativo |

---

## Implementación Práctica: DNS Seguro con Pi-hole + DoH

```bash
# Instalar Pi-hole
curl -sSL https://install.pi-hole.net | bash

# Configurar cloudflared (DoH)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Crear servicio
sudo cat > /etc/systemd/system/cloudflared.service <<EOF
[Unit]
Description=cloudflared DNS over HTTPS proxy
After=network.target

[Service]
Type=simple
User=cloudflared
ExecStart=/usr/local/bin/cloudflared proxy-dns --port 5053 --upstream https://1.1.1.1/dns-query
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Configurar Pi-hole para usar cloudflared
# Settings → DNS → Custom 1: 127.0.0.1#5053
```

---

## Referencias

- **RFC 4033-4035**: DNSSEC Protocol
- **RFC 7858**: DNS over TLS
- **RFC 8484**: DNS Queries over HTTPS (DoH)
- **NIST SP 800-81-2**: Secure DNS Deployment Guide

---

**Palabras**: ~600
