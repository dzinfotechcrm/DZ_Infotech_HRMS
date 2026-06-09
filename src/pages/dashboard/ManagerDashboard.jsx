import { useMemo } from 'react';
import { query, orderBy, limit } from 'firebase/firestore';
import {
  UsersIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { formatDate } from '../../utils/dateHelpers';

function StatCard({ title, value, icon: Icon, tone = 'primary', subtitle }) {
  const tones = {
    primary: 'text-primary-600 bg-primary-100',
    success: 'text-success-600 bg-success-100',
    warning: 'text-warning-600 bg-warning-100',
    danger: 'text-danger-600 bg-danger-100',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-neutral-900">{value}</h3>
          {subtitle && <p className="mt-2 text-xs text-neutral-500">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  
  // Fetch all employees to find the team members
  const { items: employees, loading: loadingEmployees } = useFirestoreCollection('employees');
  
  // Find manager's employee document ID
  const myEmpDoc = employees.find(emp => emp.uid === user?.uid);
  const myEmpDocId = myEmpDoc?.id;

  // Find team members
  const teamMembers = employees.filter(emp => emp.managerId === myEmpDocId);
  const teamUids = teamMembers.map(emp => emp.uid).filter(Boolean);

  // Fetch all attendance and leave, filter in memory
  const attendanceQuery = useMemo(() => (base) => query(base, orderBy('date', 'desc'), limit(100)), []);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc'), limit(50)), []);

  const { items: allAttendance } = useFirestoreCollection('attendance', attendanceQuery);
  const { items: allLeaveRequests } = useFirestoreCollection('leaveRequests', leaveQuery);

  const teamAttendance = allAttendance.filter(a => teamUids.includes(a.employeeId));
  const teamLeaveRequests = allLeaveRequests.filter(lr => teamUids.includes(lr.employeeId));

  const teamHeadcount = teamMembers.length;
  const teamPresentToday = teamAttendance.filter(entry => entry.status === 'present' && formatDate(entry.date, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd')).length;
  const teamPendingLeaves = teamLeaveRequests.filter(lr => lr.status === 'pending').length;
  const teamOnLeaveToday = teamLeaveRequests.filter(lr => lr.status === 'approved' && formatDate(lr.fromDate, 'yyyy-MM-dd') <= formatDate(new Date(), 'yyyy-MM-dd') && formatDate(lr.toDate, 'yyyy-MM-dd') >= formatDate(new Date(), 'yyyy-MM-dd')).length;

  const recentTeamLeaves = teamLeaveRequests.slice(0, 5);

  const getEmpNameByUid = (uid) => {
    const emp = teamMembers.find((e) => e.uid === uid);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : uid;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 p-6 text-white shadow-soft">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            MANAGER DASHBOARD
          </div>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">Welcome, {user?.displayName?.split(' ')[0] || 'Manager'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            Monitor your team's daily attendance, review pending leave requests, and manage your direct reports.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Team Headcount" value={loadingEmployees ? '...' : teamHeadcount} icon={UsersIcon} tone="primary" subtitle="Total direct reports" />
        <StatCard title="Present Today" value={teamPresentToday} icon={CheckCircleIcon} tone="success" subtitle="Team members checked in" />
        <StatCard title="On Leave Today" value={teamOnLeaveToday} icon={CalendarDaysIcon} tone="warning" subtitle="Approved leaves today" />
        <StatCard title="Pending Approvals" value={teamPendingLeaves} icon={ClockIcon} tone="danger" subtitle="Team leaves waiting for action" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">My Team</h2>
              <p className="muted-text">Your direct reports</p>
            </div>
            <UsersIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-3">
            {teamMembers.length > 0 ? (
              teamMembers.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{emp.firstName} {emp.lastName}</div>
                    <div className="mt-1 text-xs text-neutral-500">{emp.designation || 'Employee'}</div>
                  </div>
                  <Badge tone={emp.status === 'active' ? 'success' : 'danger'}>{emp.status || 'active'}</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-500 py-4 text-center">No team members assigned to you yet.</div>
            )}
            {loadingEmployees && <Skeleton className="h-20 w-full" />}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Team Leave Requests</h2>
              <p className="muted-text">Recent leave activity from your team</p>
            </div>
          </div>
          <Table
            columns={[
              { key: 'employee', label: 'Employee' },
              { key: 'range', label: 'Range' },
              { key: 'status', label: 'Status' },
            ]}
            data={recentTeamLeaves}
            renderRow={(leaveRequest) => (
              <tr key={leaveRequest.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{leaveRequest.employeeName || getEmpNameByUid(leaveRequest.employeeId)}</td>
                <td className="px-4 py-3">{formatDate(leaveRequest.fromDate)} - {formatDate(leaveRequest.toDate)}</td>
                <td className="px-4 py-3"><Badge tone={leaveRequest.status === 'approved' ? 'success' : leaveRequest.status === 'pending' ? 'warning' : 'danger'}>{leaveRequest.status}</Badge></td>
              </tr>
            )}
          />
          {recentTeamLeaves.length === 0 && (
            <div className="text-sm text-neutral-500 py-4 text-center border-t border-neutral-100">No recent team leaves found.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
