# Monitoring, Observability y SIEM

## Observability Pillars

```
┌───────────────────────────────────────────────┐
│          OBSERVABILITY PILLARS                │
└───────────────────────────────────────────────┘

┌─────────┐   ┌─────────┐   ┌─────────┐
│ METRICS │   │  LOGS   │   │ TRACES  │
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
            ┌──────▼──────┐
            │ Correlation │
            │   Engine    │
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │   SIEM      │
            │ (Security   │
            │Information  │
            │and Event    │
            │Management)  │
            └─────────────┘
```

---

## Metrics: Prometheus + Grafana

### Prometheus Config

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

### Security Metrics

```python
from prometheus_client import Counter, Histogram

failed_logins = Counter('failed_login_attempts', 'Failed login attempts')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.route('/login')
def login():
    if not authenticate(request):
        failed_logins.inc()
        return 401
```

---

## Logs: ELK Stack

### Filebeat Config

```yaml
filebeat.inputs:
- type: log
  paths:
    - /var/log/app/*.log
  fields:
    app: myapp
    env: production

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "logs-%{+yyyy.MM.dd}"
```

### Log Enrichment

```python
import structlog

log = structlog.get_logger()

log.info("user_login",
         user_id=user.id,
         ip_address=request.remote_addr,
         user_agent=request.headers.get('User-Agent'),
         timestamp=datetime.now().isoformat())
```

---

## SIEM: Wazuh / Elastic Security

### Wazuh Rules

```xml
<rule id="100001" level="10">
  <if_matched_sid>5503</if_matched_sid>
  <match>Failed password for invalid user</match>
  <description>SSH brute force attack detected</description>
  <group>authentication_failures,pci_dss_10.2.4,</group>
</rule>
```

### Detection Rules

```yaml
# Elastic Detection Rule
name: "Unusual Network Activity"
description: "Detects connection to rare destination"
query: |
  network where
    destination.ip not in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")
    and process.name in ("curl", "wget", "python")
risk_score: 75
severity: high
```

---

## Alerting: PagerDuty Integration

```python
import requests

def send_alert(severity, message):
    pagerduty_url = "https://events.pagerduty.com/v2/enqueue"

    payload = {
        "routing_key": "<integration_key>",
        "event_action": "trigger",
        "payload": {
            "summary": message,
            "severity": severity,
            "source": "security-monitoring"
        }
    }

    requests.post(pagerduty_url, json=payload)
```

---

## Referencias

- **Prometheus**: https://prometheus.io/
- **ELK Stack**: https://www.elastic.co/elastic-stack
- **Wazuh**: https://wazuh.com/
- **NIST SP 800-92**: Guide to Computer Security Log Management

**Palabras**: ~300
