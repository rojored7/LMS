import { PrismaClient, CourseLevel, LessonType, QuestionType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Función helper para leer archivos markdown
function readMarkdown(filePath: string): string {
  try {
    const fullPath = path.join(__dirname, '../../../', filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return '';
  } catch (error) {
    console.warn(`⚠️  No se pudo leer: ${filePath}`);
    return '';
  }
}

async function main() {
  console.log('🌱 Importando Curso de Ciberseguridad...\n');

  // Crear el curso principal
  const course = await prisma.course.upsert({
    where: { slug: 'ciberseguridad-postcuantica' },
    update: {
      title: 'Ciberseguridad: De Principiante a Experto en Criptografía Postcuántica',
      description: `Curso completo de ciberseguridad que cubre desde los fundamentos hasta la criptografía postcuántica.

Este curso intensivo de 40 horas te llevará desde los conceptos básicos de ciberseguridad hasta dominar la criptografía postcuántica y su implementación práctica con ANKASecure.

**¿Qué aprenderás?**
- Fundamentos de ciberseguridad y la tríada CIA
- Redes y protocolos de seguridad (TLS/SSL)
- Criptografía clásica (AES, RSA, ECC)
- Criptografía postcuántica (ML-KEM, ML-DSA)
- Gestión de claves y PKI
- APIs de seguridad (JWS/JWE/JOSE)
- Normativas y cumplimiento (NIST, PCI DSS, GDPR)
- Implementación práctica con ANKASecure

**Modalidad:** 60% práctica, 40% teoría
**Proyecto Final:** Sistema seguro end-to-end con criptografía postcuántica`,
      duration: 2400, // 40 horas en minutos
      level: 'BEGINNER' as CourseLevel,
      tags: ['ciberseguridad', 'criptografía', 'postcuántico', 'python', 'javascript', 'PKI', 'NIST'],
      isPublished: true,
      author: 'Plataforma Ciberseguridad',
      version: '1.0',
      thumbnail: '/images/courses/ciberseguridad.jpg'
    },
    create: {
      slug: 'ciberseguridad-postcuantica',
      title: 'Ciberseguridad: De Principiante a Experto en Criptografía Postcuántica',
      description: `Curso completo de ciberseguridad que cubre desde los fundamentos hasta la criptografía postcuántica.

Este curso intensivo de 40 horas te llevará desde los conceptos básicos de ciberseguridad hasta dominar la criptografía postcuántica y su implementación práctica con ANKASecure.

**¿Qué aprenderás?**
- Fundamentos de ciberseguridad y la tríada CIA
- Redes y protocolos de seguridad (TLS/SSL)
- Criptografía clásica (AES, RSA, ECC)
- Criptografía postcuántica (ML-KEM, ML-DSA)
- Gestión de claves y PKI
- APIs de seguridad (JWS/JWE/JOSE)
- Normativas y cumplimiento (NIST, PCI DSS, GDPR)
- Implementación práctica con ANKASecure

**Modalidad:** 60% práctica, 40% teoría
**Proyecto Final:** Sistema seguro end-to-end con criptografía postcuántica`,
      duration: 2400, // 40 horas en minutos
      level: 'BEGINNER' as CourseLevel,
      tags: ['ciberseguridad', 'criptografía', 'postcuántico', 'python', 'javascript', 'PKI', 'NIST'],
      isPublished: true,
      author: 'Plataforma Ciberseguridad',
      version: '1.0',
      thumbnail: '/images/courses/ciberseguridad.jpg'
    }
  });

  console.log('✅ Curso creado:', course.title);

  // MÓDULO 01: Fundamentos de Ciberseguridad
  const modulo01 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 1
      }
    },
    update: {
      title: 'Fundamentos de Ciberseguridad',
      description: `Introducción a los principios fundamentales de la ciberseguridad. Aprenderás sobre la tríada CIA,
      amenazas comunes, gestión de riesgos y los principales marcos de seguridad.`,
      duration: 360, // 6 horas
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 1,
      title: 'Fundamentos de Ciberseguridad',
      description: `Introducción a los principios fundamentales de la ciberseguridad. Aprenderás sobre la tríada CIA,
      amenazas comunes, gestión de riesgos y los principales marcos de seguridad.`,
      duration: 360,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 1 creado:', modulo01.title);

  // Lecciones del Módulo 01
  const lecciones01 = [
    {
      order: 1,
      title: 'Introducción a la Ciberseguridad',
      content: readMarkdown('01_Fundamentos_Ciberseguridad/teoria/01_introduccion.md') || `
# Introducción a la Ciberseguridad

## ¿Qué es la ciberseguridad?

La ciberseguridad es la práctica de proteger sistemas, redes y programas de ataques digitales. Estos ataques generalmente tienen como objetivo acceder, cambiar o destruir información sensible, extorsionar dinero a los usuarios o interrumpir procesos comerciales normales.

## Evolución histórica de las amenazas

- **1970s**: Primeros virus informáticos
- **1980s**: Malware y ataques de red
- **1990s**: Internet y nuevos vectores de ataque
- **2000s**: Cibercrimen organizado
- **2010s**: APTs y ransomware
- **2020s**: Amenaza cuántica y criptografía postcuántica

## Panorama actual: ciberataques más comunes 2024-2026

1. **Ransomware**: Cifrado de datos con exigencia de rescate
2. **Phishing**: Engaño para robar credenciales
3. **DDoS**: Saturación de servicios
4. **Vulnerabilidades Zero-Day**: Exploits desconocidos
5. **Supply Chain Attacks**: Ataques a la cadena de suministro

## El rol de la ciberseguridad en la era digital

La ciberseguridad es fundamental para:
- Proteger la privacidad de los usuarios
- Garantizar la continuidad del negocio
- Cumplir con regulaciones (GDPR, PCI DSS)
- Mantener la confianza del cliente
- Prevenir pérdidas financieras
`,
      type: 'TEXT' as LessonType,
      estimatedTime: 30
    },
    {
      order: 2,
      title: 'Principios Fundamentales',
      content: readMarkdown('01_Fundamentos_Ciberseguridad/teoria/02_principios_fundamentales.md') || `
# Principios Fundamentales de Ciberseguridad

## Tríada CIA

### Confidencialidad (Confidentiality)
Control de acceso a la información. Solo usuarios autorizados pueden acceder a datos sensibles.

**Técnicas:**
- Cifrado
- Control de acceso
- Autenticación

### Integridad (Integrity)
Protección contra modificaciones no autorizadas. Los datos deben permanecer exactos y completos.

**Técnicas:**
- Hashes criptográficos
- Firmas digitales
- Control de versiones

### Disponibilidad (Availability)
Garantía de acceso cuando se necesite. Los sistemas deben estar disponibles para usuarios autorizados.

**Técnicas:**
- Redundancia
- Backups
- Protección DDoS

## Principios Adicionales

### Autenticación
Verificación de la identidad del usuario.

### Autorización
Determinación de permisos del usuario.

### No Repudio
Prueba de que una acción fue realizada por un usuario específico.

## Defensa en Profundidad (Defense in Depth)

Múltiples capas de seguridad para proteger contra diferentes tipos de ataques.

## Principio de Mínimo Privilegio

Los usuarios solo deben tener los permisos mínimos necesarios para realizar su trabajo.

## Zero Trust Architecture

"Nunca confíes, siempre verifica" - Cada solicitud debe ser autenticada y autorizada.
`,
      type: 'TEXT' as LessonType,
      estimatedTime: 45
    },
    {
      order: 3,
      title: 'Amenazas, Vulnerabilidades y Riesgos',
      content: readMarkdown('01_Fundamentos_Ciberseguridad/teoria/03_amenazas_vulnerabilidades_riesgos.md') || `
# Amenazas, Vulnerabilidades y Riesgos

## Definiciones

**Amenaza**: Potencial causa de un incidente no deseado.

**Vulnerabilidad**: Debilidad que puede ser explotada por una amenaza.

**Riesgo**: Probabilidad de que una amenaza explote una vulnerabilidad.

## Tipos de Amenazas

### Malware
- **Virus**: Se replica insertándose en otros programas
- **Ransomware**: Cifra datos y exige rescate
- **Troyanos**: Se disfrazan de software legítimo
- **Spyware**: Espía actividad del usuario

### Ataques de Red
- **Man-in-the-Middle (MitM)**: Intercepta comunicaciones
- **DDoS**: Satura recursos del sistema
- **SQL Injection**: Inyecta código SQL malicioso
- **XSS**: Cross-Site Scripting

### Ingeniería Social
- **Phishing**: Correos fraudulentos
- **Spear Phishing**: Ataques dirigidos
- **Pretexting**: Creación de escenarios falsos

## Vulnerabilidades Comunes

### CVE (Common Vulnerabilities and Exposures)
Base de datos pública de vulnerabilidades conocidas.

### OWASP Top 10
Lista de las 10 vulnerabilidades web más críticas:
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging Failures
10. Server-Side Request Forgery (SSRF)

## Gestión de Riesgos

### Proceso
1. **Identificación**: Detectar amenazas y vulnerabilidades
2. **Análisis**: Evaluar probabilidad e impacto
3. **Evaluación**: Priorizar riesgos
4. **Tratamiento**: Decidir estrategia

### Estrategias de Tratamiento
- **Mitigar**: Reducir probabilidad o impacto
- **Transferir**: Asegurar o tercerizar
- **Aceptar**: Asumir el riesgo
- **Evitar**: Eliminar la actividad riesgosa
`,
      type: 'TEXT' as LessonType,
      estimatedTime: 45
    },
    {
      order: 4,
      title: 'Modelos y Marcos de Seguridad',
      content: readMarkdown('01_Fundamentos_Ciberseguridad/teoria/04_modelos_marcos.md') || `
# Modelos y Marcos de Seguridad

## NIST Cybersecurity Framework

Framework de 5 funciones:
1. **Identify** (Identificar)
2. **Protect** (Proteger)
3. **Detect** (Detectar)
4. **Respond** (Responder)
5. **Recover** (Recuperar)

## ISO/IEC 27001/27002

Estándar internacional para sistemas de gestión de seguridad de la información (SGSI).

**ISO 27001**: Requisitos del SGSI
**ISO 27002**: Controles de seguridad

## MITRE ATT&CK Framework

Base de conocimiento de tácticas y técnicas de adversarios basada en observaciones del mundo real.

**Matrices:**
- Enterprise
- Mobile
- ICS (Industrial Control Systems)

## Kill Chain de Lockheed Martin

Modelo de 7 fases de un ciberataque:
1. Reconnaissance (Reconocimiento)
2. Weaponization (Armamentización)
3. Delivery (Entrega)
4. Exploitation (Explotación)
5. Installation (Instalación)
6. Command & Control (C2)
7. Actions on Objectives (Acciones sobre objetivos)

## Modelos de Control de Acceso

### Bell-LaPadula
Enfocado en **confidencialidad**.

Reglas:
- No read up
- No write down

### Biba
Enfocado en **integridad**.

Reglas:
- No read down
- No write up
`,
      type: 'TEXT' as LessonType,
      estimatedTime: 30
    }
  ];

  for (const leccion of lecciones01) {
    await prisma.lesson.upsert({
      where: {
        moduleId_order: {
          moduleId: modulo01.id,
          order: leccion.order
        }
      },
      update: leccion,
      create: {
        ...leccion,
        moduleId: modulo01.id
      }
    });
  }

  console.log(`    ✓ ${lecciones01.length} lecciones creadas`);

  // Quiz del Módulo 01
  const quiz01 = await prisma.quiz.upsert({
    where: {
      id: `quiz-${modulo01.id}-1` // Temporal ID
    },
    update: {
      title: 'Evaluación: Fundamentos de Ciberseguridad',
      description: 'Cuestionario de 20 preguntas para evaluar los conceptos fundamentales aprendidos.',
      passingScore: 70,
      timeLimit: 30,
      attempts: 3
    },
    create: {
      moduleId: modulo01.id,
      title: 'Evaluación: Fundamentos de Ciberseguridad',
      description: 'Cuestionario de 20 preguntas para evaluar los conceptos fundamentales aprendidos.',
      passingScore: 70,
      timeLimit: 30,
      attempts: 3
    }
  });

  // Preguntas del Quiz 01
  const preguntas01 = [
    {
      order: 1,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      question: '¿Qué significa la "C" en la tríada CIA?',
      options: ['Confidencialidad', 'Conectividad', 'Complejidad', 'Criptografía'],
      correctAnswer: 'Confidencialidad',
      explanation: 'La tríada CIA representa Confidencialidad, Integridad y Disponibilidad.'
    },
    {
      order: 2,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      question: '¿Cuál de los siguientes NO es un tipo de malware?',
      options: ['Ransomware', 'Firewall', 'Troyano', 'Spyware'],
      correctAnswer: 'Firewall',
      explanation: 'Firewall es una medida de seguridad, no un tipo de malware.'
    },
    {
      order: 3,
      type: 'TRUE_FALSE' as QuestionType,
      question: 'El principio de mínimo privilegio establece que los usuarios deben tener todos los permisos posibles.',
      options: ['Verdadero', 'Falso'],
      correctAnswer: 'Falso',
      explanation: 'El principio de mínimo privilegio establece que los usuarios solo deben tener los permisos mínimos necesarios.'
    },
    {
      order: 4,
      type: 'MULTIPLE_SELECT' as QuestionType,
      question: '¿Cuáles son funciones del NIST Cybersecurity Framework? (Selecciona todas las correctas)',
      options: ['Identify', 'Protect', 'Delete', 'Detect', 'Respond', 'Recover'],
      correctAnswer: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
      explanation: 'Las 5 funciones del NIST CSF son: Identify, Protect, Detect, Respond y Recover.'
    },
    {
      order: 5,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      question: '¿Qué ataque consiste en interceptar comunicaciones entre dos partes?',
      options: ['DDoS', 'Man-in-the-Middle', 'SQL Injection', 'Phishing'],
      correctAnswer: 'Man-in-the-Middle',
      explanation: 'Man-in-the-Middle (MitM) es un ataque donde el atacante intercepta la comunicación entre dos partes.'
    }
  ];

  for (const pregunta of preguntas01) {
    await prisma.question.upsert({
      where: {
        quizId_order: {
          quizId: quiz01.id,
          order: pregunta.order
        }
      },
      update: pregunta,
      create: {
        ...pregunta,
        quizId: quiz01.id
      }
    });
  }

  console.log(`    ✓ Quiz creado con ${preguntas01.length} preguntas`);

  // MÓDULO 02: Redes y Protocolos de Seguridad
  const modulo02 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 2
      }
    },
    update: {
      title: 'Redes y Protocolos de Seguridad',
      description: 'Aprende sobre protocolos seguros como TLS/SSL, análisis de tráfico con Wireshark y ataques de red comunes.',
      duration: 240,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 2,
      title: 'Redes y Protocolos de Seguridad',
      description: 'Aprende sobre protocolos seguros como TLS/SSL, análisis de tráfico con Wireshark y ataques de red comunes.',
      duration: 240,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 2 creado:', modulo02.title);

  // MÓDULO 03: Criptografía Clásica
  const modulo03 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 3
      }
    },
    update: {
      title: 'Criptografía Clásica',
      description: 'Domina AES, RSA, ECC y los fundamentos de la criptografía moderna.',
      duration: 360,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 3,
      title: 'Criptografía Clásica',
      description: 'Domina AES, RSA, ECC y los fundamentos de la criptografía moderna.',
      duration: 360,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 3 creado:', modulo03.title);

  // MÓDULO 04: Criptografía Postcuántica
  const modulo04 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 4
      }
    },
    update: {
      title: 'Criptografía Postcuántica (PQC)',
      description: 'Comprende la amenaza cuántica e implementa algoritmos postcuánticos como ML-KEM y ML-DSA.',
      duration: 360,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 4,
      title: 'Criptografía Postcuántica (PQC)',
      description: 'Comprende la amenaza cuántica e implementa algoritmos postcuánticos como ML-KEM y ML-DSA.',
      duration: 360,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 4 creado:', modulo04.title);

  // MÓDULO 05: Gestión de Claves y PKI
  const modulo05 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 5
      }
    },
    update: {
      title: 'Gestión de Claves y PKI',
      description: 'Diseña sistemas de gestión de claves robustos y administra PKI completa.',
      duration: 240,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 5,
      title: 'Gestión de Claves y PKI',
      description: 'Diseña sistemas de gestión de claves robustos y administra PKI completa.',
      duration: 240,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 5 creado:', modulo05.title);

  // MÓDULO 06: APIs de Seguridad
  const modulo06 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 6
      }
    },
    update: {
      title: 'APIs de Seguridad (JWS/JWE/JOSE)',
      description: 'Implementa JWS, JWE, JWT y streaming seguro con detached signatures.',
      duration: 240,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 6,
      title: 'APIs de Seguridad (JWS/JWE/JOSE)',
      description: 'Implementa JWS, JWE, JWT y streaming seguro con detached signatures.',
      duration: 240,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 6 creado:', modulo06.title);

  // MÓDULO 07: Normativas y Cumplimiento
  const modulo07 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 7
      }
    },
    update: {
      title: 'Normativas y Cumplimiento',
      description: 'Comprende NIST, FIPS, PCI DSS, HIPAA, GDPR y sus requisitos de seguridad.',
      duration: 180,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 7,
      title: 'Normativas y Cumplimiento',
      description: 'Comprende NIST, FIPS, PCI DSS, HIPAA, GDPR y sus requisitos de seguridad.',
      duration: 180,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 7 creado:', modulo07.title);

  // MÓDULO 08: ANKASecure en Producción
  const modulo08 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 8
      }
    },
    update: {
      title: 'ANKASecure en Producción',
      description: 'Despliega ANKASecure, migra sistemas clásicos a postcuánticos y optimiza rendimiento.',
      duration: 300,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 8,
      title: 'ANKASecure en Producción',
      description: 'Despliega ANKASecure, migra sistemas clásicos a postcuánticos y optimiza rendimiento.',
      duration: 300,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 8 creado:', modulo08.title);

  // MÓDULO 09: Proyecto Final
  const modulo09 = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 9
      }
    },
    update: {
      title: 'Proyecto Final Integrador',
      description: 'Diseña e implementa un sistema seguro completo end-to-end que integre todos los conceptos aprendidos.',
      duration: 120,
      isPublished: true
    },
    create: {
      courseId: course.id,
      order: 9,
      title: 'Proyecto Final Integrador',
      description: 'Diseña e implementa un sistema seguro completo end-to-end que integre todos los conceptos aprendidos.',
      duration: 120,
      isPublished: true
    }
  });

  console.log('  📘 Módulo 9 creado:', modulo09.title);

  // Crear Proyecto Final
  await prisma.project.upsert({
    where: {
      id: `proyecto-${course.id}-final`
    },
    update: {
      title: 'Proyecto Final: Sistema Seguro End-to-End',
      description: `Diseña e implementa un sistema seguro completo que integre todos los conceptos aprendidos.

**Opciones:**

**Opción A: Sistema de Mensajería Segura**
- Cifrado end-to-end con ML-KEM
- Firmas digitales con ML-DSA
- Gestión de claves con ANKASecure
- Autenticación con JWT

**Opción B: Servicio de Almacenamiento Seguro**
- Cifrado de archivos en reposo (AES-256-GCM)
- Cifrado de claves con ML-KEM
- API REST completa

**Opción C: Sistema de Autenticación PQC**
- Autenticación multifactor
- Certificados digitales postcuánticos
- SSO (Single Sign-On)

**Opción D: Propuesta Propia**
(Sujeto a aprobación)`,
      requirements: {
        codigo: 'Repositorio GitHub con código documentado',
        documentacion: 'Documentación técnica (10-15 páginas)',
        video: 'Video demostración (5-10 min)',
        presentacion: 'Presentación (10 slides)'
      },
      rubric: {
        funcionalidad: { peso: 30, descripcion: 'El sistema funciona correctamente' },
        seguridad: { peso: 30, descripcion: 'Implementación robusta de controles' },
        arquitectura: { peso: 15, descripcion: 'Diseño escalable y mantenible' },
        codigo: { peso: 10, descripcion: 'Calidad, legibilidad, tests' },
        documentacion: { peso: 10, descripcion: 'Completa, clara, profesional' },
        presentacion: { peso: 5, descripcion: 'Comunicación efectiva' }
      }
    },
    create: {
      courseId: course.id,
      title: 'Proyecto Final: Sistema Seguro End-to-End',
      description: `Diseña e implementa un sistema seguro completo que integre todos los conceptos aprendidos.

**Opciones:**

**Opción A: Sistema de Mensajería Segura**
- Cifrado end-to-end con ML-KEM
- Firmas digitales con ML-DSA
- Gestión de claves con ANKASecure
- Autenticación con JWT

**Opción B: Servicio de Almacenamiento Seguro**
- Cifrado de archivos en reposo (AES-256-GCM)
- Cifrado de claves con ML-KEM
- API REST completa

**Opción C: Sistema de Autenticación PQC**
- Autenticación multifactor
- Certificados digitales postcuánticos
- SSO (Single Sign-On)

**Opción D: Propuesta Propia**
(Sujeto a aprobación)`,
      requirements: {
        codigo: 'Repositorio GitHub con código documentado',
        documentacion: 'Documentación técnica (10-15 páginas)',
        video: 'Video demostración (5-10 min)',
        presentacion: 'Presentación (10 slides)'
      },
      rubric: {
        funcionalidad: { peso: 30, descripcion: 'El sistema funciona correctamente' },
        seguridad: { peso: 30, descripcion: 'Implementación robusta de controles' },
        arquitectura: { peso: 15, descripcion: 'Diseño escalable y mantenible' },
        codigo: { peso: 10, descripcion: 'Calidad, legibilidad, tests' },
        documentacion: { peso: 10, descripcion: 'Completa, clara, profesional' },
        presentacion: { peso: 5, descripcion: 'Comunicación efectiva' }
      }
    }
  });

  console.log('  📝 Proyecto Final creado');

  console.log('\n🎉 Curso de Ciberseguridad importado exitosamente!\n');
  console.log(`📚 Curso: ${course.title}`);
  console.log(`📘 Módulos: 9`);
  console.log(`⏱️  Duración total: 40 horas`);
  console.log(`🔗 Slug: ${course.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Error importando curso:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
