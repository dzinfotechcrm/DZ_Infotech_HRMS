import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { useSupabaseCollection } from '../../../hooks/useSupabase';
import { useAuth } from '../../../hooks/useAuth';
import { 
  UsersIcon, 
  CalendarDaysIcon, 
  CurrencyRupeeIcon, 
  ArrowRightIcon,
  PhoneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function MyDay() {
  const { user } = useAuth();

  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: targets, loading: targetsLoading } = useSupabaseCollection('sfmsTargets');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');

  const loading = agentsLoading || teamsLoading || targetsLoading || leadsLoading || meetingsLoading || commissionsLoading;

  const agentData = useMemo(() => {
    if (loading || !user?.email) return null;
    return agents.find(a => a.email?.toLowerCase() === user.email?.toLowerCase());
  }, [agents, user, loading]);

  const teamData = useMemo(() => {
    if (!agentData || !agentData.team_id) return null;
    return teams.find(t => t.id === agentData.team_id);
  }, [agentData, teams]);

  const teamTarget = useMemo(() => {
    if (!teamData) return null;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return targets.find(t => t.entity_type === 'team' && t.entity_id === teamData.id && t.month === currentMonth);
  }, [teamData, targets]);

  const stats = useMemo(() => {
    if (!agentData || !teamData) return { myLeads: 0, pendingFollowUps: 0, myMeetings: 0, myCommissions: 0 };
    
    // Agent specific commissions
    const agentComms = commissions.filter(c => c.agent_id === agentData.id);
    const myCommissions = agentComms.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Team specific data
    const teamLeads = leads.filter(l => l.team_id === teamData.id);
    const teamMeetings = meetings.filter(m => m.team_id === teamData.id);
    
    const myLeads = teamLeads.length;
    const pendingFollowUps = teamLeads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
    const myMeetings = teamMeetings.length;

    return { myLeads, pendingFollowUps, myMeetings, myCommissions };
  }, [agentData, teamData, leads, meetings, commissions]);

  const todaysFollowUps = useMemo(() => {
    if (!teamData) return [];
    const today = new Date().toISOString().split('T')[0];
    const teamLeads = leads.filter(l => l.team_id === teamData.id && l.status !== 'Won' && l.status !== 'Lost');
    
    return teamLeads.filter(l => {
      if (!l.data?.timeline) return false;
      const t = l.data.timeline;
      return t.some(event => event.type === 'follow_up' && event.date?.startsWith(today));
    }).slice(0, 5); // Limit to top 5
  }, [leads, teamData]);

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

  if (!teamData) {
    return (
      <div className="p-6 text-center">
        <Card className="p-12 border-neutral-800 bg-neutral-900/50">
          <h2 className="text-2xl font-bold text-white mb-2">No Team Assigned</h2>
          <p className="text-neutral-400">You are not currently assigned to any field sales team. Please contact your administrator.</p>
        </Card>
      </div>
    );
  }

  const targetProgress = teamTarget ? (Number(teamTarget.achieved_value) / Number(teamTarget.target_value)) * 100 : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">My Day</h1>
          <p className="text-sm text-neutral-500">{`Welcome back, ${agentData.name.split(' ')[0]}`}</p>
        </div>
        <Badge tone="accent" className="px-3 py-1.5 text-sm">{teamData.name}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Dashboard Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Target Card */}
          <Card className="overflow-hidden bg-gradient-to-br from-primary-900/40 to-neutral-900 border-primary-500/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CurrencyRupeeIcon className="h-5 w-5 text-primary-400" />
                  Team Target ({new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})
                </h3>
              </div>
              
              {teamTarget ? (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">Achieved: <span className="font-bold text-white">{formatCurrency(teamTarget.achieved_value)}</span></span>
                    <span className="text-neutral-400">Target: <span className="font-bold text-white">{formatCurrency(teamTarget.target_value)}</span></span>
                  </div>
                  <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${targetProgress >= 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                      style={{ width: `${Math.min(targetProgress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 text-right text-xs font-medium text-neutral-500">
                    {targetProgress.toFixed(1)}% Completed
                  </div>
                </>
              ) : (
                <div className="text-sm text-neutral-400 py-2">No target set for this month.</div>
              )}
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 bg-neutral-900 border-neutral-800 text-center hover:bg-neutral-800/80 transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-400 mb-2">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.myLeads}</div>
              <div className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Team Leads</div>
            </Card>
            
            <Card className="p-4 bg-neutral-900 border-neutral-800 text-center hover:bg-neutral-800/80 transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                <CalendarDaysIcon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.pendingFollowUps}</div>
              <div className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Follow Ups</div>
            </Card>

            <Card className="p-4 bg-neutral-900 border-neutral-800 text-center hover:bg-neutral-800/80 transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 mb-2">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.myMeetings}</div>
              <div className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Team Meetings</div>
            </Card>

            <Card className="p-4 bg-neutral-900 border-neutral-800 text-center hover:bg-neutral-800/80 transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                <CurrencyRupeeIcon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.myCommissions)}</div>
              <div className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Earned</div>
            </Card>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card className="p-6 bg-neutral-900 border-neutral-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PhoneIcon className="h-5 w-5 text-amber-400" />
                Today's Follow-ups
              </h3>
            </div>

            <div className="space-y-4">
              {todaysFollowUps.length > 0 ? (
                todaysFollowUps.map(lead => (
                  <div key={lead.id} className="group relative flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all hover:bg-neutral-800">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{lead.company_name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{lead.contact_person}</p>
                    </div>
                    <Link to="/sfms/my-leads" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-primary-500/20">
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-500/50 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">All caught up for today!</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
              <Link to="/sfms/my-leads" className="text-sm font-medium text-primary-400 hover:text-primary-300">
                View all leads &rarr;
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
