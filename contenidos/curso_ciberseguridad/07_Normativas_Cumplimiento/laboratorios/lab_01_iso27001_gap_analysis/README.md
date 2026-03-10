# Laboratorio 1: ISO 27001 Gap Analysis Automation

## Objetivos

1. Realizar gap analysis automatizado contra ISO 27001:2022 Anexo A
2. Implementar script Python para auditoría de controles
3. Generar reportes de compliance en formato ejecutivo
4. Crear dashboard de compliance en tiempo real
5. Priorizar remediaciones según riesgo e impacto

## Duración: 3-4 horas

---

## Setup

```bash
mkdir -p iso27001-gap-analysis/{scripts,configs,reports,evidence}
cd iso27001-gap-analysis

# Dependencias
pip3 install boto3 python-dateutil tabulate pyyaml jinja2 matplotlib pandas
```

---

## Parte 1: Control Mapping Framework

### Control Matrix YAML

Crear `configs/iso27001_controls.yaml`:

```yaml
# ISO 27001:2022 Anexo A - 93 Controles

organizational_controls:
  - id: A.5.1
    name: "Policies for information security"
    description: "Information security policy and topic-specific policies defined, approved, published, communicated and acknowledged"
    implementation_guidance: "Document ISMS policy, review annually, obtain executive approval"
    evidence_type: ["policy_document", "approval_record", "acknowledgment_records"]
    criticality: "HIGH"
    automation_possible: true

  - id: A.5.7
    name: "Threat intelligence"
    description: "Information relating to information security threats collected and analyzed"
    implementation_guidance: "Subscribe to threat feeds (CISA, CERT), analyze IOCs, integrate with SIEM"
    evidence_type: ["threat_feed_subscription", "ioc_analysis_reports", "siem_integration"]
    criticality: "MEDIUM"
    automation_possible: true

  - id: A.5.23
    name: "Information security for use of cloud services"
    description: "Processes for acquisition, use, management and exit from cloud services"
    implementation_guidance: "Cloud security policy, vendor assessment, SLAs, data residency controls"
    evidence_type: ["cloud_policy", "vendor_soc2_reports", "sla_documents"]
    criticality: "HIGH"
    automation_possible: true

people_controls:
  - id: A.6.1
    name: "Screening"
    description: "Background verification checks on candidates for employment"
    implementation_guidance: "Background checks for all employees, especially privileged roles"
    evidence_type: ["background_check_records", "hr_policy"]
    criticality: "HIGH"
    automation_possible: false

  - id: A.6.2
    name: "Terms and conditions of employment"
    description: "Employment contracts include responsibilities for information security"
    implementation_guidance: "Update employment contracts with security clauses, NDAs"
    evidence_type: ["employment_contract_template", "nda_records"]
    criticality: "MEDIUM"
    automation_possible: false

  - id: A.6.3
    name: "Information security awareness, education and training"
    description: "Personnel receive appropriate awareness education and training"
    implementation_guidance: "Annual security training, phishing simulations, role-based training"
    evidence_type: ["training_records", "phishing_simulation_results", "lms_reports"]
    criticality: "HIGH"
    automation_possible: true

physical_controls:
  - id: A.7.1
    name: "Physical security perimeters"
    description: "Security perimeters defined and used to protect areas containing information"
    implementation_guidance: "Controlled access areas, badge systems, visitor logs"
    evidence_type: ["facility_diagrams", "access_logs", "visitor_logs"]
    criticality: "MEDIUM"
    automation_possible: true

  - id: A.7.2
    name: "Physical entry"
    description: "Secure areas protected by appropriate entry controls"
    implementation_guidance: "Badge access, biometrics, mantrap doors, CCTV"
    evidence_type: ["access_control_system_config", "cctv_footage_retention_policy"]
    criticality: "MEDIUM"
    automation_possible: true

technological_controls:
  - id: A.8.5
    name: "Secure authentication"
    description: "Secure authentication technologies and procedures implemented"
    implementation_guidance: "MFA for all privileged accounts, SSO, password policy (12+ chars, complexity)"
    evidence_type: ["mfa_config", "password_policy_config", "sso_config"]
    criticality: "CRITICAL"
    automation_possible: true

  - id: A.8.9
    name: "Configuration management"
    description: "Configurations of hardware, software, services and networks established, documented, implemented, monitored and reviewed"
    implementation_guidance: "Configuration baselines, change management, IaC (Terraform), config drift detection"
    evidence_type: ["terraform_configs", "change_tickets", "config_scan_reports"]
    criticality: "HIGH"
    automation_possible: true

  - id: A.8.10
    name: "Information deletion"
    description: "Information stored in information systems, devices or any other storage media deleted when no longer required"
    implementation_guidance: "Data retention policy, secure deletion procedures, cryptographic erasure"
    evidence_type: ["retention_policy", "deletion_logs", "data_disposal_records"]
    criticality: "HIGH"
    automation_possible: true

  - id: A.8.23
    name: "Web filtering"
    description: "Access to external websites managed to reduce exposure to malicious content"
    implementation_guidance: "Proxy/firewall with web filtering (block malware, phishing sites)"
    evidence_type: ["web_filter_config", "blocked_sites_logs"]
    criticality: "MEDIUM"
    automation_possible: true

  - id: A.8.24
    name: "Use of cryptography"
    description: "Rules for effective use of cryptography implemented"
    implementation_guidance: "Crypto policy (TLS 1.2+, AES-256, SHA-256), key management"
    evidence_type: ["crypto_policy", "tls_scan_results", "encryption_configs"]
    criticality: "CRITICAL"
    automation_possible: true
```

