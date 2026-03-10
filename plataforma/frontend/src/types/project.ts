/**
 * Project Types
 */

export interface Project {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  requirements: string;
  rubric?: string;
  maxFiles: number;
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  dueDate?: string;
  xpReward: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  files: ProjectFile[];
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ProjectFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface SubmissionReview {
  submissionId: string;
  score: number;
  feedback: string;
  status: SubmissionStatus;
}
