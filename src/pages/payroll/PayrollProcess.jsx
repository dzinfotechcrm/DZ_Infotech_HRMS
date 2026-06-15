import { useMemo, useState } from 'react';
import { query, where } from '../../supabase/db';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, upsertDocument } from '../../supabase/db';
import { useAuth } from '../../hooks/useAuth';
import { isAdminLike } from '../../utils/rbac';

function calcNet(employee, attendance, month, year) {
  const base = Number(employee.basicSalary || 0);
  const monthAttendance = attendance.filter((item) => item.employeeId === employee.uid && item.date?.startsWith(`${year}-${month}`));
  const presentDays = monthAttendance.filter((item) => item.status === 'present' || item.status === 'late' || item.status === 'half-day').length;
  const workingDays = 22;
  const absentDays = Math.max(0, workingDays - presentDays);

  const hra = base * 0.4;
  const allowances = { travel: 0, food: 0, other: base * 0.1 };
  const deductions = { pf: 0, esic: 0, other: absentDays * (base / workingDays) };

  const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);

  const tax = Math.max(0, (base + hra + totalAllowances - totalDeductions) * 0.1);
  const netSalary = base + hra + totalAllowances - totalDeductions - tax;
  return { hra, allowances, deductions, tax, netSalary, workingDays, presentDays };
}

export default function PayrollProcess() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState('draft');
  const employeesQuery = useMemo(() => (base) => query(base, where('status', '==', 'active')), []);
  const attendanceQuery = useMemo(() => (base) => query(base), []);
  const { items: employees } = useSupabaseCollection('employees', employeesQuery);
  const { items: attendance } = useSupabaseCollection('attendance', attendanceQuery);
  const [processing, setProcessing] = useState(false);

  if (!isAdminLike(user?.role)) {
    return <Card className="p-6 text-center">Payroll processing is restricted to Admin and HR users.</Card>;
  }

  async function processPayroll() {
    setProcessing(true);
    try {
      await Promise.all(employees.map(async (employee) => {
        if (!employee.uid) return; // Skip if they haven't registered

        const totals = calcNet(employee, attendance, month, year);
        const payrollId = `${employee.uid}_${year}_${month}`;

        await upsertDocument('payroll', payrollId, {
          employee_id: employee.uid,
          month,
          year,
          status,
          data: {
            employeeId: employee.uid,
            basicSalary: Number(employee.basicSalary || 0),
            netSalary: totals.netSalary,
            hra: totals.hra,
            allowances: totals.allowances,
            deductions: totals.deductions,
            tax: totals.tax,
            workingDays: totals.workingDays,
            presentDays: totals.presentDays,
            processedBy: user.uid,
            processedAt: new Date().toISOString(),
          },
        });

        if (status === 'paid') {
          await upsertDocument('payslips', payrollId, {
            payrollId,
            employeeId: employee.uid,
            month,
            year,
            fileURL: '',
            generatedAt: new Date().toISOString(),
          });

          await upsertDocument('notifications', `${payrollId}_payslip`, {
            userId: employee.uid,
            type: 'payslip_ready',
            title: 'Payslip Ready',
            message: `Your payslip for ${month}/${year} is available.`,
            isRead: false,
            relatedId: payrollId,
          });
        }
      }));
      toast.success('Payroll processed for selected month');
    } catch (error) {
      toast.error(error?.message || 'Unable to process payroll');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="section-title">Process Payroll</div>
        <p className="muted-text">Auto-calculate payroll from salary and attendance data.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="Month" type="number" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value.padStart(2, '0'))} />
        <Input label="Year" type="number" value={year} onChange={(event) => setYear(event.target.value)} />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="draft">Draft</option>
          <option value="processed">Processed</option>
          <option value="paid">Paid</option>
        </Select>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={processPayroll} disabled={processing}>{processing ? 'Processing...' : 'Run Payroll'}</Button>
      </div>
      <div className="mt-6">
        <Table
          columns={[{ key: 'name', label: 'Employee' }, { key: 'basicSalary', label: 'Basic Salary' }, { key: 'month', label: 'Month' }]}
          data={employees.slice(0, 10)}
          renderRow={(employee) => (
            <tr key={employee.id}>
              <td className="px-4 py-3">{employee.firstName} {employee.lastName}</td>
              <td className="px-4 py-3">₹{Number(employee.basicSalary || 0).toLocaleString()}</td>
              <td className="px-4 py-3">{month}/{year}</td>
            </tr>
          )}
        />
      </div>
    </Card>
  );
}
