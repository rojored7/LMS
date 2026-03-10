/**
 * ProjectSubmission Page
 * Page for submitting project files
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '../components/common/Button';
import { FileUploader } from '../components/projects/FileUploader';
import { SubmissionCard } from '../components/projects/SubmissionCard';
import { useToast } from '../hooks/useToast';
import projectService from '../services/api/project.service';
import type { ProjectSubmission } from '../types/project';

export const ProjectSubmission: React.FC = () => {
  const { courseId, projectId } = useParams<{ courseId: string; projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [mySubmission, setMySubmission] = useState<ProjectSubmission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadMySubmission();
    }
  }, [projectId]);

  const loadMySubmission = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const submission = await projectService.getMySubmission(projectId);
      setMySubmission(submission);
    } catch (err: any) {
      // It's OK if there's no submission yet
      console.log('No previous submission found');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!projectId) return;

    if (selectedFiles.length === 0) {
      toast.error('Debes seleccionar al menos un archivo');
      return;
    }

    if (!description.trim()) {
      toast.error('Debes agregar una descripción');
      return;
    }

    try {
      setSubmitting(true);
      await projectService.submitProject(projectId, selectedFiles, description);
      toast.success('Proyecto enviado correctamente');

      // Reload submission
      await loadMySubmission();

      // Clear form
      setSelectedFiles([]);
      setDescription('');
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al enviar proyecto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        to={`/courses/${courseId}/learn`}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al curso
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Enviar Proyecto
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sube tus archivos y agrega una descripción de tu proyecto
        </p>
      </div>

      {/* Previous Submission */}
      {mySubmission && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Tu Envío Anterior
          </h2>
          <SubmissionCard submission={mySubmission} />
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {mySubmission ? 'Nuevo Envío' : 'Primer Envío'}
        </h2>

        {/* File Uploader */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Archivos del Proyecto *
          </label>
          <FileUploader
            onFilesSelected={handleFilesSelected}
            selectedFiles={selectedFiles}
            onFileRemove={handleFileRemove}
            maxFiles={5}
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Descripción de la Entrega *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describe lo que has implementado, decisiones de diseño, dificultades encontradas, etc..."
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description.length} caracteres
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            leftIcon={<Send className="w-5 h-5" />}
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={selectedFiles.length === 0 || !description.trim()}
          >
            Enviar Proyecto
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Instrucciones:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Asegúrate de incluir todos los archivos necesarios</li>
          <li>La descripción debe explicar claramente tu solución</li>
          <li>Puedes enviar múltiples veces, se evaluará el último envío</li>
          <li>Revisa las rúbricas del proyecto antes de enviar</li>
        </ul>
      </div>
    </div>
  );
};
