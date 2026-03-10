import { useState } from 'react';
import { X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text: string;
  points: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
}

interface QuizPreviewProps {
  quiz: {
    title: string;
    description: string;
    questions: Question[];
    timeLimit: number;
    passingScore: number;
  };
  onClose: () => void;
}

export default function QuizPreview({ quiz, onClose }: QuizPreviewProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const calculateScore = () => {
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];

      if (!userAnswer) return;

      if (question.type === 'MULTIPLE_CHOICE') {
        const selectedOptions = userAnswer as string[];
        const correctOptions = question.options?.filter(opt => opt.isCorrect).map(opt => opt.id) || [];

        if (selectedOptions.length === correctOptions.length &&
            selectedOptions.every(id => correctOptions.includes(id))) {
          score += question.points;
        }
      } else if (question.type === 'TRUE_FALSE') {
        const correctOption = question.options?.find(opt => opt.isCorrect);
        if (userAnswer === correctOption?.id) {
          score += question.points;
        }
      } else if (question.type === 'SHORT_ANSWER') {
        if (userAnswer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()) {
          score += question.points;
        }
      }
    });

    return { score, totalPoints, percentage: (score / totalPoints) * 100 };
  };

  const isAnswered = (questionId: string) => {
    return answers.hasOwnProperty(questionId) && answers[questionId] !== '';
  };

  const currentQ = quiz.questions[currentQuestion];

  if (!currentQ) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
            <p className="text-blue-100 text-sm mt-1">Vista Previa del Quiz</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Bar */}
        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Pregunta {currentQuestion + 1} de {quiz.questions.length}
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {quiz.timeLimit} minutos
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Puntuación mínima: {quiz.passingScore}%
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showResults ? (
            <>
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold">
                    {currentQuestion + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {currentQ.text}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {currentQ.points} punto{currentQ.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="ml-13 space-y-3">
                  {currentQ.type === 'MULTIPLE_CHOICE' && currentQ.options && (
                    <div className="space-y-2">
                      {currentQ.options.map((option) => (
                        <label key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={(answers[currentQ.id] as string[] || []).includes(option.id)}
                            onChange={(e) => {
                              const current = answers[currentQ.id] as string[] || [];
                              if (e.target.checked) {
                                handleAnswer(currentQ.id, [...current, option.id]);
                              } else {
                                handleAnswer(currentQ.id, current.filter(id => id !== option.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'TRUE_FALSE' && currentQ.options && (
                    <div className="space-y-2">
                      {currentQ.options.map((option) => (
                        <label key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input
                            type="radio"
                            name={`q_${currentQ.id}`}
                            checked={answers[currentQ.id] === option.id}
                            onChange={() => handleAnswer(currentQ.id, option.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'SHORT_ANSWER' && (
                    <input
                      type="text"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Escribe tu respuesta aquí..."
                    />
                  )}
                </div>
              </div>

              {/* Question Navigation Dots */}
              <div className="flex justify-center gap-2 mb-6">
                {quiz.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      idx === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : isAnswered(quiz.questions[idx].id)
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Results View */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Resultados de la Vista Previa
                </h3>
                {(() => {
                  const { score, totalPoints, percentage } = calculateScore();
                  const passed = percentage >= quiz.passingScore;
                  return (
                    <>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold ${
                        passed ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {score} / {totalPoints} puntos ({percentage.toFixed(1)}%)
                      </div>
                      <p className="mt-3 text-gray-600">
                        {passed
                          ? '¡Felicidades! Has aprobado el quiz.'
                          : `Necesitas ${quiz.passingScore}% para aprobar.`}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Review Questions */}
              <div className="space-y-4">
                {quiz.questions.map((question, idx) => {
                  const userAnswer = answers[question.id];
                  let isCorrect = false;

                  if (question.type === 'MULTIPLE_CHOICE') {
                    const selectedOptions = userAnswer as string[] || [];
                    const correctOptions = question.options?.filter(opt => opt.isCorrect).map(opt => opt.id) || [];
                    isCorrect = selectedOptions.length === correctOptions.length &&
                               selectedOptions.every(id => correctOptions.includes(id));
                  } else if (question.type === 'TRUE_FALSE') {
                    const correctOption = question.options?.find(opt => opt.isCorrect);
                    isCorrect = userAnswer === correctOption?.id;
                  } else if (question.type === 'SHORT_ANSWER') {
                    isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
                  }

                  return (
                    <div key={question.id} className={`p-4 rounded-lg border ${
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {idx + 1}. {question.text}
                          </p>
                          {question.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                              <AlertCircle className="inline w-4 h-4 mr-1 text-blue-600" />
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-between">
          {!showResults ? (
            <>
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="flex gap-3">
                {currentQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setShowResults(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Finalizar Vista Previa
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Cerrar Vista Previa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}