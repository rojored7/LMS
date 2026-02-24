# LAB 02.2: IMPLEMENTACIÓN DE TLS

**Duración**: 45 minutos
**Stack**: Node.js + OpenSSL

---

## Paso 1: Generar Certificado Autofirmado (10 min)

```bash
# Crear directorio
mkdir tls-server && cd tls-server

# Generar clave privada
openssl genrsa -out server.key 2048

# Generar Certificate Signing Request (CSR)
openssl req -new -key server.key -out server.csr
# Common Name: localhost

# Auto-firmar certificado (válido 365 días)
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

# Verificar
openssl x509 -in server.crt -text -noout
```

---

## Paso 2: Crear Servidor HTTPS (Node.js) (15 min)

### Instalar Node.js

```bash
sudo apt install nodejs npm
```

### Crear server.js

```javascript
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
};

const server = https.createServer(options, (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
        <html>
        <body>
            <h1>🔒 Conexión HTTPS Segura</h1>
            <p>Certificado: Autofirmado</p>
            <p>TLS Version: ${req.socket.getCipher().version}</p>
            <p>Cipher: ${req.socket.getCipher().name}</p>
        </body>
        </html>
    `);
});

server.listen(443, () => {
    console.log('Servidor HTTPS corriendo en https://localhost:443');
});
```

### Ejecutar

```bash
sudo node server.js
```

### Probar

```bash
# Con curl (ignorar cert warning)
curl -k https://localhost

# Con browser: https://localhost
# Aceptar warning de certificado autofirmado
```

---

## Paso 3: Implementar HSTS (5 min)

### Actualizar server.js

```javascript
const server = https.createServer(options, (req, res) => {
    // HSTS Header
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });
    // ...
});
```

---

## Paso 4: Validar con SSLLabs (10 min)

**Para producción (dominio público)**:

```
Visitar: https://www.ssllabs.com/ssltest/
Ingresar: tu-dominio.com
Esperar análisis
```

**Objetivo**: Grade A o A+

**Mejoras comunes**:
- Deshabilitar TLS 1.0/1.1
- Configurar cipher suites fuertes
- Habilitar HSTS
- Implementar OCSP Stapling

---

## Paso 5: Python Alternative

```python
from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

httpd = HTTPServer(('localhost', 443), SimpleHTTPRequestHandler)

httpd.socket = ssl.wrap_socket(
    httpd.socket,
    keyfile="server.key",
    certfile="server.crt",
    server_side=True
)

print("Servidor HTTPS en https://localhost:443")
httpd.serve_forever()
```

---

## Comandos Útiles OpenSSL

```bash
# Ver detalles de certificado
openssl x509 -in server.crt -text -noout

# Verificar clave y cert match
openssl pkey -in server.key -pubout -outform pem | sha256sum
openssl x509 -in server.crt -pubkey -noout -outform pem | sha256sum

# Test SSL connection
openssl s_client -connect localhost:443

# Verificar cipher suites soportados
nmap --script ssl-enum-ciphers -p 443 localhost
```

---

## Entregables

- [ ] Certificado autofirmado generado
- [ ] Servidor HTTPS funcional
- [ ] Screenshot mostrando conexión HTTPS
- [ ] Documento explicando TLS handshake observado

---

[⬅️ Anterior](../lab_01_wireshark/) | [➡️ Siguiente](../lab_03_mitm/)
