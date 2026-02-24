# MÓDULO 02: REDES Y PROTOCOLOS DE SEGURIDAD

**Duración**: 4 horas (1.5h teoría + 2h práctica + 0.5h evaluación)
**Nivel**: Principiante-Intermedio
**Prerequisitos**: Módulo 01 completado

---

## 🎯 Objetivos de Aprendizaje

Al finalizar este módulo, serás capaz de:

- [ ] Explicar el funcionamiento de protocolos de red seguros (TLS/SSL, SSH, IPsec)
- [ ] Analizar tráfico de red con Wireshark
- [ ] Implementar TLS/SSL en aplicaciones web
- [ ] Detectar y mitigar ataques de red comunes (MitM, ARP Spoofing)
- [ ] Configurar VPNs y túneles seguros
- [ ] Interpretar certificados digitales X.509

---

## 📚 Contenido Teórico (1.5 horas)

### 1. [Fundamentos de Redes](./teoria/01_fundamentos_redes.md) (30 min)
   - Modelo OSI y TCP/IP
   - Protocolos fundamentales: TCP, UDP, IP, ICMP
   - DNS y resolución de nombres
   - Subnetting y VLANs

### 2. [Protocolos de Seguridad](./teoria/02_protocolos_seguridad.md) (45 min)
   - **TLS/SSL**
     - Handshake TLS
     - Certificados digitales X.509
     - Cipher suites
     - TLS 1.2 vs TLS 1.3
   - **SSH (Secure Shell)**
   - **IPsec y VPNs**
   - **DNSSEC**

### 3. [Ataques de Red y Mitigaciones](./teoria/03_ataques_red.md) (15 min)
   - ARP Spoofing
   - DNS Poisoning
   - Man-in-the-Middle (MitM)
   - SSL Stripping
   - Session Hijacking

---

## 🔬 Laboratorios Prácticos (2 horas)

### [Lab 02.1: Análisis de Tráfico con Wireshark](./laboratorios/lab_01_wireshark/) (45 min)
- Capturar tráfico HTTP, HTTPS, DNS
- Analizar handshake TLS
- Identificar información sensible en tráfico no cifrado
- Aplicar filtros avanzados

### [Lab 02.2: Implementación de TLS](./laboratorios/lab_02_tls/) (45 min)
- Generar certificados autofirmados
- Configurar servidor HTTPS (Node.js/Python)
- Validar configuración TLS con SSLLabs
- Implementar HSTS

### [Lab 02.3: Ataque MitM y Contramedidas](./laboratorios/lab_03_mitm/) (30 min)
- Simular ataque MitM con Ettercap (entorno controlado)
- Detectar el ataque
- Implementar contramedidas

---

## 📝 Evaluación (30 min)

- [Cuestionario](./evaluacion/cuestionario.md): 15 preguntas técnicas
- [Ejercicio Práctico](./evaluacion/ejercicio_practico.md): Análisis de captura de tráfico

---

## 🛠️ Herramientas Utilizadas

| Herramienta | Propósito |
|-------------|-----------|
| Wireshark | Análisis de tráfico |
| OpenSSL | Generación de certificados |
| Node.js/Python | Servidores HTTPS |
| Ettercap | Simulación MitM |
| tcpdump | Captura de paquetes |

---

## 📖 Recursos Adicionales

- [RFC 8446 - TLS 1.3](https://tools.ietf.org/html/rfc8446)
- [SSL Labs](https://www.ssllabs.com/)
- [Wireshark University](https://www.wireshark.org/docs/)

---

[⬅️ Anterior: Módulo 01](../01_Fundamentos_Ciberseguridad/) | [➡️ Siguiente: Módulo 03](../03_Criptografia_Clasica/)
