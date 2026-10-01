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
  PresentationChartLineIcon,
  UserGroupIcon,
  UserIcon,
  DocumentMagnifyingGlassIcon,
  CalendarIcon,
  TrophyIcon,
  CurrencyRupeeIcon,
  BanknotesIcon as BanknotesIconOutline,
  DocumentChartBarIcon,
  ComputerDesktopIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { roleLabel, isAgent } from '../../utils/rbac';
import { useSupabaseCollection } from '../../hooks/useSupabase';

const hrmsNavigation = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/employees', label: 'Employees', icon: UsersIcon },
  { to: '/departments', label: 'Departments', icon: BuildingOffice2Icon, adminOnly: true },
  { to: '/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { to: '/leave', label: 'Leave', icon: ClipboardDocumentListIcon },
  { to: '/payroll', label: 'Payroll', icon: BanknotesIcon },
  { to: '/activities', label: 'Activities', icon: ClockIcon, adminOnly: true },
  { to: '/assets/software-licenses', label: 'Software Licenses', icon: ComputerDesktopIcon, adminOnly: true },
  { to: '/announcements', label: 'Announcements', icon: MegaphoneIcon, adminOnly: true },
  { to: '/active-licenses', label: 'Active Licenses', icon: ComputerDesktopIcon, hideForAdmin: true },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
];

const revenueNavigation = [
  { to: '/revenue-dashboard', label: 'Dashboard', icon: PresentationChartLineIcon, adminOnly: true },
  { to: '/leads', label: 'Leads', icon: FunnelIcon, adminOnly: true },
  { to: '/clients', label: 'Clients', icon: BriefcaseIcon, adminOnly: true },
  { to: '/projects', label: 'Projects', icon: FolderIcon, adminOnly: true },
  { to: '/finance', label: 'Finance', icon: BanknotesIconOutline, adminOnly: true },
  { to: '/expense', label: 'Expense', icon: CurrencyRupeeIcon, adminOnly: true },
  { to: '/amc', label: 'AMC', icon: ShieldCheckIcon, adminOnly: true },
  { to: '/bucket-settings', label: 'Bucket Settings', icon: Cog6ToothIcon, adminOnly: true },
];

const companyNavigation = [
  { to: '/company/documents', label: 'Documents', icon: DocumentMagnifyingGlassIcon },
  { to: '/company/quotations', label: 'Quotations', icon: DocumentTextIcon },
  { to: '/company/invoices', label: 'Invoices', icon: ReceiptPercentIcon },
];

const fieldSalesNavigation = [
  { to: '/sfms/dashboard', label: 'Dashboard', icon: PresentationChartLineIcon, adminOnly: true },
  { to: '/sfms/teams', label: 'Teams', icon: UserGroupIcon, adminOnly: true },
  { to: '/sfms/agents', label: 'Agents', icon: UserIcon, adminOnly: true },
  { to: '/sfms/leads', label: 'Leads', icon: DocumentMagnifyingGlassIcon, adminOnly: true },
  { to: '/sfms/meetings', label: 'Meetings', icon: CalendarIcon, adminOnly: true },
  { to: '/sfms/targets', label: 'Targets', icon: TrophyIcon, adminOnly: true },
  { to: '/sfms/commissions', label: 'Commissions', icon: CurrencyRupeeIcon, adminOnly: true },
  { to: '/sfms/finance', label: 'Finance', icon: BanknotesIconOutline, adminOnly: true },
  { to: '/sfms/reports', label: 'Reports', icon: DocumentChartBarIcon, adminOnly: true },
];

const agentPortalNavigation = [
  { to: '/my-day', label: 'My Day', icon: PresentationChartLineIcon },
  { to: '/my-leads', label: 'My Leads', icon: DocumentMagnifyingGlassIcon },
  { to: '/my-meetings', label: 'Meetings', icon: CalendarIcon },
  { to: '/daily-report', label: 'Daily Report', icon: DocumentChartBarIcon },
  { to: '/my-commissions', label: 'My Commissions', icon: CurrencyRupeeIcon },
];

