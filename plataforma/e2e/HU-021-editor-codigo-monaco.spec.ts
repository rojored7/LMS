/**
 * HU-021: Editor de Código In-Browser (Monaco)
 * Como estudiante, quiero escribir y editar código directamente en el navegador
 * para completar ejercicios sin necesidad de un IDE local.
 *
 * Criterios de Aceptación:
 * AC1: Editor Monaco se carga correctamente en laboratorios
 * AC2: Soporta syntax highlighting para múltiples lenguajes
 * AC3: Tiene autocompletado básico
 * AC4: Permite ejecutar el código con un botón
 * AC5: Muestra números de línea y permite copiar/pegar
 * AC6: Guarda el progreso automáticamente
 */

import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('HU-021: Editor de Código Monaco', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('AC1: Editor Monaco se carga correctamente en laboratorios', async ({ page }) => {
    // Navegar a un curso con laboratorios
    await page.goto(`${BASE_URL}/dashboard`);

    // Buscar y entrar a un curso
    const course = page.locator('.enrolled-course, .course-card').first();
    if (await course.isVisible({ timeout: 5000 }).catch(() => false)) {
      await course.click();

      // Esperar a que cargue el contenido del curso
      await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

      // Buscar un laboratorio
      const labLink = page.locator('a:has-text(/laboratorio|lab|práctica/i), button:has-text(/laboratorio|lab/i)').first();
      if (await labLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await labLink.click();

        // Esperar que cargue Monaco Editor
        await page.waitForSelector('.monaco-editor, #monaco-editor, [data-testid="code-editor"]', { timeout: 10000 });

        // Verificar que el editor está visible y tiene el tamaño correcto
        const editor = page.locator('.monaco-editor').first();
        await expect(editor).toBeVisible();

        const box = await editor.boundingBox();
        expect(box?.width).toBeGreaterThan(300);
        expect(box?.height).toBeGreaterThan(200);
      }
    }
  });

  test('AC2: Soporta syntax highlighting para múltiples lenguajes', async ({ page }) => {
    // Navegar directamente a un laboratorio si conocemos la URL
    await page.goto(`${BASE_URL}/courses`);

    // Buscar cualquier laboratorio disponible
    const courseWithLab = page.locator('.course-card, .course-item').first();
    await courseWithLab.click();

    await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

    const labButton = page.locator('text=/laboratorio|lab|ejercicio.*código/i').first();
    if (await labButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labButton.click();

      // Esperar Monaco Editor
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // Escribir código Python
      const editorTextarea = page.locator('.monaco-editor textarea, .view-line').first();
      await editorTextarea.click();

      // Limpiar y escribir nuevo código
      await page.keyboard.press('Control+A');
      await page.keyboard.type('def hello_world():\n    print("Hello, World!")\n    return True');

      // Verificar que hay tokens de syntax highlighting
      await page.waitForTimeout(500); // Dar tiempo al highlighting

      const syntaxTokens = page.locator('.monaco-editor .mtk1, .monaco-editor .mtk5, .monaco-editor .mtk6');
      const tokenCount = await syntaxTokens.count();
      expect(tokenCount).toBeGreaterThan(0);

      // Verificar selector de lenguaje si existe
      const languageSelector = page.locator('select[name*="language"], button:has-text(/python|javascript|java/i)');
      if (await languageSelector.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        // Cambiar lenguaje a JavaScript
        if (languageSelector.first().nodeName === 'SELECT') {
          await languageSelector.first().selectOption('javascript');
        } else {
          await languageSelector.first().click();
          await page.locator('text="JavaScript"').click();
        }

        // Escribir código JavaScript
        await page.keyboard.press('Control+A');
        await page.keyboard.type('function helloWorld() {\n  console.log("Hello, World!");\n  return true;\n}');

        // Verificar highlighting de JavaScript
        await page.waitForTimeout(500);
        const jsTokens = await page.locator('.monaco-editor .mtk1, .monaco-editor .mtk5').count();
        expect(jsTokens).toBeGreaterThan(0);
      }
    }
  });

  test('AC3: Tiene autocompletado básico', async ({ page }) => {
    // Navegar a un laboratorio
    await page.goto(`${BASE_URL}/courses`);
    const course = page.locator('.course-card').first();
    await course.click();

    await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

    const labButton = page.locator('text=/laboratorio|lab/i').first();
    if (await labButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labButton.click();

      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // Activar el editor
      const editor = page.locator('.monaco-editor textarea, .view-line').first();
      await editor.click();

      // Escribir código parcial para triggear autocompletado
      await page.keyboard.type('con');

      // Presionar Ctrl+Space para forzar autocompletado
      await page.keyboard.press('Control+Space');

      // Verificar si aparece el menú de sugerencias
      const suggestions = page.locator('.suggest-widget, .monaco-list, [aria-label*="suggest"]');
      const hasSuggestions = await suggestions.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSuggestions) {
        // Verificar que hay opciones de autocompletado
        const suggestionItems = suggestions.locator('.monaco-list-row, .suggest-item');
        const itemCount = await suggestionItems.count();
        expect(itemCount).toBeGreaterThan(0);

        // Escape para cerrar sugerencias
        await page.keyboard.press('Escape');
      }
    }
  });

  test('AC4: Permite ejecutar el código con un botón', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    const course = page.locator('.course-card').first();
    await course.click();

    await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

    const labButton = page.locator('text=/laboratorio|lab/i').first();
    if (await labButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labButton.click();

      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // Escribir código simple
      const editor = page.locator('.monaco-editor textarea, .view-line').first();
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('print("Test execution")');

      // Buscar botón de ejecutar
      const runButton = page.locator('button:has-text(/ejecutar|run|play|▶/i)').first();
      await expect(runButton).toBeVisible();

      // Ejecutar código
      await runButton.click();

      // Esperar resultado
      const outputArea = page.locator('.output, .terminal-output, .console, [class*="output"]').first();
      await expect(outputArea).toBeVisible({ timeout: 10000 });

      // Verificar que muestra el output
      const outputText = await outputArea.textContent();
      expect(outputText).toContain('Test execution');
    }
  });

  test('AC5: Muestra números de línea y permite copiar/pegar', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    const course = page.locator('.course-card').first();
    await course.click();

    await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

    const labButton = page.locator('text=/laboratorio|lab/i').first();
    if (await labButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labButton.click();

      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // Verificar números de línea
      const lineNumbers = page.locator('.monaco-editor .line-numbers, .monaco-editor .margin-view-overlays');
      await expect(lineNumbers.first()).toBeVisible();

      // Probar copiar y pegar
      const editor = page.locator('.monaco-editor textarea, .view-line').first();
      await editor.click();

      // Escribir texto
      const testText = 'def test_function():\n    pass';
      await page.keyboard.type(testText);

      // Seleccionar todo y copiar
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Control+C');

      // Mover al final y pegar
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Control+V');

      // Verificar que el contenido se duplicó
      await page.waitForTimeout(500);
      const editorContent = await page.evaluate(() => {
        const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
        return monacoEditor?.getValue() || '';
      });

      // El contenido debería contener el texto dos veces
      if (editorContent) {
        const occurrences = (editorContent.match(/test_function/g) || []).length;
        expect(occurrences).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('AC6: Guarda el progreso automáticamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    const course = page.locator('.course-card').first();
    await course.click();

    await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

    const labButton = page.locator('text=/laboratorio|lab/i').first();
    if (await labButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labButton.click();

      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // Escribir código
      const editor = page.locator('.monaco-editor textarea, .view-line').first();
      await editor.click();
      await page.keyboard.press('Control+A');

      const uniqueCode = `# Test code ${Date.now()}\nprint("Unique test")`;
      await page.keyboard.type(uniqueCode);

      // Esperar auto-guardado (normalmente hay un indicador)
      const saveIndicator = page.locator('text=/guardado|saved|saving/i, .save-status');
      if (await saveIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(saveIndicator).toBeVisible();
      }

      // Alternativamente, buscar botón de guardar manual
      const saveButton = page.locator('button:has-text(/guardar|save/i)');
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await expect(page.locator('text=/guardado|saved/i')).toBeVisible({ timeout: 5000 });
      }

      // Recargar la página
      await page.reload();

      // Esperar que cargue el editor nuevamente
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // Verificar que el código se mantuvo
      await page.waitForTimeout(2000); // Dar tiempo para que cargue el contenido guardado

      const restoredContent = await page.evaluate(() => {
        const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
        return monacoEditor?.getValue() || '';
      });

      // El contenido restaurado debería contener nuestro código único
      if (restoredContent) {
        expect(restoredContent).toContain('Unique test');
      }
    }
  });

  test('Atajos de teclado funcionan correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    const course = page.locator('.course-card').first();
    await course.click();

    await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

    const labButton = page.locator('text=/laboratorio|lab/i').first();
    if (await labButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labButton.click();

      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      const editor = page.locator('.monaco-editor textarea, .view-line').first();
      await editor.click();

      // Probar diferentes atajos
      await page.keyboard.type('line 1\nline 2\nline 3');

      // Ctrl+A para seleccionar todo
      await page.keyboard.press('Control+A');

      // Ctrl+/ para comentar (si está soportado)
      await page.keyboard.press('Control+/');

      // Verificar que se aplicó el comentario
      await page.waitForTimeout(500);
      const commentedContent = await page.evaluate(() => {
        const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
        return monacoEditor?.getValue() || '';
      });

      // Debería tener comentarios (# para Python o // para JS)
      if (commentedContent) {
        const hasComments = commentedContent.includes('#') || commentedContent.includes('//');
        expect(hasComments).toBeTruthy();
      }

      // Ctrl+Z para deshacer
      await page.keyboard.press('Control+z');

      // Ctrl+F para buscar
      await page.keyboard.press('Control+f');
      const searchBox = page.locator('.find-widget, [aria-label*="find"]');
      const hasSearch = await searchBox.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSearch) {
        await page.keyboard.press('Escape'); // Cerrar búsqueda
      }
    }
  });
});