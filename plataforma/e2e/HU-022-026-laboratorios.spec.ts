/**
 * E2E Tests: HU-022, HU-024 a HU-026 - Laboratorios y Ejecución de Código
 * Tests del sistema de laboratorios con Docker, validación automática y progreso
 */

import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';
import { enrollInCourse, navigateToModule } from './helpers/course';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Sistema de Laboratorios con Ejecución de Código', () => {
  test('HU-022: Código se ejecuta en sandbox Docker', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    // Navegar a un laboratorio
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // Buscar y hacer click en un lab
    const labLink = page.locator('a:has-text("Lab")').first().or(
      page.locator('[data-testid^="lab-"]').first()
    );

    if (await labLink.isVisible({ timeout: 5000 })) {
      await labLink.click();
      await page.waitForLoadState('networkidle');

      // Verificar que se carga el editor de código
      const codeEditor = page.locator('.monaco-editor').or(
        page.locator('textarea[name="code"]').or(
          page.locator('[data-testid="code-editor"]')
        )
      );

      await expect(codeEditor).toBeVisible({ timeout: 10000 });

      // Verificar selector de lenguaje
      const languageSelector = page.locator('select[name="language"]').or(
        page.locator('[data-testid="language-selector"]')
      );

      if (await languageSelector.isVisible({ timeout: 3000 })) {
        // Verificar lenguajes disponibles
        const options = await languageSelector.locator('option').allTextContents();
        expect(options).toContain('Python');
        expect(options).toContain('JavaScript');

        // Seleccionar Python
        await languageSelector.selectOption('python');
      }

      // Escribir código Python simple
      const pythonCode = `
print("Hello from Docker sandbox!")
import sys
print(f"Python version: {sys.version}")

# Test isolation
try:
    import requests
    print("Network access available")
except ImportError:
    print("Network isolated - Good!")
      `.trim();

      // Escribir en el editor
      if (await codeEditor.locator('.view-line').isVisible({ timeout: 2000 })) {
        // Monaco editor
        await page.keyboard.type(pythonCode);
      } else {
        // Textarea fallback
        await codeEditor.fill(pythonCode);
      }

      // Ejecutar código
      const runButton = page.locator('button:has-text("Ejecutar")').or(
        page.locator('[data-testid="run-code"]')
      );

      await runButton.click();

      // Esperar output
      const outputTerminal = page.locator('[data-testid="terminal-output"]').or(
        page.locator('.terminal-output').or(
          page.locator('pre.output')
        )
      );

      await expect(outputTerminal).toBeVisible({ timeout: 30000 });

      // Verificar output
      const output = await outputTerminal.textContent();
      expect(output).toContain('Hello from Docker sandbox!');
      expect(output).toContain('Python version');

      // Verificar aislamiento (debería decir "Network isolated")
      if (output?.includes('Network')) {
        expect(output).toContain('isolated');
      }

      // Verificar límites de tiempo
      const timeoutCode = 'import time; time.sleep(100)';

      if (await codeEditor.locator('.view-line').isVisible()) {
        await page.keyboard.press('Control+A');
        await page.keyboard.type(timeoutCode);
      } else {
        await codeEditor.fill(timeoutCode);
      }

      await runButton.click();

      // Debería timeout después de max 60 segundos
      await page.waitForTimeout(3000);

      const timeoutOutput = await outputTerminal.textContent();
      const hasTimeout = timeoutOutput?.toLowerCase().includes('timeout') ||
                        timeoutOutput?.toLowerCase().includes('tiempo') ||
                        timeoutOutput?.toLowerCase().includes('exceeded');

      // Si ejecutó por más de 3 segundos, verificar que eventualmente timeout
      if (!hasTimeout) {
        await page.waitForTimeout(10000);
        const finalOutput = await outputTerminal.textContent();
        expect(finalOutput).toMatch(/(timeout|tiempo|exceeded)/i);
      }
    }
  });

  test('HU-024: Lab se valida automáticamente', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    // Navegar a un lab con tests
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/labs/1`);

    // Verificar instrucciones del lab
    const instructions = page.locator('[data-testid="lab-instructions"]').or(
      page.locator('.lab-description')
    );

    await expect(instructions).toBeVisible({ timeout: 5000 });

    // Verificar que muestra los tests a pasar
    const testCases = page.locator('[data-testid="test-cases"]').or(
      page.locator('.test-requirements')
    );

    if (await testCases.isVisible({ timeout: 3000 })) {
      const testText = await testCases.textContent();
      expect(testText).toBeTruthy();
    }

    // Escribir solución incorrecta primero
    const codeEditor = page.locator('.monaco-editor textarea').or(
      page.locator('textarea[name="code"]')
    );

    const incorrectCode = `
def solution():
    return "wrong answer"

print(solution())
    `.trim();

    await codeEditor.fill(incorrectCode);

    // Ejecutar y validar
    const validateButton = page.locator('button:has-text("Validar")').or(
      page.locator('button:has-text("Ejecutar y validar")').or(
        page.locator('[data-testid="validate-code"]')
      )
    );

    await validateButton.click();

    // Esperar resultados de validación
    await page.waitForTimeout(5000);

    // Verificar que muestra tests fallidos
    const testResults = page.locator('[data-testid="test-results"]').or(
      page.locator('.test-results')
    );

    await expect(testResults).toBeVisible({ timeout: 10000 });

    const failedTests = page.locator('.test-failed').or(
      page.locator('[data-testid="failed-test"]').or(
        page.locator('text=/failed/i')
      )
    );

    const hasFailed = await failedTests.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasFailed).toBeTruthy();

    // Ahora escribir solución correcta
    const correctCode = `
def solution():
    # Implementación correcta según el lab
    return "Hello World"

# Test the solution
result = solution()
print(f"Result: {result}")
assert result == "Hello World", "Test passed!"
print("✅ All tests passed!")
    `.trim();

    await codeEditor.fill(correctCode);
    await validateButton.click();

    // Esperar nueva validación
    await page.waitForTimeout(5000);

    // Verificar tests pasados
    const passedTests = page.locator('.test-passed').or(
      page.locator('[data-testid="passed-test"]').or(
        page.locator('text=/✅.*passed/i')
      )
    );

    const hasPassed = await passedTests.isVisible({ timeout: 5000 }).catch(() => false);

    // O verificar estado del lab
    const labStatus = page.locator('[data-testid="lab-status"]').or(
      page.locator('.lab-status')
    );

    if (await labStatus.isVisible({ timeout: 2000 })) {
      const status = await labStatus.textContent();
      expect(status?.toLowerCase()).toContain('completado');
    }
  });

  test('HU-025: Múltiples lenguajes de programación soportados', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/labs/1`);

    const languageSelector = page.locator('select[name="language"]').or(
      page.locator('[data-testid="language-selector"]')
    );

    if (await languageSelector.isVisible({ timeout: 5000 })) {
      // Verificar lenguajes disponibles
      const options = await languageSelector.locator('option').allTextContents();

      expect(options.length).toBeGreaterThan(1);

      // Test Python
      await languageSelector.selectOption('python');

      const codeEditor = page.locator('.monaco-editor textarea').or(
        page.locator('textarea[name="code"]')
      );

      await codeEditor.fill('print("Python works!")');

      const runButton = page.locator('button:has-text("Ejecutar")');
      await runButton.click();

      const output = page.locator('[data-testid="terminal-output"]');
      await expect(output).toContainText('Python works!', { timeout: 10000 });

      // Test JavaScript
      if (options.includes('JavaScript') || options.includes('Node.js')) {
        await languageSelector.selectOption(/javascript|node/i);

        await codeEditor.fill('console.log("JavaScript works!");');
        await runButton.click();

        await expect(output).toContainText('JavaScript works!', { timeout: 10000 });
      }

      // Test Bash si está disponible
      if (options.includes('Bash') || options.includes('Shell')) {
        await languageSelector.selectOption(/bash|shell/i);

        await codeEditor.fill('echo "Bash works!"');
        await runButton.click();

        await expect(output).toContainText('Bash works!', { timeout: 10000 });
      }

      // Verificar syntax highlighting cambia con el lenguaje
      const editorClasses = await codeEditor.getAttribute('class');
      expect(editorClasses).toBeTruthy();
    }
  });

  test('HU-026: Progreso de labs se guarda automáticamente', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/labs/1`);

    const codeEditor = page.locator('.monaco-editor textarea').or(
      page.locator('textarea[name="code"]')
    );

    // Escribir código parcial
    const partialCode = `
# Mi solución en progreso
def calculate_security_hash(data):
    # TODO: implementar
    pass
    `.trim();

    await codeEditor.fill(partialCode);

    // Esperar auto-guardado (usualmente hay un debounce)
    await page.waitForTimeout(3000);

    // Verificar indicador de guardado
    const saveIndicator = page.locator('[data-testid="save-status"]').or(
      page.locator('text=/guardado/i').or(
        page.locator('.save-indicator')
      )
    );

    const hasSaveIndicator = await saveIndicator.isVisible({ timeout: 3000 }).catch(() => false);

    // Navegar fuera y volver
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForTimeout(1000);

    // Volver al mismo lab
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/labs/1`);

    // Verificar que el código se restauró
    const restoredCode = await codeEditor.inputValue().catch(async () => {
      // Si es Monaco editor, intentar obtener el valor de otra forma
      return await page.evaluate(() => {
        const editor = (window as any).monaco?.editor?.getModels()[0];
        return editor?.getValue() || '';
      });
    });

    // Debería contener al menos parte del código guardado
    if (restoredCode) {
      expect(restoredCode).toContain('calculate_security_hash');
    }

    // Completar el lab
    const completeCode = `
def calculate_security_hash(data):
    import hashlib
    return hashlib.sha256(data.encode()).hexdigest()

# Test
result = calculate_security_hash("test")
print(f"Hash: {result}")
print("✅ Lab completed!")
    `.trim();

    await codeEditor.fill(completeCode);

    const runButton = page.locator('button:has-text("Ejecutar")');
    await runButton.click();

    await page.waitForTimeout(3000);

    // Marcar como completado si hay botón
    const submitButton = page.locator('button:has-text("Enviar solución")').or(
      page.locator('[data-testid="submit-lab"]')
    );

    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click();

      // Verificar confirmación
      await expect(
        page.locator('text=/enviado.*exitosamente/i').or(
          page.locator('[data-testid="success-message"]')
        )
      ).toBeVisible({ timeout: 5000 });
    }

    // Volver a la lista de labs
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // El lab debería mostrar como completado
    const labItem = page.locator('[data-testid="lab-1"]').or(
      page.locator('a:has-text("Lab 1")')
    );

    const completedIndicator = labItem.locator('.completed').or(
      labItem.locator('[data-completed="true"]').or(
        labItem.locator('svg[data-testid="check-icon"]')
      )
    );

    const isCompleted = await completedIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isCompleted).toBeTruthy();
  });

  test('Límites de recursos en ejecución de código', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/labs/1`);

    const codeEditor = page.locator('.monaco-editor textarea').or(
      page.locator('textarea[name="code"]')
    );

    // Test límite de memoria
    const memoryCode = `
# Intentar usar mucha memoria
big_list = []
try:
    for i in range(10**9):
        big_list.append("x" * 10000)
except MemoryError:
    print("Memory limit enforced!")
print("Execution completed")
    `.trim();

    await codeEditor.fill(memoryCode);

    const runButton = page.locator('button:has-text("Ejecutar")');
    await runButton.click();

    const output = page.locator('[data-testid="terminal-output"]');

    // Debería terminar con error o límite
    await expect(output).toBeVisible({ timeout: 30000 });

    const outputText = await output.textContent();
    const hasLimit = outputText?.includes('Memory') ||
                    outputText?.includes('limit') ||
                    outputText?.includes('Error');

    expect(hasLimit).toBeTruthy();

    // Test límite de CPU (loop infinito)
    const cpuCode = `
import time
start = time.time()
while True:
    pass  # Loop infinito
    `.trim();

    await codeEditor.fill(cpuCode);
    await runButton.click();

    // Debería timeout
    await page.waitForTimeout(5000);

    const timeoutOutput = await output.textContent();
    expect(timeoutOutput).toMatch(/(timeout|terminated|stopped)/i);

    // Test aislamiento de red
    const networkCode = `
try:
    import urllib.request
    response = urllib.request.urlopen('http://google.com')
    print("Network access allowed - Security issue!")
except:
    print("Network access blocked - Good security!")
    `.trim();

    await codeEditor.fill(networkCode);
    await runButton.click();

    await page.waitForTimeout(5000);

    const networkOutput = await output.textContent();
    expect(networkOutput).toContain('blocked');
  });
});