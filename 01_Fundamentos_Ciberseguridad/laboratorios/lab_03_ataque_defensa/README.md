# LAB 01.3: SIMULACIÓN DE ATAQUE Y DEFENSA

**Duración**: 1 hora
**Dificultad**: Principiante-Intermedio
**Prerequisitos**: Labs 01.1 y 01.2 completados

---

## 🎯 Objetivos de Aprendizaje

Al finalizar este laboratorio, serás capaz de:

- [ ] Simular campañas de phishing en entorno controlado
- [ ] Configurar y usar herramientas SIEM básicas
- [ ] Detectar ataques de phishing mediante análisis de logs
- [ ] Implementar contramedidas efectivas
- [ ] Documentar incidentes de seguridad siguiendo mejores prácticas
- [ ] Aplicar el ciclo de respuesta a incidentes

---

## 📋 Contenido

1. [Preparación del Entorno](#preparación-del-entorno)
2. [Parte 1: Simulación de Phishing con GoPhish](#parte-1-simulación-de-phishing)
3. [Parte 2: Detección con Herramientas SIEM](#parte-2-detección-con-siem)
4. [Parte 3: Implementación de Contramedidas](#parte-3-contramedidas)
5. [Parte 4: Documentación de Incidente](#parte-4-documentación)

---

## Preparación del Entorno

### Arquitectura del Laboratorio

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Kali Linux    │────▶│   GoPhish Server │────▶│   Target Users  │
│  (Atacante)     │     │   (Phishing)     │     │   (Víctimas)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │   SIEM / Logs    │
                        │   (Detección)    │
                        └──────────────────┘
```

### Requisitos

- Docker y Docker Compose instalados
- Kali Linux o Ubuntu
- 4GB RAM mínimo
- Cuenta de email de prueba (Gmail con "App Password" o servidor SMTP local)

### Instalación de GoPhish con Docker

#### Método 1: Docker Compose (Recomendado)

**1. Crear directorio del proyecto**:
```bash
mkdir -p ~/labs/lab_phishing
cd ~/labs/lab_phishing
```

**2. Crear `docker-compose.yml`**:
```yaml
version: '3'

services:
  gophish:
    image: gophish/gophish:latest
    container_name: gophish
    ports:
      - "3333:3333"   # Admin panel
      - "8080:80"     # Phishing server
    volumes:
      - ./gophish_data:/opt/gophish
    environment:
      - GOPHISH_INITIAL_ADMIN_PASSWORD=ChangeMe2024!
    restart: unless-stopped

  mailhog:
    image: mailhog/mailhog:latest
    container_name: mailhog
    ports:
      - "1025:1025"   # SMTP server
      - "8025:8025"   # Web UI
    restart: unless-stopped
```

**3. Iniciar servicios**:
```bash
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

**4. Acceder a las interfaces**:
- **GoPhish Admin**: http://localhost:3333
  - Usuario: `admin`
  - Password: Ver en logs con `docker logs gophish`
- **MailHog (Simulador SMTP)**: http://localhost:8025

#### Método 2: Instalación Manual (Alternativa)

```bash
# Descargar GoPhish
wget https://github.com/gophish/gophish/releases/download/v0.12.1/gophish-v0.12.1-linux-64bit.zip
unzip gophish-v0.12.1-linux-64bit.zip
cd gophish-v0.12.1-linux-64bit

# Dar permisos de ejecución
chmod +x gophish

# Ejecutar
sudo ./gophish
```

**⚠️ ADVERTENCIA ÉTICA**:
```
Este laboratorio es SOLO para fines educativos en entorno CONTROLADO.

NUNCA uses phishing contra:
- Personas reales sin su consentimiento explícito
- Organizaciones sin autorización por escrito
- Cualquier contexto fuera de laboratorio autorizado

Consecuencias legales:
- Delito de fraude electrónico
- Multas de hasta $250,000
- Prisión de hasta 20 años (USA)

SOLO PARA EDUCACIÓN Y SIMULACROS AUTORIZADOS.
```

---

## Parte 1: Simulación de Phishing

### Paso 1: Configuración Inicial de GoPhish (10 min)

#### 1.1 Primer Acceso

1. Abrir http://localhost:3333
2. Cambiar contraseña por defecto inmediatamente
3. Navegar por la interfaz:
   - Dashboard
   - Campaigns
   - Users & Groups
   - Email Templates
   - Landing Pages
   - Sending Profiles

#### 1.2 Configurar Sending Profile (Perfil de Envío)

**Navegar a**: Sending Profiles → New Profile

```
Name: Test SMTP
Interface Type: SMTP
From: security@company-test.com
Host: mailhog:1025  (o localhost:1025 si no usas Docker)
Username: (dejar vacío para MailHog)
Password: (dejar vacío para MailHog)
```

**Enviar email de prueba** para verificar configuración.

### Paso 2: Crear Email Template (10 min)

#### 2.1 Template de Phishing Realista

**Navegar a**: Email Templates → New Template

**Name**: "IT Support - Password Expiration"

**Subject**: `URGENT: Your password will expire in 24 hours`

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .header {
            background-color: #0066cc;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            color: #666;
            padding: 20px;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🔒 IT Security Department</h2>
    </div>

    <div class="content">
        <p>Dear {{.FirstName}} {{.LastName}},</p>

        <p><strong>Your password will expire in 24 hours.</strong></p>

        <p>As part of our security policy, all employee passwords must be updated quarterly. Your current password will expire on <strong>{{.Date}}</strong>.</p>

        <p>To avoid account suspension, please update your password immediately by clicking the button below:</p>

        <a href="{{.URL}}" class="button">Update Password Now</a>

        <p><strong>Important:</strong> Failure to update your password will result in temporary account lockout.</p>

        <p>If you have any questions, please contact IT Support at support@company.com</p>

        <p>Best regards,<br>
        IT Security Team<br>
        Company Name</p>
    </div>

    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 Company Name. All rights reserved.</p>
    </div>
</body>
</html>
```

**⚠️ Indicadores de Phishing** (para discusión posterior):
- Sentido de urgencia ("24 hours")
- Amenaza de consecuencias ("account suspension")
- Link genérico
- Email automatizado

### Paso 3: Crear Landing Page (10 min)

#### 3.1 Página de Captura de Credenciales

**Navegar a**: Landing Pages → New Page

**Name**: "Fake Microsoft Login"

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Microsoft Account Login</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f3f3;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .login-container {
            background: white;
            padding: 40px;
            border-radius: 2px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 440px;
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo h1 {
            color: #5e5e5e;
            font-size: 24px;
            font-weight: 600;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            color: #1a1a1a;
            font-size: 14px;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #8c8c8c;
            font-size: 15px;
            background-color: #f8f8f8;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: 2px solid #0078d4;
            border-color: #0078d4;
            background-color: white;
        }

        .btn {
            width: 100%;
            padding: 12px;
            background-color: #0078d4;
            color: white;
            border: none;
            font-size: 15px;
            cursor: pointer;
            font-weight: 600;
        }

        .btn:hover {
            background-color: #106ebe;
        }

        .info {
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: #5e5e5e;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>Microsoft</h1>
        </div>

        <form method="POST" action="#">
            <div class="form-group">
                <label for="email">Email or phone</label>
                <input type="text" id="email" name="email" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>

            <button type="submit" class="btn">Sign in</button>
        </form>

        <div class="info">
            <p>Don't have an account? <a href="#">Create one!</a></p>
        </div>
    </div>

    {{.Tracker}}
</body>
</html>
```

**Capturar credenciales**: Marcar checkbox "Capture Submitted Data"

**Redirect URL**: `https://www.microsoft.com` (redirigir después de captura)

### Paso 4: Crear Grupo de Objetivos (5 min)

**Navegar a**: Users & Groups → New Group

**Name**: "Test Employees"

**Agregar usuarios**:
```
First Name: John
Last Name: Doe
Email: john.doe@test.local
Position: Marketing Manager

First Name: Jane
Last Name: Smith
Email: jane.smith@test.local
Position: Software Engineer

First Name: Bob
Last Name: Johnson
Email: bob.johnson@test.local
Position: HR Director
```

**💡 Tip**: En entorno real, importarías CSV con lista de empleados autorizados.

### Paso 5: Lanzar Campaña (5 min)

**Navegar a**: Campaigns → New Campaign

```
Name: Password Expiration Test
Email Template: IT Support - Password Expiration
Landing Page: Fake Microsoft Login
URL: http://localhost:8080
Sending Profile: Test SMTP
Groups: Test Employees
```

**Launch Date**: Inmediatamente

**Enviar Campaign**: Click "Launch Campaign"

### Paso 6: Monitorear Resultados

**Dashboard de Campaña** muestra en tiempo real:

| Métrica | Descripción | Estado |
|---------|-------------|--------|
| 📧 **Sent** | Emails enviados | Verde |
| 👁️ **Opened** | Emails abiertos | Amarillo |
| 🔗 **Clicked** | Links clickeados | Naranja |
| 📝 **Submitted Data** | Credenciales ingresadas | Rojo |

**Interpretación**:
- **Opened**: Víctima leyó email (vulnerable a ingeniería social)
- **Clicked**: Víctima clickeó link (acción peligrosa)
- **Submitted Data**: Víctima ingresó credenciales (COMPROMETIDO)

---

## Parte 2: Detección con SIEM

### Opción A: Análisis Manual de Logs

#### 1. Ver Logs de GoPhish

```bash
# Si usas Docker
docker logs gophish | grep -i "email sent\|clicked\|submitted"

# Logs locales (instalación manual)
tail -f /var/log/gophish/gophish.log
```

**Buscar eventos**:
```
[INFO] Email sent to john.doe@test.local
[INFO] User clicked link: john.doe@test.local
[ALERT] Credentials submitted: john.doe@test.local
```

#### 2. Analizar Emails en MailHog

1. Abrir http://localhost:8025
2. Ver emails enviados
3. Inspeccionar headers:
   ```
   From: security@company-test.com
   To: john.doe@test.local
   Subject: URGENT: Your password will expire in 24 hours
   X-Mailer: GoPhish
   ```

**Indicadores de phishing**:
- `X-Mailer: GoPhish` (obvio en test)
- Dominio no coincide con empresa real
- Links sospechosos en HTML

### Opción B: SIEM con ELK Stack (Elasticsearch, Logstash, Kibana)

#### Configuración Simplificada

**1. Agregar a `docker-compose.yml`**:
```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

**2. Reiniciar servicios**:
```bash
docker-compose up -d
```

**3. Acceder a Kibana**: http://localhost:5601

**4. Ingestar logs de GoPhish**:
```bash
# Script simple de ingesta
cat gophish.log | while read line; do
  curl -X POST "http://localhost:9200/gophish/_doc" \
    -H 'Content-Type: application/json' \
    -d "{\"message\": \"$line\", \"@timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\"}"
done
```

**5. Crear visualizaciones en Kibana**:
- **Timeline**: Eventos de phishing en el tiempo
- **Pie Chart**: Acciones por usuario (opened, clicked, submitted)
- **Heat Map**: Horarios de mayor vulnerabilidad

### Opción C: Splunk Free (Alternativa Profesional)

**1. Instalar Splunk Free**:
```bash
wget -O splunk.tgz "https://download.splunk.com/products/splunk/releases/9.1.2/linux/splunk-9.1.2-linux-2.6-amd64.deb"
sudo dpkg -i splunk-9.1.2-linux-2.6-amd64.deb
```

**2. Iniciar Splunk**:
```bash
sudo /opt/splunk/bin/splunk start --accept-license
# Crear cuenta admin cuando se solicite
```

**3. Acceder**: http://localhost:8000

**4. Agregar data source**:
- Settings → Data Inputs → Files & Directories
- Browse → `/opt/gophish/gophish.log`
- Source type: `json` o `_json`

**5. Crear alertas**:
```spl
# Búsqueda: Detectar credenciales comprometidas
index=gophish "submitted data"
| stats count by email
| where count > 0
```

**Configurar alerta**:
- Trigger when: `number of results > 0`
- Action: Email to SOC

---

## Parte 3: Contramedidas

### 1. Indicadores de Phishing a Educar

| Indicador | Ejemplo | Detección |
|-----------|---------|-----------|
| **Urgencia** | "24 hours", "immediately" | Red flag 🚩 |
| **Amenaza** | "account will be suspended" | Red flag 🚩 |
| **Remitente sospechoso** | security@c0mpany.com (0 en vez de o) | Verificar dominio |
| **Hover sobre link** | Link muestra URL diferente | Inspeccionar antes de click |
| **Solicitud de credenciales** | "Enter your password" | NUNCA por email |
| **Errores gramaticales** | Typos, mala traducción | Profesionalismo sospechoso |

### 2. Controles Técnicos

#### A. Filtrado de Email

**SPF (Sender Policy Framework)**:
```dns
TXT @ "v=spf1 ip4:203.0.113.0/24 -all"
```

**DKIM (DomainKeys Identified Mail)**:
```bash
# Generar claves DKIM
opendkim-genkey -s mail -d company.com
# Publicar en DNS
```

**DMARC (Domain-based Message Authentication)**:
```dns
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@company.com"
```

#### B. Email Security Gateway

Implementar con (ejemplos):
- **Proofpoint**
- **Mimecast**
- **Microsoft Defender for Office 365**

**Capacidades**:
- Análisis de URLs en tiempo real
- Sandbox para adjuntos
- Detección de impersonación
- Quarantine de emails sospechosos

#### C. Endpoint Protection

**Configurar bloqueadores de phishing**:
```bash
# Ejemplo: Bloquear dominio malicioso en /etc/hosts
echo "127.0.0.1 malicious-phishing-site.com" | sudo tee -a /etc/hosts
```

**Browser extensions**:
- Netcraft Extension
- PhishTank SiteChecker

#### D. Multi-Factor Authentication (MFA)

**Implementar MFA** hace que credenciales robadas sean inútiles:

```python
# Ejemplo: Flask app con MFA (pyotp)
from flask import Flask, request
import pyotp

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    totp_code = request.form['totp']

    # Verificar password (simplificado)
    if verify_password(username, password):
        # Verificar TOTP
        totp = pyotp.TOTP('base32secret3232')
        if totp.verify(totp_code):
            return "Login successful"

    return "Login failed", 401
```

### 3. Capacitación de Usuarios

#### Programa de Concienciación

**Mes 1**: Introducción a phishing
- Qué es phishing
- Indicadores comunes
- Cómo reportar

**Mes 2**: Simulacro (este lab!)
- Campaña de phishing controlada
- Tracking de clicks

**Mes 3**: Resultados y feedback
- Quién clickeó (privado)
- Lecciones aprendidas
- Mejores prácticas

**Mes 4+**: Refuerzo continuo
- Simulacros mensuales aleatorios
- Newsletters de seguridad
- Recordatorios visuales

#### Métricas de Éxito

```
Baseline (Mes 0): 40% de usuarios clickean phishing
Objetivo (Mes 6): <10% clickean
Objetivo (Mes 12): <5% clickean
```

**Ejemplo de progreso**:
```
Mes 1: 40% clicked → 35% improvement
Mes 3: 25% clicked → 62% improvement
Mes 6: 8% clicked → 80% improvement ✅
```

---

## Parte 4: Documentación de Incidente

### Plantilla de Reporte de Incidente

```markdown
# INCIDENT REPORT #IR-2024-001

## EXECUTIVE SUMMARY
Date: 2024-02-10
Severity: Medium
Status: Resolved
Type: Phishing Simulation

## INCIDENT DETAILS

### Timeline
- 10:00 AM: Phishing campaign launched (15 targets)
- 10:05 AM: First email opened
- 10:12 AM: First link clicked (User: john.doe)
- 10:15 AM: Credentials submitted (User: john.doe)
- 11:00 AM: Campaign completed
- 11:30 AM: Results analyzed
- 02:00 PM: Users debriefed

### Affected Users
| User | Email | Opened | Clicked | Submitted |
|------|-------|--------|---------|-----------|
| John Doe | john.doe@test.local | ✅ | ✅ | ✅ |
| Jane Smith | jane.smith@test.local | ✅ | ✅ | ❌ |
| Bob Johnson | bob.johnson@test.local | ✅ | ❌ | ❌ |

**Summary**:
- 15 emails sent
- 12 opened (80%)
- 5 clicked (33%)
- 1 submitted credentials (6.7%)

## ANALYSIS

### Vulnerabilities Identified
1. Lack of email header inspection
2. Insufficient training on urgency tactics
3. No hover-over link verification
4. Absence of MFA (simulated)

### Root Cause
Users lack awareness of common phishing indicators, specifically:
- Urgency manipulation
- Fake authentication pages

## RECOMMENDATIONS

### Immediate (0-30 days)
1. Deploy email security gateway (Proofpoint)
2. Mandatory MFA for all accounts
3. Browser extension for phishing detection

### Short-term (1-3 months)
1. Quarterly phishing awareness training
2. Monthly phishing simulations
3. Incident reporting workflow improvement

### Long-term (3-12 months)
1. Security champions program
2. Gamification of security training
3. Red team exercises

## LESSONS LEARNED

### What Went Well
- Simulation successful without real compromise
- High engagement from participants
- Clear metrics obtained

### What Could Improve
- More realistic scenarios
- Better pre-campaign communication
- Automated remediation workflows

## ATTACHMENTS
- A1: Email template used
- A2: Landing page screenshot
- A3: Full campaign logs
- A4: User feedback survey results
```

### Generación Automatizada de Reportes

**Script de exportación**:
```bash
#!/bin/bash
# export_gophish_report.sh

CAMPAIGN_ID=$1
API_KEY="your_api_key_here"

curl -H "Authorization: Bearer $API_KEY" \
  "http://localhost:3333/api/campaigns/$CAMPAIGN_ID/results?api_key=$API_KEY" \
  | jq '.' > campaign_results.json

# Generar CSV
jq -r '.results[] | [.email, .status, .ip] | @csv' campaign_results.json > campaign_results.csv

echo "Report generated: campaign_results.csv"
```

---

## Criterios de Evaluación

- [ ] Campaña de phishing configurada y ejecutada
- [ ] Al menos 3 usuarios objetivo creados
- [ ] Landing page funcional capturando datos
- [ ] Logs analizados e interpretados
- [ ] Contramedidas propuestas (mínimo 3)
- [ ] Reporte de incidente completo
- [ ] Lecciones aprendidas documentadas
- [ ] Plan de capacitación propuesto

---

## Entregables

1. **Screenshots**:
   - Dashboard de campaña de GoPhish
   - Email recibido en MailHog
   - Landing page funcional
   - Logs en SIEM (si aplica)

2. **Reporte de Incidente** (usar plantilla)

3. **Propuesta de Programa de Capacitación** (1-2 páginas):
   - Objetivos
   - Cronograma (6 meses)
   - Métricas de éxito
   - Presupuesto estimado

4. **Análisis de Contramedidas** (1 página):
   - Controles técnicos a implementar
   - Priorización (crítico, alto, medio)
   - Timeline de implementación

---

## Preguntas de Reflexión

1. ¿Por qué el sentido de urgencia es efectivo en phishing?
2. ¿Cómo balanceas educación vs. "asustar" a usuarios?
3. ¿Qué métricas usarías para evaluar éxito del programa?
4. ¿Cuándo es apropiado realizar simulacros sin previo aviso?
5. ¿Cómo manejarías usuarios que fallan repetidamente?

---

## Consideraciones Legales y Éticas

### ✅ Buenas Prácticas

- **Obtener aprobación** de management antes de simulacros
- **Comunicar propósito** (mejorar seguridad, no castigo)
- **Confidencialidad** de resultados individuales
- **Educación inmediata** post-simulacro
- **Ambiente no-punitivo** (aprendizaje, no disciplina)

### ❌ Evitar

- Simulacros sin autorización
- Públicamente avergonzar a quién falló
- Uso de temas sensibles (salud, despidos, legal)
- Simulacros muy frecuentes (fatiga)
- Ausencia de follow-up educativo

### Política Sugerida

```
POLÍTICA DE SIMULACROS DE PHISHING

1. Objetivo: Mejorar concienciación, NO identificar individuos para disciplina
2. Frecuencia: Trimestral, con calendario conocido (no fechas específicas)
3. Comunicación: Anuncio general de programa (no de simulacros individuales)
4. Resultados: Agregados públicos, individuales privados
5. Educación: Obligatoria para quienes fallen
6. Escalación: Solo después de 3+ fallas
```

---

## Recursos Adicionales

### Herramientas

- [GoPhish](https://getgophish.com/) - Plataforma de phishing simulation
- [MailHog](https://github.com/mailhog/MailHog) - Email testing tool
- [PhishMe / Cofense](https://cofense.com/) - Comercial, más features
- [King Phisher](https://github.com/rsmusllp/king-phisher) - Alternativa open source

### Templates y Recursos

- [PhishingFrenzy Templates](https://github.com/pentestgeek/phishing-frenzy)
- [Social Engineer Toolkit (SET)](https://github.com/trustedsec/social-engineer-toolkit)
- [NIST Phishing Guide](https://www.nist.gov/itl/applied-cybersecurity/tig/phishing)

### Capacitación

- [KnowBe4 Security Awareness Training](https://www.knowbe4.com/)
- [SANS Security Awareness](https://www.sans.org/security-awareness-training/)
- [PhishMe / Cofense](https://cofense.com/)

---

## Extensiones del Laboratorio

### Nivel Avanzado

1. **Spear Phishing**: Crear emails personalizados por rol
2. **Whaling**: Simular ataque a ejecutivos (CEO fraud)
3. **Clone Phishing**: Duplicar email legítimo previo
4. **Vishing**: Combinar con llamadas telefónicas
5. **Malware Simulation**: Adjuntos con macros (sandbox)

### Automatización

**Campaña programada mensual**:
```python
# gophish_automation.py
import gophish
import schedule
import time

api_key = 'YOUR_API_KEY'
api = gophish.Gophish(api_key)

def launch_campaign():
    campaign = {
        'name': f'Monthly Phishing Test {time.strftime("%Y-%m")}',
        'template': {'name': 'IT Support - Password Expiration'},
        'page': {'name': 'Fake Microsoft Login'},
        'smtp': {'name': 'Test SMTP'},
        'groups': [{'name': 'All Employees'}]
    }
    api.campaigns.post(campaign)
    print(f"Campaign launched: {campaign['name']}")

# Programar para el primer lunes de cada mes
schedule.every().monday.at("09:00").do(launch_campaign)

while True:
    schedule.run_pending()
    time.sleep(3600)  # Verificar cada hora
```

---

[⬅️ Volver al Módulo](../) | [➡️ Siguiente: Evaluación](../../evaluacion/)
