# 🎯 VISUALIZADOR DEL CURSO DE CIBERSEGURIDAD

## Descripción

Interfaz web interactiva para navegar el contenido completo del Curso de Ciberseguridad - De Principiante a Experto en PQC.

## 🚀 Cómo Usar

### Opción 1: Abrir Directamente (Recomendado)

1. **Doble click** en `index.html`
2. Se abrirá en tu navegador predeterminado
3. Navega por los 9 módulos del curso

### Opción 2: Servidor Local (Opcional)

Si prefieres usar un servidor local:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (http-server)
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

Luego abre: http://localhost:8000

## ✨ Características

### 📊 Vista Principal
- **Tarjetas por módulo** con información clave
- **Estadísticas del curso**: 9 módulos, 40 horas, 44 archivos, 20+ labs
- **Barra de progreso** por módulo (70-100% completitud)
- **Tags de temas** principales por módulo

### 🔍 Vista de Módulo (Modal)
- **Contenido teórico** organizado
- **Laboratorios prácticos** listados
- **Recursos adicionales** (evaluaciones, plantillas)
- **Links directos** a archivos markdown

### 📱 Responsive Design
- Funciona en desktop, tablet y móvil
- Diseño adaptativo con CSS Grid

### 🎨 UI/UX
- Gradientes modernos (purple-blue)
- Animaciones suaves
- Hover effects
- Modal para detalles

## 📂 Estructura de Navegación

```
index.html
├── Módulo 01: Fundamentos de Ciberseguridad
│   ├── 📚 Teoría (4 archivos)
│   ├── 🔬 Labs (3 prácticos)
│   └── 📋 Evaluación
├── Módulo 02: Redes y Protocolos
│   ├── 📚 Teoría (3 archivos)
│   └── 🔬 Labs (3 prácticos)
├── Módulo 03: Criptografía Clásica
│   ├── 📚 Teoría (3 archivos)
│   └── 🔬 Labs (4 prácticos)
├── Módulo 04: Criptografía Postcuántica
│   ├── 📚 Teoría (2 archivos)
│   └── 🔬 Labs (1 práctico)
├── Módulo 05: Gestión de Claves y PKI
├── Módulo 06: APIs de Seguridad
├── Módulo 07: Normativas y Cumplimiento
├── Módulo 08: ANKASecure en Producción
└── Módulo 09: Proyecto Final
```

## 🔗 Links Rápidos en Footer

- **📋 Temario Completo**: Syllabus detallado del curso
- **🔧 Setup Entorno**: Instrucciones de instalación
- **📊 Reporte Final**: Estadísticas y contenido
- **📖 README**: Documentación principal

## 💡 Tips de Uso

1. **Click en tarjeta**: Abre modal con contenido del módulo
2. **Click en archivo**: Abre el markdown directamente
3. **"Ver Contenido"**: Muestra todos los archivos del módulo
4. **"README"**: Acceso directo al README del módulo

## 🛠️ Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive con Grid y Flexbox
- **JavaScript (Vanilla)**: Interactividad sin dependencias
- **No requiere backend**: 100% client-side

## 📊 Estadísticas del Curso

- **9 Módulos**: 01 → 09
- **40 Horas**: Contenido total
- **44 Archivos**: Markdown profesionales
- **20+ Labs**: Prácticas hands-on
- **12,000+ Líneas**: Contenido educativo
- **488 KB**: Material técnico

## 🎯 Módulos Destacados

### ✅ 100% Completos
- Módulo 01: Fundamentos (Labs: Nmap, Phishing)
- Módulo 02: Redes (Labs: Wireshark, TLS, MitM)
- Módulo 03: Cripto Clásica (Labs: AES, RSA, ECC)

### 🚀 80-90% Completos
- Módulo 04: PQC (ML-KEM, ML-DSA, Falcon)
- Módulo 09: Proyecto Final (Template + 4 opciones)

### 📝 70% Completos (Estructura + Contenido Clave)
- Módulos 05, 06, 07, 08

## 🔐 Temas Cubiertos

### Fundamentos
- CIA Triad, NIST, ISO 27001
- OWASP Top 10, CVEs
- MITRE ATT&CK, Kill Chain

### Criptografía Clásica
- AES-GCM, ChaCha20
- RSA, Ed25519, X25519
- SHA-2, Argon2

### Criptografía Postcuántica
- Amenaza cuántica (Shor, Grover)
- ML-KEM, ML-DSA, Falcon
- NIST PQC 2024

### Redes
- TLS 1.3, SSH, IPsec
- Wireshark, Nmap
- MitM, ARP spoofing

### Seguridad Aplicada
- JWS, JWE, JWT
- PKI, X.509
- FIPS, PCI DSS, HIPAA
- ANKASecure

## 📝 Notas

- Los archivos markdown se abren en nueva pestaña
- Requiere navegador moderno (Chrome, Firefox, Edge, Safari)
- Compatible con GitHub Pages
- Sin dependencias externas

## 🎓 Público Objetivo

- Estudiantes de ciberseguridad
- Desarrolladores backend/fullstack
- Ingenieros de seguridad
- Arquitectos de software
- DevSecOps

## 📧 Soporte

Para dudas o mejoras, consultar:
- REPORTE_FINAL_COMPLETO.txt
- README.md principal
- Documentación de cada módulo

---

**💼 Desarrollado para ANKA Tech | 🎓 Curso Profesional 2026**
