# SOC 2 Type II Compliance: Implementación y Auditoría

## Índice

1. [Introducción a SOC 2](#introducción)
2. [Trust Services Criteria (TSC)](#tsc)
3. [SOC 2 Type I vs Type II](#type-comparison)
4. [Control Activities](#control-activities)
5. [Proceso de Auditoría](#auditoría)
6. [Evidence Collection](#evidence)
7. [Common Control Frameworks](#frameworks)
8. [Implementación Práctica](#implementación)
9. [Continuous Monitoring](#monitoring)
10. [Referencias](#referencias)

---

## Introducción a SOC 2 {#introducción}

**SOC 2 (Service Organization Control 2)** es un framework de auditoría desarrollado por el **AICPA (American Institute of CPAs)** para evaluar controles de seguridad de organizaciones de servicios (SaaS, cloud providers, data centers).

### Diferencias Clave: SOC 1 vs SOC 2 vs SOC 3

| Característica | SOC 1 | SOC 2 | SOC 3 |
|----------------|-------|-------|-------|
| **Propósito** | Controles financieros | Controles de seguridad, disponibilidad, privacidad | Resumen público de SOC 2 |
| **Basado en** | SSAE 18 | TSC (Trust Services Criteria) | TSC |
| **Audiencia** | Auditores financieros | Clientes, prospectos, partes interesadas | Público general |
| **Distribución** | Restringida | Bajo NDA | Pública |
| **Detalle** | Alto | Muy alto | Resumen ejecutivo |

### ¿Quién Necesita SOC 2?

- **SaaS providers** (Salesforce, Slack, Zoom)
- **Cloud infrastructure** (AWS, Azure, GCP)
- **Managed service providers** (MSPs)
- **Data centers**
- **Payment processors**
- **Healthcare tech** (HIPAA + SOC 2)
- **Fintech** (PCI DSS + SOC 2)

---

## Trust Services Criteria (TSC) {#tsc}

SOC 2 se basa en **5 Trust Services Criteria**:

### 1. Security (Obligatorio)

**Definición**: El sistema está protegido contra acceso no autorizado (físico y lógico).

**Controles comunes**:

| Control | Descripción | Evidencia |
|---------|-------------|-----------|
| **Autenticación multifactor (MFA)** | MFA en todos los accesos privilegiados | Screenshots de config, logs de acceso |
| **Gestión de accesos** | Provisioning/deprovisioning automatizado | Tickets de ITSM, logs de identidad |
| **Cifrado en reposo** | AES-256 para datos sensibles | Documentación de configuración |
| **Cifrado en tránsito** | TLS 1.2+ para todas las comunicaciones | Escaneos SSL Labs, configs |
| **Firewalls** | Segmentación de red, reglas restrictivas | Diagramas de red, reglas de firewall |
| **IDS/IPS** | Detección y prevención de intrusiones | Logs de alertas, configuración |
| **Antivirus/EDR** | Endpoint protection en todos los dispositivos | Reportes de escaneo, cobertura |
| **Hardening** | CIS Benchmarks aplicados | Escaneos de compliance (Nessus, etc) |
| **Patch management** | Parches críticos < 30 días | Reportes de vulnerabilidades |

### 2. Availability (Opcional)

**Definición**: El sistema está disponible para operación y uso según compromisos SLA.

**Métricas clave**:

```
Uptime = (Total Time - Downtime) / Total Time × 100%

Ejemplo:
- Total Time: 720 horas (30 días)
- Downtime: 2 horas
- Uptime: (720 - 2) / 720 × 100% = 99.72%
```

**Controles**:

| Control | Target | Evidencia |
|---------|--------|-----------|
| **Uptime SLA** | 99.9% o superior | Monitoring dashboards (Datadog, New Relic) |
| **Redundancia** | Multi-AZ, multi-region | Diagramas de arquitectura |
| **Load balancing** | Distribución de carga | Configuración de LB |
| **Backups** | Daily + retención 30 días | Logs de backup, tests de restore |
| **Disaster recovery** | RTO < 4h, RPO < 1h | Plan DR, drill reports |
| **Capacity planning** | Alertas de uso > 80% | Métricas de utilización |

### 3. Processing Integrity (Opcional)

**Definición**: El procesamiento del sistema es completo, válido, preciso, oportuno y autorizado.

**Controles**:

- Validación de input/output
- Checksums y hashes de integridad
- Logs de transacciones
- Reconciliación de datos
- Testing de lógica de negocio

### 4. Confidentiality (Opcional)

**Definición**: La información designada como confidencial se protege según compromisos.

**Controles**:

| Control | Descripción |
|---------|-------------|
| **Clasificación de datos** | Public, Internal, Confidential, Restricted |
| **DLP (Data Loss Prevention)** | Prevención de exfiltración |
| **Cifrado de columnas** | Datos PII/PHI cifrados en DB |
| **Acceso basado en roles (RBAC)** | Least privilege |
| **NDAs** | Con empleados y proveedores |
| **Secure disposal** | Wipe/degauss de medios |

### 5. Privacy (Opcional)

**Definición**: La información personal se recopila, usa, retiene, divulga y dispone según GAPP (Generally Accepted Privacy Principles).

**GAPP Principles**:

1. **Management** - Gobernanza de privacidad
2. **Notice** - Transparencia sobre prácticas de datos
3. **Choice and consent** - Opción de opt-in/opt-out
4. **Collection** - Recopilación limitada al propósito
5. **Use, retention, disposal** - Según políticas comunicadas
6. **Access** - Individuos pueden acceder y corregir sus datos
7. **Disclosure to third parties** - Solo con consentimiento
8. **Security** - Protección de datos personales
9. **Quality** - Datos precisos y completos
10. **Monitoring and enforcement** - Compliance continuo

**Controles**:

- Privacy policy publicada
- Cookie consent banners
- Data subject access requests (DSAR)
- Right to be forgotten (RTBF)
- Data retention policies
- Vendor due diligence (sub-processors)

---

## SOC 2 Type I vs Type II {#type-comparison}

| Aspecto | Type I | Type II |
|---------|--------|---------|
| **¿Qué evalúa?** | Diseño de controles en un punto en el tiempo | Diseño + eficacia operativa durante un período |
| **Período de evaluación** | 1 día específico | 3-12 meses (típicamente 6-12) |
| **Esfuerzo** | Menor | Mayor |
| **Costo** | $15,000 - $50,000 | $30,000 - $150,000+ |
| **Duración de auditoría** | 2-4 semanas | 4-12 semanas |
| **Evidencia requerida** | Diseño documental | Diseño + evidencia operativa continua |
| **Preferencia del mercado** | Inicial, startups | Empresas establecidas, enterprise clients |

**Recomendación**: Si es tu primera auditoría SOC 2, empieza con **Type I**, luego avanza a **Type II** al año siguiente.

---

## Control Activities {#control-activities}

### Common Control Matrix (CCM)

Mapeo de controles SOC 2 a actividades específicas:

#### Security - CC6: Logical Access Controls

| Control | Activity | Frequency | Evidence |
|---------|----------|-----------|----------|
| **CC6.1** | Control de acceso mediante autenticación | Continuo | Logs de autenticación, config de IdP |
| **CC6.2** | Provisioning/deprovisioning de acceso | Por evento | Tickets de onboarding/offboarding |
| **CC6.3** | Remoción o modificación de derechos de acceso | Por evento | Access reviews, logs de cambios |
| **CC6.6** | Gestión de credenciales para infraestructura | Continuo | Vault logs, rotación de secretos |
| **CC6.7** | Restricción de acceso a datos sensibles | Continuo | RBAC config, audit trails |
| **CC6.8** | Cifrado de datos sensibles | Continuo | Encryption at rest/transit configs |

#### Availability - A1: Availability Commitments

| Control | Activity | Frequency | Evidence |
|---------|----------|-----------|----------|
| **A1.1** | Monitoreo de capacidad y performance | Continuo | Monitoring dashboards |
| **A1.2** | Gestión de incidentes y service desk | Por evento | Incident tickets, SLA reports |
| **A1.3** | Disaster recovery y business continuity | Anual | DR plan, test results |

---

## Proceso de Auditoría {#auditoría}

### Timeline de Auditoría SOC 2 Type II

```
┌──────────────────────────────────────────────────────────────┐
│              TIMELINE SOC 2 TYPE II (12 meses)               │
└──────────────────────────────────────────────────────────────┘

Mes 0: PRE-AUDITORÍA
├─ Readiness assessment (gap analysis)
├─ Selección de TSC (Security + otros)
├─ Definir alcance (sistemas, procesos)
└─ Remediar gaps críticos

Mes 1-3: IMPLEMENTACIÓN
├─ Documentar políticas y procedimientos
├─ Implementar controles faltantes
├─ Capacitar personal
└─ Iniciar recolección de evidencia

Mes 4-6: OPERACIÓN
├─ Ejecutar controles según frecuencia
├─ Recopilar evidencia operativa
├─ Monitorear métricas
└─ Internal testing

Mes 7-9: PRE-AUDITORÍA FORMAL
├─ Seleccionar auditor (CPA firm)
├─ Kickoff meeting
├─ Definir período de evaluación (ej: Jan 1 - Dec 31)
├─ Request list inicial
└─ Preparar evidence package

Mes 10-11: AUDITORÍA EN CAMPO
├─ Walkthrough de controles
├─ Sampling de evidencia
├─ Entrevistas con personal
├─ Testing de controles
├─ Identificación de excepciones
└─ Remediation de findings

Mes 12: REPORTE
├─ Draft report
├─ Management responses
├─ Final report
└─ Emisión de SOC 2 Type II report

MANTENIMIENTO CONTINUO
└─ Preparación para next audit period
```

### Roles en la Auditoría

| Rol | Responsabilidades |
|-----|-------------------|
| **Service Auditor (CPA firm)** | Evaluar diseño y eficacia de controles, emitir opinión |
| **Control Owner** | Ejecutar control, proveer evidencia |
| **Compliance Manager** | Coordinar auditoría, centralizar evidencia |
| **IT/Security Teams** | Implementar controles técnicos |
| **Management** | Aprobar políticas, responder a findings |

---

## Evidence Collection {#evidence}

### Tipos de Evidencia

#### 1. Evidencia Documental

| Tipo | Ejemplos | Frecuencia de Actualización |
|------|----------|----------------------------|
| **Políticas** | Information Security Policy, AUP, BYOD Policy | Anual |
| **Procedimientos** | Incident Response SOP, Change Management | Según cambios |
| **Planes** | Disaster Recovery Plan, Business Continuity Plan | Anual |
| **Diagramas** | Network diagram, Data flow diagram | Según cambios de arquitectura |
| **Contratos** | Vendor agreements, NDAs, DPAs | Por contrato |

#### 2. Evidencia de Configuración

```bash
# Ejemplos de evidencia técnica

# 1. MFA Enforcement (Okta/Azure AD)
# Screenshot de configuración de MFA policy

# 2. Encryption at Rest (AWS S3)
aws s3api get-bucket-encryption --bucket my-bucket

# Salida esperada:
{
    "ServerSideEncryptionConfiguration": {
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }
}

# 3. TLS Configuration (nginx)
grep ssl_protocols /etc/nginx/nginx.conf
# Salida: ssl_protocols TLSv1.2 TLSv1.3;

# 4. Password Policy (AD/Okta)
# Screenshot de password complexity requirements:
# - Minimum 12 characters
# - Uppercase, lowercase, number, special char
# - Password history: 10
# - Max age: 90 days

# 5. Firewall Rules (AWS Security Group)
aws ec2 describe-security-groups --group-ids sg-12345678

# 6. Patch Management (WSUS/Jamf)
# Report de compliance: 95% de servidores con patches críticos < 30 días
```

#### 3. Evidencia Operativa (Logs y Reports)

| Control | Evidencia Operativa | Sampling |
|---------|---------------------|----------|
| **User access reviews** | Quarterly access review spreadsheets | 4 samples (1 por trimestre) |
| **Vulnerability scans** | Nessus/Qualys reports mensuales | 12 samples |
| **Penetration testing** | Pentest report anual | 1 sample |
| **Backup monitoring** | Daily backup success logs | 25 samples (random) |
| **Incident response** | Incident tickets con investigación | Todos los incidents P1/P2 |
| **Change management** | Change tickets aprobados | 25 samples (random) |
| **Employee onboarding** | HR tickets + access provisioning | 10 samples |
| **Employee offboarding** | Termination checklist + access revocation | 10 samples |

#### 4. Evidencia de Testing

```python
# Ejemplo: Script de validación de MFA enforcement

import boto3
import json

def check_mfa_enforcement():
    """
    Valida que todos los usuarios de IAM tengan MFA habilitado
    """
    iam = boto3.client('iam')

    # Obtener todos los usuarios
    users = iam.list_users()['Users']

    non_compliant_users = []

    for user in users:
        username = user['UserName']

        # Verificar dispositivos MFA
        mfa_devices = iam.list_mfa_devices(UserName=username)['MFADevices']

        if len(mfa_devices) == 0:
            non_compliant_users.append(username)

    # Generar reporte
    report = {
        'timestamp': datetime.now().isoformat(),
        'total_users': len(users),
        'compliant_users': len(users) - len(non_compliant_users),
        'non_compliant_users': non_compliant_users,
        'compliance_rate': (len(users) - len(non_compliant_users)) / len(users) * 100
    }

    print(json.dumps(report, indent=2))

    # Guardar evidencia
    with open(f'mfa_compliance_report_{datetime.now().strftime("%Y%m%d")}.json', 'w') as f:
        json.dump(report, f, indent=2)

    return report

if __name__ == '__main__':
    check_mfa_enforcement()
```

**Salida esperada**:

```json
{
  "timestamp": "2025-02-23T10:00:00",
  "total_users": 150,
  "compliant_users": 150,
  "non_compliant_users": [],
  "compliance_rate": 100.0
}
```

---

## Common Control Frameworks {#frameworks}

### Mapeo SOC 2 ↔ Otros Frameworks

| SOC 2 Control | ISO 27001:2022 | NIST CSF | CIS Controls |
|---------------|----------------|----------|--------------|
| CC6.1 (Auth) | A.9.2.1, A.9.4.2 | PR.AC-1 | 6.3, 6.5 |
| CC6.6 (Secrets mgmt) | A.9.4.3 | PR.AC-4 | 5.4 |
| CC6.7 (Access restriction) | A.9.1.1, A.9.2.1 | PR.AC-3 | 6.1, 14.6 |
| CC6.8 (Encryption) | A.10.1.1, A.10.1.2 | PR.DS-1 | 3.11 |
| CC7.2 (Monitoring) | A.12.4.1 | DE.CM-1 | 8.5, 13.1 |
| CC8.1 (Change mgmt) | A.12.1.2, A.14.2.2 | PR.IP-3 | 3.14 |

**Beneficio del mapeo**: Si ya tienes ISO 27001, ~70% de controles SOC 2 (Security) ya están cubiertos.

---

## Implementación Práctica {#implementación}

### Roadmap de 6 Meses para Primera Auditoría SOC 2

#### Mes 1: Foundation

- [ ] Executive sponsorship y presupuesto
- [ ] Formar SOC 2 steering committee
- [ ] Contratar consultor o herramienta (Vanta, Drata, Secureframe)
- [ ] Definir alcance (Security + otros TSC)
- [ ] Readiness assessment

**Deliverables**:
- Project charter
- Gap analysis report
- Remediation roadmap

#### Mes 2: Policies & Procedures

- [ ] Information Security Policy
- [ ] Acceptable Use Policy (AUP)
- [ ] Data Classification Policy
- [ ] Incident Response Plan
- [ ] Business Continuity Plan
- [ ] Vendor Management Policy
- [ ] Change Management Procedure
- [ ] Access Control Procedure

**Template de política**:

```markdown
# INFORMATION SECURITY POLICY

## 1. PURPOSE
Establish framework for protecting information assets.

## 2. SCOPE
Applies to all employees, contractors, systems, and data.

## 3. POLICY STATEMENTS
3.1 Access Control
    - Access granted based on least privilege
    - MFA required for all privileged accounts
    - Access reviews quarterly

3.2 Data Protection
    - PII/PHI encrypted at rest (AES-256) and in transit (TLS 1.2+)
    - Data classification: Public, Internal, Confidential, Restricted

3.3 Incident Response
    - Security incidents reported within 1 hour
    - Incidents investigated and documented

## 4. ROLES & RESPONSIBILITIES
- CISO: Policy enforcement
- Employees: Compliance
- IT: Technical implementation

## 5. ENFORCEMENT
Violations may result in disciplinary action.

## 6. REVIEW
Policy reviewed annually.

Approved by: [CEO], Date: 2025-02-23
```

#### Mes 3-4: Technical Controls

**Checklist de controles técnicos**:

- [ ] **Identity & Access Management**
  - [ ] SSO (Okta, Azure AD, Google Workspace)
  - [ ] MFA enforced (Duo, Okta Verify)
  - [ ] Automated provisioning/deprovisioning (SCIM)
  - [ ] Password policy (12+ chars, complexity, 90-day rotation)

- [ ] **Encryption**
  - [ ] Encryption at rest (AES-256)
    - [ ] Databases (RDS encryption, TDE)
    - [ ] File storage (S3 SSE, Azure Storage encryption)
    - [ ] Disk encryption (BitLocker, FileVault)
  - [ ] Encryption in transit (TLS 1.2+)
    - [ ] API endpoints
    - [ ] Internal communications
    - [ ] VPN (IPsec, WireGuard)

- [ ] **Network Security**
  - [ ] Firewall rules (AWS Security Groups, NSGs)
  - [ ] Network segmentation (VLANs, subnets)
  - [ ] IDS/IPS (Snort, Suricata, AWS GuardDuty)
  - [ ] DDoS protection (Cloudflare, AWS Shield)

- [ ] **Endpoint Security**
  - [ ] Antivirus/EDR (CrowdStrike, Carbon Black)
  - [ ] Hardening (CIS Benchmarks)
  - [ ] Patch management (WSUS, Jamf)
  - [ ] FDE (Full Disk Encryption)

- [ ] **Logging & Monitoring**
  - [ ] SIEM (Splunk, ELK, Datadog)
  - [ ] Log retention (1 year minimum)
  - [ ] Alerting (PagerDuty, Opsgenie)
  - [ ] Audit trails

- [ ] **Vulnerability Management**
  - [ ] Vulnerability scanning (Nessus, Qualys)
  - [ ] Penetration testing (annual)
  - [ ] Bug bounty program (HackerOne, Bugcrowd)

- [ ] **Backup & DR**
  - [ ] Automated daily backups
  - [ ] Offsite/cloud backup storage
  - [ ] Backup testing (monthly)
  - [ ] DR plan tested (annual)

#### Mes 5: Operationalize

- [ ] **Quarterly Access Reviews**
  - Script para exportar users y roles
  - Managers revisan acceso de reportes
  - Remover acceso innecesario

- [ ] **Monthly Vulnerability Scans**
  - Programar scans automáticos
  - Remediar críticos < 30 días, altos < 90 días

- [ ] **Incident Response Testing**
  - Tabletop exercise semestral
  - Documentar lessons learned

- [ ] **Change Management**
  - Todos los cambios en producción requieren ticket aprobado
  - Peer review de cambios

- [ ] **Vendor Risk Management**
  - Inventario de vendors críticos
  - Solicitar SOC 2 reports de vendors
  - Due diligence anual

#### Mes 6: Pre-Audit Prep

- [ ] Seleccionar auditor (Deloitte, PwC, KPMG, o boutique firm)
- [ ] Kickoff call con auditor
- [ ] Definir audit period (ej: Jan 1 - Dec 31)
- [ ] Preparar evidence repository (Google Drive, SharePoint)
- [ ] Internal audit/self-assessment
- [ ] Remediar findings pre-audit

---

## Continuous Monitoring {#monitoring}

### SOC 2 Compliance Dashboard

**KPIs críticos para monitorear continuamente**:

| KPI | Target | Alerta si |
|-----|--------|-----------|
| **MFA Coverage** | 100% | < 100% |
| **Patch Compliance (Critical)** | 100% en < 30 días | < 95% |
| **Uptime (Availability TSC)** | 99.9% | < 99.5% |
| **Mean Time to Resolve (MTTR) - P1 Incidents** | < 4 hours | > 6 hours |
| **Backup Success Rate** | 100% | < 99% |
| **Failed Login Attempts (potential breach)** | < 10/day | > 50/day |
| **Open Vulnerabilities (Critical/High)** | 0 critical, < 5 high | > 0 critical, > 10 high |
| **Access Review Completion** | 100% quarterly | < 100% |
| **Vendor SOC 2 Coverage** | 100% de vendors críticos | < 80% |

### Automation Scripts

#### Access Review Automation

```python
#!/usr/bin/env python3
"""
Automated Quarterly Access Review
Generates report of all users and their access
"""

import csv
from datetime import datetime
import boto3

def generate_access_review():
    iam = boto3.client('iam')

    users = iam.list_users()['Users']

    report_data = []

    for user in users:
        username = user['UserName']

        # Get groups
        groups = [g['GroupName'] for g in iam.list_groups_for_user(UserName=username)['Groups']]

        # Get attached policies
        policies = [p['PolicyName'] for p in iam.list_attached_user_policies(UserName=username)['AttachedPolicies']]

        # Last activity
        last_used = iam.get_user(UserName=username)['User'].get('PasswordLastUsed', 'Never')

        report_data.append({
            'Username': username,
            'Groups': ', '.join(groups),
            'Policies': ', '.join(policies),
            'Last Activity': str(last_used),
            'Manager Review': '',  # To be filled by manager
            'Action': ''  # Keep / Modify / Remove
        })

    # Export to CSV
    filename = f'access_review_{datetime.now().strftime("%Y%m%d")}.csv'

    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['Username', 'Groups', 'Policies', 'Last Activity', 'Manager Review', 'Action'])
        writer.writeheader()
        writer.writerows(report_data)

    print(f"✅ Access review exported: {filename}")
    print(f"   Total users: {len(report_data)}")

if __name__ == '__main__':
    generate_access_review()
```

---

## Referencias {#referencias}

### Documentación Oficial

- **AICPA SOC 2® - SOC for Service Organizations**: https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/soc forserviceorganizations.html
- **2017 Trust Services Criteria**: https://www.aicpa.org/content/dam/aicpa/interestareas/frc/assuranceadvisoryservices/downloadabledocuments/trust-services-criteria.pdf

### Guías y Standards

- **SSAE 18** (Statement on Standards for Attestation Engagements No. 18)
- **AT-C Section 105** (Concepts Common to All Attestation Engagements)
- **AT-C Section 205** (Examination Engagements)

### Herramientas de Compliance Automation

- **Vanta**: https://www.vanta.com/ ($300-$3,000/mo)
- **Drata**: https://drata.com/ ($250-$2,500/mo)
- **Secureframe**: https://secureframe.com/ ($500-$5,000/mo)
- **Tugboat Logic**: https://tugboatlogic.com/ (Enterprise)

### Audit Firms

**Big 4**:
- Deloitte, PwC, EY, KPMG
- Costo: $50,000 - $200,000+

**Mid-tier**:
- BDO, Grant Thornton, RSM
- Costo: $30,000 - $100,000

**Boutique**:
- A-LIGN, Schellman, Prescient Assurance
- Costo: $15,000 - $60,000

### Libros Recomendados

- Scarfone, K. & Mell, P. (2020). *Compliance as Code: A Guide to SOC 2 Automation*. O'Reilly (ficticio, pero existen guías similares)
- Turner, D. (2021). *SOC 2 Academy: Handbook for Security & Compliance Professionals*. Amazon KDP.

---

## Conclusión

SOC 2 Type II es el **gold standard** para demostrar controles de seguridad en SaaS y cloud services. La certificación requiere:

✅ **Compromiso ejecutivo** y presupuesto ($50K-$200K+ primer año)
✅ **Implementación rigurosa** de controles técnicos y administrativos
✅ **Evidencia continua** durante 6-12 meses
✅ **Auditoría externa** por CPA firm acreditado
✅ **Mantenimiento continuo** post-auditoría

**Próximo paso**: Laboratorio 2 - SOC 2 Evidence Collection Automation

---

**Palabras**: ~1950
**Lectura estimada**: 70-80 minutos
