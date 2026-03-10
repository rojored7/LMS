# 1.2 Principios Fundamentales de Ciberseguridad

**Duración**: 45 minutos
**Última actualización**: 2026-02-10

---

## Introducción

Los principios fundamentales de ciberseguridad son conceptos universales que guían el diseño, implementación y operación de sistemas seguros. Estos principios se aplican independientemente de la tecnología específica que uses.

---

## La Tríada CIA

El fundamento de toda estrategia de seguridad descansa en tres pilares conocidos como la **Tríada CIA**:

```
          SEGURIDAD
              |
       +------+------+
       |      |      |
  CONFIDENCIALIDAD  INTEGRIDAD  DISPONIBILIDAD
       |      |      |
    (C)     (I)    (A)
```

### 1. Confidencialidad (Confidentiality)

**Definición**: Garantizar que la información solo sea accesible por personas autorizadas.

#### Principios Clave
- **Need-to-know**: Solo acceso a información necesaria para el trabajo
- **Least privilege**: Mínimos permisos necesarios
- **Data classification**: Clasificar datos según sensibilidad

#### Técnicas para Garantizar Confidencialidad

**1. Cifrado**
```
Texto Plano → [Algoritmo + Clave] → Texto Cifrado

Ejemplo:
"Hola Mundo" → [AES-256 + key123] → "a3f7c9e2..."
```

**2. Control de Acceso**
- **DAC** (Discretionary Access Control): Propietario decide quién accede
- **MAC** (Mandatory Access Control): Sistema decide basado en políticas
- **RBAC** (Role-Based Access Control): Acceso basado en roles
- **ABAC** (Attribute-Based Access Control): Acceso basado en atributos

**3. Autenticación y Autorización**
```
Usuario intenta acceder → Autenticación (¿eres quien dices ser?)
                       → Autorización (¿tienes permiso?)
                       → Acceso concedido/denegado
```

**4. Enmascaramiento de Datos**
- **Tokenización**: Reemplazar datos sensibles con tokens
- **Data Masking**: Ofuscar parcialmente (XXX-XX-1234)

#### Ejemplos Prácticos

**Confidencialidad en Acción**:
- HTTPS cifra comunicación navegador-servidor
- VPN cifra todo el tráfico de red
- Carpetas encriptadas con BitLocker/LUKS
- Mensajería E2E (Signal, WhatsApp)

**Amenazas a Confidencialidad**:
- Eavesdropping (espionaje de comunicaciones)
- Shoulder surfing (mirar por encima del hombro)
- Dumpster diving (buscar información en basura)
- Man-in-the-Middle attacks
- Data breaches

#### Caso de Estudio: Equifax 2017
- **Fallo**: Vulnerabilidad sin parchear (Apache Struts)
- **Resultado**: 147 millones de registros comprometidos
- **Datos expuestos**: SSN, fechas de nacimiento, direcciones, licencias
- **Costo**: $1.4 mil millones
- **Lección**: Confidencialidad fallida = desastre financiero y reputacional

---

### 2. Integridad (Integrity)

**Definición**: Garantizar que la información no ha sido modificada de manera no autorizada.

#### Principios Clave
- **Exactitud**: Datos correctos y precisos
- **Consistencia**: Datos uniformes en todos los sistemas
- **Confiabilidad**: Datos en los que se puede confiar para decisiones

#### Técnicas para Garantizar Integridad

**1. Hashing**
```
Datos → [Función Hash] → Hash

Ejemplo:
"Hola" → [SHA-256] → "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"

Cambio mínimo = Hash completamente diferente
"Hola" → [SHA-256] → "a665..."
"hola" → [SHA-256] → "3610..." ← Totalmente diferente
```

**Hashes Comunes**:
| Algoritmo | Tamaño (bits) | Velocidad | Seguridad | Uso |
|-----------|---------------|-----------|-----------|-----|
| MD5 | 128 | Rápido | ⚠️ Inseguro | Legacy (evitar) |
| SHA-1 | 160 | Rápido | ⚠️ Débil | Legacy (evitar) |
| SHA-256 | 256 | Medio | ✅ Seguro | General purpose |
| SHA-512 | 512 | Medio | ✅ Muy seguro | Alta seguridad |
| BLAKE3 | 256 | Muy rápido | ✅ Seguro | Moderno |

