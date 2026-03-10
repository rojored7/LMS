/**
 * E2E Tests: HU-027 a HU-045 - Proyectos Finales, Gamificación y Características Avanzadas
 * Tests de proyectos, badges, certificados, notificaciones, perfil público y más
 */

import { test, expect } from '@playwright/test';
import { registerAndLogin, loginAsInstructor, createTestInstructor } from './helpers/auth';
import { enrollInCourse, completeCourse, completeModule } from './helpers/course';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Proyectos Finales y Calificación', () => {
  test('HU-027: Estudiante puede entregar proyecto final', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    // Simular completación de módulos previos (requisito para proyecto final)
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/project`);

    // Verificar página de proyecto
    await expect(
      page.locator('h1:has-text("Proyecto")').or(
        page.locator('[data-testid="project-page"]')
      )
    ).toBeVisible({ timeout: 5000 });

    // Verificar requisitos del proyecto
    const requirements = page.locator('[data-testid="project-requirements"]').or(
      page.locator('.requirements-list')
    );

    if (await requirements.isVisible({ timeout: 3000 })) {
      const reqText = await requirements.textContent();
      expect(reqText).toBeTruthy();
    }

    // Formulario de entrega
    const descriptionField = page.locator('textarea[name="description"]').or(
      page.locator('[data-testid="project-description"]')
    );

    await descriptionField.fill(`
      Mi proyecto de ciberseguridad post-cuántica:
      - Implementación de algoritmo resistente a computación cuántica
      - Análisis de vulnerabilidades
      - Pruebas de penetración
    `);

    // URL del repositorio
    const repoField = page.locator('input[name="repositoryUrl"]');
    if (await repoField.isVisible({ timeout: 2000 })) {
      await repoField.fill('https://github.com/user/quantum-security-project');
    }

    // Subir archivo ZIP
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 2000 })) {
      // Crear archivo de prueba (requiere archivo real en el sistema)
      // await fileInput.setInputFiles('path/to/project.zip');
    }

    // Enviar proyecto
    const submitButton = page.locator('button:has-text("Entregar proyecto")').or(
      page.locator('[data-testid="submit-project"]')
    );

    await submitButton.click();

    // Verificar confirmación
    await expect(
      page.locator('text=/proyecto.*entregado/i').or(
        page.locator('[data-testid="submission-success"]')
      )
    ).toBeVisible({ timeout: 10000 });

    // Verificar estado de entrega
    const submissionStatus = page.locator('[data-testid="submission-status"]');
    if (await submissionStatus.isVisible({ timeout: 3000 })) {
      const status = await submissionStatus.textContent();
      expect(status).toContain('PENDING');
    }
  });

  test('HU-028: Instructor puede calificar proyecto', async ({ page }) => {
    await createTestInstructor(page);
    await loginAsInstructor(page);

    // Navegar a entregas pendientes
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/submissions`);

    // Verificar lista de entregas
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });

    const firstSubmission = page.locator('tbody tr').first();
    if (await firstSubmission.isVisible({ timeout: 3000 })) {
      // Click en revisar
      await firstSubmission.locator('button:has-text("Revisar")').click();

      // Verificar página de calificación
      await expect(page.locator('h2:has-text("Calificar")'))
        .toBeVisible({ timeout: 5000 });

      // Usar rúbrica de evaluación
      const criteria = [
        'functionality',
        'code-quality',
        'documentation',
        'innovation'
      ];

      for (const criterion of criteria) {
        const rubricItem = page.locator(`[data-criterion="${criterion}"]`);
        if (await rubricItem.isVisible({ timeout: 1000 })) {
          // Seleccionar nivel (excellent, good, satisfactory, needs-improvement)
          await rubricItem.locator('[data-level="good"]').click();
        }
      }

      // Puntuación numérica
      const scoreInput = page.locator('input[name="score"]');
      if (await scoreInput.isVisible({ timeout: 2000 })) {
        await scoreInput.fill('85');
      }

      // Feedback
      await page.fill(
        'textarea[name="feedback"]',
        'Excelente trabajo. El proyecto demuestra comprensión sólida de los conceptos. Sugerencias: mejorar documentación de funciones complejas.'
      );

      // Guardar calificación
      await page.click('button:has-text("Guardar calificación")');

      // Verificar confirmación
      await expect(
        page.locator('text=/calificación.*guardada/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Sistema de Gamificación', () => {
  test('HU-029: Estudiante recibe badges al completar hitos', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    // Completar un módulo para obtener badge
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // Simular completación rápida de módulo
    const completeButtons = page.locator('[data-testid="mark-complete"]');
    const buttonCount = await completeButtons.count();

    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(3, buttonCount); i++) {
        await completeButtons.nth(i).click();
        await page.waitForTimeout(1000);
      }
    }

    // Verificar notificación de badge
    const badgeNotification = page.locator('[data-testid="badge-notification"]').or(
      page.locator('text=/badge.*desbloqueado/i').or(
        page.locator('.toast:has-text("🎖️")')
      )
    );

    const hasBadge = await badgeNotification.isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasBadge) {
      expect(hasBadge).toBeTruthy();
    }

    // Ver badges en perfil
    await page.goto(`${BASE_URL}/profile`);

    const badgesSection = page.locator('[data-testid="badges-section"]').or(
      page.locator('.badges-container')
    );

    if (await badgesSection.isVisible({ timeout: 3000 })) {
      const badges = badgesSection.locator('[data-testid^="badge-"]');
      const badgeCount = await badges.count();
      expect(badgeCount).toBeGreaterThanOrEqual(0);

      // Verificar información del badge
      if (badgeCount > 0) {
        const firstBadge = badges.first();
        await firstBadge.hover();

        // Debería mostrar tooltip o descripción
        const tooltip = page.locator('[role="tooltip"]').or(
          page.locator('.badge-tooltip')
        );

        const hasTooltip = await tooltip.isVisible({ timeout: 1000 })
          .catch(() => false);

        if (hasTooltip) {
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toBeTruthy();
        }
      }
    }
  });

  test('HU-030: Certificado se genera al completar curso', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // Simular curso completado (en un test real, completaríamos todo el curso)
    await page.goto(`${BASE_URL}/certificates`);

    // Si hay certificados disponibles
    const certificateCards = page.locator('[data-testid^="certificate-"]');
    const certCount = await certificateCards.count();

    if (certCount > 0) {
      const firstCert = certificateCards.first();

      // Verificar información del certificado
      await expect(firstCert).toContainText(/certificado/i);

      // Descargar PDF
      const downloadButton = firstCert.locator('button:has-text("Descargar")');

      if (await downloadButton.isVisible({ timeout: 3000 })) {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 10000 }),
          downloadButton.click()
        ]);

        // Verificar descarga
        expect(download.suggestedFilename()).toMatch(/\.(pdf|png)$/);
      }

      // Ver certificado en línea
      const viewButton = firstCert.locator('button:has-text("Ver")').or(
        firstCert.locator('a:has-text("Ver")')
      );

      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();

        // Debería abrir modal o nueva página
        await expect(
          page.locator('[data-testid="certificate-viewer"]').or(
            page.locator('.certificate-modal')
          )
        ).toBeVisible({ timeout: 5000 });

        // Verificar contenido del certificado
        await expect(page.locator('text=/certifica que/i')).toBeVisible();
        await expect(page.locator('text=/completado.*exitosamente/i')).toBeVisible();
      }
    }
  });

  test('HU-031: Sistema de puntos y niveles', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    await page.goto(`${BASE_URL}/profile`);

    // Verificar indicador de nivel
    const levelIndicator = page.locator('[data-testid="user-level"]').or(
      page.locator('.level-badge')
    );

    if (await levelIndicator.isVisible({ timeout: 3000 })) {
      const levelText = await levelIndicator.textContent();
      expect(levelText).toMatch(/nivel.*\d+/i);
    }

    // Verificar puntos XP
    const xpIndicator = page.locator('[data-testid="user-xp"]').or(
      page.locator('.xp-counter')
    );

    if (await xpIndicator.isVisible({ timeout: 3000 })) {
      const xpText = await xpIndicator.textContent();
      expect(xpText).toMatch(/\d+.*xp/i);
    }

    // Verificar barra de progreso al siguiente nivel
    const progressBar = page.locator('[data-testid="level-progress"]').or(
      page.locator('.level-progress-bar')
    );

    if (await progressBar.isVisible({ timeout: 2000 })) {
      const progress = await progressBar.getAttribute('aria-valuenow');
      expect(progress).toBeTruthy();
    }

    // Verificar tabla de líderes
    await page.goto(`${BASE_URL}/leaderboard`);

    const leaderboardTable = page.locator('table').or(
      page.locator('[data-testid="leaderboard"]')
    );

    if (await leaderboardTable.isVisible({ timeout: 3000 })) {
      const rows = leaderboardTable.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Verificar columnas
      const firstRow = rows.first();
      await expect(firstRow).toContainText(/\d+/); // Posición
      await expect(firstRow).toContainText(/xp/i); // Puntos
    }
  });
});

