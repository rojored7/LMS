/**
 * Lab Types
 */

export interface Lab {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  instructions: string;
  language: ProgrammingLanguage;
  starterCode: string;
  tests: LabTest[];
  timeLimit?: number; // in seconds
  xpReward: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export enum ProgrammingLanguage {
  PYTHON = 'PYTHON',
  JAVASCRIPT = 'JAVASCRIPT',
  BASH = 'BASH',
}

export interface LabTest {
  id: string;
  labId: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

export interface LabSubmission {
  id: string;
  labId: string;
  userId: string;
  code: string;
  language: ProgrammingLanguage;
  output: string;
  error?: string;
  testResults: TestResult[];
  passed: boolean;
  executionTime: number; // in milliseconds
  submittedAt: string;
}

export interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
}

export interface ExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
}
