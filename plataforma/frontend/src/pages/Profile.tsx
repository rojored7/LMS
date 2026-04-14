/**
 * User Profile page
 */

import React, { useState } from 'react';
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

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

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
        <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-8">Mi Perfil</h1>

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

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {user.firstName} {user.lastName}
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{user.email}</p>

                  <Badge variant="info" className="bg-itac-card-blue text-itac-blue">{ROLE_LABELS[user.role]}</Badge>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Información Personal
                  </h3>
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
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre Completo
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </p>
                      <p className="text-gray-900 dark:text-white">{user.email}</p>
                    </div>

                    {user.bio && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Biografía
                        </p>
                        <p className="text-gray-900 dark:text-white">{user.bio}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rol
                      </p>
                      <p className="text-gray-900 dark:text-white">{ROLE_LABELS[user.role]}</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
