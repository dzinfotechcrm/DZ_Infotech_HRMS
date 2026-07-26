import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import { useSupabaseCollection } from '../../../hooks/useSupabase';
import { supabase } from '../../../supabase/config';
import { useAuth } from '../../../hooks/useAuth';
import SfmsLeadsBoard from '../../../components/sfms/SfmsLeadsBoard';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

const SERVICES_LIST = [
  'Static Website', 'Dynamic Website', 'Ecommerce Website',
  'CRM', 'ERP', 'AI Chatbot', 'AI Automation', 'Whatsapp API', 'ConTrack'
];

const STAGES = ['Assigned', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const getStageTone = (stage) => {
  if (stage === 'Won') return 'success';
  if (stage === 'Lost') return 'danger';
  if (stage === 'Assigned') return 'neutral';
  return 'accent';
};

const getInterestTone = (interest) => {
  if (interest === 'Very Interested') return 'success';
  if (interest === 'Interested') return 'accent';
  return 'neutral';
};

export default function MyLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: sfmsTeamAgents, loading: sfmsTeamAgentsLoading } = useSupabaseCollection('sfmsTeamAgents');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: leads, loading: leadsLoading, refetch: refetchLeads } = useSupabaseCollection('sfmsLeads');
  const { items: meetings, loading: meetingsLoading } = useSupabaseCollection('sfmsMeetings');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  const selectedServices = watch('services_interested') || [];
  const watchedStage = watch('stage');
  const watchedSource = watch('lead_source');
  const watchedAssignTo = watch('assign_to');

  const handleToggleService = (service) => {
    if (selectedServices.includes(service)) {
      setValue('services_interested', selectedServices.filter(s => s !== service));
    } else {
      setValue('services_interested', [...selectedServices, service]);
    }
  };

  const loading = leadsLoading || agentsLoading || sfmsTeamAgentsLoading || teamsLoading || meetingsLoading;

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

  const handleOpenModal = (lead = null) => {
    if (lead && lead.id) {
      setEditingLeadId(lead.id);
      reset({
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.address || '',
        industry: lead.industry || '',
        lead_source: lead.lead_source || '',
        expected_revenue: lead.expected_revenue || '',
        assign_to: lead.agent_id ? `agent_${lead.agent_id}` : (lead.team_id ? `team_${lead.team_id}` : ''),
        services_interested: lead.services_interested || [],
        notes: lead.notes || '',
        stage: lead.stage || 'Assigned'
      });
    } else {
      setEditingLeadId(null);
      reset({
        company_name: '', contact_person: '', phone: '', email: '',
        address: '', industry: '', lead_source: '', expected_revenue: '',
        services_interested: [], notes: '', assign_to: agentTeamIds.length > 0 ? `team_${agentTeamIds[0]}` : `agent_${agentData.id}`,
        stage: 'Assigned'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLeadId(null);
    reset();
  };

  const onSubmit = async (data) => {
    if (agentTeamIds.length === 0) {
      toast.error('You must be assigned to a team to create leads.');
      return;
    }

    setSubmitting(true);
    try {
      let team_id = null;
      let agent_id = null;
      if (data.assign_to?.startsWith('team_')) team_id = data.assign_to.replace('team_', '');
      if (data.assign_to?.startsWith('agent_')) agent_id = data.assign_to.replace('agent_', '');

      const payload = {
        ...data,
        team_id,
        agent_id,
        expected_revenue: Number(data.expected_revenue) || 0
      };
      delete payload.assign_to;

      if (editingLeadId) {
        const { error } = await supabase.from('sfms_leads').update(payload).eq('id', editingLeadId);
        if (error) throw error;
        toast.success('Lead updated successfully');
      } else {
        const { data: newLead, error } = await supabase.from('sfms_leads').insert([payload]).select().single();
        if (error) throw error;

        // Log timeline
        await supabase.from('sfms_lead_timeline').insert([{
          lead_id: newLead.id,
          stage: data.stage || 'Assigned',
          changed_by: agentData.name || 'System'
        }]);
        toast.success('Lead created successfully');
      }

      refetchLeads();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving lead');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (loading || agentTeamIds.length === 0) return [];
    return leads.filter(l => agentTeamIds.includes(l.team_id) || l.agent_id === agentData.id);
  }, [leads, agentTeamIds, agentData, loading]);

  const handleStageChange = async (leadId, newStage) => {
    try {
      await supabase.from('sfms_leads').update({ stage: newStage }).eq('id', leadId);
      
      // Log timeline
      await supabase.from('sfms_lead_timeline').insert([{
        lead_id: leadId,
        stage: newStage,
        changed_by: agentData?.name || 'System (Kanban)'
      }]);
      
      toast.success(`Moved to ${newStage}`);
      refetchLeads();
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Team Assigned</h2>
          <p className="text-neutral-500">You must be assigned to a field sales team to view leads.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SfmsLeadsBoard 
        leads={filteredLeads}
        teams={teams}
        agents={agents}
        meetings={meetings}
        onLeadClick={handleOpenModal}
        onNewLead={() => handleOpenModal()}
        onStageChange={handleStageChange}
      />

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingLeadId ? "Edit Lead" : "New Lead"} className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Select
              label="Assign To"
              options={[
                ...agentTeamIds.map(tid => {
                  const t = teams.find(team => team.id === tid);
                  return { value: `team_${tid}`, label: `Team: ${t?.name || 'Unknown Team'}` };
                }),
                ...agents.map(a => ({ value: `agent_${a.id}`, label: `Agent: ${a.name}` }))
              ]}
              {...register('assign_to', { required: 'Assignee is required' })}
              defaultValue={agentTeamIds.length > 0 ? `team_${agentTeamIds[0]}` : `agent_${agentData.id}`}
              error={errors.assign_to?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              {...register('company_name', { required: 'Company is required' })}
              error={errors.company_name?.message}
            />
            <Input
              label="Contact Person"
              {...register('contact_person', { required: 'Contact person is required' })}
              error={errors.contact_person?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              {...register('phone', { required: 'Phone is required' })}
              error={errors.phone?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
          </div>

          <Input
            label="Address"
            {...register('address', { required: 'Address is required' })}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Industry"
              {...register('industry', { required: 'Industry is required' })}
              error={errors.industry?.message}
            />
            <Select
              label="Lead Source"
              options={[
                { value: '', label: 'Select source...' },
                { value: 'Inbound', label: 'Inbound' },
                { value: 'Outbound', label: 'Outbound' },
                { value: 'Referral', label: 'Referral' },
                { value: 'Website', label: 'Website' },
                { value: 'Social Media', label: 'Social Media' }
              ]}
              value={watchedSource}
              {...register('lead_source', { required: 'Source is required' })}
              error={errors.lead_source?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Lead Status"
              options={STAGES.map(s => ({ value: s, label: s }))}
              value={watchedStage}
              {...register('stage', { required: 'Status is required' })}
              error={errors.stage?.message}
            />
            <Input
              label="Expected Rev (₹)"
              type="number"
              {...register('expected_revenue', { required: 'Expected revenue is required', min: { value: 0, message: 'Must be positive' } })}
              error={errors.expected_revenue?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Services Interested</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES_LIST.map(service => {
                const isSelected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleToggleService(service)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${isSelected
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
            <textarea
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              rows={3}
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingLeadId ? "Update Lead" : "Create Lead"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
