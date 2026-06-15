import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { query, where, orderBy, limit } from '../../supabase/db';
import { CalendarDaysIcon, DocumentTextIcon, PencilSquareIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection, useSupabaseDocument } from '../../hooks/useSupabase';
import { formatDate } from '../../utils/dateHelpers';
import { useAuth } from '../../hooks/useAuth';
import { isAdminLike } from '../../utils/rbac';

const tabs = ['Overview', 'Attendance', 'Leave', 'Payroll', 'Documents'];

export default function EmployeeProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const { item: employee, loading } = useSupabaseDocument('employees', id);
  const employeeKey = employee?.uid || id;

  const attendanceQuery = useMemo(() => (base) => query(base, where('employeeId', '==', employeeKey), orderBy('date', 'desc'), limit(20)), [employeeKey]);
  const leaveQuery = useMemo(() => (base) => query(base, where('employeeId', '==', employeeKey), orderBy('createdAt', 'desc'), limit(20)), [employeeKey]);
  const payrollQuery = useMemo(() => (base) => query(base, where('employeeId', '==', employeeKey), orderBy('processedAt', 'desc'), limit(20)), [employeeKey]);
  const documentQuery = useMemo(() => (base) => query(base, where('employeeId', '==', employeeKey), orderBy('createdAt', 'desc'), limit(20)), [employeeKey]);

  const { items: attendance } = useSupabaseCollection('attendance', attendanceQuery);
  const { items: leaves } = useSupabaseCollection('leaveRequests', leaveQuery);
  const { items: payroll } = useSupabaseCollection('payroll', payrollQuery);
  const { items: documents } = useSupabaseCollection('documents', documentQuery);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  if (!employee) {
    return <Card className="p-8 text-center text-neutral-500">Employee record not found.</Card>;
  }

  const editable = isAdminLike(user?.role) || user?.uid === employee.uid;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employee Profile"
        title={`${employee.firstName} ${employee.lastName}`}
        description="View the employee's record, attendance, leave, payroll and documents in one unified profile."
        actions={(
          <div className="flex flex-wrap gap-2">
            {editable && <Link to={`/employees/${employee.id}/edit`}><Button><PencilSquareIcon className="h-4 w-4" /> Edit</Button></Link>}
            <Link to="/employees"><Button variant="secondary">Back</Button></Link>
          </div>
        )}
      />
      <Card className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-2xl font-bold text-primary-700">
              {employee.photoURL ? <img src={employee.photoURL} alt={employee.firstName} className="h-full w-full object-cover" /> : `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`}
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">{employee.firstName} {employee.lastName}</div>
              <div className="mt-1 text-sm text-neutral-500">{employee.designation} · {employee.department}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={employee.status === 'active' ? 'success' : 'neutral'}>{employee.status}</Badge>
                <Badge tone="primary">{employee.role}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {editable && <Link to={`/employees/${employee.id}/edit`}><Button><PencilSquareIcon className="h-4 w-4" /> Edit</Button></Link>}
            <Link to="/employees"><Button variant="secondary">Back</Button></Link>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tabs.map((currentTab) => (
          <button
            key={currentTab}
            onClick={() => setTab(currentTab)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === currentTab ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            {currentTab}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-2">
            <h2 className="section-title">Employee Details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                ['Employee ID', employee.employeeId],
                ['Email', employee.email],
                ['Phone', employee.phone],
                ['Date of Birth', formatDate(employee.dob)],
                ['Join Date', formatDate(employee.joinDate)],
                ['Manager ID', employee.managerId || '—'],
                ['Salary', employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : '—'],
                ['UID', employee.uid],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">{label}</div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">{value || '—'}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="section-title">Quick Stats</h2>
            <div className="mt-4 space-y-4 text-sm text-neutral-600">
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4"><span className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4" /> Attendance</span><span className="font-semibold text-neutral-900">{attendance.length}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4"><span className="flex items-center gap-2"><UserGroupIcon className="h-4 w-4" /> Leave Requests</span><span className="font-semibold text-neutral-900">{leaves.length}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4"><span className="flex items-center gap-2"><DocumentTextIcon className="h-4 w-4" /> Documents</span><span className="font-semibold text-neutral-900">{documents.length}</span></div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Attendance' && (
        <Card className="p-5">
          <Table
            columns={[{ key: 'date', label: 'Date' }, { key: 'checkIn', label: 'Check In' }, { key: 'checkOut', label: 'Check Out' }, { key: 'status', label: 'Status' }, { key: 'notes', label: 'Notes' }]}
            data={attendance}
            renderRow={(item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{formatDate(item.date)}</td>
                <td className="px-4 py-3">{item.checkIn || '—'}</td>
                <td className="px-4 py-3">{item.checkOut || '—'}</td>
                <td className="px-4 py-3"><Badge tone={item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : item.status === 'absent' ? 'danger' : 'neutral'}>{item.status}</Badge></td>
                <td className="px-4 py-3">{item.notes || '—'}</td>
              </tr>
            )}
          />
        </Card>
      )}

      {tab === 'Leave' && (
        <Card className="p-5">
          <Table
            columns={[{ key: 'type', label: 'Type' }, { key: 'range', label: 'Range' }, { key: 'status', label: 'Status' }, { key: 'comment', label: 'Comment' }]}
            data={leaves}
            renderRow={(item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.leaveType}</td>
                <td className="px-4 py-3">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</td>
                <td className="px-4 py-3"><Badge tone={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Badge></td>
                <td className="px-4 py-3">{item.comment || '—'}</td>
              </tr>
            )}
          />
        </Card>
      )}

      {tab === 'Payroll' && (
        <Card className="p-5">
          <Table
            columns={[{ key: 'month', label: 'Month' }, { key: 'status', label: 'Status' }, { key: 'net', label: 'Net Salary' }]}
            data={payroll}
            renderRow={(item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.month} {item.year}</td>
                <td className="px-4 py-3"><Badge tone={item.status === 'paid' ? 'success' : item.status === 'processed' ? 'primary' : 'neutral'}>{item.status}</Badge></td>
                <td className="px-4 py-3">₹{Number(item.netSalary || 0).toLocaleString()}</td>
              </tr>
            )}
          />
        </Card>
      )}

      {tab === 'Documents' && (
        <Card className="p-5">
          <Table
            columns={[{ key: 'type', label: 'Type' }, { key: 'name', label: 'File' }, { key: 'date', label: 'Uploaded' }, { key: 'url', label: 'Link' }]}
            data={documents}
            renderRow={(item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.docType}</td>
                <td className="px-4 py-3">{item.fileName}</td>
                <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                <td className="px-4 py-3"><a className="text-primary-600 hover:underline" href={item.fileURL} target="_blank" rel="noreferrer">Open</a></td>
              </tr>
            )}
          />
        </Card>
      )}
    </div>
  );
}
