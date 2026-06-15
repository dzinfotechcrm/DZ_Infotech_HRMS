import { useState, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import { PlusIcon, ChartBarIcon, UsersIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConTrackRevenueFormModal from './ConTrackRevenueFormModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PLAN_COLORS = {
  'Basic': 'bg-slate-100 text-slate-700 border-slate-200',
  'Professional': 'bg-blue-50 text-blue-700 border-blue-200',
  'Enterprise': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Custom': 'bg-purple-50 text-purple-700 border-purple-200'
};

export default function ConTrackRevenueDashboard() {
  const { items: customers, refetch } = useSupabaseCollection('contrack_revenue');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleOpenModal = (customer = null) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (payload) => {
    try {
      if (selectedCustomer) {
        await updateDocument('contrack_revenue', selectedCustomer.id, payload);
        toast.success('Customer updated successfully');
      } else {
        await createDocument('contrack_revenue', payload);
        toast.success('Customer added successfully');
      }
      refetch();
    } catch (error) {
      toast.error('Failed to save customer: ' + error.message);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await removeDocument('contrack_revenue', id);
        toast.success('Customer deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete customer: ' + error.message);
      }
    }
  };

  // KPIs
  const activeCustomersList = customers.filter(c => c.status === 'Active');
  const totalActive = activeCustomersList.length;
  
  const mrr = activeCustomersList.reduce((sum, c) => sum + (parseFloat(c.monthlyRevenue) || 0), 0);
  const arr = activeCustomersList.reduce((sum, c) => sum + (parseFloat(c.annualRevenue) || 0), 0);
  
  const churnedCustomersList = customers.filter(c => c.status === 'Churned');
  const churnRate = customers.length > 0 ? ((churnedCustomersList.length / customers.length) * 100).toFixed(1) : '0.0';

  const formatCurrencyShort = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${value}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'bg-emerald-400';
    if (score >= 75) return 'bg-blue-400';
    if (score >= 50) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Dynamic Chart Data Generation (Last 6 Months)
  const chartData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        date: d,
        name: d.toLocaleString('default', { month: 'short' }),
        mrr: 0,
        rate: 0,
        totalCustomers: 0,
        churnedCustomers: 0
      });
    }

    months.forEach(monthObj => {
      let monthMrr = 0;
      let monthTotalCustomers = 0;
      let monthChurnedCustomers = 0;

      customers.forEach(c => {
        if (!c.startDate) return;
        const startD = new Date(c.startDate);
        
        if (startD <= new Date(monthObj.date.getFullYear(), monthObj.date.getMonth() + 1, 0)) {
          if (c.status === 'Active') {
             monthMrr += (parseFloat(c.monthlyRevenue) || 0);
             monthTotalCustomers++;
          }
          if (c.status === 'Churned') {
             monthChurnedCustomers++;
          }
        }
      });

      monthObj.mrr = monthMrr;
      monthObj.totalCustomers = monthTotalCustomers + monthChurnedCustomers;
      monthObj.churnedCustomers = monthChurnedCustomers;
      monthObj.rate = monthObj.totalCustomers > 0 ? parseFloat(((monthObj.churnedCustomers / monthObj.totalCustomers) * 100).toFixed(1)) : 0;
    });

    return months;
  }, [customers]);

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 -m-6 p-6 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">ConTrack Revenue</h1>
          <p className="text-sm text-neutral-500">Product business · MRR · churn · customer health</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4" /> New Customer
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">MRR</div>
            <ArrowTrendingUpIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrency(mrr)}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customers</div>
            <UsersIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{totalActive}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">Active</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Churn Rate</div>
            <ArrowTrendingDownIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{churnRate}%</div>
            <div className="text-xs text-neutral-500">all-time</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">ARR Projection</div>
            <ChartBarIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrencyShort(arr)}</div>
            <div className="text-xs text-neutral-500">run-rate</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-72">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">MRR Growth</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#737373' }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'MRR']}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">Churn Rate</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#737373' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}%`, 'Churn Rate']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      {/* Customers List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-900">Customers</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-white text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold text-right">MRR</th>
                <th className="px-6 py-4 font-semibold w-48">Health</th>
                <th className="px-6 py-4 font-semibold">Since</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-neutral-500">
                    No customers found. Add your first SaaS customer to get started.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-neutral-50 cursor-pointer transition-colors group"
                    onClick={() => handleOpenModal(c)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">{c.customerName}</div>
                      {c.status !== 'Active' && (
                        <span className="text-[10px] text-red-500 font-medium ml-2">{c.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${PLAN_COLORS[c.plan] || 'bg-slate-100 text-slate-700'}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-neutral-900">
                      {formatCurrency(c.monthlyRevenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getHealthColor(c.healthScore)}`} 
                            style={{ width: `${Math.max(0, Math.min(100, c.healthScore))}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-neutral-600 w-6 text-right">{c.healthScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                      {c.startDate ? formatDate(c.startDate, 'MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => handleDelete(e, c.id)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConTrackRevenueFormModal
        open={isModalOpen}
        customer={selectedCustomer}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
