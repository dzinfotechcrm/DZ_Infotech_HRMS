import { useMemo, useState } from 'react';
import { query, orderBy, where } from '../../supabase/db';
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PlayIcon,
  UsersIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { isAdminLike } from '../../utils/rbac';
import { formatDateTime, safeDate } from '../../utils/dateHelpers';
import { upsertDocument, updateDocument } from '../../supabase/db';
import { exportPayslipPdf } from '../../utils/pdfExport';
import toast from 'react-hot-toast';
import { isWeekend, isSameMonth, isSameDay, startOfDay, isBefore, isAfter, eachDayOfInterval, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const _now = new Date();
const CUR_MONTH = String(_now.getMonth() + 1).padStart(2, '0');
const CUR_YEAR = String(_now.getFullYear());
const YEARS = Array.from({ length: 5 }, (_, i) => String(_now.getFullYear() - i));

const STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
};

// ─── Payroll Calculation ──────────────────────────────────────────────────────

function calcPayroll(employee, attendance, leaveRequests, leaveTypes, holidays, month, year) {
  const base = Number(employee.basicSalary || 0);
  // An employee can be identified by auth UID or by their employee table PK.
  // We collect all possible IDs so we can match against leave requests no matter
  // which ID was stored (the schema evolved over time).
  const empUid = employee.uid;   // auth UID
  const empDbId = employee.id;   // employee table PK

  function matchesEmployee(leave) {
    // leave.employeeId is set by mapRow from the employee_id DB column (table PK)
    // leave.data?.employeeId holds the auth UID stored for backward compat
    return (
      leave.employeeId === empUid ||
      leave.employeeId === empDbId ||
      leave.employee_id === empUid ||
      leave.employee_id === empDbId ||
      (leave.data?.employeeId && leave.data.employeeId === empUid)
    );
  }

  // 1. Working Days Calculation
  const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const totalDays = daysInMonth.length;
  const weekendCount = daysInMonth.filter(d => isWeekend(d)).length;

  const monthHolidays = holidays.filter(h => {
    const hDate = safeDate(h.date);
    return hDate && isSameMonth(hDate, monthStart) && !isWeekend(hDate);
  });
  const holidayCount = monthHolidays.length;

  const workingDays = totalDays - weekendCount - holidayCount;

  // 2. Present & Half Days from Attendance
  const monthAtt = attendance.filter(
    (a) => (a.employeeId === empUid || a.employeeId === empDbId) &&
      a.date?.startsWith(`${year}-${month}`)
  );

  const exactPresentDays = monthAtt.filter((a) => a.status?.toLowerCase() === 'present').length;
  const halfDayCount = monthAtt.filter((a) => a.status?.toLowerCase() === 'half day' || a.status?.toLowerCase() === 'half-day').length;

  // 3. Approved Leave Days that count as PRESENT (no salary deduction)
  //    Rule: Paid Leave, Casual Leave, Medical/Sick Leave → counted as present.
  //          Unpaid Leave → counted as absent (salary deducted).
  //    Detection is by leave type name (reliable) with isPaid flag as fallback.
  function isNonUnpaidLeave(leave) {
    // Read name from wherever it was stored
    const name = (
      leave.leaveTypeName ||
      leave.data?.leaveTypeName ||
      leave.leaveType ||
      ''
    ).toLowerCase();

    if (name.includes('unpaid')) return false;

    if (
      name.includes('paid') ||
      name.includes('casual') ||
      name.includes('sick') ||
      name.includes('medical')
    ) return true;

    // Fallback: look up the leave type record's isPaid flag
    const leaveTypeRecord = leaveTypes.find(
      (t) => t.id === (leave.leaveTypeId || leave.data?.leaveTypeId)
    );
    return leaveTypeRecord?.isPaid === true;
  }

  const creditableLeaves = leaveRequests.filter(
    (l) => matchesEmployee(l) && l.status === 'approved' && isNonUnpaidLeave(l)
  );

  let paidLeaveDays = 0;
  creditableLeaves.forEach((leave) => {
    // Dates may be at top level (after mapRow spreads data) or inside data JSONB
    const fromStr = leave.fromDate || leave.data?.fromDate;
    const toStr = leave.toDate || leave.data?.toDate;
    const lStart = safeDate(fromStr);
    const lEnd = safeDate(toStr);
    if (!lStart || !lEnd) return;

    daysInMonth.forEach((d) => {
      if (!isBefore(d, startOfDay(lStart)) && !isAfter(d, startOfDay(lEnd))) {
        const isWknd = isWeekend(d);
        const isHol = monthHolidays.some((h) => isSameDay(safeDate(h.date), d));
        if (!isWknd && !isHol) {
          paidLeaveDays++;
        }
      }
    });
  });

  // 4. Absent Days & Deductions
  //    Only days that are neither attendance-present nor covered by approved
  //    non-unpaid leave are counted as absent.
  const absentDays = Math.max(0, workingDays - exactPresentDays - paidLeaveDays - halfDayCount);

  const isIntern = employee.role?.toLowerCase() === 'intern';

  const perDaySalary = workingDays > 0 ? base / workingDays : 0;
  const absentDed = isIntern ? 0 : ((absentDays * perDaySalary) + (halfDayCount * 0.5 * perDaySalary));

  const hra = isIntern ? 0 : base * 0.4;
  const da = isIntern ? 0 : base * 0.15;
  const travelAllowance = isIntern ? 0 : Number(employee.travelAllowance || 0);
  const allowances = { travel: travelAllowance, food: 0, other: 0 };
  const totalAllowances = Object.values(allowances).reduce((s, v) => s + v, 0);

  const deductions = { pf: isIntern ? 0 : (employee.pfApplicable ? base * 0.12 : 0), esic: 0, absent: absentDed };
  const totalDeductions = Object.values(deductions).reduce((s, v) => s + v, 0);
  const tax = isIntern ? 0 : Math.max(0, (base + hra + da + totalAllowances - totalDeductions) * 0.1);

  let netSalary = isIntern ? base : (base + hra + da + totalAllowances - totalDeductions - tax);
  let requiresReview = false;

  if (netSalary < 0) {
    netSalary = 0;
    requiresReview = true;
  }

  return {
    hra, da, allowances, deductions, tax, netSalary,
    workingDays,
    // presentDays includes attendance + leave days for display in payslip
    presentDays: exactPresentDays + halfDayCount * 0.5 + paidLeaveDays,
    exactPresentDays,
    absentDays,
    paidLeaveDays,
    halfDayCount,
    requiresReview,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

function resolveObj(val) {
  if (typeof val === 'object' && val !== null) {
    return Object.values(val).reduce((s, v) => s + Number(v || 0), 0);
  }
  return Number(val || 0);
}

function exportCSV(rows) {
  const data = rows.map((r) => {
    const emp = r._emp || {};
    return {
      'Employee': `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      'Emp ID': emp.employeeId || '—',
      'Department': emp.department || '—',
      'Basic Salary': r.basicSalary || 0,
      'Allowances': resolveObj(r.allowances),
      'Deductions': resolveObj(r.deductions),
      'Net Salary': r.netSalary || 0,
      'Month': MONTHS.find((m) => m.value === r.month)?.label || r.month,
      'Year': r.year,
      'Status': r.status || 'pending',
      'Processed At': r.processedAt ? formatDateTime(r.processedAt) : '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

  // Auto-adjust column widths
  const max_width = data.reduce((w, r) => {
    Object.keys(r).forEach(key => {
      w[key] = Math.max(w[key] || key.length, String(r[key] || '').length);
    });
    return w;
  }, {});

  worksheet['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: max_width[key] + 2 }));

  XLSX.writeFile(workbook, `payroll-export-${Date.now()}.xlsx`);
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, sub, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-2 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-white/80" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</span>
        </div>
        <div className="mt-3 text-3xl font-extrabold tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs font-medium text-white/60">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Payslip Modal ────────────────────────────────────────────────────────────

function PayslipModal({ open, onClose, row }) {
  if (!row || !row._emp) return null;
  const { _emp: employee, ...payroll } = row;

  const isIntern = employee.role?.toLowerCase() === 'intern';
  const basic = Number(payroll.basicSalary || 0);
  const hra = isIntern ? 0 : Number(payroll.hra || basic * 0.4);
  const da = isIntern ? 0 : Number(payroll.da || basic * 0.15);
  const allowances = isIntern ? 0 : (resolveObj(payroll.allowances) || 0);
  const pf = isIntern ? 0 : (employee.pfApplicable ? basic * 0.12 : 0);
  const tds = isIntern ? 0 : Number(payroll.tax || 0);
  const absentDed = isIntern ? 0 : (payroll.deductions?.absent || 0);
  const totalEarnings = isIntern ? basic : (basic + hra + da + allowances);
  const totalDeductions = pf + tds + absentDed;
  const netSalary = Number(payroll.netSalary || (totalEarnings - totalDeductions));
  const monthLabel = MONTHS.find((m) => m.value === payroll.month)?.label || payroll.month;

  return (
    <Modal
      open={open}
      title={`Payslip — ${employee.firstName} ${employee.lastName}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => { exportPayslipPdf({ employee, payroll }); toast.success('PDF downloaded'); }}>
            <DocumentArrowDownIcon className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      }
    >
      <div className={`mb-5 grid grid-cols-2 gap-3 ${isIntern ? '' : 'sm:grid-cols-4'}`}>
        {[
          { label: 'Employee', value: `${employee.firstName} ${employee.lastName}` },
          ...(isIntern ? [] : [
            { label: 'Emp ID', value: employee.employeeId || '—' },
            { label: 'Department', value: employee.department || '—' },
          ]),
          { label: 'Period', value: `${monthLabel} ${payroll.year}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
            <div className="mt-1 text-sm font-semibold text-neutral-900">{value}</div>
          </div>
        ))}
      </div>

      {isIntern ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">Earnings</div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Stipend Amount</span>
              <span className="font-semibold text-neutral-900">{fmt(basic)}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-2.5 font-bold text-emerald-700">
              <span>Total Earnings</span><span>{fmt(basic)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">Earnings</div>
            <div className="space-y-2.5 text-sm">
              {[['Basic Salary', basic], ['HRA (40%)', hra], ['DA (15%)', da], ['Travel Allowance', allowances]].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between">
                  <span className="text-neutral-500">{lbl}</span>
                  <span className="font-semibold text-neutral-900">{fmt(val)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-emerald-200 pt-2.5 font-bold text-emerald-700">
                <span>Total Earnings</span><span>{fmt(totalEarnings)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-rose-700">Deductions</div>
            <div className="space-y-2.5 text-sm">
              {[['PF (12%)', pf], ['TDS', tds], ['Absent Deduction', absentDed]].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between">
                  <span className="text-neutral-500">{lbl}</span>
                  <span className="font-semibold text-neutral-900">{fmt(val)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-rose-200 pt-2.5 font-bold text-rose-700">
                <span>Total Deductions</span><span>{fmt(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
        <span className="text-base font-bold text-white">Net Salary</span>
        <span className="text-2xl font-extrabold text-sky-300">{fmt(netSalary)}</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 text-center text-sm">
        {[
          ['Working Days', payroll.workingDays || 22],
          ['Present Days', payroll.exactPresentDays ?? payroll.presentDays ?? '—'],
          ['Absent Days', payroll.absentDays ?? Math.max(0, (payroll.workingDays || 22) - (payroll.presentDays || 0))],
          ['Paid Leave Days', payroll.paidLeaveDays ?? 0],
        ].map(([lbl, val]) => (
          <div key={lbl} className="rounded-xl border border-neutral-200 bg-neutral-50 py-3 px-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{lbl}</div>
            <div className="mt-1 text-lg font-bold text-neutral-900">{val}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-1 flex-col gap-1 min-w-[140px]">
      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full shadow-sm"
      >
        {children}
      </Select>
    </div>
  );
}

// ─── Employee Payroll View ───────────────────────────────────────────────────

function EmployeePayrollView({ user, payroll, activeEmployees, onOpenPayslip }) {
  const [filterMonth, setFilterMonth] = useState(CUR_MONTH);
  const [filterYear, setFilterYear] = useState(CUR_YEAR);

  const emp = useMemo(() => activeEmployees.find((e) => e.uid === user?.uid || (user?.email && e.email === user?.email) || e.id === user?.uid) || {}, [activeEmployees, user]);

  const joinDateObj = useMemo(() => {
    return emp.joinDate ? new Date(emp.joinDate) : emp.createdAt ? new Date(emp.createdAt) : new Date();
  }, [emp]);
  
  const joinYear = joinDateObj.getFullYear();
  const joinMonth = joinDateObj.getMonth() + 1;

  const isIntern = emp?.role?.toLowerCase() === 'intern';

  const userPayrolls = useMemo(() => {
    return payroll
      .filter((p) => p.employeeId === emp.uid || p.employeeId === emp.id)
      .sort((a, b) => {
        if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
        return parseInt(b.month) - parseInt(a.month);
      });
  }, [payroll, emp]);

  const selectedPayroll = useMemo(() => {
    return userPayrolls.find((p) => p.month === filterMonth && String(p.year) === filterYear);
  }, [userPayrolls, filterMonth, filterYear]);

  const historyPayrolls = userPayrolls.slice(0, 6);

  const handleExportCSV = () => {
    exportCSV(userPayrolls.map((p) => ({ ...p, _emp: emp })));
  };

  const getPFDeduction = (pr) => (pr._emp && pr._emp.pfApplicable) ? Number(pr.basicSalary || 0) * 0.12 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll Management"
        title="My Payroll"
        description="Review your monthly salary breakdown and download payslips."
        actions={
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-36 shadow-sm"
              >
                {MONTHS.filter(m => parseInt(filterYear) !== joinYear || parseInt(m.value) >= joinMonth).map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-28 shadow-sm"
              >
                {YEARS.filter(y => parseInt(y) >= joinYear).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" onClick={handleExportCSV} className="gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {selectedPayroll ? (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 ${isIntern ? '' : 'xl:grid-cols-4'}`}>
            <SummaryCard
              icon={BanknotesIcon}
              label="Net Salary"
              value={fmt(selectedPayroll.netSalary)}
              sub="credited amount"
              gradient="bg-gradient-to-br from-sky-500 to-blue-700"
            />
            <SummaryCard
              icon={BanknotesIcon}
              label={isIntern ? "Stipend Amount" : "Basic Salary"}
              value={fmt(selectedPayroll.basicSalary)}
              sub="base pay"
              gradient="bg-gradient-to-br from-slate-700 to-slate-900"
            />
            {!isIntern && (
              <>
                <SummaryCard
                  icon={BanknotesIcon}
                  label="Total Allowances"
                  value={fmt(resolveObj(selectedPayroll.allowances) + Number(selectedPayroll.hra || 0) + Number(selectedPayroll.da || 0))}
                  sub="added to base"
                  gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
                />
                <SummaryCard
                  icon={BanknotesIcon}
                  label="Total Deductions"
                  value={fmt(resolveObj(selectedPayroll.deductions) + Number(selectedPayroll.tax || 0) + getPFDeduction(selectedPayroll))}
                  sub="deducted from gross"
                  gradient="bg-gradient-to-br from-rose-500 to-rose-700"
                />
              </>
            )}
          </div>

          {isIntern ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-700">Earnings</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Stipend Amount</span>
                  <span className="font-semibold text-neutral-900">{fmt(selectedPayroll.basicSalary)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-3 font-bold text-emerald-700">
                  <span>Total Earnings</span><span>{fmt(selectedPayroll.basicSalary)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-700">Earnings Breakdown</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Basic Salary</span>
                    <span className="font-semibold text-neutral-900">{fmt(selectedPayroll.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">HRA</span>
                    <span className="font-semibold text-neutral-900">{fmt(selectedPayroll.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">DA</span>
                    <span className="font-semibold text-neutral-900">{fmt(selectedPayroll.da)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Travel Allowance</span>
                    <span className="font-semibold text-neutral-900">{fmt(resolveObj(selectedPayroll.allowances))}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-rose-700">Deductions Breakdown</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">PF Deduction</span>
                    <span className="font-semibold text-neutral-900">{fmt(getPFDeduction(selectedPayroll))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tax Deduction</span>
                    <span className="font-semibold text-neutral-900">{fmt(selectedPayroll.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Absent Deduction</span>
                    <span className="font-semibold text-neutral-900">{fmt(resolveObj(selectedPayroll.deductions))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6">
            <span className="text-lg font-bold text-white">Final Net Salary</span>
            <span className="text-3xl font-extrabold text-sky-300">{fmt(selectedPayroll.netSalary)}</span>
          </div>
        </>
      ) : (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <BanknotesIcon className="h-16 w-16 text-neutral-200 mb-4" />
          <h3 className="text-lg font-bold text-neutral-800">No Payroll Processed</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-sm mx-auto">
            No payroll records were found for {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}. Contact HR for details.
          </p>
        </Card>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Salary History</h3>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">Month / Year</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">Basic Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">Net Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {historyPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                      No payroll history available.
                    </td>
                  </tr>
                ) : (
                  historyPayrolls.map((row) => {
                    const monthLabel = MONTHS.find((m) => m.value === row.month)?.label || row.month;
                    const statusInfo = STATUS[row.status] || { label: row.status, tone: 'neutral' };
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                        <td className="px-6 py-4 font-semibold text-neutral-900">{monthLabel} {row.year}</td>
                        <td className="px-6 py-4 font-medium text-neutral-600">{fmt(row.basicSalary)}</td>
                        <td className="px-6 py-4 font-bold text-neutral-900">{fmt(row.netSalary)}</td>
                        <td className="px-6 py-4">
                          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1.5 text-xs bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200 shadow-none flex items-center gap-1.5"
                            onClick={() => onOpenPayslip({ ...row, _emp: emp })}
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1.5 text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 border-none shadow-none flex items-center gap-1.5"
                            onClick={() => { exportPayslipPdf({ employee: emp, payroll: row }); toast.success('Payslip downloaded'); }}
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PayrollList() {
  const { user } = useAuth();
  const adminView = isAdminLike(user?.role);

  // Default to current month + year so all employees appear immediately
  const [filterMonth, setFilterMonth] = useState(CUR_MONTH);
  const [filterYear, setFilterYear] = useState(CUR_YEAR);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');   // department filter
  const [filterType, setFilterType] = useState('');   // 'manager' | 'employee'
  const [empTypeTab, setEmpTypeTab] = useState('employees');

  const [payslipRow, setPayslipRow] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null); // per-row processing
  const [warningContext, setWarningContext] = useState(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const payrollQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const activeEmpQuery = useMemo(() => (base) => query(base, where('status', '==', 'active')), []);
  const attendanceQuery = useMemo(() => (base) => query(base), []);

  const { items: payroll } = useSupabaseCollection('payroll', payrollQuery);
  const { items: employees } = useSupabaseCollection('employees', activeEmpQuery);
  const { items: interns } = useSupabaseCollection('interns');
  const activeEmployees = useMemo(() => {
    const activeInterns = interns
      .filter(i => String(i.status).toLowerCase() === 'active' && i.is_paid)
      .map(i => ({
        ...i,
        firstName: i.first_name || i.firstName,
        lastName: i.last_name || i.lastName,
        role: 'intern',
        departmentId: i.department_id || i.departmentId,
        basicSalary: i.stipend_amount || i.basicSalary || 0,
      }));
    return [...employees, ...activeInterns];
  }, [employees, interns]);
  const { items: attendance } = useSupabaseCollection('attendance', attendanceQuery);
  const { items: departments } = useSupabaseCollection('departments');
  const { items: leaveRequests } = useSupabaseCollection('leaveRequests');
  const { items: leaveTypes } = useSupabaseCollection('leaveTypes');
  const { items: holidays } = useSupabaseCollection('holidays');

  // Resolve departmentId → department name (mirrors EmployeeList enrichment logic)
  function deptName(emp) {
    if (!emp) return '—';
    // Primary: look up by departmentId
    let dept = departments.find((d) => d.id === emp.departmentId);
    // Fallback for managers: they ARE the department's managerId, not a member
    if (!dept && (emp.designation?.toLowerCase() === 'manager' || emp.role?.toLowerCase() === 'manager')) {
      dept = departments.find((d) => d.managerId === emp.id || d.managerId === emp.uid);
    }
    return dept?.name || emp.department || '—';
  }

  // ── Employee-centric rows ────────────────────────────────────────────────────
  // Always start from ALL active employees, then merge payroll records.
  // Each row is one employee for the selected period.

  const rows = useMemo(() => {
    const sourceEmps = (adminView
      ? activeEmployees
      : activeEmployees.filter((e) => e.uid === user?.uid || e.id === user?.uid)
    ).filter((e) => {
      if (String(e.role).toLowerCase() === 'admin' || String(e.role).toLowerCase() === 'agent') return false; // admins and agents are excluded from payroll

      // Filter out employees who joined AFTER the selected month/year
      const joinStr = e.joinDate || e.createdAt;
      if (joinStr && filterMonth && filterYear) {
        const join = new Date(joinStr);
        const filterDate = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, 1);
        const endOfFilterMonth = endOfMonth(filterDate);
        if (join > endOfFilterMonth) return false;
      }
      return true;
    });

    return sourceEmps.map((emp) => {
      const empId = emp.uid || emp.id;
      const enrichedEmp = { ...emp, department: deptName(emp) };

      // Find existing payroll record for this employee × month × year
      const pr = payroll.find((p) => {
        const matchEmp = p.employeeId === emp.uid || p.employeeId === emp.id;
        const matchMonth = filterMonth ? p.month === filterMonth : true;
        const matchYear = filterYear ? String(p.year) === filterYear : true;
        return matchEmp && matchMonth && matchYear;
      });

      if (pr) {
        return { ...pr, _emp: enrichedEmp, _hasPayroll: true };
      }

      // No payroll yet → synthesize a Pending row from employee profile
      return {
        id: `${empId}_${filterYear}_${filterMonth}_pending`,
        employeeId: empId,
        month: filterMonth || CUR_MONTH,
        year: filterYear || CUR_YEAR,
        basicSalary: Number(emp.basicSalary || 0),
        allowances: 0,
        deductions: 0,
        netSalary: Number(emp.basicSalary || 0), // pre-deduction estimate
        status: 'pending',
        processedAt: null,
        _emp: enrichedEmp,
        _hasPayroll: false,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmployees, payroll, filterMonth, filterYear, departments, adminView, user]);

  // Apply status / department / type filters on top of rows
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const emp = r._emp || {};
      const isIntern = emp.role?.toLowerCase() === 'intern';
      if (empTypeTab === 'interns' && !isIntern) return false;
      if (empTypeTab === 'employees' && isIntern) return false;

      if (filterStatus && r.status !== filterStatus) return false;
      if (filterDept && emp.department !== filterDept) return false;
      if (filterType && empTypeTab === 'employees') {
        const isManager = emp.designation?.toLowerCase() === 'manager' || emp.role?.toLowerCase() === 'manager';
        if (filterType === 'manager' && !isManager) return false;
        if (filterType === 'employee' && isManager) return false;
      }
      return true;
    });
  }, [rows, filterStatus, filterDept, filterType, empTypeTab]);

  // ── Summary stats (reflect ALL active non-admin employees) ──────────────────
  const totalEmployees = activeEmployees.filter((e) => {
    if (String(e.role).toLowerCase() === 'admin' || String(e.role).toLowerCase() === 'agent') return false;
    const isIntern = String(e.role).toLowerCase() === 'intern';
    if (empTypeTab === 'interns' && !isIntern) return false;
    if (empTypeTab === 'employees' && isIntern) return false;
    return true;
  }).length;
  const totalCost = filtered.filter((r) => r._hasPayroll).reduce((s, r) => s + Number(r.netSalary || 0), 0);
  const paidCount = filtered.filter((r) => r.status === 'paid').length;
  const pendingCount = filtered.filter((r) => r.status === 'pending' || r.status === 'draft').length;

  // ── Bulk select ──────────────────────────────────────────────────────────────
  const selectableRows = useMemo(() => filtered.filter((r) => r.status !== 'paid'), [filtered]);
  const allSelected = selectableRows.length > 0 && selectedIds.length === selectableRows.length;
  function toggleAll() { setSelectedIds(allSelected ? [] : selectableRows.map((r) => r.id)); }
  function toggleOne(id) { setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }

  // ── Process payroll for a single pending employee ────────────────────────────
  async function processOne(row, force = false) {
    const emp = row._emp;
    const totals = calcPayroll(emp, attendance, leaveRequests, leaveTypes, holidays, row.month, row.year);

    if (totals.exactPresentDays === 0 && !force) {
      setWarningContext({ type: 'single', row });
      return;
    }

    setProcessingId(row.id);
    try {
      // upsertDocument passes payload directly to Supabase — no camelCase mapping.
      // Confirmed payroll table columns: id, employee_id, month, year, status, data, created_at, updated_at.
      // processed_at does NOT exist as a column — store it in data JSONB.
      // mapRow() in useSupabase spreads data back onto the row so the UI reads normally.
      const empDbId = row.employeeId;
      const pid = `${empDbId}_${row.year}_${row.month}`;
      await upsertDocument('payroll', pid, {
        employee_id: empDbId,
        month: row.month,
        year: row.year,
        status: 'draft',
        data: {
          employeeId: empDbId,
          basicSalary: Number(emp.basicSalary || 0),
          netSalary: totals.netSalary,
          hra: totals.hra,
          da: totals.da,
          allowances: totals.allowances,
          deductions: totals.deductions,
          tax: totals.tax,
          workingDays: totals.workingDays,
          presentDays: totals.presentDays,
          exactPresentDays: totals.exactPresentDays,
          absentDays: totals.absentDays,
          paidLeaveDays: totals.paidLeaveDays,
          halfDayCount: totals.halfDayCount,
          requiresReview: totals.requiresReview,
          processedBy: user.uid,
          processedAt: new Date().toISOString(),
        },
      });
      toast.success(`Payroll processed for ${emp.firstName} ${emp.lastName}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to process payroll');
    } finally {
      setProcessingId(null);
    }
  }

  // ── Run payroll for ALL pending employees ────────────────────────────────────
  async function runAllPending(force = false) {
    const pending = filtered.filter((r) => !r._hasPayroll);
    if (!pending.length) return toast.success('All employees already have payroll for this period');

    if (!force) {
      const anyZero = pending.some(row => calcPayroll(row._emp, attendance, leaveRequests, leaveTypes, holidays, row.month, row.year).exactPresentDays === 0);
      if (anyZero) {
        setWarningContext({ type: 'all' });
        return;
      }
    }

    try {
      await Promise.all(pending.map((r) => processOne(r, true)));
      toast.success(`Payroll generated for ${pending.length} employee(s)`);
    } catch {
      toast.error('Some payroll records failed');
    }
  }

  // ── Bulk Reprocess ───────────────────────────────────────────────────────────
  async function bulkReprocess() {
    const targets = filtered.filter((r) => selectedIds.includes(r.id) && r.status === 'draft');
    if (!targets.length) return toast.error('Select at least one draft record to reprocess');
    setBulkLoading(true);
    try {
      await Promise.all(targets.map((r) => processOne(r, true)));
      toast.success(`${targets.length} record(s) reprocessed`);
      setSelectedIds([]);
    } catch {
      toast.error('Failed to reprocess some records');
    } finally {
      setBulkLoading(false);
    }
  }

  // ── Bulk status update ───────────────────────────────────────────────────────
  async function bulkUpdateStatus(newStatus) {
    const targets = filtered.filter((r) => selectedIds.includes(r.id) && r._hasPayroll);
    if (!targets.length) return toast.error('Select at least one processed record');
    setBulkLoading(true);
    try {
      await Promise.all(targets.map((r) => updateDocument('payroll', r.id, {
        status: newStatus,
        ...(newStatus === 'paid' ? { data: { ...(r.data || {}), paymentDate: new Date().toISOString() } } : {}),
      })));
      toast.success(`${targets.length} record(s) marked as ${STATUS[newStatus]?.label}`);
      setSelectedIds([]);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setBulkLoading(false);
    }
  }

  const hasFilters = filterMonth !== CUR_MONTH || filterYear !== CUR_YEAR || filterStatus || filterDept || filterType;

  if (!adminView) {
    return (
      <>
        <EmployeePayrollView user={user} payroll={payroll} activeEmployees={activeEmployees} onOpenPayslip={setPayslipRow} />
        <PayslipModal
          open={!!payslipRow}
          onClose={() => setPayslipRow(null)}
          row={payslipRow}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Payroll Management"
        title="Payroll processing & salary history"
        description="All active employees are shown below. Process payroll, review payslips and approve payments."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => exportCSV(filtered)}
              className="gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </Button>
            {adminView && (
              <Button onClick={runAllPending} className="gap-2">
                <PlayIcon className="h-4 w-4" />
                Run Payroll
              </Button>
            )}
          </>
        }
      />

      {adminView && (
        <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/60 shadow-sm">
          <button
            onClick={() => setEmpTypeTab('employees')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              empTypeTab === 'employees' 
                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Employee / Manager
          </button>
          <button
            onClick={() => setEmpTypeTab('interns')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              empTypeTab === 'interns' 
                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Interns
          </button>
        </div>
      )}

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={UsersIcon}
          label={empTypeTab === 'interns' ? 'Total Interns' : 'Total Employees'}
          value={totalEmployees}
          sub={empTypeTab === 'interns' ? 'all active interns' : 'all active staff'}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
        />
        <SummaryCard
          icon={BanknotesIcon}
          label="Total Payroll"
          value={fmt(totalCost)}
          sub="processed net salary"
          gradient="bg-gradient-to-br from-slate-800 to-slate-900"
        />
        <SummaryCard
          icon={CheckCircleIcon}
          label="Paid"
          value={paidCount}
          sub="released records"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <SummaryCard
          icon={ClockIcon}
          label="Pending / Draft"
          value={pendingCount}
          sub="awaiting processing"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect label="Month" value={filterMonth} onChange={setFilterMonth}>
            <option value="">All Months</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </FilterSelect>

          <FilterSelect label="Year" value={filterYear} onChange={setFilterYear}>
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </FilterSelect>

          <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </FilterSelect>

          {empTypeTab === 'employees' && (
            <FilterSelect label="Department" value={filterDept} onChange={setFilterDept}>
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </FilterSelect>
          )}

          {empTypeTab === 'employees' && (
            <FilterSelect label="Type" value={filterType} onChange={setFilterType}>
              <option value="">All Types</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </FilterSelect>
          )}

          {hasFilters && (
            <button
              onClick={() => { setFilterMonth(CUR_MONTH); setFilterYear(CUR_YEAR); setFilterStatus(''); setFilterDept(''); setFilterType(''); }}
              className="flex items-center gap-1 self-end rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 transition"
            >
              <XMarkIcon className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>
      </Card>

      {/* ── Payroll Table ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                {adminView && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
                    />
                  </th>
                )}
                {[
                  'Employee', 'Department', 'Basic Salary',
                  'Allowances', 'Deductions', 'Net Salary',
                  'Month / Year', 'Status', 'Processed At', 'Actions',
                ]
                  .filter((col) => {
                    if (empTypeTab === 'interns' && (col === 'Department' || col === 'Allowances' || col === 'Deductions')) return false;
                    return true;
                  })
                  .map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={adminView ? (empTypeTab === 'interns' ? 8 : 11) : (empTypeTab === 'interns' ? 7 : 10)} className="px-4 py-10 text-center text-neutral-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const emp = row._emp || {};
                  const isSelected = selectedIds.includes(row.id);
                  const monthLabel = MONTHS.find((m) => m.value === row.month)?.label || row.month;
                  const allowAmt = resolveObj(row.allowances);
                  const dedAmt = resolveObj(row.deductions);
                  const statusInfo = STATUS[row.status] || { label: row.status, tone: 'neutral' };
                  const isPending = !row._hasPayroll;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-neutral-50 ${isSelected ? 'bg-primary-50/60' : ''} ${isPending ? 'opacity-75' : ''}`}
                    >
                      {adminView && (
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(row.id)}
                            disabled={row.status === 'paid'}
                            className="h-4 w-4 rounded border-neutral-300 accent-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      )}
                      {/* Employee */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900">{emp.firstName} {emp.lastName}</div>
                        {emp.employeeId && <div className="text-xs text-neutral-400">{emp.employeeId}</div>}
                      </td>
                      {empTypeTab !== 'interns' && <td className="px-4 py-3 text-neutral-500">{emp.department || '—'}</td>}
                      <td className="px-4 py-3 font-medium">{fmt(row.basicSalary)}</td>
                      {/* Allowances / Deductions / Net — show placeholder dashes if pending */}
                      {empTypeTab !== 'interns' && <td className="px-4 py-3 text-emerald-700 font-medium">
                        {isPending ? <span className="text-neutral-300">—</span> : fmt(allowAmt)}
                      </td>}
                      {empTypeTab !== 'interns' && <td className="px-4 py-3 text-rose-600 font-medium">
                        {isPending ? <span className="text-neutral-300">—</span> : fmt(dedAmt)}
                      </td>}
                      <td className="px-4 py-3 font-bold text-neutral-900">
                        {isPending ? <span className="text-xs text-neutral-400 font-normal">Not processed</span> : (
                          <div className="flex items-center gap-2">
                            {fmt(row.netSalary)}
                            {row.requiresReview && <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" title="Negative Salary Adjusted to Zero" />}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{monthLabel} {row.year}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {row.processedAt ? formatDateTime(row.processedAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isPending ? (
                            /* Pending row — show Process button */
                            adminView && (
                              <button
                                onClick={() => processOne(row)}
                                disabled={processingId === row.id}
                                className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition disabled:opacity-50"
                              >
                                <PlayIcon className="h-3.5 w-3.5" />
                                {processingId === row.id ? 'Processing…' : 'Process'}
                              </button>
                            )
                          ) : (
                            /* Processed row — show Payslip + PDF */
                            <>
                              {adminView && row.status !== 'paid' && (
                                <button
                                  onClick={() => processOne(row)}
                                  disabled={processingId === row.id}
                                  className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition disabled:opacity-50"
                                >
                                  <PlayIcon className="h-3.5 w-3.5" />
                                  {processingId === row.id ? '...' : 'Reprocess'}
                                </button>
                              )}
                              <button
                                onClick={() => setPayslipRow(row)}
                                className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                Payslip
                              </button>
                              <button
                                onClick={() => { exportPayslipPdf({ employee: emp, payroll: row }); toast.success('PDF downloaded'); }}
                                className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition"
                              >
                                <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                                PDF
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Bulk Actions Footer ───────────────────────────────────────────── */}
        {adminView && (
          <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
              />
              Select All
            </label>
            {selectedIds.length > 0 && (() => {
              const selectedRecords = filtered.filter(r => selectedIds.includes(r.id));
              const showApprove = selectedRecords.some(r => r.status === 'draft' || r.status === 'pending');
              const showReprocess = selectedRecords.some(r => r.status === 'draft');
              return (
                <>
                  <span className="text-xs text-neutral-400">({selectedIds.length} selected)</span>
                  <div className="ml-auto flex gap-2">
                    {showReprocess && (
                      <button
                        onClick={bulkReprocess}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition disabled:opacity-50"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Reprocess Selected
                      </button>
                    )}
                    {showApprove && (
                      <button
                        onClick={() => bulkUpdateStatus('approved')}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve Selected
                      </button>
                    )}
                    <button
                      onClick={() => bulkUpdateStatus('paid')}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="rounded-xl border border-neutral-200 px-2 py-2 text-neutral-400 hover:bg-neutral-100 transition"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Payslip Modal ─────────────────────────────────────────────────── */}
      <PayslipModal
        open={!!payslipRow}
        onClose={() => setPayslipRow(null)}
        row={payslipRow}
      />

      {/* ── Warning Modal ─────────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!warningContext}
        title="Zero Attendance Warning"
        message={
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-neutral-900">Attendance not marked</p>
              <p className="text-sm text-neutral-600 mt-1">
                {warningContext?.type === 'single'
                  ? `Attendance is not marked for ${warningContext.row._emp.firstName} ${warningContext.row._emp.lastName}. Do you still want to process payroll?`
                  : `One or more employees have 0 present days. Do you still want to process payroll for everyone?`}
              </p>
            </div>
          </div>
        }
        onConfirm={() => {
          if (warningContext?.type === 'single') processOne(warningContext.row, true);
          else runAllPending(true);
          setWarningContext(null);
        }}
        onCancel={() => setWarningContext(null)}
        confirmText="Yes, Process"
        cancelText="No, Cancel"
        confirmVariant="primary"
      />
    </div>
  );
}
