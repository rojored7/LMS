/**
 * ThemeToggle Component with 3 modes
 * HU-037: Dark Mode Toggle with light/dark/system options
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { useDarkMode, Theme } from '../../hooks/useDarkMode';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'inline' | 'compact';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className,
  showLabel = false
}) => {
  const { t } = useTranslation();
  const { theme, effectiveTheme, setTheme, toggleTheme } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { value: Theme; icon: React.ReactNode; label: string; description: string }[] = [
    {
      value: 'light',
      icon: <Sun className="w-4 h-4" />,
      label: t('settings.lightMode'),
      description: t('settings.lightModeDesc', 'Always use light theme')
    },
    {
      value: 'dark',
      icon: <Moon className="w-4 h-4" />,
      label: t('settings.darkMode'),
      description: t('settings.darkModeDesc', 'Always use dark theme')
    },
    {
      value: 'system',
      icon: <Monitor className="w-4 h-4" />,
      label: t('settings.autoMode'),
      description: t('settings.autoModeDesc', 'Follow system preference')
    }
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex items-center p-1 gap-1 rounded-lg',
          'bg-gray-100 dark:bg-gray-800',
          className
        )}
      >
        {themes.map(({ value, icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              theme === value && 'bg-white dark:bg-gray-700 shadow-sm'
            )}
            title={label}
            aria-label={label}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: cn(
                'w-4 h-4 transition-colors',
                theme === value
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              )
            })}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          className
        )}
        title={`${t('settings.theme')}: ${currentTheme.label}`}
        aria-label={`Toggle theme (current: ${currentTheme.label})`}
      >
        <div className="relative">
          {effectiveTheme === 'dark' ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
          {theme === 'system' && (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </div>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative', className)} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-colors'
          )}
        >
          <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          {showLabel && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentTheme.label}
            </span>
          )}
          {currentTheme.icon}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('settings.theme')}
              </h3>
              {themes.map(({ value, icon, label, description }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2 rounded-lg',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors text-left',
                    theme === value && 'bg-blue-50 dark:bg-blue-900/30'
                  )}
                >
                  <div className="mt-0.5">
                    {React.cloneElement(icon as React.ReactElement, {
                      className: cn(
                        'w-4 h-4',
                        theme === value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      )
                    })}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  </div>
                  {theme === value && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  )}
                </button>
              ))}
            </div>

            {theme === 'system' && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('settings.currentSystemPreference', 'Current system preference')}: {' '}
                  <span className="font-medium">
                    {effectiveTheme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default button variant
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gray-100 dark:bg-gray-800',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'transition-all duration-200',
        className
      )}
      title={`${t('settings.theme')}: ${currentTheme.label}`}
    >
      {currentTheme.icon}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentTheme.label}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;