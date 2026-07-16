import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MarkdownEditor from '../components/common/MarkdownEditor';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import ModuleFormModal from '../components/editor/ModuleFormModal';
import LessonFormModal from '../components/editor/LessonFormModal';
import QuizFormModal from '../components/editor/QuizFormModal';
import LabFormModal from '../components/editor/LabFormModal';
import { useCourseEditorHandlers } from '../hooks/useCourseEditorHandlers';
import type {
  AdminLessonSummary,
  AdminQuizSummary,
  AdminLabSummary,
} from '../services/api/courseManagement.service';

interface SortableLessonItemProps {
  lesson: AdminLessonSummary;
  moduleId: string;
  onEdit: (moduleId: string, lesson: any) => void;
  onDelete: (type: string, id: string, label: string, moduleId: string) => void;
  onClickContent: (content: string, lessonId: string, moduleId: string) => void;
}

const SortableLessonItem: React.FC<SortableLessonItemProps> = ({
  lesson,
  moduleId,
  onEdit,
  onDelete,
  onClickContent,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id || '',
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between group py-1">
      <div className="flex items-center space-x-1 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 flex-shrink-0"
          aria-label="Arrastrar para reordenar leccion"
        >
          <Bars3Icon className="w-3 h-3" />
        </div>
        <div
          onClick={() => onClickContent(lesson.content || '', lesson.id || '', moduleId)}
          className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer truncate"
        >
          {lesson.title}
        </div>
      </div>
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(moduleId, lesson)}
          className="p-0.5 text-gray-400 hover:text-blue-600"
        >
          <PencilIcon className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete('lesson', lesson.id || '', lesson.title, moduleId)}
          className="p-0.5 text-gray-400 hover:text-red-600"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

interface SortableModuleItemProps {
  module: any;
  selectedModuleId: string | null;
  setSelectedModuleId: (id: string | null) => void;
  handleEditModule: (mod: any) => void;
  requestDelete: (type: string, id: string, label: string, moduleId?: string) => void;
}

