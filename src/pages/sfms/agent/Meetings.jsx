import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
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

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function Meetings() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: meetings, loading: meetingsLoading, refetch: refetchMeetings } = useSupabaseCollection('sfmsMeetings');
  const { items: leads, loading: leadsLoading, refetch: refetchLeads } = useSupabaseCollection('sfmsLeads');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loading = meetingsLoading || leadsLoading || agentsLoading;

  const agentData = useMemo(() => {
    if (loading || !user?.email) return null;
    return agents.find(a => a.email?.toLowerCase() === user.email?.toLowerCase());
  }, [agents, user, loading]);

  const handleOpenModal = () => {
    reset({ meeting_date: new Date().toISOString().split('T')[0], lead_id: '', person_met: '', designation: '', phone: '', email: '', discussion_summary: '', quotation_amount: '', negotiated_amount: '', outcome: 'Interested', follow_up_date: '', services_discussed: '' });
    setSelectedMeeting(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleViewMeeting = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const onSubmit = async (data) => {
    if (!agentData || !agentData.team_id) {
      toast.error('You must be assigned to a team to log meetings.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedLead = leads.find(l => l.id === data.lead_id);
      
      const payload = {
        ...data,
        team_id: agentData.team_id,
        services_discussed: data.services_discussed ? data.services_discussed.split(',').map(s => s.trim()) : [],
        quotation_amount: Number(data.quotation_amount) || 0,
        negotiated_amount: Number(data.negotiated_amount) || 0
      };
      
      const { error } = await supabase.from('sfms_meetings').insert([payload]);
      if (error) throw error;
      
      // Update lead interest level
      await supabase.from('sfms_leads').update({ interest_level: data.outcome }).eq('id', data.lead_id);
      
      // Auto move stage if it was scheduled
      if (selectedLead && selectedLead.stage === 'Meeting Scheduled') {
        await supabase.from('sfms_leads').update({ stage: 'Meeting Completed' }).eq('id', data.lead_id);
        await supabase.from('sfms_lead_timeline').insert([{ lead_id: data.lead_id, stage: 'Meeting Completed', changed_by: agentData.name || 'System' }]);
      }

      toast.success('Meeting logged successfully');
      refetchMeetings();
      refetchLeads();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error('Error adding meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const enrichedMeetings = useMemo(() => {
    if (loading || !agentData) return [];
    
    const teamMeetings = meetings.filter(m => m.team_id === agentData.team_id);
    
    return teamMeetings.sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date)).map(m => {
      const lead = leads.find(l => l.id === m.lead_id);
      return {
        ...m,
        lead_name: lead?.company_name || 'Unknown Lead',
      };
    });
  }, [meetings, leads, agentData, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!agentData || !agentData.team_id) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center text-neutral-500">
          You are not assigned to any team. Contact your administrator to view meetings.
        </Card>
      </div>
    );
  }

  // Only allow logging meetings for leads in the agent's team
  const teamLeads = leads.filter(l => l.team_id === agentData.team_id);
  const leadOptions = teamLeads.map(l => ({ value: l.id, label: l.company_name }));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">My Team Meetings</h1>
          <p className="text-sm text-neutral-500">Meetings conducted by your team.</p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>Log Meeting</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-500">
                <th className="px-4 py-3 font-medium">DATE</th>
                <th className="px-4 py-3 font-medium">COMPANY</th>
                <th className="px-4 py-3 font-medium">PERSON</th>
                <th className="px-4 py-3 font-medium text-right">QUOTED</th>
                <th className="px-4 py-3 font-medium text-right">NEGOTIATED</th>
                <th className="px-4 py-3 font-medium">OUTCOME</th>
                <th className="px-4 py-3 font-medium">FOLLOW UP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {enrichedMeetings.map(meeting => (
                <tr 
                  key={meeting.id} 
                  className="hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  onClick={() => handleViewMeeting(meeting)}
                >
                  <td className="px-4 py-3 text-neutral-600 font-medium whitespace-nowrap">
                    {new Date(meeting.meeting_date).toLocaleDateString()}
                    <div className="text-xs font-normal">{meeting.meeting_time}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900">{meeting.lead_name}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{meeting.person_met}</div>
                    <div className="text-xs text-neutral-500">{meeting.designation}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">{formatCurrency(meeting.quotation_amount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary-600">{formatCurrency(meeting.negotiated_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={meeting.outcome === 'Very Interested' ? 'success' : meeting.outcome === 'Interested' ? 'accent' : 'neutral'}>
                      {meeting.outcome}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    {meeting.follow_up_date ? new Date(meeting.follow_up_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {enrichedMeetings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    No meetings found for your team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Meeting Modal */}
      <Modal open={isModalOpen} onClose={handleCloseModal} title="Log New Meeting" className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Lead / Company"
            options={[{ value: '', label: 'Select lead...' }, ...leadOptions]}
            {...register('lead_id', { required: 'Please select a lead' })}
            error={errors.lead_id?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" {...register('meeting_date', { required: true })} />
            <Input label="Time" type="time" {...register('meeting_time')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Person Met" {...register('person_met', { required: true })} />
            <Input label="Designation" {...register('designation')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Discussion Summary</label>
            <textarea
              className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              rows={3}
              {...register('discussion_summary')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Quotation Amount (₹)" type="number" {...register('quotation_amount')} />
            <Input label="Negotiated Amount (₹)" type="number" {...register('negotiated_amount')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Outcome / Interest"
              options={[
                { value: 'Very Interested', label: 'Very Interested' },
                { value: 'Interested', label: 'Interested' },
                { value: 'Not Interested', label: 'Not Interested' }
              ]}
              {...register('outcome', { required: true })}
            />
            <Input label="Follow-Up Date" type="date" {...register('follow_up_date')} />
          </div>

          <Input label="Services Discussed (comma separated)" placeholder="e.g. CRM, ERP" {...register('services_discussed')} />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Meeting</Button>
          </div>
        </form>
      </Modal>

      {/* View Meeting Modal */}
      <Modal open={!!selectedMeeting} onClose={() => setSelectedMeeting(null)} title="Meeting Details" className="max-w-2xl">
        {selectedMeeting && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{selectedMeeting.lead_name}</h3>
                <p className="text-sm text-neutral-500">{new Date(selectedMeeting.meeting_date).toLocaleDateString()} at {selectedMeeting.meeting_time}</p>
              </div>
              <Badge tone={selectedMeeting.outcome === 'Very Interested' ? 'success' : selectedMeeting.outcome === 'Interested' ? 'accent' : 'neutral'}>
                {selectedMeeting.outcome}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
              <div>
                <span className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">Person Met</span>
                <span className="block text-sm font-bold text-neutral-900">{selectedMeeting.person_met} <span className="font-normal text-neutral-500">({selectedMeeting.designation})</span></span>
              </div>
              <div>
                <span className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</span>
                <span className="block text-sm font-medium text-neutral-900">{selectedMeeting.phone || '-'}</span>
                <span className="block text-sm text-neutral-500">{selectedMeeting.email || '-'}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Discussion Summary</span>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedMeeting.discussion_summary || 'No summary provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Financials</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Quoted:</span>
                    <span className="font-medium text-neutral-900">{formatCurrency(selectedMeeting.quotation_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Negotiated:</span>
                    <span className="font-bold text-primary-600">{formatCurrency(selectedMeeting.negotiated_amount)}</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Next Steps</span>
                <div className="text-sm font-medium text-neutral-900">
                  Follow Up: {selectedMeeting.follow_up_date ? new Date(selectedMeeting.follow_up_date).toLocaleDateString() : 'Not scheduled'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <Button onClick={() => setSelectedMeeting(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