**2. Firmas Digitales**
```
Documento → [Hash] → Resumen → [Cifrar con clave privada] → Firma Digital

Verificación:
Firma → [Descifrar con clave pública] → Resumen original
Documento → [Hash] → Resumen calculado

¿Resumen original == Resumen calculado? → Documento íntegro
```

**3. Checksums y CRC**
- Verificación de integridad de archivos descargados
- Detección de corrupción en transmisiones
```bash
# Generar checksum
sha256sum archivo.iso > archivo.iso.sha256

# Verificar
sha256sum -c archivo.iso.sha256
```

**4. Control de Versiones**
- Git: rastrea cambios, quién, cuándo, qué
- Permite revertir modificaciones no autorizadas

**5. Write-Once Media**
- CD-R, WORM (Write Once Read Many)
- Blockchain (inmutabilidad por diseño)

#### Ejemplos Prácticos

**Integridad en Acción**:
- Certificados digitales (HTTPS)
- Firmas de software (codesigning)
- Logs de auditoría
- Blockchain

**Amenazas a Integridad**:
- Tampering (alteración maliciosa)
- Modificación accidental
- Bit rot (corrupción de hardware)
- SQL Injection (modifica datos en BD)
- Man-in-the-Middle (modifica tráfico)

#### Caso de Estudio: Stuxnet 2010
- **Ataque**: Modificó código en PLCs (Programmable Logic Controllers)
- **Objetivo**: Centrifugadoras nucleares de Irán
- **Método**: Firmado con certificados robados (pareció legítimo)
- **Resultado**: 1,000 centrifugadoras destruidas
- **Lección**: Integridad del código es crítica en infraestructura

---

### 3. Disponibilidad (Availability)

**Definición**: Garantizar que sistemas y datos estén accesibles cuando se necesiten.

#### Principios Clave
- **Uptime**: Tiempo que el sistema está operativo
- **Reliability**: Funcionamiento predecible
- **Maintainability**: Facilidad de mantenimiento
- **SLA** (Service Level Agreement): Acuerdo de nivel de servicio

#### Métricas de Disponibilidad

| Nivel | Uptime | Downtime/Año | Clasificación |
|-------|--------|--------------|---------------|
| 90% | | 36.5 días | ⚠️ Inaceptable |
| 99% | "Two nines" | 3.65 días | ⚠️ Bajo |
| 99.9% | "Three nines" | 8.76 horas | ✅ Aceptable |
| 99.99% | "Four nines" | 52.56 minutos | ✅ Alto |
| 99.999% | "Five nines" | 5.26 minutos | ⭐ Muy alto |
| 99.9999% | "Six nines" | 31.5 segundos | 🏆 Excepcional |

#### Técnicas para Garantizar Disponibilidad

**1. Redundancia**
```
Usuario → Load Balancer → Servidor 1 (activo)
                       → Servidor 2 (activo)
                       → Servidor 3 (standby)
```

**Tipos de Redundancia**:
- **N+1**: N componentes necesarios + 1 respaldo
- **2N**: Duplicación completa
- **2N+1**: Duplicación + 1 respaldo adicional

**2. Failover (Conmutación por Error)**
```
Sistema Principal (falla) → Detección automática → Sistema Secundario (toma control)
```

**3. Backups**
```
3-2-1 Rule:
- 3 copias de datos
- 2 tipos de media diferentes
- 1 copia offsite
```

**Estrategias de Backup**:
- **Full**: Copia completa (lento, mucho espacio)
- **Incremental**: Solo cambios desde último backup (rápido)
- **Differential**: Cambios desde último full backup

**4. DDoS Protection**
- **Rate limiting**: Limitar requests por IP
- **CDN**: Distribuir carga (Cloudflare, Akamai)
- **Scrubbing centers**: Filtrar tráfico malicioso

**5. Monitoring y Alertas**
- Detectar problemas antes de que impacten usuarios
- Herramientas: Nagios, Zabbix, Prometheus, DataDog

**6. Disaster Recovery Planning**
- **RTO** (Recovery Time Objective): Tiempo máximo de downtime tolerable
- **RPO** (Recovery Point Objective): Cantidad máxima de datos que se pueden perder

