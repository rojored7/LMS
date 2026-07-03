export type LabType = 'EXECUTABLE' | 'DELIVERABLE';

export type ProgrammingLanguage = 'python' | 'javascript' | 'bash';

export interface Lab {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  labType: LabType;
  language: ProgrammingLanguage;
  starterCode: string | null;
  solution?: string | null;
  tests: LabTest[] | null;
  hints: string[] | null;
  // DELIVERABLE-only
  responseInstructions: string | null;
  fileRequired: boolean;
  allowedFileTypes: string | null;
}

export interface LabTest {
  input?: string;
  expectedOutput: string;
  type: 'exact' | 'contains' | 'regex';
  description?: string;
}

export interface LabSubmissionResult {
  submissionId?: string;
  passed: boolean | null;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  executionTime?: number;
  error?: string;
  executorError?: boolean;
  manual?: boolean;
  message?: string;
}

export interface LabSubmissionSummary {
  id: string;
  passed: boolean | null;
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  executionTime: number | null;
  code: string;
  language: string;
  responseText: string | null;
  filePath: string | null;
  score: number | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  submittedAt: string | null;
}

export interface GradeSubmissionPayload {
  passed: boolean;
  feedback?: string;
  score?: number;
}
