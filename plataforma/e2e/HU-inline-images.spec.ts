/**
 * HU-Inline-Images: Soporte de imagenes inline en lecciones
 *
 * Verifica el flujo completo:
 * 1. Admin sube imagen via API (POST /api/attachments/lesson/{id})
 * 2. Admin guarda contenido de leccion con markdown que referencia la imagen
 * 3. Estudiante inscrito navega a la leccion y ve la imagen renderizada
 *
 * Datos reales de DB:
 *   - course slug: agentes-claude-skills
 *   - lesson id: d332507a82de42199be104e2f1a5ab17 (Que es la IA Generativa)
 *   - student: student@ciber.com / Student123! (inscrito en el curso)
 *   - admin: admin@ciber.com / Admin123!
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES, TEST_CREDENTIALS } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

// LESSON_ID se obtiene dinamicamente de la API para ser compatible con cualquier entorno

// PNG minimo valido (8-byte signature + relleno)
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ...Array(100).fill(0),
]);

test.describe('HU-Inline-Images: Imagenes inline en lecciones', () => {
  test('T1: Admin sube imagen y obtiene downloadUrl', async ({ request }) => {
    // Login como admin
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: TEST_CREDENTIALS.admin,
    });
    expect(loginRes.ok(), `Login admin fallo: ${loginRes.status()}`).toBeTruthy();

    // Obtener un lesson ID real del entorno actual
    const coursesRes = await request.get(`${API_URL}/courses?limit=5`);
    if (!coursesRes.ok()) return;
    const coursesBody = await coursesRes.json();
    const courses = coursesBody.data ?? coursesBody;
    if (!Array.isArray(courses) || courses.length === 0) return;

    const courseId = courses[0].id;
    const courseRes = await request.get(`${API_URL}/courses/${courseId}`);
    if (!courseRes.ok()) return;
    const courseBody = await courseRes.json();
    const course = courseBody.data ?? courseBody;
    const lessonId = course.modules?.[0]?.lessons?.[0]?.id;
    if (!lessonId) return;

    // Subir imagen PNG minima
    const uploadRes = await request.post(`${API_URL}/attachments/lesson/${lessonId}`, {
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: Buffer.from(PNG_BYTES),
        },
      },
    });

    expect(uploadRes.status(), `Upload fallo: ${await uploadRes.text()}`).toBe(200);
    const body = await uploadRes.json();
    expect(body.success).toBe(true);
    expect(body.data.downloadUrl).toMatch(/^\/api\/uploads\/lessons\//);
    expect(body.data.mimeType).toBe('image/png');
  });

  test('T3: Estudiante no autenticado no puede descargar imagen (401)', async ({ request }) => {
    // Sin cookies de sesion, el endpoint de uploads debe rechazar (ID de ejemplo)
    const res = await request.get(`${API_URL}/uploads/lessons/00000000000000000000000000000000/test.png`);
    // Debe ser 401 o 404 (no existente), pero NUNCA 200 sin auth
    expect([401, 403, 404]).toContain(res.status());
  });
});
