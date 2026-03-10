/**
 * Translation Service
 * Business logic for multi-language support
 */

import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  context?: string | null;
}

interface TranslationInput {
  key: string;
  locale: string;
  value: string;
  context?: string;
}

class TranslationService {
  private readonly DEFAULT_LOCALE = 'es';
  private readonly SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt'];
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Get all translations for a locale
   */
  async getTranslations(locale: string): Promise<Record<string, string>> {
    // Validate locale
    if (!this.SUPPORTED_LOCALES.includes(locale)) {
      locale = this.DEFAULT_LOCALE;
    }

    // Try cache first
    const cacheKey = `translations:${locale}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const translations = await prisma.translation.findMany({
      where: { locale },
      select: {
        key: true,
        value: true
      }
    });

    // Convert to key-value object
    const translationMap = translations.reduce((acc, t) => ({
      ...acc,
      [t.key]: t.value
    }), {} as Record<string, string>);

    // Cache the result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(translationMap));

    return translationMap;
  }

  /**
   * Get translations for multiple locales
   */
  async getTranslationsByKey(key: string): Promise<Translation[]> {
    return await prisma.translation.findMany({
      where: { key },
      orderBy: { locale: 'asc' }
    });
  }

  /**
   * Create a new translation
   */
  async createTranslation(data: TranslationInput): Promise<Translation> {
    // Validate locale
    if (!this.SUPPORTED_LOCALES.includes(data.locale)) {
      throw new Error(`Locale no soportado: ${data.locale}. Locales válidos: ${this.SUPPORTED_LOCALES.join(', ')}`);
    }

    // Check if translation already exists
    const existing = await prisma.translation.findUnique({
      where: {
        key_locale: {
          key: data.key,
          locale: data.locale
        }
      }
    });

    if (existing) {
      throw new Error(`La traducción para la clave "${data.key}" en el idioma "${data.locale}" ya existe`);
    }

    // Create translation
    const translation = await prisma.translation.create({
      data: {
        key: data.key,
        locale: data.locale,
        value: data.value,
        context: data.context
      }
    });

    // Invalidate cache
    await this.invalidateCache(data.locale);

    return translation;
  }

  /**
   * Update an existing translation
   */
  async updateTranslation(id: string, data: Partial<TranslationInput>): Promise<Translation> {
    // Get existing translation
    const existing = await prisma.translation.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new Error('Traducción no encontrada');
    }

    // Update translation
    const updated = await prisma.translation.update({
      where: { id },
      data: {
        value: data.value,
        context: data.context
      }
    });

    // Invalidate cache
    await this.invalidateCache(existing.locale);

    return updated;
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(id: string): Promise<void> {
    const translation = await prisma.translation.findUnique({
      where: { id }
    });

    if (!translation) {
      throw new Error('Traducción no encontrada');
    }

    await prisma.translation.delete({
      where: { id }
    });

    // Invalidate cache
    await this.invalidateCache(translation.locale);
  }

  /**
   * Bulk import translations
   */
  async bulkImportTranslations(translations: TranslationInput[]): Promise<{ imported: number; errors: string[] }> {
    const results = {
      imported: 0,
      errors: [] as string[]
    };

    for (const translation of translations) {
      try {
        // Validate locale
        if (!this.SUPPORTED_LOCALES.includes(translation.locale)) {
          results.errors.push(`Locale no válido para clave ${translation.key}: ${translation.locale}`);
          continue;
        }

        // Upsert translation
        await prisma.translation.upsert({
          where: {
            key_locale: {
              key: translation.key,
              locale: translation.locale
            }
          },
          update: {
            value: translation.value,
            context: translation.context
          },
          create: {
            key: translation.key,
            locale: translation.locale,
            value: translation.value,
            context: translation.context
          }
        });

        results.imported++;
      } catch (error: any) {
        results.errors.push(`Error en clave ${translation.key}: ${error.message}`);
      }
    }

    // Invalidate all locale caches
    await Promise.all(this.SUPPORTED_LOCALES.map(locale => this.invalidateCache(locale)));

    return results;
  }

  /**
   * Export translations for a locale
   */
  async exportTranslations(locale: string, format: 'json' | 'csv' = 'json'): Promise<Buffer> {
    const translations = await prisma.translation.findMany({
      where: { locale },
      orderBy: { key: 'asc' }
    });

    if (format === 'json') {
      const jsonData = translations.reduce((acc, t) => ({
        ...acc,
        [t.key]: t.value
      }), {});

      return Buffer.from(JSON.stringify(jsonData, null, 2));
    }

    // CSV format
    const csvRows = ['key,value,context'];
    translations.forEach(t => {
      const value = t.value.replace(/"/g, '""'); // Escape quotes
      const context = (t.context || '').replace(/"/g, '""');
      csvRows.push(`"${t.key}","${value}","${context}"`);
    });

    return Buffer.from(csvRows.join('\n'));
  }

  /**
   * Get missing translations
   */
  async getMissingTranslations(baseLocale: string = 'es'): Promise<Record<string, string[]>> {
    // Get all keys from base locale
    const baseTranslations = await prisma.translation.findMany({
      where: { locale: baseLocale },
      select: { key: true }
    });

    const baseKeys = new Set(baseTranslations.map(t => t.key));
    const missing: Record<string, string[]> = {};

    // Check each locale for missing keys
    for (const locale of this.SUPPORTED_LOCALES) {
      if (locale === baseLocale) continue;

      const localeTranslations = await prisma.translation.findMany({
        where: { locale },
        select: { key: true }
      });

      const localeKeys = new Set(localeTranslations.map(t => t.key));
      const missingKeys = Array.from(baseKeys).filter(key => !localeKeys.has(key));

      if (missingKeys.length > 0) {
        missing[locale] = missingKeys;
      }
    }

    return missing;
  }

  /**
   * Search translations
   */
  async searchTranslations(query: string, locale?: string): Promise<Translation[]> {
    const where: any = {
      OR: [
        { key: { contains: query, mode: 'insensitive' } },
        { value: { contains: query, mode: 'insensitive' } },
        { context: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (locale) {
      where.locale = locale;
    }

    return await prisma.translation.findMany({
      where,
      orderBy: [
        { locale: 'asc' },
        { key: 'asc' }
      ],
      take: 100
    });
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats(): Promise<any> {
    const stats = await Promise.all(
      this.SUPPORTED_LOCALES.map(async locale => {
        const count = await prisma.translation.count({
          where: { locale }
        });

        return { locale, count };
      })
    );

    const totalKeys = await prisma.translation.findMany({
      distinct: ['key'],
      select: { key: true }
    });

    return {
      totalKeys: totalKeys.length,
      localeStats: stats,
      supportedLocales: this.SUPPORTED_LOCALES,
      defaultLocale: this.DEFAULT_LOCALE
    };
  }

  /**
   * Invalidate cache for a locale
   */
  private async invalidateCache(locale: string): Promise<void> {
    const cacheKey = `translations:${locale}`;
    await redis.del(cacheKey);
  }

  /**
   * Initialize default translations
   */
  async initializeDefaultTranslations(): Promise<void> {
    const defaultTranslations = [
      // Common
      { key: 'common.loading', es: 'Cargando...', en: 'Loading...' },
      { key: 'common.save', es: 'Guardar', en: 'Save' },
      { key: 'common.cancel', es: 'Cancelar', en: 'Cancel' },
      { key: 'common.delete', es: 'Eliminar', en: 'Delete' },
      { key: 'common.edit', es: 'Editar', en: 'Edit' },
      { key: 'common.create', es: 'Crear', en: 'Create' },
      { key: 'common.search', es: 'Buscar', en: 'Search' },
      { key: 'common.filter', es: 'Filtrar', en: 'Filter' },
      { key: 'common.export', es: 'Exportar', en: 'Export' },
      { key: 'common.import', es: 'Importar', en: 'Import' },

      // Authentication
      { key: 'auth.login', es: 'Iniciar Sesión', en: 'Login' },
      { key: 'auth.logout', es: 'Cerrar Sesión', en: 'Logout' },
      { key: 'auth.register', es: 'Registrarse', en: 'Register' },
      { key: 'auth.forgotPassword', es: '¿Olvidaste tu contraseña?', en: 'Forgot password?' },
      { key: 'auth.resetPassword', es: 'Restablecer Contraseña', en: 'Reset Password' },

      // Courses
      { key: 'course.title', es: 'Título del Curso', en: 'Course Title' },
      { key: 'course.description', es: 'Descripción', en: 'Description' },
      { key: 'course.enroll', es: 'Inscribirse', en: 'Enroll' },
      { key: 'course.continue', es: 'Continuar', en: 'Continue' },
      { key: 'course.completed', es: 'Completado', en: 'Completed' },

      // Quiz
      { key: 'quiz.submit', es: 'Enviar Respuestas', en: 'Submit Answers' },
      { key: 'quiz.retry', es: 'Reintentar', en: 'Retry' },
      { key: 'quiz.passed', es: 'Aprobado', en: 'Passed' },
      { key: 'quiz.failed', es: 'No Aprobado', en: 'Failed' },

      // Messages
      { key: 'message.success', es: 'Operación exitosa', en: 'Operation successful' },
      { key: 'message.error', es: 'Ha ocurrido un error', en: 'An error occurred' },
      { key: 'message.warning', es: 'Advertencia', en: 'Warning' },
      { key: 'message.info', es: 'Información', en: 'Information' }
    ];

    // Insert default translations
    for (const trans of defaultTranslations) {
      const { key, es, en } = trans;

      // Spanish
      await prisma.translation.upsert({
        where: { key_locale: { key, locale: 'es' } },
        update: { value: es },
        create: { key, locale: 'es', value: es }
      });

      // English
      await prisma.translation.upsert({
        where: { key_locale: { key, locale: 'en' } },
        update: { value: en },
        create: { key, locale: 'en', value: en }
      });
    }

    // Clear all caches
    await Promise.all(this.SUPPORTED_LOCALES.map(locale => this.invalidateCache(locale)));
  }
}

export default new TranslationService();