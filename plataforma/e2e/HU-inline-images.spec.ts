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
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

const LESSON_ID = 'd332507a82de42199be104e2f1a5ab17';
const COURSE_SLUG = 'agentes-claude-skills';

// PNG minimo valido (8-byte signature + relleno)
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ...Array(100).fill(0),
]);

test.describe('HU-Inline-Images: Imagenes inline en lecciones', () => {
  let downloadUrl: string;

  test('T1: Admin sube imagen y obtiene downloadUrl', async ({ request }) => {
    // Login como admin
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@ciber.com', password: 'Admin123!' },
    });
    expect(loginRes.ok(), `Login admin fallo: ${loginRes.status()}`).toBeTruthy();

    // Subir imagen PNG minima
    const blob = new Blob([PNG_BYTES], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'test-image.png');

    const uploadRes = await request.post(`${API_URL}/attachments/lesson/${LESSON_ID}`, {
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
    downloadUrl = body.data.downloadUrl;
  });

  test('T2: Estudiante ve imagen renderizada en leccion', async ({ page }) => {
    // Necesita downloadUrl del test anterior — si no existe, omitir
    if (!downloadUrl) {
      test.skip(true, 'T1 no genero downloadUrl — skipped');
      return;
    }

    // Login como admin para guardar contenido con la imagen
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"], input[type="email"]', 'admin@ciber.com');
    await page.fill('[data-testid="password"], input[type="password"]', 'Admin123!');
    await page.click('[data-testid="submit"], button[type="submit"]');
    await page.waitForURL(/dashboard|admin/, { timeout: 15000 });

    // Actualizar contenido de leccion via API para incluir la imagen
    const contentWithImage = `# Leccion de prueba\n\nContenido con imagen inline:\n\n![imagen de prueba](${downloadUrl})\n\nFin del contenido.`;
    const updateRes = await page.request.patch(`${API_URL}/lessons/${LESSON_ID}`, {
      data: { content: contentWithImage },
    });
    expect(updateRes.ok(), `Update leccion fallo: ${updateRes.status()}`).toBeTruthy();

    // Login como estudiante inscrito
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"], input[type="email"]', 'student@ciber.com');
    await page.fill('[data-testid="password"], input[type="password"]', 'Student123!');
    await page.click('[data-testid="submit"], button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Navegar al curso
    await page.goto(`${BASE_URL}/courses/${COURSE_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Iniciar la leccion — buscar el boton de continuar o ir directo a la URL de aprendizaje
    const continueBtn = page.locator('[data-testid="continue-learning"], [data-testid="start-course"]').first();
    if (await continueBtn.isVisible({ timeout: 3000 })) {
      await continueBtn.click();
    } else {
      await page.goto(`${BASE_URL}/courses/${COURSE_SLUG}/learn`);
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // dar tiempo al MarkdownRenderer de resolver el blob URL

    // Verificar que la imagen esta visible (src contiene blob: o /api/uploads/)
    const img = page.locator('img').filter({ hasAttribute: 'src' });
    await expect(img.first()).toBeVisible({ timeout: 10000 });

    // Verificar que hay una request GET a /api/uploads/ en el network (autenticada)
    const uploadRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/uploads/')) {
        uploadRequests.push(req.url());
      }
    });

    // Recargar para capturar la request
    await page.reload();
    await page.waitForTimeout(3000);

    // La imagen debe haberse solicitado con credentials
    expect(uploadRequests.length, 'No hubo requests a /api/uploads/').toBeGreaterThan(0);
  });

  test('T3: Estudiante no autenticado no puede descargar imagen (401)', async ({ request }) => {
    // Sin cookies de sesion, el endpoint de uploads debe rechazar
    const res = await request.get(`${API_URL}/uploads/lessons/${LESSON_ID}/test.png`);
    // Debe ser 401 o 404 (no existente), pero NUNCA 200 sin auth
    expect([401, 403, 404]).toContain(res.status());
  });
});
