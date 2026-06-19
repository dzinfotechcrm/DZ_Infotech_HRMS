import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { CheckIcon, BanknotesIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { supabase } from '../../supabase/config';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function Commissions() {
  const { items: commissions, loading: commissionsLoading, refetch: refetchCommissions } = useSupabaseCollection('sfmsCommissions');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');

  const loading = commissionsLoading || leadsLoading || agentsLoading;

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('sfms_commissions').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      toast.success(`Commission marked as ${newStatus}`);
      refetchCommissions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const enrichedCommissions = useMemo(() => {
    if (loading) return [];
    return [...commissions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(c => {
      const lead = leads.find(l => l.id === c.lead_id);
      const agent = agents.find(a => a.id === c.agent_id);
      return {
        ...c,
        lead_name: lead?.company_name || 'Unknown Lead',
        agent_name: agent?.name || 'Unknown Agent'
      };
    });
  }, [commissions, leads, agents, loading]);

  const stats = useMemo(() => {
    let pendingApproval = 0;
    let approved = 0;
    let payable = 0;
    let paid = 0;

    commissions.forEach(c => {
      const amt = Number(c.amount) || 0;
      if (c.status === 'Pending Approval' || c.status === 'Generated') pendingApproval += amt;
      else if (c.status === 'Approved') approved += amt;
      else if (c.status === 'Payable') payable += amt;
      else if (c.status === 'Paid') paid += amt;
    });

    return { pendingApproval, approved, payable, paid };
  }, [commissions]);

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
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Commissions</h1>
          <p className="text-sm text-neutral-500">Approve and manage commission payouts.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-amber-50 border-amber-100">
          <div className="text-sm font-medium text-amber-800">Pending Approval</div>
          <div className="mt-2 text-3xl font-bold text-amber-900">{formatCurrency(stats.pendingApproval)}</div>
        </Card>
        <Card className="p-4 bg-sky-50 border-sky-100">
          <div className="text-sm font-medium text-sky-800">Approved</div>
          <div className="mt-2 text-3xl font-bold text-sky-900">{formatCurrency(stats.approved)}</div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-100">
          <div className="text-sm font-medium text-purple-800">Payable</div>
          <div className="mt-2 text-3xl font-bold text-purple-900">{formatCurrency(stats.payable)}</div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <div className="text-sm font-medium text-emerald-800">Paid out</div>
          <div className="mt-2 text-3xl font-bold text-emerald-900">{formatCurrency(stats.paid)}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-500">
                <th className="px-4 py-3 font-medium">DATE</th>
                <th className="px-4 py-3 font-medium">LEAD</th>
                <th className="px-4 py-3 font-medium">AGENT</th>
                <th className="px-4 py-3 font-medium">TYPE</th>
                <th className="px-4 py-3 font-medium text-right">AMOUNT</th>
                <th className="px-4 py-3 font-medium">STATUS</th>
                <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {enrichedCommissions.map(comm => (
                <tr key={comm.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3 text-neutral-600 font-medium whitespace-nowrap">
                    {new Date(comm.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900">
                    {comm.lead_name}
                    <div className="text-xs font-normal text-neutral-500 font-mono mt-0.5">ID: {comm.id.split('-')[0]}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-700">{comm.agent_name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={comm.type === 'Advance' ? 'accent' : 'neutral'}>{comm.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-neutral-900">{formatCurrency(comm.amount)}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {(comm.status === 'Pending Approval' || comm.status === 'Generated') && (
                        <Button size="sm" onClick={() => handleUpdateStatus(comm.id, 'Approved')}>
                          Approve
                        </Button>
                      )}
                      {comm.status === 'Approved' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(comm.id, 'Payable')}>
                          Mark Payable
                        </Button>
                      )}
                      {comm.status === 'Payable' && (
                        <Button size="sm" tone="success" className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" onClick={() => handleUpdateStatus(comm.id, 'Paid')}>
                          Mark Paid
                        </Button>
                      )}
                      {comm.status === 'Paid' && (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 px-2 py-1">
                          <CheckIcon className="h-4 w-4" /> Done
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {enrichedCommissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    No commissions found.
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
