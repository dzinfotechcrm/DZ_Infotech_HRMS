import React, { useState, useMemo } from 'react';

import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Formatting helpers
const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function Dashboard() {
  // Fetch data
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: targets, loading: targetsLoading } = useSupabaseCollection('sfmsTargets');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');

  const loading = teamsLoading || agentsLoading || leadsLoading || meetingsLoading || targetsLoading || commissionsLoading || financeLoading;

  // Process data
  const stats = useMemo(() => {
    if (loading) return null;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Time boundaries
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLast7Days = new Date(today);
    startOfLast7Days.setDate(today.getDate() - 7);

    // Leads logic
    const wonLeads = leads.filter(l => l.stage === 'Won');
    const lostLeads = leads.filter(l => l.stage === 'Lost');
    const activeLeads = leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost');
    const newLeadsMonth = leads.filter(l => new Date(l.created_at) >= startOfMonth);

    const conversionRate = leads.length ? (wonLeads.length / leads.length) * 100 : 0;
    
    // Meetings logic
    const todaysMeetings = meetings.filter(m => m.meeting_date === todayStr);
    const todaysFollowUps = meetings.filter(m => m.follow_up_date === todayStr);
    const last7DaysMeetings = meetings.filter(m => new Date(m.meeting_date) >= startOfLast7Days && new Date(m.meeting_date) <= today);

    // Revenue / Finance logic
    const expectedRevenue = leads.reduce((sum, l) => sum + (Number(l.expected_revenue) || 0), 0);
    const closedRevenue = finance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);
    const collectedRevenue = finance.reduce((sum, f) => sum + (Number(f.collected_amount) || 0), 0);
    const pendingRevenue = finance.reduce((sum, f) => sum + (Number(f.remaining_amount) || 0), 0);
    const commissionPaid = finance.reduce((sum, f) => sum + (Number(f.commission_paid) || 0), 0);

    // Commission Pipeline
    const pendingApproval = commissions.filter(c => c.status === 'Pending Approval').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const approvedPayable = commissions.filter(c => c.status === 'Approved' || c.status === 'Payable').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const paidCommissions = commissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Targets
    const revenueTargets = targets.filter(t => t.type === 'Revenue');
    const monthlyTargetValue = revenueTargets.reduce((sum, t) => sum + (Number(t.target_value) || 0), 0);
    const targetAchievedPercent = monthlyTargetValue > 0 ? (closedRevenue / monthlyTargetValue) * 100 : 0;

    // Chart Data: Pipeline Activity (last 14 days)
    const pipelineData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const leadsCount = leads.filter(l => l.created_at?.startsWith(dateStr)).length;
      const meetingsCount = meetings.filter(m => m.meeting_date === dateStr).length;
      pipelineData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Leads: leadsCount,
        Meetings: meetingsCount
      });
    }

    // Chart Data: Revenue Mix
    const serviceRevenueMap = {};
    leads.filter(l => l.stage === 'Won').forEach(lead => {
      const services = lead.services_interested || [];
      const revenueSplit = (Number(lead.expected_revenue) || 0) / (services.length || 1);
      services.forEach(s => {
        serviceRevenueMap[s] = (serviceRevenueMap[s] || 0) + revenueSplit;
      });
    });
    const revenueMixData = Object.keys(serviceRevenueMap).map(k => ({
      name: k,
      value: serviceRevenueMap[k]
    }));

    return {
      wonCount: wonLeads.length,
      lostCount: lostLeads.length,
      conversionRate,
      activeLeads: activeLeads.length,
      newLeadsMonth: newLeadsMonth.length,
      todaysMeetings: todaysMeetings.length,
      todaysFollowUps: todaysFollowUps.length,
      last7DaysMeetings: last7DaysMeetings.length,
      expectedRevenue,
      closedRevenue,
      collectedRevenue,
      pendingRevenue,
      commissionPaid,
      monthlyTargetValue,
      targetAchievedPercent,
      pipelineData,
      revenueMixData,
      pendingApproval,
      approvedPayable,
      paidCommissions
    };

  }, [leads, meetings, finance, commissions, targets, teams, agents, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#6366f1'];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Owner Dashboard</h1>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 lg:col-span-2 bg-gradient-to-br from-primary-800 to-primary-900 text-white">
          <div className="text-sm font-medium text-primary-100">Monthly Revenue Target</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold">{formatCurrency(stats.closedRevenue)}</div>
            <div className="text-sm text-primary-200">/ {formatCurrency(stats.monthlyTargetValue)}</div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-950/50">
            <div className="h-full bg-accent-500 rounded-full" style={{ width: `${Math.min(stats.targetAchievedPercent, 100)}%` }} />
          </div>
          <div className="mt-2 text-xs font-medium text-accent-400 text-right">{stats.targetAchievedPercent.toFixed(1)}% Achieved</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <div className="text-sm font-medium text-neutral-500">Wins / Losses</div>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-emerald-600">{stats.wonCount}</span>
              <span className="text-xs text-neutral-500 ml-1">WON</span>
            </div>
            <div className="h-8 w-px bg-neutral-200"></div>
            <div>
              <span className="text-2xl font-bold text-rose-600">{stats.lostCount}</span>
              <span className="text-xs text-neutral-500 ml-1">LOST</span>
            </div>
          </div>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <div className="text-sm font-medium text-neutral-500">Conversion Rate</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.conversionRate.toFixed(1)}%</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <div className="text-sm font-medium text-neutral-500">Meeting → Client</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {stats.todaysMeetings ? ((stats.wonCount / stats.todaysMeetings) * 100).toFixed(1) : 0}%
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Total Teams</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{teams.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Total Agents</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{agents.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Active Leads</div>
          <div className="mt-2 text-3xl font-bold text-primary-600">{stats.activeLeads}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">New Leads (Month)</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.newLeadsMonth}</div>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Today's Meetings</div>
          <div className="mt-2 text-3xl font-bold text-sky-600">{stats.todaysMeetings}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Today's Follow Ups</div>
          <div className="mt-2 text-3xl font-bold text-amber-500">{stats.todaysFollowUps}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Meetings (7d)</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.last7DaysMeetings}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-neutral-500">Expected Revenue</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{formatCurrency(stats.expectedRevenue)}</div>
        </Card>
      </div>

      {/* Row 4 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <div className="text-sm font-medium text-emerald-800">Closed Revenue</div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">{formatCurrency(stats.closedRevenue)}</div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="text-sm font-medium text-blue-800">Collected Revenue</div>
          <div className="mt-2 text-2xl font-bold text-blue-900">{formatCurrency(stats.collectedRevenue)}</div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-100">
          <div className="text-sm font-medium text-amber-800">Pending Revenue</div>
          <div className="mt-2 text-2xl font-bold text-amber-900">{formatCurrency(stats.pendingRevenue)}</div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-100">
          <div className="text-sm font-medium text-purple-800">Commission Paid</div>
          <div className="mt-2 text-2xl font-bold text-purple-900">{formatCurrency(stats.commissionPaid)}</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Pipeline Activity</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.pipelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="Leads" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Meetings" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Revenue Mix</h3>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            {stats.revenueMixData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.revenueMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.revenueMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral-400 text-sm">No revenue data</div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Commissions Pipeline</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
              <span className="text-sm font-medium text-neutral-600">Pending Approval</span>
              <span className="font-bold text-neutral-900">{formatCurrency(stats.pendingApproval)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
              <span className="text-sm font-medium text-neutral-600">Approved & Payable</span>
              <span className="font-bold text-neutral-900">{formatCurrency(stats.approvedPayable)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
              <span className="text-sm font-medium text-neutral-600">Paid Total</span>
              <span className="font-bold text-neutral-900">{formatCurrency(stats.paidCommissions)}</span>
            </div>
            <div className="pt-2">
              <a href="/sfms/commissions" className="text-sm font-medium text-primary-600 hover:text-primary-700">Review approvals &rarr;</a>
            </div>
          </div>
        </Card>
        
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Latest Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Team</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium text-right">Expected Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {leads.slice(0, 5).map(lead => {
                  const team = teams.find(t => t.id === lead.team_id);
                  return (
                    <tr key={lead.id} className="text-neutral-900">
                      <td className="py-3 font-medium">{lead.company_name}</td>
                      <td className="py-3 text-neutral-500">{team?.name || 'Unassigned'}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium">{formatCurrency(lead.expected_revenue)}</td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-400">No leads yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
