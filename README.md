# Curso Completo de Ciberseguridad: De Principiante a Experto
## Enfoque en Criptografía Postcuántica y ANKASecure

> Duración: 40 horas | Nivel: Principiante → Experto | Modalidad: Teórico-Práctico

---

## 📋 Descripción del Curso

Este curso está diseñado para llevarte desde los fundamentos de la ciberseguridad hasta la implementación avanzada de soluciones criptográficas postcuánticas, con enfoque especial en la plataforma **ANKASecure**.

Al finalizar, serás capaz de:
- Comprender y aplicar conceptos avanzados de ciberseguridad
- Implementar criptografía clásica y postcuántica
- Trabajar con la plataforma ANKASecure
- Cumplir con normativas internacionales (NIST, FIPS, PCI DSS, HIPAA)
- Desarrollar soluciones seguras contra amenazas cuánticas

---

## 🎨 VISUALIZADOR WEB INTERACTIVO

**¡NUEVO!** Navega el curso completo con nuestra interfaz web moderna:

### 🚀 Inicio Rápido

**Opción 1 - Doble Click (Más Fácil)**:
```
1. Abre: index.html
2. ¡Listo! Navega por los 9 módulos
```

**Opción 2 - Scripts de Inicio**:
```bash
# Windows
start_visualizador.bat

# Linux/Mac
./start_visualizador.sh
```

**Opción 3 - Servidor Local**:
```bash
python -m http.server 8000
# Abre: http://localhost:8000
```

### ✨ Características del Visualizador

- 📊 **Vista de tarjetas** por módulo con estadísticas
- 🔍 **Navegación modal** para explorar contenido
- 📱 **Diseño responsive** (desktop, tablet, móvil)
- 🎨 **UI moderna** con gradientes y animaciones
- ⚡ **Sin dependencias** - 100% HTML/CSS/JS
- 📂 **Acceso directo** a todos los archivos markdown

**📖 [Ver documentación completa del visualizador](./VISUALIZADOR_README.md)**

---

## 🎯 Objetivos de Aprendizaje

### Conocimientos Técnicos
- Fundamentos de redes, protocolos y seguridad
- Criptografía simétrica y asimétrica
- Algoritmos postcuánticos (ML-KEM, ML-DSA, Falcon, SLH-DSA)
- Gestión de claves y PKI
- APIs de seguridad (JWS/JWE/JOSE)
- Cumplimiento normativo

### Habilidades Prácticas
- Configuración de entornos seguros
- Implementación de cifrado end-to-end
- Gestión de claves criptográficas
- Migración de sistemas clásicos a postcuánticos
- Integración de ANKASecure en arquitecturas reales

---

## 📚 Estructura del Curso (40 horas)

| Módulo | Tema | Duración | Tipo |
|--------|------|----------|------|
| **01** | Fundamentos de Ciberseguridad | 6 horas | Teoría + Labs |
| **02** | Redes y Protocolos de Seguridad | 4 horas | Teoría + Labs |
| **03** | Criptografía Clásica | 6 horas | Teoría + Labs |
| **04** | Criptografía Postcuántica | 6 horas | Teoría + Labs |
| **05** | Gestión de Claves y PKI | 4 horas | Teoría + Labs |
| **06** | APIs de Seguridad (JWS/JWE/JOSE) | 4 horas | Teoría + Labs |
| **07** | Normativas y Cumplimiento | 3 horas | Teoría + Casos |
| **08** | ANKASecure en Producción | 5 horas | Práctica Intensiva |
| **09** | Proyecto Final Integrador | 2 horas | Evaluación |

---

## 🛠️ Requisitos Previos

### Conocimientos Mínimos
- Conceptos básicos de programación (Python, JavaScript o Java)
- Uso básico de terminal/línea de comandos
- Conceptos básicos de redes (opcional, se cubre en el curso)

### Herramientas Necesarias
- Sistema operativo: Windows/Linux/macOS
- Docker Desktop
- Git
- Editor de código (VS Code recomendado)
- Postman o similar
- Python 3.9+
- Node.js 18+ (para algunos labs)
- Java 11+ (para SDK de ANKASecure)

### Cuentas Requeridas
- Cuenta de prueba en ANKASecure (se proporcionarán instrucciones)
- GitHub (para laboratorios)

---

## 📂 Organización del Contenido

Cada módulo contiene:

```
XX_Nombre_Modulo/
├── teoria/
│   ├── 01_introduccion.md
│   ├── 02_conceptos_clave.md
│   ├── 03_casos_uso.md
│   └── presentaciones/
├── laboratorios/
│   ├── lab_01_nombre/
│   │   ├── README.md
│   │   ├── guia_paso_a_paso.md
│   │   ├── codigo_inicial/
│   │   ├── solucion/
│   │   └── validacion.md
│   └── lab_02_nombre/
├── recursos/
│   ├── cheatsheets.md
│   ├── enlaces_utiles.md
│   ├── herramientas.md
│   └── bibliografia.md
└── evaluacion/
    ├── cuestionario.md
    └── ejercicios_adicionales.md
```

---

## 🚀 Cómo Usar Este Curso

### Ruta de Aprendizaje Sugerida

1. **Lee el temario completo** (`00_TEMARIO_COMPLETO.md`) para entender el alcance
2. **Configura tu entorno** siguiendo `00_SETUP_ENTORNO.md`
3. **Sigue los módulos en orden** (01 → 09)
4. **Completa todos los laboratorios** antes de avanzar
5. **Consulta los recursos** cuando necesites profundizar
6. **Realiza el proyecto final** para consolidar conocimientos

