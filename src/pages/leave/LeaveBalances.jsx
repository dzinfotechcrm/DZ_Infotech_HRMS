import { useState, useMemo } from 'react';
import { query, orderBy } from '../../supabase/db';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { updateDocument } from '../../supabase/db';
import toast from 'react-hot-toast';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function LeaveBalances() {
  const { items: allEmployees } = useSupabaseCollection('employees', useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []));
  const employees = allEmployees.filter(emp => emp.role !== 'admin');
  const { items: interns } = useSupabaseCollection('interns', useMemo(() => (base) => query(base, orderBy('created_at', 'desc')), []));
  const { items: departments } = useSupabaseCollection('departments');
  const { items: leaveRequests } = useSupabaseCollection('leaveRequests');

  const [activeTab, setActiveTab] = useState('employees');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

  const getDeptName = (deptId) => {
    return departments.find((d) => d.id === deptId)?.name || '—';
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    if (user.role === 'intern') {
      setEditValues({
        max_leave_per_month: Number(user.max_leave_per_month || 0)
      });
    } else {
      setEditValues({
        casual_leaves_total: Number(user.casual_leaves_total || 0),
        paid_leaves_total: Number(user.paid_leaves_total || 0),
        sick_leaves_total: Number(user.sick_leaves_total || 0),
      });
    }
  };

  const handleSave = async (user) => {
    setSaving(true);
    try {
      if (user.role === 'intern') {
        await updateDocument('interns', user.id, {
          max_leave_per_month: Number(editValues.max_leave_per_month || 0)
        });
      } else {
        await updateDocument('employees', user.id, {
          casual_leaves_total: Number(editValues.casual_leaves_total || 0),
          paid_leaves_total: Number(editValues.paid_leaves_total || 0),
          sick_leaves_total: Number(editValues.sick_leaves_total || 0),
        });
      }
      toast.success('Leave balances updated successfully');
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to update leave balances');
    } finally {
      setSaving(false);
    }
  };

  const employeeColumns = [
    { key: 'name', label: 'Employee Name' },
    { key: 'department', label: 'Department' },
    { key: 'casual', label: 'Casual (Used / Total)' },
    { key: 'paid', label: 'Paid (Used / Total)' },
    { key: 'sick', label: 'Sick (Used / Total)' },
    { key: 'actions', label: 'Actions' }
  ];

  const internColumns = [
    { key: 'name', label: 'Intern Name' },
    { key: 'department', label: 'Department' },
    { key: 'monthly', label: 'Monthly (Used / Max)' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave Management"
        title="Leave Balances"
        description="View and manage leave limits for all employees and interns."
      />

      <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/60 shadow-sm">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'employees'
              ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('interns')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'interns'
              ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Interns
        </button>
      </div>

      <Card className="p-5">
        {activeTab === 'employees' && (
          <Table
            columns={employeeColumns}
            data={employees}
            renderRow={(emp) => {
              const isEditing = editingId === emp.id;
              return (
                <tr key={emp.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-900">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-3 text-neutral-600">{getDeptName(emp.departmentId)}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 w-6 text-right">{Number(emp.casual_leaves_used || 0)}</span>
                        <span className="text-neutral-400">/</span>
                        <Input
                          type="number"
                          className="!w-20 !py-1"
                          value={editValues.casual_leaves_total}
                          onChange={(e) => setEditValues({ ...editValues, casual_leaves_total: e.target.value })}
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-neutral-700">
                        {Number(emp.casual_leaves_used || 0)} <span className="text-neutral-400 font-normal">/ {Number(emp.casual_leaves_total || 0)}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 w-6 text-right">{Number(emp.paid_leaves_used || 0)}</span>
                        <span className="text-neutral-400">/</span>
                        <Input
                          type="number"
                          className="!w-20 !py-1"
                          value={editValues.paid_leaves_total}
                          onChange={(e) => setEditValues({ ...editValues, paid_leaves_total: e.target.value })}
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-neutral-700">
                        {Number(emp.paid_leaves_used || 0)} <span className="text-neutral-400 font-normal">/ {Number(emp.paid_leaves_total || 0)}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 w-6 text-right">{Number(emp.sick_leaves_used || 0)}</span>
                        <span className="text-neutral-400">/</span>
                        <Input
                          type="number"
                          className="!w-20 !py-1"
                          value={editValues.sick_leaves_total}
                          onChange={(e) => setEditValues({ ...editValues, sick_leaves_total: e.target.value })}
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-neutral-700">
                        {Number(emp.sick_leaves_used || 0)} <span className="text-neutral-400 font-normal">/ {Number(emp.sick_leaves_total || 0)}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          className="!px-3 !py-1 !text-xs gap-1"
                          onClick={() => handleSave(emp)}
                          disabled={saving}
                        >
                          <CheckIcon className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 !text-xs"
                          onClick={() => setEditingId(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 !text-xs"
                        onClick={() => handleEdit(emp)}
                      >
                        Edit Total
                      </Button>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        )}

        {activeTab === 'interns' && (
          <Table
            columns={internColumns}
            data={interns}
            renderRow={(intern) => {
              const internInfo = {
                ...intern,
                firstName: intern.first_name || intern.firstName,
                lastName: intern.last_name || intern.lastName,
                role: 'intern',
                departmentId: intern.department_id || intern.departmentId,
              };
              const isEditing = editingId === internInfo.id;
              
              const now = new Date();
              const internLeaves = leaveRequests.filter(l => l.employeeId === internInfo.id || l.employeeId === internInfo.uid);
              const currentMonthLeaves = internLeaves.filter(leave => {
                if (leave.status === 'rejected') return false;
                const leaveDate = new Date(leave.fromDate);
                return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
              });
              const used = currentMonthLeaves.reduce((acc, curr) => acc + (curr.totalDays || 0), 0);
              
              return (
                <tr key={internInfo.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-900">{internInfo.firstName} {internInfo.lastName}</td>
                  <td className="px-4 py-3 text-neutral-600">{getDeptName(internInfo.departmentId)}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 w-6 text-right">{used}</span>
                        <span className="text-neutral-400">/</span>
                        <Input
                          type="number"
                          className="!w-20 !py-1"
                          value={editValues.max_leave_per_month}
                          onChange={(e) => setEditValues({ ...editValues, max_leave_per_month: e.target.value })}
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-neutral-700">
                        {used} <span className="text-neutral-400 font-normal">/ {Number(internInfo.max_leave_per_month || 0)}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          className="!px-3 !py-1 !text-xs gap-1"
                          onClick={() => handleSave(internInfo)}
                          disabled={saving}
                        >
                          <CheckIcon className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 !text-xs"
                          onClick={() => setEditingId(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 !text-xs"
                        onClick={() => handleEdit(internInfo)}
                      >
                        Edit Total
                      </Button>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
