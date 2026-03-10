import { http, HttpResponse } from 'msw';
import { createTestUser, createTestCourse } from '../utils/test-utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Mock handlers for MSW
export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'admin@example.com' && body.password === 'Admin123!') {
      return HttpResponse.json({
        user: createTestUser({ role: 'ADMIN', email: 'admin@example.com' }),
        accessToken: 'mock-admin-token',
        refreshToken: 'mock-admin-refresh-token',
      });
    }

    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        user: createTestUser(),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { message: 'Credenciales inválidas' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user: createTestUser(body),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Sesión cerrada exitosamente' });
  }),

  http.post(`${API_URL}/auth/refresh`, ({ request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth || !auth.includes('mock-refresh-token')) {
      return HttpResponse.json(
        { message: 'Token de refresco inválido' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      accessToken: 'mock-new-access-token',
      refreshToken: 'mock-new-refresh-token',
    });
  }),

  http.post(`${API_URL}/auth/forgot-password`, async ({ request }) => {
    const body = await request.json() as { email: string };

    if (body.email === 'nonexistent@example.com') {
      return HttpResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      message: 'Se ha enviado un email con las instrucciones',
    });
  }),

  http.post(`${API_URL}/auth/reset-password`, async ({ request }) => {
    const body = await request.json() as { token: string; password: string };

    if (body.token === 'invalid-token') {
      return HttpResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      message: 'Contraseña actualizada exitosamente',
    });
  }),

  // Course endpoints
  http.get(`${API_URL}/courses`, ({ request }) => {
    const url = new URL(request.url);
    const published = url.searchParams.get('published');

    const courses = [
      createTestCourse({ id: '1', title: 'Curso 1', slug: 'curso-1' }),
      createTestCourse({ id: '2', title: 'Curso 2', slug: 'curso-2' }),
      createTestCourse({ id: '3', title: 'Curso 3', slug: 'curso-3', published: false }),
    ];

    const filteredCourses = published === 'true'
      ? courses.filter(c => c.published)
      : courses;

    return HttpResponse.json(filteredCourses);
  }),

  http.get(`${API_URL}/courses/enrolled`, ({ request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json([
      createTestCourse({ id: '1', title: 'Curso Inscrito 1' }),
      createTestCourse({ id: '2', title: 'Curso Inscrito 2' }),
    ]);
  }),

  http.get(`${API_URL}/courses/:idOrSlug`, ({ params }) => {
    const { idOrSlug } = params;

    if (idOrSlug === 'non-existent') {
      return HttpResponse.json(
        { message: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return HttpResponse.json(
      createTestCourse({
        id: String(idOrSlug),
        slug: String(idOrSlug),
        modules: [
          {
            id: 'm1',
            title: 'Módulo 1',
            description: 'Primer módulo',
            order: 1,
            lessons: [
              { id: 'l1', title: 'Lección 1', content: 'Contenido', order: 1 },
            ],
          },
        ],
      })
    );
  }),

  http.post(`${API_URL}/courses/:courseId/enroll`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    const { courseId } = params;

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (courseId === 'full-course') {
      return HttpResponse.json(
        { message: 'El curso está lleno' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      id: 'enrollment-id',
      courseId: String(courseId),
      userId: 'user-id',
      enrolledAt: new Date().toISOString(),
      progress: 0,
    });
  }),

  // User endpoints
  http.get(`${API_URL}/users/profile`, ({ request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json(createTestUser());
  }),

  http.put(`${API_URL}/users/profile`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    const body = await request.json() as any;

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json(createTestUser(body));
  }),

  http.put(`${API_URL}/users/password`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    const body = await request.json() as { currentPassword: string; newPassword: string };

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (body.currentPassword !== 'CurrentPassword123!') {
      return HttpResponse.json(
        { message: 'Contraseña actual incorrecta' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      message: 'Contraseña actualizada exitosamente',
    });
  }),

  // Admin endpoints
  http.get(`${API_URL}/admin/users`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    const url = new URL(request.url);
    const role = url.searchParams.get('role');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const users = [
      createTestUser({ id: '1', email: 'user1@example.com' }),
      createTestUser({ id: '2', email: 'user2@example.com', role: 'INSTRUCTOR' }),
      createTestUser({ id: '3', email: 'user3@example.com', role: 'ADMIN' }),
    ];

    const filteredUsers = role
      ? users.filter(u => u.role === role)
      : users;

    return HttpResponse.json({
      users: filteredUsers,
      total: filteredUsers.length,
      page: 1,
      totalPages: 1,
    });
  }),

  http.get(`${API_URL}/admin/stats`, ({ request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      totalUsers: 150,
      totalCourses: 10,
      totalEnrollments: 450,
      activeUsers: 120,
      completionRate: 65.5,
      averageProgress: 42.3,
    });
  }),

  // Quiz endpoints
  http.get(`${API_URL}/quizzes/:quizId`, ({ params }) => {
    const { quizId } = params;

    if (quizId === 'non-existent') {
      return HttpResponse.json(
        { message: 'Quiz no encontrado' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id: String(quizId),
      title: 'Quiz de prueba',
      description: 'Descripción del quiz',
      questions: [
        {
          id: 'q1',
          text: '¿Cuál es la capital de España?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'o1', text: 'Madrid', isCorrect: true },
            { id: 'o2', text: 'Barcelona', isCorrect: false },
            { id: 'o3', text: 'Valencia', isCorrect: false },
            { id: 'o4', text: 'Sevilla', isCorrect: false },
          ],
          points: 10,
        },
      ],
      passingScore: 60,
      timeLimit: 30,
    });
  }),

  http.post(`${API_URL}/quizzes/:quizId/submit`, async ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    const body = await request.json() as any;

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const score = body.answers?.length > 0 ? 80 : 0;
    const passed = score >= 60;

    return HttpResponse.json({
      score,
      passed,
      correctAnswers: 8,
      totalQuestions: 10,
      feedback: passed ? '¡Excelente trabajo!' : 'Necesitas estudiar más',
    });
  }),

  // Lab endpoints
  http.post(`${API_URL}/labs/:labId/execute`, async ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    const body = await request.json() as { code: string; language: string };

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (body.code.includes('error')) {
      return HttpResponse.json({
        success: false,
        output: 'Error: Syntax error in line 1',
        error: 'SyntaxError',
      });
    }

    return HttpResponse.json({
      success: true,
      output: 'Hello, World!\nTest passed!',
      executionTime: 123,
    });
  }),

  // Progress endpoints
  http.get(`${API_URL}/progress/course/:courseId`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      courseId: String(params.courseId),
      overallProgress: 65,
      modules: [
        { moduleId: 'm1', progress: 100, completed: true },
        { moduleId: 'm2', progress: 50, completed: false },
        { moduleId: 'm3', progress: 0, completed: false },
      ],
    });
  }),

  http.post(`${API_URL}/progress/module/:moduleId/complete`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      moduleId: String(params.moduleId),
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }),

  // Notification endpoints
  http.get(`${API_URL}/notifications`, ({ request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json([
      {
        id: '1',
        title: 'Nuevo curso disponible',
        message: 'Se ha publicado un nuevo curso de ciberseguridad',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Quiz completado',
        message: 'Has completado el quiz con éxito',
        type: 'success',
        read: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  http.put(`${API_URL}/notifications/:id/read`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      id: String(params.id),
      read: true,
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  http.get(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Error del servidor' },
      { status: 500 }
    );
  }),

  http.post(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Error del servidor' },
      { status: 500 }
    );
  }),

  http.put(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Error del servidor' },
      { status: 500 }
    );
  }),

  http.delete(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Error del servidor' },
      { status: 500 }
    );
  }),
];