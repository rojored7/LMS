# Laboratorio 2: SOC 2 Evidence Collection Automation

## Objetivos

1. Automatizar recolección de evidencia para controles SOC 2
2. Implementar continuous evidence collection
3. Integrar con GRC platform (Vanta/Drata)
4. Generar evidencia audit-ready
5. Crear evidence repository estructurado

## Duración: 3-4 horas

---

## Setup

```bash
mkdir -p soc2-evidence/{scripts,evidence,configs,reports}
cd soc2-evidence

pip3 install boto3 requests python-dateutil pyyaml
```

---

## Parte 1: Evidence Collection Framework

### Configuración de Controles SOC 2

Crear `configs/soc2_controls.yaml`:

```yaml
security_controls:
  CC6.1:
    name: "Multi-Factor Authentication"
    tsc_category: "Security"
    evidence_types:
      - idp_mfa_config_screenshot
      - mfa_enrollment_report
      - access_logs_showing_mfa
    frequency: "monthly"
    automation: true

  CC6.6:
    name: "Logical Access - Credentials"
    tsc_category: "Security"
    evidence_types:
      - password_policy_config
      - vault_configuration
      - secret_rotation_logs
    frequency: "quarterly"
    automation: true

  CC6.7:
    name: "Logical Access - Access Rights"
    tsc_category: "Security"
    evidence_types:
      - rbac_configuration
      - access_review_spreadsheets
      - provisioning_deprovisioning_tickets
    frequency: "quarterly"
    automation: true

  CC6.8:
    name: "Logical Access - Encryption"
    tsc_category: "Security"
    evidence_types:
      - encryption_at_rest_config
      - tls_scan_results
      - key_management_policy
    frequency: "monthly"
    automation: true

  CC7.2:
    name: "System Monitoring - Vulnerability Management"
    tsc_category: "Security"
    evidence_types:
      - vulnerability_scan_reports
      - remediation_tracking
      - penetration_test_reports
    frequency: "monthly"
    automation: true

  CC8.1:
    name: "Change Management"
    tsc_category: "Security"
    evidence_types:
      - change_tickets
      - approval_records
      - deployment_logs
    frequency: "monthly"
    automation: true

availability_controls:
  A1.2:
    name: "Backup and Recovery"
    tsc_category: "Availability"
    evidence_types:
      - backup_success_logs
      - restore_test_results
      - dr_plan_document
    frequency: "monthly"
    automation: true
```

---

## Parte 2: Automated Evidence Collector

Crear `scripts/soc2_evidence_collector.py`:

