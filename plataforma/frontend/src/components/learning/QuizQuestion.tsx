/**
 * QuizQuestion Component
 * Displays a single quiz question with options
 */

import { QuizQuestion as QuizQuestionType } from '../../services/api/quiz.service';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  selectedOptions: string[];
  onOptionChange: (optionId: string, isChecked: boolean) => void;
  showResults?: boolean;
  correctOptions?: string[];
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  selectedOptions,
  onOptionChange,
  showResults = false,
  correctOptions = [],
}) => {
  const isSingleChoice = question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE';

  const handleChange = (optionId: string) => {
    if (showResults) return; // Disable interaction in results view

    if (isSingleChoice) {
      // For single choice, deselect all others and select this one
      onOptionChange(optionId, true);
    } else {
      // For multiple choice, toggle this option
      const isCurrentlySelected = selectedOptions.includes(optionId);
      onOptionChange(optionId, !isCurrentlySelected);
    }
  };

  const getOptionClassName = (optionId: string) => {
    const baseClasses = 'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all';
    const isSelected = selectedOptions.includes(optionId);
    const isCorrect = correctOptions.includes(optionId);
    const wasSelected = showResults && isSelected;

    if (showResults) {
      if (isCorrect && wasSelected) {
        return `${baseClasses} bg-green-50 border-green-500 cursor-default`;
      } else if (!isCorrect && wasSelected) {
        return `${baseClasses} bg-red-50 border-red-500 cursor-default`;
      } else if (isCorrect) {
        return `${baseClasses} bg-green-50 border-green-300 cursor-default`;
      } else {
        return `${baseClasses} bg-gray-50 border-gray-200 cursor-default`;
      }
    }

    if (isSelected) {
      return `${baseClasses} bg-blue-50 border-blue-500 hover:bg-blue-100`;
    }

    return `${baseClasses} bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
  };

  const getCheckboxClassName = (optionId: string) => {
    const isSelected = selectedOptions.includes(optionId);
    const isCorrect = correctOptions.includes(optionId);
    const wasSelected = showResults && isSelected;

    if (showResults) {
      if (isCorrect && wasSelected) {
        return 'h-5 w-5 text-green-600 border-green-600 focus:ring-green-500';
      } else if (!isCorrect && wasSelected) {
        return 'h-5 w-5 text-red-600 border-red-600 focus:ring-red-500';
      }
    }

    return 'h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Question Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            <span className="text-blue-600 mr-2">Pregunta {questionNumber}</span>
            {question.question}
          </h3>
          <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex-shrink-0">
            {question.points} {question.points === 1 ? 'punto' : 'puntos'}
          </span>
        </div>
        {!isSingleChoice && (
          <p className="mt-2 text-sm text-gray-500">Selecciona todas las opciones correctas</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);

          return (
            <label
              key={option.id}
              className={getOptionClassName(option.id)}
            >
              <input
                type={isSingleChoice ? 'radio' : 'checkbox'}
                name={isSingleChoice ? `question-${question.id}` : undefined}
                checked={isSelected}
                onChange={() => handleChange(option.id)}
                disabled={showResults}
                className={getCheckboxClassName(option.id)}
              />
              <span className={`flex-1 text-gray-900 ${isSelected ? 'font-medium' : ''}`}>
                {option.text}
              </span>
            </label>
          );
        })}
      </div>

      {/* Results Feedback */}
      {showResults && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-sm font-medium text-gray-700">
            Respuesta correcta: {correctOptions.map(id => question.options.find(opt => opt.id === id)?.text).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};
