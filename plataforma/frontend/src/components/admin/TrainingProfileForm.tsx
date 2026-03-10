/**
 * TrainingProfileForm Component
 * Form for creating/editing training profiles
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { TrainingProfile, CreateTrainingProfileRequest } from '../../services/api/trainingProfile.service';

export interface TrainingProfileFormProps {
  profile?: TrainingProfile | null;
  availableCourses: Array<{ id: string; title: string; slug: string }>;
  onSubmit: (data: CreateTrainingProfileRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TrainingProfileForm: React.FC<TrainingProfileFormProps> = ({
  profile,
  availableCourses,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateTrainingProfileRequest>({
    name: '',
    slug: '',
    description: '',
    courseIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        slug: profile.slug,
        description: profile.description,
        courseIds: profile.courses?.map((c) => c.id) || [],
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Auto-generate slug from name
    if (name === 'name' && !profile) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setFormData((prev) => {
      const courseIds = prev.courseIds || [];
      const isSelected = courseIds.includes(courseId);

      return {
        ...prev,
        courseIds: isSelected
          ? courseIds.filter((id) => id !== courseId)
          : [...courseIds, courseId],
      };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nombre del Perfil *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
            errors.name
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Ej: Analista de Ciberseguridad"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      {/* Slug */}
      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Slug (URL amigable) *
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-mono text-sm ${
            errors.slug
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="analista-ciberseguridad"
          disabled={!!profile} // Disable slug editing
        />
        {errors.slug && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug}</p>}
        {profile && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El slug no se puede cambiar después de crear el perfil
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Descripción *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
            errors.description
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Describe el perfil de entrenamiento y sus objetivos..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cursos Asignados ({formData.courseIds?.length || 0})
        </label>

        <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
          {availableCourses.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No hay cursos disponibles
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {availableCourses.map((course) => {
                const isSelected = formData.courseIds?.includes(course.id);

                return (
                  <label
                    key={course.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCourseToggle(course.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {course.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {course.slug}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>

        <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
          {profile ? 'Actualizar' : 'Crear'} Perfil
        </Button>
      </div>
    </form>
  );
};
