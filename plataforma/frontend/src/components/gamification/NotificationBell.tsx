/**
 * NotificationBell Component
 *
 * Notification bell with dropdown list and badge counter
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Notification, NotificationType } from '../../types';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.linkUrl) {
      setIsOpen(false);
    }
  };

  // Ensure notifications is always an array before slicing
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const recentNotifications = safeNotifications.slice(0, 10);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="w-6 h-6 text-blue-600 dark:text-blue-500 animate-pulse" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-[32rem] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h3>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {recentNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDismiss={() => onDismiss(notification.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay notificaciones
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium"
              >
                Ver todas las notificaciones
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * NotificationItem Component
 */
const NotificationItem: React.FC<{
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
}> = ({ notification, onClick, onDismiss }) => {
  const icon = getNotificationIcon(notification.type);

  const content = (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer
        ${
          notification.isRead
            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
            : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
        }
      `}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full
          ${notification.isRead ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900/40'}
        `}
      >
        <span className="text-xl">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-sm font-semibold
            ${notification.isRead ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}
          `}
        >
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>

      {/* Unread Indicator & Dismiss */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full" />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          aria-label="Descartar"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
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
    case NotificationType.COURSE_ENROLLMENT:
      return '📚';
    case NotificationType.LESSON_COMPLETED:
      return '✅';
    case NotificationType.QUIZ_PASSED:
      return '🎯';
    case NotificationType.QUIZ_FAILED:
      return '❌';
    case NotificationType.LAB_COMPLETED:
      return '💻';
    case NotificationType.PROJECT_SUBMITTED:
      return '📤';
    case NotificationType.PROJECT_GRADED:
      return '📊';
    case NotificationType.BADGE_EARNED:
      return '🏆';
    case NotificationType.CERTIFICATE_ISSUED:
      return '🎓';
    case NotificationType.SYSTEM:
    default:
      return '🔔';
  }
};
