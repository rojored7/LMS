# Laboratorio 7: Secrets Management con Vault

## Objetivos

1. Configurar HashiCorp Vault
2. Integrar Vault con aplicaciones
3. Implementar dynamic secrets
4. Configurar Sealed Secrets en Kubernetes

## Duración: 2-3 horas

---

## Parte 1: Setup Vault

```bash
# Instalar Vault (Docker)
docker run -d --name=vault -p 8200:8200 --cap-add=IPC_LOCK vault:latest

# Inicializar
export VAULT_ADDR='http://127.0.0.1:8200'
vault operator init -key-shares=5 -key-threshold=3

# Unseal (3 de 5 claves)
vault operator unseal <unseal_key_1>
vault operator unseal <unseal_key_2>
vault operator unseal <unseal_key_3>

# Login
vault login <root_token>
```

---

## Parte 2: Static Secrets

```bash
# Crear secret
vault kv put secret/myapp/config \
  api_key=sk-1234567890 \
  db_password=SuperSecret123

# Leer secret
vault kv get secret/myapp/config

# Versioning
vault kv get -version=1 secret/myapp/config
```

### Integración Python

```python
import hvac

client = hvac.Client(url='http://127.0.0.1:8200', token='<token>')

# Leer secret
secret = client.secrets.kv.v2.read_secret_version(path='myapp/config')
api_key = secret['data']['data']['api_key']

print(f"API Key: {api_key}")
```

---

## Parte 3: Dynamic Secrets (Database)

```bash
# Configurar PostgreSQL plugin
vault secrets enable database

vault write database/config/postgresql \
  plugin_name=postgresql-database-plugin \
  allowed_roles="readonly" \
  connection_url="postgresql://{{username}}:{{password}}@localhost:5432/mydb" \
  username="vault" \
  password="vaultpassword"

# Crear role
vault write database/roles/readonly \
  db_name=postgresql \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Generar credencial temporal
vault read database/creds/readonly
```

**Salida**:
```
Key                Value
---                -----
lease_id           database/creds/readonly/2f6a614c...
lease_duration     1h
username           v-root-readonly-x72y9z
password           A1a-4eApQ9t7qWxHgEz
```

---

## Parte 4: Kubernetes Integration (Vault Agent)

```yaml
# vault-agent-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vault-agent-config
data:
  vault-agent-config.hcl: |
    exit_after_auth = false
    pid_file = "/home/vault/pidfile"

    auto_auth {
      method "kubernetes" {
        mount_path = "auth/kubernetes"
        config = {
          role = "myapp"
        }
      }

      sink "file" {
        config = {
          path = "/home/vault/.vault-token"
        }
      }
    }

    template {
      source      = "/vault/configs/config.tmpl"
      destination = "/vault/secrets/config"
    }
```

---

## Parte 5: Sealed Secrets

```bash
# Instalar Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Crear secret cifrado
echo -n "supersecret" | kubectl create secret generic mysecret \
  --dry-run=client --from-file=password=/dev/stdin -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# Apply
kubectl apply -f sealed-secret.yaml

# Verificar (solo descifrable en el cluster)
kubectl get secret mysecret -o jsonpath='{.data.password}' | base64 -d
```

---

## Ejercicios

1. Configurar dynamic secrets para MySQL
2. Implementar secret rotation automática
3. Integrar Vault con External Secrets Operator
4. Configurar audit logging en Vault

---

## Checklist

- [ ] Vault instalado y configurado
- [ ] Static secrets gestionados
- [ ] Dynamic secrets funcionando
- [ ] Integración con aplicación exitosa
- [ ] Sealed Secrets en K8s implementados

---

## Referencias

- **HashiCorp Vault**: https://www.vaultproject.io/docs
- **Sealed Secrets**: https://github.com/bitnami-labs/sealed-secrets

**Duración**: 2-3 horas
