/**
 * SubmissionsReview Page
 * Instructor/admin page for reviewing and grading project submissions
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Check, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SubmissionCard } from '../components/projects/SubmissionCard';
import { useToast } from '../hooks/useToast';
import projectService from '../services/api/project.service';
import type { ProjectSubmission, SubmissionStatus } from '../types/project';

export const SubmissionsReview: React.FC = () => {
  const { courseId, projectId } = useParams<{ courseId: string; projectId: string }>();
  const toast = useToast();

  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [gradingState, setGradingState] = useState<{
    isOpen: boolean;
    submission: ProjectSubmission | null;
  }>({ isOpen: false, submission: null });
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: '',
    status: 'APPROVED' as SubmissionStatus,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadSubmissions();
    }
  }, [projectId]);

  const loadSubmissions = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await projectService.getProjectSubmissions(projectId);
      setSubmissions(data);
    } catch (err: any) {
      toast.error('Error al cargar entregas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!gradingState.submission) return;

    if (gradeData.score < 0 || gradeData.score > 100) {
      toast.error('La calificación debe estar entre 0 y 100');
      return;
    }

    if (!gradeData.feedback.trim()) {
      toast.error('Debes agregar retroalimentación');
      return;
    }

    try {
      setSubmitting(true);
      await projectService.gradeSubmission(
        gradingState.submission.id,
        gradeData.score,
        gradeData.feedback,
        gradeData.status
      );

      toast.success('Entrega calificada correctamente');
      setGradingState({ isOpen: false, submission: null });
      setGradeData({ score: 0, feedback: '', status: 'APPROVED' });
      loadSubmissions();
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al calificar');
    } finally {
      setSubmitting(false);
    }
  };

  const openGradingModal = (submission: ProjectSubmission) => {
    setGradingState({ isOpen: true, submission });
    setGradeData({
      score: submission.score || 0,
      feedback: submission.feedback || '',
      status: submission.status || 'APPROVED',
    });
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
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
          Revisar Entregas del Proyecto
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Califica y proporciona retroalimentación a los estudiantes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por estado:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="ALL">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="REVIEWING">En Revisión</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>

          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            {filteredSubmissions.length} de {submissions.length} entregas
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {submissions.length === 0
              ? 'No hay entregas todavía'
              : 'No hay entregas con este filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onViewDetails={() => openGradingModal(submission)}
              showUserInfo={true}
            />
          ))}
        </div>
      )}

      {/* Grading Modal */}
      <Modal
        isOpen={gradingState.isOpen}
        onClose={() => setGradingState({ isOpen: false, submission: null })}
        title="Calificar Entrega"
        size="lg"
      >
        {gradingState.submission && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {gradingState.submission.user?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gradingState.submission.user?.email}
              </p>
            </div>

            {/* Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Calificación (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={gradeData.score}
                onChange={(e) =>
                  setGradeData({ ...gradeData, score: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Retroalimentación *
              </label>
              <textarea
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Proporciona comentarios detallados sobre el trabajo del estudiante..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="APPROVED"
                    checked={gradeData.status === 'APPROVED'}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, status: e.target.value as SubmissionStatus })
                    }
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Aprobar</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="REJECTED"
                    checked={gradeData.status === 'REJECTED'}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, status: e.target.value as SubmissionStatus })
                    }
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Rechazar</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setGradingState({ isOpen: false, submission: null })}
                className="flex-1"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                onClick={handleGradeSubmit}
                isLoading={submitting}
                leftIcon={<Check className="w-5 h-5" />}
                className="flex-1"
              >
                Guardar Calificación
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
