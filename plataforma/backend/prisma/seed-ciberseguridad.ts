import { PrismaClient, CourseLevel, LessonType, QuestionType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Función helper para leer archivos markdown
function readMarkdown(filePath: string): string {
  try {
    // Si es ruta absoluta, usar directamente; si no, buscar relativa a raíz del proyecto
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, '../../../', filePath);

    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return '';
  } catch (error) {
    console.warn(`⚠️  No se pudo leer: ${filePath}`);
    return '';
  }
}

// Función helper para formatear opciones de quiz
function formatQuizOptions(options: string[], correctAnswers: string | string[]) {
  const correctArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  return options.map((text, index) => ({
    id: `opt${index + 1}`,
    text,
    isCorrect: correctArray.includes(text)
  }));
}

// Función helper para importar lecciones desde archivos MD
async function importLessonsFromFiles(moduleId: string, moduleFolder: string, order: number) {
  // Intentar múltiples rutas posibles
  const possiblePaths = [
    path.join('/content', moduleFolder, 'teoria'), // Desde /content mount en Docker
    path.join(__dirname, '../../../', moduleFolder, 'teoria'), // Desde backend/prisma
    path.join(process.cwd(), '../../../', moduleFolder, 'teoria'), // Desde CWD
  ];

  let teoriaPath = '';
  for (const tryPath of possiblePaths) {
    if (fs.existsSync(tryPath)) {
      teoriaPath = tryPath;
      break;
    }
  }

  if (!teoriaPath) {
    console.log(`    ⚠️  No se encontró carpeta 'teoria' para ${moduleFolder}`);
    console.log(`    Rutas intentadas:`);
    possiblePaths.forEach(p => console.log(`      - ${p}`));
    return order;
  }

  const files = fs.readdirSync(teoriaPath).filter(f => f.endsWith('.md')).sort();
  let lessonOrder = order;

  console.log(`    📂 Importando ${files.length} lecciones desde ${moduleFolder}/teoria`);

  for (const file of files) {
    const content = readMarkdown(path.join(teoriaPath, file));
    const titleMatch = file.match(/\d+_(.+)\.md/);
    const title = titleMatch && titleMatch[1]
      ? titleMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : file.replace('.md', '');

    if (!content || content.length === 0) {
      console.log(`      ⚠️  Lección ${file} está vacía, omitiendo...`);
      continue;
    }

    await prisma.lesson.upsert({
      where: {
        moduleId_order: {
          moduleId,
          order: lessonOrder
        }
      },
      update: {
        title,
        content,
        type: 'TEXT' as LessonType,
        estimatedTime: 45 // Estimated time in minutes
      },
      create: {
        moduleId,
        order: lessonOrder,
        title,
        content,
        type: 'TEXT' as LessonType,
        estimatedTime: 45
      }
    });

    console.log(`      ✓ Lección ${lessonOrder}: ${title}`);
    lessonOrder++;
  }

  return lessonOrder;
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
      thumbnail: '/images/courses/ciberseguridad.jpg',
      price: 0 // Curso gratuito
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
      thumbnail: '/images/courses/ciberseguridad.jpg',
      price: 0 // Curso gratuito
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
  await importLessonsFromFiles(modulo01.id, '01_Fundamentos_Ciberseguridad', 1);

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
  const preguntasData01 = [
    {
      order: 1,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      question: '¿Qué significa la "C" en la tríada CIA?',
      optionsText: ['Confidencialidad', 'Conectividad', 'Complejidad', 'Criptografía'],
      correctAnswer: 'Confidencialidad',
      explanation: 'La tríada CIA representa Confidencialidad, Integridad y Disponibilidad.'
    },
    {
      order: 2,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      question: '¿Cuál de los siguientes NO es un tipo de malware?',
      optionsText: ['Ransomware', 'Firewall', 'Troyano', 'Spyware'],
      correctAnswer: 'Firewall',
      explanation: 'Firewall es una medida de seguridad, no un tipo de malware.'
    },
    {
      order: 3,
      type: 'TRUE_FALSE' as QuestionType,
      question: 'El principio de mínimo privilegio establece que los usuarios deben tener todos los permisos posibles.',
      optionsText: ['Verdadero', 'Falso'],
      correctAnswer: 'Falso',
      explanation: 'El principio de mínimo privilegio establece que los usuarios solo deben tener los permisos mínimos necesarios.'
    },
    {
      order: 4,
      type: 'MULTIPLE_SELECT' as QuestionType,
      question: '¿Cuáles son funciones del NIST Cybersecurity Framework? (Selecciona todas las correctas)',
      optionsText: ['Identify', 'Protect', 'Delete', 'Detect', 'Respond', 'Recover'],
      correctAnswer: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
      explanation: 'Las 5 funciones del NIST CSF son: Identify, Protect, Detect, Respond y Recover.'
    },
    {
      order: 5,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      question: '¿Qué ataque consiste en interceptar comunicaciones entre dos partes?',
      optionsText: ['DDoS', 'Man-in-the-Middle', 'SQL Injection', 'Phishing'],
      correctAnswer: 'Man-in-the-Middle',
      explanation: 'Man-in-the-Middle (MitM) es un ataque donde el atacante intercepta la comunicación entre dos partes.'
    }
  ];

  // Transformar opciones al formato correcto
  const preguntas01 = preguntasData01.map(p => ({
    ...p,
    options: formatQuizOptions(p.optionsText, p.correctAnswer),
    optionsText: undefined // Remove temporary field
  })).map(({ optionsText, ...rest }) => rest);

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

  // Importar lecciones del módulo 2
  await importLessonsFromFiles(modulo02.id, '02_Redes_y_Protocolos', 1);

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

  // Importar lecciones del módulo 3
  await importLessonsFromFiles(modulo03.id, '03_Criptografia_Clasica', 1);

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

  // Importar lecciones del módulo 4
  await importLessonsFromFiles(modulo04.id, '04_Criptografia_Postcuantica', 1);

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

  // Importar lecciones del módulo 5
  await importLessonsFromFiles(modulo05.id, '05_Gestion_Claves_PKI', 1);

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

  // Importar lecciones del módulo 6
  await importLessonsFromFiles(modulo06.id, '06_APIs_Seguridad', 1);

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

  // Importar lecciones del módulo 7
  await importLessonsFromFiles(modulo07.id, '07_Normativas_Cumplimiento', 1);

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

  // Importar lecciones del módulo 8
  await importLessonsFromFiles(modulo08.id, '08_ANKASecure_Practica', 1);

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

  // Importar lecciones del módulo 9 (si existen)
  await importLessonsFromFiles(modulo09.id, '09_Proyecto_Final', 1);

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