```python
#!/usr/bin/env python3
"""
SOC 2 Evidence Collection Automation
Collects evidence for Security, Availability, Confidentiality, Privacy TSC
"""

import os
import json
import boto3
import requests
from datetime import datetime, timedelta
from pathlib import Path
import yaml
import base64

class SOC2EvidenceCollector:
    def __init__(self, config_file, evidence_dir):
        with open(config_file, 'r') as f:
            self.controls = yaml.safe_load(f)

        self.evidence_dir = Path(evidence_dir)
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

        self.aws_clients = {
            'iam': boto3.client('iam'),
            's3': boto3.client('s3'),
            'cloudtrail': boto3.client('cloudtrail'),
            'config': boto3.client('config')
        }

        self.collected_evidence = []

    def collect_cc6_1_mfa_evidence(self):
        """
        CC6.1 - MFA Enforcement
        Collect: MFA enrollment report
        """
        print("📋 Collecting CC6.1 - MFA Evidence...")

        iam = self.aws_clients['iam']
        users = iam.list_users()['Users']

        mfa_report = {
            'control_id': 'CC6.1',
            'control_name': 'Multi-Factor Authentication',
            'timestamp': datetime.now().isoformat(),
            'audit_period': f"{(datetime.now() - timedelta(days=30)).date()} to {datetime.now().date()}",
            'users': []
        }

        for user in users:
            username = user['UserName']
            created_date = user['CreateDate']
            mfa_devices = iam.list_mfa_devices(UserName=username)['MFADevices']

            user_data = {
                'username': username,
                'created_date': created_date.isoformat(),
                'mfa_enabled': len(mfa_devices) > 0,
                'mfa_devices': [
                    {
                        'serial': device['SerialNumber'],
                        'enabled_date': device['EnableDate'].isoformat()
                    } for device in mfa_devices
                ]
            }

            mfa_report['users'].append(user_data)

        # Calculate stats
        total_users = len(mfa_report['users'])
        mfa_enabled_users = sum(1 for u in mfa_report['users'] if u['mfa_enabled'])
        mfa_report['statistics'] = {
            'total_users': total_users,
            'mfa_enabled': mfa_enabled_users,
            'mfa_disabled': total_users - mfa_enabled_users,
            'compliance_rate': (mfa_enabled_users / total_users * 100) if total_users > 0 else 0
        }

        # Save evidence
        evidence_file = self.evidence_dir / f"CC6.1_MFA_Report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(evidence_file, 'w') as f:
            json.dump(mfa_report, f, indent=2)

        print(f"  ✅ Saved: {evidence_file}")
        print(f"     Compliance: {mfa_report['statistics']['compliance_rate']:.1f}%")

        self.collected_evidence.append({
            'control_id': 'CC6.1',
            'evidence_type': 'mfa_enrollment_report',
            'file_path': str(evidence_file),
            'timestamp': datetime.now().isoformat()
        })

        return mfa_report

    def collect_cc6_8_encryption_evidence(self):
        """
        CC6.8 - Encryption
        Collect: S3 encryption config, TLS configuration
        """
        print("📋 Collecting CC6.8 - Encryption Evidence...")

        s3 = self.aws_clients['s3']
        buckets = s3.list_buckets()['Buckets']

        encryption_report = {
            'control_id': 'CC6.8',
            'control_name': 'Encryption at Rest and in Transit',
            'timestamp': datetime.now().isoformat(),
            's3_buckets': []
        }

        for bucket in buckets:
            bucket_name = bucket['Name']
            bucket_data = {
                'bucket_name': bucket_name,
                'encryption_enabled': False,
                'encryption_algorithm': None
            }

            try:
                encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                if rules:
                    bucket_data['encryption_enabled'] = True
                    bucket_data['encryption_algorithm'] = rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
            except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                bucket_data['encryption_enabled'] = False

            encryption_report['s3_buckets'].append(bucket_data)

        # Stats
        total_buckets = len(encryption_report['s3_buckets'])
        encrypted = sum(1 for b in encryption_report['s3_buckets'] if b['encryption_enabled'])
        encryption_report['statistics'] = {
            'total_buckets': total_buckets,
            'encrypted': encrypted,
            'unencrypted': total_buckets - encrypted,
            'compliance_rate': (encrypted / total_buckets * 100) if total_buckets > 0 else 0
        }

        evidence_file = self.evidence_dir / f"CC6.8_Encryption_Report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(evidence_file, 'w') as f:
            json.dump(encryption_report, f, indent=2)

        print(f"  ✅ Saved: {evidence_file}")
        print(f"     Compliance: {encryption_report['statistics']['compliance_rate']:.1f}%")

        self.collected_evidence.append({
            'control_id': 'CC6.8',
            'evidence_type': 'encryption_at_rest_config',
            'file_path': str(evidence_file),
            'timestamp': datetime.now().isoformat()
        })

        return encryption_report

    def collect_cc8_1_change_management_evidence(self):
        """
        CC8.1 - Change Management
        Collect: CloudTrail logs showing changes
        """
        print("📋 Collecting CC8.1 - Change Management Evidence...")

        cloudtrail = self.aws_clients['cloudtrail']

        # Get CloudTrail events from last 30 days
        start_time = datetime.now() - timedelta(days=30)
        end_time = datetime.now()

        try:
            response = cloudtrail.lookup_events(
                LookupAttributes=[
                    {'AttributeKey': 'EventName', 'AttributeValue': 'PutBucketEncryption'},
                ],
                StartTime=start_time,
                EndTime=end_time,
                MaxResults=50
            )

            change_events = []
            for event in response.get('Events', []):
                change_events.append({
                    'event_time': event['EventTime'].isoformat(),
                    'event_name': event['EventName'],
                    'username': event.get('Username', 'N/A'),
                    'resources': [r['ResourceName'] for r in event.get('Resources', [])]
                })

            change_report = {
                'control_id': 'CC8.1',
                'control_name': 'Change Management',
                'timestamp': datetime.now().isoformat(),
                'audit_period': f"{start_time.date()} to {end_time.date()}",
                'total_changes': len(change_events),
                'changes': change_events
            }

            evidence_file = self.evidence_dir / f"CC8.1_Change_Management_{datetime.now().strftime('%Y%m%d')}.json"
            with open(evidence_file, 'w') as f:
                json.dump(change_report, f, indent=2)

            print(f"  ✅ Saved: {evidence_file}")
            print(f"     Total changes logged: {len(change_events)}")

            self.collected_evidence.append({
                'control_id': 'CC8.1',
                'evidence_type': 'change_logs',
                'file_path': str(evidence_file),
                'timestamp': datetime.now().isoformat()
            })

            return change_report

        except Exception as e:
            print(f"  ⚠️  Error collecting CC8.1 evidence: {e}")
            return None

    def collect_a1_2_backup_evidence(self):
        """
        A1.2 - Backup and Recovery
        Collect: EBS snapshot logs
        """
        print("📋 Collecting A1.2 - Backup Evidence...")

        ec2 = boto3.client('ec2')

        # Get snapshots from last 30 days
        snapshots = ec2.describe_snapshots(OwnerIds=['self'])['Snapshots']

        backup_report = {
            'control_id': 'A1.2',
            'control_name': 'Backup and Recovery',
            'timestamp': datetime.now().isoformat(),
            'snapshots': []
        }

        thirty_days_ago = datetime.now() - timedelta(days=30)

        for snapshot in snapshots:
            start_time = snapshot['StartTime'].replace(tzinfo=None)
            if start_time >= thirty_days_ago:
                backup_report['snapshots'].append({
                    'snapshot_id': snapshot['SnapshotId'],
                    'volume_id': snapshot.get('VolumeId', 'N/A'),
                    'start_time': snapshot['StartTime'].isoformat(),
                    'state': snapshot['State'],
                    'encrypted': snapshot.get('Encrypted', False),
                    'size_gb': snapshot['VolumeSize']
                })

        backup_report['statistics'] = {
            'total_snapshots': len(backup_report['snapshots']),
            'encrypted_snapshots': sum(1 for s in backup_report['snapshots'] if s['encrypted'])
        }

        evidence_file = self.evidence_dir / f"A1.2_Backup_Report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(evidence_file, 'w') as f:
            json.dump(backup_report, f, indent=2)

        print(f"  ✅ Saved: {evidence_file}")
        print(f"     Total backups (30d): {len(backup_report['snapshots'])}")

        self.collected_evidence.append({
            'control_id': 'A1.2',
            'evidence_type': 'backup_logs',
            'file_path': str(evidence_file),
            'timestamp': datetime.now().isoformat()
        })

        return backup_report

    def run_all_collectors(self):
        """Execute all evidence collectors"""
        print("\n" + "="*60)
        print("SOC 2 EVIDENCE COLLECTION")
        print("="*60 + "\n")

        collectors = [
            self.collect_cc6_1_mfa_evidence,
            self.collect_cc6_8_encryption_evidence,
            self.collect_cc8_1_change_management_evidence,
            self.collect_a1_2_backup_evidence
        ]

        for collector in collectors:
            try:
                collector()
            except Exception as e:
                print(f"  ❌ Error in {collector.__name__}: {e}")

        print("\n" + "="*60)
        print(f"✅ Evidence collection complete!")
        print(f"   Total evidence items: {len(self.collected_evidence)}")
        print(f"   Evidence directory: {self.evidence_dir}")
        print("="*60 + "\n")

    def generate_evidence_manifest(self):
        """Generate manifest of all collected evidence"""
        manifest = {
            'generation_date': datetime.now().isoformat(),
            'audit_period_start': (datetime.now() - timedelta(days=365)).date().isoformat(),
            'audit_period_end': datetime.now().date().isoformat(),
            'total_evidence_items': len(self.collected_evidence),
            'evidence_items': self.collected_evidence
        }

        manifest_file = self.evidence_dir / f"evidence_manifest_{datetime.now().strftime('%Y%m%d')}.json"
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)

        print(f"📄 Evidence manifest generated: {manifest_file}")
        return manifest_file


if __name__ == '__main__':
    collector = SOC2EvidenceCollector(
        config_file='configs/soc2_controls.yaml',
        evidence_dir='evidence'
    )

    collector.run_all_collectors()
    collector.generate_evidence_manifest()
```

