import api from '../api';

interface CreateQuizDto {
  courseId: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  questions: any[];
}

interface UpdateQuizDto extends Omit<CreateQuizDto, 'courseId'> {
  id?: string;
}

export const quizService = {
  // Create a new quiz
  async createQuiz(data: CreateQuizDto) {
    const response = await api.post('/quizzes', data);
    return response.data;
  },

  // Update an existing quiz
  async updateQuiz(quizId: string, data: UpdateQuizDto) {
    const response = await api.put(`/quizzes/${quizId}`, data);
    return response.data;
  },

  // Get a specific quiz
  async getQuiz(quizId: string) {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  // Delete a quiz
  async deleteQuiz(quizId: string) {
    await api.delete(`/quizzes/${quizId}`);
  },

  // Get quizzes for a course
  async getCourseQuizzes(courseId: string) {
    const response = await api.get(`/courses/${courseId}/quizzes`);
    return response.data;
  },

  // Submit quiz attempt
  async submitQuizAttempt(quizId: string, answers: any) {
    const response = await api.post(`/quizzes/${quizId}/attempts`, { answers });
    return response.data;
  },

  // Get quiz attempts for current user
  async getMyAttempts(quizId: string) {
    const response = await api.get(`/quizzes/${quizId}/my-attempts`);
    return response.data;
  },

  // Get all attempts for a quiz (instructor/admin)
  async getAllAttempts(quizId: string) {
    const response = await api.get(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  // Grade a quiz attempt
  async gradeAttempt(attemptId: string, grading: any) {
    const response = await api.post(`/quiz-attempts/${attemptId}/grade`, grading);
    return response.data;
  }
};