import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { useSupabaseDocument, useSupabaseCollection } from '../../hooks/useSupabase';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function AgentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { item: agent, loading: agentLoading } = useSupabaseDocument('sfms_agents', id);
  const { items: sfmsTeamAgents, loading: sfmsTeamAgentsLoading } = useSupabaseCollection('sfmsTeamAgents');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');

  const loading = agentLoading || sfmsTeamAgentsLoading || teamsLoading || leadsLoading || meetingsLoading || commissionsLoading || financeLoading;

  const enrichedData = useMemo(() => {
    if (loading || !agent) return null;

    const agentTeamIds = sfmsTeamAgents.filter(ta => ta.agent_id === agent.id).map(ta => ta.team_id);
    if (agentTeamIds.length === 0 && agent.team_id) agentTeamIds.push(agent.team_id);

    const agentTeams = agentTeamIds.map(tid => teams.find(t => t.id === tid)).filter(Boolean);
    const team_name = agentTeams.map(t => t.name).join(', ') || 'Unassigned';

    const teamLeads = leads.filter(l => agentTeamIds.includes(l.team_id));
    const agentCommissions = commissions.filter(c => c.agent_id === agent.id);

    const deals = teamLeads.filter(l => l.stage === 'Won').length;
    const teamFinance = finance.filter(f => teamLeads.some(l => l.id === f.lead_id));
    const revenue = teamFinance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);
    const totalCommission = agentCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const agentMeetings = meetings.filter(m => agentTeamIds.includes(m.team_id));

    return {
      team_name,
      stats: {
        meetings: agentMeetings.length,
        deals,
        revenue,
        commission: totalCommission
      },
      recentLeads: teamLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
      commissionHistory: agentCommissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    };
  }, [agent, teams, leads, meetings, commissions, finance, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-neutral-600">Agent not found</p>
        <Button onClick={() => navigate('/sfms/agents')}>Back to Agents</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sfms/agents')}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Agent Profile</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Card */}
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700 mb-4">
              {agent.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-neutral-900">{agent.name}</h2>
            <p className="text-sm text-neutral-500 font-medium mb-4">{enrichedData.team_name}</p>

            <Badge tone={agent.status === 'active' ? 'success' : 'neutral'} className="mb-6">
              {agent.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>

            <div className="w-full space-y-3 text-left border-t border-neutral-100 pt-6">
              {agent.phone && (
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <PhoneIcon className="h-5 w-5 text-neutral-400" />
                  <span>{agent.phone}</span>
                </div>
              )}
              {agent.email && (
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
                  <span>{agent.email}</span>
                </div>
              )}
              {agent.city && (
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <MapPinIcon className="h-5 w-5 text-neutral-400" />
                  <span>{agent.city}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Stats Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-50 pb-2">
                <span className="text-sm font-medium text-neutral-500">Meetings</span>
                <span className="font-bold text-neutral-900">{enrichedData.stats.meetings}</span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-50 pb-2">
                <span className="text-sm font-medium text-neutral-500">Deals Won</span>
                <span className="font-bold text-neutral-900">{enrichedData.stats.deals}</span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-50 pb-2">
                <span className="text-sm font-medium text-neutral-500">Revenue Generated</span>
                <span className="font-bold text-emerald-600">{formatCurrency(enrichedData.stats.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-500">Total Commission</span>
                <span className="font-bold text-primary-600">{formatCurrency(enrichedData.stats.commission)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Recent Leads */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900">Recent Leads (Team)</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/sfms/leads')}>View All</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-500 border-b border-neutral-100">
                    <th className="px-6 py-3 font-medium">COMPANY</th>
                    <th className="px-6 py-3 font-medium">STAGE</th>
                    <th className="px-6 py-3 font-medium text-right">EXPECTED REV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {enrichedData.recentLeads.map(lead => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 font-medium text-neutral-900">{lead.company_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(lead.expected_revenue)}</td>
                    </tr>
                  ))}
                  {enrichedData.recentLeads.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-neutral-400">No leads assigned to this team</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Commission History */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900">Commission History</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/sfms/commissions')}>View All</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-500 border-b border-neutral-100">
                    <th className="px-6 py-3 font-medium">DATE</th>
                    <th className="px-6 py-3 font-medium">TYPE</th>
                    <th className="px-6 py-3 font-medium">AMOUNT</th>
                    <th className="px-6 py-3 font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {enrichedData.commissionHistory.map(comm => (
                    <tr key={comm.id}>
                      <td className="px-6 py-4 text-neutral-600">{new Date(comm.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-neutral-900">{comm.type}</td>
                      <td className="px-6 py-4 font-bold text-neutral-900">{formatCurrency(comm.amount)}</td>
                      <td className="px-6 py-4">
                        <Badge tone={comm.status === 'Paid' ? 'success' : comm.status === 'Approved' || comm.status === 'Payable' ? 'accent' : 'neutral'}>
                          {comm.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {enrichedData.commissionHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">No commissions yet</td>
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
