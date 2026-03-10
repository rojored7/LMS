/**
 * NotificationsPage
 * Full page for managing notifications
 */

import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { NotificationList } from '../components/notifications/NotificationList';
import { useNotifications } from '../hooks/useNotifications';
import { CheckCheck, Bell, BellOff } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(true, 50);

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notificaciones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona todas tus notificaciones y alertas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Todas ({notifications.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              <span>No leídas ({unreadCount})</span>
            </div>
          </button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <NotificationList
          notifications={filteredNotifications}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
          emptyMessage={
            activeTab === 'unread'
              ? 'No tienes notificaciones sin leer'
              : 'No tienes notificaciones'
          }
        />
      )}
    </div>
  );
};
