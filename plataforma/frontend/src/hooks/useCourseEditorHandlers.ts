import { useState, useEffect, useCallback } from 'react';
import { useCourseEditorStore } from '../store/courseEditorStore';
import { useUiStore } from '../store/uiStore';
import courseManagementService from '../services/api/courseManagement.service';
import { contentEditorService } from '../services/api/contentEditor.service';

interface DeleteTarget {
  type: string;
  id: string;
  moduleId?: string;
  label: string;
}

export function useCourseEditorHandlers(id: string | undefined) {
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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLessonModuleId, setSelectedLessonModuleId] = useState<string | null>(null);

  // Modal states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonTargetModuleId, setLessonTargetModuleId] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCourse = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const course = await courseManagementService.getCourse(id);
      setCourse(course);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el curso';
      addToast({ message, type: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  }, [id, setCourse, addToast]);

  useEffect(() => {
    loadCourse();
    return () => {
      reset();
    };
  }, [id]);

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
        message: 'Los cambios han sido guardados exitosamente',
        type: 'success',
        duration: 3000,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron guardar los cambios';
      addToast({ message, type: 'error', duration: 5000 });
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
        message: currentCourse.isPublished ? 'Curso despublicado' : 'Curso publicado',
        type: 'success',
        duration: 3000,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cambiar el estado del curso';
      addToast({ message, type: 'error', duration: 5000 });
    }
  };

  // Module handlers
  const handleAddModule = () => {
    setEditingModule(null);
    setShowModuleModal(true);
  };

  const handleEditModule = (mod: any) => {
    setEditingModule(mod);
    setShowModuleModal(true);
  };

  const handleSaveModule = async (data: any) => {
    if (!id) return;
    if (editingModule?.id) {
      await contentEditorService.updateModule(id, editingModule.id, data);
    } else {
      await contentEditorService.createModule(id, data);
    }
    await loadCourse();
    addToast({
      message: editingModule ? 'Modulo actualizado' : 'Modulo creado',
      type: 'success',
      duration: 3000,
    });
  };

  // Lesson handlers
  const handleAddLesson = (moduleId: string) => {
    setEditingLesson(null);
    setLessonTargetModuleId(moduleId);
    setShowLessonModal(true);
  };

  const handleEditLesson = (moduleId: string, lesson: any) => {
    setEditingLesson(lesson);
    setLessonTargetModuleId(moduleId);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (data: any) => {
    if (!id || !lessonTargetModuleId) return;
    if (editingLesson?.id) {
      await contentEditorService.updateLesson(id, lessonTargetModuleId, editingLesson.id, data);
    } else {
      await contentEditorService.createLesson(id, lessonTargetModuleId, data);
    }
    await loadCourse();
    addToast({
      message: editingLesson ? 'Leccion actualizada' : 'Leccion creada',
      type: 'success',
      duration: 3000,
    });
  };

  const handleSaveLessonContent = async () => {
    if (!id || !selectedLessonModuleId || !selectedLessonId) return;
    try {
      await contentEditorService.updateLesson(id, selectedLessonModuleId, selectedLessonId, {
        content: selectedLessonContent,
      });
      await loadCourse();
      addToast({
        message: 'El contenido de la leccion se guardo correctamente',
        type: 'success',
        duration: 3000,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo guardar el contenido';
      addToast({ message, type: 'error', duration: 5000 });
    }
  };

  // Quiz handlers
  const handleAddQuiz = () => {
    setEditingQuiz(null);
    setShowQuizModal(true);
  };

  const handleEditQuiz = (moduleId: string, quiz: any) => {
    setEditingQuiz({ ...quiz, moduleId });
    setShowQuizModal(true);
  };

  const handleSaveQuiz = async (moduleId: string, data: any) => {
    if (!id) return;
    if (editingQuiz?.id) {
      await contentEditorService.updateQuiz(id, moduleId, editingQuiz.id, data);
    } else {
      await contentEditorService.createQuiz(id, moduleId, data);
    }
    await loadCourse();
    addToast({
      message: editingQuiz ? 'Quiz actualizado' : 'Quiz creado',
      type: 'success',
      duration: 3000,
    });
  };

  // Lab handlers
  const handleAddLab = () => {
    setEditingLab(null);
    setShowLabModal(true);
  };

  const handleEditLab = (moduleId: string, lab: any) => {
    setEditingLab({ ...lab, moduleId });
    setShowLabModal(true);
  };

  const handleSaveLab = async (moduleId: string, data: any) => {
    if (!id) return;
    if (editingLab?.id) {
      await contentEditorService.updateLab(id, moduleId, editingLab.id, data);
    } else {
      await contentEditorService.createLab(id, moduleId, data);
    }
    await loadCourse();
    addToast({
      message: editingLab ? 'Laboratorio actualizado' : 'Laboratorio creado',
      type: 'success',
      duration: 3000,
    });
  };

  // Reorder handlers
  const handleReorderModules = async (orderedModuleIds: string[]) => {
    if (!id) return;
    try {
      await contentEditorService.reorderModules(id, orderedModuleIds);
      await loadCourse();
      addToast({ message: 'Orden de modulos actualizado', type: 'success', duration: 3000 });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo reordenar los modulos';
      addToast({ message, type: 'error', duration: 5000 });
    }
  };

  // Delete handler
  const requestDelete = (type: string, itemId: string, label: string, moduleId?: string) => {
    setDeleteTarget({ type, id: itemId, moduleId, label });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id || !deleteTarget) return;
    setDeleting(true);
    try {
      switch (deleteTarget.type) {
        case 'module':
          await contentEditorService.deleteModule(id, deleteTarget.id);
          break;
        case 'lesson':
          if (deleteTarget.moduleId) {
            await contentEditorService.deleteLesson(id, deleteTarget.moduleId, deleteTarget.id);
          }
          break;
        case 'quiz':
          await contentEditorService.deleteQuiz(id, deleteTarget.moduleId || '', deleteTarget.id);
          break;
        case 'lab':
          await contentEditorService.deleteLab(id, deleteTarget.moduleId || '', deleteTarget.id);
          break;
      }
      await loadCourse();
      addToast({
        message: `${deleteTarget.label} eliminado correctamente`,
        type: 'success',
        duration: 3000,
      });
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar';
      addToast({ message, type: 'error', duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  return {
    // Store state
    currentCourse,
    isDirty,
    isSaving,
    activeTab,
    updateCourse,
    setActiveTab,

    // Loading
    loading,

    // Module tree selection
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonContent,
    setSelectedLessonContent,
    selectedLessonId,
    setSelectedLessonId,
    selectedLessonModuleId,
    setSelectedLessonModuleId,

    // Modal visibility
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

    // Handlers
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
  };
}
