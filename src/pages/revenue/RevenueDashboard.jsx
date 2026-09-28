import { useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import PageHeader from '../../components/ui/PageHeader';
import { getISOWeek, getISOWeekYear, isSameWeek } from 'date-fns';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { 
  CurrencyRupeeIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import UpcomingClientEvents from '../../components/dashboard/UpcomingClientEvents';

const COLORS = ['#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#64748b', '#ec4899', '#14b8a6'];

export default function RevenueDashboard() {
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('leads');
  const { items: clients, loading: clientsLoading } = useSupabaseCollection('clients');
  const { items: projects, loading: projectsLoading } = useSupabaseCollection('projects');
  const { items: expenses, loading: expensesLoading } = useSupabaseCollection('expenses');
  const { items: amcs, loading: amcsLoading } = useSupabaseCollection('amcs');

  const loading = leadsLoading || clientsLoading || projectsLoading || expensesLoading || amcsLoading;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const analytics = useMemo(() => {
    if (loading) return null;

    // Leads Data
    const totalLeads = leads.length;
    const leadsByStatus = leads.reduce((acc, lead) => {
      const status = lead.stage || 'New';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const leadStatusData = Object.keys(leadsByStatus).map(status => ({
      name: status,
      value: leadsByStatus[status]
    }));

    // Projects Data
    const totalProjects = projects.length;
    const expectedRevenue = projects.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0);
    const collectedRevenue = projects.reduce((sum, p) => sum + (parseFloat(p.advanceReceived) || 0), 0);
    const pendingRevenue = expectedRevenue - collectedRevenue;

    // Expenses Data
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (parseFloat(exp.amount) || 0);
      return acc;
    }, {});
    const expenseData = Object.keys(expensesByCategory).map(cat => ({
      name: cat,
      value: expensesByCategory[cat]
    }));

    // Monthly Revenue vs Expense Trend
    const monthlyDataMap = {};
    
    const getMonthYear = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    projects.forEach(p => {
      const monthYear = getMonthYear(p.startDate || p.created_at);
      if (monthYear && parseFloat(p.advanceReceived)) {
        if (!monthlyDataMap[monthYear]) monthlyDataMap[monthYear] = { month: monthYear, Revenue: 0, Expense: 0, dateObj: new Date(p.startDate || p.created_at) };
        monthlyDataMap[monthYear].Revenue += parseFloat(p.advanceReceived) || 0;
      }
    });
    
    expenses.forEach(e => {
      const monthYear = getMonthYear(e.date || e.created_at);
      if (monthYear && parseFloat(e.amount)) {
        if (!monthlyDataMap[monthYear]) monthlyDataMap[monthYear] = { month: monthYear, Revenue: 0, Expense: 0, dateObj: new Date(e.date || e.created_at) };
        monthlyDataMap[monthYear].Expense += parseFloat(e.amount) || 0;
      }
    });
    
    // Sort monthly data chronologically
    const trendData = Object.values(monthlyDataMap).sort((a, b) => {
      return a.dateObj - b.dateObj;
    });

    // Current Week Lead Data
    const currentWeekKey = `${getISOWeekYear(new Date())}-W${getISOWeek(new Date())}`;
    const storedTargets = JSON.parse(localStorage.getItem('companyLeadTargets') || '{}');
    const currentWeekTarget = storedTargets[currentWeekKey] || 0;

    const currentWeekLeads = leads.filter(l => {
      if (!l.created_at) return false;
      return isSameWeek(new Date(l.created_at), new Date(), { weekStartsOn: 1 });
    }).length;

    return {
      totalLeads,
      totalClients: clients.length,
      totalProjects,
      totalAmcs: amcs.length,
      expectedRevenue,
      collectedRevenue,
      pendingRevenue,
      totalExpenses,
      leadStatusData,
      expenseData,
      trendData,
      netProfit: collectedRevenue - totalExpenses,
      currentWeekTarget,
      currentWeekLeads
    };
  }, [leads, clients, projects, expenses, amcs, loading]);

  if (loading || !analytics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Revenue Dashboard"
        description="Comprehensive overview of financial health, leads, projects, and expenses."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 border border-primary-100 bg-gradient-to-br from-primary-50 to-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <CurrencyRupeeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Collected</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(analytics.collectedRevenue)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border border-danger-100 bg-gradient-to-br from-danger-50 to-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100 text-danger-600">
              <ArrowTrendingDownIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Expenses</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(analytics.totalExpenses)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ArrowTrendingUpIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Net Profit</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(analytics.netProfit)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border border-warning-100 bg-gradient-to-br from-warning-50 to-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
              <FolderIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Pending Receivables</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(analytics.pendingRevenue)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="p-4 border-l-4 border-indigo-500 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase">This Week Target</p>
            <p className="text-xl font-black text-neutral-900 mt-1">{analytics.currentWeekTarget}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-rose-500 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase">This Week Leads</p>
            <p className="text-xl font-black text-neutral-900 mt-1">{analytics.currentWeekLeads}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-accent-500 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase">Total Leads</p>
            <p className="text-xl font-black text-neutral-900 mt-1">{analytics.totalLeads}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-primary-500 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase">Active Clients</p>
            <p className="text-xl font-black text-neutral-900 mt-1">{analytics.totalClients}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-500 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase">Ongoing Projects</p>
            <p className="text-xl font-black text-neutral-900 mt-1">{analytics.totalProjects}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-warning-500 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase">Active AMCs</p>
            <p className="text-xl font-black text-neutral-900 mt-1">{analytics.totalAmcs}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Revenue vs Expense Trend</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#737373' }}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Lead Status Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.leadStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.leadStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Expenses by Category</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming Client Events */}
        <UpcomingClientEvents clients={clients} />
      </div>
    </div>
  );
}
