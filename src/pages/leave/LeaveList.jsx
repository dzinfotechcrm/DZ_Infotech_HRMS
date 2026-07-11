import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';
import { query, orderBy } from '../../supabase/db';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { removeDocument } from '../../supabase/db';
import { isAdminLike } from '../../utils/rbac';
import { daysBetween, formatDate, formatDateTime } from '../../utils/dateHelpers';
import LeaveApproval from './LeaveApproval';

export default function LeaveList() {
  const { user } = useAuth();
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const balanceQuery = useMemo(() => (base) => query(base, orderBy('updatedAt', 'desc')), []);
  const { items: leaveRequests } = useSupabaseCollection('leaveRequests', leaveQuery);
  const { items: leaveBalance } = useSupabaseCollection('leaveBalance', balanceQuery);
  const { items: leaveTypes } = useSupabaseCollection('leaveTypes');
  const { items: employees } = useSupabaseCollection('employees');
  const { items: interns } = useSupabaseCollection('interns');

  const allEmployees = useMemo(() => {
    const mappedInterns = interns.map(i => ({
      ...i,
      firstName: i.first_name || i.firstName,
      lastName: i.last_name || i.lastName,
      role: 'intern',
      departmentId: i.department_id || i.departmentId,
    }));
    return [...employees, ...mappedInterns];
  }, [employees, interns]);
  const { items: departments } = useSupabaseCollection('departments');

  function getEmpName(id) {
    const emp = allEmployees.find(e => e.uid === id || e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : id;
  }

  function getEmpDetails(id) {
    const emp = allEmployees.find(e => e.uid === id || e.id === id);
    if (!emp) return { name: id, designation: '-', department: '-' };
    const dept = departments.find(d => d.id === emp.departmentId);
    return {
      name: `${emp.firstName} ${emp.lastName}`.trim(),
      designation: emp.designation || '-',
      department: dept?.name || '-',
    };
  }

  const isAdmin = isAdminLike(user?.role);
  const isManager = user?.role === 'manager';

  const currentEmployee = allEmployees.find(e => e.uid === user?.uid || e.email === user?.email);
  const myLeaves = leaveRequests.filter((item) => item.employeeId === user?.uid || item.employeeId === currentEmployee?.id);

  const [empTypeTab, setEmpTypeTab] = useState('employees');

  const othersLeaves = isManager
    ? leaveRequests.filter(item => {
      if (item.employeeId === user?.uid || item.employeeId === currentEmployee?.id) return false;
      const requestEmp = allEmployees.find(e => e.uid === item.employeeId || e.id === item.employeeId);
      const empRole = requestEmp?.role || '';
      if (empTypeTab === 'interns' && empRole !== 'intern') return false;
      if (empTypeTab === 'employees' && empRole === 'intern') return false;
      return requestEmp?.departmentId === currentEmployee?.departmentId;
    })
    : [];

  const reviewedByMeLeaves = leaveRequests.filter(item => {
    if (!((item.status === 'approved' || item.status === 'rejected') && item.approvedBy === user?.uid)) return false;
    const requestEmp = allEmployees.find(e => e.uid === item.employeeId || e.id === item.employeeId);
    const empRole = requestEmp?.role || '';
    if (empTypeTab === 'interns' && empRole !== 'intern') return false;
    if (empTypeTab === 'employees' && empRole === 'intern') return false;
    return true;
  });

  const reviewedByManagerLeaves = leaveRequests.filter(item => {
    if (!((item.status === 'approved' || item.status === 'rejected') && item.approvedBy && item.approvedBy !== user?.uid)) return false;
    const requestEmp = allEmployees.find(e => e.uid === item.employeeId || e.id === item.employeeId);
    const empRole = requestEmp?.role || '';
    if (empTypeTab === 'interns' && empRole !== 'intern') return false;
    if (empTypeTab === 'employees' && empRole === 'intern') return false;
    return true;
  });

  const visibleBalances = isAdminLike(user?.role)
    ? leaveBalance
    : isManager
      ? leaveBalance.filter(item => {
        if (item.employeeId === user?.uid) return true;
        const requestEmp = allEmployees.find(e => e.uid === item.employeeId || e.id === item.employeeId);
        return requestEmp?.departmentId === currentEmployee?.departmentId;
      })
      : leaveBalance.filter((item) => item.employeeId === user?.uid);

  const baseColumns = [
    { key: 'type', label: 'Type' },
    { key: 'range', label: 'Range' },
    { key: 'days', label: 'Days' },
    { key: 'attachment', label: 'Attachment' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' },
    { key: 'reviewer', label: 'Reviewer' }
  ];

  const hasMyActions = myLeaves.some((item) => {
    return isAdmin && (item.status === 'approved' || item.status === 'rejected');
  });

  const hasOthersActions = othersLeaves.some((item) => {
    return isAdmin && (item.status === 'approved' || item.status === 'rejected');
  });

  const myColumns = [...baseColumns];
  if (hasMyActions) myColumns.push({ key: 'actions', label: 'Actions' });

  const othersColumns = [
    { key: 'employee', label: 'Employee' },
    ...(empTypeTab === 'interns' ? [] : [
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
    ]),
    ...baseColumns
  ];
  if (hasOthersActions) othersColumns.push({ key: 'actions', label: 'Actions' });

  const adminColumns = [
    { key: 'employee', label: 'Employee' },
    ...(empTypeTab === 'interns' ? [] : [
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
    ]),
    ...baseColumns,
    { key: 'actions', label: 'Actions' }
  ];

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  const [leaveReasonOpen, setLeaveReasonOpen] = useState(false);
  const [leaveReasonItem, setLeaveReasonItem] = useState(null);

  const renderReason = (item) => {
    if (!item.reason && !item.approverComment) return <span className="text-neutral-400 text-sm">—</span>;
    return (
      <Button
        variant="secondary"
        className="py-1 px-3 text-xs flex items-center justify-center"
        onClick={() => {
          setLeaveReasonItem(item);
          setLeaveReasonOpen(true);
        }}
        title="View Details"
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    );
  };

  const renderActions = (item) => {
    const isAdmin = isAdminLike(user?.role);
    const canDelete = isAdmin && (item.status === 'approved' || item.status === 'rejected');

    if (!canDelete) return null;

    return (
      <div className="flex gap-2">
        {canDelete && (
          <Button
            variant="danger"
            disabled={deleting === item.id}
            className="px-3 py-1 text-xs"
            onClick={() => {
              setConfirmItem(item);
              setConfirmOpen(true);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    );
  };

  const [activeTab, setActiveTab] = useState(isAdmin || isManager ? 'approvalQueue' : 'my');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const pendingLeavesCount = isAdmin
    ? leaveRequests.filter(req => {
      if (String(req.status || '').toLowerCase().trim() !== 'pending' || req.employeeId === user?.uid) return false;
      const requestEmp = allEmployees.find(e => e.uid === req.employeeId || e.id === req.employeeId);
      const empRole = requestEmp?.role || '';
      if (empTypeTab === 'interns' && empRole !== 'intern') return false;
      if (empTypeTab === 'employees' && empRole === 'intern') return false;
      return true;
    }).length
    : isManager
      ? othersLeaves.filter(item => String(item.status || '').toLowerCase().trim() === 'pending').length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave Management"
        title="Leave requests and balance tracking"
        description="Apply for leave, review pending approvals, and monitor employee leave balances in one place."
        actions={(
          <div className="flex flex-wrap gap-2">
            {!isAdmin && <Link to="/leave/new"><Button>Apply Leave</Button></Link>}
          </div>
        )}
      />

      {isAdmin && (
        <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit mb-4 mt-6 border border-slate-200/60 shadow-sm">
          <button
            onClick={() => setEmpTypeTab('employees')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${empTypeTab === 'employees'
                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
          >
            Employee / Manager
          </button>
          <button
            onClick={() => {
              setEmpTypeTab('interns');
              if (activeTab === 'reviewedByManager') setActiveTab('approvalQueue');
            }}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${empTypeTab === 'interns'
                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
          >
            Interns
          </button>
        </div>
      )}

      {currentEmployee && !isAdmin && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">My Leave Balance</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {currentEmployee.role === 'intern' ? (
                (() => {
                  const now = new Date();
                  const currentMonthLeaves = myLeaves.filter(leave => {
                    if (leave.status === 'rejected') return false;
                    const leaveDate = new Date(leave.fromDate);
                    return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
                  });
                  const used = currentMonthLeaves.reduce((acc, curr) => acc + (curr.totalDays || 0), 0);
                  const total = Number(currentEmployee.max_leave_per_month || 0);
                  const remaining = total - used;
                  const isExhausted = remaining <= 0;
                  return (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center sm:col-span-3 max-w-sm mx-auto w-full">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Monthly Leaves</span>
                      <div className={`text-3xl font-bold ${isExhausted ? 'text-red-600' : 'text-slate-800'}`}>
                        {remaining} <span className="text-sm font-normal text-slate-400">/ {total}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1">remaining this month</span>
                    </div>
                  );
                })()
              ) : (
                [
                  { label: 'Casual Leave', total: Number(currentEmployee.casual_leaves_total || 0), used: Number(currentEmployee.casual_leaves_used || 0) },
                  { label: 'Paid Leave', total: Number(currentEmployee.paid_leaves_total || 0), used: Number(currentEmployee.paid_leaves_used || 0) },
                  { label: 'Sick / Medical Leave', total: Number(currentEmployee.sick_leaves_total || 0), used: Number(currentEmployee.sick_leaves_used || 0) }
                ].map((leave) => {
                  const remaining = leave.total - leave.used;
                  const isExhausted = remaining <= 0;
                  return (
                    <div key={leave.label} className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">{leave.label}</span>
                      <div className={`text-2xl font-bold ${isExhausted ? 'text-red-600' : 'text-slate-800'}`}>
                        {remaining} <span className="text-sm font-normal text-slate-400">/ {leave.total}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1">remaining</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200">
          <div className="flex gap-4">
            <button
              type="button"
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'approvalQueue' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
              onClick={() => setActiveTab('approvalQueue')}
            >
              Approval Queue
              {pendingLeavesCount > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'approvalQueue' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {pendingLeavesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'reviewedByMe' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
              onClick={() => setActiveTab('reviewedByMe')}
            >
              Reviewed By Me
            </button>
            {empTypeTab !== 'interns' && (
              <button
                type="button"
                className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'reviewedByManager' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                onClick={() => setActiveTab('reviewedByManager')}
              >
                Reviewed By Manager
              </button>
            )}
          </div>
          <div className="pb-2 w-full sm:w-48">
            <Select value={adminStatusFilter} onChange={(e) => setAdminStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>
      )}

      {isManager && !isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200">
          <div className="flex gap-4">
            <button
              type="button"
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'approvalQueue' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
              onClick={() => setActiveTab('approvalQueue')}
            >
              Approval Queue
              {pendingLeavesCount > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'approvalQueue' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {pendingLeavesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'my' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
              onClick={() => setActiveTab('my')}
            >
              My Leaves
            </button>
            <button
              type="button"
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'team' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
              onClick={() => setActiveTab('team')}
            >
              Team Leaves
            </button>
          </div>
        </div>
      )}

      {/* My Leaves Section */}
      {!isAdmin && activeTab === 'my' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <Table
              columns={myColumns}
              data={myLeaves}
              renderRow={(item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.leaveTypeName || item.leaveType || item.leaveTypeId}</td>
                  <td className="px-4 py-3">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</td>
                  <td className="px-4 py-3">{daysBetween(item.fromDate, item.toDate)}</td>
                  <td className="px-4 py-3">
                    {item.attachmentURL ? (
                      <a href={item.attachmentURL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-semibold">
                        View File
                      </a>
                    ) : (
                      <span className="text-neutral-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Badge></td>
                  <td className="px-4 py-3">{renderReason(item)}</td>
                  <td className="px-4 py-3 font-medium text-neutral-700">{item.approvedBy ? getEmpName(item.approvedBy) : '—'}</td>
                  {hasMyActions && <td className="px-4 py-3">{renderActions(item)}</td>}
                </tr>
              )}
            />

          </Card>
        </div>
      )}

      {/* Team Leaves Section */}
      {isManager && !isAdmin && activeTab === 'team' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <Table
              columns={othersColumns}
              data={othersLeaves}
              renderRow={(item) => {
                const empInfo = getEmpDetails(item.employeeId);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{empInfo.name}</td>
                    {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.department}</td>}
                    {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.designation}</td>}
                    <td className="px-4 py-3">{item.leaveTypeName || item.leaveType || item.leaveTypeId}</td>
                    <td className="px-4 py-3">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</td>
                    <td className="px-4 py-3">{daysBetween(item.fromDate, item.toDate)}</td>
                    <td className="px-4 py-3">
                      {item.attachmentURL ? (
                        <a href={item.attachmentURL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-semibold">
                          View File
                        </a>
                      ) : (
                        <span className="text-neutral-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge tone={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Badge></td>
                    <td className="px-4 py-3">{renderReason(item)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{item.approvedBy ? getEmpName(item.approvedBy) : '—'}</td>
                    {hasOthersActions && <td className="px-4 py-3">{renderActions(item)}</td>}
                  </tr>
                )
              }}
            />

          </Card>
        </div>
      )}

      {/* Approval Queue */}
      {(isAdmin || isManager) && activeTab === 'approvalQueue' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <LeaveApproval isTab={true} empTypeTab={empTypeTab} />
          </Card>
        </div>
      )}

      {/* Admin: Reviewed By Me */}
      {isAdmin && activeTab === 'reviewedByMe' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <Table
              columns={adminColumns}
              data={reviewedByMeLeaves.filter(l => adminStatusFilter === 'all' || l.status === adminStatusFilter)}
              renderRow={(item) => {
                const empInfo = getEmpDetails(item.employeeId);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{empInfo.name}</td>
                    {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.department}</td>}
                    {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.designation}</td>}
                    <td className="px-4 py-3">{item.leaveTypeName || item.leaveType || item.leaveTypeId}</td>
                    <td className="px-4 py-3">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</td>
                    <td className="px-4 py-3">{daysBetween(item.fromDate, item.toDate)}</td>
                    <td className="px-4 py-3">
                      {item.attachmentURL ? (
                        <a href={item.attachmentURL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-semibold">
                          View File
                        </a>
                      ) : (
                        <span className="text-neutral-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge tone={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Badge></td>
                    <td className="px-4 py-3">{renderReason(item)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{item.approvedBy ? getEmpName(item.approvedBy) : '—'}</td>
                    <td className="px-4 py-3">{renderActions(item)}</td>
                  </tr>
                )
              }}
            />

          </Card>
        </div>
      )}

      {/* Admin: Reviewed By Manager */}
      {isAdmin && activeTab === 'reviewedByManager' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <Table
              columns={adminColumns}
              data={reviewedByManagerLeaves.filter(l => adminStatusFilter === 'all' || l.status === adminStatusFilter)}
              renderRow={(item) => {
                const empInfo = getEmpDetails(item.employeeId);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{empInfo.name}</td>
                    {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.department}</td>}
                    {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.designation}</td>}
                    <td className="px-4 py-3">{item.leaveTypeName || item.leaveType || item.leaveTypeId}</td>
                    <td className="px-4 py-3">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</td>
                    <td className="px-4 py-3">{daysBetween(item.fromDate, item.toDate)}</td>
                    <td className="px-4 py-3">
                      {item.attachmentURL ? (
                        <a href={item.attachmentURL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-semibold">
                          View File
                        </a>
                      ) : (
                        <span className="text-neutral-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge tone={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Badge></td>
                    <td className="px-4 py-3">{renderReason(item)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{item.approvedBy ? getEmpName(item.approvedBy) : '—'}</td>
                    <td className="px-4 py-3">{renderActions(item)}</td>
                  </tr>
                )
              }}
            />

          </Card>
        </div>
      )}

      <Modal
        open={confirmOpen}
        title="Confirm delete"
        onClose={() => {
          setConfirmOpen(false);
          setConfirmItem(null);
        }}
        footer={(
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setConfirmOpen(false); setConfirmItem(null); }}>Cancel</Button>
            <Button
              variant="danger"
              disabled={!confirmItem || deleting === confirmItem?.id}
              onClick={async () => {
                if (!confirmItem) return;
                try {
                  setDeleting(confirmItem.id);
                  await removeDocument('leaveRequests', confirmItem.id);
                  setConfirmOpen(false);
                } catch (err) {
                  console.error('Failed to delete leave request', err);
                  alert('Failed to delete leave request.');
                } finally {
                  setDeleting(null);
                  setConfirmItem(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        )}
      >
        <p>Are you sure you want to delete this leave request? This cannot be undone.</p>
      </Modal>

      <Modal
        open={leaveReasonOpen}
        title="Leave Details"
        onClose={() => {
          setLeaveReasonOpen(false);
          setLeaveReasonItem(null);
        }}
        footer={<Button onClick={() => setLeaveReasonOpen(false)}>Close</Button>}
      >
        {leaveReasonItem && (
          <div className="space-y-4 text-sm text-neutral-700 max-h-[60vh] overflow-y-auto">
            {leaveReasonItem.reason && (
              <div>
                <span className="font-bold uppercase tracking-widest text-neutral-400 text-xs">Application Reason</span>
                <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 whitespace-pre-wrap break-words">
                  {leaveReasonItem.reason}
                </div>
              </div>
            )}
            {leaveReasonItem.status === 'rejected' && leaveReasonItem.approverComment && (
              <div>
                <span className="font-bold uppercase tracking-widest text-red-400 text-xs">Rejection Reason</span>
                <div className="mt-1 p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 whitespace-pre-wrap break-words">
                  {leaveReasonItem.approverComment}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
