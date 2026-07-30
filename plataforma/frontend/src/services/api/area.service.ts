import api from '../api';

export interface Area {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
}

export interface CreateAreaRequest {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string | null;
  color?: string | null;
}

export const getAreas = async (): Promise<Area[]> => {
  const response = await api.get('/admin/areas');
  return response.data;
};

export const createArea = async (data: CreateAreaRequest): Promise<Area> => {
  const response = await api.post('/admin/areas', data);
  return response.data;
};

export const updateArea = async (areaId: string, data: UpdateAreaRequest): Promise<Area> => {
  const response = await api.put(`/admin/areas/${areaId}`, data);
  return response.data;
};

export const deleteArea = async (areaId: string): Promise<void> => {
  await api.delete(`/admin/areas/${areaId}`);
};

export const assignUserArea = async (userId: string, areaId: string | null): Promise<void> => {
  await api.put(`/admin/users/${userId}/area`, { areaId });
};

export default { getAreas, createArea, updateArea, deleteArea, assignUserArea };
