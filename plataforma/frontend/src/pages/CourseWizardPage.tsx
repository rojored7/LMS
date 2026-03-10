import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Stepper, { Step } from '../components/common/Stepper';
import { useCourseManagement } from '../hooks/useCourseManagement';
import { useUiStore } from '../store/uiStore';

interface CourseWizardData {
  // Basic Info
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  duration: number;
  tags: string[];
  prerequisites: string[];
  objectives: string[];

  // Modules
  modules: Array<{
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      title: string;
      content: string;
      order: number;
    }>;
  }>;
}

const CourseWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const { createCourse } = useCourseManagement();

  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const [wizardData, setWizardData] = useState<CourseWizardData>({
    title: '',
    description: '',
    level: 'BEGINNER',
    duration: 1,
    tags: [],
    prerequisites: [],
    objectives: [],
    modules: [],
  });

  const steps: Step[] = [
    { id: 'basic', title: 'Información básica', description: 'Título y descripción' },
    { id: 'modules', title: 'Módulos', description: 'Estructura del curso' },
    { id: 'content', title: 'Contenido', description: 'Lecciones por módulo' },
    { id: 'assessments', title: 'Evaluaciones', description: 'Quizzes y labs' },
    { id: 'review', title: 'Revisar y publicar', description: 'Confirmación final' },
  ];

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Basic Info
        if (!wizardData.title.trim()) {
          addToast({
            title: 'Error de validación',
            message: 'El título del curso es requerido',
            type: 'error',
            duration: 3000,
          });
          return false;
        }
        if (!wizardData.description.trim()) {
          addToast({
            title: 'Error de validación',
            message: 'La descripción del curso es requerida',
            type: 'error',
            duration: 3000,
          });
          return false;
        }
        return true;

      case 1: // Modules
        if (wizardData.modules.length === 0) {
          addToast({
            title: 'Error de validación',
            message: 'Debes agregar al menos un módulo',
            type: 'error',
            duration: 3000,
          });
          return false;
        }
        return true;

      case 2: // Content
        const hasContent = wizardData.modules.every(m => m.lessons.length > 0);
        if (!hasContent) {
          addToast({
            title: 'Error de validación',
            message: 'Cada módulo debe tener al menos una lección',
            type: 'error',
            duration: 3000,
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleSaveDraft = async () => {
    try {
      const courseData = {
        ...wizardData,
        isPublished: false,
      };
      await createCourse(courseData);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleCreateCourse = async () => {
    setIsCreating(true);
    try {
      const courseData = {
        ...wizardData,
        isPublished: false,
      };
      await createCourse(courseData);

      addToast({
        title: 'Curso creado exitosamente',
        message: `El curso "${wizardData.title}" ha sido creado`,
        type: 'success',
        duration: 5000,
      });

      navigate('/admin/courses');
    } catch (error: any) {
      addToast({
        title: 'Error al crear el curso',
        message: error.message || 'No se pudo crear el curso',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addModule = () => {
    setWizardData({
      ...wizardData,
      modules: [
        ...wizardData.modules,
        {
          title: '',
          description: '',
          order: wizardData.modules.length + 1,
          lessons: [],
        },
      ],
    });
  };

  const updateModule = (index: number, updates: any) => {
    const newModules = [...wizardData.modules];
    newModules[index] = { ...newModules[index], ...updates };
    setWizardData({ ...wizardData, modules: newModules });
  };

  const removeModule = (index: number) => {
    const newModules = wizardData.modules.filter((_, i) => i !== index);
    setWizardData({ ...wizardData, modules: newModules });
  };

  const addLesson = (moduleIndex: number) => {
    const newModules = [...wizardData.modules];
    newModules[moduleIndex].lessons.push({
      title: '',
      content: '',
      order: newModules[moduleIndex].lessons.length + 1,
    });
    setWizardData({ ...wizardData, modules: newModules });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Curso</h1>
                <p className="text-gray-600 mt-1">
                  Sigue los pasos para crear un curso completo
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Guardar borrador
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            orientation="horizontal"
          />
        </div>

        {/* Content */}
        <div className="bg-white shadow-sm rounded-lg p-6 min-h-[500px]">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Información básica del curso</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del curso *
                </label>
                <input
                  type="text"
                  value={wizardData.title}
                  onChange={(e) => setWizardData({ ...wizardData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Introducción a la Ciberseguridad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={wizardData.description}
                  onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe de qué trata el curso..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel *
                  </label>
                  <select
                    value={wizardData.level}
                    onChange={(e) => setWizardData({ ...wizardData, level: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                    <option value="EXPERT">Experto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración estimada (horas) *
                  </label>
                  <input
                    type="number"
                    value={wizardData.duration}
                    onChange={(e) => setWizardData({ ...wizardData, duration: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  value={wizardData.tags.join(', ')}
                  onChange={(e) => setWizardData({
                    ...wizardData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="seguridad, redes, programación"
                />
              </div>
            </div>
          )}

          {/* Step 2: Modules */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Módulos del curso</h2>
                <button
                  onClick={addModule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Agregar módulo
                </button>
              </div>

              {wizardData.modules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p>No hay módulos agregados</p>
                  <button
                    onClick={addModule}
                    className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700"
                  >
                    Agregar el primer módulo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wizardData.modules.map((module, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModule(index, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder={`Título del módulo ${index + 1}`}
                          />
                          <textarea
                            value={module.description}
                            onChange={(e) => updateModule(index, { description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Descripción del módulo (opcional)"
                          />
                        </div>
                        <button
                          onClick={() => removeModule(index)}
                          className="ml-4 text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Content */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Contenido de los módulos</h2>

              {wizardData.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{module.title || `Módulo ${moduleIndex + 1}`}</h3>
                    <button
                      onClick={() => addLesson(moduleIndex)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Agregar lección
                    </button>
                  </div>

                  {module.lessons.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay lecciones en este módulo</p>
                  ) : (
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const newModules = [...wizardData.modules];
                              newModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                              setWizardData({ ...wizardData, modules: newModules });
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded"
                            placeholder={`Lección ${lessonIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Assessments */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Evaluaciones</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  Los quizzes y laboratorios pueden ser agregados después de crear el curso,
                  usando el editor completo de contenido.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="hasQuizzes" className="rounded" />
                  <label htmlFor="hasQuizzes" className="text-gray-700">
                    Este curso incluirá quizzes
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="hasLabs" className="rounded" />
                  <label htmlFor="hasLabs" className="text-gray-700">
                    Este curso incluirá laboratorios de código
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="hasCertificate" className="rounded" />
                  <label htmlFor="hasCertificate" className="text-gray-700">
                    Otorgar certificado al completar el curso
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Revisar y confirmar</h2>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Información del curso</h3>
                  <dl className="mt-2 space-y-2 text-sm">
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Título:</dt>
                      <dd className="text-gray-900">{wizardData.title}</dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Nivel:</dt>
                      <dd className="text-gray-900">{wizardData.level}</dd>
                    </div>
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Duración:</dt>
                      <dd className="text-gray-900">{wizardData.duration} horas</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">Estructura del curso</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="text-gray-900">• {wizardData.modules.length} módulos</li>
                    <li className="text-gray-900">
                      • {wizardData.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones totales
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    El curso será creado como borrador. Podrás editarlo y publicarlo cuando esté listo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white shadow-sm rounded-lg px-6 py-4 mt-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/courses"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </Link>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <span>Siguiente</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleCreateCourse}
                disabled={isCreating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creando...' : 'Crear curso'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseWizardPage;