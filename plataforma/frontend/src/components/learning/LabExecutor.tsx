/**
 * LabExecutor Component
 * Main container for executing code labs
 */

import { useState } from 'react';
import { Lab, LabSubmissionResult } from '../../services/api/lab.service';
import { useSubmitLab } from '../../hooks/useLabs';
import { CodeEditor } from './CodeEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { BeakerIcon, PlayIcon } from '@heroicons/react/24/outline';

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
    } catch (error: any) {
      const msg = error?.error?.message || 'Error al enviar el laboratorio';
      setResults({ passed: false, error: msg });
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCode(lab.starterCode || '');
    setShowResults(false);
    setResults(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Lab Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BeakerIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{lab.title}</h1>
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="px-3 py-1 bg-white/20 rounded-full font-medium">
                  {lab.language}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Description (Markdown) */}
      {lab.description && (
        <div className="px-6 pt-6">
          <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 border border-gray-200">
            <MarkdownRenderer content={lab.description} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left Column - Hints & Instructions */}
        <div className="space-y-6">
          {/* Hints */}
          {lab.hints && lab.hints.length > 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Objetivos y Pistas</h3>
              <ul className="space-y-2">
                {lab.hints.map((hint, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-blue-800">
                    <span className="font-medium text-blue-600 mt-0.5">{index + 1}.</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Solution (collapsible) */}
          {lab.solution && (
            <details className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <summary className="text-lg font-semibold text-yellow-900 cursor-pointer">
                Ver Solucion (spoiler)
              </summary>
              <pre className="mt-3 bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                {lab.solution}
              </pre>
            </details>
          )}

          {/* Results */}
          {showResults && results && (
            <div
              className={`rounded-lg border p-4 ${
                results.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  results.passed ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {results.passed ? 'Laboratorio Completado' : 'Resultado'}
              </h3>
              {results.stdout && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Salida:</span>
                  <pre className="mt-1 bg-gray-900 text-green-400 p-2 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {results.stdout}
                  </pre>
                </div>
              )}
              {results.stderr && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-red-700">Errores:</span>
                  <pre className="mt-1 bg-gray-900 text-red-400 p-2 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {results.stderr}
                  </pre>
                </div>
              )}
              {results.error && <p className="text-sm text-red-700">{results.error}</p>}
            </div>
          )}
        </div>

        {/* Right Column - Code Editor */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Tu Solucion</h3>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Resetear codigo
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
                <span>Ejecutando...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                <span>Ejecutar Codigo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
