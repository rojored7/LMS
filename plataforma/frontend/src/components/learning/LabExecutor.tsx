/**
 * LabExecutor Component
 * Main container for executing code labs
 */

import { useState } from 'react';
import { Lab, LabSubmissionResult } from '../../services/api/lab.service';
import { useSubmitLab } from '../../hooks/useLabs';
import { CodeEditor } from './CodeEditor';
import { TestResults } from './TestResults';
import { BeakerIcon, PlayIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface LabExecutorProps {
  lab: Lab;
}

export const LabExecutor: React.FC<LabExecutorProps> = ({ lab }) => {
  const [code, setCode] = useState<string>(lab.starterCode || '');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<LabSubmissionResult | null>(null);

  const submitLab = useSubmitLab();

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const handleSubmit = async () => {
    try {
      const result = await submitLab.mutateAsync({
        labId: lab.id,
        code,
      });

      setResults(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting lab:', error);
    }
  };

  const handleReset = () => {
    setCode(lab.starterCode || '');
    setShowResults(false);
    setResults(null);
  };

  return (
    <div className="bg-white">
      {/* Lab Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BeakerIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{lab.title}</h1>
              {lab.description && <p className="mt-1 text-green-100">{lab.description}</p>}
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="px-3 py-1 bg-white/20 rounded-full font-medium">
                  {lab.language}
                </span>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>Límite: {lab.timeLimit}s</span>
                </div>
                <span>Puntuación mínima: {lab.passingScore}%</span>
              </div>
            </div>
          </div>
          {lab.hasPassed && (
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <CheckCircleSolidIcon className="h-5 w-5" />
              <span className="font-medium">Completado ({lab.bestScore}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left Column - Instructions & Test Cases */}
        <div className="space-y-6">
          {/* Test Cases */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Cases</h3>
            <div className="space-y-3">
              {lab.testCases.map((testCase, index) => (
                <div key={index} className="bg-white p-3 rounded border border-gray-200">
                  <p className="font-medium text-gray-900 text-sm mb-2">
                    {testCase.description || `Test ${index + 1}`}
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-600">Input:</span>
                      <pre className="mt-1 bg-gray-900 text-green-400 p-2 rounded font-mono overflow-x-auto">
                        {testCase.input || '(ninguno)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-gray-600">Salida esperada:</span>
                      <pre className="mt-1 bg-gray-900 text-blue-400 p-2 rounded font-mono overflow-x-auto">
                        {testCase.expectedOutput}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Submissions */}
          {lab.submissions.length > 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Envíos Anteriores ({lab.submissions.length})
              </h3>
              <div className="space-y-2">
                {lab.submissions.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between"
                  >
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          submission.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {submission.passed ? '✓ Pasado' : '✗ Fallido'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {submission.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Code Editor */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Tu Solución</h3>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Resetear código
              </button>
            </div>
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={lab.language}
              height="500px"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitLab.isPending || !code.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitLab.isPending ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Ejecutando tests...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                <span>Ejecutar Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {showResults && results && (
        <div className="px-6 pb-6">
          <TestResults
            results={results.results}
            passedTests={results.passedTests}
            totalTests={results.totalTests}
            score={results.score}
            passingScore={results.passingScore}
            passed={results.passed}
          />
        </div>
      )}
    </div>
  );
};
