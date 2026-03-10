import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CourseModule, CourseLesson, CourseQuiz, CourseLab } from '../services/api/courseManagement.service';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  duration: number;
  thumbnail?: string;
  tags: string[];
  prerequisites: string[];
  objectives: string[];
  isPublished: boolean;
  modules: CourseModule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseEditorState {
  // Current course being edited
  currentCourse: Course | null;
  originalCourse: Course | null; // For tracking changes

  // UI state
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;

  // Selected items
  selectedModule: CourseModule | null;
  selectedLesson: CourseLesson | null;
  selectedQuiz: CourseQuiz | null;
  selectedLab: CourseLab | null;

  // Editor modes
  editorMode: 'edit' | 'preview';
  activeTab: 'overview' | 'content' | 'quizzes' | 'labs';

  // Actions - Course
  setCourse: (course: Course) => void;
  updateCourse: (updates: Partial<Course>) => void;
  saveCourse: () => Promise<void>;
  resetCourse: () => void;

  // Actions - Modules
  addModule: (module: CourseModule) => void;
  updateModule: (moduleId: string, updates: Partial<CourseModule>) => void;
  deleteModule: (moduleId: string) => void;
  reorderModules: (moduleIds: string[]) => void;
  selectModule: (module: CourseModule | null) => void;

  // Actions - Lessons
  addLesson: (moduleId: string, lesson: CourseLesson) => void;
  updateLesson: (moduleId: string, lessonId: string, updates: Partial<CourseLesson>) => void;
  deleteLesson: (moduleId: string, lessonId: string) => void;
  selectLesson: (lesson: CourseLesson | null) => void;

  // Actions - Quizzes
  addQuiz: (moduleId: string, quiz: CourseQuiz) => void;
  updateQuiz: (moduleId: string, quizId: string, updates: Partial<CourseQuiz>) => void;
  deleteQuiz: (moduleId: string, quizId: string) => void;
  selectQuiz: (quiz: CourseQuiz | null) => void;

  // Actions - Labs
  addLab: (moduleId: string, lab: CourseLab) => void;
  updateLab: (moduleId: string, labId: string, updates: Partial<CourseLab>) => void;
  deleteLab: (moduleId: string, labId: string) => void;
  selectLab: (lab: CourseLab | null) => void;

  // Actions - UI
  setEditorMode: (mode: 'edit' | 'preview') => void;
  toggleEditorMode: () => void;
  setActiveTab: (tab: 'overview' | 'content' | 'quizzes' | 'labs') => void;
  setError: (error: string | null) => void;
  setIsDirty: (dirty: boolean) => void;

  // Utility
  hasUnsavedChanges: () => boolean;
  reset: () => void;
}

const initialState = {
  currentCourse: null,
  originalCourse: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  error: null,
  selectedModule: null,
  selectedLesson: null,
  selectedQuiz: null,
  selectedLab: null,
  editorMode: 'edit' as const,
  activeTab: 'overview' as const,
};

