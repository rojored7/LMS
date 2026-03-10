# DevSecOps y CI/CD Security

## Introducción

**DevSecOps** integra seguridad en cada fase del ciclo de desarrollo (shift-left security).

### CI/CD Security Pipeline

```
┌────────────────────────────────────────────────────────┐
│           SECURE CI/CD PIPELINE                        │
└────────────────────────────────────────────────────────┘

CODE → COMMIT → BUILD → TEST → DEPLOY → MONITOR

├─ SAST          ├─ Dep Scan  ├─ DAST   ├─ Security  ├─ Runtime
├─ Secret Scan   ├─ Container ├─ Pentest   Tests       Detection
├─ Linting       └─ SCA       └─ ZAP    └─ Chaos    └─ SIEM
└─ Pre-commit                            Engineering
   hooks
```

### Herramientas por Fase

| Fase | Herramienta | Propósito |
|------|-------------|-----------|
| **Code** | SonarQube, Semgrep | SAST |
| **Build** | Trivy, Snyk | Container scanning |
| **Test** | OWASP ZAP, Burp | DAST |
| **Deploy** | Vault, Sealed Secrets | Secrets management |
| **Monitor** | Falco, SIEM | Runtime security |

---

## SAST (Static Application Security Testing)

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1

      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

## Container Security

```bash
# Trivy scan
trivy image --severity HIGH,CRITICAL myapp:latest

# Hadolint (Dockerfile linting)
hadolint Dockerfile

# Distroless base image
FROM gcr.io/distroless/python3
COPY --from=builder /app /app
CMD ["/app/main.py"]
```

---

## Referencias

- **OWASP DevSecOps Guideline**: https://owasp.org/www-project-devsecops-guideline/
- **NIST SP 800-204**: Security Strategies for Microservices

**Palabras**: ~250
