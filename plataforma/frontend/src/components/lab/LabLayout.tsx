/**
 * LabLayout Component
 *
 * Split pane layout for lab execution with resizable panels
 * Displays code editor on top and terminal output on bottom
 */

import React, { useState, useEffect, useRef } from 'react';

export interface LabLayoutProps {
  editor: React.ReactNode;
  terminal: React.ReactNode;
  className?: string;
}

const MIN_HEIGHT_PERCENT = 20;
const DEFAULT_HEIGHT_PERCENT = 60;
const STORAGE_KEY = 'lab-layout-split-position';

export const LabLayout: React.FC<LabLayoutProps> = ({
  editor,
  terminal,
  className = '',
}) => {
  const [topHeightPercent, setTopHeightPercent] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_HEIGHT_PERCENT;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save to localStorage when height changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, topHeightPercent.toString());
  }, [topHeightPercent]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseY = e.clientY - containerRect.top;
      const newHeightPercent = (mouseY / containerRect.height) * 100;

      // Clamp between min and max
      const clampedHeight = Math.max(
        MIN_HEIGHT_PERCENT,
        Math.min(100 - MIN_HEIGHT_PERCENT, newHeightPercent)
      );

      setTopHeightPercent(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // For mobile: use tabs instead of split view
  const [mobileTab, setMobileTab] = useState<'editor' | 'terminal'>('editor');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={() => setMobileTab('editor')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${
                mobileTab === 'editor'
                  ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileTab('terminal')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${
                mobileTab === 'terminal'
                  ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            Terminal
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'editor' ? editor : terminal}
        </div>
      </div>
    );
  }

  // Desktop: split view
  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full relative ${className}`}
    >
      {/* Top Panel - Editor */}
      <div
        style={{ height: `${topHeightPercent}%` }}
        className="overflow-hidden"
      >
        {editor}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          flex items-center justify-center h-1 bg-gray-200 dark:bg-gray-700 cursor-row-resize
          hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors group relative
          ${isDragging ? 'bg-blue-500 dark:bg-blue-600' : ''}
        `}
      >
        {/* Drag Handle Indicator */}
        <div className="absolute w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full group-hover:bg-white dark:group-hover:bg-white" />
      </div>

      {/* Bottom Panel - Terminal */}
      <div
        style={{ height: `${100 - topHeightPercent}%` }}
        className="overflow-hidden"
      >
        {terminal}
      </div>

      {/* Dragging Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 cursor-row-resize" />
      )}
    </div>
  );
};