export default function Sidebar({ open, onClose, user, isAdminLikeRole, isCollapsed, onToggleCollapse }) {
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
        className={`fixed inset-y-0 left-0 z-40 transform border-r border-primary-800/70 bg-primary-900 text-white transition-all duration-300 flex flex-col lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static ${isCollapsed ? 'w-[100px]' : 'w-[260px]'}`}
      >
        <div className={`flex h-[76px] items-center border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center rounded-xl bg-white p-1 shadow-sm ${isCollapsed ? 'h-9 w-9' : 'h-11 w-11'}`}>
              <img src="/DZ_Infotech_Logo.jpeg" alt="DZ Infotech" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black uppercase tracking-wider text-white leading-none">DZ</span>
                <span className="text-sm font-bold uppercase tracking-widest text-white/80 leading-none">INFOTECH</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {isAdminLikeRole && (
            <>
              <div className={`py-2 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase ${isCollapsed ? 'text-center px-1' : 'px-4'}`}>
                {isCollapsed ? '...' : 'Revenue'}
              </div>
              {revenueNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `relative flex items-center ${isCollapsed ? 'justify-center mx-2 px-0 py-3' : 'justify-between px-4 py-3'} gap-3 rounded-xl border-l-4 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                  </NavLink>
                );
              })}
            </>
          )}

          {!isAgent(user?.role) && (
            <>
              <div className={`py-2 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase ${isCollapsed ? 'text-center px-1 mt-6 border-t border-white/10 pt-4' : 'px-4'} ${isAdminLikeRole && !isCollapsed ? 'mt-6 border-t border-white/10 pt-4' : ''}`}>
                {isCollapsed ? '...' : 'HRMS'}
              </div>
              {hrmsNavigation.map((item) => {
                if (item.adminOnly && !isAdminLikeRole) return null;
                if (item.hideForAdmin && isAdminLikeRole) return null;
                if (user?.role === 'intern' && item.to === '/employees') return null;
                if (user?.role === 'intern' && item.to === '/payroll' && !user?.isPaid) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `relative flex items-center ${isCollapsed ? 'justify-center mx-2 px-0 py-3' : 'justify-between px-4 py-3'} gap-3 rounded-xl border-l-4 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {item.to === '/leave' && pendingCount > 0 && (
                      isCollapsed ? (
                        <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-danger-500"></span>
                      ) : (
                        <span className="flex h-5 items-center justify-center rounded-full bg-danger-500 px-2 text-xs font-bold text-white shadow-sm">
                          {pendingCount}
                        </span>
                      )
                    )}
                  </NavLink>
                );
              })}
            </>
          )}

          {/* {isAdminLikeRole && (
            <>
              <div className={`py-2 mt-6 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase border-t border-white/10 pt-4 ${isCollapsed ? 'text-center px-1' : 'px-4'}`}>
                {isCollapsed ? '...' : 'Field Sales'}
              </div>
              {fieldSalesNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `relative flex items-center ${isCollapsed ? 'justify-center mx-2 px-0 py-3' : 'justify-between px-4 py-3'} gap-3 rounded-xl border-l-4 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                  </NavLink>
                );
              })}
            </>
          )} */}

          {isAgent(user?.role) && (
            <>
              <div className={`py-2 mt-2 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase ${isCollapsed ? 'text-center px-1' : 'px-4'}`}>
                {isCollapsed ? '...' : 'Agent Portal'}
              </div>
              {agentPortalNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `relative flex items-center ${isCollapsed ? 'justify-center mx-2 px-0 py-3' : 'justify-between px-4 py-3'} gap-3 rounded-xl border-l-4 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                  </NavLink>
                );
              })}
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className={`py-2 mt-6 mb-1 text-xs font-bold tracking-wider text-white/50 uppercase border-t border-white/10 pt-4 ${isCollapsed ? 'text-center px-1' : 'px-4'}`}>
                {isCollapsed ? '...' : 'Company'}
              </div>
              {companyNavigation.map((item) => {
                if (item.adminOnly && !isAdminLikeRole) return null;
                if (item.hideForAdmin && isAdminLikeRole) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `relative flex items-center ${isCollapsed ? 'justify-center mx-2 px-0 py-3' : 'justify-between px-4 py-3'} gap-3 rounded-xl border-l-4 text-sm font-medium transition ${isActive ? 'border-accent-500 bg-primary-800 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-2 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4'} gap-3 rounded-xl py-3 text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white transition-colors`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>

      </aside>
    </>
  );
}
