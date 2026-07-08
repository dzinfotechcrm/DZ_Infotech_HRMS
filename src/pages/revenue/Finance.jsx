import { useSupabaseCollection, useSupabaseDocument } from '../../hooks/useSupabase';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function Finance() {
  const { items: projects, loading: projectsLoading } = useSupabaseCollection('projects');
  const { items: clients, loading: clientsLoading } = useSupabaseCollection('clients');
  const { item: settingsItem, loading: settingsLoading } = useSupabaseDocument('settings', 'bucket_allocations');

  const loading = projectsLoading || clientsLoading || settingsLoading;

  const buckets = settingsItem?.value?.buckets || [
    { id: '1', name: 'Employee', target: 250000 },
    { id: '2', name: 'Probation Reserve', target: 50000 },
    { id: '3', name: 'Contrack Expense', target: 75000 },
    { id: '4', name: 'Profit', target: 100000 },
    { id: '5', name: 'Company Expense', target: 25000 },
  ];

  const totalTarget = buckets.reduce((sum, b) => sum + Number(b.target || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue"
        title="Finance Tracking"
        description="View financial breakdowns and bucket allocations for all projects based on advance received."
      />

      <Card className="p-0 overflow-hidden shadow-sm border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 whitespace-nowrap text-sm">
            <thead className="bg-primary-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Client Name</th>
                <th className="px-4 py-3 text-left font-semibold">Project Name</th>
                <th className="px-4 py-3 text-left font-semibold">Service Type</th>
                <th className="px-4 py-3 text-right font-semibold">Total Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Amount Received</th>
                <th className="px-4 py-3 text-right font-semibold">Pending</th>
                <th className="px-4 py-3 text-right font-semibold bg-primary-800">Net Received</th>
                {buckets.map(bucket => (
                  <th key={bucket.id} className="px-4 py-3 text-right font-semibold text-accent-100">
                    {bucket.name} Alloc
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold">Date Received</th>
                <th className="px-4 py-3 text-left font-semibold">Expected Completion</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={11 + buckets.length} className="px-6 py-12 text-center text-neutral-500">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const client = clients.find(c => c.id === project.clientId);
                  const totalAmount = parseFloat(project.totalValue) || 0;
                  const advanceReceived = parseFloat(project.advanceReceived) || 0;
                  const pending = totalAmount - advanceReceived;
                  const netReceived = advanceReceived;

                  return (
                    <tr key={project.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-primary-700">{client?.companyName || 'Unknown'}</td>
                      <td className="px-4 py-4 font-semibold text-neutral-900">{project.name}</td>
                      <td className="px-4 py-4 text-neutral-600">{project.serviceType}</td>
                      <td className="px-4 py-4 text-right font-semibold">{formatCurrency(totalAmount)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-primary-600">{formatCurrency(advanceReceived)}</td>
                      <td className="px-4 py-4 text-right text-neutral-600">{formatCurrency(pending)}</td>
                      <td className="px-4 py-4 text-right font-bold bg-neutral-50 border-x border-neutral-100">{formatCurrency(netReceived)}</td>
                      {buckets.map(bucket => {
                        const percent = totalTarget > 0 ? (Number(bucket.target) / totalTarget) : 0;
                        const allocatedAmount = netReceived * percent;
                        return (
                          <td key={bucket.id} className="px-4 py-4 text-right text-accent-700 font-semibold bg-accent-50/30 border-r border-accent-100/50">
                            {formatCurrency(allocatedAmount)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-neutral-600">{formatDate(project.startDate)}</td>
                      <td className="px-4 py-4 text-neutral-600">{formatDate(project.deadline)}</td>
                      <td className="px-4 py-4 text-neutral-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-neutral-500 max-w-[200px] truncate" title={project.description}>
                        {project.description || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