```
Backup cada 1 hora → RPO = 1 hora (máximo 1 hora de datos perdidos)
Restore en 30 min → RTO = 30 min (máximo 30 min de downtime)
```

#### Ejemplos Prácticos

**Disponibilidad en Acción**:
- AWS Multi-AZ (zonas de disponibilidad múltiples)
- RAID (Redundant Array of Independent Disks)
- Generadores de emergencia para datacenters
- Geo-replicación de bases de datos

**Amenazas a Disponibilidad**:
- DDoS (Distributed Denial of Service)
- Ransomware (cifra datos, inaccesibles)
- Desastres naturales
- Errores humanos (rm -rf /)
- Fallos de hardware

#### Caso de Estudio: AWS S3 Outage 2017
- **Fallo**: Error humano (comando con typo)
- **Duración**: 4 horas
- **Impacto**: Miles de sitios/servicios caídos
- **Costo**: $150 millones en pérdidas (estimado)
- **Lección**: Disponibilidad requiere procesos robustos y redundancia

---

## Equilibrio de la Tríada CIA

En la práctica, a menudo hay **trade-offs** entre los tres pilares:

### Ejemplos de Conflictos

**1. Confidencialidad vs Disponibilidad**
```
+ Más cifrado y controles → + Confidencialidad
                          → - Disponibilidad (más lento, más complejo)
```

**2. Integridad vs Disponibilidad**
```
+ Más validaciones y checksums → + Integridad
                                → - Disponibilidad (más procesamiento)
```

**3. Disponibilidad vs Confidencialidad/Integridad**
```
+ Más redundancia y accesos → + Disponibilidad
                            → - Confidencialidad (más puntos de acceso)
                            → - Integridad (más difícil sincronización)
```

### Contexto Determina Prioridades

| Escenario | Prioridad 1 | Prioridad 2 | Prioridad 3 |
|-----------|-------------|-------------|-------------|
| Banco online | Integridad | Confidencialidad | Disponibilidad |
| Streaming video | Disponibilidad | Integridad | Confidencialidad |
| Hospital | Disponibilidad | Integridad | Confidencialidad |
| Militar | Confidencialidad | Integridad | Disponibilidad |
| E-commerce | Disponibilidad | Confidencialidad | Integridad |

---

## Principios Adicionales

### 1. Autenticación (Authentication)

**Definición**: Verificar la identidad de un usuario, dispositivo o sistema.

**Factores de Autenticación**:
1. **Something you know**: Contraseña, PIN, pregunta secreta
2. **Something you have**: Token, tarjeta inteligente, smartphone
3. **Something you are**: Biometría (huella, iris, voz, facial)
4. **Somewhere you are**: Geolocalización
5. **Something you do**: Patrón de comportamiento (keystroke dynamics)

**Multi-Factor Authentication (MFA)**:
```
Usuario + Contraseña (factor 1: know)
       + Código SMS (factor 2: have)
       = MFA (Más seguro)
```

**Ejemplos**:
- Google Authenticator (TOTP)
- YubiKey (hardware token)
- Windows Hello (biométrico)

### 2. Autorización (Authorization)

**Definición**: Determinar qué acciones puede realizar un usuario autenticado.

```
Autenticación: ¿Eres Bob?
Autorización: ¿Bob puede editar este archivo?
```

**Modelos de Autorización**:
- **ACL** (Access Control Lists): Lista de permisos por recurso
- **RBAC** (Role-Based): Basado en roles (Admin, User, Guest)
- **ABAC** (Attribute-Based): Basado en atributos (Departamento, Nivel, Horario)

### 3. No Repudio (Non-Repudiation)

**Definición**: Garantizar que una parte no pueda negar haber realizado una acción.

**Técnicas**:
- **Firmas digitales**: Prueba criptográfica de autoría
- **Logs de auditoría**: Registro inmutable de acciones
- **Timestamps**: Sellado de tiempo

**Ejemplo**:
- Firma de contratos digitales
- Transacciones bancarias
- Emails con firma digital

### 4. Contabilidad/Auditoría (Accountability/Auditing)

**Definición**: Rastrear y registrar acciones de usuarios para futuras investigaciones.

**Elementos de un Log de Auditoría**:
- **Quién**: Usuario/sistema
- **Qué**: Acción realizada
- **Cuándo**: Timestamp
- **Dónde**: IP, ubicación, sistema
- **Resultado**: Éxito/fallo

