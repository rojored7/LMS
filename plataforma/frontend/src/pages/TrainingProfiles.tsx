import React, { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen, ListOrdered } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { TrainingProfileForm } from '../components/admin/TrainingProfileForm';
import { ProfileCoursesPanel } from '../components/admin/ProfileCoursesPanel';
import {
  useProfiles,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
} from '../hooks/useTrainingProfiles';
import { useCourses } from '../hooks/useCourses';
import type {
  TrainingProfile,
  CreateTrainingProfileRequest,
} from '../services/api/trainingProfile.service';

export const TrainingProfiles: React.FC = () => {
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: coursesResponse } = useCourses({ page: 1, limit: 100 });
  const availableCourses = (coursesResponse as any)?.courses || [];

  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();

  const [profileModal, setProfileModal] = useState<{
    isOpen: boolean;
    profile: TrainingProfile | null;
  }>({ isOpen: false, profile: null });

  const [coursesModal, setCoursesModal] = useState<{
    isOpen: boolean;
    profile: TrainingProfile | null;
  }>({ isOpen: false, profile: null });

  const handleSubmit = async (data: CreateTrainingProfileRequest) => {
    if (profileModal.profile) {
      await updateProfile.mutateAsync({ profileId: profileModal.profile.id, data });
    } else {
      await createProfile.mutateAsync(data);
    }
    setProfileModal({ isOpen: false, profile: null });
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Eliminar este perfil? Esta accion no se puede deshacer.')) return;
    await deleteProfile.mutateAsync(profileId);
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
          onClick={() => setProfileModal({ isOpen: true, profile: null })}
        >
          Crear Perfil
        </Button>
      </div>

      {/* Profiles Grid */}
      {isLoading ? (
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
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {profile.color && (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: profile.color }}
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {profile.name}
                    </h3>
                    <code className="text-xs text-gray-500 dark:text-gray-400">{profile.slug}</code>
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setCoursesModal({ isOpen: true, profile })}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="Gestionar cursos"
                    aria-label="Gestionar cursos"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProfileModal({ isOpen: true, profile })}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Editar"
                    aria-label="Editar perfil"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Eliminar"
                    aria-label="Eliminar perfil"
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
              <div className="flex items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{profile.courses?.length || 0} cursos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Profile Modal */}
      <Modal
        isOpen={profileModal.isOpen}
        onClose={() => setProfileModal({ isOpen: false, profile: null })}
        title={profileModal.profile ? 'Editar Perfil' : 'Crear Perfil'}
        size="lg"
      >
        <TrainingProfileForm
          profile={profileModal.profile}
          onSubmit={handleSubmit}
          onCancel={() => setProfileModal({ isOpen: false, profile: null })}
          isLoading={createProfile.isPending || updateProfile.isPending}
        />
      </Modal>

      {/* Manage Courses Modal */}
      {coursesModal.profile && (
        <Modal
          isOpen={coursesModal.isOpen}
          onClose={() => setCoursesModal({ isOpen: false, profile: null })}
          title={`Gestionar cursos — ${coursesModal.profile.name}`}
          size="xl"
        >
          <ProfileCoursesPanel
            profile={coursesModal.profile}
            availableCourses={availableCourses}
            onClose={() => setCoursesModal({ isOpen: false, profile: null })}
          />
        </Modal>
      )}
    </div>
  );
};
