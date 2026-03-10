# LAB 02.1: ANÁLISIS DE TRÁFICO CON WIRESHARK

**Duración**: 45 minutos
**Herramienta**: Wireshark

---

## Instalación

```bash
# Kali (pre-instalado)
wireshark

# Ubuntu/Debian
sudo apt install wireshark
sudo usermod -aG wireshark $USER

# Relogin para aplicar permisos
```

---

## Ejercicio 1: Capturar Tráfico HTTP (15 min)

### Paso 1: Iniciar Captura

```
1. Abrir Wireshark
2. Seleccionar interfaz (eth0, wlan0)
3. Click "Start Capturing"
```

### Paso 2: Generar Tráfico HTTP

```bash
# Visitar sitio HTTP (no HTTPS)
curl http://neverssl.com
```

### Paso 3: Aplicar Filtro

```
Display Filter: http
```

### Paso 4: Analizar Request

```
Buscar: GET /online HTTP/1.1
Click derecho → Follow → HTTP Stream
```

**Observar**:
- Host header
- User-Agent
- ⚠️ TODO en texto plano

---

## Ejercicio 2: Analizar Handshake TLS (15 min)

### Paso 1: Capturar HTTPS

```bash
# Generar tráfico HTTPS
curl https://www.google.com
```

### Paso 2: Filtrar TLS

```
Display Filter: tls.handshake
```

### Paso 3: Analizar Client Hello

```
TLS → Handshake Protocol: Client Hello
    - Version: TLS 1.2
    - Cipher Suites: [Lista]
    - Extensions: [Server Name, etc.]
```

**Observar**:
- ✅ SNI visible (nombre de dominio)
- ❌ Contenido cifrado

### Paso 4: Analizar Server Hello

```
TLS → Handshake Protocol: Server Hello
    - Cipher Suite Selected: TLS_ECDHE_RSA_...
    - Certificate
```

---

## Ejercicio 3: DNS Queries (10 min)

### Filtro DNS

```
Display Filter: dns
```

### Analizar Query

```
DNS Query
    - Name: www.example.com
    - Type: A
    - Response: 93.184.216.34
```

**Observación**: DNS queries en texto plano

---

## Filtros Útiles

```
# HTTP
http

# HTTPS/TLS
tls || ssl

# DNS
dns

# Por IP
ip.addr == 192.168.1.1

# Por puerto
tcp.port == 443

# Flags TCP
tcp.flags.syn == 1

# Combinaciones
http && ip.src == 192.168.1.10
```

---

## Ejercicio 4: Identificar Información Sensible (5 min)

### Buscar Passwords

```
Display Filter: http.request.method == "POST"
Follow HTTP Stream
Buscar: password=
```

**⚠️ Demo de por qué HTTPS es crítico**

---

## Entregables

- [ ] Screenshot de HTTP request completo
- [ ] Screenshot de TLS handshake
- [ ] Documento explicando qué información es visible en HTTP vs HTTPS

---

[⬅️ Volver](../../README.md) | [➡️ Siguiente Lab](../lab_02_tls/)
