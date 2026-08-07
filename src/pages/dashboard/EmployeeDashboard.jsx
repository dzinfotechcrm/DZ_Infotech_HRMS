import { useMemo } from 'react';
import { query, orderBy, limit, where } from '../../supabase/db';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { formatDate } from '../../utils/dateHelpers';
import AttendanceControl from '../../components/dashboard/AttendanceControl';
import InternDocumentsCard from '../../components/dashboard/InternDocumentsCard';
import UpcomingBirthdays from '../../components/dashboard/UpcomingBirthdays';

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

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const attendanceQuery = useMemo(() => (base) => query(base, orderBy('date', 'desc')), []);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);

  const { items: allAttendance } = useSupabaseCollection('attendance', attendanceQuery);
  const { items: allLeaveRequests } = useSupabaseCollection('leaveRequests', leaveQuery);
  const { items: employees } = useSupabaseCollection('employees');
  const { items: interns, refetch: refetchInterns } = useSupabaseCollection('interns');

  const currentEmployee = employees.find(e => e.uid === user?.uid || e.email === user?.email);
  const currentIntern = interns.find(i => i.uid === user?.uid || i.email === user?.email || i.login_email === user?.email);
  
  const currentEntity = currentEmployee || currentIntern;

  const attendance = allAttendance.filter((a) => a.employeeId === user?.uid || (currentEntity && a.employeeId === currentEntity.id)).slice(0, 10);
  const userLeaves = allLeaveRequests.filter((lr) => lr.employeeId === user?.uid || (currentEntity && lr.employeeId === currentEntity.id));
  const leaveRequests = userLeaves.slice(0, 5);

  const presentToday = attendance.some((entry) => entry.status === 'present' && formatDate(entry.date, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd'));
  const pendingLeaves = userLeaves.filter((lr) => lr.status === 'pending').length;
  const approvedLeaves = userLeaves.filter((lr) => lr.status === 'approved').length;
  const rejectedLeaves = userLeaves.filter((lr) => lr.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 p-6 text-white shadow-soft">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            EMPLOYEE DASHBOARD
          </div>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">Hello, {user?.displayName?.split(' ')[0] || 'Employee'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            Welcome to your personal portal. Review your attendance, track leave requests, and manage your daily activities.
          </p>
        </div>
      </div>

      <AttendanceControl user={user} />

      {currentIntern && (
        <InternDocumentsCard intern={currentIntern} onUpdate={refetchInterns} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's Status" value={presentToday ? 'Present' : 'Not Marked'} icon={CheckCircleIcon} tone={presentToday ? "success" : "warning"} subtitle={presentToday ? "You're checked in today" : "Awaiting check-in"} />
        <StatCard title="Pending Leaves" value={pendingLeaves} icon={ClockIcon} tone="warning" subtitle="Leave requests waiting for approval" />
        <StatCard title="Approved Leaves" value={approvedLeaves} icon={CalendarDaysIcon} tone="success" subtitle="Recent approved leaves" />
        <StatCard title="Rejected Leaves" value={rejectedLeaves} icon={XCircleIcon} tone="danger" subtitle="Leave requests denied" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <UpcomingBirthdays employees={employees} interns={interns} />

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Recent Attendance</h2>
              <p className="muted-text">Your latest 10 attendance records</p>
            </div>
          </div>
          <Table
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status' },
            ]}
            data={attendance}
            renderRow={(record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{formatDate(record.date)}</td>
                <td className="px-4 py-3">
                  <Badge tone={record.status === 'present' ? 'success' : record.status === 'absent' ? 'danger' : 'warning'}>{record.status}</Badge>
                </td>
              </tr>
            )}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Recent Leave Requests</h2>
              <p className="muted-text">Your latest 5 requests</p>
            </div>
          </div>
          <Table
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'range', label: 'Range' },
              { key: 'status', label: 'Status' },
            ]}
            data={leaveRequests}
            renderRow={(leaveRequest) => (
              <tr key={leaveRequest.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{leaveRequest.leaveTypeName || leaveRequest.leaveType || leaveRequest.leaveTypeId}</td>
                <td className="px-4 py-3">{formatDate(leaveRequest.fromDate)} - {formatDate(leaveRequest.toDate)}</td>
                <td className="px-4 py-3"><Badge tone={leaveRequest.status === 'approved' ? 'success' : leaveRequest.status === 'pending' ? 'warning' : 'danger'}>{leaveRequest.status}</Badge></td>
              </tr>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
