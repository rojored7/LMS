/**
 * UserProgressDetail Page
 * Detailed view of user's progress across all courses
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '../components/common/Button';
import { XPProgress } from '../components/gamification/XPProgress';
import { BadgesShowcase } from '../components/gamification/BadgesShowcase';
import { useToast } from '../hooks/useToast';
import badgeService from '../services/api/badge.service';
import userService from '../services/user.service';
import adminService from '../services/api/admin.service';
import type { User } from '../types';
import type { UserBadge, Badge } from '../types/gamification';

export const UserProgressDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const toast = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<any>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [userResponse, enrollmentsData, badgesData, allBadgesData] = await Promise.all([
        userService.getUserById(userId),
        adminService.getUserEnrollments(userId),
        badgeService.getUserBadges(userId),
        badgeService.getAllBadges(),
      ]);

      setUser(userResponse.data);
      setUserEnrollments(enrollmentsData);
      setUserBadges(badgesData);
      setAllBadges(allBadgesData);
    } catch (err: any) {
      toast.error('Error al cargar datos del usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Usuario no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a usuarios
      </Link>

      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
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
                {userEnrollments?.enrollments?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progreso Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userEnrollments?.enrollments?.length > 0
                  ? Math.round(
                      userEnrollments.enrollments.reduce((acc: number, e: any) => acc + e.progress, 0) /
                        userEnrollments.enrollments.length
                    )
                  : 0}
                %
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
      </div>

      {/* Badges Showcase */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Logros y Badges
        </h2>
        <BadgesShowcase userBadges={userBadges} allBadges={allBadges} />
      </div>

      {/* Course Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Progreso por Curso
        </h2>

        {userEnrollments?.enrollments?.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            Sin cursos asignados
          </p>
        ) : (
          <div className="space-y-4">
            {userEnrollments?.enrollments?.map((enrollment: any) => (
              <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Inscrito el {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {enrollment.progress}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
