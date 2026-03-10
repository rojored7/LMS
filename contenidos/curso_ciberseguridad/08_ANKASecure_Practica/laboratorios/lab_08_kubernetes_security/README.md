# Laboratorio 8: Kubernetes Security Hardening

## Objetivos

1. Implementar Pod Security Standards
2. Configurar Network Policies
3. Implementar RBAC granular
4. Configurar runtime security con Falco
5. Harden cluster según CIS Benchmark

## Duración: 3-4 horas

---

## Parte 1: Pod Security Standards

```yaml
# Namespace con Pod Security
apiVersion: v1
kind: Namespace
metadata:
  name: secure-app
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

```yaml
# Pod conforme a restricted
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
  namespace: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault

  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      runAsNonRoot: true
      capabilities:
        drop:
        - ALL

    volumeMounts:
    - name: tmp
      mountPath: /tmp

  volumes:
  - name: tmp
    emptyDir: {}
```

---

## Parte 2: Network Policies

```yaml
# Default deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: secure-app
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# Allow frontend → backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: secure-app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080

---
# Allow backend → database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-db
  namespace: secure-app
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432

---
# Allow egress to internet (DNS + HTTPS)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-internet
  namespace: secure-app
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53  # DNS
  - ports:
    - protocol: TCP
      port: 443  # HTTPS
```

---

## Parte 3: RBAC

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myapp-sa
  namespace: secure-app

---
# Role (namespace-scoped)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: secure-app
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: secure-app
subjects:
- kind: ServiceAccount
  name: myapp-sa
  namespace: secure-app
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io

---
# Pod using ServiceAccount
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  namespace: secure-app
spec:
  serviceAccountName: myapp-sa
  containers:
  - name: app
    image: myapp:latest
```

---

## Parte 4: Falco Runtime Security

```bash
# Instalar Falco (Helm)
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --namespace falco --create-namespace

# Verificar instalación
kubectl logs -n falco -l app.kubernetes.io/name=falco
```

### Custom Falco Rules

```yaml
# falco-custom-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-custom-rules
  namespace: falco
data:
  custom-rules.yaml: |
    - rule: Unexpected Network Connection
      desc: Detect unexpected outbound connections
      condition: >
        outbound and
        container and
        not fd.sip in (allowed_ips)
      output: >
        Unexpected outbound connection
        (container=%container.name dest=%fd.rip port=%fd.rport)
      priority: WARNING

    - rule: Terminal Shell in Container
      desc: Detect shell spawned in container
      condition: >
        spawned_process and
        container and
        proc.name in (bash, sh, zsh)
      output: >
        Shell spawned in container
        (user=%user.name container=%container.name
         command=%proc.cmdline)
      priority: WARNING

    - rule: Write to Sensitive Directory
      desc: Detect writes to /etc or /root
      condition: >
        open_write and
        container and
        (fd.name startswith /etc or fd.name startswith /root)
      output: >
        Write to sensitive directory
        (file=%fd.name container=%container.name)
      priority: ERROR
```

---

## Parte 5: CIS Kubernetes Benchmark

```bash
# Instalar kube-bench
wget https://github.com/aquasecurity/kube-bench/releases/latest/download/kube-bench_Linux_x86_64.tar.gz
tar -xvf kube-bench_Linux_x86_64.tar.gz

# Ejecutar benchmark
./kube-bench run --targets master,node

# Remediar findings (ejemplo)
# Finding: 1.1.1 Ensure that the API server pod specification file permissions are set to 644
sudo chmod 644 /etc/kubernetes/manifests/kube-apiserver.yaml
```

---

## Parte 6: Admission Controllers

```yaml
# OPA Gatekeeper constraint
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          properties:
            labels:
              type: array
              items: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }

---
# Constraint requiring "app" and "env" labels
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-labels
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels: ["app", "env"]
```

---

## Ejercicios

1. Implementar PodSecurityPolicy (deprecated pero educativo)
2. Configurar egress filtering con Calico
3. Implementar Image signing verification
4. Configurar audit logging

---

## Checklist

- [ ] Pod Security Standards aplicados
- [ ] Network Policies configuradas (default deny)
- [ ] RBAC con least privilege
- [ ] Falco runtime security activo
- [ ] CIS Benchmark ejecutado y remediado
- [ ] Admission controllers configurados

---

## Referencias

- **CIS Kubernetes Benchmark**: https://www.cisecurity.org/benchmark/kubernetes
- **Falco**: https://falco.org/docs/
- **OPA Gatekeeper**: https://open-policy-agent.github.io/gatekeeper/
- **NIST SP 800-190**: Application Container Security Guide

**Duración**: 3-4 horas
