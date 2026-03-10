/**
 * TestResults Component
 * Displays test execution results for labs
 */

import { LabTestResult } from '../../services/api/lab.service';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface TestResultsProps {
  results: LabTestResult[];
  passedTests: number;
  totalTests: number;
  score: number;
  passingScore: number;
  passed: boolean;
}

export const TestResults: React.FC<TestResultsProps> = ({
  results,
  passedTests,
  totalTests,
  score,
  passingScore,
  passed,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Summary Header */}
      <div
        className={`px-6 py-4 ${
          passed
            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : 'bg-gradient-to-r from-amber-500 to-orange-600'
        }`}
      >
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-semibold">Resultados de Tests</h3>
            <p className="text-sm mt-1">
              {passed ? '¡Todos los tests pasaron!' : 'Algunos tests no pasaron'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{score}%</div>
            <div className="text-sm">
              {passedTests}/{totalTests} tests pasados
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className="p-6 space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${
              result.passed
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {/* Test Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {result.passed ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                )}
                <h4 className="font-semibold text-gray-900">{result.testCase}</h4>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>{result.executionTime}ms</span>
              </div>
            </div>

            {/* Test Output */}
            <div className="space-y-2">
              {/* Expected Output */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Salida esperada:</p>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                  {result.expectedOutput || '(vacío)'}
                </pre>
              </div>

              {/* Actual Output */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Tu salida:</p>
                <pre
                  className={`p-3 rounded text-sm font-mono overflow-x-auto ${
                    result.passed
                      ? 'bg-gray-900 text-green-400'
                      : 'bg-gray-900 text-red-400'
                  }`}
                >
                  {result.output || '(vacío)'}
                </pre>
              </div>

              {/* Error Output */}
              {result.error && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">Error:</p>
                  <pre className="bg-red-900 text-red-200 p-3 rounded text-sm font-mono overflow-x-auto">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Puntuación mínima requerida: <span className="font-semibold">{passingScore}%</span>
          </p>
          {passed ? (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
              ✓ Lab completado
            </span>
          ) : (
            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium">
              Intenta nuevamente
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
