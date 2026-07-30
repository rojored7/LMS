import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from '../hooks/useAreas';
import type { Area, CreateAreaRequest, UpdateAreaRequest } from '../services/api/area.service';

interface AreaFormProps {
  area: Area | null;
  onSubmit: (data: CreateAreaRequest | UpdateAreaRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const AreaForm: React.FC<AreaFormProps> = ({ area, onSubmit, onCancel, isLoading }) => {
  const [name, setName] = useState(area?.name ?? '');
  const [description, setDescription] = useState(area?.description ?? '');
  const [color, setColor] = useState(area?.color ?? '#3b82f6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      color: color || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Desarrollo, Ciberseguridad, QA"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripcion
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Descripcion opcional del area"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{color}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" isLoading={isLoading}>
          {area ? 'Guardar cambios' : 'Crear Area'}
        </Button>
      </div>
    </form>
  );
};

export const Areas: React.FC = () => {
  const { data: areas = [], isLoading } = useAreas();
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();

  const [modal, setModal] = useState<{ isOpen: boolean; area: Area | null }>({
    isOpen: false,
    area: null,
  });

  const handleSubmit = async (data: CreateAreaRequest | UpdateAreaRequest) => {
    if (modal.area) {
      await updateArea.mutateAsync({ areaId: modal.area.id, data });
    } else {
      await createArea.mutateAsync(data as CreateAreaRequest);
    }
    setModal({ isOpen: false, area: null });
  };

  const handleDelete = async (areaId: string) => {
    if (!confirm('Eliminar esta area? Los usuarios asignados quedaran sin area.')) return;
    await deleteArea.mutateAsync(areaId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Areas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona las areas para agrupar usuarios
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setModal({ isOpen: true, area: null })}
        >
          Crear Area
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">No hay areas creadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <div
              key={area.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700"
                    style={{ backgroundColor: area.color ?? '#6b7280' }}
                  />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {area.name}
                  </h3>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setModal({ isOpen: true, area })}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Editar"
                    aria-label="Editar area"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Eliminar"
                    aria-label="Eliminar area"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {area.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                  {area.description}
                </p>
              )}

              <div className="flex items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>Area de usuarios</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, area: null })}
        title={modal.area ? 'Editar Area' : 'Crear Area'}
        size="lg"
      >
        <AreaForm
          area={modal.area}
          onSubmit={handleSubmit}
          onCancel={() => setModal({ isOpen: false, area: null })}
          isLoading={createArea.isPending || updateArea.isPending}
        />
      </Modal>
    </div>
  );
};
