# Automatización de Compliance: GRC, IaC y Policy as Code

## Índice

1. [Introducción](#introducción)
2. [GRC Platforms](#grc-platforms)
3. [Infrastructure as Code (IaC) para Compliance](#iac)
4. [Policy as Code](#policy-as-code)
5. [Continuous Compliance](#continuous-compliance)
6. [Evidence Automation](#evidence-automation)
7. [Compliance Testing](#testing)
8. [Integration Patterns](#integration)
9. [Security as Code](#security-as-code)
10. [Referencias](#referencias)

---

## Introducción {#introducción}

**Compliance Automation** es el uso de tecnología para reducir el esfuerzo manual en actividades de cumplimiento normativo (ISO 27001, SOC 2, PCI DSS, HIPAA, GDPR).

### Problemas del Compliance Manual

| Problema | Impacto | Solución Automatizada |
|----------|---------|----------------------|
| **Recolección manual de evidencia** | 40-60 horas/mes | Scripts de exportación automática |
| **Revisiones de acceso manuales** | 20-30 horas/trimestre | Workflows automatizados con aprobaciones |
| **Vulnerabilidades no detectadas** | Riesgo de incumplimiento | Escaneo continuo + alertas |
| **Config drift** | Controles debilitados sin darse cuenta | IaC + config monitoring |
| **Auditorías reactivas** | Pánico pre-audit | Continuous compliance dashboards |

### Beneficios de la Automatización

✅ **Reducción de costos**: 50-70% menos horas-persona
✅ **Menor riesgo**: Detección temprana de desviaciones
✅ **Auditorías más rápidas**: Evidencia centralizada y accesible
✅ **Compliance continuo**: No solo "snapshots" anuales
✅ **Escalabilidad**: Fácil cubrir más sistemas y frameworks

---

## GRC Platforms {#grc-platforms}

### Comparación de Plataformas GRC

| Plataforma | Precio | Frameworks | Integraciones | Mejor para |
|------------|--------|------------|---------------|------------|
| **Vanta** | $300-3K/mo | SOC 2, ISO 27001, HIPAA, GDPR | 50+ (AWS, Okta, GitHub) | Startups SaaS |
| **Drata** | $250-2.5K/mo | SOC 2, ISO 27001, HIPAA, PCI | 100+ | Empresas medianas |
| **Secureframe** | $500-5K/mo | SOC 2, ISO 27001, PCI, GDPR | 75+ | Empresas en crecimiento |
| **OneTrust** | $100K+/año | Todos (GDPR focus) | 300+ | Enterprise |
| **ServiceNow GRC** | $200K+/año | Personalizable | Ecosistema ServiceNow | Large enterprise |
| **Hyperproof** | $30K+/año | Todos | 50+ | Mid-market |
| **AuditBoard** | $50K+/año | SOC 1/2, Sarbanes-Oxley | 40+ | Finance/audit teams |

### Arquitectura Típica de GRC Platform

```
┌──────────────────────────────────────────────────────────────┐
│                  GRC PLATFORM ARCHITECTURE                   │
└──────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   DATA COLLECTION LAYER                    │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │   AWS API   │  │  Okta API   │  │  GitHub API  │      │
│  │ (CloudTrail,│  │ (Users,     │  │ (Repos,      │      │
│  │  Config)    │  │  Groups)    │  │  Commits)    │      │
│  └─────────────┘  └─────────────┘  └──────────────┘      │
│         │                │                  │             │
│         └────────────────┴──────────────────┘             │
│                          │                                │
│                          ▼                                │
│         ┌────────────────────────────────┐               │
│         │  Integration Bus (API Gateway) │               │
│         └────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   COMPLIANCE LOGIC LAYER                   │
├────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐        │
│  │  Control Mapping Engine                       │        │
│  │  ├─ AWS MFA → SOC 2 CC6.1                    │        │
│  │  ├─ Okta SSO → ISO 27001 A.9.4.2             │        │
│  │  └─ GitHub branch protection → CC8.1          │        │
│  └───────────────────────────────────────────────┘        │
│                          │                                │
│  ┌───────────────────────────────────────────────┐        │
│  │  Evidence Collection Engine                   │        │
│  │  ├─ Fetch logs/configs                        │        │
│  │  ├─ Take screenshots                          │        │
│  │  └─ Generate reports                          │        │
│  └───────────────────────────────────────────────┘        │
│                          │                                │
│  ┌───────────────────────────────────────────────┐        │
│  │  Anomaly Detection Engine                     │        │
│  │  ├─ Config drift detection                    │        │
│  │  ├─ Access review reminders                   │        │
│  │  └─ Policy violations                         │        │
│  └───────────────────────────────────────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                       │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Compliance  │  │  Evidence   │  │   Audit     │       │
│  │ Dashboard   │  │  Repository │  │   Reports   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└────────────────────────────────────────────────────────────┘
```

---

## Infrastructure as Code (IaC) para Compliance {#iac}

### Compliance as Code con Terraform

**Objetivo**: Definir infraestructura que sea "compliance by design".

#### Ejemplo: AWS S3 Bucket con Encriptación Obligatoria

```hcl
# terraform/modules/compliant-s3/main.tf

resource "aws_s3_bucket" "compliant_bucket" {
  bucket = var.bucket_name

  tags = {
    Compliance  = "SOC2-CC6.8"
    Environment = var.environment
    Owner       = var.owner
  }
}

# Forzar encriptación AES-256
resource "aws_s3_bucket_server_side_encryption_configuration" "compliant_bucket" {
  bucket = aws_s3_bucket.compliant_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bloquear acceso público
resource "aws_s3_bucket_public_access_block" "compliant_bucket" {
  bucket = aws_s3_bucket.compliant_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versionamiento habilitado
resource "aws_s3_bucket_versioning" "compliant_bucket" {
  bucket = aws_s3_bucket.compliant_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Logging habilitado
resource "aws_s3_bucket_logging" "compliant_bucket" {
  bucket = aws_s3_bucket.compliant_bucket.id

  target_bucket = var.logging_bucket
  target_prefix = "s3-access-logs/${var.bucket_name}/"
}

# Lifecycle policy para retención
resource "aws_s3_bucket_lifecycle_configuration" "compliant_bucket" {
  bucket = aws_s3_bucket.compliant_bucket.id

  rule {
    id     = "retention-policy"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555  # 7 años (compliance regulation)
    }
  }
}

# Output para evidencia
output "compliance_evidence" {
  value = {
    bucket_name              = aws_s3_bucket.compliant_bucket.id
    encryption_enabled       = true
    encryption_algorithm     = "AES256"
    versioning_enabled       = true
    public_access_blocked    = true
    logging_enabled          = true
    logging_target           = var.logging_bucket
    retention_policy_days    = 2555
    compliance_tags          = aws_s3_bucket.compliant_bucket.tags
  }
}
```

### Policy as Code con Sentinel (Terraform Cloud)

```hcl
# sentinel/enforce-s3-encryption.sentinel

import "tfplan/v2" as tfplan

# Regla: Todos los buckets S3 deben tener encriptación
main = rule {
  all tfplan.resource_changes as _, rc {
    rc.type is "aws_s3_bucket" and
    rc.mode is "managed" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
    implies
    rc.change.after.server_side_encryption_configuration is not null
  }
}
```

### Open Policy Agent (OPA) para Kubernetes

```rego
# opa/policies/pod-security.rego

package kubernetes.admission

deny[msg] {
    input.request.kind.kind == "Pod"
    not input.request.object.spec.securityContext.runAsNonRoot
    msg = "Pods must not run as root (SOC 2 CC6.3)"
}

deny[msg] {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    not container.securityContext.readOnlyRootFilesystem
    msg = sprintf("Container '%v' must use read-only root filesystem (ISO 27001 A.12.6.2)", [container.name])
}

deny[msg] {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    container.securityContext.privileged
    msg = sprintf("Container '%v' cannot run in privileged mode (CIS Benchmark)", [container.name])
}
```

---

## Policy as Code {#policy-as-code}

### AWS Config Rules (Managed + Custom)

#### Ejemplo: Detectar S3 Buckets sin Encriptación

```python
# lambda/custom-config-rule/s3_encryption_check.py

import boto3
import json

def lambda_handler(event, context):
    """
    AWS Config Custom Rule: Check S3 bucket encryption
    """
    config = boto3.client('config')
    s3 = boto3.client('s3')

    # Get S3 bucket from Config event
    configuration_item = json.loads(event['configurationItem'])
    bucket_name = configuration_item['resourceName']

    compliance_type = 'NON_COMPLIANT'
    annotation = 'Encryption not enabled'

    try:
        # Check encryption configuration
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)

        # Verify AES256 or aws:kms
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        if rules and rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']:
            compliance_type = 'COMPLIANT'
            annotation = f"Encryption enabled: {rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']}"

    except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
        compliance_type = 'NON_COMPLIANT'
        annotation = 'No encryption configuration found'

    # Report to AWS Config
    config.put_evaluations(
        Evaluations=[
            {
                'ComplianceResourceType': configuration_item['resourceType'],
                'ComplianceResourceId': bucket_name,
                'ComplianceType': compliance_type,
                'Annotation': annotation,
                'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
            }
        ],
        ResultToken=event['resultToken']
    )

    return compliance_type
```

### Terraform Sentinel Example

```hcl
# sentinel/require-tags.sentinel

import "tfplan/v2" as tfplan

# Required tags para compliance
required_tags = ["Owner", "Environment", "Compliance", "DataClassification"]

# Regla: Todos los recursos deben tener tags obligatorios
main = rule {
  all tfplan.resource_changes as _, rc {
    rc.mode is "managed" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
    implies
    all required_tags as tag {
      rc.change.after.tags contains tag
    }
  }
}
```

---

## Continuous Compliance {#continuous-compliance}

### Architecture Pattern: Continuous Compliance Pipeline

```
┌────────────────────────────────────────────────────────────┐
│            CONTINUOUS COMPLIANCE PIPELINE                  │
└────────────────────────────────────────────────────────────┘

   ┌─────────────┐
   │   Deploy    │
   │  (Terraform,│
   │ CloudFormation)
   └──────┬──────┘
          │
          ▼
   ┌─────────────────┐
   │ Policy Check    │
   │ (Sentinel, OPA) │───┐ FAIL → Block deployment
   └──────┬──────────┘   │
          │ PASS         │
          ▼              ▼
   ┌─────────────────┐  ┌──────────────┐
   │  Deploy to ENV  │  │ Alert DevOps │
   └──────┬──────────┘  └──────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Config Monitoring    │
   │ (AWS Config,         │
   │  Azure Policy,       │
   │  GCP Security Center)│
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Compliance Assessment│
   │ (Every 24h)          │
   │ - Check 100+ controls│
   │ - Generate evidence  │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Dashboard Update     │
   │ (GRC Platform)       │
   │ - Control status     │
   │ - Evidence links     │
   │ - Non-compliance     │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Alerting & Remediation
   │ - Slack/Teams alerts │
   │ - JIRA tickets       │
   │ - Auto-remediation   │
   └──────────────────────┘
```

### Automated Remediation Example (AWS Lambda)

```python
# lambda/auto-remediation/disable-public-s3.py

import boto3
import json

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Auto-remediation: Disable public access on S3 buckets
    Triggered by AWS Config NON_COMPLIANT event
    """

    # Parse Config event
    config_item = json.loads(event['configurationItem'])
    bucket_name = config_item['resourceName']

    print(f"🔧 Auto-remediating bucket: {bucket_name}")

    try:
        # Apply public access block
        s3.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )

        print(f"✅ Public access blocked on {bucket_name}")

        # Tag bucket for audit trail
        s3.put_bucket_tagging(
            Bucket=bucket_name,
            Tagging={
                'TagSet': [
                    {'Key': 'AutoRemediated', 'Value': 'true'},
                    {'Key': 'RemediationDate', 'Value': context.aws_request_id},
                    {'Key': 'ComplianceControl', 'Value': 'SOC2-CC6.7'}
                ]
            }
        )

        # Send notification
        sns = boto3.client('sns')
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789012:compliance-alerts',
            Subject=f'Auto-Remediation: {bucket_name}',
            Message=f'Public access automatically disabled on S3 bucket {bucket_name}'
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Remediation successful for {bucket_name}')
        }

    except Exception as e:
        print(f"❌ Error remediating {bucket_name}: {str(e)}")
        raise
```

---

## Evidence Automation {#evidence-automation}

### Automated Evidence Collection Script

```python
#!/usr/bin/env python3
"""
Automated Evidence Collection for SOC 2
Collects evidence from various sources and uploads to GRC platform
"""

import os
import json
import boto3
from datetime import datetime, timedelta
import requests

class EvidenceCollector:
    def __init__(self, grc_api_key, grc_api_url):
        self.grc_api_key = grc_api_key
        self.grc_api_url = grc_api_url
        self.evidence_items = []

    def collect_aws_mfa_enforcement(self):
        """
        Control: CC6.1 - MFA for privileged access
        Evidence: IAM users with MFA enabled
        """
        iam = boto3.client('iam')

        users = iam.list_users()['Users']
        mfa_stats = {
            'total_users': len(users),
            'mfa_enabled': 0,
            'mfa_disabled': 0,
            'users_without_mfa': []
        }

        for user in users:
            username = user['UserName']
            mfa_devices = iam.list_mfa_devices(UserName=username)['MFADevices']

            if mfa_devices:
                mfa_stats['mfa_enabled'] += 1
            else:
                mfa_stats['mfa_disabled'] += 1
                mfa_stats['users_without_mfa'].append(username)

        evidence = {
            'control_id': 'CC6.1',
            'control_name': 'MFA Enforcement',
            'timestamp': datetime.now().isoformat(),
            'status': 'PASS' if mfa_stats['mfa_disabled'] == 0 else 'FAIL',
            'data': mfa_stats,
            'compliance_rate': (mfa_stats['mfa_enabled'] / mfa_stats['total_users']) * 100
        }

        self.evidence_items.append(evidence)
        return evidence

    def collect_aws_encryption_at_rest(self):
        """
        Control: CC6.8 - Encryption at rest
        Evidence: S3 buckets with encryption enabled
        """
        s3 = boto3.client('s3')

        buckets = s3.list_buckets()['Buckets']
        encryption_stats = {
            'total_buckets': len(buckets),
            'encrypted': 0,
            'unencrypted': 0,
            'unencrypted_buckets': []
        }

        for bucket in buckets:
            bucket_name = bucket['Name']

            try:
                s3.get_bucket_encryption(Bucket=bucket_name)
                encryption_stats['encrypted'] += 1
            except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                encryption_stats['unencrypted'] += 1
                encryption_stats['unencrypted_buckets'].append(bucket_name)

        evidence = {
            'control_id': 'CC6.8',
            'control_name': 'Encryption at Rest (S3)',
            'timestamp': datetime.now().isoformat(),
            'status': 'PASS' if encryption_stats['unencrypted'] == 0 else 'FAIL',
            'data': encryption_stats,
            'compliance_rate': (encryption_stats['encrypted'] / encryption_stats['total_buckets']) * 100 if encryption_stats['total_buckets'] > 0 else 0
        }

        self.evidence_items.append(evidence)
        return evidence

    def collect_vulnerability_scan_results(self):
        """
        Control: CC7.2 - Vulnerability management
        Evidence: Latest vulnerability scan results
        """
        # Simulación (en producción, integrar con Nessus/Qualys API)
        evidence = {
            'control_id': 'CC7.2',
            'control_name': 'Vulnerability Scans',
            'timestamp': datetime.now().isoformat(),
            'status': 'PASS',
            'data': {
                'scan_date': (datetime.now() - timedelta(days=7)).isoformat(),
                'critical_vulns': 0,
                'high_vulns': 3,
                'medium_vulns': 15,
                'low_vulns': 42,
                'remediation_sla': {
                    'critical': '< 7 days',
                    'high': '< 30 days',
                    'medium': '< 90 days'
                }
            }
        }

        self.evidence_items.append(evidence)
        return evidence

    def collect_backup_logs(self):
        """
        Control: A1.2 - Backup and recovery
        Evidence: Backup success logs (last 30 days)
        """
        # Simulación
        evidence = {
            'control_id': 'A1.2',
            'control_name': 'Backup and Recovery',
            'timestamp': datetime.now().isoformat(),
            'status': 'PASS',
            'data': {
                'period': 'Last 30 days',
                'total_backups': 90,
                'successful': 90,
                'failed': 0,
                'success_rate': 100.0,
                'last_restore_test': (datetime.now() - timedelta(days=15)).isoformat()
            }
        }

        self.evidence_items.append(evidence)
        return evidence

    def upload_evidence_to_grc(self):
        """
        Upload collected evidence to GRC platform
        """
        headers = {
            'Authorization': f'Bearer {self.grc_api_key}',
            'Content-Type': 'application/json'
        }

        for evidence in self.evidence_items:
            response = requests.post(
                f'{self.grc_api_url}/evidence',
                headers=headers,
                json=evidence
            )

            if response.status_code == 201:
                print(f"✅ Uploaded evidence for {evidence['control_id']}")
            else:
                print(f"❌ Failed to upload evidence for {evidence['control_id']}: {response.text}")

    def generate_report(self):
        """
        Generate compliance summary report
        """
        total_controls = len(self.evidence_items)
        passed_controls = sum(1 for e in self.evidence_items if e['status'] == 'PASS')

        report = {
            'timestamp': datetime.now().isoformat(),
            'total_controls_checked': total_controls,
            'passed': passed_controls,
            'failed': total_controls - passed_controls,
            'compliance_score': (passed_controls / total_controls) * 100 if total_controls > 0 else 0,
            'evidence_items': self.evidence_items
        }

        # Save to file
        filename = f'compliance_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n📊 Compliance Report Generated: {filename}")
        print(f"   Total Controls: {total_controls}")
        print(f"   Passed: {passed_controls}")
        print(f"   Failed: {total_controls - passed_controls}")
        print(f"   Compliance Score: {report['compliance_score']:.2f}%")

        return report


if __name__ == '__main__':
    # Configuration
    GRC_API_KEY = os.getenv('GRC_API_KEY', 'your-api-key')
    GRC_API_URL = os.getenv('GRC_API_URL', 'https://api.vanta.com/v1')

    collector = EvidenceCollector(GRC_API_KEY, GRC_API_URL)

    # Collect evidence
    print("🔍 Collecting evidence...")
    collector.collect_aws_mfa_enforcement()
    collector.collect_aws_encryption_at_rest()
    collector.collect_vulnerability_scan_results()
    collector.collect_backup_logs()

    # Upload to GRC platform
    print("\n📤 Uploading evidence to GRC platform...")
    # collector.upload_evidence_to_grc()  # Uncomment in production

    # Generate report
    collector.generate_report()
```

---

## Compliance Testing {#testing}

### InSpec для Compliance Testing

```ruby
# inspec/profiles/soc2-controls/controls/cc6_1_mfa.rb

control 'cc6-1-mfa' do
  impact 1.0
  title 'CC6.1 - Multi-Factor Authentication'
  desc 'All privileged users must have MFA enabled'

  describe aws_iam_users.where(has_mfa_enabled: false) do
    it { should_not exist }
  end

  aws_iam_users.where(has_console_password: true).entries.each do |user|
    describe aws_iam_user(user.user_name) do
      it { should have_mfa_enabled }
    end
  end
end
```

```bash
# Ejecutar InSpec tests
inspec exec inspec/profiles/soc2-controls \
  --target aws:// \
  --reporter cli json:compliance-results.json html:compliance-report.html
```

---

## Integration Patterns {#integration}

### Webhook Integration: AWS Config → Slack

```python
# lambda/config-to-slack/handler.py

import json
import urllib.request

def lambda_handler(event, context):
    """
    Send AWS Config compliance changes to Slack
    """
    SLACK_WEBHOOK = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

    # Parse Config event
    detail = event['detail']
    resource_type = detail['resourceType']
    resource_id = detail['resourceId']
    compliance_type = detail['newEvaluationResult']['complianceType']
    config_rule_name = detail['configRuleName']

    # Determine color
    color = '#36a64f' if compliance_type == 'COMPLIANT' else '#ff0000'

    # Build Slack message
    slack_message = {
        'attachments': [
            {
                'color': color,
                'title': f'AWS Config: {compliance_type}',
                'fields': [
                    {'title': 'Rule', 'value': config_rule_name, 'short': True},
                    {'title': 'Resource Type', 'value': resource_type, 'short': True},
                    {'title': 'Resource ID', 'value': resource_id, 'short': False},
                ]
            }
        ]
    }

    # Send to Slack
    req = urllib.request.Request(
        SLACK_WEBHOOK,
        data=json.dumps(slack_message).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    urllib.request.urlopen(req)

    return {'statusCode': 200}
```

---

## Security as Code {#security-as-code}

### Pre-Commit Hook: Detect Secrets

```bash
# .pre-commit-config.yaml

repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  - repo: https://github.com/bridgecrewio/checkov
    rev: 2.3.0
    hooks:
      - id: checkov
        args: ['--framework', 'terraform', '--quiet']

  - repo: https://github.com/aquasecurity/tfsec
    rev: v1.28.0
    hooks:
      - id: tfsec
```

---

## Referencias {#referencias}

### Herramientas Open Source

- **InSpec** - Compliance as code framework: https://www.inspec.io/
- **Open Policy Agent (OPA)** - Policy engine: https://www.openpolicyagent.org/
- **Cloud Custodian** - Cloud governance: https://cloudcustodian.io/
- **Steampipe** - Cloud inventory: https://steampipe.io/
- **ScoutSuite** - Multi-cloud auditing: https://github.com/nccgroup/ScoutSuite

### Commercial Platforms

- **Vanta**: https://www.vanta.com/
- **Drata**: https://drata.com/
- **Secureframe**: https://secureframe.com/
- **Wiz**: https://www.wiz.io/
- **Orca Security**: https://orca.security/

### Documentación

- **AWS Config**: https://docs.aws.amazon.com/config/
- **Azure Policy**: https://docs.microsoft.com/azure/governance/policy/
- **GCP Security Command Center**: https://cloud.google.com/security-command-center

---

## Conclusión

La automatización de compliance transforma compliance de una carga manual a un proceso continuo y escalable:

✅ **Reducción dramática** de esfuerzo manual (50-70%)
✅ **Detección temprana** de desviaciones de compliance
✅ **Auditorías más rápidas** con evidencia centralizada
✅ **Menor riesgo** mediante monitoreo continuo
✅ **Escalabilidad** para cubrir múltiples frameworks

**Próximo paso**: Laboratorio 1 - ISO 27001 Gap Analysis Automation

---

**Palabras**: ~1600
**Lectura estimada**: 55-65 minutos
