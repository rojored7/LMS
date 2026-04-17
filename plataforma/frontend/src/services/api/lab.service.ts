/**
 * Lab Service
 * API client for lab-related operations
 */

import api from '../api';

export interface Lab {
  id: string;
  title: string;
  description: string;
  language: string;
  starterCode: string;
  solution: string | null;
  tests: Record<string, unknown> | null;
  hints: string[] | null;
  moduleId: string;
}

export interface LabSubmissionResult {
  submissionId?: string;
  passed: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  executionTime?: number;
  error?: string;
  executorError?: boolean;
  manual?: boolean;
}

export interface LabSubmissionSummary {
  id: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  code: string;
  language: string;
}

/**
 * Get a lab with details
 */
export const getLab = async (labId: string): Promise<Lab> => {
  const response = await api.get(`/labs/${labId}`);
  return (response as any).data || response;
};

/**
 * Submit a lab solution
 */
export const submitLab = async (labId: string, code: string): Promise<LabSubmissionResult> => {
  const response = await api.post(`/labs/${labId}/submit`, { code });
  return (response as any).data || response;
};

/**
 * Get all submissions for a lab
 */
export const getLabSubmissions = async (labId: string): Promise<LabSubmissionSummary[]> => {
  const response = await api.get(`/labs/${labId}/submissions`);
  return (response as any).data || response;
};

/**
 * Check executor service health
 */
export const checkExecutorHealth = async (): Promise<{ executorAvailable: boolean }> => {
  const response = await api.get('/labs/executor/health');
  return (response as any).data || response;
};

/**
 * Mark lab as completed manually
 */
export const completeLabManual = async (labId: string): Promise<LabSubmissionResult> => {
  const response = await api.post(`/labs/${labId}/complete`);
  return (response as any).data || response;
};

export default {
  getLab,
  submitLab,
  getLabSubmissions,
  checkExecutorHealth,
  completeLabManual,
};
