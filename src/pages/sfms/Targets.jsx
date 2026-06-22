import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/outline';
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

export default function Targets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { items: targets, loading: targetsLoading, refetch: refetchTargets } = useSupabaseCollection('sfmsTargets');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: leads, loading: leadsLoading } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');
  const { items: finance, loading: financeLoading } = useSupabaseCollection('sfmsFinance');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  
  const loading = targetsLoading || teamsLoading || agentsLoading || leadsLoading || meetingsLoading || financeLoading;

  const durationDays = watch('duration_days');
  const startDate = watch('start_date');

  // Auto calculate deadline
  React.useEffect(() => {
    if (startDate && durationDays) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + Number(durationDays));
      setValue('deadline', start.toISOString().split('T')[0]);
    }
  }, [startDate, durationDays, setValue]);

  const handleOpenModal = () => {
    reset({ assignee: '', type: 'Revenue', target_value: '', duration_days: '30', start_date: new Date().toISOString().split('T')[0], deadline: '', bonus_amount: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let team_id = null;
      let agent_id = null;
      if (data.assignee?.startsWith('team_')) {
        team_id = data.assignee.replace('team_', '');
      } else if (data.assignee?.startsWith('agent_')) {
        agent_id = data.assignee.replace('agent_', '');
      }

      const payload = {
        team_id,
        agent_id,
        type: data.type,
        target_value: Number(data.target_value) || 0,
        duration_days: Number(data.duration_days) || 0,
        bonus_amount: Number(data.bonus_amount) || 0,
        start_date: data.start_date,
        deadline: data.deadline,
      };
      
      const { error } = await supabase.from('sfms_targets').insert([payload]);
      if (error) throw error;

      toast.success('Target created successfully');
      refetchTargets();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error('Error saving target');
    } finally {
      setSubmitting(false);
    }
  };

  const enrichedTargets = useMemo(() => {
    if (loading) return [];
    
    const today = new Date();
    
    return targets.map(target => {
      const team = teams.find(t => t.id === target.team_id);
      const agent = agents.find(a => a.id === target.agent_id);
      const assigneeName = agent ? agent.name : (team ? team.name : 'Unassigned');
      
      const targetLeads = leads.filter(l => 
        ((target.team_id && l.team_id === target.team_id) || (target.agent_id && l.agent_id === target.agent_id)) 
        && new Date(l.created_at) >= new Date(target.start_date)
      );
      const targetMeetings = meetings.filter(m => 
        ((target.team_id && m.team_id === target.team_id) || (target.agent_id && m.agent_id === target.agent_id)) 
        && new Date(m.meeting_date) >= new Date(target.start_date)
      );
      const targetFinance = finance.filter(f => targetLeads.some(l => l.id === f.lead_id));
      
      let currentValue = 0;
      if (target.type === 'Revenue') {
        currentValue = targetFinance.reduce((sum, f) => sum + (Number(f.project_value) || 0), 0);
      } else if (target.type === 'Client') {
        currentValue = targetLeads.filter(l => l.stage === 'Won').length;
      } else if (target.type === 'Meeting') {
        currentValue = targetMeetings.length;
      }

      const progressPercent = target.target_value > 0 ? (currentValue / target.target_value) * 100 : 0;
      
      // Time calculations
      const start = new Date(target.start_date);
      const deadline = new Date(target.deadline);
      const totalTimeMs = deadline - start;
      const elapsedTimeMs = today - start;
      const timePercent = Math.max(0, Math.min(100, (elapsedTimeMs / totalTimeMs) * 100));
      
      const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      
      // Bonus logic (First 50% of duration)
      let bonusStatus = '';
      if (progressPercent >= 100) {
        if (timePercent <= 50) {
          bonusStatus = 'Bonus Eligible!';
        } else {
          bonusStatus = 'Target Hit (Bonus Missed)';
        }
      } else {
        if (timePercent <= 50) {
          bonusStatus = 'Bonus window open — hit 100% to unlock.';
        } else {
          bonusStatus = 'Bonus window closed (past 50% of duration).';
        }
      }

      return {
        ...target,
        assigneeName,
        currentValue,
        progressPercent: Math.min(progressPercent, 100),
        daysLeft,
        timePercent,
        bonusStatus
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [targets, teams, agents, leads, meetings, finance, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const teamOptions = teams.map(t => ({ value: `team_${t.id}`, label: `Team: ${t.name}` }));
  const agentOptions = agents.map(a => ({ value: `agent_${a.id}`, label: `Agent: ${a.name}` }));
  const combinedOptions = [...teamOptions, ...agentOptions];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Targets & Bonuses</h1>
          <p className="text-sm text-neutral-500">Hit targets in the first half of the duration to unlock the bonus.</p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Target</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {enrichedTargets.map(target => {
          const isTargetMet = target.progressPercent >= 100;
          const isBonusEligible = target.bonusStatus === 'Bonus Eligible!';
          const isBonusMissed = target.bonusStatus === 'Target Hit (Bonus Missed)';
          const isExpired = target.daysLeft < 0 && !isTargetMet;

          return (
            <Card key={target.id} className={`flex flex-col overflow-hidden border-2 ${isBonusEligible ? 'border-amber-400' : isTargetMet ? 'border-emerald-500' : isExpired ? 'border-rose-200 opacity-75' : 'border-transparent'}`}>
              <div className={`p-4 border-b border-neutral-100 flex justify-between items-center ${isBonusEligible ? 'bg-amber-50' : isTargetMet ? 'bg-emerald-50' : 'bg-neutral-50/50'}`}>
                <div className="flex items-center gap-2">
                  <Badge tone={target.type === 'Revenue' ? 'success' : target.type === 'Client' ? 'accent' : 'neutral'}>
                    {target.type} Target
                  </Badge>
                  {isBonusEligible && <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><TrophyIcon className="h-4 w-4" /> WON</span>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-neutral-900">{target.assigneeName}</div>
                  <div className="text-xs text-neutral-500">{target.duration_days} days</div>
                </div>
              </div>

              <div className="p-5 flex-1 space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-neutral-500">Progress</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-neutral-900">
                        {target.type === 'Revenue' ? formatCurrency(target.currentValue) : target.currentValue}
                      </span>
                      <span className="text-sm text-neutral-500 ml-1">
                        / {target.type === 'Revenue' ? formatCurrency(target.target_value) : target.target_value}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isTargetMet ? 'bg-emerald-500' : 'bg-primary-500'}`} 
                      style={{ width: `${target.progressPercent}%` }} 
                    />
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-neutral-300 z-10" title="50% Bonus Mark"></div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs font-bold">
                    <span className="text-primary-600">{target.progressPercent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Time</div>
                    <div className={`font-bold ${target.daysLeft < 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
                      {target.daysLeft < 0 ? 'Expired' : `${target.daysLeft} days left`}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">Ends {new Date(target.deadline).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Bonus</div>
                    <div className="font-bold text-amber-600 flex items-center gap-1">
                      <FireIcon className="h-4 w-4" /> {formatCurrency(target.bonus_amount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-3 text-xs font-medium text-center border-t border-neutral-100 ${
                isBonusEligible ? 'bg-amber-100 text-amber-800' : 
                isTargetMet ? 'bg-emerald-50 text-emerald-700' : 
                target.timePercent <= 50 ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {target.bonusStatus}
              </div>
            </Card>
          );
        })}
        {enrichedTargets.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
            No targets set yet.
          </div>
        )}
      </div>

      <Modal open={isModalOpen} onClose={handleCloseModal} title="Set New Target">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Assign To"
            options={[{ value: '', label: 'Select team or agent...' }, ...combinedOptions]}
            {...register('assignee', { required: 'Please select a team or agent' })}
            error={errors.assignee?.message}
          />

          <Select
            label="Target Type"
            options={[
              { value: 'Revenue', label: 'Revenue Target' },
              { value: 'Client', label: 'New Clients Target' },
              { value: 'Meeting', label: 'Meetings Completed Target' }
            ]}
            {...register('type')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Value"
              type="number"
              {...register('target_value', { required: true })}
            />
            <Input
              label="Bonus Amount (₹)"
              type="number"
              {...register('bonus_amount')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Duration"
              options={[
                { value: '10', label: '10 Days' },
                { value: '15', label: '15 Days' },
                { value: '30', label: '30 Days' },
                { value: '60', label: '60 Days' },
                { value: '90', label: '90 Days' }
              ]}
              {...register('duration_days')}
              value={durationDays}
              onChange={(e) => {
                setValue('duration_days', e.target.value, { shouldValidate: true });
              }}
            />
            <Input
              label="Start Date"
              type="date"
              {...register('start_date', { required: true })}
            />
          </div>
          
          <Input
            label="Deadline (Auto-calculated)"
            type="date"
            {...register('deadline')}
            readOnly
            className="bg-neutral-50 text-neutral-500"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>Set Target</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
