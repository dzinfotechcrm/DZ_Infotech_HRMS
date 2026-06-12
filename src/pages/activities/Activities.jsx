import { useMemo, useState } from 'react';
import { query, orderBy } from 'firebase/firestore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { formatDate } from '../../utils/dateHelpers';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { ClockIcon, UserPlusIcon, DocumentTextIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const PAGE_SIZE = 15;

export default function Activities() {
  const employeesQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);

  const { items: employees, loading: loadingEmployees } = useFirestoreCollection('employees', employeesQuery);
  const { items: leaveRequests, loading: loadingLeaves } = useFirestoreCollection('leaveRequests', leaveQuery);

  const [page, setPage] = useState(1);

  const getTimestamp = (val) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime() || 0;
  };

  const getEmpName = (id) => {
    const emp = employees.find((e) => e.uid === id || e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : id;
  };

  const activities = useMemo(() => {
    const combined = [
      ...employees.map((employee) => ({
        id: `emp-${employee.id}`,
        type: 'employee',
        label: `New employee onboarded: ${employee.firstName} ${employee.lastName}`,
        time: formatDate(employee.createdAt, 'dd MMM yyyy, hh:mm a'),
        ts: getTimestamp(employee.createdAt)
      })),
      ...leaveRequests.map((leaveRequest) => ({
        id: `leave-${leaveRequest.id}`,
        type: 'leave',
        label: `Leave request ${leaveRequest.status} for ${leaveRequest.employeeName || getEmpName(leaveRequest.employeeId)}`,
        time: formatDate(leaveRequest.createdAt, 'dd MMM yyyy, hh:mm a'),
        ts: getTimestamp(leaveRequest.createdAt)
      })),
    ];
    return combined.sort((a, b) => b.ts - a.ts);
  }, [employees, leaveRequests]);

  const totalPages = Math.ceil(activities.length / PAGE_SIZE) || 1;
  const paginatedActivities = activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isLoading = loadingEmployees || loadingLeaves;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities Log"
        description="A complete history of cross-module live feed activities."
      />

      <Card className="overflow-hidden bg-white shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary-600" /> All Activities
          </h3>
        </div>
        
        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-neutral-500">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">No activities recorded yet.</div>
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
                {Math.min(page * PAGE_SIZE, activities.length)}
              </span>{' '}
              of <span className="font-bold text-neutral-900">{activities.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="!px-2"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="!px-2"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