---

## Parte 2: Automated Gap Analysis Script

Crear `scripts/gap_analyzer.py`:

```python
#!/usr/bin/env python3
"""
ISO 27001:2022 Gap Analysis Automation
"""

import os
import sys
import yaml
import json
import boto3
from datetime import datetime
from tabulate import tabulate
from collections import defaultdict

class ISO27001GapAnalyzer:
    def __init__(self, config_file):
        with open(config_file, 'r') as f:
            self.controls = yaml.safe_load(f)

        self.findings = []
        self.aws_clients = self._initialize_aws_clients()

    def _initialize_aws_clients(self):
        """Initialize AWS clients for automated checks"""
        return {
            'iam': boto3.client('iam'),
            's3': boto3.client('s3'),
            'config': boto3.client('config'),
            'cloudtrail': boto3.client('cloudtrail'),
            'ec2': boto3.client('ec2')
        }

    def check_a_8_5_secure_authentication(self):
        """
        A.8.5 - Secure Authentication
        Check: MFA enabled for all IAM users
        """
        control_id = 'A.8.5'
        iam = self.aws_clients['iam']

        users = iam.list_users()['Users']
        total_users = len(users)
        users_with_mfa = 0
        users_without_mfa = []

        for user in users:
            username = user['UserName']
            mfa_devices = iam.list_mfa_devices(UserName=username)['MFADevices']

            if mfa_devices:
                users_with_mfa += 1
            else:
                users_without_mfa.append(username)

        compliance_rate = (users_with_mfa / total_users * 100) if total_users > 0 else 0
        status = 'COMPLIANT' if compliance_rate == 100 else 'NON_COMPLIANT'

        finding = {
            'control_id': control_id,
            'control_name': 'Secure Authentication',
            'status': status,
            'compliance_rate': compliance_rate,
            'total_items': total_users,
            'compliant_items': users_with_mfa,
            'non_compliant_items': total_users - users_with_mfa,
            'details': {
                'users_without_mfa': users_without_mfa
            },
            'remediation': 'Enable MFA for all IAM users',
            'priority': 'CRITICAL',
            'effort': 'LOW',
            'timestamp': datetime.now().isoformat()
        }

        self.findings.append(finding)
        return finding

    def check_a_8_24_encryption(self):
        """
        A.8.24 - Use of Cryptography
        Check: S3 buckets have encryption enabled
        """
        control_id = 'A.8.24'
        s3 = self.aws_clients['s3']

        buckets = s3.list_buckets()['Buckets']
        total_buckets = len(buckets)
        encrypted_buckets = 0
        unencrypted_buckets = []

        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                s3.get_bucket_encryption(Bucket=bucket_name)
                encrypted_buckets += 1
            except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                unencrypted_buckets.append(bucket_name)

        compliance_rate = (encrypted_buckets / total_buckets * 100) if total_buckets > 0 else 0
        status = 'COMPLIANT' if compliance_rate == 100 else 'NON_COMPLIANT'

        finding = {
            'control_id': control_id,
            'control_name': 'Use of Cryptography (S3)',
            'status': status,
            'compliance_rate': compliance_rate,
            'total_items': total_buckets,
            'compliant_items': encrypted_buckets,
            'non_compliant_items': total_buckets - encrypted_buckets,
            'details': {
                'unencrypted_buckets': unencrypted_buckets
            },
            'remediation': 'Enable AES-256 encryption on all S3 buckets',
            'priority': 'CRITICAL',
            'effort': 'LOW',
            'timestamp': datetime.now().isoformat()
        }

        self.findings.append(finding)
        return finding

    def check_a_8_9_configuration_management(self):
        """
        A.8.9 - Configuration Management
        Check: AWS Config enabled
        """
        control_id = 'A.8.9'
        config_client = self.aws_clients['config']

        try:
            recorders = config_client.describe_configuration_recorders()['ConfigurationRecorders']
            recorder_status = config_client.describe_configuration_recorder_status()['ConfigurationRecordersStatus']

            if recorders and recorder_status:
                recording = all(status['recording'] for status in recorder_status)
                status = 'COMPLIANT' if recording else 'NON_COMPLIANT'
                compliance_rate = 100 if recording else 0
            else:
                status = 'NON_COMPLIANT'
                compliance_rate = 0

        except Exception as e:
            status = 'NON_COMPLIANT'
            compliance_rate = 0

        finding = {
            'control_id': control_id,
            'control_name': 'Configuration Management (AWS Config)',
            'status': status,
            'compliance_rate': compliance_rate,
            'total_items': 1,
            'compliant_items': 1 if status == 'COMPLIANT' else 0,
            'non_compliant_items': 0 if status == 'COMPLIANT' else 1,
            'details': {},
            'remediation': 'Enable AWS Config in all regions',
            'priority': 'HIGH',
            'effort': 'MEDIUM',
            'timestamp': datetime.now().isoformat()
        }

        self.findings.append(finding)
        return finding

    def run_all_checks(self):
        """Execute all automated checks"""
        print("🔍 Running ISO 27001:2022 Gap Analysis...\n")

        checks = [
            self.check_a_8_5_secure_authentication,
            self.check_a_8_24_encryption,
            self.check_a_8_9_configuration_management
        ]

        for check in checks:
            try:
                finding = check()
                status_emoji = '✅' if finding['status'] == 'COMPLIANT' else '❌'
                print(f"{status_emoji} {finding['control_id']}: {finding['control_name']} - {finding['status']} ({finding['compliance_rate']:.1f}%)")
            except Exception as e:
                print(f"⚠️  Error checking {check.__name__}: {e}")

    def generate_summary_report(self):
        """Generate summary report"""
        total_controls_checked = len(self.findings)
        compliant = sum(1 for f in self.findings if f['status'] == 'COMPLIANT')
        non_compliant = total_controls_checked - compliant

        overall_compliance = (compliant / total_controls_checked * 100) if total_controls_checked > 0 else 0

        summary = {
            'timestamp': datetime.now().isoformat(),
            'total_controls_checked': total_controls_checked,
            'compliant': compliant,
            'non_compliant': non_compliant,
            'overall_compliance_rate': overall_compliance,
            'priority_breakdown': self._get_priority_breakdown(),
            'findings': self.findings
        }

        # Print summary
        print("\n" + "="*60)
        print("ISO 27001:2022 GAP ANALYSIS SUMMARY")
        print("="*60)
        print(f"Timestamp: {summary['timestamp']}")
        print(f"Controls Checked: {total_controls_checked}")
        print(f"Compliant: {compliant}")
        print(f"Non-Compliant: {non_compliant}")
        print(f"Overall Compliance: {overall_compliance:.1f}%")
        print("="*60)

        # Save to file
        report_file = f"reports/gap_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs('reports', exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump(summary, f, indent=2)

        print(f"\n📄 Detailed report saved: {report_file}")

        return summary

    def _get_priority_breakdown(self):
        """Get breakdown of findings by priority"""
        priority_counts = defaultdict(int)
        for finding in self.findings:
            if finding['status'] == 'NON_COMPLIANT':
                priority_counts[finding['priority']] += 1
        return dict(priority_counts)

    def generate_remediation_plan(self):
        """Generate prioritized remediation plan"""
        non_compliant = [f for f in self.findings if f['status'] == 'NON_COMPLIANT']

        # Sort by priority (CRITICAL > HIGH > MEDIUM > LOW) then effort
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        effort_order = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}

        non_compliant.sort(key=lambda x: (priority_order[x['priority']], effort_order[x['effort']]))

        print("\n" + "="*80)
        print("REMEDIATION PLAN (Prioritized)")
        print("="*80)

        table_data = []
        for idx, finding in enumerate(non_compliant, 1):
            table_data.append([
                idx,
                finding['control_id'],
                finding['control_name'],
                finding['priority'],
                finding['effort'],
                finding['remediation']
            ])

        print(tabulate(table_data,
                      headers=['#', 'Control ID', 'Control Name', 'Priority', 'Effort', 'Remediation'],
                      tablefmt='grid'))

        # Save remediation plan
        remediation_file = f"reports/remediation_plan_{datetime.now().strftime('%Y%m%d')}.json"
        with open(remediation_file, 'w') as f:
            json.dump(non_compliant, f, indent=2)

        print(f"\n📋 Remediation plan saved: {remediation_file}")


if __name__ == '__main__':
    analyzer = ISO27001GapAnalyzer('configs/iso27001_controls.yaml')
    analyzer.run_all_checks()
    analyzer.generate_summary_report()
    analyzer.generate_remediation_plan()
```