**Ejemplo de Log**:
```
2026-02-10 14:32:15 | User: admin | Action: LOGIN | IP: 192.168.1.100 | Status: SUCCESS
2026-02-10 14:35:22 | User: admin | Action: FILE_DELETE | File: /etc/shadow | Status: DENIED
```

---

## Defensa en Profundidad (Defense in Depth)

**Concepto**: Implementar múltiples capas de seguridad para que si una falla, otras protejan.

### Modelo de Capas

```
┌─────────────────────────────────────┐
│  Políticas, Procedimientos, Awareness│ ← Capa 7: Personas
├─────────────────────────────────────┤
│  Data Security (Cifrado, DLP)       │ ← Capa 6: Datos
├─────────────────────────────────────┤
│  Application Security (WAF, SAST)   │ ← Capa 5: Aplicación
├─────────────────────────────────────┤
│  Host Security (Antivirus, EDR)     │ ← Capa 4: Host
├─────────────────────────────────────┤
│  Internal Network (Segmentation)    │ ← Capa 3: Red Interna
├─────────────────────────────────────┤
│  Perimeter (Firewall, IDS/IPS)      │ ← Capa 2: Perímetro
├─────────────────────────────────────┤
│  Physical Security (Guards, CCTV)   │ ← Capa 1: Física
└─────────────────────────────────────┘
```

### Ejemplo Práctico

**Protegiendo una Base de Datos**:
1. **Física**: Datacenter con acceso controlado
2. **Perimeter**: Firewall bloquea puertos innecesarios
3. **Red**: VLAN separada para servidores BD
4. **Host**: OS hardened, parches actualizados
5. **Aplicación**: Queries parametrizados (anti-SQL injection)
6. **Datos**: Cifrado at-rest (AES-256), cifrado in-transit (TLS)
7. **Personas**: Capacitación, revisión de accesos

---

## Principio de Mínimo Privilegio (Least Privilege)

**Definición**: Otorgar solo los permisos mínimos necesarios para realizar una tarea.

### Beneficios
- Limita daño de cuenta comprometida
- Reduce errores accidentales
- Facilita auditoría

### Implementación

**Linux**:
```bash
# Mal: Usuario con sudo completo
user ALL=(ALL) NOPASSWD: ALL

# Bien: Usuario solo puede reiniciar servicio específico
user ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
```

**Windows**:
- Usar cuentas estándar, no Administrator
- Elevar privilegios solo cuando necesario (UAC)

**Cloud (AWS)**:
```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::mi-bucket/public/*"
}
```
(Solo leer objetos en carpeta pública, no escribir ni borrar)

---

## Zero Trust Architecture

**Filosofía**: "Never trust, always verify" (Nunca confíes, siempre verifica)

### Principios Clave

1. **Verify explicitly**: Autenticar y autorizar basado en todos los puntos de datos disponibles
2. **Use least privilege access**: JIT (Just-In-Time) y JEA (Just-Enough-Access)
3. **Assume breach**: Minimizar impacto asumiendo que ya estás comprometido

### Modelo Tradicional vs Zero Trust

**Tradicional (Castle-and-Moat)**:
```
Internet (peligroso) → Firewall (confianza en perímetro) → Red Interna (confiado)
```
**Problema**: Una vez dentro, acceso amplio

**Zero Trust**:
```
Todo es no confiable → Verificación continua → Acceso granular por recurso
```

### Componentes de Zero Trust

```
┌─────────────────┐
│     Usuario     │
└────────┬────────┘
         │ 1. Autenticación (MFA)
    ┌────▼────┐
    │   IAM   │
    └────┬────┘
         │ 2. Autorización (Políticas)
    ┌────▼────┐
    │  Policy │
    │ Decision│
    │  Point  │
    └────┬────┘
         │ 3. Verificación contexto
         │    (Dispositivo, ubicación, hora)
    ┌────▼────┐
    │Recurso  │ ← 4. Acceso mínimo necesario
    └─────────┘
         │ 5. Monitoreo continuo
```

