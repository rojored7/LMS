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
  const isSingleChoice = question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE';

  const handleChange = (optionId: string) => {
    if (showResults) return;

    if (isSingleChoice) {
      onOptionChange(optionId, true);
    } else {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Question Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          <span className="text-blue-600 mr-2">Pregunta {questionNumber}</span>
          {question.question}
        </h3>
        {!isSingleChoice && (
          <p className="mt-2 text-sm text-gray-500">Selecciona todas las opciones correctas</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {(question.options || []).map((option) => {
          const isSelected = selectedOptions.includes(option.id);

          return (
            <label
              key={option.id}
              className={getOptionClassName(option.id)}
              onClick={() => handleChange(option.id)}
            >
              <input
                type={isSingleChoice ? 'radio' : 'checkbox'}
                name={isSingleChoice ? `question-${question.id}` : undefined}
                checked={isSelected}
                onChange={() => handleChange(option.id)}
                disabled={showResults}
                className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className={`flex-1 text-gray-900 ${isSelected ? 'font-medium' : ''}`}>
                {option.text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
