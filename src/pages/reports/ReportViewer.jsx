import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { query, orderBy } from '../../supabase/db';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { formatDate, formatDateTime } from '../../utils/dateHelpers';
import { exportTableToPdf } from '../../utils/pdfExport';

export default function ReportViewer() {
  const { type } = useParams();
  const [month, setMonth] = useState('');
  const collections = {
    attendance: 'attendance',
    leave: 'leaveRequests',
    payroll: 'payroll',
    employee: 'employees',
  };
  const reportQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const { items } = useSupabaseCollection(collections[type] || 'employees', reportQuery);

  const columns = {
    attendance: ['Date', 'Employee', 'Status'],
    leave: ['Type', 'Employee', 'Status'],
    payroll: ['Employee', 'Month', 'Net Salary'],
    employee: ['Employee', 'Department', 'Join Date'],
  }[type] || ['Name'];

  const rows = items.slice(0, 20).map((item) => {
    if (type === 'attendance') return [formatDate(item.date), item.employeeName || item.employeeId, item.status];
    if (type === 'leave') return [item.leaveType, item.employeeName || item.employeeId, item.status];
    if (type === 'payroll') return [item.employeeName || item.employeeId, `${item.month} ${item.year}`, `₹${Number(item.netSalary || 0).toLocaleString()}`];
    return [`${item.firstName || ''} ${item.lastName || ''}`.trim(), item.department || '—', formatDate(item.joinDate)];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Report Viewer"
        title={`${type.charAt(0).toUpperCase() + type.slice(1)} Report`}
        description="Review report data and export it to PDF for sharing or printing."
      />
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="section-title">{type} Report</div>
            <p className="muted-text">Print-friendly analytics view with export support.</p>
          </div>
          <div className="flex gap-2">
            <Input type="month" label="Filter Month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <Button variant="secondary" onClick={() => exportTableToPdf({ title: `${type} report`, columns, rows })}>Export PDF</Button>
          </div>
        </div>
        <div className="mt-6">
          <Table
            columns={columns.map((label, index) => ({ key: `${label}-${index}`, label }))}
            data={rows}
            renderRow={(row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>}
          />
        </div>
      </Card>
    </div>
  );
}
