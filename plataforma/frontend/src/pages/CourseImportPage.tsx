import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import FileUploadZone from '../components/common/FileUploadZone';
import useCourseImport from '../hooks/useCourseImport';

const CourseImportPage: React.FC = () => {
  const {
    file,
    setFile,
    uploading,
    uploadProgress,
    validation,
    error,
    validateZip,
    importCourse,
    resetState,
  } = useCourseImport();

  const [showValidation, setShowValidation] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setShowValidation(false);
      // Auto-validate on drop
      handleValidate(selectedFile);
    }
  }, [setFile]);

  const handleValidate = async (fileToValidate?: File) => {
    const targetFile = fileToValidate || file;
    if (!targetFile) return;

    setShowValidation(true);
    await validateZip(targetFile);
  };

  const handleImport = async () => {
    if (!file || !validation?.valid) return;

    setIsImporting(true);
    await importCourse(file);
    setIsImporting(false);
  };

  const handleRemoveFile = () => {
    resetState();
    setShowValidation(false);
    setIsImporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/courses"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Importar Curso desde ZIP</h1>
                <p className="text-gray-600 mt-1">
                  Carga un archivo ZIP con la estructura del curso para importarlo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          {/* File Upload Zone */}
          <div className="mb-8">
            <FileUploadZone
              onDrop={onDrop}
              onRemove={handleRemoveFile}
              file={file}
              disabled={uploading || isImporting}
              uploading={uploading}
              uploadProgress={uploadProgress}
              error={error}
            />
          </div>

          {/* Validation Results */}
          {showValidation && validation && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Resultados de Validación</h3>

              {/* Validation Status */}
              <div className={`
                p-4 rounded-lg mb-4
                ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
              `}>
                <div className="flex items-center">
                  {validation.valid ? (
                    <>
                      <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">Validación exitosa</p>
                        <p className="text-green-700 text-sm mt-1">
                          El archivo ZIP es válido y puede ser importado
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                      <div>
                        <p className="font-medium text-red-900">Validación fallida</p>
                        <p className="text-red-700 text-sm mt-1">
                          Se encontraron errores que deben ser corregidos
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Errors */}
              {validation.errors && validation.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-900 mb-2">Errores encontrados:</h4>
                  <ul className="space-y-2">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <div>
                          <span className="font-medium text-red-900">{error.field}:</span>{' '}
                          <span className="text-red-700">{error.message}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Advertencias:</h4>
                  <ul className="space-y-2">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">⚠</span>
                        <div>
                          <span className="font-medium text-yellow-900">{warning.field}:</span>{' '}
                          <span className="text-yellow-700">{warning.message}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Course Preview */}
              {validation.preview && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Vista previa del curso:</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Título:</span>{' '}
                      <span className="text-gray-900">{validation.preview.title}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Descripción:</span>{' '}
                      <span className="text-gray-900">{validation.preview.description}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Nivel:</span>{' '}
                      <span className="text-gray-900">{validation.preview.level}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duración:</span>{' '}
                      <span className="text-gray-900">{validation.preview.duration} horas</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Módulos ({validation.preview.modules.length}):
                      </h5>
                      <ul className="space-y-2 ml-4">
                        {validation.preview.modules.map((module, index) => (
                          <li key={index} className="text-gray-900">
                            <span className="font-medium">{module.title}</span>
                            <span className="text-gray-600 text-sm ml-2">
                              ({module.lessons} lecciones, {module.quizzes} quizzes, {module.labs} labs)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Link
              to="/admin/courses"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </Link>

            <div className="space-x-3">
              {file && !showValidation && (
                <button
                  onClick={() => handleValidate()}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Validar ZIP
                </button>
              )}

              {validation?.valid && (
                <button
                  onClick={handleImport}
                  disabled={isImporting || uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isImporting ? 'Importando...' : 'Confirmar Importación'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Instrucciones</h3>
          <div className="prose prose-sm text-gray-600">
            <ol className="space-y-2">
              <li>
                El archivo ZIP debe contener la estructura completa del curso con todos sus módulos,
                lecciones, quizzes y laboratorios.
              </li>
              <li>
                La estructura debe seguir el formato estándar con archivos Markdown para el contenido
                y archivos JSON para la configuración.
              </li>
              <li>
                El tamaño máximo del archivo es de 50MB. Si tu curso es más grande, considera
                dividirlo en múltiples archivos.
              </li>
              <li>
                Después de la importación, podrás editar y personalizar el contenido del curso
                usando el editor visual.
              </li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Estructura esperada del ZIP:</h4>
            <pre className="text-xs text-blue-800 overflow-x-auto">
{`curso/
├── config.json
├── README.md
├── modules/
│   ├── 01_introduccion/
│   │   ├── module.json
│   │   ├── lessons/
│   │   │   ├── 01_bienvenida.md
│   │   │   └── 02_objetivos.md
│   │   ├── quizzes/
│   │   │   └── quiz_01.json
│   │   └── labs/
│   │       └── lab_01.json
│   └── 02_fundamentos/
│       └── ...
└── assets/
    ├── images/
    └── videos/`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseImportPage;