/**
 * User Profile page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importForm, setImportForm] = useState({
    name: '',
    source: '',
    level: '',
    durationHours: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [importLoading, setImportLoading] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get(`/badges/user/${user.id}`)
      .then((res: any) => {
        if (!cancelled) setUserBadges((res?.data ?? res) || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleImportBadge = async () => {
    if (!importForm.name || !importForm.source) return;
    setImportLoading(true);
    try {
      await api.post('/badges/import-external', {
        name: importForm.name,
        source: importForm.source,
        level: importForm.level || null,
        durationHours: importForm.durationHours ? parseInt(importForm.durationHours) : null,
        startDate: importForm.startDate || null,
        endDate: importForm.endDate || null,
        description: importForm.description || null,
      });
      toast.success('Badge importado exitosamente');
      setShowImportForm(false);
      setImportForm({
        name: '',
        source: '',
        level: '',
        durationHours: '',
        startDate: '',
        endDate: '',
        description: '',
      });
      if (user) {
        const res: any = await api.get(`/badges/user/${user.id}`);
        setUserBadges((res?.data ?? res) || []);
      }
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al importar badge');
    } finally {
      setImportLoading(false);
    }
  };

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
                            <button onClick={() => navigate(`/courses/${item.courseId}`)} className="text-sm text-gray-900 hover:text-blue-600 hover:underline text-left transition-colors">{item.courseTitle}</button>
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

              {/* Badges Section */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Insignias</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImportForm(!showImportForm)}
                    >
                      {showImportForm ? 'Cancelar' : 'Importar Badge Externo'}
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  {/* Import Form */}
                  {showImportForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">
                        Importar certificacion externa
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Nombre *"
                          name="name"
                          value={importForm.name}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                        <Input
                          label="Origen/Plataforma *"
                          name="source"
                          value={importForm.source}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, source: e.target.value }))
                          }
                          placeholder="ej: Coursera, HackTheBox"
                          required
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nivel
                          </label>
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={importForm.level}
                            onChange={(e) =>
                              setImportForm((prev) => ({ ...prev, level: e.target.value }))
                            }
                          >
                            <option value="">Seleccionar...</option>
                            <option value="BEGINNER">Principiante</option>
                            <option value="INTERMEDIATE">Intermedio</option>
                            <option value="ADVANCED">Avanzado</option>
                            <option value="EXPERT">Experto</option>
                          </select>
                        </div>
                        <Input
                          label="Horas"
                          name="durationHours"
                          type="number"
                          value={importForm.durationHours}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, durationHours: e.target.value }))
                          }
                        />
                        <Input
                          label="Fecha inicio"
                          name="startDate"
                          type="date"
                          value={importForm.startDate}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, startDate: e.target.value }))
                          }
                        />
                        <Input
                          label="Fecha fin"
                          name="endDate"
                          type="date"
                          value={importForm.endDate}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, endDate: e.target.value }))
                          }
                        />
                      </div>
                      <div className="mt-3">
                        <Input
                          label="Descripcion"
                          name="description"
                          value={importForm.description}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleImportBadge}
                          isLoading={importLoading}
                          disabled={!importForm.name || !importForm.source}
                        >
                          Importar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Badges Grid */}
                  {userBadges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userBadges.map((ub: any) => (
                        <div key={ub.id}>
                          <div
                            onClick={() => setSelectedBadge(selectedBadge?.id === ub.id ? null : ub)}
                            className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                          >
                            <div className={`p-2 rounded-lg ${ub.badge?.isExternal ? 'bg-blue-50' : 'bg-green-50'}`}>
                              <svg className={`w-6 h-6 ${ub.badge?.isExternal ? 'text-blue-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{ub.badge?.name || 'Badge'}</p>
                              {ub.badge?.level && <p className="text-xs text-gray-500">{ub.badge.level}</p>}
                              {ub.badge?.source && ub.badge.source !== 'platform' && (
                                <p className="text-xs text-blue-600">{ub.badge.source}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(ub.earnedAt)}</p>
                            </div>
                          </div>
                          {selectedBadge?.id === ub.id && (
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-2">
                              <p className="font-semibold text-gray-900">{ub.badge?.name}</p>
                              {ub.badge?.description && <p className="text-gray-600">{ub.badge.description}</p>}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {ub.badge?.level && <div><span className="text-gray-500">Nivel:</span> <span className="font-medium">{ub.badge.level}</span></div>}
                                {ub.badge?.durationHours && <div><span className="text-gray-500">Duracion:</span> <span className="font-medium">{ub.badge.durationHours}h</span></div>}
                                {ub.badge?.source && <div><span className="text-gray-500">Fuente:</span> <span className="font-medium">{ub.badge.source}</span></div>}
                                {ub.badge?.category && <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{ub.badge.category === 'course_completion' ? 'Curso completado' : ub.badge.category === 'external' ? 'Externo' : 'Logro'}</span></div>}
                                <div><span className="text-gray-500">Obtenido:</span> <span className="font-medium">{formatDate(ub.earnedAt)}</span></div>
                                {ub.enrolledAt && <div><span className="text-gray-500">Inicio:</span> <span className="font-medium">{formatDate(ub.enrolledAt)}</span></div>}
                                {ub.completedAt && <div><span className="text-gray-500">Fin:</span> <span className="font-medium">{formatDate(ub.completedAt)}</span></div>}
                              </div>
                              {ub.badge?.courseId && (
                                <button onClick={() => navigate(`/courses/${ub.badge.courseId}`)} className="text-blue-600 hover:underline text-xs font-medium">Ir al curso</button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Completa cursos o importa certificaciones para obtener insignias
                    </p>
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
