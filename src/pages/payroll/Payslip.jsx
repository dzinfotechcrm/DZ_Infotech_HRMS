import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { query, where } from '../../supabase/db';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { exportPayslipPdf } from '../../utils/pdfExport';

export default function Payslip() {
  const { id } = useParams();
  const payrollQuery = useMemo(() => (base) => query(base, where('employeeId', '==', id)), [id]);
  const employeeQuery = useMemo(() => (base) => query(base, where('uid', '==', id)), [id]);
  const { items: payroll } = useSupabaseCollection('payroll', payrollQuery);
  const { items: employees } = useSupabaseCollection('employees', employeeQuery);

  if (!payroll.length || !employees.length) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  const currentPayroll = payroll[0];
  const employee = employees[0];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="section-title">Payslip</div>
          <p className="muted-text">Downloadable payroll breakdown for the selected employee.</p>
        </div>
        <Button onClick={() => exportPayslipPdf({ employee, payroll: currentPayroll })}>Download PDF</Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="text-xs uppercase text-neutral-500">Employee</div><div className="mt-2 font-semibold text-neutral-900">{employee.firstName} {employee.lastName}</div></div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="text-xs uppercase text-neutral-500">Period</div><div className="mt-2 font-semibold text-neutral-900">{currentPayroll.month} / {currentPayroll.year}</div></div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="text-xs uppercase text-neutral-500">Basic</div><div className="mt-2 font-semibold text-neutral-900">₹{Number(currentPayroll.basicSalary || 0).toLocaleString()}</div></div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="text-xs uppercase text-neutral-500">Net Salary</div><div className="mt-2 font-semibold text-primary-700">₹{Number(currentPayroll.netSalary || 0).toLocaleString()}</div></div>
      </div>
    </Card>
  );
}
