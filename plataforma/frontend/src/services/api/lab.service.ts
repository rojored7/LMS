import api from '../api';
import type {
  Lab,
  LabSubmissionResult,
  LabSubmissionSummary,
  GradeSubmissionPayload,
} from '../../types/lab';

export type { Lab, LabSubmissionResult, LabSubmissionSummary, GradeSubmissionPayload };

export const getLab = async (labId: string): Promise<Lab> => {
  const response = await api.get(`/labs/${labId}`);
  return (response as any).data || response;
};

export const submitLab = async (labId: string, code: string): Promise<LabSubmissionResult> => {
  const response = await api.post(`/labs/${labId}/submit`, { code });
  return (response as any).data || response;
};

export const submitDeliverableLab = async (
  labId: string,
  responseText: string
): Promise<LabSubmissionResult> => {
  const response = await api.post(`/labs/${labId}/submit-deliverable`, {
    response_text: responseText,
  });
  return (response as any).data || response;
};

export const gradeSubmission = async (
  submissionId: string,
  payload: GradeSubmissionPayload
): Promise<LabSubmissionSummary> => {
  const response = await api.put(`/labs/submissions/${submissionId}/grade`, payload);
  return (response as any).data || response;
};

export const getLabSubmissions = async (labId: string): Promise<LabSubmissionSummary[]> => {
  const response = await api.get(`/labs/${labId}/submissions`);
  return (response as any).data || response;
};

export const checkExecutorHealth = async (): Promise<{ executorAvailable: boolean }> => {
  const response = await api.get('/labs/executor/health');
  return (response as any).data || response;
};

export const completeLabManual = async (labId: string): Promise<LabSubmissionResult> => {
  const response = await api.post(`/labs/${labId}/complete`);
  return (response as any).data || response;
};

export default {
  getLab,
  submitLab,
  submitDeliverableLab,
  gradeSubmission,
  getLabSubmissions,
  checkExecutorHealth,
  completeLabManual,
};
