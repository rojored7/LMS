# Container y Kubernetes Security

## Container Security Best Practices

### 1. Minimal Base Images

```dockerfile
# ❌ Vulnerable
FROM ubuntu:latest
RUN apt-get update && apt-get install -y python3

# ✅ Mejor
FROM python:3.11-slim

# ✅ Óptimo
FROM gcr.io/distroless/python3
```

### 2. Non-Root User

```dockerfile
# ✅ Run as non-root
RUN useradd -m appuser
USER appuser
```

### 3. Read-Only Filesystem

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    securityContext:
      readOnlyRootFilesystem: true
```

---

## Kubernetes Security

### Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### RBAC

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind:Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
- kind: ServiceAccount
  name: myapp
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## Runtime Security: Falco

```yaml
# Detectar exec en contenedor
- rule: Terminal Shell in Container
  desc: Detect shell execution in container
  condition: >
    spawned_process and container and
    proc.name in (bash, sh, zsh)
  output: >
    Shell spawned in container
    (user=%user.name container=%container.name
     command=%proc.cmdline)
  priority: WARNING
```

---

## Referencias

- **CIS Kubernetes Benchmark**: https://www.cisecurity.org/benchmark/kubernetes
- **NIST SP 800-190**: Application Container Security Guide
- **Falco**: https://falco.org/

**Palabras**: ~250
