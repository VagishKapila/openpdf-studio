import { useState, useEffect, useRef } from 'react';
import { Bell, FileCheck, DollarSign, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { useOrgNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks';
import type { OrgNotification } from '@/types';

interface NotificationBellProps {
  slug: string;
}

export function NotificationBell({ slug }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: response, isLoading } = useOrgNotifications(slug);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = response?.data || [];
  const unreadCount = response?.meta?.unreadCount || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document.signed':
      case 'document.viewed':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'payment.received':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'reminder.sent':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'system.alert':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'feedback.new':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = (notif: OrgNotification) => {
    if (!notif.read) {
      markReadMutation.mutate({
        slug,
        notifId: notif.id,
      });
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate({ slug });
  };

  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400 text-sm">Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                    notif.read ? '' : 'bg-blue-50 dark:bg-blue-900/10'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
