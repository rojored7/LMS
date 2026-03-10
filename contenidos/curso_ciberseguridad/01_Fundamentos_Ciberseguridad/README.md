# MÓDULO 01: FUNDAMENTOS DE CIBERSEGURIDAD

**Duración**: 6 horas (2.5h teoría + 3h práctica + 0.5h evaluación)
**Nivel**: Principiante
**Prerequisitos**: Ninguno

---

## 📋 Descripción

Este módulo introduce los conceptos fundamentales de ciberseguridad que forman la base para todos los temas avanzados del curso. Aprenderás los principios clave, tipos de amenazas, modelos de seguridad y cómo aplicarlos en escenarios reales.

---

## 🎯 Objetivos de Aprendizaje

Al finalizar este módulo, serás capaz de:

- [x] Explicar los principios fundamentales de la tríada CIA
- [x] Identificar vectores de ataque comunes y sus mitigaciones
- [x] Evaluar riesgos y vulnerabilidades en sistemas
- [x] Aplicar el modelo Zero Trust
- [x] Configurar entornos seguros básicos
- [x] Realizar análisis de vulnerabilidades con herramientas profesionales
- [x] Documentar y responder a incidentes de seguridad

---

## 📚 Contenido

### Teoría (2.5 horas)

1. **[Introducción a la Ciberseguridad](./teoria/01_introduccion.md)** (30 min)
   - ¿Qué es la ciberseguridad?
   - Evolución histórica
   - Panorama actual de amenazas
   - El rol en la era digital

2. **[Principios Fundamentales](./teoria/02_principios_fundamentales.md)** (45 min)
   - Tríada CIA (Confidencialidad, Integridad, Disponibilidad)
   - Autenticación, Autorización, No repudio
   - Defensa en profundidad
   - Principio de mínimo privilegio
   - Zero Trust Architecture

3. **[Amenazas, Vulnerabilidades y Riesgos](./teoria/03_amenazas_vulnerabilidades_riesgos.md)** (45 min)
   - Definiciones y diferencias
   - Tipos de amenazas (Malware, Phishing, MitM, DDoS, etc.)
   - Vulnerabilidades comunes (CVE, OWASP Top 10, CWE)
   - Gestión de riesgos
   - Matrices de riesgo

4. **[Modelos y Marcos de Seguridad](./teoria/04_modelos_marcos.md)** (30 min)
   - NIST Cybersecurity Framework
   - ISO/IEC 27001/27002
   - MITRE ATT&CK Framework
   - Kill Chain de Lockheed Martin
   - Modelo Bell-LaPadula y Biba

### Laboratorios Prácticos (3 horas)

1. **[Lab 01.1: Configuración de Entorno Seguro](./laboratorios/lab_01_entorno_seguro/)** (1 hora)
   - Instalación y configuración de Kali Linux
   - Configuración de firewall (iptables/ufw)
   - Hardening básico del sistema
   - Verificación de seguridad

2. **[Lab 01.2: Análisis de Vulnerabilidades con Nmap](./laboratorios/lab_02_nmap_vulnerabilidades/)** (1 hora)
   - Escaneo de puertos y servicios
   - Identificación de versiones
   - Detección de vulnerabilidades
   - Generación de reportes

3. **[Lab 01.3: Simulación de Ataque y Defensa](./laboratorios/lab_03_ataque_defensa/)** (1 hora)
   - Simulación de phishing con GoPhish
   - Detección con herramientas SIEM
   - Implementación de contramedidas
   - Documentación de incidente

### Evaluación (30 min)

- **[Cuestionario](./evaluacion/cuestionario.md)**: 20 preguntas de conceptos
- **[Caso Práctico](./evaluacion/caso_practico.md)**: Análisis de escenario real

---

## 📖 Material de Estudio

### Lecturas Obligatorias
- [01_introduccion.md](./teoria/01_introduccion.md)
- [02_principios_fundamentales.md](./teoria/02_principios_fundamentales.md)
- [03_amenazas_vulnerabilidades_riesgos.md](./teoria/03_amenazas_vulnerabilidades_riesgos.md)
- [04_modelos_marcos.md](./teoria/04_modelos_marcos.md)

