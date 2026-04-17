/**
 * User Profile page
 */

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import userService from '../services/user.service';
import { ROLE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import api from '../services/api';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [pointsData, setPointsData] = useState<{
    total: number;
    history: Array<{
      courseId: string;
      courseTitle: string;
      score: number;
      completedAt: string | null;
    }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/progress/points')
      .then((res: any) => {
        if (!cancelled) {
          const d = res?.data ?? res;
          setPointsData(d);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    phone: '',
    city: '',
    country: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await userService.updateProfile({ name });
      await refreshUser();
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.error?.message || 'Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-heading text-gray-900 mb-8">Mi Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardBody>
                <div className="text-center">
                  <Avatar
                    src={user.avatar}
                    name={`${user.firstName} ${user.lastName}`}
                    size="xl"
                    className="mx-auto mb-4"
                  />

                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {user.firstName} {user.lastName}
                  </h2>

                  <p className="text-sm text-gray-600 mb-3">{user.email}</p>

                  <Badge variant="info" className="bg-blue-50 text-[#00A6FF]">
                    {ROLE_LABELS[user.role]}
                  </Badge>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Miembro desde {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardBody>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />

                      <Input
                        label="Apellido"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Biografía</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="input w-full"
                        placeholder="Cuéntanos sobre ti..."
                      />
                    </div>

                    <Input
                      label="Teléfono"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Ciudad"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />

                      <Input
                        label="País"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" isLoading={isLoading}>
                        Guardar Cambios
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Nombre Completo</p>
                      <p className="text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>

                    {user.bio && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Biografía</p>
                        <p className="text-gray-900">{user.bio}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Rol</p>
                      <p className="text-gray-900">{ROLE_LABELS[user.role]}</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Gamification Section */}
          {user.role === 'STUDENT' && (
            <div className="md:col-span-3 mt-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Puntos de Aprendizaje</h3>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <svg
                        className="w-8 h-8 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total acumulado</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {pointsData?.total ?? user.xp ?? 0} XP
                      </p>
                    </div>
                  </div>

                  {pointsData?.history && pointsData.history.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Historial de puntos</p>
                      <div className="space-y-2">
                        {pointsData.history.map((item) => (
                          <div
                            key={item.courseId}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <span className="text-sm text-gray-900">{item.courseTitle}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-purple-600">
                                +{item.score} XP
                              </span>
                              {item.completedAt && (
                                <span className="text-xs text-gray-400">
                                  {formatDate(item.completedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Completa cursos para acumular puntos</p>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
