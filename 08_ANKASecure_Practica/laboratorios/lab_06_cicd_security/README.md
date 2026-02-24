# Laboratorio 6: CI/CD Security Pipeline

## Objetivos

1. Implementar pipeline seguro con GitHub Actions
2. Integrar SAST, DAST y container scanning
3. Configurar gates de seguridad
4. Automatizar dependency scanning

## Duración: 2-3 horas

---

## Parte 1: Secure GitHub Actions Pipeline

```yaml
# .github/workflows/security-pipeline.yml
name: Security Pipeline
on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk
        uses: snyk/actions/python@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

  dast:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging.example.com'
```

---

## Parte 2: Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets

  - repo: https://github.com/bridgecrewio/checkov
    rev: 2.3.0
    hooks:
      - id: checkov
        args: ['--quiet']

  - repo: https://github.com/aquasecurity/tfsec
    rev: v1.28.0
    hooks:
      - id: tfsec
```

```bash
# Instalar
pip install pre-commit
pre-commit install

# Ejecutar manualmente
pre-commit run --all-files
```

---

## Parte 3: Security Gates

```yaml
# Ejemplo: Bloquear deploy si vulnerabilidades críticas
  deploy:
    needs: [sast, dependency-scan, container-scan]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Solo se ejecuta si todos los jobs anteriores pasaron
          kubectl apply -f k8s/
```

---

## Ejercicios

1. Añadir Hadolint para Dockerfile linting
2. Integrar SonarQube
3. Configurar Dependabot alerts
4. Implementar automated security fixes

---

## Checklist

- [ ] SAST configurado (Semgrep)
- [ ] Dependency scanning (Snyk/Dependabot)
- [ ] Container scanning (Trivy)
- [ ] DAST configurado (ZAP)
- [ ] Pre-commit hooks activos
- [ ] Security gates funcionando

---

## Referencias

- **OWASP DevSecOps**: https://owasp.org/www-project-devsecops-guideline/
- **GitHub Actions Security**: https://docs.github.com/en/actions/security-guides

**Duración**: 2-3 horas
