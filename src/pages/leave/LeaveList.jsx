import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { query, orderBy } from 'firebase/firestore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { removeDocument } from '../../firebase/firestore';
import { isAdminLike } from '../../utils/rbac';
import { daysBetween, formatDate, formatDateTime } from '../../utils/dateHelpers';

export default function LeaveList() {
  const { user } = useAuth();
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const balanceQuery = useMemo(() => (base) => query(base, orderBy('updatedAt', 'desc')), []);
  const { items: leaveRequests } = useFirestoreCollection('leaveRequests', leaveQuery);
  const { items: leaveBalance } = useFirestoreCollection('leaveBalance', balanceQuery);
  const { items: leaveTypes } = useFirestoreCollection('leaveTypes');
  const { items: employees } = useFirestoreCollection('employees');

  function getEmpName(id) {
    const emp = employees.find(e => e.uid === id || e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : id;
  }

  const myLeaves = leaveRequests.filter((item) => item.employeeId === user?.uid);
  
  const currentEmployee = employees.find(e => e.uid === user?.uid || e.email === user?.email);
  const isManager = user?.role === 'manager';

  const othersLeaves = isAdminLike(user?.role) 
    ? leaveRequests.filter((item) => item.employeeId !== user?.uid)
    : isManager 
      ? leaveRequests.filter(item => {
          if (item.employeeId === user?.uid) return false;
          const requestEmp = employees.find(e => e.uid === item.employeeId || e.id === item.employeeId);
          return requestEmp?.departmentId === currentEmployee?.departmentId;
        })
      : [];

  const visibleBalances = isAdminLike(user?.role) 
    ? leaveBalance 
    : isManager 
      ? leaveBalance.filter(item => {
          if (item.employeeId === user?.uid) return true;
          const requestEmp = employees.find(e => e.uid === item.employeeId || e.id === item.employeeId);
          return requestEmp?.departmentId === currentEmployee?.departmentId;
        })
      : leaveBalance.filter((item) => item.employeeId === user?.uid);

  const baseColumns = [
    { key: 'type', label: 'Type' },
    { key: 'range', label: 'Range' },
    { key: 'days', label: 'Days' },
    { key: 'attachment', label: 'Attachment' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' }
  ];

  const hasMyActions = myLeaves.some((item) => {
    if (item.status === 'pending' || item.status === 'rejected') return true;
    if (isAdminLike(user?.role) && (item.status === 'approved' || item.status === 'rejected')) return true;
    return false;
  });

  const hasOthersActions = othersLeaves.some((item) => {
    if (isAdminLike(user?.role) && (item.status === 'approved' || item.status === 'rejected')) return true;
    return false;
  });

  const myColumns = [...baseColumns];
  if (hasMyActions) myColumns.push({ key: 'actions', label: 'Actions' });

  const othersColumns = [
    { key: 'employee', label: 'Employee' },
    ...baseColumns
  ];
  if (hasOthersActions) othersColumns.push({ key: 'actions', label: 'Actions' });

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonItem, setReasonItem] = useState(null);

  const renderActions = (item) => {
    const isOwner = item.employeeId === user?.uid;
    const isAdmin = isAdminLike(user?.role);
    const canEdit = isOwner && item.status === 'pending';
    const canSeeWhy = isOwner && item.status === 'rejected';
    const canDelete = isAdmin && (item.status === 'approved' || item.status === 'rejected');

    if (!canEdit && !canSeeWhy && !canDelete) return null;

    return (
      <div className="flex gap-2">
        {canEdit && (
          <Link to={`/leave/${item.id}/edit`}>
            <Button variant="secondary" className="px-3 py-1 text-xs">Edit</Button>
          </Link>
        )}
        {canSeeWhy && (
          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => { setReasonItem(item); setReasonOpen(true); }}>Why</Button>
        )}
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

  const [activeTab, setActiveTab] = useState('my');
  const canSeeTeam = isManager || isAdminLike(user?.role);
  const pendingTeamLeavesCount = othersLeaves.filter(item => String(item.status || '').toLowerCase().trim() === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave Management"
        title="Leave requests and balance tracking"
        description="Apply for leave, review pending approvals, and monitor employee leave balances in one place."
        actions={(
          <div className="flex flex-wrap gap-2">
            {!isAdminLike(user?.role) && <Link to="/leave/new"><Button>Apply Leave</Button></Link>}
            {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && <Link to="/leave/approval"><Button variant="secondary">Approval Queue</Button></Link>}
          </div>
        )}
      />

      {canSeeTeam && (
        <div className="flex gap-4 border-b border-neutral-200">
          <button
            type="button"
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'my' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
            onClick={() => setActiveTab('my')}
          >
            My Leaves
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'team' ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
            onClick={() => setActiveTab('team')}
          >
            {isAdminLike(user?.role) ? "All Employees' Leaves" : "Team Leaves"}
            {pendingTeamLeavesCount > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'team' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'}`}>
                {pendingTeamLeavesCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* My Leaves Section */}
      {(!canSeeTeam || activeTab === 'my') && (
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
                  <td className="px-4 py-3">{item.reason}</td>
                  {hasMyActions && <td className="px-4 py-3">{renderActions(item)}</td>}
                </tr>
              )}
            />
            {myLeaves.length === 0 && (
              <div className="text-center py-6 text-neutral-500 text-sm">You have not applied for any leaves yet.</div>
            )}
          </Card>
        </div>
      )}

      {/* Team/Others Leaves Section */}
      {canSeeTeam && activeTab === 'team' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="p-5">
            <Table
              columns={othersColumns}
              data={othersLeaves}
              renderRow={(item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{getEmpName(item.employeeId)}</td>
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
                  <td className="px-4 py-3">{item.reason}</td>
                  {hasOthersActions && <td className="px-4 py-3">{renderActions(item)}</td>}
                </tr>
              )}
            />
            {othersLeaves.length === 0 && (
              <div className="text-center py-6 text-neutral-500 text-sm">No leave requests found for your team.</div>
            )}
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
        open={reasonOpen}
        title="Leave Rejection Details"
        onClose={() => {
          setReasonOpen(false);
          setReasonItem(null);
        }}
        footer={<Button onClick={() => setReasonOpen(false)}>Close</Button>}
      >
        {reasonItem && (
          <div className="space-y-4 text-sm text-neutral-700">
            <div>
              <span className="font-bold uppercase tracking-widest text-neutral-400 text-xs">Reason for Rejection</span>
              <p className="mt-1 font-medium">{reasonItem.approverComment || 'No specific reason provided.'}</p>
            </div>
            <div>
              <span className="font-bold uppercase tracking-widest text-neutral-400 text-xs">Rejected On</span>
              <p className="mt-1 font-medium">{formatDateTime(reasonItem.rejectedAt || reasonItem.updatedAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
