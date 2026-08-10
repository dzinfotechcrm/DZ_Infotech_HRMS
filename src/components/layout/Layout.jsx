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
import { useAmcNotifier } from '../../hooks/useAmcNotifier';
import InternBankDetailsPrompt from './InternBankDetailsPrompt';
import ConfirmModal from '../ui/ConfirmModal';

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
  ['/company/documents', 'Company Documents'],

];

function getTitle(pathname) {
  const match = titleMap.find(([path]) => pathname.startsWith(path));
  return match ? match[1] : 'DZ Infotech OS';
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Initialize AMC Expiry Notifier
  useAmcNotifier();

  async function handleLogout() {
    setConfirmLogout(false);
    await logout();
    toast.success('Logged out successfully');
  }

  return (
    <div className="page-shell flex h-screen w-full overflow-hidden">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} isAdminLikeRole={isAdminLike(user?.role)} />
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden lg:ml-0">
        <Topbar
          title={getTitle(location.pathname)}
          onMenuClick={() => setMenuOpen(true)}
          user={user}
          onLogout={() => setConfirmLogout(true)}
        />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <InternBankDetailsPrompt user={user} />
      <ConfirmModal
        open={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
        confirmText="Log Out"
        confirmVariant="danger"
      />
    </div>
  );
}
