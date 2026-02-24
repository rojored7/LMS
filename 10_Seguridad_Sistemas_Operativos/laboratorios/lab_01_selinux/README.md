# Laboratorio 01: Configuración Práctica de SELinux

## Objetivos

1. Configurar SELinux en modo Enforcing
2. Resolver problemas comunes de SELinux con aplicaciones web
3. Crear políticas personalizadas con audit2allow
4. Configurar contextos de seguridad para aplicaciones custom
5. Implementar booleanos para permitir funcionalidades específicas
6. Auditar y troubleshoot denials de SELinux

## Duración: 3-4 horas

---

## Parte 1: Configuración Inicial de SELinux

### Paso 1.1: Verificar Estado de SELinux

```bash
# Ver estado actual
getenforce
sestatus

# Si está Disabled, habilitar en /etc/selinux/config
sudo nano /etc/selinux/config
# SELINUX=enforcing
# SELINUXTYPE=targeted

# Reiniciar (SOLO si estaba Disabled)
# ⚠️ WARNING: Primera vez en Enforcing puede causar problemas
# Recomendado: Iniciar en Permissive primero
sudo reboot
```

### Paso 1.2: Modo Permissive (Para Testing)

```bash
# Cambiar temporalmente a Permissive
sudo setenforce 0
getenforce  # Permissive

# Esto permite:
# - Ver qué se bloquearía sin bloquear realmente
# - Generar logs para crear políticas
```

---

## Parte 2: Nginx con Directorio Web Personalizado

### Escenario

Tienes un servidor Nginx que sirve contenido desde `/srv/website` en lugar de `/var/www/html`. SELinux bloqueará el acceso.

### Paso 2.1: Instalar Nginx

```bash
# RHEL/CentOS
sudo dnf install nginx -y

# Iniciar servicio
sudo systemctl enable --now nginx

# Verificar que funciona
curl http://localhost
# Debería mostrar página de bienvenida
```

### Paso 2.2: Crear Directorio Custom

```bash
# Crear directorio custom
sudo mkdir -p /srv/website
sudo echo "<h1>Mi Sitio Web</h1>" > /srv/website/index.html

# Configurar Nginx para usar este directorio
sudo nano /etc/nginx/nginx.conf
```

**Modificar server block:**
```nginx
server {
    listen       80;
    server_name  _;
    root         /srv/website;  # ← Cambiar aquí

    location / {
        index index.html;
    }
}
```

```bash
# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### Paso 2.3: Observar el Problema SELinux

```bash
# Intentar acceder
curl http://localhost

# Error: 403 Forbidden

# Ver error en log de Nginx
sudo tail /var/log/nginx/error.log
# open() "/srv/website/index.html" failed (13: Permission denied)

# Ver denial de SELinux
sudo ausearch -m AVC -ts recent
```

**Ejemplo de denial:**
```
type=AVC msg=audit(1708606789.123:456): avc:  denied  { read } for  pid=1234 comm="nginx" name="index.html" dev="dm-0" ino=67890 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:var_t:s0 tclass=file permissive=0
```

**Análisis del denial:**
- `scontext=system_u:system_r:httpd_t:s0` → Nginx ejecutándose como httpd_t
- `tcontext=unconfined_u:object_r:var_t:s0` → Archivo con contexto var_t (incorrecto)
- `denied { read }` → Lectura denegada

### Paso 2.4: Solución - Cambiar Contexto de Seguridad

```bash
# Ver contexto actual
ls -Z /srv/website/
# unconfined_u:object_r:var_t:s0 index.html

# Ver contexto correcto para contenido web
ls -Z /var/www/html/
# system_u:object_r:httpd_sys_content_t:s0

# Cambiar contexto temporalmente (NO persiste tras relabel)
sudo chcon -t httpd_sys_content_t /srv/website/index.html

# Verificar
ls -Z /srv/website/
# unconfined_u:object_r:httpd_sys_content_t:s0 index.html

