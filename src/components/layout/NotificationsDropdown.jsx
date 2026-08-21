import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { removeDocument } from '../../supabase/db';
import { useAuth } from '../../hooks/useAuth';

export default function NotificationsDropdown() {
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

  const handleDismiss = async (e, id, type) => {
    e.stopPropagation();
    if (type === 'amc_expiry') {
      const newDismissed = { ...dismissedNotifs, [id]: new Date().toDateString() };
      setDismissedNotifs(newDismissed);
      localStorage.setItem('dismissed_amc_notifications', JSON.stringify(newDismissed));
    } else {
      await removeDocument('notifications', id);
    }
  };

  const todayStr = new Date().toDateString();
  const visibleNotifications = notifications.filter(n => {
    if (n.type === 'amc_expiry') {
      return dismissedNotifs[n.id] !== todayStr;
    }
    if (n.type === 'assignment') {
      return n.userId === user?.id && !n.isRead;
    }
    return false;
  });

  const handleDismissAll = (e) => {
    e.stopPropagation();
    const newDismissed = { ...dismissedNotifs };
    visibleNotifications.forEach((n) => {
      if (n.type === 'amc_expiry') {
        newDismissed[n.id] = todayStr;
      } else {
        removeDocument('notifications', n.id);
      }
    });
    setDismissedNotifs(newDismissed);
    localStorage.setItem('dismissed_amc_notifications', JSON.stringify(newDismissed));
  };

  const unreadCount = visibleNotifications.length;

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
                  onClick={handleDismissAll}
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
                {visibleNotifications.map((notification) => (
                  <div key={notification.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-neutral-600 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDismiss(e, notification.id, notification.type)}
                        className="text-neutral-400 hover:text-primary-600 flex-shrink-0 p-1 rounded-md hover:bg-primary-50 transition-colors"
                        title="Mark as read"
                      >
                        <span className="text-xs font-medium">Read</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
