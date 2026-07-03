import React from 'react';
import type { LeaderboardEntry } from '../../../services/api/gamification.service';

interface LeaderboardTabProps {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onAdjustXp: (user: LeaderboardEntry) => void;
  onViewHistory: (user: LeaderboardEntry) => void;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  leaderboard,
  loading,
  page,
  total,
  onPageChange,
  onAdjustXp,
  onViewHistory,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Rol
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              XP
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboard.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                {user.rank}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : user.role === 'INSTRUCTOR' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {user.xp} XP
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <button
                  onClick={() => onAdjustXp(user)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ajustar
                </button>
                <button
                  onClick={() => onViewHistory(user)}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 text-sm"
                >
                  Historial
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {total > 20 && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500">{total} usuarios</span>
          <div className="space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Pag {page}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTab;
