# Secrets Management: Vault, Sealed Secrets y External Secrets

## Introducción

**Secrets** (API keys, passwords, tokens) no deben estar hardcoded ni en Git.

### Problemas Comunes

❌ Hardcoded secrets:
```python
API_KEY = "sk-1234567890abcdef"  # ❌ NUNCA
```

❌ En Git:
```bash
git add .env  # ❌ .env contiene secrets
```

❌ En ConfigMaps:
```yaml
apiVersion: v1
kind: ConfigMap
data:
  api_key: "sk-1234567890abcdef"  # ❌ Plaintext
```

---

## HashiCorp Vault

### Setup

```bash
# Docker
docker run -d --name=vault -p 8200:8200 vault:latest

# Inicializar
export VAULT_ADDR='http://127.0.0.1:8200'
vault operator init
vault operator unseal <unseal_key>

# Login
vault login <root_token>

# Crear secret
vault kv put secret/myapp/api api_key=sk-123456
vault kv get secret/myapp/api
```

### Uso en Python

```python
import hvac

client = hvac.Client(url='http://127.0.0.1:8200', token='<token>')
secret = client.secrets.kv.v2.read_secret_version(path='myapp/api')
api_key = secret['data']['data']['api_key']
```

---

## Kubernetes Sealed Secrets

```bash
# Instalar controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Crear secret (cifrado con clave pública del cluster)
echo -n "supersecret" | kubectl create secret generic mysecret \
  --dry-run=client --from-file=password=/dev/stdin -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# Apply (solo descifrable en el cluster)
kubectl apply -f sealed-secret.yaml
```

---

## External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "http://vault:8200"
      path: "secret"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "myapp"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
  target:
    name: myapp-secret
  data:
    - secretKey: api_key
      remoteRef:
        key: myapp/api
        property: api_key
```

---

## Referencias

- **HashiCorp Vault**: https://www.vaultproject.io/
- **Sealed Secrets**: https://github.com/bitnami-labs/sealed-secrets
- **External Secrets**: https://external-secrets.io/

**Palabras**: ~250