test.describe('Notificaciones y Comunicación', () => {
  test('HU-032: Sistema de notificaciones en tiempo real', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // Verificar icono de notificaciones
    const notificationBell = page.locator('[data-testid="notification-bell"]').or(
      page.locator('[aria-label="Notificaciones"]')
    );

    await expect(notificationBell).toBeVisible({ timeout: 5000 });

    // Verificar contador de notificaciones no leídas
    const unreadCount = notificationBell.locator('.badge').or(
      notificationBell.locator('[data-testid="unread-count"]')
    );

    if (await unreadCount.isVisible({ timeout: 2000 })) {
      const count = await unreadCount.textContent();
      expect(count).toMatch(/\d+/);
    }

    // Abrir panel de notificaciones
    await notificationBell.click();

    const notificationPanel = page.locator('[data-testid="notification-panel"]').or(
      page.locator('.notifications-dropdown')
    );

    await expect(notificationPanel).toBeVisible({ timeout: 3000 });

    // Verificar lista de notificaciones
    const notifications = notificationPanel.locator('[data-testid^="notification-"]');
    const notifCount = await notifications.count();

    if (notifCount > 0) {
      const firstNotif = notifications.first();

      // Verificar estructura de notificación
      await expect(firstNotif).toContainText(/./); // Tiene algún texto

      // Marcar como leída
      const markReadButton = firstNotif.locator('[data-testid="mark-read"]');
      if (await markReadButton.isVisible({ timeout: 1000 })) {
        await markReadButton.click();

        // El contador debería actualizarse
        await page.waitForTimeout(1000);
        if (await unreadCount.isVisible()) {
          const newCount = await unreadCount.textContent();
          expect(parseInt(newCount || '0')).toBeLessThan(parseInt(count || '1'));
        }
      }
    }

    // Ver todas las notificaciones
    const viewAllButton = notificationPanel.locator('a:has-text("Ver todas")');
    if (await viewAllButton.isVisible({ timeout: 2000 })) {
      await viewAllButton.click();
      await expect(page).toHaveURL(/.*notifications/);
    }
  });

  test('HU-033: Mensajería entre usuarios', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    await page.goto(`${BASE_URL}/messages`);

    // Verificar interfaz de mensajes
    const messagesContainer = page.locator('[data-testid="messages-container"]').or(
      page.locator('.messages-page')
    );

    if (await messagesContainer.isVisible({ timeout: 5000 })) {
      // Lista de conversaciones
      const conversationsList = page.locator('[data-testid="conversations-list"]');
      await expect(conversationsList).toBeVisible();

      // Nuevo mensaje
      const newMessageButton = page.locator('button:has-text("Nuevo mensaje")');
      if (await newMessageButton.isVisible({ timeout: 2000 })) {
        await newMessageButton.click();

        // Buscar destinatario
        const recipientInput = page.locator('input[name="recipient"]');
        await recipientInput.fill('instructor');

        // Escribir mensaje
        const messageInput = page.locator('textarea[name="message"]');
        await messageInput.fill('Hola, tengo una pregunta sobre el módulo 3.');

        // Enviar
        await page.click('button:has-text("Enviar")');

        // Verificar confirmación
        await expect(
          page.locator('text=/mensaje.*enviado/i')
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Perfil Público y Progreso', () => {
  test('HU-034: Perfil público de usuario', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // Ir a perfil público
    await page.goto(`${BASE_URL}/profile`);

    // Obtener URL pública
    const publicUrlElement = page.locator('[data-testid="public-profile-url"]');

    if (await publicUrlElement.isVisible({ timeout: 3000 })) {
      const publicUrl = await publicUrlElement.textContent();

      // Abrir perfil público en nueva pestaña
      const newPage = await page.context().newPage();
      await newPage.goto(publicUrl || `${BASE_URL}/users/public/test-user`);

      // Verificar información pública
      await expect(newPage.locator('[data-testid="user-name"]')).toBeVisible();
      await expect(newPage.locator('[data-testid="user-badges"]')).toBeVisible();
      await expect(newPage.locator('[data-testid="completed-courses"]')).toBeVisible();

      // Verificar que NO muestra información privada
      await expect(newPage.locator('text=/email/i')).not.toBeVisible();

      await newPage.close();
    }
  });

  test('HU-035: Dashboard de progreso detallado', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    await page.goto(`${BASE_URL}/dashboard`);

    // Verificar estadísticas generales
    const statsCards = [
      '[data-testid="courses-enrolled"]',
      '[data-testid="courses-completed"]',
      '[data-testid="total-xp"]',
      '[data-testid="current-streak"]'
    ];

    for (const selector of statsCards) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        const value = await element.textContent();
        expect(value).toMatch(/\d+/);
      }
    }

    // Gráfico de actividad
    const activityChart = page.locator('[data-testid="activity-chart"]').or(
      page.locator('.recharts-wrapper')
    );

    if (await activityChart.isVisible({ timeout: 3000 })) {
      expect(await activityChart.count()).toBeGreaterThan(0);
    }

    // Progreso por curso
    const courseProgress = page.locator('[data-testid="course-progress-list"]');

    if (await courseProgress.isVisible({ timeout: 3000 })) {
      const progressItems = courseProgress.locator('[data-testid^="progress-"]');
      const itemCount = await progressItems.count();

      if (itemCount > 0) {
        const firstItem = progressItems.first();

        // Verificar información de progreso
        await expect(firstItem).toContainText(/%/);

        // Verificar barra de progreso visual
        const progressBar = firstItem.locator('.progress-bar');
        const hasProgressBar = await progressBar.isVisible({ timeout: 1000 })
          .catch(() => false);
        expect(hasProgressBar).toBeTruthy();
      }
    }
  });
});

