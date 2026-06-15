import { useMemo } from 'react';
import { query, orderBy, limit, where } from '../../supabase/db';
import {
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const employeesQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const attendanceQuery = useMemo(() => (base) => query(base, orderBy('date', 'desc'), limit(30)), []);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc'), limit(5)), []);
  const departmentQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);

  const { items: employees, loading: loadingEmployees } = useSupabaseCollection('employees', employeesQuery);
  const { items: attendance } = useSupabaseCollection('attendance', attendanceQuery);
  const { items: leaveRequests } = useSupabaseCollection('leaveRequests', leaveQuery);
  const { items: departments } = useSupabaseCollection('departments', departmentQuery);

  const getEmpName = (id) => {
    const emp = employees.find((e) => e.uid === id || e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : id;
  };

  const totalEmployees = employees.filter((employee) => employee.status !== 'inactive' && employee.role !== 'admin').length;
  const presentToday = attendance.filter((entry) => entry.status === 'present' && formatDate(entry.date, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd')).length;
  const leaveToday = leaveRequests.filter((leaveRequest) => leaveRequest.status === 'approved' && formatDate(leaveRequest.fromDate, 'yyyy-MM-dd') <= formatDate(new Date(), 'yyyy-MM-dd') && formatDate(leaveRequest.toDate, 'yyyy-MM-dd') >= formatDate(new Date(), 'yyyy-MM-dd')).length;
  const pendingApprovals = leaveRequests.filter((leaveRequest) => leaveRequest.status === 'pending').length;

  const trendData = useMemo(() => {
    const days = [...Array(30)].map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      const key = formatDate(date, 'yyyy-MM-dd');
      const dayEntries = attendance.filter((item) => formatDate(item.date, 'yyyy-MM-dd') === key);
      return {
        label: formatDate(date, 'dd MMM'),
        present: dayEntries.filter((item) => item.status === 'present').length,
        leave: leaveRequests.filter((item) => item.status === 'approved' && formatDate(item.fromDate, 'yyyy-MM-dd') <= key && formatDate(item.toDate, 'yyyy-MM-dd') >= key).length,
      };
    });
    return days;
  }, [attendance, leaveRequests]);

  const departmentData = useMemo(() => {
    const counts = {};
    employees.forEach((employee) => {
      if (employee.departmentId && employee.status !== 'inactive' && employee.role !== 'admin') {
        counts[employee.departmentId] = (counts[employee.departmentId] || 0) + 1;
      }
    });
    return departments.map((department) => ({
      name: department.name,
      count: counts[department.id] || 0,
    }));
  }, [departments, employees]);

  const getTimestamp = (val) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime() || 0;
  };

  const recentLeaves = leaveRequests.slice(0, 5);
  const recentActivity = [
    ...employees.map((emp) => ({
      label: `New employee ${emp.firstName} onboarded`,
      time: formatDate(emp.createdAt, 'dd MMM, hh:mm a'),
      ts: getTimestamp(emp.createdAt)
    })),
    ...attendance.filter((a) => a.status === 'present').map((a) => ({
      label: `${getEmpName(a.employeeId)} checked in`,
      time: formatDate(a.createdAt, 'dd MMM, hh:mm a'),
      ts: getTimestamp(a.createdAt)
    })),
    ...leaveRequests.map((leaveRequest) => ({
      label: `${getEmpName(leaveRequest.employeeId)} applied for ${leaveRequest.leaveTypeName || 'leave'}`,
      time: formatDate(leaveRequest.createdAt, 'dd MMM, hh:mm a'),
      ts: getTimestamp(leaveRequest.createdAt)
    })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 p-6 text-white shadow-soft">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            ADMIN DASHBOARD
          </div>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">Welcome back, {user?.displayName?.split(' ')[0] || 'Admin'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            Live workforce snapshot, attendance trend, department headcount, and approval queue driven directly from Firestore.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={loadingEmployees ? '...' : totalEmployees} icon={UsersIcon} tone="primary" subtitle="Active employee base" />
        <StatCard title="Present Today" value={presentToday} icon={CheckCircleIcon} tone="success" subtitle="Attendance marked today" />
        <StatCard title="On Leave Today" value={leaveToday} icon={CalendarDaysIcon} tone="warning" subtitle="Approved leave overlap" />
        <StatCard title="Pending Approvals" value={pendingApprovals} icon={ExclamationTriangleIcon} tone="danger" subtitle="Waiting for action" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="section-title">Attendance Trend</h2>
              <p className="muted-text">Last 30 days live data</p>
            </div>
            <Badge tone="primary">Realtime</Badge>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="present" stroke="#1D4ED8" fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="leave" stroke="#D97706" fillOpacity={1} fill="url(#colorLeave)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="section-title">Department Headcount</h2>
            <p className="muted-text">Employee distribution by department</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="count" fill="#14B8A6" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Recent Leave Requests</h2>
              <p className="muted-text">Latest 5 requests from Firestore</p>
            </div>
            <ClockIcon className="h-5 w-5 text-primary-600" />
          </div>
          <Table
            columns={[
              { key: 'employee', label: 'Employee' },
              { key: 'type', label: 'Type' },
              { key: 'range', label: 'Range' },
              { key: 'status', label: 'Status' },
            ]}
            data={recentLeaves}
            renderRow={(leaveRequest) => (
              <tr key={leaveRequest.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{leaveRequest.employeeName || getEmpName(leaveRequest.employeeId)}</td>
                <td className="px-4 py-3">{leaveRequest.leaveTypeName || leaveRequest.leaveType || leaveRequest.leaveTypeId}</td>
                <td className="px-4 py-3">{formatDate(leaveRequest.fromDate)} - {formatDate(leaveRequest.toDate)}</td>
                <td className="px-4 py-3"><Badge tone={leaveRequest.status === 'approved' ? 'success' : leaveRequest.status === 'pending' ? 'warning' : 'danger'}>{leaveRequest.status}</Badge></td>
              </tr>
            )}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Recent Activity</h2>
              <p className="muted-text">Cross-module live feed</p>
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={`${activity.label}-${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-semibold text-neutral-900">{activity.label}</div>
                <div className="mt-1 text-xs text-neutral-500">{activity.time}</div>
              </div>
            ))}
            {recentActivity.length === 0 && !loadingEmployees && (
              <div className="p-4 text-center text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">No recent activity</div>
            )}
            {loadingEmployees && <Skeleton className="h-20 w-full" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
