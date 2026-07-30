import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useSupabaseDocument, useSupabaseCollection } from '../../hooks/useSupabase';
import { upsertDocument } from '../../supabase/db';

const defaultBuckets = [
  { id: '1', name: 'Employee', target: 250000 },
  { id: '2', name: 'Probation Reserve', target: 50000 },
  { id: '3', name: 'Contrack Expense', target: 75000 },
  { id: '4', name: 'Profit', target: 100000 },
  { id: '5', name: 'Company Expense', target: 25000 },
];

export default function BucketSettings() {
  const { item: settingsItem, loading: settingsLoading } = useSupabaseDocument('settings', 'bucket_allocations');
  const { items: projects = [], loading: projectsLoading } = useSupabaseCollection('projects');
  const { items: expenses = [], loading: expensesLoading } = useSupabaseCollection('expenses');

  const loading = settingsLoading || projectsLoading || expensesLoading;
  const [buckets, setBuckets] = useState([]);
  const [editingBucket, setEditingBucket] = useState(null);
  const [previewTarget, setPreviewTarget] = useState('');

  useEffect(() => {
    if (!settingsLoading) {
      if (settingsItem?.value?.buckets) {
        setBuckets(settingsItem.value.buckets);
      } else {
        setBuckets(defaultBuckets);
      }
    }
  }, [settingsItem, settingsLoading]);

  useEffect(() => {
    setPreviewTarget(editingBucket?.target || '');
  }, [editingBucket]);

  const totalTarget = buckets.reduce((sum, b) => sum + Number(b.target || 0), 0);

  const numPreview = Number(previewTarget || 0);
  let projectedTotal = totalTarget;
  if (editingBucket) {
    projectedTotal = totalTarget - Number(editingBucket.target) + numPreview;
  } else {
    projectedTotal = totalTarget + numPreview;
  }
  const previewPercent = projectedTotal > 0 ? ((numPreview / projectedTotal) * 100).toFixed(1) + '%' : '0%';

  const handleBucketSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name').toString().trim();
    const target = Number(formData.get('target'));

    if (!name || target <= 0) {
      toast.error('Please provide a valid name and target amount.');
      return;
    }

    if (editingBucket) {
      setBuckets(buckets.map(b => b.id === editingBucket.id ? { ...b, name, target } : b));
      setEditingBucket(null);
    } else {
      const newBucket = {
        id: Date.now().toString(),
        name,
        target
      };
      setBuckets([...buckets, newBucket]);
    }

    e.currentTarget.reset();
    setPreviewTarget('');
  };

  const removeBucket = (id) => {
    setBuckets(buckets.filter(b => b.id !== id));
  };

  const saveSettings = async () => {
    try {
      await upsertDocument('settings', 'bucket_allocations', {
        value: { buckets }
      });
      toast.success('Bucket settings saved successfully');
    } catch (error) {
      console.error('Error saving bucket settings:', error);
      toast.error('Failed to save bucket settings');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (amount) => {
    if (totalTarget === 0) return '0%';
    return ((amount / totalTarget) * 100).toFixed(1) + '%';
  };

  const filledAmounts = {};
  buckets.forEach(b => filledAmounts[b.id] = 0);

  if (projects) {
    projects.forEach(project => {
      const netReceived = parseFloat(project.advanceReceived) || 0;
      const projectBuckets = project.bucketSettings || buckets;
      const projectTotalTarget = projectBuckets.reduce((sum, b) => sum + Number(b.target || 0), 0);

      projectBuckets.forEach(pb => {
        const percent = projectTotalTarget > 0 ? (Number(pb.target) / projectTotalTarget) : 0;
        const allocatedAmount = Math.round(netReceived * percent);
        const globalBucket = buckets.find(b => b.name === pb.name || b.id === pb.id);
        if (globalBucket) {
          filledAmounts[globalBucket.id] = (filledAmounts[globalBucket.id] || 0) + allocatedAmount;
        }
      });
    });
  }

  if (expenses) {
    expenses.forEach(expense => {
      const globalBucket = buckets.find(b => b.name === expense.category);
      if (globalBucket) {
        filledAmounts[globalBucket.id] = (filledAmounts[globalBucket.id] || 0) - Number(expense.amount || 0);
      }
    });
  }

  if (loading) {
    return <div className="p-6 text-center text-neutral-500">Loading bucket settings...</div>;
  }

  const totalFilledAmount = Object.values(filledAmounts).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue Settings"
        title="Bucket Allocation Rules"
        description="Configure target amounts for different buckets. Percentages are auto-calculated based on the total target."
        actions={<Button onClick={saveSettings}>Save Settings</Button>}
      />

      {buckets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {buckets.map(bucket => {
            const filledAmount = filledAmounts[bucket.id] || 0;
            return (
              <Card key={bucket.id} className="p-4 border-l-4 border-l-emerald-500">
                <h3 className="text-sm font-semibold text-neutral-600 truncate" title={bucket.name}>{bucket.name}</h3>
                <p className="text-xl font-bold text-neutral-900 mt-1">{formatCurrency(filledAmount)}</p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-2">Amount Filled</p>
              </Card>
            );
          })}
          <Card className="p-4 border-l-4 border-l-primary-600 bg-primary-50/50">
            <h3 className="text-sm font-semibold text-primary-900 truncate" title="Total Filled">Total Filled</h3>
            <p className="text-xl font-black text-primary-900 mt-1">{formatCurrency(totalFilledAmount)}</p>
            <p className="text-[10px] font-bold text-primary-600/80 uppercase tracking-wider mt-2">All Buckets Combined</p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="section-title text-neutral-800">{editingBucket ? 'Edit Bucket' : 'Add New Bucket'}</h2>
            <form key={editingBucket ? editingBucket.id : 'new'} onSubmit={handleBucketSubmit} className="mt-5 space-y-4">
              <Input name="name" label="Bucket Name" defaultValue={editingBucket?.name || ''} placeholder="e.g. Marketing" required />
              <Input
                name="target"
                label="Target Amount (₹)"
                value={previewTarget}
                onChange={(e) => setPreviewTarget(e.target.value)}
                type="number"
                min="1"
                placeholder="e.g. 50000"
                required
              />

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Projected % of Total</label>
                <div className="h-11 px-3 bg-neutral-50/80 border border-neutral-200 rounded-xl flex items-center shadow-sm">
                  <span className="font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded text-sm">{previewPercent}</span>
                  <span className="ml-2 text-xs text-neutral-500 font-medium tracking-wide">of {formatCurrency(projectedTotal)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingBucket && (
                  <Button type="button" variant="secondary" onClick={() => setEditingBucket(null)} className="flex-1">
                    Cancel
                  </Button>
                )}
                <Button type="submit" className={editingBucket ? "flex-1" : "w-full"}>
                  {editingBucket ? 'Update' : 'Add Bucket'}
                </Button>
              </div>
            </form>
          </Card>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-100/80">Total Target Base</h2>
              <div className="mt-3 text-4xl font-black tracking-tight text-white drop-shadow-md">
                {formatCurrency(totalTarget)}
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-emerald-50">
                This total is the sum of all bucket targets and is used to calculate the percentage allocations.
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <Card className="p-0 overflow-hidden shadow-sm border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-white">
              <h2 className="section-title text-neutral-800">Current Buckets</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Bucket Name</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Target Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">% of Total</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-100">
                  {buckets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm text-neutral-500 bg-neutral-50/30">
                        No buckets configured. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    buckets.map((bucket) => (
                      <tr key={bucket.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">
                          {bucket.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 text-right font-semibold">
                          {formatCurrency(bucket.target)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {formatPercent(bucket.target)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => setEditingBucket(bucket)}
                              className="text-primary-600 hover:text-primary-700 transition-colors p-1.5 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                              title="Edit bucket"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => removeBucket(bucket.id)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                              title="Remove bucket"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {buckets.length > 0 && (
                    <tr className="bg-neutral-50/80 font-bold border-t-2 border-neutral-200">
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-neutral-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-neutral-900 text-right">
                        {formatCurrency(totalTarget)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-neutral-900 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800">
                          100%
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
