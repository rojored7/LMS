/**
 * TerminalOutput Component
 *
 * Terminal-like output display for code execution results
 * Uses xterm.js for a proper terminal experience
 */

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface TerminalOutputProps {
  output: string;
  error?: string;
  exitCode?: number;
  executionTime?: number;
  isExecuting?: boolean;
  onClear?: () => void;
  className?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  output,
  error,
  exitCode = 0,
  executionTime,
  isExecuting = false,
  onClear,
  className = '',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const terminal = new Terminal({
      cursorBlink: false,
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#f48771',
        green: '#8cc265',
        yellow: '#e4c07a',
        blue: '#6cb6eb',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f48771',
        brightGreen: '#8cc265',
        brightYellow: '#e4c07a',
        brightBlue: '#6cb6eb',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      disableStdin: true,
      rows: 15,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  // Update terminal content
  useEffect(() => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    terminal.clear();

    if (isExecuting) {
      terminal.writeln('\x1b[33m⏳ Ejecutando código...\x1b[0m');
      return;
    }

    // Write stdout
    if (output) {
      terminal.writeln('\x1b[32m$ Salida:\x1b[0m');
      output.split('\n').forEach((line) => {
        terminal.writeln(line);
      });
    }

    // Write stderr
    if (error) {
      if (output) terminal.writeln('');
      terminal.writeln('\x1b[31m$ Error:\x1b[0m');
      error.split('\n').forEach((line) => {
        terminal.writeln(`\x1b[31m${line}\x1b[0m`);
      });
    }

    // Write execution info
    if (executionTime !== undefined) {
      if (output || error) terminal.writeln('');
      terminal.writeln(`\x1b[90m─────────────────────────────────\x1b[0m`);
      terminal.writeln(
        `\x1b[90mTiempo de ejecución: ${executionTime}ms\x1b[0m`
      );
      terminal.writeln(
        `\x1b[90mCódigo de salida: ${exitCode === 0 ? '\x1b[32m' : '\x1b[31m'}${exitCode}\x1b[0m`
      );
    }

    // Show empty message
    if (!output && !error && !isExecuting) {
      terminal.writeln('\x1b[90m$ Terminal vacía. Ejecuta tu código para ver resultados.\x1b[0m');
    }
  }, [output, error, exitCode, executionTime, isExecuting]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm text-gray-400 ml-2">Terminal</span>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            title="Limpiar terminal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 bg-[#1e1e1e] overflow-hidden"
      />
    </div>
  );
};
