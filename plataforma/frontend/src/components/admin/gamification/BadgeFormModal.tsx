import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import type { BadgeItem } from './BadgesTab';

interface BadgeFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
  category: string;
  requirement: string;
}

interface BadgeFormModalProps {
  isOpen: boolean;
  badge: BadgeItem | null;
  onClose: () => void;
  onSave: (data: BadgeFormData) => Promise<void>;
}

const INITIAL_FORM: BadgeFormData = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  color: '#3B82F6',
  xpReward: 0,
  category: 'achievement',
  requirement: '',
};

const BadgeFormModal: React.FC<BadgeFormModalProps> = ({
  isOpen,
  badge,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<BadgeFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (badge) {
        setForm({
          name: badge.name,
          slug: badge.slug,
          description: badge.description,
          icon: badge.icon || '',
          color: badge.color || '#3B82F6',
          xpReward: badge.xpReward,
          category: badge.category || 'achievement',
          requirement: badge.requirement || '',
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setSaving(false);
    }
  }, [isOpen, badge]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof BadgeFormData>(key: K, value: BadgeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={badge ? 'Editar Badge' : 'Crear Badge'}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripcion
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              XP Reward
            </label>
            <input
              type="number"
              value={form.xpReward}
              onChange={(e) => updateField('xpReward', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="achievement">Logro</option>
              <option value="course_completion">Curso</option>
              <option value="milestone">Hito</option>
              <option value="external">Externo</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Requisito
          </label>
          <input
            type="text"
            value={form.requirement}
            onChange={(e) => updateField('requirement', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Ej: Completar 5 cursos"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : badge ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BadgeFormModal;