### Recursos Adicionales
- [Cheatsheet de Comandos](./recursos/cheatsheet.md)
- [Enlaces Útiles](./recursos/enlaces_utiles.md)
- [Herramientas Recomendadas](./recursos/herramientas.md)
- [Bibliografía](./recursos/bibliografia.md)
- [Glosario de Términos](./recursos/glosario.md)

---

## 🛠️ Herramientas Utilizadas

| Herramienta | Propósito | Instalación |
|-------------|-----------|-------------|
| **Kali Linux** | Sistema operativo para pentesting | [Guía](../00_SETUP_ENTORNO.md#kali-linux) |
| **Nmap** | Escaneo de redes y puertos | `apt install nmap` |
| **Wireshark** | Análisis de tráfico de red | `apt install wireshark` |
| **Metasploit** | Framework de pentesting | Pre-instalado en Kali |
| **GoPhish** | Simulación de phishing | [Docker](./laboratorios/lab_03_ataque_defensa/) |
| **Splunk** | SIEM y análisis de logs | [Free Trial](https://www.splunk.com/) |
| **VirtualBox** | Virtualización | [Download](https://www.virtualbox.org/) |

---

## 📝 Ruta de Aprendizaje Sugerida

### Día 1 (2 horas)
1. Leer: Introducción a la Ciberseguridad (30 min)
2. Leer: Principios Fundamentales (45 min)
3. Iniciar Lab 01.1: Configuración de Entorno (45 min)

### Día 2 (2 horas)
1. Completar Lab 01.1 (15 min)
2. Leer: Amenazas y Vulnerabilidades (45 min)
3. Realizar Lab 01.2: Nmap (1 hora)

### Día 3 (2 horas)
1. Leer: Modelos y Marcos (30 min)
2. Realizar Lab 01.3: Ataque y Defensa (1 hora)
3. Repasar conceptos (30 min)

### Día 4 (30 min)
1. Completar evaluación (30 min)

**Total**: 6.5 horas (incluye tiempo de configuración)

---

## ✅ Criterios de Completitud

Para considerar este módulo completado, debes:

- [ ] Leer todo el material teórico
- [ ] Completar los 3 laboratorios prácticos con éxito
- [ ] Entregar los reportes de cada laboratorio
- [ ] Aprobar el cuestionario con mínimo 80% (16/20 respuestas correctas)
- [ ] Completar el análisis de caso práctico

---

## 🔗 Navegación

- [⬅️ Volver al Índice Principal](../README.md)
- [➡️ Siguiente: Módulo 02 - Redes y Protocolos](../02_Redes_y_Protocolos/)

---

## 💡 Consejos para el Éxito

1. **No te saltes la teoría**: Los conceptos fundamentales son la base de todo lo que sigue.

2. **Practica activamente**: No solo leas los laboratorios, ¡hazlos! La experiencia práctica es invaluable.

3. **Toma notas**: Documenta tus hallazgos, errores y soluciones. Te servirá después.

4. **Pregunta**: Si algo no está claro, consulta los recursos adicionales o contacta al instructor.

5. **Conecta conceptos**: Relaciona lo que aprendes aquí con noticias de ciberseguridad actuales.

6. **Experimenta**: Una vez completados los labs, intenta variaciones y escenarios diferentes.

---

## 📊 Autoevaluación

Antes de continuar al Módulo 02, verifica que puedes responder con confianza:

- [ ] ¿Qué significa la tríada CIA y por qué es importante?
- [ ] ¿Cuál es la diferencia entre una amenaza y una vulnerabilidad?
- [ ] ¿Qué es el principio de defensa en profundidad?
- [ ] ¿Cómo funciona el modelo Zero Trust?
- [ ] ¿Qué herramientas usarías para identificar vulnerabilidades en una red?
- [ ] ¿Cómo documentarías un incidente de seguridad?

Si puedes responder todo con confianza, ¡estás listo para el Módulo 02!

---

**Tiempo estimado total**: 6-7 horas (incluyendo configuración inicial)

**¡Bienvenido al mundo de la ciberseguridad!** 🛡️
