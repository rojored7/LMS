/**
 * Export Button Component
 * HU-039: Universal export functionality with multiple formats
 */

import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Image,
  Printer,
  Check,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ExportFormat {
  id: string;
  label: string;
  icon: React.ReactNode;
  mimeType: string;
  extension: string;
  available: boolean;
}

interface ExportButtonProps {
  data: any;
  filename?: string;
  formats?: ExportFormat[];
  onExport?: (format: string, data: any) => Promise<void>;
  className?: string;
  variant?: 'button' | 'dropdown' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  customExporter?: (format: string, data: any) => Promise<Blob>;
}

const defaultFormats: ExportFormat[] = [
  {
    id: 'pdf',
    label: 'PDF Document',
    icon: <FileText className="w-4 h-4" />,
    mimeType: 'application/pdf',
    extension: 'pdf',
    available: true
  },
  {
    id: 'excel',
    label: 'Excel Spreadsheet',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    available: true
  },
  {
    id: 'csv',
    label: 'CSV File',
    icon: <FileText className="w-4 h-4" />,
    mimeType: 'text/csv',
    extension: 'csv',
    available: true
  },
  {
    id: 'json',
    label: 'JSON Data',
    icon: <FileJson className="w-4 h-4" />,
    mimeType: 'application/json',
    extension: 'json',
    available: true
  },
  {
    id: 'png',
    label: 'PNG Image',
    icon: <Image className="w-4 h-4" />,
    mimeType: 'image/png',
    extension: 'png',
    available: false
  },
  {
    id: 'print',
    label: 'Print',
    icon: <Printer className="w-4 h-4" />,
    mimeType: 'text/html',
    extension: '',
    available: true
  }
];

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'export',
  formats = defaultFormats,
  onExport,
  className,
  variant = 'dropdown',
  size = 'md',
  disabled = false,
  customExporter
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportedFormats, setExportedFormats] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!format.available) return;

    setExportingFormat(format.id);

    try {
      let blob: Blob;

      if (customExporter) {
        blob = await customExporter(format.id, data);
      } else if (onExport) {
        await onExport(format.id, data);
        setExportedFormats(prev => new Set([...prev, format.id]));
        setExportingFormat(null);
        return;
      } else {
        // Default export implementations
        blob = await defaultExport(format, data);
      }

      // Download the file
      downloadBlob(blob, `${filename}-${Date.now()}.${format.extension}`, format.mimeType);

      // Mark as exported
      setExportedFormats(prev => new Set([...prev, format.id]));
    } catch (error) {
      console.error(`Export failed for format ${format.id}:`, error);
      // Show error toast
    } finally {
      setExportingFormat(null);
    }
  };

  const defaultExport = async (format: ExportFormat, data: any): Promise<Blob> => {
    switch (format.id) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: format.mimeType });

      case 'csv':
        return new Blob([convertToCSV(data)], { type: format.mimeType });

      case 'pdf':
        // This would require a PDF library like jsPDF
        return generatePDF(data);

      case 'excel':
        // This would require a library like xlsx
        return generateExcel(data);

      case 'print':
        window.print();
        return new Blob([]);

      default:
        throw new Error(`Unsupported format: ${format.id}`);
    }
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      );

      return [csvHeaders, ...csvRows].join('\n');
    } else {
      // Convert object to CSV
      const entries = Object.entries(data);
      return entries.map(([key, value]) => `${key},${value}`).join('\n');
    }
  };

  const generatePDF = async (data: any): Promise<Blob> => {
    // Simplified PDF generation - in real app, use jsPDF or similar
    const content = `
      <html>
        <head><title>${filename}</title></head>
        <body>
          <h1>${filename}</h1>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
      </html>
    `;
    return new Blob([content], { type: 'application/pdf' });
  };

  const generateExcel = async (data: any): Promise<Blob> => {
    // Simplified Excel generation - in real app, use xlsx library
    return new Blob([convertToCSV(data)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  };

  const downloadBlob = (blob: Blob, filename: string, mimeType: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (variant === 'modal') {
    return (
      <>
        <Button
          onClick={() => setShowModal(true)}
          disabled={disabled}
          size={size}
          className={className}
        >
          <Download className="w-4 h-4 mr-2" />
          {t('common.export')}
        </Button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('export.selectFormat', 'Select Export Format')}
                </h3>

                <div className="space-y-2">
                  {formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => handleExport(format)}
                      disabled={!format.available || exportingFormat === format.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors text-left',
                        !format.available && 'opacity-50 cursor-not-allowed',
                        exportedFormats.has(format.id) && 'bg-green-50 dark:bg-green-900/20'
                      )}
                    >
                      <div className="flex-shrink-0">
                        {exportingFormat === format.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : exportedFormats.has(format.id) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          format.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format.label}
                        </p>
                        {!format.available && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('export.notAvailable', 'Not available')}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format.extension && `.${format.extension}`}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    size="sm"
                  >
                    {t('common.close')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'button') {
    // Single format export button
    const primaryFormat = formats[0];
    return (
      <Button
        onClick={() => handleExport(primaryFormat)}
        disabled={disabled || !primaryFormat.available || exportingFormat === primaryFormat.id}
        size={size}
        className={className}
      >
        {exportingFormat === primaryFormat.id ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {t('common.export')}
      </Button>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        size={size}
        className={className}
      >
        <Download className="w-4 h-4 mr-2" />
        {t('common.export')}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => {
                  handleExport(format);
                  setIsOpen(false);
                }}
                disabled={!format.available || exportingFormat === format.id}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors text-left',
                  !format.available && 'opacity-50 cursor-not-allowed'
                )}
              >
                {exportingFormat === format.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : exportedFormats.has(format.id) ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  format.icon
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {format.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;