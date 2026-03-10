import api from '../api';

export interface CourseFilters {
  search?: string;
  level?: string;
  status?: 'published' | 'draft' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CourseListResponse {
  courses: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseCreateData {
  title: string;
  slug?: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  duration: number;
  thumbnail?: string;
  tags?: string[];
  prerequisites?: string[];
  objectives?: string[];
  isPublished?: boolean;
}

export interface CourseUpdateData extends Partial<CourseCreateData> {
  id?: string;
}

export interface CourseModule {
  id?: string;
  title: string;
  description?: string;
  order: number;
  lessons?: CourseLesson[];
  quizzes?: CourseQuiz[];
  labs?: CourseLab[];
}

export interface CourseLesson {
  id?: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  order: number;
}

export interface CourseQuiz {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts?: number;
  order: number;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

export interface CourseLab {
  id?: string;
  title: string;
  description?: string;
  instructions: string;
  codeTemplate?: string;
  language: 'python' | 'javascript' | 'bash';
  testCases?: TestCase[];
  order: number;
}

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  description?: string;
}

class CourseManagementService {
  private baseURL = '/admin/courses';

  /**
   * Get list of courses with filters
   */
  async getCourses(filters?: CourseFilters): Promise<CourseListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`${this.baseURL}?${params.toString()}`);
    // Backend returns { success: true, data: { courses: [], total: 1, ... } }
    // We need to unwrap the 'data' field to match CourseListResponse type
    // If response.data.data doesn't exist, it means the response is already unwrapped or it's an error
    return response.data.data || response.data;
  }

  /**
   * Get single course with full content
   */
  async getCourse(id: string): Promise<any> {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response.data.course;
  }

  /**
   * Create new course manually
   */
  async createCourse(data: CourseCreateData): Promise<any> {
    const response = await api.post(this.baseURL, data);
    return response.data.course;
  }

  /**
   * Update course metadata
   */
  async updateCourse(id: string, data: CourseUpdateData): Promise<any> {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response.data.course;
  }

  /**
   * Delete course
   */
  async deleteCourse(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  /**
   * Duplicate course
   */
  async duplicateCourse(id: string, newTitle?: string): Promise<any> {
    const response = await api.post(`${this.baseURL}/${id}/duplicate`, { newTitle });
    return response.data.course;
  }

  /**
   * Export course as ZIP
   */
  async exportCourse(id: string): Promise<Blob> {
    const response = await api.get(`${this.baseURL}/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Publish course
   */
  async publishCourse(id: string): Promise<any> {
    const response = await api.post(`${this.baseURL}/${id}/publish`);
    return response.data.course;
  }

  /**
   * Unpublish course
   */
  async unpublishCourse(id: string): Promise<any> {
    const response = await api.post(`${this.baseURL}/${id}/unpublish`);
    return response.data.course;
  }

  /**
   * Add module to course
   */
  async addModule(courseId: string, module: CourseModule): Promise<any> {
    const response = await api.post(`${this.baseURL}/${courseId}/modules`, module);
    return response.data.module;
  }

  /**
   * Update module
   */
  async updateModule(courseId: string, moduleId: string, module: Partial<CourseModule>): Promise<any> {
    const response = await api.put(`${this.baseURL}/${courseId}/modules/${moduleId}`, module);
    return response.data.module;
  }

  /**
   * Delete module
   */
  async deleteModule(courseId: string, moduleId: string): Promise<void> {
    await api.delete(`${this.baseURL}/${courseId}/modules/${moduleId}`);
  }

  /**
   * Reorder modules
   */
  async reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
    await api.put(`${this.baseURL}/${courseId}/modules/reorder`, { moduleIds });
  }

  /**
   * Add lesson to module
   */
  async addLesson(courseId: string, moduleId: string, lesson: CourseLesson): Promise<any> {
    const response = await api.post(
      `${this.baseURL}/${courseId}/modules/${moduleId}/lessons`,
      lesson
    );
    return response.data.lesson;
  }

  /**
   * Update lesson
   */
  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    lesson: Partial<CourseLesson>
  ): Promise<any> {
    const response = await api.put(
      `${this.baseURL}/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      lesson
    );
    return response.data.lesson;
  }

  /**
   * Delete lesson
   */
  async deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<void> {
    await api.delete(`${this.baseURL}/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  }

  /**
   * Upload course thumbnail
   */
  async uploadThumbnail(courseId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await api.post(`${this.baseURL}/${courseId}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.thumbnailUrl;
  }

  /**
   * Upload lesson video
   */
  async uploadVideo(courseId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post(`${this.baseURL}/${courseId}/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.videoUrl;
  }

  /**
   * Download course export
   */
  downloadExport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const courseManagementService = new CourseManagementService();
export default courseManagementService;