const SortableModuleItem: React.FC<SortableModuleItemProps> = ({
  module,
  selectedModuleId,
  setSelectedModuleId,
  handleEditModule,
  requestDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id || '',
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedModuleId === module.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 ${isDragging ? 'shadow-lg bg-blue-50 border-blue-200' : isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
            aria-label="Arrastrar para reordenar"
          >
            <Bars3Icon className="w-4 h-4" />
          </div>
          <div
            onClick={() => setSelectedModuleId(isSelected ? null : module.id || null)}
            className={`cursor-pointer flex-1 min-w-0 ${isSelected ? 'text-blue-600' : ''}`}
          >
            <h4 className="font-medium truncate">{module.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{module.lessons?.length || 0} lecciones</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          <button
            onClick={() => handleEditModule(module)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Editar modulo"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => requestDelete('module', module.id || '', module.title)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Eliminar modulo"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    currentCourse,
    isDirty,
    isSaving,
    activeTab,
    updateCourse,
    setActiveTab,
    loading,
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonContent,
    setSelectedLessonContent,
    selectedLessonId,
    setSelectedLessonId,
    setSelectedLessonModuleId,
    showModuleModal,
    setShowModuleModal,
    editingModule,
    showLessonModal,
    setShowLessonModal,
    editingLesson,
    showQuizModal,
    setShowQuizModal,
    editingQuiz,
    showLabModal,
    setShowLabModal,
    editingLab,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteTarget,
    setDeleteTarget,
    deleting,
    loadCourse,
    handleSave,
    handlePublishToggle,
    handleAddModule,
    handleEditModule,
    handleSaveModule,
    handleAddLesson,
    handleEditLesson,
    handleSaveLesson,
    handleSaveLessonContent,
    handleAddQuiz,
    handleEditQuiz,
    handleSaveQuiz,
    handleAddLab,
    handleEditLab,
    handleSaveLab,
    requestDelete,
    handleConfirmDelete,
    handleReorderModules,
    handleReorderLessons,
  } = useCourseEditorHandlers(id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const lessonSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const selectedModule =
    (currentCourse?.modules ?? []).find((m) => m.id === selectedModuleId) ?? null;
  const lessonIds = (selectedModule?.lessons ?? [])
    .map((l) => l.id || '')
    .filter(Boolean);

  const handleLessonDragEnd = (event: DragEndEvent) => {
    if (!selectedModule) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const lessons = selectedModule.lessons || [];
    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(lessons, oldIndex, newIndex);
    const ids = reordered.map((l) => l.id).filter((lid): lid is string => Boolean(lid));
    handleReorderLessons(selectedModule.id || '', ids);
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

  const modules = (currentCourse.modules || []).map((m) => ({ id: m.id || '', title: m.title }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentModules = currentCourse.modules || [];
    const oldIndex = currentModules.findIndex((m) => m.id === active.id);
    const newIndex = currentModules.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(currentModules, oldIndex, newIndex);
    const ids = reordered.map((m) => m.id).filter((id): id is string => Boolean(id));
    if (ids.length !== reordered.length) return;
    handleReorderModules(ids);
  };

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
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${currentCourse.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {currentCourse.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                    {isDirty && (
                      <span className="text-xs text-orange-600">Cambios sin guardar</span>
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'overview' && 'Informacion general'}
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
              <h2 className="text-lg font-semibold mb-6">Informacion del curso</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titulo del curso
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
                    Descripcion
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
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
                      Duracion (horas)
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
                    value={(currentCourse.tags || []).join(', ')}
                    onChange={(e) =>
                      updateCourse({
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter((t) => t),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="seguridad, redes, programacion"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex h-[600px]">
              <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Modulos</h3>
                  <button
                    onClick={handleAddModule}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Agregar modulo</span>
                  </button>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={(currentCourse.modules || []).map((m) => m.id || '')}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {(currentCourse.modules || []).map((module) => (
                        <SortableModuleItem
                          key={module.id}
                          module={module}
                          selectedModuleId={selectedModuleId}
                          setSelectedModuleId={setSelectedModuleId}
                          handleEditModule={handleEditModule}
                          requestDelete={requestDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {selectedModule && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600 truncate">
                        {selectedModule.title}
                      </p>
                      <button
                        onClick={() => handleAddLesson(selectedModule.id || '')}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 flex-shrink-0 ml-2"
                      >
                        <PlusIcon className="w-3 h-3" />
                        <span>Agregar</span>
                      </button>
                    </div>
                    <DndContext
                      sensors={lessonSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleLessonDragEnd}
                    >
                      <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                          {(selectedModule.lessons || []).map((lesson) => (
                            <SortableLessonItem
                              key={lesson.id}
                              lesson={lesson as AdminLessonSummary}
                              moduleId={selectedModule.id || ''}
                              onEdit={handleEditLesson}
                              onDelete={(type, itemId, label, mId) =>
                                requestDelete(type, itemId, label, mId)
                              }
                              onClickContent={(content, lessonId, mId) => {
                                setSelectedLessonContent(content);
                                setSelectedLessonId(lessonId);
                                setSelectedLessonModuleId(mId);
                              }}
                            />
                          ))}
                          {!(selectedModule.lessons?.length) && (
                            <p className="text-xs text-gray-400 py-2 text-center">
                              Sin lecciones — agrega una
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Editor de contenido</h3>
                  {selectedLessonId && (
                    <button
                      onClick={handleSaveLessonContent}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center space-x-1"
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                      <span>Guardar contenido</span>
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <MarkdownEditor
                    value={selectedLessonContent}
                    onChange={(value) => setSelectedLessonContent(value)}
                    height={500}
                    placeholder="Selecciona una leccion para editar su contenido..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Quizzes del curso</h2>
                <button
                  onClick={handleAddQuiz}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Agregar quiz</span>
                </button>
              </div>
              <div className="space-y-4">
                {(currentCourse.modules || []).map(
                  (module) =>
                    module.quizzes &&
                    module.quizzes.length > 0 && (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium mb-3">{module.title}</h3>
                        <div className="space-y-2">
                          {(module.quizzes || []).map((quiz) => (
                            <div
                              key={quiz.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="font-medium">{quiz.title}</p>
                                <p className="text-sm text-gray-500">
                                  {(quiz as unknown as AdminQuizSummary).questionCount || 0}{' '}
                                  preguntas - Puntaje minimo:{' '}
                                  {(quiz as unknown as AdminQuizSummary).passingScore || 0}%
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditQuiz(module.id || '', quiz)}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() =>
                                    requestDelete('quiz', quiz.id || '', quiz.title, module.id)
                                  }
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
                {!(currentCourse.modules || []).some((m) => m.quizzes && m.quizzes.length > 0) && (
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
                <button
                  onClick={handleAddLab}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Agregar laboratorio</span>
                </button>
              </div>
              <div className="space-y-4">
                {(currentCourse.modules || []).map(
                  (module) =>
                    module.labs &&
                    module.labs.length > 0 && (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium mb-3">{module.title}</h3>
                        <div className="space-y-2">
                          {(module.labs || []).map((lab) => (
                            <div
                              key={lab.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="font-medium">{lab.title}</p>
                                <p className="text-sm text-gray-500">
                                  Lenguaje: {lab.language || '?'} -{' '}
                                  {(lab as unknown as AdminLabSummary).testCaseCount || 0} casos de
                                  prueba
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditLab(module.id || '', lab)}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() =>
                                    requestDelete('lab', lab.id || '', lab.title, module.id)
                                  }
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
                {!(currentCourse.modules || []).some((m) => m.labs && m.labs.length > 0) && (
                  <div className="text-center py-12 text-gray-500">
                    No hay laboratorios en este curso
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ModuleFormModal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        onSave={handleSaveModule}
        module={editingModule}
      />
      <LessonFormModal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSave={handleSaveLesson}
        lesson={editingLesson}
      />
      <QuizFormModal
        isOpen={showQuizModal}
        onClose={() => {
          setShowQuizModal(false);
          loadCourse();
        }}
        onSave={handleSaveQuiz}
        quiz={editingQuiz}
        modules={modules}
        courseId={id}
      />
      <LabFormModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onSave={handleSaveLab}
        lab={editingLab}
        modules={modules}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirmar eliminacion"
        message={`Estas seguro de eliminar "${deleteTarget?.label || ''}"? Esta accion no se puede deshacer.`}
        variant="danger"
        confirmText="Eliminar"
        isLoading={deleting}
      />
    </div>
  );
};

export default CourseEditorPage;
