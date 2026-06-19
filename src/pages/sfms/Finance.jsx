import React, { useMemo } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function Finance() {
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');

  const loading = financeLoading || leadsLoading || teamsLoading;

  const stats = useMemo(() => {
    if (loading) return null;

    const projectValue = finance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);
    const expectedRevenue = leads.reduce((sum, l) => sum + (Number(l.expected_revenue) || 0), 0);
    const collected = finance.reduce((sum, f) => sum + (Number(f.collected_amount) || 0), 0);
    const pending = finance.reduce((sum, f) => sum + (Number(f.remaining_amount) || 0), 0);
    const commissionLiability = finance.reduce((sum, f) => sum + (Number(f.commission_liability) || 0), 0);
    const commissionPaid = finance.reduce((sum, f) => sum + (Number(f.commission_paid) || 0), 0);

    return { projectValue, expectedRevenue, collected, pending, commissionLiability, commissionPaid };
  }, [finance, leads, loading]);

  const chartData = useMemo(() => {
    if (loading) return [];
    
    return teams.map(team => {
      const teamLeads = leads.filter(l => l.team_id === team.id);
      const teamFinance = finance.filter(f => teamLeads.some(l => l.id === f.lead_id));
      
      const pv = teamFinance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);
      const coll = teamFinance.reduce((sum, f) => sum + (Number(f.collected_amount) || 0), 0);
      
      return {
        name: team.name,
        'Project Value': pv,
        'Collected': coll
      };
    });
  }, [teams, leads, finance, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Finance</h1>
          <p className="text-sm text-neutral-500">Financial overview and team revenue performance.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 border-t-4 border-t-primary-500">
          <div className="text-sm font-medium text-neutral-500">Project Value (Closed)</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{formatCurrency(stats.projectValue)}</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-amber-500">
          <div className="text-sm font-medium text-neutral-500">Expected Revenue (Pipeline)</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{formatCurrency(stats.expectedRevenue)}</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-emerald-500">
          <div className="text-sm font-medium text-neutral-500">Collected Amount</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(stats.collected)}</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-rose-500">
          <div className="text-sm font-medium text-neutral-500">Pending Amount</div>
          <div className="mt-2 text-3xl font-bold text-rose-600">{formatCurrency(stats.pending)}</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-neutral-500">
          <div className="text-sm font-medium text-neutral-500">Commission Liability</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{formatCurrency(stats.commissionLiability)}</div>
        </Card>
        <Card className="p-5 border-t-4 border-t-purple-500">
          <div className="text-sm font-medium text-neutral-500">Commission Paid</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">{formatCurrency(stats.commissionPaid)}</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Revenue by Team</h3>
        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} tickFormatter={formatCurrency} />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Project Value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              No revenue data available to chart.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
