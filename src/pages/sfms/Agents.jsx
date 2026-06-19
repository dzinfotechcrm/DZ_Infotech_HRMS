import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, EnvelopeIcon, PhoneIcon, PencilIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { supabase } from '../../supabase/config';
import { createDocument } from '../../supabase/db';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function Agents() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  const { items: agents, loading: agentsLoading, refetch: refetchAgents } = useSupabaseCollection('sfmsAgents');
  const { items: sfmsTeamAgents, loading: sfmsTeamAgentsLoading, refetch: refetchTeamAgents } = useSupabaseCollection('sfmsTeamAgents');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: commissions, loading: commissionsLoading } = useSupabaseCollection('sfmsCommissions');
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm();

  const loading = agentsLoading || sfmsTeamAgentsLoading || teamsLoading || leadsLoading || meetingsLoading || commissionsLoading || financeLoading;

  const handleOpenModal = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      const agentTeamIds = sfmsTeamAgents.filter(ta => ta.agent_id === agent.id).map(ta => ta.team_id);
      if (agentTeamIds.length === 0 && agent.team_id) agentTeamIds.push(agent.team_id);
      
      reset({
        name: agent.name,
        phone: agent.phone || '',
        email: agent.email || '',
        city: agent.city || '',
        joining_date: agent.joining_date ? agent.joining_date.split('T')[0] : '',
        team_ids: agentTeamIds,
        status: agent.status || 'active'
      });
    } else {
      setEditingAgent(null);
      reset({ name: '', phone: '', email: '', city: '', joining_date: new Date().toISOString().split('T')[0], team_ids: [], status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Uniqueness checks
      const { data: phoneCheck } = await supabase.from('sfms_agents').select('id').eq('phone', data.phone);
      if (phoneCheck && phoneCheck.length > 0 && phoneCheck[0].id !== editingAgent?.id) {
        setError('phone', { type: 'manual', message: 'Phone number already exists' });
        setSubmitting(false);
        return;
      }

      const { data: emailCheck } = await supabase.from('sfms_agents').select('id').eq('email', data.email);
      if (emailCheck && emailCheck.length > 0 && emailCheck[0].id !== editingAgent?.id) {
        setError('email', { type: 'manual', message: 'Email already exists' });
        setSubmitting(false);
        return;
      }

      const { data: empEmailCheck } = await supabase.from('employees').select('id, role').eq('email', data.email.toLowerCase());
      let existingEmployee = null;
      if (empEmailCheck && empEmailCheck.length > 0 && empEmailCheck[0].id !== editingAgent?.id) {
        existingEmployee = empEmailCheck[0];
      }

      const team_ids = data.team_ids || [];
      const payload = { 
        name: data.name,
        phone: data.phone,
        email: data.email,
        city: data.city,
        joining_date: data.joining_date,
        status: data.status,
        team_id: team_ids[0] || null 
      };

      let currentAgentId = editingAgent?.id;

      if (editingAgent) {
        const { error } = await supabase.from('sfms_agents').update(payload).eq('id', editingAgent.id);
        if (error) throw error;
        toast.success('Agent updated successfully');
      } else {
        const payloadWithId = existingEmployee ? { ...payload, id: existingEmployee.id } : payload;
        const { data: agentData, error } = await supabase.from('sfms_agents').insert([payloadWithId]).select().single();
        if (error) throw error;
        
        if (agentData) currentAgentId = agentData.id;

        // Automatically create or link employee record for the agent so they can log in
        if (agentData) {
          try {
            if (existingEmployee) {
              if (existingEmployee.role !== 'admin') {
                await supabase.from('employees').update({ role: 'agent' }).eq('id', existingEmployee.id);
              }
            } else {
              const names = data.name.split(' ');
              const firstName = names[0] || 'Agent';
              const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

              await createDocument('employees', {
                id: agentData.id,
                first_name: firstName,
                last_name: lastName,
                email: data.email.toLowerCase(),
                role: 'agent',
                status: data.status,
                data: {
                  phone: data.phone,
                  designation: 'Field Agent',
                  employeeId: `SFMS-${Date.now().toString().slice(-4)}`
                }
              });
            }
          } catch (employeeErr) {
            console.error('Error creating/linking employee record for agent:', employeeErr);
            toast.error('Agent created, but failed to link login profile.');
          }
        }
        toast.success('Agent created successfully');
      }

      // Sync team assignments
      if (currentAgentId) {
        await supabase.from('sfms_team_agents').delete().eq('agent_id', currentAgentId);
        if (team_ids.length > 0) {
          const inserts = team_ids.map(tid => ({ agent_id: currentAgentId, team_id: tid }));
          await supabase.from('sfms_team_agents').insert(inserts);
        }
      }

      refetchAgents();
      refetchTeamAgents();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving agent');
    } finally {
      setSubmitting(false);
    }
  };

  const enrichedAgents = useMemo(() => {
    if (loading) return [];

    return agents.map(agent => {
      const agentTeamIds = sfmsTeamAgents.filter(ta => ta.agent_id === agent.id).map(ta => ta.team_id);
      if (agentTeamIds.length === 0 && agent.team_id) agentTeamIds.push(agent.team_id);
      
      const agentTeams = agentTeamIds.map(tid => teams.find(t => t.id === tid)).filter(Boolean);
      const team_name = agentTeams.map(t => t.name).join(', ') || 'Unassigned';

      // We can only approximate individual contribution by either lead assignment (if leads were assigned to agents) 
      // or by their team. In this schema, leads belong to teams, and commissions belong to agents.
      const agentCommissions = commissions.filter(c => c.agent_id === agent.id);
      const totalCommission = agentCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      // Meetings don't map directly to agents either, they map to teams. 
      // We will approximate meetings & deals to the agent if they were the team leader or divide by 2?
      // Actually, let's just show their team's performance if they are in a team.
      const teamLeads = leads.filter(l => agentTeamIds.includes(l.team_id));
      const agentMeetings = meetings.filter(m => agentTeamIds.includes(m.team_id)); // team meetings
      const deals = teamLeads.filter(l => l.stage === 'Won').length;

      const teamFinance = finance.filter(f => teamLeads.some(l => l.id === f.lead_id));
      const revenue = teamFinance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);

      // "Performance" score could be an arbitrary calculation for demo: based on conversion, max 100
      const convRate = teamLeads.length ? (deals / teamLeads.length) * 100 : 0;
      const perfScore = Math.min(convRate + (deals * 5), 100);

      return {
        ...agent,
        team_name,
        stats: {
          meetings: agentMeetings.length,
          deals,
          revenue,
          commission: totalCommission,
          perfScore
        }
      };
    });
  }, [agents, teams, leads, meetings, commissions, finance, loading]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Field Agents</h1>
          <p className="text-sm text-neutral-500">Performance, deals and commissions.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Agent</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-500">
                <th className="px-4 py-3 font-medium">AGENT</th>
                <th className="px-4 py-3 font-medium">TEAM</th>
                <th className="px-4 py-3 font-medium">CONTACT</th>
                <th className="px-4 py-3 font-medium">PERFORMANCE</th>
                <th className="px-4 py-3 font-medium">MEETINGS</th>
                <th className="px-4 py-3 font-medium">DEALS</th>
                <th className="px-4 py-3 font-medium">REVENUE</th>
                <th className="px-4 py-3 font-medium">COMMISSION</th>
                <th className="px-4 py-3 font-medium">STATUS</th>
                <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {enrichedAgents.map(agent => (
                <tr
                  key={agent.id}
                  className="hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/sfms/agents/${agent.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">{agent.name}</div>
                        <div className="text-xs text-neutral-500">{agent.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-700">{agent.team_name}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {agent.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <PhoneIcon className="h-3 w-3" /> {agent.phone}
                        </div>
                      )}
                      {agent.email && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <EnvelopeIcon className="h-3 w-3" /> {agent.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full ${agent.stats.perfScore > 60 ? 'bg-emerald-500' : agent.stats.perfScore > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${agent.stats.perfScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-600">{agent.stats.perfScore.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-700">{agent.stats.meetings}</td>
                  <td className="px-4 py-3 font-medium text-neutral-700">{agent.stats.deals}</td>
                  <td className="px-4 py-3 font-bold text-neutral-900">{formatCurrency(agent.stats.revenue)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(agent.stats.commission)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={agent.status === 'active' ? 'success' : 'neutral'}>
                      {agent.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(agent); }}
                      className="p-1.5 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      title="Edit Agent"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {enrichedAgents.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400">
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingAgent ? "Edit Agent" : "New Agent"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              {...register('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Phone must be exactly 10 digits'
                },
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                }
              })}
              type="tel"
              maxLength={10}
              error={errors.phone?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              {...register('city')}
            />
            <Input
              label="Joining Date"
              type="date"
              {...register('joining_date')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700">Assign Teams</span>
            <div className="max-h-40 overflow-y-auto border border-neutral-200 rounded-xl p-3 space-y-2 bg-white">
              {teams.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={t.id}
                    {...register('team_ids')}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{t.name}</span>
                </label>
              ))}
              {teams.length === 0 && <div className="text-sm text-neutral-500">No teams available</div>}
            </div>
            <span className="text-xs text-neutral-500">Agents can belong to multiple teams</span>
          </div>

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            {...register('status')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingAgent ? 'Update Agent' : 'Create Agent'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
