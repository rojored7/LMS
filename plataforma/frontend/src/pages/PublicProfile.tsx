/**
 * PublicProfile Page
 * Public view of user profile with badges and certificates
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Award, BookOpen, Calendar, Mail } from 'lucide-react';
import { PublicBadges } from '../components/profile/PublicBadges';
import { CertificateCard } from '../components/certificates/CertificateCard';
import { useToast } from '../hooks/useToast';
import userService from '../services/user.service';
import badgeService from '../services/api/badge.service';
import certificateService from '../services/api/certificate.service';
import type { User } from '../types';
import type { UserBadge } from '../types/gamification';
import type { Certificate } from '../services/api/certificate.service';

export const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const toast = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [userResponse, badgesData] = await Promise.all([
        userService.getUserById(userId),
        badgeService.getUserBadges(userId),
      ]);

      setUser(userResponse.data);
      setUserBadges(badgesData);

      // Note: Public certificates might need a different endpoint
      // For now, skip if not authenticated
    } catch (err: any) {
      toast.error('Error al cargar perfil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Perfil no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            El usuario que buscas no existe
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-blue-600 text-4xl font-bold shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">
                {user.firstName} {user.lastName}
              </h1>
              {user.bio && (
                <p className="text-blue-100 mb-4 max-w-2xl">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Miembro desde{' '}
                    {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cursos Inscritos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.enrolledCourses?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Badges Ganados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userBadges.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Award className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Certificados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {certificates.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Logros y Badges
          </h2>
          <PublicBadges userBadges={userBadges} maxDisplay={12} />
        </div>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Certificados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <CertificateCard key={certificate.id} certificate={certificate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
