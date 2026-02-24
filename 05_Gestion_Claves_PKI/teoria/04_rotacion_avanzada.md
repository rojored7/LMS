# Rotación Avanzada de Claves y Certificados

## Índice
1. [Estrategias de Rotación](#estrategias)
2. [Zero-Downtime Rotation](#zero-downtime)
3. [ACME Protocol y Let's Encrypt](#acme)
4. [Re-encryption Strategies](#re-encryption)
5. [Key Versioning](#versioning)
6. [Monitoring y Alerting](#monitoring)
7. [Referencias](#referencias)

---

## Estrategias de Rotación {#estrategias}

### Rotación Scheduled (Time-Based)

```yaml
Estrategia: Rotación periódica basada en tiempo

Ventajas:
  - Predecible y planificable
  - Compliance automático
  - Menor ventana de exposición

Desventajas:
  - Puede ser innecesaria si no hay compromiso
  - Overhead operacional

Recomendaciones por tipo de clave:
  - Root CA: 10-20 años
  - Intermediate CA: 5-7 años
  - TLS Server certificates: 1 año (máximo 398 días desde 2020)
  - Code signing: 2-3 años
  - Symmetric keys (AES): 90 días
  - HMAC secrets: 30-90 días
```

**Implementación con cron**:

```bash
# /etc/cron.d/cert-rotation
# Rotar certificado TLS cada 60 días
0 2 1 */2 * /usr/local/bin/rotate-cert.sh >> /var/log/cert-rotation.log 2>&1
```

### Rotación Usage-Based

```python
# Monitoreo de uso de clave
class KeyUsageTracker:
    def __init__(self, max_operations=1000000):
        self.max_operations = max_operations
        self.operation_count = 0

    def should_rotate(self):
        """Rotar después de N operaciones criptográficas"""
        return self.operation_count >= self.max_operations

    def increment(self):
        self.operation_count += 1
        if self.should_rotate():
            trigger_rotation()
```

### Emergency Rotation (On-Compromise)

**Triggers para rotación de emergencia**:
- Compromiso confirmado de clave privada
- Vulnerabilidad crítica (ej: Heartbleed, Log4Shell)
- Empleado con acceso despedido
- Breach de seguridad en CA
- Orden legal/regulatoria

**Procedimiento de emergencia**:

```bash
#!/bin/bash
# emergency-rotation.sh

set -e

echo "[$(date)] EMERGENCY ROTATION INITIATED" | tee -a /var/log/emergency-rotation.log

# 1. Revocar certificado actual inmediatamente
openssl ca -revoke /etc/pki/certs/current.crt -keyfile /etc/pki/CA/private/ca.key \
  -cert /etc/pki/CA/ca.crt -crl_reason keyCompromise

# 2. Generar nueva clave
openssl genrsa -out /etc/pki/private/new.key 2048
chmod 600 /etc/pki/private/new.key

# 3. Generar CSR
openssl req -new -key /etc/pki/private/new.key -out /etc/pki/csr/new.csr -config /etc/pki/openssl.cnf

# 4. Firmar con CA
openssl ca -in /etc/pki/csr/new.csr -out /etc/pki/certs/new.crt -config /etc/pki/openssl.cnf

# 5. Deploy nuevo certificado (blue-green)
ln -sf /etc/pki/certs/new.crt /etc/pki/certs/active.crt
ln -sf /etc/pki/private/new.key /etc/pki/private/active.key

# 6. Reload servicios
systemctl reload nginx
systemctl reload apache2

# 7. Publicar CRL actualizada
openssl ca -gencrl -out /var/www/html/crl.pem -config /etc/pki/openssl.cnf

echo "[$(date)] EMERGENCY ROTATION COMPLETED" | tee -a /var/log/emergency-rotation.log
```

---

## Zero-Downtime Rotation {#zero-downtime}

### Blue-Green Deployment

```
Estado Inicial:
┌─────────────┐
│   BLUE      │ ← Certificado actual (activo)
│ cert-v1.crt │
└─────────────┘

Durante Rotación:
┌─────────────┐      ┌─────────────┐
│   BLUE      │      │   GREEN     │
│ cert-v1.crt │ ←──→ │ cert-v2.crt │ ← Nuevo certificado (warmup)
└─────────────┘      └─────────────┘
     ↓                      ↓
  [Activo]              [Standby]

Post-Rotación:
                     ┌─────────────┐
                     │   GREEN     │ ← Nuevo certificado (activo)
                     │ cert-v2.crt │
                     └─────────────┘
```

**Implementación Nginx con múltiples certificados**:

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # Certificado principal (blue)
    ssl_certificate /etc/nginx/certs/blue/cert.pem;
    ssl_certificate_key /etc/nginx/certs/blue/key.pem;

    # Certificado alternativo (green) - durante overlap period
    # ssl_certificate /etc/nginx/certs/green/cert.pem;
    # ssl_certificate_key /etc/nginx/certs/green/key.pem;

    # OCSP stapling para ambos
    ssl_stapling on;
    ssl_stapling_verify on;

    location / {
        proxy_pass http://backend;
    }
}
```

### Canary Deployment

```python
# Gradual rollout de nueva clave
class CanaryKeyRotation:
    def __init__(self):
        self.old_key_usage = 100  # 100% tráfico
        self.new_key_usage = 0

    def get_key_for_request(self, request):
        import random

        # Gradual shift: 100/0 → 90/10 → 50/50 → 10/90 → 0/100
        if random.randint(0, 100) < self.old_key_usage:
            return 'old_key'
        else:
            return 'new_key'

    def increase_canary(self, percentage=10):
        self.old_key_usage -= percentage
        self.new_key_usage += percentage

        if self.old_key_usage < 0:
            self.old_key_usage = 0
            self.new_key_usage = 100

# Schedule gradual rollout
# Day 1: 10% new key
# Day 2: 25% new key (if no errors)
# Day 3: 50% new key
# Day 4: 75% new key
# Day 5: 100% new key, retire old key
```

### Overlap Period

```bash
# Configurar período de overlap de 30 días

# Día 0: Generar nuevo certificado
openssl req -new -x509 -days 90 -key new.key -out new.crt

# Día 0-30: Ambos certificados activos (overlap)
# Clientes pueden usar cualquiera de los dos

# Día 30: Revocar certificado viejo
openssl ca -revoke old.crt -crl_reason superseded

# Día 30+: Solo nuevo certificado activo
```

---

## ACME Protocol y Let's Encrypt {#acme}

### ACME (Automatic Certificate Management Environment) - RFC 8555

**Flujo ACME**:

```
1. Cliente → ACME Server: Crear cuenta
   POST /acme/new-account

2. Cliente → ACME Server: Solicitar certificado
   POST /acme/new-order

3. ACME Server → Cliente: Challenges (http-01, dns-01, tls-alpn-01)

4. Cliente: Completar challenge
   - http-01: Publicar token en http://domain/.well-known/acme-challenge/
   - dns-01: Crear TXT record _acme-challenge.domain.com

5. Cliente → ACME Server: Challenge ready
   POST /acme/challenge/{id}

6. ACME Server: Validar challenge

7. Cliente: Generar CSR
   openssl req -new -key domain.key -out domain.csr

8. Cliente → ACME Server: Finalizar orden con CSR
   POST /acme/order/{id}/finalize

9. ACME Server → Cliente: Certificado emitido
   GET /acme/cert/{id}
```

### Certbot (Let's Encrypt Client)

**Instalación y configuración**:

```bash
# Instalar certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado con challenge HTTP-01
sudo certbot certonly --nginx -d example.com -d www.example.com

# Certificados almacenados en:
# /etc/letsencrypt/live/example.com/fullchain.pem
# /etc/letsencrypt/live/example.com/privkey.pem

# Auto-renovación (cron)
sudo certbot renew --dry-run  # Test
sudo certbot renew            # Real renewal (solo si faltan <30 días)
```

**Automatización con systemd timer**:

```ini
# /etc/systemd/system/certbot-renewal.service
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

```ini
# /etc/systemd/system/certbot-renewal.timer
[Unit]
Description=Run certbot renewal twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable certbot-renewal.timer
sudo systemctl start certbot-renewal.timer
```

### DNS-01 Challenge para Wildcard Certificates

```bash
# Wildcard certificate para *.example.com
sudo certbot certonly --manual --preferred-challenges dns \
  -d example.com -d '*.example.com'

# Certbot pedirá crear TXT record:
# _acme-challenge.example.com TXT "aB3dE...random-token"

# Verificar antes de continuar:
dig _acme-challenge.example.com TXT +short

# Automatización con DNS API (Cloudflare example)
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d example.com -d '*.example.com'
```

---

## Re-encryption Strategies {#re-encryption}

### Online Re-encryption (During Access)

```python
# Re-encriptar datos cuando se acceden
class OnlineReEncryption:
    def __init__(self, old_key, new_key):
        self.old_key = old_key
        self.new_key = new_key

    def read_and_reencrypt(self, data_id):
        # 1. Leer dato encriptado con clave vieja
        encrypted_data_old = db.get(data_id)

        # 2. Desencriptar con clave vieja
        plaintext = decrypt(encrypted_data_old, self.old_key)

        # 3. Re-encriptar con clave nueva
        encrypted_data_new = encrypt(plaintext, self.new_key)

        # 4. Actualizar en DB
        db.update(data_id, encrypted_data_new, key_version='v2')

        # 5. Retornar plaintext al usuario
        return plaintext

# Ventajas:
# - Gradual, sin downtime
# - No requiere re-encriptar todo de una vez

# Desventajas:
# - Datos no accedidos quedan con clave vieja
# - Requiere mantener múltiples versiones de claves
```

### Offline Bulk Re-encryption

```python
# Re-encriptar toda la base de datos offline
def bulk_reencryption(old_key, new_key):
    # 1. Poner aplicación en modo mantenimiento
    maintenance_mode_on()

    # 2. Backup completo
    create_backup()

    # 3. Re-encriptar todos los datos
    total = db.count()
    processed = 0

    for data_id in db.get_all_ids():
        encrypted_old = db.get(data_id)
        plaintext = decrypt(encrypted_old, old_key)
        encrypted_new = encrypt(plaintext, new_key)
        db.update(data_id, encrypted_new, key_version='v2')

        processed += 1
        if processed % 1000 == 0:
            print(f"Progress: {processed}/{total} ({processed/total*100:.1f}%)")

    # 4. Verificar integridad
    verify_reencryption()

    # 5. Actualizar metadata de clave activa
    update_active_key_version('v2')

    # 6. Salir de modo mantenimiento
    maintenance_mode_off()

# Ventajas:
# - Todos los datos re-encriptados de una vez
# - Clave vieja puede ser revocada completamente

# Desventajas:
# - Downtime requerido
# - Tiempo proporcional al tamaño de datos
```

### Envelope Encryption Pattern

```python
# Envelope encryption para re-encriptación eficiente
class EnvelopeEncryption:
    def encrypt_data(self, plaintext, data_encryption_key, key_encryption_key):
        # 1. Encriptar datos con DEK (Data Encryption Key)
        ciphertext = aes_encrypt(plaintext, data_encryption_key)

        # 2. Encriptar DEK con KEK (Key Encryption Key)
        encrypted_dek = rsa_encrypt(data_encryption_key, key_encryption_key)

        # 3. Almacenar ambos
        return {
            'ciphertext': ciphertext,
            'encrypted_dek': encrypted_dek
        }

    def rotate_kek(self, data, old_kek, new_kek):
        # Solo re-encriptar DEK (pequeño), NO los datos (grandes)

        # 1. Desencriptar DEK con KEK vieja
        dek = rsa_decrypt(data['encrypted_dek'], old_kek)

        # 2. Re-encriptar DEK con KEK nueva
        new_encrypted_dek = rsa_encrypt(dek, new_kek)

        # 3. Actualizar solo encrypted_dek (ciphertext no cambia)
        data['encrypted_dek'] = new_encrypted_dek

        return data

# Ventajas:
# - Re-encriptación rápida (solo DEKs pequeños)
# - Eficiente para grandes volúmenes de datos

# Usado por: AWS KMS, Google Cloud KMS, Azure Key Vault
```

---

## Key Versioning {#versioning}

### Multi-Version Key Support

```python
class VersionedKeyStore:
    def __init__(self):
        self.keys = {
            'v1': {'key': b'old_key...', 'deprecated_at': '2024-01-01', 'retire_at': '2024-03-01'},
            'v2': {'key': b'current_key...', 'created_at': '2024-01-01'},
            'v3': {'key': b'new_key...', 'created_at': '2024-02-20', 'active_from': '2024-03-01'}
        }
        self.active_version = 'v2'

    def encrypt(self, data):
        # Siempre encriptar con versión activa
        key = self.keys[self.active_version]['key']
        ciphertext = aes_encrypt(data, key)

        # Incluir versión en el ciphertext
        return {
            'version': self.active_version,
            'ciphertext': ciphertext
        }

    def decrypt(self, encrypted_data):
        # Desencriptar con la versión indicada
        version = encrypted_data['version']

        if version not in self.keys:
            raise ValueError(f"Key version {version} not found")

        # Verificar si la clave no está retirada
        if 'retire_at' in self.keys[version]:
            retire_date = datetime.fromisoformat(self.keys[version]['retire_at'])
            if datetime.now() > retire_date:
                raise ValueError(f"Key version {version} has been retired")

        key = self.keys[version]['key']
        plaintext = aes_decrypt(encrypted_data['ciphertext'], key)

        return plaintext
```

### Gradual Migration with Versioning

```python
def gradual_version_migration():
    # Mes 1: v2 activa, v1 deprecated pero funcional
    keystore.active_version = 'v2'
    # Nuevos datos → v2
    # Datos existentes v1 → permanecen v1 hasta acceso

    # Mes 2: Re-encriptación gradual
    # Cuando se accede dato v1 → re-encriptar a v2

    # Mes 3: v1 retirada
    # Ya no se acepta desencriptar con v1
    keystore.keys.pop('v1')
```

---

## Monitoring y Alerting {#monitoring}

### Prometheus Metrics para Key Rotation

```python
from prometheus_client import Counter, Gauge, Histogram

# Métricas
key_rotations_total = Counter('key_rotations_total', 'Total key rotations', ['key_type', 'status'])
key_age_days = Gauge('key_age_days', 'Age of active key in days', ['key_id'])
cert_expiry_days = Gauge('cert_expiry_days', 'Days until certificate expiration', ['domain'])
rotation_duration_seconds = Histogram('rotation_duration_seconds', 'Key rotation duration')

# Instrumentación
@rotation_duration_seconds.time()
def rotate_key(key_type):
    try:
        # Lógica de rotación
        perform_rotation()
        key_rotations_total.labels(key_type=key_type, status='success').inc()
    except Exception as e:
        key_rotations_total.labels(key_type=key_type, status='failure').inc()
        raise

# Actualizar métricas de edad
def update_key_age_metrics():
    for key_id, key_info in keystore.keys.items():
        created = datetime.fromisoformat(key_info['created_at'])
        age_days = (datetime.now() - created).days
        key_age_days.labels(key_id=key_id).set(age_days)
```

### Alerting Rules (Prometheus AlertManager)

```yaml
# alert-rules.yml
groups:
  - name: certificate_expiration
    rules:
      - alert: CertificateExpiringSoon
        expr: cert_expiry_days < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Certificate {{ $labels.domain }} expiring in {{ $value }} days"
          description: "Certificate for {{ $labels.domain }} will expire soon. Rotation needed."

      - alert: CertificateExpiredCritical
        expr: cert_expiry_days < 7
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Certificate {{ $labels.domain }} expiring in {{ $value }} days - CRITICAL"
          description: "URGENT: Certificate rotation required immediately"

  - name: key_age
    rules:
      - alert: KeyTooOld
        expr: key_age_days > 90
        for: 1d
        labels:
          severity: warning
        annotations:
          summary: "Key {{ $labels.key_id }} is {{ $value }} days old"
          description: "Key rotation recommended (policy: rotate every 90 days)"
```

### Certificate Expiration Monitoring Script

```python
import OpenSSL
import datetime
import smtplib
from email.mime.text import MIMEText

def check_certificate_expiration(cert_path, warning_days=30):
    # Cargar certificado
    with open(cert_path, 'rb') as f:
        cert_data = f.read()

    cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert_data)

    # Obtener fecha de expiración
    expiry_date_str = cert.get_notAfter().decode('utf-8')
    expiry_date = datetime.datetime.strptime(expiry_date_str, '%Y%m%d%H%M%SZ')

    # Calcular días restantes
    days_remaining = (expiry_date - datetime.datetime.now()).days

    # Alertar si está cerca de expirar
    if days_remaining < warning_days:
        send_alert(cert_path, days_remaining)
        return False

    return True

def send_alert(cert_path, days_remaining):
    msg = MIMEText(f"Certificate {cert_path} will expire in {days_remaining} days. Please rotate.")
    msg['Subject'] = f"Certificate Expiration Alert - {days_remaining} days"
    msg['From'] = 'security@example.com'
    msg['To'] = 'ops-team@example.com'

    smtp = smtplib.SMTP('localhost')
    smtp.send_message(msg)
    smtp.quit()

# Ejecutar diariamente vía cron
if __name__ == '__main__':
    certs_to_monitor = [
        '/etc/pki/certs/example.com.crt',
        '/etc/pki/certs/api.example.com.crt'
    ]

    for cert in certs_to_monitor:
        check_certificate_expiration(cert)
```

---

## Referencias {#referencias}

### RFCs y Standards

- **RFC 8555**: Automatic Certificate Management Environment (ACME) - https://datatracker.ietf.org/doc/html/rfc8555
- **RFC 5280**: Internet X.509 Public Key Infrastructure - https://datatracker.ietf.org/doc/html/rfc5280
- **NIST SP 800-57 Part 1**: Recommendation for Key Management (Cryptographic key lifetimes) - https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final

### Herramientas

- **Certbot** (Let's Encrypt client): https://certbot.eff.org/
- **acme.sh**: Alternative ACME client - https://github.com/acmesh-official/acme.sh
- **cert-manager** (Kubernetes): https://cert-manager.io/
- **Vault PKI Secrets Engine**: https://www.vaultproject.io/docs/secrets/pki

### Papers y Libros

- **"Network Security with OpenSSL"** by John Viega, Matt Messier, Pravir Chandra (O'Reilly, 2002)
- **CA/Browser Forum Baseline Requirements**: https://cabforum.org/baseline-requirements-documents/

### Best Practices Guides

- **Mozilla SSL Configuration Generator**: https://ssl-config.mozilla.org/
- **Let's Encrypt Rate Limits**: https://letsencrypt.org/docs/rate-limits/
- **AWS Best Practices for Key Rotation**: https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html

---

**Autor**: Curso de Ciberseguridad Avanzada
**Última actualización**: 2026-02-23
**Versión**: 1.0