---

## Parte 3: Integration con GRC Platform (Vanta API)

Crear `scripts/upload_to_vanta.py`:

```python
#!/usr/bin/env python3
"""
Upload collected evidence to Vanta
"""

import os
import json
import requests
from pathlib import Path

VANTA_API_KEY = os.getenv('VANTA_API_KEY', 'your-api-key')
VANTA_API_URL = 'https://api.vanta.com/v1'

def upload_evidence_to_vanta(evidence_file, control_id):
    """
    Upload evidence file to Vanta
    """
    headers = {
        'Authorization': f'Bearer {VANTA_API_KEY}',
        'Content-Type': 'application/json'
    }

    with open(evidence_file, 'rb') as f:
        files = {'file': f}

        response = requests.post(
            f'{VANTA_API_URL}/evidence',
            headers=headers,
            files=files,
            data={
                'control_id': control_id,
                'evidence_type': 'automated_report',
                'timestamp': datetime.now().isoformat()
            }
        )

        if response.status_code == 201:
            print(f"✅ Uploaded: {evidence_file} → Vanta")
        else:
            print(f"❌ Failed: {evidence_file} - {response.text}")

if __name__ == '__main__':
    evidence_dir = Path('evidence')

    for evidence_file in evidence_dir.glob('*.json'):
        if 'manifest' not in evidence_file.name:
            # Extract control ID from filename (e.g., CC6.1_MFA_Report_20250223.json)
            control_id = evidence_file.name.split('_')[0]
            upload_evidence_to_vanta(evidence_file, control_id)
```

