/**
 * Lab Service
 * API client for lab-related operations
 */

import api from '../api';

export interface LabTestCase {
  description: string;
  input: string;
  expectedOutput: string;
}

export interface LabSubmissionSummary {
  id: string;
  passed: boolean;
  score: number;
  submittedAt: Date;
  executionTime: number;
}

export interface Lab {
  id: string;
  title: string;
  description: string;
  language: 'python' | 'javascript' | 'bash';
  starterCode: string;
  testCases: LabTestCase[];
  passingScore: number;
  timeLimit: number;
  submissions: LabSubmissionSummary[];
  hasPassed: boolean;
  bestScore: number;
}

export interface LabTestResult {
  testCase: string;
  passed: boolean;
  output: string;
  expectedOutput: string;
  error?: string;
  executionTime: number;
}

export interface LabSubmissionResult {
  submissionId: string;
  passed: boolean;
  score: number;
  passingScore: number;
  results: LabTestResult[];
  passedTests: number;
  totalTests: number;
}

export interface LabSubmissionDetail {
  submissionId: string;
  code: string;
  passed: boolean;
  score: number;
  submittedAt: Date;
  executionTime: number;
  lab: {
    id: string;
    title: string;
    language: string;
    passingScore: number;
  };
  results: LabTestResult[];
}

/**
 * Get a lab with details
 * @param labId - Lab ID
 */
export const getLab = async (labId: string): Promise<Lab> => {
  const response = await api.get(`/labs/${labId}`);
  return response.data;
};

/**
 * Submit a lab solution
 * @param labId - Lab ID
 * @param code - User's code
 */
export const submitLab = async (
  labId: string,
  code: string,
  language: string = 'python'
): Promise<LabSubmissionResult> => {
  const response = await api.post(`/labs/${labId}/submit`, { code, language });
  return (response as any).data;
};

/**
 * Get all submissions for a lab
 * @param labId - Lab ID
 */
export const getLabSubmissions = async (labId: string): Promise<LabSubmissionSummary[]> => {
  const response = await api.get(`/labs/${labId}/submissions`);
  return response.data;
};

/**
 * Get lab submission details
 * @param submissionId - Submission ID
 */
export const getLabSubmission = async (submissionId: string): Promise<LabSubmissionDetail> => {
  const response = await api.get(`/labs/submissions/${submissionId}`);
  return response.data;
};

export default {
  getLab,
  submitLab,
  getLabSubmissions,
  getLabSubmission,
};
