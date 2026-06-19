import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, ChartBarIcon, StarIcon } from '@heroicons/react/24/outline';
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

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function Teams() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { items: teams, loading: teamsLoading, refetch: refetchTeams } = useSupabaseCollection('sfmsTeams');
  const { items: sfmsTeamAgents, loading: sfmsTeamAgentsLoading, refetch: refetchTeamAgents } = useSupabaseCollection('sfmsTeamAgents');
  const { items: agents, loading: agentsLoading, refetch: refetchAgents } = useSupabaseCollection('sfmsAgents');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');
  const { items: targets, loading: targetsLoading } = useSupabaseCollection('sfmsTargets');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const watchAgent1 = watch('agent1_id');
  const watchAgent2 = watch('agent2_id');
  const watchAgent3 = watch('agent3_id');
  const watchAgent4 = watch('agent4_id');

  const loading = teamsLoading || sfmsTeamAgentsLoading || agentsLoading || leadsLoading || financeLoading || targetsLoading;

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      let teamAgentIds = sfmsTeamAgents.filter(ta => ta.team_id === team.id).map(ta => ta.agent_id);
      if (teamAgentIds.length === 0) {
         teamAgentIds = agents.filter(a => a.team_id === team.id).map(a => a.id);
      }
      setValue('name', team.name);
      setValue('status', team.status || 'active');
      setValue('agent1_id', teamAgentIds[0] || '');
      setValue('agent2_id', teamAgentIds[1] || '');
      setValue('agent3_id', teamAgentIds[2] || '');
      setValue('agent4_id', teamAgentIds[3] || '');
      setValue('leader_id', team.leader_id || '');
    } else {
      setEditingTeam(null);
      reset({ name: '', status: 'active', agent1_id: '', agent2_id: '', agent3_id: '', agent4_id: '', leader_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let teamId = editingTeam?.id;

      const teamPayload = {
        name: data.name,
        status: data.status,
        leader_id: data.leader_id || null
      };

      if (editingTeam) {
        const { error } = await supabase.from('sfms_teams').update(teamPayload).eq('id', teamId);
        if (error) throw error;
      } else {
        const { data: newTeam, error } = await supabase.from('sfms_teams').insert([teamPayload]).select().single();
        if (error) throw error;
        teamId = newTeam.id;
      }

      // Update team assignments
      if (editingTeam) {
        await supabase.from('sfms_team_agents').delete().eq('team_id', teamId);
      }

      const agentIdsToUpdate = [data.agent1_id, data.agent2_id, data.agent3_id, data.agent4_id].filter(Boolean);
      if (agentIdsToUpdate.length > 0) {
        const inserts = agentIdsToUpdate.map(aid => ({ team_id: teamId, agent_id: aid }));
        await supabase.from('sfms_team_agents').insert(inserts);
      }

      toast.success(`Team ${editingTeam ? 'updated' : 'created'} successfully`);
      refetchTeams();
      refetchAgents();
      refetchTeamAgents();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving team');
    } finally {
      setSubmitting(false);
    }
  };

  const enrichedTeams = useMemo(() => {
    if (loading) return [];
    return teams.map(team => {
      let teamAgentIds = sfmsTeamAgents.filter(ta => ta.team_id === team.id).map(ta => ta.agent_id);
      if (teamAgentIds.length === 0) {
         teamAgentIds = agents.filter(a => a.team_id === team.id).map(a => a.id);
      }
      const teamAgents = teamAgentIds.map(aid => agents.find(a => a.id === aid)).filter(Boolean);
      const teamLeads = leads.filter(l => l.team_id === team.id);
      const teamFinance = finance.filter(f => teamLeads.some(l => l.id === f.lead_id));

      const wins = teamLeads.filter(l => l.stage === 'Won').length;
      const totalLeads = teamLeads.length;
      const conversionRate = totalLeads ? (wins / totalLeads) * 100 : 0;
      const revenue = teamFinance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);

      const activeTargets = targets.filter(t => t.team_id === team.id && t.type === 'Revenue' && new Date(t.deadline) >= new Date());
      const currentTarget = activeTargets.length > 0 ? activeTargets[0] : null;
      const targetPercent = currentTarget && currentTarget.target_value > 0 ? (revenue / currentTarget.target_value) * 100 : 0;

      return {
        ...team,
        agents: teamAgents,
        stats: { wins, totalLeads, conversionRate, revenue },
        target: currentTarget ? { ...currentTarget, percent: Math.min(targetPercent, 100) } : null
      };
    });
  }, [teams, agents, leads, finance, targets, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  // Agents available for assignment (show all, so they can be reassigned)
  const availableAgents = agents;
  const agentOptions = availableAgents.map(a => {
    let agentTeamIds = sfmsTeamAgents.filter(ta => ta.agent_id === a.id).map(ta => ta.team_id);
    if (agentTeamIds.length === 0 && a.team_id) agentTeamIds.push(a.team_id);
    const agentTeams = agentTeamIds.map(tid => teams.find(t => t.id === tid)).filter(Boolean);
    const currentTeamNames = agentTeams.map(t => t.name).join(', ');
    const teamLabel = currentTeamNames ? ` - ${currentTeamNames}` : '';
    return { value: a.id, label: `${a.name} (${a.city})${teamLabel}` };
  });

  const leaderOptions = [
    agents.find(a => a.id === watchAgent1),
    agents.find(a => a.id === watchAgent2),
    agents.find(a => a.id === watchAgent3),
    agents.find(a => a.id === watchAgent4)
  ].filter(Boolean).map(a => ({ value: a.id, label: a.name }));

  const getDisabledFor = (currentFieldVal) => (opt) => {
    const selectedVals = [watchAgent1, watchAgent2, watchAgent3, watchAgent4].filter(Boolean).map(String);
    return selectedVals.includes(String(opt.value)) && String(opt.value) !== String(currentFieldVal);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Sales Teams</h1>
          <p className="text-sm text-neutral-500">Pairs of agents working leads together.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Team</span>
        </Button>
      </div>

      {enrichedTeams.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-white">
          <p className="text-neutral-500 font-medium">No teams found</p>
          <Button variant="outline" className="mt-4" onClick={() => handleOpenModal()}>Create your first team</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {enrichedTeams.map(team => (
            <Card key={team.id} className="flex flex-col overflow-hidden">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">{team.name}</h3>
                    <div className="text-sm text-neutral-500">{team.agents.length} agents</div>
                  </div>
                  <Badge tone={team.status === 'active' ? 'success' : 'neutral'}>
                    {team.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  {team.agents.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
                            {agent.name}
                            {team.leader_id === agent.id && <StarIcon className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="text-xs text-neutral-500">{agent.city}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {team.agents.length === 0 && <div className="text-sm text-neutral-400 py-2">No agents assigned</div>}
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-neutral-100 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">{formatCurrency(team.stats.revenue)}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Rev</div>
                  </div>
                  <div className="text-center border-l border-r border-neutral-100">
                    <div className="text-lg font-bold text-neutral-900">{team.stats.wins}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">{team.stats.conversionRate.toFixed(0)}%</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Conv</div>
                  </div>
                </div>

                {team.target ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-neutral-600">Target Progress</span>
                      <span className="font-bold text-neutral-900">{team.target.percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${team.target.percent}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 italic text-center">No active target</div>
                )}
              </div>

              <div className="bg-neutral-50 p-3 border-t border-neutral-100 flex gap-2">
                <Button variant="outline" className="flex-1 flex justify-center items-center gap-2" onClick={() => handleOpenModal(team)}>
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" className="flex-1 flex justify-center items-center gap-2 text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100">
                  <ChartBarIcon className="h-4 w-4" /> Performance
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingTeam ? 'Edit Team' : 'New Team'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Team Name"
            {...register('name', { required: 'Team name is required' })}
            error={errors.name?.message}
          />

          <Select
            label="Agent 1"
            options={[
              { value: '', label: 'Select an agent...' },
              ...agentOptions.map(opt => ({
                ...opt,
                disabled: getDisabledFor(watchAgent1)(opt)
              }))
            ]}
            {...register('agent1_id', { required: 'Agent 1 is required' })}
            value={watchAgent1}
            error={errors.agent1_id?.message}
          />

          <Select
            label="Agent 2"
            options={[
              { value: '', label: 'Select an agent...' },
              ...agentOptions.map(opt => ({
                ...opt,
                disabled: getDisabledFor(watchAgent2)(opt)
              }))
            ]}
            {...register('agent2_id', { required: 'Agent 2 is required' })}
            value={watchAgent2}
            error={errors.agent2_id?.message}
          />

          <Select
            label="Agent 3 (Optional)"
            options={[
              { value: '', label: 'Select an agent...' },
              ...agentOptions.map(opt => ({
                ...opt,
                disabled: getDisabledFor(watchAgent3)(opt)
              }))
            ]}
            {...register('agent3_id')}
            value={watchAgent3}
          />

          <Select
            label="Agent 4 (Optional)"
            options={[
              { value: '', label: 'Select an agent...' },
              ...agentOptions.map(opt => ({
                ...opt,
                disabled: getDisabledFor(watchAgent4)(opt)
              }))
            ]}
            {...register('agent4_id')}
            value={watchAgent4}
          />

          <Select
            label="Team Leader"
            options={[{ value: '', label: 'Select leader...' }, ...leaderOptions]}
            {...register('leader_id')}
            value={watch('leader_id')}
            disabled={leaderOptions.length === 0}
            helpText="Only selected agents can be the leader"
          />

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            {...register('status')}
            value={watch('status')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              {editingTeam ? 'Save Changes' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
