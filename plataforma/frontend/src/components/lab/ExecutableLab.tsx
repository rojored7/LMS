import { useState } from 'react';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CodeEditor } from '../learning/CodeEditor';
import { MarkdownRenderer } from '../learning/MarkdownRenderer';
import { LabLayout } from './LabLayout';
import { TerminalOutput } from './TerminalOutput';
import { useSubmitLab, useExecutorHealth } from '../../hooks/useLabs';
import type { Lab, LabSubmissionResult } from '../../types/lab';

interface ExecutableLabProps {
  lab: Lab;
}

export const ExecutableLab: React.FC<ExecutableLabProps> = ({ lab }) => {
  const [code, setCode] = useState(lab.starterCode || '');
  const [result, setResult] = useState<LabSubmissionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const submitLab = useSubmitLab();
  const { data: healthData } = useExecutorHealth();
  const executorAvailable = healthData?.executorAvailable ?? true;

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsExecuting(true);
    try {
      const r = await submitLab.mutateAsync({ labId: lab.id, code });
      setResult(r);
    } catch (err: any) {
      setResult({ passed: false, error: err?.message || 'Error al ejecutar' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setCode(lab.starterCode || '');
    setResult(null);
  };

  const editorPane = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white text-sm">
        <span className="font-mono text-gray-300">{lab.language}</span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Resetear
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <CodeEditor
          value={code}
          onChange={(v) => setCode(v || '')}
          language={lab.language}
          height="100%"
        />
      </div>
      <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
        <button
          onClick={handleRun}
          disabled={isExecuting || !code.trim() || !executorAvailable}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          data-testid="run-code"
        >
          {isExecuting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Ejecutando...
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              Ejecutar
            </>
          )}
        </button>
        {!executorAvailable && (
          <p className="mt-2 text-xs text-amber-400 text-center">
            El ejecutor no esta disponible en este momento
          </p>
        )}
      </div>
    </div>
  );

  const terminalPane = (
    <TerminalOutput
      output={result?.stdout || ''}
      error={result?.stderr}
      exitCode={result?.exitCode}
      executionTime={result?.executionTime}
      isExecuting={isExecuting}
      onClear={() => setResult(null)}
    />
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden" data-testid="lab-executor">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 flex-shrink-0">
        <h2 className="text-xl font-bold">{lab.title}</h2>
        <div className="flex items-center gap-3 mt-1 text-sm">
          <span className="px-2 py-0.5 bg-white/20 rounded font-mono">{lab.language}</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${executorAvailable ? 'bg-green-300' : 'bg-red-400'}`}
            />
            <span className="opacity-80 text-xs">
              {executorAvailable ? 'Ejecutor activo' : 'Ejecutor no disponible'}
            </span>
          </span>
        </div>
      </div>

      {/* Description */}
      {lab.description && (
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 max-h-40 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={lab.description} />
          </div>
        </div>
      )}

      {/* Hints */}
      {lab.hints && lab.hints.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <details>
            <summary className="text-sm font-medium text-blue-800 cursor-pointer select-none">
              Pistas ({lab.hints.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {lab.hints.map((hint, i) => (
                <li key={i} className="text-sm text-blue-700 flex gap-2">
                  <span className="font-medium">{i + 1}.</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Result banner */}
      {result && !isExecuting && (
        <div
          data-testid="lab-status"
          className={`px-6 py-3 border-b flex-shrink-0 text-sm font-medium ${
            result.executorError
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : result.passed
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {result.executorError
            ? 'Ejecutor no disponible'
            : result.passed
              ? 'Todos los tests pasaron - Lab completado'
              : 'Algunos tests fallaron. Revisa la salida del terminal.'}
        </div>
      )}

      {/* Editor + Terminal */}
      <div className="flex-1 min-h-0">
        <LabLayout editor={editorPane} terminal={terminalPane} />
      </div>

      {/* Solution toggle */}
      {lab.solution && (
        <div className="px-6 py-3 border-t border-gray-200 flex-shrink-0">
          <details className="text-sm">
            <summary className="text-yellow-700 font-medium cursor-pointer select-none">
              Ver solucion (spoiler)
            </summary>
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {lab.solution}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
