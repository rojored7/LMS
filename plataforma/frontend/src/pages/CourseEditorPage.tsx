import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import MarkdownEditor from '../components/common/MarkdownEditor';
import { useCourseEditorStore } from '../store/courseEditorStore';
import { useUiStore } from '../store/uiStore';
import courseManagementService from '../services/api/courseManagement.service';

const CourseEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUiStore();

  const {
    currentCourse,
    isDirty,
    isSaving,
    activeTab,
    setCourse,
    updateCourse,
    saveCourse,
    setActiveTab,
    reset,
  } = useCourseEditorStore();

  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonContent, setSelectedLessonContent] = useState('');

  useEffect(() => {
    loadCourse();
    return () => {
      reset();
    };
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const course = await courseManagementService.getCourse(id);
      setCourse(course);
      setLoading(false);
    } catch (error: any) {
      addToast({
        title: 'Error al cargar el curso',
        message: error.message || 'No se pudo cargar el curso',
        type: 'error',
        duration: 5000,
      });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCourse || !id) return;

    try {
      await courseManagementService.updateCourse(id, {
        title: currentCourse.title,
        description: currentCourse.description,
        level: currentCourse.level,
        duration: currentCourse.duration,
        tags: currentCourse.tags,
        prerequisites: currentCourse.prerequisites,
        objectives: currentCourse.objectives,
      });

      await saveCourse();

      addToast({
        title: 'Curso guardado',
        message: 'Los cambios han sido guardados exitosamente',
        type: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        title: 'Error al guardar',
        message: error.message || 'No se pudieron guardar los cambios',
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handlePublishToggle = async () => {
    if (!currentCourse || !id) return;

    try {
      if (currentCourse.isPublished) {
        await courseManagementService.unpublishCourse(id);
        updateCourse({ isPublished: false });
      } else {
        await courseManagementService.publishCourse(id);
        updateCourse({ isPublished: true });
      }

      addToast({
        title: currentCourse.isPublished ? 'Curso despublicado' : 'Curso publicado',
        message: currentCourse.isPublished
          ? 'El curso ya no está disponible para estudiantes'
          : 'El curso ahora está disponible para estudiantes',
        type: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        title: 'Error',
        message: error.message || 'No se pudo cambiar el estado del curso',
        type: 'error',
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Curso no encontrado</p>
          <Link
            to="/admin/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a cursos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin/courses"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{currentCourse.title}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`
                      inline-flex px-2 py-0.5 text-xs font-medium rounded-full
                      ${currentCourse.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {currentCourse.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                    {isDirty && (
                      <span className="text-xs text-orange-600">• Cambios sin guardar</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePublishToggle}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {currentCourse.isPublished ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['overview', 'content', 'quizzes', 'labs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab === 'overview' && 'Información general'}
                {tab === 'content' && 'Contenido'}
                {tab === 'quizzes' && 'Quizzes'}
                {tab === 'labs' && 'Laboratorios'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Información del curso</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del curso
                  </label>
                  <input
                    type="text"
                    value={currentCourse.title}
                    onChange={(e) => updateCourse({ title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={currentCourse.description}
                    onChange={(e) => updateCourse({ description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nivel
                    </label>
                    <select
                      value={currentCourse.level}
                      onChange={(e) => updateCourse({ level: e.target.value as any })}
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
                      Duración (horas)
                    </label>
                    <input
                      type="number"
                      value={currentCourse.duration}
                      onChange={(e) => updateCourse({ duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={currentCourse.tags.join(', ')}
                    onChange={(e) => updateCourse({
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="seguridad, redes, programación"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex h-[600px]">
              {/* Module Tree */}
              <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Módulos</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    + Agregar módulo
                  </button>
                </div>

                <div className="space-y-2">
                  {(currentCourse.modules || []).map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-3">
                      <div
                        onClick={() => setSelectedModuleId(module.id || null)}
                        className={`cursor-pointer ${selectedModuleId === module.id ? 'text-blue-600' : ''}`}
                      >
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {module.lessons?.length || 0} lecciones
                        </p>
                      </div>

                      {selectedModuleId === module.id && module.lessons && (
                        <div className="mt-3 ml-4 space-y-1">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={() => setSelectedLessonContent(lesson.content)}
                              className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer py-1"
                            >
                              • {lesson.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lesson Editor */}
              <div className="flex-1 p-4">
                <h3 className="font-semibold mb-4">Editor de contenido</h3>
                <MarkdownEditor
                  value={selectedLessonContent}
                  onChange={(value) => setSelectedLessonContent(value)}
                  height={500}
                  placeholder="Selecciona una lección para editar su contenido..."
                />
              </div>
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Quizzes del curso</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Agregar quiz
                </button>
              </div>

              <div className="space-y-4">
                {(currentCourse.modules || []).map((module) => (
                  module.quizzes && module.quizzes.length > 0 && (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium mb-3">{module.title}</h3>
                      <div className="space-y-2">
                        {module.quizzes.map((quiz) => (
                          <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{quiz.title}</p>
                              <p className="text-sm text-gray-500">
                                {quiz.questions.length} preguntas • Puntaje mínimo: {quiz.passingScore}%
                              </p>
                            </div>
                            <button className="text-blue-600 hover:text-blue-700">
                              Editar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {!(currentCourse.modules || []).some(m => m.quizzes && m.quizzes.length > 0) && (
                  <div className="text-center py-12 text-gray-500">
                    No hay quizzes en este curso
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Laboratorios del curso</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Agregar laboratorio
                </button>
              </div>

              <div className="space-y-4">
                {(currentCourse.modules || []).map((module) => (
                  module.labs && module.labs.length > 0 && (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium mb-3">{module.title}</h3>
                      <div className="space-y-2">
                        {module.labs.map((lab) => (
                          <div key={lab.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{lab.title}</p>
                              <p className="text-sm text-gray-500">
                                Lenguaje: {lab.language} • {lab.testCases?.length || 0} casos de prueba
                              </p>
                            </div>
                            <button className="text-blue-600 hover:text-blue-700">
                              Editar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {!(currentCourse.modules || []).some(m => m.labs && m.labs.length > 0) && (
                  <div className="text-center py-12 text-gray-500">
                    No hay laboratorios en este curso
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseEditorPage;