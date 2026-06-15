import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { query, where } from '../../supabase/db';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { isAdminLike } from '../../utils/rbac';
import { logout } from '../../supabase/auth';
import toast from 'react-hot-toast';

const titleMap = [
  ['/dashboard', 'Dashboard'],
  ['/employees', 'Employee Management'],
  ['/departments', 'Department Management'],
  ['/attendance', 'Attendance Management'],
  ['/leave', 'Leave Management'],
  ['/payroll', 'Payroll Management'],
  ['/documents', 'Document Management'],
  ['/reports', 'Reports & Analytics'],
  ['/activities', 'Activity Log'],
  ['/profile', 'Profile Management'],

];

function getTitle(pathname) {
  const match = titleMap.find(([path]) => pathname.startsWith(path));
  return match ? match[1] : 'DZ Infotech HRMS';
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    toast.success('Logged out successfully');
  }

  return (
    <div className="page-shell flex h-screen overflow-hidden">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} isAdminLikeRole={isAdminLike(user?.role)} />
      <div className="flex flex-1 flex-col h-screen overflow-hidden lg:ml-0">
        <Topbar
          title={getTitle(location.pathname)}
          onMenuClick={() => setMenuOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
