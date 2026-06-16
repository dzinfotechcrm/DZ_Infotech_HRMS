import { NavLink } from 'react-router-dom';
import {
  AcademicCapIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  IdentificationIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
  ClockIcon,
  FunnelIcon,
  BriefcaseIcon,
  FolderIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { roleLabel } from '../../utils/rbac';
import { useSupabaseCollection } from '../../hooks/useSupabase';

const hrmsNavigation = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/employees', label: 'Employees', icon: UsersIcon },
  { to: '/departments', label: 'Departments', icon: BuildingOffice2Icon, adminOnly: true },
  { to: '/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { to: '/leave', label: 'Leave', icon: ClipboardDocumentListIcon },
  { to: '/payroll', label: 'Payroll', icon: BanknotesIcon },
  { to: '/activities', label: 'Activities', icon: ClockIcon, adminOnly: true },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
];

const revenueNavigation = [
  { to: '/leads', label: 'Leads', icon: FunnelIcon, adminOnly: true },
  { to: '/clients', label: 'Clients', icon: BriefcaseIcon, adminOnly: true },
  { to: '/projects', label: 'Projects', icon: FolderIcon, adminOnly: true },
  { to: '/amc', label: 'AMC', icon: ShieldCheckIcon, adminOnly: true },
  { to: '/contrack-leads', label: 'ConTrack Leads', icon: TruckIcon, adminOnly: true },
  { to: '/contrack-revenue', label: 'ConTrack MRR', icon: ChartBarIcon, adminOnly: true },
];

export default function Sidebar({ open, onClose, user, isAdminLikeRole }) {
  const { items: employees } = useSupabaseCollection('employees');
  const { items: leaveRequests } = useSupabaseCollection('leaveRequests');

  let pendingCount = 0;
  if (isAdminLikeRole) {
    pendingCount = leaveRequests.filter(req => String(req.status || '').toLowerCase().trim() === 'pending' && req.employeeId !== user?.uid).length;
  } else if (user?.role === 'manager') {
    const currentEmployee = employees.find((e) => e.uid === user?.uid || e.email === user?.email);
    pendingCount = leaveRequests.filter(req => {
      if (String(req.status || '').toLowerCase().trim() !== 'pending') return false;
      if (req.employeeId === user?.uid) return false;
      const requestEmp = employees.find(e => e.uid === req.employeeId || e.id === req.employeeId);
      return requestEmp?.departmentId === currentEmployee?.departmentId;
    }).length;
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-neutral-950/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transform border-r border-primary-800/70 bg-primary-900 text-white transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex lg:flex-col`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-1">
              <img src="/DZ_Infotech_Logo.png" alt="DZ Infotech" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">DZ Infotech</div>
              <div className="text-xl font-bold">HRMS</div>
            </div>
          </div>
          <button className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {isAdminLikeRole && (
            <div className="px-4 py-2 mt-2 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase">
              HRMS
            </div>
          )}
          {hrmsNavigation.map((item) => {
            if (item.adminOnly && !isAdminLikeRole) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-xl border-l-4 px-4 py-3 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.to === '/leave' && pendingCount > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-danger-500 px-2 text-xs font-bold text-white shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          {isAdminLikeRole && (
            <>
              <div className="px-4 py-2 mt-6 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase border-t border-white/10 pt-4">
                Revenue
              </div>
              {revenueNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 rounded-xl border-l-4 px-4 py-3 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold uppercase">
              {user?.displayName?.slice(0, 1) || 'D'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.displayName || 'Guest'}</div>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="accent" className="bg-accent-500/20 text-accent-100">{roleLabel(user?.role)}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-white/50">Signed in to DZ Infotech HRMS</div>
        </div>
      </aside>
    </>
  );
}
