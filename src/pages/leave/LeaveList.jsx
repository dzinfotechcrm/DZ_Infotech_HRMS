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

  const columns = [
    ...(isAdminLike(user?.role) ? [{ key: 'employee', label: 'Employee' }] : []),
    { key: 'type', label: 'Type' },
    { key: 'range', label: 'Range' },
    { key: 'days', label: 'Days' },
    { key: 'attachment', label: 'Attachment' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' }
  ];

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonItem, setReasonItem] = useState(null);

  const visibleLeaves = isAdminLike(user?.role) ? leaveRequests : leaveRequests.filter((item) => item.employeeId === user?.uid);
  const visibleBalances = isAdminLike(user?.role) ? leaveBalance : leaveBalance.filter((item) => item.employeeId === user?.uid);

  const showActions = visibleLeaves.some((item) => {
    const isOwner = item.employeeId === user?.uid;
    const isAdmin = isAdminLike(user?.role);
    if (isAdmin && (item.status === 'approved' || item.status === 'rejected')) return true;
    if (isOwner && (item.status === 'pending' || item.status === 'rejected')) return true;
    return false;
  });
  if (showActions) {
    columns.push({ key: 'actions', label: 'Actions' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave Management"
        title="Leave requests and balance tracking"
        description="Apply for leave, review pending approvals, and monitor employee leave balances in one place."
        actions={(
          <div className="flex flex-wrap gap-2">
            {!isAdminLike(user?.role) && <Link to="/leave/new"><Button>Apply Leave</Button></Link>}
            {(user?.role === 'admin' || user?.role === 'hr') && <Link to="/leave/approval"><Button variant="secondary">Approval Queue</Button></Link>}
          </div>
        )}
      />

      {!isAdminLike(user?.role) && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleBalances.map((balance) => (
            <Card key={balance.id} className="p-5">
              <div className="section-title">Leave Balance</div>
              <p className="muted-text mt-1">Employee: {getEmpName(balance.employeeId)}</p>
              <div className="mt-4 grid gap-2">
                {Object.entries(balance.balances || {}).map(([typeId, value]) => {
                  const typeName = leaveTypes.find((t) => t.id === typeId)?.name || typeId;
                  const remaining = value?.remaining ?? 0;
                  const used = value?.used ?? 0;
                  return (
                    <div key={typeId} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 text-sm">
                      <span>{typeName}</span>
                      <span className="font-semibold text-neutral-900">{remaining} remaining (used {used})</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <Table
          columns={columns}
          data={visibleLeaves}
          renderRow={(item) => (
            <tr key={item.id}>
              {isAdminLike(user?.role) && <td className="px-4 py-3">{getEmpName(item.employeeId)}</td>}
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
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.status === 'pending' && item.employeeId === user?.uid && (
                      <Link to={`/leave/${item.id}/edit`}>
                        <Button variant="secondary" className="px-3 py-1 text-xs">Edit</Button>
                      </Link>
                    )}
                    {item.status === 'rejected' && item.employeeId === user?.uid && (
                      <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => { setReasonItem(item); setReasonOpen(true); }}>Why</Button>
                    )}
                    {(item.status === 'approved' || item.status === 'rejected') && isAdminLike(user?.role) && (
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
                </td>
              )}
            </tr>
          )}
        />
      </Card>

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
