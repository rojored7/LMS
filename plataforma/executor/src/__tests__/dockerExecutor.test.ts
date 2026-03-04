/**
 * Docker Executor Service Tests
 */

import { dockerExecutor } from '../services/dockerExecutor';
import { ExecuteRequest } from '../types';

describe('DockerExecutor', () => {
  // Increase timeout for Docker operations
  jest.setTimeout(60000);

  describe('Health Check', () => {
    it('should successfully ping Docker daemon', async () => {
      const healthy = await dockerExecutor.healthCheck();
      expect(healthy).toBe(true);
    });
  });

  describe('Python Execution', () => {
    it('should execute simple Python hello world', async () => {
      const request: ExecuteRequest = {
        code: 'print("Hello, World!")',
        language: 'python',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('Hello, World!');
      expect(result.stderr).toBe('');
      expect(result.passed).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle Python syntax errors', async () => {
      const request: ExecuteRequest = {
        code: 'print("missing closing quote)',
        language: 'python',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('SyntaxError');
      expect(result.passed).toBe(false);
    });

    it('should enforce timeout for infinite loops', async () => {
      const request: ExecuteRequest = {
        code: 'while True: pass',
        language: 'python',
        timeout: 3000, // 3 seconds
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.passed).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.executionTime).toBeGreaterThanOrEqual(3000);
    });

    it('should pass test validation with exact match', async () => {
      const request: ExecuteRequest = {
        code: 'print("42")',
        language: 'python',
        tests: [
          {
            expectedOutput: '42',
            type: 'exact',
            description: 'Should output 42',
          },
        ],
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.testsResults).toHaveLength(1);
      expect(result.testsResults![0].passed).toBe(true);
    });

    it('should fail test validation with incorrect output', async () => {
      const request: ExecuteRequest = {
        code: 'print("43")',
        language: 'python',
        tests: [
          {
            expectedOutput: '42',
            type: 'exact',
            description: 'Should output 42',
          },
        ],
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.testsResults).toHaveLength(1);
      expect(result.testsResults![0].passed).toBe(false);
    });
  });

  describe('JavaScript Execution', () => {
    it('should execute simple JavaScript hello world', async () => {
      const request: ExecuteRequest = {
        code: 'console.log("Hello, JavaScript!");',
        language: 'javascript',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('Hello, JavaScript!');
      expect(result.passed).toBe(true);
    });

    it('should handle JavaScript runtime errors', async () => {
      const request: ExecuteRequest = {
        code: 'throw new Error("Test error");',
        language: 'javascript',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Error: Test error');
      expect(result.passed).toBe(false);
    });

    it('should validate JavaScript output with contains test', async () => {
      const request: ExecuteRequest = {
        code: 'console.log("The answer is 42");',
        language: 'javascript',
        tests: [
          {
            expectedOutput: '42',
            type: 'contains',
            description: 'Output should contain 42',
          },
        ],
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.testsResults![0].passed).toBe(true);
    });
  });

  describe('Bash Execution', () => {
    it('should execute simple Bash commands', async () => {
      const request: ExecuteRequest = {
        code: 'echo "Hello, Bash!"',
        language: 'bash',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('Hello, Bash!');
      expect(result.passed).toBe(true);
    });

    it('should handle Bash command not found', async () => {
      const request: ExecuteRequest = {
        code: 'nonexistentcommand',
        language: 'bash',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('not found');
      expect(result.passed).toBe(false);
    });
  });

  describe('Security Tests', () => {
    it('should prevent network access', async () => {
      const request: ExecuteRequest = {
        code: `
import socket
try:
    socket.create_connection(("google.com", 80), timeout=2)
    print("NETWORK_ACCESS_ALLOWED")
except:
    print("NETWORK_BLOCKED")
        `,
        language: 'python',
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.stdout).toContain('NETWORK_BLOCKED');
    });

    it('should enforce memory limits', async () => {
      const request: ExecuteRequest = {
        code: `
import sys
try:
    # Try to allocate 1GB (should fail with 256MB limit)
    data = 'x' * (1024 * 1024 * 1024)
    print("MEMORY_LIMIT_NOT_ENFORCED")
except MemoryError:
    print("MEMORY_LIMIT_ENFORCED")
        `,
        language: 'python',
        timeout: 10000,
      };

      const result = await dockerExecutor.executeCode(request);

      // Should either throw MemoryError or be killed by Docker
      expect(
        result.stdout.includes('MEMORY_LIMIT_ENFORCED') ||
        result.exitCode !== 0
      ).toBe(true);
    });
  });

  describe('Multiple Tests Validation', () => {
    it('should validate multiple test cases', async () => {
      const request: ExecuteRequest = {
        code: `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(5))
print(fibonacci(10))
        `,
        language: 'python',
        tests: [
          {
            expectedOutput: '5',
            type: 'contains',
            description: 'Fibonacci(5) should be 5',
          },
          {
            expectedOutput: '55',
            type: 'contains',
            description: 'Fibonacci(10) should be 55',
          },
        ],
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.testsResults).toHaveLength(2);
      expect(result.testsResults!.every(t => t.passed)).toBe(true);
    });
  });

  describe('Regex Test Validation', () => {
    it('should validate output with regex pattern', async () => {
      const request: ExecuteRequest = {
        code: 'print("Result: 12345")',
        language: 'python',
        tests: [
          {
            expectedOutput: '^Result: \\d+$',
            type: 'regex',
            description: 'Should match pattern with digits',
          },
        ],
      };

      const result = await dockerExecutor.executeCode(request);

      expect(result.exitCode).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.testsResults![0].passed).toBe(true);
    });
  });
});
