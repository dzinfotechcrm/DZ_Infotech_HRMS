import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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

const SERVICES_LIST = [
  'Static Website', 'Dynamic Website', 'Ecommerce Website', 
  'CRM', 'ERP', 'AI Chatbot', 'AI Automation', 'ConTrack'
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

export default function Leads() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const { items: leads, loading: leadsLoading, refetch: refetchLeads } = useSupabaseCollection('sfmsLeads');
  const { items: teams, loading: teamsLoading } = useSupabaseCollection('sfmsTeams');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  
  const selectedServices = watch('services_interested') || [];

  const handleToggleService = (service) => {
    if (selectedServices.includes(service)) {
      setValue('services_interested', selectedServices.filter(s => s !== service));
    } else {
      setValue('services_interested', [...selectedServices, service]);
    }
  };

  const loading = leadsLoading || teamsLoading;

  const handleOpenModal = () => {
    reset({ 
      company_name: '', contact_person: '', phone: '', email: '', 
      address: '', industry: '', lead_source: '', expected_revenue: '', 
      team_id: '', services_interested: [], notes: '' 
    });
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
        team_id: data.team_id || null,
        expected_revenue: Number(data.expected_revenue) || 0
      };
      
      const { data: newLead, error } = await supabase.from('sfms_leads').insert([payload]).select().single();
      if (error) throw error;
      
      // Log timeline
      await supabase.from('sfms_lead_timeline').insert([{
        lead_id: newLead.id,
        stage: 'Assigned',
        changed_by: 'System'
      }]);

      toast.success('Lead created successfully');
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
    if (loading) return [];
    let result = leads;

    if (stageFilter) {
      result = result.filter(l => l.stage === stageFilter);
    }

    if (teamFilter) {
      result = result.filter(l => l.team_id === teamFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(l => 
        (l.company_name && l.company_name.toLowerCase().includes(lower)) ||
        (l.contact_person && l.contact_person.toLowerCase().includes(lower)) ||
        (l.phone && l.phone.includes(lower))
      );
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [leads, stageFilter, teamFilter, searchTerm, loading]);

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
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">{`Leads (${filteredLeads.length})`}</h1>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Lead</span>
        </Button>
      </div>

      <Card className="p-4 space-y-4 mb-6">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-10"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All Teams</option>
            {teamOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setSearchTerm(''); setStageFilter(''); setTeamFilter(''); }}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-500">
                <th className="px-4 py-3 font-medium">COMPANY</th>
                <th className="px-4 py-3 font-medium">CONTACT</th>
                <th className="px-4 py-3 font-medium">TEAM</th>
                <th className="px-4 py-3 font-medium">SERVICES</th>
                <th className="px-4 py-3 font-medium">STAGE</th>
                <th className="px-4 py-3 font-medium">INTEREST</th>
                <th className="px-4 py-3 font-medium text-right">EXPECTED REV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredLeads.map(lead => {
                const team = teams.find(t => t.id === lead.team_id);
                return (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-neutral-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/sfms/leads/${lead.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{lead.company_name}</div>
                      <div className="text-xs text-neutral-500">{lead.industry} • {lead.lead_source}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{lead.contact_person}</div>
                      <div className="text-xs text-neutral-500">{lead.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{team?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(lead.services_interested || []).slice(0, 2).map((s, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                            {s}
                          </span>
                        ))}
                        {(lead.services_interested || []).length > 2 && (
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                            +{(lead.services_interested.length - 2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={getStageTone(lead.stage)}>{lead.stage}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={getInterestTone(lead.interest_level)}>{lead.interest_level}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-neutral-900">
                      {formatCurrency(lead.expected_revenue)}
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={isModalOpen} onClose={handleCloseModal} title="New Lead" className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              {...register('company_name', { required: 'Company is required' })}
              error={errors.company_name?.message}
            />
            <Input
              label="Contact Person"
              {...register('contact_person')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              {...register('phone')}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
            />
          </div>

          <Input
            label="Address"
            {...register('address')}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Industry"
              {...register('industry')}
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
              {...register('lead_source')}
            />
            <Input
              label="Expected Rev (₹)"
              type="number"
              {...register('expected_revenue')}
            />
          </div>

          <Select
            label="Assign Team"
            options={[{ value: '', label: 'Select team...' }, ...teamOptions]}
            {...register('team_id')}
          />

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
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      isSelected 
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
            <Button type="submit" loading={submitting}>Create Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
