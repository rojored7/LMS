import api from '../api';
import {
  CourseModule,
  CourseLesson,
  CourseQuiz,
  CourseLab,
  QuizQuestion,
  TestCase,
} from './courseManagement.service';

class ContentEditorService {
  private baseURL = '/admin/courses';

  /**
   * Module CRUD operations
   */
  async createModule(courseId: string, module: Omit<CourseModule, 'id'>): Promise<CourseModule> {
    const response = await api.post(`${this.baseURL}/${courseId}/modules`, module);
    return response.data.module;
  }

  async updateModule(
    courseId: string,
    moduleId: string,
    updates: Partial<CourseModule>
  ): Promise<CourseModule> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}`,
      updates
    );
    return response.data.module;
  }

  async deleteModule(courseId: string, moduleId: string): Promise<void> {
    await api.delete(`${this.baseURL}/${courseId}/modules/${moduleId}`);
  }

  async reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
    await api.put(`${this.baseURL}/${courseId}/modules/reorder`, {
      moduleIds,
    });
  }

  /**
   * Lesson CRUD operations
   */
  async createLesson(
    courseId: string,
    moduleId: string,
    lesson: Omit<CourseLesson, 'id'>
  ): Promise<CourseLesson> {
    const response = await api.post(
      `${this.baseURL}/${courseId}/modules/${moduleId}/lessons`,
      lesson
    );
    return response.data.lesson;
  }

  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updates: Partial<CourseLesson>
  ): Promise<CourseLesson> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      updates
    );
    return response.data.lesson;
  }

  async deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<void> {
    await api.delete(
      `${this.baseURL}/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );
  }

  async reorderLessons(
    courseId: string,
    moduleId: string,
    lessonIds: string[]
  ): Promise<void> {
    await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/lessons/reorder`,
      {
        lessonIds,
      }
    );
  }

  /**
   * Quiz CRUD operations
   */
  async createQuiz(
    courseId: string,
    moduleId: string,
    quiz: Omit<CourseQuiz, 'id'>
  ): Promise<CourseQuiz> {
    const response = await api.post(
      `${this.baseURL}/${courseId}/modules/${moduleId}/quizzes`,
      quiz
    );
    return response.data.quiz;
  }

  async updateQuiz(
    courseId: string,
    moduleId: string,
    quizId: string,
    updates: Partial<CourseQuiz>
  ): Promise<CourseQuiz> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/quizzes/${quizId}`,
      updates
    );
    return response.data.quiz;
  }

  async deleteQuiz(courseId: string, moduleId: string, quizId: string): Promise<void> {
    await api.delete(
      `${this.baseURL}/${courseId}/modules/${moduleId}/quizzes/${quizId}`
    );
  }

  /**
   * Quiz Question operations
   */
  async addQuestion(
    courseId: string,
    moduleId: string,
    quizId: string,
    question: Omit<QuizQuestion, 'id'>
  ): Promise<QuizQuestion> {
    const response = await api.post(
      `${this.baseURL}/${courseId}/modules/${moduleId}/quizzes/${quizId}/questions`,
      question
    );
    return response.data.question;
  }

  async updateQuestion(
    courseId: string,
    moduleId: string,
    quizId: string,
    questionId: string,
    updates: Partial<QuizQuestion>
  ): Promise<QuizQuestion> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/quizzes/${quizId}/questions/${questionId}`,
      updates
    );
    return response.data.question;
  }

  async deleteQuestion(
    courseId: string,
    moduleId: string,
    quizId: string,
    questionId: string
  ): Promise<void> {
    await api.delete(
      `${this.baseURL}/${courseId}/modules/${moduleId}/quizzes/${quizId}/questions/${questionId}`
    );
  }

  /**
   * Lab CRUD operations
   */
  async createLab(
    courseId: string,
    moduleId: string,
    lab: Omit<CourseLab, 'id'>
  ): Promise<CourseLab> {
    const response = await api.post(
      `${this.baseURL}/${courseId}/modules/${moduleId}/labs`,
      lab
    );
    return response.data.lab;
  }

  async updateLab(
    courseId: string,
    moduleId: string,
    labId: string,
    updates: Partial<CourseLab>
  ): Promise<CourseLab> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/labs/${labId}`,
      updates
    );
    return response.data.lab;
  }

  async deleteLab(courseId: string, moduleId: string, labId: string): Promise<void> {
    await api.delete(`${this.baseURL}/${courseId}/modules/${moduleId}/labs/${labId}`);
  }

  /**
   * Test Case operations
   */
  async addTestCase(
    courseId: string,
    moduleId: string,
    labId: string,
    testCase: Omit<TestCase, 'id'>
  ): Promise<TestCase> {
    const response = await api.post(
      `${this.baseURL}/${courseId}/modules/${moduleId}/labs/${labId}/test-cases`,
      testCase
    );
    return response.data.testCase;
  }

  async updateTestCase(
    courseId: string,
    moduleId: string,
    labId: string,
    testCaseId: string,
    updates: Partial<TestCase>
  ): Promise<TestCase> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/labs/${labId}/test-cases/${testCaseId}`,
      updates
    );
    return response.data.testCase;
  }

  async deleteTestCase(
    courseId: string,
    moduleId: string,
    labId: string,
    testCaseId: string
  ): Promise<void> {
    await api.delete(
      `${this.baseURL}/${courseId}/modules/${moduleId}/labs/${labId}/test-cases/${testCaseId}`
    );
  }

  /**
   * Content validation
   */
  validateModuleData(module: Partial<CourseModule>): string[] {
    const errors: string[] = [];

    if (!module.title || module.title.trim().length < 3) {
      errors.push('El título del módulo debe tener al menos 3 caracteres');
    }

    if (module.order !== undefined && module.order < 1) {
      errors.push('El orden del módulo debe ser mayor a 0');
    }

    return errors;
  }

  validateLessonData(lesson: Partial<CourseLesson>): string[] {
    const errors: string[] = [];

    if (!lesson.title || lesson.title.trim().length < 3) {
      errors.push('El título de la lección debe tener al menos 3 caracteres');
    }

    if (!lesson.content || lesson.content.trim().length < 10) {
      errors.push('El contenido de la lección debe tener al menos 10 caracteres');
    }

    if (lesson.order !== undefined && lesson.order < 1) {
      errors.push('El orden de la lección debe ser mayor a 0');
    }

    return errors;
  }

  validateQuizData(quiz: Partial<CourseQuiz>): string[] {
    const errors: string[] = [];

    if (!quiz.title || quiz.title.trim().length < 3) {
      errors.push('El título del quiz debe tener al menos 3 caracteres');
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      errors.push('El quiz debe tener al menos una pregunta');
    }

    if (quiz.passingScore !== undefined && (quiz.passingScore < 0 || quiz.passingScore > 100)) {
      errors.push('La puntuación de aprobación debe estar entre 0 y 100');
    }

    return errors;
  }

  validateLabData(lab: Partial<CourseLab>): string[] {
    const errors: string[] = [];

    if (!lab.title || lab.title.trim().length < 3) {
      errors.push('El título del laboratorio debe tener al menos 3 caracteres');
    }

    if (!lab.instructions || lab.instructions.trim().length < 10) {
      errors.push('Las instrucciones del laboratorio deben tener al menos 10 caracteres');
    }

    if (!lab.language) {
      errors.push('Debes seleccionar un lenguaje de programación');
    }

    return errors;
  }

  /**
   * Auto-save functionality
   */
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  setupAutoSave(
    saveFunction: () => Promise<void>,
    delay: number = 3000
  ): () => void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await saveFunction();
      } catch (error) {
        console.error('Error en auto-guardado:', error);
      }
    }, delay);

    // Return cleanup function
    return () => {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = null;
      }
    };
  }
}

export const contentEditorService = new ContentEditorService();
export default contentEditorService;