### Tecnologías que Habilitan Zero Trust
- **IAM** (Identity and Access Management): Okta, Azure AD
- **MFA**: Duo, Google Authenticator
- **NAC** (Network Access Control): 802.1X
- **SDP** (Software Defined Perimeter): Perimeter 81
- **ZTNA** (Zero Trust Network Access): Cloudflare Access, Zscaler

### Ejemplo: Google BeyondCorp
- Empleados acceden aplicaciones corporativas desde cualquier red (incluso Internet público) sin VPN tradicional
- Cada request autenticado, autorizado y cifrado
- Contexto evaluado: Dispositivo gestionado, parches actualizados, ubicación

---

## Principio de Seguridad por Diseño (Security by Design)

**Concepto**: Integrar seguridad desde el inicio del desarrollo, no como agregado posterior.

### Principios de Secure by Design

1. **Fail Securely**: En caso de error, fallar en estado seguro
   ```python
   # Mal
   try:
       check_permission(user)
   except:
       allow_access()  # Si hay error, permite acceso!

   # Bien
   try:
       check_permission(user)
   except:
       deny_access()  # Si hay error, niega acceso
   ```

2. **Default Deny**: Por defecto, denegar acceso (whitelist, no blacklist)

3. **Complete Mediation**: Verificar cada acceso, no asumir

4. **Separation of Duties**: Ninguna persona debe tener control completo

5. **Keep it Simple**: Complejidad es enemiga de la seguridad

---

## Resumen de Principios Fundamentales

| Principio | Pregunta Clave | Control Principal |
|-----------|----------------|-------------------|
| **Confidencialidad** | ¿Quién puede ver? | Cifrado, Control de Acceso |
| **Integridad** | ¿Se modificó? | Hashing, Firmas Digitales |
| **Disponibilidad** | ¿Está accesible? | Redundancia, Backups |
| **Autenticación** | ¿Quién eres? | MFA, Biometría |
| **Autorización** | ¿Qué puedes hacer? | RBAC, Políticas |
| **No Repudio** | ¿Puedes negar? | Firmas, Logs |
| **Auditoría** | ¿Quién hizo qué? | Logging, SIEM |
| **Least Privilege** | ¿Mínimos permisos? | IAM, Revisión de Accesos |
| **Defense in Depth** | ¿Múltiples capas? | Firewalls, IDS, EDR, etc. |
| **Zero Trust** | ¿Confías? | Verificación Continua |

---

## Ejercicios Prácticos

### Ejercicio 1: Identificar Violaciones de la Tríada CIA

Para cada escenario, identifica qué principio (C, I o A) se viola:

1. Un empleado descontento borra todos los archivos del servidor compartido.
2. Un atacante intercepta comunicación y modifica el monto de una transferencia bancaria.
3. Tu contraseña de Facebook se filtra en un data breach.
4. Un ataque DDoS hace que tu sitio web no sea accesible.
5. Alguien cambia tu calificación en el sistema académico sin autorización.

**Respuestas**:
1. Disponibilidad (datos no accesibles)
2. Integridad (datos modificados)
3. Confidencialidad (información expuesta)
4. Disponibilidad (servicio no accesible)
5. Integridad (datos alterados)

### Ejercicio 2: Defensa en Profundidad

Diseña 5 capas de seguridad para proteger un servidor web que procesa pagos:

1. ___________________________
2. ___________________________
3. ___________________________
4. ___________________________
5. ___________________________

**Ejemplo de Respuesta**:
1. Firewall (bloquear todo excepto 80/443)
2. WAF (Web Application Firewall - detectar ataques web)
3. Input validation en aplicación (prevenir SQL injection)
4. Cifrado TLS para datos en tránsito
5. Cifrado de datos de tarjetas en BD (at-rest)

---

## Próximo Tema

Has aprendido los principios fundamentales. Ahora exploraremos los **tipos específicos de amenazas, vulnerabilidades y riesgos** que enfrentan los sistemas modernos.

➡️ [03_amenazas_vulnerabilidades_riesgos.md](./03_amenazas_vulnerabilidades_riesgos.md)

---

## Referencias

- NIST SP 800-53: Security and Privacy Controls
- ISO/IEC 27001:2022
- "Security Engineering" - Ross Anderson
- Google BeyondCorp: https://cloud.google.com/beyondcorp
- Microsoft Zero Trust: https://www.microsoft.com/security/business/zero-trust
