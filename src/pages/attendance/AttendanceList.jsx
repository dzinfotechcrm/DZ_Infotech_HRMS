import { useMemo, useState } from 'react';
import { query, orderBy, where } from '../../supabase/db';
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
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { isAdminLike } from '../../utils/rbac';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';
import { createDocument } from '../../supabase/db';
import * as XLSX from 'xlsx';

export default function AttendanceList() {
  const { user } = useAuth();
  const isEmployee = !isAdminLike(user?.role);

  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [date, setDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const { items: employees } = useSupabaseCollection('employees');
  const { items: departments } = useSupabaseCollection('departments');
  const { items: leaveRequests } = useSupabaseCollection('leaveRequests');

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

  const { items: attendance } = useSupabaseCollection('attendance', attendanceQuery);

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
    const data = rows.map((row) => ({
      'Date': formatDate(row.date, 'dd MMM yyyy'),
      'Employee': getEmpName(row),
      'Department': getEmpDept(row.employeeId),
      'Role': getEmpRole(row.employeeId),
      'Status': row.status || '',
      'Check In': row.checkIn || '',
      'Check Out': row.checkOut || '',
      'Notes': row.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Auto-adjust column widths
    const max_width = data.reduce((w, r) => {
      Object.keys(r).forEach(key => {
        w[key] = Math.max(w[key] || key.length, String(r[key] || '').length);
      });
      return w;
    }, {});

    worksheet['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: max_width[key] + 2 }));

    const todayExport = formatDate(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `${filename}-${todayExport}.xlsx`);
  }

  const filtered = useMemo(() => {
    let baseList = sortedAttendance;

    if (date || month) {
      const datesToProcess = date ? [date] : (() => {
        const [y, m] = month.split('-');
        const daysInMonth = new Date(y, m, 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
          const d = `${y}-${m}-${String(i).padStart(2, '0')}`;
          if (d > today) break;
          days.push(d);
        }
        return days;
      })();

      const virtualRows = [];
      const validEmps = isEmployee
        ? employees.filter(emp => possibleIds.includes(emp.uid) || possibleIds.includes(emp.id))
        : employees.filter(emp => emp.role !== 'admin' && String(emp.role).toLowerCase() !== 'agent');

      for (const d of datesToProcess) {
        for (const emp of validEmps) {
          if (emp.joinDate && d < emp.joinDate) continue;

          const att = sortedAttendance.find(a => (a.employeeId === emp.uid || a.employeeId === emp.id) && a.date === d);
          if (att) {
            virtualRows.push(att);
            continue;
          }

          const onLeave = leaveRequests.find(lr => {
            const isMatch = lr.employeeId === emp.uid || lr.employeeId === emp.id;
            const isApproved = lr.status === 'approved';
            const overlaps = lr.fromDate <= d && lr.toDate >= d;
            return isMatch && isApproved && overlaps;
          });

          virtualRows.push({
            id: `virtual-${emp.id || emp.uid}-${d}`,
            employeeId: emp.id || emp.uid,
            date: d,
            status: onLeave ? 'On Leave' : (d > today ? '—' : 'absent'),
            checkIn: '',
            checkOut: '',
            notes: ''
          });
        }
      }

      virtualRows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      baseList = virtualRows;
    }

    return baseList.filter((item) => {
      const empRole = getEmpRole(item.employeeId);
      if (empRole.toLowerCase() === 'admin' || empRole.toLowerCase() === 'agent') return false;
      const empName = getEmpName(item);
      const employeeMatches = isEmployee ? true : String(empName || item.employeeId || '').toLowerCase().includes(search.toLowerCase());
      const itemDate = item.date || '';
      const itemMonth = item.month || (itemDate ? itemDate.substring(0, 7) : '');
      const matchesDate = date ? itemDate === date : true;
      const matchesMonth = (!date && month) ? itemMonth === month : true;
      const matchesStatus = statusFilter ? (item.status || '').toLowerCase() === statusFilter.toLowerCase() : true;
      return employeeMatches && matchesDate && matchesMonth && matchesStatus;
    });
  }, [sortedAttendance, employees, leaveRequests, isEmployee, date, month, search, statusFilter, today]);

  const getExportRows = () => {
    let baseList = sortedAttendance;

    if (exportScope) {
      let datesToProcess = [];
      if (exportScope === 'daily' && exportDate) {
        if (exportDate <= today) datesToProcess = [exportDate];
      } else if (exportScope === 'monthly' && exportMonth) {
        const [y, m] = exportMonth.split('-');
        const daysInMonth = new Date(y, m, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const d = `${y}-${m}-${String(i).padStart(2, '0')}`;
          if (d > today) break;
          datesToProcess.push(d);
        }
      } else if (exportScope === 'custom' && exportStartDate && exportEndDate) {
        let current = new Date(exportStartDate);
        const endDate = new Date(exportEndDate);
        while (current <= endDate) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          const d = `${y}-${m}-${day}`;
          if (d > today) break;
          datesToProcess.push(d);
          current.setDate(current.getDate() + 1);
        }
      }

      if (datesToProcess.length > 0) {
        const virtualRows = [];
        const validEmps = isEmployee
          ? employees.filter(emp => possibleIds.includes(emp.uid) || possibleIds.includes(emp.id))
          : employees.filter(emp => emp.role !== 'admin' && String(emp.role).toLowerCase() !== 'agent');

        for (const d of datesToProcess) {
          for (const emp of validEmps) {
            if (emp.joinDate && d < emp.joinDate) continue;

            const att = sortedAttendance.find(a => (a.employeeId === emp.uid || a.employeeId === emp.id) && a.date === d);
            if (att) {
              virtualRows.push(att);
              continue;
            }

            const onLeave = leaveRequests.find(lr => {
              const isMatch = lr.employeeId === emp.uid || lr.employeeId === emp.id;
              const isApproved = lr.status === 'approved';
              const overlaps = lr.fromDate <= d && lr.toDate >= d;
              return isMatch && isApproved && overlaps;
            });

            virtualRows.push({
              id: `virtual-${emp.id || emp.uid}-${d}`,
              employeeId: emp.id || emp.uid,
              date: d,
              status: onLeave ? 'On Leave' : 'absent',
              checkIn: '',
              checkOut: '',
              notes: ''
            });
          }
        }
        virtualRows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        baseList = virtualRows;
      }
    }

    return baseList.filter((item) => {
      const empRole = getEmpRole(item.employeeId);
      if (empRole.toLowerCase() === 'admin' || empRole.toLowerCase() === 'agent') return false;
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



  const { presentCount, absentCount, lateCount, onLeaveCount } = useMemo(() => {
    if (!isEmployee) return { presentCount: 0, absentCount: 0, lateCount: 0, onLeaveCount: 0 };
    
    const targetMonth = month || (date ? date.substring(0, 7) : thisMonth);
    const [y, m] = targetMonth.split('-');
    const daysInMonth = new Date(y, m, 0).getDate();
    
    let present = 0;
    let absent = 0;
    let late = 0;
    let onLeaveCountStat = 0;
    
    const validEmps = employees.filter(emp => possibleIds.includes(emp.uid) || possibleIds.includes(emp.id));
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = `${y}-${m}-${String(i).padStart(2, '0')}`;
      if (d > today) break;
      
      for (const emp of validEmps) {
        if (emp.joinDate && d < emp.joinDate) continue;
        
        const att = sortedAttendance.find(a => (a.employeeId === emp.uid || a.employeeId === emp.id) && a.date === d);
        if (att) {
           if (att.status === 'present') present++;
           else if (att.status === 'absent') absent++;
           else if (att.status === 'late') late++;
           else if (att.status === 'On Leave' || att.status === 'on leave') onLeaveCountStat++;
           continue;
        }
        
        const onLeave = leaveRequests.find(lr => {
          const isMatch = lr.employeeId === emp.uid || lr.employeeId === emp.id;
          const isApproved = lr.status === 'approved';
          const overlaps = lr.fromDate <= d && lr.toDate >= d;
          return isMatch && isApproved && overlaps;
        });
        
        if (onLeave) {
          onLeaveCountStat++;
        } else {
          absent++;
        }
      }
    }
    return { presentCount: present, absentCount: absent, lateCount: late, onLeaveCount: onLeaveCountStat };
  }, [sortedAttendance, employees, leaveRequests, isEmployee, date, month, thisMonth, today, possibleIds]);

  const rowsPerPage = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage]);

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
          <div className={`grid gap-3 ${isEmployee ? 'md:grid-cols-4' : 'md:grid-cols-5 lg:grid-cols-6'} items-end`}>
            {!isEmployee && (
              <div className="lg:col-span-2">
                <Input label="Search" placeholder="Employee Name" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            )}
            <Select label="Status" value={statusFilter} onChange={(event) => {
              const val = event.target.value;
              setStatusFilter(val);
              if (val) {
                setDate('');
                setMonth(thisMonth);
              }
            }}>
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="on leave">On Leave</option>
            </Select>
            <Input label="Month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setDate(''); }} max={thisMonth} />
            <Input label="Date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setMonth(''); }} max={today} />
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setMonth('');
                setDate(today);
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="h-[42px]"
            >
              Reset
            </Button>
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
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-4 flex flex-col items-center justify-center bg-success-50 border-success-100 text-success-900">
            <div className="text-sm font-medium uppercase tracking-wider">Present</div>
            <div className="text-3xl font-bold mt-1">{presentCount}</div>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center bg-warning-50 border-warning-100 text-warning-900">
            <div className="text-sm font-medium uppercase tracking-wider">Late</div>
            <div className="text-3xl font-bold mt-1">{lateCount}</div>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center bg-primary-50 border-primary-100 text-primary-900">
            <div className="text-sm font-medium uppercase tracking-wider">On Leave</div>
            <div className="text-3xl font-bold mt-1">{onLeaveCount}</div>
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
          data={paginatedData}
          renderRow={(item) => (
            <tr key={item.id} className={item.status === 'present' ? 'bg-success-100/30' : item.status === 'late' ? 'bg-warning-100/40' : item.status === 'absent' ? 'bg-danger-100/30' : item.status === 'On Leave' ? 'bg-primary-50/50' : ''}>
              <td className="px-4 py-3">{formatDate(item.date)}</td>
              {!isEmployee && <td className="px-4 py-3">{getEmpName(item)}</td>}
              {!isEmployee && <td className="px-4 py-3">{getEmpDept(item.employeeId)}</td>}
              {!isEmployee && <td className="px-4 py-3">{getEmpRole(item.employeeId)}</td>}
              <td className="px-4 py-3"><Badge tone={item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : item.status === 'absent' ? 'danger' : item.status === 'On Leave' ? 'primary' : 'neutral'}>{item.status}</Badge></td>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 mt-4 pt-4 px-2">
            <div className="text-sm text-neutral-500">
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span> results
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
