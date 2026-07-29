import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import type {
  TrainingProfile,
  CreateTrainingProfileRequest,
} from '../../services/api/trainingProfile.service';

export interface TrainingProfileFormProps {
  profile?: TrainingProfile | null;
  onSubmit: (data: CreateTrainingProfileRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TrainingProfileForm: React.FC<TrainingProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateTrainingProfileRequest>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3b82f6',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        slug: profile.slug,
        description: profile.description,
        icon: profile.icon || '',
        color: profile.color || '#3b82f6',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minusculas, numeros y guiones';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripcion es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(formData);
    } catch (_error) {
      // Error handled by caller
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
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
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
          disabled={!!profile}
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug}</p>
        )}
        {profile && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El slug no se puede cambiar despues de crear el perfil
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Descripcion *
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

      {/* Icon */}
      <div>
        <label
          htmlFor="icon"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Icono (nombre Lucide)
        </label>
        <input
          type="text"
          id="icon"
          name="icon"
          value={formData.icon || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="shield, lock, terminal, cpu..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Nombre de un icono de la libreria Lucide
        </p>
      </div>

      {/* Color */}
      <div>
        <label
          htmlFor="color"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Color del Perfil
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color || '#3b82f6'}
            onChange={handleChange}
            className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <div
            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: formData.color || '#3b82f6' }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {formData.color || '#3b82f6'}
          </span>
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
