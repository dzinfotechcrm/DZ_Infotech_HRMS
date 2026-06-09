import { useMemo, useState } from 'react';
import { query, orderBy, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { isAdminLike } from '../../utils/rbac';
import { daysBetween, formatDate } from '../../utils/dateHelpers';
import { updateDocument, upsertDocument } from '../../firebase/firestore';

export default function LeaveApproval() {
  const { user } = useAuth();
  const [comments, setComments] = useState({});
  const [confirmApprove, setConfirmApprove] = useState(null);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const { items: requests, error } = useFirestoreCollection('leaveRequests', leaveQuery);
  const { items: employees } = useFirestoreCollection('employees');
  const { items: departments } = useFirestoreCollection('departments');

  function getEmpName(id) {
    const emp = employees.find(e => e.uid === id || e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : id;
  }

  function getEmpDetails(id) {
    const emp = employees.find(e => e.uid === id || e.id === id);
    if (!emp) return { name: id, designation: '-', department: '-' };
    const dept = departments.find(d => d.id === emp.departmentId);
    return {
      name: `${emp.firstName} ${emp.lastName}`.trim(),
      designation: emp.designation || '-',
      department: dept?.name || '-',
    };
  }

  const currentEmployee = employees.find((e) => e.uid === user?.uid || e.email === user?.email);
  const isManager = user?.role === 'manager';

  if (!isAdminLike(user?.role) && !isManager) {
    return <Card className="p-6 text-center">Approval queue is restricted to Admin, HR, and Manager users.</Card>;
  }

  if (error) {
    return <Card className="p-6 text-center text-danger">Unable to load approval requests: {error.message}</Card>;
  }

  const pendingRequests = requests.filter((request) => {
    if (String(request.status || '').toLowerCase().trim() !== 'pending') return false;
    
    // Prevent ANY user from approving their own leave
    if (request.employeeId === user?.uid) return false;
    
    if (isManager && !isAdminLike(user?.role)) {
      const requestEmp = employees.find(e => e.uid === request.employeeId || e.id === request.employeeId);
      // Make it visible to manager if the employee is in the same department
      if (requestEmp?.departmentId !== currentEmployee?.departmentId) return false;
    }
    
    return true;
  });

  async function updateStatus(request, status) {
    try {
      const approverComment = comments[request.id] || '';
      
      if (status === 'rejected' && !approverComment.trim()) {
        toast.error('A comment is required when rejecting a leave request.');
        return;
      }

      const updateData = { status, approverComment, approvedBy: user.uid };
      if (status === 'rejected') {
        updateData.rejectedAt = new Date().toISOString();
      } else if (status === 'approved') {
        updateData.approvedAt = new Date().toISOString();
      }

      await updateDocument('leaveRequests', request.id, updateData);
      
      // Auto notification
      await upsertDocument('notifications', Date.now().toString(), {
        userId: request.employeeId,
        type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
        title: `Leave ${status}`,
        message: `Your leave request for ${request.leaveTypeName || 'Leave'} has been ${status}.`,
        isRead: false,
        relatedId: request.id,
      });

      if (status === 'approved') {
        const employeeId = request.employeeId;
        const year = new Date(request.fromDate).getFullYear().toString();
        const balanceId = `${employeeId}_${year}`;
        const days = request.totalDays || daysBetween(request.fromDate, request.toDate);
        
        await upsertDocument('leaveBalance', balanceId, {
          employeeId,
          year,
          balances: {
            [request.leaveTypeId]: {
              used: increment(days),
              remaining: increment(-days),
            },
          },
        });
      }
      toast.success(`Leave ${status}`);
    } catch (error) {
      toast.error(error?.message || 'Unable to update leave');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave Approval"
        title="Approval queue"
        description="Review pending leave requests and approve or reject with comments."
      />
      <Card className="p-6">
        <div className="mb-6">
          <div className="section-title">Approval Queue</div>
          <p className="muted-text">Approve or reject leave with comments and automatic balance updates.</p>
        </div>
      <Table
        columns={[
          { key: 'employee', label: 'Employee' }, 
          { key: 'department', label: 'Department' },
          { key: 'designation', label: 'Designation' },
          { key: 'type', label: 'Type' }, 
          { key: 'range', label: 'Range' }, 
          { key: 'attachment', label: 'Attachment' }, 
          { key: 'status', label: 'Status' }, 
          { key: 'comment', label: 'Comment' }, 
          { key: 'actions', label: 'Actions' }
        ]}
        data={pendingRequests}
        renderRow={(request) => {
          const empInfo = getEmpDetails(request.employeeId);
          return (
          <tr key={request.id}>
            <td className="px-4 py-3 font-medium text-neutral-900">{empInfo.name}</td>
            <td className="px-4 py-3 text-neutral-600">{empInfo.department}</td>
            <td className="px-4 py-3 text-neutral-600">{empInfo.designation}</td>
            <td className="px-4 py-3">{request.leaveTypeName || request.leaveType || request.leaveTypeId}</td>
            <td className="px-4 py-3">{formatDate(request.fromDate)} - {formatDate(request.toDate)}</td>
            <td className="px-4 py-3">
              {request.attachmentURL ? (
                <a href={request.attachmentURL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-semibold">
                  View File
                </a>
              ) : (
                <span className="text-neutral-400 text-sm">—</span>
              )}
            </td>
            <td className="px-4 py-3"><Badge tone="warning">{request.status}</Badge></td>
            <td className="px-4 py-3"><Input value={comments[request.id] || ''} onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Add a comment" /></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setConfirmApprove(request)}>Approve</Button>
                <Button variant="danger" onClick={() => updateStatus(request, 'rejected')}>Reject</Button>
              </div>
            </td>
          </tr>
        )}}
      />
    </Card>

      <Modal
        open={!!confirmApprove}
        title="Confirm Approval"
        onClose={() => setConfirmApprove(null)}
        footer={(
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmApprove(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (confirmApprove) {
                  updateStatus(confirmApprove, 'approved');
                  setConfirmApprove(null);
                }
              }}
            >
              Approve Leave
            </Button>
          </div>
        )}
      >
        <div className="text-neutral-700 space-y-2">
          <p>Are you sure you want to approve this leave request?</p>
          {confirmApprove && (
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-sm mt-3 space-y-1.5">
              <p><span className="font-medium text-neutral-500 w-20 inline-block">Employee:</span> <span className="font-semibold text-neutral-900">{getEmpName(confirmApprove.employeeId)}</span></p>
              <p><span className="font-medium text-neutral-500 w-20 inline-block">Dates:</span> <span className="font-semibold text-neutral-900">{formatDate(confirmApprove.fromDate)} - {formatDate(confirmApprove.toDate)}</span></p>
              <p><span className="font-medium text-neutral-500 w-20 inline-block">Type:</span> <span className="font-semibold text-neutral-900">{confirmApprove.leaveTypeName || confirmApprove.leaveType || confirmApprove.leaveTypeId}</span></p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
