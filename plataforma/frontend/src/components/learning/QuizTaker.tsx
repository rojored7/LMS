/**
 * QuizTaker Component
 * Main container for taking a quiz
 */

import { useState, useEffect } from 'react';
import { Quiz, QuizAnswer, QuizResult } from '../../services/api/quiz.service';
import { useSubmitQuiz } from '../../hooks/useQuizzes';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import { ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface QuizTakerProps {
  quiz: Quiz;
  onComplete?: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );

  const submitQuiz = useSubmitQuiz();

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionChange = (questionId: string, optionId: string, isChecked: boolean) => {
    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question) return;

    const newAnswers = new Map(answers);
    const currentAnswer = newAnswers.get(questionId) || [];

    if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
      // Single choice: replace answer
      newAnswers.set(questionId, isChecked ? [optionId] : []);
    } else {
      // Multiple choice: toggle option
      if (isChecked) {
        newAnswers.set(questionId, [...currentAnswer, optionId]);
      } else {
        newAnswers.set(questionId, currentAnswer.filter((id) => id !== optionId));
      }
    }

    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Convert answers to API format
    const formattedAnswers: QuizAnswer[] = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptions: answers.get(q.id) || [],
    }));

    try {
      const result = await submitQuiz.mutateAsync({
        quizId: quiz.id,
        answers: formattedAnswers,
      });

      setQuizResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleRetry = () => {
    setAnswers(new Map());
    setCurrentQuestion(0);
    setShowResults(false);
    setQuizResult(null);
    setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  };

  // Check if all questions answered
  const allQuestionsAnswered = quiz.questions.every((q) => {
    const answer = answers.get(q.id);
    return answer && answer.length > 0;
  });

  // If showing results
  if (showResults && quizResult) {
    return (
      <QuizResults
        result={quizResult}
        onRetry={quiz.canAttempt ? handleRetry : undefined}
        onContinue={onComplete}
        canRetry={quiz.canAttempt}
      />
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Quiz Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{quiz.title}</h2>
              {quiz.description && <p className="text-purple-100 mt-1">{quiz.description}</p>}
            </div>
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <ClockIcon className="h-5 w-5" />
              <span className="text-lg font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Pregunta {currentQuestion + 1} de {quiz.questions.length}
          </span>
          <span className="text-sm text-gray-500">
            Puntuación mínima: {quiz.passingScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-6">
        <QuizQuestion
          question={currentQuestionData}
          questionNumber={currentQuestion + 1}
          selectedOptions={answers.get(currentQuestionData.id) || []}
          onOptionChange={(optionId, isChecked) =>
            handleOptionChange(currentQuestionData.id, optionId, isChecked)
          }
        />
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <div className="flex space-x-2">
          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitQuiz.isPending || !allQuestionsAnswered}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitQuiz.isPending ? 'Enviando...' : 'Enviar Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>

      {/* Attempts Info */}
      {quiz.attempts.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            Intentos anteriores: {quiz.attempts.length}
            {quiz.maxAttempts && ` de ${quiz.maxAttempts}`}
          </p>
        </div>
      )}
    </div>
  );
};
