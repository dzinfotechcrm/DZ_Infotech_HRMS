import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';
import { query, orderBy } from '../../supabase/db';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { isAdminLike } from '../../utils/rbac';
import { daysBetween, formatDate } from '../../utils/dateHelpers';
import { updateDocument, upsertDocument, fetchDocument } from '../../supabase/db';

export default function LeaveApproval({ isTab = false, empTypeTab = 'employees' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState({});
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [leaveReasonOpen, setLeaveReasonOpen] = useState(false);
  const [leaveReasonItem, setLeaveReasonItem] = useState(null);
  const leaveQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const { items: requests, error } = useSupabaseCollection('leaveRequests', leaveQuery);
  const { items: employees } = useSupabaseCollection('employees');
  const { items: interns } = useSupabaseCollection('interns');
  const { items: departments } = useSupabaseCollection('departments');

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

  const currentEmployee = allEmployees.find((e) => e.uid === user?.uid || e.email === user?.email);
  const isManager = user?.role === 'manager';

  const renderReason = (item) => {
    if (!item.reason) return <span className="text-neutral-400 text-sm">—</span>;
    return (
      <Button
        variant="secondary"
        className="py-1 px-3 text-xs flex items-center justify-center"
        onClick={() => {
          setLeaveReasonItem(item.reason);
          setLeaveReasonOpen(true);
        }}
        title="View Reason"
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    );
  };

  if (!isAdminLike(user?.role) && !isManager) {
    return <Card className="p-6 text-center">Approval queue is restricted to Admin, HR, and Manager users.</Card>;
  }

  if (error) {
    return <Card className="p-6 text-center text-danger">Unable to load approval requests: {error.message}</Card>;
  }

  const pendingRequests = requests.filter((request) => {
    if (String(request.status || '').toLowerCase().trim() !== 'pending') return false;

    // Prevent ANY user from approving their own leave
    if (request.employeeId === user?.uid || request.employeeId === currentEmployee?.id) return false;

    const requestEmp = allEmployees.find(e => e.uid === request.employeeId || e.id === request.employeeId);
    const empRole = requestEmp?.role || '';

    if (empTypeTab === 'interns' && empRole !== 'intern') return false;
    if (empTypeTab === 'employees' && empRole === 'intern') return false;

    if (isManager && !isAdminLike(user?.role)) {
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

      const updateData = {
        status,
        data: {
          ...(request.data || {}),
          approverComment,
          approvedBy: user.uid
        }
      };
      if (status === 'rejected') {
        updateData.data.rejectedAt = new Date().toISOString();
      } else if (status === 'approved') {
        updateData.data.approvedAt = new Date().toISOString();
      }

      await updateDocument('leaveRequests', request.id, updateData);

      // Auto notification
      await upsertDocument('notifications', Date.now().toString(), {
        type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
        title: `Leave ${status}`,
        message: `Your leave request for ${request.leaveTypeName || 'Leave'} has been ${status}.`,
        data: {
          userId: request.employeeId,
          isRead: false,
          relatedId: request.id,
        }
      });

      if (status === 'approved') {
        const employeeId = request.employeeId;
        const year = new Date(request.fromDate).getFullYear().toString();
        const balanceId = `${employeeId}_${year}`;
        const days = request.totalDays || daysBetween(request.fromDate, request.toDate);

        let existingBalance = { balances: {} };
        try {
          const doc = await fetchDocument('leaveBalance', balanceId);
          if (doc) {
            existingBalance = doc;
          }
        } catch (err) {
          // It's okay if it doesn't exist yet
        }

        const currentTypeBalance = existingBalance.balances?.[request.leaveTypeId] || { used: 0, remaining: 0 };

        await upsertDocument('leaveBalance', balanceId, {
          employee_id: employeeId,
          balances: {
            ...existingBalance.balances,
            [request.leaveTypeId]: {
              used: (currentTypeBalance.used || 0) + days,
              remaining: (currentTypeBalance.remaining || 0) - days,
            },
          },
        });
      } else if (status === 'rejected') {
        // Restore the days to the employee's balance
        const employeeId = request.employeeId;
        const days = request.totalDays || daysBetween(request.fromDate, request.toDate);
        
        let quotaKey = '';
        const leaveTypeName = (request.leaveTypeName || request.leaveType || request.leaveTypeId || '').toLowerCase();
        if (leaveTypeName.includes('paid')) quotaKey = 'paid_leaves';
        else if (leaveTypeName.includes('casual')) quotaKey = 'casual_leaves';
        else if (leaveTypeName.includes('sick') || leaveTypeName.includes('medical')) quotaKey = 'sick_leaves';

        if (quotaKey) {
          const requestEmp = allEmployees.find(e => e.uid === employeeId || e.id === employeeId);
          if (requestEmp) {
            const currentUsed = Number(requestEmp[quotaKey + '_used'] || requestEmp.data?.[quotaKey + '_used'] || 0);
            await updateDocument('employees', requestEmp.id, {
              data: {
                ...(requestEmp.data || {}),
                [`${quotaKey}_used`]: Math.max(0, currentUsed - days)
              }
            });
          }
        }
      }
      toast.success(`Leave Request is ${status}`);
    } catch (error) {
      toast.error(error?.message || 'Unable to update leave');
    }
  }

  return (
    <div className={isTab ? "" : "space-y-6"}>
      {!isTab && (
        <PageHeader
          eyebrow="Leave Approval"
          title="Approval queue"
          description="Review pending leave requests and approve or reject with comments."
          actions={
            <Button variant="secondary" onClick={() => navigate('/leave')}>
              Return to Leave
            </Button>
          }
        />
      )}
      <Card className={isTab ? "p-0 border-none shadow-none" : "p-6"}>
        {!isTab && (
          <div className="mb-6">
            <div className="section-title">Approval Queue</div>
            <p className="muted-text">Approve or reject leave with comments and automatic balance updates.</p>
          </div>
        )}
        <Table
          columns={[
            { key: 'employee', label: 'Employee' },
            ...(empTypeTab === 'interns' ? [] : [
              { key: 'department', label: 'Department' },
              { key: 'designation', label: 'Designation' },
            ]),
            { key: 'type', label: 'Type' },
            { key: 'range', label: 'Range' },
            { key: 'days', label: 'Days' },
            { key: 'attachment', label: 'Attachment' },
            { key: 'status', label: 'Status' },
            { key: 'reason', label: 'Reason' },
            { key: 'comment', label: 'Comment' },
            { key: 'actions', label: 'Actions' }
          ]}
          data={pendingRequests}
          renderRow={(request) => {
            const empInfo = getEmpDetails(request.employeeId);
            return (
              <tr key={request.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{empInfo.name}</td>
                {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.department}</td>}
                {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-600">{empInfo.designation}</td>}
                <td className="px-4 py-3">{request.leaveTypeName || request.leaveType || request.leaveTypeId}</td>
                <td className="px-4 py-3">{formatDate(request.fromDate)} - {formatDate(request.toDate)}</td>
                <td className="px-4 py-3">{request.totalDays || daysBetween(request.fromDate, request.toDate)}</td>
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
                <td className="px-4 py-3">{renderReason(request)}</td>
                <td className="px-4 py-3"><Input value={comments[request.id] || ''} onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Add a comment" /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setConfirmApprove(request)}>Approve</Button>
                    <Button variant="danger" onClick={() => updateStatus(request, 'rejected')}>Reject</Button>
                  </div>
                </td>
              </tr>
            )
          }}
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

      <Modal
        open={leaveReasonOpen}
        title="Leave Request Reason"
        onClose={() => {
          setLeaveReasonOpen(false);
          setLeaveReasonItem(null);
        }}
        footer={<Button onClick={() => setLeaveReasonOpen(false)}>Close</Button>}
      >
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
          {leaveReasonItem}
        </div>
      </Modal>
    </div>
  );
}
