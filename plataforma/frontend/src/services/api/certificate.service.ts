/**
 * Certificate Service
 * API client for certificate generation and management
 */

import api from '../api';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateUrl: string | null;
  issuedAt: string;
  verificationCode: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: Certificate;
  message: string;
}

/**
 * Generate a certificate for a completed course
 * @param courseId - Course ID
 */
export const generateCertificate = async (courseId: string): Promise<Certificate> => {
  const response: any = await api.post('/certificates/generate', { courseId });
  return response?.data ?? response;
};

/**
 * Get my certificates
 */
export const getMyCertificates = async (): Promise<Certificate[]> => {
  const response: any = await api.get('/certificates');
  return response?.data ?? response ?? [];
};

/**
 * Download certificate as PDF
 * @param certificateId - Certificate ID
 */
export const downloadCertificate = async (certificateId: string): Promise<Blob> => {
  return await api.get(`/certificates/${certificateId}/download`, {
    responseType: 'blob',
  }) as unknown as Blob;
};

/**
 * Verify a certificate by verification code (public endpoint)
 * @param verificationCode - Certificate verification code
 */
export const verifyCertificate = async (
  verificationCode: string
): Promise<CertificateVerification> => {
  const response: any = await api.get(`/certificates/verify/${verificationCode}`);
  return response?.data ?? response;
};

/**
 * Get certificate detail
 * @param certificateId - Certificate ID
 */
export const getCertificate = async (certificateId: string): Promise<Certificate> => {
  const response: any = await api.get(`/certificates/${certificateId}`);
  return response?.data ?? response;
};

export default {
  generateCertificate,
  getMyCertificates,
  downloadCertificate,
  verifyCertificate,
  getCertificate,
};
