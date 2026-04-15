/**
 * Performance Tests - Core Web Vitals
 * Mide y valida las métricas de rendimiento según estándares de Google
 */

import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Umbrales de Core Web Vitals (Good thresholds)
const THRESHOLDS = {
  FCP: 1800,     // First Contentful Paint: < 1.8s
  LCP: 2500,     // Largest Contentful Paint: < 2.5s
  FID: 100,      // First Input Delay: < 100ms
  CLS: 0.1,      // Cumulative Layout Shift: < 0.1
  TTI: 3500,     // Time to Interactive: < 3.5s
  TBT: 300,      // Total Blocking Time: < 300ms
  TTFB: 800,     // Time to First Byte: < 800ms
};

test.describe('Performance - Core Web Vitals', () => {
  test('Landing page performance', async ({ page }) => {
    const startTime = Date.now();

    // Iniciar medición de métricas
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');

    // Obtener métricas de rendimiento
    const metrics = await page.evaluate(() => {
      const paintMetrics: any = {};

      // Navigation Timing API
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        paintMetrics.TTFB = nav.responseStart - nav.requestStart;
        paintMetrics.domContentLoaded = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
        paintMetrics.loadComplete = nav.loadEventEnd - nav.loadEventStart;
      }

      // Paint Timing API
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          paintMetrics.FCP = entry.startTime;
        }
      });

      // Largest Contentful Paint
      return new Promise(resolve => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          paintMetrics.LCP = lastEntry.startTime;
          resolve(paintMetrics);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback if LCP doesn't fire
        setTimeout(() => resolve(paintMetrics), 3000);
      });
    });

    // Validar métricas contra umbrales
    console.log('Performance Metrics:', metrics);

    if (metrics.FCP) {
      expect(metrics.FCP).toBeLessThan(THRESHOLDS.FCP);
    }

    if (metrics.LCP) {
      expect(metrics.LCP).toBeLessThan(THRESHOLDS.LCP);
    }

    if (metrics.TTFB) {
      expect(metrics.TTFB).toBeLessThan(THRESHOLDS.TTFB);
    }

    // Tiempo total de carga
    const totalLoadTime = Date.now() - startTime;
    expect(totalLoadTime).toBeLessThan(5000); // < 5 segundos total
  });

  test('Dashboard performance for logged in user', async ({ page }) => {
    await loginAsStudent(page);

    const navigationStart = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const navigationTime = Date.now() - navigationStart;

    // Medir métricas específicas
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
        responseTime: timing.responseEnd - timing.requestStart,
        renderTime: timing.domComplete - timing.domLoading
      };
    });

    // Validaciones
    expect(navigationTime).toBeLessThan(3000);
    expect(metrics.domReadyTime).toBeLessThan(2000);
    expect(metrics.responseTime).toBeLessThan(1000);
  });

  test('Course catalog load performance', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Medir tiempo hasta que los cursos sean visibles
    const coursesLoadStart = Date.now();
    await page.waitForSelector('.course-card, .course-item', { timeout: 5000 });
    const coursesLoadTime = Date.now() - coursesLoadStart;

    expect(coursesLoadTime).toBeLessThan(2000);

    // Medir tiempo de renderizado de imágenes
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      // Verificar lazy loading
      const lazyLoadedImages = await images.evaluateAll((imgs) => {
        return imgs.filter(img => img.loading === 'lazy').length;
      });

      // Al menos 50% de las imágenes deberían tener lazy loading
      expect(lazyLoadedImages).toBeGreaterThanOrEqual(imageCount * 0.5);
    }
  });

  test('Time to Interactive (TTI)', async ({ page }) => {
    await page.goto(BASE_URL);

    // Medir tiempo hasta que la página sea interactiva
    const tti = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if (document.readyState === 'complete') {
          resolve(performance.now());
        } else {
          window.addEventListener('load', () => {
            // Esperar un poco más para asegurar interactividad
            setTimeout(() => resolve(performance.now()), 100);
          });
        }
      });
    });

    expect(tti).toBeLessThan(THRESHOLDS.TTI);

    // Verificar que los elementos interactivos responden
    const interactiveButton = page.locator('button, a').first();
    const clickStart = Date.now();
    await interactiveButton.click();
    const clickResponseTime = Date.now() - clickStart;

    expect(clickResponseTime).toBeLessThan(100); // < 100ms respuesta
  });

  test('Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.goto(BASE_URL);

    // Medir CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });

        // Dar tiempo para acumular shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    expect(cls).toBeLessThan(THRESHOLDS.CLS);
  });

  test('JavaScript bundle size', async ({ page }) => {
    const response = await page.goto(BASE_URL);

    // Obtener recursos JavaScript
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.endsWith('.js'))
        .map(r => ({
          name: r.name,
          size: (r as any).transferSize || 0,
          duration: r.duration
        }));
    });

    // Calcular tamaño total de JS
    const totalJSSize = jsResources.reduce((acc, r) => acc + r.size, 0);

    // JavaScript total debería ser < 500KB
    expect(totalJSSize).toBeLessThan(500 * 1024);

    // Ningún bundle individual debería ser > 200KB
    jsResources.forEach(resource => {
      expect(resource.size).toBeLessThan(200 * 1024);
    });
  });

  test('Image optimization', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('networkidle');

    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
        loading: img.loading,
        format: img.src.split('.').pop()?.split('?')[0]
      }));
    });

    imageMetrics.forEach(img => {
      // Verificar que no se están sirviendo imágenes más grandes de lo necesario
      if (img.displayWidth > 0) {
        const oversized = img.naturalWidth > img.displayWidth * 2;
        expect(oversized).toBeFalsy();
      }

      // Verificar formatos modernos (webp, avif)
      const modernFormat = ['webp', 'avif'].includes(img.format || '');
      const acceptableFormat = modernFormat || ['jpg', 'jpeg', 'png', 'svg'].includes(img.format || '');
      expect(acceptableFormat).toBeTruthy();
    });
  });

  test('API response times', async ({ page, request }) => {
    await loginAsStudent(page);

    // Medir tiempo de respuesta de APIs críticas
    const endpoints = [
      '/api/users/me',
      '/api/courses',
      '/api/notifications'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`http://localhost:4000${endpoint}`, {
        headers: {
          Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`
        }
      });
      const responseTime = Date.now() - startTime;

      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(500); // < 500ms por endpoint
    }
  });

  test('Memory usage', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/dashboard`);

    // Obtener uso de memoria inicial
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Navegar por varias páginas para simular uso
    await page.goto(`${BASE_URL}/courses`);
    await page.goto(`${BASE_URL}/profile`);
    await page.goto(`${BASE_URL}/notifications`);
    await page.goto(`${BASE_URL}/dashboard`);

    // Obtener uso de memoria después de navegación
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // No debería haber un aumento excesivo de memoria (< 50MB)
    const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
    expect(memoryIncrease).toBeLessThan(50);
  });

  test('Cache effectiveness', async ({ page }) => {
    // Primera carga
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Segunda carga (debería usar caché)
    const secondLoadStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const secondLoadTime = Date.now() - secondLoadStart;

    // Tercera carga (definitivamente desde caché)
    const thirdLoadStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const thirdLoadTime = Date.now() - thirdLoadStart;

    // La tercera carga debería ser significativamente más rápida
    expect(thirdLoadTime).toBeLessThan(secondLoadTime * 0.7);

    // Verificar headers de caché
    const cachedResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(r => (r as any).transferSize === 0).length;
    });

    // Debería haber recursos cacheados
    expect(cachedResources).toBeGreaterThan(0);
  });
});

