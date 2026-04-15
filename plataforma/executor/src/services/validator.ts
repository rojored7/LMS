import { Test, TestResult } from '../types';
import { logger } from '../utils/logger';

/**
 * Validator service for comparing execution output against expected test results
 */
export class Validator {
  /**
   * Validates output against a collection of tests
   */
  validate(output: string, tests: Test[]): TestResult[] {
    logger.debug('Starting validation', { testsCount: tests.length });

    const results: TestResult[] = tests.map((test) => {
      return this.validateSingleTest(output, test);
    });

    const passedCount = results.filter((r) => r.passed).length;
    logger.info('Validation completed', {
      total: tests.length,
      passed: passedCount,
      failed: tests.length - passedCount,
    });

    return results;
  }

  /**
   * Validates output against a single test
   */
  private validateSingleTest(output: string, test: Test): TestResult {
    try {
      const normalizedOutput = this.normalizeOutput(output);
      const normalizedExpected = this.normalizeOutput(test.expectedOutput);

      let passed = false;
      let error: string | undefined;

      switch (test.type) {
        case 'exact':
          passed = this.validateExact(normalizedOutput, normalizedExpected);
          if (!passed) {
            error = `Expected exact match. Got: "${normalizedOutput}", Expected: "${normalizedExpected}"`;
          }
          break;

        case 'contains':
          passed = this.validateContains(normalizedOutput, normalizedExpected);
          if (!passed) {
            error = `Expected output to contain: "${normalizedExpected}"`;
          }
          break;

        case 'regex':
          const regexResult = this.validateRegex(normalizedOutput, test.expectedOutput);
          passed = regexResult.passed;
          error = regexResult.error;
          break;

        default:
          passed = false;
          error = `Unknown test type: ${test.type}`;
      }

      logger.debug('Test validation result', {
        type: test.type,
        passed,
        error,
      });

      return {
        test,
        passed,
        actualOutput: normalizedOutput,
        error,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
      logger.error('Validation error', { error: errorMessage, test });

      return {
        test,
        passed: false,
        actualOutput: output,
        error: errorMessage,
      };
    }
  }

  /**
   * Exact match validation
   */
  private validateExact(output: string, expected: string): boolean {
    return output === expected;
  }

  /**
   * Contains validation
   */
  private validateContains(output: string, expected: string): boolean {
    return output.includes(expected);
  }

  /**
   * Regex validation
   */
  private validateRegex(output: string, pattern: string): { passed: boolean; error?: string } {
    const MAX_PATTERN_LENGTH = 200;
    const MAX_OUTPUT_LENGTH = 10000;

    if (pattern.length > MAX_PATTERN_LENGTH) {
      return { passed: false, error: `Regex pattern too long (max ${MAX_PATTERN_LENGTH} chars)` };
    }

    const truncatedOutput =
      output.length > MAX_OUTPUT_LENGTH ? output.substring(0, MAX_OUTPUT_LENGTH) : output;

    try {
      const regex = new RegExp(pattern);
      const passed = regex.test(truncatedOutput);
      return {
        passed,
        error: passed ? undefined : `Output does not match regex pattern: ${pattern}`,
      };
    } catch (err) {
      return {
        passed: false,
        error: `Invalid regex pattern: ${pattern}`,
      };
    }
  }

  /**
   * Normalizes output by trimming whitespace and normalizing line endings
   */
  private normalizeOutput(output: string): string {
    return output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
}

// Export singleton instance
export const validator = new Validator();
