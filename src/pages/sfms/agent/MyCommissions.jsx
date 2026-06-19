import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { CheckIcon, BanknotesIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { useSupabaseCollection } from '../../../hooks/useSupabase';
import { useAuth } from '../../../hooks/useAuth';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function MyCommissions() {
  const { user } = useAuth();
  
  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');

  const loading = commissionsLoading || leadsLoading || agentsLoading;

  const agentData = useMemo(() => {
    if (loading || !user?.email) return null;
    return agents.find(a => a.email?.toLowerCase() === user.email?.toLowerCase());
  }, [agents, user, loading]);

  const enrichedCommissions = useMemo(() => {
    if (loading || !agentData) return [];
    
    return commissions
      .filter(c => c.agent_id === agentData.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(c => {
        const lead = leads.find(l => l.id === c.lead_id);
        return {
          ...c,
          lead_name: lead?.company_name || 'Unknown Lead'
        };
      });
  }, [commissions, leads, agentData, loading]);

  const stats = useMemo(() => {
    let pendingApproval = 0;
    let approved = 0;
    let payable = 0;
    let paid = 0;

    enrichedCommissions.forEach(c => {
      const amt = Number(c.amount) || 0;
      if (c.status === 'Pending Approval' || c.status === 'Generated') pendingApproval += amt;
      else if (c.status === 'Approved') approved += amt;
      else if (c.status === 'Payable') payable += amt;
      else if (c.status === 'Paid') paid += amt;
    });

    return { pendingApproval, approved, payable, paid };
  }, [enrichedCommissions]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!agentData) {
    return (
      <div className="p-6 text-center">
        <Card className="p-12 border-neutral-800 bg-neutral-900/50">
          <h2 className="text-2xl font-bold text-white mb-2">Agent Profile Not Found</h2>
          <p className="text-neutral-400">Please contact your administrator to ensure your employee profile is linked to an agent profile.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">My Commissions</h1>
          <p className="text-sm text-neutral-500">Track your earnings and payouts.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-500">Pending Approval</div>
          <div className="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-400">{formatCurrency(stats.pendingApproval)}</div>
        </Card>
        <Card className="p-4 bg-sky-50 border-sky-100 dark:bg-sky-900/20 dark:border-sky-900/50">
          <div className="text-sm font-medium text-sky-800 dark:text-sky-500">Approved</div>
          <div className="mt-2 text-3xl font-bold text-sky-900 dark:text-sky-400">{formatCurrency(stats.approved)}</div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/50">
          <div className="text-sm font-medium text-purple-800 dark:text-purple-500">Payable</div>
          <div className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-400">{formatCurrency(stats.payable)}</div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-500">Paid out</div>
          <div className="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-400">{formatCurrency(stats.paid)}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">DATE</th>
                <th className="px-4 py-3 font-medium">LEAD</th>
                <th className="px-4 py-3 font-medium">TYPE</th>
                <th className="px-4 py-3 font-medium text-right">AMOUNT</th>
                <th className="px-4 py-3 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {enrichedCommissions.map(comm => (
                <tr key={comm.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-medium whitespace-nowrap">
                    {new Date(comm.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">
                    {comm.lead_name}
                    <div className="text-xs font-normal text-neutral-500 font-mono mt-0.5">ID: {comm.id.split('-')[0]}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={comm.type === 'Advance' ? 'accent' : 'neutral'}>{comm.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-white">{formatCurrency(comm.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge 
                      tone={
                        comm.status === 'Paid' ? 'success' : 
                        comm.status === 'Payable' ? 'accent' : 
                        comm.status === 'Approved' ? 'neutral' : 'warning'
                      }
                    >
                      {comm.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {enrichedCommissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    No commissions found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
