/**
 * useCertificates Hook
 * Manages user certificates with generation and download
 */

import { useState, useEffect, useCallback } from 'react';
import certificateService, { type Certificate } from '../services/api/certificate.service';

export interface UseCertificatesReturn {
  certificates: Certificate[];
  loading: boolean;
  error: string | null;
  generateCertificate: (courseId: string) => Promise<Certificate>;
  downloadCertificate: (certificateId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing user certificates
 */
export const useCertificates = (): UseCertificatesReturn => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user certificates from API
   */
  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getMyCertificates();
      setCertificates(data);
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      setError(err?.error?.message || 'Error al cargar certificados');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  /**
   * Generate certificate for a completed course
   */
  const generateCertificate = useCallback(
    async (courseId: string): Promise<Certificate> => {
      try {
        const newCertificate = await certificateService.generateCertificate(courseId);

        // Add to local state
        setCertificates((prev) => [newCertificate, ...prev]);

        return newCertificate;
      } catch (err: any) {
        console.error('Error generating certificate:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Download certificate as PDF
   */
  const downloadCertificate = useCallback(async (certificateId: string) => {
    try {
      const blob = await certificateService.downloadCertificate(certificateId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading certificate:', err);
      throw err;
    }
  }, []);

  return {
    certificates,
    loading,
    error,
    generateCertificate,
    downloadCertificate,
    refresh: fetchCertificates,
  };
};
