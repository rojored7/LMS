/**
 * Training Profile Service
 * API client for training profile operations (admin only)
 */

import api from '../api';

export interface TrainingProfile {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt?: string;
  courses?: Array<{
    id: string;
    title: string;
    slug: string;
    level: string;
    order: number;
    required: boolean;
  }>;
  _count?: {
    users: number;
    courses: number;
  };
}

export interface CreateTrainingProfileRequest {
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateTrainingProfileRequest extends Partial<CreateTrainingProfileRequest> {}

export interface CourseOrderItem {
  courseId: string;
  order: number;
}

/**
 * Get all training profiles
 */
export const getAllProfiles = async (): Promise<TrainingProfile[]> => {
  const response = await api.get('/training-profiles');
  return response.data;
};

/**
 * Get training profile by ID
 */
export const getProfileById = async (profileId: string): Promise<TrainingProfile> => {
  const response = await api.get(`/training-profiles/${profileId}`);
  return response.data;
};

/**
 * Create a new training profile
 */
export const createProfile = async (
  profile: CreateTrainingProfileRequest
): Promise<TrainingProfile> => {
  const response = await api.post('/training-profiles', profile);
  return response.data;
};

/**
 * Update a training profile
 */
export const updateProfile = async (
  profileId: string,
  profile: UpdateTrainingProfileRequest
): Promise<TrainingProfile> => {
  const response = await api.put(`/training-profiles/${profileId}`, profile);
  return response.data;
};

/**
 * Delete a training profile
 */
export const deleteProfile = async (profileId: string): Promise<void> => {
  await api.delete(`/training-profiles/${profileId}`);
};

/**
 * Add course to training profile
 * NOTE: Backend expects snake_case (course_id, not courseId)
 */
export const addCourseToProfile = async (
  profileId: string,
  courseId: string,
  order: number = 0
): Promise<TrainingProfile> => {
  const response = await api.post(`/training-profiles/${profileId}/courses`, {
    course_id: courseId,
    order,
  });
  return response.data;
};

/**
 * Remove course from training profile
 */
export const removeCourseFromProfile = async (
  profileId: string,
  courseId: string
): Promise<void> => {
  await api.delete(`/training-profiles/${profileId}/courses/${courseId}`);
};

/**
 * Update order and/or required flag of a course within a profile
 */
export const updateCourseInProfile = async (
  profileId: string,
  courseId: string,
  data: { order?: number; required?: boolean }
): Promise<void> => {
  await api.patch(`/training-profiles/${profileId}/courses/${courseId}`, data);
};

/**
 * Reorder courses in a profile in bulk (drag-and-drop)
 * NOTE: Backend expects snake_case (course_id)
 */
export const reorderCourses = async (
  profileId: string,
  courses: CourseOrderItem[]
): Promise<void> => {
  await api.patch(`/training-profiles/${profileId}/courses/reorder`, {
    courses: courses.map((c) => ({ course_id: c.courseId, order: c.order })),
  });
};

export default {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  addCourseToProfile,
  removeCourseFromProfile,
  updateCourseInProfile,
  reorderCourses,
};
