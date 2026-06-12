import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import MarkdownEditor from '../common/MarkdownEditor';

interface LessonData {
  id?: string;
  title: string;
  content: string;
  type: string;
  order: number;
  estimatedTime: number;
  videoUrl?: string | null;
}

interface LessonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<LessonData, 'id'>) => Promise<void>;
  lesson?: LessonData | null;
}

const LESSON_TYPES = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'INTERACTIVE', label: 'Interactivo' },
  { value: 'READING', label: 'Lectura' },
];

const LessonFormModal: React.FC<LessonFormModalProps> = ({ isOpen, onClose, onSave, lesson }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('TEXT');
  const [order, setOrder] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setContent(lesson.content || '');
      setType(lesson.type || 'TEXT');
      setOrder(lesson.order || 0);
      setEstimatedTime(lesson.estimatedTime || 0);
      setVideoUrl(lesson.videoUrl || '');
    } else {
      setTitle('');
      setContent('');
      setType('TEXT');
      setOrder(0);
      setEstimatedTime(0);
      setVideoUrl('');
    }
    setError('');
  }, [lesson, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El titulo es requerido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ title: title.trim(), content, type, order, estimatedTime, videoUrl: videoUrl.trim() || null });
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
      title={lesson ? 'Editar Leccion' : 'Nueva Leccion'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {LESSON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Orden
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min.
              </label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
        {type === 'VIDEO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL del video (YouTube, Vimeo, Loom)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">Soporta: YouTube, Vimeo, Loom, Google Drive</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contenido
          </label>
          <MarkdownEditor
            value={content}
            onChange={(val) => setContent(val)}
            height={350}
            placeholder="Escribe el contenido de la leccion en Markdown..."
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
            {saving ? 'Guardando...' : lesson ? 'Actualizar' : 'Crear leccion'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LessonFormModal;
