import { useEffect, useRef, useState } from 'react';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { isAdminLike } from '../../utils/rbac';
import NotificationsDropdown from './NotificationsDropdown';
import AttendanceControl from '../dashboard/AttendanceControl';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-xs font-medium text-slate-500 mt-1">
      {time.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {time.toLocaleTimeString('en-US')}
    </div>
  );
}

export default function Topbar({ title, notificationsCount = 0, onMenuClick, user, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 md:gap-4 md:px-6 lg:px-8">
        <button className="rounded-xl border border-neutral-200 p-2 text-neutral-700 lg:hidden flex-shrink-0" onClick={onMenuClick}>
          <UserCircleIcon className="h-5 w-5" />
        </button>
        
        {/* Hello Text */}
        <div className="flex-1 min-w-0 flex items-center">
          {user && (
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">
              Hello, {user?.displayName?.split(' ')[0] || 'User'}
            </span>
          )}
        </div>

        {/* Centered Attendance Control */}
        {user && !isAdminLike(user) && (
          <div className="flex absolute left-1/2 -translate-x-1/2 top-0 h-14 items-center scale-[0.8] sm:scale-100 origin-center">
            <AttendanceControl user={user} />
          </div>
        )}

        {user && <NotificationsDropdown showAmc={false} />}

        <div className="relative flex-shrink-0 flex items-center" ref={menuRef}>
          <button 
            onClick={() => setOpen((value) => !value)} 
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 hover:ring-2 hover:ring-primary-500 hover:ring-offset-1 transition-all"
          >
            {user?.displayName?.slice(0, 1) || 'D'}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-neutral-200 bg-white p-2 shadow-soft focus:outline-none z-50">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100"
              >
                <UserCircleIcon className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger-600 hover:bg-danger-100"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
