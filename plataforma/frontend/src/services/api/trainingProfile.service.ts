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
  createdAt: string;
  updatedAt: string;
  courses?: Array<{
    id: string;
    title: string;
    slug: string;
    level: string;
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
  courseIds?: string[];
}

export interface UpdateTrainingProfileRequest extends Partial<CreateTrainingProfileRequest> {}

/**
 * Get all training profiles
 */
export const getAllProfiles = async (): Promise<TrainingProfile[]> => {
  const response = await api.get('/training-profiles');
  return response.data;
};

/**
 * Get training profile by ID
 * @param profileId - Profile ID
 */
export const getProfileById = async (profileId: string): Promise<TrainingProfile> => {
  const response = await api.get(`/training-profiles/${profileId}`);
  return response.data;
};

/**
 * Create a new training profile
 * @param profile - Profile data
 */
export const createProfile = async (
  profile: CreateTrainingProfileRequest
): Promise<TrainingProfile> => {
  const response = await api.post('/training-profiles', profile);
  return response.data;
};

/**
 * Update a training profile
 * @param profileId - Profile ID
 * @param profile - Profile data to update
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
 * @param profileId - Profile ID
 */
export const deleteProfile = async (profileId: string): Promise<void> => {
  await api.delete(`/training-profiles/${profileId}`);
};

/**
 * Add course to training profile
 * @param profileId - Profile ID
 * @param courseId - Course ID
 */
export const addCourseToProfile = async (
  profileId: string,
  courseId: string
): Promise<TrainingProfile> => {
  const response = await api.post(`/training-profiles/${profileId}/courses`, { courseId });
  return response.data;
};

/**
 * Remove course from training profile
 * @param profileId - Profile ID
 * @param courseId - Course ID
 */
export const removeCourseFromProfile = async (
  profileId: string,
  courseId: string
): Promise<void> => {
  await api.delete(`/training-profiles/${profileId}/courses/${courseId}`);
};

export default {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  addCourseToProfile,
  removeCourseFromProfile,
};
