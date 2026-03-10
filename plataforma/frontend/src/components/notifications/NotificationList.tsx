/**
 * NotificationList Component
 * Full-page notification list with actions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckIcon,
  XMarkIcon,
  BellIcon,
  BellSlashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import type { Notification, NotificationType } from '../../types/gamification';
import { cn } from '../../utils/cn';

export interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
  emptyMessage = 'No hay notificaciones',
  className = '',
}) => {
  if (notifications.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
        <BellSlashIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

/**
 * NotificationItem Component
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const icon = getNotificationIcon(notification.type);

  const content = (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg border transition-all',
        notification.isRead
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-2xl',
          notification.isRead
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-blue-100 dark:bg-blue-900/40'
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3
            className={cn(
              'font-semibold',
              notification.isRead
                ? 'text-gray-900 dark:text-white'
                : 'text-blue-900 dark:text-blue-100'
            )}
          >
            {notification.title}
          </h3>

          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full mt-2" />
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{notification.message}</p>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>

          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Marcar como leída"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onDelete(notification.id)}
              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Eliminar"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.linkUrl) {
    return (
      <Link to={notification.linkUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

/**
 * Get notification icon based on type
 */
const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'COURSE_ENROLLMENT':
      return '📚';
    case 'LESSON_COMPLETED':
      return '✅';
    case 'QUIZ_PASSED':
      return '🎯';
    case 'QUIZ_FAILED':
      return '❌';
    case 'LAB_COMPLETED':
      return '💻';
    case 'PROJECT_SUBMITTED':
      return '📤';
    case 'PROJECT_GRADED':
      return '📊';
    case 'BADGE_EARNED':
      return '🏆';
    case 'CERTIFICATE_ISSUED':
      return '🎓';
    case 'SYSTEM':
    default:
      return '🔔';
  }
};