test.describe('Performance - Load Testing', () => {
  test('Concurrent user simulation', async ({ browser }) => {
    const userCount = 5;
    const contexts = [];
    const pages = [];

    // Crear múltiples contextos de navegador
    for (let i = 0; i < userCount; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }

    // Todos los usuarios cargan la página al mismo tiempo
    const loadStart = Date.now();
    const loadPromises = pages.map(page =>
      page.goto(BASE_URL).then(() => Date.now() - loadStart)
    );

    const loadTimes = await Promise.all(loadPromises);

    // Calcular estadísticas
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);

    console.log(`Avg load time for ${userCount} users: ${avgLoadTime}ms`);
    console.log(`Max load time: ${maxLoadTime}ms`);

    // Validaciones
    expect(avgLoadTime).toBeLessThan(3000);
    expect(maxLoadTime).toBeLessThan(5000);

    // Limpiar
    for (const context of contexts) {
      await context.close();
    }
  });

  test('Rapid navigation stress test', async ({ page }) => {
    await loginAsStudent(page);

    const navigationTimes: number[] = [];
    const pages = [
      '/dashboard',
      '/courses',
      '/profile',
      '/notifications',
      '/courses',
      '/dashboard'
    ];

    for (const path of pages) {
      const navStart = Date.now();
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('domcontentloaded');
      navigationTimes.push(Date.now() - navStart);
    }

    // Calcular promedio
    const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;

    // El tiempo promedio de navegación debería ser bajo
    expect(avgNavTime).toBeLessThan(1500);

    // Ninguna navegación individual debería tardar demasiado
    navigationTimes.forEach(time => {
      expect(time).toBeLessThan(3000);
    });
  });
});

test.describe('Performance - Resource Optimization', () => {
  test('CSS optimization', async ({ page }) => {
    await page.goto(BASE_URL);

    const cssMetrics = await page.evaluate(() => {
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const resources = performance.getEntriesByType('resource');

      return resources
        .filter(r => r.name.endsWith('.css'))
        .map(r => ({
          name: r.name,
          size: (r as any).transferSize || 0,
          duration: r.duration
        }));
    });

    // CSS total debería ser < 100KB
    const totalCSSSize = cssMetrics.reduce((acc, r) => acc + r.size, 0);
    expect(totalCSSSize).toBeLessThan(100 * 1024);

    // Verificar CSS crítico inline
    const inlineStyles = await page.evaluate(() => {
      return document.querySelectorAll('style').length;
    });
    expect(inlineStyles).toBeGreaterThan(0); // Debería haber CSS crítico inline
  });

  test('Font loading optimization', async ({ page }) => {
    await page.goto(BASE_URL);

    const fontMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.includes('.woff') || r.name.includes('.woff2'))
        .map(r => ({
          name: r.name,
          format: r.name.includes('.woff2') ? 'woff2' : 'woff',
          duration: r.duration
        }));
    });

    // Preferir WOFF2 sobre WOFF
    const woff2Count = fontMetrics.filter(f => f.format === 'woff2').length;
    const woffCount = fontMetrics.filter(f => f.format === 'woff').length;
    expect(woff2Count).toBeGreaterThanOrEqual(woffCount);

    // Las fuentes deberían cargar rápidamente
    fontMetrics.forEach(font => {
      expect(font.duration).toBeLessThan(500);
    });
  });

  test('Service Worker registration', async ({ page }) => {
    await page.goto(BASE_URL);

    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    if (hasServiceWorker) {
      const swRegistered = await page.evaluate(() => {
        return navigator.serviceWorker.getRegistration().then(reg => !!reg);
      });

      expect(swRegistered).toBeTruthy();
    }
  });
});