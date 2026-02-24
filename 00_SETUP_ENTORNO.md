# GUÍA DE CONFIGURACIÓN DEL ENTORNO
## Curso de Ciberseguridad: De Principiante a Experto

**Tiempo estimado de configuración**: 2-3 horas
**Última actualización**: 2026-02-10

---

## 📋 Tabla de Contenidos

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación de Herramientas Base](#instalación-de-herramientas-base)
3. [Configuración de Máquina Virtual (Kali Linux)](#configuración-de-máquina-virtual)
4. [Entorno de Desarrollo](#entorno-de-desarrollo)
5. [Instalación de Librerías Criptográficas](#instalación-de-librerías-criptográficas)
6. [Configuración de ANKASecure](#configuración-de-ankasecure)
7. [Verificación del Entorno](#verificación-del-entorno)
8. [Solución de Problemas](#solución-de-problemas)

---

## 1. Requisitos del Sistema

### Hardware Mínimo
- **CPU**: 4 núcleos (recomendado: 6+)
- **RAM**: 8 GB (recomendado: 16 GB)
- **Disco**: 100 GB libres (SSD recomendado)
- **Red**: Conexión a Internet estable

### Sistemas Operativos Soportados
- Windows 10/11 Pro (64-bit)
- macOS 12.0+ (Monterey o superior)
- Linux Ubuntu 20.04/22.04 LTS o Debian 11+

### Permisos Necesarios
- Derechos de administrador/sudo
- Capacidad para instalar software
- Habilitar virtualización en BIOS (Intel VT-x / AMD-V)

---

## 2. Instalación de Herramientas Base

### A. Git

#### Windows
```powershell
# Descargar instalador desde https://git-scm.com/download/win
# O usar winget
winget install Git.Git
```

#### macOS
```bash
# Instalar Homebrew primero si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Git
brew install git
```

#### Linux
```bash
sudo apt update
sudo apt install git -y
```

**Verificar instalación**:
```bash
git --version
# Debe mostrar: git version 2.x.x
```

### B. Docker Desktop

Docker es esencial para laboratorios de contenedores y servicios.

#### Windows/macOS
1. Descargar de https://www.docker.com/products/docker-desktop
2. Ejecutar instalador
3. Reiniciar el sistema
4. Abrir Docker Desktop y completar setup

#### Linux
```bash
# Instalar Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose -y

# Reiniciar sesión
```

**Verificar instalación**:
```bash
docker --version
docker-compose --version
docker run hello-world
```

### C. Editor de Código: Visual Studio Code

#### Todos los sistemas
1. Descargar de https://code.visualstudio.com/
2. Instalar

#### Extensiones recomendadas:
Instalar desde VS Code Extensions (Ctrl+Shift+X):
- Python (Microsoft)
- Java Extension Pack
- REST Client
- Docker
- GitLens
- Markdown All in One
- Hex Editor

```bash
# O instalar vía CLI
code --install-extension ms-python.python
code --install-extension vscjava.vscode-java-pack
code --install-extension humao.rest-client
code --install-extension ms-azuretools.vscode-docker
```

### D. Postman o Insomnia

Para testing de APIs.

#### Postman
- Descargar de https://www.postman.com/downloads/
- Crear cuenta gratuita

#### Alternativa: Insomnia
- Descargar de https://insomnia.rest/download

---

## 3. Configuración de Máquina Virtual (Kali Linux)

Usaremos Kali Linux para laboratorios de pentesting.

### Opción A: VirtualBox (Recomendado para principiantes)

#### Instalar VirtualBox
1. Descargar de https://www.virtualbox.org/wiki/Downloads
2. Instalar VirtualBox + Extension Pack

#### Descargar Kali Linux
1. Ir a https://www.kali.org/get-kali/#kali-virtual-machines
2. Descargar imagen VirtualBox (64-bit) - aprox 4 GB

#### Importar máquina virtual
```bash
# Abrir VirtualBox
# File → Import Appliance
# Seleccionar archivo .ova descargado
# Configurar:
#   - RAM: 4096 MB (mínimo 2048 MB)
#   - CPUs: 2+ núcleos
#   - Video Memory: 128 MB
# Importar
```

#### Credenciales por defecto
- **Usuario**: kali
- **Password**: kali

#### Configuración post-instalación
```bash
# Actualizar sistema
sudo apt update && sudo apt full-upgrade -y

# Instalar herramientas adicionales
sudo apt install -y \
    nmap \
    wireshark \
    metasploit-framework \
    sqlmap \
    nikto \
    john \
    hydra \
    aircrack-ng \
    burpsuite

# Configurar permisos de Wireshark
sudo dpkg-reconfigure wireshark-common
# Seleccionar "Yes" para non-superusers
sudo usermod -aG wireshark $USER
```

### Opción B: VMware Workstation Player

Similar a VirtualBox, descargar imagen de Kali para VMware.

### Configuración de Red

**Red NAT** (recomendado para empezar):
- Permite acceso a Internet
- Aislado del host

**Red Bridge** (para laboratorios avanzados):
- Acceso a red local
- ⚠️ **ADVERTENCIA**: Solo usar en redes de prueba

---

## 4. Entorno de Desarrollo

### A. Python 3.9+

#### Windows
```powershell
# Descargar de https://www.python.org/downloads/
# O usar winget
winget install Python.Python.3.11

# Verificar
python --version
pip --version
```

#### macOS
```bash
brew install python@3.11
```

#### Linux
```bash
sudo apt install python3 python3-pip python3-venv -y
```

#### Configurar entorno virtual
```bash
# Crear entorno virtual para el curso
python -m venv ~/curso-ciberseguridad-env

# Activar (Linux/macOS)
source ~/curso-ciberseguridad-env/bin/activate

# Activar (Windows)
~/curso-ciberseguridad-env/Scripts/activate

# Instalar paquetes base
pip install --upgrade pip
pip install \
    cryptography \
    pycryptodome \
    pyjwt \
    requests \
    flask \
    fastapi \
    uvicorn \
    python-jose[cryptography] \
    scapy \
    pwntools
```

### B. Node.js 18+

#### Windows/macOS
Descargar de https://nodejs.org/ (versión LTS)

#### Linux
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verificar**:
```bash
node --version  # v18.x.x
npm --version   # 9.x.x
```

**Instalar paquetes globales**:
```bash
npm install -g \
    nodemon \
    pm2 \
    http-server
```

### C. Java 11+ (OpenJDK)

Para SDK de ANKASecure.

#### Windows
```powershell
winget install Microsoft.OpenJDK.17
```

#### macOS
```bash
brew install openjdk@17
```

#### Linux
```bash
sudo apt install openjdk-17-jdk -y
```

**Verificar**:
```bash
java -version
javac -version
```

### D. Maven (para proyectos Java)

#### Todos los sistemas
Descargar de https://maven.apache.org/download.cgi

#### Linux
```bash
sudo apt install maven -y
```

**Verificar**:
```bash
mvn --version
```

---

## 5. Instalación de Librerías Criptográficas

### A. OpenSSL

#### Windows
Incluido en Git Bash o descargar de https://slproweb.com/products/Win32OpenSSL.html

#### macOS/Linux
```bash
# Ya viene preinstalado, actualizar si es necesario
brew install openssl  # macOS
sudo apt install openssl libssl-dev  # Linux
```

**Verificar**:
```bash
openssl version
# OpenSSL 3.x.x
```

### B. liboqs (Open Quantum Safe)

Librería de criptografía postcuántica.

#### Linux/macOS
```bash
# Instalar dependencias
sudo apt install cmake gcc ninja-build libssl-dev  # Linux
brew install cmake ninja openssl  # macOS

# Clonar repositorio
git clone --depth 1 https://github.com/open-quantum-safe/liboqs.git
cd liboqs

# Compilar e instalar
mkdir build && cd build
cmake -GNinja -DCMAKE_INSTALL_PREFIX=/usr/local ..
ninja
sudo ninja install

# Verificar
ls /usr/local/lib/liboqs*
```

#### Python wrapper (oqs-python)
```bash
pip install liboqs-python
```

#### Verificar instalación Python
```python
import oqs
print(oqs.get_enabled_kem_mechanisms())
# Debe mostrar lista de KEMs incluyendo Kyber, BIKE, etc.
```

#### Windows
Instrucciones en: https://github.com/open-quantum-safe/liboqs/wiki/Windows-Platform

### C. Librerías Python adicionales

```bash
# Activar entorno virtual primero
pip install \
    liboqs-python \
    cryptography>=41.0.0 \
    pycryptodome \
    ecdsa \
    paramiko \
    bcrypt \
    argon2-cffi
```

---

## 6. Configuración de ANKASecure

### A. Crear Cuenta de Prueba

1. Ir a https://ankatech.co/ (o URL proporcionada)
2. Registrarse para prueba gratuita/académica
3. Verificar correo electrónico
4. Acceder al dashboard

### B. Obtener Credenciales API

1. Dashboard → API Keys → Generate New Key
2. Guardar:
   - API Key ID
   - API Secret (⚠️ solo se muestra una vez)
   - Endpoint URL (ej: `https://api.ankasecure.com`)

### C. Instalar CLI de ANKASecure

#### Linux/macOS
```bash
# Descargar CLI (ajustar URL según documentación)
curl -L https://downloads.ankatech.co/cli/latest/anka-cli-linux -o anka
chmod +x anka
sudo mv anka /usr/local/bin/

# Configurar credenciales
anka config set api-key YOUR_API_KEY_ID
anka config set api-secret YOUR_API_SECRET
anka config set endpoint https://api.ankasecure.com

# Verificar
anka auth verify
```

#### Windows
```powershell
# Descargar ejecutable
# Agregar a PATH
# Configurar igual que Linux
```

### D. Instalar SDK Java

```xml
<!-- Agregar a pom.xml -->
<dependency>
    <groupId>co.ankatech</groupId>
    <artifactId>ankasecure-sdk</artifactId>
    <version>3.0.0</version>
</dependency>
```

O descargar JAR manualmente de la documentación.

### E. Colecciones Postman

1. Dashboard → Resources → Postman Collection
2. Descargar colección JSON
3. Importar en Postman
4. Configurar variables de entorno:
   - `api_key`
   - `api_secret`
   - `base_url`

---

## 7. Verificación del Entorno

### Script de Verificación Python

Guardar como `check_environment.py`:

```python
#!/usr/bin/env python3
"""Script de verificación del entorno del curso de ciberseguridad"""

import sys
import subprocess

def check_command(command, name):
    """Verifica si un comando existe"""
    try:
        result = subprocess.run([command, '--version'],
                                capture_output=True,
                                text=True,
                                timeout=5)
        print(f"✅ {name}: OK")
        return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print(f"❌ {name}: NO ENCONTRADO")
        return False

def check_python_package(package, name):
    """Verifica si un paquete de Python está instalado"""
    try:
        __import__(package)
        print(f"✅ {name}: OK")
        return True
    except ImportError:
        print(f"❌ {name}: NO INSTALADO")
        return False

def main():
    print("=" * 60)
    print("VERIFICACIÓN DEL ENTORNO - Curso de Ciberseguridad")
    print("=" * 60)
    print()

    all_ok = True

    # Herramientas base
    print("📦 Herramientas Base:")
    all_ok &= check_command('git', 'Git')
    all_ok &= check_command('docker', 'Docker')
    all_ok &= check_command('python', 'Python')
    all_ok &= check_command('node', 'Node.js')
    all_ok &= check_command('java', 'Java')
    all_ok &= check_command('openssl', 'OpenSSL')
    print()

    # Paquetes Python
    print("🐍 Paquetes Python:")
    all_ok &= check_python_package('cryptography', 'cryptography')
    all_ok &= check_python_package('Crypto', 'pycryptodome')
    all_ok &= check_python_package('jwt', 'pyjwt')
    all_ok &= check_python_package('oqs', 'liboqs-python')
    all_ok &= check_python_package('flask', 'Flask')
    print()

    # Verificación final
    print("=" * 60)
    if all_ok:
        print("✅ ¡ENTORNO CONFIGURADO CORRECTAMENTE!")
        print("Estás listo para comenzar el curso.")
    else:
        print("⚠️ FALTAN COMPONENTES")
        print("Por favor, instala los componentes faltantes.")
        sys.exit(1)
    print("=" * 60)

if __name__ == '__main__':
    main()
```

**Ejecutar**:
```bash
python check_environment.py
```

### Verificación Manual

```bash
# Versiones
git --version
docker --version
python --version
node --version
java -version
openssl version

# Python packages
python -c "import cryptography; print('cryptography OK')"
python -c "import oqs; print('liboqs OK')"

# ANKASecure CLI
anka --version
anka auth verify
```

---

## 8. Solución de Problemas

### Problema: Docker no inicia en Windows

**Solución**:
1. Habilitar Hyper-V en Windows Features
2. Habilitar virtualización en BIOS
3. Reiniciar

### Problema: liboqs no compila

**Solución**:
```bash
# Instalar dependencias faltantes
sudo apt install build-essential cmake ninja-build

# Limpiar y recompilar
cd liboqs/build
rm -rf *
cmake -GNinja ..
ninja
```

### Problema: Python no encuentra paquetes

**Solución**:
```bash
# Verificar que estás en el entorno virtual
which python

# Reinstalar paquetes
pip install --force-reinstall cryptography
```

### Problema: ANKASecure CLI no se conecta

**Verificar**:
```bash
# Credenciales correctas
anka config list

# Conectividad
curl -I https://api.ankasecure.com

# Verificar API key en dashboard
```

### Problema: VirtualBox no arranca VM

**Solución**:
- Aumentar RAM asignada a VM
- Deshabilitar Hyper-V si usas VirtualBox (Windows)
- Verificar que virtualización está habilitada en BIOS

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Docker Docs](https://docs.docker.com/)
- [Python Docs](https://docs.python.org/3/)
- [Kali Linux Docs](https://www.kali.org/docs/)
- [ANKASecure Docs](https://docs.ankatech.co/)
- [Open Quantum Safe](https://openquantumsafe.org/)

### Comunidades
- Stack Overflow
- Reddit: r/cybersecurity, r/netsec
- Discord de seguridad

---

## ✅ Checklist Final

Antes de empezar el curso, asegúrate de tener:

- [ ] Git instalado y configurado
- [ ] Docker Desktop funcionando
- [ ] VM de Kali Linux operativa
- [ ] Python 3.9+ con entorno virtual
- [ ] Node.js 18+
- [ ] Java 11+
- [ ] OpenSSL instalado
- [ ] liboqs compilado
- [ ] Cuenta ANKASecure creada
- [ ] CLI de ANKASecure configurada
- [ ] VS Code con extensiones
- [ ] Postman instalado
- [ ] Script de verificación ejecutado con éxito

---

## 🚀 Siguiente Paso

Una vez completada la configuración:

👉 **[Ir al Módulo 01: Fundamentos de Ciberseguridad](./01_Fundamentos_Ciberseguridad/)**

---

**¿Problemas durante el setup?**
Consulta la sección de troubleshooting o contacta al instructor.

**Última actualización**: 2026-02-10