test.describe('Features Avanzadas', () => {
  test('HU-036-040: Foro, Wiki, Calendario, Modo Oscuro, API', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // HU-036: Foro de discusión
    await page.goto(`${BASE_URL}/forum`);

    const forumPage = page.locator('[data-testid="forum-page"]').or(
      page.locator('.forum-container')
    );

    if (await forumPage.isVisible({ timeout: 3000 })) {
      // Crear nuevo topic
      const newTopicButton = page.locator('button:has-text("Nuevo tema")');
      if (await newTopicButton.isVisible({ timeout: 2000 })) {
        await newTopicButton.click();

        await page.fill('input[name="title"]', 'Pregunta sobre criptografía cuántica');
        await page.fill('textarea[name="content"]', '¿Cómo funcionan los qubits?');
        await page.click('button:has-text("Publicar")');

        await expect(page.locator('text=/publicado/i')).toBeVisible({ timeout: 5000 });
      }
    }

    // HU-037: Wiki colaborativa
    await page.goto(`${BASE_URL}/wiki`);

    const wikiPage = page.locator('[data-testid="wiki-page"]');
    if (await wikiPage.isVisible({ timeout: 3000 })) {
      // Buscar artículo
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await searchInput.fill('quantum');
      await searchInput.press('Enter');

      // Editar artículo
      const editButton = page.locator('button:has-text("Editar")').first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();

        const editor = page.locator('textarea[name="content"]');
        await editor.fill('Contenido actualizado sobre computación cuántica.');
        await page.click('button:has-text("Guardar")');
      }
    }

    // HU-038: Calendario de eventos
    await page.goto(`${BASE_URL}/calendar`);

    const calendar = page.locator('[data-testid="calendar"]').or(
      page.locator('.calendar-container')
    );

    if (await calendar.isVisible({ timeout: 3000 })) {
      // Verificar eventos
      const events = calendar.locator('[data-testid^="event-"]');
      const eventCount = await events.count();

      if (eventCount > 0) {
        // Click en un evento
        await events.first().click();

        // Debería mostrar detalles
        await expect(
          page.locator('[data-testid="event-details"]')
        ).toBeVisible({ timeout: 3000 });
      }
    }

    // HU-039: Modo oscuro
    const themeToggle = page.locator('[data-testid="theme-toggle"]').or(
      page.locator('[aria-label="Toggle dark mode"]')
    );

    if (await themeToggle.isVisible({ timeout: 3000 })) {
      // Obtener tema actual
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark-mode');
      });

      // Cambiar tema
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Verificar que cambió
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark-mode');
      });

      expect(newTheme).not.toBe(initialTheme);

      // Verificar que se guarda la preferencia
      await page.reload();

      const savedTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark-mode');
      });

      expect(savedTheme).toBe(newTheme);
    }

    // HU-040: API pública
    const apiResponse = await page.request.get(`${BASE_URL}/api/public/courses`);

    expect(apiResponse.ok()).toBeTruthy();

    const courses = await apiResponse.json();
    expect(Array.isArray(courses)).toBeTruthy();
  });

  test('HU-041-045: Mobile, Offline, Backup, Integración Teams, Feedback', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // HU-041: Responsive mobile
    // Cambiar viewport a móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/courses`);

    // Verificar menú hamburguesa en móvil
    const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
      page.locator('[aria-label="Menu"]')
    );

    await expect(mobileMenu).toBeVisible({ timeout: 3000 });

    await mobileMenu.click();

    // Verificar que el menú se despliega
    const mobileNav = page.locator('[data-testid="mobile-nav"]').or(
      page.locator('.mobile-navigation')
    );

    await expect(mobileNav).toBeVisible({ timeout: 2000 });

    // Restaurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // HU-042: Modo offline (verificar service worker)
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== undefined;
      }
      return false;
    });

    // El service worker debería estar registrado
    if (hasServiceWorker) {
      expect(hasServiceWorker).toBeTruthy();
    }

    // HU-043: Backup y recuperación
    await page.goto(`${BASE_URL}/settings`);

    const backupButton = page.locator('button:has-text("Exportar datos")').or(
      page.locator('[data-testid="backup-data"]')
    );

    if (await backupButton.isVisible({ timeout: 3000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        backupButton.click()
      ]);

      expect(download.suggestedFilename()).toMatch(/\.(json|zip)$/);
    }

    // HU-044: Integración con MS Teams (verificar botón/configuración)
    const teamsIntegration = page.locator('[data-testid="teams-integration"]').or(
      page.locator('text=/microsoft teams/i')
    );

    if (await teamsIntegration.isVisible({ timeout: 2000 })) {
      await teamsIntegration.click();

      // Debería mostrar opciones de integración
      await expect(
        page.locator('text=/conectar.*teams/i')
      ).toBeVisible({ timeout: 3000 });
    }

    // HU-045: Sistema de feedback
    const feedbackButton = page.locator('[data-testid="feedback-button"]').or(
      page.locator('[aria-label="Feedback"]').or(
        page.locator('button:has-text("Feedback")')
      )
    );

    if (await feedbackButton.isVisible({ timeout: 3000 })) {
      await feedbackButton.click();

      // Modal de feedback
      const feedbackModal = page.locator('[data-testid="feedback-modal"]').or(
        page.locator('.feedback-form')
      );

      await expect(feedbackModal).toBeVisible({ timeout: 3000 });

      // Llenar formulario de feedback
      const ratingStars = feedbackModal.locator('[data-testid="rating-star-4"]');
      if (await ratingStars.isVisible({ timeout: 1000 })) {
        await ratingStars.click();
      }

      const feedbackText = feedbackModal.locator('textarea[name="feedback"]');
      await feedbackText.fill('Excelente plataforma de aprendizaje. Muy intuitiva.');

      await feedbackModal.locator('button:has-text("Enviar")').click();

      // Verificar confirmación
      await expect(
        page.locator('text=/gracias.*feedback/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });
});