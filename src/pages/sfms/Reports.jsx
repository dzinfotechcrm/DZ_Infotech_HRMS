import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { supabase } from '../../supabase/config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

const COLORS = ['#f43f5e', '#f97316', '#eab308', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];

export default function Reports() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { items: dailyReports, loading: reportsLoading, refetch: refetchReports } = useSupabaseCollection('sfmsDailyReports');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');

  const { register, handleSubmit, reset } = useForm();

  const loading = reportsLoading || leadsLoading || teamsLoading || agentsLoading || meetingsLoading || financeLoading || commissionsLoading;

  const handleOpenModal = () => {
    reset({ report_date: new Date().toISOString().split('T')[0], team_id: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        meetings_completed: Number(data.meetings_completed) || 0,
        interested_leads: Number(data.interested_leads) || 0,
        very_interested_leads: Number(data.very_interested_leads) || 0,
        follow_ups_scheduled: Number(data.follow_ups_scheduled) || 0,
        expected_revenue: Number(data.expected_revenue) || 0
      };
      
      const { error } = await supabase.from('sfms_daily_reports').insert([payload]);
      if (error) throw error;

      toast.success('Daily report submitted');
      refetchReports();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error('Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const lossAnalysisData = useMemo(() => {
    const counts = {};
    leads.filter(l => l.stage === 'Lost' && l.lost_reason).forEach(l => {
      counts[l.lost_reason] = (counts[l.lost_reason] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const serviceDemandData = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      if (l.services_interested) {
        l.services_interested.forEach(s => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] })).sort((a, b) => a.count - b.count); // Ascending for horizontal bar
  }, [leads]);

  const agentPerformanceData = useMemo(() => {
    return agents.map(agent => {
      const agentCommissions = commissions.filter(c => c.agent_id === agent.id);
      const rev = agentCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) * 10; // Approx back to revenue (since comms = 10%)
      
      return {
        name: agent.name.split(' ')[0],
        Revenue: rev
      };
    }).sort((a, b) => b.Revenue - a.Revenue).slice(0, 10);
  }, [agents, commissions]);

  const teamPerformance = useMemo(() => {
    return teams.map(team => {
      const teamLeads = leads.filter(l => l.team_id === team.id);
      const teamMeetings = meetings.filter(m => m.team_id === team.id);
      const teamFinance = finance.filter(f => teamLeads.some(l => l.id === f.lead_id));
      
      const leadsAssigned = teamLeads.length;
      const wins = teamLeads.filter(l => l.stage === 'Won').length;
      const losses = teamLeads.filter(l => l.stage === 'Lost').length;
      const conv = leadsAssigned ? (wins / leadsAssigned) * 100 : 0;
      const rev = teamFinance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);
      
      return {
        id: team.id,
        name: team.name,
        leadsAssigned,
        meetings: teamMeetings.length,
        wins,
        losses,
        revenue: rev,
        conversionRate: conv
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [teams, leads, meetings, finance]);

  const latestReports = useMemo(() => {
    return [...dailyReports].sort((a, b) => new Date(b.report_date) - new Date(a.report_date)).slice(0, 10).map(r => ({
      ...r,
      team_name: teams.find(t => t.id === r.team_id)?.name || 'Unknown'
    }));
  }, [dailyReports, teams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));

  return (
    <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Reports</h1>
          <p className="text-sm text-neutral-500">Performance, demand, and loss analysis.</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Loss Analysis</h3>
          <div className="h-[300px] w-full">
            {lossAnalysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lossAnalysisData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {lossAnalysisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">No lost deals recorded.</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Service Demand</h3>
          <div className="h-[300px] w-full">
            {serviceDemandData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceDemandData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e5e5" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} width={100} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">No service demand data.</div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Agent Performance (Est. Revenue Gen)</h3>
        <div className="h-[300px] w-full">
          {agentPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} tickFormatter={formatCurrency} />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">No agent performance data.</div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-neutral-900">Daily Sales Reports</h3>
          <Button size="sm" onClick={handleOpenModal}>
            <PlusIcon className="h-4 w-4 mr-2" /> Submit Daily Report
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-500 border-b border-neutral-100">
                <th className="px-6 py-3 font-medium">DATE</th>
                <th className="px-6 py-3 font-medium">TEAM</th>
                <th className="px-6 py-3 font-medium text-center">MEETINGS</th>
                <th className="px-6 py-3 font-medium text-center">INTERESTED</th>
                <th className="px-6 py-3 font-medium text-center">VERY INT.</th>
                <th className="px-6 py-3 font-medium text-center">FOLLOW UPS</th>
                <th className="px-6 py-3 font-medium text-right">EXPECTED REV</th>
                <th className="px-6 py-3 font-medium">PLAN FOR TOMORROW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {latestReports.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-3 text-neutral-600">{new Date(r.report_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-medium text-neutral-900">{r.team_name}</td>
                  <td className="px-6 py-3 text-center font-medium">{r.meetings_completed}</td>
                  <td className="px-6 py-3 text-center text-amber-600 font-medium">{r.interested_leads}</td>
                  <td className="px-6 py-3 text-center text-emerald-600 font-medium">{r.very_interested_leads}</td>
                  <td className="px-6 py-3 text-center text-primary-600 font-medium">{r.follow_ups_scheduled}</td>
                  <td className="px-6 py-3 text-right font-bold text-neutral-900">{formatCurrency(r.expected_revenue)}</td>
                  <td className="px-6 py-3 max-w-xs truncate text-neutral-500" title={r.tomorrows_plan}>{r.tomorrows_plan}</td>
                </tr>
              ))}
              {latestReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-neutral-400">No daily reports submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-900">Team Performance Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-500 border-b border-neutral-100">
                <th className="px-6 py-3 font-medium">TEAM</th>
                <th className="px-6 py-3 font-medium text-center">LEADS ASSIGNED</th>
                <th className="px-6 py-3 font-medium text-center">MEETINGS</th>
                <th className="px-6 py-3 font-medium text-center">WINS</th>
                <th className="px-6 py-3 font-medium text-center">LOSSES</th>
                <th className="px-6 py-3 font-medium text-right">REVENUE</th>
                <th className="px-6 py-3 font-medium text-right">CONV %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {teamPerformance.map(t => (
                <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-neutral-900">{t.name}</td>
                  <td className="px-6 py-4 text-center font-medium text-neutral-700">{t.leadsAssigned}</td>
                  <td className="px-6 py-4 text-center font-medium text-neutral-700">{t.meetings}</td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-600">{t.wins}</td>
                  <td className="px-6 py-4 text-center font-bold text-rose-600">{t.losses}</td>
                  <td className="px-6 py-4 text-right font-bold text-neutral-900">{formatCurrency(t.revenue)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${t.conversionRate > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                      {t.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={isModalOpen} onClose={handleCloseModal} title="Submit Daily Report" className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" {...register('report_date', { required: true })} />
            <Select
              label="Team"
              options={[{ value: '', label: 'Select team...' }, ...teamOptions]}
              {...register('team_id', { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Meetings Completed" type="number" {...register('meetings_completed')} />
            <Input label="Follow Ups Scheduled" type="number" {...register('follow_ups_scheduled')} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Interested Leads" type="number" {...register('interested_leads')} />
            <Input label="Very Interested Leads" type="number" {...register('very_interested_leads')} />
            <Input label="Expected Rev (₹)" type="number" {...register('expected_revenue')} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Challenges Faced</label>
            <textarea
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              rows={2}
              {...register('challenges_faced')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Plan for Tomorrow</label>
            <textarea
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              rows={2}
              {...register('tomorrows_plan', { required: true })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Report</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
