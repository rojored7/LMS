import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

interface LabData {
  id?: string;
  title: string;
  description?: string;
  language: string;
  starterCode?: string;
  solution?: string;
  hints?: string[];
  instructions?: string;
}

interface ModuleOption {
  id: string;
  title: string;
}

interface LabFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleId: string, data: Omit<LabData, 'id'>) => Promise<void>;
  lab?: (LabData & { moduleId?: string }) | null;
  modules: ModuleOption[];
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'bash', label: 'Bash' },
];

const LabFormModal: React.FC<LabFormModalProps> = ({ isOpen, onClose, onSave, lab, modules }) => {
  const [moduleId, setModuleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('python');
  const [starterCode, setStarterCode] = useState('');
  const [solution, setSolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lab) {
      setModuleId(lab.moduleId || modules[0]?.id || '');
      setTitle(lab.title);
      setDescription(lab.description || '');
      setLanguage(lab.language || 'python');
      setStarterCode(lab.starterCode || '');
      setSolution(lab.solution || '');
    } else {
      setModuleId(modules[0]?.id || '');
      setTitle('');
      setDescription('');
      setLanguage('python');
      setStarterCode('');
      setSolution('');
    }
    setError('');
  }, [lab, isOpen, modules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El titulo es requerido');
      return;
    }
    if (!moduleId) {
      setError('Selecciona un modulo');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(moduleId, {
        title: title.trim(),
        description,
        language,
        starterCode: starterCode || undefined,
        solution: solution || undefined,
        instructions: description || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lab ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Modulo *
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              disabled={!!lab}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-60"
            >
              <option value="">Seleccionar modulo</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lenguaje *
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titulo *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripcion
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Codigo inicial
          </label>
          <textarea
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:bg-gray-700 dark:text-white"
            placeholder="# Codigo inicial para el estudiante..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Solucion
          </label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:bg-gray-700 dark:text-white"
            placeholder="# Solucion esperada..."
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : lab ? 'Actualizar' : 'Crear laboratorio'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LabFormModal;
