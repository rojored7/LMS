/**
 * Mock data factory functions for tests
 */
import type { User, Course, Module, Lesson, Quiz, Question, Enrollment, Certificate, Badge, Notification, TrainingProfile, Progress } from '../../types';

// Users
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'STUDENT',
  avatar: null,
  bio: null,
  xp: 0,
  level: 1,
  trainingProfileId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAdmin = (): User =>
  createMockUser({
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN'
  });

export const createMockInstructor = (): User =>
  createMockUser({
    id: 'instructor-1',
    email: 'instructor@example.com',
    firstName: 'Instructor',
    lastName: 'User',
    role: 'INSTRUCTOR'
  });

// Courses
export const createMockCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-1',
  title: 'Test Course',
  slug: 'test-course',
  description: 'This is a test course',
  summary: 'Test course summary',
  imageUrl: '/images/course-1.jpg',
  level: 'BEGINNER',
  duration: 10,
  price: 0,
  isPublished: true,
  prerequisites: [],
  objectives: [],
  targetAudience: 'Everyone',
  createdById: 'instructor-1',
  modules: [],
  enrollmentCount: 0,
  rating: 0,
  totalRatings: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Modules
export const createMockModule = (overrides: Partial<Module> = {}): Module => ({
  id: 'module-1',
  title: 'Test Module',
  description: 'This is a test module',
  order: 1,
  courseId: 'course-1',
  lessons: [],
  quizzes: [],
  duration: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Lessons
export const createMockLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'lesson-1',
  title: 'Test Lesson',
  content: '# Test Lesson Content',
  order: 1,
  moduleId: 'module-1',
  type: 'TEXT',
  duration: 15,
  videoUrl: null,
  resources: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Quizzes
export const createMockQuiz = (overrides: Partial<Quiz> = {}): Quiz => ({
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'This is a test quiz',
  moduleId: 'module-1',
  passingScore: 70,
  maxAttempts: 3,
  questions: [],
  timeLimit: 30,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Questions
export const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'question-1',
  quizId: 'quiz-1',
  text: 'What is the correct answer?',
  type: 'MULTIPLE_CHOICE',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 'Option A',
  explanation: 'Option A is correct because...',
  points: 10,
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Enrollments
export const createMockEnrollment = (overrides: Partial<Enrollment> = {}): Enrollment => ({
  id: 'enrollment-1',
  userId: 'user-1',
  courseId: 'course-1',
  progress: 0,
  status: 'ACTIVE',
  enrolledAt: new Date().toISOString(),
  completedAt: null,
  ...overrides,
});

// Progress
export const createMockProgress = (overrides: Partial<Progress> = {}): Progress => ({
  id: 'progress-1',
  userId: 'user-1',
  moduleId: 'module-1',
  lessonsCompleted: [],
  quizzesCompleted: [],
  labsCompleted: [],
  projectsCompleted: [],
  completionPercentage: 0,
  lastAccessedAt: new Date().toISOString(),
  ...overrides,
});

// Certificates
export const createMockCertificate = (overrides: Partial<Certificate> = {}): Certificate => ({
  id: 'certificate-1',
  userId: 'user-1',
  courseId: 'course-1',
  certificateNumber: 'CERT-001',
  issuedAt: new Date().toISOString(),
  pdfUrl: '/certificates/cert-001.pdf',
  ...overrides,
});

// Badges
export const createMockBadge = (overrides: Partial<Badge> = {}): Badge => ({
  id: 'badge-1',
  name: 'Test Badge',
  description: 'This is a test badge',
  iconUrl: '/badges/badge-1.svg',
  criteria: 'Complete the test course',
  type: 'COURSE_COMPLETION',
  requiredXP: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Notifications
export const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notification-1',
  userId: 'user-1',
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'INFO',
  read: false,
  link: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Training Profiles
export const createMockTrainingProfile = (overrides: Partial<TrainingProfile> = {}): TrainingProfile => ({
  id: 'profile-1',
  name: 'Test Profile',
  slug: 'test-profile',
  description: 'This is a test profile',
  courses: [],
  requiredCourses: [],
  optionalCourses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Collections
export const createMockCourseList = (count = 3): Course[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockCourse({
      id: `course-${i + 1}`,
      title: `Course ${i + 1}`,
      slug: `course-${i + 1}`,
      description: `Description for course ${i + 1}`,
      enrollmentCount: Math.floor(Math.random() * 100),
      rating: Math.random() * 5,
      totalRatings: Math.floor(Math.random() * 50),
    })
  );
};

export const createMockModuleList = (courseId: string, count = 3): Module[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockModule({
      id: `module-${i + 1}`,
      title: `Module ${i + 1}`,
      order: i + 1,
      courseId,
      lessons: [
        createMockLesson({
          id: `lesson-${i + 1}-1`,
          moduleId: `module-${i + 1}`,
          title: `Lesson ${i + 1}.1`
        }),
        createMockLesson({
          id: `lesson-${i + 1}-2`,
          moduleId: `module-${i + 1}`,
          title: `Lesson ${i + 1}.2`
        }),
      ],
    })
  );
};

export const createMockQuizQuestions = (quizId: string, count = 5): Question[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockQuestion({
      id: `question-${i + 1}`,
      quizId,
      text: `Question ${i + 1}?`,
      order: i + 1,
    })
  );
};

// API Response Mocks
export const createMockApiResponse = <T>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error',
  error: success ? null : 'Something went wrong',
});

export const createMockPaginatedResponse = <T>(
  items: T[],
  page = 1,
  limit = 10,
  total?: number
) => ({
  data: items,
  meta: {
    page,
    limit,
    total: total || items.length,
    totalPages: Math.ceil((total || items.length) / limit),
  },
});

export default {
  createMockUser,
  createMockAdmin,
  createMockInstructor,
  createMockCourse,
  createMockModule,
  createMockLesson,
  createMockQuiz,
  createMockQuestion,
  createMockEnrollment,
  createMockProgress,
  createMockCertificate,
  createMockBadge,
  createMockNotification,
  createMockTrainingProfile,
  createMockCourseList,
  createMockModuleList,
  createMockQuizQuestions,
  createMockApiResponse,
  createMockPaginatedResponse,
};