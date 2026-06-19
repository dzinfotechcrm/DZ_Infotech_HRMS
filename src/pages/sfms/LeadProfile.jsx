import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useSupabaseDocument, useSupabaseCollection } from '../../hooks/useSupabase';
import { supabase } from '../../supabase/config';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

const STAGES = ['Assigned', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const LOST_REASONS = ['Budget Issue', 'Already Has Provider', 'No Requirement', 'No Response', 'Competitor Selected', 'Follow Up Later', 'Decision Delayed', 'Other'];

export default function LeadProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  
  const { item: lead, loading: leadLoading, refetch: refetchLead } = useSupabaseDocument('sfms_leads', id);
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');
  const { items: meetings, loading: meetingsLoading, refetch: refetchMeetings } = useSupabaseCollection('sfmsMeetings');
  const { items: timeline, loading: timelineLoading, refetch: refetchTimeline } = useSupabaseCollection('sfmsLeadTimeline');
  const { items: agents } = useSupabaseCollection('sfmsAgents');

  const { register: registerLost, handleSubmit: handleLostSubmit } = useForm();
  const { register: registerWon, handleSubmit: handleWonSubmit } = useForm();
  const { register: registerMeeting, handleSubmit: handleMeetingSubmit, reset: resetMeeting } = useForm();
  
  const [interestLevel, setInterestLevel] = useState('');

  const loading = leadLoading || teamsLoading || meetingsLoading || timelineLoading;

  const currentStageIndex = STAGES.indexOf(lead?.stage || 'Assigned');

  const handleStageChange = async (newStage) => {
    if (newStage === 'Lost') {
      setIsLostModalOpen(true);
      return;
    }
    if (newStage === 'Won') {
      setIsWonModalOpen(true);
      return;
    }
    
    await updateStage(newStage);
  };

  const updateStage = async (newStage, additionalData = {}) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sfms_leads').update({ stage: newStage, ...additionalData }).eq('id', id);
      if (error) throw error;
      
      await supabase.from('sfms_lead_timeline').insert([{
        lead_id: id,
        stage: newStage,
        changed_by: 'User'
      }]);
      
      toast.success(`Stage updated to ${newStage}`);
      refetchLead();
      refetchTimeline();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stage');
    } finally {
      setSubmitting(false);
      setIsLostModalOpen(false);
    }
  };

  const onLostSubmit = (data) => {
    updateStage('Lost', { lost_reason: data.reason });
  };

  const onWonSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (data.advance_paid === 'yes') {
        // Create client + project + finance + commissions
        // Note: For simplicity and speed in this demo, we'll assume the tables exist as specified
        
        // 1. Convert Lead
        await supabase.from('sfms_leads').update({ stage: 'Won', advance_paid: true, closed_by: data.closed_by }).eq('id', id);
        await supabase.from('sfms_lead_timeline').insert([{ lead_id: id, stage: 'Won', changed_by: 'User' }]);

        // 2. Finance Entry
        const projectValue = Number(data.project_value) || 0;
        const advanceReceived = Number(data.advance_received) || 0;
        const remainingAmount = projectValue - advanceReceived;
        
        await supabase.from('sfms_finance').insert([{
          lead_id: id,
          project_value: projectValue,
          advance_received: advanceReceived,
          remaining_amount: remainingAmount,
          collected_amount: advanceReceived,
        }]);

        // 3. Commissions Entry
        if (data.closed_by === 'Team' && lead.team_id) {
          const teamAgents = agents.filter(a => a.team_id === lead.team_id);
          if (teamAgents.length > 0) {
            const commissionAmount = (advanceReceived * 0.1) / teamAgents.length;
            const commissionEntries = teamAgents.map(a => ({
              lead_id: id,
              agent_id: a.id,
              type: 'Advance',
              amount: commissionAmount,
              status: 'Generated'
            }));
            await supabase.from('sfms_commissions').insert(commissionEntries);
          }
        } else if (data.closed_by === 'Founder' && lead.team_id) {
          const teamAgents = agents.filter(a => a.team_id === lead.team_id);
          if (teamAgents.length > 0) {
            const commissionAmount = (projectValue * 0.1) / teamAgents.length;
            const commissionEntries = teamAgents.map(a => ({
              lead_id: id,
              agent_id: a.id,
              type: 'Final',
              amount: commissionAmount,
              status: 'Generated'
            }));
            await supabase.from('sfms_commissions').insert(commissionEntries);
          }
        }

        toast.success('Lead won and converted successfully!');
      } else {
        await updateStage('Won', { closed_by: data.closed_by, advance_paid: false });
        toast.success('Lead marked as Won. Waiting for advance payment.');
      }
      refetchLead();
      setIsWonModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error converting lead');
    } finally {
      setSubmitting(false);
    }
  };

  const onMeetingSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        lead_id: id,
        team_id: lead.team_id,
        services_discussed: data.services_discussed ? data.services_discussed.split(',').map(s => s.trim()) : [],
        quotation_amount: Number(data.quotation_amount) || 0,
        negotiated_amount: Number(data.negotiated_amount) || 0
      };
      
      const { error } = await supabase.from('sfms_meetings').insert([payload]);
      if (error) throw error;
      
      // Update interest level
      await supabase.from('sfms_leads').update({ interest_level: data.outcome }).eq('id', id);
      
      // Auto move stage if it was scheduled
      if (lead.stage === 'Meeting Scheduled') {
        await updateStage('Meeting Completed');
      }

      toast.success('Meeting added successfully');
      refetchMeetings();
      refetchLead();
      setIsMeetingModalOpen(false);
      resetMeeting();
    } catch (err) {
      console.error(err);
      toast.error('Error adding meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const updateInterestLevel = async (level) => {
    try {
      await supabase.from('sfms_leads').update({ interest_level: level }).eq('id', id);
      toast.success('Interest level updated');
      refetchLead();
    } catch (err) {
      toast.error('Failed to update interest');
    }
  };

  const leadMeetings = useMemo(() => meetings.filter(m => m.lead_id === id).sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date)), [meetings, id]);
  const leadTimeline = useMemo(() => timeline.filter(t => t.lead_id === id).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at)), [timeline, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-neutral-600">Lead not found</p>
        <Button onClick={() => navigate('/sfms/leads')}>Back to Leads</Button>
      </div>
    );
  }

  const teamName = teams.find(t => t.id === lead.team_id)?.name || 'Unassigned';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/sfms/leads')}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">{lead.company_name}</h1>
          <p className="text-sm text-neutral-500">{`${lead.industry} • Expected Revenue: ${formatCurrency(lead.expected_revenue)}`}</p>
        </div>
      </div>

      {/* Pipeline Stepper */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 overflow-x-auto pb-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = STAGES.indexOf(lead.stage) >= idx;
            const isCurrent = lead.stage === stage;
            const isLost = lead.stage === 'Lost';
            
            let colorClass = 'text-neutral-400 bg-neutral-100';
            if (isCurrent) {
              colorClass = isLost ? 'text-white bg-rose-500' : 'text-white bg-primary-600';
            } else if (isCompleted && !isLost) {
              colorClass = 'text-primary-700 bg-primary-100 border-primary-200 border';
            }

            return (
              <div key={stage} className="flex items-center gap-2">
                <div className={`flex h-8 px-3 items-center justify-center rounded-full text-xs font-bold transition-all ${colorClass}`}>
                  {stage}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`h-1 w-8 rounded-full ${isCompleted && !isLost ? 'bg-primary-500' : 'bg-neutral-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          {lead.stage !== 'Won' && lead.stage !== 'Lost' && (
            <>
              <Button variant="outline" tone="danger" onClick={() => handleStageChange('Lost')}>Mark as Lost</Button>
              <Button onClick={() => handleStageChange(STAGES[currentStageIndex + 1])}>
                Move to {STAGES[currentStageIndex + 1]}
              </Button>
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Details */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-400 tracking-wider mb-3">CONTACT INFO</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-neutral-900">{lead.contact_person}</div>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <PhoneIcon className="h-4 w-4" /> <span>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <EnvelopeIcon className="h-4 w-4" /> <span>{lead.email}</span>
                  </div>
                )}
                {lead.address && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <MapPinIcon className="h-4 w-4" /> <span>{lead.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-6">
              <h3 className="text-sm font-bold text-neutral-400 tracking-wider mb-3">LEAD DETAILS</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Source</span>
                  <span className="font-medium text-neutral-900">{lead.lead_source || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Team</span>
                  <span className="font-medium text-neutral-900">{teamName}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-neutral-500">Interest</span>
                  <select 
                    value={lead.interest_level}
                    onChange={(e) => updateInterestLevel(e.target.value)}
                    className="text-xs rounded-md border-neutral-200 py-1 pl-2 pr-6"
                  >
                    <option value="Very Interested">Very Interested</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-6">
              <h3 className="text-sm font-bold text-neutral-400 tracking-wider mb-3">SERVICES</h3>
              <div className="flex flex-wrap gap-2">
                {(lead.services_interested || []).map(s => (
                  <Badge key={s} tone="neutral">{s}</Badge>
                ))}
              </div>
            </div>
            
            {lead.notes && (
              <div className="border-t border-neutral-100 pt-6">
                <h3 className="text-sm font-bold text-neutral-400 tracking-wider mb-3">NOTES</h3>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
            
            {lead.stage === 'Lost' && (
              <div className="border-t border-neutral-100 pt-6">
                <Badge tone="danger" className="w-full justify-center">Lost Reason: {lead.lost_reason}</Badge>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Meetings & Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Meetings */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h3 className="text-lg font-bold text-neutral-900">Meetings</h3>
              <Button size="sm" onClick={() => { resetMeeting({ meeting_date: new Date().toISOString().split('T')[0] }); setIsMeetingModalOpen(true); }}>
                <PlusIcon className="h-4 w-4 mr-2" /> Add Meeting
              </Button>
            </div>
            <div className="divide-y divide-neutral-100">
              {leadMeetings.map(m => (
                <div key={m.id} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-neutral-900 text-base">{new Date(m.meeting_date).toLocaleDateString()} {m.meeting_time ? `at ${m.meeting_time}` : ''}</div>
                    <Badge tone={m.outcome === 'Very Interested' ? 'success' : m.outcome === 'Interested' ? 'accent' : 'neutral'}>
                      {m.outcome}
                    </Badge>
                  </div>
                  <div className="text-sm text-neutral-600 mb-3">
                    Met with <strong>{m.person_met}</strong> ({m.designation})
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg text-sm text-neutral-700 whitespace-pre-wrap mb-3 border border-neutral-100">
                    {m.discussion_summary}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex gap-1.5"><span className="font-medium text-neutral-500">Quoted:</span> <span className="font-bold text-neutral-900">{formatCurrency(m.quotation_amount)}</span></div>
                    <div className="flex gap-1.5"><span className="font-medium text-neutral-500">Negotiated:</span> <span className="font-bold text-neutral-900">{formatCurrency(m.negotiated_amount)}</span></div>
                    {m.follow_up_date && (
                      <div className="flex gap-1.5"><span className="font-medium text-neutral-500">Follow Up:</span> <span className="font-bold text-primary-600">{new Date(m.follow_up_date).toLocaleDateString()}</span></div>
                    )}
                  </div>
                </div>
              ))}
              {leadMeetings.length === 0 && (
                <div className="p-8 text-center text-neutral-400">No meetings logged yet</div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Stage Timeline</h3>
            <div className="relative border-l-2 border-neutral-200 ml-3 space-y-6">
              {leadTimeline.map((item, idx) => (
                <div key={item.id} className="relative pl-6">
                  <span className="absolute -left-2.5 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-primary-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  </span>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-neutral-900 text-sm">{item.stage}</span>
                  </div>
                  <div className="text-xs text-neutral-500 font-medium">
                    {new Date(item.changed_at).toLocaleString()} by {item.changed_by}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Lost Modal */}
      <Modal open={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} title="Mark Lead as Lost">
        <form onSubmit={handleLostSubmit(onLostSubmit)} className="space-y-4">
          <Select
            label="Reason for Loss"
            options={[
              { value: '', label: 'Select reason...' },
              ...LOST_REASONS.map(r => ({ value: r, label: r }))
            ]}
            {...registerLost('reason', { required: 'Please select a reason' })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsLostModalOpen(false)}>Cancel</Button>
            <Button type="submit" tone="danger" loading={submitting}>Confirm Loss</Button>
          </div>
        </form>
      </Modal>

      {/* Won Modal */}
      <Modal open={isWonModalOpen} onClose={() => setIsWonModalOpen(false)} title="Lead Won - Convert to Client">
        <form onSubmit={handleWonSubmit(onWonSubmit)} className="space-y-4">
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-medium mb-4">
            Congratulations on winning this deal! Please fill in the details to generate commissions and finance records.
          </div>
          
          <Select
            label="Has the client paid advance?"
            options={[
              { value: 'yes', label: 'Yes, 50% or more advance received' },
              { value: 'no', label: 'No, advance pending' }
            ]}
            {...registerWon('advance_paid', { required: true })}
          />
          
          <Select
            label="Closed By"
            options={[
              { value: 'Team', label: 'Closed by Team (Agent commission)' },
              { value: 'Founder', label: 'Closed by Founder (Special commission)' }
            ]}
            {...registerWon('closed_by', { required: true })}
          />

          <Input
            label="Total Project Value (₹)"
            type="number"
            {...registerWon('project_value', { required: true })}
            defaultValue={lead.expected_revenue}
          />
          
          <Input
            label="Advance Received (₹)"
            type="number"
            {...registerWon('advance_received', { required: true })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsWonModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Convert Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Meeting Modal */}
      <Modal open={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} title="Log Meeting" className="max-w-2xl">
        <form onSubmit={handleMeetingSubmit(onMeetingSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" {...registerMeeting('meeting_date', { required: true })} />
            <Input label="Time" type="time" {...registerMeeting('meeting_time')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Person Met" {...registerMeeting('person_met', { required: true })} />
            <Input label="Designation" {...registerMeeting('designation')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" {...registerMeeting('phone')} defaultValue={lead.phone} />
            <Input label="Email" type="email" {...registerMeeting('email')} defaultValue={lead.email} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Discussion Summary</label>
            <textarea
              className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              rows={3}
              {...registerMeeting('discussion_summary')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Quotation Amount (₹)" type="number" {...registerMeeting('quotation_amount')} />
            <Input label="Negotiated Amount (₹)" type="number" {...registerMeeting('negotiated_amount')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Outcome / Interest"
              options={[
                { value: 'Very Interested', label: 'Very Interested' },
                { value: 'Interested', label: 'Interested' },
                { value: 'Not Interested', label: 'Not Interested' }
              ]}
              {...registerMeeting('outcome', { required: true })}
            />
            <Input label="Follow-Up Date" type="date" {...registerMeeting('follow_up_date')} />
          </div>

          <Input label="Services Discussed (comma separated)" placeholder="e.g. CRM, ERP" {...registerMeeting('services_discussed')} />

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsMeetingModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Meeting</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
