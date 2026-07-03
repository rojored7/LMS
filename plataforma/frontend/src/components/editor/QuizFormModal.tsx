import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { contentEditorService } from '../../services/api/contentEditor.service';
import api from '../../services/api';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

interface QuizData {
  id?: string;
  title: string;
  description?: string;
  passingScore: number;
  attempts: number;
  timeLimit?: number;
}

interface QuestionData {
  id?: string;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string | number;
  explanation: string;
  order: number;
}

interface ModuleOption {
  id: string;
  title: string;
}

interface QuizFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleId: string, data: Omit<QuizData, 'id'>) => Promise<void>;
  quiz?: (QuizData & { moduleId?: string }) | null;
  modules: ModuleOption[];
  courseId?: string;
}

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Opcion multiple' },
  { value: 'TRUE_FALSE', label: 'Verdadero/Falso' },
  { value: 'OPEN_ENDED', label: 'Respuesta abierta' },
];

const QuizFormModal: React.FC<QuizFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quiz,
  modules,
  courseId,
}) => {
  const [moduleId, setModuleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [attempts, setAttempts] = useState(3);
  const [timeLimit, setTimeLimit] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Questions state
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<QuestionData | null>(null);

  // Question form state
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MULTIPLE_CHOICE');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<string | number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qSaving, setQSaving] = useState(false);

  useEffect(() => {
    if (quiz) {
      setModuleId(quiz.moduleId || modules[0]?.id || '');
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setPassingScore(quiz.passingScore || 70);
      setAttempts(quiz.attempts || 3);
      setTimeLimit(quiz.timeLimit || 0);
      if (quiz.id) loadQuestions(quiz.id);
    } else {
      setModuleId(modules[0]?.id || '');
      setTitle('');
      setDescription('');
      setPassingScore(70);
      setAttempts(3);
      setTimeLimit(0);
      setQuestions([]);
    }
    setError('');
    setShowQuestionForm(false);
    setEditingQuestion(null);
  }, [quiz, isOpen, modules]);

  const loadQuestions = async (quizId: string) => {
    setLoadingQuestions(true);
    try {
      const res: any = await api.get(`/quizzes/${quizId}`);
      const data = res.data || res;
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

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
        passingScore,
        attempts,
        timeLimit: timeLimit || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Question CRUD
  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQText('');
    setQType('MULTIPLE_CHOICE');
    setQOptions(['', '', '', '']);
    setQCorrectAnswer(0);
    setQExplanation('');
    setShowQuestionForm(true);
  };

  const openEditQuestion = (q: QuestionData) => {
    setEditingQuestion(q);
    setQText(q.question);
    setQType(q.type || 'MULTIPLE_CHOICE');
    setQOptions(
      q.type === 'TRUE_FALSE'
        ? ['Verdadero', 'Falso']
        : Array.isArray(q.options) && q.options.length > 0
          ? [...q.options]
          : ['', '', '', '']
    );
    setQCorrectAnswer(q.correctAnswer ?? 0);
    setQExplanation(q.explanation || '');
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!quiz?.id || !qText.trim()) return;
    setQSaving(true);
    try {
      const questionData: any = {
        question: qText.trim(),
        type: qType,
        options: qType === 'OPEN_ENDED' ? [] : qOptions.filter((o) => o.trim()),
        correctAnswer:
          qType === 'TRUE_FALSE'
            ? qCorrectAnswer
            : qType === 'OPEN_ENDED'
              ? qText.trim()
              : qCorrectAnswer,
        explanation: qExplanation,
        order: editingQuestion?.order ?? questions.length,
      };

      if (editingQuestion?.id) {
        await contentEditorService.updateQuestion(
          courseId || '',
          moduleId,
          quiz.id,
          editingQuestion.id,
          questionData
        );
      } else {
        await contentEditorService.addQuestion(courseId || '', moduleId, quiz.id, questionData);
      }
      await loadQuestions(quiz.id);
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } catch {
      setError('Error al guardar pregunta');
    } finally {
      setQSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!quiz?.id || !deleteQuestionTarget?.id) return;
    try {
      await contentEditorService.deleteQuestion(
        courseId || '',
        moduleId,
        quiz.id,
        deleteQuestionTarget.id
      );
      await loadQuestions(quiz.id);
      setDeleteQuestionTarget(null);
    } catch {
      setError('Error al eliminar pregunta');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quiz?.id ? 'Editar Quiz' : 'Nuevo Quiz'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        {/* Metadata section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Modulo *
          </label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            disabled={!!quiz}
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Puntaje min. (%)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Intentos max.
            </label>
            <input
              type="number"
              value={attempts}
              onChange={(e) => setAttempts(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tiempo (min)
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Save metadata button */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {quiz?.id ? 'Cerrar' : 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : quiz?.id ? 'Actualizar quiz' : 'Crear quiz'}
          </button>
        </div>
      </form>

      {/* Questions section (only when editing existing quiz) */}
      {quiz?.id && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preguntas ({questions.length})
            </h3>
            <button
              type="button"
              onClick={openAddQuestion}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center space-x-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Agregar pregunta</span>
            </button>
          </div>

          {loadingQuestions ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : questions.length === 0 && !showQuestionForm ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No hay preguntas. Agrega la primera pregunta.
            </p>
          ) : (
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-start justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {q.type === 'MULTIPLE_CHOICE'
                        ? `Opcion multiple - ${(q.options || []).length} opciones`
                        : q.type === 'TRUE_FALSE'
                          ? 'Verdadero/Falso'
                          : 'Respuesta abierta'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      type="button"
                      onClick={() => openEditQuestion(q)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteQuestionTarget(q)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline question form */}
          {showQuestionForm && (
            <div className="mt-4 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
                {editingQuestion ? 'Editar pregunta' : 'Nueva pregunta'}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pregunta *
                  </label>
                  <input
                    type="text"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Escribe la pregunta..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={qType}
                      onChange={(e) => {
                        setQType(e.target.value);
                        if (e.target.value === 'TRUE_FALSE') {
                          setQOptions(['Verdadero', 'Falso']);
                          setQCorrectAnswer(0);
                        } else if (e.target.value === 'OPEN_ENDED') {
                          setQOptions([]);
                        } else {
                          setQOptions(['', '', '', '']);
                          setQCorrectAnswer(0);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Explicacion (opcional)
                    </label>
                    <input
                      type="text"
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Por que esta respuesta es correcta..."
                    />
                  </div>
                </div>

                {/* Options for MULTIPLE_CHOICE and TRUE_FALSE */}
                {(qType === 'MULTIPLE_CHOICE' || qType === 'TRUE_FALSE') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Opciones (marca la correcta)
                    </label>
                    <div className="space-y-2">
                      {qOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={qCorrectAnswer === idx}
                            onChange={() => setQCorrectAnswer(idx)}
                            className="text-blue-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...qOptions];
                              newOpts[idx] = e.target.value;
                              setQOptions(newOpts);
                            }}
                            disabled={qType === 'TRUE_FALSE'}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white disabled:opacity-60"
                            placeholder={`Opcion ${idx + 1}`}
                          />
                          {qType === 'MULTIPLE_CHOICE' && qOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = qOptions.filter((_, i) => i !== idx);
                                setQOptions(newOpts);
                                if (
                                  typeof qCorrectAnswer === 'number' &&
                                  qCorrectAnswer >= newOpts.length
                                ) {
                                  setQCorrectAnswer(0);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {qType === 'MULTIPLE_CHOICE' && qOptions.length < 8 && (
                        <button
                          type="button"
                          onClick={() => setQOptions([...qOptions, ''])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Agregar opcion
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionForm(false);
                      setEditingQuestion(null);
                    }}
                    className="px-3 py-1.5 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuestion}
                    disabled={qSaving || !qText.trim()}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {qSaving ? 'Guardando...' : editingQuestion ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete question confirm */}
      <ConfirmDialog
        isOpen={!!deleteQuestionTarget}
        onClose={() => setDeleteQuestionTarget(null)}
        onConfirm={handleDeleteQuestion}
        title="Eliminar pregunta"
        message={`Eliminar "${deleteQuestionTarget?.question || ''}"?`}
        variant="danger"
        confirmText="Eliminar"
      />
    </Modal>
  );
};

export default QuizFormModal;
