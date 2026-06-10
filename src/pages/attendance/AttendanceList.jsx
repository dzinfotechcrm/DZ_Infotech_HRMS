import { useMemo, useState } from 'react';
import { query, orderBy, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { isAdminLike } from '../../utils/rbac';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';
import { createDocument } from '../../firebase/firestore';

export default function AttendanceList() {
  const { user } = useAuth();
  const isEmployee = !isAdminLike(user?.role);

  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(formatDate(new Date(), 'yyyy-MM'));
  const [date, setDate] = useState('');

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState('monthly');
  const [exportDate, setExportDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [exportMonth, setExportMonth] = useState(formatDate(new Date(), 'yyyy-MM'));
  const [exportStartDate, setExportStartDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [exportEndDate, setExportEndDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState('');

  const today = formatDate(new Date(), 'yyyy-MM-dd');
  const thisMonth = formatDate(new Date(), 'yyyy-MM');

  const { items: employees } = useFirestoreCollection('employees');
  const { items: departments } = useFirestoreCollection('departments');

  const currentEmployee = useMemo(() => {
    return employees.find(e => e.uid === user?.uid || e.email === user?.email);
  }, [employees, user]);

  const possibleIds = useMemo(() => {
    if (!user) return [];
    const ids = [user.uid];
    if (currentEmployee && currentEmployee.id && currentEmployee.id !== user.uid) {
      ids.push(currentEmployee.id);
    }
    return ids;
  }, [user, currentEmployee]);

  const attendanceQuery = useMemo(() => {
    if (!user || possibleIds.length === 0) {
      return undefined;
    }
    return (base) => {
      if (isEmployee) {
        return query(base, where('employeeId', 'in', possibleIds));
      }
      return query(base, orderBy('date', 'desc'));
    };
  }, [user, isEmployee, possibleIds]);

  const { items: attendance } = useFirestoreCollection('attendance', attendanceQuery);

  const sortedAttendance = useMemo(() => {
    return [...attendance].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA; // descending
    });
  }, [attendance]);

  function getEmpName(item) {
    const id = item.employeeId;
    const emp = employees.find(e => e.uid === id || e.id === id);
    if (emp && emp.firstName) return `${emp.firstName} ${emp.lastName || ''}`.trim();
    if (item.employeeName) return item.employeeName;
    return id;
  }

  function getEmpDept(id) {
    const emp = employees.find(e => e.uid === id || e.id === id);
    if (!emp) return '—';
    if (emp.department) return emp.department;
    if (emp.departmentId && departments) {
      const d = departments.find(d => d.id === emp.departmentId);
      return d ? d.name : '—';
    }
    return '—';
  }

  function getEmpRole(id) {
    const emp = employees.find(e => e.uid === id || e.id === id);
    if (!emp || !emp.role) return '—';
    return emp.role.charAt(0).toUpperCase() + emp.role.slice(1);
  }

  function exportCsv(rows, filename = 'attendance') {
    const header = ['Date', 'Employee', 'Department', 'Role', 'Status', 'Check In', 'Check Out', 'Notes'];
    const csv = [
      header.join(','),
      ...rows.map((row) => [
        formatDate(row.date, 'dd MMM yyyy'),
        getEmpName(row),
        getEmpDept(row.employeeId),
        getEmpRole(row.employeeId),
        row.status || '',
        row.checkIn || '',
        row.checkOut || '',
        row.notes || '',
      ].map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const todayExport = formatDate(new Date(), 'yyyy-MM-dd');
    link.download = `${filename}-${todayExport}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const filtered = sortedAttendance.filter((item) => {
    const empName = getEmpName(item);
    const employeeMatches = isEmployee ? true : String(empName || item.employeeId || '').toLowerCase().includes(search.toLowerCase());
    const itemDate = item.date || '';
    const itemMonth = item.month || (itemDate ? itemDate.substring(0, 7) : '');
    const matchesDate = date ? itemDate === date : true;
    const matchesMonth = (!date && month) ? itemMonth === month : true;
    return employeeMatches && matchesDate && matchesMonth;
  });

  const getExportRows = () => {
    return sortedAttendance.filter((item) => {
      const empName = getEmpName(item);
      const employeeMatches = isEmployee ? true : String(empName || item.employeeId || '').toLowerCase().includes(search.toLowerCase());
      const itemDate = item.date || '';
      const itemMonth = item.month || (itemDate ? itemDate.substring(0, 7) : '');
      let matchesScope = true;

      if (exportScope === 'daily') {
        matchesScope = itemDate === exportDate;
      } else if (exportScope === 'monthly') {
        matchesScope = itemMonth === exportMonth;
      } else if (exportScope === 'custom') {
        matchesScope = exportStartDate && exportEndDate && itemDate >= exportStartDate && itemDate <= exportEndDate;
      }

      return employeeMatches && matchesScope;
    });
  };

  const handleExportConfirm = () => {
    if (exportScope === 'custom' && (!exportStartDate || !exportEndDate || exportStartDate > exportEndDate)) {
      toast.error('Please choose a valid custom date range.');
      return;
    }
    if (exportScope === 'daily' && !exportDate) {
      toast.error('Please choose an export date.');
      return;
    }
    if (exportScope === 'monthly' && !exportMonth) {
      toast.error('Please choose an export month.');
      return;
    }

    exportCsv(getExportRows(), 'attendance');
    setExportModalOpen(false);
  };



  const presentCount = filtered.filter(a => a.status === 'present').length;
  const absentCount = filtered.filter(a => a.status === 'absent').length;
  const lateCount = filtered.filter(a => a.status === 'late').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title={isEmployee ? "My Attendance" : "Attendance register and daily view"}
        description={isEmployee ? "View your daily attendance and submit correction requests." : "Search attendance records and inspect daily attendance details quickly."}
        actions={
          <Button variant="secondary" onClick={() => setExportModalOpen(true)} className="gap-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </Button>
        }
      >
        <Card className="p-4 mt-4">
          <div className={`grid gap-3 ${isEmployee ? 'md:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-4'} items-end`}>
            {!isEmployee && (
              <div className="lg:col-span-2">
                <Input label="Search" placeholder="Employee name or ID" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            )}
            <Input label="Month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setDate(''); }} max={thisMonth} />
            <Input label="Date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setMonth(''); }} max={today} />
          </div>
        </Card>
      </PageHeader>

      <Modal
        open={exportModalOpen}
        title="Export Attendance CSV"
        onClose={() => setExportModalOpen(false)}
        footer={
          <div className="flex gap-3 pt-3">
            <Button variant="secondary" onClick={() => setExportModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleExportConfirm} className="flex-1">
              Export
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select label="Export type" value={exportScope} onChange={(event) => setExportScope(event.target.value)}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom range</option>
          </Select>

          {exportScope === 'daily' && (
            <Input label="Export date" type="date" value={exportDate} onChange={(event) => setExportDate(event.target.value)} max={today} />
          )}

          {exportScope === 'monthly' && (
            <Input label="Export month" type="month" value={exportMonth} onChange={(event) => setExportMonth(event.target.value)} max={thisMonth} />
          )}

          {exportScope === 'custom' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="From" type="date" value={exportStartDate} onChange={(event) => setExportStartDate(event.target.value)} max={today} />
              <Input label="To" type="date" value={exportEndDate} onChange={(event) => setExportEndDate(event.target.value)} max={today} />
            </div>
          )}
        </div>
      </Modal>

      {isEmployee && (
        <div className="grid gap-4 grid-cols-3">
          <Card className="p-4 flex flex-col items-center justify-center bg-success-50 border-success-100 text-success-900">
            <div className="text-sm font-medium uppercase tracking-wider">Present</div>
            <div className="text-3xl font-bold mt-1">{presentCount}</div>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center bg-warning-50 border-warning-100 text-warning-900">
            <div className="text-sm font-medium uppercase tracking-wider">Late</div>
            <div className="text-3xl font-bold mt-1">{lateCount}</div>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center bg-danger-50 border-danger-100 text-danger-900">
            <div className="text-sm font-medium uppercase tracking-wider">Absent</div>
            <div className="text-3xl font-bold mt-1">{absentCount}</div>
          </Card>
        </div>
      )}

      <Card className="p-5">
        <Table
          columns={[
            { key: 'date', label: 'Date' },
            ...(isEmployee ? [] : [{ key: 'employee', label: 'Employee' }]),
            ...(isEmployee ? [] : [{ key: 'department', label: 'Department' }]),
            ...(isEmployee ? [] : [{ key: 'role', label: 'Role' }]),
            { key: 'status', label: 'Status' },
            { key: 'checkIn', label: 'Check In' },
            { key: 'checkOut', label: 'Check Out' },
            { key: 'notes', label: 'Notes' }
          ]}
          data={filtered}
          renderRow={(item) => (
            <tr key={item.id} className={item.status === 'present' ? 'bg-success-100/30' : item.status === 'late' ? 'bg-warning-100/40' : item.status === 'absent' ? 'bg-danger-100/30' : ''}>
              <td className="px-4 py-3">{formatDate(item.date)}</td>
              {!isEmployee && <td className="px-4 py-3">{getEmpName(item)}</td>}
              {!isEmployee && <td className="px-4 py-3">{getEmpDept(item.employeeId)}</td>}
              {!isEmployee && <td className="px-4 py-3">{getEmpRole(item.employeeId)}</td>}
              <td className="px-4 py-3"><Badge tone={item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : item.status === 'absent' ? 'danger' : 'neutral'}>{item.status}</Badge></td>
              <td className="px-4 py-3 whitespace-nowrap">{item.checkIn || '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{item.checkOut || '—'}</td>
              <td className="px-4 py-3 min-w-[120px]">
                {item.notes ? (
                  <Button
                    variant="secondary"
                    className="py-1 px-3 text-xs"
                    onClick={() => {
                      setSelectedNote(item.notes);
                      setNoteModalOpen(true);
                    }}
                  >
                    View Note
                  </Button>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          )}
        />
      </Card>

      <Modal
        open={noteModalOpen}
        title="Check-Out Note"
        onClose={() => setNoteModalOpen(false)}
        footer={
          <div className="flex pt-3">
            <Button variant="secondary" onClick={() => setNoteModalOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        }
      >
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap break-words">
          {selectedNote}
        </div>
      </Modal>

    </div>
  );
}
