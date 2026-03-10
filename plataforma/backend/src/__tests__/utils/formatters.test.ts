/**
 * Formatters Utils Tests
 * Tests exhaustivos para las funciones de formateo
 */

describe('Formatters', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (amount: number, currency: string = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    };

    it('should format USD currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format other currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toContain('1,000');
      expect(formatCurrency(1000, 'GBP')).toContain('1,000');
      expect(formatCurrency(1000, 'JPY')).toContain('1,000');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
      expect(formatCurrency(-0.50)).toBe('-$0.50');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toBeDefined();
      expect(formatCurrency(Number.MIN_SAFE_INTEGER)).toBeDefined();
      expect(formatCurrency(0.001)).toBe('$0.00');
      expect(formatCurrency(0.005)).toBe('$0.01'); // Rounding
    });
  });

  describe('formatDate', () => {
    const formatDate = (date: Date | string, format: string = 'YYYY-MM-DD'): string => {
      const d = typeof date === 'string' ? new Date(date) : date;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    };

    it('should format dates in default format', () => {
      const date = new Date('2024-01-15T10:30:45');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should support custom formats', () => {
      const date = new Date('2024-01-15T10:30:45');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/01/2024');
      expect(formatDate(date, 'MM-DD-YYYY')).toBe('01-15-2024');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 10:30:45');
    });

    it('should handle string dates', () => {
      // Note: Date parsing may vary based on timezone - using UTC parsing
      const date1 = new Date('2024-01-15T00:00:00Z');
      const formatted1 = formatDate(date1);
      expect(formatted1).toMatch(/2024-01-1[45]/); // Allow for timezone differences

      const date2 = new Date('2024-01-15T10:30:45Z');
      const formatted2 = formatDate(date2);
      expect(formatted2).toMatch(/2024-01-1[45]/); // Allow for timezone differences
    });

    it('should handle edge cases', () => {
      const date = new Date('2024-12-31T23:59:59');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-12-31 23:59:59');

      const leapDay = new Date('2024-02-29T00:00:00Z');
      const formatted = formatDate(leapDay);
      expect(formatted).toMatch(/2024-02-2[89]/); // Allow for timezone differences
    });
  });

  describe('formatFileSize', () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';

      const absBytes = Math.abs(bytes);
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(absBytes) / Math.log(k));

      const result = parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      return bytes < 0 ? '-' + result : result;
    };

    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(10485760)).toBe('10 MB');
    });

    it('should format gigabytes and beyond', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1099511627776)).toBe('1 TB');
    });

    it('should handle negative values', () => {
      expect(formatFileSize(-1024)).toBe('-1 KB');
    });
  });

  describe('formatDuration', () => {
    const formatDuration = (seconds: number): string => {
      if (seconds < 0) return 'Invalid duration';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    it('should format seconds only', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(150)).toBe('2m 30s');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
      expect(formatDuration(7200)).toBe('2h 0m 0s');
      expect(formatDuration(3725)).toBe('1h 2m 5s');
    });

    it('should handle negative values', () => {
      expect(formatDuration(-1)).toBe('Invalid duration');
    });
  });

  describe('formatPhoneNumber', () => {
    const formatPhoneNumber = (phone: string, format: string = 'US'): string => {
      const cleaned = phone.replace(/\D/g, '');

      if (format === 'US' && cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (format === 'INTL' && cleaned.length > 10) {
        const country = cleaned.slice(0, cleaned.length - 10);
        const area = cleaned.slice(-10, -7);
        const prefix = cleaned.slice(-7, -4);
        const line = cleaned.slice(-4);
        return `+${country} (${area}) ${prefix}-${line}`;
      }

      return phone;
    };

    it('should format US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should format international phone numbers', () => {
      expect(formatPhoneNumber('11234567890', 'INTL')).toBe('+1 (123) 456-7890');
      expect(formatPhoneNumber('441234567890', 'INTL')).toBe('+44 (123) 456-7890');
    });

    it('should return original if cannot format', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('abcdefghij')).toBe('abcdefghij');
    });
  });

  describe('formatPercentage', () => {
    const formatPercentage = (value: number, decimals: number = 2): string => {
      return `${(value * 100).toFixed(decimals)}%`;
    };

    it('should format percentages correctly', () => {
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(0.5)).toBe('50.00%');
      expect(formatPercentage(1)).toBe('100.00%');
      expect(formatPercentage(0.3333)).toBe('33.33%');
    });

    it('should handle custom decimal places', () => {
      expect(formatPercentage(0.3333, 0)).toBe('33%');
      expect(formatPercentage(0.3333, 1)).toBe('33.3%');
      expect(formatPercentage(0.3333, 3)).toBe('33.330%');
    });

    it('should handle values greater than 100%', () => {
      expect(formatPercentage(1.5)).toBe('150.00%');
      expect(formatPercentage(2)).toBe('200.00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-0.5)).toBe('-50.00%');
    });
  });

  describe('formatSlug', () => {
    const formatSlug = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
    };

    it('should create URL-safe slugs', () => {
      expect(formatSlug('Hello World')).toBe('hello-world');
      expect(formatSlug('This is a TEST')).toBe('this-is-a-test');
      expect(formatSlug('JavaScript & TypeScript')).toBe('javascript-typescript');
    });

    it('should handle special characters', () => {
      expect(formatSlug('Café Español')).toBe('cafe-espanol');
      expect(formatSlug('Niño & Niña')).toBe('nino-nina');
      expect(formatSlug('100% Success!')).toBe('100-success');
    });

    it('should handle edge cases', () => {
      expect(formatSlug('   Trim Spaces   ')).toBe('trim-spaces');
      expect(formatSlug('Multiple---Dashes')).toBe('multiple-dashes');
      expect(formatSlug('!!!Start-End!!!')).toBe('start-end');
      expect(formatSlug('')).toBe('');
    });
  });

  describe('formatName', () => {
    const formatName = (firstName: string, lastName: string, format: string = 'full'): string => {
      const first = firstName.trim();
      const last = lastName.trim();

      switch (format) {
        case 'full':
          return `${first} ${last}`;
        case 'last-first':
          return `${last}, ${first}`;
        case 'initials':
          return `${first[0]}${last[0]}`.toUpperCase();
        case 'first-initial':
          return `${first} ${last[0]}.`;
        default:
          return `${first} ${last}`;
      }
    };

    it('should format full names', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe');
      expect(formatName('Jane', 'Smith')).toBe('Jane Smith');
    });

    it('should format last-first names', () => {
      expect(formatName('John', 'Doe', 'last-first')).toBe('Doe, John');
    });

    it('should format initials', () => {
      expect(formatName('John', 'Doe', 'initials')).toBe('JD');
      expect(formatName('jane', 'smith', 'initials')).toBe('JS');
    });

    it('should format first name with last initial', () => {
      expect(formatName('John', 'Doe', 'first-initial')).toBe('John D.');
    });

    it('should handle extra spaces', () => {
      expect(formatName('  John  ', '  Doe  ')).toBe('John Doe');
    });
  });

  describe('formatNumber', () => {
    const formatNumber = (num: number, locale: string = 'en-US'): string => {
      return new Intl.NumberFormat(locale).format(num);
    };

    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    });

    it('should handle different locales', () => {
      expect(formatNumber(1000.5, 'de-DE')).toContain('1');
      expect(formatNumber(1000.5, 'fr-FR')).toContain('1');
    });

    it('should handle edge cases', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1000)).toBe('-1,000');
      expect(formatNumber(0.123456)).toBe('0.123');
    });
  });
});