---

## Parte 4: Continuous Evidence Collection (Cron Job)

Crear `scripts/cron_evidence_collection.sh`:

```bash
#!/bin/bash
# Cron job: Run daily at 2 AM
# crontab entry: 0 2 * * * /path/to/cron_evidence_collection.sh

cd /path/to/soc2-evidence

# Activate virtual environment (if using)
source venv/bin/activate

# Run evidence collection
python3 scripts/soc2_evidence_collector.py

# Upload to GRC platform (optional)
# python3 scripts/upload_to_vanta.py

# Archive old evidence (keep last 90 days)
find evidence/ -name "*.json" -mtime +90 -exec mv {} evidence/archive/ \;

echo "✅ Daily evidence collection complete - $(date)"
```

---

## Ejercicios

### Ejercicio 1: Añadir más controles

Implementar collectors para:
- CC6.7: Access reviews (quarterly)
- CC7.2: Vulnerability scans (monthly)
- CC6.6: Password rotation logs

### Ejercicio 2: Evidence Retention Policy

Implementar script que archive evidencia > 7 años (compliance requirement).

### Ejercicio 3: Evidence Validation

Crear script que valide integridad de evidencia (checksums, firmas digitales).

---

## Checklist

- [ ] Evidence collector ejecutado exitosamente
- [ ] Evidencia para todos los controles críticos recopilada
- [ ] Evidence manifest generado
- [ ] Integración con GRC platform (opcional)
- [ ] Cron job configurado para recolección continua

---

## Referencias

- **AICPA SOC 2**: https://us.aicpa.org/soc2
- **Vanta API**: https://vanta.com/api-docs
- **AWS CloudTrail**: https://docs.aws.amazon.com/cloudtrail/

---

**Duración**: 3-4 horas
**Dificultad**: Intermedia-Avanzada
