import { useState } from 'react';
import { useSupabaseCollection, useSupabaseDocument } from '../../hooks/useSupabase';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { TableCellsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

export default function Finance() {
  const [viewMode, setViewMode] = useState('card');
  const { items: projects, loading: projectsLoading } = useSupabaseCollection('projects');
  const { items: clients, loading: clientsLoading } = useSupabaseCollection('clients');
  const { item: settingsItem, loading: settingsLoading } = useSupabaseDocument('settings', 'bucket_allocations');

  const loading = projectsLoading || clientsLoading || settingsLoading;

  const defaultBuckets = [
    { id: '1', name: 'Employee', target: 250000 },
    { id: '2', name: 'Probation Reserve', target: 50000 },
    { id: '3', name: 'Contrack Expense', target: 75000 },
    { id: '4', name: 'Profit', target: 100000 },
    { id: '5', name: 'Company Expense', target: 25000 },
  ];
  
  const globalBuckets = settingsItem?.value?.buckets || defaultBuckets;

  // Derive unique buckets for the table view across all projects and current globals
  const allBucketsMap = new Map();
  defaultBuckets.forEach(b => allBucketsMap.set(b.id, b.name));
  globalBuckets.forEach(b => allBucketsMap.set(b.id, b.name));
  projects.forEach(p => {
    if (p.bucketSettings) {
      p.bucketSettings.forEach(b => allBucketsMap.set(b.id, b.name));
    }
  });
  const uniqueBuckets = Array.from(allBucketsMap.entries()).map(([id, name]) => ({ id, name }));

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

      <div className="flex justify-between items-center sm:hidden">
        <h2 className="text-lg font-bold text-neutral-900">Projects Finance</h2>
      </div>

      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setViewMode('card')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'card' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <Squares2X2Icon className="h-4 w-4" /> Card View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'table' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <TableCellsIcon className="h-4 w-4" /> Table View
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
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
                  {uniqueBuckets.map(bucket => (
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
                    <td colSpan={11 + uniqueBuckets.length} className="px-6 py-12 text-center text-neutral-500">
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
                        {uniqueBuckets.map(bucket => {
                          const projectBuckets = project.bucketSettings || defaultBuckets;
                          const projectTotalTarget = projectBuckets.reduce((sum, b) => sum + Number(b.target || 0), 0);
                          const matchingBucket = projectBuckets.find(b => b.id === bucket.id);
                          const percent = matchingBucket && projectTotalTarget > 0 ? (Number(matchingBucket.target) / projectTotalTarget) : 0;
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200">
              No projects found.
            </div>
          ) : (
            projects.map((project) => {
              const client = clients.find(c => c.id === project.clientId);
              const totalAmount = parseFloat(project.totalValue) || 0;
              const advanceReceived = parseFloat(project.advanceReceived) || 0;
              const pending = totalAmount - advanceReceived;
              const netReceived = advanceReceived;

              return (
                <Card key={project.id} className="p-0 overflow-hidden border border-neutral-200 hover:border-primary-300 transition-all shadow-sm hover:shadow-md flex flex-col">
                  {/* Header */}
                  <div className="p-5 border-b border-neutral-100 bg-gradient-to-br from-neutral-50 to-white">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800">
                        {project.status}
                      </span>
                      <span className="text-xs font-medium text-neutral-400">{formatDate(project.startDate)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 truncate" title={project.name}>{project.name}</h3>
                    <p className="text-sm font-medium text-neutral-500 truncate mt-0.5" title={client?.companyName}>
                      {client?.companyName || 'Unknown Client'}
                    </p>
                    <p className="text-xs font-medium text-neutral-400 mt-1">{project.serviceType}</p>
                  </div>

                  {/* Financials */}
                  <div className="p-5 border-b border-neutral-100 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-sm font-semibold text-neutral-900">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Pending</p>
                        <p className="text-sm font-semibold text-neutral-600">{formatCurrency(pending)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 bg-primary-50/30 -mx-5 px-5 -mb-5 pb-5">
                      <p className="text-[10px] font-bold text-primary-600/80 uppercase tracking-wider mb-1">Net Received (Advance)</p>
                      <p className="text-2xl font-black text-primary-700 tracking-tight">{formatCurrency(netReceived)}</p>
                    </div>
                  </div>

                  {/* Buckets */}
                  <div className="p-5 bg-neutral-50/80 flex-1 flex flex-col">
                    <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Squares2X2Icon className="h-4 w-4 text-neutral-400" />
                      Allocations
                    </p>
                    <div className="space-y-3 mt-auto">
                      {(project.bucketSettings || defaultBuckets).map(bucket => {
                        const projectBuckets = project.bucketSettings || defaultBuckets;
                        const projectTotalTarget = projectBuckets.reduce((sum, b) => sum + Number(b.target || 0), 0);
                        const percent = projectTotalTarget > 0 ? (Number(bucket.target) / projectTotalTarget) : 0;
                        const allocatedAmount = netReceived * percent;
                        return (
                          <div key={bucket.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent-400"></div>
                              <span className="text-xs font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">
                                {bucket.name}
                                <span className="ml-1 text-[10px] font-bold text-neutral-400">({(percent * 100).toFixed(1)}%)</span>
                              </span>
                            </div>
                            <span className="text-sm font-bold text-accent-700">{formatCurrency(allocatedAmount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