---

## Parte 3: Executive Report Generator

Crear `scripts/generate_executive_report.py`:

```python
#!/usr/bin/env python3
"""
Generate Executive Report from Gap Analysis Results
"""

import json
import sys
from jinja2 import Template
from datetime import datetime

REPORT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>ISO 27001:2022 Gap Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; }
        .summary { background: #ecf0f1; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #3498db; }
        .metric-label { font-size: 0.9em; color: #7f8c8d; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #34495e; color: white; }
        .compliant { color: #27ae60; }
        .non-compliant { color: #e74c3c; }
        .critical { background-color: #e74c3c; color: white; padding: 5px; }
        .high { background-color: #e67e22; color: white; padding: 5px; }
        .medium { background-color: #f39c12; color: white; padding: 5px; }
    </style>
</head>
<body>
    <h1>ISO 27001:2022 Gap Analysis Report</h1>
    <p><strong>Generated:</strong> {{ timestamp }}</p>

    <div class="summary">
        <h2>Executive Summary</h2>
        <div class="metric">
            <div class="metric-value">{{ overall_compliance_rate|round(1) }}%</div>
            <div class="metric-label">Overall Compliance</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ compliant }}</div>
            <div class="metric-label">Compliant Controls</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ non_compliant }}</div>
            <div class="metric-label">Non-Compliant Controls</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ total_controls_checked }}</div>
            <div class="metric-label">Total Controls Checked</div>
        </div>
    </div>

    <h2>Findings by Control</h2>
    <table>
        <tr>
            <th>Control ID</th>
            <th>Control Name</th>
            <th>Status</th>
            <th>Compliance Rate</th>
            <th>Priority</th>
            <th>Effort</th>
        </tr>
        {% for finding in findings %}
        <tr>
            <td>{{ finding.control_id }}</td>
            <td>{{ finding.control_name }}</td>
            <td class="{{ 'compliant' if finding.status == 'COMPLIANT' else 'non-compliant' }}">
                {{ finding.status }}
            </td>
            <td>{{ finding.compliance_rate|round(1) }}%</td>
            <td>
                {% if finding.status == 'NON_COMPLIANT' %}
                <span class="{{ finding.priority.lower() }}">{{ finding.priority }}</span>
                {% else %}
                -
                {% endif %}
            </td>
            <td>{{ finding.effort if finding.status == 'NON_COMPLIANT' else '-' }}</td>
        </tr>
        {% endfor %}
    </table>

    <h2>Priority Breakdown</h2>
    <ul>
        {% for priority, count in priority_breakdown.items() %}
        <li><strong>{{ priority }}:</strong> {{ count }} finding(s)</li>
        {% endfor %}
    </ul>

    <h2>Recommended Actions</h2>
    <ol>
        {% for finding in findings %}
        {% if finding.status == 'NON_COMPLIANT' %}
        <li>
            <strong>{{ finding.control_id }} - {{ finding.control_name }}</strong><br>
            <em>Remediation:</em> {{ finding.remediation }}<br>
            <em>Priority:</em> <span class="{{ finding.priority.lower() }}">{{ finding.priority }}</span>,
            <em>Effort:</em> {{ finding.effort }}
        </li>
        {% endif %}
        {% endfor %}
    </ol>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d;">
        <p>This report was generated automatically by ISO 27001 Gap Analysis Tool.</p>
    </footer>
</body>
</html>
"""

def generate_html_report(json_file):
    """Generate HTML report from JSON results"""
    with open(json_file, 'r') as f:
        data = json.load(f)

    template = Template(REPORT_TEMPLATE)
    html = template.render(**data)

    output_file = json_file.replace('.json', '.html')
    with open(output_file, 'w') as f:
        f.write(html)

    print(f"✅ Executive report generated: {output_file}")
    return output_file

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 generate_executive_report.py <gap_analysis.json>")
        sys.exit(1)

    generate_html_report(sys.argv[1])
```

