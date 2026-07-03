import React from 'react';

export interface BadgeItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  color: string | null;
  xpReward: number;
  category: string | null;
  requirement: string | null;
}

interface BadgesTabProps {
  badges: BadgeItem[];
  loading: boolean;
  onEdit: (badge: BadgeItem) => void;
  onDelete: (badge: BadgeItem) => void;
  onAward: (badge: BadgeItem) => void;
  onCreate: () => void;
}

const BadgesTab: React.FC<BadgesTabProps> = ({
  badges,
  loading,
  onEdit,
  onDelete,
  onAward,
  onCreate,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {badges.length} badges
        </h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Crear Badge
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : badges.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay badges creados</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Badge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  XP
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {badges.map((badge) => (
                <tr key={badge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: badge.color || '#3B82F6' }}
                      >
                        {badge.icon || badge.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {badge.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{badge.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {badge.category || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-yellow-600">
                    +{badge.xpReward} XP
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onAward(badge)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Otorgar
                    </button>
                    <button
                      onClick={() => onEdit(badge)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(badge)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BadgesTab;
