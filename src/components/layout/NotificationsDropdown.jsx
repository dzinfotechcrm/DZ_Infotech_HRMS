import { useState, useRef, useEffect } from 'react';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { removeDocument, updateDocument } from '../../supabase/db';
import { useAuth } from '../../hooks/useAuth';

export default function NotificationsDropdown({ showAmc = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  
  const { items: notifications, refetch } = useSupabaseCollection('notifications', (query) => query.order('createdAt', { ascending: false }));

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_amc_notifications') || '{}');
    } catch {
      return {};
    }
  });

  const todayStr = new Date().toDateString();

  const isNotificationRead = (n) => {
    if (n.type === 'amc_expiry') {
      return dismissedNotifs[n.id] === todayStr;
    }
    return n.is_read || n.isRead || n.data?.isRead;
  };

  const handleMarkAsRead = async (e, id, type) => {
    e.stopPropagation();
    if (type === 'amc_expiry') {
      const newDismissed = { ...dismissedNotifs, [id]: todayStr };
      setDismissedNotifs(newDismissed);
      localStorage.setItem('dismissed_amc_notifications', JSON.stringify(newDismissed));
    } else {
      await updateDocument('notifications', id, { is_read: true });
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await removeDocument('notifications', id);
  };

  const visibleNotifications = notifications.filter(n => {
    if (n.type === 'amc_expiry') {
      return showAmc;
    }
    
    // Check if the notification is targeted to the current user
    const targetUserId = n.user_id || n.userId || n.data?.userId;
    if (targetUserId) {
      return targetUserId === user?.id || targetUserId === user?.uid || targetUserId === user?.employeeId;
    }
    
    return false;
  });

  const unreadCount = visibleNotifications.filter(n => !isNotificationRead(n)).length;

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    const newDismissed = { ...dismissedNotifs };
    visibleNotifications.forEach((n) => {
      if (!isNotificationRead(n)) {
        if (n.type === 'amc_expiry') {
          newDismissed[n.id] = todayStr;
        } else {
          updateDocument('notifications', n.id, { is_read: true });
        }
      }
    });
    setDismissedNotifs(newDismissed);
    localStorage.setItem('dismissed_amc_notifications', JSON.stringify(newDismissed));
  };

  return (
    <div className="relative mr-2" ref={menuRef}>
      <button 
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-soft focus:outline-none z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
            {unreadCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-500">{unreadCount} new</span>
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Read All
                </button>
              </div>
            )}
          </div>
          
          <div className="max-h-[80vh] overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {visibleNotifications.map((notification) => {
                  const read = isNotificationRead(notification);
                  return (
                    <div key={notification.id} className={`px-4 py-3 transition-colors ${read ? 'bg-white hover:bg-neutral-50' : 'bg-primary-50/30 hover:bg-primary-50/50'}`}>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${read ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-0.5 ${read ? 'text-neutral-500' : 'text-neutral-700'}`}>
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {read ? (
                          <button 
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="text-neutral-400 hover:text-red-500 flex-shrink-0 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete notification"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => handleMarkAsRead(e, notification.id, notification.type)}
                            className="text-primary-600 hover:text-primary-700 flex-shrink-0 p-1 rounded-md hover:bg-primary-100 transition-colors"
                            title="Mark as read"
                          >
                            <span className="text-xs font-medium">Read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