export const useCourseEditorStore = create<CourseEditorState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Course actions
        setCourse: (course) => set({
          currentCourse: course,
          originalCourse: JSON.parse(JSON.stringify(course)),
          isDirty: false,
          error: null,
        }),

        updateCourse: (updates) => set((state) => ({
          currentCourse: state.currentCourse ? { ...state.currentCourse, ...updates } : null,
          isDirty: true,
        })),

        saveCourse: async () => {
          const { currentCourse } = get();
          if (!currentCourse) return;

          set({ isSaving: true, error: null });
          try {
            // API call would go here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated save

            set({
              originalCourse: JSON.parse(JSON.stringify(currentCourse)),
              isDirty: false,
              isSaving: false,
            });
          } catch (error: any) {
            set({
              error: error.message || 'Error al guardar el curso',
              isSaving: false,
            });
          }
        },

        resetCourse: () => set((state) => ({
          currentCourse: state.originalCourse ? JSON.parse(JSON.stringify(state.originalCourse)) : null,
          isDirty: false,
          error: null,
        })),

        // Module actions
        addModule: (module) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = [...state.currentCourse.modules, module];
          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        updateModule: (moduleId, updates) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m =>
            m.id === moduleId ? { ...m, ...updates } : m
          );
          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        deleteModule: (moduleId) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.filter(m => m.id !== moduleId);
          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            selectedModule: state.selectedModule?.id === moduleId ? null : state.selectedModule,
            isDirty: true,
          };
        }),

        reorderModules: (moduleIds) => set((state) => {
          if (!state.currentCourse) return state;

          const moduleMap = new Map(state.currentCourse.modules.map(m => [m.id, m]));
          const newModules = moduleIds
            .map(id => moduleMap.get(id))
            .filter(Boolean) as CourseModule[];

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        selectModule: (module) => set({ selectedModule: module }),

        // Lesson actions
        addLesson: (moduleId, lesson) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId) {
              const lessons = m.lessons || [];
              return { ...m, lessons: [...lessons, lesson] };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        updateLesson: (moduleId, lessonId, updates) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId && m.lessons) {
              const newLessons = m.lessons.map(l =>
                l.id === lessonId ? { ...l, ...updates } : l
              );
              return { ...m, lessons: newLessons };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        deleteLesson: (moduleId, lessonId) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId && m.lessons) {
              const newLessons = m.lessons.filter(l => l.id !== lessonId);
              return { ...m, lessons: newLessons };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            selectedLesson: state.selectedLesson?.id === lessonId ? null : state.selectedLesson,
            isDirty: true,
          };
        }),

        selectLesson: (lesson) => set({ selectedLesson: lesson }),

        // Quiz actions
        addQuiz: (moduleId, quiz) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId) {
              const quizzes = m.quizzes || [];
              return { ...m, quizzes: [...quizzes, quiz] };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        updateQuiz: (moduleId, quizId, updates) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId && m.quizzes) {
              const newQuizzes = m.quizzes.map(q =>
                q.id === quizId ? { ...q, ...updates } : q
              );
              return { ...m, quizzes: newQuizzes };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        deleteQuiz: (moduleId, quizId) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId && m.quizzes) {
              const newQuizzes = m.quizzes.filter(q => q.id !== quizId);
              return { ...m, quizzes: newQuizzes };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            selectedQuiz: state.selectedQuiz?.id === quizId ? null : state.selectedQuiz,
            isDirty: true,
          };
        }),

        selectQuiz: (quiz) => set({ selectedQuiz: quiz }),

        // Lab actions
        addLab: (moduleId, lab) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId) {
              const labs = m.labs || [];
              return { ...m, labs: [...labs, lab] };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        updateLab: (moduleId, labId, updates) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId && m.labs) {
              const newLabs = m.labs.map(l =>
                l.id === labId ? { ...l, ...updates } : l
              );
              return { ...m, labs: newLabs };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            isDirty: true,
          };
        }),

        deleteLab: (moduleId, labId) => set((state) => {
          if (!state.currentCourse) return state;

          const newModules = state.currentCourse.modules.map(m => {
            if (m.id === moduleId && m.labs) {
              const newLabs = m.labs.filter(l => l.id !== labId);
              return { ...m, labs: newLabs };
            }
            return m;
          });

          return {
            currentCourse: { ...state.currentCourse, modules: newModules },
            selectedLab: state.selectedLab?.id === labId ? null : state.selectedLab,
            isDirty: true,
          };
        }),

        selectLab: (lab) => set({ selectedLab: lab }),

        // UI actions
        setEditorMode: (mode) => set({ editorMode: mode }),

        toggleEditorMode: () => set((state) => ({
          editorMode: state.editorMode === 'edit' ? 'preview' : 'edit',
        })),

        setActiveTab: (tab) => set({ activeTab: tab }),

        setError: (error) => set({ error }),

        setIsDirty: (dirty) => set({ isDirty: dirty }),

        // Utility
        hasUnsavedChanges: () => get().isDirty,

        reset: () => set(initialState),
      }),
      {
        name: 'course-editor-storage',
        partialize: (state) => ({
          currentCourse: state.currentCourse,
          originalCourse: state.originalCourse,
          activeTab: state.activeTab,
          editorMode: state.editorMode,
        }),
      }
    ),
    {
      name: 'CourseEditorStore',
    }
  )
);

export default useCourseEditorStore;