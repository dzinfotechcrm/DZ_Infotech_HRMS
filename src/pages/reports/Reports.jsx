import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';

const reportTypes = [
  ['attendance', 'Attendance Report', 'Daily, monthly, and department filters'],
  ['leave', 'Leave Report', 'Summary by type, employee, and month'],
  ['payroll', 'Payroll Report', 'Monthly salary summary and cost analysis'],
  ['employee', 'Employee Report', 'Headcount and joining trend analysis'],
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports & Analytics"
        title="Generate actionable reports"
        description="Access attendance, leave, payroll, and employee analytics in a unified interface."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportTypes.map(([key, title, description]) => (
          <Card key={key} className="p-5">
            <Badge tone="primary">{title}</Badge>
            <p className="mt-3 text-sm text-neutral-600">{description}</p>
            <div className="mt-5"><Link to={`/reports/view/${key}`}><Button className="w-full">Open Report</Button></Link></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
