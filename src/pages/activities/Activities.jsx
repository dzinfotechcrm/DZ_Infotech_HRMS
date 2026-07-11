import { useMemo, useState } from 'react';
import { query, orderBy } from '../../supabase/db';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { formatDate } from '../../utils/dateHelpers';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { ClockIcon, UserPlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const PAGE_SIZE = 10;

export default function Activities() {
  const employeesQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const internsQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);

  const { items: employees, loading: loadingEmployees } = useSupabaseCollection('employees', employeesQuery);
  const { items: leaveRequests, loading: loadingLeaves } = useSupabaseCollection('leaveRequests', leaveQuery);
  const { items: interns, loading: loadingInterns } = useSupabaseCollection('interns', internsQuery);

  const [page, setPage] = useState(1);
  const [filterDate, setFilterDate] = useState('');

  const getTimestamp = (val) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime() || 0;
  };

  const getEmpName = (id) => {
    let emp = employees.find((e) => e.uid === id || e.id === id);
    if (!emp) {
      emp = interns.find((i) => i.uid === id || i.id === id);
    }
    if (emp) {
      return `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim();
    }
    // If not found, check if the id looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    return isUUID ? 'Deleted Employee' : id;
  };

  const activities = useMemo(() => {
    const combined = [
      ...employees
        .filter((employee) => employee.role !== 'admin')
        .map((employee) => ({
          id: `emp-${employee.id}`,
          type: 'employee',
          label: `New employee onboarded: ${employee.firstName} ${employee.lastName}`,
          time: formatDate(employee.createdAt, 'dd MMM yyyy, hh:mm a'),
          ts: getTimestamp(employee.createdAt)
        })),
      ...interns.map((intern) => ({
          id: `intern-${intern.id}`,
          type: 'employee',
          label: `New intern onboarded: ${intern.firstName || intern.first_name || ''} ${intern.lastName || intern.last_name || ''}`.trim(),
          time: formatDate(intern.createdAt, 'dd MMM yyyy, hh:mm a'),
          ts: getTimestamp(intern.createdAt)
        })),
      ...leaveRequests
        .filter(leaveRequest => {
          return employees.some(e => e.uid === leaveRequest.employeeId || e.id === leaveRequest.employeeId) || 
                 interns.some(i => i.uid === leaveRequest.employeeId || i.id === leaveRequest.employeeId);
        })
        .map((leaveRequest) => {
          const isNameUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaveRequest.employeeName || '');
          const finalName = (leaveRequest.employeeName && !isNameUUID) 
            ? leaveRequest.employeeName 
            : getEmpName(leaveRequest.employeeId);
            
          return {
            id: `leave-${leaveRequest.id}`,
            type: 'leave',
            label: leaveRequest.status === 'pending'
              ? `New leave request submitted by ${finalName}`
              : `Leave request ${leaveRequest.status} for ${finalName}`,
            time: formatDate(leaveRequest.createdAt, 'dd MMM yyyy, hh:mm a'),
            ts: getTimestamp(leaveRequest.createdAt)
          };
        }),
    ];
    return combined.sort((a, b) => b.ts - a.ts);
  }, [employees, interns, leaveRequests]);

  const filteredActivities = useMemo(() => {
    if (!filterDate) return activities;
    const filterParts = filterDate.split('-');
    if (filterParts.length !== 3) return activities;
    const fYear = parseInt(filterParts[0]);
    const fMonth = parseInt(filterParts[1]) - 1;
    const fDate = parseInt(filterParts[2]);

    return activities.filter(activity => {
      const d = new Date(activity.ts);
      return d.getFullYear() === fYear && d.getMonth() === fMonth && d.getDate() === fDate;
    });
  }, [activities, filterDate]);

  const totalPages = Math.ceil(filteredActivities.length / PAGE_SIZE) || 1;
  const paginatedActivities = filteredActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isLoading = loadingEmployees || loadingLeaves || loadingInterns;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities Log"
        description="A complete history of cross-module live feed activities."
      />

      <Card className="overflow-hidden bg-white shadow-sm border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4 gap-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary-600" /> All Activities
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {filterDate && (
              <Button
                variant="secondary"
                onClick={() => {
                  setFilterDate('');
                  setPage(1);
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-neutral-500">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">No activities found.</div>
          ) : (
            paginatedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-neutral-50/50 transition-colors">
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activity.type === 'employee' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 text-primary-600'}`}>
                  {activity.type === 'employee' ? <UserPlusIcon className="h-5 w-5" /> : <DocumentTextIcon className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{activity.label}</p>
                  <p className="mt-1 text-xs font-medium text-neutral-500">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-6 py-4">
            <p className="text-sm font-medium text-neutral-600">
              Showing <span className="font-bold text-neutral-900">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-neutral-900">
                {Math.min(page * PAGE_SIZE, filteredActivities.length)}
              </span>{' '}
              of <span className="font-bold text-neutral-900">{filteredActivities.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}