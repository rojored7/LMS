/**
 * CourseLearning Page
 * Main learning interface for courses
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModules } from '../hooks/useModules';
import { useLesson } from '../hooks/useLessons';
import { useQuiz } from '../hooks/useQuizzes';
import { useLab } from '../hooks/useLabs';
import { useCourseProgress } from '../hooks/useProgress';
import { ModuleSidebar } from '../components/learning/ModuleSidebar';
import { ModuleOverview } from '../components/learning/ModuleOverview';
import { LessonContent } from '../components/learning/LessonContent';
import { QuizTaker } from '../components/learning/QuizTaker';
import { LabExecutor } from '../components/learning/LabExecutor';
import { ProgressBar } from '../components/learning/ProgressBar';
import { LessonNavigation } from '../components/learning/LessonNavigation';
import { Loader } from '../components/common/Loader';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

type ContentType = 'lesson' | 'quiz' | 'lab' | 'module' | null;

export const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contentType, setContentType] = useState<ContentType>(null);
  const [contentId, setContentId] = useState<string | null>(null);

  // Fetch modules
  const { data: modules, isLoading: modulesLoading, error: modulesError } = useModules(courseId!);

  // Create flat list of all content for navigation
  const [flatContentList, setFlatContentList] = useState<
    Array<{ id: string; type: 'lesson' | 'quiz' | 'lab' }>
  >([]);

  useEffect(() => {
    if (modules) {
      const contentList: Array<{ id: string; type: 'lesson' | 'quiz' | 'lab' }> = [];
      modules.forEach((module) => {
        // Add lessons (sorted by order)
        [...module.lessons]
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .forEach((lesson) => {
            contentList.push({ id: lesson.id, type: 'lesson' });
          });
        // Add quizzes
        module.quizzes.forEach((quiz) => {
          contentList.push({ id: quiz.id, type: 'quiz' });
        });
        // Add labs
        module.labs.forEach((lab) => {
          contentList.push({ id: lab.id, type: 'lab' });
        });
      });
      setFlatContentList(contentList);
    }
  }, [modules]);

  // Find current index in flat list
  const currentIndex = flatContentList.findIndex(
    (item) => item.id === contentId && item.type === contentType
  );

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevItem = flatContentList[currentIndex - 1];
      handleContentClick(prevItem.id, prevItem.type);
    }
  };

  const handleNext = () => {
    if (currentIndex < flatContentList.length - 1) {
      const nextItem = flatContentList[currentIndex + 1];
      handleContentClick(nextItem.id, nextItem.type);
    }
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < flatContentList.length - 1 && currentIndex >= 0;

  // Fetch progress
  const { data: progressData } = useCourseProgress(courseId);

  // Fetch current content based on type
  const { data: lesson, isLoading: lessonLoading } = useLesson(
    contentType === 'lesson' ? contentId! : undefined
  );
  const { data: quiz, isLoading: quizLoading } = useQuiz(
    contentType === 'quiz' ? contentId! : undefined
  );
  const { data: lab, isLoading: labLoading } = useLab(
    contentType === 'lab' ? contentId! : undefined
  );

  const handleLessonClick = (lessonId: string) => {
    setContentType('lesson');
    setContentId(lessonId);
  };

  const handleQuizClick = (quizId: string) => {
    setContentType('quiz');
    setContentId(quizId);
  };

  const handleLabClick = (labId: string) => {
    setContentType('lab');
    setContentId(labId);
  };

  // Auto-select first lesson on load
  useEffect(() => {
    if (modules && modules.length > 0 && !contentId) {
      const firstModule = modules[0];
      if (firstModule.lessons.length > 0) {
        handleLessonClick(firstModule.lessons[0].id);
      } else if (firstModule.quizzes.length > 0) {
        handleQuizClick(firstModule.quizzes[0].id);
      } else if (firstModule.labs.length > 0) {
        handleLabClick(firstModule.labs[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, contentId]);

  const handleModuleClick = (moduleId: string) => {
    setContentType('module');
    setContentId(moduleId);
  };

  const handleContentClick = (id: string, type: 'lesson' | 'quiz' | 'lab') => {
    if (type === 'lesson') {
      handleLessonClick(id);
    } else if (type === 'quiz') {
      handleQuizClick(id);
    } else if (type === 'lab') {
      handleLabClick(id);
    }
  };

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}`);
  };

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">ID de curso no válido</p>
      </div>
    );
  }

  if (modulesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar el curso</p>
          <button
            onClick={handleBackToCourse}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al curso
          </button>
        </div>
      </div>
    );
  }

  if (modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const isContentLoading = lessonLoading || quizLoading || labLoading;

  // Get course name from first module
  const courseName = lesson?.module?.course?.title || quiz?.title || lab?.title || 'Curso';
  const moduleName = lesson?.module?.title || 'Modulo';
  const contentName = lesson?.title || quiz?.title || lab?.title || 'Selecciona un contenido';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={handleBackToCourse}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al curso
          </button>
          <div className="flex-1 max-w-xl mx-8">
            <ProgressBar
              progress={progressData?.overallProgress || 0}
              label="Progreso del curso"
              showPercentage
            />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:relative lg:translate-x-0 w-4/5 sm:w-2/3 md:w-96 lg:w-80 h-full bg-white z-50 lg:z-auto transition-transform duration-300 flex-shrink-0 shadow-xl lg:shadow-none`}
        >
          {modules && (
            <ModuleSidebar
              modules={modules}
              moduleProgress={progressData?.modules}
              currentModuleId={contentType === 'module' ? contentId! : undefined}
              currentLessonId={contentType === 'lesson' ? contentId! : undefined}
              currentQuizId={contentType === 'quiz' ? contentId! : undefined}
              currentLabId={contentType === 'lab' ? contentId! : undefined}
              onModuleClick={handleModuleClick}
              onLessonClick={handleLessonClick}
              onQuizClick={handleQuizClick}
              onLabClick={handleLabClick}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 w-full">
          {isContentLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader />
            </div>
          ) : !contentId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-4">
                  Selecciona una lección, quiz o lab del menú lateral
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Abrir menú
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation Breadcrumbs */}
              {contentId && (
                <LessonNavigation
                  courseName={courseName}
                  moduleName={moduleName}
                  lessonName={contentName}
                  courseId={courseId}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                />
              )}

              {/* Content Area */}
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {contentType === 'module' && modules && contentId && (
                  <ModuleOverview
                    module={modules.find((m) => m.id === contentId)!}
                    moduleProgress={progressData?.modules?.find((p) => p.moduleId === contentId)}
                    onContentClick={handleContentClick}
                  />
                )}

                {contentType === 'lesson' && lesson && (
                  <LessonContent lesson={lesson} courseId={courseId!} />
                )}

                {contentType === 'quiz' && quiz && <QuizTaker quiz={quiz} />}

                {contentType === 'lab' && lab && <LabExecutor lab={lab} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