# Probar acceso
curl http://localhost
# ✓ Funciona!
```

### Paso 2.5: Solución Permanente con semanage

```bash
# Agregar regla permanente de contexto
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/website(/.*)?"

# Ver reglas agregadas
sudo semanage fcontext -l | grep /srv/website

# Aplicar contextos según política
sudo restorecon -Rv /srv/website/

# Verificar
ls -Z /srv/website/
# system_u:object_r:httpd_sys_content_t:s0 index.html

# Crear archivo nuevo y verificar que hereda contexto correcto
echo "Nuevo archivo" | sudo tee /srv/website/nuevo.html
ls -Z /srv/website/nuevo.html
# system_u:object_r:httpd_sys_content_t:s0 nuevo.html ✓
```

---

## Parte 3: Nginx con PHP-FPM y Conexiones de Red

### Escenario

Nginx necesita conectarse a PHP-FPM y a una base de datos PostgreSQL. SELinux bloqueará estas conexiones.

### Paso 3.1: Instalar PHP-FPM y PostgreSQL

```bash
sudo dnf install php-fpm postgresql-server -y

# Inicializar PostgreSQL
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

# Iniciar PHP-FPM
sudo systemctl enable --now php-fpm
```

### Paso 3.2: Configurar Nginx para PHP

```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
server {
    listen       80;
    server_name  _;
    root         /srv/website;

    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 3.3: Crear Script PHP que Conecta a Base de Datos

```bash
sudo nano /srv/website/db-test.php
```

```php
<?php
// Intentar conectar a PostgreSQL
$conn = pg_connect("host=localhost dbname=postgres user=postgres");

if ($conn) {
    echo "✓ Conexión a base de datos exitosa!";
    pg_close($conn);
} else {
    echo "✗ Error conectando a base de datos: " . pg_last_error();
}
?>
```

### Paso 3.4: Observar Denials

```bash
# Acceder al script
curl http://localhost/db-test.php

# Ver denials
sudo ausearch -m AVC -ts recent | grep httpd

# Denial 1: Nginx → PHP-FPM (puerto 9000)
# Denial 2: PHP → PostgreSQL (puerto 5432)
```

### Paso 3.5: Solución con Booleanos

```bash
# Ver booleanos disponibles para httpd
sudo getsebool -a | grep httpd

# Permitir a Nginx conectarse a red (PHP-FPM, bases de datos)
sudo setsebool -P httpd_can_network_connect on

# -P = Permanente (persiste tras reboot)

# Verificar
sudo getsebool httpd_can_network_connect
# httpd_can_network_connect --> on

# Probar nuevamente
curl http://localhost/db-test.php
# ✓ Conexión a base de datos exitosa!
```

**Otros booleanos útiles:**
```bash
# Permitir a Nginx enviar emails
sudo setsebool -P httpd_can_sendmail on

# Permitir a Nginx acceder a home directories
sudo setsebool -P httpd_enable_homedirs on

# Permitir scripts CGI
sudo setsebool -P httpd_enable_cgi on

# Permitir a Nginx actuar como proxy (reverse proxy)
sudo setsebool -P httpd_can_network_relay on
```

---

## Parte 4: Aplicación Custom con Puerto No Estándar

### Escenario

Tienes una aplicación web custom en Python (Flask) que escucha en puerto 8080. SELinux bloqueará el bind.

### Paso 4.1: Crear Aplicación Flask Simple

```bash
# Instalar Flask
sudo dnf install python3-pip -y
pip3 install flask

# Crear aplicación
mkdir ~/myapp
cd ~/myapp
nano app.py
```

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return '<h1>Mi Aplicación Custom en Puerto 8080</h1>'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

### Paso 4.2: Intentar Ejecutar (Fallará)

```bash
# Si SELinux está en Enforcing y la app ejecuta como httpd_t
python3 app.py

# Error:
# OSError: [Errno 13] Permission denied

# Ver denial
sudo ausearch -m AVC -ts recent
```

### Paso 4.3: Agregar Puerto a Política de SELinux

```bash
# Ver puertos permitidos para httpd
sudo semanage port -l | grep http_port_t
# http_port_t  tcp  80, 81, 443, 488, 8008, 8009, 8443, 9000

# Agregar puerto 8080
sudo semanage port -a -t http_port_t -p tcp 8080

# Verificar
sudo semanage port -l | grep 8080
# http_port_t  tcp  80, 81, 443, 488, 8008, 8009, 8080, 8443, 9000

# Ejecutar aplicación
python3 app.py
# ✓ Running on http://0.0.0.0:8080

# Probar
curl http://localhost:8080
# ✓ Funciona!
```

---

## Parte 5: Crear Política Personalizada con audit2allow

### Escenario

Tienes una aplicación que hace algo que no está permitido por políticas existentes.

### Paso 5.1: Simular Aplicación con Denial

```bash
# Crear script que intenta leer /etc/shadow (normalmente prohibido)
cat > /tmp/test-script.sh <<'EOF'
#!/bin/bash
cat /etc/shadow > /dev/null
EOF

chmod +x /tmp/test-script.sh

# Cambiar contexto para que se ejecute como httpd_t
sudo chcon -t httpd_exec_t /tmp/test-script.sh

# Ejecutar (generará denial)
sudo -u apache /tmp/test-script.sh
# cat: /etc/shadow: Permission denied
```

### Paso 5.2: Generar Política desde Denials

```bash
# Ver denials recientes
sudo ausearch -m AVC -ts recent

# Generar módulo de política
sudo ausearch -m AVC -ts recent | audit2allow -M mypolicy

# Output:
# ******************** IMPORTANT ***********************
# To make this policy package active, execute:
# semodule -i mypolicy.pp

# Ver contenido del módulo (SIEMPRE REVISAR!)
cat mypolicy.te
```

**Ejemplo de política generada:**
```
module mypolicy 1.0;

require {
    type httpd_t;
    type shadow_t;
    class file { read open getattr };
}

#============= httpd_t ==============
allow httpd_t shadow_t:file { read open getattr };
```

### Paso 5.3: Revisar y Decidir

```bash
# ⚠️ PREGUNTA CRÍTICA: ¿DEBERÍA httpd_t leer /etc/shadow?
# Respuesta: ¡NO! Es un riesgo de seguridad

# En lugar de instalar la política, FIX THE APPLICATION
# Solución correcta: No permitir que la app web lea /etc/shadow

# Pero si REALMENTE es necesario (caso legítimo):
sudo semodule -i mypolicy.pp

# Verificar que se instaló
sudo semodule -l | grep mypolicy
```

---

## Parte 6: Troubleshooting Avanzado

### Paso 6.1: Herramienta sealert

```bash
# Instalar setroubleshoot
sudo dnf install setroubleshoot-server -y

# Analizar TODOS los denials
sudo sealert -a /var/log/audit/audit.log

# Output ejemplo:
# SELinux is preventing /usr/sbin/nginx from name_connect access on the tcp_socket port 5432.
#
# ***** Plugin catchall_boolean (57.1 confidence) suggests *******************
#
# If you want to allow httpd to can network connect
# Then you must tell SELinux about this by enabling the 'httpd_can_network_connect' boolean.
#
# Do
# setsebool -P httpd_can_network_connect 1
```

### Paso 6.2: Debugging con Modo Permissive Selectivo

```bash
# Poner SOLO httpd_t en modo permissive (resto en enforcing)
sudo semanage permissive -a httpd_t

# Verificar
sudo semodule -l | grep permissive

# Ahora httpd_t puede hacer cualquier cosa (pero se loggea)
# Útil para debugging sin afectar todo el sistema

# Cuando termines de debuggear, quitar permissive
sudo semanage permissive -d httpd_t
```

---

## Parte 7: Casos de Uso Reales

### Caso 7.1: WordPress con Uploads

```bash
# Crear directorio de uploads
sudo mkdir -p /srv/website/wp-content/uploads

# Contexto para archivos que la app web puede ESCRIBIR
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/srv/website/wp-content/uploads(/.*)?"
sudo restorecon -Rv /srv/website/wp-content/uploads/

# Verificar
ls -Z /srv/website/wp-content/ | grep uploads
# drwxr-xr-x. apache apache system_u:object_r:httpd_sys_rw_content_t:s0 uploads
```

### Caso 7.2: Aplicación Node.js

```bash
# Puerto custom para Node.js (3000)
sudo semanage port -a -t http_port_t -p tcp 3000

# Contexto para directorio de la app
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/myapp(/.*)?"
sudo restorecon -Rv /opt/myapp/

# Permitir ejecutar scripts
sudo setsebool -P httpd_enable_cgi on
```

---

## Parte 8: Verificación y Auditoría

### Paso 8.1: Verificar Configuración Completa

```bash
# Estado general
sestatus

# Contextos de archivos críticos
ls -Z /srv/website/
ls -Z /etc/nginx/nginx.conf

# Booleanos habilitados
sudo getsebool -a | grep "httpd.*--> on"

# Puertos permitidos
sudo semanage port -l | grep http_port_t

# Políticas custom instaladas
sudo semodule -l | grep -v "^selinux"
```

### Paso 8.2: Generar Reporte

```bash
# Script de auditoría
cat > /tmp/selinux-audit.sh <<'EOF'
#!/bin/bash

echo "=== SELinux Configuration Audit ==="
echo ""
echo "Status: $(getenforce)"
echo ""
echo "Custom File Contexts:"
sudo semanage fcontext -l | grep -v "^/"
echo ""
echo "Custom Ports:"
sudo semanage port -l | grep -v "^unreserved"
echo ""
echo "Modified Booleans:"
sudo getsebool -a | grep "httpd.*--> on"
echo ""
echo "Custom Modules:"
sudo semodule -l | grep -v "^selinux"
echo ""
echo "Recent Denials (last 24h):"
sudo ausearch -m AVC -ts today | grep denied | wc -l
EOF

chmod +x /tmp/selinux-audit.sh
/tmp/selinux-audit.sh
```

---

## Desafío Final

### Objetivo

Configurar un servidor completo con:
1. Nginx como reverse proxy
2. Aplicación backend en puerto 5000
3. Directorio de uploads escribible
4. Conexión a Redis (puerto 6379)
5. Todo con SELinux en Enforcing

### Solución Esperada

```bash
# 1. Contextos de archivos
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/backend(/.*)?"
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/opt/backend/uploads(/.*)?"
sudo restorecon -Rv /opt/backend/

# 2. Puertos
sudo semanage port -a -t http_port_t -p tcp 5000
sudo semanage port -a -t http_port_t -p tcp 6379

# 3. Booleanos
sudo setsebool -P httpd_can_network_connect on
sudo setsebool -P httpd_can_network_relay on

# 4. Verificar
curl http://localhost  # → Nginx → Backend → Redis
sudo ausearch -m AVC -ts recent  # No denials
```

---

## Checklist de Completado

- [ ] SELinux en modo Enforcing
- [ ] Nginx sirviendo desde directorio custom
- [ ] PHP-FPM conectándose a PostgreSQL
- [ ] Aplicación en puerto custom (8080)
- [ ] Política personalizada creada (y REVISADA)
- [ ] Troubleshooting con sealert
- [ ] Auditoría completa de configuración
- [ ] Desafío final completado

---

## Recursos

- Red Hat SELinux Guide: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/using_selinux/
- SELinux Coloring Book: https://people.redhat.com/duffy/selinux/selinux-coloring-book_A4-Stapled.pdf
- Dan Walsh's Blog: https://danwalsh.livejournal.com/
- Man pages: `man semanage`, `man setsebool`, `man audit2allow`

🔐 **"SELinux is not the enemy, misconfiguration is"** - Con práctica, SELinux se vuelve tu mejor aliado.
