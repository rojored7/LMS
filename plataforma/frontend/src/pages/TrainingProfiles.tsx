/**
 * TrainingProfiles Page
 * Manage training profiles (admin only)
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen, Users } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { TrainingProfileForm } from '../components/admin/TrainingProfileForm';
import { useToast } from '../hooks/useToast';
import trainingProfileService, { type TrainingProfile } from '../services/api/trainingProfile.service';
import courseService from '../services/course.service';

export const TrainingProfiles: React.FC = () => {
  const toast = useToast();

  const [profiles, setProfiles] = useState<TrainingProfile[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    profile: TrainingProfile | null;
  }>({ isOpen: false, profile: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesData, coursesResponse] = await Promise.all([
        trainingProfileService.getAllProfiles(),
        courseService.getCourses({ page: 1, limit: 100 }),
      ]);

      setProfiles(profilesData);
      setAvailableCourses(coursesResponse.data?.courses || []);
    } catch (err: any) {
      toast.error('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      if (modalState.profile) {
        await trainingProfileService.updateProfile(modalState.profile.id, data);
        toast.success('Perfil actualizado correctamente');
      } else {
        await trainingProfileService.createProfile(data);
        toast.success('Perfil creado correctamente');
      }

      setModalState({ isOpen: false, profile: null });
      loadData();
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al guardar perfil');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('¿Eliminar este perfil? Esta acción no se puede deshacer.')) return;

    try {
      await trainingProfileService.deleteProfile(profileId);
      toast.success('Perfil eliminado correctamente');
      loadData();
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al eliminar perfil');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Perfiles de Entrenamiento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona rutas de aprendizaje personalizadas
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setModalState({ isOpen: true, profile: null })}
        >
          Crear Perfil
        </Button>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">No hay perfiles creados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile.name}
                  </h3>
                  <code className="text-xs text-gray-500 dark:text-gray-400">
                    {profile.slug}
                  </code>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setModalState({ isOpen: true, profile })}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                {profile.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{profile._count?.courses || 0} cursos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{profile._count?.users || 0} usuarios</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, profile: null })}
        title={modalState.profile ? 'Editar Perfil' : 'Crear Perfil'}
        size="lg"
      >
        <TrainingProfileForm
          profile={modalState.profile}
          availableCourses={availableCourses}
          onSubmit={handleSubmit}
          onCancel={() => setModalState({ isOpen: false, profile: null })}
          isLoading={submitting}
        />
      </Modal>
    </div>
  );
};
