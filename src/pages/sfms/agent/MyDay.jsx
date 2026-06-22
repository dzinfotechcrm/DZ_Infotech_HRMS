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
  const { items: sfmsTeamAgents, loading: sfmsTeamAgentsLoading } = useSupabaseCollection('sfmsTeamAgents');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: targets, loading: targetsLoading } = useSupabaseCollection('sfmsTargets');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');

  const loading = agentsLoading || sfmsTeamAgentsLoading || teamsLoading || targetsLoading || leadsLoading || meetingsLoading || commissionsLoading;

  const agentData = useMemo(() => {
    if (loading || !user?.email) return null;
    return agents.find(a => a.email?.toLowerCase() === user.email?.toLowerCase());
  }, [agents, user, loading]);

  const agentTeamIds = useMemo(() => {
    if (loading || !agentData) return [];
    let tids = sfmsTeamAgents.filter(ta => ta.agent_id === agentData.id).map(ta => ta.team_id);
    if (tids.length === 0 && agentData.team_id) tids.push(agentData.team_id);
    return tids;
  }, [sfmsTeamAgents, agentData, loading]);

  const agentTeams = useMemo(() => {
    if (agentTeamIds.length === 0) return [];
    return agentTeamIds.map(tid => teams.find(t => t.id === tid)).filter(Boolean);
  }, [agentTeamIds, teams]);

  const aggregatedTarget = useMemo(() => {
    if (agentTeamIds.length === 0) return null;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const activeTargets = targets.filter(t => t.entity_type === 'team' && agentTeamIds.includes(t.entity_id) && t.month === currentMonth);
    if (activeTargets.length === 0) return null;
    return activeTargets.reduce((acc, t) => {
      acc.achieved_value += Number(t.achieved_value) || 0;
      acc.target_value += Number(t.target_value) || 0;
      return acc;
    }, { achieved_value: 0, target_value: 0 });
  }, [agentTeamIds, targets]);

  const stats = useMemo(() => {
    if (!agentData) return { myLeads: 0, pendingFollowUps: 0, myMeetings: 0, myCommissions: 0 };

    // Agent specific commissions
    const agentComms = commissions.filter(c => c.agent_id === agentData.id);
    const myCommissions = agentComms.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Team and Agent specific data
    const myFilteredLeads = leads.filter(l => agentTeamIds.includes(l.team_id) || l.agent_id === agentData.id);
    const teamMeetings = meetings.filter(m => agentTeamIds.includes(m.team_id));

    const myLeads = myFilteredLeads.length;
    const pendingFollowUps = myFilteredLeads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').length;
    const myMeetings = teamMeetings.length;

    return { myLeads, pendingFollowUps, myMeetings, myCommissions };
  }, [agentData, agentTeamIds, leads, meetings, commissions]);

  const todaysFollowUps = useMemo(() => {
    if (!agentData) return [];
    const today = new Date().toISOString().split('T')[0];
    const myFilteredLeads = leads.filter(l => (agentTeamIds.includes(l.team_id) || l.agent_id === agentData.id) && l.stage !== 'Won' && l.stage !== 'Lost');

    const leadsWithMeetingsToday = meetings.filter(m => m.follow_up_date === today).map(m => m.lead_id);

    return myFilteredLeads.filter(l => {
      if (l.stage === 'Assigned') return true;
      if (leadsWithMeetingsToday.includes(l.id)) return true;
      return false;
    }).slice(0, 5); // Limit to top 5
  }, [leads, meetings, agentTeamIds, agentData]);

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
        <Card className="p-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Agent Profile Not Found</h2>
          <p className="text-neutral-500">Please contact your administrator to ensure your employee profile is linked to an agent profile.</p>
        </Card>
      </div>
    );
  }

  const hasDirectLeads = leads.some(l => l.agent_id === agentData.id);
  
  if (agentTeamIds.length === 0 && !hasDirectLeads) {
    return (
      <div className="p-6 text-center">
        <Card className="p-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Team or Leads Assigned</h2>
          <p className="text-neutral-500">You are not currently assigned to any field sales team or individual leads. Please contact your administrator.</p>
        </Card>
      </div>
    );
  }

  const targetProgress = aggregatedTarget && aggregatedTarget.target_value > 0 
    ? (Number(aggregatedTarget.achieved_value) / Number(aggregatedTarget.target_value)) * 100 
    : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">My Day</h1>
          <p className="text-sm text-neutral-500">{`Welcome back, ${agentData.name.split(' ')[0]}`}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {agentTeams.map(t => (
            <Badge key={t.id} tone="accent" className="px-3 py-1.5 text-sm">{t.name}</Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Dashboard Area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Target Card */}
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <CurrencyRupeeIcon className="h-5 w-5 text-primary-600" />
                  Team Target ({new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})
                </h3>
              </div>

              {aggregatedTarget ? (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Achieved: <span className="font-bold text-neutral-900">{formatCurrency(aggregatedTarget.achieved_value)}</span></span>
                    <span className="text-neutral-500">Target: <span className="font-bold text-neutral-900">{formatCurrency(aggregatedTarget.target_value)}</span></span>
                  </div>
                  <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
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
                <div className="text-sm text-neutral-500 py-2">No target set for this month.</div>
              )}
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mb-2">
                <UsersIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.myLeads}</div>
              <div className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">Team Leads</div>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.pendingFollowUps}</div>
              <div className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">Follow Ups</div>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center mb-2">
                <UsersIcon className="h-5 w-5 text-sky-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.myMeetings}</div>
              <div className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">Team Meetings</div>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CurrencyRupeeIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.myCommissions)}</div>
              <div className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">Earned</div>
            </Card>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <PhoneIcon className="h-5 w-5 text-amber-500" />
                Today's Follow-ups
              </h3>
            </div>

            <div className="space-y-4">
              {todaysFollowUps.length > 0 ? (
                todaysFollowUps.map(lead => (
                  <div key={lead.id} className="group relative flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-all hover:border-primary-100 hover:bg-primary-50/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{lead.company_name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{lead.contact_person}</p>
                    </div>
                    <Link to="/my-leads" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm opacity-0 transition-all group-hover:opacity-100 hover:bg-primary-50">
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-500/20 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">All caught up for today!</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
              <Link to="/my-leads" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all leads &rarr;
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
