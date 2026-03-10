/**
 * LanguageSelector Component
 * HU-036: Multi-language support with persistence
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { languages } from '../../i18n/config';
import { cn } from '../../utils/cn';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'inline' | 'compact';
  showFlag?: boolean;
  showName?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
  variant = 'dropdown',
  showFlag = true,
  showName = true
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);

    // Store preference
    localStorage.setItem('preferredLanguage', langCode);

    // Update HTML lang attribute
    document.documentElement.lang = langCode;
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              i18n.language === lang.code
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400'
            )}
            title={lang.nativeName}
          >
            {showFlag && <span className="mr-1.5">{lang.flag}</span>}
            {showName && <span className="font-medium">{lang.code.toUpperCase()}</span>}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Change language"
        >
          <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'w-full p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700',
                  'first:rounded-t-lg last:rounded-b-lg',
                  i18n.language === lang.code && 'bg-blue-50 dark:bg-blue-900/30'
                )}
                title={lang.nativeName}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
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
        <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        {showFlag && <span className="text-lg">{currentLanguage.flag}</span>}
        {showName && (
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
            {currentLanguage.nativeName}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors',
                  i18n.language === lang.code && 'bg-blue-50 dark:bg-blue-900/30'
                )}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lang.name}
                  </p>
                </div>
                {i18n.language === lang.code && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Language preference is saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;