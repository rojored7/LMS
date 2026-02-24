/**
 * Types for the Executor Service
 */

export type Language = 'python' | 'javascript' | 'bash';

export type TestType = 'exact' | 'contains' | 'regex';

export interface Test {
  input?: string;
  expectedOutput: string;
  type: TestType;
  description?: string;
}

export interface ExecuteRequest {
  code: string;
  language: Language;
  tests?: Test[];
  timeout?: number;
  userId?: string;
}

export interface TestResult {
  test: Test;
  passed: boolean;
  actualOutput: string;
  error?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  passed: boolean;
  testsResults?: TestResult[];
  error?: string;
}

export interface ContainerConfig {
  image: string;
  memoryLimit: string;
  cpuLimit: string;
  timeout: number;
  networkDisabled: boolean;
}

export interface LanguageConfig {
  image: string;
  command: string[];
  fileExtension: string;
  fileName: string;
}

export interface RateLimitInfo {
  userId: string;
  count: number;
  resetAt: number;
}
