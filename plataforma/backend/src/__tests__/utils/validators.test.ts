/**
 * Validators Utils Tests
 * Tests exhaustivos para las funciones de validación
 */

describe('Validators', () => {
  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
        'FirstLast@example.org',
        'user@subdomain.example.com',
        '1234567890@example.com',
        '_user@example.com',
        'user-name@example.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
        'user@example',
        'user @example.com',
        'user@example .com',
        'user@@example.com',
        'user.example.com',
        '',
        ' ',
        'user@',
        '@',
        'user@example..com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true);
      expect(validateEmail('very.long.email.address@very.long.domain.name.com')).toBe(true);
      expect(validateEmail('user@123.456.789.012')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (password.length < 8) errors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
      if (!/[0-9]/.test(password)) errors.push('Password must contain number');
      if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');

      return {
        valid: errors.length === 0,
        errors
      };
    };

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'Test123!@#',
        'Abcd1234!',
        'P@ssw0rd123',
        'Complex!Pass1'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: 'weak', expectedErrors: 4 },
        { password: 'NoNumber!', expectedErrors: 1 },
        { password: 'nouppercase1!', expectedErrors: 1 },
        { password: 'NOLOWERCASE1!', expectedErrors: 1 },
        { password: 'NoSpecial1', expectedErrors: 1 },
        { password: 'Short1!', expectedErrors: 1 },
        { password: '', expectedErrors: 5 },
        { password: '12345678', expectedErrors: 3 },
        { password: 'password', expectedErrors: 3 }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(expectedErrors);
      });
    });

    it('should provide specific error messages', () => {
      const result = validatePassword('weak');
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain uppercase letter');
      expect(result.errors).toContain('Password must contain number');
      expect(result.errors).toContain('Password must contain special character');
    });
  });

  describe('validateURL', () => {
    const validateURL = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('should accept valid URLs', () => {
      const validURLs = [
        'http://example.com',
        'https://example.com',
        'https://www.example.com',
        'https://subdomain.example.com',
        'https://example.com/path',
        'https://example.com/path/to/resource',
        'https://example.com?query=value',
        'https://example.com#fragment',
        'https://example.com:8080',
        'ftp://example.com',
        'http://localhost',
        'http://127.0.0.1',
        'http://[::1]'
      ];

      validURLs.forEach(url => {
        expect(validateURL(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidURLs = [
        'not a url',
        'example.com',
        '//example.com',
        'http://',
        'http://.',
        'http://..',
        'http://../',
        'http://?',
        'http://??',
        'http://??/',
        'http://#',
        'http://##',
        'http://##/',
        'http:// should fail',
        '',
        ' ',
        'javascript:alert(1)'
      ];

      invalidURLs.forEach(url => {
        expect(validateURL(url)).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    const validatePhoneNumber = (phone: string): boolean => {
      // International format: +1234567890 or with spaces/dashes
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    };

    it('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+1 234 567 890',
        '+1-234-567-890',
        '+1 (234) 567-890',
        '1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '123.456.7890',
        '123 456 7890'
      ];

      validPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc',
        '123',
        '',
        ' ',
        'phone',
        '+++123',
        '12-34-56',
        '@1234567890'
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('validateDate', () => {
    const validateDate = (dateStr: string): boolean => {
      const date = new Date(dateStr);
      return date instanceof Date && !isNaN(date.getTime());
    };

    it('should accept valid date formats', () => {
      const validDates = [
        '2024-01-01',
        '2024-12-31',
        '2024/01/01',
        '01/01/2024',
        '2024-01-01T00:00:00',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00.000Z',
        'January 1, 2024',
        '1 Jan 2024',
        '2024-01-01 10:30:00'
      ];

      validDates.forEach(date => {
        expect(validateDate(date)).toBe(true);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        'not a date',
        '2024-13-01',
        '2024-00-01',
        '2024-01-32',
        '2024/13/01',
        '',
        ' ',
        'abc',
        '99999999999999999'
      ];

      invalidDates.forEach(date => {
        expect(validateDate(date)).toBe(false);
      });
    });
  });

  describe('validateUUID', () => {
    const validateUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    it('should accept valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // Missing character
        '123e4567-e89b-12d3-a456-4266141740000', // Extra character
        '123e4567-e89b-62d3-a456-426614174000', // Invalid version
        '123e4567-e89b-12d3-c456-426614174000', // Invalid variant
        '',
        ' ',
        '00000000-0000-0000-0000-000000000000' // Technically valid but often rejected
      ];

      invalidUUIDs.forEach(uuid => {
        if (uuid === '00000000-0000-0000-0000-000000000000') {
          // This is actually a valid UUID (nil UUID)
          expect(validateUUID(uuid)).toBe(false); // Depends on implementation
        } else {
          expect(validateUUID(uuid)).toBe(false);
        }
      });
    });
  });

  describe('validateCreditCard', () => {
    const validateCreditCard = (cardNumber: string): boolean => {
      // Remove spaces and dashes
      const cleaned = cardNumber.replace(/[\s-]/g, '');

      // Check if it's all digits
      if (!/^\d+$/.test(cleaned)) return false;

      // Luhn algorithm
      let sum = 0;
      let isEven = false;

      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      return sum % 10 === 0;
    };

    it('should validate credit card numbers using Luhn algorithm', () => {
      const validCards = [
        '4532015112830366', // Visa
        '5425233430109903', // MasterCard
        '374245455400126',  // American Express
        '6011000991300009', // Discover
        '4532-0151-1283-0366', // With dashes
        '4532 0151 1283 0366'  // With spaces
      ];

      validCards.forEach(card => {
        expect(validateCreditCard(card)).toBe(true);
      });
    });

    it('should reject invalid credit card numbers', () => {
      const invalidCards = [
        '4532015112830367', // Invalid checksum
        '1234567890123456', // Random numbers
        'abcd1234567890ab', // Contains letters
        '',
        ' ',
        '123',
        '0000000000000000'
      ];

      invalidCards.forEach(card => {
        expect(validateCreditCard(card)).toBe(false);
      });
    });
  });

  describe('validateIPAddress', () => {
    const validateIPv4 = (ip: string): boolean => {
      const parts = ip.split('.');
      if (parts.length !== 4) return false;

      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255 && part === num.toString();
      });
    };

    const validateIPv6 = (ip: string): boolean => {
      const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
      return ipv6Regex.test(ip);
    };

    it('should validate IPv4 addresses', () => {
      const validIPv4 = [
        '192.168.1.1',
        '10.0.0.0',
        '172.16.0.1',
        '8.8.8.8',
        '255.255.255.255',
        '0.0.0.0',
        '127.0.0.1'
      ];

      validIPv4.forEach(ip => {
        expect(validateIPv4(ip)).toBe(true);
      });
    });

    it('should reject invalid IPv4 addresses', () => {
      const invalidIPv4 = [
        '256.1.1.1',
        '1.1.1',
        '1.1.1.1.1',
        'a.b.c.d',
        '192.168.1.',
        '192.168..1',
        '',
        ' ',
        '192.168.1.01', // Leading zeros
        '192.168.1.-1'
      ];

      invalidIPv4.forEach(ip => {
        expect(validateIPv4(ip)).toBe(false);
      });
    });

    it('should validate IPv6 addresses', () => {
      const validIPv6 = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '2001:db8:85a3::8a2e:370:7334',
        '::1',
        '::',
        'fe80::',
        '::ffff:192.0.2.1'
      ];

      validIPv6.forEach(ip => {
        expect(validateIPv6(ip)).toBe(true);
      });
    });
  });

  describe('sanitizeInput', () => {
    const sanitizeHTML = (input: string): string => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    const sanitizeSQL = (input: string): string => {
      return input
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
    };

    it('should sanitize HTML input', () => {
      const dangerous = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHTML(dangerous);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should sanitize SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeSQL(sqlInjection);

      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
      expect(sanitized).not.toContain(';');
    });

    it('should preserve safe input', () => {
      const safeInput = 'This is a normal string with numbers 123';

      expect(sanitizeHTML(safeInput)).toBe(safeInput);
      expect(sanitizeSQL(safeInput)).toBe(safeInput);
    });
  });
});