---

## Parte 4: Ejecución Completa

```bash
# 1. Ejecutar gap analysis
python3 scripts/gap_analyzer.py

# 2. Generar reporte ejecutivo
python3 scripts/generate_executive_report.py reports/gap_analysis_*.json

# 3. Abrir reporte en navegador
open reports/gap_analysis_*.html  # macOS
# xdg-open reports/gap_analysis_*.html  # Linux
# start reports/gap_analysis_*.html  # Windows
```

---

## Ejercicios

### Ejercicio 1: Añadir más controles automatizados

Implementar checks para:
- A.7.4: Monitoring de seguridad física (CCTV logs)
- A.8.10: Información deletion (lifecycle policies)
- A.8.23: Web filtering (proxy logs)

### Ejercicio 2: Integración con GRC Platform

Modificar script para enviar resultados a Vanta/Drata API.

### Ejercicio 3: Compliance Dashboard

Crear dashboard con Grafana que muestre compliance rate en tiempo real.

---

## Checklist

- [ ] Gap analysis script ejecutado exitosamente
- [ ] Todos los controles críticos identificados
- [ ] Reporte HTML generado
- [ ] Remediation plan priorizado
- [ ] Evidence recopilada para controles compliant

---

## Referencias

- **ISO/IEC 27001:2022**: https://www.iso.org/standard/27001
- **ISO/IEC 27002:2022**: Code of practice
- **NIST SP 800-53**: Mapping guide

---

**Duración**: 3-4 horas
**Dificultad**: Intermedia
