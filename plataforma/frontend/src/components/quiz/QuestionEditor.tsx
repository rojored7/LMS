import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Plus, X, Info } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text: string;
  points: number;
  options?: Option[];
  correctAnswer?: string;
  explanation?: string;
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export default function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete
}: QuestionEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateQuestionType = (type: Question['type']) => {
    let updatedQuestion = { ...question, type };

    if (type === 'MULTIPLE_CHOICE' && !question.options) {
      updatedQuestion.options = [
        { id: `opt_1`, text: '', isCorrect: false },
        { id: `opt_2`, text: '', isCorrect: false },
        { id: `opt_3`, text: '', isCorrect: false },
        { id: `opt_4`, text: '', isCorrect: false }
      ];
    } else if (type === 'TRUE_FALSE') {
      updatedQuestion.options = [
        { id: 'true', text: 'Verdadero', isCorrect: false },
        { id: 'false', text: 'Falso', isCorrect: false }
      ];
    } else if (type === 'SHORT_ANSWER') {
      updatedQuestion.correctAnswer = '';
      delete updatedQuestion.options;
    }

    onUpdate(updatedQuestion);
  };

  const addOption = () => {
    if (!question.options) return;

    const newOption: Option = {
      id: `opt_${Date.now()}`,
      text: '',
      isCorrect: false
    };

    onUpdate({
      ...question,
      options: [...question.options, newOption]
    });
  };

  const updateOption = (optionIndex: number, updates: Partial<Option>) => {
    if (!question.options) return;

    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };

    // Si se marca una opción como correcta en TRUE_FALSE, desmarcar la otra
    if (question.type === 'TRUE_FALSE' && updates.isCorrect) {
      newOptions.forEach((opt, idx) => {
        if (idx !== optionIndex) {
          opt.isCorrect = false;
        }
      });
    }

    onUpdate({ ...question, options: newOptions });
  };

  const deleteOption = (optionIndex: number) => {
    if (!question.options || question.options.length <= 2) return;

    const newOptions = question.options.filter((_, idx) => idx !== optionIndex);
    onUpdate({ ...question, options: newOptions });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
              <h3 className="font-medium text-gray-900 flex-1">
                {question.text || 'Nueva Pregunta'}
              </h3>
              <button
                type="button"
                onClick={onDelete}
                className="text-red-500 hover:text-red-700"
                title="Eliminar pregunta"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tipo de pregunta y puntos */}
        <div className="flex gap-4 mt-3">
          <select
            value={question.type}
            onChange={(e) => updateQuestionType(e.target.value as Question['type'])}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
            <option value="TRUE_FALSE">Verdadero/Falso</option>
            <option value="SHORT_ANSWER">Respuesta Corta</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Puntos:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={question.points}
              onChange={(e) => onUpdate({ ...question, points: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Texto de la pregunta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto de la pregunta
            </label>
            <textarea
              value={question.text}
              onChange={(e) => onUpdate({ ...question, text: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe la pregunta aquí..."
            />
          </div>

          {/* Opciones para MULTIPLE_CHOICE */}
          {question.type === 'MULTIPLE_CHOICE' && question.options && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opciones de respuesta
              </label>
              <div className="space-y-2">
                {question.options.map((option, optIdx) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => updateOption(optIdx, { isCorrect: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      title="Marcar como correcta"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(optIdx, { text: e.target.value })}
                      placeholder={`Opción ${optIdx + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => deleteOption(optIdx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {question.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="inline w-4 h-4 mr-1" />
                  Agregar opción
                </button>
              )}
            </div>
          )}

          {/* Opciones para TRUE_FALSE */}
          {question.type === 'TRUE_FALSE' && question.options && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respuesta correcta
              </label>
              <div className="space-y-2">
                {question.options.map((option, optIdx) => (
                  <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`tf_${question.id}`}
                      checked={option.isCorrect}
                      onChange={() => updateOption(optIdx, { isCorrect: true })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Campo para SHORT_ANSWER */}
          {question.type === 'SHORT_ANSWER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respuesta correcta
              </label>
              <input
                type="text"
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdate({ ...question, correctAnswer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa la respuesta correcta"
              />
              <p className="mt-1 text-xs text-gray-500">
                <Info className="inline w-3 h-3 mr-1" />
                La respuesta del estudiante debe coincidir exactamente (sin distinguir mayúsculas)
              </p>
            </div>
          )}

          {/* Explicación (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explicación (opcional)
            </label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => onUpdate({ ...question, explanation: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explica por qué esta es la respuesta correcta..."
            />
          </div>
        </div>
      )}
    </div>
  );
}