### Tiempo Estimado por Sesión
- **Sesiones cortas**: 2 horas (1h teoría + 1h práctica)
- **Sesiones intensivas**: 4 horas (2h teoría + 2h práctica)
- **Plan sugerido**: 2 sesiones/semana = 10 semanas

---

## 📖 Contenido Detallado por Módulo

### [Módulo 01: Fundamentos de Ciberseguridad](./01_Fundamentos_Ciberseguridad/) (6h)
- Tríada CIA, modelos de seguridad, vectores de ataque
- Conceptos de amenazas, vulnerabilidades y riesgos
- **Labs**: Análisis de vulnerabilidades, configuración de entornos seguros

### [Módulo 02: Redes y Protocolos](./02_Redes_y_Protocolos/) (4h)
- TCP/IP, TLS/SSL, HTTPS, certificados digitales
- Ataques de red y mitigaciones
- **Labs**: Captura y análisis de tráfico, implementación TLS

### [Módulo 03: Criptografía Clásica](./06_Criptografia_Clasica/) (6h)
- Cifrado simétrico (AES) y asimétrico (RSA, ECDSA)
- Hashing, firmas digitales, MACs
- **Labs**: Implementación de cifrado, generación de claves RSA/ECDSA

### [Módulo 04: Criptografía Postcuántica](./04_Criptografia_Postcuantica/) (6h)
- Amenaza cuántica, algoritmos NIST PQC
- ML-KEM, ML-DSA, Falcon, SLH-DSA, FrodoKEM, HQC
- **Labs**: Comparativa clásico vs postcuántico, implementación ML-KEM

### [Módulo 05: Gestión de Claves y PKI](./05_Gestion_Claves_PKI/) (4h)
- Ciclo de vida de claves, HSM, key rotation
- PKI, certificados X.509, PKCS#12
- **Labs**: Creación de PKI, gestión de claves con ANKASecure

### [Módulo 06: APIs de Seguridad](./06_APIs_Seguridad/) (4h)
- JWS (JSON Web Signature), JWE (JSON Web Encryption)
- JOSE, streaming seguro, detached signatures
- **Labs**: Implementación JWS/JWE, integración con APIs

### [Módulo 07: Normativas y Cumplimiento](./07_Normativas_Cumplimiento/) (3h)
- NIST, FIPS 140-2/3, PCI DSS, HIPAA, GDPR
- CNSA 2.0, GSA PQC Mandate
- **Labs**: Auditoría de cumplimiento, documentación

### [Módulo 08: ANKASecure en Producción](./08_ANKASecure_Practica/) (5h)
- CLI, SDK Java, APIs REST
- Despliegue SaaS y On-Premise
- Migración RSA → ML-KEM
- **Labs**: Proyecto completo con ANKASecure

### [Módulo 09: Proyecto Final](./09_Proyecto_Final/) (2h)
- Diseño e implementación de sistema seguro end-to-end
- Migración de sistema clásico a postcuántico
- Presentación y documentación

---

## 🏆 Evaluación y Certificación

### Criterios de Aprobación
- Completar 100% de laboratorios (peso: 50%)
- Aprobar cuestionarios por módulo (peso: 20%)
- Proyecto final funcional (peso: 30%)

### Entregables
- Código de todos los laboratorios
- Documentación técnica del proyecto final
- Reporte de migración a PQC

---

## 📞 Soporte y Recursos

### Documentación Oficial
- [ANKASecure Documentation](https://docs.ankatech.co/)
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)

### Comunidad
- Foro de discusión del curso (configurar Discord/Slack)
- Issues en GitHub para dudas técnicas

### Contacto
- Instructor: [Configurar]
- Correo: [Configurar]

---

## 📅 Cronograma Sugerido

### Plan de 10 Semanas (4h/semana)

| Semana | Módulos | Horas |
|--------|---------|-------|
| 1 | Setup + Módulo 01 | 4h |
| 2 | Módulo 01 (cont.) + Módulo 02 | 4h |
| 3 | Módulo 03 (parte 1) | 4h |
| 4 | Módulo 03 (parte 2) | 4h |
| 5 | Módulo 04 (parte 1) | 4h |
| 6 | Módulo 04 (parte 2) | 4h |
| 7 | Módulo 05 + Módulo 06 | 4h |
| 8 | Módulo 07 + Módulo 08 (parte 1) | 4h |
| 9 | Módulo 08 (parte 2) | 4h |
| 10 | Módulo 09 (Proyecto Final) | 4h |

---

## 🔄 Actualizaciones

Este curso se actualiza regularmente para incluir:
- Nuevos algoritmos postcuánticos estandarizados
- Actualizaciones de ANKASecure
- Nuevas normativas y mejores prácticas
- Feedback de estudiantes

**Última actualización**: 2026-02-10

---

## 📜 Licencia

Este material educativo está diseñado con fines didácticos.

**Nota**: ANKASecure y su documentación son propiedad de Ankatech.

---

## 🚦 ¡Comienza Ahora!

### Opción A: Visualizador Web (Recomendado) 🎨
1. Abre `index.html` en tu navegador
2. Explora los módulos visualmente
3. Click para acceder al contenido

### Opción B: Navegación Tradicional 📚
1. Lee el [Temario Completo](./00_TEMARIO_COMPLETO.md)
2. Configura tu [Entorno de Desarrollo](./00_SETUP_ENTORNO.md)
3. Inicia con [Módulo 01: Fundamentos](./01_Fundamentos_Ciberseguridad/)

**¡Bienvenido al mundo de la ciberseguridad postcuántica!** 🔐🚀
