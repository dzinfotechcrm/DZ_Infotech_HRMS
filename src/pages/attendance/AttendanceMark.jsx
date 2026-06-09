import { useMemo, useState } from 'react';
import { query, orderBy, where } from 'firebase/firestore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../hooks/useAuth';
import { isAdminLike } from '../../utils/rbac';
import { formatDate } from '../../utils/dateHelpers';
import { upsertDocument } from '../../firebase/firestore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AttendanceMark() {
  const { user } = useAuth();
  const [date, setDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [checkIn, setCheckIn] = useState('09:30');
  const [checkOut, setCheckOut] = useState('18:30');
  const [statusByEmployee, setStatusByEmployee] = useState({});
  const [notesByEmployee, setNotesByEmployee] = useState({});

  const employeesQuery = useMemo(() => (base) => query(base, where('status', '==', 'active'), orderBy('firstName')), []);
  const { items: employees } = useFirestoreCollection('employees', employeesQuery);

  async function saveAttendance(employee) {
    const employeeId = employee.uid;
    if (!employeeId) {
      toast.error('Employee has not registered yet (no UID)');
      return;
    }
    const recordId = `${employeeId}_${date}`;
    const status = statusByEmployee[employeeId] || 'present';
    await upsertDocument('attendance', recordId, {
      employeeId,
      date,
      month: date.substring(0, 7),
      year: date.substring(0, 4),
      checkIn,
      checkOut,
      status,
      overtimeHours: 0,
      notes: notesByEmployee[employeeId] || '',
      markedBy: user?.uid || '',
    });
  }

  async function markAll() {
    try {
      await Promise.all(employees.map((employee) => saveAttendance(employee)));
      toast.success('Attendance saved for selected date');
    } catch (error) {
      toast.error(error.message || 'Unable to save attendance');
    }
  }

  if (!isAdminLike(user?.role)) {
    return (
      <Card className="p-8 text-center">
        <div className="text-lg font-semibold text-neutral-900">Attendance marking is restricted to Admin and HR users.</div>
        <Link to="/attendance"><Button className="mt-4">Back to Attendance</Button></Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance Marking"
        title="Bulk attendance entry"
        description="Mark attendance for your team quickly with a single date, check-in/out, and status flow."
      />
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Attendance Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} max={formatDate(new Date(), 'yyyy-MM-dd')} />
          <Input label="Check In" type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          <Input label="Check Out" type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          <div className="flex items-end"><Button onClick={markAll}>Save Bulk Attendance</Button></div>
        </div>
      </Card>

      <Card className="p-5">
        <Table
          columns={[{ key: 'employee', label: 'Employee' }, { key: 'status', label: 'Status' }, { key: 'notes', label: 'Notes' }]}
          data={employees}
          renderRow={(employee) => {
            const employeeId = employee.uid || employee.id;
            return (
              <tr key={employee.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{employee.firstName} {employee.lastName}</td>
                <td className="px-4 py-3">
                  <Select value={statusByEmployee[employeeId] || 'present'} onChange={(event) => setStatusByEmployee((current) => ({ ...current, [employeeId]: event.target.value }))}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half-day</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Input placeholder="Optional notes" value={notesByEmployee[employeeId] || ''} onChange={(event) => setNotesByEmployee((current) => ({ ...current, [employeeId]: event.target.value }))} />
                </td>
              </tr>
            );
          }}
        />
      </Card>
    </div>
  );
}
