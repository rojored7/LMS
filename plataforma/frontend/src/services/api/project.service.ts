/**
 * Project Service
 * API client for project submission and grading operations
 */

import api from '../api';
import type { ProjectSubmission, SubmissionStatus } from '../../types/project';

/**
 * Submit a project with files
 * @param projectId - Project ID
 * @param files - Array of files to upload
 * @param description - Submission description
 */
export const submitProject = async (
  projectId: string,
  files: File[],
  description: string
): Promise<ProjectSubmission> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('description', description);

  const response = await api.post(`/projects/${projectId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Get my project submissions
 */
export const getMySubmissions = async (): Promise<ProjectSubmission[]> => {
  const response = await api.get('/projects/my-submissions');
  return response.data;
};

/**
 * Get all submissions for a project (instructor/admin only)
 * @param projectId - Project ID
 */
export const getProjectSubmissions = async (projectId: string): Promise<ProjectSubmission[]> => {
  const response = await api.get(`/projects/${projectId}/submissions`);
  return response.data;
};

/**
 * Grade a project submission
 * @param submissionId - Submission ID
 * @param score - Score (0-100)
 * @param feedback - Feedback text
 * @param status - Submission status
 */
export const gradeSubmission = async (
  submissionId: string,
  score: number,
  feedback: string,
  status: SubmissionStatus
): Promise<ProjectSubmission> => {
  const response = await api.put(`/projects/submissions/${submissionId}/grade`, {
    score,
    feedback,
    status,
  });
  return response.data;
};

/**
 * Get submission detail
 * @param submissionId - Submission ID
 */
export const getSubmissionDetail = async (submissionId: string): Promise<ProjectSubmission> => {
  const response = await api.get(`/projects/submissions/${submissionId}`);
  return response.data;
};

/**
 * Get my submission for a specific project
 * @param projectId - Project ID
 */
export const getMySubmission = async (projectId: string): Promise<ProjectSubmission | null> => {
  const response = await api.get(`/projects/${projectId}/my-submission`);
  return response.data;
};

export default {
  submitProject,
  getMySubmissions,
  getProjectSubmissions,
  gradeSubmission,
  getSubmissionDetail,
  getMySubmission,
};
